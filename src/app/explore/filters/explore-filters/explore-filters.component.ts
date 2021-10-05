import {ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {Filters} from '@interTypes/filters';
import {WorkflowLables} from '@interTypes/workspaceV2';
import {
  AuthenticationService,
  CommonService,
  ExploreDataService,
  ExploreService,
  FormatService,
  ThemeService,
  InventoryService,
  TargetAudienceService
} from '@shared/services';
import turfCircle from '@turf/circle';
import * as turfHelper from '@turf/helpers';
import turfUnion from '@turf/union';
import {takeWhile, catchError, debounceTime, distinctUntilChanged, map, takeUntil} from 'rxjs/operators';
import swal from 'sweetalert2';
import {FiltersService} from '../filters.service';
import { PlacesFiltersService } from 'app/places/filters/places-filters.service';
import {EMPTY, forkJoin, Observable, Subject, of} from 'rxjs';
import {ChipSource, GroupAutocompleteChipSource} from '@interTypes/ChipsInput';
import {Geography} from '@interTypes/inventory';
import {MarketSelectionState} from '@interTypes/marketType';
import {Pagination} from '@interTypes/pagination';
import {BasePlaceSets, Helper} from '../../../classes';
import {GeographySet} from '@interTypes/Population';
import { MarketTypeEnum } from '@interTypes/enums/market-type';
import { LayersService } from 'app/explore/layer-display-options/layers.service';
import { LazyLoaderService } from '@shared/custom-lazy-loader';
import { MatExpansionPanel } from '@angular/material/expansion';

@Component({
  selector: 'app-explore-filters',
  templateUrl: './explore-filters.component.html',
  styleUrls: ['./explore-filters.component.less']
})
export class ExploreFiltersComponent implements OnInit, OnDestroy {

  @ViewChild('defineTargetExpPanel') defineTargetExpPanel: MatExpansionPanel;
  @Input() mapLayers: any;
  @Input() inventoryGroupIds: any;
  @Input() placeLayerVisibility: boolean;
  @Output() exploreLoadMapView: EventEmitter<any> = new EventEmitter();
  @Output() exploreDrawPolygon: EventEmitter<any> = new EventEmitter();
  @Output() exploreDrawCircle: EventEmitter<any> = new EventEmitter();
  @Output() exploreRemovePolygon: EventEmitter<boolean> = new EventEmitter();
  @Output() exploreDrawGeopolygon: EventEmitter<any> = new EventEmitter();
  @Output() editInventoryPackage: EventEmitter<boolean> = new EventEmitter();
  @Output() drawPolygons: EventEmitter<any> = new EventEmitter();
  @Output() drawCustomPolygon: EventEmitter<any> = new EventEmitter();
  @Output() setSessionMapPosition: EventEmitter<any> = new EventEmitter();
  @Output() filterByPlaceSets: EventEmitter<any> = new EventEmitter();
  @Output() toggleLocationFilterLayer: EventEmitter<any> = new EventEmitter();
  @Output() loadDynamicMapView: EventEmitter<any> = new EventEmitter();
  @Output() removeDynamicMapView: EventEmitter<any> = new EventEmitter();
  public geographySearch$: Observable<GroupAutocompleteChipSource<Geography>[]>;
  public selectedGeographies: ChipSource<Geography>[] = [];
  showFilter = false;
  open = false;
  selectedTab = 0;
  tabHeaderHeight = '64px';
  public filters: Partial<Filters> = {};
  public filtersSelection: Partial<Filters> = {};
  public mobileView: boolean;
  public loadertrue = false;
  public isMarketlocationAvailable = false;
  public selectedAudienceList: any = {};
  public isScenario = false;
  public selectedPlacesCtrl: FormControl = new FormControl();
  public radiusCtrl: FormControl = new FormControl(1, [Validators.required, Validators.min(0.00000001)]);
  public geographySearchCtrl: FormControl = new FormControl();
  public mouseIsInsideFilter = false;
  public unSubscribe: any = true;
  private freeUp: Subject<void> = new Subject<void>();
  private defaultAudience = {};
  public allowInventory = '';
  public allowInventoryAudience  = '';
  public isPopulationEnabled: boolean;
  public audienceLicense = {};
  public mod_permission: any;
  public scenario_mod_permission: any;
  public places_mod_permission: any;
  public allowScenarios = '';
  public isThresholdsPanel = false;
  public openAudience = false;
  public headerHeight: any;
  public workflowLabels: WorkflowLables;
  public inventorySetModulePermission: any;
  isMediaAttributesSearchEnabled: any;
  public isRadiusFilterEnabled: string;
  public isCustomInventoryEnabled: string;
  public isPolygonFiltersEnabled: string;
  public inventoryManagementEnabled = false;

  // placesets pagination
  public isLoading = false;
  public pageInation: Pagination = { page: 1, size: 10, total: 10 };

  // tab group index
  public tab = Object.seal({
    DEFINE_TARGET: 0,
    FILTER_INVENTORY: 1,
    INVENTORY_MANAGEMENT: 2,
    LAYERS_AND_DISPLAY: 3,
    ACTIONS: 4
  });
  public geoSetsLazyLoader = new LazyLoaderService();
  public assignMarketGeoSetsLazyLoader = new LazyLoaderService();
  public operatorsLazyLoader = new LazyLoaderService();
  public inventorySetsLazyLoader = new LazyLoaderService();
  public placeSetsLazyLoader = new LazyLoaderService();
  public searchFromCtl = new FormControl();
  public audianceLazyLoader = new LazyLoaderService();
  public includeType = 'explore';
  constructor(
    private commonService: CommonService,
    private filterService: FiltersService,
    private exploreService: ExploreService,
    private exploreDataService: ExploreDataService,
    private formatService: FormatService,
    private route: ActivatedRoute,
    private auth: AuthenticationService,
    private theme: ThemeService,
    public placeFilterService: PlacesFiltersService,
    private inventoryService: InventoryService,
    public cdRef: ChangeDetectorRef,
    private layersService: LayersService,
    private targetAudienceService: TargetAudienceService

  ) {
    // super(placeFilterService, cdRef);
    this.workflowLabels = this.commonService.getWorkFlowLabels();
  }

  ngOnInit() {

    this.theme.getDimensions().pipe(takeWhile(() => this.unSubscribe)).subscribe(data => {
      this.headerHeight = data.headerHeight;
    });
    const inventoryPermission = this.auth.getUserFeaturePermissions('inventory');
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.scenario_mod_permission = this.auth.getModuleAccess('v3workspace');
    this.places_mod_permission = this.auth.getModuleAccess('places');
    const populationAccess = this.auth.getModuleAccess('populationLibrary');
    this.isPopulationEnabled = (populationAccess && populationAccess['status'] === 'active');
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    this.isRadiusFilterEnabled =  this.mod_permission['features']['radiusSearch']['status'];
    this.isPolygonFiltersEnabled =  this.mod_permission['features']['polygonSearch']['status'];
    this.isCustomInventoryEnabled = this.mod_permission['features']['customInventories']['status'];
    this.allowScenarios = this.scenario_mod_permission['status'];
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    this.inventorySetModulePermission = this.mod_permission['features']['inventorySet'];
    this.isMediaAttributesSearchEnabled = this.mod_permission['features']['mediaAttributesSearch'];

     /** Enable inventory management inventoryManagement = Active && user inventory write : true */
     const invManagement = this.mod_permission['features']['inventoryManagement'];
     this.inventoryManagementEnabled = (((invManagement && invManagement['status'].toLowerCase() === 'active') && (inventoryPermission?.write === true)));

    const routeData = this.route.snapshot.data;
    if (routeData.defaultAudience) {
      this.defaultAudience = routeData.defaultAudience;
    }
    this.commonService.onDataVersionChange().subscribe((data) => {
      this.targetAudienceService
          .getDefaultAudience(false, data.toString())
          .subscribe((audience) => {
            this.defaultAudience = audience;
            this.defineTargetExpPanel?.close();  /* Audience value update issue handled by manually closing panel */
        });
    });
    this.mobileView = this.commonService.isMobile();
    if (this.mobileView) {
      this.tabHeaderHeight = '40px';
    }

    this.listenForFilterSideNavChanges();

    this.filterService.getFilters()
      .pipe(
      debounceTime(200),
      distinctUntilChanged())
      .subscribe(filters => {
        this.filters = filters.data;
        this.filtersSelection = filters.selection || {};
        /** This code is used to load the specific geography filter when loading scenario */
        if (this.filters['location'] && this.filters['location']['selectedGeoLocation']) {
          this.selectedGeographies = this.filters['location']['selectedGeoLocation'];
        }
      });
    this.filterService.onOverrideGeographyFilter()
      .pipe(
        map((data: MarketSelectionState) => {
          let marketType;
          if (data.type === 'GEO_SET' && data.selectedGeographySet) {
            marketType = data.selectedGeographySet.market_type;
          } else {
            marketType = data.type;
          }
          const chips: ChipSource<Geography>[] = data.selectedMarkets.map(market => {
            return {
              label: `${marketType}: ${market.name}`,
              data: {
                id: market.id,
                type: marketType,
                label: market.name,
              }
            };
          });
          return chips;
        }),
        distinctUntilChanged(),
        takeUntil(this.freeUp))
      .subscribe((geographies: ChipSource<Geography>[]) => {
        this.selectedGeographies = geographies;
        this.applyForm();
      });
    this.filterService.getFilterSidenavOut().pipe(takeWhile(() => this.unSubscribe)).subscribe(state => {
      if (state) {
        this.mouseIsInsideFilter = true;
      } else {
        this.mouseIsInsideFilter = false;
      }
    });
    this.filterService.onReset()
      .subscribe(type => {
      this.removePolygon();
    });
    this.exploreDataService.onMapLoad().pipe(takeWhile(() => this.unSubscribe))
      .subscribe(event => {
        if (event) {
          this.loadFilterSession();
        }
    });
    this.exploreDataService.getSelectedPlacesCtrlValue().pipe(takeWhile(() => this.unSubscribe))
      .subscribe(value => {
        this.selectedPlacesCtrl.setValue(value);
      });
    this.exploreDataService.getRadiusCtrlValue().pipe(takeWhile(() => this.unSubscribe))
      .subscribe(value => {
        if (value > 0) {
          this.radiusCtrl.setValue(value);
        } else {
          this.radiusCtrl.setValue(1);
        }
      });
    this.filterService.checkSessionDataPushed()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(val => {
        if (val) {
          this.loadFilterSession();
        }
    });
    this.isLoading = true;
    // this.setPlaceSets();
    // this.listenForPlacesetsSearch();
    // this.placeFilterService.getPlacesSet(false).subscribe(response => {
    //   this.placePacks = response['data'];
    //   this.filteredPlacePacks = response['data'];
    //   this.filteredPlacePacks.sort(this.formatService.sortAlphabetic);
    // });
    this.geographySearchCtrl.valueChanges
    .pipe(takeWhile(() => this.unSubscribe),
    debounceTime(500))
      .subscribe((value) => {
        this.searchGeographies(value);
    });
  }
  mouseHover(event) {
    this.mouseIsInsideFilter = true;
  }
  mouseLeave(event) {
    this.mouseIsInsideFilter = false;
  }
  ngOnDestroy() {
    this.unSubscribe = false;
    this.freeUp.next();
    this.freeUp.complete();
    // super.ngOnDestroy();
  }

  onOpenOrClose(flag) {
    if (flag) {
      this.showFilter = flag;
    } else {
      setTimeout(() => {
        this.showFilter = flag;
      }, 1000);
    }

  }

  // to load default map view polygon
  loadMapView() {
    this.exploreLoadMapView.emit();
    this.onCloseFilterTab();
  }

  // to draw custom polygon
  drawPolygon() {
    this.exploreDrawPolygon.emit();
    this.onCloseFilterTab();
  }

  drawCircle() {
    this.exploreDrawCircle.emit();
    this.onCloseFilterTab();
  }

  // clear polygons
  removePolygon() {
    this.onCloseFilterTab();
    this.selectedGeographies = [];
    this.geographySearchCtrl.setValue('');
    this.selectedPlacesCtrl.setValue([]);
    this.radiusCtrl.setValue(1);
    this.searchFromCtl.setValue('');
    this.exploreRemovePolygon.emit(true);
    this.removeDynamicMapView.emit();
    this.filterService.toggleFilter('location', false);
  }

  applyForm() {

    /*if (this.selectedGeoLocation) {
      this.exploreDrawGeopolygon.emit(this.selectedGeoLocation);
    }*/
    if (this.selectedGeographies.length) {
      this.exploreDrawGeopolygon.emit(this.selectedGeographies);
    }
    if (this.selectedPlacesCtrl.value && this.selectedPlacesCtrl.value.length > 0) {
      if (this.radiusCtrl.value <= 0 || this.radiusCtrl.value === '') {
        swal('Warning', 'Please enter a distance greater than zero.', 'warning');
        return false;
      }
      this.searchByPlaceSets();
    }
    return true;
  }

  public searchGeographies(value: string) {
    this.geographySearch$ = this.inventoryService.getGeographies(value, false);
  }
  public geographySelected(selected: Geography) {
    const existGeo = this.selectedGeographies.filter(geo => geo['data']['id'] === selected.id && geo['data']['type'] === selected.type);
    if (existGeo && existGeo.length <= 0) {
      const label = `${selected.type}: ${selected.label}`;
      const geography: ChipSource<Geography> = {label: label, data: selected};
      this.selectedGeographies = [...this.selectedGeographies, geography];
    }
  }
  public onGeographyRemoved(removed) {
    this.selectedGeographies = this.selectedGeographies.filter(geography => {
      return geography.data.id !== removed.data.id;
    });
  }


  private searchByPlaceSets() {
    let featuresCollection: any;
    featuresCollection = turfHelper.featureCollection([]);
    let radius = 0;
    let combinedFeature: any;
    const selectedPlaceDetails = [];
    const selectedPanels = [];
    if (this.radiusCtrl.value > 0) {
      radius = this.radiusCtrl.value;
      const placesId = [];
      this.selectedPlacesCtrl.value.forEach(place => {
        placesId.push(place._id);
      });
      const params = {'ids': placesId};
      this.placeFilterService.getPlaceSetsSummary(params).subscribe( response => {
        if (response['data'].length > 0) {
          const queryArray = [];
          response['data'].forEach(place => {
            selectedPlaceDetails.push(place);
            place['pois'].map(poi => {
              selectedPanels.push(poi.properties.safegraph_place_id);
              queryArray.push({
                geo_distance: {
                  distance :  `${radius}mi`,
                  'location.geo_point' : poi.geometry.coordinates
                }
              });
              const circleFeature = turfCircle(poi.geometry.coordinates, radius, {steps: 64, units: 'miles', properties: poi.properties});
              featuresCollection.features.push(circleFeature);
            });
          });
          if (featuresCollection.features.length) {

            if(featuresCollection.features.length < 2){
              // If only one feature present converting that in to polygon
              combinedFeature = Helper.deepClone(featuresCollection.features[0]);
            } else {
              // If more than one feature present then combining them in to polygon
              // @ts-ignore
              combinedFeature = turfUnion(...featuresCollection.features);
            }
            combinedFeature.geometry.coordinates.map((coordinate, index) => {
              if (coordinate.length > 1) {
                combinedFeature.geometry.coordinates[index] = [coordinate];
              }
            });
            const requests = [];
            requests.push(this.inventoryService.getInventoryFromElasticSearch(
              this.inventoryService.prepareGeoSpatialQuery(queryArray), false, 'geopath').pipe(
                map((result) => result['aggregations']['spots']['ids']['buckets'].map(spot => spot.key
                )), catchError(() => of([]))));
            if (this.isCustomInventoryEnabled && this.isCustomInventoryEnabled === 'active') {
              requests.push(this.inventoryService.getInventoryFromElasticSearch(
              this.inventoryService.prepareGeoSpatialQuery(queryArray), false).pipe(
                map((result) => result['aggregations']['spots']['ids']['buckets'].map(spot => spot.key
                )), catchError(() => of([])) ) );
            }
            forkJoin(requests).subscribe(results => {
              this.filterByPlaceSets.emit({
                featureCollection: featuresCollection,
                polygon: combinedFeature,
                selectedPanels: selectedPanels,
                selectedPlaces: this.selectedPlacesCtrl.value,
                radiusValue: radius,
                selectedPlaceDetails: selectedPlaceDetails,
                spatialSearchInvIds: results[0] || [],
                spatialSearchCustomInvIds: results[1] || []
              });
            });
          }
        }
      });
    }
  }

  onCloseFilterTab() {
    const sidenavOptions = {open: false, tab: ''};
    this.filterService.setFilterSidenav(sidenavOptions);
  }

  onCompletedBrowsing(e) {
    if (e.clearFilter) {
      this.exploreDataService.setSelectedTarget(this.defaultAudience['audienceKey']);
      this.exploreDataService.setSelectedTargetName(this.defaultAudience['description']);
    } else if (typeof e['targetAudience'] !== 'undefined') {
      const target = {};
      target['details'] = e;
      target['key'] = e['targetAudience'].audience;
      this.exploreDataService.setSelectedTarget(e['targetAudience'].audience);
      this.exploreDataService.setSelectedTargetName(e['targetAudience'].name);
      this.filterService.setFilter('audience', target);  // ['targetAudience'].audience
    }
  }

  resetAllFilter() {
    this.filterService.resetInventoryFilter();
  }

  toggleFilter($event, filterType: keyof Filters) {
    this.filterService.toggleFilter(filterType, $event.checked);
  }

  toggleSpotsIdsFilter($event) {
    this.filterService.toggleCombinedFilters($event.checked);
  }

  toggleLocationFilter($event) {
    this.onCloseFilterTab();
    this.toggleLocationFilterLayer.emit($event.checked);
    this.filterService.toggleFilter('location', $event.checked);
  }
  public compare(c1, c2) {
    return c1 && c2 && c1['_id'] === c2['_id'];
  }

  private loadFilterSession() {
    const sessionFilter = this.filterService.getExploreSession();
    if (sessionFilter && sessionFilter['data']) {
      this.filtersSelection = sessionFilter.selection || {};
      const filtersData = sessionFilter.data;
      if (filtersData['location'] && filtersData['location']['region']) {
        switch (filtersData['location']['type']) {
          case  'circularPolygon':
          this.drawCustomPolygon.emit({
            region: filtersData['location']['region'], drawCircle: true, drawPolygon: false });
          break;
          case 'regularPolygon':
          this.drawCustomPolygon.emit({
            region: filtersData['location']['region'], drawCircle: false, drawPolygon: true });
          break;
          case 'mapViewPolygon':
          this.drawPolygons.emit({multiPolygon: filtersData['location']['region'], polygonType: 'mapViewPolygon'});
          break;
          /*
          // TODO : Need to clarify with Jagadeesh about this code and change it
          case 'geoPolygon':
          this.drawPolygons.emit({
            multiPolygon: filtersData['location']['geoFilter']['geometry'],
            polygonType: 'geoPolygon', geoFilter: filtersData['location']['geoFilter']
          });
          this.searchGeographies(filtersData['location']['geoFilter']['searchParams']['name']);
          this.selectedGeoLocation = filtersData['location']['geoFilter']['searchParams'];
          break;*/
          case 'placeSetView':
          this.selectedPlacesCtrl.setValue(filtersData['location']['placePackState']['selectedPlaces']);
          this.filterByPlaceSets.emit(filtersData['location']['placePackState']);
          break;
          case 'dynamicMapView':
          this.loadDynamicMapView.emit(filtersData['location']['region']);
          break;
        }
      }
      if (filtersData['location'] && filtersData['location']['selectedGeoLocation']) {
        this.selectedGeographies = filtersData['location']['selectedGeoLocation'];
      }
    }
  }
  openThresholdFilter() {
    if (!this.isThresholdsPanel) {
      this.isThresholdsPanel = true;
    }
    this.exploreService.setThresholdsPanel(this.isThresholdsPanel);
  }
  onOpenAudience(val) {
    this.audianceLazyLoader.triggerInitialLoad();
    this.openAudience = val;
  }

  /**
   * @description
   *
   *   Handle the selected saved geography sets
   *
   * @param $event -selected geography set
   */
  onGeoSetSelected($event: GeographySet) {
    const marketType = $event.market_type === 'COUNTY' ? 'CNTY' : $event.market_type;
    const  markets = $event.markets.map((market) => ({
     label:  `${marketType}:${market.geo_name}`,
     data: {
       label: market.geo_name,
       type: $event.market_type,
       id:  `${marketType}${market.geo_id}`,
      }
    }));
    this.filterService.setFilter('location', { type: 'geography', selectedGeoLocation: markets });

  }

  /**
   * @description
   *  Reset the geographysets
   */
  onGeoSetCleared() {
    this.filterService.setFilter('location', { type: 'geography', selectedGeoLocation: [] });
  }

  /** Reset all the inventory in action menu emit */
  public resetAll(event){
    this.layersService.setApplyLayers({
      type : 'primary',
      flag : false
    });
    this.layersService.setApplyLayers({
      type : 'secondary',
      flag : false,
      closeTab: true
    });
    this.layersService.setLoadView(false);
    this.layersService.setSaveView(false);
    this.layersService.setClearView(true);
  }

  /**
   * @description
   *   Listener for sidenav tab changes
   */
  private listenForFilterSideNavChanges(){
    this.filterService.getFilterSidenav()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(data => {
        this.showFilter = true;
        this.open = data['open'];
        if (data['tab'] === 'inventory') {
          this.selectedTab = this.tab.FILTER_INVENTORY;
        } else if (data['tab'] === 'inventory_management') {
          this.selectedTab = this.tab.INVENTORY_MANAGEMENT;
        }else if (data['tab'] === 'layer') {
          this.selectedTab = this.tab.LAYERS_AND_DISPLAY;
        } else if (data['tab'] === 'actions') {
          this.selectedTab = this.tab.ACTIONS;
        } else {
          this.selectedTab = this.tab.DEFINE_TARGET;
        }
        if (!this.open) {
          this.showFilter = false;
        }
      });
  }

}

