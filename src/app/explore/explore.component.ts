import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
  HostListener,
  Renderer2,
  ChangeDetectorRef, Injector
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { BulkExportRequest } from '@interTypes/bulkExport';
import { Filters } from '@interTypes/filters';
import { WorkflowLables, NewProjectDialog } from '@interTypes/workspaceV2';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw';
import {
  AuthenticationService,
  CommonService,
  CSVService,
  ExploreDataService,
  ExploreService,
  FormatService,
  LoaderService,
  ThemeService,
  WorkSpaceService,
  WorkSpaceDataService,
  DynamicComponentService,
  MapService,
  TargetAudienceService
} from '@shared/services';
import bbox from '@turf/bbox';
import * as mapboxgl from 'mapbox-gl';
import * as mobiledetect from 'mobile-detect';
import {BehaviorSubject, forkJoin, from, zip, Subject, Observable, EMPTY, of, throwError} from 'rxjs';
import {
  catchError,
  map,
  tap,
  filter,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  first,
  mergeMap,
  switchMap,
  take
} from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LocateMeControl } from '../classes/locate-me-control';
import { Orientation } from '../classes/orientation';
import { RadiusMode } from '../classes/radius-mode';
import { FiltersService } from './filters/filters.service';
import { InventoryBulkExportComponent } from './inventory-bulk-export/inventory-bulk-export.component';
import { LayersService } from './layer-display-options/layers.service';
import { PlacesFiltersService } from '../places/filters/places-filters.service';
import { InventoryService } from '@shared/services/inventory.service';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialog } from './../Interfaces/workspaceV2';
import { ExploreLayerAndPopupComponent } from './explore-layer-and-popup/explore-layer-and-popup.component';
import { saveAs } from 'file-saver';
import { MapProperties } from '@interTypes/mapProperties';
import { PopupService } from '@shared/popup/popup.service';
import { MapboxFactory, MapboxFactoryEnum } from '../classes/mapbox-factory';
import { MapLayersInvetoryFields } from '@interTypes/enums';
import {Helper} from '../classes';
import { INVENTORY_SAVING_LIMIT } from '@constants/inventory-limits';
import { ConvertPipe } from '@shared/pipes/convert.pipe';
import { ExploreSaveScenarioV3Component } from './explore-save-scenario-v3/explore-save-scenario-v3.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExploreProjectAddV3Component } from './explore-project-add-v3/explore-project-add-v3.component';
import {MatSidenav} from '@angular/material/sidenav';
@Component({
  selector: 'app-geo-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.less'],
  providers: [TruncatePipe, ConvertPipe]
})

export class ExploreComponent extends ExploreLayerAndPopupComponent implements OnInit, OnDestroy, AfterViewInit {
  tempTab: any;
  tempOpen = false;
  isRightPanelenabled: any;
  isTabularViewEnabled: any;
  public disableInventoryList = false;
  constructor(public common: CommonService,
    public exploreService: ExploreService,
    public exploreDataService: ExploreDataService,
    public loaderService: LoaderService,
    public theme: ThemeService,
    public CSV: CSVService,
    public auth: AuthenticationService,
    public workSpaceDataService: WorkSpaceDataService,
    public workSpace: WorkSpaceService,
    public format: FormatService,
    public activatedRoute: ActivatedRoute,
    public dialog: MatDialog,
    public filterService: FiltersService,
    public layersService: LayersService,
    public dynamicComponentService: DynamicComponentService,
    public mapService: MapService,
    public placesFiltersService: PlacesFiltersService,
    public inventoryService: InventoryService,
    public truncate: TruncatePipe,
    public el: ElementRef,
    public renderer: Renderer2,
    public cdRef: ChangeDetectorRef,
    public popupService: PopupService,
    public convertPipe: ConvertPipe,
    private snackBar: MatSnackBar,
    public targetAudienceService: TargetAudienceService
  ) {
    super(inventoryService,
      exploreDataService,
      placesFiltersService,
      theme,
      layersService,
      common,
      exploreDataService,
      auth,
      activatedRoute,
      dynamicComponentService,
      filterService,
      exploreService,
      dialog,
      renderer,
      loaderService,
      mapService,
      truncate,
      format,
      cdRef,
      popupService,
      convertPipe,
      targetAudienceService
    );
  }
  @ViewChild(ExploreSaveScenarioV3Component) exploreScenarioV3: ExploreSaveScenarioV3Component;
  public saveAsTrigger: ViewContainerRef;
  @ViewChild('saveAsTrigger') set setSaveTrigger(theElementRef: ViewContainerRef) {
    this.saveAsTrigger = theElementRef;
  }
  public showPopIntelMenu = false;
  public workFlowLabels: WorkflowLables;
  public sidebarState = false;
  public start = 0;
  public selectedCount = 0;
  public sortQuery = { name: 'Target Composition Percentage', value: 'pct_comp_imp_target' };
  public selectQuery = 'All';
  // To deal with custom selection without actual places loaded in the UI - Fixing IMXUIPRD-1445
  private previousSelectQuery: string = null;
  public selectQueryLimited = -1;
  public selectedBaseID = 'pf_pop_a18p';
  public selectedAudienceID: string = null;
  public selectedMarkets;
  public filterCacheID = '';
  public placeLayerVisibility;
  public sortables: any;
  public sortOrder = 'desc';
  public sortKeyNoMarket: any;
  public sortKeyAll: any;
  public selectOptions = ['All', 'Top 25', 'Top 50', 'Top 100', 'None', 'Custom'];
  public inventoryGroups;
  public inventoryGroupIds;
  public tempPlaces = [];
  public draggedHeight = null;
  public isVisible = false;
  public redraw = false;
  public placesForCSV: any;
  public totalGPInventory: number;
  private unSubscribe: Subject<void> = new Subject<void>();
  private appliedFilters;
  packages = [];
  selectedPackage = {};
  map: mapboxgl.Map;
  allowInventory: string = '';
  allowInventoryAudience: string = '';
  csvExportEnabled: string;
  inventorySetEnabled: string;
  isSelectEnabled = false;
  isScenarioEnabled: boolean;
  isMeasureEnabled: boolean;
  mapPopup: any;
  nationalWideData: any = { 'type': 'FeatureCollection', 'features': [] };
  emptyFeatures: any = { 'type': 'FeatureCollection', 'features': [] };
  public selectedInventories: any;
  draw: MapboxDraw;
  mapDrawEnable = false;
  circleDrawEnable = false;
  placeSetsDisplay = false;
  polygonInfo: any;
  setSelectedEnable = false;
  public mapViewSearch = 0;
  public commonFilter: any = {};
  public nationalWideDataLoad = true;
  public filterApiCallLoaded = true;
  inventoryMarketData: any = [];
  customPolygon: any = { 'type': 'MultiPolygon', 'coordinates': [] };
  polygonData: any = { 'type': 'FeatureCollection', 'features': [] };
  customPolygonFeature: any = {
    id: '1234234234234234',
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: []
    },
    properties: {}
  };
  public page: any = 1;
  addingMapDraw = false;
  fids: any = [];
  layersChanging = false;
  dynamicMapView = 0;
  private toggleClicks = new Subject();
  private toggleUnsubscribe: any;
  public openedInventoryDetail = false;
  totalPage = 0;
  placeFramePopup: any;
  poiPopup: any;
  poiLayerPopup: any;
  hoverOnInventoryCard = false;
  clearFlagtimeout: any = null;
  inventoriesApiCall: any = null;
  recallInventoryApiTimer: any = null;
  mobileLoader: boolean = false;
  // Color used as the store outline
  outlineColor = '#616161';
  // Brown-gray color used for the floorplan of the building
  floorColor = '#EFEBE9';
  // Darker gray used to show hollow areas in the floorplan
  hollowColor = '#9B9F9E';

  eatingColor = '';
  // Gray used to show restrcited areas or restrooms/etc. in the venue
  blockedColor = '#CFCFD0';
  // Set facility area to be the the company selected color (either primary or secondary)
  facilityAreaColor = '';
  // Set the stores to be this same color
  shoppingColor = '';

  facilityID = [
    3, 9, 10, 11, 17, 20, 26, 36, 52, 54, 61, 62, 73, 74,
    101, 102, 103, 105, 106, 7522, 9509, 9515, 7011, 79, 9516,
    7389, 6, 16, 25, 29, 65, 9221, 8060, 1, 2, 19, 21,
    60, 66, 70, 77, 80, 81, 85, 97, 104, 108, 109, 120, 121, 12, 64
  ];
  foodID = [27, 30, 43, 59, 115, 5800, 9532, 9533, 9996, 9534, 9536, 9597, 9545, 9548];
  shoppingID = [91, 100, 9537, 9538, 9539, 9540, 9541, 7510, 7538, 9503, 9504, 9507, 9508, 9510, 9511, 9512, 9530, 9578, 9581, 9595, 9992, 9523, 9527, 9556, 9559, 9561, 9987, 5400, 9535, 6512, 9546, 9547, 9558, 9560, 9562, 9563, 9564, 9565, 9566, 9567, 9568, 9569, 9570, 9988, 9990, 9995];
  levelNumber = 1;
  selectedPlaceData = {};
  showLevels = false;
  showPlaceMoreInfo = false;
  loadingPlaceData = false;
  hideMapViewPopup = true;
  mapFeature = {};
  mobileImageSrc = '';
  checkPopupSource = '';
  userData = {};
  detailPopupDescription = '';
  detailPlacePopupDescription = '';
  mapViewPostionState = '';
  geoPolygon = false;
  hideplaceMapViewPopup = true;
  geoFilter: any = {};
  isSafariBrowser: boolean = false;
  inventorySummary: any;
  enableMapInteractionFlag = true;
  public styleHeight: any;
  public mapHeight: any;
  public styleHeightBack: any;
  public mapWidth: any;
  public dimensionsDetails: any;
  public mobilepopupHeight: any;
  public headerHeight: any;
  public inventoryPanelHeight: any;
  public isSaveMapPosition = false;
  public isFilterOpen = false;
  clearGPFIltertimeout: any = null;
  public audienceLicense = {};
  sessionFilter = false;
  routeParams = {};
  public viewLayers: any = [];
  public layerDisplayOptions: any = {};
  public mapStyle: any = '';
  public projects: any = [];
  public markerIcon: any = environment.fontMarker;
  public defaultPrimaryColor = '';
  public defaultSceondaryColor = '';
  resizingInProcess = '';
  public inventoryGroupsPlaces;
  public locationFilterData: any;
  public keyLegendsTimeer = null;
  public openFilter = true;
  mapPlaceHash5Layer: any;
  mapPlaceHash6Layer: any;
  public filtersAttributes = [
    'operatorPanelIdList',
    'geopathPanelIdList',
    'media_attributes',
    'audienceMarket',
    'region',
    'threshold',
    'audience', 'base',
    'target_segment',
    'operator_name_list',
    'media_type_list',
    'id_type', 'id_list',
    'inventory_market_list',
    'digital',
    'construction_type_list',
    'orientation',
    'frame_width',
    'frame_height',
    'frame_media_name_list',
    'classification_type_list',
    'place_type_name_list',
    'placement_type_name_list',
    'status_type_name_list',
    'rotating',
    'place_id_list'
  ];
  private selectedFrameId = {};
  public updateTabularView = 0;
  public defaultIcon;
  public searchlayer = [];
  private isStatus = false;
  public isLoader: Boolean = false;
  current_layer: any;
  counties: any;
  public measuresLicense: any;
  public customInventories: any;
  public isScenarioLicense: string;
  public site;
  public clientId;
  public inventoryCount: number;
  public selectedInventoryCount = 0;
  protected ngUnsubscribe: Subject<void> = new Subject<void>();
  public baseAudience = false;
  public populationIntelligenceAccess;
  ngOnInit() {
    super.ngOnInit();
    this.themeSettings = this.theme.getThemeSettings();
    this.baseAudience = this.themeSettings?.baseAudienceRequired ?? false;
    this.workFlowLabels = this.common.getWorkFlowLabels();
    this.clientId = this.themeSettings.clientId;
    const moduleaccesData = this.auth.getModuleAccess('explore');
    this.populationIntelligenceAccess = moduleaccesData?.features?.populationIntelligence;
    this.isRightPanelenabled = moduleaccesData['features']['inventoryRightPanel'];
    if (this.isRightPanelenabled && this.isRightPanelenabled['status'] === 'active') {
      this.sidebarState = true;
    } else {
      this.sidebarState = false;
    }
    this.isTabularViewEnabled = moduleaccesData['features']['inventoryTabularView'];

    this.filterService.getFilterSidenav().subscribe(data => {
      if (data) {
        this.isFilterOpen = data.open;
      }
      if (data.open) {
        this.tempOpen = true;
        this.tempTab = data.tab;
      }
    });
    this.theme.getDimensions().pipe(takeUntil(this.unSubscribe)).subscribe(data => {
      this.dimensionsDetails = data;
      this.headerHeight = data.headerHeight;
      this.mobilepopupHeight = data.windowHeight - (data.headerHeight + 40);
      if (this.allowInventoryAudience !== 'hidden') {
        this.inventoryPanelHeight = data.windowHeight - (data.headerHeight + 380);
      } else {
        this.inventoryPanelHeight = data.windowHeight - (data.headerHeight + 230);
        if (this.mod_permission['features']['gpMeasures']['status'] === 'active') {
          this.inventoryPanelHeight = data.windowHeight - (data.headerHeight + 380);
        }
      }
      // this.isSaveMapPosition = false;
      this.resizeLayout();
    });
    this.defaultAudience = this.activatedRoute.snapshot.data.defaultAudience;
    this.filterService.defaultAudience = this.activatedRoute.snapshot.data.defaultAudience;
    // this.inventoryMarketData = this.activatedRoute.snapshot.data['markets'] || [];
    this.inventoryMarketData = this.activatedRoute.snapshot.data['dummyMarkets'] || [];
    this.counties = this.activatedRoute.snapshot.data['counties'] || [];
    this.filterService.setCounties(this.counties);
    this.selectedTarget = this.defaultAudience.description;
    this.selectedAudienceID = this.defaultAudience.audienceKey;
    this.common.onDataVersionChange().subscribe((data) => {
      this.targetAudienceService
          .getDefaultAudience(false, data.toString())
          .subscribe((audience) => {
            this.defaultAudience = audience;
            this.filterService.defaultAudience = audience;
            this.selectedTarget = this.defaultAudience.description;
            this.selectedAudienceID = this.defaultAudience.audienceKey;
        });
    });
    const md = new mobiledetect(window.navigator.userAgent);
    if (md.userAgent() === 'Safari') {
      this.isSafariBrowser = true;
    } else {
      this.isSafariBrowser = false;
    }

    this.sortables = this.exploreDataService.getSortables();
    this.sortKeyNoMarket = this.exploreDataService.getSortKeyWithoutMarkets();
    this.sortKeyAll = this.exploreDataService.getAllSortKeys();
    this.inventoryGroups = this.exploreDataService.getInventoryGroups();
    this.inventoryGroupsPlaces = this.exploreDataService.getInventoryGroupsPlaces();
    this.inventoryGroupIds = this.exploreDataService.getInventoryGroupIds();
    this.zoomLevel = 0;
    this.theme.generateColorTheme();
    this.facilityAreaColor = this.themeSettings['color_sets']['secondary']['base'];
    this.shoppingColor = this.themeSettings['color_sets']['secondary']['base'];
    this.eatingColor = this.themeSettings['color_sets']['secondary']['base'];
    this.defaultPrimaryColor = this.themeSettings['color_sets']['primary'] && this.themeSettings['color_sets']['primary']['base'];
    this.defaultSceondaryColor = this.themeSettings['color_sets']['secondary'] && this.themeSettings['color_sets']['secondary']['base'];
    this.common.homeClicked.subscribe(flag => {
      if (flag) {
        this.zoomOutMap();
      }
    });
    this.theme.themeSettings.subscribe(res => {
      this.themeSettings = this.theme.getThemeSettings();
      this.facilityAreaColor = this.themeSettings['color_sets']['secondary']['base'];
      // Set the stores to be this same color
      this.shoppingColor = this.themeSettings['color_sets']['secondary']['base'];
      this.eatingColor = this.themeSettings['color_sets']['secondary']['base'];

    });
    this.exploreService.hideLoaders.subscribe(value => {
      this.loaderService.display(false);
    });

    this.mod_permission = this.auth.getModuleAccess('explore');
    if (this.mod_permission
      && this.mod_permission.features
      && this.mod_permission.features.orderInventories
      && this.mod_permission.features.orderInventories.status
      && this.mod_permission.features.orderInventories.status === 'active') {
      this.isStatus = true;
    }
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    this.measuresLicense = this.mod_permission['features']['gpMeasures']['status'];
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    this.allowInventoryAudience = this.audienceLicense['status'];
    this.csvExportEnabled = this.mod_permission['features']['csvExport']['status'];
    this.inventorySetEnabled = this.mod_permission['features']['inventorySet']['status'];
    const projectMod = this.auth.getModuleAccess('v3workspace');
    this.isScenarioEnabled = (projectMod['status'] === 'active');
    this.isScenarioLicense = projectMod['status'];
    this.customInventories = this.mod_permission['features']['customInventories']['status'];
    // Enable select buttons only if any feature related to selection is enabled.
    this.isSelectEnabled = this.csvExportEnabled === 'active'
      || this.pdfExportEnabled === 'active'
      || this.inventorySetEnabled === 'active'
      || this.isScenarioEnabled;
    this.isMeasureEnabled = this.mod_permission['features']['gpMeasures']['status'] === 'active';
    this.selectedInventories = { 'type': 'FeatureCollection', 'features': [] };
    this.mapPopup = MapboxFactory.produce(MapboxFactoryEnum.POPUP, {});
    this.draw = new MapboxDraw({
      displayControlsDefault: false,
      styles: this.common.getStylesData(),
      modes: Object.assign({
        draw_radius: RadiusMode,
      }, MapboxDraw.modes)
    });
    setTimeout(() => {
      this.buildMap();
    }, 50);
    this.exploreDataService.getNationalFeatures().subscribe(data => {
      this.setNationalLevelData(data);
    });
    this.exploreDataService.getPlaces().subscribe(places => {
      if (places.length > 0) {
        this.places = places;
      } else {
        this.places = [];
      }
      this.metricsCalc();
      this.modifySearchResultMapFormat();
    });
    this.exploreDataService.getFids().pipe(takeUntil(this.unSubscribe)).subscribe(fids => {
      let initialCall = true;
      const tempFids = Helper.deepClone((fids['gpIds'] && fids['gpIds'] || []));
      tempFids.push(...(fids['customDBIds'] && fids['customDBIds'] || []));
      if (typeof tempFids !== 'undefined' && tempFids.length > 0) {
        this.fids = tempFids;
        const filters = [];
        if (tempFids.length <= 50000) {
          if (!this.filterService.isSessionFilter) {
            this.selectQuery = 'All';
            this.selectQueryLimited = -1;
            this.selectedFidsArray = [];
            if (fids['gpIds']) {
              fids['gpIds'].map((fidObject) => {
                this.selectedFidsArray.push({ 'fid': fidObject.spotId, 'selected': true, 'type' : 'geopathPanel', frameId: fidObject.frameId});
              });
            }
            if (fids['customDBIds']) {
              fids['customDBIds'].map((fid) => {
                this.selectedFidsArray.push({ 'fid': fid, 'selected': true, 'type' : 'customPanel' });
              });
            }
            // this.fids.map((fid) => {
            //   this.selectedFidsArray.push({ 'fid': fid, 'selected': true });
            // });
            this.selectedCount = this.fids.length;
            this.selectedInventoryCount = this.fids.length;
          } else {
            if (!this.selectedFidsArray.length) {
              this.selectedFidsArray = [];
              if (fids['gpIds']) {
                fids['gpIds'].map((fidObject) => {
                  this.selectedFidsArray.push({ 'fid': fidObject.spotId, 'selected': true, 'type' : 'geopathPanel', frameId: fidObject.frameId});
                });
              }
              if (fids['customDBIds']) {
                fids['customDBIds'].map((fid) => {
                  this.selectedFidsArray.push({ 'fid': fid, 'selected': true, 'type' : 'customPanel' });
                });
              }
              /* this.fids.map((fid) => {
                this.selectedFidsArray.push({ 'fid': fid, 'selected': true });
              }); */
              this.selectedCount = this.fids.length;
              this.selectedInventoryCount = this.fids.length;
            }
            this.sessionFilter = true;
          }
          // TODO: Need to check whthere below code is required or not
          this.places.map((unit, i) => {
            if (unit && unit['properties'] && unit['properties']['fid']) {
              const index = this.fids.indexOf(unit.properties.fid);
              if (index > -1 && index !== i) {
                this.fids.splice(index, 1);
                this.fids.splice(i, 0, unit.properties.fid);
              }
            }
          });
          this.filterService.saveSelectedFids(this.selectedFidsArray);
          if (this.map.isStyleLoaded()) {
            this.metricsCalc();
          }
          if (this.fids.length > 0) {
            // TODO: Need to implement for custom inventory
            let seletedPanels = this.selectedFidsArray.map(obj => obj.frameId);
            if (seletedPanels.length < 0) {
              seletedPanels = [0];
            }
            filters.unshift('all');
            seletedPanels.unshift('in', MapLayersInvetoryFields.FRAME_ID);
            filters.push(seletedPanels);
          }
        } else {
          this.selectedFidsArray = [];
          if (fids['gpIds']) {
            fids['gpIds'].map((fidObject) => {
              this.selectedFidsArray.push({ 'fid': fidObject.spotId, 'selected': true, 'type' : 'geopathPanel', frameId: fidObject.frameId});
            });
          }
          if (fids['customDBIds']) {
            fids['customDBIds'].map((fid) => {
              this.selectedFidsArray.push({ 'fid': fid, 'selected': true, 'type' : 'customPanel' });
            });
          }
          /* this.fids.map((fid) => {
            this.selectedFidsArray.push({ 'fid': fid, 'selected': true });
          }); */
          let selectedPanels = this.selectedFidsArray.map(obj => obj.frameId);
          if (selectedPanels.length < 0) {
            selectedPanels = [0];
          }
          selectedPanels.unshift('in', MapLayersInvetoryFields.FRAME_ID);
          filters.unshift('all');
          filters.push(selectedPanels);
        }
        if ((['media_attributes',
        'audienceMarket',
        'region',
        'threshold',
        'target_geography',
        'operator_name_list',
        'media_type_list',
        'id_type',
        'id_list',
        'inventory_market_list',
        'digital',
        'construction_type_list',
        'orientation',
        'frame_width',
        'frame_height',
        'frame_media_name_list',
        'classification_type_list',
        'place_type_name_list',
        'placement_type_name_list',
        'place_id_list',
        'rotating',
        'measures_range_list'
      ].some(key => this.commonFilter[key])
        || (filters?.['status_type_name_list'][0] !== '*'))) {
        initialCall = false;
      }
      /**
       * initialCall call is boolean flag that will use here to check that if it has applied filter or not.
       * So if initialCall = false only we need to change the map
       **/
      if (this.fids.length > 0 && !initialCall) { // && this.fids.length <= 50000
          // default call even if the 'map.isStyleLoaded' is loaded or not
          this.addFiltersToMap(filters);

          // checking if map is loaded or not, if not loaded listen to load event
          if (!this.map.isStyleLoaded()) {
            // call once the 'map.isStyleLoaded' is loaded
            this.map.once('style.load', () => {
              this.addFiltersToMap(filters);
            });
          }
        } else {
          this.addFiltersToMap(null);
        }
      } else {
        this.selectQuery = 'All';
        this.selectQueryLimited = -1;
        this.selectedFidsArray = [];
        this.selectedCount = 0;
        this.selectedInventoryCount = 0;
        const filters = [];
        const fidtemp = ['0'];
        filters.unshift('all');
        fidtemp.unshift('in', MapLayersInvetoryFields.FRAME_ID);
        filters.push(fidtemp);
        this.addFiltersToMap(filters);
      }
    });
    this.exploreDataService.getSummary()
      .subscribe(summary => {
        this.inventorySummary = summary;
      });

    this.exploreDataService
      .getMapViewPositionState()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(state => {
        if (state === 'secondaryMapView') {
          const secondaryLayersData = this.layersService.getlayersSession('secondary');
          if (!secondaryLayersData) {
            this.exploreDataService.setMapViewPositionState('inventoryView');
            state = 'inventoryView';
          }
        }
        if (this.isRightPanelenabled['status'] === 'active') {
          if (state === 'inventoryView') {
            this.sidebarState = true;
          } else {
            this.sidebarState = false;
          }
          if (this.mapViewPostionState !== state) {
            this.mapViewPostionState = state;
            this.resizeLayout();
          } else {
            this.mapViewPostionState = state;
          }
        } else {
          this.mapViewPostionState = 'mapView';
          this.resizeLayout();
        }

        if (!this.mobileView && (state === 'tabularView' || state === 'mapView')) {
          this.mapWidth = this.dimensionsDetails.windowWidth - 40;
        }
      });
      if (this.isRightPanelenabled['status'] === 'active') {
        if (this.allowInventoryAudience === 'hidden' || this.mobileView) {
          if (!this.mobileView && this.allowInventory === 'active') {
            this.sidebarState = true;
          } else {
            this.sidebarState = false;
          }
        }
      } else {
        this.mapViewPostionState = 'mapView';
        this.resizeLayout();
      }

    this.workSpaceDataService
      .getSelectedPackage()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(selectedPackage => {
        this.selectedPackage = selectedPackage;
      });
    const sessionFilter = this.filterService.getExploreSession();
    if (this.isRightPanelenabled && this.isRightPanelenabled.status === 'active') {
      if (sessionFilter && sessionFilter['data']) {
        if (sessionFilter['data']['mapViewPostionState']) {
          this.mapViewPostionState = sessionFilter['data']['mapViewPostionState'];
          this.exploreDataService.setMapViewPositionState(this.mapViewPostionState);
        }
        // commented to enable inventory right panel by default IMXUIPRD-1223
        // else if (this.themeSettings.publicSite && !sessionFilter['data']['mapViewPostionState']) {
        //   this.exploreDataService.setMapViewPositionState('mapView');
        // }
      }
      // commented to enable inventory right panel by default IMXUIPRD-1223
      // else if (!sessionFilter && this.themeSettings.publicSite) {
      //   this.exploreDataService.setMapViewPositionState('mapView');
      // }
    } else {
      this.mapViewPostionState = 'mapView';
      this.resizeLayout();
      this.exploreDataService.setMapViewPositionState('mapView');
    }
    this.exploreDataService.onMapLoad().pipe(takeUntil(this.unSubscribe))
      .subscribe(event => {
        this.activatedRoute.queryParams.subscribe(params => {
          this.routeParams = params;
        });
        if (event) {
          this.loadFilterSession();
        }
      });
    this.workSpace
      .getExplorePackages().subscribe(response => {
        if (typeof response['packages'] !== 'undefined' && response['packages'].length > 0) {
          this.workSpaceDataService.setPackages(response['packages']);
        }
      });
    this.workSpaceDataService
      .getPackages()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(packages => {
        this.packages = packages;
      });
    this.filterService.getFilters()
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.unSubscribe),
        tap(data => {
          this.saveSession(data);
          if (data['data']['market']) {
            this.selectedMarkets = data['data']['market'];
          } else {
            this.selectedMarkets = {};
          }
          if (data['data']['location']) {
            this.locationFilterData = data['data']['location'];
          } else {
            this.locationFilterData = {};
          }
          this.manageFilterPills(data['data']);
        }),
        map(data => {
          /**
           * To change the filter format and modify scenario and inventory
           * set into geoPanelID array we're using the below function
           */
          return this.filterService.normalizeFilterDataNew(data);
        })
        , map(data => {
          /**
           * To change the filter format according to the gpFilter API input
           */
          return this.formatFiltersForGpFilterAPI(data);
        }), tap(data => {
          /**
           * To save filter state in local to be used when required later for getting the spot IDs for current filter
          */
          this.appliedFilters = data;
        }))
      .subscribe((filters: Partial<Filters>) => {
        if (this.mapPopup.isOpen()) {
          this.mapPopup.remove();
        }
        this.commonFilter = filters;
        let initialCall = true;
        this.initializeValues();
        if ((['media_attributes',
          'audienceMarket',
          'region',
          'threshold',
          'target_geography',
          'operator_name_list',
          'media_type_list',
          'id_type',
          'id_list',
          'inventory_market_list',
          'digital',
          'construction_type_list',
          'orientation',
          'frame_width',
          'frame_height',
          'frame_media_name_list',
          'classification_type_list',
          'place_type_name_list',
          'placement_type_name_list',
          'rotating',
          'place_id_list',
          'measures_range_list'
        ].some(key => filters[key])
          || (filters?.['status_type_name_list'][0] !== '*'))) {
          initialCall = false;
        }
        setTimeout(() => {
          this.sessionFilter = false;
          this.searchFromGPFilter(filters, initialCall);
          // this.searchFromElasticFilter(filters, initialCall);
        }, 200);
      });
    this.filterService.onReset()
      .subscribe(type => {
        this.resetFilter();
      });
    // TODO: Need to work for Dual
    this.layersService.getLayers().subscribe((layers) => {
      this.viewLayers = layers;
      const searchResult = layers.find((layer) => layer.data && layer.data['_id'] && layer.data['_id'] === 'default' || undefined);
      if (!searchResult) {
        this.defaultIcon = undefined;
        this.removeSearchResultLayers(true);
      }
    });

    this.layersService.getDisplayOptions().subscribe((layers) => {
      this.layerDisplayOptions = layers;
    });
    this.layersService.getApplyLayers().pipe(takeUntil(this.unSubscribe)).subscribe((value) => {
      if (value['type'] === 'primary') {
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
    this.exploreDataService.getSelectedTarget().pipe(takeUntil(this.unSubscribe)).subscribe(target => {
      if (target) {
        this.selectedAudienceID = target;
      }
    });
    this.exploreDataService
      .getSelectedTargetName()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(audienceName => {
        this.selectedTarget = audienceName;
      });
    this.layersService
      .getClearView()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(value => {
        if (value) {
          const element: HTMLElement = document.querySelector('.mapboxgl-ctrl-locate-active') as HTMLElement;
          if (element) {
            element.click();
          }
          this.zoomOutMap();
          this.filterService.resetAll();
          this.filterService.removeFilterPill('saved view');
          this.exploreDataService.setMapViewPositionState('inventoryView');
        }
      });
    // for scenario create
    this.workSpace
      .getProjects()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(response => {
        if (response['projects'] && response['projects'].length > 0) {
          this.projects = response['projects'];
        }
      });

    this.filterService.checkSessionDataPushed()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(val => {
        if (val) {
          this.loadFilterSession();
        }
      });
    this.layersService.getClearLogoStyle().subscribe((value) => {
      if (value['type'] === 'primary' && value['flag']) {
        this.logoStyle = {};
      }
    });

    // sidebar toggle select | unselect, debounce action to avoid unnecessary API call
    this.toggleUnsubscribe = this.toggleClicks.pipe(
      debounceTime(300)
    ).subscribe(e => {
      this.updateBubblesCount(true);
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
  }
  ngAfterViewInit(): void {
    this.filterService.onCreateNewInventorySet()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(res => {
        if (this.selectedFidsArray && this.selectedFidsArray.length > 50000) {
          const dialogueData: ConfirmationDialog = {
            notifyMessage: true,
            confirmTitle: 'Error',
            messageText: 'Filter more to start saving inventory sets',
          };
          this.dialog.open(ConfirmationDialogComponent, {
            data: dialogueData,
            width: '586px',
            panelClass: 'newInventoryLimitDialog'
          });
        } else {
          this.saveAsTrigger['_elementRef']['nativeElement'].click();
        }
      });

      Helper.themeRender('intermx-theme-old');
  }

  private formatFiltersForGpFilterAPI(filters: any) {
    this.hideMapViewPopup = true;
    if (filters['target_segment'] === this.defaultAudience['audienceKey']) {
      this.exploreDataService.setSelectedTarget(this.defaultAudience['audienceKey']);
    }
    if (filters['target_geography_list'] && filters['target_geography_list'].length > 0) {
      this.sortables = this.sortKeyAll;
    } else {
      /*const isExist = this.sortKeyNoMarket.filter(sort => sort.name === this.sortQuery.name);
      if (isExist.length === 0) {
        this.sortBy({ name: 'Target Composition Percentage', value: 'pct_comp_imp_target' });
      }
      this.sortables = this.sortKeyNoMarket;*/
    }
    return filters;
  }
  private loadFilterSession() {
    const sessionFilter = this.filterService.getExploreSession();
    if (sessionFilter && sessionFilter['data'] && typeof this.routeParams['scenario'] === 'undefined') {
      if (sessionFilter['data']['sortQuery']) {
        if (sessionFilter['data']['sortQuery']['sortOrder']) {
          this.sortOrder = sessionFilter['data']['sortQuery']['sortOrder'];
          delete sessionFilter['data']['sortQuery']['sortOrder'];
        }
        this.sortQuery = sessionFilter['data']['sortQuery'];
      }
      if (sessionFilter['data']['selectQuery']) {
        this.selectQuery = sessionFilter['data']['selectQuery'];
        this.previousSelectQuery = sessionFilter['data']['previousSelectQuery'];
        this.select(this.selectQuery, true);
        this.selectQueryLimited = sessionFilter['data']['selectQueryLimited'];
      }
      if (sessionFilter['data']['selectedInventoryCount']) {
        this.selectedInventoryCount = sessionFilter['data']['selectedInventoryCount'];
      }
      if ( this.isRightPanelenabled && this.isRightPanelenabled.status === 'active' ) {
        if (sessionFilter['data']['mapViewPostionState']) {
          this.mapViewPostionState = sessionFilter['data']['mapViewPostionState'];
          this.exploreDataService.setMapViewPositionState(this.mapViewPostionState);
          this.resizeLayout();
        }
      } else {
        this.mapViewPostionState = 'mapView';
        this.resizeLayout();
        this.exploreDataService.setMapViewPositionState('mapView');
      }
      this.sessionFilter = true;
      this.filterService.setFilterFromSession(sessionFilter);
      if (sessionFilter['data'] && sessionFilter['data']['mapPosition']) {
        this.filterService.saveMapPosition(sessionFilter['data']['mapPosition']);
        this.setMapPosition();
      }
    } else {
      this.filterService.setFilterFromSession({});
      /* const filterData = this.formatFiltersForGpFilterAPI({});
      filterData['base'] = this.selectedBaseID;
      this.searchFromGPFilter(filterData, true); */
    }
  }
  private saveSession(filters) {
    this.filterService.saveExploreSession(filters);
  }

  private resetFilter() {
    if (this.commonFilter['location'] && this.commonFilter['location']['region']) {
      this.dynamicMapView = 0;
      this.mapViewSearch = 0;
      this.geoPolygon = false;
      this.mapDrawEnable = false;
      this.circleDrawEnable = false;
      this.customPolygon.coordinates = [];
      this.customPolygonFeature.geometry = {
        type: 'Polygon',
        coordinates: []
      };
      this.polygonData.features = [];
    }
    this.sortQuery = { name: 'Target Composition Percentage', value: 'pct_comp_imp_target' };
    this.selectQuery = 'All';
  }

  private setNationalLevelData(data) {
    if (typeof data.features !== 'undefined') {
      this.nationalWideData = this.formatUpNationalData(data);
      this.nationalWideDataLoad = false;
      if (this.map && this.map.getSource('nationalWideData')) {
        this.map.getSource('nationalWideData').setData(this.nationalWideData);
      }
    }
  }

  private addFiltersToMap(filters: any[]) {
    let customFilters = Helper.deepClone(filters);
    if (customFilters?.[1]) {
      customFilters = customFilters[1].map(val => val.toString());
    }
    if (this.map.getLayer('frames_panel')) {
      this.map.setFilter('frames_panel', filters);
    }
    if (this.customInventories === 'active'  && this.map.getLayer('custom_frames_panel')) {
      this.map.setFilter('custom_frames_panel', customFilters);
    }
    if (this.map.getLayer('color_frames_panel')) {
      this.map.setFilter('color_frames_panel', filters);
    }
    if (this.customInventories === 'active' && this.map.getLayer('custom_color_frames_panel')) {
      this.map.setFilter('custom_color_frames_panel', customFilters);
    }
    /*if (this.map.getLayer('grayed_frames_panel')) {
      if (filters) {
        const grayedFilters = JSON.parse(JSON.stringify(filters));
        if (filters[1][2] !== 0) {
          grayedFilters[0] = 'none';
          this.map.setFilter('grayed_frames_panel', grayedFilters);
        } else {
          this.map.setFilter('grayed_frames_panel', filters);
        }
      } else {
        this.map.setFilter('grayed_frames_panel', filters);
      }
    }*/
    if (this.customInventories === 'active' && this.map.getLayer('custom_grayed_frames_panel')) {
      if (customFilters) {
        const customGrayedFilters = Helper.deepClone(customFilters);
        if (customFilters[2] !== '0') {
          customGrayedFilters[0] = '!in';
          this.map.setFilter('custom_grayed_frames_panel', customGrayedFilters);
        } else {
          this.map.setFilter('custom_grayed_frames_panel', customFilters);
        }
      } else {
        this.map.setFilter('custom_grayed_frames_panel', customFilters);
      }
    }
    if (this.map.getLayer('mapLabel')) {
      this.map.setFilter('mapLabel', filters);
    }
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
    this.initializeValues();
    this.toggleUnsubscribe.unsubscribe();
     // This aborts all HTTP requests.
       this.ngUnsubscribe.next();
       // This completes the subject properlly.
       this.ngUnsubscribe.complete();
       this.popupService.closeAll();
    Helper.themeRender('intermx-theme-old');   
  }

  initializeValues() {
    this.exploreDataService.setSelectedMarket({});
    this.exploreDataService.setPlaces([]);
    // this.exploreDataService.setSummary({reset: true});
    // this.exploreDataService.setMapObject({});
  }

  buildMap() {
    this.style = this.common.getMapStyle(this.baseMaps, this.mapStyle);
    // this.style = environment.mapbox.new_style;
    /* let style = environment.mapbox.new_style;
    if (this.mapStyle === 'satellite') {
      this.style = environment.mapbox.new_satellite_style;
    } */
    if (!mapboxgl.supported()) {
      fsObject.mapBoxNotSupported();
    }
    this.initializeMap(this.style['uri']);
  }

  bindRender() {
    const self = this;
    self.map.resize({ mapResize: true });
    self.map.on('render', function (e) {
      if (self.dynamicMapView > 0) {
        if (self.map.loaded() && self.map.isSourceLoaded('allPanels')) {
          if (
            !self.mapDrawEnable
            && !self.setSelectedEnable
            && self.nationalWideDataLoad
            && !self.addingMapDraw
            && !self.layersChanging
            && !self.hoverOnInventoryCard
          ) {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(function () {
              self.loadData();
            }, 500);
          } else {
            clearTimeout(this.clearFlagtimeout);
            this.clearFlagtimeout = setTimeout(function () {
              self.setSelectedEnable = false;
              self.nationalWideDataLoad = true;
              self.addingMapDraw = false;
              self.layersChanging = false;
              self.loadingPlaceData = false;
              // self.hoverOnInventoryCard = false;
            }, 1000);
          }
        }
      }
      clearTimeout(this.keyLegendsTimeer);
      this.keyLegendsTimeer = setTimeout(function () {
        const layerSession = self.layersService.getlayersSession();
        self.exploreService.generateKeyLegends(self.map, layerSession, self.mapStyle, self.zoomLevel);
      }, 500);
    });
  }

  toggleMapView() {
    if (this.dynamicMapView > 0) {
      this.dynamicMapView = 0;
    } else {
      this.dynamicMapView = 1;
    }
    if (this.dynamicMapView === 1) {
      this.removePolygon(false);
      const boundBox = this.mapService.getMapBoundingBox(this.map, false, this.mapBounds);
      this.filterService.setFilter('location', { region: boundBox, type: 'dynamicMapView' });
    } else {
      this.filterService.setFilter('location', {});
    }
  }

  onTableSorting(sort) {
    const sortOrder = sort['sortOrder'];
    delete sort['sortOrder'];
    this.sortBy(sort, sortOrder);
  }

  sortBy(item, order = 'desc') {
    this.sortQuery = item;
    this.sortOrder = order;
    this.exploreDataService.setFids({});
    this.exploreDataService.setPlaces([]);
    item['sortOrder'] = order;
    this.filterService.setFilter('sortQuery', item);
  }

  /**
   * The function is called when user do any selection or filter applied
   * @param type type of selection
   * @param {boolean} autoCall
   * The above param is whether the user selection triggered the call or
   * its a filter call, If its true
   */
  select(type, autoCall = false) {
    this.selectQuery = type;
    switch (this.selectQuery) {
      case 'All':
        this.selectQueryLimited = -1;
        this.places.map((place) => {
          place.selected = true;
        });
        this.selectedFidsArray.map((f) => {
          f.selected = true;
        });
        this.selectedInventoryCount = this.inventoryCount;
        break;
      case 'None':
        this.selectQueryLimited = 0;
        this.selectedInventoryCount = 0;
        this.places.map((place) => {
          place.selected = false;
        });
        this.selectedFidsArray.map((f) => {
          f.selected = false;
        });
        break;
      case 'Custom':
        this.selectQueryLimited = -2;
        break;
      case 'Top 25':
        this.selectQueryLimited = 25;
        this.selectLimited(25);
        break;
      case 'Top 50':
        this.selectQueryLimited = 50;
        this.selectLimited(50);
        break;
      case 'Top 100':
        this.selectQueryLimited = 100;
        this.selectLimited(100);
        break;
      default:
        this.selectedFidsArray.map((f) => {
          f.selected = false;
        });
        this.places.map((place) => {
          place.selected = false;
        });
        this.selectedCount = 0;
        this.selectedInventoryCount = 0;
        break;
    }
    this.metricsCalc();
    // TODO: Commented while implement GPATH API integration need to implement
    if (!autoCall) {
      this.updateBubblesCount(true);
    }
    const layersSession = this.layersService.getlayersSession();
    if (layersSession && layersSession['selectedLayers']) {
      const layerData = layersSession['selectedLayers'].find((layer) => layer.data['_id'] === 'default');
      if (layerData) {
        this.modifySearchResultMapFormat();
      }
    }

  }
  /**
   * inventory CSV export function
   */
  exportCSV(columns = []) {
    const exportThreshold = 12000;
    if (this.selectedInventoryCount <= 0) {
      this.showMessageDialog('Please select at least one inventory');
      return;
    }
    if (this.selectedInventoryCount > exportThreshold) {
      this.showMessageDialog('CSV export is currently limited to 12K inventories at a time');
      return;
    }
    this.isLoader = true;
    const headerData: any = this.exploreDataService.getCSVHeaders(columns);
    let exportParmas: BulkExportRequest = {
      panel_id: [],
      aud: this.selectedAudienceID,
      aud_name: this.selectedTarget,
      type: 'inventory_details',
      site: this.themeSettings.site,
      report_format: 'csv',
      columns: headerData,
      target_segment: this.selectedAudienceID
    };
    if (this.baseAudience) {
      base_segment: this.defaultAudience.audienceKey
    }
    exportParmas = Object.assign(exportParmas, this.inventoryService.exportParamFormat(this.selectedMarkets));

    if (this.commonFilter && this.commonFilter['period_days']) {
      exportParmas['period_days'] = this.commonFilter['period_days'];
    }
    if (this.commonFilter && this.commonFilter['measures_release']) {
      exportParmas['measures_release'] = this.commonFilter['measures_release'];
    }
    let selectedGeopathIds = [];
    let selectedCustomPanelIds = [];
    if (this.selectQuery === 'All') {
      this.selectedFidsArray.map(item => {
        if (item.type === 'geopathPanel') {
          selectedGeopathIds.push(item.fid);
        } else if (item.type === 'customPanel') {
          selectedCustomPanelIds.push(item.fid);
        }
      });
    } else if (this.selectQuery === 'Custom' && this.selectedInventoryCount > this.places.length) {
      const unselectedIds = this.places
        .filter(place => !place.selected)
        .map(place => place.spot_id);
        this.selectedFidsArray
        .filter(item => !unselectedIds.includes(item.fid))
        .map(item => {
          if (item.type === 'geopathPanel') {
            selectedGeopathIds.push(item.fid);
          } else if (item.type === 'customPanel') {
            selectedCustomPanelIds.push(item.fid);
          }
        });
    } else {
      this.places.filter(place => place.selected).map(place => {
        if (!place.client_id) {
          selectedGeopathIds.push(place.spot_id);
        } else if(place.client_id) {
          selectedCustomPanelIds.push(place.spot_id);
        }
      });
    }

    exportParmas['panel_id'] = selectedGeopathIds;
    exportParmas['custom_panel_ids'] = selectedCustomPanelIds;


    this.exploreService.inventoriesBulkExport(exportParmas, true).subscribe(res => {
      const contentType = res['headers'].get('content-type');
        if (contentType.includes('text/csv')) {
          const contentDispose = res.headers.get('content-disposition');
          const matches = contentDispose.split(';')[1].trim().split('=')[1];
          let filename = matches && matches.length > 1 ? matches : (new Date()).getUTCMilliseconds() + '.csv';
          filename = filename.slice(1, filename.length-1);
          saveAs(res.body, filename);
        } else {
          this.showMessageDialog('We are generating your report, You\'ll receive a notification when it is ready.');
        }
        this.isLoader = false;
      }, error => {
        this.isLoader = false;
        this.showMessageDialog('There is a problem generating the file. Please try again later.');
      });
  }
  exportPDF() {
    const exportThreshold = 300;
    if (this.selectedInventoryCount <= 0) {
      this.showMessageDialog('Please select at least one inventory');
      return;
    }
    if (this.selectedInventoryCount > exportThreshold) {
      this.showMessageDialog('PDF export is currently limited to 300 inventories at a time');
      return;
    }
    let selectedGeopathIds = [];
    let selectedCustomPanelIds = [];
    if (this.selectQuery === 'All') {
      this.selectedFidsArray.map(item => {
        if (item.type === 'geopathPanel') {
          selectedGeopathIds.push(item.fid);
        } else if (item.type === 'customPanel') {
          selectedCustomPanelIds.push(item.fid);
        }
      });
    } else if (this.selectQuery === 'Custom' && this.selectedInventoryCount > this.places.length) {
      const unselectedIds = this.places
        .filter(place => !place.selected)
        .map(place => place.spot_id);
      this.selectedFidsArray
        .filter(item => !unselectedIds.includes(item.fid))
        .map(item => {
          if (item.type === 'geopathPanel') {
            selectedGeopathIds.push(item.fid);
          } else if (item.type === 'customPanel') {
            selectedCustomPanelIds.push(item.fid);
          }
        });
    } else {
       this.places.filter(place => place.selected).map(place =>{
        if (!place.client_id) {
          selectedGeopathIds.push(place.spot_id);
        } else if(place.client_id) {
          selectedCustomPanelIds.push(place.spot_id);
        }
      });
    }
    this.exportInventory(selectedGeopathIds, selectedCustomPanelIds);
  }
  exportInventory(selectedGeopathIds = [], selectedCustomPanelIds= [], type = 'list') {
    const customColumns = {};
    if (type === 'tabular') {
      const localCustomColum = JSON.parse(localStorage.getItem('exploreCustomColumn'));
      if (localCustomColum && localCustomColum.length > 0) {
        localCustomColum.map(column => {
          if (column['name'] !== 'CHECKBOX' && column['name'] !== 'SLNO') {
            customColumns[column['value']] = column['displayname'];
          }
        });
      }
    }
    // TODO : need to remove this lines once tabular view is fixed for the new flow,
    // TODO : NO need to check for values everywhere, this should be streamlined in only one place.
    if ((selectedGeopathIds.length + selectedCustomPanelIds.length) <= 0) {
      this.showMessageDialog('Please select atleast one inventory to be exported');
      return;
    }
    const orientation = this.themeSettings.orientation;
    let reqData: BulkExportRequest = {
      panel_id: selectedGeopathIds,
      custom_panel_ids: selectedCustomPanelIds,
      aud: this.selectedAudienceID,
      aud_name: this.selectedTarget,
      orientation: orientation,
      type: 'inventory_details',
      site: this.themeSettings.site,
      report_format: 'pdf',
      columns: customColumns,
      target_segment: this.selectedAudienceID
    };
    if (this.baseAudience) {
      base_segment: this.defaultAudience.audienceKey
    }

    reqData = Object.assign(reqData, this.inventoryService.exportParamFormat(this.selectedMarkets));

    if (this.commonFilter && this.commonFilter['period_days']) {
      reqData['period_days'] = this.commonFilter['period_days'];
    }
    if (this.commonFilter && this.commonFilter['measures_release']) {
      reqData['measures_release'] = this.commonFilter['measures_release'];
    }
    this.dialog.open(InventoryBulkExportComponent, {
      width: '450px',
      data: reqData
    });
  }

  selectLimited(count: number) {
    this.places.map(item => item.selected = false);
    this.selectedFidsArray.map(item => item.selected = false);
    this.places.slice(0, count).map(item => {
      item.selected = true;
    });
    this.places.map(place => {
      this.selectedFidsArray.map(i => {
        if (i.fid === place.spot_id && place.selected) {
          i.selected = true;
        }
      });
    });
    this.selectedCount = count;
    this.selectedInventoryCount = count;
  }

  abbrNum(number, decPlaces) {
    return this.format.abbreviateNumber(number, decPlaces);
  }

  loadMorePanels() {
    if (this.totalPage >= this.page ) {
      this.page = this.page + 1;
      const filterData = this.commonFilter;
      filterData['page'] = this.page;
      const count = this.totalGPInventory - 100;
      let totalGPPage = 0;
      if (count > 0) {
        totalGPPage = Math.ceil(count / 100);
      }
      if (this.page > totalGPPage && this.customInventories === 'active') {
        this.getInventoriesFromES(filterData, true);
      } else {
        this.getInventories(filterData, true);
      }
    }
    /* if (this.tempPlaces.length > 0) {
      this.loadNextBatchPanels(100);
    } else if (this.totalPage >= (this.page + 1)) {
      this.page = this.page + 1;
      const filterData = this.commonFilter;
      filterData['page'] = this.page;
      this.getInventories(filterData, true);
    } */
  }

  loadNextBatchPanels(count = 100) {
    if (this.tempPlaces.length > 0) {
      const self = this;
      const batch = this.tempPlaces.splice(0, count);
      $.each(batch, function (i, val) {
        if (self.selectQuery !== 'All') {
          val.selected = true;
        } else {
          val.selected = false;
        }
        self.places.push(val);
      });
      // this.metricsCalc();
    }
  }

  initializeMap(style) {
    mapboxgl.accessToken = environment.mapbox.access_token;
    const self = this;
    this.map = new mapboxgl.Map({
      container: 'mapbox',
      style: style,
      minZoom: 2,
      maxZoom: 16,
      preserveDrawingBuffer: true,
      center: self.mapCenter, // starting position
      zoom: 3 // starting zoom
    });

    this.exploreDataService.setMapObject(this.map);
    this.setMapObject(this.map, this.mapPopup, 'primary');
    this.map.dragRotate.disable();
    this.map.touchZoomRotate.disableRotation();
    if (this.allowInventory === 'active') {
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-left');
      this.map.addControl(new LocateMeControl(), 'bottom-left');
      this.map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
          maximumAge: Infinity
        },
        trackUserLocation: true
      }), 'bottom-left');
    }

    setTimeout(() => {
      // for getting current location
      this.common.locateMePrimaryMap();
    }, 100);
    if (self.allowInventory === 'active') {
      /*self.map.on('load', function () {
        self.loadLayers()
      });*/
      self.map.on('style.load', function () {
        self.loadLayers();
      });
    }
  }
  loadLayers() {
    this.setMapPosition();
    this.map.on('centerEnd', (ev) => {
      setTimeout(() => {
        this.map.fire('click', { lngLat: ev.coords });
      }, 600);
    });
    this.map.on('zoom', () => {
      this.zoomLevel = this.map.getZoom();
    });
    // add 0 to 5 cluster this.map...
    this.map.addSource('allPanels', {
      type: 'vector',
      url: this.mapLayers['allPanels']['url']
    });
    this.map.addSource('starFramePanels', {
      type: 'vector',
      url: this.mapLayers['allPanels']['url']
    });
    this.map.addSource('nationalWideData', {
      type: 'geojson',
      data: this.nationalWideData
    });
    this.map.addSource('polygonData', {
      type: 'geojson',
      data: this.polygonData
    });

    // This source is used to handle Filters -> Location -> Place Set and Radius based filters.
    this.map.addSource('poiDataSet', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    /* End Inventory in Venues */

    /* Dotted layer */
    this.map.addLayer({
      id: 'frameCluster0',
      type: 'circle',
      source: {
        type: 'vector',
        url: this.mapLayers['frameCluster0']['url']
      },
      'source-layer': this.mapLayers['frameCluster0']['source-layer'],
      minzoom: this.mapLayers['frameCluster0']['minzoom'],
      maxzoom: this.mapLayers['frameCluster0']['maxzoom'],
      paint: {
        'circle-opacity': .6,
        'circle-color': this.themeSettings.color_sets.secondary.base,
        'circle-radius': 1
      }
    });
    // Center the map on the coordinates of any clicked symbol from the 'symbols' layer.
    this.map.on('mouseenter', 'frameCluster0', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'frameCluster0', () => {
      this.map.getCanvas().style.cursor = '';
    });

    // this.map.on('click', 'frameCluster0', this.framCluster0ZoomIn);
    if (this.customInventories === 'active') {
      this.map.addLayer({
        id: 'customFrameCluster0',
        type: 'circle',
        source: {
          type: 'vector',
          url: this.mapLayers['customInventory']['mm0']['url']
        },
        'source-layer': this.mapLayers['customInventory']['mm0']['source-layer'],
        minzoom: this.mapLayers['customInventory']['mm0']['minzoom'],
        maxzoom: this.mapLayers['customInventory']['mm0']['maxzoom'],
        paint: {
          'circle-opacity': .6,
          'circle-color': this.themeSettings.color_sets.secondary.base,
          'circle-radius': 1
        }
      });
      // Center the map on the coordinates of any clicked symbol from the 'symbols' layer.
      this.map.on('mouseenter', 'customFrameCluster0', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', 'customFrameCluster0', () => {
        this.map.getCanvas().style.cursor = '';
      });
    }


    // add 5 to 7 this.map...
    this.map.addLayer({
      id: 'frameCluster5',
      type: 'circle',
      source: {
        type: 'vector',
        url: this.mapLayers['frameCluster5']['url']
      },
      'source-layer': this.mapLayers['frameCluster5']['source-layer'],
      minzoom: this.mapLayers['frameCluster5']['minzoom'],
      maxzoom: this.mapLayers['frameCluster5']['maxzoom'],
      paint: {
        'circle-opacity': .6,
        'circle-color': this.themeSettings.color_sets.secondary.base,
        'circle-radius': {
          'base': 1,
          'stops': [[this.mapLayers['frameCluster5']['minzoom'], 1], [this.mapLayers['frameCluster5']['maxzoom'], 3]]
        }
      }
    });
    // Center the map on the coordinates of any clicked symbol from the 'symbols' layer.
    this.map.on('mouseenter', 'frameCluster5', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'frameCluster5', () => {
      this.map.getCanvas().style.cursor = '';
    });
    // this.map.on('click', 'frameCluster5', this.framCluster5ZoomIn);
    if (this.customInventories === 'active') {
      this.map.addLayer({
        id: 'customFrameCluster5',
        type: 'circle',
        source: {
          type: 'vector',
          url: this.mapLayers['customInventory']['mm5']['url']
        },
        'source-layer': this.mapLayers['customInventory']['mm5']['source-layer'],
        minzoom: this.mapLayers['customInventory']['mm5']['minzoom'],
        maxzoom: this.mapLayers['customInventory']['mm5']['maxzoom'],
        paint: {
          'circle-opacity': .6,
          'circle-color': this.themeSettings.color_sets.secondary.base,
          'circle-radius': {
            'base': 1,
            'stops': [[this.mapLayers['customInventory']['mm5']['minzoom'], 1], [this.mapLayers['customInventory']['mm5']['maxzoom'], 3]]
          }
        }
      });
      // Center the map on the coordinates of any clicked symbol from the 'symbols' layer.
      this.map.on('mouseenter', 'customFrameCluster5', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', 'customFrameCluster5', () => {
        this.map.getCanvas().style.cursor = '';
      });
      // this.map.on('click', 'frameCluster5', this.framCluster5ZoomIn);
    }

    /*national layer*/
    this.map.addLayer({
      id: 'frameClusters',
      type: 'circle',
      source: 'nationalWideData',
      minzoom: 0,
      maxzoom: 7,
      layer:
      {
        'visibility': 'visible',
      },
      paint: {
        'circle-opacity': 0.3,
        'circle-color': '#008da4',
        'circle-radius': ['get', 'radius']
      }
    });

    // Click to zoom in to the panel detail level
    // this.map.on('click', 'frameClusters', this.framClusterZoomIn);

    // add the cluster count label
    this.map.addLayer({
      id: 'frameCount',
      type: 'symbol',
      source: 'nationalWideData',
      minzoom: 0,
      maxzoom: 7,
      filter: ['>', 'radius', 10],
      layout: {
        'visibility': 'none',
        'text-field': '{panelCount}',
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
        'text-color': '#fefefe'
      }
    });

    this.map.addLayer({
      id: 'grayed_frames_panel',
      type: 'circle',
      source: 'allPanels',
      'source-layer': this.mapLayers['allPanels']['source-layer'],
      minzoom: 7,
      layer:
      {
        'visibility': 'visible',
      },
      paint: {
        'circle-opacity': 0.5,
        'circle-radius': {
          'base': 3,
          'stops': [[9, 3], [11, 4]]
        },
        'circle-color': '#878787'
      }
    });
    this.map.on('mouseenter', 'grayed_frames_panel', () => {

      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'grayed_frames_panel', () => {
      this.map.getCanvas().style.cursor = '';
    });
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
    this.map.addLayer({
      id: 'color_frames_panel',
      type: 'circle',
      source: 'allPanels',
      'source-layer': this.mapLayers['allPanels']['source-layer'],
      minzoom: 7,
      maxzoom: 11,
      paint: {
        'circle-opacity': 0.8,
        'circle-radius': 3,
        'circle-color': colors
      }
    });

    this.map.on('mouseenter', 'color_frames_panel', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'color_frames_panel', () => {
      this.map.getCanvas().style.cursor = '';
    });
    if (this.customInventories === 'active') {
      this.map.addLayer({
        id: 'custom_grayed_frames_panel',
        type: 'circle',
        source: {
          type: 'vector',
          url: this.mapLayers['customInventory']['mmAll']['url']
        },
        'source-layer': this.mapLayers['customInventory']['mmAll']['source-layer'],
        minzoom: 7,
        layer:
        {
          'visibility': 'visible',
        },
        paint: {
          'circle-opacity': 0.2,
          'circle-radius': {
            'base': 3,
            'stops': [[9, 3], [11, 4]]
          },
          'circle-color': '#878787'
        }
      });
      this.map.on('mouseenter', 'custom_grayed_frames_panel', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', 'custom_grayed_frames_panel', () => {
        this.map.getCanvas().style.cursor = '';
      });
      this.map.addLayer({
        id: 'custom_color_frames_panel',
        type: 'circle',
        source: {
          type: 'vector',
          url: this.mapLayers['customInventory']['mmAll']['url']
        },
        'source-layer': this.mapLayers['customInventory']['mmAll']['source-layer'],
        minzoom: 7,
        maxzoom: 11,
        paint: {
          'circle-opacity': 0.8,
          'circle-radius': 3,
          'circle-color': colors
        }
      });
      this.map.on('mouseenter', 'custom_color_frames_panel', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', 'custom_color_frames_panel', () => {
        this.map.getCanvas().style.cursor = '';
      });
    }
    // this.map.on('click', 'color_frames_panel', this.colorFrameZoomIn);
    // layer for draw polypon
    this.map.addLayer({
      id: 'customPolygon',
      type: 'fill',
      source: 'polygonData',
      paint: {
        'fill-opacity': .01,
        'fill-color': this.themeSettings.color_sets.highlight.base
      }
    });

    this.map.addLayer({
      id: 'customPolygonStroke',
      type: 'line',
      source: 'polygonData',
      paint: {
        'line-opacity': .8,
        'line-color': this.themeSettings.color_sets.highlight.base,
        'line-width': 2
      }
    });
    this.map.addLayer({
      id: 'frames_panel',
      type: 'symbol',
      source: 'allPanels',
      'source-layer': this.mapLayers['allPanels']['source-layer'],
      minzoom: 10.5,
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
    // Popup and display properties of first feature in the array.
    this.map.on('mouseenter', 'frames_panel', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'frames_panel', () => {
      this.map.getCanvas().style.cursor = '';
    });
    if (this.customInventories === 'active') {
      this.map.addLayer({
        id: 'custom_frames_panel',
        type: 'symbol',
        source: {
          type: 'vector',
          url: this.mapLayers['customInventory']['mmAll']['url']
        },
        'source-layer': this.mapLayers['customInventory']['mmAll']['source-layer'],
        minzoom: 10.5,
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
      // Popup and display properties of first feature in the array.
      this.map.on('mouseenter', 'custom_frames_panel', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', 'custom_frames_panel', () => {
        this.map.getCanvas().style.cursor = '';
      });
    }
    // to display inventory details(geo path id or plant unit id)
    this.map.addLayer({
      'id': 'mapLabel',
      'type': 'symbol',
      'source': 'allPanels',
      'source-layer': this.mapLayers['allPanels']['source-layer'],
      'minzoom': 11,
      'layout': {
        'visibility': 'none',
        'text-field': '{fid}',
        'text-offset': [0, 0.7],
        'text-optional': true,
        'text-size': 12,
        'text-rotation-alignment': 'map',
        'text-justify': 'center',
        'text-padding': 10,
        'text-letter-spacing': 0.05,
        'text-line-height': 1.1,
        'text-max-width': 8
        // 'text-rotate': ['get', MapLayersInvetoryFields.ORIENTATION]
      },
      paint: {
        'text-opacity': 0.9,
        'text-color': '#FFFFFF',
        'text-halo-color': '#000000',
        'text-halo-width': 10,
        'text-halo-blur': 2,
        'text-translate': [0, 10]
      }
    });

    this.map.on('mouseenter', 'mapLabel', () => {

      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'mapLabel', () => {
      this.map.getCanvas().style.cursor = '';
    });

    this.map.addLayer({
      id: 'frameClustersStar',
      type: 'symbol',
      source: 'nationalWideData',
      minzoom: 0,
      maxzoom: 7,
      layout: {
        'visibility': 'none',
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
        'text-color': this.themeSettings['color_sets']['primary']['base']
      }
    });
    this.map.addLayer({
      id: 'showStarPanel',
      type: 'symbol',
      source: 'starFramePanels',
      'source-layer': this.mapLayers['allPanels']['source-layer'],
      minzoom: 0,
      layout: {
        'visibility': 'none',
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
        'text-color': this.themeSettings['color_sets']['primary']['base']
      }
    });
    if (this.customInventories === 'active') {
      this.map.addLayer({
        id: 'custom_showStarPanel',
        type: 'symbol',
        source: {
          type: 'vector',
          url: this.mapLayers['customInventory']['mmAll']['url']
        },
        'source-layer': this.mapLayers['customInventory']['mmAll']['source-layer'],
        minzoom: 0,
        layout: {
          'visibility': 'none',
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
          'text-color': this.themeSettings['color_sets']['primary']['base']
        }
      });
    }
    /* This layer is used to handle Filters -> Location -> Place Set and Radius based filters. */
    /* POI (Place Set Places) Layer start */
    this.map.addLayer({
      id: 'pointOfInterests',
      type: 'symbol',
      source: 'poiDataSet',
      layout: {
        'visibility': 'none',
        'text-line-height': 1,
        'text-padding': 0,
        'text-anchor': 'bottom',
        'text-allow-overlap': true,
        'text-field': 'A',
        'text-offset': [0, 0.7],
        'icon-optional': true,
        'text-font': ['imx-map-font-43 Regular'],
        'text-size': 20
      },
      paint: {
        'text-translate-anchor': 'viewport',
        'text-halo-color': 'rgba(255,255,255,1)',
        'text-halo-width': 1,
        'text-halo-blur': 2,
        'text-color': this.themeSettings['color_sets']['primary']['base']
      }
    });
    this.map.on('mouseenter', 'pointOfInterests', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'pointOfInterests', () => {
      this.map.getCanvas().style.cursor = '';
    });
    /* POI (Place Set Places) Layer END */

    // To prevent pinch-to browser effect in IOS
    this.map.on('touchmove', function (e) {
      e.originalEvent.preventDefault();
    });
    // To save map position
    this.map.on('moveend', (e) => {
      if (!e.mapResize) {
        if (e.polygonData) {
          this.filterService.saveMapPosition(e.polygonData);
        } else {
          if (e.eventType && e.eventType === 'default') {
            this.filterService.saveMapPosition(this.mapService.getMapBoundingBox(this.map, true, this.mapBounds));
          } else {
            this.filterService.saveMapPosition(this.mapService.getMapBoundingBox(this.map, false, this.mapBounds));
          }
        }
      }
    });
    this.map.on('move', (e) =>  {
      if (this.mapViewPostionState === 'secondaryMapView') {
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
      }
    });
    this.map.on('click', this.popupDistributor);
    this.bindRender();
    this.exploreDataService.mapLoaded(true);
    // this.loadViewLayers();
  }

  openPanelPopup(place) {
    this.outSideOpenPlace = place;
    let inventoryAPI = null;
    if (this.customInventories === 'active' && place.client_id && Number(place.client_id) === Number(this.clientId)) {
      inventoryAPI = this.inventoryService
      .getInventoryFromElasticSearch(this.prepareInventoryQuerySE(place['spot_id']))
      .pipe(takeUntil(this.unSubscribe), map(inventoryItems => {
        const sourceData = this.inventoryService.formatSpotElasticData(inventoryItems);
        const feature = sourceData[0] || {};
        feature['plant_frame_id'] = place.plant_frame_id;
        return feature;
      }));
    } else {
      inventoryAPI = this.inventoryService.getInventories(this.prepareInventoryQuery(place['spot_id'])).pipe(takeUntil(this.unSubscribe),
      map(inventoryItems => {
        const feature = inventoryItems[0] || {};
        feature['plant_frame_id'] = place.plant_frame_id;
        return feature;
      }));
    }
    inventoryAPI.subscribe(feature => {
      if (this.customInventories === 'active' && place.client_id && Number(place.client_id) === Number(this.clientId)) {
        this.loadMapPopupData(feature, place);
      } else {
        const params = {
          frameId: feature['frame_id'],
          'target_segment': this.selectedAudienceID,
          'measures_release' : this.commonFilter['measures_release']
        };
        if (this.baseAudience) {
          base_segment: this.defaultAudience.audienceKey
        }
        this.inventoryService.getInventoryFrame(params).subscribe(frameData => {
          const inventoryData = {};
          const layout = frameData['layouts'].find((layoutData) => layoutData['id'] === frameData['id']);
          if (layout) {
            const face = layout['faces'][0];
            const spot = face['spots'].find(s => s['id'] === place['spot_id']);
            inventoryData['spot_count'] = spot?.['length'];
            inventoryData['digital'] = frameData['digital'];
            inventoryData['layer_voice'] = layout?.['share_of_voice'] || 0;
            inventoryData['spot_voice'] = spot?.['share_of_voice'] || 0;
          }
          feature['voice'] = inventoryData;
          feature['plant_frame_id'] = place.plant_frame_id;
          this.loadMapPopupData(feature, place);
        });
      }
    });
  }

  loadMapPopupData(feature, place) {
    const description = this.getPopupHTML(feature, 'outside');
    if (feature['location'] && feature['location']['geometry']) {
      setTimeout(() => {
        if (this.mapPopup.isOpen()) {
          this.mapPopup.remove();
        }
        let zoom = 16;
        if (this.map.getZoom() > 7) {
          zoom = this.map.getZoom();
        }
        if (this.dynamicMapView) {
          clearTimeout(this.inventoryDetailTimer);
          this.mapPopup
            .setLngLat(place.location.geometry.coordinates)
            .setHTML(description.innerHTML)
            .addTo(this.map);
          this.loadFunction(this.mapPopup, this.map, feature);
          // add inventory detail if the inventory not in top 100 list
          if (this.allowInventoryAudience !== 'hidden') {
            this.getSingleInventory(feature, 'desktop');
          }
        } else {
          this.map.flyTo({ center: place.location.geometry.coordinates, zoom: zoom, animate: true });
          this.map.once('moveend', () => {
            clearTimeout(this.inventoryDetailTimer);
            this.mapPopup
              .setLngLat(place.location.geometry.coordinates)
              .setHTML(description.innerHTML)
              .addTo(this.map);
            this.openedFeatureObj = feature;
            this.loadFunction(this.mapPopup, this.map, feature);
            // add inventory detail if the inventory not in top 100 list
            if (this.allowInventoryAudience !== 'hidden') {
              this.getSingleInventory(feature, 'desktop');
            }
          });
        }
      }, 100);
    }
  }

  // private prepareInventoryQuerySE(spotID) {
  //  const query = {
  //     'from': 0,
  //     'size': 1,
  //     'track_total_hits': true,
  //     'query': {
  //       'nested' : {
  //         'path': 'layouts.faces.spots',
  //         'inner_hits' : {},
  //         'query' : {
  //           'term': {
  //             'layouts.faces.spots.id': {
  //               'value': spotID
  //             }
  //           }
  //         }
  //       }
  //     }
  //   };
  //   return query;
  // }


  toggleSideBarState() {
    if (this.sidebarState) {
      this.sidebarState = false;
      this.exploreDataService.setMapViewPositionState('mapView');
    } else {
      this.sidebarState = true;
      this.exploreDataService.setMapViewPositionState('inventoryView');
    }
    this.mapHeight = this.dimensionsDetails.windowHeight - this.dimensionsDetails.headerHeight;
    // For mobile view mapheight
    if (this.mobileView) {
      this.onMobileMapHeight();
    }
    setTimeout(() => {
      this.map.resize({ mapResize: true });
    }, 100);
  }

  getSingleInventory(feature, type) {
    /* const selectedPlace = this.places.filter(place =>
      feature['id'] && place.spot_id === feature['id']
    )[0];
    if (!(this.places.length > 0 && selectedPlace)) {
      if (this.places.length > 0) {
        if (this.places.filter(place =>
          feature['id'] && place.spot_id === feature['id']).length === 0
        ) {
          this.places.push(feature);
        }
      }
      this.metricsCalc();
    } */
    if (
      feature['spot_references'] &&
      feature['spot_references'][0] &&
      feature['spot_references'][0]['measures'] &&
      feature['spot_references'][0]['measures']['imp'] &&
      feature['spot_references'][0]['measures']['imp'] > 0
    ) {
      this.inventoryDetailTimer = setTimeout(() => {
        this.getInventoryDetail(feature);
      }, 500);
    }
  }
  openDetailMap(type) {
    const feature = this.openedFeatureObj;
    let secondary = this.layersService.getlayersSession('secondary');
    const display = this.layersService.defaultDisplayOptions;
    let selectedLayers = [];
    if (secondary === null || secondary) {
      selectedLayers = [];
      secondary = {
        title: 'Secondary Map',
        selectedLayers: [],
        display: display
      };
    } else if (secondary['selectedLayers']) {
      selectedLayers = secondary['selectedLayers'];
      const layerIndex = selectedLayers.findIndex(layer => layer.type === 'geopathId');
      selectedLayers.splice(layerIndex, 1);
    }
    selectedLayers.push({
      data: feature['frame_id'],
      type: 'geopathId',
      id: feature['frame_id'],
      icon: 'icon-circle-stroke',
      color: '#922A95',
      heatMapType: type === 'zip' ? 'top_zips' : 'top_markets'
    });
    secondary['selectedLayers'] = selectedLayers;
    this.layersService.saveLayersSession(secondary, 'secondary');
    this.layersService.setApplyLayers({
      'type': 'secondary',
      'flag': true
    });
    // const inventoryDetail = this.inventoryDetailApiData.getValue();
    // const feature = this.openedFeatureObj;
    // // this.features[i];
    // if (feature && feature.properties) {
    //   this.hoverOnCard(feature.properties);
    // }
  }

  loadFunction(popup, map, feature) {
    const self = this;
    super.loadFunction(popup, map, feature);
    $('.fselectbtn').off().on('click',
      function (f) {
        const e = self.current_e;
        const i = self.current_page;
        const gid = feature.id;
        const selected = self.selectedFidsArray.filter(f => (f.fid + '' === feature.id + ''));
        const selectedPlace = self.places.filter(place => (place.spot_id + '' === feature.id + ''));

        if (selectedPlace.length <= 0 && selected.length > 0) {
          const gpFilter = {};
          gpFilter['audience'] = self.selectedAudienceID;
          gpFilter['base'] = self.selectedBaseID;
          // gpFilter['idType'] = 'geopathPanel';
          gpFilter['geopathPanelIdList'] = [gid];
          const value = !(selected[0].selected);
          self.places.map(place => {
            if (place.spot_id === selected[0].fid) {
              place.selected = value;
            }
          });
          self.selectedFidsArray.map(place => {
            if (place.fid === selected[0].fid) {
              place.selected = value;
            }
          });
          if (value) {
            $(this).addClass('selected');
            $(this).find('span').html('Selected');
          } else {
            $(this).removeClass('selected');
            $(this).find('span').html('Select');
          }
          self.metricsCalc();
        } else if (selected.length > 0) {
          const selectedFeature = selected[0];
          selectedFeature.selected = !selectedFeature.selected;
          self.places.map(place => {
            if (place.spot_id === selectedFeature.fid) {
              place.selected = selectedFeature.selected;
            }
          });
          self.selectedFidsArray.map(place => {
            if (place.fid === selectedFeature.fid) {
              place.selected = selectedFeature.selected;
            }
          });
          if (selected[0].selected) {
            $(this).addClass('selected');
            $(this).find('span').html('Selected');
          } else {
            $(this).removeClass('selected');
            $(this).find('span').html('Select');
          }

          self.metricsCalc();
        }
        // TODO: Commented while implement GPATH API integration need to implement
        self.updateBubblesCount(true);
        self.modifySearchResultMapFormat();
        return false;
      });
      self.map.on('selection', function (e) {
        if (self.selectedFrameId['fid'] === feature.id) {
          if (self.selectedFrameId['selected']) {
            $('.fselectbtn').addClass('selected').find('span').html('Selected');
          } else {
            $('.fselectbtn').removeClass('selected').find('span').html('Select');
          }
        }
      });
      $('#map-it-zip').off().on('click',
        (e) => {
          this.openDetailMap('zip');
          return false;
        });
      $('#map-it-dma').off().on('click',
        (e) => {
          this.openDetailMap('dma');
          return false;
        });
  }

  loadingPDF(pdf_downloading) {
    const download_pdf = <HTMLElement>document.querySelector('.download_us_pdf');
    if (pdf_downloading) {
      download_pdf.innerHTML = '<div id="loader"></div>';
    } else {
      download_pdf.innerHTML = '<i class="material-icons">picture_as_pdf</i>';
    }
  }
  placeSelected(spotId) {
    const ChangedSpot = this.places.find(spot => spot.spot_id === spotId);
    this.togglePlaceSelection(ChangedSpot);
  }
  togglePlaceSelection(spot) {
    // Spot is referring to the same object inside this.places[] array in explore component, so no need to loop here again.
    spot.selected = !spot.selected;
    // Need to update selected fids to update the summary
    const selectedItemIndex = this.selectedFidsArray.findIndex(f => (f.fid === spot.spot_id));
    if (selectedItemIndex > -1) {
      this.selectedFidsArray[selectedItemIndex]['selected'] = spot.selected;
    }
    this.selectedFidsArray = Helper.deepClone(this.selectedFidsArray);
    if (this.mapViewPostionState === 'inventoryView') {
      // TODO : Need to find out what this one does and modify it
      // this.filterService.updateFiltersData({ places: this.places });
      this.exploreDataService.setPlaces(this.places);
    }
    this.metricsCalc();
    this.toggleClicks.next();
    this.map.fire('selection', spot.spot_id);
    this.modifySearchResultMapFormat();

  }

  private saveFidsInSession() {
    const filtersData = {};
    filtersData['selectQuery'] = this.selectQuery;
    filtersData['previousSelectQuery'] = this.previousSelectQuery;
    if (this.selectQuery === 'Custom') {
      const selectedIds = this.places.filter(spot => spot.selected).map(spot => spot.spot_id);
      const unSelectedIds = this.places.filter(spot => !spot.selected).map(spot => spot.spot_id);
      if (this.previousSelectQuery === 'All') {
        filtersData['unSelectedSpotIds'] = unSelectedIds;
        filtersData['selectedSpotIds'] = [];
      } else if (this.previousSelectQuery === 'None') {
        filtersData['selectedSpotIds'] = selectedIds;
        filtersData['unSelectedSpotIds'] = [];
      } else {
        filtersData['selectedSpotIds'] = selectedIds;
        filtersData['unSelectedSpotIds'] = [];
      }
    } else {
      filtersData['unSelectedSpotIds'] = [];
      filtersData['selectedSpotIds'] = [];
    }
    filtersData['selectQueryLimited'] = this.selectQueryLimited;
    filtersData['selectedInventoryCount'] = this.selectedInventoryCount;
    this.filterService.updateFiltersData(filtersData);
    this.setSelectedInventoriesData();
  }

  metricsCalc(): void {
    if (this.places.length <= 0) {
      return;
    }
    const selectedCount = this.places.filter(place => place.selected).length;
    if (selectedCount === 0) {
      this.selectedInventoryCount = 0;
      this.previousSelectQuery = this.selectQuery;
      this.selectQuery = 'None';
      this.saveFidsInSession();
      //this.setSelectedInventoriesData();
      return;
    }
    if (selectedCount === this.places.length && this.selectQuery !== 'Top 100') {
      this.previousSelectQuery = this.selectQuery;
      this.selectQuery = 'All';
      this.selectedInventoryCount = this.totalInventory;
      this.saveFidsInSession();
      //this.setSelectedInventoriesData();
      return;
    }
    const selectedFromTop25 = this.places.slice(0, 25).filter(place => place.selected).length;
    if (selectedCount === 25 && selectedCount === selectedFromTop25) {
      this.previousSelectQuery = this.selectQuery;
      this.selectQuery = 'Top 25';
      this.selectedInventoryCount = 25;
      this.saveFidsInSession();
      //this.setSelectedInventoriesData();
      return;
    }
    const selectedFromTop50 = this.places.slice(0, 50).filter(place => place.selected).length;
    if (selectedCount === 50 && selectedCount === selectedFromTop50) {
      this.previousSelectQuery = this.selectQuery;
      this.selectQuery = 'Top 50';
      this.selectedInventoryCount = 50;
      this.saveFidsInSession();
      //this.setSelectedInventoriesData();
      return;
    }
    const selectedFromTop100 = this.places.slice(0, 100).filter(place => place.selected).length;
    if (selectedCount === 100 && selectedCount === selectedFromTop100) {
      this.previousSelectQuery = this.selectQuery;
      this.selectQuery = 'Top 100';
      this.selectedInventoryCount = 100;
      this.saveFidsInSession();
      //this.setSelectedInventoriesData();
      return;
    }
    // If it doesn't match any condition above, than it must be custom selection.
    if (this.selectQuery !== 'Custom') {
      this.previousSelectQuery = this.selectQuery;
    }
    this.selectQuery = 'Custom';
    if (this.previousSelectQuery === 'All') {
      this.selectedInventoryCount = this.totalInventory - this.places.filter(place => !place.selected).length;
    } else {
      this.selectedInventoryCount = this.places.filter(place => place.selected).length;
    }
    this.saveFidsInSession();
    //this.setSelectedInventoriesData();
  }

  formatUpNationalData(data) {
    data.features.sort(function (a, b) {
      return b.properties.panelCount - a.properties.panelCount;
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
  // updating map when drawing polygon is done
  updateFiltersFromPolygon(polygonFromSession = {}) {
    // generate bounding box from polygon the user drew
    if (((this.mapDrawEnable || this.circleDrawEnable) &&
      this.draw.getAll().features.length > 0) || polygonFromSession['region']) {
      this.customPolygon.coordinates = [];
      if (polygonFromSession['region']) {
        this.customPolygon.coordinates.push([].concat.apply([], polygonFromSession['region']['coordinates']));
        if (polygonFromSession['regularPolygon']) {
          this.mapDrawEnable = true;
        } else if (polygonFromSession['circularPolygon']) {
          this.circleDrawEnable = true;
        }
        this.customPolygonFeature.geometry = polygonFromSession['region'];
        this.polygonData.features.push(this.customPolygonFeature);
        const boundBox = bbox(this.customPolygon);
        // this.map.fitBounds(boundBox); // commented to fix map position on layer load.
      } else {
        if (this.circleDrawEnable) {
          this.customPolygon.coordinates = [];
          this.customPolygon.coordinates.push([RadiusMode.circleCoordinates]);
          this.customPolygonFeature.geometry.coordinates.push(RadiusMode.circleCoordinates);
          this.polygonData.features.push(this.customPolygonFeature);
          this.setPolygonFilters('circularPolygon');
        } else {
          this.customPolygon.coordinates = [];
          this.customPolygon.coordinates.push(this.draw.getAll().features[0].geometry.coordinates);
          this.polygonData.features.push(this.draw.getAll().features[0]);
          this.setPolygonFilters('regularPolygon');
        }
      }
      // enabling polygon layer view
      this.togglePolygonLayerView(true);

      // Will implement later with fiterService
      // this.map_filter_state.next(true);
      if (!polygonFromSession['region']) {
        this.removePolygonFeature();
      }
      setTimeout(() => {
        this.enableMapInteraction();
      }, 200);
    }
  }

  private setPolygonFilters(filterType) {
    this.inventoryService.getInventoryFromElasticSearch(
      this.inventoryService.preparePolygonQuery(this.customPolygon), false, 'geopath').pipe(
        map((result) => result['aggregations']['spots']['ids']['buckets'].map(spot => spot['key']
        ))).subscribe(idsArray => {
      this.filterService.setFilter('location', { region: this.customPolygon, type: filterType, polygonIdsArray: idsArray });
    });
  }
  // to remove custom polygon object
  removePolygonFeature() {
    this.draw.deleteAll();
  }

  // to remove custom polygon and draw controls
  removePolygon(updateMap = true) {
    if (this.mapViewSearch > 0) {
      this.removeMapViewPolygon(true, 'mapViewPolygon');
    } else if (this.geoPolygon) {
      this.removeMapViewPolygon(true, 'geoPolygon');
    } else if (this.placeSetsDisplay) {
      this.removePlaceSetsPolygon();
    } else {
      this.togglePolygonLayerView(false);
      if (this.mapDrawEnable || this.circleDrawEnable) {
        const sessionFilter = this.filterService.getExploreSession();
        if (!(sessionFilter && sessionFilter['location'] && sessionFilter['location']['region'])) {
          this.removePolygonFeature();
          this.map.removeControl(this.draw);
          this.map.getContainer().classList.remove('mouse-add');
        }
        this.enableMapInteraction();
        if (this.mapDrawEnable) {
          this.mapDrawEnable = false;
        } else {
          this.circleDrawEnable = false;
        }
        this.customPolygon.coordinates = [];
        this.customPolygonFeature.geometry = {
          type: 'Polygon',
          coordinates: []
        };
        this.polygonData.features = [];
        if (updateMap) {
          this.filterService.setFilter('location', {});
          // this.map_filter_state.next(true);
        }
        this.addingMapDraw = true;
      }
    }
  }

  // initializing the draw functionality of custom polygon
  drawPolygon() {
    this.addingMapDraw = true;
    if (this.circleDrawEnable) {
      this.removePolygon(true);
    }
    if (!this.map.getSource('mapbox-gl-draw-cold')) {
      this.map.addControl(this.draw);
    }
    this.mapDrawEnable = true;
    if (this.draw.getAll().features.length > 0) {
      this.draw.deleteAll();
    }
    if (this.mapViewSearch > 0) {
      this.removeMapViewPolygon(true, 'mapViewPolygon');
    }
    if (this.geoPolygon) {
      this.removeMapViewPolygon(true, 'geoPolygon');
    }
    if (this.placeSetsDisplay) {
      this.removePlaceSetsPolygon();
    }
    if (this.dynamicMapView > 0) {
      $('#location-search').click();
    }
    this.polygonData.features = [];
    // this.customPolygonFeature.geometry.coordinates = [];
    this.draw.changeMode('draw_polygon');
    this.map.on('draw.create', this.updateFiltersFromPolygon.bind(this));
    this.disableMapInteraction();
    this.togglePolygonLayerView(false);
  }

  drawCircle() {
    this.addingMapDraw = true;
    if (this.mapDrawEnable) {
      this.removePolygon(true);
    }
    if (!this.map.getSource('mapbox-gl-draw-cold')) {
      this.map.addControl(this.draw);
    }
    this.circleDrawEnable = true;
    if (this.draw.getAll().features.length > 0) {
      this.draw.deleteAll();
    }
    if (this.mapViewSearch > 0) {
      this.removeMapViewPolygon(true, 'mapViewPolygon');
    }
    if (this.geoPolygon) {
      this.removeMapViewPolygon(true, 'geoPolygon');
    }
    if (this.placeSetsDisplay) {
      this.removePlaceSetsPolygon();
    }
    if (this.dynamicMapView > 0) {
      $('#location-search').click();
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

  // to on or off polygon layers
  togglePolygonLayerView(enable = false) {
    if (!this.map.getSource('polygonData')) {
      return;
    }
    if (enable) {
      this.map.getSource('polygonData').setData(this.polygonData);
      this.map.setLayoutProperty('customPolygon', 'visibility', 'visible');
      this.map.setLayoutProperty('customPolygonStroke', 'visibility', 'visible');
    } else {
      const emptyData = Object.assign({}, this.polygonData);
      emptyData.features = [];
      this.map.getSource('polygonData').setData(emptyData);
      this.map.setLayoutProperty('customPolygon', 'visibility', 'none');
      this.map.setLayoutProperty('customPolygonStroke', 'visibility', 'none');
    }
  }
  // Commenting Geo polygon related code becuase of absence of co-ordinates in Geopath API
  onDrawGeopolygon(selectedGeoLocation) {
    this.filterService.setFilter('location', { type: 'geography', selectedGeoLocation: selectedGeoLocation });
    // this.geoFilter = {};
    // this.geoFilter = Geopolygon;
    // this.redraw = true;
    // this.drawMapViewPolygon({ multiPolygon: Geopolygon.geometry, polygonType: 'geoPolygon' });
  }

  // to load default map view polygon
  loadMapView() {
    if (this.dynamicMapView > 0) {
      $('#location-search').click();
    }
    this.drawMapViewPolygon({
      multiPolygon: this.mapService.getMapBoundingBox(this.map, false, this.mapBounds), polygonType: 'mapViewPolygon'
    });
  }

  // To draw default & geo map view polygons
  drawMapViewPolygon(polygonObject) {
    if (this.mapViewSearch > 0) {
      this.removeMapViewPolygon(false, 'mapViewPolygon');
    }
    if (this.mapDrawEnable || this.circleDrawEnable) {
      this.removePolygon(false);
    }
    if (this.geoPolygon) {
      this.removeMapViewPolygon(false, 'geoPolygon');
    }
    if (this.placeSetsDisplay) {
      this.removePlaceSetsPolygon();
    }
    this.customPolygon = polygonObject.multiPolygon;
    this.customPolygonFeature.geometry = {
      type: 'Polygon',
      coordinates: []
    };
    this.customPolygonFeature.geometry.coordinates = [].concat.apply([], polygonObject.multiPolygon.coordinates);
    this.polygonData.features = [];
    this.polygonData.features.push(this.customPolygonFeature);
    this.togglePolygonLayerView(true);
    switch (polygonObject.polygonType) {
      case 'mapViewPolygon':
        this.mapViewSearch = 1;
        this.setPolygonFilters('mapViewPolygon');
        break;
      case 'geoPolygon':
        this.geoPolygon = true;
        if (!this.geoFilter['searchParams']) {
          if (polygonObject['geoFilter'] && polygonObject['geoFilter']['searchParams']) {
            this.geoFilter = polygonObject['geoFilter'];
          }
        }
        const searchParams = {
          'id': this.geoFilter.searchParams.id,
          'type': this.geoFilter.searchParams.type,
        };
        this.filterService.setFilter('location', { region: searchParams, type: 'geoPolygon', geoFilter: this.geoFilter });
        break;
      default:
        break;
    }
    if (polygonObject['geoFilter']) {
      this.geoFilter = polygonObject['geoFilter'];
    }
    this.map.fitBounds(bbox(this.customPolygon), { duration: 100 }, { polygonData: this.customPolygon, eventType: 'drawMapView' });
  }

  // To remove default & geo map view polygons
  removeMapViewPolygon(updateMap = true, polygonType) {
    this.customPolygonFeature.geometry.coordinates = [];
    this.polygonData.features = [];
    this.customPolygon.coordinates = [];
    this.togglePolygonLayerView(false);
    switch (polygonType) {
      case 'mapViewPolygon':
        this.mapViewSearch = 0;
        break;
      case 'geoPolygon':
        this.geoPolygon = false;
        if (this.redraw === false) {
          $('#search-locations').val('');
        }
        this.redraw = false;
        break;
      default:
        break;
    }
    if (updateMap) {
      this.filterService.setFilter('location', {});
      // this.map_filter_state.next(true);
    }
  }

  disableMapInteraction() {
    if (this.enableMapInteractionFlag) {
      this.enableMapInteractionFlag = false;
      this.map['boxZoom'].disable();
      this.map['doubleClickZoom'].disable();
      this.map['scrollZoom'].disable();
      this.map.off('click', this.popupDistributor);
      this.map.on('click', this.disablePopupDistributor);
    }
    /*this.map.off('click', 'frameCluster0', this.framCluster0ZoomIn);
    this.map.off('click', 'frameCluster5', this.framCluster5ZoomIn);
    this.map.off('click', 'grayed_frames_panel', this.greyedFrameZoomIn);
    this.map.off('click', 'color_frames_panel', this.colorFrameZoomIn);
    this.map.off('click', 'frames_panel', this.framesZoomIn);
    this.map.off('click', 'places', this.placesZoomIn);
    this.map.off('click', 'frameClusters', this.framClusterZoomIn);
    this.map.off('click', 'framesLayer', this.placeFramePopup);*/

  }

  enableMapInteraction() {
    if (!this.enableMapInteractionFlag) {
      this.enableMapInteractionFlag = true;
      this.map['boxZoom'].enable();
      this.map['doubleClickZoom'].enable();
      this.map['scrollZoom'].enable();
      this.map.off('click', this.disablePopupDistributor);
      this.map.on('click', this.popupDistributor);
    }
    /*this.map.on('click', 'frameCluster0', this.framCluster0ZoomIn);
    this.map.on('click', 'frameCluster5', this.framCluster5ZoomIn);
    this.map.on('click', 'grayed_frames_panel', this.greyedFrameZoomIn);
    this.map.on('click', 'color_frames_panel', this.colorFrameZoomIn);
    this.map.on('click', 'frames_panel', this.framesZoomIn);
    this.map.on('click', 'places', this.placesZoomIn);
    this.map.on('click', 'frameClusters', this.framClusterZoomIn);
    this.map.on('click', 'framesLayer', this.placeFramePopup);*/
  }

  loadData() {
    if (this.map.getZoom() >= 7) {
      const boundBox = this.mapService.getMapBoundingBox(this.map, false, this.mapBounds);
      this.filterService.setFilter('location', { region: boundBox, type: 'dynamicMapView' });
    }
  }

  setSelectedInventoriesData() {
    this.setSelectedEnable = true;
    let selectedPanels = [];
    let selectedFrameIds = [];
    let dummySelectedPannel = [];
    /**
     * We are collecting spot ids and frame ids separately
     * spot ids used for maintaining selected and unselected inventory
     * frame ids are used to filter the map
     */
    if (this.selectedInventoryCount <= this.places.length) {
      const selectedPlaces = this.places.filter(place => place.selected);
      selectedPanels = selectedPlaces.map(place => place.spot_id);
      selectedFrameIds = selectedPlaces.map(place => place.frame_id);
    } else {
      const selectedIds = this.selectedFidsArray.filter(idObject => idObject.selected);
      selectedPanels = selectedIds.map(idObject => idObject.fid);
      selectedFrameIds = selectedIds.map(idObject => idObject.frameId);
    }
    dummySelectedPannel = Helper.deepClone(selectedPanels);

    let selectedPanelCnt = 0;
    if (selectedPanels.length > 0) {
      selectedPanelCnt = selectedPanels.length;
    } else {
      selectedPanelCnt = 0;
      selectedPanels = [0];
    }
    const filters = [];
    filters.unshift('all');
    selectedFrameIds.unshift('in', MapLayersInvetoryFields.FRAME_ID);
    filters.push(selectedFrameIds);
    /* for seeing the color frame panel at 7 th zoom*/
    if (this.selectedFidsArray) {
      if (this.map.getLayer('color_frames_panel')) {
        this.map.setFilter('color_frames_panel', filters);
        this.map.setLayoutProperty('color_frames_panel', 'visibility', 'visible');
      }
      if (this.customInventories === 'active' && this.map.getLayer('custom_color_frames_panel')) {
        this.map.setFilter('custom_color_frames_panel', filters);
        this.map.setLayoutProperty('custom_color_frames_panel', 'visibility', 'visible');
      }
      if (selectedPanelCnt <= 100) {
        if (this.map.getLayer('color_frames_panel')) {
          this.map.setPaintProperty('color_frames_panel', 'circle-radius', 5);
        }
        if (this.customInventories === 'active' && this.map.getLayer('custom_color_frames_panel')) {
          this.map.setPaintProperty('custom_color_frames_panel', 'circle-radius', 5);
        }
      } else {
        if (this.map.getLayer('color_frames_panel')) {
          this.map.setPaintProperty('color_frames_panel', 'circle-radius', 3);
        }
        if (this.customInventories === 'active' && this.map.getLayer('custom_color_frames_panel')) {
          this.map.setPaintProperty('custom_color_frames_panel', 'circle-radius', 3);
        }
      }
      if (this.map.getLayer('frames_panel')) {
        this.map.setFilter('frames_panel', filters);
      }
      if (this.customInventories === 'active' && this.map.getLayer('color_frames_panel')) {
        this.map.setFilter('custom_frames_panel', filters);
      }
      if (this.map.getLayer('mapLabel')) {
        this.map.setFilter('mapLabel', filters);
      }
      /** Setting Gray dot for unseleccted items */
      const unSelectedIds = [];
      const unSelectedFrameIds = [];
      this.selectedFidsArray
        .filter(place => place.fid && !dummySelectedPannel.includes(place.fid))
        .forEach(place => {
          unSelectedIds.push(place.fid);
          if(!unSelectedFrameIds.includes(place.frameId)) {
            unSelectedFrameIds.push(place.frameId);
          }
        });
      /** updating seleccted and unselecetd spot ids*/
      if(unSelectedIds.length) {
        this.selectedFidsArray.map(spot => {
          spot.selected = !(unSelectedIds.includes(spot.fid));
        });
      } else {
        this.selectedFidsArray.map(spot => {
          spot.selected = true;
        });
      }

      /** Setting Graydot ids based on unselected Ids */
      const unfilters = [];
      unfilters.push('all');
      unSelectedFrameIds.unshift('in', MapLayersInvetoryFields.FRAME_ID);
      unfilters.push(unSelectedFrameIds);
      if (this.map && this.map.getLayer('grayed_frames_panel') && unfilters.length && unfilters[1][2]) {
        this.map.setFilter('grayed_frames_panel', unfilters);
      } else if (this.map && this.map.getLayer('grayed_frames_panel') && !unfilters[1][2]) {
        unfilters[1][2] = 0;
        this.map.setFilter('grayed_frames_panel', unfilters);
      }
    }
  }

  private getInventoriesFromES(filters, paging = false) {
    if (this.inventoriesApiCall != null) {
      this.inventoriesApiCall.unsubscribe();
    }
    if (filters['location']) {
      delete filters['location'];
    }
    if ((this.filtersAttributes.some(key => filters[key])
      || (filters['measures_range_list']
        && filters['measures_range_list'].length > 1)) && this.inventoryService.checkToCallCustomInv(filters)) {
      const filterData = Helper.deepClone(filters);
      filterData['page_size'] = 100;
      filterData['page'] = filterData['page'] - 1;
      const query = this.inventoryService.prepareInventoryQuery(filterData);
      // this.inventoriesApiCall =
      this.inventoryService.getInventoryFromElasticSearch(query)
        .pipe(map((responseData: any) => {
          const res = {};
          if (responseData['hits'] && responseData['hits']['hits']) {
            const inventories = [];
            responseData['hits']['hits'].map(hit => {
              const source = hit['_source'];
              if (hit['inner_hits']) {
                source['layouts'][0]['faces'][0]['spots'] = hit['inner_hits']['layouts.faces.spots']['hits']['hits'].map(inner_hit => inner_hit['_source']);
              }
              inventories.push(source);
            });
            res['inventoryItems'] = inventories;
          }
          return res;
        }))
        .subscribe(result => {
          const inventoryItems = result['inventoryItems'] || [];
          if (!paging) {
            // TODO: Invaild IDs have to implement for elasticsearch
            const invalidIds = {
              geoPanelIds: [],
              plantIds: [],
              invalidSpotIds: [],
              invalidOperatorSpotIds : []
            };
            this.exploreDataService.setInvalidIds(invalidIds);
            if (inventoryItems) {
              this.common.formatSpotIdsFoES(inventoryItems, this.clientId).then(spots => {
                const places = spots;
                if (this.sessionFilter) {
                  places.map((place) => {
                    place.selected = true;
                    const fid = this.selectedFidsArray.filter((id) => (place.spot_id === id.fid));
                    if (fid.length > 0) {
                      place.selected = fid[0].selected;
                    }
                  });
                  this.sessionFilter = false;
                  this.places = places;
                  this.metricsCalc();
                  // this.modifySearchResultMapFormat();
                } else {
                  this.exploreDataService.setPlaces(places);
                }
              });
            }
          } else {
            if (typeof inventoryItems !== 'undefined') {
              this.common.formatSpotIdsFoES(inventoryItems, this.clientId).then(spots => {
                if (this.sessionFilter) {
                  spots.map((place) => {
                    place.selected = false;
                    const fid = this.selectedFidsArray.filter((id) => (place.spot_id === id.fid));
                    if (fid.length > 0) {
                      place.selected = fid[0].selected;
                      // this.places.push(place);
                    }
                  });
                  this.places = [...this.places, ...spots];
                  this.sessionFilter = false;
                } else {
                  $.each(spots, (i, val) => {
                    if (this.selectQuery === 'All') {
                      val.selected = true;
                    } else {
                      val.selected = false;
                    }
                    this.places.push(val);
                  });
                  this.metricsCalc();
                }
              });
            }
            this.loaderService.display(false);
          }
        }, error => {
          // this.exploreDataService.setPlaces([]);
          this.filterApiCallLoaded = false;
        });
    } else {
      // this.exploreDataService.setPlaces([]);
      this.filterApiCallLoaded = false;
    }
  }
  getInventoryIDsFromES(filtersData): Observable<any> {
    const gpFilter = Helper.deepClone(filtersData);
    this.filterApiCallLoaded = true;
    this.exploreDataService.setSearchCriteria(gpFilter);
    let query = this.inventoryService.prepareInventoryQuery(gpFilter);
    query = this.inventoryService.addTotalSpotQuery(query, filtersData);
    query = this.inventoryService.addInventoryIdsQuery(query, filtersData);
    query['size'] = 0;
    return this.inventoryService.getInventoryFromElasticSearch(query)
      .pipe(map(res => {
        const data = {};
        data['inventoryIDs'] = res['aggregations']['spotIds']['spot_filter']['ids']['buckets'].map(spot => {
          return (spot.key).toString();
        });
        data['total'] = res['aggregations']['spots']['spot_filter']['spot_count']['value'];
        return data;
      }), catchError(error => of({})));

  }
  searchFromGPFilter(filtersData, initialCall = false, sort = false, paging = false) {
    this.ngUnsubscribe.next();
    if (this.clearGPFIltertimeout != null) {
      this.clearGPFIltertimeout.unsubscribe();
    }
    const gpFilter = Helper.deepClone(filtersData);
    if (paging && this.page > 1) {
      gpFilter['page'] = this.page;
    } else {
      this.page = 1;
    }

    if (gpFilter['location']) {
      delete gpFilter['location'];
    }
    this.filterApiCallLoaded = true;
    this.exploreDataService.setSearchCriteria(gpFilter);
    // to update filtered details in tabular view
    this.updateTabularView++;
    if (!initialCall) {
      this.getNationalDataFromAPI(gpFilter);
      if (this.isStatus) {
        this.layersService.pushSearchResultLayer(true);
      }
    } else {
      if (this.isStatus) {
        this.layersService.pushSearchResultLayer(false);
      }
    }
    if (!sort) {
      if (initialCall) {
        if (this.map.getLayer('frameCluster0') && this.map.getLayer('frameCluster5')) {
          this.map.setLayoutProperty('frameCluster0', 'visibility', 'visible');
          this.map.setLayoutProperty('frameCluster5', 'visibility', 'visible');
          if (this.customInventories === 'active') {
            this.map.setLayoutProperty('customFrameCluster0', 'visibility', 'visible');
            this.map.setLayoutProperty('customFrameCluster5', 'visibility', 'visible');
          }
        }
        if (this.map.getLayer('frameClusters') && this.map.getLayer('frameCount')) {
          this.map.setLayoutProperty('frameClusters', 'visibility', 'none');
          this.map.setLayoutProperty('frameCount', 'visibility', 'none');
        }
      }
    }
    this.getSpotIdsUsingFilter(gpFilter, sort, initialCall);
  }

  private getSpotIdsUsingFilter(appliedFilters, sort, initialCall) {
    const gpFilterTemp = Helper.deepClone(appliedFilters);
    delete gpFilterTemp['gp_ids'];
    delete gpFilterTemp['custom_ids'];
    const gpData = this.inventoryService.getInventorySpotIds(gpFilterTemp)
      .pipe(
        switchMap(response => {
          return this.getSpotIdAPIObservables(response, gpFilterTemp);
        }),
        // catchError(error => of([])),
        takeUntil(this.ngUnsubscribe),
        takeUntil(this.unSubscribe));
    const spotIdApiCalls = [gpData];
    if (this.customInventories === 'active' && this.inventoryService.checkToCallCustomInv(appliedFilters)) {
      // TODO : Need to move this to different place where the spot IDs are handled differently after 50K limit removal
      spotIdApiCalls.push(this.getInventoryIDsFromES(appliedFilters)
        .pipe(
          takeUntil(this.unSubscribe) ,
          takeUntil(this.ngUnsubscribe),
          catchError(error => EMPTY))
      );
    }
    forkJoin(spotIdApiCalls)
      .pipe(first())
      .subscribe(results => {
      let t = 0;
      const ids = {};
      results.map((result, index) => {
        if (result['inventoryIDs']) {
          t += result['total'];
          if (index === 0) {
            this.totalGPInventory = result['inventoryIDs'].length;
            ids['gpIds'] = result['inventoryIDs'];
          } else {
            ids['customDBIds'] = result['inventoryIDs'];
          }
        }
      });
      this.totalInventory = t;
      this.exploreDataService.setFids(ids);
      this.getInventories(appliedFilters);
      const total = this.totalGPInventory - 100;
      if (total > 0) {
        this.totalPage = Math.ceil(total / 100);
      } else {
        this.totalPage = 0;
      }
      if (!sort) {
        this.layersChanging = true;
        if (!initialCall) {
          // if (this.map.isStyleLoaded()) {
          this.map.setLayoutProperty('frameCluster0', 'visibility', 'none');
          this.map.setLayoutProperty('frameCluster5', 'visibility', 'none');
          if (this.customInventories === 'active') {
            this.map.setLayoutProperty('customFrameCluster0', 'visibility', 'none');
            this.map.setLayoutProperty('customFrameCluster5', 'visibility', 'none');
          }
          this.map.setLayoutProperty('frameClusters', 'visibility', 'visible');
          this.map.setLayoutProperty('frameCount', 'visibility', 'visible');
          // }
        }
        if (this.customPolygon.coordinates.length > 0) {
          // if (this.map.isStyleLoaded()) {
          this.map.setLayoutProperty('customPolygon', 'visibility', 'visible');
          this.map.setLayoutProperty('customPolygonStroke', 'visibility', 'visible');
          // }
        } else {
          // if (this.map.isStyleLoaded()) {
          this.map.setLayoutProperty('customPolygon', 'visibility', 'none');
          this.map.setLayoutProperty('customPolygonStroke', 'visibility', 'none');
          // }
        }
        // Commmented based on client comment to remove loader.
        // this.loaderService.display(true);
        if (this.locationFilterData && this.locationFilterData['placePackState']) {
          let pois = [];
          this.locationFilterData['placePackState']['selectedPlaceDetails'].map(pack => {
            pack['pois'].map(placePois => {
              pois.push(placePois);
            });
          });
          pois = [].concat.apply([], pois);
          const poi = {
            type: 'FeatureCollection',
            features: pois
          };
          setTimeout(() => {
            this.loaderService.display(false);
          }, 1000);
          setTimeout(() => {
            this.map.getSource('poiDataSet').setData(poi);
            this.map.setLayoutProperty('pointOfInterests', 'visibility', 'visible');
          }, 500);
        } else {
          if (this.map.getLayer('pointOfInterests')) {
            this.map.setLayoutProperty('pointOfInterests', 'visibility', 'none');
          }
          this.loaderService.display(false);
        }
      } else {
        this.loaderService.display(false);
      }
      if (this.filterService.isSessionFilter) {
        this.updateBubblesCount(true);
      }
      this.filterService.isSessionFilter = false;
    }, error => {
      this.filterApiCallLoaded = false;
      this.loaderService.display(false);
    });
  }

  /**
   *
   * @param response Response from the first inventory/spot/id/search API call, to determine pages
   * @param appliedFilters Filters applied in the current state, this modifies the filter array,
   * A clone should be given as appliedFilters
   *
   * This function is to determine how many calls are needed to get all the required spot Ids and
   * return them as observable to the main steam of observables which also gets spot IDs from custom
   * DB.
   */
  private getSpotIdAPIObservables(response, appliedFilters): Observable<any> {
    const pages = response['inventory_summary']['pagination']['number_of_pages'];
    if (pages <= 4) {
      this.disableInventoryList = false;
      this.totalInventory = null;
      // setting switchMap result as observable again into forkJoin, to maintain as single stream
      const spotIdPages: Observable<any>[] = [of(this.getSpotIDsFromResult(response))];
      if (pages > 1) {
        // Starting from second page because we already have first page data
        // limiting to 4 pages because we are only going to display 2L records
        for (let page = 2; page <= pages; page++) {
          appliedFilters['page'] = page;
          // making parallel calls to get all the filtered spot IDs
          const apiCall = this.inventoryService.getInventorySpotIds(appliedFilters)
            .pipe(map(res => this.getSpotIDsFromResult(res)),
              first(),
              catchError(err => of([])));
          spotIdPages.push(apiCall);
        }
      }
      return forkJoin(spotIdPages).pipe(map(res => {
        const ids = res.flat();
        return {
          inventoryIDs: ids,
          total: ids.length
        };
      }), takeUntil(this.ngUnsubscribe));
    } else {
      this.disableInventoryList = true;
      this.filterApiCallLoaded = false;
      this.totalInventory = response['inventory_summary']['pagination']['number_of_spots'];
      this.addFiltersToMap(null);
      return throwError('Too many spots');
    }
  }

  private getSpotIDsFromResult(res) {
    const frame_list = res['inventory_summary']['frame_list'] !== null && res['inventory_summary']['frame_list'] || [];
    return frame_list.reduce((formattedList, item) => {
      const idObjects = item['spot_id_list'].map(id => {
        return {spotId: id, frameId: item.frame_id };
      });
      return formattedList.concat(idObjects);
    }, []);
  }

  hoverOnCard(fid) {
    if (this.clearFlagtimeout != null) {
      clearTimeout(this.clearFlagtimeout);
    }
    this.hoverOnInventoryCard = true;
    if (this.zoomLevel >= 7) {
      if (this.map.getLayer('showStarPanel')) {
        this.map.setLayoutProperty('showStarPanel', 'visibility', 'visible');
        this.map.setFilter('showStarPanel', ['==', MapLayersInvetoryFields.FRAME_ID, fid]);
      }
      if (this.customInventories === 'active') {
        // TODO: Map Layer(spots to frame) changes for custom inventory
        if (this.map.getLayer('custom_showStarPanel')) {
          this.map.setLayoutProperty('custom_showStarPanel', 'visibility', 'visible');
          this.map.setFilter('custom_showStarPanel', ['==', 'fid', fid]);
        }
      }
    }
  }

  hoverOutOnCard() {
    const self = this;
    this.hoverOnInventoryCard = true;
    if (this.map.getLayer('showStarPanel')) {
      this.map.setLayoutProperty('showStarPanel', 'visibility', 'none');
      this.map.setFilter('showStarPanel', ['!=', MapLayersInvetoryFields.FRAME_ID, 0]);
    }
    if (this.map.getLayer('frameClustersStar')) {
      this.map.setLayoutProperty('frameClustersStar', 'visibility', 'none');
      this.map.setFilter('frameClustersStar', ['!=', 'name', '']);
    }
    if (this.customInventories === 'active') {
      // TODO: Map Layer(spots to frame) changes for custom inventory
      if (this.map.getLayer('custom_showStarPanel')) {
        this.map.setLayoutProperty('custom_showStarPanel', 'visibility', 'none');
        this.map.setFilter('custom_showStarPanel', ['!=', 'fid', 0]);
      }
    }
    if (this.clearFlagtimeout != null) {
      clearTimeout(this.clearFlagtimeout);
    }
    this.clearFlagtimeout = setTimeout(function () {
      self.hoverOnInventoryCard = false;
    }, 1000);
  }

  zoomOutMap() {
    this.loadingPlaceData = true;
    this.map.fitBounds([[-128.94797746113613, 18.917477970597474], [-63.4, 50.0]]);
  }

  convertToDecimal(val, p) {
    return this.format.convertToDecimalFormat(val, p);
  }

  convertCurrency(x) {
    return this.format.convertCurrencyFormat(x);
  }

  toggleLevels() {
    this.showLevels = !this.showLevels;
  }

  togglePlaceMoreInfo() {
    this.showPlaceMoreInfo = !this.showPlaceMoreInfo;
  }
  backingScale() {
    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
      return window.devicePixelRatio;
    }
    return 1;
  }

  changeTotalPage(total) {
    this.totalPage = total;
  }

  hideMobileMapViewPopup() {
    this.hideMapViewPopup = true;
    if (!this.sidebarState && this.checkPopupSource !== 'map') {
      this.toggleSideBarState();
    }
  }

  hidePlaceMobileMapViewPopup() {
    this.hideplaceMapViewPopup = true;
    this.detailPlacePopupDescription = '';
  }

  getImpressions(prop) {
    if (this.allowInventoryAudience !== 'hidden') {
      if (prop.totwi !== undefined && prop.totwi > 0) {
        return `Weekly Impressions: ${this.abbrNum(prop.totwi, 0)}`;
      } else {
        return 'Weekly Impressions: Under review';
      }
    } else {
      return false;
    }
  }

  getBoardType(prop, fullValue = false, type = 'panel') {
    let boardType = '';
    if (type == 'frames') {
      boardType = this.exploreDataService.getMediaGroup(prop.mediaTypeID) + ' :: ' + prop.mediaType;
    }
    else {
      boardType = this.exploreDataService.getMediaGroup(prop.mtid) + ' :: ' + prop.mt;
    }

    if (!fullValue) {
      boardType = this.common.truncateString(boardType, 15, true);
    }
    return boardType;
  }

  checkSelected(feature) {
    if (this.selectedFidsArray.length > 0) {
      const selected = this.selectedFidsArray.filter(place => (place.fid === feature.properties.fid));
      let selectedFeature;
      selectedFeature = selected[0];
      if (this.allowInventoryAudience !== 'hidden') {
        if (selected.length <= 0 || !selectedFeature['selected']) {
          return 'Select';
        } else {
          return 'Selected';
        }
      }
    }
  }

  getNoImage() {
    this.mobileImageSrc = '../../assets/images/no_photo.png';
  }

  openMobilePopup(place, zoom, type = 'map') {
    this.mapFeature = place;
    setTimeout(() => {
      const element = document.getElementById('mobile-popup-impressions');
      if (element) {
        element.innerHTML = '<span>' + 'Weekly Impressions:<div id="loader"></div>';
      }
    }, 100);
    this.checkPopupSource = type;
    // For mobile there is no support. So commenting below line.
    // this.mobileImageSrc = this.getImage(place.properties);
    this.detailPopupDescription = '';
    if (type !== 'map') {
      this.map.flyTo({ center: place.geometry.coordinates, zoom: zoom, animate: true });
      this.map.once('moveend', () => {
        this.hideMapViewPopup = false;
        this.getStaticMapUrl(place.geometry.coordinates, type);
        clearTimeout(this.inventoryDetailTimer);
        setTimeout(() => {
          this.loadFunction(this.mapPopup, this.map, place);
        }, 100);
      });
    } else {
      /*this.mapPopup
      .setLngLat(place.geometry.coordinates)
      .addTo(this.map);*/
      this.hideMapViewPopup = false;
      this.staticMapURL = '';
      clearTimeout(this.inventoryDetailTimer);
      setTimeout(() => {
        this.loadFunction(this.mapPopup, this.map, place);
      }, 100);
    }
    this.getSingleInventory(place, 'mobile');
  }

  private updateBubblesCount(isLoader = false) {
    // if ( this.selectQuery === 'All') {
    //  * getting last value from the observable, This is possible with
    //  * BehaviourSubject Don't abuse this getValue with Subscribers,
    //  * Subscribers are declerative and getValue is imperative paradigm.
    //  *
    //  * If you need to use getValue in your code you're probably doing
    //  * something wrong. This one is a valid use case following a sound
    //  * research.

    // this.setNationalLevelData(this.exploreDataService.nationalFeatures.getValue());
    // return;
    // }
    if (this.selectQuery === 'None') {
      this.exploreDataService.setNationalFeatures({ 'type': 'FeatureCollection', 'features': [] });
      return;
    }
    const filters = this.exploreDataService.getSearchCriteria();
    if (this.selectedInventoryCount < 50001) {
      this.getSpotIds(this.selectedInventoryCount).subscribe((selectedIdsArray => {
        let fids = [];
        if (this.selectQuery === 'All' && (filters['id_list'] && !filters['id_list'].length)) {
          delete filters['id_list'];
          delete filters['id_type'];
        } else {
          if (selectedIdsArray && selectedIdsArray.length > 0) {
            fids = selectedIdsArray.map(id => id.fid);
          } else if (filters['id_list'] && filters['id_list'].length) {
            fids = filters['id_list'];
          } else {
            fids = [0];
          }
          filters['id_list'] = fids;
          filters['id_type'] = 'spot_id';
        }
        this.getNationalDataFromAPI(filters, isLoader);
      }));
    } else {
      delete filters['id_list'];
      delete filters['id_type'];

      this.getNationalDataFromAPI(filters, isLoader);
    }
    this.enableNationalLevelLayers();
  }
  private enableNationalLevelLayers() {
    this.map.setLayoutProperty('frameCluster0', 'visibility', 'none');
    this.map.setLayoutProperty('frameCluster5', 'visibility', 'none');
    if (this.customInventories === 'active') {
      this.map.setLayoutProperty('customFrameCluster0', 'visibility', 'none');
      this.map.setLayoutProperty('customFrameCluster5', 'visibility', 'none');
    }
    this.map.setLayoutProperty('frameClusters', 'visibility', 'visible');
    this.map.setLayoutProperty('frameCount', 'visibility', 'visible');
  }
  private getNationalDataFromAPI(filters, isLoader = false) {
    const requests = [];
    const filtersTemp = Helper.deepClone(filters);
    delete filtersTemp['gp_ids'];
    delete filtersTemp['custom_ids'];

    requests.push(this.inventoryService
      .getMarketTotals(filtersTemp, isLoader).pipe(catchError(error => EMPTY)));
    if (this.customInventories && this.customInventories === 'active' && this.inventoryService.checkToCallCustomInv(filters)) {
      let query = this.inventoryService.prepareInventoryQuery(filters);
      query = this.inventoryService.nationalLevelElasticQuery(query, filters);
      requests.push(this.inventoryService.getInventoryFromElasticSearch(query).pipe(catchError(error => of(null))));
    }
    forkJoin(requests).subscribe(results => {
      const marketTotals = results[0];
      if (results[1] && results[1]['aggregations']['states'] && results[1]['aggregations']['states']['buckets'].length) {
        results[1]['aggregations']['states']['buckets'].forEach((state) => {
          const index = marketTotals['features'].findIndex((feature) => {
            return feature.properties.id.split('DMA')[1] === state.key;
          });
          if (index >= 0) {
            marketTotals['features'][index]['properties']['panelCount'] += state.spots && state.spots.spot_filter.spot_count.value;
          } else {
            const temp = {};
            temp['type'] = 'Feature';
            temp['geometry'] = {
              coordinates: [state.center_lon.value, state.center_lat.value],
              type: 'Point'
            };
            temp['properties'] = {};
            temp['properties']['id'] = `DMA${state.key}`;
            temp['properties']['name'] = '';
            temp['properties']['panelCount'] = state.spots && state.spots.spot_filter.spot_count.value;
            marketTotals['features'].push(temp);
          }
        });
        this.exploreDataService.setNationalFeatures(marketTotals);
      } else {
        this.exploreDataService.setNationalFeatures(marketTotals);
      }
      if (this.selectQuery === 'None') {
        this.exploreDataService.setNationalFeatures({ 'type': 'FeatureCollection', 'features': [] });
      }
    });
  }

  editInventoryPackage(p) {
    this.openPackage('edit', p, true);
  }

  dragChange(event) {
    this.draggedHeight = event - 131;
    setTimeout(() => {
      this.map.resize({ mapResize: true });
    }, 200);
  }

  tabularPanelState(event) {
    this.isVisible = event;
  }

  calculateMapHeight(evet) {
    this.styleHeight = evet;
    if (evet && evet !== 'close') {
      this.mapHeight = this.dimensionsDetails.windowHeight - (this.dimensionsDetails.headerHeight + evet);
      this.styleHeightBack = this.mapHeight;
    } else {
      if (this.mapViewPostionState === 'tabularView') {
        this.mapHeight = this.dimensionsDetails.windowHeight - (this.dimensionsDetails.headerHeight + 250);
        this.mapWidth = this.dimensionsDetails.windowWidth - 40;
      } else {
        this.mapHeight = this.dimensionsDetails.windowHeight - (this.dimensionsDetails.headerHeight);
      }
    }
    setTimeout(() => {
      this.map.resize({ mapResize: true });
    }, 200);
  }

  calculateMapWidth(event) {
    if (this.mapViewPostionState === 'secondaryMapView') {
      this.mapWidth = ((this.dimensionsDetails.windowWidth - 40) - event);
      /*  const mWidth = (this.mapWidth / this.dimensionsDetails.windowWidth) * 100;
        const css = '.top-zip-print .map-div  canvas, .map-div{ width:'+ mWidth +'vw !important; } .explore-top-zip-market-content  canvas, .explore-top-zip-market-content, .explore-top-zip-market-block { width:'+ (100-mWidth) +'vw !important;} '
        const printStyle = document.getElementById('printId');
        if (printStyle !== null) {
          printStyle.remove();
        }
        const body = document.getElementsByTagName('body')[0];
        const style = document.createElement('style');
        style.id = 'printId';
        style.type = 'text/css';
        style.media = 'print';
        style.appendChild(document.createTextNode(css));
        body.appendChild(style);*/
    } else if (this.sidebarState) {
      this.mapWidth = this.dimensionsDetails.windowWidth - 390;
    } else {
      this.mapWidth = this.dimensionsDetails.windowWidth - 40;
    }
    setTimeout(() => {
      this.map.resize({ mapResize: true });
    }, 200);

  }

  openPackage(type = 'add', p = null, saveFromFilter = false) {
    if (this.selectedInventoryCount <= 0) {
      this.showMessageDialog('Please select at least one inventory');
      return;
    } else if (this.selectedInventoryCount > INVENTORY_SAVING_LIMIT) {
      this.showMessageDialog(`Saving inventory is currently limited to ${this.convertPipe.transform(INVENTORY_SAVING_LIMIT, 'ABBREVIATE')} inventory at a time.`);
      return;
    }
    let selectedIds = [];
    if (this.selectQuery === 'All') {
      selectedIds = this.selectedFidsArray.map(item => {
        item.selected = true;
        return item;
      });
    } else if (this.selectQuery === 'Custom' && this.selectedInventoryCount > this.places.length) {
      const unselectedIds = this.places
        .filter(place => !place.selected)
        .map(place => place.spot_id);
      selectedIds = this.selectedFidsArray
        .filter(item => !unselectedIds.includes(item.fid))
        .map(item => {
          item.selected = true;
          return item;
        });
    } else {
      const selectedSpots = this.places
        .filter(place => place.selected)
        .map(place => place.spot_id);
      selectedIds = this.selectedFidsArray
        .filter(item => selectedSpots.includes(item.fid))
        .map(item => {
          item.selected = true;
          return item;
        });
    }
    this. filterService.openPackage(type, p, saveFromFilter, selectedIds, this.selectedPackage, this.clientId);
  }

  private getAPISpotIdsFormatted(pageSize = 50001) {
    /** Getting local loader places unselected ids */
    let unSelectedSpots = [];
    let localPlacesUnIds = this.places.filter(place => !place.selected).map(place => place.spot_id);

    /** Getting session places unselected ids */
    let sessionPlaceUnIds = [];
    const session = this.filterService.getExploreSession();
    if (session['data']['unSelectedSpotIds'] && session['data']['unSelectedSpotIds'].length > 0) {
      sessionPlaceUnIds = session['data']['unSelectedSpotIds'];
    }
    unSelectedSpots = localPlacesUnIds.concat(sessionPlaceUnIds.filter((item) => !localPlacesUnIds.includes(item)));

    return this.inventoryService.getSpotIdsFromAPI(this.appliedFilters, pageSize)
      .pipe(
        map(response => {
          return response
            .filter(item => !unSelectedSpots.includes(item))
            .map(item => {
            // formatting to maintain Backward compatibility with explore inventory set component
            return {'fid': item, selected: true, 'type': 'geopathPanel'};
          });
        }));
  }

  private getLocalSpotIdsFormatted() {
    return this.places
      .filter(place => place['selected'])
      .map(place => {
        // TODO : for BC reasons, I am creating this dummy data structure.
        //  Need to rewrite inventory set component and then remove the selected from this object.
        return {'fid': place['spot_id'], selected: true, 'type': 'geopathPanel'};
      });
  }

  private showMessageDialog(message: string): Observable<any> {
    const data: ConfirmationDialog = {
      notifyMessage: true,
      confirmTitle: 'Info',
      messageText: message
    };
    return this.dialog.open(ConfirmationDialogComponent, {
      data: data,
      width: '586px'
    }).afterClosed();
  }

  public filterByPlaceSets(polygonInfo) {
    this.removePolygon(false);
    this.placeSetsDisplay = true;
    this.polygonInfo = polygonInfo;
    if (polygonInfo.radiusValue > 0) {
      this.polygonData = polygonInfo.featureCollection;
      this.customPolygon.coordinates = polygonInfo.polygon.geometry.coordinates;
      this.togglePolygonLayerView(true);
    }
    this.exploreDataService.savePlaceSetInfo(polygonInfo);
    this.exploreDataService.setSelectedPlacesCtrlValue(polygonInfo.selectedPlaces);
    this.exploreDataService.setRadiusCtrlValue(polygonInfo.radiusValue);
    this.filterService.setFilter('location',
      { region: this.customPolygon, type: 'placeSetView', placePackState: polygonInfo });
  }

  private removePlaceSetsPolygon() {
    this.loaderService.display(true);
    this.placeSetsDisplay = false;
    this.polygonInfo = {};
    this.exploreDataService.setSelectedPlacesCtrlValue([]);
    this.exploreDataService.setRadiusCtrlValue('');
    this.exploreDataService.savePlaceSetInfo({});
    this.customPolygon.coordinates = [];
    this.polygonData.features = [];
    this.loaderService.display(false);
  }

  public loadDynamicMapView(region) {
    const boundBox = bbox(region);
    this.map.fitBounds(boundBox);
    this.dynamicMapView = 1;
  }

  public removeDynamicMapView() {
    this.dynamicMapView = 0;
  }

  onMobileMapHeight() {
    this.mapWidth = this.dimensionsDetails.windowWidth;
    if (this.sidebarState) {
      if (this.dimensionsDetails.orientation === 'portrait') {
        this.mapHeight = this.dimensionsDetails.windowHeight - (this.dimensionsDetails.headerHeight + 365);
        this.inventoryPanelHeight = 167;
      } else {
        this.mapHeight = this.dimensionsDetails.windowHeight - (this.dimensionsDetails.headerHeight + 250);
        this.inventoryPanelHeight = 100;
      }
    } else {
      if (this.dimensionsDetails.orientation === 'portrait') {
        this.mapHeight = this.dimensionsDetails.windowHeight - (this.dimensionsDetails.headerHeight + 120);
      } else {
        this.mapHeight = this.dimensionsDetails.windowHeight - (this.dimensionsDetails.headerHeight + 80 + 40);
      }
    }
    setTimeout(() => {
      this.map.resize({ mapResize: true });
      if (this.isSaveMapPosition) {
        this.setMapPosition();
      }
    }, 200);
  }

  resizeLayout() {
    if (this.mobileView && this.dimensionsDetails.windowWidth < 768) {
      this.onMobileMapHeight();
    } else {
      if (this.mapViewPostionState === 'secondaryMapView') {
        this.mapWidth = ((this.dimensionsDetails.windowWidth - 40) / 2);
      } else if (this.sidebarState) {
        this.mapWidth = this.dimensionsDetails.windowWidth - 390;
      } else {
        this.mapWidth = this.dimensionsDetails.windowWidth - 40;
      }
      if (this.mapViewPostionState === 'tabularView') {
        if (this.styleHeight && this.styleHeight !== 'close') {
          this.mapHeight = this.dimensionsDetails.windowHeight - (this.styleHeight + this.dimensionsDetails.headerHeight);
        } else {
          if (this.styleHeightBack) {
            this.mapHeight = this.styleHeightBack;
          } else {
            this.mapHeight = this.dimensionsDetails.windowHeight - (250 + this.dimensionsDetails.headerHeight);
          }
        }
      } else {
        this.mapHeight = this.dimensionsDetails.windowHeight - this.dimensionsDetails.headerHeight;
      }
      setTimeout(() => {
        this.map.resize({ mapResize: true });
        if (this.viewLayerApplied) {
          this.adjustCustomLogoTextPosition();
        }
        if (this.isSaveMapPosition) {
          this.setMapPosition();
        }
      }, 200);
    }
  }
  private adjustCustomLogoTextPosition() {
    const element = document.getElementById('map-div-block-primary');
    if (element) {
      const layersSession = this.layersService.getlayersSession();
      const containerHeight = element.clientHeight;
      const containerWidth = element.clientWidth;
      if (document.getElementById('map-div-block-primary')
      && document.getElementById('customTextElement-primary')
      && this.mapWidthHeight['width']) {
        if (layersSession && layersSession['display']) {
          if (layersSession['display']['text'] && layersSession['display']['text']['text']) {
            const p = this.getRadioPosition(
              this.mapWidthHeight,
              { height: containerHeight, width: containerWidth }, this.activeDraggableTextPosition, 'customTextElement-primary');
            this.customTextStyle['top'] = p['top'] + 'px';
            this.customTextStyle['left'] = p['left'] + 'px';
            this.activeDraggableTextPosition = {
              x: p['left'],
              y: p['top']
            };
            this.layerDisplayOptions['text']['position'] = {
              'top': p['top'],
              'left': p['left']
            };
          }
        }
        let logoInformation = {};
        if (this.layersService.exploreCustomLogo
          && this.layersService.exploreCustomLogo['primary']
          && this.layersService.exploreCustomLogo['primary']['logo']
          && this.layersService.exploreCustomLogo['primary']['logo']['url']) {
          if (this.layersService.exploreCustomLogo['primary']['logo']['url']) {
            logoInformation = this.layersService.exploreCustomLogo['primary']['logo'];
          }
        } else if (layersSession['display']) {
          if (layersSession['display']['logo'] && layersSession['display']['logo']['url']) {
            logoInformation = layersSession['display']['logo'];
          }
        }
        if (logoInformation['url']) {
          const p = this.getRadioPosition(
            this.mapWidthHeight,
            { height: containerHeight, width: containerWidth }, this.activeDraggablePosition, 'customLogoElement-primary');
          this.logoStyle['top'] = p['top'] + 'px';
          this.logoStyle['left'] = p['left'] + 'px';
          this.activeDraggablePosition = {
            x: p['left'],
            y: p['top']
          };
          if (typeof this.layerDisplayOptions['logo'] === 'undefined') {
            this.layerDisplayOptions['logo'] = {};
          }
          logoInformation['position'] = {
            'top': p['top'],
            'left': p['left']
          };
          this.layerDisplayOptions['logo']['position'] = {
            'top': p['top'],
            'left': p['left']
          };
        }

      }
      this.mapWidthHeight = { height: containerHeight, width: containerWidth };
      this.layerDisplayOptions['screen'] = this.mapWidthHeight;
      this.layersService.setDisplayOptions(this.layerDisplayOptions);
    }
  }
  getRadioPosition(screen, current, position, containerId) {
    const element = document.getElementById(containerId);
    let top = 0;
    let left = 0;
    if (element) {
      const containerHeight = element.clientHeight;
      const containerWidth = element.clientWidth;
      if (screen['width'] < current['width']) {
        const increasePercentage = (current['width'] - screen['width']) / current['width'] * 100;
        left = Math.round(position['x'] + ((position['x'] / 100) * increasePercentage));
      } else if (screen['width'] > current['width']) {
        const decreasePercentage = (screen['width'] - current['width']) / screen['width'] * 100;
        left = Math.round(position['x'] - ((position['x'] / 100) * decreasePercentage));
      } else {
        left = position['x'];
      }
      if ((left + containerWidth) > current['width']) {
        left = (current['width'] - containerWidth - 20);
      } else if (left < 0) {
        left = 10;
      }
      if (screen['height'] < current['height']) {
        const increasePercentage = (current['height'] - screen['height']) / current['height'] * 100;
        top = Math.round(position['y'] + ((position['y'] / 100) * increasePercentage));
      } else if (screen['height'] > current['height']) {
        const decreasePercentage = (screen['height'] - current['height']) / screen['height'] * 100;
        top = Math.round(position['y'] - ((position['y'] / 100) * decreasePercentage));
      } else {
        top = position['y'];
      }
      if ((top + containerHeight) > current['height']) {
        top = (current['height'] - containerHeight - 20);
      } else if (top < 0) {
        top = 10;
      }
    }
    return { top: top, left: left };
  }
  private setMapPosition() {
    const sessionFilter = this.filterService.getExploreSession();
    if (sessionFilter && sessionFilter['data'] && sessionFilter['data']['mapPosition']) {
      const boundBox = bbox(sessionFilter['data']['mapPosition']);
      this.map.fitBounds(boundBox, {}, { polygonData: sessionFilter['data']['mapPosition'], eventType: 'session' });
    } else {
      this.map.fitBounds(
        this.mapBounds, {}, { eventType: 'default' }
      );
    }
    this.isSaveMapPosition = true;
  }

  public toggleLocationFilterLayer(checked) {
    this.togglePolygonLayerView(checked);
  }

  closeTopMap(e) {
    this.hoverOutOnCard();
  }

  onDragging(event, type) {
    this.resizingInProcess = type;
  }
  onDragStop(event, type) {
    if (!this.enableDraggable) {
      return true;
    }
    const layersSession = this.layersService.getlayersSession();
    this.resizingInProcess = '';
    switch (type) {
      case 'text':
        const activeDraggableTextPosition = Helper.deepClone(this.activeDraggableTextPosition);
        activeDraggableTextPosition['x'] += event['x'];
        activeDraggableTextPosition['y'] += event['y'];
        this.customTextStyle['top'] = activeDraggableTextPosition['y'] + 'px';
        this.customTextStyle['left'] = activeDraggableTextPosition['x'] + 'px';
        this.activeDraggableTextPosition = activeDraggableTextPosition;
        this.layerDisplayOptions['text']['position'] = {
          'top': this.activeDraggableTextPosition['y'],
          'left': this.activeDraggableTextPosition['x']
        };
        this.layerDisplayOptions['screen'] = this.mapWidthHeight;
        this.layersService.setDisplayOptions(this.layerDisplayOptions);
        layersSession['display'] = this.layerDisplayOptions;
        this.layersService.saveLayersSession(layersSession);
        this.showDragTextLogo = false;
        setTimeout(() => {
          this.showDragTextLogo = true;
          this.addResizeIcon();
        }, 20);
        break;
      default:
        const activeDraggablePosition = Helper.deepClone(this.activeDraggablePosition);
        activeDraggablePosition['x'] += event['x'];
        activeDraggablePosition['y'] += event['y'];
        this.logoStyle['top'] = activeDraggablePosition['y'] + 'px';
        this.logoStyle['left'] = activeDraggablePosition['x'] + 'px';
        this.activeDraggablePosition = activeDraggablePosition;
        if (typeof this.layerDisplayOptions['logo'] === 'undefined') {
          this.layerDisplayOptions['logo'] = {};
        }
        this.layerDisplayOptions['logo']['position'] = {
          'top': this.activeDraggablePosition['y'],
          'left': this.activeDraggablePosition['x']
        };
        if (
          this.layersService.exploreCustomLogo
          && this.layersService.exploreCustomLogo['primary']
          && this.layersService.exploreCustomLogo['primary']['logo']
        ) {
          this.layersService.exploreCustomLogo['primary']['logo']['position'] = {
            'top': this.activeDraggablePosition['y'],
            'left': this.activeDraggablePosition['x']
          };
        }
        this.layerDisplayOptions['screen'] = this.mapWidthHeight;
        this.layersService.setDisplayOptions(this.layerDisplayOptions);
        layersSession['display'] = this.layerDisplayOptions;
        if (layersSession['customLogoInfo'] && layersSession['customLogoInfo']['logo']) {
          layersSession['customLogoInfo']['logo']['position'] = {
            'top': this.activeDraggablePosition['y'],
            'left': this.activeDraggablePosition['x']
          };
        }
        this.layersService.saveLayersSession(layersSession);
        this.layersService.setDisplayOptions(this.layerDisplayOptions);
        this.showDragLogo = false;
        setTimeout(() => {
          this.showDragLogo = true;
          this.addResizeIcon();
        }, 20);
        break;
    }
  }
  onResizing(event, type) {
    this.resizingInProcess = type;
  }
  onResizeStop(event, type) {
    this.resizingInProcess = '';
    const layersSession = this.layersService.getlayersSession();
    switch (type) {
      case 'text':
        this.customTextStyle['width'] = `${event.size.width}px`;
        this.customTextStyle['height'] = `${event.size.height}px`;
        if (typeof this.layerDisplayOptions['text'] === 'undefined') {
          this.layerDisplayOptions['text'] = {};
        }
        this.layerDisplayOptions['text']['size'] = {
          width: event.size.width,
          height: event.size.height
        };
        this.layersService.setDisplayOptions(this.layerDisplayOptions);
        layersSession['display'] = this.layerDisplayOptions;
        this.layersService.saveLayersSession(layersSession);
        break;
      default:
        this.logoStyle['width'] = `${event.size.width}px`;
        this.logoStyle['height'] = `${event.size.height}px`;
        if (typeof this.layerDisplayOptions['logo'] === 'undefined') {
          this.layerDisplayOptions['logo'] = {};
        }
        this.layerDisplayOptions['logo']['size'] = {
          width: event.size.width,
          height: event.size.height
        };
        this.layersService.setDisplayOptions(this.layerDisplayOptions);
        layersSession['display'] = this.layerDisplayOptions;
        if (
          this.layersService.exploreCustomLogo
          && this.layersService.exploreCustomLogo['primary']
          && this.layersService.exploreCustomLogo['primary']['logo']
        ) {
          this.layersService.exploreCustomLogo['primary']['logo']['size'] = {
            width: event.size.width,
            height: event.size.height
          };
        }
        if (layersSession['customLogoInfo'] && layersSession['customLogoInfo']['logo']) {
          layersSession['customLogoInfo']['logo']['size'] = {
            width: event.size.width,
            height: event.size.height
          };
        }
        this.layersService.saveLayersSession(layersSession);
        break;
    }
  }

  private manageFilterPills(filterData) {
    this.filterService.removeFilterPill('audience');
    this.filterService.removeFilterPill('market');
    this.filterService.removeFilterPill('filters');
    // assume default audience first
    let audience = 'Audience: ' + this.defaultAudience['description'];
    if (filterData['audience']
      && filterData['audience']['details']
      && filterData['audience']['details']['targetAudience']) {
      // If audience is applied override the default one
      audience = 'Audience: ' + filterData['audience']['details']['targetAudience']['name'];
      this.exploreDataService.setSelectedTargetName(filterData['audience']['details']['targetAudience']['name']);
    } else {
      this.exploreDataService.setSelectedTargetName(this.defaultAudience['description']);
    }
    this.filterService.setFilterPill('audience', audience);
    let deliveryWeeks = 1;
    if (filterData['period_days']) {
      deliveryWeeks = filterData['period_days'] / 7;
    }
    this.filterService.setFilterPill('deliveryWeeks', 'Delivery Weeks: ' + deliveryWeeks);

    // If market is applied
    if (filterData['market'] && filterData['market'] && filterData['market']['selectedMarkets'] &&
    filterData['market']['selectedMarkets'].length > 0) {
      let marketName = '';
      if (
        filterData['market'] && filterData['market']
        && filterData['market']['selectedMarkets']
        && filterData['market']['selected'] !== 'us'
      ) {
        if (filterData['market']['selected'] === 'all' || filterData['market']['selected'] === 'individual_all') {
          if (filterData['market']['selectedMarkets'].length > 5) {
            marketName = `Multiple (${filterData['market']['selectedMarkets'].length})`;
          } else {
            marketName = filterData['market']['selectedMarkets'].map(market => market.name);
          }
        } else {
          const selectedMarket = filterData['market']['selectedMarkets'].find(
            market => market.id === filterData['market']['selected']
          );
          marketName = selectedMarket && selectedMarket['name'] || '';
        }
        this.filterService
        .setFilterPill('market', 'Market: ' + marketName);
      }
      if (filterData['market']['type'] === 'GEO_SET' && filterData['market']['selectedGeographySet']) {
        this.filterService
          .setFilterPill('filters', `Geography Set: ${filterData['market']['selectedGeographySet']['name']}`, 'geographySet');
      }
    }
    // If media types are applied
    if (filterData['mediaTypeList'] && filterData['mediaTypeList']['pills']) {
      if (typeof filterData['mediaTypeList']['pills'] === 'object') {
        Object.keys(filterData['mediaTypeList']['pills']).forEach(key => {
          if (filterData['mediaTypeList']['pills'][key].length > 0) {
            let pillText = '';
            switch (key) {
              case 'mediaTypes':
                pillText = `Media Types: `;
                break;
              case 'medias':
                pillText = `Operator Media Name: `;
                break;
              case 'classification':
                pillText = `Media Class: `;
                break;
              case 'construction':
                pillText = `Structure Types: `;
                break;
              case 'material':
                pillText = `Material: `;
                break;
              case 'place_type_name_list':
                pillText = `Place Type: `;
                break;
              case 'placement_type_name_list':
                pillText = `Placement Type: `;
                break;
              case 'place_id_list':
                pillText = `Places: `;
                break;
              default:
                break;
            }
            pillText += filterData['mediaTypeList']['pills'][key].join(', ');
            this.filterService.setFilterPill('filters', pillText, key);
          }
        });
      }
    }
    if (filterData['mediaAttributes']) {
      // TODO : Need to change filter pill code here
      const mediaAttributes = filterData['mediaAttributes'];
      if (mediaAttributes['orientationList']) {
        const orientation = new Orientation();
        const pill = `Orientation: ${orientation.degreeToDirection(mediaAttributes['orientationList'])}`;
        this.filterService.setFilterPill('filters', pill, 'orientationList');
      } else {
        const OrientationAll = localStorage.getItem('orientation');
        if (OrientationAll && OrientationAll === 'All') {
          const pill = 'Orientation: All';
        this.filterService.setFilterPill('filters', pill, 'orientationList');
        }
      }
      /**
       *Hidden because illumination filters are unavailable as of now, remove after 20th-May-2019 if unused

      if (mediaAttributes['illuminationHrsRange']) {
        let illumination = 'Illumination (Hours): ';
        if (mediaAttributes['illuminationHrsRange'][1]) {
          illumination += mediaAttributes['illuminationHrsRange'][0] + ' to ' + mediaAttributes['illuminationHrsRange'][1] + ' hours';
        } else {
          illumination += mediaAttributes['illuminationHrsRange'][0] + '+ hours';
        }
        this.filterService.setFilterPill('filters', illumination, 'illuminationHrsRange');
      }*/

      if (mediaAttributes['panelSizeWidthRange']) {
        let panelSizeWidthRange = 'Panel Width: ';
        if (mediaAttributes['panelSizeWidthRange'][1]) {
          panelSizeWidthRange += mediaAttributes['panelSizeWidthRange'][0] + ' to ' + mediaAttributes['panelSizeWidthRange'][1] + ' feet';
        } else {
          panelSizeWidthRange += mediaAttributes['panelSizeWidthRange'][0] + '+ feet';
        }
        this.filterService.setFilterPill('filters', panelSizeWidthRange, 'panelSizeWidthRange');
      }
      if (mediaAttributes['panelSizeHeightRange']) {
        let panelSizeHeigh = 'Panel Height: ';
        if (mediaAttributes['panelSizeHeightRange'][1]) {
          panelSizeHeigh += mediaAttributes['panelSizeHeightRange'][0] + ' to ' + mediaAttributes['panelSizeHeightRange'][1] + ' feet';
        } else {
          panelSizeHeigh += mediaAttributes['panelSizeHeightRange'][0] + '+ feet';
        }
        this.filterService.setFilterPill('filters', panelSizeHeigh, 'panelSizeHeightRange');
      }
      if (mediaAttributes['spotLength']) {
        let panelSizeHeigh = 'Spot Length: ';
        if (mediaAttributes['spotLength']['max']) {
          panelSizeHeigh += mediaAttributes['spotLength']['min'] + ' to ' + mediaAttributes['spotLength']['max'] + ' seconds';
        } else {
          panelSizeHeigh += mediaAttributes['spotLength']['min'] + '+ feet';
        }
        this.filterService.setFilterPill('filters', panelSizeHeigh, 'panelSizeHeightRange');
      }
      if (mediaAttributes['movementList'] === true) {
        const rotatePill = `Rotating: Yes`;
        this.filterService.setFilterPill('filters', rotatePill, 'rotating');

      } else if (mediaAttributes['movementList'] === false) {
        const rotatePill = `Rotating: No`;
        this.filterService.setFilterPill('filters', rotatePill, 'rotating');

      } else if (mediaAttributes['movementList'] === 'all') {
        const rotatePill = `Rotating: All`;
        this.filterService.setFilterPill('filters', rotatePill, 'rotating');
      }
      if (
        mediaAttributes['spotAudio'] !== undefined &&
        mediaAttributes['spotAudio'] !== null &&
        mediaAttributes['spotAudio'] !== ''
      ) {
        let audioPill = '';
        if (mediaAttributes['spotAudio'] === 'all') {
          audioPill = 'Audio Enabled: All';
        } else {
          audioPill = `Audio Enabled: ${
            mediaAttributes['spotAudio'] ? 'Yes' : 'No'
          }`;
        }
        this.filterService.setFilterPill('filters', audioPill, 'spotAudio');
      }
      if (
        mediaAttributes['spotFullMotion'] !== undefined &&
        mediaAttributes['spotFullMotion'] !== null &&
        mediaAttributes['spotFullMotion'] !== ''
      ) {
        let fullMotionPill = '';
        if (mediaAttributes['spotFullMotion'] === 'all') {
          fullMotionPill = 'Full Video/Full Motion: All';
        } else {
          fullMotionPill = `Full Video/Full Motion: ${
            mediaAttributes['spotFullMotion'] ? 'Yes' : 'No'
          }`;
        }
        this.filterService.setFilterPill(
          'filters',
          fullMotionPill,
          'spotFullMotion'
        );
      }

      if (
        mediaAttributes['spotPartialMotion'] !== undefined &&
        mediaAttributes['spotPartialMotion'] !== null &&
        mediaAttributes['spotPartialMotion'] !== ''
      ) {
        let partialMotionPill = '';
        if (mediaAttributes['spotPartialMotion'] === 'all') {
          partialMotionPill = 'Partial Motion: All';
        } else {
          partialMotionPill = `Partial Motion: ${
            mediaAttributes['spotPartialMotion'] ? 'Yes' : 'No'
          }`;
        }
        this.filterService.setFilterPill(
          'filters',
          partialMotionPill,
          'spotPartialMotion'
        );
      }

      if (
        mediaAttributes['spotInteractive'] !== undefined &&
        mediaAttributes['spotInteractive'] !== null &&
        mediaAttributes['spotInteractive'] !== ''
      ) {
        let interactivePill = '';
        if (mediaAttributes['spotInteractive'] === 'all') {
          interactivePill = 'Interactive: All';
        } else {
          interactivePill = `Interactive: ${
            mediaAttributes['spotInteractive'] ? 'Yes' : 'No'
          }`;
        }
        this.filterService.setFilterPill(
          'filters',
          interactivePill,
          'spotInteractive'
        );
      }

      if (mediaAttributes['illuminationHrsRange']) {
        const startTime = this.filterService.timeConvert(mediaAttributes['illuminationHrsRange'][0] !== '23:59:59' ? mediaAttributes['illuminationHrsRange'][0] : '24:00:00');
        const endTime = this.filterService.timeConvert(mediaAttributes['illuminationHrsRange'][1] !== '23:59:59' ? mediaAttributes['illuminationHrsRange'][1] : '24:00:00');
        const illuminationHoursPill = `Illuminated Hours: ${startTime} - ${endTime}` ;
        this.filterService.setFilterPill('filters', illuminationHoursPill, 'illuminationHrsRange');
      }
      if (mediaAttributes['auditStatusList'] && mediaAttributes['auditStatusList'].length) {
        const statusName = mediaAttributes['auditStatusList'].map(status => status.name);
        this.filterService.setFilterPill('filters', `Audit Status: ${statusName}`, 'auditStatusList' );
      }
    }
    // If operators applied
    if (filterData['operatorList']) {
      const operatorPill = 'Operators: ' + filterData['operatorList'].join(', ');
      this.filterService.setFilterPill('filters', operatorPill, 'operatorList');
    }

    if (filterData['location']) {
      const location = filterData['location'];
      if (location['placePackState'] &&
        location['placePackState']['selectedPlaces'] &&
        location['placePackState']['selectedPlaces'].length > 0) {
        const placeSetPill = 'Place Sets: ' + location['placePackState']['selectedPlaces']
          .map(p => p.name)
          .join(', ');
        this.filterService
          .setFilterPill('filters', placeSetPill, 'placeSets');
      }
      if (location['placePackState'] &&
        location['placePackState']['radiusValue']) {
        const pillData = 'Place Sets Radius: ' + location['placePackState']['radiusValue'];
        this.filterService
          .setFilterPill('filters', pillData, 'placeRadius');
      }
      if (location['geoFilter'] &&
        location['geoFilter']['properties']) {
        const pillData = 'Geography: ' + location['geoFilter']['properties']['name'];
        this.filterService
          .setFilterPill('filters', pillData, 'PlaceGeography');
      }
    }
    if (filterData['scenario']) {
      this.filterService
        .setFilterPill('filters', filterData['scenario']['displayName'], 'scenario');
    }
    if (filterData['inventorySet'] &&
      filterData['inventorySet']['inventoryIds'] &&
      filterData['inventorySet']['inventoryIds'].length > 0) {
      this.prepareInventoryPill(filterData['inventorySet']['inventoryIds']);
    }
  }
  private prepareInventoryPill(inventorySetIds) {
    this.workSpace
      .getExplorePackages()
      .pipe(debounceTime(200))
      .subscribe(response => {
        if (typeof response['packages'] !== 'undefined' && response['packages'].length > 0) {
          const packages = response['packages'];
          const pillData = 'Inventory Sets: ' + packages
            .filter(pack => inventorySetIds.indexOf(pack['_id']) !== -1)
            .map(pack => pack.name)
            .join(', ');
          this.filterService.setFilterPill('filters', pillData, 'InventorySet');
        }
      });
  }
  private getInventories(filters, paging = false) {
    const cloneFilters = Helper.deepClone(filters);
    if (this.inventoriesApiCall != null) {
      this.inventoriesApiCall.unsubscribe();
    }
    if (filters['location']) {
      delete filters['location'];
    }
    if (this.filtersAttributes.some(key => filters[key])
      || (filters['measures_range_list']
        && filters['measures_range_list'].length > 1)) {
      const filterData = Helper.deepClone(filters);
      filterData['page_size'] = 100;
      delete filterData['gp_ids'];
      delete filterData['custom_ids'];

      this.inventoriesApiCall = this.inventoryService.getInventoriesWithAllData(filterData)
        .pipe(
          // tap -> To handle invalid IDs for invalid ID filter on non-paginating calls
          tap(result => {
            if (!paging) {
              // TODO : Need to simplify this long list of conditions, seem can be done shorter and more readable
              let filtered_invalid_ids = {};
              let invalid_Ids = {};
              if ( result['inventory_summary']['filtered_invalid_ids']) {
                filtered_invalid_ids = result['inventory_summary']['filtered_invalid_ids'];
              }
              if ( result['inventory_summary']['invalid_ids']) {
                invalid_Ids = result['inventory_summary']['invalid_ids'];
              }
              const invalidIds = {
                geoPanelIds: [],
                plantIds: [],
                invalidSpotIds: [],
                invalidOperatorSpotIds : []
              };

              if (filtered_invalid_ids && filtered_invalid_ids['id_type'] === 'spot_id') {
                invalidIds.geoPanelIds = filtered_invalid_ids['id_list'];
              }

              if (invalid_Ids && invalid_Ids['id_type'] === 'spot_id') {
                invalidIds.invalidSpotIds = invalid_Ids['id_list'];
              }

              if (filtered_invalid_ids && filtered_invalid_ids['id_type'] === 'operator_frame_id') {
                invalidIds.plantIds = filtered_invalid_ids['id_list'];
              }

              if (invalid_Ids && invalid_Ids['id_type'] === 'operator_frame_id') {
                invalidIds.invalidOperatorSpotIds = invalid_Ids['id_list'];
              }
              this.exploreDataService.setInvalidIds(invalidIds);
            }
          }),
          // to set inventory total count and fake selected count based on select Query
          // tap(result => {
          //   this.inventoryCount = result['inventory_summary']['pagination']['number_of_spots'];
          //   if (this.selectQuery === 'All') {
          //     this.selectedInventoryCount = result['inventory_summary']['pagination']['number_of_spots'];
          //   }
          // }),
          map(inventories => {
            let spots =  this.exploreService.convertFramesToSpots(inventories['inventory_summary']['inventory_items']);
            // Setting selection based on the current select query
            if (spots.length > 0) {
              if (!paging) {
                if (this.selectQuery === 'All') {
                  spots = spots.map(spot => {
                    spot.selected = true;
                    return spot;
                  });
                } else if (this.selectQuery === 'Custom') {
                  const session = this.filterService.getExploreSession();
                  if (session['data']['unSelectedSpotIds'] && session['data']['unSelectedSpotIds'].length > 0) {
                    spots = spots.map(spot => {
                      spot.selected = !session['data']['unSelectedSpotIds'].includes(spot.spot_id);
                      return spot;
                    });
                  } else if (session['data']['selectedSpotIds'] && session['data']['selectedSpotIds'].length > 0) {
                    spots = spots.map(spot => {
                      spot.selected = session['data']['selectedSpotIds'].includes(spot.spot_id);
                      return spot;
                    });
                  }
                } else if (this.selectQuery === 'Top 25') {
                  for (let i = 0; i < 25; i++) {
                    spots[i].selected = true;
                  }
                } else if (this.selectQuery === 'Top 50') {
                  for (let i = 0; i < 50; i++) {
                    spots[i].selected = true;
                  }
                } else if (this.selectQuery === 'Top 100') {
                  for (let i = 0; i < 100; i++) {
                    spots[i].selected = true;
                  }
                }
              } else {
                if (this.selectQuery === 'All') {
                  spots = spots.map(spot => {
                    spot.selected = true;
                    return spot;
                  });
                } else if (this.selectQuery === 'Custom') {
                  const session = this.filterService.getExploreSession();
                  if (session['data']['unSelectedSpotIds'] && session['data']['unSelectedSpotIds'].length > 0) {
                    spots = spots.map(spot => {
                      spot.selected = !session['data']['unSelectedSpotIds'].includes(spot.spot_id);
                      return spot;
                    });
                  } else if (session['data']['selectedSpotIds'] && session['data']['selectedSpotIds'].length > 0) {
                    spots = spots.map(spot => {
                      spot.selected = session['data']['selectedSpotIds'].includes(spot.spot_id);
                      return spot;
                    });
                  }
                }
              }
            }
            return spots;
        }))
        .subscribe(inventoryItems => {
          if (!paging) {
            if (inventoryItems.length > 0) {
              if (this.sessionFilter) {
                this.sessionFilter = false;
                this.places = inventoryItems;
                this.modifySearchResultMapFormat();
              } else {
                this.exploreDataService.setPlaces(inventoryItems);
              }
            }
            if (this.customInventories === 'active'
              && this.totalGPInventory < 100
              && this.totalInventory > this.totalGPInventory) {
              this.getInventoriesFromES(filters, true);
            }
          } else {
            if (typeof inventoryItems !== 'undefined') {
              this.places = [...this.places, ...inventoryItems];
            }
            this.loaderService.display(false);
          }
          this.filterApiCallLoaded = false;
          /** change filtres & initial loading */
          this.metricsCalc();
        }, error => {
          this.exploreDataService.setPlaces([]);
          this.filterApiCallLoaded = false;
        });
    } else {
      this.exploreDataService.setPlaces([]);
      this.filterApiCallLoaded = false;
    }
  }
  onCloseFilterTab() {
    const sidenavOptions = { open: false, tab: '' };
    this.filterService.setFilterSidenav(sidenavOptions);
  }

  onOpenFilterTab() {
    const sidenavOptions = { open: true, tab: this.tempTab };
    this.filterService.setFilterSidenav(sidenavOptions);
  }

  // getOperatorName(representations: Representation[]): string {
  //   let opp = '';
  //   if (representations) {
  //     const representation = representations.filter(rep => rep['representation_type']['name'] === 'Own')[0];
  //     if (representation) {
  //       opp = representation['account']['parent_account_name'];
  //       // opp = representation['division']['plant']['name'];
  //     }
  //   }
  //   return opp;
  // }
  modifySearchResultMapFormat() {
    if (!this.isStatus) {
      return false;
    }
    let places = Helper.deepClone(this.places);
    const layersSession = this.layersService.getlayersSession();

    let layerData;
    let numberCircleColor;
    if (layersSession && layersSession['selectedLayers']) {
      const searchResult = layersSession['selectedLayers'].find((layer) => layer.data && layer.data['_id'] && layer.data['_id'] === 'default' || undefined);
      if (searchResult && searchResult['icon'] !== 'icon-numbered') {
        layerData = searchResult;
        this.defaultIcon = { name: searchResult['icon'], color: searchResult['color'] };
      }

      if (searchResult && searchResult['icon'] === 'icon-numbered') {
        numberCircleColor = searchResult['color'];
        this.defaultIcon = { name: searchResult['icon'], color: searchResult['color'] };
      }

    }
    if (this.map && this.defaultIcon) {
      this.removeSearchResultLayers();

      if (places.length > 0) {

        // if (!layerData) {
        const limit = this.selectQueryLimited < 0 ? 100 : this.selectQueryLimited;
        places = places.slice(0, limit);
        // }
        const pids = places.map(p => p.selected ? p.frame_id : '');
        const data = places.map((inventory, index) => {
          if (!inventory.selected) {
            return {};
          }
          return {
            type: 'Feature',
            geometry: inventory['location']['geometry'],
            properties: {
              fid: inventory.frame_id || '',
              opp: this.getOperatorName(inventory.representations),
              pid: inventory.plant_frame_id || '',
              index: (index + 1),
              radius: 10
            }
          };
        });
        const numberLabelData = {
          type: 'FeatureCollection',
          features: data
        };
        this.map.addSource('numberLabelSource', {
          type: 'geojson',
          data: numberLabelData
        });

        let seletedPanels = [];
        this.selectedFidsArray.map(place => {
          if (place.selected && place.fid !== undefined && place.fid !== undefined && place.fid !== 'undefined') {
            seletedPanels.push(place.fid);
          }
        });

        if (seletedPanels.length <= 0) {
          seletedPanels = [0];
        }
        seletedPanels.unshift('in', MapLayersInvetoryFields.FRAME_ID);
        if (!layerData) {
          /*national layer*/
          this.map.addLayer({
            id: 'numberedLabelCircle',
            type: 'circle',
            source: 'numberLabelSource',
            minzoom: 7,
            layer: {
              'visibility': 'visible',
            },
            paint: {
              'circle-opacity': 1,
              'circle-color': numberCircleColor ? numberCircleColor : '#008da4',
              'circle-radius': ['get', 'radius']
            }
          });

          // Click to zoom in to the panel detail level
          // this.map.on('click', 'frameClusters', this.framClusterZoomIn);
          // add the cluster count label
          // this.layerInventorySetLayers.push('numberedLabelValue');
          this.map.addLayer({
            id: 'numberedLabelValue',
            type: 'symbol',
            source: 'numberLabelSource',
            minzoom: 7,
            layout: {
              'visibility': 'visible',
              'text-field': '{index}',
              'text-font': ['Product Sans Regular', 'Open Sans Regular', 'Arial Unicode MS Regular'],
              'text-size': 13
            },
            paint: {
              'text-color': '#fefefe'
            }
          });
        }

        if (layerData
          && layerData['icon']
          && layerData['icon'] !== 'icon-wink-pb-dig') {
          const mapLayerId = 'layerInventoryLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
          this.layerInventorySetLayers.push(mapLayerId);
          this.searchlayer.push(mapLayerId);
          this.map.addLayer({
            id: mapLayerId,
            type: 'symbol',
            source: 'numberLabelSource',
            // 'source-layer': this.mapLayers['allPanels']['source-layer'],
            minzoom: 7,
            // maxzoom: (layerData['icon'] && layerData['icon'] === 'icon-wink-pb-dig' ? 7 : 17),
            // filter: ['all', seletedPanels],
            layout: {
              'text-line-height': 1,
              'text-padding': 0,
              'text-anchor': 'bottom',
              'text-allow-overlap': true,
              'text-field': layerData['icon']
                && layerData['icon'] !== 'icon-wink-pb-dig'
                && this.markerIcon[layerData['icon']]
                || this.markerIcon['icon-circle'],
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
        }
        this.map.setLayoutProperty('frames_panel', 'visibility', 'visible');
        this.map.setLayoutProperty('color_frames_panel', 'visibility', 'visible');

        if (this.map.getLayer('color_frames_panel') || this.map.getLayer('frames_panel')) {
          const filters = [];
          filters.unshift('all');

          if (layerData
            && layerData['icon'] === 'icon-wink-pb-dig') {
            filters.push(seletedPanels.concat(pids));
          } else {
            filters.push(seletedPanels);
            pids.unshift('!in', MapLayersInvetoryFields.FRAME_ID);
            filters.push(pids);
          }

          // this.map.setFilter('color_frames_panel', filters);
          /* for seeing the color frame panel at 7 th zoom*/
          if (this.selectedFidsArray && this.selectedFidsArray.length <= 50000) {
            this.map.setFilter('color_frames_panel', filters);
            this.map.setFilter('frames_panel', filters);
          }
        }
      }
    }
  }

  removeSearchResultLayers(flag = false) {
    /** Remove becuase this condition not need and it is affecting zooming layer. */
    /* if (flag) {
      if (this.map.getLayer('frames_panel')) {
        this.map.setLayoutProperty('frames_panel', 'visibility', 'none');
      }
      // if (this.map.getLayer('color_frames_panel')) {
      //   this.map.setLayoutProperty('color_frames_panel', 'visibility', 'none');
      // }
    } */
    if (this.map.getLayer('numberedLabelCircle')) {
      this.map.removeLayer('numberedLabelCircle');
    }
    if (this.map.getLayer('numberedLabelValue')) {
      this.map.removeLayer('numberedLabelValue');
    }
    this.searchlayer.forEach((layer) => {
      if (this.map.getLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });
    if (this.map.getSource('numberLabelSource')) {
      this.map.removeSource('numberLabelSource');
    }
  }
  openSaveScenario(project = null) {
    if (this.selectedInventoryCount <= 0) {
      this.showMessageDialog('Please select at least one inventory');
      return;
    } else if (this.selectedInventoryCount > INVENTORY_SAVING_LIMIT) {
      this.showMessageDialog(`Saving to a scenario is currently limited to ${this.convertPipe.transform(INVENTORY_SAVING_LIMIT, 'ABBREVIATE')} inventories`);
      return;
    }
    const dialogConfig = {
      width: '480px',
      height: '274px',
      closeOnNavigation: true,
      panelClass: 'imx-mat-dialog'
    };
    let selectedIds = [];
    if (this.selectQuery === 'All') {
      selectedIds = this.selectedFidsArray.map(item => {
        item.selected = true;
        return item;
      });
    } else if (this.selectQuery === 'Custom' && this.selectedInventoryCount > this.places.length) {
      const unselectedIds = this.places
        .filter(place => !place.selected)
        .map(place => place.spot_id);
      selectedIds = this.selectedFidsArray
        .filter(item => !unselectedIds.includes(item.fid))
        .map(item => {
          item.selected = true;
          return item;
        });
    } else {
      const selectedSpots = this.places
        .filter(place => place.selected)
        .map(place => place.spot_id);
      selectedIds = this.selectedFidsArray
        .filter(item => selectedSpots.includes(item.fid))
        .map(item => {
          item.selected = true;
          return item;
        });
    }
    dialogConfig['data'] = {
      'inventories' : selectedIds,
      'project' : project,
    };
    this.dialog.open(ExploreSaveScenarioV3Component, dialogConfig)
      .afterClosed()
      .subscribe((res) => {
        if (res?.type === 'createNewProject') { 
          this.openCreatNewProject();
        } else if (res?.status === 'success') {
          this.workSpaceDataService.pushNewScenario(res);
          this.snackBar.open(
            `${this.workFlowLabels.scenario[0]} '${res['scenario']['name']}' saved successfully.`,
            'DISMISS',
            {
              duration: 2000
            }
          );
        }
      });
  }
  public openCreatNewProject() {
    this.dialog
      .open(ExploreProjectAddV3Component, {
        panelClass: 'imx-mat-dialog',
        width: '500px',
        data: {
          project: null
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe((data) => {
        if (!data) {
          this.openSaveScenario(); 
        } else {
          const project = { _id: data['response']['data']['id'], name: data['name']};
          this.openSaveScenario(project);
        }
      });
  }

  private getSpotIds(allowedLimit: number) {
    let spotIds$: Observable<any>;
    if (this.selectedInventoryCount <= this.places.length) {
      // If local IDs are available for the selected inventory
      spotIds$ = of(this.getLocalSpotIdsFormatted()).pipe(map(result => {
          // Limiting to 15K if local inventories are more than 15K.
          if (result.length <= allowedLimit) {
            return result;
          }
          return result.slice(0, allowedLimit);
        }),
        first());
    } else {
      // getting IDs from API if selection is more than what's currently available in local passs total ids because this fuction remove from unselected Ids also.
      allowedLimit = this.selectedFidsArray.length && this.selectedFidsArray.length || allowedLimit;
      spotIds$ = this.getAPISpotIdsFormatted(allowedLimit)
        .pipe(catchError(() => of([])));
    }
    return spotIds$;
  }

  openSecondaryMap(value) {
    if (value['flag']) {
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
      this.exploreDataService.setMapViewPositionState('inventoryView');
    }
  }
  expandTable() {
    this.exploreDataService.setMapViewPositionState('tabularView');
  }
  public ShowPopulationIntelMenu() {
    this.showPopIntelMenu = true;
    this.exploreDataService.setPopulationOponState$(this.showPopIntelMenu);
  }
  public hidePopulationIntelMenu() {
    this.showPopIntelMenu = false;
    this.exploreDataService.setPopulationOponState$(this.showPopIntelMenu);
  }
}
