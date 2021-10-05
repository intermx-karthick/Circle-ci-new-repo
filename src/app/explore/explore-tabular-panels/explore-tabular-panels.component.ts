import {Component, EventEmitter, Input, OnInit, Output, OnDestroy, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { WorkflowLables } from '@interTypes/workspaceV2';
import {
  ExploreDataService,
  LoaderService,
  CommonService,
  FormatService,
  AuthenticationService,
  InventoryService,
  ThemeService,
} from '@shared/services';
import { takeWhile, map, switchMap } from 'rxjs/operators';
import { ResizeEvent } from 'angular-resizable-element';
import { MatDialog } from '@angular/material/dialog';
import {CustomizeColumnComponent} from '@shared/components/customize-column/customize-column.component';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {FiltersService} from '../filters/filters.service';
import { Representation } from '@interTypes/inventorySearch';
import { CsvMarketFormat } from '@interTypes/inventory';
import {Helper} from '../../classes';
@Component({
  selector: 'explore-tabular-panels',
  templateUrl: './explore-tabular-panels.component.html',
  styleUrls: ['./explore-tabular-panels.component.less']
})
export class ExploreTabularPanelsComponent implements OnInit, OnDestroy, OnChanges {
  isTabularViewEnabled: any;
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatSort) sort: MatSort;
  constructor(private exploreDataService: ExploreDataService,
              private commonService: CommonService,
              public formatService: FormatService,
              public loaderService: LoaderService,
              public dialog: MatDialog,
              private filtersService: FiltersService,
              private auth: AuthenticationService,
              private inventoryService: InventoryService,
              private theme: ThemeService) {
    this.workFlowLabels = this.commonService.getWorkFlowLabels();
    this.dataSource.sort = this.sort;
  }
  public workFlowLabels: WorkflowLables;
  public tabularView = 0;
  // public tableHeight = null;
  private unSubscribe = true;
  public mapViewPostionState = 'inventoryView';
  public places;
  public selectOptions;
  public sortables = [
    {name: 'PLANT OPERATOR', displayname: 'Plant Operator', value: 'plant_operator'},
    {name: 'GEOPATH FRAME ID', displayname: 'Geopath Frame ID', value: 'frame_id'},
    {name: 'Media Status', displayname: 'Status', value: 'media_status_name'},
    {name: 'Media Description', displayname: 'Status Description', value: 'media_status_description'},
    {name: 'GEOPATH SPOT ID', displayname: 'Geopath Spot ID', value: 'spot_id'},
    {name: 'PLANT UNIT ID', displayname: 'Operator Spot ID', value: 'plant_frame_id'},
    {name: 'MEDIA TYPE', displayname: 'Media Type', value: 'media_type'},
    {name: 'scheduled_weeks', displayname: 'Scheduled # of Weeks', value: 'scheduled_weeks'},
    {name: 'Total Imp', displayname: 'Total Impressions', value: 'imp'},
    {name: 'Target Imp', displayname: 'Target Impressions', value: 'imp_target'},
    {name: 'In-Mkt Target Imp', displayname: 'Target In Market Impressions', value: 'imp_target_inmkt'},
    {name: 'In-Mkt Target Comp Index', displayname: 'Target Audience Index', value: 'index_comp_target'},
    {name: 'Reach', displayname: 'Target In-Market Reach', value: 'reach_pct'},
    {name: 'Place Type', displayname: 'Place Type', value: 'place_type'},
    {name: 'Place Name', displayname: 'Place Name', value: 'place_name'},
    {name: 'Placement Type', displayname: 'Placement Type', value: 'placement_type'}
  ];
  public currentSortables = [];
  private displaySortables = [];
  public sortQuery = 'index_comp_target';
  public sortColumnQuery = 'index_comp_target';
  public activeSort = {};
  public conditionalFormatting = 1;
  public selectAllInventoriesCheckbox = false;
  public cntrlKey = false;
  public selectQuery = 'Select';
  public selectQueryLimited = -1;
  public selectedCount = 0;
  public userData = {};
  public selectedColumns = [];
  public headerValueTotAudienceIm = 0;
  public headerValueTgtAudienceIm = 0;
  public headerValueTgtAudienceImComp = 0;
  // public headerValueTotAudienceImPercent = 0;
  public headerValueImTgtImp = 0;
  public selectMarket;
  public selectMarketName = '';
  public selectTarget = 'Total Pop 0+ yrs';
  public discoveringPanel = true;
  public isDropped = false;
  public clearColumn = false;
  @Output() placeClick = new EventEmitter();
  @Output() select = new EventEmitter();
  @Output() placeSelect = new EventEmitter();
  @Input() public formattedPlaces = [];
  @Input() defaultSelectQuery: any;
  @Input() sortOrder = 'desc';
  @Input() defaultSortQuery: any;
  @Input() selectedPackage: any;
  @Input() packages: any;
  @Input() updateTabularView: any;
  @Input() totalInventoryCount: number;
  @Input() selectedInventoryCount: number;
  @Input() disableInventoryList: boolean;
  @Output() tablurMapHeight = new EventEmitter();
  @Output() pdfExport: EventEmitter<void> = new EventEmitter<void>();
  @Output() csvExport: EventEmitter<any[]> = new EventEmitter<any[]>();
  @Output() saveScenario: EventEmitter<void> = new EventEmitter<void>();
  @Output() saveInventorySet: EventEmitter<string> = new EventEmitter<string>();
  @Output() paginateCall: EventEmitter<void> = new EventEmitter<void>();

  @Output() sortData: EventEmitter<any> = new EventEmitter();
  tableHeight: any;
  tableHeightEnd: any;
  mapHeight: any;
  style: any;
  isResizingElement = false;
  @Input() csvExportLoder = false;
  public keyCodes = {
    CONTROL: 17,
    COMMAND: 91
  };
  @ViewChild('dragFocus') dragFocusElement: ElementRef;
  mobileView: boolean;
  @ViewChild('tabularHeight') elementView: ElementRef;
  private mod_permission: any;
  public allowInventory = '';
  public audienceLicense = {};
  public isLoader: Boolean = true;
  public isTableLoading: Boolean = false;
  themeSettings: any;
  public selectTargetId;
  public selectedMarkets;
  public measuresLicense: any;
  csvExportLicense: string;
  pdfExportLicense: string;
  inventorySetLicense: string;
  isScenarioLicense: string;
  publicSiteColumn: any  = [];
  public selectedMarketsFormat: CsvMarketFormat;
  public selectedPeriodDays: number;
  private inventoriesApiCall: any = null;
  ngOnInit() {
    this.themeSettings = this.theme.getThemeSettings();
    const sessionFilter = this.filtersService.getExploreSession();
    this.setPeriodDaysFromFilter();
    if (sessionFilter && sessionFilter['data'] &&
     sessionFilter['data']['mapViewPostionState'] &&
      sessionFilter['data']['mapViewPostionState'] === 'tabularView'
       && sessionFilter['data']['customColumns'] && sessionFilter['data']['customColumns'].length > 0) {
      this.currentSortables = sessionFilter['data']['customColumns'];
      this.setLocalStorage(this.currentSortables);
      this.filtersService.updateFiltersData({customColumns: this.currentSortables});
    }
    this.commonService.getCustomizeColumns('explore', 'tableViewCustomColumn').subscribe(response => {
      if (response && response['data'] && response['data']['content'] && response['data']['content']['order']) {
        this.currentSortables = response['data']['content']['order'];
        this.setLocalStorage(response['data']['content']['order']);
        this.filtersService.updateFiltersData({customColumns: response['data']['content']['order']});
        this.updatedSavedOrderColumns(this.currentSortables);
      }
    });
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    this.measuresLicense = this.mod_permission['features']['gpMeasures']['status'];
    this.csvExportLicense = this.mod_permission['features']['csvExport']['status'];
    this.pdfExportLicense = this.mod_permission['features']['pdfExport']['status'];
    this.inventorySetLicense = this.mod_permission['features']['inventorySet']['status'];
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    const projectMod = this.auth.getModuleAccess('v3workspace');
    this.isTabularViewEnabled = this.mod_permission['features']['inventoryTabularView'];
    if (this.isTabularViewEnabled && this.isTabularViewEnabled.status === 'hidden') {
      this.hideTable();
    }
    if (this.measuresLicense !== 'active') {
      this.publicSiteColumn = [
        {
          'name': 'PLANT OPERATOR', 'displayname': 'Plant Operator', 'value': 'plant_operator'
        },
        {
          'name': 'GEOPATH FRAME ID', 'displayname': 'Geopath Frame ID', 'value': 'frame_id'
        },
        {
          'name': 'GEOPATH SPOT ID', 'displayname': 'Geopath Spot ID', 'value': 'spot_id'
        },
        {
          'name': 'PLANT UNIT ID', 'displayname': 'Operator Spot ID', 'value': 'plant_frame_id'
        },
        {
          'name': 'MEDIA TYPE', 'displayname': 'Media Type', 'value': 'media_type'
        },
        {
          'name': 'media_name', 'displayname': 'Media Name', 'value': 'media_name'
        },
        {
          'name': 'classification_type', 'displayname': 'Classification', 'value': 'classification_type'
        },
        {
          'name': 'construction_type', 'displayname': 'Construction', 'value': 'construction_type'
        },
        {
          'name': 'digital', 'displayname': 'Material', 'value': 'digital'
        },
        {
          'name': 'height', 'displayname': 'Height (ft & in)', 'value': 'max_height'
        },
        {
          'name': 'width', 'displayname': 'Width (ft & in)', 'value': 'max_width'
        },
        {
          'name': 'zip_code', 'displayname': 'ZIP Code', 'value': 'zip_code'
        },
        {
          'name': 'longitude', 'displayname': 'Longitude', 'value': 'longitude'
        },
        {
          'name': 'latitude', 'displayname': 'Latitude', 'value': 'latitude'
        },
        {
          'name': 'illumination_type', 'displayname': 'Illumination Type', 'value': 'illumination_type'
        },
        {
          'name': 'orientation', 'displayname': 'Orientation', 'value': 'orientation'
        },
        {
          'name': 'primary_artery', 'displayname': 'Primary Artery', 'value': 'primary_artery'
        }
      ];
      this.displaySortables = this.publicSiteColumn;
      this.sortables =  this.publicSiteColumn;
    }
    this.isScenarioLicense = projectMod['status'];
    this.exploreDataService
      .onMapLoad()
      .pipe(map(isLoaded => isLoaded),
      switchMap(isLoaded => {
        if (isLoaded) {
          return this.exploreDataService.getMapViewPositionState();
        }
      }),
      takeWhile(() => this.unSubscribe))
      .subscribe(state => {
        this.mapViewPostionState = state;
        this.filtersService.updateFiltersData({mapViewPostionState: state});
        if (state === 'tabularView') {
          this.tabularView = 1;
          const sessionFilterData = this.filtersService.getExploreSession();
          if (sessionFilterData && sessionFilterData['data'] && sessionFilterData['data']['mapViewPostionState'] &&
           sessionFilterData['data']['mapViewPostionState'] === 'tabularView' ) {
              // The below variable is used to restrict two times calling of loadTabularData method while loading
              // One time in init and another time in ngOnChanges
              if (this.checkAnyFilterApplied()) {
                this.isTableLoading = true;
                this.loadTabularData();
              } else {
                this.loadTabularData();
              }

          }
        } else {
          this.tabularView = 0;
          //this.formattedPlaces = [];
        }
      });
    // TODO: Below code not needed we have to remove it and it's relavant obs
    this.exploreDataService.getSearchStarted().pipe(takeWhile(() => this.unSubscribe))
      .subscribe(value => {
        if (value) {
          if (this.tabularView > 0) {
            this.loadTabularData();
          }
        }
    });
    this.exploreDataService.getSelectedTargetName().pipe(takeWhile(() => this.unSubscribe))
        .subscribe(tgt => {
          this.selectTarget = tgt;
        });
    this.exploreDataService.getSelectedTarget().pipe(takeWhile(() => this.unSubscribe))
    .subscribe(target => {
      this.selectTargetId = target;
    });

    this.exploreDataService
    .getSelectedMarket()
    .pipe((takeWhile(() => this.unSubscribe)))
    .subscribe(data => {
      if (data && data.selectedMarkets && data.selectedMarkets.length > 0) {
        this.selectedMarkets = data;
      } else {
        this.selectedMarkets = [];
      }
      this.selectedMarketsFormat = this.inventoryService.exportParamFormat(this.selectedMarkets);
    });

    this.selectOptions = ['All', 'Top 25', 'Top 50', 'Top 100', 'None', 'Custom'];
    this.userData = JSON.parse(localStorage.getItem('user_data'));

    this.exploreDataService.getTabularViewPlaces().pipe(takeWhile(() => this.unSubscribe))
      .subscribe(places => {
        if (places && places.length > 0) {
          const sessionData = this.filtersService.getExploreSession();
          if (sessionData['data']['mapViewPostionState'] === 'tabularView'
           && sessionData['data']['selectQuery'] === 'Custom' && places && places.length > 0) {
            this.selectQuery = sessionData['data']['selectQuery'];
          }
        }

      this.exploreDataService.saveCustomizedColumns(this.currentSortables);
    });

    this.mobileView = this.commonService.isMobile();
   // this.sort.sort(<MatSortable>({id: 'compi', start: 'asc', disableClear: false}));
   setTimeout(() => {
   }, 500);
   this.loadTabularData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.formattedPlaces) {
      this.dataSource.data = this.formattedPlaces;
      this.isLoader = false;
      if (this.formattedPlaces && this.formattedPlaces.length > 0) {
        this.discoveringPanel = false;
      }
      this.setPeriodDaysFromFilter();
    }
    //  to update tabular view details on operation of each filters if tabular view open
    if (changes.updateTabularView && this.tabularView > 0) {
      if (!this.isTableLoading) {
        if (this.checkAnyFilterApplied()) {
            this.loadTabularData();
        } else {
          this.formattedPlaces = [];
        }
      }
    }
  }

  ngOnDestroy() {
    this.unSubscribe = false;
    this.exploreDataService.setTabularViewPlaces([]);
  }

  /**
   * @param savedOrderColumn saved columns from API
   */
  updatedSavedOrderColumns(savedOrderColumn) {
    const savedOrder = Helper.deepClone(savedOrderColumn);
    if (savedOrder && savedOrder.length) {
      this.updateDisplaySortable(savedOrder);
    }
  }

  loadTabularData() {
    this.setPeriodDaysFromFilter();
    this.dataSource.data = this.formattedPlaces;
    this.displaySortables = this.sortables.map(x => Object.assign({}, x));
    const localCustomColum = JSON.parse(localStorage.getItem('exploreCustomColumn'));
    if (localCustomColum === null || localCustomColum.length === 0) {
      this.currentSortables = this.displaySortables;
      this.displaySortables = [];
    }
    if (this.currentSortables.length === 0 && localCustomColum.length > 0) {
      this.currentSortables = localCustomColum;
    }
    if (this.currentSortables && this.currentSortables.length > 0) {
      this.displaySortables = this.currentSortables;
    }
    if (this.measuresLicense !== 'active') {
      this.currentSortables = this.publicSiteColumn;
    }
    this.setLocalStorage(this.currentSortables);
    this.filtersService.updateFiltersData({customColumns: this.currentSortables});
    this.updateDisplaySortable(this.displaySortables);
    this.isTableLoading = false;
    this.isLoader = false;
  }

 /**
 * 
 * @param columns  currentsortable column to be updated to displaycolumns
 */
  updateDisplaySortable(columns) {
    this.displaySortables = columns.map(c => c['value']);
    if (this.displaySortables.indexOf('checked') === -1) {
      if (this.mapViewPostionState === 'tabularView') {
        this.displaySortables.splice(0, 0, 'checked');
        const obj = {
          'name': 'CHECKBOX',
          'displayname': '',
          'value': 'checked'
        };
        this.currentSortables.splice(0, 0, obj);
      }
    }
    if (this.displaySortables.indexOf('position') === -1) {
      if (this.mapViewPostionState === 'tabularView') {
        this.displaySortables.splice(1, 0, 'position');
        const obj = {
          'name': 'SLNO',
          'displayname': '#',
          'value': 'position'
        };
        this.currentSortables.splice(1, 0, obj);
      }
    }
  }

  private setPeriodDaysFromFilter() {
    const sessionData = this.filtersService.getExploreSession();
    if (sessionData && sessionData['data'] && sessionData['data']['period_days']) {
      this.selectedPeriodDays = sessionData['data']['period_days'];
    } else {
      this.selectedPeriodDays = 7;
    }
  }

  getOperatorName(representations: Representation[]): string {
    let opp = '';
    if (representations) {
      const representation = representations.find(rep => rep['representation_type']['name'] === 'Own');
      if (representation) {
        opp = representation['account']['parent_account_name'];
        // opp = representation['division']['plant']['name'];
      }
    }
    return opp;
  }

  setLocalStorage(customColumns) {
    localStorage.setItem('exploreCustomColumn', JSON.stringify(customColumns));
  }
  enlargeTable() {
    if (this.tabularView < 2) {
      this.tabularView++;
      this.managePositions();
      this.tablurMapHeight.emit(this.mapHeight);
    }
  }
  shrinkTable() {
    if (this.tabularView > 0) {
      this.tabularView--;
      this.managePositions();
    }
    this.tablurMapHeight.emit('close');
    // this.tableHeight = '';
    // this.style = {};
  }
  hideTable() {
    this.tabularView = 0;
    this.managePositions();
    this.formattedPlaces = [];
  }
  managePositions() {
    if (this.mapViewPostionState === 'tabularView') {
      // this.formattedPlaces = [];
      this.exploreDataService.setMapViewPositionState('mapView');
      this.mapViewPostionState = 'mapView';
      this.tabularView = 0;
    } else {
      this.tablurMapHeight.emit(this.mapHeight);
      this.exploreDataService.setMapViewPositionState('tabularView');
      this.mapViewPostionState = 'tabularView';
      this.tabularView = 1;
    }
  }
  sortColumn(name) {
    this.discoveringPanel = true;
    this.sortOrder = this.sort.direction;
    const sortQuery = {name: name.displayname, value: name.value, sortOrder: this.sortOrder};
    this.sortColumnQuery = name.value;
    this.activeSort = sortQuery;
    this.sortData.emit(sortQuery);
  }

  sortFeaturesArray(features, sortColumn, sortOnly = false, sortByAsc = false) {
    this.sortColumnQuery = sortColumn;
    const numberAttributes = ['pct_imp_inmkt', 'trp', 'imp_inmkt', 'pop_target_inmkt', 'imp_target', 'imp'];
    const formattedAttributes = ['index_comp_target', 'imp', 'imp_target_inmkt', 'imp_target'];
    let sortedFeatures = Helper.deepClone(features);
    if (!sortOnly) {
      if (sortColumn === 'frame_id') {
        sortedFeatures = sortedFeatures.sort(function (a, b) {
          return (!sortByAsc ?
          (a.properties[sortColumn] > b.properties[sortColumn]) : (a.properties[sortColumn] < b.properties[sortColumn])) ? -1 : 1;
        });
      } else if (formattedAttributes.indexOf(sortColumn) !== -1) {
        sortedFeatures = sortedFeatures.sort(function (a, b) {
          return (!sortByAsc ?
          b.properties[sortColumn] - a.properties[sortColumn] : a.properties[sortColumn] - b.properties[sortColumn]);
        });
      } else if (numberAttributes.indexOf(sortColumn) !== -1) {
        sortedFeatures = sortedFeatures.sort(function (a, b) {
          return (!sortByAsc ?
          (b.properties[sortColumn] - a.properties[sortColumn]) : (a.properties[sortColumn] - b.properties[sortColumn]));
        });
      } else if (sortColumn === 'plant_frame_id') {
        sortedFeatures = sortedFeatures.sort(function (a, b) {
          return (!sortByAsc ?
            (a.properties[sortColumn] > b.properties[sortColumn])
           : (a.properties[sortColumn] < b.properties[sortColumn]))
           ? -1 : 1;
        });
      } else if (
        (sortColumn === 'media_status_name' || sortColumn === 'media_status_description')
        && (sortedFeatures.length > 0 && sortedFeatures[0]['media_status'])
      ) {
        sortedFeatures = sortedFeatures.sort(function (a, b) {
          return (!sortByAsc ?
            (a['media_status']['name'] > b['media_status']['name'])
           : (a['media_status']['name'] < b['media_status']['name']))
           ? -1 : 1;
        });
      } else {
        sortedFeatures = sortedFeatures.sort(function (left, right) {
          // return left.properties[sortColumn].localeCompare(right.properties[sortColumn]);
          return (!sortByAsc ?
          (left.properties[sortColumn] > right.properties[sortColumn]) :
          (left.properties[sortColumn] < right.properties[sortColumn])) ? -1 : 1;
        });
      }
      const perStep = Math.ceil(sortedFeatures.length / 5);
      let step = 1;
      let increment = 0;
      let index = 0;

      sortedFeatures.map((place) => {
        if (increment >= perStep) {
          step++;
          increment = 0;
        }
        increment++;
        index++;
        if (typeof place.sortedColumns === 'undefined') {
          place.sortedColumns = {};
        }
        if (typeof place.sortedIndexes === 'undefined') {
          place.sortedIndexes = {};
        }
        place.sortedIndexes[sortColumn] = index;
        place.sortedColumns[sortColumn] = 'conditional-step-' + step;
      });
    } else {
      if ( sortColumn === 'frame_id') {
        sortedFeatures = sortedFeatures.sort(function (a, b) {
          return (!sortByAsc ?
          (a.properties[sortColumn] < b.properties[sortColumn]) :
          (a.properties[sortColumn] > b.properties[sortColumn])) ? -1 : 1;
        });
      } else if (formattedAttributes.indexOf(sortColumn) !== -1) {
        let increment = 0;
        sortedFeatures = sortedFeatures.sort(function (a) {
          if (typeof a.sortedIndexes[sortColumn] === 'undefined' || a.sortedIndexes[sortColumn] === 1000) {
            a.sortedIndexes[sortColumn] = 1000;
            increment++;
          }
        });
        const s1 = sortedFeatures.sort(function (a, b) {
          if (typeof a.sortedIndexes[sortColumn] === 'undefined') {
            a.sortedIndexes[sortColumn] = 1000;
          }
          if (typeof b.sortedIndexes[sortColumn] === 'undefined') {
            b.sortedIndexes[sortColumn] = 1000;
          }
          return a.sortedIndexes[sortColumn] - b.sortedIndexes[sortColumn];
           /*return (sortByAsc ?
            (b.sortedIndexes[sortColumn] - a.sortedIndexes[sortColumn]) :
            (a.sortedIndexes[sortColumn] - b.sortedIndexes[sortColumn])
           );*/
        });
        const perstep = s1.length - increment;
        let sort1 = s1.slice(0, perstep);
        const sort2 = s1.slice(perstep);
        sort1 = sort1.sort(function (a, b) {
          return (sortByAsc ?
            (b.sortedIndexes[sortColumn] - a.sortedIndexes[sortColumn]) :
            (a.sortedIndexes[sortColumn] - b.sortedIndexes[sortColumn])
           );
        });
        sortedFeatures = sort1.concat(sort2);
      } else if (numberAttributes.indexOf(sortColumn) !== -1) {
        sortedFeatures = sortedFeatures.sort(function (a, b) {
          if (typeof a.sortedIndexes[sortColumn] === 'undefined') {
            a.sortedIndexes[sortColumn] = 1000;
          }
          /*if (typeof b.sortedIndexes[sortColumn] === 'undefined') {
            b.sortedIndexes[sortColumn] = 1000;
          }*/

          /*return (!sortByAsc ?
            (a.properties[sortColumn] < b.properties[sortColumn]) :
            (a.sortedIndexes[sortColumn] < b.sortedIndexes[sortColumn])
           ) ? -1 : 1;*/

           return (!sortByAsc ?
            (a.properties[sortColumn] - b.properties[sortColumn]) :
            (b.properties[sortColumn] - a.properties[sortColumn])
           );

        });

      } else if (sortColumn === 'plant_frame_id') {
          sortedFeatures = sortedFeatures.sort(function (a, b) {
          return (!sortByAsc ?
            (a.properties[sortColumn] < b.properties[sortColumn])
           : (a.properties[sortColumn] > b.properties[sortColumn]))
           ? -1 : 1;
        });
      } else if (
        (sortColumn === 'media_status_name' || sortColumn === 'media_status_description')
        && (sortedFeatures.length > 0 && sortedFeatures[0]['media_status'])
      ) {
        sortedFeatures = sortedFeatures.sort(function (a, b) {
          return (!sortByAsc ?
            (a['media_status']['name'] > b['media_status']['name'])
           : (a['media_status']['name'] < b['media_status']['name']))
           ? -1 : 1;
        });
      } else {
        sortedFeatures = sortedFeatures.sort(function (left, right) {
          // return left.properties[sortColumn].localeCompare(right.properties[sortColumn]);
          return (!sortByAsc ?
            (left.properties[sortColumn] < right.properties[sortColumn]) :
            (left.properties[sortColumn] > right.properties[sortColumn])) ? -1 : 1;
        });
      }
    }
    return sortedFeatures;
  }

  extend(obj, src) {
    for (const key in src) {
      if (src.hasOwnProperty(key)) {
        obj[key] = src[key];
      }
    }
    return obj;
  }

  getColumnKey(sortkey) {
    const options = this.sortables;
    let obj = '';
    for (let i = 0; i < options.length; i++) {
      if (options[i].name === sortkey) {
        obj = options[i].value;
      }
    }
    return obj;
  }

  selectCheckboxToggle(place) {
    this.placeSelect.emit(place.spot_id);
  }

  selectAllCheckbox(event) {
    if (event.checked) {
      this.select.emit('All');
    } else {
      this.select.emit('None');
    }
  }
  selectTopList(type) {
    this.select.emit(type);
  }
  exportPDF() {
    this.pdfExport.emit();
  }
  // TODO : Need to allow user to export customized columns from here
  exportCSV() {
    this.csvExport.emit(this.currentSortables);
  }
  openPackage(type = 'add') {
    this.saveInventorySet.emit(type);
  }
  openSaveScenario() {
    this.saveScenario.emit();
  }
  clickOnRow(spotId, i) {
    this.placeClick.emit(spotId);
  }
  onResize(event) {
    if (this.mapViewPostionState === 'tabularView') {
      const mapHeight = this.elementView.nativeElement.offsetHeight;
      const top = event.currentTarget.innerHeight - mapHeight;
      if (top > 200) {
        this.tablurMapHeight.emit(mapHeight);
        this.style = {
          position: 'fixed',
          top: `${top }px`,
          height: `${mapHeight}px`
        };
      } else {
        this.tablurMapHeight.emit(250);
        this.style = {
          position: 'fixed',
          top: `${event.currentTarget.innerHeight - 250 }px`,
          height: `${250}px`
        };
        this.tableHeight = 130;
      }
    }
  }

  onResizeEnd(event: ResizeEvent): void {
    this.isResizingElement = false;
    this.tablurMapHeight.emit(this.mapHeight);
    this.tableHeight = this.tableHeightEnd;
  }
  onResizing(event) {
    this.isResizingElement = true;
    if (event.rectangle.top >= 333 && event.rectangle.height >= 250 ) {
      this.style = {
        position: 'fixed',
        // left: `${event.rectangle.left}px`,
        top: `${event.rectangle.top }px`,
        // width: `${event.rectangle.width}px`,
        height: `${event.rectangle.height}px`
      };
      this.mapHeight = event.rectangle.height;
      this.tableHeightEnd = (window.innerHeight - event.rectangle.top) - 110;
      // this.tablurMapHeight.emit(this.mapHeight);
    }
  }
  customizeColumn() {
    this.loaderService.display(true);
    if (this.currentSortables && this.currentSortables.length > 0 ) {
      this.removeDuplicates(this.currentSortables, this.sortables);
    } else {
      this.currentSortables = this.sortables.map(x => Object.assign({}, x));
      this.sortables = [];
    }

    const isFrequency = this.isExist('freq_avg', this.currentSortables);
    const isSortableFrequency = this.isExist('freq_avg', this.sortables);
    if (isFrequency === undefined) {
      const defaultAvailableColumn = {'name': 'Frequency', 'displayname': 'Target In-Market Frequency', 'value': 'freq_avg'};
      if (isSortableFrequency === undefined) {
        this.sortables.push(defaultAvailableColumn);
      }
    }
    const isTotinmi = this.isExist('imp_inmkt', this.currentSortables);
    const isSortableTotinmi = this.isExist('imp_inmkt', this.sortables);
    if (isTotinmi === undefined) {
      const defaultAvailableColumn_1 = {'name': 'Tot In-Market Imp', 'displayname': 'Total In-Market Impressions', 'value': 'imp_inmkt'};
      if (isSortableTotinmi === undefined) {
        this.sortables.push(defaultAvailableColumn_1);
      }
    }

    const isCwi = this.isExist('pct_comp_imp_target', this.currentSortables);
    const isSortableCwi = this.isExist('pct_comp_imp_target', this.sortables);
    if (isCwi === undefined) {
      const defaultAvailableColumn_2 = {
        'name': 'Target Imp Comp Percentage',
        'displayname': 'Target % Impression Comp',
        'value': 'pct_comp_imp_target'
      };
      if (isSortableCwi === undefined) {
        this.sortables.push(defaultAvailableColumn_2);
      }
    }

    const isTgtinmp = this.isExist('pct_imp_target_inmkt', this.currentSortables);
    const isSortableTgtinmp = this.isExist('pct_imp_target_inmkt', this.sortables);
    if (isTgtinmp === undefined) {
      const defaultAvailableColumn_3 = {
        'name': 'Target % In-Market Imp',
        'displayname': 'Target % In-Market Impressions',
        'value': 'pct_imp_target_inmkt'
      };
      if (isSortableTgtinmp === undefined) {
        this.sortables.push(defaultAvailableColumn_3);
      }
    }
    const isCompinmi = this.isExist('pct_comp_imp_target_inmkt', this.currentSortables);
    const isSortableCompinmi = this.isExist('pct_comp_imp_target_inmkt', this.sortables);
    if (isCompinmi === undefined) {
      const defaultAvailableColumn_4 = {
        'name': 'Target % In-Market Impr.. Comp.',
        'displayname': 'Target % In-Market Impr. Comp.',
        'value': 'pct_comp_imp_target_inmkt'
      };
      if (isSortableCompinmi === undefined) {
        this.sortables.push(defaultAvailableColumn_4);
      }
    }

    const isTrp = this.isExist('trp', this.currentSortables);
    const isSortableTrp = this.isExist('trp', this.sortables);
    if (isTrp === undefined) {
      const defaultAvailableColumn_5 = {
        'name': 'Target In-Market Rating Points',
        'displayname': 'Target In-Market Rating Points',
        'value': 'trp'
      };
      if (isSortableTrp === undefined) {
        this.sortables.push(defaultAvailableColumn_5);
      }
    }

    const isTotinmp = this.isExist('pct_imp_inmkt', this.currentSortables);
    const isSortableTotinmp = this.isExist('pct_imp_inmkt', this.sortables);
    if (isTotinmp === undefined) {
      const defaultAvailableColumn_6 = {'name': 'Total % In-Mkt Impr.', 'displayname': 'Total % In-Mkt Impr.', 'value': 'pct_imp_inmkt'};
      if (isSortableTotinmp === undefined) {
        this.sortables.push(defaultAvailableColumn_6);
      }
    }

    const isClassification = this.isExist('classification_type', this.currentSortables);
    const isSortableClassification = this.isExist('classification_type', this.sortables);
    if (isClassification === undefined) {
      const defaultAvailableColumn_7 = {'name': 'classification_type', 'displayname': 'Classification', 'value': 'classification_type'};
      if (isSortableClassification === undefined) {
        this.sortables.push(defaultAvailableColumn_7);
      }
    }

    const isConstruction = this.isExist('construction_type', this.currentSortables);
    const isSortableConstruction = this.isExist('construction_type', this.sortables);
    if (isConstruction === undefined) {
      const defaultAvailableColumn_8 = {'name': 'construction_type', 'displayname': 'Construction', 'value': 'construction_type'};
      if (isSortableConstruction === undefined) {
        this.sortables.push(defaultAvailableColumn_8);
      }
    }

    const isDigital = this.isExist('digital', this.currentSortables);
    const isSortableDigital = this.isExist('digital', this.sortables);
    if (isDigital === undefined) {
      const defaultAvailableColumn_9 = {'name': 'digital', 'displayname': 'Material', 'value': 'digital'};
      if (isSortableDigital === undefined) {
        this.sortables.push(defaultAvailableColumn_9);
      }
    }

    const isheight = this.isExist('max_height', this.currentSortables);
    const isSortableheight = this.isExist('max_height', this.sortables);
    if (isheight === undefined) {
      const defaultAvailableColumn_10 = {'name': 'height', 'displayname': 'Height (ft & in)', 'value': 'max_height'};
      if (isSortableheight === undefined) {
        this.sortables.push(defaultAvailableColumn_10);
      }
    }

    const isWidth = this.isExist('max_width', this.currentSortables);
    const isSortableWidth = this.isExist('max_width', this.sortables);
    if (isWidth === undefined) {
      const defaultAvailableColumn_11 = {'name': 'width', 'displayname': 'Width (ft & in)', 'value': 'max_width'};
      if (isSortableWidth === undefined) {
        this.sortables.push(defaultAvailableColumn_11);
      }
    }

    const isPrimaryArtery = this.isExist('primary_artery', this.currentSortables);
    const isSortablePrimaryArtery = this.isExist('primary_artery', this.sortables);
    if (isPrimaryArtery === undefined) {
      const defaultAvailableColumn_12 = {'name': 'primary_artery', 'displayname': 'Primary Artery', 'value': 'primary_artery'};
      if (isSortablePrimaryArtery === undefined) {
        this.sortables.push(defaultAvailableColumn_12);
      }
    }

    const isZipCode = this.isExist('zip_code', this.currentSortables);
    const isSortableZipCode = this.isExist('zip_code', this.sortables);
    if (isZipCode === undefined) {
      const defaultAvailableColumn_13 = {'name': 'zip_code', 'displayname': 'ZIP Code', 'value': 'zip_code'};
      if (isSortableZipCode === undefined) {
        this.sortables.push(defaultAvailableColumn_13);
      }
    }

    const isLongitude = this.isExist('longitude', this.currentSortables);
    const isSortableLongitude = this.isExist('longitude', this.sortables);
    if (isLongitude === undefined) {
      const defaultAvailableColumn_14 = {'name': 'longitude', 'displayname': 'Longitude', 'value': 'longitude'};
      if (isSortableLongitude === undefined) {
        this.sortables.push(defaultAvailableColumn_14);
      }
    }

    const isLatitude = this.isExist('latitude', this.currentSortables);
    const isSortableLatitude = this.isExist('latitude', this.sortables);
    if (isLatitude === undefined) {
      const defaultAvailableColumn_15 = {'name': 'latitude', 'displayname': 'Latitude', 'value': 'latitude'};
      if (isSortableLatitude === undefined) {
        this.sortables.push(defaultAvailableColumn_15);
      }
    }

    const isIlluminationType = this.isExist('illumination_type', this.currentSortables);
    const isSortableIlluminationType = this.isExist('illumination_type', this.sortables);
    if (isIlluminationType === undefined) {
      const defaultAvailableColumn_16 = {'name': 'illumination_type', 'displayname': 'Illumination Type', 'value': 'illumination_type'};
      if (isSortableIlluminationType === undefined) {
        this.sortables.push(defaultAvailableColumn_16);
      }
    }

    const isMediaName = this.isExist('media_name', this.currentSortables);
    const isSortableMediaName = this.isExist('media_name', this.sortables);
    if (isMediaName === undefined) {
      const defaultAvailableColumn_18 = {'name': 'media_name', 'displayname': 'Media Name', 'value': 'media_name'};
      if (isSortableMediaName === undefined) {
        this.sortables.push(defaultAvailableColumn_18);
      }
    }

    const isOrientation = this.isExist('orientation', this.currentSortables);
    const isSortableOrientation = this.isExist('orientation', this.sortables);
    if (isOrientation === undefined) {
      const defaultAvailableColumn_19 = {
        'name': 'orientation', 'displayname': 'Orientation', 'value': 'orientation'
      };
      if (isSortableOrientation === undefined) {
        this.sortables.push(defaultAvailableColumn_19);
      }
    }

    const isMarketName = this.isExist('market_name', this.currentSortables);
    const isSortableMarketName = this.isExist('market_name', this.sortables);
    if (isMarketName === undefined) {
      const defaultAvailableColumn_20 = {
        'name': 'market_name', 'displayname': 'Market Name', 'value': 'market_name'
      };
      if (isSortableMarketName === undefined) {
        this.sortables.push(defaultAvailableColumn_20);
      }
    }

    const isMarketType = this.isExist('market_type', this.currentSortables);
    const isSortableMarketType = this.isExist('market_type', this.sortables);
    if (isMarketType === undefined) {
      const defaultAvailableColumn_21 = {
        'name': 'market_type', 'displayname': 'Market Type', 'value': 'market_type'
      };
      if (isSortableMarketType === undefined) {
        this.sortables.push(defaultAvailableColumn_21);
      }
    }

    const isMarketPop = this.isExist('market_pop', this.currentSortables);
    const isSortableMarketPop = this.isExist('market_pop', this.sortables);
    if (isMarketPop === undefined) {
      const defaultAvailableColumn_22 = {
        'name': 'market_pop', 'displayname': 'Total Market Population', 'value': 'market_pop'
      };
      if (isSortableMarketPop === undefined) {
        this.sortables.push(defaultAvailableColumn_22);
      }
    }

    const isScheduledWeeks = this.isExist('scheduled_weeks', this.currentSortables);
    const isSortableScheduledWeeks = this.isExist('scheduled_weeks', this.sortables);
    if (isScheduledWeeks === undefined) {
      const defaultAvailableColumn_23 = {
        'name': 'scheduled_weeks', 'displayname': 'Scheduled # of Weeks', 'value': 'scheduled_weeks'
      };
      if (isSortableScheduledWeeks === undefined) {
        this.sortables.push(defaultAvailableColumn_23);
      }
    }

    const isTargetAudience = this.isExist('target_aud', this.currentSortables);
    const isSortableTargetAudience = this.isExist('target_aud', this.sortables);
    if (isTargetAudience === undefined) {
      const defaultAvailableColumn_24 = {
        'name': 'target_aud', 'displayname': 'Target Audience', 'value': 'target_aud'
      };
      if (isSortableTargetAudience === undefined) {
        this.sortables.push(defaultAvailableColumn_24);
      }
    }

    const isTargetAudiencePop = this.isExist('target_aud_pop', this.currentSortables);
    const isSortableTargetAudiencePop = this.isExist('target_aud_pop', this.sortables);
    if (isTargetAudiencePop === undefined) {
      const defaultAvailableColumn_25 = {
        'name': 'target_aud_pop', 'displayname': 'Target Audience Market Population', 'value': 'target_aud_pop'
      };
      if (isSortableTargetAudiencePop === undefined) {
        this.sortables.push(defaultAvailableColumn_25);
      }
    }

    const isOutmarketImp = this.isExist('out_market_imp', this.currentSortables);
    const isSortableisOutmarketImp = this.isExist('out_market_imp', this.sortables);
    if (isOutmarketImp === undefined) {
      const defaultAvailableColumn_26 = {
        'name': 'out_market_imp', 'displayname': 'Total Out of Market Impressions', 'value': 'out_market_imp'
      };
      if (isSortableisOutmarketImp === undefined) {
        this.sortables.push(defaultAvailableColumn_26);
      }
    }

    const isOutmarketImpPer = this.isExist('per_out_market_imp', this.currentSortables);
    const isSortableTOutmarketImpPer = this.isExist('per_out_market_imp', this.sortables);
    if (isOutmarketImpPer === undefined) {
      const defaultAvailableColumn_27 = {
        'name': 'per_out_market_imp', 'displayname': 'Total % Out of Market Impressions', 'value': 'per_out_market_imp'
      };
      if (isSortableTOutmarketImpPer === undefined) {
        this.sortables.push(defaultAvailableColumn_27);
      }
    }
    const isReachNet = this.isExist('reach_net', this.currentSortables);
    const isSortableReachNet = this.isExist('reach_net', this.sortables);
    if (isReachNet === undefined) {
      const defaultAvailableColumn_28 = {
        'name': 'reach_net', 'displayname': 'Reach Net', 'value': 'reach_net'
      };
      if (isSortableReachNet === undefined) {
        this.sortables.push(defaultAvailableColumn_28);
      }
    }

    const isCounty = this.isExist('county_name', this.currentSortables);
    const isSortableCounty = this.isExist('county_name', this.sortables);
    if (isCounty === undefined) {
      const defaultAvailableColumn_27 = {
        'name': 'county_name', 'displayname': 'Inventory Location (County)', 'value': 'county_name'
      };
      if (isSortableCounty === undefined) {
        this.sortables.push(defaultAvailableColumn_27);
      }
    }

    const isDMA = this.isExist('dma_name', this.currentSortables);
    const isSortableDMA = this.isExist('dma_name', this.sortables);
    if (isDMA === undefined) {
      const defaultAvailableColumn_27 = {
        'name': 'dma_name', 'displayname': 'Inventory Location (DMA)', 'value': 'dma_name'
      };
      if (isSortableDMA === undefined) {
        this.sortables.push(defaultAvailableColumn_27);
      }
    }
    const isCBSA = this.isExist('cbsa_name', this.currentSortables);
    const isSortableCBSA = this.isExist('cbsa_name', this.sortables);
    if (isCBSA === undefined) {
      const defaultAvailableColumn_27 = {
        'name': 'cbsa_name', 'displayname': 'Inventory Location (CBSA)', 'value': 'cbsa_name'
      };
      if (isSortableCBSA === undefined) {
        this.sortables.push(defaultAvailableColumn_27);
      }
    }
    
    const isPlaceType = this.isExist('place_type', this.currentSortables);
    const isSortablePlaceType = this.isExist('place_type', this.sortables);
    if (isPlaceType === undefined) {
      const defaultAvailableColumn_30 = {
        'name': 'place_type', 'displayname': 'Place Type', 'value': 'place_type'
      };
      if (isSortablePlaceType === undefined) {
        this.sortables.push(defaultAvailableColumn_30);
      }
    }
    const isPlaceName = this.isExist('place_name', this.currentSortables);
    const isSortablePlaceName = this.isExist('place_name', this.sortables);
    if (isPlaceName === undefined) {
      const defaultAvailableColumn_31 = {
        'name': 'Place Name', 'displayname': 'Place Name', 'value': 'place_name'
      };
      if (isSortablePlaceName === undefined) {
        this.sortables.push(defaultAvailableColumn_31);
      }
    }
    const isPlacementType = this.isExist('placement_type', this.currentSortables);
    const isSortablePlacementType = this.isExist('placement_type', this.sortables);
    if (isPlacementType === undefined) {
      const defaultAvailableColumn_29 = {
        'name': 'Placement Type', 'displayname': 'Placement Type', 'value': 'placement_type'
      };
      if (isSortablePlacementType === undefined) {
        this.sortables.push(defaultAvailableColumn_29);
      }
    }
    this.sortables = this.sortables.filter(column => column['value'] !== 'checked');
    this.sortables = this.sortables.filter(column => column['value'] !== 'position');
    this.currentSortables = this.currentSortables.filter(column => column['value'] !== 'checked');
    this.currentSortables = this.currentSortables.filter(column => column['value'] !== 'position');
    const dummyCurrentSortable = this.currentSortables.map(x => Object.assign({}, x));
    const ref = this.dialog.open(CustomizeColumnComponent, {
      data: {'sortables': this.sortables, 'currentSortables' : this.currentSortables, origin: 'explore'},
      width: '700px',
      closeOnNavigation: true,
      panelClass: 'audience-browser-container'
    });
    this.loaderService.display(false);

    ref.afterClosed().subscribe(res => {
      if (res) {
        this.clearColumn = res.clear;
        if (!this.clearColumn) {
          this.currentSortables = res.currentSortables;
          const data = {
            'module': 'explore',
            'area': 'tableViewCustomColumn',
            'content': {
              'order': this.currentSortables
            }
          };
          this.commonService.updateCustomizeColumns(data).subscribe(response => {
          });
          this.setLocalStorage(this.currentSortables);
          this.loadTabularData();
        } else {
          this.formatCurrentSortable(dummyCurrentSortable);
        }
      } else {
        this.formatCurrentSortable(dummyCurrentSortable);
      }
    });
  }

  /**
   * To format the tabular column close the customized window.
   * @param dummyCurrentSortable assign to CurrentSortable object before open customized column.
   */
  formatCurrentSortable(dummyCurrentSortable) {
    this.setLocalStorage(dummyCurrentSortable);
    this.currentSortables = dummyCurrentSortable;
    if (this.mapViewPostionState === 'tabularView') {
      const checkboxIndex = this.currentSortables.findIndex(column => column['value'] === 'checked');
      if (checkboxIndex < 0 ) {
        this.currentSortables.splice(0, 0, {
          'name': 'CHECKBOX',
          'displayname': '',
          'value': 'checked'
        });
      }

    const positionIndex = this.currentSortables.findIndex(column => column['value'] === 'position');
    if (positionIndex < 0 ) {
    this.currentSortables.splice(1, 0, {
      'name': 'SLNO',
      'displayname': '#',
      'value': 'position'
    });
    }
  }
}
  isExist(nameKey, myArray) {
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].value === nameKey) {
        return i;
      }
    }
  }

  removeDuplicates(a, b) {
    for (let i = 0, len = a.length; i < len; i++) {
      for (let j = 0, len2 = b.length; j < len2; j++) {
        if (a[i].name === b[j].name) {
            b.splice(j, 1);
            len2 = b.length;
          }
      }
    }
  }
  // This method will check whether any filter is applied or not
  private checkAnyFilterApplied() {
    const sessionData = this.filtersService.getExploreSession();
    if (!sessionData) {
      return false;
    }
    const filters = this.filtersService.normalizeFilterDataNew(sessionData);
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
    'classification_type_list'].some(key => filters[key])
    || (filters['measures_range_list'] && filters['measures_range_list'].length > 1))) {
      return true;
    } else {
      return false;
    }
  }
  // This is a pagination method to load more features
  public loadMore() {
      this.isLoader = true;
      this.paginateCall.emit();
  }
  public trackByFunction(index, item) {
      return item.spot_id;
  }
}
