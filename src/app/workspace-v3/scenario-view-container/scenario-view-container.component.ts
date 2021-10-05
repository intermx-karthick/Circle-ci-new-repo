import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { slideRightToLeftAnimation } from '@shared/animations';
import { forkJoin, of, Subject, BehaviorSubject, Observable } from 'rxjs';

import { MarketPlanService } from '../market-plan.service';
import { AuthenticationService, InventoryService, TargetAudienceService, ThemeService } from '@shared/services';
import {
  Market,
  MarketPlan,
  MarketPlanTargets,
  Plan,
  Query,
  ConfirmationDialog,
} from '@interTypes/workspaceV2';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { PlanAbstract } from './../planabstract';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { ScenarioDetails } from '@interTypes/scenario.response';
import { saveAs } from 'file-saver';
import { MarketThresholdFilter } from '@interTypes/threshold';
import { Helper } from '../../classes';
import { Filter } from '@interTypes/filter';
import {
  InventoryPlanJobStatus,
  ScenarioPlanTabLabels,
  ScenarioPlanLabels,
  MarketTypeEnum
} from '@interTypes/enums';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { ENTER, COMMA, SEMICOLON, H } from '@angular/cdk/keycodes';
import { TitleService } from '@shared/services/title.service';
import { CustomColumnsArea } from '@interTypes/enums';
import { ScenarioFilterParamsComponent } from './scenario-filter-params/scenario-filter-params.component';
import { INVENTORY_SAVING_LIMIT } from '@constants/inventory-limits';
import { NotificationsService } from 'app/notifications/notifications.service';
import { Notification } from '@interTypes/Notifications';
@Component({
  selector: 'app-scenario-view-container',
  templateUrl: './scenario-view-container.component.html',
  styleUrls: ['./scenario-view-container.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [slideRightToLeftAnimation]
})
export class ScenarioViewContainerComponent extends PlanAbstract
  implements OnInit, OnDestroy {
  public labels = this.workSpaceService.workSpaceLabels;
  public scenario: any = {};
  public project: any = {};
  public isSideNavOpen = false;
  public isEnableMyPlan = false;
  public userEmail: string;
  public userID: string;
  public scenarioStore$ = new Subject<ScenarioDetails>(); // Changed to BehaviorSubject because in sidenav the obersavable not worked.
  private unsubscribe: Subject<void> = new Subject<void>();
  public selectedTab = 0;
  public selectedTabLabel = ScenarioPlanTabLabels.MARKET_PLAN;
  public defaultAudience: any = {};
  public scenarioSaving = false;
  public scenarioChanged = false;
  private isJobInitiated = false;
  private defaultOperator = [
    {
      id: 'all',
      name: 'Select All'
    }
  ];
  private defaultMarket = [{ id: 'global', name: 'United States' }];
  public measureRangeFilters: MarketThresholdFilter = {
    inMarketCompIndex: [10, 210],
    targetImp: [0, 150000]
  };
  public selectedInventoryIDs = [];
  scenarioInventorySetId: any;
  scenarioInventorySet: Object;
  public inventoryPlans = [];
  private enableClearAllFilters = false;
  public allowInventory = '';
  mod_permission: any;
  private projectPermission: any;
  public isVisibleMarketPlanTab = true;
  public isVisibleInventoryTab = true;
  public isEdit = false;
  public scenarioForm: FormGroup;
  public scenarioKeysCodes = [ENTER, COMMA, SEMICOLON];
  scenarioTagActive: any;
  scenarioTooltip: string;
  packages = [];
  operators = [];
  public readonly inventoryLimit = INVENTORY_SAVING_LIMIT;
  public inventoryCount = 0;
  public regeneratePlans$: Subject<any> = new Subject<any>();
  public isInventoryDeleted = false;
  public planTabLabels = ScenarioPlanLabels;
  public isMPJobProgress = false;
  measuresRelease: any;
  
  constructor(
    private activeRoute: ActivatedRoute,
    public workSpaceService: WorkspaceV3Service,
    public marketPlanService: MarketPlanService,
    private authService: AuthenticationService,
    private cdRef: ChangeDetectorRef,
    public matDialog: MatDialog,
    public router: Router,
    public snackBar: MatSnackBar,
    private targetAudience: TargetAudienceService,
    private fb: FormBuilder,
    private titleService: TitleService,
    private inventoryService: InventoryService,
    public themeService: ThemeService,
    private notifications: NotificationsService
  ) {
    super(
      workSpaceService,
      matDialog,
      router,
      snackBar,
      themeService,
      marketPlanService
    );
  }

  ngOnInit(): void {
    this.pageType = 'scenarioView';
    this.loadInventoryFilter();
    this.titleService.updateTitle(this.labels['scenario'][1]);
    const userData = this.authService.getUserData();
    this.userEmail = userData['email'] ? userData['email'] : '';
    this.userID = userData['id'] ? userData['id'] : '';
    this.mod_permission = this.authService.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory'][
      'status'
    ];

    /** Getting Project module permission */
    this.projectPermission = this.authService.getModuleAccess('v3workspace');

    /** Check market plan permission */
    this.isVisibleMarketPlanTab =
      this.projectPermission?.['scenarios']?.['marketPlans']?.['status'] ===
      'active';

    /** Check inventory plan permission */
    this.isVisibleInventoryTab =
      this.projectPermission?.['scenarios']?.['package']?.['status'] ===
      'active';

    if (!this.isVisibleMarketPlanTab) {
      this.selectedTab = 0;
      this.selectedTabLabel = ScenarioPlanTabLabels.INVENTORY_PLAN;
    }
    this.measuresRelease = Number(this.themeService.getThemeSettingByName('measuresRelease')); 
    this.targetAudience
      .getDefaultAudience(false, this.measuresRelease.toString())
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((audience) => {
        this.defaultAudience = audience;
      });

    this.activeRoute.paramMap
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((params: ParamMap) => {
          const requests = [];
          const queryParams = this.activeRoute.snapshot.queryParams;
          if (queryParams['planType'] === 'market') {
            this.selectedTab = 0;
            this.selectedTabLabel = ScenarioPlanTabLabels.MARKET_PLAN;
          } else if (queryParams['planType'] === 'inventory') {
            if (!this.isVisibleMarketPlanTab) {
              this.selectedTab = 0;
            } else {
              this.selectedTab = 1;
            }
            this.selectedTabLabel = ScenarioPlanTabLabels.INVENTORY_PLAN;
            if(queryParams['modify'] == 'yes'){
              this.toggleSideNav();
            }
          }
          requests.push(
            this.workSpaceService.getScenariobyId(params.get('id'))
          );
          requests.push(
            this.workSpaceService.getProject(
              this.activeRoute.snapshot.queryParams['projectId']
            )
          );
          return forkJoin(requests);
        })
      )
      .subscribe((results) => {
        if (results?.[0]?.['scenario']) {
          this.scenario = results[0]['scenario'];
          this.selectedTabLabel =
            this.scenario['type'] === ScenarioPlanLabels.INVENTORY_PLAN
              ? ScenarioPlanTabLabels.INVENTORY_PLAN
              : ScenarioPlanTabLabels.MARKET_PLAN;
          this.titleService.updateTitle(this.scenario?.name ?? this.labels['scenario'][0]);
          this.makeTooltip(this.scenario);
          this.scenarioForm.patchValue({
            name: this.scenario?.name ?? '',
            description: this.scenario?.description ?? null
          });
          if (
            this.scenario?.job?.status &&
            (this.scenario.job.status === InventoryPlanJobStatus.SUCCESS ||
              this.scenario.job.status === InventoryPlanJobStatus.ERROR)
          ) {
            this.isJobInitiated = false;
          }
          if (this.scenario?.job?.status && this.scenario.job.status === InventoryPlanJobStatus.IN_PROGRESS) {
            this.selectedTab = 1;
          }
          this.scenarioStore$.next(results[0]['scenario']);
          this.setPlanData(
            this.scenario['marketPlans'],
            this.selectedTab === 0
          );
          if (
            typeof this.scenario.scenarioInventorySetId !== 'undefined' &&
            this.scenario.scenarioInventorySetId !== ''
          ) {
            this.scenarioInventorySetId = this.scenario.scenarioInventorySetId;
            this.updateSelectedInventorySetIDs(true);
          }
        }
        if (results?.[1]?.['error']?.['code'] === 7044) {
          this.snackBar
            .open(`The ${this.labels.project[0]} you are trying to view is deleted`, 'DISMISS', {
              duration: 2000
            })
            .afterDismissed()
            .subscribe(() => {
              this.router.navigateByUrl(`workspace-v3/projects/list`);
            });
        } else if (results?.[0]?.['error']?.['code'] === 7136) {
          this.snackBar
            .open(`The ${this.labels.scenario[0]} you are trying to view is deleted`, 'DISMISS', {
              duration: 2000
            })
            .afterDismissed()
            .subscribe(() => {
              let url = 'workspace-v3/projects/list?type=sandbox';
              if(!results?.[1]['isDraft']) {
                url = `workspace-v3/projects/${this.activeRoute.snapshot.queryParams['projectId']}`
              }
              this.router.navigateByUrl(url);
            });
        }
        if (results?.[1]) {
          this.project = results[1];
        }
        this.cdRef.markForCheck();
      });

    this.scenarioForm = this.fb.group({
      name: new FormControl('', [
        Validators.required,
        CustomValidators.noWhitespaceValidator(true)
      ]),
      description: new FormControl(null)
    });
    // Hide based on https://intermx.atlassian.net/browse/IMXUIPRD-2682
    /*this.workSpaceService?.clearScenarioFilters$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.enableClearAllFilters = true;
      });*/
      this.checkForNotificationUpdate();

      this.workSpaceService.getUpdateInventorySetIds().subscribe((data) => this.updateInventorySetIds(data));
  }

  private checkForNotificationUpdate() {
    this.notifications.refreshViewOnNottificationUpdate()
      .pipe(map((notifications: Notification[]) => {
        return Helper.removeDuplicate(notifications.map((notification: Notification) => notification?.moduleData?.scenarioId));
      }), takeUntil(this.unsubscribe)).subscribe((scenarioIds) => {
        if (scenarioIds?.length && this.scenario['_id'] && this.isJobInProgress && scenarioIds.includes(this.scenario['_id'])) {
          this.loadScenario(this.scenario['_id']);
        }
      });
  }

  private loadScenario(scenarioId) {
    this.workSpaceService.getScenariobyId(scenarioId).subscribe((response) => {
      if (
        response['scenario']?.job?.status &&
        (response['scenario'].job.status === InventoryPlanJobStatus.SUCCESS ||
        response['scenario'].job.status === InventoryPlanJobStatus.ERROR)
      ) {
        this.scenario = response['scenario'];
        this.cdRef.markForCheck();
      }
    })
  }
  private loadInventoryFilter() {
    const filterData = {};
    filterData['summary_level_list'] = ['Plant'];
    filterData['measures_required'] = false;
    filterData['status_type_name_list'] = ["*"] ;
    this.inventoryService
      .getOperators(filterData, false)
      .pipe(catchError((error) => of([])))
      .subscribe((operatorsRes) => {
        this.operators = operatorsRes;
        this.cdRef.markForCheck();
      });
  }

  // Commented code need to implement while setting filters data
  private setPlanData(data: MarketPlan, generatePlans = true): void {
    this.marketPlanService.setMarketPlanData(data);
    this.isEnableMyPlan = true;
    let receivedPlans = [];
    if (data && data.plans) {
      receivedPlans = data.plans;
      receivedPlans.map((pl) => {
        if (pl.query.operators && pl.query.operators.filter((op) => op !== 'all').length === 0) {
          delete pl.query.operators;
        }
      });
    }
    this.marketPlanService.setPlanData(receivedPlans);
    this.cdRef.detectChanges();
    if (generatePlans) {
      this.marketPlanService.generatePlansFromGP(
        receivedPlans,
        this.scenario['_id']
      );
    }
  }

  toggleSideNav() {
    this.isSideNavOpen = !this.isSideNavOpen;
    this.cdRef.markForCheck();
    // Hide based on https://intermx.atlassian.net/browse/IMXUIPRD-2682
    /*if(this.isSideNavOpen && this.enableClearAllFilters) {
      this.scenarioStore$.next(this.scenario);
      this.enableClearAllFilters = false;
    }*/
  }

  onSelectTab(event) {
    this.selectedTab = event?.index;
    this.selectedTabLabel = event?.tab?.ariaLabel;
  }

  public exportCSV(type) {
    if (this.isInventoryDeleted) {
      const dialogData: ConfirmationDialog = {
        notifyMessage: false,
        confirmDesc:
          'Measurements have changed. Would you like to Continue without Recalculating?',
        confirmButtonText: 'Recalculate',
        cancelButtonText: 'Continue',
        headerCloseIcon: false
      };
      this.matDialog
        .open(ConfirmationDialogComponent, {
          data: dialogData,
          width: '450px'
        })
        .afterClosed()
        .subscribe((result) => {
          if (result?.action) {
            this.regeneratePlans$.next();
            this.isInventoryDeleted = false;
          } else {
            this.exportFunc(type);
          }
        });
    } else {
      this.exportFunc(type);
    }
  }
  private exportFunc(type) {
    const customizedColumns = JSON.parse(
      localStorage.getItem(CustomColumnsArea.INVENTORY_TABLE)
    );
    let apiData;
    if (type === 'IP') {
      apiData = {
        plan_types: ['inventory_plan'],
        columns: this.workSpaceService.getCSVHeaders(customizedColumns)
      };
    } else if (type === 'MP') {
      apiData = {
        plan_types: ['market_plan']
      };
    }
    this.workSpaceService
      .exportPlan(this.scenario?._id, apiData, false, true)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (res) => {
          const contentType = res['headers'].get('content-type');
          if (contentType.includes('text/csv')) {
            const contentDispose = res['headers'].get('content-disposition');
            const matches = contentDispose.split(';')[1].trim().split('=')[1];
            let filename =
              matches && matches.length > 1
                ? matches
                : new Date().getUTCMilliseconds() + '.csv';
            filename = filename.slice(1, filename.length-1);
            saveAs(res['body'], filename);
          } else {
            this.snackBar.open(
              `We are generating your report, You\'ll receive a notification when it is ready.`,
              'DISMISS',
              {
                duration: 2000
              }
            );
          }
        },
        (error) => {
          this.snackBar.open(
            `There is a problem generating the file. Please try again later.`,
            'DISMISS',
            {
              duration: 2000
            }
          );
        }
      );
  }
  public saveScenario(generateInvPlan = false): void {
    if (!generateInvPlan && this.isInventoryDeleted) {
      // Need to add dialog
      const dialogData: ConfirmationDialog = {
        notifyMessage: false,
        confirmDesc: 'Measurements have changed. Would you like to Continue without Recalculating?',
        confirmButtonText: 'Recalculate',
        cancelButtonText: 'Continue',
        headerCloseIcon: false
      };
      this.matDialog.open(ConfirmationDialogComponent, {
        data: dialogData,
        width: '450px',
      }).afterClosed().subscribe((result) => {
          if (result?.action) {
            this.regeneratePlans$.next();
            this.isInventoryDeleted = false;
          } else {
            this.saveScenarioFunc(generateInvPlan);
          }
      });
    } else {
      this.saveScenarioFunc(generateInvPlan);
    }
  }
  private saveScenarioFunc(generateInvPlan) {
    this.isInventoryDeleted = false;
    if (this.scenario?.mediaTypeFilters?.data.length > 19) {
      this.showAlertMsg('You can select only upto 19 media types.');
      return;
    }
    if (this.scenario.market?.length <= 0) {
      this.showAlertMsg('You need to select a minimum of one market');
      return;
    }
    // Deep clone is required here as data is being mutated.
    const scenario = this.workSpaceService.formatScenarioData(
      Helper.deepClone(this.scenario)
    );
    this.scenarioStore$.next(this.scenario);

    // set clearall state to fasle for maintain pre-populate if clear
    this.enableClearAllFilters = false;

    this.scenarioSaving = true;
    
    const saveFormat = {
      scenario: scenario
    };
    const inventoryPanels = [];
    if (this.selectedInventoryIDs.length) {
      this.selectedInventoryIDs.forEach((d) => {
        inventoryPanels.push({
          id: d,
          type: 'geopathPanel'
        });
      });
    }

    const inventoryPackageData = {
      inventory: inventoryPanels,
      id: this.scenario.scenarioInventorySetId
    };
    let inputData;
    const scenarioApiCalls = [];
    if (this.scenarioInventorySet && this.scenarioInventorySet['packages'] && this.selectedInventoryIDs !== null) {
      inputData = {
        name: this.scenarioInventorySet['packages']['name'],
        isScenarioInventorySet: true,
        name_key: this.scenarioInventorySet['packages']['name'],
        id: this.scenarioInventorySetId
      };
      scenarioApiCalls.push(
        this.workSpaceService
          .saveInventoryPackage(inputData, inventoryPanels)
          .pipe(catchError((error) => of(error)))
      );
    }
    scenarioApiCalls.push(
      this.workSpaceService
        .updateScenario(saveFormat, this.scenario?._id)
        .pipe(catchError((error) => of(error)))
    );
    forkJoin(scenarioApiCalls).subscribe(
      (response) => {
        this.scenarioSaving = false;
        this.scenarioChanged = false;

        this.cdRef.markForCheck();
        this.showAlertMsg(`${this.labels.scenario[0]} saved successfully`);
        if (generateInvPlan) {
          this.generateInventoryPlans();
        }
      },
      (error) => {
        const message = error?.error?.message || 'Something went wrong.';
        this.showAlertMsg(message);
        this.scenarioSaving = false;
        this.cdRef.markForCheck();
      }
    );
  }

  /**
   *
   * @param filters
   */
  public applyGeneratePlan(filters: SelectedFilters) {
    // set clearall state to fasle for maintain pre-populate if clear
    this.enableClearAllFilters = false;
    const scenario = Helper.deepClone(this.scenario);
    let selectedMarkets = [];
    /** audience */
    const targets: MarketPlanTargets = scenario?.marketPlans?.targets;
    if (filters?.audiences?.length) {
      scenario.audiences = filters?.audiences ?? [];
      targets.audiences = scenario.audiences;
    }
    const inventoryFilters = filters?.inventory?.[0]?.inventoryFilters;
    const selectedFilters = filters?.inventory?.[0]?.selectedFilters;
    const filterType = filters?.inventory?.[0]?.filterType;
    let selectedPackages = [];
    if (selectedFilters) {
      selectedMarkets = selectedFilters?.marketData || [];
      if (selectedFilters?.inventorySet?.length > 0) {
        selectedPackages = selectedFilters?.inventorySet.map(
          (inventorySet) => inventorySet['_id']
        );
      }
      if (selectedFilters?.data?.length > 0) {
        this.selectedInventoryIDs = selectedFilters.data;
      }
      if (selectedFilters?.fileData) {
        delete filters['inventory'][0]['selectedFilters']['fileData'];
      }
    }
    scenario['package'] = selectedPackages;
    const goalData = {
      trp: filters.planPeriod['goals']['trp'],
      reach: filters.planPeriod['goals']['reach'],
      frequency: 0,
      imp: filters.planPeriod['goals']['imp'],
      type: filters.planPeriod['goals']['type'],
      duration: Number(filters.planPeriod['goals']['duration']),
      effectiveReach: Number(filters.planPeriod['goals']['effectiveReach']),
      allocationMethod: filters.planPeriod['goals']['allocationMethod']
    };

    const fileData = filters?.inventory?.[0]?.['fileData'];
    if (fileData && fileData['fileData']?.length > 0 && !!fileData.planPeriod) {
      scenario['delivery_period_weeks'] = null;
      scenario['spot_schedule'] = fileData?.planPeriod;
    } else {
      if (filters.planPeriod?.plan_period_type === 'generic') {
        scenario['delivery_period_weeks'] = Number(
          filters.planPeriod['delivery_period_weeks']
        );
        scenario['spot_schedule'] = null;
      } else {
        scenario['delivery_period_weeks'] = null;
        scenario['spot_schedule'] = filters.planPeriod['spot_schedule'];
      }
    }

    if (this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN) {
      scenario['includeOutsideMarketInvs'] =
        filters.includeOutsideMarketInventory;
    }

    if (inventoryFilters) {
      Object.keys(inventoryFilters).forEach((key) => {
        switch (key) {
          case 'mediaAttributes':
            scenario[
              'mediaAttributes'
            ] = this.workSpaceService.formatMediaattribute(
              inventoryFilters[key]
            );
            break;
          case 'thresholds':
            scenario['measureRangeFilters'] = this.workSpaceService
              .formatThreshold(inventoryFilters[key]);
            targets['measureRangeFilters'] = [inventoryFilters[key]];
            this.measureRangeFilters = inventoryFilters[key];
            break;
          case 'location':
            scenario['location'] = {
              enabled: true,
              data: inventoryFilters[key]['data']
            };
            scenario['locationFilters'] = {
              enabled: true,
              data: inventoryFilters[key]['data']
            };
            targets['locationFilters'] = inventoryFilters[key]['data'];
            break;
          case 'operator':
            const operators = inventoryFilters[key][
              'selectedOptions'
            ].map((op) => (op.name !== 'Select All' ? op.name : 'all'));
            scenario['operators'] = {
              enabled: true,
              data: operators
            };
            targets['operators'] = operators;
            break;
          case 'mediaTypeFilters':
            if (inventoryFilters[key].state === 'clear') {
              scenario['mediaAttributes'] = {};
              this.showAlertMsg('Please select atleast one media type');
              return;
            }
            const mediaTypeFilters = {
              enabled: true,
              data: []
            };
            mediaTypeFilters['data'] = inventoryFilters[key].filter(
              (media) => media !== null
            );
            mediaTypeFilters['enabled'] = mediaTypeFilters['data'].length > 0;
            scenario['mediaTypeFilters'] = mediaTypeFilters;
            targets['mediaTypeFilters'] = mediaTypeFilters['data'];
            break;
          default:
            break;
        }
      });
    }
    if (selectedMarkets.length <= 0) {
      selectedMarkets = filters?.market ?? [];
    }

    if (selectedMarkets.length) {
      scenario.market = selectedMarkets;
      targets.markets = selectedMarkets;
    }
    scenario.marketPlans.targets = targets;
    targets.goals = goalData;

    /* if (!this.validateTargetData(scenario)) {
      return;
    } */
    if (filterType === 'InvetoryFilter') {
      scenario['addInventoryFromFilter'] = true;
    } else if (scenario['addInventoryFromFilter'] && filterType === 'Inventory'){
      scenario['addInventoryFromFilter'] = false;
    }
    this.scenario = scenario;
    // Need to generate inventory plan only when inventory tab selected and after scenario saved.
    //this.saveScenario(this.selectedTab === 1);
    this.saveScenario(
      this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN
    );

    // close side nav
    this.isSideNavOpen = false;

    // Need to generate market plan only when market tab selected
    if (this.selectedTabLabel === ScenarioPlanTabLabels.MARKET_PLAN) {
      const plans: Plan[] = [];
      filters.audiences.forEach((audience: Filter) => {
        filters.market.forEach((market: Market) => {
          const marketData: Market = {
            id: market.id,
            name: market.name,
            marketsGroup: market['marketsGroup'] || []
          };
          const query: Query = {
            audience: audience,
            market: marketData,
            operators: scenario.operators.data,
            goals: goalData,
            mediaTypeFilters: this.marketPlanService.cleanMediaTypeData(
              scenario.mediaTypeFilters.data
            ),
            measureRangeFilters: [this.measureRangeFilters],
            mediaAttributes: scenario['mediaAttributes']?.data ?? [],
            locationFilters: scenario.locationFilters
          };
          if (query.operators && query.operators.filter((op) => op !== 'all').length === 0) {
            delete query['operators'];
          }
          plans.push({
            query: query
          });
        });
      });
      const targetsData = scenario?.marketPlans?.targets;
      if (targetsData.operators && targetsData.operators.filter((op) => op !== 'all').length === 0) {
        delete targetsData['operators'];
      }
      targetsData['goals'] = goalData;
      const payload: MarketPlan = {
        targets: targetsData,
        plans
      };

      this.marketPlanService
        .generatePlans(this.scenario._id, payload, this.isEnableMyPlan)
        .pipe(
          switchMap((data) => {
            return this.marketPlanService.getMarketPlans(this.scenario._id);
          })
        )
        .subscribe((data: MarketPlan) => {
          this.setPlanData(data);
        });
    }
  }

  /* private validateTargetData(scenario) {
    const mandatories = [];
    if (scenario.audiences.length < 1) {
      mandatories.push('Audience');
    }
    if (scenario.market.length < 1) {
      mandatories.push('Market');
    }
    if (
      this.selectedTabLabel === 'marketPlan' &&
      scenario.mediaTypeFilters?.data.length < 1
    ) {
      mandatories.push('Media Type');
    }
    if (mandatories.length > 0) {
      const message = 'Please select atleast one ' + Helper.makeString(mandatories);
      this.showAlertMsg(message);
      return false;
    }

    if (scenario.mediaTypeFilters?.data.length > 19) {
      this.showAlertMsg('You can select only upto 19 media types');
      return false;
    }
    const goalData = scenario?.marketPlans?.targets?.goals ?? {
      type: 'trp',
      allocationMethod: 'equal',
      effectiveReach: '1',
      trp: 200,
      reach: 0,
      frequency: 0,
      imp: 0,
      duration: 1
    };
    switch (goalData['type'] || 'trp') {
      case 'trp':
        if (goalData['trp'] === null || !goalData['trp']) {
          this.showAlertMsg('Please enter trp value');
          return false;
        }
        break;
      case 'reach':
        if (goalData['reach'] === null || !goalData['reach']) {
          this.showAlertMsg('Please enter reach value');
          return false;
        }
        break;
      case 'imp':
        if (goalData['imp'] === null || !goalData['imp']) {
          this.showAlertMsg('Please enter impressions value');
          return false;
        }
        break;
      default:
        break;
    }

    if (!goalData.duration && this.selectedTab !== 0) {
      this.showAlertMsg('Please Select Plan length');
      return false;
    }
    return true;
  } */

  updateSelectedInventorySetIDs(isFirstLoad = false) {
    this.workSpaceService
      .getExplorePackagesById(false, this.scenarioInventorySetId)
      .subscribe((response) => {
        if (response) {
          this.scenarioInventorySet = response;
          this.selectedInventoryIDs = response['packages']['inventory'].map(
            (inv) => inv['id']
          );
          this.cdRef.detectChanges();
        }
      });
  }

  private showAlertMsg(msg: string) {
    this.snackBar.open(msg, 'DISMISS', {
      duration: 2000
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // To generate inventory plans
  public generateInventoryPlans() {
    this.workSpaceService
      .generateInventoryPlan(this.scenario['_id'])
      .subscribe((response) => {
        if (response?.message) {
          this.showAlertMsg(response.message);
          this.isJobInitiated = true;
          this.cdRef.markForCheck();
        }
        if (response?.status === 'success') {
          let url = '';
          if(this.project['isDraft']) {
            url = `/workspace-v3/projects/list?type=sandbox`;
          } else {
            url = `/workspace-v3/projects/${this.activeRoute.snapshot.queryParams['projectId']}`;
          }
          this.router.navigateByUrl(url);
        }
      });
  }
  public onPushInventoryPlan(plans) {
    this.inventoryPlans = plans;
    this.inventoryPlans.map((res) => {
      this.inventoryCount += res.spots;
    });
  }

  get isJobInProgress(): boolean {
    return (
      (this.scenario?.job?.status &&
        (this.scenario.job.status === InventoryPlanJobStatus.IN_PROGRESS ||
          this.scenario.job.status === InventoryPlanJobStatus.STARTED)) ||
      this.isJobInitiated
    );
  }

  /**
  This function used to map inventory and check spot schedule
  */
  public mapInventory() {
    if (this.scenario?.spot_schedule) {
      this.moveMapWithOutSpecific();
    } else {
      window.open(window.origin + '/explore?scenario=' + this.scenario?._id);
      // this.router.navigate(['/explore'], {
      //   queryParams: { scenario: this.scenario?._id }
      // });
    }
  }

  /**
   *
   *  This function used when plan period is specific
   */
  moveMapWithOutSpecific() {
    const qParams = { scenario: this.scenario?._id };
    qParams['defaultWeek'] = true;
    const data: ConfirmationDialog = {
      notifyMessage: false,
      confirmTitle:
        'The Explore map module will open now. The impressions and metrics provided in Explore will be based on Explore’s default 1 Week Delivery schedule. Return to Workspace for your Specific Date plan metrics.',
      confirmButtonText: 'Go To Map',
      cancelButtonText: 'Cancel'
    };
    this.matDialog
      .open(ConfirmationDialogComponent, {
        data: data,
        width: '600px',
        panelClass: 'map-inventory-confirm-dialog'
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          window.open(window.origin + '/explore?defaultWeek=true&scenario=' + this.scenario?._id);
         // this.router.navigate(['/explore'], { queryParams: qParams });
        }
      });
  }
  onSubmitScenario(formGrp) {
    if (formGrp.valid) {
      const scenario = Helper.deepClone(this.scenario);

      scenario['name'] = formGrp.value.name;
      scenario['description'] = formGrp?.value?.description !== '' ? formGrp?.value?.description : null;
      const formattedScenario = this.workSpaceService.formatScenarioData(scenario);
      Helper.removeEmptyArrayAndEmptyObject(formattedScenario)

      const formatScenario = {
        scenario: formattedScenario
      };
      this.workspaceService.updateScenario(formatScenario, this.scenario['_id'])
        .subscribe((result) => {
          this.titleService.updateTitle(scenario['name']);
          this.scenario['name'] = scenario['name'];
          this.scenario['description'] = scenario['description'];
          this.isEdit = false;
          this.makeTooltip(this.scenario);
          this.cdRef.markForCheck();
          this.snackBar.open(`${this.labels.scenario[0]} updated successfully.`, 'DISMISS', {
            duration: 2000
          });
        },
          (error) => {
            if (error?.error?.code === 7041) {
              this.scenarioForm.get('name').setErrors({ name_exists: true });
            } else {
              let message = 'Something went wrong, Please try again later.';
              if (error?.error?.message) {
                message = error.error.message;
              }
              this.snackBar.open(message, 'DISMISS', { duration: 2000 });
            }
            this.cdRef.markForCheck();
          });
    }
  }
  makeTooltip(scenario) {
    let message = '';
    if (scenario['description']) {
      message = `
        Description: ${scenario['description'] ?? '-'}
      `;
    }
    this.scenarioTooltip = message;
    this.cdRef.markForCheck();
  }
  showOrHideEdit() {
    this.isEdit = !this.isEdit;
  }
  cancelEdit() {
    this.isEdit = false;
    this.scenarioForm.patchValue({
      name: this.scenario?.name ?? '',
      description: this.scenario?.description ?? null
    });
  }
  onOpenedChange(evt) {
    console.log('onOpenedChange', evt);
  }

  saveInventoryUpdate(saveinventory){
    this.loadInventoryFilter();
  }
  // This function is to update the inventoryIds when delete action performed
  public updateInventorySetIds(ids) {
    this.selectedInventoryIDs = [...ids];
    this.isInventoryDeleted = true;
    this.cdRef.markForCheck();
  }


  canDeactivate(): Observable<boolean> | boolean {
    if (this.isInventoryDeleted) {
      const dialogData: ConfirmationDialog = {
        notifyMessage: false,
        confirmDesc: 'Measurements have changed. Would you like to Continue without Recalculating?',
        confirmButtonText: 'Recalculate',
        cancelButtonText: 'Continue',
        headerCloseIcon: false
      };
      return this.matDialog.open(ConfirmationDialogComponent, {
        data: dialogData,
        width: '450px',
        disableClose: true
      }).afterClosed().pipe(map((result) => {
        if (result?.action) {
          this.regeneratePlans$.next();
          this.isInventoryDeleted = false;
          return false;
        } else {
          return true;
        }
      }));
    } else {
      return true;
    }
  }   
}

interface SelectedFilters {
  audiences: Filter[];
  market: Filter[];
  planPeriod: any;
  inventory: SelectedInventoryFilter[];
  includeOutsideMarketInventory: boolean;
}

interface SelectedInventoryFilter {
  selectedFilters: any;
  filterType: string;
  inventoryFilters: {
    MediaAndPlacement: any;
    MediaAttribute: any;
    operator: any;
    location: any;
    thresholds: any;
  };
  fileData: any;
}
