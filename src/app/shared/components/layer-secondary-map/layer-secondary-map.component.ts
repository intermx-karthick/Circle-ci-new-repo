import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild, ElementRef, SimpleChanges, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { Subject, EMPTY, forkJoin, combineLatest, BehaviorSubject } from 'rxjs';
import { ResizeEvent } from 'angular-resizable-element';
import { ThemeService, CommonService, InventoryService, ExploreDataService, ExploreService, FormatService, MapService, MapLegendsService } from '@shared/services';
import { LayersService } from 'app/explore/layer-display-options/layers.service';
import { takeUntil, catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { LocateMeControl } from 'app/classes/locate-me-control';
import { MapProperties } from '@interTypes/mapProperties';
import { SummaryRequest } from '@interTypes/summary';
import { Representation } from '@interTypes/inventory';
import { PlacesFiltersService } from 'app/places/filters/places-filters.service';
import turfCenter from '@turf/center';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { applyLayers } from '@interTypes/layers';
import { MatDialog } from '@angular/material/dialog';
import { LayerType } from '@interTypes/enums';
import { BaseLayers } from '../../../classes/base-layers';
import { MapboxFactory, MapboxFactoryEnum } from '../../../classes/mapbox-factory';
import { MapLayersInvetoryFields } from '@interTypes/enums';

@Component({
  selector: 'app-layer-secondary-map',
  templateUrl: './layer-secondary-map.component.html',
  styleUrls: ['./layer-secondary-map.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerSecondaryMapComponent implements OnInit, AfterViewInit {
  @Input() dimensionsDetails: any;
  @Input() mapViewPostionState: any;
  @Input() public mapIdName: any;
  @Input() public module: any;
  style: any = {};
  mapStyle: any = {};
  mapCSS: any = {};
  dragHandleStyle: any = {};
  @Output() secondaryMapWidth = new EventEmitter();
  @Output() onCloseTopMap = new EventEmitter();
  map: mapboxgl.Map;
  selectedMapStyle: any = '';
  mapCenter: any = [-98.5, 39.8];
  mapBounds: any = [];
  unSubscribe: Subject<void> = new Subject<void>();
  public userData = {};
  mapLayers: any = {};
  public baseMaps: any;
  public themeSettings: any;
  zoomLevel = 3;
  public layerInventorySetLayers = [];
  public layerInventorySetDataSets = [];
  public GeoSetLayerIds = [];
  popupDistributor: any;
  mapPopup: any;
  private keyLegendsTimeer = null;
  public layerDisplayOptions: any = {};
  resizingInProcess = '';
  public isDualMapSyncEnabled: boolean;
  public mapHeight = window.innerHeight - 120;
  public markerIcon: any = environment.fontMarker;
  public inventoryGroups;
  public defaultAudience: any;
  public isKeylegend = false;
  public keyLegendColors: any;
  public currentSingleInventory: any;
  public showMapLegend: any = true;
  viewLayerApplied = false;
  public showMapControls: any = true;
  public logoInfo = {};
  public logoStyle: object = {};
  public customTextStyle: object = {};
  public activeDraggablePosition = { x: 0, y: 0 };
  activeDraggableTextPosition = { x: 0, y: 0 };
  @ViewChild('topMapReference', {static: false}) elementView: ElementRef;
  public mapWidthHeight = {};
  public layerType = 'secondary';
  public enableDraggable = true;
  public applyLayerObservable = new BehaviorSubject<applyLayers>({type:'secondary', flag:true, mapId: ''});
  public defaultMapStyle: any = '';
  private baseLayersIns: BaseLayers;


  constructor(
    private cdRef: ChangeDetectorRef,
    private themeService: ThemeService,
    private layersService:LayersService,
    private common: CommonService,
    private inventoryService: InventoryService,
    private exploreDataService: ExploreDataService,
    private placesFiltersService: PlacesFiltersService,
    private route: ActivatedRoute,
    private exploreService: ExploreService,
    private format: FormatService,
    private mapService: MapService,
    private dialogBox:MatDialog,
    private mapLegendsService: MapLegendsService
    ) { }

  ngOnInit() {
    this.inventoryGroups = this.exploreDataService.getInventoryGroups();
    this.userData = JSON.parse(localStorage.getItem('user_data'));
    if (this.userData) {
      this.mapLayers = this.userData['layers'];
    }
    if (typeof this.mapLayers !== 'undefined') {
      if (typeof this.mapLayers.center !== 'undefined') {
        this.mapCenter = this.mapLayers.center;
      }
      if (typeof this.mapLayers.bounds !== 'undefined') {
        this.mapBounds = this.mapLayers.bounds;
      }
    }
    this.themeSettings = this.themeService.getThemeSettings();
    this.baseMaps = this.themeSettings.basemaps;
    this.baseMaps.filter(maps => {
      if (maps.default) {
        this.mapStyle = maps.label;
      }
  });
  this.selectedMapStyle = this.mapStyle;

  this.layersService.getApplyLayers().pipe(takeUntil(this.unSubscribe)).subscribe((value) => {
    if (value['type'] === 'secondary') {
      this.layerType = 'secondary';
      this.applyLayerObservable.next({type:this.layerType, mapId:this.mapIdName, flag:value['flag']});
      if (value['flag']) {
        this.clearLayerView(false);
        this.layersService.cleanUpMap(this.map);
        this.loadMapLayers();
      } else {
        this.clearLayerView();
      }
    }
  });

  this.defaultAudience = this.route.snapshot.data.defaultAudience;

  }
  ngAfterViewInit(){
    this.mapPopup = MapboxFactory.produce(MapboxFactoryEnum.POPUP, {});
    setTimeout(() => {
      this.initializeMap();
      this.baseLayersIns = new BaseLayers(this.map, this.cdRef);
    }, 200);
    this.resizeLayout();
    /**
     * To get dual map sync options
     */
    this.mapService.getMapProperties().pipe(takeUntil(this.unSubscribe)).subscribe((properties) => {
      if (this.map && properties && Object.keys(properties).length) {
        if (properties.mapName !== 'secondaryMap' && !this.mapService.isMapSync) {
          this.mapService.isMapSync = true;
          this.map.setCenter(properties.center);
          this.map.setZoom(properties.zoom);
          this.map.setPitch(properties.pitch);
          this.map.setBearing(properties.bearing);
          this.mapService.isMapSync = false;
        }
      }
    });
  }

    /** layerDisplayOptions Changes*/
    layerChanges(event) {
      if(event){
        this.layerDisplayOptions = event;
      }
    }

  initializeMap() {
    mapboxgl.accessToken = environment.mapbox.access_token;
    const style = this.common.getMapStyle(this.baseMaps, this.selectedMapStyle);
    this.map = new mapboxgl.Map({
      container: this.mapIdName,
      style: style['uri'],
      minZoom: 0,
      maxZoom: 22,
      preserveDrawingBuffer: true,
      center: this.mapCenter, // starting position
      zoom: 3 // starting zoom
    });
    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
    this.map.addControl(new LocateMeControl('secondary'), 'bottom-left');
    this.map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        maximumAge: Infinity
      },
      trackUserLocation: true
    }), 'bottom-left');
    setTimeout(() => {
      // for getting current location
      this.common.locateMeSecondaryMap();
    }, 100);
    this.exploreDataService.setSecondaryMapObject(this.map);


    this.map.on('style.load', () => {
      this.bindRender();
      this.loadMapLayers();
    });

    /** Need to work when enable popup */
    //this.map.on('click', this.popupDistributor);
    this.map.on('move', (e) =>  {
      const mapProperties: MapProperties = {
        center: this.map.getCenter(),
        zoom: this.map.getZoom(),
        pitch: this.map.getPitch(),
        bearing: this.map.getBearing(),
        mapName: 'secondaryMap'
      };
      if (!this.mapService.isMapSync && this.mapService.isDualMapSyncEnabled) {
        this.mapService.setMapProperties(mapProperties);
      }
    });


  }

  bindRender() {
    this.map.resize({ mapResize: true });
    this.map.on('zoom', () => {
      this.zoomLevel = this.map.getZoom();
    });
    this.map.addSource('allPanels', {
      type: 'vector',
      url: this.mapLayers['allPanels']['url']
    });
    this.map.on('render', (e) => {
      clearTimeout(this.keyLegendsTimeer);
      this.keyLegendsTimeer = setTimeout(() => {
        const layerSession = this.layersService.getlayersSession(this.layerType);
        this.mapLegendsService.generateKeyLegends(this.map, layerSession, this.mapStyle, this.zoomLevel, this.layerType);
      }, 500);
    });

  }

  loadMapLayers() {
    this.resizeLayout();
    if (this.map) {
      const layersSession = this.layersService.getlayersSession('secondary');
      if (layersSession &&  layersSession['display']) {
        this.applyLayerObservable.next({type:this.layerType, mapId:this.mapIdName, flag:true});
        const mapStyle = layersSession['display']['baseMap'];
        this.style = this.common.getMapStyle(this.baseMaps, mapStyle);
        layersSession['display']['baseMap'] = this.style['label'];
        if (layersSession['display']['baseMap'] && this.mapStyle !== layersSession['display']['baseMap']) {
          if (this.mapPopup.isOpen()) {
            this.mapPopup.remove();
          }
          this.mapStyle = layersSession['display']['baseMap'];
          this.style = this.common.getMapStyle(this.baseMaps, this.mapStyle);
          this.map.setStyle(this.style['uri']);
          this.map.once('style.load', () => {
            this.map.fitBounds(this.mapBounds);
            this.map.setZoom(this.zoomLevel);
          });
        }else{
          this.viewLayerApplied = true;
          if (typeof layersSession['display']['mapLegend'] !== 'undefined') {
            this.showMapLegend = layersSession['display']['mapLegend'];
          }
          if (typeof layersSession['display']['mapControls'] !== 'undefined') {
            this.showMapControls = layersSession['display']['mapControls'];
          }

            this.mapService.isDualMapSyncEnabled = this.isDualMapSyncEnabled = (layersSession['display']['syncZoomPan'])
          /**Need to implemented when enable model popup */
          /*if (this.map.getLayer('grayed_frames_panel')) {
            if (!layersSession['display'].showUnselectedInventory) {
              this.map.setLayoutProperty('grayed_frames_panel', 'visibility', 'none');
            } else {
              this.map.setLayoutProperty('grayed_frames_panel', 'visibility', 'visible');
            }
          }
          if (this.map.getLayer('mapLabel')) {
            if (!layersSession['display'].mapLabel) {
              this.map.setLayoutProperty('mapLabel', 'visibility', 'none');
            } else {
              this.map.setLayoutProperty('mapLabel', 'visibility', 'visible');
              const text = [];
              if (layersSession['display'].mapLabels['geopath spot IDs']) {
                text.push('{fid}');
              }
              if (layersSession['display'].mapLabels['operator spot IDs']) {
                text.push('{pid}');
              }
              if (layersSession['display'].mapLabels['place name']) {
                text.push('{opp}');
              }
              if (layersSession['display'].mapLabels['place address']) {
                text.push('{st}');
              }
              if (text.length > 0) {
                const value = text.join('\n');
                this.map.setLayoutProperty('mapLabel', 'text-field', value);
              } else {
                this.map.setLayoutProperty('mapLabel', 'visibility', 'none');
              }
            }
          }*/
          if (layersSession['display']) {
            if (layersSession['display']['screen']) {
              this.mapWidthHeight = layersSession['display']['screen'];
            }
          }
        }
        setTimeout(() => {
          this.loadViewLayers(layersSession);
        }, 500);
      }
    }
  }

  addResizeIcon() {
    setTimeout(() => {
      const elements = document.getElementsByClassName('ng-resizable-se');
      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          elements[i].innerHTML = '<svg style="width:24px;height:24px" viewBox="0 0 24 24" class="extand-img"> <path fill="#000000" d="M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z" /></svg>';
        }
      }
    }, 200);
  }

  loadViewLayers(layersSession){
    if (this.layerInventorySetLayers.length > 0) {
      this.layerInventorySetLayers.map(layerId => {
        if (this.map.getLayer(layerId)) {
          this.map.off('mouseenter', layerId);
          this.map.off('mouseleave', layerId);
          this.map.removeLayer(layerId);
        }
      });
    }
    if (this.layerInventorySetDataSets.length > 0) {
      this.layerInventorySetDataSets.map(layerId => {
        if (this.map.getSource(layerId)) {
          this.map.removeSource(layerId);
        }
      });
    }

    /** Removing Geoset layers */
    if (this.GeoSetLayerIds.length > 0) {
      /** center icon layer */
      this.map.off('sourcedata');

      if (this.map.getLayer('geoSetPointCenter')) {
        this.map.removeLayer('geoSetPointCenter');
      }

      if (this.map.getSource('geoSetPoint')) {
        this.map.removeSource('geoSetPoint');
      }
      this.baseLayersIns.selectedLayersMapIds = [];

      this.GeoSetLayerIds.map(layerId => {
        if (this.map.getLayer(layerId)) {
          this.map.removeLayer(layerId);
         }
      });
    }
    this.layerInventorySetLayers = [];
    this.layerInventorySetDataSets = [];
    this.GeoSetLayerIds = [];
    this.layersService.cleanUpMap(this.map);
    if (layersSession && layersSession['selectedLayers'] && layersSession['selectedLayers'].length > 0) {
      for (let i = layersSession['selectedLayers'].length - 1; i >= 0; i--) {

        const layerData = layersSession['selectedLayers'][i];
        switch (layerData.type) {
          case 'inventory collection':
            if (layerData.data['_id'] !== 'default') {
              const mapLayerId = 'layerInventoryLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
              const mapLayerDataId = 'layerViewData' + Date.now().toString(36) + Math.random().toString(36).substr(2);
              this.map.addSource(mapLayerDataId, {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: []
                }
              });
              this.layerInventorySetLayers.push(mapLayerId);
              this.map.addLayer({
                id: mapLayerId,
                type: 'symbol',
                source: mapLayerDataId,
                minzoom: 0,
                maxzoom: (layerData['icon'] && layerData['icon'] === 'icon-wink-pb-dig' ? 7 : 17),
                layout: {
                  'text-line-height': 1,
                  'text-padding': 0,
                  'text-anchor': 'bottom',
                  'text-allow-overlap': true,
                  'text-field': layerData['icon'] && layerData['icon'] !== 'icon-wink-pb-dig' && this.markerIcon[layerData['icon']] || this.markerIcon['icon-circle'],
                  'icon-optional': true,
                  'text-font': ['imx-map-font-43 Regular'],
                  'text-size': layerData['icon'] === 'icon-wink-pb-dig' ? 10 : 18,
                  'text-offset': [0, 0.6]
                },
                paint: {
                  'text-translate-anchor': 'viewport',
                  'text-color': layerData['color']
                }
              });
              this.map.on('mouseenter', mapLayerId, () => {
                this.map.getCanvas().style.cursor = 'pointer';
              });
              this.map.on('mouseleave', mapLayerId, () => {
                this.map.getCanvas().style.cursor = '';
              });

              const inventroyIds = [];
              const inventroyCustomIds = [];
              layerData['data']['inventory']
                .map(inventory => {
                  if (inventory.type === 'geopathPanel') {
                    inventroyIds.push(inventory.id);
                  } else if (inventory.type === 'customPanel') {
                    inventroyCustomIds.push(inventory.id);
                  }
                });

              const filters: Partial<SummaryRequest> = {
                id_type: 'spot_id',
                id_list: inventroyIds
              };
              // adding default measures range list if it is not, to get invalid ids
              filters['measures_range_list'] = [{ 'type': 'imp', 'min': 0 }];
              filters['page_size'] = 1000;

              const inventoryRequests = [this.inventoryService
                .getInventoriesWithAllData(filters)
                .pipe(catchError(error => EMPTY))];

              if (layerData['data']['client_id'] && Number(layerData['data']['client_id']) === Number(this.themeSettings.clientId)) {
                inventoryRequests.push(this.inventoryService.getInventoryFromElasticSearch(this.inventoryService
                  .prepareInventorySpotQuery(inventroyCustomIds))
                  .pipe(catchError(error => EMPTY)));
              }
              const colors = [
                'match',
                ['get', MapLayersInvetoryFields.MEDIA_TYPE_ID]
              ];
              const symbols = [
                'match',
                ['get', MapLayersInvetoryFields.MEDIA_TYPE_ID]
              ];
              this.inventoryGroups.map(media => {
                if (media.mtidPrint.length > 0) {
                  symbols.push(media.mtidPrint, media.print['symbol']);
                  colors.push(media.mtidPrint, media.colors[this.mapStyle]);
                }
                if (media.mtidDigital.length > 0) {
                  symbols.push(media.mtidDigital, media.digital['symbol']);
                  colors.push(media.mtidDigital, media.colors[this.mapStyle]);
                }
              });
              if (this.inventoryGroups[2]) {
                colors.push(this.inventoryGroups[2].colors[this.mapStyle]);
                symbols.push(this.inventoryGroups[2].print['symbol']);
              }

              forkJoin(inventoryRequests).subscribe(response => {
                const data = [];
                if (response[0]['inventory_summary']['inventory_items'].length > 0) {
                  response[0]['inventory_summary']['inventory_items']
                    .map(inventory => {
                      data.push({
                        type: 'Feature',
                        geometry: inventory['location']['geometry'],
                        properties: {
                          fid: inventory.frame_id || '', // frame_id & spot_id both are equal
                          opp: this.getOperatorName(inventory.representations),
                          pid: inventory.plant_frame_id || ''
                        }
                      });
                    });
                }
                if (response[1]) {
                  const sourceData = this.inventoryService.formatSpotElasticData(response[1]);
                  if (sourceData && sourceData.length > 0) {
                    sourceData.map(customSpotInventory => {
                      const spot = customSpotInventory['layouts'][0]['faces'][0]['spots'][0];
                      data.push({
                        type: 'Feature',
                        geometry: customSpotInventory['location']['geometry'],
                        properties: {
                          fid: customSpotInventory.id || '',
                          opp: this.getOperatorName(customSpotInventory.representations),
                          pid: spot['plant_spot_id'] && spot['plant_spot_id'] || customSpotInventory.plant_frame_id
                        }
                      });
                    });
                  }
                }
                const inventoryCollectionData = {
                  type: 'FeatureCollection',
                  features: data
                };
                if (this.map.getSource(mapLayerDataId)) {
                  this.map.getSource(mapLayerDataId).setData(inventoryCollectionData);
                }

                if (layerData['icon'] && layerData['icon'] === 'icon-wink-pb-dig') {
                  const seletedPanels = inventoryCollectionData.features.map(e => e.properties.fid);
                  const filterData = [];
                  filterData.unshift('all');
                  seletedPanels.unshift('in', MapLayersInvetoryFields.FRAME_ID);
                  filterData.push(seletedPanels);
                  const colorFrameLayer = 'layerInventoryColorLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
                  this.layerInventorySetLayers.push(colorFrameLayer);
                  this.map.addLayer({
                    id: colorFrameLayer,
                    type: 'circle',
                    source: 'allPanels',
                    'source-layer': this.mapLayers['allPanels']['source-layer'],
                    minzoom: 7,
                    maxzoom: 11,
                    filter: filterData,
                    paint: {
                      'circle-opacity': 0.8,
                      'circle-radius': 3,
                      'circle-color': colors
                    }
                  });
                  this.map.on('mouseenter', colorFrameLayer, () => {
                    this.map.getCanvas().style.cursor = 'pointer';
                  });
                  this.map.on('mouseleave', colorFrameLayer, () => {
                    this.map.getCanvas().style.cursor = '';
                  });
                  const winksFrameLayer = 'layerInventoryWinksLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
                  this.layerInventorySetLayers.push(winksFrameLayer);
                  this.map.addLayer({
                    id: winksFrameLayer,
                    type: 'symbol',
                    source: 'allPanels',
                    'source-layer': this.mapLayers['allPanels']['source-layer'],
                    minzoom: 11,
                    filter: filterData,
                    layout: {
                      'text-line-height': 1,
                      'text-padding': 0,
                      'text-anchor': 'bottom',
                      'text-allow-overlap': true,
                      'text-field': symbols,
                      'text-offset': [0, 0.7],
                      'text-optional': true,
                      'text-font': ['imx-map-font-43 Regular'],
                      'text-size': 17,
                      'text-rotation-alignment': 'map',
                      'text-rotate': ['get', MapLayersInvetoryFields.ORIENTATION]
                    },
                    paint: {
                      'text-translate-anchor': 'viewport',
                      'text-color': colors,
                    }
                  });
                  this.map.on('mouseenter', winksFrameLayer, () => {
                    this.map.getCanvas().style.cursor = 'pointer';
                  });
                  this.map.on('mouseleave', winksFrameLayer, () => {
                    this.map.getCanvas().style.cursor = '';
                  });
                }
              });
            }
            break;
          case 'place collection':
            const placeSetNationalLevelSource = 'layerPlaceViewData' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            const placeSetLayerSource = 'layerPlaceViewData' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            const params = { 'ids': [layerData.id] };
            const placeSetLayer = 'layerPlacesLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            this.layerInventorySetLayers.push(placeSetLayer);
            if (layerData['data']['pois'].length > 100) {
              const nationalWideBubblePlaceLayer = 'nationalWideBubblePlaceLayer' + Date.now().toString(36) +
                Math.random().toString(36).substr(2);
              const nationalWideCountPlaceLayer = 'nationalWideCountPlaceLayer' + Date.now().toString(36) +
                Math.random().toString(36).substr(2);
              this.layerInventorySetLayers.push(nationalWideBubblePlaceLayer);
              this.layerInventorySetLayers.push(nationalWideCountPlaceLayer);
              this.map.addSource(placeSetNationalLevelSource, {
                type: 'geojson',
                data: {
                  'type': 'FeatureCollection',
                  'features': []
                }
              });
              this.map.addLayer({
                id: nationalWideBubblePlaceLayer,
                type: 'circle',
                source: placeSetNationalLevelSource,
                // minzoom: 0,
                minzoom: 0,
                maxzoom: 6,
                layer: {
                  'visibility': 'visible',
                },
                paint: {
                  'circle-opacity': 0.6,
                  'circle-color': layerData['color'],
                  'circle-radius': ['get', 'radius']
                }
              });
              this.map.addLayer({
                id: nationalWideCountPlaceLayer,
                type: 'symbol',
                source: placeSetNationalLevelSource,
                // minzoom: 0,
                minzoom: 0,
                maxzoom: 6,
                // filter: ['>', 'radius', 10],
                layout: {
                  'text-field': '{count}',
                  'text-font': ['Product Sans Regular', 'Open Sans Regular', 'Arial Unicode MS Regular'],
                  'text-size': [
                    'step',
                    ['get', 'radius'],
                    9,
                    15,
                    12,
                    25,
                    24
                  ]
                },
                paint: {
                  'text-color': '#ffffff'
                }
              });
              this.placesFiltersService.getPlaceSetsSummary(params, true).subscribe(layer => {
                const data = layer['data'][0];
                const layerInfo = {
                  type: 'FeatureCollection',
                  features: data['pois']
                };
                this.map.getSource(placeSetNationalLevelSource).setData(this.formatUpPlaceNationalData(layerInfo));
              });
            }
            this.map.addSource(placeSetLayerSource, {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: []
              }
            });
            this.map.addLayer({
              id: placeSetLayer,
              type: 'symbol',
              source: placeSetLayerSource,
              minzoom: layerData['data']['pois'].length > 100 ? 6 : 0,
              layout: {
                'text-line-height': 1,
                'text-padding': 0,
                'text-anchor': 'bottom',
                'text-allow-overlap': true,
                'text-field': layerData['icon'] && this.markerIcon[layerData['icon']] || this.markerIcon['place'],
                'icon-optional': true,
                'text-font': ['imx-map-font-43 Regular'],
                'text-size': layerData['icon'] === 'lens' ? 18 : 24,
                'text-offset': [0, 0.6]
              },
              paint: {
                'text-translate-anchor': 'viewport',
                'text-color': layerData['color']
              }
            });
            this.map.on('mouseenter', placeSetLayer, () => {
              this.map.getCanvas().style.cursor = 'pointer';
            });
            this.map.on('mouseleave', placeSetLayer, () => {
              this.map.getCanvas().style.cursor = '';
            });
            this.placesFiltersService.getPlaceSetsSummary(params, false).subscribe(layer => {
              const data = layer['data'][0];
              const layerInfo = {
                type: 'FeatureCollection',
                features: data['pois']
              };
              this.map.getSource(placeSetLayerSource).setData(layerInfo);
            });
            break;
          case 'place':
            const placeLayerId = 'placeLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            const placeLayerDataId = 'placeLayerData' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            this.layerInventorySetLayers.push(placeLayerId);
            if(!(layerData?.data?.properties?.location_name)){
              layerData['data']['properties']['location_name'] = layerData?.data?.place_name ?? null;
            }
            this.map.addSource(placeLayerDataId, {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [layerData['data']]
              }
            });
            this.map.addLayer({
              id: placeLayerId,
              type: 'symbol',
              source: placeLayerDataId,
              layout: {
                'text-line-height': 1,
                'text-padding': 0,
                'text-anchor': 'bottom',
                'text-allow-overlap': true,
                'text-field': layerData['icon'] && this.markerIcon[layerData['icon']] || this.markerIcon['place'],
                'icon-optional': true,
                'text-font': ['imx-map-font-43 Regular'],
                'text-size': layerData['icon'] === 'lens' ? 18 : 24,
                'text-offset': [0, 0.6]
              },
              paint: {
                'text-translate-anchor': 'viewport',
                'text-color': layerData['color']
              }
            });
            this.map.on('mouseenter', placeLayerId, () => {
              this.map.getCanvas().style.cursor = 'pointer';
            });
            this.map.on('mouseleave', placeLayerId, () => {
              this.map.getCanvas().style.cursor = '';
            });
            break;
          case 'geopathId':
            if (typeof layerData['data'] !== 'string') {
              layerData['data'] = layerData['id'];
            }
            const topData = {
              'fid': layerData['data'],
              'replevel': (layerData['heatMapType'] === 'top_markets') ? 'dma' : 'zip_code',
            };
            forkJoin(
              this.inventoryService
                .getSingleInventory({
                  spotId: layerData['data'],
                  'target_segment': this.defaultAudience.audienceKey,
                  'base_segment': this.defaultAudience.audienceKey
                })
                .pipe(catchError(error => EMPTY)),
              this.exploreService.getInventoryDetailZipDMA(topData).pipe(catchError(error => EMPTY))
            ).subscribe(response => {
              this.layersService.cleanUpMap(this.map);
              if (layerData['heatMapType'] === 'top_markets' && response[1]['data'] && Object.keys(response[1]['data']).length !== 0) {
                this.isKeylegend = true;
                this.layersService.loadTopMarket(response[1], this.map, layerData.color, 'top_markets');
                this.keyLegendColors = this.exploreService.colorGenerater(layerData.color);
                this.currentSingleInventory = topData;
                const minValue = this.getMinValue(response[1]['data'][0]);
                const maxVlaue = this.getMaxValue(response[1]['topFour']);
                if (minValue === 0) {
                  this.currentSingleInventory['minValue'] = '0.00';
                } else {
                  this.currentSingleInventory['minValue'] = this.format.convertToPercentageFormat(minValue, 2).toString();
                }
                this.currentSingleInventory['maxValue'] = this.format.convertToPercentageFormat(maxVlaue, 2).toString();
              } else if (layerData['heatMapType'] === 'top_zips' && response[1]['data'] && Object.keys(response[1]['data']).length !== 0) {
                this.layersService.loadTopZipCode(response[1], this.map, layerData.color, 'top_zips');
                this.isKeylegend = true;
                this.keyLegendColors = this.exploreService.colorGenerater(layerData.color);
                this.currentSingleInventory = topData;
                const minValue = this.getMinValue(response[1]['data'][0]);
                const maxVlaue = this.getMaxValue(response[1]['topFour']);
                if (Number(minValue) === 0) {
                  this.currentSingleInventory['minValue'] = '0.00';
                } else {
                  this.currentSingleInventory['minValue'] = this.format.convertToPercentageFormat(minValue, 2).toString();
                }
                this.currentSingleInventory['maxValue'] = this.format.convertToPercentageFormat(maxVlaue, 2).toString();
              } else {
                this.isKeylegend = false;
                this.keyLegendColors = [];
                this.currentSingleInventory = {};
              }
              if (response[0]['inventory_summary'] &&
                response[0]['inventory_summary']['inventory_items'] &&
                response[0]['inventory_summary']['inventory_items'].length &&
                response[0]['inventory_summary']['inventory_items'][0]['location']) {
                const unitData = {
                  type: 'Feature',
                  geometry: response[0]['inventory_summary']['inventory_items'][0]['location']['geometry'],
                };
                this.layersService.markInventory(unitData, this.map, layerData.color);
              }
              this.cdRef.markForCheck();
            });
            break;
          case LayerType.GEO_SETS:
            const layerId = this.baseLayersIns.addGeoSetLayer(this.mapLayers, layerData);
            if(layerId) this.GeoSetLayerIds.push(layerId);
            break
        }
      }
      const selectedGeography = layersSession['selectedLayers'].filter(layer => (layer.type === 'geography'));
      this.removeGeographyLayers();
      if (selectedGeography.length > 0) {
        let geoLayerData = [];
        let geoMarkerIconData = [];

        selectedGeography.forEach(layer => {
          layer['data']['properties']['icon'] = layer['icon'];
          layer['data']['properties']['color'] = layer['color'];
          layer['data']['properties']['id'] = layer['id'];

          const name = layer['data']['properties']['name'];
          let pointGeo = turfCenter(layer['data']);
          pointGeo['properties']['icon'] = layer['icon'];
          pointGeo['properties']['color'] = layer['color'];
          pointGeo['properties']['id'] = layer['id'];
          pointGeo['properties']['name'] = name;

          delete layer['data']['id'];
          delete layer['data']['name'];
          geoLayerData.push(layer['data']);
          geoMarkerIconData.push(pointGeo);
        });
        // to draw the polygon line
        this.map.addSource('geoDataline', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geoLayerData
          }
        });
        // to fill the color inside the polygon area
        this.map.addSource('geoDataFill', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geoLayerData
          }
        });
        // Add the icon in center places of polygon area
        this.map.addSource('geoDataPoint', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geoMarkerIconData
          }
        });

        this.map.addLayer({
          id: 'geographyLayerLine',
          type: 'line',
          source: 'geoDataline',
          paint: {
            'line-opacity': .8,
            'line-color': ['get', 'color'],
            'line-width': 1
          }
        });

        this.map.addLayer({
          id: 'geographyLayerFill',
          type: 'fill',
          source: 'geoDataFill',
          paint: {
            'fill-opacity': .08,
            'fill-color': ['get', 'color']
          }
        });

        this.map.addLayer({
          id: 'geoDataPointCenter',
          type: 'symbol',
          source: 'geoDataPoint',
          layout: {
            'text-line-height': 1,
            'text-padding': 0,
            'text-anchor': 'bottom',
            'text-allow-overlap': true,
            'text-field': ['get', ['to-string', ['get', 'icon']], ['literal', this.markerIcon]],
            'icon-optional': true,
            'text-font': ['imx-map-font-43 Regular'],
            'text-size': 18,
            'text-offset': [0, 0.6]
          },
          paint: {
            'text-translate-anchor': 'viewport',
            'text-color': ['get', 'color']
          }
        });
      } else {
        this.removeGeographyLayers();
      }

      const selectedGeoSetLayer = layersSession['selectedLayers'].filter(layer => (layer.type === 'geo sets'));

      if (selectedGeoSetLayer.length) {
        this.baseLayersIns.addLayerSource(this.map);
        this.baseLayersIns.bindGeoSetIcon(this.GeoSetLayerIds, this.map);
      }

      if (!layersSession['selectedLayers'].find(layer => layer.type === 'geopathId')) {
        //this.isKeylegend = false;
        //this.loaderService.display(false);
      }
    } else {
      this.isKeylegend = false;
      //this.loaderService.display(false);
      this.removeGeographyLayers();
      this.removeLayers();
    }
  }

  public clearLayerView(clearAll = true) {
    this.showMapLegend = true;
    this.showMapControls = true;
    this.logoInfo = {};
    this.logoStyle = {};
    this.customTextStyle = {};
    this.activeDraggablePosition = { x: 0, y: 0 };
    this.activeDraggableTextPosition = { x: 0, y: 0 };
    this.mapWidthHeight = {};
    this.applyLayerObservable.next({type:this.layerType, mapId: this.mapIdName, flag: !clearAll});
    this.viewLayerApplied = false;
    this.removeLayers();
    this.removeGeographyLayers();
    this.isKeylegend = false;
    if (clearAll && this.mapStyle !== 'light') {
     /* if (this.mapPopupObj.isOpen()) {
        this.mapPopupObj.remove();
      }*/

      this.mapStyle = this.getDefaultMapStyle();
      this.style = this.common.getMapStyle(this.baseMaps, this.mapStyle);
      this.map.setStyle(this.style['uri']);
      this.map.once('style.load', () => {
        this.map.fitBounds(this.mapBounds);
        this.map.setZoom(this.zoomLevel);
      });
    }
  }

  getDefaultMapStyle() {
    this.baseMaps.filter(maps => {
      if (maps.default) {
        this.defaultMapStyle = maps.label;
      }
    });
    return this.defaultMapStyle;
  }

  public removeLayers() {
    if (!this.map) {
      return false;
    }
    if (this.layerInventorySetLayers.length > 0) {
      this.layerInventorySetLayers.map(layerId => {
        if (this.map.getLayer(layerId)) {
          this.map.off('mouseenter', layerId);
          this.map.off('mouseleave', layerId);
          this.map.removeLayer(layerId);
        }
      });
    }
    if (this.layerInventorySetDataSets.length > 0) {
      this.layerInventorySetDataSets.map(layerId => {
        if (this.map.getSource(layerId)) {
          this.map.removeSource(layerId);
        }
      });
    }
    /** Removing Geoset layers */
    if (this.GeoSetLayerIds.length > 0) {
      /** center icon layer */

      if (this.map.getLayer('geoSetPointCenter')) {
        this.map.removeLayer('geoSetPointCenter');
      }

      if (this.map.getSource('geoSetPoint')) {
        this.map.removeSource('geoSetPoint');
      }

      this.baseLayersIns.selectedLayersMapIds = [];

      this.GeoSetLayerIds.map(layerId => {
        if (this.map.getLayer(layerId)) {
          this.map.removeLayer(layerId);
        }
      });
      this.map.off('sourcedata');
    }
    this.GeoSetLayerIds = [];
    this.layerInventorySetDataSets = [];
    this.layerInventorySetLayers = [];
  }
  removeGeographyLayers() {
    if (this.map) {
      if (this.map.getLayer('geographyLayerLine')) {
        this.map.removeLayer('geographyLayerLine');
        this.map.removeSource('geoDataline');
      }
      if (this.map.getLayer('geographyLayerFill')) {
        this.map.removeLayer('geographyLayerFill');
        this.map.removeSource('geoDataFill');
      }
      if (this.map.getLayer('geoDataPointCenter')) {
        this.map.removeLayer('geoDataPointCenter');
        this.map.removeSource('geoDataPoint');
      }
    }
  }

  /** topZIP, topDMA calculate min & max value */
  getMinValue(data) {
    if (data.length > 0) {
      return data.reduce((min, p) => p.pct < min ? p.pct : min, data[0].pct);
    } else {
      return 0;
    }
  }
  getMaxValue(data) {
    if (data.length > 0) {
    return data.reduce((max, p) => p.pct > max ? p.pct : max, data[0].pct);
    } else {
      return 0;
    }
  }
  getOperatorName(representations: Representation[]): string {
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
  formatUpPlaceNationalData(data) {
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
  ngOnChanges(changes: SimpleChanges) {
    if (changes.dimensionsDetails.currentValue) {
      this.resizeLayout();
      this.cdRef.markForCheck();
    }
  }
  resizeLayout() {
    if(this.dimensionsDetails){
      const width = ((this.dimensionsDetails.windowWidth - 40) / 2);
      const height = this.dimensionsDetails.windowHeight - this.dimensionsDetails.headerHeight;
      const handleDrag = height / 2;
      this.style = {
        width: `${width}px`,
        height: `${height}px`,
      };
      this.mapCSS = {
        height: `${height}px`,
        width: `${width - 20}px`,
      };
      this.dragHandleStyle = {
        marginTop: `${handleDrag}px`,
      };
      this.secondaryMapWidth.emit(width);
      if (this.map) {
        this.map.resize();
      }
    }

  }
  onLogoOrTextResizing (event, type = '') {
    this.resizingInProcess = type;
  }
  onResizing(event, type = '') {
    const handleDrag = event.rectangle.height / 2;
    this.style = {
      width: `${event.rectangle.width}px`,
      height: `${event.rectangle.height}px`,
    };
    this.mapCSS = {
      width: `${event.rectangle.width}px`,
      height: `${event.rectangle.height - 20}px`,
    };
    this.dragHandleStyle = {
      marginTop: `${handleDrag}px`,
    };
  }

  onResizeEnd(event: ResizeEvent): void {
    this.style = {
      width: `${event.rectangle.width}px`,
      height: `${event.rectangle.height}px`,
    };
    this.mapCSS = {
      width: `${event.rectangle.width - 20}px`,
      height: `${event.rectangle.height}px`,
    };
    this.secondaryMapWidth.emit(event.rectangle.width);
    setTimeout(() => {
      this.map.resize();
    }, 500);
  }

  onResize(event) {
    this.mapCSS = {
      width: `${this.elementView.nativeElement.offsetWidth - 20}px`,
      height: `${this.elementView.nativeElement.offsetHeight}px`,
    };
    this.secondaryMapWidth.emit(this.elementView.nativeElement.offsetWidth);
    setTimeout(() => {
      this.map.resize();
    }, 500);
  }

    // This method is for to turn on/off dual map sync
    public mapSyncOnOff(on: boolean) {
      const layersSession = this.layersService.getlayersSession('secondary');
      this.layerDisplayOptions = layersSession['display'];
      if (on) {
        this.isDualMapSyncEnabled = true;
        this.layerDisplayOptions['syncZoomPan'] = true;
        this.mapService.isDualMapSyncEnabled = true;
      } else {
        this.isDualMapSyncEnabled = false;
        this.layerDisplayOptions['syncZoomPan'] = false;
        this.mapService.isDualMapSyncEnabled = false;
      }
      layersSession['display'] = this.layerDisplayOptions;
      this.layersService.saveLayersSession(layersSession, 'secondary');
      this.layersService.setApplyLayers({
        'type': 'secondary',
        'flag': true
      });
    }

    closeTopMap() {
      const dialogueData: ConfirmationDialog = {
        notifyMessage: false,
        confirmDesc: '<h4 class="confirm-text-icon">Are you sure you want to close the secondary map?</h4>',
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        headerCloseIcon: false
      };
      this.dialogBox.open(ConfirmationDialogComponent, {
        data: dialogueData,
        width: '586px',
        panelClass: 'exploreLayer'
      }).afterClosed().subscribe(result => {
        if (result && result['action']) {
          this.layersService.saveLayersSession({}, this.layerType);
          this.layersService.setApplyLayers({
            'type': 'secondary',
            'flag': false,
            'closeTab' : true
          });
          this.removeLayers();
          this.onCloseTopMap.emit('secondary');
          this.exploreDataService.setMapViewPositionState('inventoryView');
        }
      });
    }

    public zoomOutMap() {
      this.map.fitBounds(this.mapBounds,  {duration: 100}, {eventType: 'default'});
    }

}
