import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  Optional,
  SkipSelf,
  Inject
} from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CustomizeColumnV3Component } from '@shared/components/customize-column-v3/customize-column-v3.component';
import { CommonService } from '../../shared/services/index';
import { Helper } from 'app/classes';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { WorkspaceV3Service } from '../workspace-v3.service';
import {
  InventoryPlanResponse,
  Plan,
  PlanSummary,
  Spot
} from '@interTypes/inventory-plan';
import { FormControl } from '@angular/forms';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ThemeService } from '@shared/services';
import {
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  tap,
  switchMap,
  catchError,
  map,
  filter
} from 'rxjs/operators';
import { Subject, of, forkJoin } from 'rxjs';
import { CustomColumnsArea, InventoryPlanJobStatus } from '@interTypes/enums';
import { DatePipe } from '@angular/common';
import { AuthenticationService } from '@shared/services';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialog, WorkflowLables } from '@interTypes/workspaceV2';
import { INVENTORY_SAVING_LIMIT } from '@constants/inventory-limits';
import { ConvertPipe } from '@shared/pipes/convert.pipe';
import { ExploreSavePackageComponent } from '@shared/components/explore-save-package/explore-save-package.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplyFilterModel, OverlayListInputModel } from '@shared/components/overlay-list/overlay-list.model';

@Component({
  selector: 'app-inventory-plan',
  templateUrl: './inventory-plan.component.html',
  styleUrls: ['./inventory-plan.component.less'],
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed, void',
        style({ height: '0px', minHeight: '0', display: 'none' })
      ),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
      transition(
        'expanded <=> void',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      )
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class InventoryPlanComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  sortableColumns = [
    {
      name: 'Plan',
      displayname: 'Plan Name',
      value: 'planId',
      category: 'detailed'
    },
    {
      name: 'Audience',
      displayname: 'Audience',
      value: 'aud_name',
      category: 'detailed'
    },
    {
      name: 'Market',
      displayname: 'Market',
      value: 'market_name',
      category: 'detailed'
    },
    {
      name: 'Total # of Spots',
      displayname: 'Total # of Spots',
      value: 'spots',
      category: 'detailed'
    },
    {
      name: 'Frequency',
      displayname: 'Target In-Market Frequency',
      value: 'freq_avg',
      category: 'detailed'
    },
    {
      name: 'Tot In-Market Imp',
      displayname: 'Total In-Market Impressions',
      value: 'imp_inmkt',
      category: 'detailed'
    },
    {
      name: 'Target Imp Comp Percentage',
      displayname: 'Target % Impression Comp',
      value: 'pct_comp_imp_target',
      category: 'detailed'
    },
    {
      name: 'Target % In-Market Imp',
      displayname: 'Target % In-Market Impressions',
      value: 'pct_imp_target_inmkt',
      category: 'detailed'
    },
    {
      name: 'Target % In-Market Impr.. Comp.',
      displayname: 'Target % In-Market Impr. Comp.',
      value: 'pct_comp_imp_target_inmkt',
      category: 'detailed'
    },
    {
      name: 'Target In-Market Rating Points',
      displayname: 'Target In-Market Rating Points',
      value: 'trp',
      category: 'detailed'
    },
    {
      name: 'Total % In-Mkt Impr.',
      displayname: 'Total % In-Mkt Impr.',
      value: 'pct_imp_inmkt',
      category: 'detailed'
    },
    {
      name: 'pop_inmkt',
      displayname: 'Total Market Population',
      value: 'pop_inmkt',
      category: 'detailed'
    },
    {
      name: 'pop_target_inmkt',
      displayname: 'Target Audience Market Population',
      value: 'pop_target_inmkt',
      category: 'detailed'
    },
    {
      name: 'reach_net',
      displayname: 'Reach Net',
      value: 'reach_net',
      category: 'detailed'
    },
    {
      name: 'Total Imp',
      displayname: 'Total Impressions',
      value: 'imp',
      category: 'detailed'
    },
    {
      name: 'Target Imp',
      displayname: 'Target Impressions',
      value: 'imp_target',
      category: 'detailed'
    },
    {
      name: 'In-Mkt Target Comp Index',
      displayname: 'Target Audience Index',
      value: 'index_comp_target',
      category: 'detailed'
    },
    {
      name: 'In-Mkt Target Imp',
      displayname: 'Target In-Market Impressions',
      value: 'imp_target_inmkt',
      category: 'detailed'
    },
    {
      name: '"Reach"',
      displayname: 'Target In-Market Reach',
      value: 'reach_pct',
      category: 'detailed'
    },
    // Summary columns
    {
      name: 'PLANT OPERATOR',
      displayname: 'Operator',
      value: 'plant_operator',
      category: 'summary'
    },
    {
      name: 'SPOT ID',
      displayname: 'Geopath Spot ID',
      value: 'spot_id',
      category: 'summary'
    },
    {
      name: 'FRAME ID',
      displayname: 'Geopath Frame ID',
      value: 'frame_id',
      category: 'summary'
    },
    {
      name: 'Media Status',
      displayname: 'Status',
      value: 'media_status_name',
      category: 'summary'
    },
    {
      name: 'Media Description',
      displayname: 'Status Description',
      value: 'media_status_description',
      category: 'summary'
    },
    {
      name: 'PLANT UNIT ID',
      displayname: 'Operator Spot ID',
      value: 'operator_spot_id',
      category: 'summary'
    },
    {
      name: 'MEDIA TYPE',
      displayname: 'Media Type',
      value: 'media_type',
      category: 'summary'
    },
    {
      name: 'classification_type',
      displayname: 'Classification',
      value: 'classification',
      category: 'summary'
    },
    {
      name: 'construction_type',
      displayname: 'Construction',
      value: 'construction',
      category: 'summary'
    },
    {
      name: 'digital',
      displayname: 'Material',
      value: 'digital',
      category: 'summary'
    },
    {
      name: 'height',
      displayname: 'Height (ft & in)',
      value: 'height',
      category: 'summary'
    },
    {
      name: 'width',
      displayname: 'Width (ft & in)',
      value: 'width',
      category: 'summary'
    },
    {
      name: 'primary_artery',
      displayname: 'Primary Artery',
      value: 'primary_artery',
      category: 'summary'
    },
    {
      name: 'zip_code',
      displayname: 'ZIP Code',
      value: 'zip_code',
      category: 'summary'
    },
    {
      name: 'longitude',
      displayname: 'Longitude',
      value: 'longitude',
      category: 'summary'
    },
    {
      name: 'latitude',
      displayname: 'Latitude',
      value: 'latitude',
      category: 'summary'
    },
    {
      name: 'illumination_type',
      displayname: 'Illumination Type',
      value: 'illumination_type',
      category: 'summary'
    },
    {
      name: 'orientation',
      displayname: 'Orientation',
      value: 'orientation',
      category: 'summary'
    },
    {
      name: 'media_name',
      displayname: 'Media Name',
      value: 'media_name',
      category: 'summary'
    },
    {
      name: 'market_name',
      displayname: 'Market Name',
      value: 'market_name',
      category: 'summary'
    },
    {
      name: 'market_type',
      displayname: 'Market Type',
      value: 'market_type',
      category: 'summary'
    },
    {
      name: 'target_aud',
      displayname: 'Target Audience',
      value: 'target_aud',
      category: 'summary'
    },
    {
      name: 'dma_name',
      displayname: 'Inventory Location (DMA)',
      value: 'dma_name',
      category: 'summary'
    },
    {
      name: 'cbsa_name',
      displayname: 'Inventory Location (CBSA)',
      value: 'cbsa_name',
      category: 'summary'
    },
    {
      name: 'county_name',
      displayname: 'Inventory Location (County)',
      value: 'county_name',
      category: 'summary'
    },
    {
      name: 'Total Imp',
      displayname: 'Total Impressions',
      value: 'imp',
      type: 'ABBREVIATE',
      category: 'summary'
    },
    {
      name: 'Target Imp',
      displayname: 'Target Impressions',
      value: 'imp_target',
      type: 'ABBREVIATE',
      category: 'summary'
    },
    {
      name: 'In-Mkt Target Comp Index',
      displayname: 'Target Audience Index',
      value: 'index_comp_target',
      type: 'THOUSAND',
      category: 'summary'
    },
    {
      name: 'Inventory Location (DMA) In-Mkt Target Comp Index',
      displayname: 'Inventory Location (DMA)Target Audience Index',
      value: 'dma_index_comp_target',
      type: 'THOUSAND',
      category: 'summary'
    },
    {
      name: 'Inventory Location (CBSA) In-Mkt Target Comp Index',
      displayname: 'Inventory Location (CBSA)Target Audience Index',
      value: 'cbsa_index_comp_target',
      type: 'THOUSAND',
      category: 'summary'
    },
    {
      name: 'Inventory Location (County) In-Mkt Target Comp Index',
      displayname: 'Inventory Location (County)Target Audience Index',
      value: 'county_index_comp_target',
      type: 'THOUSAND',
      category: 'summary'
    },
    {
      name: 'In-Mkt Target Imp',
      displayname: 'Target In-Market Impressions',
      value: 'imp_target_inmkt',
      type: 'ABBREVIATE',
      category: 'summary'
    },
    {
      name: 'Inventory Location (DMA) In-Mkt Target Imp',
      displayname: 'Inventory Location (DMA) Target In-Market Impressions',
      value: 'dma_imp_target_inmkt',
      type: 'ABBREVIATE',
      category: 'summary'
    },
    {
      name: 'Inventory Location (CBSA) In-Mkt Target Imp',
      displayname: 'Inventory Location (CBSA) Target In-Market Impressions',
      value: 'cbsa_imp_target_inmkt',
      type: 'ABBREVIATE',
      category: 'summary'
    },
    {
      name: 'Inventory Location (County) In-Mkt Target Imp',
      displayname: 'Inventory Location (County) Target In-Market Impressions',
      value: 'county_imp_target_inmkt',
      type: 'ABBREVIATE',
      category: 'summary'
    },
    {
      name: 'Scheduled # of Weeks',
      displayname: 'Scheduled # of Weeks',
      value: 'scheduled_weeks',
      category: 'summary'
    },
    {
      name: 'Frequency',
      displayname: 'Target In-Market Frequency',
      value: 'freq_avg',
      category: 'summary'
    },
    {
      name: 'Inventory Location (DMA) Frequency',
      displayname: 'Inventory Location (DMA) Target In-Market Frequency',
      value: 'dma_freq_avg',
      category: 'summary'
    },
    {
      name: 'Inventory Location (CBSA) Frequency',
      displayname: 'Inventory Location (CBSA) Target In-Market Frequency',
      value: 'cbsa_freq_avg',
      category: 'summary'
    },
    {
      name: 'Inventory Location (County) Frequency',
      displayname: 'Inventory Location (County) Target In-Market Frequency',
      value: 'county_freq_avg',
      category: 'summary'
    },
    {
      name: 'Tot In-Market Imp',
      displayname: 'Total In-Market Impressions',
      value: 'imp_inmkt',
      type: 'ABBREVIATE',
      category: 'summary'
    },
    {
      name: 'Inventory Location (DMA) Tot In-Market Imp',
      displayname: 'Inventory Location (DMA) Total In-Market Impressions',
      value: 'dma_imp_inmkt',
      type: 'ABBREVIATE',
      category: 'summary'
    },
    {
      name: 'Inventory Location (CBSA) Tot In-Market Imp',
      displayname: 'Inventory Location (CBSA) Total In-Market Impressions',
      value: 'cbsa_imp_inmkt',
      type: 'ABBREVIATE',
      category: 'summary'
    },
    {
      name: 'Inventory Location (County) Tot In-Market Imp',
      displayname: 'Inventory Location (County) Total In-Market Impressions',
      value: 'county_imp_inmkt',
      type: 'ABBREVIATE',
      category: 'summary'
    },
    {
      name: 'Target Imp Comp Percentage',
      displayname: 'Target % Impression Comp',
      value: 'pct_comp_imp_target',
      type: 'PERCENT',
      category: 'summary'
    },
    {
      name: 'Target % In-Market Imp',
      displayname: 'Target % In-Market Impressions',
      value: 'pct_imp_target_inmkt',
      category: 'summary'
    },
    {
      name: 'Inventory Location (DMA) Target % In-Market Imp',
      displayname: 'Inventory Location (DMA) Target % In-Market Impressions',
      value: 'dma_pct_imp_target_inmkt',
      category: 'summary'
    },
    {
      name: 'Inventory Location (CBSA) Target % In-Market Imp',
      displayname: 'Inventory Location (CBSA) Target % In-Market Impressions',
      value: 'cbsa_pct_imp_target_inmkt',
      category: 'summary'
    },
    {
      name: 'Inventory Location (County) Target % In-Market Imp',
      displayname: 'Inventory Location (County) Target % In-Market Impressions',
      value: 'county_pct_imp_target_inmkt',
      category: 'summary'
    },
    {
      name: 'Target % In-Market Impr.. Comp.',
      displayname: 'Target % In-Market Impr. Comp.',
      value: 'pct_comp_imp_target_inmkt',
      category: 'summary'
    },
    {
      name: 'Inventory Location (DMA) Target % In-Market Impr.. Comp.',
      displayname: 'Inventory Location (DMA) Target % In-Market Impr. Comp.',
      value: 'dma_pct_comp_imp_target_inmkt',
      category: 'summary'
    },
    {
      name: 'Inventory Location (CBSA) Target % In-Market Impr.. Comp.',
      displayname: 'Inventory Location (CBSA) Target % In-Market Impr. Comp.',
      value: 'cbsa_pct_comp_imp_target_inmkt',
      category: 'summary'
    },
    {
      name: 'Inventory Location (County) Target % In-Market Impr.. Comp.',
      displayname: 'Inventory Location (County) Target % In-Market Impr. Comp.',
      value: 'county_pct_comp_imp_target_inmkt',
      category: 'summary'
    },
    {
      name: 'Target In-Market Rating Points',
      displayname: 'Target In-Market Rating Points',
      value: 'trp',
      category: 'summary'
    },
    {
      name: 'Inventory Location (DMA) Target In-Market Rating Points',
      displayname: 'Inventory Location (DMA) Target In-Market Rating Points',
      value: 'dma_trp',
      category: 'summary'
    },
    {
      name: 'Inventory Location (CBSA) Target In-Market Rating Points',
      displayname: 'Inventory Location (CBSA) Target In-Market Rating Points',
      value: 'cbsa_trp',
      category: 'summary'
    },
    {
      name: 'Inventory Location (County) Target In-Market Rating Points',
      displayname: 'Inventory Location (County) Target In-Market Rating Points',
      value: 'county_trp',
      category: 'summary'
    },
    {
      name: 'Total % In-Mkt Impr.',
      displayname: 'Total % In-Mkt Impr.',
      value: 'pct_imp_inmkt',
      category: 'summary'
    },
    {
      name: 'Inventory Location (DMA) Total % In-Mkt Impr.',
      displayname: 'Inventory Location (DMA) Total % In-Mkt Impr.',
      value: 'dma_pct_imp_inmkt',
      category: 'summary'
    },
    {
      name: 'Inventory Location (CBSA) Total % In-Mkt Impr.',
      displayname: 'Inventory Location (CBSA) Total % In-Mkt Impr.',
      value: 'cbsa_pct_imp_inmkt',
      category: 'summary'
    },
    {
      name: 'Inventory Location (County) Total % In-Mkt Impr.',
      displayname: 'Inventory Location (County) Total % In-Mkt Impr.',
      value: 'county_pct_imp_inmkt',
      category: 'summary'
    },
    {
      name: 'Total Market Population',
      displayname: 'Total Market Population',
      value: 'market_pop',
      category: 'summary'
    },
    {
      name: 'Target Audience Market Population',
      displayname: 'Target Audience Market Population',
      value: 'target_aud_pop',
      category: 'summary'
    },
    {
      name: 'Total Out of Market Impressions',
      displayname: 'Total Out of Market Impressions',
      value: 'out_market_imp',
      category: 'summary'
    },
    {
      name: 'Total Out of Market Impressions',
      displayname: 'Total % Out of Market Impressions',
      value: 'per_out_market_imp',
      category: 'summary'
    },
    {
      name: 'Reach Net',
      displayname: 'Reach Net',
      value: 'reach_net',
      category: 'summary'
    },
    {
      name: 'Reach',
      displayname: 'Target In-Market Reach',
      value: 'reach_pct',
      category: 'summary'
    },
    {
      name: 'period_date',
      displayname: 'Period Dates',
      value: 'period_date',
      category: 'summary'
    },
    {
      name: 'total_days',
      displayname: 'Total Days',
      value: 'total_days',
      category: 'summary'
    },
    {
      name: 'Place Type',
      displayname: 'Place Type',
      value: 'place_type',
      category: 'summary'
    },
    {
      name: 'Place Name',
      displayname: 'Place Name',
      value: 'place_name',
      category: 'summary'
    },
    {
      name: 'Placement Type',
      displayname: 'Placement Type',
      value: 'placement_type',
      category: 'summary'
    }
  ];
  
    
  defaultColumns = [
    { name: 'accordion', displayname: '', value: 'accordion', category: 'detailed'},
    { name: 'Plan', displayname: 'Plan Name', value: 'planId', category: 'detailed'},
    { name: 'Audience', displayname: 'Audience', value: 'aud_name', category: 'detailed'},
    { name: 'Market', displayname: 'Market', value: 'market_name', category: 'detailed'},
    {
      name: 'Total # of Spots',
      displayname: 'Total # of Spots',
      value: 'spots',
      category: 'detailed'
    },
    { name: 'Total Imp', displayname: 'Total Impressions', value: 'imp', category: 'detailed' },
    {
      name: 'Target Imp',
      displayname: 'Target Impressions',
      value: 'imp_target',
      category: 'detailed'
    },
    { name: 'action', displayname: '', value: 'action', category: 'detailed'},
  ];
  summaryDefaultColumns = [
    { name: 'PLANT OPERATOR', displayname: 'Operator', value: 'plant_operator', category: 'summary' },
    { name: 'SPOT ID', displayname: 'Geopath Spot ID', value: 'spot_id', category: 'summary' },
    { name: 'FRAME ID', displayname: 'Geopath Frame ID', value: 'frame_id', category: 'summary' },
    { name: 'Media Status', displayname: 'Status', value: 'media_status_name', category: 'summary' },
    { name: 'Media Description', displayname: 'Status Description', value: 'media_status_description', category: 'summary'},
    { name: 'PLANT UNIT ID', displayname: 'Operator Spot ID', value: 'operator_spot_id', category: 'summary' },
    { name: 'MEDIA TYPE', displayname: 'Media Type', value: 'media_type', category: 'summary' },
    { name: 'Scheduled # of Weeks', displayname: 'Scheduled # of Weeks', value: 'scheduled_weeks', category: 'summary' },
    { name: 'Total Imp', displayname: 'Total Impressions', value: 'imp', category: 'summary' },
    { name: 'Target Imp', displayname: 'Target Impressions',value: 'imp_target',  category: 'summary' },
    { name: 'In-Mkt Target Comp Index', displayname: 'Target Audience Index', value: 'index_comp_target', category: 'summary' },
    { name: 'In-Mkt Target Imp', displayname: 'Target In-Market Impressions', value: 'imp_target_inmkt', category: 'summary' },
    { name: 'Reach', displayname: 'Target In-Market Reach', value: 'reach_pct', category: 'summary' },
    { name: 'Place Type', displayname: 'Place Type', value: 'place_type', category: 'summary' },
    { name: 'Place Name', displayname: 'Place Name', value: 'place_name', category: 'summary' },
    { name: 'Placement Type', displayname: 'Placement Type', value: 'placement_type', category: 'summary' }
  ];

  currentSortables: any;

  displayedColumns: string[] = [
    'accordion',
    'planId',
    'aud_name',
    'market_name',
    'imp',
    'imp_target',
    'index_comp_target',
    'action'
  ];
  columns = [];
  dataSource: any = new MatTableDataSource([]);
  public tableCellwidth = '150px';
  public clientId = null;
  public formattedPlans: PlanSummary[] = [];

  // storing expanded rows ids.
  public expandedRowSets = new Set();
  @Input() scenario: any;
  @Output() toggleSideNav: EventEmitter<any> = new EventEmitter();
  @Output() pushInventoryPlan: EventEmitter<any> = new EventEmitter();
  @Output() saveInventoryUpdate: EventEmitter<any> = new EventEmitter();

  public selectedAudiencesCtrl: FormControl = new FormControl();
  public selectedPlansCtrl: FormControl = new FormControl();
  public searchPlansCtrl: FormControl = new FormControl();

  public audienceOverlayOrigin: CdkOverlayOrigin;
  public plansFilterOverlayOrigin: CdkOverlayOrigin;

  public filteredPlans: any = [];
  public audiences: any = [];
  public audiencesForFilter: any = [];
  public isOMG: boolean;
  public isPlanFilterOpen = false;
  public isAudienceFilterOpen = false;
  public spotSchedules = {};
  private unSubscribe$: Subject<void> = new Subject<void>();
  @Input() regeneratePlans$: Subject<any> = new Subject<any>();
  months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  @Input() public projectOwnerEmail: any;
  @Input() public userEmail: any;
  public allowInventory = '';
  mod_permission: any;
  private selectedSpotsIds: Spot[] = [];
  private planSelecetdInventory = {};
  public enableInventoryListAction = false;
  public enableCalculateMeasuresAction = false;
  public readonly inventoryLimit = INVENTORY_SAVING_LIMIT;
  public labels: WorkflowLables;
  public searchFilterApplied = false;
  @Input() inventoryPlanIDs = [];
  @Input() scenarioInventorySet;
  @Output() updateInventorySetIds: EventEmitter<any> = new EventEmitter();
  public resetSelection$: Subject<any> = new Subject<any>();
  public loading = true;
  public isDialogOpened = false;
  public activeSort: MatSortable = {
    id: 'planId',
    start: 'asc',
    disableClear: false
  };
  public refreshInventoryList$: Subject<any> = new Subject();
  isFullScreen = false;

  customColumnCategories = [
    {
      name: 'Plan Summary',
      key: 'detailed'
    },
    {
      name: 'Media Detail',
      key: 'summary'
    }
  ];
  enableSpotSchedule: boolean;
  public selectedAudiences: any = [];
  public selectedPlans: any = [];
  public overlayPlanList: OverlayListInputModel[] = [];

  constructor(
    private commonService: CommonService,
    private workSpaceService: WorkspaceV3Service,
    public dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    public themeService: ThemeService,
    private datePipe: DatePipe,
    private authService: AuthenticationService,
    private convert: ConvertPipe,
    public snackBar: MatSnackBar,
    @Optional()
    @SkipSelf()
    public dialogRef: MatDialogRef<InventoryPlanComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public injectedData: any
  ) {
    this.labels = this.commonService.getWorkFlowLabels();
  }

  ngOnInit(): void {
    if (this.dialogRef !== null) {
      this.isFullScreen = true;
    }
    this.setupForOnMaximize();
    this.prepareColumns();

    // this.dataSource.sort = this.sort;
    // this.sort.sortChange.subscribe((data)=>{
    //   console.log(data);
    // });

    const themeSettings = this.themeService.getThemeSettings();
    this.clientId = Number(themeSettings.clientId);
    if (themeSettings && themeSettings.site === 'omg') {
      this.isOMG = true;
    }
    this.mod_permission = this.authService.getModuleAccess('explore');
    this.allowInventory = this.mod_permission?.['features']?.['gpInventory'][
      'status'
    ];

      this.workSpaceService.updateSceanrioPlanPeriod$.subscribe((dates) => {
        this.enableCalculateMeasuresAction = true;
      });
      const requests = [];
      requests.push(
        this.commonService
          .getCustomizeColumns(
            'workspace',
            CustomColumnsArea.INVENTORY_TABLE
          )
          .pipe(
            tap((colResponse) => {
              if (colResponse?.['data']?.['content']?.['order']) {
                const cols = Helper.deepClone(colResponse['data']['content']['order']);
                cols.map((col) => {
                  col.category = 'summary';
                  return col;
                })
                localStorage.setItem(
                  CustomColumnsArea.INVENTORY_TABLE,
                  JSON.stringify(cols)
                );
              } else {
                localStorage.setItem(
                  CustomColumnsArea.INVENTORY_TABLE,
                  JSON.stringify(this.summaryDefaultColumns)
                );
              }
            }),
            catchError((error) => of(error))
          )
      );
      requests.push(
        this.commonService
          .getCustomizeColumns(
            'workspace',
            CustomColumnsArea.INVENTORY_PLAN_TABLE
          )
          .pipe(
            tap((colResponse) => {
              if (colResponse?.['data']?.['content']?.['order']) {
                const cols = Helper.deepClone(colResponse['data']['content']['order']);
                cols.map((col) => {
                  col.category = 'detailed';
                  return col;
                })
                localStorage.setItem(
                  CustomColumnsArea.INVENTORY_PLAN_TABLE,
                  JSON.stringify(cols)
                );
              } else {
                localStorage.setItem(
                  CustomColumnsArea.INVENTORY_PLAN_TABLE,
                  JSON.stringify(this.defaultColumns)
                );
              }
              this.prepareColumns();
            }),
            catchError((error) => of(error))
          )
      );
      forkJoin(requests).subscribe();
  }

  ngAfterViewInit() {
    const interval = setInterval(() => {
      if(this.sort) {
        this.dataSource.sort = this.sort;
        this.cdRef.detectChanges();
        clearInterval(interval);
      }
    }, 100);

  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isDialogOpened) {
      return;
    }
    if (changes?.scenario?.currentValue?.['_id']) {
      this.getInventoryPlans();
      if (changes.scenario.currentValue?.delivery_period_weeks) {
        this.enableSpotSchedule = false;
      } else {
        this.enableSpotSchedule = true;
      }
      
    }
  }

  ngOnDestroy() {
    localStorage.removeItem('marketPlanData');
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  public openFilter() {
    this.toggleSideNav.emit();
  }

  // TODO:  work in progress waiting for API
  public customizeColumn() {
    if (this.currentSortables && this.currentSortables.length > 0) {
      this.currentSortables = this.currentSortables.map((x) =>
        Object.assign({}, x)
      );
      // this.removeDuplicates(this.currentSortables, this.sortableColumns);
    } else {
      this.currentSortables = this.columns.map((x) => Object.assign({}, x));
    }
    const summaryDefaultColumns = JSON.parse(
      localStorage.getItem(CustomColumnsArea.INVENTORY_TABLE)
    );
    let currentSortables = Helper.deepClone(this.currentSortables);
    currentSortables.push(...summaryDefaultColumns);

    const defaultColumns = Helper.deepClone(this.defaultColumns);
    defaultColumns.push(...this.summaryDefaultColumns);
    let sortables = Helper.deepClone(this.sortableColumns);
    sortables = sortables.filter((sort) => {
      const isExist = this.isExist(sort, currentSortables);
      if (isExist === undefined) {
        return true;
      }
    });
    currentSortables = currentSortables.filter(
      (column) => column['value'] !== 'accordion'
    );
    currentSortables = currentSortables.filter(
      (column) => column['value'] !== 'action'
    );

    if (!this.enableSpotSchedule) {
      sortables = sortables.filter(
        (column) => column['value'] !== 'period_date'
      );
      sortables = sortables.filter(
        (column) => column['value'] !== 'total_days'
      );
      currentSortables = currentSortables.filter(
        (column) => !column['value'].includes('_date_')
      );
      currentSortables = currentSortables.filter(
        (column) => column['value'] !== 'total_days'
      );
    } else {
      sortables = sortables.filter(
        (column) => column['value'] !== 'scheduled_weeks'
      );
    }
    const ref = this.dialog.open(CustomizeColumnV3Component, {
      data: {
        sortables: sortables,
        currentSortables: currentSortables,
        origin: 'scenario',
        defaultColumns: defaultColumns,
        columnCategories: this.customColumnCategories
      },
      width: '540px',
      closeOnNavigation: true,
      panelClass: 'audience-browser-container',
      disableClose: true
    });
    ref.afterClosed().subscribe((res) => {
      if (res?.action !== 'close') {
        const currentSortables = Helper.deepClone(res.currentSortables);
        this.currentSortables = currentSortables.filter((sort) => sort.category === 'detailed');
        const summaryCurrentSortables = currentSortables.filter((sort) => sort.category === 'summary');
        const data = {
          module: 'workspace',
          area: CustomColumnsArea.INVENTORY_PLAN_TABLE,
          content: {
            order: this.currentSortables
          }
        };
        this.commonService
          .updateCustomizeColumns(data)
          .subscribe((response) => {});

        // We are storing plan headers data in scenarioCustomColumnV2
        localStorage.setItem(
          CustomColumnsArea.INVENTORY_PLAN_TABLE,
          JSON.stringify(this.currentSortables)
        );

        const summarydata = {
          module: 'workspace',
          area: CustomColumnsArea.INVENTORY_TABLE,
          content: {
            order: summaryCurrentSortables
          }
        };
        localStorage.setItem(
          CustomColumnsArea.INVENTORY_TABLE,
          JSON.stringify(summaryCurrentSortables)
        );
        this.commonService.updateCustomizeColumns(summarydata).subscribe();
        this.commonService.setSummaryCustomColumns(summaryCurrentSortables);
        this.prepareColumns();
      }
    });
  }
  isExist(sortKey, myArray) {
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].value === sortKey.value && myArray[i].category === sortKey.category) {
        return i;
      }
    }
  }

  private prepareColumns() {
    let customColumns = this.defaultColumns;
    const localCustomColum = JSON.parse(
      localStorage.getItem(CustomColumnsArea.INVENTORY_PLAN_TABLE)
    );
    if (localCustomColum != null && localCustomColum.length) {
      customColumns = localCustomColum;
    }
    this.columns = customColumns.map((col) => {
      col['category'] = 'detailed';
      return col;
    });
    // this.columns = customColumns;
    // this.currentSortables = this.currentSortables.filter(column => column['value'] !== 'accordion');
    this.displayedColumns = this.columns.map((c) => c['value']);
    if (this.displayedColumns.indexOf('accordion') === -1) {
      this.displayedColumns.splice(0, 0, 'accordion');
      const obj = {
        name: 'accordion',
        displayname: '',
        value: 'accordion'
      };
      this.columns.push(obj);
    }
    if (this.displayedColumns.indexOf('action') === -1) {
      this.displayedColumns.splice(this.columns.length, 0, 'action');
      const obj = {
        name: 'action',
        displayname: '',
        value: 'action'
      };
      this.columns.push(obj);
    }

    const screenWidth = window.innerWidth;

    /** Calculate the table header & row cell width dynamic */
    if (this.displayedColumns.length * 150 < screenWidth) {
      /** removed tableWidth for customize icon cutoff on resize */
      this.tableCellwidth = `${
        (window.innerWidth - 220) / this.displayedColumns.length
      }`;

    } else {
      this.tableCellwidth = '150px';
    }
    this.currentSortables = this.columns.map((x) => Object.assign({}, x));
    this.cdRef.markForCheck();
  }
  // TODO: Need to handle timeout issue
  private getInventoryPlans() {    
    this.workSpaceService
      .getInventoryPlans(this.scenario['_id'])
      .pipe(
        switchMap((response: InventoryPlanResponse) => {
          if (response?.plans?.length) {
            const requests = [];
            requests.push(of(response));
            requests.push(
              this.workSpaceService
                .getAllSpotSchedules(this.scenario['_id'], false)
                .pipe(
                  map((result) => {
                    const spotSchedules = {};
                    result.map((spot) => {
                      if (spot['schedules'] && spot['schedules'].length > 0) {
                        spotSchedules[spot['spotId']] = spot['schedules'];
                      }
                    });
                    return spotSchedules;
                  }),
                  catchError((error) => of({}))
                )
            );
            return forkJoin(requests);
          } else {
            return of(response);
          }
        })
      )
      .subscribe(
        (results) => {
          this.loading = false;
          this.cdRef.markForCheck();
          if (results[1]) {
            this.spotSchedules = results[1];
            this.workSpaceService.setSpotSchedulesData(results[1]);
          }
          if (results[0]) {
            if (this.scenario?.job?.status === InventoryPlanJobStatus.SUCCESS) {
              const response = results[0];
              this.setInventoryPlan(response['plans']);
              this.audiences = Helper.removeDuplicate(
                response['plans'].map((plan) => '(' + (plan?.summary?.measures_release ?? 2020) + ') ' + plan?.summary?.aud_name)
              );
              this.audiencesForFilter = this.getOverlayAudienceList(this.audiences);
              this.filteredPlans = response['plans'];
            }
          }
        },
        (error) => {
          this.loading = false;
          this.cdRef.markForCheck();
        }
      );
  }

  /**
   ** TOTO : Will removed once sorting enable API for now handle in UI side
   */
  private setInventoryPlan(plans = []) {
    this.formattedPlans = [];
    plans?.forEach((element) => {
      const summary = element?.summary;
      const formatPlan = {
        plan_name: element?.plan_name,
        planId: element?.plan_name,
        measures_type: summary?.measures_type ?? null,
        period_days: summary?.period_days ?? null,
        base_segment: summary?.base_segment ?? null,
        target_segment: summary?.target_segment ?? null,
        target_geo: summary?.target_geo ?? null,
        market: summary?.market ?? null,
        index_comp_target: summary?.index_comp_target ?? null,
        pct_comp_pop_target_inmkt: summary?.pct_comp_pop_target_inmkt ?? null,
        pct_comp_imp_target: summary?.pct_comp_imp_target ?? null,
        pct_comp_imp_target_inmkt: summary?.pct_comp_imp_target_inmkt ?? null,
        freq_avg: summary?.freq_avg ?? null,
        imp_target_inmkt: summary?.imp_target_inmkt ?? null,
        imp_target: summary?.imp_target ?? null,
        imp_inmkt: summary?.imp_inmkt ?? null,
        imp: summary?.imp ?? null,
        pct_imp_inmkt: summary?.pct_imp_inmkt ?? null,
        pct_imp_target_inmkt: summary?.pct_imp_target_inmkt ?? null,
        pop_inmkt: summary?.pop_inmkt ?? null,
        pop_target_inmkt: summary?.pop_target_inmkt ?? null,
        reach_pct: summary?.reach_pct ?? null,
        reach_net: summary?.reach_net ?? null,
        trp: summary?.trp ?? null,
        eff_freq_min: summary?.eff_freq_min ?? null,
        eff_freq_avg: summary?.eff_freq_avg ?? null,
        eff_reach_net: summary?.eff_reach_net ?? null,
        eff_reach_pct: summary?.eff_reach_pct ?? null,
        frames: summary?.frames ?? null,
        spots: summary?.total_frames_in_selection ?? null, // summary?.spots ?? null, // Changed spots to total_frames_in_selection because we are using total_frames_in_selection to display spot count.
        aud_name: summary?.aud_name ?? null,
        market_name: summary?.market_name ?? null,
        markets: this.getFormattedMarkets(summary?.market_name, this.scenario?.market),
        total_frames_in_selection: summary?.total_frames_in_selection ?? null,
        target_imp: summary?.target_imp ?? null,
        total_imp: summary?.total_imp ?? null,
        target_comp: summary?.target_comp ?? null,
        spotsData: element?.spots ?? [],
        measures_release: summary?.measures_release ?? 2020,
        _id: element._id,
        plan: (summary?.market_name ?? '') + ', ' + (summary?.aud_name ?? ''),
        isInventoryDeleted: false
      };
      this.formattedPlans.push(formatPlan);
    });
    this.overlayPlanList = this.getOverlayPlanList(); // initialize the plan list
    // Set the plan level datasouce
    this.pushInventoryPlan.emit(this.formattedPlans);
    this.dataSource.data = this.formattedPlans;
  }
  getFormattedMarkets(marketName, scenarioMarkets) {
    const market = scenarioMarkets.find((market) => market['name'] === marketName);
    let markets = [];
    if (market) {
      if (market?.id && market['id'] !== '') {
        markets.push({
          id: market['id'],
          name: market['name']
        });
      } else {
        markets.push(...market['marketsGroup']);
      }
    }
    return markets;
  }

  trackByFn = (index, element) => {
    return element._id;
  }

  public comparePlans(c1, c2) {
    return c1 && c2 && c1['plan_name'] === c2['plan_name'];
  }
  public compareAudiences(c1, c2) {
    return c1 && c2 && c1 === c2;
  }
  public trackFilters(index, item) {
    return item;
  }

  /** This function used to set the selected plan inventory spot ids */
  public selectedSpots(event) {
    if (event?.['planName']) {
      this.planSelecetdInventory[event.planName] = event;
    }
    this.selectedSpotsIds = event?.selectedSpotsIds ?? [];
    const selectedCount = this.selectedSpotsIds.filter(
      (spot) => spot?.selected === true
    ).length;
    if (selectedCount > 0) {
      this.enableInventoryListAction = true;
    } else {
      this.enableInventoryListAction = false;
    }
  }

  /** This function used save the new inventory set based on selected plan */

  public openSaveScenario(planName) {
    const selectedInventory =
      this.planSelecetdInventory[planName]?.selectedSpotsIds ?? [];
    if (selectedInventory.length) {
      const selectedCount = selectedInventory.filter(
        (spot) => spot?.selected === true
      ).length;
      if (selectedCount > this.inventoryLimit) {
        const dialogData: ConfirmationDialog = {
          notifyMessage: true,
          confirmTitle: 'Error',
          messageText: `${
            this.labels?.scenario[0]
          } is limited to ${this.convert.transform(
            this.inventoryLimit,
            'ABBREVIATE'
          )} inventories, filter more to save inventory set`
        };
        this.dialog.open(ConfirmationDialogComponent, {
          data: dialogData,
          width: '450px'
        });
        return;
      }
      const data = {};
      const width = '500px';
      const height = 'auto';
      data['inventories'] = selectedInventory;
      data['from'] = 'newWorkspace';
      data['type'] = 'add';
      data['clientId'] = this.clientId;
      data['saveFromFilter'] = false;
      const browser = this.dialog
        .open(ExploreSavePackageComponent, {
          height: height,
          data: data,
          width: width,
          closeOnNavigation: true,
          panelClass: 'save-package-container'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res?.['addedPackage']) {
            this.saveInventoryUpdate.emit(res);
          }
        });
    }
  }

  /** This function used check the selected plan has selecetd spot ids available or not */

  public checkSelectedInventory(planName) {
    this.selectedSpotsIds =
      this.planSelecetdInventory[planName]?.selectedSpotsIds ?? [];
    const selectedCount = this.selectedSpotsIds.filter(
      (spot) => spot?.selected === true
    ).length;
    if (selectedCount > 0) {
      this.enableInventoryListAction = true;
    } else {
      this.enableInventoryListAction = false;
    }
  }

  public deleteInventory(planName) {
    const spots = this.planSelecetdInventory[planName]?.selectedSpotsIds ?? [];
    const selectedSpots = spots.filter((spot) => spot?.selected === true);
    if (!selectedSpots.length) {
      this.enableCalculateMeasuresAction = false;
      return;
    }
    const selectedSpotIds = selectedSpots.map((spot) => spot.spot_id);
    const updatedInventorySetIds = this.inventoryPlanIDs.filter(
      (id) => !selectedSpotIds.includes(id)
    );
    if (
      this.scenario.includeOutsideMarketInvs &&
      this.formattedPlans.length > 1
    ) {
      const dialogData: ConfirmationDialog = {
        notifyMessage: false,
        confirmDesc:
          'Removing the unit(s) from this plan will remove it from all related plans for the grouped Inventory Plan',
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        headerCloseIcon: false
      };
      this.dialog
        .open(ConfirmationDialogComponent, {
          data: dialogData,
          width: '450px'
        })
        .afterClosed()
        .pipe(filter((result) => result && result.action))
        .subscribe(() => {
          this.enableCalculateMeasuresAction = true;
          this.enableInventoryListAction = false;
          this.updateScenarioInventorySet(updatedInventorySetIds, planName);
        });
    } else {
      this.enableCalculateMeasuresAction = true;
      this.enableInventoryListAction = false;
      this.updateScenarioInventorySet(updatedInventorySetIds, planName);
    }
  }

  public reGeneratePlans() {
    if (this.isDialogOpened) {
      this.dialogRef.close();
    }

    this.regeneratePlans$.next();
  }

  private resetSummary(planName) {
    if (
      this.scenario.includeOutsideMarketInvs &&
      this.formattedPlans.length > 1
    ) {
      this.formattedPlans.forEach((plan) => {
        plan['index_comp_target'] = null;
        plan['pct_comp_pop_target_inmkt'] = null;
        plan['pct_comp_imp_target'] = null;
        plan['pct_comp_imp_target_inmkt'] = null;
        plan['freq_avg'] = null;
        plan['imp_target_inmkt'] = null;
        plan['imp_target'] = null;
        plan['imp_inmkt'] = null;
        plan['imp'] = null;
        plan['pct_imp_inmkt'] = null;
        plan['pct_imp_target_inmkt'] = null;
        plan['pop_inmkt'] = null;
        plan['pop_target_inmkt'] = null;
        plan['reach_pct'] = null;
        plan['reach_net'] = null;
        plan['eff_freq_min'] = null;
        plan['eff_freq_avg'] = null;
        plan['eff_reach_net'] = null;
        plan['trp'] = null;
        plan['target_imp'] = null;
        plan['total_imp'] = null;
        plan['target_comp'] = null;
        plan['isInventoryDeleted'] = true;
      });
      this.dataSource.data = this.formattedPlans;
    } else {
      const planIndex = this.formattedPlans.findIndex(
        (plan) => plan.plan_name === planName
      );
      const planDataSourceIndex = this.dataSource.data.map(
        (plan) => plan.plan_name === planName
      );
      if (planIndex > -1) {
        this.formattedPlans[planIndex]['index_comp_target'] = null;
        this.formattedPlans[planIndex]['pct_comp_pop_target_inmkt'] = null;
        this.formattedPlans[planIndex]['pct_comp_imp_target'] = null;
        this.formattedPlans[planIndex]['pct_comp_imp_target_inmkt'] = null;
        this.formattedPlans[planIndex]['freq_avg'] = null;
        this.formattedPlans[planIndex]['imp_target_inmkt'] = null;
        this.formattedPlans[planIndex]['imp_target'] = null;
        this.formattedPlans[planIndex]['imp_inmkt'] = null;
        this.formattedPlans[planIndex]['imp'] = null;
        this.formattedPlans[planIndex]['pct_imp_inmkt'] = null;
        this.formattedPlans[planIndex]['pct_imp_target_inmkt'] = null;
        this.formattedPlans[planIndex]['pop_inmkt'] = null;
        this.formattedPlans[planIndex]['pop_target_inmkt'] = null;
        this.formattedPlans[planIndex]['reach_pct'] = null;
        this.formattedPlans[planIndex]['reach_net'] = null;
        this.formattedPlans[planIndex]['eff_freq_min'] = null;
        this.formattedPlans[planIndex]['eff_freq_avg'] = null;
        this.formattedPlans[planIndex]['eff_reach_net'] = null;
        this.formattedPlans[planIndex]['trp'] = null;
        this.formattedPlans[planIndex]['target_imp'] = null;
        this.formattedPlans[planIndex]['total_imp'] = null;
        this.formattedPlans[planIndex]['target_comp'] = null;
        this.formattedPlans[planIndex]['isInventoryDeleted'] = true;
      }
      this.dataSource.data[planDataSourceIndex] = this.formattedPlans[
        planIndex
      ];
    }
  }
  private updateScenarioInventorySet(ids, planName) {
    const inventoryPanels = [];
    ids.forEach((d) => {
      inventoryPanels.push({
        id: d,
        type: 'geopathPanel'
      });
    });
    const inputData = {
      name: this.scenarioInventorySet['packages']['name'],
      isScenarioInventorySet: true,
      name_key: this.scenarioInventorySet['packages']['name'],
      id: this.scenarioInventorySet['packages']['_id']
    };
    this.workSpaceService
      .saveInventoryPackage(inputData, inventoryPanels)
      .pipe(catchError((error) => of(error)))
      .subscribe(
        (response) => {
          this.workSpaceService.setUpdateInventorySetIds(ids);
          // this.updateInventorySetIds.emit(ids);
          this.resetSummary(planName);
          const data = { planName: planName, inventoryPlanIDs: ids };
          this.inventoryPlanIDs = [...ids];
          this.resetSelection$.next(data);
          this.snackBar.open('Selected Inventory deleted successfully', '', {
            duration: 3000
          });
        },
        (error) => {
          this.snackBar.open(
            'Something went wrong, Please try again later',
            '',
            {
              duration: 3000
            }
          );
        }
      );
  }

  public toggleExpandAndCollapseRow(uniqueId: string): void {
    if (this.isRowExpanded(uniqueId)) {
      this.expandedRowSets.delete(uniqueId);
    } else {
      this.expandedRowSets.add(uniqueId);
    }
  }

  public isRowExpanded(uniqueId: string): boolean {
    return this.expandedRowSets.has(uniqueId);
  }

  public openInventorySummaryInDialog() {
    this.dialog
      .open(InventoryPlanComponent, {
        disableClose: true,
        data: {
          dialogOpened: true,
          self: this
        },
        autoFocus: false,
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'inventory-plan-dialog-fullscreen'
      })
      .afterClosed()
      .subscribe((result) => {
        const self = result?.self;

        if (self) {
          const cdRef = this.cdRef;
          this.clone(self);
          this.refreshSort(self);
          this.dialogRef = null;
          this.isDialogOpened = false;
          this.injectedData = null;
          this.cdRef = cdRef;

          if (
            this.sort.active !== self.sort.active ||
            this.sort.direction !== self.sort.direction
          ) {
            this.refreshSort(self);
            this.sort.sort(this.activeSort);
          }

          this.cdRef.detectChanges();
        }
      });
  }

  public closeDialogBox(skipSetup = false) {
    this.dialogRef.close({ self: this });
  }

  private setupForOnMaximize() {
    if (!!this.injectedData?.dialogOpened) {
       this.clone(this.injectedData.self);
       this.refreshSort(this.injectedData.self);
       delete this.injectedData.self;
       this.cdRef.markForCheck();
    }
  }

  private refreshSort(self) {
    this.activeSort = {
      id: self.sort?.active || this.activeSort.id,
      start: self.sort.direction as 'asc' | 'desc',
      disableClear: true
    };
  }

  private clone(self: InventoryPlanComponent) {
    this.sortableColumns = self.sortableColumns.slice();
    this.displayedColumns = self.displayedColumns.slice();
    this.clientId = self.clientId;
    this.formattedPlans = Helper.deepClone(self.formattedPlans);
    this.dataSource.data = Helper.deepClone(self.dataSource.data);
    this.selectedAudiencesCtrl.setValue(self.selectedAudiencesCtrl.value);
    this.searchPlansCtrl.setValue(self.searchPlansCtrl.value);
    this.selectedPlansCtrl.setValue(self.selectedPlansCtrl.value);
    setTimeout(() => {
      this.expandedRowSets = new Set(
        Helper.deepClone(Array.from(self.expandedRowSets.values()))
      );
      this.cdRef.markForCheck();
    }, 1000);
    this.filteredPlans = Helper.deepClone(self.filteredPlans);
    this.audiences = Helper.deepClone(self.audiences);
    this.audiencesForFilter = Helper.deepClone(self.audiencesForFilter);
    this.isPlanFilterOpen = self.isPlanFilterOpen;
    this.isAudienceFilterOpen = self.isAudienceFilterOpen;
    this.spotSchedules = Helper.deepClone(self.spotSchedules);
    this.allowInventory = self.allowInventory;
    this.selectedSpotsIds = Helper.deepClone(self.selectedSpotsIds);
    this.planSelecetdInventory = self.planSelecetdInventory;
    this.enableInventoryListAction = self.enableInventoryListAction;
    this.enableCalculateMeasuresAction = self.enableCalculateMeasuresAction;
    this.searchFilterApplied = self.searchFilterApplied;
    this.inventoryPlanIDs = Helper.deepClone(self.inventoryPlanIDs);
    this.loading = self.loading;
    this.isDialogOpened = !self.isDialogOpened;
    this.scenarioInventorySet = self.scenarioInventorySet;
    this.scenario = self.scenario;
    this.projectOwnerEmail = self.projectOwnerEmail;
    this.userEmail = self.userEmail;
    this.currentSortables = self.currentSortables;
    this.isOMG = self.isOMG;
    this.mod_permission = self.mod_permission;
    this.isDialogOpened = true;
    this.selectedAudiences = self.selectedAudiences;
    this.selectedPlans = self.selectedPlans;

    this.regeneratePlans$ = self.regeneratePlans$;
  }

  public planAudienceCombinedFilter(): void {
    const audienceCount = this.audiences?.length;
    const plansCount = this.formattedPlans?.length;
    let filterData = this.formattedPlans;
    this.searchFilterApplied = false;
    if (audienceCount && plansCount) {
      const selectedPlanIds = this.selectedPlans.map(plan => plan.planId);
      if (selectedPlanIds && selectedPlanIds.length) {
        this.searchFilterApplied = true;
        filterData = filterData.filter((plan) => {
          return selectedPlanIds.includes(plan.planId);
        });
      }
      if (this.selectedAudiences && this.selectedAudiences.length) {
        this.searchFilterApplied = true;
        filterData = filterData.filter((plan: PlanSummary) => {
          return this.selectedAudiences.includes('(' + (plan?.measures_release ?? 2020) + ') ' + plan?.aud_name);
        });
      }
    }
    this.dataSource.data = filterData;
  }

  private getOverlayPlanList(): OverlayListInputModel[] {
    return this.formattedPlans.map((plan) => { return { label: `Plan ${plan.planId}`, value: plan } as OverlayListInputModel; });
  }

  private getOverlayAudienceList(audiences: any[] = []): OverlayListInputModel[] {
    return [...new Set(audiences)].map(audience => { return { value: audience, label: audience } as OverlayListInputModel });
  }

  public onApplyAudience(response: ApplyFilterModel): void {
    const { selectedItem } = response;
    this.selectedAudiences = selectedItem.map(item => item.value);
    this.planAudienceCombinedFilter();
  }

  public onApplyPlans(response: ApplyFilterModel): void {
    const { selectedItem } = response;
    this.selectedPlans = selectedItem.map(item => item.value);
    this.planAudienceCombinedFilter();
  }

}
