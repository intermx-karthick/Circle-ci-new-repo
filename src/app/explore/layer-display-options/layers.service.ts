import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { DisplayOptions } from '@interTypes/displayOptions';
import { FormatService, ThemeService, ExploreDataService } from '@shared/services';
import * as mapboxgl from 'mapbox-gl';
import { Observable, Subject, EMPTY, forkJoin } from 'rxjs';
import { AppConfig } from '../../app-config.service';
import { GradientColor } from '../../classes/gradient-color';
import { Representation } from '@interTypes/inventory';
import { MapboxFactory, MapboxFactoryEnum } from '../../classes/mapbox-factory';

@Injectable()
export class LayersService {
  /**
   * here data variables are not required to hold the data,
   * because the data will be always set as an array once
   * apply button is clicked
   *
   * Two Subjects are used because Display options shouldn't
   * trigger a API call.
   */

  // To stream the layers data
  private layers = new Subject();
  // To stream the Display Options
  private display = new Subject();
  private secondaryDisplay = new Subject();
  // To check whether to apply or clear layers
  private applyLayers = new Subject();
  // To check whether view is loaded
  private loadView = new Subject();
  // To check whether view is saved
  private saveView = new Subject();
  // To check whether view is cleared
  private clearView = new Subject();

  private defaultLayer = new Subject();

  // To check whether view is cleared
  private removeLogoAndText = new Subject();
  private selectedView = new Subject();
  private mapLoadedEvent = new Subject();
  public customLogo = {};
  public exploreCustomLogo = {
    'primary' : {},
    'secondary' : {}
  };
  private removeLogoStyle = new Subject();
  public defaultDisplayOptions = {
    mapLegend: true,
    mapControls: true,
    filterPills: true,
    labels: {
      audience: true,
      market: true,
      filters: true,
      deliveryWeeks: true,
      'saved view': true,
    },
    showUnselectedInventory: true,
    baseMap: '',
    isLogoEnabled: false,
    isTextEnabled: false,
    mapLabel: false,
    mapLabels: {
      'geopath spot IDs': false,
      'operator spot IDs': false
      // 'place name': false,
      // 'place address': false
    }
    //  mapLabelOption: '' // geopathid, plantid, pname and paddress
  };
  /**
   *  For the Heatmap in the mapboxGL
   ***/
  private themeSettings: any;
  // tab index from display options is required in some places
  public tabSelection: number;
  private colors = [
    { 'color': '#610075', 'label': 'Highest', 'min': 0, 'max': 2 },
    { 'color': '#8E008C', 'label': '', 'min': 3, 'max': 5 },
    { 'color': '#AD0099', 'label': '', 'min': 6, 'max': 10 },
    { 'color': '#CA46B6', 'label': '', 'min': 11, 'max': 25 },
    { 'color': '#E9B2DF', 'label': 'Lowest', 'min': 26, 'max': 100 },
  ];
  private markerLayer: any = { 'mapid': 'mapbox://intermx.04rpgst3', 'tile': 'dmas-axcicp' };
  private zipCodeLayers: any = {
    'zipHeatMap': { 'mapid': 'mapbox://intermx.dhnu854j', 'tile': 'TimeSquareHomeZips-aj1r3n' },
    'zipCode': { 'mapid': 'mapbox://intermx.79fxfd9t', 'tile': 'zips_20190123' },
  };
  private mapLayerRefs = [];
  closeSeondaryTab = new Subject();


  /** Heat map ends **/
  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private format: FormatService,
    private themeService: ThemeService) {
    this.themeSettings = this.themeService.getThemeSettings();
  }


  /**
   * Set Layer data and emit it
   * @param layers
   */
  public setLayers(layers) {
    this.layers.next(layers);
  }

  /**
   * @return Observable observable of the layers data
   */
  public getLayers(): Observable<any> {
    return this.layers.asObservable();
  }

  /**
   * To subscribe to the display options changes
   * @return Observable of display options
   */
  public getSecondaryDisplayOptions(): Observable<Partial<DisplayOptions>> {
    return this.secondaryDisplay.asObservable();
  }

   /**
   * To set display options and emit the data
   * @param options
   */
  public setSecondaryDisplayOptions(options: Partial<DisplayOptions>) {
    this.secondaryDisplay.next(options);
  }

  /**
   * To set display options and emit the data
   * @param options
   */
  public setDisplayOptions(options: Partial<DisplayOptions>) {
    this.display.next(options);
  }
  /**
   * To subscribe to the display options changes
   * @return Observable of display options
   */
  public getDisplayOptions(): Observable<Partial<DisplayOptions>> {
    return this.display.asObservable();
  }

  /**
   * To set the value to apply or clear the layers
   * @param value
   */
  public setApplyLayers(value: object) {
    this.applyLayers.next(value);
  }
  public getApplyLayers(): Observable<any> {
    return this.applyLayers.asObservable();
  }

  /**
   * To set the value to apply or clear the layers
   * @param value
   */
  public setCloseSeondaryTab(value: boolean) {
    this.closeSeondaryTab.next(value);
  }
  public getCloseSeondaryTab(): Observable<any> {
    return this.closeSeondaryTab.asObservable();
  }

  /**
   * To save selected layers in local storage for keep my view.
   * @param layers
   */
  public saveLayersSession(layers, type = 'primary') {
    // if (type === 'place') {
    //   localStorage.setItem('placeLayersSession', JSON.stringify(layers));
    // } else if (type === 'secondary') {
    if (type === 'secondary') {
      localStorage.setItem('secondaryLayersSession', JSON.stringify(layers));
    } else {
      localStorage.setItem('layersSession', JSON.stringify(layers));
    }
  }

  /**
   * To get saved layers session form local storage.
   */
  public getlayersSession(type = 'primary') {
    // if (type === 'place') {
    //   return JSON.parse(localStorage.getItem('placeLayersSession'));
    // } else if (type === 'secondary') {
    if (type === 'secondary') {
      return JSON.parse(localStorage.getItem('secondaryLayersSession'));
    } else {
      return JSON.parse(localStorage.getItem('layersSession'));
    }
  }


  /**
  * To set selected view data and emit the data
  * @param data
  */
  public setSelectedView(data: Partial<DisplayOptions>) {
    this.selectedView.next(data);
  }

  /**
   * To subscribe to the selected view data changes
   * @return Observable of selected view data
   */
  public getSelectedView(): Observable<Partial<DisplayOptions>> {
    return this.selectedView.asObservable();
  }

  /**
   * To identify load view is applied and emit data
   * @param value
   */
  public setLoadView(value) {
    this.loadView.next(value);
  }

  /**
   * Subscribe to load view changes
   * @return Observable of applied load view
   */
  public getLoadView() {
    return this.loadView.asObservable();
  }

  /**
   * To identify save view is applied and emit data
   * @param value
   */
  public setSaveView(value) {
    this.saveView.next(value);
  }

  /**
   * Subscribe to save view changes
   * @return Observable of saved view data
   */
  public getSaveView() {
    return this.saveView.asObservable();
  }

  /**
   * To identify clear view is applied and emit data
   * @param value
   */
  public setClearView(value) {
    this.clearView.next(value);
  }

  /**
   * Subscribe to clear view changes
   * @return Observable of clear view data
   */
  public getClearView() {
    return this.clearView.asObservable();
  }


  /**
   * To clear custom logo and text and emit data
   * @param value value will be either logo or text
   */
  public setRemoveLogoAndText(value) {
    this.removeLogoAndText.next(value);
  }

  /**
   * Subscribe to clear custom logo and text
   * @return Observable of custom logo and text
   */
  public getRemoveLogoAndText() {
    return this.removeLogoAndText.asObservable();
  }


  /**
   * To clear Logo style
   * @param value value will be either true or false
   */
  public setClearLogoStyle(value) {
    this.removeLogoStyle.next(value);
  }

  /**
   * Subscribe to clear custom logo style
   * @return
   */
  public getClearLogoStyle() {
    return this.removeLogoStyle.asObservable();
  }

  /**
   * Function to prepare media type pills from applied filter data
   * before normalizing
   * @param idList List of selected media type IDs
   * @param dataSource Media type data source
   */
  public prepareMediaTypesPill(idList, dataSource) {
    const mediaTypes = [];
    dataSource.map(data => {
      data.options.map(option => {
        if (idList.indexOf(option.id) !== -1) {
          mediaTypes.push(option.name);
        }
      });
    });
    return 'Media Types: ' + mediaTypes.join(',  ');
  }

  /**
   * Map heatmap functions
   */
  //  commented  on 18-07-2019 due to removal of autocomplete
  /* public geoPanelAutoComplete(searchString: number, noLoader = false): Observable<any> {
     let reqHeaders;
     if (noLoader) {
       reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
     }
     return this.http.get(this.config.envSettings['API_ENDPOINT'] + '/inventory/autocomplete?geopathPanelId=' + searchString, { headers: reqHeaders });
   }*/

  public markInventory(unitData, map: mapboxgl.Map, color: string) {
    map.addSource('map-single-inventory-unit', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [unitData]
      }
    });
    map.addLayer({
      id: 'map-my-icon-single',
      type: 'symbol',
      source: 'map-single-inventory-unit',
      layout: {
        'text-line-height': 1,
        'text-padding': 0,
        'text-anchor': 'bottom',
        'text-allow-overlap': true,
        'text-field': 'A',
        'icon-optional': true,
        'text-font': ['imx-map-font-43 Regular'],
        'text-size': 20,
        'text-offset': [0, 0.6]
      },
      paint: {
        'text-translate-anchor': 'viewport',
        'text-halo-color': 'rgba(255,255,255,1)',
        'text-halo-width': 1,
        'text-halo-blur': 2,
        'text-color': color
      }
    });
    this.mapLayerRefs.push('map-my-icon-single');
  }

  convertToPercentage(key, decimal = 0) {
    return this.format.convertToPercentageFormat(key, decimal);
  }

  loadTopMarket(data, map: mapboxgl.Map, color: string, flag: string) {
    map.addSource('dmaPanals', {
      type: 'vector',
      url: this.markerLayer['mapid']
    });
    // this.removeLayers();
    const colors = this.colorGenerater(color);
    // To remove last index color from colors array
    colors.pop();

    /*let i = 0;*/
    const colorCode = [
      'match',
      ['get', 'esri_id']
    ];
    const zipColors = {};
    let marketIds = [];
    const combinedMarketData = [];
    Object.keys(data['data']).reverse().forEach((key, index) => {
      const value = data['data'][key];
      combinedMarketData.push(...value);
      value.forEach(market => {
        // Remove DMA string from marketID
        const formatMarketId = market.id.substr(3);
        // adding color and ID for filter
        colorCode.push(formatMarketId, colors[index]);
        // Creating new layer data for each color based on internal zip-layer mapping
        if (!zipColors[colors[index]]) {
          zipColors[colors[index]] = [];
        }
        zipColors[colors[index]].push(formatMarketId);
        marketIds.push(formatMarketId);
      });
    });
    colorCode.push(colors[colors.length - 1]);
    const zipColorLayers = [
      'match',
      ['get', 'esri_id']
    ];

    for (const zipColor in zipColors) {
      if (zipColors.hasOwnProperty(zipColor)) {
        zipColorLayers.push(zipColors[zipColor], zipColor);
      }
    }

    zipColorLayers.push(colors[colors.length - 1]);
    map.addLayer({
      'id': 'marketPanelSingle',
      'type': 'fill',
      'source': 'dmaPanals',
      'source-layer': this.markerLayer['tile'],
      minzoom: 0,
      'paint': {
        'fill-opacity': 0.6,
        'fill-color': flag === 'zip' ? zipColorLayers : colorCode
      }
    });

    // Create a popup
    const popup = MapboxFactory.produce(MapboxFactoryEnum.POPUP,{
      closeButton: false,
      closeOnClick: false
    });

    this.mapLayerRefs.push('marketPanelSingle');
    /*map.on('mouseenter', 'marketPanelSingle', (e) => {
      map.getCanvas().style.cursor = 'pointer';
    });*/
    map.on('mousemove', 'marketPanelSingle', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['marketPanelSingle'] });
      map.getCanvas().style.cursor = 'pointer';
      // Populate the popup and set its coordinates
      // based on the feature found.
      const marketData = combinedMarketData.filter(dmaData => dmaData.id === 'DMA'+ features[0]['properties']['esri_id']);
        if (marketData.length > 0) {
          const popupHTML = `<div class="audience-delivery-popup"> <h5> ${marketData[0].name} </h5><p> Contributing Total Impressions: ${ this.convertToPercentage(marketData[0].pct,2)} % </div>`;
          popup
          .setLngLat(e.lngLat)
          .setHTML(popupHTML)
          .addTo(map);
        }
    });
    map.on('mouseleave', 'marketPanelSingle', () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });
    /* Below code was commented becuase currently client wants to display all markets on map. If they dont't want we can re-enable it.  */
    /*
    marketIds.unshift('in', 'id');
    map.setFilter('marketPanelSingle', marketIds);
    */

  }

  loadTopZipCode(data, map: mapboxgl.Map, color: string, flag: string) {
    map.addSource('zipHeatMap', {
      type: 'vector',
      url: 'mapbox://intermx.dhnu854j'
    });

    map.addSource('zipCode', {
      'type': 'vector',
      'url': 'mapbox://intermx.79fxfd9t'
    });
    const colors = this.colorGenerater(color);
    // To remove last index color from colors array
    colors.pop();

    const colorCode = [
      'match',
      ['get', 'zipcode']
    ];

    const zipColorLayers = [
      'match',
      ['get', 'zipcode']
    ];

    const zipCodes = [];
    const zipColors = {};
    const zipCodeIds = [];
    const combinedZipData = [];

    Object.keys(data['data']).reverse().forEach((key, index) => {
      const value = data['data'][key];
      combinedZipData.push(...value);
      value.forEach(zipCode => {
        // Remove ZIP string from zipcode
        const formatZipCode = zipCode.zip.substr(3);
        // adding color and ID for filter
        colorCode.push(formatZipCode, colors[index]);
        // Creating new layer data for each color based on internal zip-layer mapping
        if (!zipColors[colors[index]]) {
          zipColors[colors[index]] = [];
        }
        if (zipColors[colors[index]].indexOf(formatZipCode) === -1) {
          zipColors[colors[index]].push(formatZipCode);
        }
        zipCodes.push(formatZipCode);
        zipCodeIds.push(formatZipCode);
      });
    });

    colorCode.push(colors[colors.length - 1]);

    map.addLayer({
      'id': 'zipHeatMap',
      'type': 'heatmap',
      'source': 'zipHeatMap',
      'source-layer': this.zipCodeLayers['zipHeatMap']['tile'],
      minzoom: 0,
      maxzoom: 5,
      'paint': {
        'heatmap-weight': [
          'interpolate', ['linear'], ['get', 'timeSqPct'], 4.209e-12, 1, 0.136302649345961, 30],
        'heatmap-radius': [
          'interpolate', ['linear'], ['zoom'], 0, 5, 22, 50
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(0, 0, 255, 0)',
          0.1,
          colors[4],
          0.3,
          colors[3],
          0.5,
          colors[2],
          0.7,
          colors[1],
          1,
          colors[0]
        ],
        'heatmap-intensity': 0.2,
        'heatmap-opacity': 0.6
      },
    });

    this.mapLayerRefs.push('zipHeatMap');
    zipCodeIds.unshift('in', 'ZIPCODE');
    map.setFilter('zipHeatMap', zipCodeIds);
    for (let zipColor in zipColors) {
      if (zipColors.hasOwnProperty(zipColor)) {
        zipColorLayers.push(zipColors[zipColor], zipColor);
      }
    }

    zipColorLayers.push(colors[colors.length - 1]);
    map.addLayer({
      'id': 'zipCode',
      'type': 'fill',
      'source': 'zipCode',
      'source-layer': this.zipCodeLayers['zipCode']['tile'],
      'minzoom': 5,
      'maxzoom': 22,
      'paint': {
        'fill-opacity': 0.6,
        'fill-color': zipColorLayers
      }
    });
    const popup = MapboxFactory.produce(MapboxFactoryEnum.POPUP,{
      closeButton: false,
      closeOnClick: false
    });
    this.mapLayerRefs.push('zipCode');
   /* map.on('mouseenter', 'zipCode', () => {
      map.getCanvas().style.cursor = 'pointer';
    });*/
    map.on('mousemove', 'zipCode', (e) => {
      const features = e.features;
      map.getCanvas().style.cursor = 'pointer';
      // Populate the popup and set its coordinates
      // based on the feature found.
      const zipData = combinedZipData.filter(zip => zip.zip === 'ZIP' + features[0]['properties']['zipcode']);
        if (zipData.length > 0) {
          const popupHTML = `<div class="audience-delivery-popup"> <h5> ZIP Code: ${features[0]['properties']['zipcode']} </h5><p> Contributing Total Impressions: ${ this.convertToPercentage(zipData[0].pct,2)} % </div>`;
          popup
          .setLngLat(e.lngLat)
          .setHTML(popupHTML)
          .addTo(map);
        }
    });
    map.on('mouseleave', 'zipCode', () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });
    /* Below code was commented becuase currently client wants to display all zip on map. If they dont't want we can re-enable it.  */
    //    zipCodes.unshift('in', 'zipcode');
    //    map.setFilter('zipCode', zipCodeIds);
  }



  /**
   * Function to remove the existing layers created by the display options, single inventory unit
   * Function not intended for reusing with any other features, kindly implement your
   * own logic to clean up the map after yourself.
   */
  public cleanUpMap(map: mapboxgl.Map) {
    this.mapLayerRefs.forEach(ref => {
      if (map.getLayer(ref)) {
        map.off('mouseenter', ref);
        map.off('mouseleave', ref);
        map.off('click', ref);
        map.removeLayer(ref);
      }
    });

    if (map && (Object.keys(map).length !== 0)) {
      // removing sources
      if (map.getSource('zipHeatMap')) {
        map.removeSource('zipHeatMap');
      }
      if (map.getSource('zipCode')) {
        map.removeSource('zipCode');
      }
      if (map.getSource('dmaPanals')) {
        map.removeSource('dmaPanals');
      }
      if (map.getSource('map-my-single-source')) {
        map.removeSource('map-my-single-source');
      }
      if (map.getSource('map-single-inventory-unit')) {
        map.removeSource('map-single-inventory-unit');
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
    return colors;
  }
  /**
   * pushSearchResultLayer to set and emit the Search Layer in custom layers
   */
  public pushSearchResultLayer(value) {
    this.defaultLayer.next(value);
  }

  /**
   * onPushSearchResultLayer Subscribe push default custom layer.
   * @return Observable of true/false
   */
  public onPushSearchResultLayer(): Observable<any> {
    return this.defaultLayer.asObservable();
  }
  public setRemovedSearchLayer(flag) {
    localStorage.setItem('removedSearchLayer', flag);
  }
  public getRemovedSearchLayer() {
    return JSON.parse(localStorage.getItem('removedSearchLayer'));
  }
  public getDefaultMapStyle(baseMaps) {
    let defaultMapStyle = '';
    baseMaps.filter(maps => {
      if (maps.default) {
        defaultMapStyle = maps.label;
      }
    });
    return defaultMapStyle;
  }


  public getOperatorName(representations: Representation[]): string {
    let opp = '';
    if (representations) {
      const representation = representations.filter(rep => rep['representation_type']['name'] === 'Own')[0];
      if (representation) {
        opp = representation['account']['parent_account_name'];
        // opp = representation['division']['plant']['name'];
      }
    }
    return opp;
  }

  /** topZIP, topDMA calculate min & max value */
  public getMinValue(data) {
    if (data.length > 0) {
      return data.reduce((min, p) => p.pct < min ? p.pct : min, data[0].pct);
    } else {
      return 0;
    }
  }

  public getMaxValue(data) {
    if (data.length > 0) {
    return data.reduce((max, p) => p.pct > max ? p.pct : max, data[0].pct);
    } else {
      return 0;
    }
  }

  public formatUpPlaceNationalData(data) {
    data.features.sort(function (a, b) {
      return b.properties.count - a.properties.count;
    });
    // Top 2% with the largest circles, top 25% medium, bottom 75% small.
    for (let i = 0, len = data.features.length; i < len; i++) {
      if (Math.ceil((i / len) * 100) <= 2 || i <= 1) {
        data.features[i].properties['radius'] = 40;  // 75;
      } else if (Math.ceil((i / len) * 100) <= 25 || i <= 3) {
        data.features[i].properties['radius'] = 20;  // 45;
      } else {
        data.features[i].properties['radius'] = 10;  // 25;
      }
    }
    return data;
  }


  public onMapLoad(): Observable<any> {
    return this.mapLoadedEvent.asObservable();
  }

  public mapLoaded(isLoaded: boolean): void {
    this.mapLoadedEvent.next(isLoaded);
  }
}
