import {Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {environment} from '../../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {
  ThemeService,
  ExploreService,
  CommonService,
  LoaderService,
  InventoryService,
  ExploreDataService,
  MapLegendsService,
  MapService,
} from '@shared/services';
import {Subject, combineLatest, EMPTY, forkJoin, Observable, of, BehaviorSubject} from 'rxjs';
import {PopulationService} from '../population.service';
import {filter, first, takeUntil, tap, catchError, switchMap, map} from 'rxjs/operators';
import {
  AudienceFilterState, GeographySet,
  GeographyType, GeoSetCreateRequest, MapLayerDetails, PopulationDetailsRequest,
  PopulationDetailsResponse, PopulationFilters,
  PopulationFilterState,
  PopulationResultItem,
  PopulationSelectable, PopulationSelectableValues,
  PopulationSortable,
  PopulationSummary,
  GeoIdObject
} from '@interTypes/Population';
import {GradientColor} from '../../classes/gradient-color';
import {LocateMeControl} from 'app/classes/locate-me-control';
import {ConfirmationDialog} from '@interTypes/workspaceV2';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {SaveGeoSetComponent} from '../save-geo-set/save-geo-set.component';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw';
import bbox from '@turf/bbox';
import {RadiusMode} from '../../classes/radius-mode';
import {LocationFilterService} from '@shared/services/location-filters.service';
import { LayersService } from 'app/explore/layer-display-options/layers.service';
import { SummaryRequest } from '@interTypes/summary';
import { ActivatedRoute } from '@angular/router';
import { PlacesFiltersService } from 'app/places/filters/places-filters.service';
import turfCenter from '@turf/center';
import { PopulationDataService } from '@shared/services/population-data.service';
import { Helper } from '../../classes';
import { LayerType } from '@interTypes/enums';
import { BaseLayers } from '../../classes/base-layers';
import { applyLayers } from '@interTypes/layers';
import { MapProperties } from '@interTypes/mapProperties';
import { MapboxFactory, MapboxFactoryEnum } from '../../classes/mapbox-factory';
import { MapLayersInvetoryFields } from '@interTypes/enums';
import { CacheService } from '@shared/services/cache';
@Component({
  selector: 'app-population-base',
  templateUrl: './population-base.component.html',
  styleUrls: ['./population-base.component.less'],
})
export class PopulationBaseComponent implements OnInit, AfterViewInit, OnDestroy {
  public isSideMenuOpen = true;
  public isFiltersOpen = false;
  private map: mapboxgl.Map;
  private themeSettings = {};
  public selectedYear = '2020';
  private selectedGeoCount: number;
  public enableDetailView = false;
  public sortables: PopulationSortable[] = [
    {
      order: 'asc',
      displayName: 'Composition Percentage: Lowest-Highest',
      sortKey: 'comp'
    },
    {
      order: 'desc',
      displayName: 'Composition Percentage: Highest-Lowest',
      sortKey: 'comp'
    },
    {
      order: 'asc',
      displayName: 'Composition Index: Lowest-Highest',
      sortKey: 'index'
    },
    {
      order: 'desc',
      displayName: 'Composition Index: Highest-Lowest',
      sortKey: 'index'
    }
  ];
  public selectables: PopulationSelectable[] = [
    {display: 'All', key: 'all'},
    {display: 'Top 100', key: 'top100'},
    {display: 'Top 50', key: 'top50'},
    {display: 'Top 25', key: 'top25'},
    {display: 'Custom', key: 'custom'},
    {display: 'None', key: 'none'},
  ];
  public selectedGeo: keyof GeographyType = 'dma';
  public selectedSort: PopulationSortable = this.sortables[1];
  public selectedAudience: AudienceFilterState;
  private filterState: PopulationFilterState;
  public activeSelection: PopulationSelectable = this.selectables[0];
  private previousSelection: keyof PopulationSelectableValues;
  public totalPages: number;
  public currentPage = 1;
  public geographies: PopulationResultItem[] = [];
  private geoIds: GeoIdObject[] = [];
  public baseStrokeColor: string;
  public activeStrokeColor: string;
  public mapHeight = 0;
  public enableTabularview = false;
  private unSubscribe: Subject<void> = new Subject<void>();
  public dimensionsDetails: any;
  public tabularResizeElement: any;
  public summary: PopulationSummary = null;
  public keyLegendColors: any;
  public isKeylegend = false;
  public currentTab = '';
  @ViewChild('tabularHeight') tabularView: ElementRef;
  public listHeight = 450;
  filterOpenDetails: any = {};

  // this  property help to draw polgon on map.
  draw: MapboxDraw;



  // Layer vars
  public baseMaps: any = [];
  public mapStyle = '';
  public selectedMapStyle = '';
  public showMapLegends: any = true;
  public showMapControls: any = true;
  public zoomLevel = 0;
  public activeDraggableTextPosition = { x: 0, y: 0 };
  public logoStyle: object = {};
  public activeDraggablePosition = { x: 0, y: 0 };
  public layerDisplayOptions: any = {};
  public mapWidthHeight = {};
  public customTextStyle: object = {};
  public layerInventorySetDataSets = [];
  public inventoryGroups;
  public layerType = 'primary';
  // public currentSingleInventory: any;
  public defaultAudience: any;
  private style: any;
  private mapBounds: any = [];
  private layerInventorySetLayers = [];
  private GeoSetLayerIds = [];
  private markerIcon: any = environment.fontMarker;
  public mapLayers = {};
  public mapCenter = [-98.5, 39.8];
  public currentSingleInventory: any;
  public isLayerKeylegend = false;

  // store the feature and using for on map view method
  private goeLayerFilteredFeatures = [];
  // map view star icon HTML element id
  starIconElId = 'population-map__star-icon';
  private baseLayersIns: BaseLayers;
  public enableSecondaryMap = false;
  public mapWidth=400;
  public applyLayerObservable = new BehaviorSubject<applyLayers>({type:'primary', flag:true, mapId: 'map-area'});
  /** To verify before applying market type to be used to overwride */
  appliedMarketFilter;
  keyLegendsTimeer = null;

  constructor(private themeService: ThemeService,
              private populationService: PopulationService,
              private exploreService: ExploreService,
              private dialog: MatDialog,
              private snackBar: MatSnackBar,
              public loaderService: LoaderService,
              public locationFilter: LocationFilterService,
              private layersService: LayersService,
              private commonService: CommonService,
              private inventoryService: InventoryService,
              private exploreDataService: ExploreDataService,
              private route: ActivatedRoute,
              private placeFilterService: PlacesFiltersService,
              private populationDataService: PopulationDataService,
              private cdRef: ChangeDetectorRef,
              private mapLegendsService: MapLegendsService,
              public mapService: MapService,
              public cache: CacheService,

  ) {
            this.locationFilter.loadDependency(cdRef);
  }
  ngOnInit() {
    this.themeSettings = this.themeService.getThemeSettings() || {};
    const colors = this.themeSettings['color_sets'];
    this.baseStrokeColor = colors['gray']['500'];
    this.activeStrokeColor = colors['primary']['base'];
    // Layers code
    this.baseMaps = this.themeSettings['basemaps'];
    this.baseMaps.filter(maps => {
      if (maps.default) {
        this.mapStyle = maps.label;
      }
    });
    this.selectedMapStyle = this.mapStyle;
    this.inventoryGroups = this.exploreDataService.getInventoryGroups();
    this.defaultAudience = this.route.snapshot.data.defaultAudience;
    const userData = JSON.parse(localStorage.getItem('user_data'));
    if (typeof userData['layers'] !== 'undefined') {
      this.mapLayers = userData['layers'];
      if (typeof userData['layers']['center'] !== 'undefined') {
        this.mapCenter = userData['layers']['center'];
      }
      if (typeof userData['layers']['bounds'] !== 'undefined') {
        this.mapBounds = userData['layers']['bounds'];
      }
    }
    // Layers code end
    this.populationService.getPopulationFilters$()
      .pipe(
        takeUntil(this.unSubscribe),
        switchMap((res: PopulationFilterState) => this.getFilterStateAfterConfirmation(res))
      )
      .subscribe((res: PopulationFilterState) => {
        if (res && res['geographyType'] && res['audience']) {
          this.filterState = res;
          this.selectedGeo = res['geographyType'];
          this.selectedAudience = res['audience'];
          if(res['geographySet']){
            this.appliedMarketFilter = 'geographySet';
          }else if(res['market']){
            this.appliedMarketFilter = 'market';
          }else if(res['specificGeography']){
            this.appliedMarketFilter = 'specificGeography';
          }else{
            this.appliedMarketFilter = undefined;
          }
          this.getPopulationDetails();

          if(!!res['geographyType'] && this.map){
            this.goeLayerFilteredFeatures = [];
            Helper.removeHTMLElementById(this.starIconElId);
            this.map.flyTo({
              minZoom: 2,
              maxZoom: 16,
              center: [-98.5, 39.8],
              zoom: 3,
            });
          }

          if (this.map && this.enableDetailView) {
            setTimeout(() => {
              this.enableDetailView = false;
              this.notTabularViewMap();
            }, 1000);
          }

        }
      });

    /** Reset the selected filters */
    this.populationService.onReset()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(type => {
        if (type !==  'population') {
          this.resetFilter();
        }
      });

    this.listenForFilterByPlaceSets();
    this.listenForCustomShapeFilterData();

    // Layers code
    this.layersService.getApplyLayers()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((value) => {
        if (value['type'] === 'primary') {
          this.applyLayerObservable.next({type:value['type'], mapId: 'map-area', flag:value['flag']});
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

    this.populationDataService.getFilterSideNav().pipe(takeUntil(this.unSubscribe)).subscribe(data => {
      this.filterOpenDetails = data;
      this.isFiltersOpen = data['open'];
      if (this.isFiltersOpen) {
        this.currentTab = data['tab'];
      } else {
        this.currentTab = '';
      }
    });

    Helper.themeRender('intermx-theme-old');
  }
  /** layerDisplayOptions Changes*/
  layerChanges(event) {
    if(event){
      this.layerDisplayOptions = event;
    }
  }

  ngOnDestroy() {
    const className = 'popupation-filter-open';
    const body = document.getElementsByTagName('body')[0];
    if (body && body.classList.contains(className)) {
      body.classList.remove(className);
    }
    const detailClassName = 'popupation-Detail-open';
    if (body && body.classList.contains(detailClassName)) {
      body.classList.remove(detailClassName);
    }
    this.map.off('sourcedata', this.geoLayerSourceDataListener.bind(this));
    this.unSubscribe.next();
    this.unSubscribe.complete();
    Helper.themeRender('intermx-theme-old');
  }

  ngAfterViewInit(): void {
    const mapStyle = this.themeSettings['basemaps'].find(item => item.default);
    mapboxgl.accessToken = environment.mapbox.access_token;
    this.map = new mapboxgl.Map({
      container: 'map-area',
      minZoom: 2,
      maxZoom: 16,
      preserveDrawingBuffer: true,
      center: [-98.5, 39.8],
      zoom: 3,
      style: mapStyle['uri'],
    });
    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
    this.map.addControl(new LocateMeControl(), 'bottom-left');
    this.map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        maximumAge: Infinity
      },
      trackUserLocation: true
    }), 'bottom-left');
    this.exploreDataService.setMapObject(this.map);
    setTimeout(() => {
      // for getting current location
      this.commonService.locateMePrimaryMap();
    }, 500);
    this.map.on('zoom', () => {
      this.zoomLevel = this.map.getZoom();
    });
    this.themeService.getDimensions().pipe(takeUntil(this.unSubscribe)).subscribe(data => {
      this.dimensionsDetails = data;
      this.resizeTabular();
      this.listHeight = this.dimensionsDetails.windowHeight - 447;
    });

    this.initializeMapDraw();
    this.locationFilter.initMapInstance(this.map, this.draw);
    this.map.on('style.load', () => {
      this.loadLayers();
      this.layersService.mapLoaded(true);
    });

    this.map.on('move', (e) =>  {
      const mapProperties: MapProperties = {
        center: this.map.getCenter(),
        zoom: this.map.getZoom(),
        pitch: this.map.getPitch(),
        bearing: this.map.getBearing(),
        mapName: 'primaryMap'
      };
      if (!this.mapService.isMapSync && this.mapService.isDualMapSyncEnabled) {
        this.mapService.setMapProperties(mapProperties);
      }
    });

    this.mapService.getMapProperties().pipe(takeUntil(this.unSubscribe)).subscribe((properties) => {
      if (this.map && properties && Object.keys(properties).length) {
        if (properties.mapName !== 'primaryMap' && !this.mapService.isMapSync) {
          this.mapService.isMapSync = true;
          this.map.setCenter(properties.center);
          this.map.setZoom(properties.zoom);
          this.map.setPitch(properties.pitch);
          this.map.setBearing(properties.bearing);
          this.mapService.isMapSync = false;
        }
      }
    });

    this.map.on('sourcedata', this.geoLayerSourceDataListener.bind(this));
    this.baseLayersIns = new BaseLayers(this.map, this.cdRef);

    this.cdRef.detectChanges();
  }


  openSecondaryMap(value) {
    if (value['flag']) {
      this.enableSecondaryMap = true;
      this.isSideMenuOpen = false;
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
      this.isSideMenuOpen = true;
      this.exploreDataService.setMapViewPositionState('inventoryView');
    }
  }

  /**
   * @description
   *  storing the goeLayerFilteredFeatures after all geolayer source was loaded
   */
  private geoLayerSourceDataListener(e) {
    const geoLayerFilteredId = 'geoLayer-filtered';
    if (e.sourceId === 'geoLayer' && this.map.getLayer(geoLayerFilteredId)) {
      const features = this.map.queryRenderedFeatures({'layers': [geoLayerFilteredId]});
      if (features.length > this.goeLayerFilteredFeatures.length && this.selectedGeo?.toUpperCase() == ''+features[0]?.properties?.geo_type ) {
        this.goeLayerFilteredFeatures = features;
      }
    }
  }

  public calculateMapWidth(event){
    if (this.enableSecondaryMap) {
     this.mapWidth = ((this.dimensionsDetails.windowWidth - 40) - event);
    }
    setTimeout(() => {
      this.map.resize({ mapResize: true });
    }, 200);
  }

  public loadLayers() {

    this.map.addSource('polygonData', {
      type: 'geojson',
      data: this.locationFilter.polygonData
    });

    this.map.addLayer({
      id: 'customPolygon',
      type: 'fill',
      source: 'polygonData',
      paint: {
        'fill-opacity': .01,
        'fill-color': this.themeSettings['color_sets'].highlight.base
      }
    });

    this.map.addLayer({
      id: 'customPolygonStroke',
      type: 'line',
      source: 'polygonData',
      paint: {
        'line-opacity': .8,
        'line-color': this.themeSettings['color_sets'].highlight.base,
        'line-width': 2
      }
    });

  }

  public getPopulationDetails() {
    // reset selection
    this.activeSelection = this.selectables[0];
    const filterData: PopulationDetailsRequest = this.formatFilterData();
    this.populationService.getPopulationDetails(filterData, this.selectedSort)
      .pipe(first(),
        tap((details: PopulationDetailsResponse) => {
          if (details.pagination.page === 1 && details.ids) {
            this.geoIds = details.ids;
            this.setGeoIdsToMap(details.ids);
          }
        }))
      .subscribe((details: PopulationDetailsResponse) => {
        this.calculateAndSetSummary(details);
        this.totalPages = Math.ceil(details.pagination.total / details.pagination.perPage);
        this.geographies = details.results;
        this.currentPage = details.pagination.page;
        // calling bulkSelection to update the selection state based on the current activeSelection
        this.onBulkSelection();
      }, error => {
        this.summary = null;
        this.totalPages = null;
        this.currentPage = 1;
        this.geographies = [];
      });
  }

  private formatFilterData(): PopulationDetailsRequest {
    const filterData: PopulationDetailsRequest = {
      baseAudience: '2032',
      targetAudience: this.filterState.audience.audience.toString(),
      responseGeo: this.selectedGeo,
    };
    // in this function either market or geo filter will be available all the time
    // the stream is modified with the switchmap at the filter subscription level.
    if (this.isGeoSetApplied(this.filterState)) {
      filterData.market = {
        ids: this.filterState.geographySet.markets.map(market => market.geo_id)
      };
    }
    if (this.isMarketFilterApplied(this.filterState)) {
      filterData.market = {
        ids: this.filterState.market.selectedMarkets.map(market => {
          const regex = /DMA|CBSA|CNTY/;
          return market.id.replace(regex, '');
        })
      };
    }

    if(this.filterState['specificGeography'] &&  this.filterState['specificGeography'].length) {
      filterData.market = {
        ids: this.filterState.specificGeography.map(market => {
          const regex = /DMA|CBSA|CNTY/;
          return market['data']['id'].replace(regex, '');
        })
      };
    }
    if ( this.filterState.location && this.filterState.location.region && this.filterState.location.region.coordinates.length > 0 ) {
      if (filterData.market) {
        filterData.market.region =  this.filterState.location.region;
      } else {
        filterData.market = {
          region: this.filterState.location.region
        };
      }
    }
    return filterData;
  }
  private getFilterStateAfterConfirmation(filterState: PopulationFilterState): Observable<PopulationFilterState> {

    // if different market filters are applied as the user
    if (this.appliedMarketFilter && filterState[this.appliedMarketFilter] && this.checkDiffMarket(filterState)) {

      let newFiltermessage = '';
      /** Will show message based on selection */
      const checkApplied = {
        market: 'market',
        geographySet: 'geography sets',
        specificGeography: 'specific geography'
      };

      /** Checking new filter message */
        Object.keys(filterState).map(filters => {
          if (this.appliedMarketFilter !== filters && checkApplied[filters]) {
            newFiltermessage = checkApplied[filters];
          }
        });
      const data: ConfirmationDialog = {
        notifyMessage: false,
        confirmDesc: `<h4 class="confirm-text-icon">Do you want to override your ${ checkApplied[this.appliedMarketFilter]} selection with the selected ${ newFiltermessage }?</h4>`,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        headerCloseIcon: false
      };
      return this.dialog.open(ConfirmationDialogComponent, {
        data: data,
        width: '586px'
      }).afterClosed()
        .pipe(
          takeUntil(this.unSubscribe),
          map(res => {
          if (res && res.action) {
            // if user said yes to override,
            switch (this.appliedMarketFilter) {
              case 'market':
                delete filterState.market;
                break;
              case 'geographySet':
                delete filterState.geographySet;
                break;
              case 'specificGeography':
                delete filterState.specificGeography;
                break;
              default:
                break;
            }
          } else {
            // if user said No to override,
            switch (this.appliedMarketFilter) {
              case 'market':
                filterState.geographySet && delete filterState.geographySet;
                filterState.specificGeography && delete filterState.specificGeography;
                break;
              case 'geographySet':
                filterState.market && delete filterState.market;
                filterState.specificGeography && delete filterState.specificGeography;
                break;
              case 'specificGeography':
                filterState.market && delete filterState.market;
                filterState.geographySet && delete filterState.geographySet;
              default:
                break;
            }
          }
          return filterState;
        }));
    }
    return of(filterState);
  }

  /** TO check different market selected */
  private checkDiffMarket(filterState) {
    let count = 0;
    ['market', 'geographySet', 'specificGeography'].map( key =>{
      if (key in filterState) count = count + 1;
    });
    if (count > 1) {
      return true;
    } else {
      return false;
    }
  }

  private isMarketFilterApplied(filterState: PopulationFilterState) {
    return filterState.market &&
      filterState.market.selectedMarkets &&
      filterState.market.selectedMarkets.length > 0;
  }

  private isGeoSetApplied(filterState: PopulationFilterState) {
    return filterState.geographySet &&
      filterState.geographySet.markets.length > 0;
  }

  public onMenuStateChange($event) {
    this.map.resize({mapResize: true});
    this.setZendeskPosition();
  }

  /**
   * @selectedFilterNav Selected header side Nav filter
   */
  openFilterSiderbar(selectedFilterNav) {
    if (this.isFiltersOpen && this.currentTab === selectedFilterNav) {
      this.isFiltersOpen = !this.isFiltersOpen;
    } else {
      this.isFiltersOpen = true;
    }
    this.currentTab = selectedFilterNav;
    this.populationDataService.setFilterSideNav({open: this.isFiltersOpen, tab: selectedFilterNav});
  }

  public toggleFilterState() {
    this.isFiltersOpen = !this.isFiltersOpen;
  }

  /**
   * @description
   *   checking Geo Layer source was loaded
   */
  private isGeoLayerLoaded() {
    const sourceId = 'geoLayer';
    return this.map.getSource(sourceId) && this.map.isSourceLoaded(sourceId) &&  this.map.getLayer('geoLayer-filtered');
  }

  public onMapViewClicked(geographyId: string | number) {

     // set zooming and setting star icon on selected are
     if ( this.isGeoLayerLoaded() ) {

         const feature = this.goeLayerFilteredFeatures.find(featureIns => {
            return featureIns.properties.geoid === geographyId;
          });

          if (feature) { // checking feature is presents

            const featureCenterPoint = turfCenter(feature);
            this.map.flyTo({
              center: featureCenterPoint.geometry.coordinates,
              zoom: 11,
            });

            // removing star icon element if its already exist
            Helper.removeHTMLElementById(this.starIconElId);

            // attaching star icon
            const el = document.createElement('div');
            el.id = this.starIconElId;
            new mapboxgl.Marker(el)
              .setLngLat(featureCenterPoint.geometry.coordinates)
              .addTo(this.map);
            this.onCloseFilterTab();
        }

    }

    // Handle map view here
    // TODO : Will enable once ready API for details view
    //this.enableDetailView = true;
    setTimeout(() => {
      this.map.resize({mapResize: true});
    }, 1000);
    this.setZendeskPosition();

  }

  public closeDetailsView() {
    this.enableDetailView = false;
    this.setZendeskPosition();
    setTimeout(() => {
      this.map.resize({mapResize: true});
    }, 1000);
  }

  public sideMenuToggle() {
    this.isSideMenuOpen = !this.isSideMenuOpen;
    if (this.isSideMenuOpen) {
      this.notTabularViewMap();
    }
  }

  public tabularResize(event) {
    this.tabularResizeElement = event;
    this.resizeTabular();
  }

  public resizeTabular() {
    if (this.enableTabularview) {
      if (this.tabularResizeElement) {
        this.mapHeight = (this.dimensionsDetails.windowHeight - (this.dimensionsDetails.headerHeight + this.tabularResizeElement.rectangle.height));
      } else {
        this.mapHeight = (this.dimensionsDetails.windowHeight - (this.dimensionsDetails.headerHeight + 250));
      }
    } else {
      this.notTabularViewMap();
    }

    setTimeout(() => {
      if (this.map) {
        this.map.resize({mapResize: true});
      }
    }, 1000);
  }

  public enlargeTable() {
    this.enableTabularview = true;
    this.isSideMenuOpen = false;
    this.resizeTabular();
  }

  public collapseTabular(event) {
    if (event && event['collapse']) {
      this.enableTabularview = false;
      this.notTabularViewMap();
    }
  }

  public trackByFn(index, item: PopulationResultItem) {
    return item.geoId;
  }

  public notTabularViewMap() {
    this.enableTabularview = false;
    this.mapHeight = this.dimensionsDetails.windowHeight - this.dimensionsDetails.headerHeight;
    setTimeout(() => {
      if (this.map) {
        this.map.resize({mapResize: true});
      }
    }, 1000);
  }

  public loadMore() {
    this.currentPage += 1;
    const filterData: PopulationDetailsRequest = this.formatFilterData();
    this.populationService.getPopulationDetails(filterData, this.selectedSort, this.currentPage)
      .pipe(first())
      .subscribe((population: PopulationDetailsResponse) => {
        let geographies = population.results;
        if (this.shouldSelectResults()) {
          geographies = population.results.map(item => {
            item.selected = true;
            return item;
          });
        }
        this.geographies = [...this.geographies, ...geographies];
      }, error => {
        // resetting page on error
        this.currentPage -= 1;
      });
  }

  public onSorting() {
    this.currentPage = 1;
    this.getPopulationDetails();
  }

  public tabularSortable(event) {
    const sortableData = this.sortables.find(sort => sort.order === event.sort && sort.sortKey === event.key);
    if (sortableData) {
      this.selectedSort = sortableData;
      this.onSorting();
    }
  }

  public zoomOutMap() {
    this.map.fitBounds(this.mapBounds,  {duration: 100}, {eventType: 'default'});
    // this.map.fitBounds([[-128.94797746113613, 18.917477970597474], [-63.4, 50.0]]);
  }

  public toggleSelection(itemId: string): void {
    const target = this.geographies.find(item => item.geoId === itemId);
    target.selected = !target.selected;
    // For change detection
    this.geographies = [...this.geographies];
    this.updateBulkSelectionOnToggle();
    this.refreshSummaryOnSelection();
    if (this.map.isStyleLoaded()) {
      this.redrawHeatMapOnSelection();
    } else {
      this.map.once('load', () => {
        this.redrawHeatMapOnSelection();
      });
    }
  }

  public onToggleAll($event: PopulationSelectable) {
    this.activeSelection = $event;
    this.onBulkSelection();
  }

  public onBulkSelection() {
    switch (this.activeSelection.key) {
      case 'all': {
        this.selectedGeoCount = this.geoIds.length;
        this.selectItems(this.geographies.length);
        break;
      }
      case 'top25': {
        this.selectedGeoCount = 25;
        this.selectItems(this.selectedGeoCount);
        break;
      }
      case 'top50': {
        this.selectedGeoCount = 50;
        this.selectItems(this.selectedGeoCount);
        break;
      }
      case 'top100': {
        this.selectedGeoCount = 100;
        this.selectItems(this.selectedGeoCount);
        break;
      }
      case 'none': {
        this.selectedGeoCount = 0;
        const geographies = this.geographies.map(item => {
          item.selected = false;
          return item;
        });
        this.geographies = [...geographies];
        break;
      }
      default: {
        // Do nothing for custom.
        break;
      }
    }
    this.refreshSummaryOnSelection();
    if (this.map.isStyleLoaded()) {
      this.redrawHeatMapOnSelection();
    } else {
      this.map.once('load', () => {
        this.redrawHeatMapOnSelection();
      });
    }
  }

  public saveGeoSet(): void {
    // TODO : Avoid nested subscriptions here
    const selectedGeoIds: string[] = this.getSelectedIds();
    this.dialog.open(SaveGeoSetComponent).afterClosed()
      .pipe(filter(res => res))
      .subscribe(res => {
        const data: GeoSetCreateRequest = {
          market_type: this.selectedGeo,
          markets: selectedGeoIds,
          name: res['name'],
          description: res['description'] ? res['description'] : '',
        };
        this.populationService.createGeoSet(data)
          .pipe(first())
          .subscribe((response) => {
            this.populationDataService.geoSets$ = null;
            this.snackBar.open('Geography set saved successfully.', '', {
              duration: 2000,
            });
            this.populationDataService.setGeoSetSaveNotification();
          }, error => {
            const errorMesasge: ConfirmationDialog = {
              notifyMessage: true,
              confirmTitle: 'Error',
              messageText: 'There are some errors when saving your inventory set, Please try again.',
            };
            if (error.error && error.error.message) {
              errorMesasge.messageText = error.error.message;
            }
            this.dialog.open(ConfirmationDialogComponent, {
              data: errorMesasge,
              width: '450px',
            });
          });
      });
  }

  private setGeoIdsToMap(geoIds: GeoIdObject[]) {
    this.clearFilterLayersFromMap();
    if (geoIds.length > 0) {
      if (!this.map.isStyleLoaded()) {
        this.map.once('styledata', () => {
          this.drawGeographyOnMap(this.selectedGeo, geoIds);
        });
      } else {
        this.drawGeographyOnMap(this.selectedGeo, geoIds);
      }
    }
  }

  private calculateAndSetSummary(details: PopulationDetailsResponse): void {
    const summary: PopulationSummary = {
      populationPercentage:
        (details.baseAudiencePopulation && details.targetAudiencePopulation) ?
          Number((Number(details.targetAudiencePopulation) / Number(details.baseAudiencePopulation)) * 100).toFixed(1) : 'N/A',
      totalGeographies: details.pagination.total,
      targetAudiencePopulation: details.targetAudiencePopulation,
      baseAudiencePopulation: details.baseAudiencePopulation
    };
    this.summary = summary;
  }

  private resetFilter() {
    this.clearFilterLayersFromMap();
    this.selectedSort = this.sortables[1];
    this.geographies = [];
    this.selectedAudience = {
      audience: 2032,
      name: 'Total Population (0+ Years)'
    };
    this.isKeylegend = false;
    this.activeSelection = this.selectables[0];
    this.previousSelection = null;
    this.currentPage = 1;
    this.summary = null;
    this.totalPages = null;
    this.enableDetailView = false;
  }

  /**
   * Utility method to decide if the results from pagination should be selected or not
   * @return boolean true if you should select, false when you should not (like selection is more than bulk value)
   */
  private shouldSelectResults(): boolean {
    return this.activeSelection.key === 'all';
  }

  private updateBulkSelectionOnToggle(): void {
    /**
     * This is a decision made to avoid having to deal with nitpicking details of selection state to keep
     * the bulk selection dropdown in sync with the selection count. If you think about it, the bulk
     * selection dropdown is meant to give the user an ability to quickly select required numbers.
     * It is nowhere to be an indicator for the current selection status if the user is playing with
     * each selection on its own.
     *
     * SO I decided not to implement that sync connection between individual items and dropdown. If you
     * select using dropdown, it'll maintain state. If you made any changes on an individual items, then
     * you are customizing it and the box will just represent the custom state not the actual counts.
     *
     * It is a trade-off between whether you want to spend time implementing a feature at the moment which
     * doesn't provide much value to the user or you want to maintain a perfect UI state which is not really
     * necessary.
     *
     * Either Custom or none will be handled when you make changes to individual elements.
     *
     * If the sync is required from the business team, we should do it. If it is mandated by QA,
     * discuss with business team, explain the above observation and the time that it is going
     * to take for us to make the sync flawless (remembering explore selection related issues).
     * let them decide if they need it.
     *
     */
    const selectedIds = this.getSelectedIds();
    this.selectedGeoCount = selectedIds.length;
    // if it is already custom, preserver the original selection here.
    if (this.activeSelection.key !== 'custom') {
      this.previousSelection = this.activeSelection.key;
    }
    if (this.selectedGeoCount > 0) {
      this.activeSelection = this.selectables[4];
    } else {
      this.activeSelection = this.selectables[5];
    }
  }

  private selectItems(count: number): void {
    this.geographies.forEach(item => item.selected = false);
    this.geographies
      .slice(0, count)
      .forEach(item => {
        item.selected = true;
      });
    this.geographies = [...this.geographies];

  }

  private clearFilterLayersFromMap(): void {
    const ref = 'geoLayer-filtered';
    const refHighlighted = 'geoLayer-filtered-unselected';
    if (this.map.getLayer(ref)) {
      this.map.off('mouseenter', ref);
      this.map.off('mouseleave', ref);
      // TODO: Enable once the map events have been added
      /*this.map.off('click', ref);*/
      this.map.removeLayer(ref);
    }
    if (this.map.getLayer(refHighlighted)) {
      this.map.removeLayer(refHighlighted);
      // TODO : Handle removing event listeners here once they are added
    }
    // remove source after removing the layer.
    if (this.map.getSource('geoLayer')) {
      this.map.removeSource('geoLayer');
    }
  }

  private drawGeographyOnMap(geoType: keyof GeographyType, filteredIdsObjects: GeoIdObject[], redraw: boolean = false): void {
    const grad = new GradientColor();
    // Here we are checking and removing the duplicate data and sorting the data by comp value in desc order
    const dataGroup: any = Helper.removeDuplicate(Helper.deepClone(filteredIdsObjects), 'geoId').sort((item1, item2) => item2['comp'] - item1['comp']);
    let group = 1;
    dataGroup.forEach((item, index) => {
      // If first item assigning group as 1
      if (index === 0) {
        item['group'] = group;
      } else if (item.comp === dataGroup[index - 1].comp) {
        // If current item's comp value is same as previous one, will update the current item's group with previous one group
        item['group'] = dataGroup[index - 1]['group'];
      } else {
        // assigning new group
        item['group'] = ++group;
      }
    });
    const filteredIds = dataGroup.map(object => object.geoId);
    const colors = grad.generate(this.activeStrokeColor, group + 1);
    this.keyLegendColors = this.exploreService.colorGenerater(this.activeStrokeColor);
    this.isKeylegend = true;
    colors.pop();
    // get map layer
    const geoLayer: MapLayerDetails = this.populationService.getMapLayer(geoType);
    // create color code array for mapbox layer fill using match
    const colorCode = ['match', ['get', 'geoid']];
    dataGroup.forEach((item, index) => {
      colorCode.push(item.geoId, colors[item.group - 1]);
    });
    // To fix this error fs.js:3 Error: layers.geoLayer-filtered.paint.fill-color: Expected an even number of arguments.
    // The below line is added to fix the above issue but have to check in other scenarios as well
    colorCode.push(colors[colors.length - 1]);
    // preparing filters using the given IDs
    const filterQuery = ['in', 'geoid', ...filteredIds];
    if (!this.map.getSource('geoLayer')) {
      this.map.addSource('geoLayer', {
        type: 'vector',
        url: geoLayer['url']
      });
    }
    if (!this.map.getLayer('geoLayer-filtered')) {
      this.map.addLayer({
        'id': 'geoLayer-filtered',
        'type': 'fill',
        'source': 'geoLayer',
        'source-layer': geoLayer['source-layer'],
        minzoom: 0,
        'paint': {
          'fill-outline-color': '#551875',
          'fill-opacity': 0.8,
          'fill-color': colorCode
        },
        'filter': filterQuery
      });

      const popup = MapboxFactory.produce(MapboxFactoryEnum.POPUP, {
        closeButton: false,
        closeOnClick: false
      });
      /** On mouse hover display the map popup and then show the geography name */
      this.map.on('mousemove', 'geoLayer-filtered', (e) => {
        const features = e.features;
        this.map.getCanvas().style.cursor = 'pointer';
        if (features && features.length && features[0]['properties']) {
          const content = document.createElement('div');
          if(features[0].properties.geo_type == 'COUNTY'){
            content.innerHTML = `<p>${features[0]['properties']['name']} County</p>`;
          }
          else { content.innerHTML = `<p>${features[0]['properties']['name']}</p>`;}
          content.classList.add('geography-delivery-popup');
            popup
            .setLngLat(e.lngLat)
            .setDOMContent(content)
            .addTo(this.map);
            content.parentNode['className'] += ' geoGraphy-tooltip';
        }
      });
      this.map.on('mouseleave', 'geoLayer-filtered', () => {
        this.map.getCanvas().style.cursor = '';
        popup.remove();
      });
    }
    if (!this.map.getLayer('geoLayer-filtered-unselected')) {
      this.map.addLayer({
        'id': 'geoLayer-filtered-unselected',
        'type': 'fill',
        'source': 'geoLayer',
        'source-layer': geoLayer['source-layer'],
        minzoom: 0,
        'paint': {
          'fill-outline-color': '#ffeeee',
          'fill-opacity': 1,
          'fill-color': '#9e9e9e'
        },
        'filter': ['in', 'geoid', '']
      });
    }

    // While switching map style to attain selected data in the map we need to call redraw method
    if (redraw) {
      this.redrawHeatMapOnSelection();
    }
  }

  private redrawHeatMapOnSelection() {
    const selectedGeoIds: string[] = this.getSelectedIds();
    const unselectedIds = this.geoIds.filter(geoIdObj => !selectedGeoIds.includes(geoIdObj.geoId)).map(object => object.geoId);
    if (this.map.getLayer('geoLayer-filtered-unselected')) {
      const filterQuery = ['in', 'geoid', ...unselectedIds];
      // clearing existing filters set on the layer if any
      this.map.setFilter('geoLayer-filtered-unselected', ['in', 'geoid', '']);
      this.map.setFilter('geoLayer-filtered-unselected', filterQuery);
    }
  }

  private refreshSummaryOnSelection() {
    const selectedIds: string[] = this.getSelectedIds();
    this.summary = null;
    if (selectedIds.length <= 0) {
      return;
    }
    const reqData: PopulationDetailsRequest = this.formatFilterData();
    const market: PopulationFilters = {
      ids: this.getSelectedIds()
    };
    reqData.market = market;
    this.populationService.getSummaryWithIDs(reqData, this.selectedSort)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((response: PopulationDetailsResponse) => {
        this.calculateAndSetSummary(response);
      }, error => {
        this.snackBar.open('There are some issues in getting the summary, please try again.', 'OK', {
          duration: 2000,
        });
      });
  }

  /**
   * Move the zendesk button postion based on right side list open & close
   */

  private setZendeskPosition() {
    const className = 'popupation-filter-open';
    const detailClassName = 'popupation-Detail-open';
    const body = document.getElementsByTagName('body')[0];
    if (this.isSideMenuOpen) {
      if (body && !(body.classList.contains(className))) {
        body.classList.add(className);
      }

      /** Enable detail view */
      if (body && this.enableDetailView && !(body.classList.contains(detailClassName))) {
        body.classList.add(detailClassName);
      } else if (body && !this.enableDetailView && body.classList.contains(detailClassName)) {
        body.classList.remove(detailClassName);
      }
    } else {
      if (body && body.classList.contains(className)) {
        body.classList.remove(className);
      }
      if (body && !this.enableDetailView && body.classList.contains(detailClassName)) {
        body.classList.remove(detailClassName);
      }
    }

  }

  private getSelectedIds(): string[] {
    /**
     * The below uses Typescript Exclude to exclude few values from an interface.
     * https://www.typescriptlang.org/docs/handbook/advanced-types.html
     * We are limiting to those definite bulk selection values which can be handled with a single function here.
     */
    const definiteBulkActions: Exclude<keyof PopulationSelectableValues, 'custom' | 'none'>[] = ['all', 'top25', 'top50', 'top100'];
    const currentBulkAction = definiteBulkActions.find(item => item === this.activeSelection.key);
    if (currentBulkAction) {
      return this.getGeoIdsInOrder(currentBulkAction).map(object => object.geoId);
    }
    return this.getCustomSelectionGeoIds(this.previousSelection);
  }

  /**
   * This will return the geoIds of required length from the collection of GeoIds returned from the API.
   * This Collection includes all the IDs without pagination, so we don't have to worry about getting only
   * the available ids in local.
   *
   * The order method will be used when the selection is known and limited to a set of continuous Ids such as
   * top 100, top 50, top 25 or all, in all those cases we can get those Ids just by slicing the geoIds
   * collection with the right count to get the selected IDs.
   */
  private getGeoIdsInOrder(definiteBulkActions: Exclude<keyof PopulationSelectableValues, 'custom' | 'none'>): GeoIdObject[] {
    switch (definiteBulkActions) {
      case 'all':
          const unSelectedIds: string[] = this.geographies
            .filter(item => !item.selected)
            .map(item => item.geoId);
          return this.geoIds.filter(object => !unSelectedIds.includes(object.geoId));
        // return this.geoIds;
        break;
      case 'top100':
        return this.geoIds.slice(0, 100);
        break;
      case 'top50':
        return this.geoIds.slice(0, 50);
        break;
      default:
        return this.geoIds.slice(0, 25);
        break;
    }
  }

  public compareObjects(o1: any, o2: any): boolean {
    return o1.display === o2.display && o1.key === o2.key;
  }

  /**
   * This method will return the selected Ids based on the current and previous selection states,
   * Little tricky to implement because we are maintaining the selection state with population.
   * But it is a well thought out trade-off, having the selection state separately from the geographies
   * array will be a performance nightmare because of constantly having to check if this ID is selected
   * or not.
   *
   * Having it in geo collection makes the UI and selection state handling easy and will go easy on the
   * performance, but it'll make the process of collecting the selectedIds trickier. This is the case
   * in both inventory library and population library, but since collecting the selectedIDs is not used
   * as much as the selection state handling/rendering, this is a decision made after some pitiful
   * experiences with separating the selection state away from the data in inventory library.
   */
  private getCustomSelectionGeoIds(previousSelection: keyof PopulationSelectableValues): string[] {
    switch (previousSelection) {
      case 'all': {
        const unSelectedIds: string[] = this.geographies
          .filter(item => !item.selected)
          .map(item => item.geoId);
        return this.geoIds.filter(object => !unSelectedIds.includes(object.geoId)).map(object => object.geoId);
        break;
      }
      case 'none': {
        const selectedIds: string[] = this.geographies
          .filter(item => item.selected)
          .map(item => item.geoId);
        return selectedIds;
        break;
      }
      default : {
        const selectedIds: string[] = this.geographies
          .filter(item => item.selected)
          .map(item => item.geoId);
        return selectedIds;
      }
    }
  }

  /**
   * @description
   *
   *  To clear the  custom features polygon and draw controls
   * @param updateMap
   */
  removePolygon(updateMap = true) {
    // todo:  polygon features need to use.
    // note use polygon property from location filter
    this.locationFilter.removePolygon(updateMap);
  }

  // initializing the draw functionality of custom polygon
  drawPolygon() {
    this.locationFilter.drawPolygon();
  }

  drawCircle() {
    this.locationFilter.drawCircle();
  }

  /**
   *  @description
   *   Close the left side nav
   */
  onCloseFilterTab() {
    const sidenavOptions = {open: false, tab: ''};
    this.populationDataService.setFilterSideNav(sidenavOptions);
  }

  /**
   * @description
   *   Initializing map draw instance for drawing polygon
   *  on map surface.
   */
  initializeMapDraw() {

    this.draw = new MapboxDraw({
      displayControlsDefault: false,
      styles: this.commonService.getStylesData(),
      modes: Object.assign({
        draw_radius: RadiusMode,
      }, MapboxDraw.modes)
    });


  }


  // Layers and display code begin


  private applyViewLayers() {
    this.loaderService.display(true);
    //const layersSession = this.layersService.getlayersSession(this.layerType);
    const layersSession = this.layersService.getlayersSession('primary');
    this.layersService.setClearLogoStyle({
      type: 'primary',
      flag: true
    });
    if (layersSession && layersSession['display']) {
      const mapStyle = layersSession['display']['baseMap'];
      this.style = this.commonService.getMapStyle(this.baseMaps, mapStyle);
      layersSession['display']['baseMap'] = this.style['label'];
      if (layersSession['display']['baseMap'] && this.mapStyle !== layersSession['display']['baseMap']) {
        // Enable if map popup added
        // if (this.mapPopup.isOpen()) {
        //   this.mapPopup.remove();
        // }
        this.mapStyle = layersSession['display']['baseMap'];
        this.selectedMapStyle = this.mapStyle;
        this.style = this.commonService.getMapStyle(this.baseMaps, this.mapStyle);
        this.map.setStyle(this.style['uri']);
        this.map.once('style.load', () => {
          this.map.fitBounds(this.mapBounds);
          this.map.setZoom(this.zoomLevel);
          // While switching map style we need to redraw the map
          this.drawGeographyOnMap(this.selectedGeo, this.geoIds, true);
        });
      } else {
        if (typeof layersSession['display']['mapControls'] !== 'undefined') {
          this.showMapControls = layersSession['display']['mapControls'];
        }
        if (typeof layersSession['display']['mapLegend'] !== 'undefined') {
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
            this.mapWidthHeight = layersSession['display']['screen'];
          }
        }
        this.loadViewLayers();
      }
    }
    this.loaderService.display(false);
  }

  loadViewLayers() {
    this.removeLayers();
    this.layerInventorySetLayers = [];
    this.layerInventorySetDataSets = [];
    this.GeoSetLayerIds = [];
    //const layersSession = this.layersService.getlayersSession(this.layerType);
    const layersSession = this.layersService.getlayersSession('primary');
    if (layersSession
      && layersSession['selectedLayers']
      && layersSession['selectedLayers'].length > 0) {
      const geoLayerData = [];
      const geoMarkerIconData = [];
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

              if (layerData['data']['client_id'] && Number(layerData['data']['client_id']) === Number(this.themeSettings['clientId'])) {
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
                          opp: this.layersService.getOperatorName(inventory.representations),
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
                          opp: this.layersService.getOperatorName(customSpotInventory.representations),
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
              this.placeFilterService.getPlaceSetsSummary(params, true).subscribe(layer => {
                const data = layer['data'][0];
                const layerInfo = {
                  type: 'FeatureCollection',
                  features: data['pois']
                };
                this.map.getSource(placeSetNationalLevelSource).setData(this.layersService.formatUpPlaceNationalData(layerInfo));
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

            this.placeFilterService.getPlaceSetsSummary(params, false).subscribe(layer => {
              const data = layer['data'][0];
              const layerInfo = {
                type: 'FeatureCollection',
                features: data['pois']
              };
              this.map.getSource(placeSetLayerSource).setData(layerInfo);
            });
            break;
          case 'place':
            const placeLayerId =  'placeLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            const placeLayerDataId =  'placeLayerData' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            this.layerInventorySetLayers.push(placeLayerId);
            this.addNewPlaceLayer(placeLayerId, placeLayerDataId, layerData, true);
            break;
          case 'geography':
            layerData['data']['properties']['icon'] = layerData['icon'];
            layerData['data']['properties']['color'] = layerData['color'];
            layerData['data']['properties']['id'] = layerData['id'];

            const name = layerData['data']['properties']['name'];
            const pointGeo = turfCenter(layerData['data']);
            pointGeo['properties']['icon'] =  layerData['icon'];
            pointGeo['properties']['color'] =  layerData['color'];
            pointGeo['properties']['id'] =  layerData['id'];
            pointGeo['properties']['name'] =  name;

            delete layerData['data']['id'];
            delete layerData['data']['name'];
            geoLayerData.push(layerData['data']);
            geoMarkerIconData.push(pointGeo);
            break;

          case LayerType.GEO_SETS:
            const layerId = this.baseLayersIns.addGeoSetLayer(this.mapLayers, layerData);
            if(layerId) this.GeoSetLayerIds.push(layerId);
            break;



          /*
          Commented for now as this layer is overlapping with population
          case 'geopathId':
            if (typeof layerData['data'] !== 'string') {
              layerData['data'] = layerData['id'];
            }
            const topData = {
              'fid': layerData['data'],
              'replevel': (layerData['heatMapType'] === 'top_markets') ? 'dma' : 'zip_code',
            };
            forkJoin([
              this.inventoryService
                .getSingleInventory({
                  spotId: layerData['data'],
                  'target_segment': this.defaultAudience.audienceKey,
                  'base_segment': this.defaultAudience.audienceKey
                })
                .pipe(catchError(error => EMPTY)),
              this.exploreService.getInventoryDetailZipDMA(topData).pipe(catchError(error => EMPTY))
              ]).subscribe(response => {
              this.layersService.cleanUpMap(this.map);
              if (layerData['heatMapType'] === 'top_markets' && response[1]['data'] && Object.keys(response[1]['data']).length !== 0) {
                this.isLayerKeylegend = true;
                this.layersService.loadTopMarket(response[1], this.map, layerData.color, 'top_markets');
                this.keyLegendColors = this.exploreService.colorGenerater(layerData.color);
                this.currentSingleInventory = topData;
                const minValue = this.layersService.getMinValue(response[1]['data'][0]);
                const maxVlaue = this.layersService.getMaxValue(response[1]['topFour']);
                if (minValue === 0) {
                  this.currentSingleInventory['minValue'] = '0.00';
                } else {
                  this.currentSingleInventory['minValue'] = this.format.convertToPercentageFormat(minValue, 2).toString();
                }
                this.currentSingleInventory['maxValue'] = this.format.convertToPercentageFormat(maxVlaue, 2).toString();
              } else if (layerData['heatMapType'] === 'top_zips' && response[1]['data'] &&
                Object.keys(response[1]['data']).length !== 0) {
                this.layersService.loadTopZipCode(response[1], this.map, layerData.color, 'top_zips');
                this.isLayerKeylegend = true;
                this.keyLegendColors = this.exploreService.colorGenerater(layerData.color);
                this.currentSingleInventory = topData;
                const minValue = this.layersService.getMinValue(response[1]['data'][0]);
                const maxVlaue = this.layersService.getMaxValue(response[1]['topFour']);
                if (Number(minValue) === 0) {
                  this.currentSingleInventory['minValue'] = '0.00';
                } else {
                  this.currentSingleInventory['minValue'] = this.format.convertToPercentageFormat(minValue, 2).toString();
                }
                this.currentSingleInventory['maxValue'] = this.format.convertToPercentageFormat(maxVlaue, 2).toString();
              } else {
                this.isLayerKeylegend = false;
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
              this.loaderService.display(false);
            });
            break; */
        }
      }
      const selectedGeoSetLayer = layersSession['selectedLayers'].filter(layer => (layer.type === 'geo sets'));

      if (selectedGeoSetLayer.length) {
        this.baseLayersIns.addLayerSource(this.map);
        this.baseLayersIns.bindGeoSetIcon(this.GeoSetLayerIds, this.map);
      }
      this.addNewGeographyLayers(geoLayerData, geoMarkerIconData);

    } else {
      this.isLayerKeylegend = false;
      this.loaderService.display(false);
      this.removeGeographyLayers();
      this.removeLayers();
    }

    /** Generate key legend */
    clearTimeout(this.keyLegendsTimeer);
    this.keyLegendsTimeer = setTimeout(() => {
      const layerSession = this.layersService.getlayersSession(this.layerType);
      this.mapLegendsService.generateKeyLegends(this.map, layerSession, this.mapStyle, this.zoomLevel, this.layerType);
    }, 500);
  }
  private clearLayerView(clearAll = true) {
    this.showMapControls = true;
    this.showMapLegends = true;
    this.isLayerKeylegend = false;
    this.removeLayers();
    this.removeGeographyLayers();
    if (clearAll && this.mapStyle !== 'light') {
      this.mapStyle = this.layersService.getDefaultMapStyle(this.baseMaps);
      this.style = this.commonService.getMapStyle(this.baseMaps, this.mapStyle);
      this.map.setStyle(this.style['uri']);
      this.map.once('style.load', () => {
        this.map.fitBounds(this.mapBounds);
        this.map.setZoom(this.zoomLevel);
        // While switching map style we need to redraw the map
        this.drawGeographyOnMap(this.selectedGeo, this.geoIds, true);
      });
    }
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

    if (this.GeoSetLayerIds.length > 0) {
      /** center icon layer */

      if (this.map.getLayer('geoSetPointCenter')) {
       this.map.removeLayer('geoSetPointCenter');
     }
     if (this.map.getSource('geoSetPoint')) {
       this.map.removeSource('geoSetPoint');
     };
     this.baseLayersIns.selectedLayersMapIds = [];

     this.GeoSetLayerIds.map(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
     });
   }
    this.layerInventorySetDataSets = [];
    this.layerInventorySetLayers = [];
    this.GeoSetLayerIds = [];
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


  /**
   * A method to create a new place layer
   * @param layerId
   * @param dataSourceId
   */
  private addNewPlaceLayer(layerId, dataSourceId, layerData, singlePlaceLayer = false) {
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
    this.map.on('mouseenter', layerId, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', layerId, () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  private addNewGeographyLayers (geoLayerData, geoMarkerIconData) {
    this.removeGeographyLayers();
    // to draw the polygon line
    this.map.addSource( 'geoDataline' , {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: geoLayerData
      }
    });
    // to fill the color inside the polygon area
    this.map.addSource( 'geoDataFill' , {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: geoLayerData
      }
    });
    // Add the icon in center places of polygon area
    this.map.addSource( 'geoDataPoint' , {
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
        'text-offset': [0 , 0.6]
      },
      paint: {
        'text-translate-anchor': 'viewport',
        'text-color': ['get', 'color']
      }
    });
  }

  // Layers and display option code end

  // Close side nav
  public onCloseFilter() {
    this.populationDataService.setFilterSideNav({open: false, tab: this.filterOpenDetails['tab']});
  }
  // Open side nav
  public openFilterNav() {
    if (this.filterOpenDetails && this.filterOpenDetails['tab']) {
      this.populationDataService.setFilterSideNav({open: true, tab: this.filterOpenDetails['tab']});
    } else {
      this.populationDataService.setFilterSideNav({open: true, tab: 'target'});
    }
  }

  public filterByPlaceSets(polygonInfo) {
    this.removePolygon(false);
    // this.polygonInfo = polygonInfo;
    this.locationFilter.placeSetsDisplay = true;
    if (polygonInfo.radiusValue > 0) {
      this.locationFilter.polygonData = polygonInfo.featureCollection;
      this.locationFilter.customPolygon.coordinates = polygonInfo.polygon.geometry.coordinates;
      this.locationFilter.togglePolygonLayerView(true);
    }
    this.populationService.setSelectedPlacesCtrlValue(polygonInfo.selectedPlaces);
    this.populationService.setRadiusCtrlValue(polygonInfo.radiusValue);
    this.populationService.setPopulationFilter('location',
      { region: this.locationFilter.customPolygon, type: 'placeSetView', placePackState: polygonInfo });
  }

  /**
   * @description
   *
   *  Listen for when filter by geographies and radius
   */
  private listenForFilterByPlaceSets() {
    this.locationFilter.getFilteredByPlaceSets().pipe(
      takeUntil(this.unSubscribe)
    ).subscribe((data) => {
      this.filterByPlaceSets(data);
    });
  }

  /**
   * @description
   *  Listen for when custom shape filter applied
   */
  private listenForCustomShapeFilterData() {
    this.locationFilter.getCustomPolygonFilters().pipe(
      takeUntil(this.unSubscribe)
    ).subscribe((data) => {
      this.populationService.setPopulationFilter('location', data);
    });
  }

  public specificGeographyApply(selectedSpecificGeography) {
    this.populationService.setPopulationFilter('specificGeography', selectedSpecificGeography);
  }
}
