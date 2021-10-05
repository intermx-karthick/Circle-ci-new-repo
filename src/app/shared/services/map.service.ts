import { Injectable } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { ThemeService } from './theme.service';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AppConfig } from '../../app-config.service';
import { MapProperties } from '@interTypes/mapProperties';
import { DynamicComponentService } from './dynamic-component.service';
import { LinkPlacesPopupComponent } from './../../places/link-places-popup-component/link-places-popup-component.component';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { PlacesFiltersService } from 'app/places/filters/places-filters.service';
import { MapboxFactory, MapboxFactoryEnum } from '../../classes/mapbox-factory';
import { Helper } from '../../classes';
@Injectable({
  providedIn: 'root'
})
export class MapService {
  public mapColorsObject = {
    building_area: '#2196F3',
    property_area: '#DD6666'
  };
  public isMapSync: boolean = false;
  public isDualMapSyncEnabled: boolean = false;
  public sharedMapProperties: BehaviorSubject<MapProperties> = new BehaviorSubject<MapProperties>({});
  constructor(
    private themeService: ThemeService,
    private http: HttpClient,
    private config: AppConfig,
    private dialog: MatDialog,
    private dynamicComponentService: DynamicComponentService,
    private placeFilterService: PlacesFiltersService,
  ) { }

  public getMapBoundingBox(map: mapboxgl.Map, defaultBounds = false, defaultMapBounds) {
    let lat;
    if (defaultBounds) {
      lat = mapboxgl.LngLatBounds.convert(defaultMapBounds);
    } else {
      lat = map.getBounds();
    }

    const multiPolygon = {
      type: 'MultiPolygon',
      coordinates: [[]]
    };
    const bound = [];
    bound.push(lat.getNorthEast().toArray());
    bound.push(lat.getNorthWest().toArray());
    bound.push(lat.getSouthWest().toArray());
    bound.push(lat.getSouthEast().toArray());
    bound.push(lat.getNorthEast().toArray());
    multiPolygon.coordinates[0].push(bound);
    return multiPolygon;
  }

  private getPopupContent(feature, place) {
    const inventoryInformation = {
      feature: feature,
      place: place,
    };
    const popupContent = this.dynamicComponentService
      .injectComponent(LinkPlacesPopupComponent, x => x.layerInfo = inventoryInformation);
    return popupContent;
  }
  private associatePlace(place_id, udp_place_id) {
    const reqUrl = `${this.config.envSettings['API_ENDPOINT']}locations/places/${place_id}/user-defined/${udp_place_id}`;
    return this.http.post(reqUrl, {});
  }
  private loadFunction(feature) {
    const self = this;
    $('.associate').off().on('click',
      function (e) {
        let udp_place_id;
        let udpPlace = feature[0].properties.udpPlace;
        udpPlace = JSON.parse(udpPlace);
        udpPlace.udp_places.map(udp_place => {
          if (udp_place.client_id === feature[0].properties.clientId) {
            udp_place_id = udp_place.udp_place_id;
          }
        });
        self.associatePlace(feature[0].properties.place_id, udp_place_id).subscribe((response) => {
          if (response['status'] === 'success') {
            const dialog: ConfirmationDialog = {
              notifyMessage: true,
              confirmTitle: 'Success',
              messageText: response['message'],
            };
            self.dialog.open(ConfirmationDialogComponent, {
              data: dialog,
              width: '586px'}).afterClosed().subscribe(result => {
                if (result) {
                  self.placeFilterService.setReloadAuditPlace(result);
                }
              });
          } else {
            const dialog: ConfirmationDialog = {
              notifyMessage: true,
              confirmTitle: 'Error',
              messageText: response['message'],
            };
            self.dialog.open(ConfirmationDialogComponent, {
              data: dialog,
              width: '586px'});
          }
        }, (error: any) => {
          const dialog: ConfirmationDialog = {
            notifyMessage: true,
            confirmTitle: 'Error',
            messageText: error['error']['message'],
          };
          self.dialog.open(ConfirmationDialogComponent, {
            data: dialog,
            width: '586px'
          });
        });
      });
  }

  /**
   * This function is to create polygon layers to display static polygon
   * @param map Map object
   * @param sourceData feature collection
   */
  public createPolygonLayers(map: mapboxgl.Map, sourceData, displayPrimaryColors = '', sourceName = 'polygon', currentPlace= {}) {
    sourceName = Helper.deepClone(sourceName);
    const themeSettings = this.themeService.getThemeSettings();
    const self = this;
    const {polygonLayerName, strokeLayerName, dataSourceName} = this.getLayerNames(sourceName);
    if (!map.getSource(dataSourceName)) {
      map.addSource(dataSourceName, {
        type: 'geojson',
        data: sourceData
      });
    } else {
      map.getSource(dataSourceName).setData(sourceData);
    }
    if (!map.getLayer(polygonLayerName)) {
      map.addLayer({
        id: polygonLayerName,
        type: 'fill',
        source: dataSourceName,
        paint: {
          'fill-opacity': 0.5,
          'fill-color': displayPrimaryColors ? displayPrimaryColors : themeSettings.color_sets.highlight.base
        }
      });
      map.on('click', polygonLayerName, function (e) {
        const bbox = [
          [e.point.x - 5, e.point.y - 5],
          [e.point.x + 5, e.point.y + 5]
        ];
        const features = map.queryRenderedFeatures(bbox, {
          layers: [polygonLayerName]
        });
        const content = self.getPopupContent(features, currentPlace);
        setTimeout(function () {
          const popup = MapboxFactory.produce(MapboxFactoryEnum.POPUP, {})
            .setLngLat(e.lngLat)
            .setHTML(content.innerHTML)
            .addTo(map);
          self.loadFunction(features);
        }, 100);
      });
    }
    if (!map.getLayer(strokeLayerName)) {
      map.addLayer({
        id: strokeLayerName,
        type: 'line',
        source: dataSourceName,
        paint: {
          'line-color': displayPrimaryColors ? displayPrimaryColors : themeSettings.color_sets.highlight.base,
          'line-width': 2
        }
      });
    }
  }

  public getLayerNames(layerName) {
    return {polygonLayerName: `${layerName}Layer`, strokeLayerName: `${layerName}StrokeLayer`, dataSourceName: `${layerName}Data`};
  }

  // These methods will update the map properties to synscronize the movements between dual maps
  public getMapProperties(): Observable<any> {
    return this.sharedMapProperties.asObservable();
  }
  public setMapProperties(properties) {
    this.sharedMapProperties.next(properties);
  }

  /**
   * @description
   *
   *   Toggling map layer
   *
   * @param mapIns - mapbox instance
   * @param layerName - layer name
   * @param canShow - to show the layer
   * @param isLayerValidationReq - if set false no layer validation will be handle direct toggle
   */
  toggleLayer(mapIns: mapboxgl.Map, layerName: string, canShow: boolean, isLayerValidationReq = true) {
    if (!isLayerValidationReq || mapIns.getLayer(layerName)) {
      if (canShow) {
        mapIns.setLayoutProperty(layerName, 'visibility', 'visible');
      } else {
        mapIns.setLayoutProperty(layerName, 'visibility', 'none');
      }
    }
  }

}
