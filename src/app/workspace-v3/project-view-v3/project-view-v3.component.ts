import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
  AfterViewInit,
  Input,
  ElementRef,
  NgZone
} from '@angular/core';
import {
  catchError,
  filter,
  switchMap,
  tap,
  map,
  takeUntil,
  debounceTime, distinctUntilChanged, take
} from 'rxjs/operators';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MoveScenarioORProjectComponent } from '../move-scenario-or-project/move-scenario-or-project.component';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { PlanAbstract } from '../planabstract';
import { combineLatest, BehaviorSubject, Subject, of } from 'rxjs';
import { FormControl } from '@angular/forms';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent
} from '@angular/material/paginator';
import { IMXMatPaginator } from '@shared/common-function';
import { AuthenticationService, ThemeService } from '@shared/services';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { COMMA, ENTER, SEMICOLON } from '@angular/cdk/keycodes';
import { Helper } from 'app/classes';
import { TitleService } from '@shared/services/title.service';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { GenerateScenarioDuplicatePopupComponent } from '../generate-scenario-duplicate-popup/generate-scenario-duplicate-popup.component';
import { Market, MarketPlan, Plan, Query } from '@interTypes/workspaceV2';
import { Filter } from '@interTypes/filter';
import { MarketPlanService } from '../market-plan.service';
import { InventoryPlanJobStatus, Patterns, ScenarioPlanLabels } from '@interTypes/enums';
import { NotificationsService } from 'app/notifications/notifications.service';
import { Notification } from '@interTypes/Notifications';
import { ApplyFilterModel, OverlayListInputModel } from '@shared/components/overlay-list/overlay-list.model';

@Component({
  selector: 'app-project-view-v3',
  templateUrl: './project-view-v3.component.html',
  styleUrls: ['./project-view-v3.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MatPaginatorIntl, useClass: IMXMatPaginator }]
})
export class ProjectViewV3Component extends PlanAbstract
  implements OnInit, OnDestroy, AfterViewInit {
  public project: any = {};
  public projectScenarios: any = {};
  public sortedScenarios: MatTableDataSource<any>;
  public labels = this.workspaceService.workSpaceLabels;
  public columns = {
    name: `${this.labels.scenario[0]} Name`,
    type: 'Type',
    action: 'Action',
    createdAt: 'Date Created',
    updatedAt: 'Date Updated',
    description: 'Description',
    units: 'Spots',
    audiences: 'Audience',
    market: 'Markets',
  };
  public displayedColumns: string[] = [
    'name',
    'action',
    'type',
    'createdAt',
    'updatedAt',
    'description',
    'units',
    'audiences',
    'market',
  ];
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  public hoveredIndex = null;
  public menuOpened: boolean;
  public projectId;
  public scenarioNameFC: FormControl = new FormControl();
  public isSearchBarActive = false;
  public audienceOverlayOrigin: CdkOverlayOrigin;
  public marketOverlayOrigin: CdkOverlayOrigin;
  public typeOverlayOrigin: CdkOverlayOrigin;
  private deleteScenario$: BehaviorSubject<any> = new BehaviorSubject('');
  protected unSubscribe: Subject<void> = new Subject<void>();

  public projectPermission: any;
  public userEmail: any;
  disableSort: boolean;
  previousSort;
  public projectForm: FormGroup;
  public nameValidError: String = 'Required';
  public scenarioKeysCodes = [ENTER, COMMA, SEMICOLON];
  public tags: any = [];
  public isEdit = false;
  projectTooltip: string;
  projectTagActive = false;
  public paginationSizes = [10];
  public isPlanFilterOpen = false;
  public isMarketFilterOpen = false;
  public isAudienceFilterOpen = false;
  public isTypeFilterOpen = false;
  @Input() sandboxProjectId: string;
  @Input() loadedFromSelector: false;
  public audiences: any = [];
  public markets: any = [];
  public types: any = [
    { id: ScenarioPlanLabels.INVENTORY_PLAN, name: 'Inventory Plan' },
    { id: ScenarioPlanLabels.MARKET_PLAN, name: 'Market Plan' }
  ];
  themeSettings: any;
  clientId: any;
  fDatas = [];
  public planTabLabels = ScenarioPlanLabels;
  static getSnackBarConfig(): MatSnackBarConfig {
    return {
      duration: 5000
    };
  }
  public searchFilterApplied = false;
  @ViewChild('tableScrollRef', {read: ElementRef, static:false}) tableScrollRef: ElementRef;
  public hasHorizontalScrollbar = false;
  @ViewChild(MatTable) table: MatTable<any>;
  @Input() public onOpenTab$: Subject<any> = new Subject();

  public typesList = this.types.map(category => {
    const { name } = category;
    return { value: category, label: name } as OverlayListInputModel
  });
  public selectedTypes: any = [];
  public selectedAudiences: any = [];
  public selectedMarkets: any = [];
  public audiencesList: OverlayListInputModel[] = [];
  public marketsList: OverlayListInputModel[] = [];

  constructor(
    private activeRoute: ActivatedRoute,
    public workspaceService: WorkspaceV3Service,
    public matDialog: MatDialog,
    public router: Router,
    public snackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef,
    private auth: AuthenticationService,
    private fb: FormBuilder,
    private titleService: TitleService,
    private matSnackBar: MatSnackBar,
    public themeService: ThemeService,
    public marketPlanService: MarketPlanService,
    private notifications: NotificationsService,
    private ngZone: NgZone// This is used to update the sticky column position
  ) {
    super(
      workspaceService,
      matDialog,
      router,
      snackBar,
      themeService,
      marketPlanService
    );
  }

  ngOnInit(): void {
    this.reSize();
    this.checkForNotificationUpdate();
    this.pageType = 'projectView';
    this.themeSettings = this.themeService.getThemeSettings();
    this.clientId = this.themeSettings.clientId;
    // TODO - Have to remove once view confirmed for sandbox and client's project view
    // if (this.loadedFromSelector) {
    //   this.displayedColumns.splice(3, 1);
    // }
    this.projectForm = this.fb.group({
      name: new FormControl('', [
        Validators.required,
        CustomValidators.noWhitespaceValidator(true)
      ]),
      tags: [[]],
      description: new FormControl(null)
    });
    this.sortedScenarios = new MatTableDataSource([]);
    this.projectPermission = this.auth.getModuleAccess('v3workspace');
    const userData = this.auth.getUserData();
    this.userEmail = userData['email'] ? userData['email'] : '';
    this.getProjects();
    this.filterScenarioBySearch();
    // this.titleService.updateTitle(this.labels['project'][1]);
    this.onOpenTab$.pipe(takeUntil(this.unSubscribe)).subscribe((res) => {
      if (res?.openTab) {
        setTimeout(() => {
          this.reSize();
        }, 200);
      }
    });
  }
  private checkForNotificationUpdate() {
    this.notifications.refreshViewOnNottificationUpdate()
      .pipe(map((notifications: Notification[]) => {
        return Helper.removeDuplicate(notifications.map((notification: Notification) => notification?.moduleData?.scenarioId));
      }), takeUntil(this.unSubscribe)).subscribe((scenarioIds) => {
        if (scenarioIds?.length && this.fDatas?.length) {
          for (const scenario of this.fDatas) {
            if (scenarioIds.includes(scenario['_id']) && scenario.job.status === InventoryPlanJobStatus.IN_PROGRESS) {
              this.getProjects();
              return
            }
          }
        }
      });
  }
  getProjects() {
    const projectObs$ = this.activeRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        if (params.get('id')) {
          this.projectId = params.get('id');
        } else {
          this.projectId = this.sandboxProjectId;
        }
        return this.workspaceService.getProjectDetails(this.projectId);
      })
    );
    combineLatest([projectObs$, this.deleteScenario$.asObservable()])
      .pipe(
        map(([project, deletedScenario]) => {
          if (!deletedScenario) {
            return project;
          }
          // remove the deleted scenario from the project scenario list
          project['scenarios'] = project['scenarios'].filter(
            (scenario) => scenario['_id'] !== deletedScenario['_id']
          );
          return project;
        }),
        takeUntil(this.unSubscribe)
      )
      .subscribe((project) => {
        if (project?._id) {
          this.project = project;
          this.makeTooltip(this.project);
          this.setPaginationSizes(project?.scenarioCount);

          this.getDataForFilter();

          // this.titleService.updateTitle(project?.name ?? this.labels['project'][0]);
          this.sortedScenarios.data = project?.scenarios ?? [];
          this.fDatas = project?.scenarios ?? [];
          this.reSize();
          // scenarios  list default sorted by recent created date

          if (!this.previousSort) {
            // this.sort.sort({ id: 'createdAt', start: 'desc', disableClear: false });
            // (this.sort.sortables.get(
            //   'createdAt'
            // ) as MatSortHeader)._setAnimationTransitionState({
            //   toState: 'active'
            // });
            // TODO - Have to remove once view confirmed for sandbox and client's project view
            // if (!this.loadedFromSelector) {
            //   this.sort.sort({ id: 'updatedAt', start: 'desc', disableClear: false });
            //   (this.sort.sortables.get(
            //     'updatedAt'
            //   ) as MatSortHeader)._setAnimationTransitionState({
            //     toState: 'active'
            //   });
            // }
            this.sort.sort({ id: 'updatedAt', start: 'desc', disableClear: false });
            (this.sort.sortables.get(
              'updatedAt'
            ) as MatSortHeader)._setAnimationTransitionState({
              toState: 'active'
            });
          } else {
            this.sortData({
              active: this.previousSort?.id,
              direction: this.previousSort?.start
            });
          }
          this.projectForm.patchValue({
            name: this.project?.name ?? '',
            description: this.project?.description ?? null,
            tags: this.project?.tags ?? []
          });
          this.tags = this.project?.tags ?? [];
          this.reSize();
          this.cdRef.markForCheck();
        } else {
          this.snackBar.open(`${this.labels.project[0]} does not exist.`, 'DISMISS', {
            duration: 3000
          })
            .afterDismissed()
            .subscribe(() => {
              this.router.navigateByUrl(`workspace-v3/projects/list`);
            });
        }
      });
  }
  public reSize(){
    if(window.innerWidth<1550){
      this.hasHorizontalScrollbar = true;
    }else{
      this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
    }
    this.ngZone?.onMicrotaskEmpty.pipe(take(3)).subscribe(() => this.table?.updateStickyColumnStyles());
  }
  openMoveScenarioDialog(row) {
    this.matDialog
      .open(MoveScenarioORProjectComponent, {
        panelClass: 'imx-mat-dialog',
        width: '500px',
        data: {
          type: 'scenarios',
          id: row?._id,
          projectId: this.projectId
        }
      })
      .afterClosed()
      .pipe(filter((data) => data?.status === 'success'))
      .subscribe((data) => {
        const originalScenarios = Helper.deepClone(this.project.scenarios);
        const sortedScenarios = Helper.deepClone(this.sortedScenarios.data);
        const index = originalScenarios.findIndex(
          (scenario) => scenario['_id'] === row?._id
        );
        const sortedIndex = sortedScenarios.findIndex(
          (scenario) => scenario['_id'] === row?._id
        );
        originalScenarios.splice(index, 1);
        sortedScenarios.splice(sortedIndex, 1);
        this.project.scenarios = originalScenarios;
        this.sortedScenarios.data = sortedScenarios;
        if (this.sortedScenarios.paginator) {
          this.sortedScenarios.paginator.firstPage();
        }
        this.cdRef.markForCheck();
        this.snackBar.open(`${this.labels.scenario[0]} moved successfully.`, 'DISMISS', {
          duration: 2000
        });
      });
  }

  onHoverRow(index) {
    if (!this.menuOpened) {
      this.hoveredIndex = index;
    }
  }

  onHoverOut() {
    if (!this.menuOpened) {
      this.hoveredIndex = null;
    }
  }

  onMenuOpen() {
    this.menuOpened = true;
  }

  onMenuClosed() {
    this.menuOpened = false;
  }

  public deleteScenario(element) {
    // Calling Parent function
    this.deletePlan(element, '', false, () => {
      this.deleteScenario$.next(element);
    });
  }

  filterScenarioBySearch() {
    this.scenarioNameFC.valueChanges
      .pipe(
        takeUntil(this.unSubscribe),
        debounceTime(500),
        distinctUntilChanged(),
      )
      .subscribe((searchStr) => {
        const data: Array<any> = this.project.scenarios.slice();
        const filterData = data.filter((scenario) => {
          return scenario.name.toLowerCase().includes(searchStr.toLowerCase());
        });
        this.searchFilterApplied = false;
        if (searchStr?.length > 0) {
          this.searchFilterApplied = true;
        }
        this.sortedScenarios.data = filterData;
        this.fDatas = filterData;
        this.typeAudienceMarketCombinedFilter(true);
        this.sortData(this.sort);
        if (this.sortedScenarios.paginator) {
          this.sortedScenarios.paginator.firstPage();
        }
        this.cdRef.markForCheck();
      });
  }

  getDataForFilter() {
    const data: Array<any> = this.project.scenarios.slice();
    const audiencesFilterData = [];
    const marketsFilterData = [];
    this.project.scenarios.map((scenario) => {
      scenario.audiences.map((audience) => {
        audience['measuresRelease'] = audience?.measuresRelease || 2020;
        audiencesFilterData.push(audience);
      });
      scenario.market.map((marketData) => {
        marketsFilterData.push(marketData);
      });
    });
    const uniqueAudiences = Array.from(new Set(audiencesFilterData.map(audience => (audience?.measuresRelease || 2020) +'-'+audience.name)))
      .map(name => {
        const filteredAudience = audiencesFilterData.find(audience => (audience.measuresRelease +'-'+ audience.name) === name);
        return {
          name: filteredAudience.name,
          id: filteredAudience.id,
          measuresRelease: filteredAudience.measuresRelease || 2020
        };
      });
    const uniqueMarkets = Array.from(new Set(marketsFilterData.map(market => market.id)))
      .map(id => {
        const market = marketsFilterData.find(audience => audience.id === id);
        return {
          id: id,
          name: market.name
        };
      });
    this.audiences = uniqueAudiences;
    this.markets = uniqueMarkets;
    this.updateOverlayInputs();
  }

  enableSearch(event, key: string) {
    this.isSearchBarActive = true;
    this.isMarketFilterOpen = false;
    this.isAudienceFilterOpen = false;
    this.isTypeFilterOpen = false;
    event.stopPropagation();
  }

  disableSearch(event, key: string) {
    // this.sort.sort(this.previousSort);
    this.scenarioNameFC.patchValue('');
    this.isSearchBarActive = false;
    event.stopPropagation();

  }

  sortChange(event) {
    if (!(this.disableSort && event['active'] === 'name')) {
      this.sortData(event);
      this.cdRef.markForCheck();
    } else {
      this.sortData(this.previousSort);
    }
  }

  scenariosTractByFn(i: number, scenario) {
    return scenario._id;
  }

  sortData(sort: Sort) {
    const data = Helper.deepClone(this.sortedScenarios.data);
    if (!sort.active || sort.direction === '') {
      this.sortedScenarios.data = data;
      return;
    }
    this.previousSort = {
      id: sort.active,
      start: sort.direction,
      disableClear: false
    };
    const isAsc = sort.direction === 'asc';
    /** This is to display inprocess items in top table by default and when user display by updatedAt and desc */
    if (sort.active === 'updatedAt' && sort.direction === 'desc') {
      const dataDub = Helper.deepClone(data);
      const inProcessItems = dataDub
        .filter((d) => d?.job?.status && d?.job?.status === 'inProgress')
        .sort((a, b) => {
          return this.compare(
            new Date(a.updatedAt).getTime(),
            new Date(b.updatedAt).getTime(),
            false
          );
        });
      const completedItems = dataDub
        .filter((d) => !d?.job?.status || d?.job?.status !== 'inProgress')
        .sort((a, b) => {
          return this.compare(
            new Date(a.updatedAt).getTime(),
            new Date(b.updatedAt).getTime(),
            false
          );
        });
      this.sortedScenarios.data = [...inProcessItems, ...completedItems];
    } else {
      this.sortedScenarios.data = data.sort((a, b) => {
        switch (sort.active) {
          case 'name':
            return this.compare(a.name, b.name, isAsc);
          case 'type':
            return this.compare(a.type, b.type, isAsc);
          case 'createdAt':
            return this.compare(
              new Date(a.createdAt).getTime(),
              new Date(b.createdAt).getTime(),
              isAsc
            );
          case 'updatedAt':
            return this.compare(
              new Date(a.updatedAt).getTime(),
              new Date(b.updatedAt).getTime(),
              isAsc
            );
          case 'description':
            return this.compare(a.description, b.description, isAsc);
          case 'units':
            return this.compare(a.spotCount?.inventory, b.spotCount?.inventory, isAsc);
          case 'audiences':
            return this.compare(
              a.audiences.map((aud) => aud['name']).join(','),
              b.audiences.map((aud) => aud['name']).join(','),
              isAsc
            );
          case 'market':
            return this.compare(a.market, b.market, isAsc);
          default:
            return 0;
        }
      });
    }

    if (this.sortedScenarios.paginator) {
      this.sortedScenarios.paginator.firstPage();
    }
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  onFocusSearchBox() {
    this.disableSort = true;
  }

  onBlurSearchBox() {
    this.disableSort = false;
  }

  onSubmitProject(formGrp) {
    if (formGrp.valid) {
      const formatProject = {
        'name': formGrp.value.name,
        'description': formGrp?.value?.description !== '' ? formGrp?.value?.description : null,
        'tags': this.tags.length > 0 ? this.tags : null,
        'parentId': null,
        'attachments': null,
        'folders': this.project.folders.length > 0 && this.project.folders.map(folder => folder['_id']) || null,
        // 'subProjects': this.project.subProjects.length > 0
        //   && this.project.subProjects.map(subProject => subProject._id) || null, // no required sub projects from v3
        'scenarios': this.project.scenarios.length > 0 && this.project.scenarios.map(scenario => scenario['_id']) || null,
        'isSubProject': false
      };

      this.workspaceService.updateProject(this.projectId, formatProject)
        .subscribe((result) => {
          this.titleService.updateTitle(formatProject['name']);
          this.project['name'] = formatProject['name'];
          this.project['description'] = formatProject['description'];
          this.project['tags'] = formatProject['tags'];
          this.isEdit = false;
          this.makeTooltip(this.project);
          this.cdRef.markForCheck();
          this.snackBar.open(`${this.labels.project[0]} updated successfully.`, 'DISMISS', {
            duration: 2000
          });
        }, (error) => {
          if (error?.error?.code === 7041) {
            this.projectForm.get('name').setErrors({ name_exists: true });
          } else {
            let message = 'Something went wrong, Please try again later.';
            if (error?.error?.message) {
              message = error.error.message;
            }
            this.snackBar.open(message, '', { duration: 2000 });
          }
          this.cdRef.markForCheck();
        });
    }
  }

  public makeTooltip(project) {
    let message = '';
    if (project['description']) {
      message += `Description: ${project['description']}`;
    }

    const tagsString = project['tags'] !== null ? Helper.makeString(project['tags']) : '';
    if (tagsString) {
      if (message) {
        message += '<br>';
      }

      message += `Tags: ${tagsString}`;
    }

    this.projectTooltip = message;
    this.cdRef.markForCheck();
  }

  showOrHideEdit() {
    if (this.project['isDraft']) return;
    this.isEdit = !this.isEdit;
  }
  cancelEdit() {
    this.isEdit = false;
    this.projectForm.patchValue({
      name: this.project?.name ?? '',
      description: this.project?.description ?? null,
      tags: this.project?.tags ?? []
    });
    this.tags = this.project?.tags ?? [];
    this.cdRef.markForCheck();
  }
  onFocusProjectTag(flag) {
    this.projectTagActive = flag;
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  ngAfterViewInit() {
    this.sortedScenarios.paginator = this.paginator;
    this.ngZone?.onMicrotaskEmpty.pipe(take(3)).subscribe(() => this.table?.updateStickyColumnStyles());

  }


  public setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
    } else {
      this.paginationSizes = [10];
    }
  }

  public compareFilters(c1, c2) {
    return c1 && c2 && c1['id'] === c2['id'];
  }

  public trackFilters(index, item) {
    return item.id;
  }

  public closeSearchFilter() {
    const searchValue = this.scenarioNameFC.value;
    this.isSearchBarActive = false;
    if (searchValue?.length > 0) {
      this.isSearchBarActive = true;
    }
  }
  public typeAudienceMarketCombinedFilter(searchEnabled = false) {
    this.isMarketFilterOpen = false;
    this.isAudienceFilterOpen = false;
    this.isTypeFilterOpen = false;
    let filteredData = Helper.deepClone(this.fDatas);

    // combination of filters
    if (this.selectedAudiences?.length > 0 && filteredData.length > 0) {
      filteredData = this.audienceBasedFilter(
        filteredData,
        this.selectedAudiences
      );
    }
    if (this.selectedMarkets?.length > 0 && filteredData.length > 0) {
      filteredData = this.marketBasedFilter(
        filteredData,
        this.selectedMarkets
      );
    }
    if (this.selectedTypes?.length > 0 && filteredData.length > 0) {
      filteredData = this.typeBasedFilter(
        filteredData,
        this.selectedTypes
      );
    }
    this.sortedScenarios.data = filteredData;
    if (this.fDatas.length > filteredData.length) {
      this.searchFilterApplied = true;
    } else {
      this.searchFilterApplied = false;
    }
    /* if (
      selectedAudiences &&
      selectedAudiences.length > 0 &&
      selectedMarkets &&
      selectedMarkets.length > 0 &&
      selectedTypes &&
      selectedTypes.length > 0
    ) {

      marketFilteredData = this.marketBasedFilter(
        audienceFilteredData,
        selectedMarkets
      );
      typeFilteredData = this.typeBasedFilter(
        marketFilteredData,
        selectedTypes
      );
      this.sortedScenarios.data = typeFilteredData;
      this.searchFilterApplied = true;
    } else if (
      selectedAudiences &&
      selectedAudiences.length > 0 &&
      selectedMarkets &&
      selectedMarkets.length > 0
    ) {
      audienceFilteredData = this.audienceBasedFilter(
        this.fDatas,
        selectedAudiences
      );
      marketFilteredData = this.marketBasedFilter(
        audienceFilteredData,
        selectedMarkets
      );
      this.sortedScenarios.data = marketFilteredData;
      this.searchFilterApplied = true;
    } else if (
      selectedAudiences &&
      selectedAudiences.length > 0 &&
      selectedTypes &&
      selectedTypes.length > 0
    ) {
      audienceFilteredData = this.audienceBasedFilter(
        this.fDatas,
        selectedAudiences
      );
      typeFilteredData = this.typeBasedFilter(
        audienceFilteredData,
        selectedTypes
      );
      this.sortedScenarios.data = typeFilteredData;
      this.searchFilterApplied = true;
    } else if (
      selectedTypes &&
      selectedTypes.length > 0 &&
      selectedMarkets &&
      selectedMarkets.length > 0
    ) {
      marketFilteredData = this.marketBasedFilter(this.fDatas, selectedMarkets);
      typeFilteredData = this.typeBasedFilter(
        marketFilteredData,
        selectedTypes
      );
      this.sortedScenarios.data = typeFilteredData;
      this.searchFilterApplied = true;
    } else if (selectedAudiences && selectedAudiences.length > 0) {
      audienceFilteredData = this.audienceBasedFilter(
        this.fDatas,
        selectedAudiences
      );
      this.sortedScenarios.data = audienceFilteredData;
      this.searchFilterApplied = true;
    } else if (selectedMarkets && selectedMarkets.length > 0) {
      marketFilteredData = this.marketBasedFilter(this.fDatas, selectedMarkets);
      this.sortedScenarios.data = marketFilteredData;
      this.searchFilterApplied = true;
    } else if (selectedTypes && selectedTypes.length > 0) {
      typeFilteredData = this.typeBasedFilter(this.fDatas, selectedTypes);
      this.sortedScenarios.data = typeFilteredData;
      this.searchFilterApplied = true;
    } else {
      this.sortedScenarios.data = this.fDatas;
      if (!searchEnabled) {
        this.searchFilterApplied = false;
      }
    } */

    this.cdRef.markForCheck();
    if (this.sortedScenarios.paginator) {
      this.setPaginationSizes(this.sortedScenarios?.data?.length)
      this.sortedScenarios.paginator.firstPage();
    }
    this.sortData(this.sort);
  }

  marketBasedFilter(rawData, filterObj) {
    const result = [];
    if (filterObj.length > 0) {
      const markets = filterObj.map((obj) => obj.id);
      rawData.map((scenario) => {
        if(scenario.market.filter((market) => markets.includes(market.id)).length > 0) {
          result.push(scenario);
        }
      });
    }
    return result;
  }

  audienceBasedFilter(rawData, filterObj) {
    const result = [];
    if (filterObj.length > 0) {
      const audiences = filterObj.map((obj) => {
        return {
          name: obj.name,
          measuresRelease: obj.measuresRelease
        }
      });
      rawData.map((scenario) => {
        // audiences.includes(aud.name)
        if(scenario.audiences.filter((aud) =>
          audiences.filter((a) => a.name === aud.name && a.measuresRelease === aud.measuresRelease).length > 0
        ).length > 0) {
          result.push(scenario);
        }
      });
    }
    return result;
  }

  typeBasedFilter(rawData, filterObj) {
    const result = [];
    if (filterObj.length > 0) {
      const types = filterObj.map((obj) => obj.id);
      rawData.map((scenario) => {
        if (types.includes(scenario.type)) {
          result.push(scenario);
        }
      });
    }
    return result;
  }

  public onGeneratePlanData(scenarioObj) {
    const goals = {
      trp: 200,
      reach: null,
      frequency: 0,
      imp: null,
      type: 'trp',
      duration: scenarioObj.delivery_period_weeks ? scenarioObj.delivery_period_weeks : 1,
      effectiveReach: 1,
      allocationMethod: 'equal'
    };
    const plans: Plan[] = [];
    scenarioObj.audiences.forEach((audience: Filter) => {
      scenarioObj.market.forEach((market: Market) => {
        const marketData: Market = {
          id: market.id,
          name: market.name,
          marketsGroup: market['marketsGroup'] || []
        };
        const query: Query = {
          audience: audience,
          market: marketData,
          operators: scenarioObj?.operators?.data,
          goals: goals,
          mediaTypeFilters: this.marketPlanService.cleanMediaTypeData(
            scenarioObj?.mediaTypeFilters?.data
          ),
          measureRangeFilters: scenarioObj?.measureRangeFilters?.data,
          mediaAttributes: scenarioObj?.mediaTypeFilters?.data,
          locationFilters: scenarioObj?.locationFilters?.data
        };
        if (query.operators && query.operators.length === 0) {
          delete query['operators'];
        }
        plans.push({
          query: query
        });
      });
    });
    const markets = scenarioObj.market.map((i) => {
      return {
        id: i.id,
        name: i.name,
        marketsGroup: i['marketsGroup'] || []
      };
    });
    const marketPlan: MarketPlan = {
      targets: {
        audiences: scenarioObj.audiences,
        markets: markets,
        goals: goals,
        mediaTypeFilters: this.marketPlanService.cleanMediaTypeData(
          scenarioObj?.mediaTypeFilters?.data
        ),
        operators: scenarioObj?.operators?.data,
        measureRangeFilters: scenarioObj?.measureRangeFilters?.data,
        locationFilters: scenarioObj?.locationFilters?.data
      },
      plans: plans
    };
    if (
      marketPlan.targets.operators &&
      marketPlan.targets.operators.length === 0
    ) {
      delete marketPlan.targets.operators;
    }
    return marketPlan;
  }

  /* generatePlan(scenario, type) {
    let url;
    if (type === ScenarioPlanLabels.MARKET_PLAN) {
      this.workspaceService
        .getScenarioMediaTypes(scenario['_id'])
        .pipe(map((mediaType) => mediaType['mediaTypeFilters']))
        .subscribe((mediaTypes) => {
          console.log('mediaTypes from API', mediaTypes);
          const mediaTypeFilters = {
            enabled: true,
            data: mediaTypes
          }
          console.log('mediaTypeFilters', mediaTypeFilters);
          if (
            scenario?.audiences?.length > 0 &&
            scenario?.market?.length > 0 &&
            mediaTypeFilters?.data?.length > 0 &&
            scenario?.delivery_period_weeks
          ) {
            scenario['mediaTypeFilters'] = mediaTypeFilters;
            this.createAndGeneratePlanViceVersa(scenario, type);
          } else {
            url = `/workspace-v3/plan/create?projectId=${this.projectId}&scenarioId=${scenario?._id}`;
            this.router.navigateByUrl(url);
          }
        });
    } else {
      if (scenario?.audiences?.length > 0 && scenario?.market?.length > 0) {
        this.createAndGeneratePlanViceVersa(scenario, type);
      } else {
        url = `/workspace-v3/plan/create?projectId=${this.projectId}&planType=inventory`;
        this.router.navigateByUrl(url);
      }
    }
  }

  public createAndGeneratePlanViceVersa(scenarioObj, type) {
    const scenario = Helper.deepClone(scenarioObj);
    // const scenario = {};
    scenario['plan_period_type'] = 'generic';
    delete scenario['_id'];
    delete scenario['updatedAt'];
    delete scenario['createdAt'];
    delete scenario['when'];
    delete scenario['actual'];
    delete scenario['audience'];
    delete scenario['budget'];
    delete scenario['filterInventoryByMarket'];
    delete scenario['geography'];
    delete scenario['goals'];
    delete scenario['labels'];
    delete scenario['locationFilters'];
    delete scenario['markets'];
    // delete scenario['measureRangeFilters'];
    // delete scenario['mediaAttributes'];
    // delete scenario['operators'];
    delete scenario['package'];
    delete scenario['places'];
    delete scenario['planned'];
    delete scenario['scenarioInventorySetId'];
    delete scenario['spotCount'];
    delete scenario['job'];
    if (scenario?.attachments?.length === 0) {
      delete scenario['attachments'];
    }
    if (scenario?.marketPlans?.plans?.length === 0) {
      delete scenario['marketPlans'];
    }
    if (type === ScenarioPlanLabels.MARKET_PLAN) {
      delete scenario['addInventoryFromFilter'];
      delete scenario['includeOutsideMarketInvs'];
    } else {
      delete scenario['marketPlans'];
    }
    const inventoryPackageData = {
      name: '',
      name_key: '',
      description: '',
      client_id: this.clientId,
      isScenarioInventorySet: true
    };

    if (type === ScenarioPlanLabels.MARKET_PLAN) {
      scenario['delivery_period_weeks'] = Number(
        scenarioObj['delivery_period_weeks']
      );
      scenario['spot_schedule'] = null;
    } else {
      if (scenarioObj & scenarioObj.spot_schedule) {
        scenario['spot_schedule'] = scenarioObj.spot_schedule;
      } else {
        scenario['delivery_period_weeks'] =
          scenarioObj['delivery_period_weeks'];
      }
    }

    scenario['type'] = type;
    this.workspaceService
      .createScenario(this.projectId, scenario)
      .pipe(
        switchMap((scenarioResponse) => {
          if (scenarioResponse['status'] === 'success') {
            scenario['name'] = scenarioResponse['data']['name'];
            inventoryPackageData['name'] =
              scenarioResponse['data']['name'] + Date.now();
            return this.workspaceService
              .saveInventoryPackage(
                inventoryPackageData,
                scenarioObj.inventoryIDs
              )
              .pipe(
                switchMap((packageResponse) => {
                  if (packageResponse['status'] === 'success') {
                    scenario['scenarioInventorySetId'] =
                      packageResponse['data']['id'];
                    const updateScenario = {
                      scenario: scenario
                    };
                    return this.workspaceService
                      .updateScenario(
                        updateScenario,
                        scenarioResponse['data']['id']['scenario']
                      )
                      .pipe(
                        switchMap((response) => {
                          if (response['status'] === 'success') {
                            // Checking the plan type and performing corresponding actions
                            const config = ProjectViewV3Component.getSnackBarConfig();
                            this.matSnackBar.open(
                              scenarioResponse.message,
                              'DISMISS',
                              {
                                ...config
                              }
                            );
                            if (type === ScenarioPlanLabels.MARKET_PLAN) {
                              const marketPlanData = this.onGeneratePlanData(
                                scenarioObj
                              );
                              return this.workspaceService
                                .generatePlans(
                                  scenarioResponse['data']['id']['scenario'],
                                  marketPlanData
                                )
                                .pipe(
                                  switchMap((mrketPlanResponse) =>
                                    of(scenarioResponse)
                                  ),
                                  catchError((error) => {
                                    return of(scenarioResponse);
                                  })
                                );
                            } else {
                              return this.workspaceService
                                .generateInventoryPlan(
                                  scenarioResponse['data']['id']['scenario']
                                )
                                .pipe(
                                  switchMap((invPlanResponse) => {
                                    if (
                                      invPlanResponse['status'] === 'success'
                                    ) {
                                      this.matSnackBar.open(
                                        'Plan is being generated. We shall notify you soon.',
                                        'DISMISS',
                                        {
                                          ...config
                                        }
                                      );
                                    }
                                    return of(scenarioResponse);
                                  }),
                                  catchError((error) => {
                                    return of(scenarioResponse);
                                  })
                                );
                            }
                          } else {
                            of(response);
                          }
                        })
                      );
                  } else {
                    return of(packageResponse);
                  }
                })
              );
          } else {
            return of(scenarioResponse);
          }
        })
      )
      .subscribe(
        (response) => {
          if (type === ScenarioPlanLabels.MARKET_PLAN) {
            const url = `/workspace-v3/scenario/${response['data']['id']['scenario']}?projectId=${response['data']['id']['project']}&planType=${type}`;
            this.router.navigateByUrl(url);
          } else if (response.status === 'success') {
            this.getProjects();
          }
        },
        (error) => {
          if (error?.error?.code === 7087) {
            this.matDialog
              .open(GenerateScenarioDuplicatePopupComponent, {
                panelClass: 'imx-mat-dialog',
                width: '500px',
                data: {
                  type: type
                }
              })
              .afterClosed()
              .subscribe((data) => {
                if (data?.name) {
                  const scenarioData = Helper.deepClone(scenarioObj);
                  scenarioData['name'] = data.name;
                  this.createAndGeneratePlanViceVersa(
                    scenarioData,
                    scenario['type']
                  );
                }
              });
          } else {
            const config = ProjectViewV3Component.getSnackBarConfig();
            this.matSnackBar.open('Something went wrong', 'DISMISS', {
              ...config
            });
          }
        }
      );
  } */

  public onApplyType(data: ApplyFilterModel) {
    const { selectedItem } = data || {};
    this.selectedTypes = selectedItem.map(item => item.value);
    this.typeAudienceMarketCombinedFilter();
  }
  public onApplyMarket(data: ApplyFilterModel) {
    const { selectedItem } = data || {};
    this.selectedMarkets = selectedItem.map(item => item.value);
    this.typeAudienceMarketCombinedFilter();
  }

  public onApplyAudience(data: ApplyFilterModel) {
    const { selectedItem } = data || {};
    this.selectedAudiences = selectedItem.map(item => item.value);
    this.typeAudienceMarketCombinedFilter();
  }

  public updateOverlayInputs(): void {
    this.audiencesList = this.audiences.map(audience => {
      const { name } = audience;
      return { value: audience, label: name } as OverlayListInputModel
    });
    this.marketsList = this.markets.map(market => {
      const { name } = market;
      return { value: market, label: name } as OverlayListInputModel
    });
  }

}
