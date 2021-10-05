import { Injectable } from '@angular/core';
import { KeyLegend } from '@interTypes/keyLegend';
import { BehaviorSubject, Observable } from 'rxjs';
import { ThemeService } from './theme.service';
import {Helper} from '../../classes';

@Injectable({
  providedIn: 'root'
})
export class MapLegendsService {
  public keyLegends: BehaviorSubject<Partial<KeyLegend[]>> = new BehaviorSubject<Partial<KeyLegend[]>>([]);
  public placeAreaLegends: BehaviorSubject<Partial<KeyLegend[]>> = new BehaviorSubject<Partial<KeyLegend[]>>([]);

  private inventoryGroups = [];
  private inventoryGroupsResult;
  private themeSettings;
  private inventoryGroupsPlaces = [];

  constructor(private theme: ThemeService) { 

    this.themeSettings = this.theme.getThemeSettings();
    if (this.themeSettings) {
      this.inventoryGroupsResult = this.themeSettings.customize.media_types;
      // TODO: As of now just removed the Place Based category from the media types. But need to handle in feature.
      if (this.inventoryGroupsResult) {
        this.inventoryGroupsPlaces = this.inventoryGroupsResult.filter(place => place['displayName'] === 'Place Based');
      }

      const nameArray = [];
      for (const groupIndex in this.inventoryGroupsResult) {
        if (this.inventoryGroupsResult[groupIndex]['displayName']) {
          const displayName = this.inventoryGroupsResult[groupIndex]['displayName'];
          nameArray.push(displayName);
          this.inventoryGroups[groupIndex] = this.inventoryGroupsResult[groupIndex];
          
          if (this.inventoryGroupsResult[groupIndex]['mtidPrint'].length <= 0) {
            this.inventoryGroups[groupIndex]['mtidPrint'] = ['null1' + groupIndex];
          }
         
          if (this.inventoryGroupsResult[groupIndex]['mtidDigital'].length <= 0) {
            this.inventoryGroups[groupIndex]['mtidDigital'] = ['null' + groupIndex];
          }
        }
      }
    }
  }
  /**
   * pushKeyLegends This method using to push the key legends from other components.
   * @param legend It will contain the data of legend need to push. Must be in KeyLegend format
   */
  public pushKeyLegends(legend: KeyLegend[], key: string, type = 'primary') {
    const keys = this.keyLegends.getValue();
    if (keys[type] === undefined) {
      keys[type] = {};
    }
    keys[type][key] = legend;
    this.keyLegends.next(keys);
  }
  public clearKeyLegend(keys: any, type = 'primary') {
    const keyLegends = this.keyLegends.getValue();
    if (keyLegends[type] !== undefined) {
      keys.forEach(key => {
        delete keyLegends[type][key];
      });
    }
    this.keyLegends.next(keyLegends);
  }
  public keyLegendsSubscriber(): Observable<any> {
    return this.keyLegends.asObservable();
  }

  /**
   * pushKeyLegends This method using to push the key legends from other components.
   * @param legend It will contain the data of legend need to push. Must be in KeyLegend format
   */
  public pushAreaLegends(legend: KeyLegend[], key: string ) {
    const keys = this.placeAreaLegends.getValue();
    keys[key] = legend;
    this.placeAreaLegends.next(keys);
  }
  public clearAreaLegends(keys: any ) {
    const placeAreaLegends = this.placeAreaLegends.getValue();
    keys.forEach(key => {
      delete placeAreaLegends[key];
    });
    this.placeAreaLegends.next(placeAreaLegends);
  }
  public placeAreaLegendsSubscriber(): Observable<any> {
    return this.placeAreaLegends.asObservable();
  }

  public generateKeyLegends(map, layerSession, mapStyle, zoomLevel, type) {
    let relatedFeatures;
    const inventoriesMarkers = [];
    const inventoryGroups = Helper.deepClone(this.inventoryGroups);
    const inventoryGroupsPlaces = Helper.deepClone(this.inventoryGroupsPlaces)
    const themeSettings = this.theme.getThemeSettings();
    this.clearKeyLegend(['inventoriesMarkers', 'customLayerMarkers', 'placesMarkers'], type);
    const layers = [
      'frames_panel'
    ];
    if (map.getLayer('places') && map.getLayoutProperty('places', 'visibility') === 'visible') {
      const poiFeatures = map.queryRenderedFeatures({ layers: ['places'] });
      const placeIcon = { 'displayName': 'Place-Based', 'icons': [] };
      if (poiFeatures && poiFeatures.length > 0) {
        placeIcon['icons'].push({
          color: inventoryGroupsPlaces[0]['colors'][mapStyle],
          font: 'place',
          type: 'icon'
        });
      }
      if (map.getLayer('framesLayer')) {
        const poiFFeatures = map.queryRenderedFeatures({ layers: ['framesLayer'] });
        if (poiFFeatures && poiFFeatures.length > 0) {
          placeIcon['icons'].push({
            color: inventoryGroupsPlaces[0]['colors'][mapStyle],
            font: inventoryGroupsPlaces[0]['print']['font'],
            type: 'icon'
          });
        }
      }
      if (placeIcon['icons'].length > 0) {
        inventoriesMarkers.push(placeIcon);
      }
    }
    // For now Hide inventory legend
    /*
    if (zoomLevel < 7 && type === 'primary') {
      const tempKey = { 'displayName': 'Spot', 'icons': [] };
      tempKey['icons'].push({
        color: themeSettings['color_sets']['secondary']['base'],
        font: 'icon-circle',
        type: 'icon'
      });
      inventoriesMarkers.push(tempKey);
    }
    if (zoomLevel >= 7 && type === 'primary') {
      relatedFeatures = map.queryRenderedFeatures({
        layers
      });
      // gettting mtid from features
      let media_types = relatedFeatures.map(feature => feature.properties.mtid);
      // Removing duplicates from media type id
      media_types = Array.from(new Set(media_types));
      for (const group in inventoryGroups) {
        if (inventoryGroups.hasOwnProperty(group)) {
          const groupData = JSON.parse(JSON.stringify(inventoryGroups[group]));
          const mtidPrintRes = media_types.filter(type => groupData.mtidPrint.indexOf(type) !== -1);
          const mtidDigitalRes = media_types.filter(type => groupData.mtidDigital.indexOf(type) !== -1);
          if (mtidPrintRes.length > 0 || mtidDigitalRes.length > 0) {
            const inventoryLegend = { 'displayName': groupData['displayName'], 'icons': [] };
            if (zoomLevel < 11) {
              if (mtidPrintRes.length > 0 || mtidDigitalRes.length > 0) {
                inventoryLegend['icons'].push({
                  color: groupData['colors'][mapStyle],
                  font: 'icon-circle',
                  type: 'icon'
                });
              }
            } else {
              if (mtidPrintRes.length > 0) {
                inventoryLegend['icons'].push({
                  color: groupData['colors'][mapStyle],
                  font: groupData['print']['font'],
                  type: 'icon'
                });
              }
              if (mtidDigitalRes.length > 0) {
                inventoryLegend['icons'].push({
                  color: groupData['colors'][mapStyle],
                  font: groupData['digital']['font'],
                  type: 'icon'
                });
              }
            }
            if (inventoryLegend['icons'].length > 0) {
              inventoriesMarkers.push(inventoryLegend);
            }
          }
        }
      }
    }
    */
    if (map.getLayer('pointOfInterests')) {
      const pointOfInterests = map.queryRenderedFeatures({ layers: ['pointOfInterests'] });
      if (pointOfInterests && pointOfInterests.length > 0) {
        const poiIcon = { 'displayName': 'SAVED PLACE', 'icons': [] };
        poiIcon['icons'].push({
          color: themeSettings['color_sets']['primary']['base'],
          font: 'icon-android-radio-button-on',
          type: 'icon'
        });
        inventoriesMarkers.push(poiIcon);
      }
    }
    if (inventoriesMarkers.length > 0) {
      this.pushKeyLegends(inventoriesMarkers, 'inventoriesMarkers', type);
    }

    // Pushing Key Legends of Custom Layer and Display Views.

    // const layerSession = this.layersService.getlayersSession();
    if (layerSession && layerSession.selectedLayers) {
      const viewLayerkeyLegends = [];
      layerSession.selectedLayers.map(layer => {
        const viewLegend = { 'displayName': '', 'icons': [] };
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
          case 'geopathId':
            viewLegend['displayName'] = 'Geopath Spot ID ' + layer.id;
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
        this.pushKeyLegends(viewLayerkeyLegends, 'customLayerMarkers', type);
      }
    }
  }
}
