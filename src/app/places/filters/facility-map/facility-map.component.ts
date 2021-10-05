import { Component, OnInit, Input, Output, EventEmitter,
   ChangeDetectionStrategy, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from './../../../../environments/environment.prod';
import { CommonService, ThemeService, MapService, MapLegendsService } from '@shared/services';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from './../../../Interfaces/workspaceV2';
import { Polygon, AreaType, SearchPlaceRequest } from '@interTypes/Place-audit-types';
import turfUnion from '@turf/union';
import turfCenter from '@turf/center';
import { PlacesFiltersService } from '../places-filters.service';
import { takeUntil, skip } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { KeyLegend } from '@interTypes/keyLegend';
@Component({
  selector: 'app-facility-map',
  templateUrl: './facility-map.component.html',
  styleUrls: ['./facility-map.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FacilityMapComponent implements OnInit, OnChanges, OnDestroy {
  map: mapboxgl.Map;
  marker: mapboxgl.Marker;
  mapCenter: any = [-98.5, 39.8];
  themeSettings: any;
  featuresCollection: any;
  public buidlingAreaCollection = { 'type': 'FeatureCollection', 'features': [] };
  draw: MapboxDraw;
  @Input() polygonFeature: Polygon;
  @Input() facilityAreaType: AreaType;
  @Input() placePosition;
  @Input() enableEditPolygon = true;
  @Input() zoom = 3;
  @Input() buildingAreaFeature: Polygon;
  @Output() updatePolygonInfo: EventEmitter<any> = new EventEmitter();
  @Output() closeFacilityMap: EventEmitter<any> = new EventEmitter();
  @Output() updatePlacePosition: EventEmitter<any> = new EventEmitter();
  @Input() openFacilityArea;
  @Input() place: any;
  @Input() clientId: Number;
  private unSubscribe: Subject<void> = new Subject<void>();
  private placesSearchAPICall: any = null;
  public isCollapseDrawMap = false;
  private layerNames: Array<string> = [];
  public showPlaceMapLegends = false;
  private isPolygonEdited = false;
  private isPolygonSaved = false;

  @Input() newPlaceData;
  @Input() public createNewPlace = false;

  constructor(
    private commonService: CommonService,
    private themeService: ThemeService,
    public dialog: MatDialog,
    private mapService: MapService,
    private placeFiltersService: PlacesFiltersService,
    private cdRef: ChangeDetectorRef,
    private mapLegendsService: MapLegendsService
    ) { }

  ngOnInit() {
    const userData = JSON.parse(localStorage.getItem('user_data'));
    this.themeSettings = this.themeService.getThemeSettings();
    if (userData && typeof userData['layers'] !== 'undefined') {
      if (typeof userData['layers']['center'] !== 'undefined') {
        this.mapCenter = userData['layers']['center'];
      }
    }
    this.placeFiltersService.getPlaceCoords().pipe(takeUntil(this.unSubscribe)).subscribe(coords => {
      this.placePosition = coords;
      this.setMarkerPosition();
    });
    this.initializeMap();
    setTimeout(() => {
      this.placeFiltersService.setNewColumnOpened(true);
    }, 500);

    this.listenPropertyAndBuildingAreaLayersToggleStates();

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.openFacilityArea && changes.openFacilityArea.currentValue !== 'undefined') {
      this.isCollapseDrawMap = false;
    }
    if (changes.facilityAreaType && changes.facilityAreaType.currentValue) {
      this.isPolygonSaved = false;
      this.isPolygonEdited = false;
      this.facilityAreaType = changes.facilityAreaType.currentValue;
      if (this.map && this.map.getSource('polygonData')) {
        this.buidlingAreaCollection.features = [];
        this.map.getSource('polygonData').setData(this.buidlingAreaCollection);
      }
    }
    this.showPlaceMapLegends = false;
    if (this.map && this.draw) {
      this.setMapData();
    }
    if (changes.buildingAreaFeature && changes.buildingAreaFeature.currentValue) {
      if (this.facilityAreaType === 'property' && this.buildingAreaFeature['type']) {
        this.buidlingAreaCollection.features = [];
        this.buidlingAreaCollection.features.push({
          type: 'Feature',
          geometry: {
            'type': this.buildingAreaFeature.type,
            'coordinates': this.buildingAreaFeature.coordinates
          },
          properties: {
            fill: this.themeSettings['color_sets'] && this.themeSettings.color_sets.secondary.base,
            stroke: this.themeSettings['color_sets'] && this.themeSettings.color_sets.primary.base
          }
        });

          if (!this.map.getSource('polygonData')) {
              this.mapService.createPolygonLayers(this.map, this.buidlingAreaCollection,
                '#2196F3', this.place);
          } else {
            this.map.getSource('polygonData').setData(this.buidlingAreaCollection);
          }

      }
    }
  }
  initializeMap() {
    mapboxgl.accessToken = environment.mapbox.access_token;
    this.map = new mapboxgl.Map({
      container: 'facilityMap',
      style: this.themeService.getMapStyleURL('satellite'),
      minZoom: 2,
      maxZoom: 22,
      preserveDrawingBuffer: true,
      center: this.mapCenter,
      zoom: this.zoom, // starting zoom
      interactive: this.enableEditPolygon
    });

    const el = document.createElement('div');
    el.className = 'place-audit-marker icon icon-place';
    this.marker = new mapboxgl.Marker(el);
    this.marker.setDraggable(true);
    this.marker.on('dragend', this.updatePlaceCoordinates.bind(this));
    this.map.on('draw.create', this.updateFeatures.bind(this));


    this.map.on('moveend', (e) => {
      this.removeExistingLayers();
      if (this.placesSearchAPICall != null) {
        this.placesSearchAPICall.unsubscribe();
      }
      const req: SearchPlaceRequest = {
        fieldset: ['building_area', 'property_area'],
        top_right_point: {
          type: 'Point',
          coordinates: this.map.getBounds().getNorthEast().toArray()
        },
        bottom_left_point: {
          type: 'Point',
          coordinates: this.map.getBounds().getSouthWest().toArray()
        },
        page_size: 25
      };
        this.placesSearchAPICall = this.placeFiltersService.getPlacesAreas(req).subscribe(response => {
          if (response && Object.keys(response).length ) {
            this.displayResultsInMap(response);
          }
        });
    });
    this.map.on('load', () => {
      // this.map.addControl(this.draw);
      this.setMapData();
    });
    /**
     * Adding compass controll and title attribute in mapbox
     */
    this.map.addControl(new mapboxgl.NavigationControl({
      showCompass: true,
      showZoom: false
    }));
    document.querySelector('.mapboxgl-ctrl-compass').setAttribute('title', 'Reset to north');

  }

  /**
   * This function is to add features to the map if place polygon data present
   */
  public setMapData() {
    this.featuresCollection = { 'type': 'FeatureCollection', 'features': [] };
    if (this.draw && this.draw.getAll().features.length > 0) {
      this.draw.deleteAll();
    }
    if (this.draw) {
      this.map.removeControl(this.draw);
    }
    this.draw = new MapboxDraw({
      userProperties: true,
      displayControlsDefault: false,
      styles: this.commonService.getStylesData(this.facilityAreaType === 'building' ? '#2196F3' : '#DD6666'),
      keybindings: this.enableEditPolygon,
      touchEnabled: this.enableEditPolygon,
      boxSelect: this.enableEditPolygon,
      controls: {
        polygon: true,
        trash: true
      }
    });
    this.map.addControl(this.draw);
    if (this.polygonFeature && this.polygonFeature.type) {
        this.featuresCollection.features.push({
          type: 'Feature',
          geometry: {
            'type': this.polygonFeature.type,
            'coordinates': this.polygonFeature.coordinates
          },
          properties: {
            areaType: this.facilityAreaType,
            fill: this.themeSettings['color_sets'] && this.themeSettings.color_sets.secondary.base,
            stroke: this.themeSettings['color_sets'] && this.themeSettings.color_sets.primary.base
          }
        });
      this.draw.add(this.featuresCollection);
    }
    if (this.placePosition.length > 0) {
      this.setMarkerPosition();
    } else {
      this.map.setZoom(3);
    }
  }

  private setMarkerPosition() {
    this.map.jumpTo({ center: this.placePosition, zoom: this.zoom });
    this.marker.setLngLat(this.placePosition).addTo(this.map);
  }
  /**
   * This function is to save the edited polygon data
   */
  public saveMapData() {
    this.draw.changeMode('simple_select');
    this.polygonFeature = this.getPolygonData();
    let centerCoordinates = {};
    if (this.polygonFeature && this.polygonFeature['type']) {
      // @ts-ignore
      centerCoordinates = turfCenter(this.polygonFeature);
    }
    this.updatePolygonInfo.emit({
      type: this.facilityAreaType,
      polygonData: this.polygonFeature,
      center: centerCoordinates && centerCoordinates['geometry'] &&
       centerCoordinates['geometry']['coordinates'].length ? centerCoordinates['geometry']['coordinates'] : []
    });
    this.isPolygonSaved = true;
  }

  /**
   * close facility edit map
   */
  public closeFacilityEdit() {
    const data: ConfirmationDialog = {
      notifyMessage: false,
      confirmDesc: '<h4 class="confirm-text-icon">Your changes to the' +
       (this.facilityAreaType === 'building' ? ' building area ' : ' property area ') +
       'will not be saved. Would you like to continue?</h4>',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      headerCloseIcon: false
    };
    if ((this.isPolygonSaved && this.isPolygonEdited) || !this.isPolygonEdited) {
      this.closeFacilityMap.emit({'close': true});
    } else if (this.isPolygonEdited && !this.isPolygonSaved) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: data,
        width: '586px'
      }).afterClosed().subscribe(result => {
        if (result && result.action) {
         this.closeFacilityMap.emit({'close': true});
        }
      });
    }
  }
  /**
   * To get the features drawn in map
   */
  private getPolygonData() {
    const featuresCollection = this.draw.getAll();
    let combinedFeature: any;
    // If features empty returning empty object
    if (featuresCollection.features.length === 0) {
      return {};
    }
     // If only one feature present converting that in to multipolygon
    if (featuresCollection.features.length === 1) {
      if (featuresCollection.features[0]['geometry']['type'] === 'MultiPolygon') {
        return featuresCollection.features[0]['geometry'];
      }
      combinedFeature = {type: 'MultiPolygon', coordinates: []};
      combinedFeature.coordinates.push(featuresCollection.features[0]['geometry']['coordinates']);
      return combinedFeature;
    }
    // If more than one feature present then combining them in to multipolygon
    // @ts-ignore
    combinedFeature = turfUnion(...featuresCollection.features);

    combinedFeature.geometry.coordinates.map((coordinate, index) => {
      if (coordinate.length > 1) {
        combinedFeature.geometry.coordinates[index] = [coordinate];
      }
    });
    return combinedFeature.geometry;
  }

  /**
   * Map zoom out function
   */
  public zoomOutMap() {
    this.map.fitBounds([[-128.94797746113613, 18.917477970597474], [-63.4, 50.0]], {animate: false});
  }

  /**
   * This function is to update the place coordinates
   */
  private updatePlaceCoordinates() {
    const position = this.marker.getLngLat();
    this.updatePlacePosition.emit([position['lng'], position['lat']]);
  }

  // This method will set the property areaType to the feature
  private updateFeatures() {
    const featuresCollection = this.draw.getAll();
    const updatedFeatures = [];
    featuresCollection['features'].forEach(feature => {
      feature.properties['areaType'] = this.facilityAreaType;
      updatedFeatures.push(feature);
    });
    this.draw.deleteAll();
    featuresCollection['features'] = updatedFeatures;
    this.draw.add(featuresCollection);
    this.isPolygonEdited = true;
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
  collapseDrawMap() {
    this.isCollapseDrawMap = !this.isCollapseDrawMap;
  }

  /**
   * This method update the map with search results
   * @param mapData search results
   */
  private displayResultsInMap(mapData) {
    const keys = Object.keys(mapData);
    keys.forEach(key => {
      const featuresCollection = { 'type': 'FeatureCollection', 'features': [] };
      const areaMarkers: KeyLegend[] = [];
      areaMarkers.push({
        displayName: this.getDisplayName(key, mapData),
        icons: [
          {
            color: this.mapService.mapColorsObject[key] ? this.mapService.mapColorsObject[key] :
            this.themeSettings['color_sets'] && this.themeSettings.color_sets.primary.base,
            font: 'icon-circle',
            type: 'icon'
          }
        ],
        type: key
      });
      mapData[key].forEach(place => {
        featuresCollection.features.push({
          type: 'Feature',
          geometry: place.geometry,
          properties: {
            fill: this.mapService.mapColorsObject[key] ? this.mapService.mapColorsObject[key] :
             this.themeSettings['color_sets'] && this.themeSettings.color_sets.secondary.base,
            stroke: this.mapService.mapColorsObject[key] ? this.mapService.mapColorsObject[key] :
            this.themeSettings['color_sets'] && this.themeSettings.color_sets.primary.base,
            place_id: place.place_id,
            placeName: place.name,
            udpPlace: this.place,
            clientId: this.clientId,
          }
        });
      });
      const sourceName = `${key}-${Date.now().toString(36) + Math.random().toString(36).substr(2)}`;
      this.layerNames.push(sourceName);
      this.mapLegendsService.pushAreaLegends(areaMarkers, key);
        this.mapService.createPolygonLayers(this.map, featuresCollection, this.mapService.mapColorsObject[key], sourceName, this.place);
    });
    this.showPlaceMapLegends = keys.length ? true : false;
    this.cdRef.markForCheck();
  }
  // This method will generate the label names for layers to display in key legends
  private getDisplayName(key, mapData) {
    return key === 'property_area' ? `Matched Property Areas (${mapData[key].length})` : `Matched Building Areas (${mapData[key].length})`;
  }
  /**
   * This function will remove the existing placelayers
   */
  private removeExistingLayers() {
    const layerNames = [...this.layerNames];
    this.layerNames = [];
    layerNames.forEach(name => {
      const {polygonLayerName, strokeLayerName, dataSourceName} = this.mapService.getLayerNames(name);
      if (this.map.getLayer(polygonLayerName)) {
        this.map.removeLayer(polygonLayerName);
      }
      if (this.map.getLayer(strokeLayerName)) {
        this.map.removeLayer(strokeLayerName);
      }
      if (this.map.getSource(dataSourceName)) {
        this.map.removeSource(dataSourceName);
      }
    });

  }

  // This method will receive the selection options from key legends component to turn on/off layers
  public toggleAreaLayers(options: KeyLegend[]) {
    if (options && options.length) {
      this.toggleLayers(false, options.map(option => option.type));
    } else {
      this.toggleLayers(true);
    }
  }

  private toggleLayers(clearAll = false, names = []) {
    this.layerNames.forEach(layerName => {
      const {polygonLayerName, strokeLayerName} = this.mapService.getLayerNames(layerName);
      if (this.map.getLayer(polygonLayerName)) {
        if (clearAll) {
          this.map.setLayoutProperty(polygonLayerName, 'visibility', 'none');
          this.map.setLayoutProperty(strokeLayerName, 'visibility', 'none');
          return;
        }
        const index = names.findIndex(name => layerName.includes(name));
        if (index > -1) {
          this.map.setLayoutProperty(polygonLayerName, 'visibility', 'visible');
          this.map.setLayoutProperty(strokeLayerName, 'visibility', 'visible');
        } else {
          this.map.setLayoutProperty(polygonLayerName, 'visibility', 'none');
          this.map.setLayoutProperty(strokeLayerName, 'visibility', 'none');
        }
      }
    });
  }

  /**
   * @description
   *   Listening property and building area layers toggle state
   *  to show and hide their layers.
   */
  private listenPropertyAndBuildingAreaLayersToggleStates() {

    this.placeFiltersService.getPropertyAreaLayerToggleState()
      .pipe(skip(1), takeUntil(this.unSubscribe))
      .subscribe((toggleState: any) => {
        const propertyLayerName = this.layerNames.find(layerName => /^property_area/.test(layerName));
        if (propertyLayerName) {this.toggleLayer(propertyLayerName, toggleState.opened); }
      });

    this.placeFiltersService.getBuildingAreaLayerToggleState()
      .pipe(skip(1), takeUntil(this.unSubscribe))
      .subscribe((toggleState: any) => {
        const buildingLayerName = this.layerNames.find(layerName => /^building_area/.test(layerName));
        if (buildingLayerName) {this.toggleLayer(buildingLayerName, toggleState.opened); }
      });

  }

  /**
   * @description
   *    Toggle map layer
   * @param layerName
   * @param canShow
   */
  private toggleLayer(layerName: string, canShow: boolean) {
    const {polygonLayerName, strokeLayerName} = this.mapService.getLayerNames(layerName);
    this.mapService.toggleLayer(this.map, polygonLayerName, canShow);
    this.mapService.toggleLayer(this.map, strokeLayerName, canShow, false);
  }

}
