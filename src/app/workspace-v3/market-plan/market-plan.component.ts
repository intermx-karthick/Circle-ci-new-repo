import {
  Component,
  OnInit,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewChecked,
  OnDestroy,
  ViewChild,
  Output,
  EventEmitter, Optional, SkipSelf, Inject
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import {
  SubProject,
  MarketPlanTargets,
  WorkflowLables,
  PlanViewState
} from '@interTypes/workspaceV2';
import { MarketPlanService } from '../market-plan.service';
import { pipe, Subject } from 'rxjs';
import { CommonService, LoaderService, ThemeService } from '@shared/services';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { CustomizeColumnV3Component } from '@shared/components/customize-column-v3/customize-column-v3.component';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { Helper } from 'app/classes';
import { ApplyFilterModel, OverlayListInputModel } from '@shared/components/overlay-list/overlay-list.model';

@Component({
  selector: 'app-market-plan',
  templateUrl: './market-plan.component.html',
  styleUrls: ['./market-plan.component.less'],
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketPlanComponent
  implements OnInit, AfterViewChecked, OnDestroy {
  // @Input() planData: any;
  @Input() public projectOwnerEmail: any;
  @Input() public userEmail: any;
  @Input() public scenarioId: string;
  @Output() toggleSideNav: EventEmitter<any> = new EventEmitter();
  @Output() public planJobStatus:EventEmitter<any> = new EventEmitter();
  @ViewChild(MatSort) sort: MatSort;
  displayedColumns: string[] = [
    'accordion',
    'planId',
    'audience',
    'market',
    'trp',
    'reach',
    'reachNet',
    'frequency',
    'targetInMarketImp',
    'targetImp',
    'totalImp',
    'isLoader',
    'action'
  ];
  private displayNames = {
    accordion: 'Accordion',
    planId: 'Plan ID',
    Package: 'Package',
    audience: 'Audience',
    market: 'Market',
    trp: 'TRP',
    reach: 'Reach %',
    reachNet: 'Reach Net',
    frequency: 'Frequency',
    targetInMarketImp: 'Target In-Mkts Imp.',
    targetImp: 'Target Imp.',
    totalImp: 'Total Imp.',
    isLoader: 'isLoader',
    action: 'Action'
  };

  private defaultColumns = [
    { displayname: 'Plan ID', field_name: 'planId' },
    { displayname: 'Audience', field_name: 'audience' },
    { displayname: 'Market', field_name: 'market' },
    { displayname: 'TRP', field_name: 'trp' },
    { displayname: 'Reach %', field_name: 'reach' },
    { displayname: 'Reach Net', field_name: 'reachNet' },
    { displayname: 'Frequency', field_name: 'frequency' },
    { displayname: 'Target In-Market Imp', field_name: 'targetInMarketImp' },
    { displayname: 'Target Imp', field_name: 'targetImp' },
    { displayname: 'Total Imp', field_name: 'totalImp' },
  ];

  dataSource = new MatTableDataSource([]);
  isExpantedId: string;
  fDatas = [];

  // storing expanded rows ids.
  public expandedRowSets = new Set();

  isSearchHide = true;
  public labels: WorkflowLables;
  public audiences: any = [];
  public audiencesForFilter: OverlayListInputModel[] = [];
  public isLoader = false;
  private planMarkets: any = [];
  private mediaTypeGroup: any;
  public goalFormData: any;
  private operators: any;
  private nameParts = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private unSubscribe: Subject<void> = new Subject<void>();
  public sortable = [];
  public duplicateDisplayedColumns: any;
  public isOMG: boolean;
  // The var is for setting the plan view by Media(0) or Operator(1)
  public plansViewState: PlanViewState[] = [];
  public editPlan$: Subject<string> = new Subject<string>();
  public updatePlan$: Subject<string> = new Subject<string>();
  public isAudienceFilterOpen = false;
  public isPlanFilterOpen = false;
  public audienceOverlayOrigin: CdkOverlayOrigin;
  public plansFilterOverlayOrigin: CdkOverlayOrigin;
  public plansList: any = [];
  public hoveredRowId = null;
  public defaultSort = 'Package';
  private lastestUpdatedPlanId = '';
  public searchFilterApplied = false;
  public selectedIndex:number = -1;
  public isDialogOpened = false;
  public activeSort: MatSortable = {
    id: 'Package',
    start: 'asc',
    disableClear: true
  };
  public sortDirection = 'asc';
  public refreshMarketList$: Subject<any> = new Subject();
  public isInitialCallCalledOnFullScreen = 3;
  public isFullScreen = false;
  public selectedAudiences: any = [];
  public selectedPlans: any = [];
  public overlayPlanList: OverlayListInputModel[] = [];
  public searchPlanLabel: string = 'Search Plans';
  constructor(
    public dialog: MatDialog,
    private commonService: CommonService,
    private cdRef: ChangeDetectorRef,
    private marketPlanService: MarketPlanService,
    public loaderService: LoaderService,
    public themeService: ThemeService,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<MarketPlanComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public injectedData: any,
  ) {
    this.labels = this.commonService.getWorkFlowLabels();
  }

  ngOnInit(): void {
    if (this.dialogRef !== null) {
      this.isFullScreen = true;
    }
    if (this.setupForOnMaximize()) {
      return;
    }
    // we will use these data from normal screen component context while on maximize
    if (!this.isDialogOpened) {
      this.dataSource.data = this.fDatas;
      const themeSettings = this.themeService.getThemeSettings();
      if (themeSettings && themeSettings.site === 'omg') {
        this.isOMG = true;
        this.defaultColumns[0].field_name = 'package';
        this.defaultColumns[0].displayname = 'Package';
        this.displayedColumns[1] = 'package';
        this.defaultSort = 'package';
        this.displayNames['planId'] = 'Package';
      }
      this.duplicateDisplayedColumns = [...this.displayedColumns];
    }
    this.marketPlanService
      .getTargetData()
      .subscribe((targetData: MarketPlanTargets) => {
        // forcing to stop further for 1st time on full screen
        // due to all data will set up by clone function
        if (this.isDialogOpened && this.isInitialCallCalledOnFullScreen > 0) {
          this.isInitialCallCalledOnFullScreen--;
          return;
        }
        this.audiences = targetData.audiences;
        this.audiencesForFilter = this.getOverlayAudienceList(targetData?.audiences);
        this.planMarkets = targetData.markets;
        this.goalFormData = targetData.goals;
        this.operators = targetData.operators;
        this.mediaTypeGroup = Object.assign([], targetData.mediaTypeFilters);
      });
    this.marketPlanService.latestUpdatedPlanId.pipe(takeUntil(this.unSubscribe)).subscribe((id) => {
      this.lastestUpdatedPlanId = id;
    })
    this.marketPlanService.getPlans()
      .subscribe((plans) => {
      if (plans) {
        // forcing to stop further for 1st time on full screen
        // due to all data will set up by clone function
        if (this.isDialogOpened && this.isInitialCallCalledOnFullScreen > 0) {
          this.isInitialCallCalledOnFullScreen--;
          return;
        }
        this.isLoader = false;
        this.fDatas = [];
        if (this.sort && !this.sort?.active) {
          this.sort.sort({ id: this.defaultSort, start: 'asc', disableClear: false });
        }
        this.cdRef.markForCheck();
        this.formatPlanList(
          Object.assign([], plans),
          this.audiences,
          this.planMarkets,
          this.mediaTypeGroup
        );
      }
    });
  }

  formatPlanList(planList, audiences, markets, mediaTypes) {
    planList.map((plan, index) => {
      // const market = markets.filter(data => data.id === plan.allocation_list[0].measures.target_geo);
      // const audience = audiences.filter(data => data.id === Number(plan.allocation_list[0].measures.target_segment));
      const list = {};
      list['isLoader'] = true;
      // common values
      list['plan'] =
        (plan.query.market['name'] || '') +
        ', ' +
        plan.query['audience']['name'] || '';
      list['audience'] = plan.query['audience']['name'] || '';
      list['measuresRelease'] = plan.query['audience']['measuresRelease'] || 2020;
      list['id'] = index;
      list['market'] = plan.query.market.name;
      list['markets'] = this.getFormattedMarkets(plan.query.market);
      list['audienceId'] = plan.query['audience']['id'];
      list['marketId'] = plan.query['market']['id'];
      list['query'] = plan.query;
      list['totalMarketInventoryInfo'] = plan['totalMarketInventoryInfo'];
      // if (this.planData['queries'][index]) {
      //   list['query'] = this.planData['queries'][index];
      // } else {
      //   list['query'] = this.goalFormData;
      // }
      list['spots'] = null;
      list['reach'] = null;
      list['frequency'] = null;
      list['trp'] = null;
      list['reachNet'] = null;
      list['targetInMarketImp'] = null;
      list['targetImp'] = null;
      list['totalImp'] = null;
      /*if (plan.plan.allocation_list) {
        plan.plan.allocation_list.map(allocate => {
          const measuresData = allocate['measures'];
          if (this.goalFormData['effectiveReach'] && Number(this.goalFormData['effectiveReach']) === 3) {
            if (measuresData.eff_reach_pct !== null) {
              list['reach'] += measuresData.eff_reach_pct;
            }
            if (measuresData.eff_freq_avg !== null) {
              list['frequency'] += measuresData.eff_freq_avg;
            }
          } else {
            if (measuresData.reach_pct !== null) {
              list['reach'] += measuresData.reach_pct;
            }
            if (measuresData.freq_avg !== null) {
              list['frequency'] += measuresData.freq_avg;
            }
          }
          if (measuresData.trp !== null) {
            list['trp'] += measuresData.trp;
          }
          list['isLoader'] = false;
        });
      }*/
      // checking if total summaries data
      if (plan.plan.summaries && plan.plan.summaries.total) {
        const measures = plan.plan.summaries.total['measures'];
        if (
          this.goalFormData?.effectiveReach &&
          Number(this.goalFormData['effectiveReach']) === 3
        ) {
          list['reach'] = measures.eff_reach_pct;
          list['reachNet'] = measures.eff_reach_net;
          list['frequency'] = measures.eff_freq_avg;
        } else {
          list['reach'] = measures.reach_pct;
          list['reachNet'] = measures.reach_net;
          list['frequency'] = measures.freq_avg;
        }
        list['targetInMarketImp'] = measures.imp_target_inmkt;
        list['targetImp'] = measures.imp_target;
        list['totalImp'] = measures.imp;
        list['trp'] = measures.trp;
        list['isLoader'] = false;
      } else {
        list['reach'] = '';
        list['frequency'] = '';
        list['trp'] = '';
        list['reachNet'] = '';
        list['targetInMarketImp'] = '';
        list['targetImp'] = '';
        list['totalImp'] = '';
      }
      list['planData'] = plan.plan;
      list['mediaTypes'] = mediaTypes;
      list['id'] = plan._id;
      /* if (list['reach'] || list['frequency'] || list['trp']) {
        list['isLoader'] = false;
     }*/
      // list['isOperator'] = enableOperator;
      if(plan?.query?.market?.id && plan?.query?.goals?.type === 'reach') {
        list['isLoader'] = false;
      }
      this.fDatas.push(list);
    });
    this.loadPlans();
  }

  ngAfterViewChecked() {
    this.dataSource.sort = this.sort;
    this.cdRef.detectChanges();
  }
  getFormattedMarkets(market) {
    let markets = [];
    if (market['id'] !== '') {
      markets.push({
        id: market['id'],
        name: market['name']
      });
    } else {
      markets.push(...market['marketsGroup']);
    }
    return markets;
  }
  loadPlans() {
    const allData = [];
    if (typeof this.audiences !== 'undefined') {
      this.audiences.map((audience, audienceIndex) => {
        const planList = this.fDatas.filter((list) => {
          return (
            list.audienceId === audience.id && list.audience === audience.name && (!audience['measuresRelease'] || list.measuresRelease === audience['measuresRelease'])
          );
        });
        const selectedChar = Math.min(Math.max(audienceIndex, 0), 25);
        const label = this.nameParts.charAt(selectedChar);
        planList.map((list, index) => {
          list['measuresRelease'] = audience['measuresRelease'] ? audience['measuresRelease'] : 2020;
          list['planId'] = index + 1 + label;
          list['package'] = index + 1 + label;
          allData.push(list);
        });
      });
      this.fDatas = allData;
      this.plansList = allData;
      this.overlayPlanList = this.getOverlayPlanList();
      // Now everytime when we update single we are reloading all the plans and it caused the issue IMXUIPRD-3201
      // To fix this issue I added a condition to update only modified plan in dataSource. This is temporary fix.
      if (this.lastestUpdatedPlanId) {
        const index = this.dataSource.data.findIndex((plan) => plan.id === this.lastestUpdatedPlanId);
        const planIndex = allData.findIndex((plan) => plan.id == this.lastestUpdatedPlanId);
        if (index > -1 && planIndex > -1) {
          this.dataSource.data[index] = allData[planIndex];
        } else {
          this.dataSource.data = allData;
        }
      } else {
        this.dataSource.data = allData;
      }
      this.planJobStatus.emit(allData.some((each) => each?.['isLoader']));
      this.cdRef.markForCheck();
    }
  }

  updateParentPlanTotal(currentPlan, planData) {
    const plan = currentPlan['plan'];
    const changes = currentPlan['changes'];
    planData['reach'] = '';
    planData['frequency'] = '';
    planData['trp'] = '';
    planData['targetInMarketImp'] = '';
    planData['targetImp'] = '';
    planData['totalImp'] = '';
    planData['reachNet'] = '';
    /*if (plan['reach'] !== '') {
      planData['reach'] = planData['reach'] - Number(plan['reach']);
    }
    if (plan['frequency'] !== '') {
      planData['frequency'] = planData['frequency'] - Number(plan['frequency']);
    }
    if (plan['spots'] !== '') {
      planData['spots'] = planData['spots'] - Number(plan['spots']);
    }
    if (plan['trp'] !== '') {
      planData['trp'] = planData['trp'] - Number(plan['trp']);
    }
    if (typeof planData[changes['field']] !== 'undefined') {
      planData[changes['field']] += Number(changes['value']);
    }*/
  }

  ngOnDestroy() {
    localStorage.removeItem('marketPlanData');
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  compareObjects(o1: any, o2: any): boolean {
    if (o1 && o2) {
      return o1.id === o2.id && o1.name === o2.name;
    }
  }

  public customizeColumn() {
    const currentSortables = this.displayedColumns.map((name) => {
      return {
        displayname: name !== 'package' ? this.displayNames[name] : 'Package',
        field_name: name
      };
    });
    currentSortables.splice(currentSortables.length - 1, 1);
    currentSortables.splice(0, 1);

    const currentSortablesLoaderIndex = currentSortables.findIndex(
      (column) => column.field_name === 'isLoader'
    );
    if (currentSortablesLoaderIndex > -1) {
      currentSortables.splice(currentSortablesLoaderIndex, 1);
    }

    const sortableIsLoaderIndex = this.sortable.findIndex(
      (column) => column.field_name === 'isLoader'
    );
    if (sortableIsLoaderIndex > -1) {
      this.sortable.splice(sortableIsLoaderIndex, 1);
    }

    const defaultColumns = this.displayedColumns.map((name) => {
      return { displayname: this.displayNames[name], field_name: name };
    });

    const ref = this.dialog.open(CustomizeColumnV3Component, {
      data: {
        sortables: Object.assign([], this.sortable),
        currentSortables: Object.assign([], currentSortables),
        origin: 'workspace',
        defaultColumns: this.defaultColumns
      },
      width: '540px',
      closeOnNavigation: true,
      panelClass: 'audience-browser-container',
      disableClose: true
    });
    ref.afterClosed().subscribe((res) => {
      if (res && res.action !== 'close') {
        let sortableColumn = [];
        let displayedColumns = [...this.duplicateDisplayedColumns];
        displayedColumns.splice(displayedColumns.length - 1, 1);
        displayedColumns.splice(0, 1);
        res.currentSortables.forEach((data) => {
          sortableColumn.push(data.field_name);
          displayedColumns.forEach((data1, index) => {
            if (data1 === data.field_name) {
              displayedColumns.splice(index, 1);
            }
          });
        });

        /** Added to set default columns when user choosed empty cells */
        if (!sortableColumn.length) {
          sortableColumn = [...displayedColumns];
          sortableColumn.splice(sortableColumn.findIndex(each => each == 'isLoader'), 1);
          displayedColumns = [];
        }
        const sortable = displayedColumns.map((data) => {
          return {
            displayname: data !== 'package' ? this.displayNames[data] : 'Package',
            field_name: data
          };
        });
        this.sortable = sortable;
        sortableColumn.unshift('accordion');
        sortableColumn.push('isLoader');
        sortableColumn.push('action');
        this.displayedColumns = sortableColumn;
        this.cdRef.detectChanges();
      }
    });
  }

  public editPlan(plan, index) {
    this.selectedIndex = index;
    this.editPlan$.next(plan['id']);
  }

  public updatePlan(plan, index) {
    this.selectedIndex = index;
    this.updatePlan$.next(plan['id']);
  }

  /**
   * @description
   * method to validate and handle loader and export button
   *
   */
   public initLoader(emitVal) {
    if(this.selectedIndex < 0 || !emitVal) return;
    this.dataSource.data[this.selectedIndex]['isLoader'] = true;
    this.planJobStatus.emit(true);
    this.selectedIndex = -1;
  }

  public trackFilters(index, item) {
    return item;
  }

  public planAudienceCombinedFilter(): void {
    const audienceCount = this.audiences?.length;
    const plansCount = this.fDatas?.length;
    let filterData = this.fDatas;
    this.searchFilterApplied = false;
    if (audienceCount && plansCount) {
      const selectedPlanIds = this.selectedPlans.map(plan => plan.planId);
      const selectedAudienceIds = this.selectedAudiences.map(audience => audience.id);
      if (selectedPlanIds && selectedPlanIds.length) {
        this.searchFilterApplied = true;
        filterData = filterData.filter((plan) => {
          return selectedPlanIds.includes(plan.planId);
        });
      }
      if (selectedAudienceIds && selectedAudienceIds.length) {
        this.searchFilterApplied = true;
        filterData = filterData.filter((item) => {
          return selectedAudienceIds.includes(item.audienceId);
        });
      }
    }
    this.dataSource.data = filterData;
  }

  public openFilter() {
    this.toggleSideNav.emit();
  }

  public onHoverRow(rowId) {
    this.hoveredRowId = rowId;
  }

  public onHoverOut() {
    this.hoveredRowId = null;
  }

  // This method will check and update the plan viewBy state(Media/Operator)
  // TODO: Currently API won't support to save it.
  public updatePlansViewState(data: PlanViewState) {
    const index = this.plansViewState.findIndex(
      (view) => view.planId === data.planId
    );
    if (index > -1) {
      this.plansViewState[index] = data;
    } else {
      this.plansViewState.push(data);
    }
  }

  public openMarketSummaryInDialog() {
    this.dialog
      .open(MarketPlanComponent, {
        disableClose: true,
        data: {
          dialogOpened: true,
          self: this,
        },
        autoFocus: false,
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'market-plan-dialog-fullscreen'
      })
      .afterClosed()
      .subscribe(({ self }) => {
        this.clone(self);
        this.dialogRef = null;
        this.isDialogOpened = false;
        this.injectedData = null;

        if (
          this.sort.active !== self.sort.active ||
          this.sort.direction !== self.sort.direction
        ) {
          this.refreshSort(self);
          this.sort.sort(this.activeSort);
        }

        this.cdRef.detectChanges();
      });
  }

  public closeDialogBox(skipSetup = false) {
    this.dialogRef.close({ self: this });
  }

  private setupForOnMaximize() {
    if (!!this.injectedData?.dialogOpened) {
      this.isDialogOpened = true;
      this.clone(this.injectedData?.self);
      this.refreshSort(this.injectedData.self);
      delete this.injectedData.self;
      return false;
    }
  }
  private refreshSort(self) {
    this.activeSort = {
      id: self.sort?.active,
      start: self.sort?.direction as 'asc' | 'desc',
      disableClear: true
    };
    this.defaultSort = this.activeSort.id;
    this.sortDirection = this.activeSort.start;
  }

  private clone(self: MarketPlanComponent){
    this.displayedColumns = Helper.deepClone(self.displayedColumns);
    this.displayNames = Helper.deepClone(self.displayNames);
    this.dataSource.data = Helper.deepClone(self.dataSource.data);
    this.fDatas = Helper.deepClone(self.fDatas);
    this.selectedAudiences = self.selectedAudiences;
    this.expandedRowSets = new Set(
      Helper.deepClone(Array.from(self.expandedRowSets.values()))
    );
    this.isSearchHide = self.isSearchHide;
    this.audiences = Helper.deepClone(self.audiences);
    this.audiencesForFilter = Helper.deepClone(self.audiencesForFilter);
    this.planMarkets = Helper.deepClone(self.planMarkets);
    this.nameParts = self.nameParts;
    this.sortable = Helper.deepClone(self.sortable);
    this.plansViewState = Helper.deepClone(self.plansViewState);
    this.plansList = Helper.deepClone(self.plansList);
    this.overlayPlanList =  self.overlayPlanList;
    this.selectedPlans = self.selectedPlans;
    this.defaultSort = self.defaultSort;
    this.labels = Helper.deepClone(self.labels);
    this.projectOwnerEmail = self.projectOwnerEmail;
    this.userEmail = self.userEmail;
    this.isOMG = self.isOMG;
    this.duplicateDisplayedColumns = Helper.deepClone(self.duplicateDisplayedColumns);
    this.goalFormData = Helper.deepClone(self.goalFormData);
    this.operators = Helper.deepClone(self.operators);
    this.mediaTypeGroup = Helper.deepClone(self.mediaTypeGroup);
    this.scenarioId = self.scenarioId
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

  private getOverlayPlanList(): OverlayListInputModel[] {
    const planNameStr = (this.isOMG) ? 'Package' : 'Plan';
    this.searchPlanLabel = (this.isOMG) ? 'Search Packages' : 'Search Plans';
    return this.plansList.map((plan) => { return { label: `${planNameStr} ${plan.planId}`, value: plan } as OverlayListInputModel; });
  }

  private getOverlayAudienceList(audiences: any[] = []): OverlayListInputModel[] {
    const uniqueAudiences = [...new Set(audiences.map(aud => aud.id))];
    return uniqueAudiences.map(id => { 
      const audience = audiences.find(aud => aud.id === id);
      const { name } = audience;
      return { value: audience, label: name } as OverlayListInputModel
    });
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
