import { BulkExportRequest } from '@interTypes/bulkExport';
import { throwError as observableThrowError, Observable, Subject, EMPTY } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { AuthenticationService } from './authentication.service';
import { LoaderService } from './loader.service';
import { AppConfig } from '../../app-config.service';
import { catchError, publishReplay, refCount } from 'rxjs/operators';
import { ExploreDataService } from './explore-data.service';
import { ThemeService } from './theme.service';
import { GradientColor } from 'app/classes/gradient-color';
import { MapLegendsService } from '@shared/services/map-legends.service';
import { MapLayersInvetoryFields } from '@interTypes/enums';
import {Helper} from '../../classes';
import { Duration } from '@interTypes/workspaceV2'
@Injectable()
export class ExploreService {
  public hideLoaders = new Subject();
  public savedLayes = new Subject();
  public openThresholds = new Subject();
  private duration$: Observable<Duration>;
  constructor(
    private httpClient: HttpClient,
    private auth: AuthenticationService,
    public loader: LoaderService,
    public exploreDataService: ExploreDataService,
    public theme: ThemeService,
    public mapLegendsService: MapLegendsService,
    private config: AppConfig,
    ) {
  }

  getInventorySummary(data, noLoader = false): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    return this.httpClient.post(this.config.envSettings['API_ENDPOINT']
      + 'inventory/summary/', data, { headers: reqHeaders }).pipe(catchError(this.handleError));
  }

  public handleError = (error: Response) => {
    if (error.status === 401) {
      this.auth.logout();
    }
    return observableThrowError(error);
  }
  getInventoryDetailZipDMA(data, noLoader = false): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    let url = this.config.envSettings['API_ENDPOINT'] +
    'inventory/homes?panel_id=' + data['fid'] + '&reporting_level=' + data['replevel'];
    if (data['measures_release']) {
      url = url + '&measures_release=' + data['measures_release'];
    }
    return this.httpClient.get(url, { headers: reqHeaders }).pipe(catchError(this.handleError));
  }

  getmarketSearch(location, noLoader = false): Observable<any> {
    const url = this.config.envSettings['API_ENDPOINT'] + 'markets?q=' + location;
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.httpClient
      .get(url, { headers: reqHeaders })
      .pipe(catchError(this.handleError));
  }
  getmarketGeometry(marketlocation): Observable<any> {
    const url = this.config.envSettings['API_ENDPOINT'] + 'markets/' + marketlocation.type + '/' + marketlocation.id;
    return this.httpClient.get(url).pipe(catchError(this.handleError));
  }
  /**
   *
   * @param layers saved view layers
   */
  saveLayerView(layers): Observable<any> {
    const url = this.config.envSettings['API_ENDPOINT'];
    return this.httpClient.post(this.config.envSettings['API_ENDPOINT'] + 'views/collections/', layers).pipe(catchError(this.handleError));
  }
  updateLayerView(layers, id): Observable<any> {
    const url = this.config.envSettings['API_ENDPOINT'];
    return this.httpClient
      .patch(this.config.envSettings['API_ENDPOINT'] + 'views/collections/' + id, layers)
      .pipe(catchError(this.handleError));
  }
  getLayerViews(type = 'inventory'): Observable<any> {
    const url = this.config.envSettings['API_ENDPOINT'];
    let reqHeaders;
    reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.httpClient
      .get(this.config.envSettings['API_ENDPOINT'] + 'views/collections?type=' + type, { headers: reqHeaders })
      .pipe(catchError(this.handleError));
  }
  /**
   * get saved layer by ID
   * @param id the saved view id
   * @param details the flag to define retrive details or not.
   */
  getLayerView(id, details = false): Observable<any> {
    const url = this.config.envSettings['API_ENDPOINT'];
    let detailParam = '';
    if (details) {
      detailParam = '?details=true';
    }
    let reqHeaders;
    reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.httpClient
      .get(this.config.envSettings['API_ENDPOINT'] + 'views/collections/' + id + detailParam, { headers: reqHeaders })
      .pipe(catchError(this.handleError));
  }
  public getSavedLayers(): Observable<any> {
    return this.savedLayes.asObservable();
  }
  public setSavedLayes(layers) {
    this.savedLayes.next(layers);
  }


  public uploadLogo(id, data, prevoisLocation = '', isSecondaryLogo = false): Observable<any> {
    let imageInfo: any;
    if (data) {
      imageInfo = data;
    }
    if (prevoisLocation) {
      return this.httpClient.patch(this.config.envSettings['API_ENDPOINT'] + 'views/collections/'
        + id + '/logo?key=' + prevoisLocation + '&secondary=' + isSecondaryLogo, imageInfo).pipe(catchError(this.handleError));
    } else {
      return this.httpClient.patch(this.config.envSettings['API_ENDPOINT'] + 'views/collections/'
        + id + '/logo' + '?secondary=' + isSecondaryLogo, imageInfo).pipe(catchError(this.handleError));
    }
  }

  /**
   *
   * @param id delete the saved layer view using id
   */
  deleteLayer(id) {
    return this.httpClient.delete(this.config.envSettings['API_ENDPOINT'] + 'views/collections/' + id);
  }

  // download pdf
  public downloadPdf(data, noLoader = false): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url = this.config.envSettings['API_ENDPOINT'] + 'reports/inventory';
    return this.httpClient.post(url, data, { headers: reqHeaders, observe: 'response', responseType: 'blob' }).pipe(catchError(this.handleError));
  }

  // openThresholds panel
  public getThresholdsPanel(): Observable<any> {
    return this.openThresholds.asObservable();
  }
  public setThresholdsPanel(state) {
    this.openThresholds.next(state);
  }

  /** The below API won't work as database is deprecated.
   * We need to request new API when this functionality is enabled.
  */
  getThresholdHistogram(data, noLoader = false): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    return this.httpClient.post(this.config.envSettings['API_ENDPOINT']
      + 'inventory/histogram/', data, { headers: reqHeaders }).pipe(catchError(this.handleError));
  }

  public inventoriesBulkExport(data: BulkExportRequest, noLoader = false) {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url = this.config.envSettings['API_ENDPOINT'] + 'reports/inventory';
    return this.httpClient.post(url, data, { observe: 'response', responseType: 'blob', headers: reqHeaders })
      .pipe(catchError(this.handleError));
  }

  /**
  * getInventoryFilters function to get the data from inventory/filters.
  * @param data it contains the applied filters information
  * @param noLoader it will control loader.
  * @returns returns a http post subscriber.
  */
  public getInventoryFilters(data: object, noLoader = false) {
    delete data['sort'];
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    return this.httpClient.post(this.config.envSettings['API_ENDPOINT']
      + 'inventory/filters/', data, { headers: reqHeaders }).pipe(catchError(this.handleError));
  }

  generateKeyLegends(exploreMap, layerSession, mapStyle, zoomLevel, type = 'primary') {
    let relatedFeatures;
    const inventoriesMarkers = [];
    const inventoryGroups = this.exploreDataService.getInventoryGroups();
    const inventoryGroupsPlaces = this.exploreDataService.getInventoryGroupsPlaces();
    const themeSettings = this.theme.getThemeSettings();
    this.mapLegendsService.clearKeyLegend(['inventoriesMarkers', 'customLayerMarkers', 'placesMarkers'], type);
    const layers = [
      //  'grayed_frames_panel',
      'color_frames_panel',
      'frames_panel'
    ];
    if (exploreMap.getLayer('places') && exploreMap.getLayoutProperty('places', 'visibility') === 'visible') {
      const poiFeatures = exploreMap.queryRenderedFeatures({ layers: ['places'] });
      const placeIcon = { 'displayName': 'Place-Based', 'icons': [] };
      if (poiFeatures && poiFeatures.length > 0) {
        placeIcon['icons'].push({
          color: inventoryGroupsPlaces[0]['colors'][mapStyle],
          font: 'place',
          type: 'icon'
        });
      }
      if (exploreMap.getLayer('framesLayer')) {
        const poiFFeatures = exploreMap.queryRenderedFeatures({ layers: ['framesLayer'] });
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
      relatedFeatures = exploreMap.queryRenderedFeatures({
        layers
      });
      // gettting mtid from features
      let media_types = relatedFeatures.map(feature => feature.properties[MapLayersInvetoryFields.MEDIA_TYPE_ID]);
      // Removing duplicates from media type id
      media_types = Array.from(new Set(media_types));
      for (const group in inventoryGroups) {
        if (inventoryGroups.hasOwnProperty(group)) {
          const groupData = Helper.deepClone(inventoryGroups[group]);
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
    if (exploreMap.getLayer('pointOfInterests')) {
      const pointOfInterests = exploreMap.queryRenderedFeatures({ layers: ['pointOfInterests'] });
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
      this.mapLegendsService.pushKeyLegends(inventoriesMarkers, 'inventoriesMarkers', type);
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
            viewLegend['displayName'] = layer?.data?.properties?.location_name;
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
        this.mapLegendsService.pushKeyLegends(viewLayerkeyLegends, 'customLayerMarkers', type);
      }
    }
  }
  /**
 * generate 5 colors using parent color
 * @param color primary or secondary color
 * @return 5 colors based on parents color
 */
  public colorGenerater(color: string) {
    const grad = new GradientColor();
    const colors = grad.generate(
      color,
      7);
    // remove laste index color
    colors.pop();
    return colors;
  }

  /**
   * This function is to add a new note to the Inventory
   * @param featureID Inventory Id
   * @param note
   * @param noLoader
   */
  public addNotesToInventory(featureID: number, note: string, noLoader = false): Observable<any> {
    let reqHeaders = new HttpHeaders();
    if (noLoader) {
      reqHeaders = reqHeaders.set('hide-loader', 'hide-loader');
    }
    const url = `${this.config.envSettings['API_ENDPOINT']}notes/inventory/${featureID}`;
    return this.httpClient.post(url, { notes: note }, { headers: reqHeaders }).pipe(catchError(this.handleError));
  }

  /**
   * This function is to update the existing note of an Inventory
   * @param noteId The id of note which we need to update
   * @param note The text which we need to do update
   * @param noLoader
   */
  public updateInventoryNote(noteId: number, note: string, noLoader = false): Observable<any> {
    let reqHeaders = new HttpHeaders();
    if (noLoader) {
      reqHeaders = reqHeaders.set('hide-loader', 'hide-loader');
    }
    const url = `${this.config.envSettings['API_ENDPOINT']}notes/inventory/${noteId}`;
    return this.httpClient.patch(url, { notes: note }, { headers: reqHeaders }).pipe(catchError(this.handleError));
  }


  /**
   * This function is to get all notes of an user realted to all inventory
   * @param noLoader
   */
  public getAllNotesOfUser(noLoader = false): Observable<any> {
    let reqHeaders = new HttpHeaders();
    if (noLoader) {
      reqHeaders = reqHeaders.set('hide-loader', 'hide-loader');
    }
    const url = `${this.config.envSettings['API_ENDPOINT']}notes/inventory`;
    return this.httpClient.get(url, { headers: reqHeaders }).pipe(catchError(this.handleError));
  }
  /**
   * This function is to get all notes of a given inventory
   * @param featureID inventory Id
   * @param noLoader
   */
  public getAllNotesOfInventory(featureID: number, noLoader = false): Observable<any> {
    let reqHeaders = new HttpHeaders();
    if (noLoader) {
      reqHeaders = reqHeaders.set('hide-loader', 'hide-loader');
    }
    const url = `${this.config.envSettings['API_ENDPOINT']}notes/inventory/${featureID}`;
    return this.httpClient.get(url, { headers: reqHeaders }).pipe(catchError(this.handleError));
  }
  public convertFramesToSpots(inventory) {
    const spots = [];
     inventory.forEach(frame => {
      const spotsInFrame = frame.spot_references
        .filter(spot => spot['spot_id'])
        .map(spot => {
          return {
            classification_type: frame['classification_type'],
            construction_type: frame['construction_type'],
            digital: frame['digital'] ,
            spot_id: spot['spot_id'],
            frame_id: frame['frame_id'],
            geometry: frame['location'],
            illumination_type: frame['illumination_type'],
            location: frame['location'],
            max_height: frame['max_height'],
            max_width: frame['max_width'],
            media_status: frame['media_status'],
            media_type: frame['media_type'],
            media_name: frame['media_name'],
            plant_frame_id: spot['plant_spot_id'],
            representations: frame['representations'],
            spot_references: [spot],
            uri: frame['uri'],
            place_type: frame.location?.place_type?.name ?? null,
            place_name: this.getPlacesName(frame['location']['places']),
            placement_type: frame['placement_type']
              ? frame['placement_type']['name']
              : null,
            selected: false,
            photos: frame['photos'],
          };
      });
      spots.push(...spotsInFrame);
    });
    return spots;
  }

  private getPlacesName(places: Array<any>) {
    if (places.length > 0) {
      return places
        .map((place) => {
          return place.place_name;
        })
        .toString();
    } else {
      return null;
    }
  }

  public getDurations(): Observable<Duration> {
    if (!this.duration$) {
      const url =
        this.config.envSettings['API_ENDPOINT_V2'] + 'workflows/durations/';
      this.duration$ = this.httpClient
        .get<Duration>(url)
        .pipe(
          publishReplay(1),
          refCount(),
          catchError((error) => {
            this.duration$ = null;
            return EMPTY;
          })
        );
    }
    return this.duration$;
  }
}
