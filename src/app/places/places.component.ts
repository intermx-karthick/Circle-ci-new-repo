import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import {
    AuthenticationService,
    ThemeService,
    PlacesDataService,
    CommonService,
    DynamicComponentService,
    MapService,
    LoaderService,
    ExploreDataService,
    InventoryService,
    ExploreService,
    FormatService
} from '@shared/services';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../environments/environment';
import { LocateMeControl } from '../classes/locate-me-control';
import { ActivatedRoute } from '@angular/router';
import { PlacesFiltersService } from './filters/places-filters.service';
import {
    takeWhile,
    map,
    catchError,
    takeUntil,
    concatMap,
    filter,
    tap
} from 'rxjs/operators';
import {
    combineLatest,
    forkJoin,
    EMPTY,
    BehaviorSubject,
    of,
    Observable,
    throwError
} from 'rxjs';
import { PlacesSimplePopupComponent } from './places-simple-popup/places-simple-popup.component';
import { PlacesPopupComponent } from './places-popup/places-popup.component';
import { PlacesDetailPopupComponent } from './places-detail-popup/places-detail-popup.component';
import { PlacesStatisticPopupComponent } from './places-statistic-popup/places-statistic-popup.component';
import bbox from '@turf/bbox';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw';
import { RadiusMode } from '../classes/radius-mode';
import { LayersService } from '../explore/layer-display-options/layers.service';
import turfCenter from '@turf/center';
import { MatDialog } from '@angular/material/dialog';
import { SavePlaceSetsDialogComponent } from '@shared/components/save-place-sets-dialog/save-place-sets-dialog.component';
import { RequestAuditDialogComponent } from './request-audit-dialog/request-audit-dialog.component';
import { SummaryRequest } from '@interTypes/summary';
import { LayerType } from '@interTypes/enums';
import { BaseLayers } from '../classes/base-layers';
import { applyLayers } from '@interTypes/layers';
import { MapProperties } from '@interTypes/mapProperties';
import { MapboxFactory, MapboxFactoryEnum } from '../classes/mapbox-factory';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialog } from './../Interfaces/workspaceV2';
import {PlaceCreateDialogComponent} from './place-create-dialog/place-create-dialog.component'
import { PopulationService } from 'app/population/population.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MapLayersInvetoryFields } from '@interTypes/enums';
import { Helper } from 'app/classes';
@Component({
  selector: 'app-places',
  templateUrl: './places.component.html',
  styleUrls: ['./places.component.less'],
  providers: [ PopulationService ]
})
export class PlacesComponent implements OnInit, OnDestroy {
    map: mapboxgl.Map;
    poiData: any = { type: 'FeatureCollection', features: [] };
    poiStarData: any = { type: 'FeatureCollection', features: [] };
    poiMapPoup: any;
    poiMapGrayedPoup: any;
    mapPopup: any;
    features: any = [];
    places: any = [];
    current_page: any;
    current_e: any;
    userData: any;
    mapCenter: any = [-98.5, 39.8];
    mapBounds: any = [];
    zoomLevel = 0;
    headerHeight: any;
    mapHeight: any;
    mapWidth: any;
    themeSettings: any;
    baseMaps: any;
    iconColor: any;
    dimensionsDetails: any;
    selectedMapStyle: any = '';
    isPlaceFilterOpen = false;
    public openFilter = false;
    private unSubscribe = true;
    public filterLevel = {
        filterLevel: 1,
        searchHide: false,
        placeResultExpand: false
    };
    public mapStyle: any = '';
    public nationalWideData = { type: 'FeatureCollection', features: [] };
    popupDistributor: any;
    loadPOIPopup: any;
    nationalBubbleZoom: any;
    poiPolygonZoom: any;
    poiDetailAPICall = null;
    filterOpenDetails: any = {};
    currentTab = 'findAndDefine';
    mapLayers = {};
    public filteredData = {};
    // Polygon Related vars
    draw: MapboxDraw;
    circularPolyDrawEnabled = false;
    normalPolyDrawEnabled = false;
    radiusPolyDrawEnabled = false;
    geoPolygonEnabled = false;
    customPolygon: any = { type: 'MultiPolygon', coordinates: [] };
    customCenterPoint: any = { type: 'Point', coordinates: [] };
    polygonData: any = { type: 'FeatureCollection', features: [] };
    customPolygonFeature: any = {
        id: '1234234234234234',
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: []
        },
        properties: {}
    };
    // end
    popupOpenType = 'map';
    enableMapInteractionFlag = true;
    popUpData = {};
    placeAccess: any = {};
    allowPlace = '';
    public loadMoreChild: boolean;
    public loadMoreChildVisitorsWork: boolean;
    // Layers & display options related vars
    public showMapControls: any = true;
    style: any;
    public showMapLegends: any = true;
    // public displayTextInfo = {};
    public layerDisplayOptions: any = {};
    public customTextStyle: object = {};
    public mapWidthHeight = {};
    public activeDraggableTextPosition = { x: 0, y: 0 };
    public logoStyle: object = {};
    public activeDraggablePosition = { x: 0, y: 0 };
    public venuesClicked = false;
    private layerInventorySetLayers = [];
    private GeoSetLayerIds = [];
    public mapPlaceHash5Layer: any;
    public mapPlaceHash6Layer: any;
    private markerIcon: any = environment.fontMarker;
    public keyLegendsTimeer = null;
    public selectedPlaceData = {};
    // end
    private sfids = [];
    private selectedValue = 'Last Year, Last Month';
    public navigationCollapseState = false;
    public initialFilterOpen = false;
    public layerInventorySetDataSets = [];
    public inventoryGroups;
    public isKeylegend = false;
    public layerType = 'primary';
    public keyLegendColors: any;
    public currentSingleInventory: any;
    public defaultAudience: any;
    baseLayersIns: BaseLayers;
    public enableSecondaryMap = false;
    public applyLayerObservable = new BehaviorSubject<applyLayers>({
        type: 'primary',
        flag: true,
        mapId: 'map-area'
    });
    marker = new mapboxgl.Marker({ draggable: true });
    placeLatLong;
    private isPlacesCreateAllowed = false;

    constructor(
        private theme: ThemeService,
        private placeDataService: PlacesDataService,
        private commonService: CommonService,
        private route: ActivatedRoute,
        private placeFilterService: PlacesFiltersService,
        private dynamicComponentService: DynamicComponentService,
        private mapService: MapService,
        private auth: AuthenticationService,
        private layersService: LayersService,
        private loaderService: LoaderService,
        private exploreDataService: ExploreDataService,
        private inventoryService: InventoryService,
        private exploreService: ExploreService,
        private format: FormatService,
        public dialog: MatDialog,
        public cdRef: ChangeDetectorRef,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit() {
        this.placeFilterService.setFilterLevel({});
        this.placeAccess = this.auth.getModuleAccess('places');
        this.inventoryGroups = this.exploreDataService.getInventoryGroups();
        this.defaultAudience = this.route.snapshot.data.defaultAudience;
        if (
            this.placeAccess['features'] &&
            this.placeAccess['features']['placeDetails']
        ) {
            this.allowPlace = this.placeAccess['features']['placeDetails'][
                'status'
            ];
        }
        this.theme.getDimensions().subscribe((data) => {
            this.dimensionsDetails = data;
            this.headerHeight = data.headerHeight;
            this.mapHeight = data.windowHeight - data.headerHeight;
            this.dynamicResize();
        });
        this.themeSettings = this.theme.getThemeSettings();
        this.baseMaps = this.themeSettings.basemaps;
        this.baseMaps.filter((maps) => {
            if (maps.default) {
                this.mapStyle = maps.label;
            }
        });

        const placeLicense = this.auth.getModuleAccess('place');
        if (placeLicense && placeLicense['write']) {
            this.isPlacesCreateAllowed = true;
        }

        this.selectedMapStyle = this.mapStyle;
        this.iconColor = this.themeSettings['color_sets']['primary']['base'];
        this.mapPopup = MapboxFactory.produce(MapboxFactoryEnum.POPUP, {});
        setTimeout(() => {
            this.initializeMap();
            this.baseLayersIns = new BaseLayers(this.map, this.cdRef);
        }, 50);
        const selfReferance = this;
        this.poiMapPoup = function (e) {
            selfReferance.buildPopup(
                e,
                0,
                selfReferance.map,
                selfReferance.mapPopup,
                'poiPointLayer'
            );
        };
        this.poiMapGrayedPoup = function (e) {
            selfReferance.buildPopup(
                e,
                0,
                selfReferance.map,
                selfReferance.mapPopup,
                'grayed_frames_panel'
            );
        };
        this.userData = JSON.parse(localStorage.getItem('user_data'));
        if (typeof this.userData['layers'] !== 'undefined') {
            this.mapLayers = this.userData['layers'];
            if (typeof this.userData['layers']['center'] !== 'undefined') {
                this.mapCenter = this.userData['layers']['center'];
            }
            if (typeof this.userData['layers']['bounds'] !== 'undefined') {
                this.mapBounds = this.userData['layers']['bounds'];
            }
        }

        this.placeFilterService.getFilterSidenav().subscribe((data) => {
            this.filterOpenDetails = data;
            if (data) {
                this.isPlaceFilterOpen = data.open;
            }
            this.openFilter = data.open;
        });

        this.placeFilterService
            .getFilterLevelState()
            .pipe(takeWhile(() => this.unSubscribe))
            .subscribe((data) => {
                setTimeout(() => {
                    if (
                        this.filterOpenDetails &&
                        this.filterOpenDetails['tab'] === 'myPlaces'
                    ) {
                        this.filterLevel = data[1] && data[1];
                    } else {
                        this.filterLevel = data[0] && data[0];
                    }
                    this.placeFilterService.savePlacesSession(
                        'filterLevelState',
                        data
                    );
                }, 300);
            });

        this.popupDistributor = (e) => {
            let f = [];
            /** Marker outside click clear the place marker */
            this.clearPlaceMarker();
            /* f = this.map.queryRenderedFeatures(e.point, {layers: ['poiPolygonLayer']});
      if (f.length) {
        this.poiPolygonZoom(e);
        return;
      }*/
            // f = this.map.queryRenderedFeatures(e.point, {layers: ['poiPointHash5Layer']});
            // if (f.length) {
            //   // this.loadPOIPopup(e);
            //   return;
            // }
            // const  hash6 = this.map.queryRenderedFeatures(e.point, {layers: ['poiPointHash6Layer']});
            if (this.layerInventorySetLayers.length > 0) {
                for (
                    let i = this.layerInventorySetLayers.length - 1;
                    i >= 0;
                    i--
                ) {
                    // for (let i = 0; i < this.layerInventorySetLayers.length; i++) {
                    f = this.map.queryRenderedFeatures(e.point, {
                        layers: [this.layerInventorySetLayers[i]]
                    });
                    if (f.length) {
                        if (
                            this.layerInventorySetLayers[i].search(
                                'layerPlacesLayer'
                            ) > -1
                        ) {
                            this.loadPOIPopup(
                                e,
                                this.layerInventorySetLayers[i]
                            );
                        } else {
                            if (
                                this.layerInventorySetLayers[i].search(
                                    'placeLayer'
                                ) > -1
                            ) {
                                this.loadPOIPopup(
                                    e,
                                    this.layerInventorySetLayers[i]
                                );
                            }
                        }
                        return;
                    }
                }
            }

            f = this.map.queryRenderedFeatures(e.point, {
                layers: ['poiPointLayer']
            });
            if (f.length) {
                this.loadPOIPopup(e);
                return;
            }

            f = this.map.queryRenderedFeatures(e.point, {
                layers: ['nationalWideBubble']
            });
            if (f.length) {
                this.nationalBubbleZoom(f);
                return;
            }
        };
        this.loadPOIPopup = (e, layer = 'poiPointLayer') => {
            this.buildPopup(e, 0, this.map, this.mapPopup, layer);
        };
        this.nationalBubbleZoom = (e) => {
            this.map.flyTo({
                center: e[0].geometry.coordinates,
                zoom: this.mapLayers['hash5']['minzoom']
            });
        };
        this.poiPolygonZoom = (e) => {
            this.map.flyTo({ center: e[0].geometry.coordinates, zoom: 12 });
        };
        this.draw = new MapboxDraw({
            displayControlsDefault: false,
            styles: this.commonService.getStylesData(),
            modes: Object.assign(
                {
                    draw_radius: RadiusMode
                },
                MapboxDraw.modes
            )
        });

        this.layersService
            .getApplyLayers()
            .pipe(takeWhile(() => this.unSubscribe))
            .subscribe((value) => {
                if (value['type'] === 'primary') {
                    this.applyLayerObservable.next({
                        type: value['type'],
                        mapId: 'map-area',
                        flag: value['flag']
                    });
                    if (value['flag']) {
                        this.clearLayerView(false);
                        this.layersService.cleanUpMap(this.map);
                        this.applyViewLayers();
                    } else {
                        this.clearLayerView();
                    }
                } else {
                    this.openSecondaryMap(value);
                }
            });

        this.placeDataService
            .onMapLoad()
            .pipe(takeWhile(() => this.unSubscribe))
            .subscribe((event) => {
                if (event) {
                    this.setMapPosition();
                }
            });

        this.mapService
            .getMapProperties()
            .pipe(takeWhile(() => this.unSubscribe))
            .subscribe((properties) => {
                if (this.map && properties && Object.keys(properties).length) {
                    if (
                        properties.mapName !== 'primaryMap' &&
                        !this.mapService.isMapSync
                    ) {
                        this.mapService.isMapSync = true;
                        this.map.setCenter(properties.center);
                        this.map.setZoom(properties.zoom);
                        this.map.setPitch(properties.pitch);
                        this.map.setBearing(properties.bearing);
                        this.mapService.isMapSync = false;
                    }
                }
            });
      
       /** Check place create access */
      if(this.isPlacesCreateAllowed) {
        this.initializePlaceCreate();
      }

      Helper.themeRender('intermx-theme-old');
    }

  initializePlaceCreate() {

    this.placeFilterService.getPlaceAudit()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe((response) => {
        /** Clear the create place marker */
        this.clearConfirmPopup();
        this.clearPlaceMarker();
      });

    this.placeFilterService.getCreateNewPlace().pipe(takeWhile(() => this.unSubscribe))
      .subscribe(data => {
        if(data && !data['open']) {
          this.clearConfirmPopup();
          this.clearPlaceMarker();
          if(data?.success){
            this.createNewPlacemarker(data['success']);
          }
        }
    });
  }
  
  // Create New place marker
  private createNewPlacemarker(data) {
    if(data?.data?.place_id) {
      this.getPlaceCoordinates(data['data']['place_id']).subscribe( coordinates => {
        // remove user clicked marker
        this.marker.remove();
        // create new marker in that place
        const element = document.createElement('div');
        element.className = 'place-create-marker icon icon-place';
        const marker = new mapboxgl.Marker(element);
        marker.setLngLat(coordinates).addTo(this.map);
        this.snackBar.open(
          'User defined Place created successfully.',
          '',
          {
              duration: 2000
          }
          );
      });
    }
  }

  openSecondaryMap(value) {
    if (value['flag']) {
      this.enableSecondaryMap = true;
      const secondaryLayers = this.layersService.getlayersSession(value['type']);
      if (secondaryLayers) {
        this.exploreDataService.setMapViewPositionState('secondaryMapView');
        this.mapService.isDualMapSyncEnabled = false;
        if (secondaryLayers && secondaryLayers['display'] && secondaryLayers['display']['syncZoomPan']) {
          this.mapService.isDualMapSyncEnabled = secondaryLayers['display']['syncZoomPan'];
         }
       }
     }
        if (value['closeTab']) {
            this.enableSecondaryMap = false;
            /** Need to removed once explore move to common */
            this.exploreDataService.setMapViewPositionState('inventoryView');
            this.dynamicResize();
        }
    }

    public calculateMapWidth(event) {
        if (this.enableSecondaryMap) {
            this.mapWidth = this.dimensionsDetails.windowWidth - 40 - event;
        }
        setTimeout(() => {
            this.map.resize({ mapResize: true });
        }, 200);
    }

    /** layerDisplayOptions Changes*/
    layerChanges(event) {
        if (event) {
            this.layerDisplayOptions = event;
        }
    }

    ngOnDestroy() {
        this.unSubscribe = false;
        if (this.isPlacesCreateAllowed) {
            this.map.off('contextmenu');
        }
        Helper.themeRender('intermx-theme-old');
    }
    initializeMap() {
        mapboxgl.accessToken = environment.mapbox.access_token;
        this.map = new mapboxgl.Map({
            container: 'mapbox',
            style: this.commonService.getMapStyle(
                this.baseMaps,
                this.selectedMapStyle
            )['uri'],
            minZoom: 2,
            maxZoom: 16,
            preserveDrawingBuffer: true,
            center: this.mapCenter, // starting position
            zoom: 3 // starting zoom
        });
        this.exploreDataService.setMapObject(this.map);
        this.map.dragRotate.disable();
        this.map.touchZoomRotate.disableRotation();
        this.map.addControl(new LocateMeControl(), 'bottom-left');
        this.map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true
            }),
            'bottom-left'
        );
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-left');
        setTimeout(() => {
            this.commonService.locateMePrimaryMap();
        }, 100);
        this.map.on('style.load', () => {
            this.loadLayers();
        });
        this.map.on('load', () => {
            this.setMapPosition();
        });

        this.map.on('move', (e) => {
            const mapProperties: MapProperties = {
                center: this.map.getCenter(),
                zoom: this.map.getZoom(),
                pitch: this.map.getPitch(),
                bearing: this.map.getBearing(),
                mapName: 'primaryMap'
            };
            if (
                !this.mapService.isMapSync &&
                this.mapService.isDualMapSyncEnabled
            ) {
                this.mapService.setMapProperties(mapProperties);
            }
        });

        if (this.isPlacesCreateAllowed) {
            this.map.on('contextmenu', (e) => {
                this.createNewPlaceMarker(e);
            });
        }
    }

    /** Create place */
    createNewPlaceMarker(e) {
        if (e && e.lngLat) {
            this.marker.remove();
            const lngLat = [e.lngLat['lng'], e.lngLat['lat']];
            const el = document.createElement('div');
            const content = document.createElement('div');
            content.innerHTML = `
        <p>Are you sure you want to create a new places?</p>
        <div class='btn-create-place'> <button class='button-secondary' id='btnPlaceCancel'> Cancel </button> <button class='button-primary' id='btnPlaceCreate'> Yes,Create </button></div>`;
            el.className = 'place-create-marker icon icon-place';
            this.marker = new mapboxgl.Marker(el);
            this.marker.setDraggable(true);
            this.marker.setLngLat(lngLat).addTo(this.map);
            this.marker.on('dragend', this.updatePlaceCoordinates.bind(this));
            this.placeLatLong = lngLat;
            this.mapPopup
                .setLngLat(lngLat)
                .setDOMContent(content)
                .addTo(this.map);
            content.parentNode.parentNode['className'] += ' place-create-popup';
      this.setActions();
      }

  }

/**
 * update the placemarket and popup position
 */
  private updatePlaceCoordinates() {
    const position = this.marker.getLngLat();
    this.placeLatLong = [position['lng'], position['lat']];
    this.mapPopup
            .setLngLat(this.placeLatLong);
  }

  setActions() {
    const self = this;
    document.getElementById('btnPlaceCancel').addEventListener('click', function(e) {
      self.clearPlaceMarker();
      self.clearConfirmPopup();
    }, false);

    document.getElementById('btnPlaceCreate').addEventListener('click', function(e) {
      self.createNewPlace();
    }, false);
  }

  /** clear market & popup */
  clearPlaceMarker() {
    this.marker.remove();
  }
  clearConfirmPopup() {
    if (this.mapPopup.isOpen()) {
      this.mapPopup.remove();
    }
  }

  /** create a new user defined plase */
  createNewPlace() {
    const placeData = {
      open: true,
      latlng: this.placeLatLong
    };
    this.placeFilterService.setCreateNewPlace(placeData)
    this.clearConfirmPopup();
  }



    private getPlaceCoordinates(placeId: string): Observable<any> {
        return this.placeFilterService.getAuditedPlaceByID(placeId).pipe(
            map((place) => {
                if (place?.place?.nav_geometry?.coordinates?.length) {
                    return place.place.nav_geometry.coordinates;
                }
                // if API data doesn't have lat/lang, use local lat/long
                return this.placeLatLong;
            }),
            catchError((error) => {
                // if retrieving data from API has failed, use local lat/long
                return of(this.placeLatLong);
            })
        );
    }

    loadLayers() {
        // this.setMapPosition();
        this.map.on('zoom', () => {
            this.zoomLevel = this.map.getZoom();
        });
        this.map.addSource('nationalWideData', {
            type: 'geojson',
            data: this.nationalWideData
        });
        this.map.addSource('poiPolygons', {
            type: 'vector',
            url: 'mapbox://intermx.3453kd6z'
        });
        this.map.addSource('poiPoints', {
            type: 'vector',
            url: 'mapbox://intermx.bwhq804q'
        });

        this.map.addLayer({
            id: 'nationalWideBubble',
            type: 'circle',
            source: 'nationalWideData',
            minzoom: 0,
            maxzoom: 6,
            layer: {
                visibility: 'visible'
            },
            paint: {
                'circle-opacity': 0.6,
                'circle-color': this.iconColor,
                'circle-radius': ['get', 'radius']
            }
        });
        this.map.addLayer({
            id: 'nationalWideCount',
            type: 'symbol',
            source: 'nationalWideData',
            minzoom: 0,
            maxzoom: 6,
            // filter: ['>', 'radius', 10],
            layout: {
                visibility: 'none',
                'text-field': '{count}',
                'text-font': [
                    'Product Sans Regular',
                    'Open Sans Regular',
                    'Arial Unicode MS Regular'
                ],
                'text-size': ['step', ['get', 'radius'], 9, 15, 12, 25, 24]
            },
            paint: {
                'text-color': '#ffffff'
            }
        });
        this.map.addLayer({
            id: 'poiPolygonLayer',
            type: 'fill',
            // source: 'poiPolygons',
            // 'source-layer': 'poi_polys',
            // minzoom: 0,
            // maxzoom: 12,
            // layout: {
            //   'visibility': 'none',
            // },
            source: {
                type: 'vector',
                url: this.mapLayers['placePolys']['url']
            },
            'source-layer': this.mapLayers['placePolys']['source-layer'],
            minzoom: this.mapLayers['placePolys']['minzoom'],
            maxzoom: this.mapLayers['placePolys']['maxzoom'],
            paint: {
                'fill-opacity': {
                    base: 0.5,
                    stops: [
                        [9, 0.5],
                        [12, 0.3]
                    ]
                },
                'fill-color': this.iconColor
            }
        });
        /* this.map.on('mouseenter', 'poiPolygonLayer', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'poiPolygonLayer',  () => {
      self.map.getCanvas().style.cursor = '';
    }); */
        this.map.addLayer({
            id: 'poiPointHash5Layer',
            type: 'circle',
            // source: 'poiPoints',
            // 'source-layer': 'poi_points',
            // minzoom: 12,
            source: {
                type: 'vector',
                url: this.mapLayers['hash5']['url']
            },
            'source-layer': this.mapLayers['hash5']['source-layer'],
            minzoom: this.mapLayers['hash5']['minzoom'],
            maxzoom: this.mapLayers['hash5']['maxzoom'],
            layout: {
                visibility: 'none'
            },
            paint: {
                'circle-radius': {
                    base: 3,
                    stops: [
                        [6, 4],
                        [8, 5],
                        [10, 6]
                    ]
                },
                'circle-color': this.iconColor
            }
        });
        /* Hiding this as per Matthew's suggestion (24-04-2019)
    /* this.map.on('mouseenter', 'poiPointHash5Layer', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'poiPointHash5Layer',  () => {
      self.map.getCanvas().style.cursor = '';
    }); */
        this.map.addLayer({
            id: 'poiPointHash6Layer',
            type: 'circle',
            source: {
                type: 'vector',
                url: this.mapLayers['hash6']['url']
            },
            'source-layer': this.mapLayers['hash6']['source-layer'],
            minzoom: this.mapLayers['hash6']['minzoom'],
            maxzoom: this.mapLayers['hash6']['maxzoom'],
            /* layout: {
        'visibility': 'none',
      }, */
            paint: {
                'circle-radius': {
                    base: 3,
                    stops: [
                        [6, 4],
                        [8, 5],
                        [10, 6]
                    ]
                },
                'circle-color': this.iconColor
            }
        });
        /* this.map.on('mouseenter', 'poiPointHash6Layer', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'poiPointHash6Layer',  () => {
      self.map.getCanvas().style.cursor = '';
    }); */

        this.map.addLayer({
            id: 'poiPointLayer',
            type: 'circle',
            // source: 'poiPoints',
            // 'source-layer': 'poi_points',
            // minzoom: 12,
            source: {
                type: 'vector',
                url: this.mapLayers['placePoints']['url']
            },
            'source-layer': this.mapLayers['placePoints']['source-layer'],
            minzoom: this.mapLayers['placePoints']['minzoom'],
            maxzoom: this.mapLayers['placePoints']['maxzoom'],
            paint: {
                // 'circle-opacity': 0.8,
                // 'circle-radius': 3,
                'circle-radius': {
                    base: 3,
                    stops: [
                        [6, 4],
                        [8, 5],
                        [10, 6]
                    ]
                },
                'circle-color': this.iconColor
            }
        });
        this.map.addLayer({
            id: 'poiStarLayer',
            type: 'symbol',
            source: 'poiPoints',
            'source-layer': 'poi_points',
            minzoom: 3,
            layout: {
                visibility: 'none',
                'text-line-height': 1,
                'text-padding': 0,
                'text-anchor': 'bottom',
                'text-allow-overlap': true,
                'text-field': 'j',
                'text-offset': [0, 0.7],
                'icon-optional': true,
                'text-font': ['imx-map-font-43 Regular'],
                'text-size': 20
            },
            paint: {
                'text-translate-anchor': 'viewport',
                'text-color': this.iconColor
            }
        });

        this.map.on('mouseenter', 'poiPointLayer', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', 'poiPointLayer', () => {
            this.map.getCanvas().style.cursor = '';
        });
        this.map.on('click', this.popupDistributor);

        // Layers and Sources for polygons
        this.map.addSource('polygonData', {
            type: 'geojson',
            data: this.polygonData
        });

        this.map.addLayer({
            id: 'customPolygon',
            type: 'fill',
            source: 'polygonData',
            paint: {
                'fill-opacity': 0.01,
                'fill-color': this.themeSettings.color_sets.highlight.base
            }
        });

        this.map.addLayer({
            id: 'customPolygonStroke',
            type: 'line',
            source: 'polygonData',
            paint: {
                'line-opacity': 0.8,
                'line-color': this.themeSettings.color_sets.highlight.base,
                'line-width': 2
            }
        });
        // self.map.on('click', 'poiPointLayer', self.poiMapPoup);
        this.map.on('moveend', (e) => {
            if (!e.mapResize) {
                if (e.polygonData) {
                    this.placeFilterService.savePlacesSession(
                        'mapPosition',
                        e.polygonData
                    );
                } else {
                    if (e.eventType && e.eventType === 'default') {
                        this.placeFilterService.savePlacesSession(
                            'mapPosition',
                            this.mapService.getMapBoundingBox(
                                this.map,
                                true,
                                this.mapBounds
                            )
                        );
                    } else {
                        this.placeFilterService.savePlacesSession(
                            'mapPosition',
                            this.mapService.getMapBoundingBox(
                                this.map,
                                false,
                                this.mapBounds
                            )
                        );
                    }
                }
            }
        });
        this.onPushNationalData(this.filteredData);
        this.bindRender();
        this.layersService.mapLoaded(true);
    }
    bindRender() {
        this.map.on('render', (e) => {
            clearTimeout(this.keyLegendsTimeer);
            this.keyLegendsTimeer = setTimeout(() => {
                const layerSession = this.layersService.getlayersSession(
                    this.layerType
                );
                this.placeDataService.generateKeyLegends(
                    this.map,
                    layerSession,
                    this.mapStyle,
                    this.zoomLevel
                );
            }, 500);
        });
    }
    buildPopup(e, i = 0, mapobj, popup, layer) {
        $('.mapboxgl-popup-content').removeClass('open_inventory_popup');
        $('.map-div').removeClass('opened_detailed_popup');
        this.features = mapobj.queryRenderedFeatures(e.point, {
            layers: [layer]
        });
        const feature = this.features[i];
        this.current_page = i;
        this.current_e = e;
        if (popup.isOpen()) {
            popup.remove();
        }
        this.popupOpenType = 'map';
        const place = {};
        let safegraphPlaceId = feature?.properties?.ids?.safegraph_place_id ?? undefined;
        if (typeof feature?.properties?.ids == 'string') {
            let ids = JSON.parse(feature?.properties?.ids);
            safegraphPlaceId = ids?.safegraph_place_id;
        } else if(feature?.properties?.safegraph_place_id){
            safegraphPlaceId = feature?.properties?.safegraph_place_id;
        }
        place['safegraph_place_id'] = safegraphPlaceId;
        place['geometry'] = feature.geometry;
        this.setPopupHTML(mapobj, popup, place);
    }
    setPopupHTML(mapobj, popup, feature, openType = 'map') {
        if (this.poiDetailAPICall !== null) {
            this.poiDetailAPICall.unsubscribe();
        }
        const place_id = feature['safegraph_place_id'];
        setTimeout(() => {
            popup
                .setLngLat(feature.geometry.coordinates.slice())
                .setHTML(
                    '<div class="placePopup"><div id="loader"></div></div>'
                )
                .addTo(mapobj);
            if (this.mapStyle !== 'light') {
                if (!$('.mapboxgl-popup-content').hasClass('hide-shadow')) {
                    $('.mapboxgl-popup-content').addClass('hide-shadow');
                }
            } else {
                $('.mapboxgl-popup-content').removeClass('hide-shadow');
            }
            this.poiDetailAPICall = this.placeFilterService
                .getDetailOfSinglePoi(place_id, 'Last Year, Last Month', true)
                .pipe(
                    map((data) => data['data']),
                    takeWhile(() => this.unSubscribe)
                )
                .subscribe((data) => {
                    this.selectedValue = 'Last Year, Last Month';
                    const htmlContent = this.getPopupHTML(data, openType);
                    this.popUpData = data;
                    setTimeout(() => {
                        popup
                            .setLngLat(feature.geometry.coordinates.slice())
                            .setHTML(htmlContent.innerHTML)
                            .addTo(mapobj);
                        this.loadFunction(popup, mapobj, feature);
                    }, 100);
                });
        }, 100);
    }

    openRequestAudit(feature, type = 'map', page = 'overview') {
        const prop = feature;
        prop['length'] = this.features.length;
        prop['type'] = type;
        const i = this.current_page + 1;
        prop['current'] = i;
        prop['popupStatus'] = this.allowPlace;
        if (this.allowPlace !== 'hidden') {
            if (this.mapPopup.isOpen()) {
                this.mapPopup.remove();
            }
            const ref = this.dialog.open(RequestAuditDialogComponent, {
                data: { placeDetail: prop },
                width: '1250px',
                backdropClass: 'hide-backdrop',
                disableClose: true,
                panelClass: 'request-audit-dialog'
            });
            ref.afterClosed().subscribe((res) => {
                if (res === 'detailsSheet') {
                    this.openDetailedSheetPopup(
                        this.mapPopup,
                        this.map,
                        feature,
                        'detail'
                    );
                }
            });
        }
    }

    getSafeGraphID(feature) {
        let safegraphPlaceId = feature?.properties?.ids?.safegraph_place_id ?? undefined;
        if (typeof feature?.properties?.ids == 'string') {
            let ids = JSON.parse(feature?.properties?.ids);
            safegraphPlaceId = ids?.safegraph_place_id;
        } else if(feature?.properties?.safegraph_place_id){
            safegraphPlaceId = feature?.properties?.safegraph_place_id;
        }
        return safegraphPlaceId;
    }

    getPopupHTML(feature, type = 'map', page = 'overview') {
        const prop = feature;
        prop['length'] = this.features.length;
        prop['type'] = type;
        const i = this.current_page + 1;
        prop['current'] = i;
        prop['popupStatus'] = this.allowPlace;
        let description;
        if (this.allowPlace !== 'hidden') {
            if (page === 'detail' || page === 'originaldetail') {
                prop['sampleData'] = page === 'detail' ? false : true;
                description = this.dynamicComponentService.injectComponent(
                    PlacesDetailPopupComponent,
                    (x) => (x.placeDetail = prop)
                );
            } else if (page === 'statistic') {
                description = this.dynamicComponentService.injectComponent(
                    PlacesStatisticPopupComponent,
                    (x) => (x.placeDetail = prop)
                );
            } else {
                description = this.dynamicComponentService.injectComponent(
                    PlacesPopupComponent,
                    (x) => (x.placeDetail = prop)
                );
            }
        } else {
            description = this.dynamicComponentService.injectComponent(
                PlacesSimplePopupComponent,
                (x) => (x.placeDetail = prop)
            );
        }
        return description;
    }
    next(popup, mapObj) {
        let i = this.current_page + 1;
        if (i >= this.features.length) {
            i = 0;
        }
        if (this.current_page !== i) {
            this.current_page = i;
            const feature = this.features[i];
            const place = {};            
            place['safegraph_place_id'] = this.getSafeGraphID(feature);
            place['geometry'] = feature.geometry;
            this.setPopupHTML(mapObj, popup, place, this.popupOpenType);
        }
    }

    prev(popup, mapObj) {
        let i = this.current_page - 1;
        const len = this.features.length;
        if (i < 0) {
            i = this.features.length - 1;
        }
        if (this.current_page !== i) {
            this.current_page = i;
            const feature = this.features[i];
            const place = {};
            place['safegraph_place_id'] = this.getSafeGraphID(feature);                
            place['geometry'] = feature.geometry;
            this.setPopupHTML(mapObj, popup, place, this.popupOpenType);
        }
        // const description = this.getPopupHTML(feature);
        // popup.setHTML(description);
        // this.loadFunction(popup, map, feature);
    }
    openDetailedSheetPopup(popup, mapobj, feature, page = 'detail') {
        if (this.poiDetailAPICall !== null) {
            this.poiDetailAPICall.unsubscribe();
        }
        setTimeout(() => {
            popup
                .setHTML(
                    '<div class="placePopup"><div id="loader"></div></div>'
                )
                .addTo(mapobj);
            if (this.mapStyle !== 'light') {
                if (!$('.mapboxgl-popup-content').hasClass('hide-shadow')) {
                    $('.mapboxgl-popup-content').addClass('hide-shadow');
                }
            } else {
                $('.mapboxgl-popup-content').removeClass('hide-shadow');
            }
            const htmlContent = this.getPopupHTML(
                this.popUpData,
                this.popupOpenType,
                page
            );
            setTimeout(() => {
                popup.setHTML(htmlContent.innerHTML).addTo(mapobj);
                if (page === 'detail') {
                    $('#selectPeriod').val(this.selectedValue);
                } else {
                    $('#selectStatsPeriod').val(this.selectedValue);
                }
                this.loadFunction(popup, mapobj, feature);
            }, 100);
        }, 100);
    }
    loadFunction(popup, mapObj, feature) {
        const self = this;
        const next = document.getElementsByClassName('next');
        if (next.length) {
            next[0].addEventListener(
                'click',
                function (e) {
                    self.next(popup, mapObj);
                },
                false
            );
        }
        const prev = document.getElementsByClassName('prev');
        if (prev.length) {
            prev[0].addEventListener(
                'click',
                function (e) {
                    self.prev(popup, mapObj);
                },
                false
            );
        }
        const detailSheetBtn = document.getElementsByClassName(
            'detailSheetBtn'
        );
        if (detailSheetBtn.length) {
            detailSheetBtn[0].addEventListener(
                'click',
                function (e) {
                    document
                        .getElementsByClassName('map-div')[0]
                        .classList.add('opened_detailed_popup');
                    document
                        .getElementsByClassName('mapboxgl-popup-content')[0]
                        .classList.add('open_inventory_popup');
                    self.openDetailedSheetPopup(
                        popup,
                        mapObj,
                        feature,
                        'detail'
                    );
                },
                false
            );
        }
        const sampleStatisticsBtn = document.getElementById(
            'sampleStatisticsBtn'
        );
        if (sampleStatisticsBtn) {
            sampleStatisticsBtn.addEventListener(
                'click',
                function (e) {
                    document
                        .getElementsByClassName('map-div')[0]
                        .classList.add('opened_detailed_popup');
                    document
                        .getElementsByClassName('mapboxgl-popup-content')[0]
                        .classList.add('open_inventory_popup');
                    self.openDetailedSheetPopup(
                        popup,
                        mapObj,
                        feature,
                        'statistic'
                    );
                },
                false
            );
        }
        const moreAndLessBtn = document.getElementById('moreAndLessBtn');
        if (moreAndLessBtn) {
            moreAndLessBtn.addEventListener(
                'click',
                function (e) {
                    self.loadMoreChild = !self.loadMoreChild;
                    if (self.loadMoreChild) {
                        moreAndLessBtn.innerHTML = 'Fewer Items';
                        document
                            .getElementsByClassName('arrow-down')[0]
                            .classList.add('display-show-and-less');
                        document
                            .getElementsByClassName('arrow-up')[0]
                            .classList.remove('display-show-and-less');
                        document
                            .getElementById('show-and-less-live')
                            .classList.remove('show-more-filter');
                    } else {
                        moreAndLessBtn.innerHTML = 'More Items';
                        document
                            .getElementsByClassName('arrow-down')[0]
                            .classList.remove('display-show-and-less');
                        document
                            .getElementsByClassName('arrow-up')[0]
                            .classList.add('display-show-and-less');
                        document
                            .getElementById('show-and-less-live')
                            .classList.add('show-more-filter');
                    }
                },
                false
            );
        }
        const moreAndLessBtnVisitorsWork = document.getElementById(
            'moreAndLessBtnVisitorsWork'
        );
        if (moreAndLessBtnVisitorsWork) {
            moreAndLessBtnVisitorsWork.addEventListener(
                'click',
                function (e) {
                    self.loadMoreChildVisitorsWork =
                        self.loadMoreChildVisitorsWork;
                    if (self.loadMoreChildVisitorsWork) {
                        moreAndLessBtnVisitorsWork.innerHTML = 'Fewer Items';
                        document
                            .getElementsByClassName(
                                'arrow-down-visitors-work'
                            )[0]
                            .classList.add('display-show-and-less');
                        document
                            .getElementsByClassName('arrow-up-visitors-work')[0]
                            .classList.remove('display-show-and-less');
                        document
                            .getElementById('show-and-less-work')
                            .classList.remove('show-more-filter');
                    } else {
                        moreAndLessBtnVisitorsWork.innerHTML = 'More Items';
                        document
                            .getElementsByClassName(
                                'arrow-down-visitors-work'
                            )[0]
                            .classList.remove('display-show-and-less');
                        document
                            .getElementsByClassName('arrow-up-visitors-work')[0]
                            .classList.add('display-show-and-less');
                        document
                            .getElementById('show-and-less-work')
                            .classList.add('show-more-filter');
                    }
                },
                false
            );
        }
        const requestAuditBtn = document.getElementById('requestAuditBtn');
        if (requestAuditBtn) {
            requestAuditBtn.addEventListener(
                'click',
                function (e) {
                    document
                        .getElementsByClassName('map-div')[0]
                        .classList.add('opened_detailed_popup');
                    document
                        .getElementsByClassName('mapboxgl-popup-content')[0]
                        .classList.add('open_inventory_popup');
                    self.openDetailedSheetPopup(
                        popup,
                        mapObj,
                        feature,
                        'originaldetail'
                    );
                },
                false
            );
        }
        const requestAuditLink = document.getElementsByClassName(
            'request-Audit-link'
        );
        Array.from(requestAuditLink).forEach(function (element) {
            element.addEventListener(
                'click',
                function (e) {
                    document
                        .getElementsByClassName('map-div')[0]
                        .classList.add('opened_detailed_popup');
                    document
                        .getElementsByClassName('mapboxgl-popup-content')[0]
                        .classList.add('open_inventory_popup');
                    self.openRequestAudit(
                        self.popUpData,
                        self.popupOpenType,
                        'requestAudit'
                    );
                },
                false
            );
        });

        const overviewBtn = document.getElementById('overviewBtn');
        if (overviewBtn) {
            overviewBtn.addEventListener(
                'click',
                function (e) {
                    document
                        .getElementsByClassName('map-div')[0]
                        .classList.remove('opened_detailed_popup');
                    const htmlContent = self.getPopupHTML(
                        self.popUpData,
                        self.popupOpenType
                    );
                    setTimeout(function () {
                        popup.setHTML(htmlContent.innerHTML).addTo(mapObj);
                        self.loadFunction(popup, mapObj, feature);
                    }, 100);
                },
                false
            );
        }
        const selectPeriod = document.getElementById('selectPeriod');
        if (selectPeriod) {
            selectPeriod.addEventListener(
                'change',
                function (e) {
                    let selected = '';
                    [].forEach.call(this, function (el) {
                        if (el.selected) {
                            selected = el.value;
                        }
                    });
                    self.detailSheet(
                        popup,
                        mapObj,
                        feature,
                        'detail',
                        selected
                    );
                },
                false
            );
        }
        const selectStatsPeriod = document.getElementById('selectStatsPeriod');
        if (selectStatsPeriod) {
            selectStatsPeriod.addEventListener(
                'click',
                function () {
                    let selected = '';
                    [].forEach.call(this, function (el) {
                        if (el.selected) {
                            selected = el.value;
                        }
                    });
                    self.detailSheet(
                        popup,
                        mapObj,
                        feature,
                        'statistic',
                        selected
                    );
                },
                false
            );
        }
        const placeList = document.getElementById('place_list');
        if (placeList) {
            placeList.addEventListener(
                'click',
                function (e) {
                    const $this = document.getElementById('show_menu').style
                        .display;
                    if ($this === 'none' || !$this) {
                        document.getElementById('show_menu').style.display =
                            'block';
                    } else {
                        document.getElementById('show_menu').style.display =
                            'none';
                    }
                },
                false
            );
        }
        const openSavePlaseSetDialogNew = document.getElementById(
            'e2e-openSavePlaseSetDialogNew'
        );
        if (openSavePlaseSetDialogNew) {
            openSavePlaseSetDialogNew.addEventListener(
                'click',
                function (e) {
                    self.onOpenSavePlaseSet(feature['safegraph_place_id']);
                    document.getElementById('show_menu').style.display = 'none';
                },
                false
            );
        }
        const openSaveToExistingPlaseSetNew = document.getElementById(
            'e2e-openSaveToExistingPlaseSetNew'
        );
        if (openSaveToExistingPlaseSetNew) {
            openSaveToExistingPlaseSetNew.addEventListener(
                'click',
                function (e) {
                    self.onOpenSaveToExistingPlaseSet(
                        feature['safegraph_place_id']
                    );
                    document.getElementById('show_menu').style.display = 'none';
                },
                false
            );
        }
        if (this.mapStyle !== 'light') {
            if (!$('.mapboxgl-popup-content').hasClass('hide-shadow')) {
                $('.mapboxgl-popup-content').addClass('hide-shadow');
            }
        } else {
            $('.mapboxgl-popup-content').removeClass('hide-shadow');
        }
    }
    private detailSheet(popup, mapObj, feature, type, selectedValue) {
        if (this.poiDetailAPICall !== null) {
            this.poiDetailAPICall.unsubscribe();
        }
        let safegraphPlaceId = feature?.properties?.ids?.safegraph_place_id ?? undefined;
        if (feature?.properties?.ids) {
            let ids = feature?.properties?.ids;
            safegraphPlaceId = ids?.safegraph_place_id;
        } else if(feature?.properties?.safegraph_place_id){
            safegraphPlaceId = feature?.properties?.safegraph_place_id;
        } else {
            safegraphPlaceId = feature?.safegraph_place_id
        }
        this.selectedValue = selectedValue;
        this.poiDetailAPICall = this.placeFilterService
            .getDetailOfSinglePoi(
                safegraphPlaceId,
                selectedValue,
                true
            )
            .pipe(
                map((data) => data['data']),
                takeWhile(() => this.unSubscribe)
            )
            .subscribe((data) => {
                this.popUpData = data;
                this.openDetailedSheetPopup(popup, mapObj, feature, type);
            });
    }

    openPanelPopup(place) {
        if (this.mapPopup.isOpen()) {
            this.mapPopup.remove();
        }
        let zoom = 15;
        if (this.map.getZoom() > 13) {
            zoom = this.map.getZoom();
        }
        this.popupOpenType = 'outside';
        const feature = {};
        feature['safegraph_place_id'] = place['ids']['safegraph_place_id'];
        feature['geometry'] = place['location']['point'];
        const coordinates = place['location']['point']['coordinates'];
        this.map.flyTo({ center: coordinates, zoom: zoom, animate: true });
        this.map.once('moveend', () => {
            this.setPopupHTML(this.map, this.mapPopup, feature, 'outside');
        });
    }
    zoomOutMap() {
        localStorage.removeItem('zoomPlace');
        this.map.fitBounds(
            this.mapBounds,
            { duration: 100 },
            { eventType: 'default' }
        );
    }
    hoverOnCard(place) {
        const poiStarDataSet = { type: 'FeatureCollection', features: [] };
        poiStarDataSet['features'][0] = place;
        if (poiStarDataSet !== undefined && this.map.getSource('poiStarData')) {
            this.map.setPaintProperty(
                'frameClustersStar',
                'icon-color',
                this.iconColor
            );
            this.map.getSource('poiStarData').setData(poiStarDataSet);
        }
        if (this.map.getLayer('poiStarLayer')) {
            this.map.setLayoutProperty('poiStarLayer', 'visibility', 'visible');
            this.map.setFilter('poiStarLayer', [
                '==',
                'safegraph_place_id',
                place['ids']['safegraph_place_id']
            ]);
        }
    }

    hoverOutOnCard() {
        if (this.map.getLayer('poiStarLayer')) {
            this.map.setLayoutProperty('poiStarLayer', 'visibility', 'none');
            this.map.setFilter('poiStarLayer', ['!=', 'safegraph_place_id', 0]);
        }
    }
    leaveOnCard() {
        const poiStarDataSet = { type: 'FeatureCollection', features: [] };
        if (poiStarDataSet !== undefined && this.map.getSource('poiStarData')) {
            this.map.getSource('poiStarData').setData(poiStarDataSet);
        }
    }

    dynamicResize() {
        this.mapWidth = this.dimensionsDetails.windowWidth - 40;
        setTimeout(() => {
            this.map.resize({ mapResize: true });
        }, 100);
    }
    onCloseFilter() {
        this.placeFilterService.savePlacesSession('selectedTab', {
            open: false,
            tab: this.filterOpenDetails['tab']
        });
        this.placeFilterService.setFilterSidenav({
            open: false,
            tab: this.filterOpenDetails['tab']
        });
    }

    onPushNationalData(data) {
        this.filteredData = data;
        if (
            data &&
            (typeof data['states'] === 'undefined' ||
                typeof data['ids'] === 'undefined')
        ) {
            if (this.map.getLayer('nationalWideBubble')) {
                this.map.setLayoutProperty(
                    'nationalWideBubble',
                    'visibility',
                    'none'
                );
            }
            if (this.map.getLayer('nationalWideCount')) {
                this.map.setLayoutProperty(
                    'nationalWideCount',
                    'visibility',
                    'none'
                );
            }
            if (this.map.getSource('nationalWideData')) {
                this.map
                    .getSource('nationalWideData')
                    .setData({ type: 'FeatureCollection', features: [] });
            }
            if (this.map.getLayer('poiPolygonLayer')) {
                // this.map.setLayoutProperty('poiPolygonLayer', 'visibility', 'visible');
                this.map.setLayerZoomRange(
                    'poiPolygonLayer',
                    this.mapLayers['placePolys']['minzoom'],
                    this.mapLayers['placePolys']['maxzoom']
                );
                this.map.setFilter('poiPolygonLayer', [
                    '!=',
                    'safegraph_place_id',
                    'null'
                ]);
            }
            if (this.map.getLayer('poiPointHash5Layer')) {
                this.map.setLayoutProperty(
                    'poiPointHash5Layer',
                    'visibility',
                    'none'
                );
            }
            if (this.map.getLayer('poiPointHash6Layer')) {
                this.map.setLayoutProperty(
                    'poiPointHash6Layer',
                    'visibility',
                    'none'
                );
            }
            if (this.map.getLayer('poiPointLayer')) {
                this.map.setFilter('poiPointLayer', [
                    '!=',
                    'safegraph_place_id',
                    'null'
                ]);
            }
            if (this.map.getLayer('poiPointHash5Layer')) {
                this.map.setFilter('poiPointHash5Layer', [
                    '!=',
                    'geohash',
                    'null'
                ]);
            }
            if (this.map.getLayer('poiPointHash6Layer')) {
                this.map.setFilter('poiPointHash6Layer', [
                    '!=',
                    'geohash',
                    'null'
                ]);
            }
            return true;
        } else if (data && data['states']) {
            let nationalData = { type: 'FeatureCollection', features: [] };
            if (data['states']['features']) {
                nationalData = this.formatUpNationalData(data['states']);
            }
            if (this.map.getLayer('nationalWideBubble')) {
                this.map.setLayoutProperty(
                    'nationalWideBubble',
                    'visibility',
                    'visible'
                );
            }
            if (this.map.getLayer('nationalWideCount')) {
                this.map.setLayoutProperty(
                    'nationalWideCount',
                    'visibility',
                    'visible'
                );
            }
            if (this.map.getLayer('poiPolygonLayer')) {
                // this.map.setLayoutProperty('poiPolygonLayer', 'visibility', 'visible');
                this.map.setLayerZoomRange(
                    'poiPolygonLayer',
                    this.mapLayers['hash5']['minzoom'],
                    this.mapLayers['placePolys']['maxzoom']
                );
            }
            if (this.map.getLayer('poiPointHash5Layer')) {
                this.map.setLayoutProperty(
                    'poiPointHash5Layer',
                    'visibility',
                    'visible'
                );
            }
            if (this.map.getLayer('poiPointHash6Layer')) {
                this.map.setLayoutProperty(
                    'poiPointHash6Layer',
                    'visibility',
                    'visible'
                );
            }
            /* if (this.map.getLayer('poiPointLayer')) {
        this.map.setLayoutProperty('poiPointLayer', 'visibility', 'visible');
        this.map.setFilter('poiPointLayer', data['ids']);
      } */
            if (this.map.getSource('nationalWideData')) {
                this.map.getSource('nationalWideData').setData(nationalData);
            }
        }
        if (data && data['ids']) {
            let filters = ['0'];
            if (data['ids']) {
                filters = [...data['ids']];
            }
            filters.unshift('in', 'safegraph_place_id');
            if (this.map.getLayer('poiPointLayer')) {
                this.map.setLayoutProperty(
                    'poiPointLayer',
                    'visibility',
                    'visible'
                );
                this.map.setFilter('poiPointLayer', filters);
            }
            if (this.map.getLayer('poiPolygonLayer')) {
                this.map.setFilter('poiPolygonLayer', filters);
            }
        }
        if (data && data['geohash5']) {
            let geohashFilters = ['0'];
            if (data['geohash5']) {
                geohashFilters = [...data['geohash5']];
            }
            geohashFilters.unshift('in', 'geohash');
            if (this.map.getLayer('poiPointHash5Layer')) {
                this.map.setLayoutProperty(
                    'poiPointHash5Layer',
                    'visibility',
                    'visible'
                );
                this.map.setFilter('poiPointHash5Layer', geohashFilters);
            }
        }
        if (data && data['geohash6']) {
            let geohashFilters = ['0'];
            if (data['geohash6']) {
                geohashFilters = [...data['geohash6']];
            }
            geohashFilters.unshift('in', 'geohash');
            if (this.map.getLayer('poiPointHash6Layer')) {
                this.map.setLayoutProperty(
                    'poiPointHash6Layer',
                    'visibility',
                    'visible'
                );
                this.map.setFilter('poiPointHash6Layer', geohashFilters);
            }
        }
    }
    formatUpNationalData(data) {
        data.features.sort(function (a, b) {
            return b.properties.count - a.properties.count;
        });
        // Top 2% with the largest circles, top 25% medium, bottom 75% small.
        for (let i = 0, len = data.features.length; i < len; i++) {
            if (Math.ceil((i / len) * 100) <= 2 || i <= 1) {
                data.features[i].properties['radius'] = 40; // 75;
            } else if (Math.ceil((i / len) * 100) <= 25 || i <= 3) {
                data.features[i].properties['radius'] = 20; // 45;
            } else {
                data.features[i].properties['radius'] = 10; // 25;
            }
        }
        return data;
    }

    private setMapPosition() {
        const placesSession = this.placeFilterService.getPlacesSession();
        if (placesSession && placesSession['mapPosition']) {
            const boundBox = bbox(placesSession['mapPosition']);
            this.map.fitBounds(
                boundBox,
                {},
                {
                    polygonData: placesSession['mapPosition'],
                    eventType: 'session'
                }
            );
        } else {
            this.map.fitBounds(
                this.mapBounds,
                { duration: 300 },
                { eventType: 'default' }
            );
        }
    }
    onChangeTab(eve) {
        this.currentTab = eve;
    }

    private closeSideNav() {
        const sidenavOptions = { open: false, tab: '' };
        this.placeFilterService.setFilterSidenav(sidenavOptions);
    }

    /**
     * This function is to draw the polygon based on market
     * @param polygon
     */
    public geoPolygon(polygonInfo) {
        this.closeSideNav();
        if (
            this.circularPolyDrawEnabled ||
            this.normalPolyDrawEnabled ||
            this.radiusPolyDrawEnabled
        ) {
            this.removeFeatures();
            this.removePolygon(false);
        }
        this.customPolygon.coordinates = [];
        this.geoPolygonEnabled = true;
        this.customPolygon.coordinates.push(
            [].concat.apply(
                [],
                polygonInfo['polygon']['geometry']['coordinates']
            )
        );
        this.customPolygonFeature.geometry = polygonInfo['polygon']['geometry'];
        this.polygonData.features.push(this.customPolygonFeature);
        this.togglePolygonLayerView(true);
        if (!polygonInfo['session']) {
            this.placeFilterService.savePlacesSession(
                'marketFeature',
                polygonInfo['polygon']
            );
            this.placeFilterService.setLocationFilter({
                region: this.customPolygon,
                type: 'filterLocationByMarket',
                market: polygonInfo['market']
            });
        }
    }

    /**
     * This function is to draw the polygon on map based on radius
     */
    public filterLocationsByRadius(polygonInfo) {
        this.closeSideNav();
        if (
            this.circularPolyDrawEnabled ||
            this.normalPolyDrawEnabled ||
            this.geoPolygonEnabled ||
            this.radiusPolyDrawEnabled
        ) {
            this.removePolygon(false);
        }
        if (polygonInfo.radius > 0) {
            this.polygonData = polygonInfo.featureCollection;
            this.customCenterPoint.coordinates =
                polygonInfo.polygon.coordinates;
            this.radiusPolyDrawEnabled = true;
            this.togglePolygonLayerView(true);
        }
        if (!polygonInfo['session']) {
            this.placeFilterService.savePlacesSession(
                'radiusPolyFeatureCollection',
                polygonInfo.featureCollection
            );
            this.placeFilterService.setLocationFilter({
                region: this.customCenterPoint,
                type: 'filterLocationByRadius',
                radius: polygonInfo.radius
            });
        }
    }
    /**
     * This function is to draw the normal polygon on map
     */
    public drawPolygon() {
        this.closeSideNav();
        if (
            this.circularPolyDrawEnabled ||
            this.radiusPolyDrawEnabled ||
            this.geoPolygonEnabled ||
            this.normalPolyDrawEnabled
        ) {
            this.removePolygon(true);
        }
        if (!this.map.getSource('mapbox-gl-draw-cold')) {
            this.map.addControl(this.draw);
        }
        this.normalPolyDrawEnabled = true;
        if (this.draw.getAll().features.length > 0) {
            this.draw.deleteAll();
        }
        this.polygonData.features = [];
        this.draw.changeMode('draw_polygon');
        this.map.on('draw.create', this.updateFiltersFromPolygon.bind(this));
        this.disableMapInteraction();
        this.togglePolygonLayerView(false);
    }
    /**
     * This function is to draw the circular polygon on map
     */
    public drawCircularPolygon() {
        this.closeSideNav();
        if (
            this.normalPolyDrawEnabled ||
            this.radiusPolyDrawEnabled ||
            this.geoPolygonEnabled
        ) {
            this.removePolygon(true);
        }
        if (!this.map.getSource('mapbox-gl-draw-cold')) {
            this.map.addControl(this.draw);
        }
        this.circularPolyDrawEnabled = true;
        if (this.draw.getAll().features.length > 0) {
            this.draw.deleteAll();
        }
        this.polygonData.features = [];
        this.customPolygonFeature.geometry = {
            type: 'Polygon',
            coordinates: []
        };
        this.draw.changeMode('draw_radius');
        this.map.on('draw.create', this.updateFiltersFromPolygon.bind(this));
        this.disableMapInteraction();
        this.togglePolygonLayerView(false);
    }

    /**
     * This function is to remove normal and circular polygons from map
     * @param updateMap Set to false if no need to clear the location filters
     */
    public removePolygon(updateMap = true) {
        this.togglePolygonLayerView(false);
        if (this.normalPolyDrawEnabled || this.circularPolyDrawEnabled) {
            if (this.map.getSource('mapbox-gl-draw-cold')) {
                this.draw.deleteAll();
                this.map.removeControl(this.draw);
                this.map.getContainer().classList.remove('mouse-add');
            }
            this.enableMapInteraction();
            if (this.normalPolyDrawEnabled) {
                this.normalPolyDrawEnabled = false;
            } else if (this.circularPolyDrawEnabled) {
                this.circularPolyDrawEnabled = false;
            }
            this.removeFeatures();
        }
        if (this.radiusPolyDrawEnabled) {
            this.customCenterPoint.coordinates = [];
            this.radiusPolyDrawEnabled = false;
            this.placeFilterService.savePlacesSession(
                'radiusPolyFeatureCollection',
                ''
            );
        }
        if (this.geoPolygonEnabled) {
            this.geoPolygonEnabled = false;
            this.placeFilterService.savePlacesSession('marketFeature', '');
            this.placeFilterService.savePlacesSession('selectedGeoMarket', '');
            this.removeFeatures();
        }
        this.placeFilterService.savePlacesSession('appliedPolygonType', '');
        if (updateMap) {
            this.placeFilterService.setLocationFilter({});
        }
    }

    private removeFeatures() {
        this.customPolygon.coordinates = [];
        this.customPolygonFeature.geometry = {
            type: 'Polygon',
            coordinates: []
        };
        this.polygonData.features = [];
    }
    /**
     * This function is to update map with new layers when drawing polygon is done
     * @param polygonFromSession
     */
    updateFiltersFromPolygon(polygonFromSession = {}) {
        if (
            ((this.normalPolyDrawEnabled || this.circularPolyDrawEnabled) &&
                this.draw.getAll().features.length > 0) ||
            polygonFromSession['appliedPolygonType']
        ) {
            this.customPolygon.coordinates = [];
            if (polygonFromSession['region']) {
                this.closeSideNav();
                this.customPolygon.coordinates.push(
                    [].concat.apply(
                        [],
                        polygonFromSession['region']['coordinates']
                    )
                );
                switch (polygonFromSession['appliedPolygonType']) {
                    case 'normalPolygon':
                        this.normalPolyDrawEnabled = true;
                        break;
                    case 'circularPolygon':
                        this.circularPolyDrawEnabled = true;
                        break;
                }
                this.customPolygonFeature.geometry =
                    polygonFromSession['region'];
                this.polygonData.features.push(this.customPolygonFeature);
            } else {
                let appliedPolygonType = '';
                if (this.circularPolyDrawEnabled) {
                    this.customPolygon.coordinates = [];
                    this.customPolygon.coordinates.push([
                        RadiusMode.circleCoordinates
                    ]);
                    this.customPolygonFeature.geometry.coordinates.push(
                        RadiusMode.circleCoordinates
                    );
                    this.polygonData.features.push(this.customPolygonFeature);
                    appliedPolygonType = 'circularPolygon';
                } else {
                    this.customPolygon.coordinates.push(
                        this.draw.getAll().features[0].geometry.coordinates
                    );
                    this.polygonData.features.push(
                        this.draw.getAll().features[0]
                    );
                    appliedPolygonType = 'normalPolygon';
                }
                this.placeFilterService.setLocationFilter({
                    region: this.customPolygon,
                    type: appliedPolygonType
                });
            }
            // enabling polygon layer view
            this.togglePolygonLayerView(true);

            if (!polygonFromSession['region']) {
                this.draw.deleteAll();
            }
            setTimeout(() => {
                this.enableMapInteraction();
            }, 200);
        }
    }

    /**
     * To turn on or off polygon layers
     * @param enable set value true or flase
     */
    private togglePolygonLayerView(enable = false) {
        if (!this.map.getSource('polygonData')) {
            return;
        }
        if (enable) {
            this.map.getSource('polygonData').setData(this.polygonData);
            this.map.setLayoutProperty(
                'customPolygon',
                'visibility',
                'visible'
            );
            this.map.setLayoutProperty(
                'customPolygonStroke',
                'visibility',
                'visible'
            );
        } else {
            const emptyData = Object.assign({}, this.polygonData);
            emptyData.features = [];
            this.map.getSource('polygonData').setData(emptyData);
            this.map.setLayoutProperty('customPolygon', 'visibility', 'none');
            this.map.setLayoutProperty(
                'customPolygonStroke',
                'visibility',
                'none'
            );
        }
    }

    /**
     * This function is to disable the map interactions while drawing a polygon
     */
    private disableMapInteraction() {
        if (this.enableMapInteractionFlag) {
            this.enableMapInteractionFlag = false;
            this.map['boxZoom'].disable();
            this.map['doubleClickZoom'].disable();
            this.map['scrollZoom'].disable();
            this.map.off('click', this.popupDistributor);
        }
    }

    /**
     * This function is to enable the map interactions when drawing a polygon is completed
     */
    enableMapInteraction() {
        if (!this.enableMapInteractionFlag) {
            this.enableMapInteractionFlag = true;
            this.map['boxZoom'].enable();
            this.map['doubleClickZoom'].enable();
            this.map['scrollZoom'].enable();
            this.map.on('click', this.popupDistributor);
        }
    }

    private applyViewLayers() {
        this.loaderService.display(true);
        const layersSession = this.layersService.getlayersSession(
            this.layerType
        );

        this.layersService.setClearLogoStyle({
            type: 'primary',
            flag: true
        });
        if (layersSession && layersSession['display']) {
            const mapStyle = layersSession['display']['baseMap'];
            this.style = this.commonService.getMapStyle(
                this.baseMaps,
                mapStyle
            );
            layersSession['display']['baseMap'] = this.style['label'];
            if (
                layersSession['display']['baseMap'] &&
                this.mapStyle !== layersSession['display']['baseMap']
            ) {
                if (this.mapPopup.isOpen()) {
                    this.mapPopup.remove();
                }
                this.mapStyle = layersSession['display']['baseMap'];
                this.selectedMapStyle = this.mapStyle;
                this.style = this.commonService.getMapStyle(
                    this.baseMaps,
                    this.mapStyle
                );
                this.map.setStyle(this.style['uri']);
                this.map.once('load', () => {
                    this.map.fitBounds(this.mapBounds);
                    this.map.setZoom(this.zoomLevel);
                });
            } else {
                if (
                    typeof layersSession['display']['mapControls'] !==
                    'undefined'
                ) {
                    this.showMapControls =
                        layersSession['display']['mapControls'];
                }
                if (
                    typeof layersSession['display']['mapLegend'] !== 'undefined'
                ) {
                    this.showMapLegends = layersSession['display']['mapLegend'];
                }
                // Need to uncomment when moved to service
                // if (this.mapObj.getLayer('grayed_frames_panel')) {
                //   if (!layersSession['display'].showUnselectedInventory) {
                //     this.mapObj.setLayoutProperty('grayed_frames_panel', 'visibility', 'none');
                //   } else {
                //     this.mapObj.setLayoutProperty('grayed_frames_panel', 'visibility', 'visible');
                //   }
                // }
                // if (this.mapObj.getLayer('mapLabel')) {
                //   if (!layersSession['display'].mapLabel) {
                //     this.mapObj.setLayoutProperty('mapLabel', 'visibility', 'none');
                //   } else {
                //     this.mapObj.setLayoutProperty('mapLabel', 'visibility', 'visible');
                //     const text = [];
                //     if (layersSession['display'].mapLabels['geopath spot IDs']) {
                //       text.push('{fid}');
                //     }
                //     if (layersSession['display'].mapLabels['operator spot IDs']) {
                //       text.push('{pid}');
                //     }
                //     if (layersSession['display'].mapLabels['place name']) {
                //       text.push('{opp}');
                //     }
                //     if (layersSession['display'].mapLabels['place address']) {
                //       text.push('{st}');
                //     }
                //     if (text.length > 0) {
                //       const value = text.join('\n');
                //       this.mapObj.setLayoutProperty('mapLabel', 'text-field', value);
                //     } else {
                //       this.mapObj.setLayoutProperty('mapLabel', 'visibility', 'none');
                //     }
                //   }
                // }
                if (layersSession['display']) {
                    if (layersSession['display']['screen']) {
                        this.mapWidthHeight =
                            layersSession['display']['screen'];
                    }
                }
                this.loadViewLayers();
            }
        }
        this.loaderService.display(false);
    }

    private clearLayerView(clearAll = true) {
        this.showMapControls = true;
        this.showMapLegends = true;
        this.isKeylegend = false;
        this.removeLayers();
        this.removeGeographyLayers();
        if (clearAll && this.mapStyle !== 'light') {
            if (this.mapPopup.isOpen()) {
                this.mapPopup.remove();
            }
            this.mapStyle = this.layersService.getDefaultMapStyle(
                this.baseMaps
            );
            this.style = this.commonService.getMapStyle(
                this.baseMaps,
                this.mapStyle
            );
            this.map.setStyle(this.style['uri']);
            this.map.once('style.load', () => {
                this.map.fitBounds(this.mapBounds);
                this.map.setZoom(this.zoomLevel);
            });
        }
    }

    loadViewLayers() {
        this.removeLayers();
        this.layerInventorySetLayers = [];
        this.layerInventorySetDataSets = [];
        this.GeoSetLayerIds = [];
        const layersSession = this.layersService.getlayersSession(
            this.layerType
        );
        if (
            layersSession &&
            layersSession['selectedLayers'] &&
            layersSession['selectedLayers'].length > 0
        ) {
            const geoLayerData = [];
            const geoMarkerIconData = [];
            for (
                let i = layersSession['selectedLayers'].length - 1;
                i >= 0;
                i--
            ) {
                const layerData = layersSession['selectedLayers'][i];
                switch (layerData.type) {
                    case 'inventory collection':
                        if (layerData.data['_id'] !== 'default') {
                            const mapLayerId =
                                'layerInventoryLayer' +
                                Date.now().toString(36) +
                                Math.random().toString(36).substr(2);
                            const mapLayerDataId =
                                'layerViewData' +
                                Date.now().toString(36) +
                                Math.random().toString(36).substr(2);
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
                                maxzoom:
                                    layerData['icon'] &&
                                    layerData['icon'] === 'icon-wink-pb-dig'
                                        ? 7
                                        : 17,
                                layout: {
                                    'text-line-height': 1,
                                    'text-padding': 0,
                                    'text-anchor': 'bottom',
                                    'text-allow-overlap': true,
                                    'text-field':
                                        (layerData['icon'] &&
                                            layerData['icon'] !==
                                                'icon-wink-pb-dig' &&
                                            this.markerIcon[
                                                layerData['icon']
                                            ]) ||
                                        this.markerIcon['icon-circle'],
                                    'icon-optional': true,
                                    'text-font': ['imx-map-font-43 Regular'],
                                    'text-size':
                                        layerData['icon'] === 'icon-wink-pb-dig'
                                            ? 10
                                            : 18,
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
                            layerData['data']['inventory'].map((inventory) => {
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
                            filters['measures_range_list'] = [
                                { type: 'imp', min: 0 }
                            ];
                            filters['page_size'] = 1000;

                            const inventoryRequests = [
                                this.inventoryService
                                    .getInventoriesWithAllData(filters)
                                    .pipe(catchError((error) => EMPTY))
                            ];

                            if (
                                layerData['data']['client_id'] &&
                                Number(layerData['data']['client_id']) ===
                                    Number(this.themeSettings.clientId)
                            ) {
                                inventoryRequests.push(
                                    this.inventoryService
                                        .getInventoryFromElasticSearch(
                                            this.inventoryService.prepareInventorySpotQuery(
                                                inventroyCustomIds
                                            )
                                        )
                                        .pipe(catchError((error) => EMPTY))
                                );
                            }
                            const colors = ['match', ['get', MapLayersInvetoryFields.MEDIA_TYPE_ID]];
                            const symbols = ['match', ['get', MapLayersInvetoryFields.MEDIA_TYPE_ID]];
                            this.inventoryGroups.map((media) => {
                                if (media.mtidPrint.length > 0) {
                                    symbols.push(
                                        media.mtidPrint,
                                        media.print['symbol']
                                    );
                                    colors.push(
                                        media.mtidPrint,
                                        media.colors[this.mapStyle]
                                    );
                                }
                                if (media.mtidDigital.length > 0) {
                                    symbols.push(
                                        media.mtidDigital,
                                        media.digital['symbol']
                                    );
                                    colors.push(
                                        media.mtidDigital,
                                        media.colors[this.mapStyle]
                                    );
                                }
                            });
                            if (this.inventoryGroups[2]) {
                                colors.push(
                                    this.inventoryGroups[2].colors[
                                        this.mapStyle
                                    ]
                                );
                                symbols.push(
                                    this.inventoryGroups[2].print['symbol']
                                );
                            }

                            forkJoin(inventoryRequests).subscribe(
                                (response) => {
                                    const data = [];
                                    if (
                                        response[0]['inventory_summary'][
                                            'inventory_items'
                                        ].length > 0
                                    ) {
                                        response[0]['inventory_summary'][
                                            'inventory_items'
                                        ].map((inventory) => {
                                            data.push({
                                                type: 'Feature',
                                                geometry:
                                                    inventory['location'][
                                                        'geometry'
                                                    ],
                                                properties: {
                                                    fid:
                                                        inventory.frame_id ||
                                                        '', // frame_id & spot_id both are equal
                                                    opp: this.layersService.getOperatorName(
                                                        inventory.representations
                                                    ),
                                                    pid:
                                                        inventory.plant_frame_id ||
                                                        ''
                                                }
                                            });
                                        });
                                    }
                                    if (response[1]) {
                                        const sourceData = this.inventoryService.formatSpotElasticData(
                                            response[1]
                                        );
                                        if (
                                            sourceData &&
                                            sourceData.length > 0
                                        ) {
                                            sourceData.map(
                                                (customSpotInventory) => {
                                                    const spot =
                                                        customSpotInventory[
                                                            'layouts'
                                                        ][0]['faces'][0][
                                                            'spots'
                                                        ][0];
                                                    data.push({
                                                        type: 'Feature',
                                                        geometry:
                                                            customSpotInventory[
                                                                'location'
                                                            ]['geometry'],
                                                        properties: {
                                                            fid:
                                                                customSpotInventory.id ||
                                                                '',
                                                            opp: this.layersService.getOperatorName(
                                                                customSpotInventory.representations
                                                            ),
                                                            pid:
                                                                (spot[
                                                                    'plant_spot_id'
                                                                ] &&
                                                                    spot[
                                                                        'plant_spot_id'
                                                                    ]) ||
                                                                customSpotInventory.plant_frame_id
                                                        }
                                                    });
                                                }
                                            );
                                        }
                                    }
                                    const inventoryCollectionData = {
                                        type: 'FeatureCollection',
                                        features: data
                                    };
                                    if (this.map.getSource(mapLayerDataId)) {
                                        this.map
                                            .getSource(mapLayerDataId)
                                            .setData(inventoryCollectionData);
                                    }

                                    if (
                                        layerData['icon'] &&
                                        layerData['icon'] === 'icon-wink-pb-dig'
                                    ) {
                                        const seletedPanels = inventoryCollectionData.features.map(
                                            (e) => e.properties.fid
                                        );
                                        const filterData = [];
                                        filterData.unshift('all');
                                        seletedPanels.unshift('in', MapLayersInvetoryFields.FRAME_ID);
                                        filterData.push(seletedPanels);
                                        const colorFrameLayer =
                                            'layerInventoryColorLayer' +
                                            Date.now().toString(36) +
                                            Math.random()
                                                .toString(36)
                                                .substr(2);
                                        this.layerInventorySetLayers.push(
                                            colorFrameLayer
                                        );
                                        this.map.addLayer({
                                            id: colorFrameLayer,
                                            type: 'circle',
                                            source: 'allPanels',
                                            'source-layer': this.mapLayers[
                                                'allPanels'
                                            ]['source-layer'],
                                            minzoom: 7,
                                            maxzoom: 11,
                                            filter: filterData,
                                            paint: {
                                                'circle-opacity': 0.8,
                                                'circle-radius': 3,
                                                'circle-color': colors
                                            }
                                        });
                                        this.map.on(
                                            'mouseenter',
                                            colorFrameLayer,
                                            () => {
                                                this.map.getCanvas().style.cursor =
                                                    'pointer';
                                            }
                                        );
                                        this.map.on(
                                            'mouseleave',
                                            colorFrameLayer,
                                            () => {
                                                this.map.getCanvas().style.cursor =
                                                    '';
                                            }
                                        );
                                        const winksFrameLayer =
                                            'layerInventoryWinksLayer' +
                                            Date.now().toString(36) +
                                            Math.random()
                                                .toString(36)
                                                .substr(2);
                                        this.layerInventorySetLayers.push(
                                            winksFrameLayer
                                        );
                                        this.map.addLayer({
                                            id: winksFrameLayer,
                                            type: 'symbol',
                                            source: 'allPanels',
                                            'source-layer': this.mapLayers[
                                                'allPanels'
                                            ]['source-layer'],
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
                                                'text-font': [
                                                    'imx-map-font-43 Regular'
                                                ],
                                                'text-size': 17,
                                                'text-rotation-alignment':
                                                    'map',
                                                'text-rotate': ['get', MapLayersInvetoryFields.ORIENTATION]
                                            },
                                            paint: {
                                                'text-translate-anchor':
                                                    'viewport',
                                                'text-color': colors
                                            }
                                        });
                                        this.map.on(
                                            'mouseenter',
                                            winksFrameLayer,
                                            () => {
                                                this.map.getCanvas().style.cursor =
                                                    'pointer';
                                            }
                                        );
                                        this.map.on(
                                            'mouseleave',
                                            winksFrameLayer,
                                            () => {
                                                this.map.getCanvas().style.cursor =
                                                    '';
                                            }
                                        );
                                    }
                                }
                            );
                        }
                        break;
                    case 'place collection':
                        const placeSetNationalLevelSource =
                            'layerPlaceViewData' +
                            Date.now().toString(36) +
                            Math.random().toString(36).substr(2);
                        const placeSetLayerSource =
                            'layerPlaceViewData' +
                            Date.now().toString(36) +
                            Math.random().toString(36).substr(2);
                        const params = { ids: [layerData.id] };
                        const placeSetLayer =
                            'layerPlacesLayer' +
                            Date.now().toString(36) +
                            Math.random().toString(36).substr(2);
                        this.layerInventorySetLayers.push(placeSetLayer);
                        if (layerData['data']['pois'].length > 100) {
                            const nationalWideBubblePlaceLayer =
                                'nationalWideBubblePlaceLayer' +
                                Date.now().toString(36) +
                                Math.random().toString(36).substr(2);
                            const nationalWideCountPlaceLayer =
                                'nationalWideCountPlaceLayer' +
                                Date.now().toString(36) +
                                Math.random().toString(36).substr(2);
                            this.layerInventorySetLayers.push(
                                nationalWideBubblePlaceLayer
                            );
                            this.layerInventorySetLayers.push(
                                nationalWideCountPlaceLayer
                            );
                            this.map.addSource(placeSetNationalLevelSource, {
                                type: 'geojson',
                                data: {
                                    type: 'FeatureCollection',
                                    features: []
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
                                    visibility: 'visible'
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
                                minzoom: 0,
                                maxzoom: 6,
                                // filter: ['>', 'radius', 10],
                                layout: {
                                    'text-field': '{count}',
                                    'text-font': [
                                        'Product Sans Regular',
                                        'Open Sans Regular',
                                        'Arial Unicode MS Regular'
                                    ],
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
                            this.placeFilterService
                                .getPlaceSetsSummary(params, true)
                                .subscribe((layer) => {
                                    const data = layer['data'][0];
                                    const layerInfo = {
                                        type: 'FeatureCollection',
                                        features: data['pois']
                                    };
                                    this.map
                                        .getSource(placeSetNationalLevelSource)
                                        .setData(
                                            this.layersService.formatUpPlaceNationalData(
                                                layerInfo
                                            )
                                        );
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
                            minzoom:
                                layerData['data']['pois'].length > 100 ? 6 : 0,
                            layout: {
                                'text-line-height': 1,
                                'text-padding': 0,
                                'text-anchor': 'bottom',
                                'text-allow-overlap': true,
                                'text-field':
                                    (layerData['icon'] &&
                                        this.markerIcon[layerData['icon']]) ||
                                    this.markerIcon['place'],
                                'icon-optional': true,
                                'text-font': ['imx-map-font-43 Regular'],
                                'text-size':
                                    layerData['icon'] === 'lens' ? 18 : 24,
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

                        this.placeFilterService
                            .getPlaceSetsSummary(params, false)
                            .subscribe((layer) => {
                                const data = layer['data'][0];
                                const layerInfo = {
                                    type: 'FeatureCollection',
                                    features: data['pois']
                                };
                                this.map
                                    .getSource(placeSetLayerSource)
                                    .setData(layerInfo);
                            });
                        break;
                    case 'place':
                        const placeLayerId =
                            'placeLayer' +
                            Date.now().toString(36) +
                            Math.random().toString(36).substr(2);
                        const placeLayerDataId =
                            'placeLayerData' +
                            Date.now().toString(36) +
                            Math.random().toString(36).substr(2);
                        this.layerInventorySetLayers.push(placeLayerId);
                        this.addNewPlaceLayer(
                            placeLayerId,
                            placeLayerDataId,
                            layerData,
                            true
                        );
                        break;
                    case 'geography':
                        layerData['data']['properties']['icon'] =
                            layerData['icon'];
                        layerData['data']['properties']['color'] =
                            layerData['color'];
                        layerData['data']['properties']['id'] = layerData['id'];

                        const name = layerData['data']['properties']['name'];
                        const pointGeo = turfCenter(layerData['data']);
                        pointGeo['properties']['icon'] = layerData['icon'];
                        pointGeo['properties']['color'] = layerData['color'];
                        pointGeo['properties']['id'] = layerData['id'];
                        pointGeo['properties']['name'] = name;

                        delete layerData['data']['id'];
                        delete layerData['data']['name'];
                        geoLayerData.push(layerData['data']);
                        geoMarkerIconData.push(pointGeo);
                        break;
                    case 'geopathId':
                        if (typeof layerData['data'] !== 'string') {
                            layerData['data'] = layerData['id'];
                        }
                        const topData = {
                            fid: layerData['data'],
                            replevel:
                                layerData['heatMapType'] === 'top_markets'
                                    ? 'dma'
                                    : 'zip_code'
                        };
                        forkJoin([
                            this.inventoryService
                                .getSingleInventory({
                                    spotId: layerData['data'],
                                    target_segment: this.defaultAudience
                                        .audienceKey,
                                    base_segment: this.defaultAudience
                                        .audienceKey
                                })
                                .pipe(catchError((error) => EMPTY)),
                            this.exploreService
                                .getInventoryDetailZipDMA(topData)
                                .pipe(catchError((error) => EMPTY))
                        ]).subscribe((response) => {
                            this.layersService.cleanUpMap(this.map);
                            if (
                                layerData['heatMapType'] === 'top_markets' &&
                                response[1]['data'] &&
                                Object.keys(response[1]['data']).length !== 0
                            ) {
                                this.isKeylegend = true;
                                this.layersService.loadTopMarket(
                                    response[1],
                                    this.map,
                                    layerData.color,
                                    'top_markets'
                                );
                                this.keyLegendColors = this.exploreService.colorGenerater(
                                    layerData.color
                                );
                                this.currentSingleInventory = topData;
                                const minValue = this.layersService.getMinValue(
                                    response[1]['data'][0]
                                );
                                const maxVlaue = this.layersService.getMaxValue(
                                    response[1]['topFour']
                                );
                                if (minValue === 0) {
                                    this.currentSingleInventory['minValue'] =
                                        '0.00';
                                } else {
                                    this.currentSingleInventory[
                                        'minValue'
                                    ] = this.format
                                        .convertToPercentageFormat(minValue, 2)
                                        .toString();
                                }
                                this.currentSingleInventory[
                                    'maxValue'
                                ] = this.format
                                    .convertToPercentageFormat(maxVlaue, 2)
                                    .toString();
                            } else if (
                                layerData['heatMapType'] === 'top_zips' &&
                                response[1]['data'] &&
                                Object.keys(response[1]['data']).length !== 0
                            ) {
                                this.layersService.loadTopZipCode(
                                    response[1],
                                    this.map,
                                    layerData.color,
                                    'top_zips'
                                );
                                this.isKeylegend = true;
                                this.keyLegendColors = this.exploreService.colorGenerater(
                                    layerData.color
                                );
                                this.currentSingleInventory = topData;
                                const minValue = this.layersService.getMinValue(
                                    response[1]['data'][0]
                                );
                                const maxVlaue = this.layersService.getMaxValue(
                                    response[1]['topFour']
                                );
                                if (Number(minValue) === 0) {
                                    this.currentSingleInventory['minValue'] =
                                        '0.00';
                                } else {
                                    this.currentSingleInventory[
                                        'minValue'
                                    ] = this.format
                                        .convertToPercentageFormat(minValue, 2)
                                        .toString();
                                }
                                this.currentSingleInventory[
                                    'maxValue'
                                ] = this.format
                                    .convertToPercentageFormat(maxVlaue, 2)
                                    .toString();
                            } else {
                                this.isKeylegend = false;
                                this.keyLegendColors = [];
                                this.currentSingleInventory = {};
                            }
                            if (
                                response[0]['inventory_summary'] &&
                                response[0]['inventory_summary'][
                                    'inventory_items'
                                ] &&
                                response[0]['inventory_summary'][
                                    'inventory_items'
                                ].length &&
                                response[0]['inventory_summary'][
                                    'inventory_items'
                                ][0]['location']
                            ) {
                                const unitData = {
                                    type: 'Feature',
                                    geometry:
                                        response[0]['inventory_summary'][
                                            'inventory_items'
                                        ][0]['location']['geometry']
                                };
                                this.layersService.markInventory(
                                    unitData,
                                    this.map,
                                    layerData.color
                                );
                            }
                            this.loaderService.display(false);
                        });
                        break;
                    case LayerType.GEO_SETS:
                        const layerId = this.baseLayersIns.addGeoSetLayer(
                            this.mapLayers,
                            layerData
                        );
                        if (layerId) {
                            this.GeoSetLayerIds.push(layerId);
                        }
                        break;
                }
            }

            const selectedGeoSetLayer = layersSession['selectedLayers'].filter(
                (layer) => layer.type === 'geo sets'
            );

            if (selectedGeoSetLayer.length) {
                this.baseLayersIns.addLayerSource(this.map);
                this.baseLayersIns.bindGeoSetIcon(
                    this.GeoSetLayerIds,
                    this.map
                );
            }
            this.addNewGeographyLayers(geoLayerData, geoMarkerIconData);
        } else {
            this.isKeylegend = false;
            this.loaderService.display(false);
            this.removeGeographyLayers();
            this.removeLayers();
        }
    }

    public removeLayers() {
        if (!this.map) {
            return false;
        }
        if (this.layerInventorySetLayers.length > 0) {
            this.layerInventorySetLayers.map((layerId) => {
                if (this.map.getLayer(layerId)) {
                    this.map.off('mouseenter', layerId);
                    this.map.off('mouseleave', layerId);
                    this.map.removeLayer(layerId);
                }
            });
        }
        if (this.layerInventorySetDataSets.length > 0) {
            this.layerInventorySetDataSets.map((layerId) => {
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

            this.GeoSetLayerIds.map((layerId) => {
                if (this.map.getLayer(layerId)) {
                    this.map.removeLayer(layerId);
                }
            });
        }
        /** Removing Geoset layers */
        if (this.GeoSetLayerIds.length > 0) {
            this.map.off('sourcedata');
            if (this.map.getLayer('geoSetPointCenter')) {
                this.map.removeLayer('geoSetPointCenter');
            }

            if (this.map.getSource('geoSetPoint')) {
                this.map.removeSource('geoSetPoint');
            }

            this.GeoSetLayerIds.map((layerId) => {
                if (this.map.getSource(layerId)) {
                    this.map.removeSource(layerId);
                }
            });
        }
        this.GeoSetLayerIds = [];
        this.layerInventorySetDataSets = [];
        this.layerInventorySetLayers = [];
    }

    /**
     * A method to create a new place layer
     * @param layerId
     * @param dataSourceId
     */
    private addNewPlaceLayer(
        layerId,
        dataSourceId,
        layerData,
        singlePlaceLayer = false
    ) {
        this.map.addSource(dataSourceId, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: singlePlaceLayer ? [layerData['data']] : []
            }
        });
        this.map.addLayer({
            id: layerId,
            type: 'symbol',
            source: dataSourceId,
            layout: {
                'text-line-height': 1,
                'text-padding': 0,
                'text-anchor': 'bottom',
                'text-allow-overlap': true,
                'text-field':
                    (layerData['icon'] && this.markerIcon[layerData['icon']]) ||
                    this.markerIcon['place'],
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
        this.map.on('mouseenter', layerId, () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', layerId, () => {
            this.map.getCanvas().style.cursor = '';
        });
    }

    private addNewGeographyLayers(geoLayerData, geoMarkerIconData) {
        this.removeGeographyLayers();
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
                'line-opacity': 0.8,
                'line-color': ['get', 'color'],
                'line-width': 1
            }
        });

        this.map.addLayer({
            id: 'geographyLayerFill',
            type: 'fill',
            source: 'geoDataFill',
            paint: {
                'fill-opacity': 0.08,
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
                'text-field': [
                    'get',
                    ['to-string', ['get', 'icon']],
                    ['literal', this.markerIcon]
                ],
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
    }

    private removeGeographyLayers() {
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

    onOpenSavePlaseSet(place_id) {
        this.placeDataService.setPOIPlacesData([
            { id: place_id, selected: true }
        ]);
        const filters = this.placeFilterService.getPlacesSession();
        const data = {
            title: 'Save as New Place Set',
            buttonText: 'Create Place Set',
            isSavePlaceSet: false,
            type: 'single'
            // summaryId: filters['filters']['summaryId']
        };
        this.dialog.open(SavePlaceSetsDialogComponent, {
            data: data,
            panelClass: 'placesSet-dialog-container'
        });
    }
    onOpenSaveToExistingPlaseSet(place_id) {
        this.placeDataService.setPOIPlacesData([
            { id: place_id, selected: true }
        ]);
        const filters = this.placeFilterService.getPlacesSession();
        const data = {
            title: 'Save to Existing Place Set',
            buttonText: 'Save to selected Place Set',
            isExistingPlaceSet: true,
            type: 'single'
            // summaryId: filters['filters']['summaryId']
        };
        this.dialog.open(SavePlaceSetsDialogComponent, {
            data: data
        });
    }
    public selectedFilterFids($event) {
        this.sfids = $event;
    }
    public onNavigationStatus(flag) {
        this.navigationCollapseState = flag;
    }
    public openFilterNav() {
        this.placeFilterService.setFilterSidenav({
            open: true,
            tab: this.filterOpenDetails['tab']
        });
    }
}
