import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  OnDestroy,
  EventEmitter,
  Output, Optional, SkipSelf
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Spot,
  InventoryPlanQueryParams,
  InventoryPlanSpotsResponse
} from '@interTypes/inventory-plan';
import { CustomizeColumnV3Component } from '@shared/components/customize-column-v3/customize-column-v3.component';
import { CommonService } from '@shared/services';
import { WorkspaceV3Service } from 'app/workspace-v3/workspace-v3.service';
import { IMXMatPaginator } from '@shared/common-function';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent
} from '@angular/material/paginator';
import { ChangeSpotSchedulesDialogV3Component } from '../../change-spot-schedules-dialog-v3/change-spot-schedules-dialog-v3.component';
import { DatePipe } from '@angular/common';
import { Helper } from 'app/classes';
import { CustomColumnsArea } from '@interTypes/enums';
import { takeUntil, map, take } from 'rxjs/operators';
import { Subject} from 'rxjs';
import { INVENTORY_SAVING_LIMIT } from '@constants/inventory-limits';
import { InventoryPlanComponent } from '../inventory-plan.component';



@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator },
    DatePipe
  ]
})
export class InventoryListComponent implements OnInit, OnChanges, OnDestroy {
  public spots: Spot[] = [];
  @Input() totalSpots = 0;
  @Input() planName: string;
  @Input() scenario: any;
  @Input() audienceName: string;
  @Input() spotSchedules = {};
  @Input() inventoryPlanIDs = [];
  @Output() selectedSpots = new EventEmitter();
  selectAllCheckbox = false;

  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource([]);

  clearFlagtimeout = null;
  selectedCount = 0;
  public readonly inventoryLimit = INVENTORY_SAVING_LIMIT;
  defaultColumns = [
    {
      name: 'PLANT OPERATOR',
      displayname: 'Operator',
      value: 'plant_operator',
      category: 'summary'
    },
    { name: 'SPOT ID', displayname: 'Geopath Spot ID', value: 'spot_id', category: 'summary'},
    { name: 'FRAME ID', displayname: 'Geopath Frame ID', value: 'frame_id', category: 'summary'},
    { name: 'Media Status', displayname: 'Status', value: 'media_status_name', category: 'summary'},
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
    { name: 'MEDIA TYPE', displayname: 'Media Type', value: 'media_type', category: 'summary' },
    {
      name: 'Scheduled # of Weeks',
      displayname: 'Scheduled # of Weeks',
      value: 'scheduled_weeks',
      category: 'summary'
    },
    { name: 'Total Imp', displayname: 'Total Impressions', value: 'imp', category: 'summary' },
    {
      name: 'Target Imp',
      displayname: 'Target Impressions',
      value: 'imp_target',
      category: 'summary'
    },
    {
      name: 'In-Mkt Target Comp Index',
      displayname: 'Target Audience Index',
      value: 'index_comp_target',
      category: 'summary'
    },
    {
      name: 'In-Mkt Target Imp',
      displayname: 'Target In-Market Impressions',
      value: 'imp_target_inmkt',
      category: 'summary'
    },
    {
      name: 'Reach',
      displayname: 'Target In-Market Reach',
      value: 'reach_pct',
      category: 'summary'
    },
    { name: 'Place Type', displayname: 'Place Type', value: 'place_type', category: 'summary' },
    { name: 'Place Name', displayname: 'Place Name', value: 'place_name', category: 'deatailed' },
    {
      name: 'Placement Type',
      displayname: 'Placement Type',
      value: 'placement_type',
      category: 'summary'
    }
  ];
  public sortableColumns = [
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

  customColumnCategories = [
    {
      name: 'DETAILED',
      key: 'detailed'
    },
    {
      name: 'SUMMARY',
      key: 'summary'
    }
  ]

  columns = [];
  displayedColumns = [];
  tempInventoryItems = [];
  isOpendialog = true;
  currentSortables: any;
  enableSpotSchedule = false;
  public planQueryParams: InventoryPlanQueryParams = {
    page: 1,
    perPage: 50
  };
  public isDataLoading = false;
  public displayWidth = 1000;
  public _paginationSizes = [50, 100, 150];

  private selectedSpotsIds:Spot[] = [];
  private unSelectedSpotsIds:Spot[] = [];
  private unSubscribe: Subject<void> = new Subject<void>();
  private deletedSpotIds = [];
  @Input() resetSelection$: Subject<any> = new Subject<any>();
  @Input() refresh$: Subject<any> = new Subject(); // using for inventory dialog close

  constructor(
    private workSpaceService: WorkspaceV3Service,
    private commonService: CommonService,
    private cdRef: ChangeDetectorRef,
    private datePipe: DatePipe,
    public snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {

    this.displayWidth = window.innerWidth - 165;
    this.resetSelection$.pipe(takeUntil(this.unSubscribe)).subscribe((data) => {
      if (data['planName'] === this.planName) {
        this.resetAndUpdateDeletedSpots(data['inventoryPlanIDs']);
      }
    });

    this.commonService.onSummaryCustomColumns().pipe(takeUntil(this.unSubscribe)).subscribe((data) => {
      this.prepareColumns();
    });
  }

  private resetAndUpdateDeletedSpots(inventoryPlanIDs) {
    this.spots.forEach((spot) => {
      spot.selected = false;
      if (!inventoryPlanIDs.includes(spot.spot_id)) {
        this.deletedSpotIds.push(spot.spot_id);
      }
    });
    this.updateSelectedSport(false);
  }
  onResize() {
    this.displayWidth = window.innerWidth - 165;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes?.planName?.currentValue) {
      this.getInventory();
    }
    if (changes?.spots?.currentValue) {
      this.dataSource.data = this.spots;
    }
    if (changes?.totalSpots) {
      this.setPaginationSizes(this.totalSpots);
    }

    if (changes?.scenario?.currentValue?.['_id']) {
      if (changes.scenario.currentValue?.delivery_period_weeks) {
        this.enableSpotSchedule = false;
        this.prepareColumns();
      } else {
        this.enableSpotSchedule = true;
        this.updateSpotScheduleColumn();
      }
    }
  }

  private prepareColumns() {
    let customColumns = this.defaultColumns;
    const localCustomColum = JSON.parse(
      localStorage.getItem(CustomColumnsArea.INVENTORY_TABLE)
    );
    if (localCustomColum != null && localCustomColum.length !== 0) {
      customColumns = localCustomColum;
    }
    this.columns = customColumns.map((col) => {
      const sortable = this.sortableColumns.find((col1) => col1['value'] === col['value'])
      if (sortable) col['category'] = sortable['category'];
      return col;
    });
    this.columns = this.columns.filter(
      (column) => column['value'] !== 'checked'
    );
    this.displayedColumns = this.columns.map((c) => c['value']);
    this.currentSortables = this.columns.map((x) => Object.assign({}, x));
    // TODO: Temporarily commented checkbox code
    if (this.displayedColumns.indexOf('checked') === -1) {
      this.displayedColumns.splice(0, 0, 'checked');
      const obj = {
        name: 'CHECKBOX',
        displayname: '',
        value: 'checked'
      };
      this.columns.splice(0, 0, obj);
      // this.columns.push(obj);
    }
    this.currentSortables = this.currentSortables.filter(
      (column) => column['value'] !== 'position'
    );
    this.displayedColumns = this.displayedColumns.filter(
      (item) => item !== 'position'
    );
    if (!this.enableSpotSchedule) {
      this.displayedColumns = this.displayedColumns.filter(
        (item) => !item.includes('_date_')
      );
      this.displayedColumns = this.displayedColumns.filter(
        (item) => !item.includes('total_days')
      );
    } else {
      this.displayedColumns = this.displayedColumns.filter(
        (item) => !item.includes('scheduled_weeks')
      );
    }
    this.displayedColumns = Helper.removeDuplicate(this.displayedColumns);
    this.columns = Helper.removeDuplicate(this.columns, 'value');
    this.cdRef.markForCheck();
  }

  public trackByFunction(index, item) {
    return item.spot_id;
  }

  public getPageEvent(event: PageEvent) {
    this.planQueryParams.page = event.pageIndex + 1;
    this.planQueryParams.perPage = event.pageSize;
    this.getInventory();
  }
  private getInventory() {
    this.isDataLoading = true;
    this.workSpaceService
      .getInventorySpotsByPlan(this.scenario['_id'], this.planName, this.planQueryParams)
      .subscribe(
        (response: InventoryPlanSpotsResponse) => {
          this.spots = this.loadSpotDates(response.results);
          this.dataSource.data = this.spots;
          this.isDataLoading = false;
          this.cdRef.markForCheck();
        },
        (error) => {
          this.isDataLoading = false;
          this.cdRef.markForCheck();
        }
      );
  }

  public customizeColumn() {
    if (this.currentSortables && this.currentSortables.length > 0) {
      this.currentSortables = this.currentSortables.map((x) =>
        Object.assign({}, x)
      );
    } else {
      this.currentSortables = this.columns.map((x) => Object.assign({}, x));
    }
    const currentSortablesValues = this.currentSortables.map(
      (sortable) => sortable.value
    );
    this.currentSortables = this.currentSortables.filter(column => column['value'] !== 'checked');
    let sortables = this.sortableColumns.filter((sort) => {
      return !currentSortablesValues.includes(sort['value']);
    });
    sortables = sortables.filter(column => column['value'] !== 'checked');
    if (!this.enableSpotSchedule) {
      sortables = sortables.filter(
        (column) => column['value'] !== 'period_date'
      );
      sortables = sortables.filter(
        (column) => column['value'] !== 'total_days'
      );
      this.currentSortables = this.currentSortables.filter(
        (column) => !column['value'].includes('_date_')
      );
      this.currentSortables = this.currentSortables.filter(
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
        currentSortables: this.currentSortables,
        origin: 'scenario',
        defaultColumns: this.defaultColumns,
        isSpotScheduleEnabled: this.enableSpotSchedule,
        columnCategories: this.customColumnCategories
      },
      width: '540px',
      closeOnNavigation: true,
      panelClass: 'audience-browser-container',
      disableClose: true
    });
    ref.afterClosed().subscribe((res) => {
      if (res?.action !== 'close') {
        this.currentSortables = res.currentSortables;
        const data = {
          module: 'workspace',
          area: CustomColumnsArea.INVENTORY_TABLE,
          content: {
            order: this.currentSortables
          }
        };
        localStorage.setItem(
          CustomColumnsArea.INVENTORY_TABLE,
          JSON.stringify(this.currentSortables)
        );
        this.commonService.updateCustomizeColumns(data).subscribe();
        this.prepareColumns();
      }
    });
  }

  // To update the scenario dates when spot schedules changed
  private updateSpotScheduleColumn() {
    let localCustomColum = JSON.parse(
      localStorage.getItem(CustomColumnsArea.INVENTORY_TABLE)
    );
    if (!localCustomColum) {
      localCustomColum = this.defaultColumns;
    }
    const periodCnt = localCustomColum.filter(
      (item) =>
        item['name'].indexOf('period_date') === -1 || item['name'].indexOf('total_days') === -1
    );
    if (periodCnt <= 0) {
      localCustomColum = localCustomColum.filter(
        (item) =>
          item['name'].indexOf('period_date') === -1 &&
          item['name'].indexOf('total_days') === -1
      );
      let maxDates = 0;
      if (this.spots?.[0]) {
        maxDates = Object.keys(this.spots[0]).filter((key) =>
          key.includes('spot_start_date')
        ).length;
      }
      Object.keys(this.spotSchedules).map((key) => {
        if (maxDates < this.spotSchedules[key].length) {
          maxDates = this.spotSchedules[key].length;
        }
      });
      if (maxDates > 0) {
        for (let i = 1; i <= maxDates; i++) {
          const startDate = {
            name: 'period_date',
            displayname: 'Spot Start Date #' + i,
            value: 'spot_start_date_' + i
          };
          localCustomColum.push(startDate);
          const endDate = {
            name: 'period_date',
            displayname: 'Spot End Date #' + i,
            value: 'spot_end_date_' + i
          };
          localCustomColum.push(endDate);
        }
        const endDate1 = {
          name: 'total_days',
          displayname: 'Total Days',
          value: 'total_days'
        };
        localCustomColum.push(endDate1);
      }
      const data = {
        module: 'workspace',
        area: CustomColumnsArea.INVENTORY_TABLE,
        content: {
          order: localCustomColum
        }
      };
      localStorage.setItem(
        CustomColumnsArea.INVENTORY_TABLE,
        JSON.stringify(localCustomColum)
      );
      this.prepareColumns();
      // Here we are saving columns while loading 1st plan as it will be same for all plan
      if (this.planName === '1A') {
        this.commonService.updateCustomizeColumns(data).subscribe();
      }
    } else {
      this.prepareColumns();
    }
  }

  public changeSpotScheduleDate(spotData, action) {
    // Here we are collecting the date columns length to generate fields in ChangeSpotSchedulesDialogV3Component
    const dateColumns = this.displayedColumns.filter((item) =>
      item.includes('spot_start_date')
    );
    this.dialog
      .open(ChangeSpotSchedulesDialogV3Component, {
        data: {
          id: spotData['spot_id'],
          schedules:
            (this.spotSchedules[spotData['spot_id']] &&
              this.spotSchedules[spotData['spot_id']]) ||
            [],
          allSchedules: this.spotSchedules,
          scenarioId: this.scenario['_id'],
          scenarioPlanDate: this.scenario['spot_schedule'],
          spotFirstStartDate: spotData['spot_start_date_1'],
          action: action,
          count: dateColumns.length
        },
        width: '550px',
        panelClass: 'save-layer-dialog'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const spotIndex = this.spots.findIndex(
            (spotObj) => spotObj.spot_id === res.id
          );
          const spot = this.spots[spotIndex];
          Object.keys(spot).map((key, i) => {
            if (
              key.includes('spot_start_date_') ||
              key.includes('spot_end_date_')
            ) {
              spot[key] = '';
            }
          });
          let totalDays = 0;
          res.schedules.map((d, i) => {
            spot['spot_start_date_' + (i + 1)] = this.datePipe.transform(
              d['start'],
              'mediumDate'
            );
            spot['spot_end_date_' + (i + 1)] = this.datePipe.transform(
              d['end'],
              'mediumDate'
            );
            totalDays += this.commonService.getTotalDays(d['start'], d['end']);
          });
          spot['total_days'] = totalDays;
          this.spotSchedules[res.id] = res.schedules;
          const allSchedules = [];
          Object.keys(this.spotSchedules).map((key) => {
            allSchedules.push(...this.spotSchedules[key]);
          });
          let endDate;
          let startDate;
          allSchedules.map((d) => {
            if (d['start'] !== null && d['end'] !== null) {
              const d_endDate = new Date(d['end']);
              const d_startDate = new Date(d['start']);
              if (!endDate || endDate < d_endDate) {
                endDate = d_endDate;
              }
              if (!startDate || startDate > d_startDate) {
                startDate = d_startDate;
              }
            }
          });
          this.workSpaceService.updateSceanrioPlanPeriod$.next({
            start: startDate,
            end: endDate
          });
          this.snackBar.open(
            `Please regenerate the plan to see the changes in measures according to dates.`,
            'DISMISS',
            {
              duration: 2000
            }
          );
          this.spots[spotIndex] = spot;
          this.cdRef.markForCheck();
        }
      });
  }
  public setPaginationSizes(total: number) {
    if (total > 100) {
      this._paginationSizes = [50, 100, 150];
    } else if (total > 50 && total <= 100) {
      this._paginationSizes = [50, 100];
    } else {
      this._paginationSizes = [50];
    }
  }

  private loadSpotDates(spots) {
    spots.forEach((spot, idx) => {
      let totalDays = 0;
      if (this.spotSchedules && this.spotSchedules[spot.spot_id]) {
        for (let i = 1; i <= this.spotSchedules[spot.spot_id].length; i++) {
          if (this.spotSchedules[spot.spot_id][i - 1]['end']) {
            spots[idx]['spot_end_date_' + i] = this.datePipe.transform(
              this.spotSchedules[spot.spot_id][i - 1]['end'],
              'mediumDate'
            );
          }
          if (this.spotSchedules[spot.spot_id][i - 1]['start']) {
            spots[idx]['spot_start_date_' + i] = this.datePipe.transform(
              this.spotSchedules[spot.spot_id][i - 1]['start'],
              'mediumDate'
            );
          }
          totalDays += this.getTotalDays(
            this.spotSchedules[spot.spot_id][i - 1]['start'],
            this.spotSchedules[spot.spot_id][i - 1]['end']
          );
        }
        spots[idx]['total_days'] = Math.floor(totalDays);
      }
      if (!this.inventoryPlanIDs?.includes(spot.spot_id)) {
        this.deletedSpotIds.push(spot.spot_id);
      }
      if (this.selectAllCheckbox) {
        spots[idx]['selected'] = true;
      } else {
        const selectedSpot = this.selectedSpotsIds.find(selectedId=>selectedId['_id'] == spot['_id'] && selectedId['selected']);
        if(selectedSpot) {
          spots[idx]['selected'] = selectedSpot['selected'];
        } else {
          spots[idx]['selected'] = false;
        }
      }
    });
    return spots;
  }

  private getTotalDays(start, end) {
    const date1 = new Date(start);
    const date2 = new Date(end);

    // To calculate the time difference of two dates
    const inTime = date2.getTime() - date1.getTime();

    // To calculate the no. of days between two dates
    const inDays = inTime / (1000 * 3600 * 24);
    return inDays + 1;
  }

  public onSelectDeselectAll() {
    if (!this.selectAllCheckbox) {
      this.selectedCount = this.totalSpots;
      if((this.spots.length !== this.totalSpots) && this.selectedSpotsIds.length < this.totalSpots){
        // Current page selection
        this.spots.map((spot) => {
          if (this.inventoryPlanIDs.includes(spot.spot_id)) {
            spot.selected = true;
          } else {
            this.deletedSpotIds.push(spot.spot_id);
            spot.selected = false;
          }
        });
        const pageParam = {
          page : 1,
          perPage:  this.totalSpots <= this.inventoryLimit ? this.totalSpots : this.inventoryLimit
        }
        this.workSpaceService
      .getInventorySpotsByPlan(this.scenario['_id'], this.planName, pageParam, false)
      .pipe(
        takeUntil(this.unSubscribe),
          map(res => {
            if(res?.results){
              this.selectAllCheckbox = true;
              const dummySelection = this.selectedSpotsIds;
               this.selectedSpotsIds = [];

                res?.results?.forEach((spot)=>{
                  const dummySelectedSpot =   dummySelection.find(dummaySpot=>dummaySpot._id == spot['_id']);
                  if (this.inventoryPlanIDs.includes(spot.spot_id)) {
                    if (dummySelectedSpot) {
                      this.selectedSpotsIds.push({_id:spot['_id'],spot_id:spot['spot_id'], frame_id:spot['frame_id'], selected:dummySelectedSpot['selected']});
                    } else {
                      this.selectedSpotsIds.push({_id:spot['_id'],spot_id:spot['spot_id'], frame_id:spot['frame_id'], selected:true});
                    }
                  } else {
                    this.deletedSpotIds.push(spot.spot_id);
                  }
                })
                return res;
            }else{
              return [];
            }
          })
        )
      .subscribe(res=>{
        const emitData = {
          planName : this.planName,
          selectedSpotsIds: this.selectedSpotsIds
        }
        this.selectedSpots.emit(emitData);
        this.checkSelectedCount();
      });
      }else{
        if (this.selectedSpotsIds?.length && this.selectedSpotsIds.length === this.totalSpots) {
          this.spots.map((spot) => {
            if (this.inventoryPlanIDs.includes(spot.spot_id)) {
              spot.selected = true;
            } else {
              spot.selected = false;
              this.deletedSpotIds.push(spot.spot_id);
            }
          });
          this.updateSelectedSport().then(res=>{
            const emitData = {
                planName : this.planName,
                selectedSpotsIds: this.selectedSpotsIds
              }
            this.selectedSpots.emit(emitData);
            this.checkSelectedCount();
          });
        } else {
          this.selectedSpotsIds = [];
          this.spots.map((spot) => {
            if (this.inventoryPlanIDs.includes(spot.spot_id)) {
              spot.selected = true;
              this.selectedSpotsIds.push({_id:spot['_id'],spot_id:spot['spot_id'], frame_id:spot['frame_id'], selected: true});
            } else {
              spot.selected = false;
              this.deletedSpotIds.push(spot.spot_id);
            }
          });
          const emitData = {
              planName : this.planName,
              selectedSpotsIds: this.selectedSpotsIds
            }
          this.selectedSpots.emit(emitData);
          this.checkSelectedCount();
        }
      }
    } else {
      this.spots.map((spot) => {
        spot.selected = false;
      });
      this.selectedSpotsIds.forEach((idObject) => {
        idObject.selected = false;
      });
      this.selectedSpotsIds.forEach((idObject) => {
        idObject.selected = false;
      })
      this.selectedCount  = 0;
      this.updateSelectedSport(false).then(res=>{
        const emitData = {
            planName : this.planName,
            selectedSpotsIds: this.selectedSpotsIds
          }
        this.selectedSpots.emit(emitData);
        this.checkSelectedCount();
      });
    }
  }

  async updateSelectedSport(checked = true) {
    await this.selectedSpotsIds.forEach((spot) => {
      if (this.inventoryPlanIDs.includes(spot.spot_id)) {
        spot.selected = checked;
      } else {
        spot.selected = false;
        this.deletedSpotIds.push(spot.spot_id);
      }
    });
    this.checkSelectedCount();
    return this.selectedSpotsIds;
  }

  public onSelectDeselect(element, event) {
    const selectedIndex =   this.selectedSpotsIds.findIndex(spot=>spot._id == element['_id']);

    if (selectedIndex>-1) {
      this.selectedSpotsIds[selectedIndex]['selected'] = !this.selectedSpotsIds[selectedIndex]['selected'];
    } else {
      this.selectedSpotsIds.push({_id:element['_id'],spot_id:element['spot_id'], frame_id:element['frame_id'], selected: event.checked})
    }
    this.checkSelectedCount();
    const emitData = {
          planName : this.planName,
          selectedSpotsIds: this.selectedSpotsIds
    }
    this.selectedSpots.emit(emitData);
  }

  checkSelectedCount(){
    this.selectedCount  = this.selectedSpotsIds.filter(spot=>spot?.selected === true).length;
    // Different scenario tested so that Added settimeout
    setTimeout(() => {
      let deletedInvCount = 0;
      if (this.deletedSpotIds?.length) {
        deletedInvCount = Helper.removeDuplicate(this.deletedSpotIds)?.length || 0;
      }
      if (this.totalSpots === deletedInvCount) {
        this.selectAllCheckbox = this.selectedCount === this.totalSpots;
      } else {
        this.selectAllCheckbox = (this.selectedCount === this.totalSpots - deletedInvCount);
      }
      this.cdRef.markForCheck();
    }, 200);
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
