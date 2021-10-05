import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {environment} from '../../../environments/environment';
import { MapLegendsService } from '@shared/services/map-legends.service';
import { ThemeService } from '@shared/services/theme.service';

@Injectable()
export class PlacesDataService {

  private sortables = [
    {name: 'Total Imp', value: 'totwi'},
    {name: 'Target Imp', value: 'tgtwi'},
    {name: 'Target Comp %', value: 'cwi'}
  ];
  private placeCategoryOptions = new BehaviorSubject([]);
  private arrowPostion = new Subject();
  private mapLoadedEvent = new Subject();
  private selectedCategoryName = new BehaviorSubject('');
  private selectedPlaceSetName = new BehaviorSubject('');
  public keyCodes = {
    ENTER: 13,
    LEFTARROW: 37,
    UPARROW: 38,
    DOWNARROW: 40
  };

  private POIPlaces = [];
  private POILocations = [];
  mapStyle: any;
  mapAccessTkn: any;
  constructor(
    private mapLegends: MapLegendsService,
    private theme: ThemeService
  ) {
    const userData = JSON.parse(localStorage.getItem('user_data'));
    if (userData) {
      this.mapAccessTkn = userData['layers']['key'];
    }
  }

  public getSortables() {
    return this.sortables;
  }

  // To get Category filter data
  public getPlacesCategory(): Observable<any> {
    return this.placeCategoryOptions.asObservable();
  }

  // To set Category filter data
  public setPlacesCategory(Category) {
    this.placeCategoryOptions.next(Category);
  }

  // To set selected Places name
  public setSelectedCategoryName(CategoryName) {
    this.selectedCategoryName.next(CategoryName);
  }

  // To get selected Places
  public getSelectedCategoryName(): Observable<any> {
    return this.selectedCategoryName.asObservable();
  }

  // To set selected Places name
  public setSelectedPlaceSetName(PlaceSetName) {
    this.selectedPlaceSetName.next(PlaceSetName);
  }

  // To get selected Places
  public getSelectedPlaceSetName(): Observable<any> {
    return this.selectedPlaceSetName.asObservable();
  }

  /**
   * This is the function to get the hightlighted position while navigating filters using arrow keys
   */
  public getHighlightedPosition(): Observable<any> {
    return this.arrowPostion.asObservable();
  }

  /**
   * This is the function to set the hightlighted position while navigating filters using arrow keys
   */
  public setHighlightedPosition(position) {
    this.arrowPostion.next(position);
  }

  public setPOIPlacesData(places) {
    this.POIPlaces = places;
  }
  public getPOIPlacesData() {
    return this.POIPlaces;
  }

  public setPOILocationData(places) {
    this.POILocations = places;
  }
  public getPOILocationData() {
    return this.POILocations;
  }

  /**
   * This method is to get the static map image along with polygon
   * @param featuresCollection polygon data
   * @param coOrds place coordinates(lat & lng)
   * @param width width of the response image
   * @param height height of the response image
   * @param themeSettings
   */
  public getStaticMapImage(featuresCollection, coOrds, width, height, themeSettings) {
    // Getting map style data from themesettings
    let mapStyle = '';
    if (themeSettings['basemaps']) {
      let map = themeSettings.basemaps.find(mapObj => mapObj.label === 'satellite');
      if (!map) {
        map = themeSettings.basemaps.find(mapObj => mapObj.label === 'light');
      }
      mapStyle = map.uri.split('/').pop();
    } else {
      mapStyle = 'cjo8btwwg03882spkvkdmz4la';
    }
    const polygon = encodeURIComponent(JSON.stringify(featuresCollection));
    return 'https://api.mapbox.com/styles/v1/intermx/'+mapStyle+'/static/' + 'geojson(' + polygon + ')' + '/' +
      coOrds[0] + ',' + coOrds[1] + ',15.0,0,0/' + width + 'x' + height + '?access_token=' + this.mapAccessTkn;
  }


  public onMapLoad(): Observable<any> {
    return this.mapLoadedEvent.asObservable();
  }

  public mapLoaded(isLoaded: boolean): void {
    this.mapLoadedEvent.next(isLoaded);
  }

  generateKeyLegends(map, layerSession, mapStyle, zoomLevel) {
    const themeSettings = this.theme.getThemeSettings();
    const placesMarkers = [];
    this.mapLegends.clearKeyLegend(['inventoriesMarkers', 'customLayerMarkers', 'placesMarkers']);
    let relatedFeatures;
    const layers = [
      'poiPointHash5Layer',
      'poiPointHash6Layer'
    ];
    const tempKey = {'displayName' : 'Places Unit', 'icons': [] };
    tempKey['icons'].push({
      color: themeSettings['color_sets']['primary']['base'],
      font: 'icon-circle',
      type: 'icon'
    });
    if (zoomLevel < 6) {
      placesMarkers.push(tempKey);
    } else {
      if (map.getLayer(layers[0]) && map.getLayer(layers[1])) {
        relatedFeatures = map.queryRenderedFeatures({
          ...layers
        });
        if (relatedFeatures.length > 0) {
          placesMarkers.push(tempKey);
        }
      }
      if (map.getLayer('poiPointLayer')) {
        const poiFeatures = map.queryRenderedFeatures({layers: ['poiPointLayer']});
        if (poiFeatures && poiFeatures.length > 0) {
          const tempKey = {'displayName' : 'Place Points', 'icons': [] };
          tempKey['icons'].push({
            color: themeSettings['color_sets']['primary']['base'],
            font: 'icon-circle',
            type: 'icon'
          });
          placesMarkers.push(tempKey);
        }
      }
    }
    if (placesMarkers.length > 0) {
      this.mapLegends.pushKeyLegends(placesMarkers, 'placesMarkers');
    }
    if (layerSession && layerSession.selectedLayers) {
      const viewLayerkeyLegends = [];
      layerSession.selectedLayers.map(layer => {
        const viewLegend = {'displayName' : '', 'icons': [] };
        // const iconType = layer.icon && layer.icon || (layer.type === 'place collection' && 'place' || 'lens');
        // const font = iconType === 'place' ? 'map-marker' : (iconType !== 'lens' ? 'android-radio-button-on' : 'circle');
        const font = layer.icon;
        switch (layer.type) {
          case 'place':
            viewLegend['displayName'] = layer['data']['properties']['location_name'];
            viewLegend['icons'].push({
              color: layer.color && layer.color
              || themeSettings['color_sets']['primary']
              && themeSettings['color_sets']['primary']['base'],
              font: font,
              type: 'icon'
            });
            viewLayerkeyLegends.push(viewLegend);
            break;
          case  'geopathId':
            viewLegend['displayName'] = 'Geopath ID ' + layer.id;
            const color = layer.color || themeSettings['color_sets']['primary']['base'];
            viewLegend['icons'].push({
              color: color,
              font: font,
              type: 'icon'
            });
            viewLayerkeyLegends.push(viewLegend);
            break;
          default:
            viewLegend['displayName'] = layer['data']['name'];
            viewLegend['icons'].push({
              color: layer.color && layer.color
              || themeSettings['color_sets']['primary']
              && themeSettings['color_sets']['primary']['base'],
              font: font,
              type: 'icon'
            });
            viewLayerkeyLegends.push(viewLegend);
            break;
        }
      });
      if (viewLayerkeyLegends.length > 0) {
        this.mapLegends.pushKeyLegends(viewLayerkeyLegends, 'customLayerMarkers');
      }
    }
  }

}
