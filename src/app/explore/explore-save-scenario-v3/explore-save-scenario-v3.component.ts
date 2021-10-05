import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
  OnDestroy
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { WorkspaceV3Service } from 'app/workspace-v3/workspace-v3.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Market,
  MarketPlan,
  Plan,
  Project,
  ProjectListQueryParams,
  ProjectsList,
  Query
} from '@interTypes/workspaceV2';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomValidators } from '../../validators/custom-validators.validator';
import { CommonService } from '@shared/services/common.service';
import { Helper } from 'app/classes';
import {
  ExploreDataService,
  TargetAudienceService,
  ThemeService,
  LoaderService
} from '@shared/services';
import { FiltersService } from '../filters/filters.service';
import { Router } from '@angular/router';
import { ProjectListAbstract } from 'app/workspace-v3/project-list';
import { Filter } from '@interTypes/filter';
import { MarketPlanService } from 'app/workspace-v3/market-plan.service';
import { ScenarioPlanLabels, ScenarioPlanTabLabels } from '@interTypes/enums';

@Component({
  selector: 'app-explore-save-scenario-v3',
  templateUrl: './explore-save-scenario-v3.component.html',
  styleUrls: ['./explore-save-scenario-v3.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MarketPlanService]
})
export class ExploreSaveScenarioV3Component extends ProjectListAbstract
  implements OnInit, OnDestroy {
  public scenarioForm: FormGroup;
  public nameValidError: String = '';
  public pageTitle = 'Scenario';
  public projects = [];
  public projectQueryParams: ProjectListQueryParams = {
    page: 1,
    perPage: 10,
    sortField: 'createdAt',
    sortOrder: 'asc',
    fieldSet: '_id,name'
  };
  public pagination = {
    page: 1,
    pageSize: 0,
    perPage: 10,
    total: 0
  };
  panelContainer;
  private initialLoad = true;
  private totalPage = 0;
  private unsubscribe: Subject<void> = new Subject();
  searchQuery: any;
  public dataLoading = true;
  public projectId = '';
  workFlowLabels: any;
  clientId: any;
  themeSettings: any;
  public inventoryIDs = [];
  private unSubscribe: Subject<void> = new Subject<void>();
  private defaultAudience: any = {};
  selectedBaseID: any;
  selectedMarket = [];
  delivery_period_weeks: number;
  private filterSession = {};
  private currentTargetId: any;
  private currentTargetName: any;
  public audienceTabType: any;
  public isDefaultAudience = false;
  selectedGeography: any = [];
  isForGotoScenario = false;
  mediaTypeFilters = [];
  operatorFilters = [];
  public generatingBtn = false;
  constructor(
    public dialogRef: MatDialogRef<ExploreSaveScenarioV3Component>,
    private fb: FormBuilder,
    public workspaceApi: WorkspaceV3Service,
    @Inject(MAT_DIALOG_DATA) public data,
    public cdRef: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private commonService: CommonService,
    public themeService: ThemeService,
    private exploreDataService: ExploreDataService,
    private targetAudience: TargetAudienceService,
    private filtersService: FiltersService,
    private router: Router,
    private marketPlanService: MarketPlanService,
    private loaderService: LoaderService
  ) {
    super(workspaceApi, cdRef);
    this.targetAudience
      .getDefaultAudience()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((audience) => (this.defaultAudience = audience));
    this.workFlowLabels = this.commonService.getWorkFlowLabels();
  }
  public projectTrackByFn(index, item: Project) {
    return item._id;
  }
  ngOnInit(): void {
    this.filterSession = this.filtersService.getExploreSession();
    this.themeSettings = this.themeService.getThemeSettings();
    this.clientId = this.themeSettings.clientId;
    this.data.inventories.forEach((d) => {
      this.inventoryIDs.push({
        id: d['fid'],
        type: 'geopathPanel'
      });
    });

    this.nameValidError = `${this.workFlowLabels.project[0]} can't be blank`;
    this.scenarioForm = this.fb.group(
      {
        project: new FormControl(this.data.project),
        name: new FormControl(null, [
          CustomValidators.noWhitespaceValidator(false)
        ]),
        type: 'MP'
      },
      {
        validator: CustomValidators.validSelectProject('project')
      }
    );
    if (this.data.projectId) {
      this.projectId = this.data.projectId;
    }
    this.scenarioForm.controls.project.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        filter((data) => !(data instanceof Object))
      )
      .subscribe(
        (data) => {
          this.projectQueryParams['page'] = 1;
          this.projectQueryParams['q'] = data;
          this.loadProjects();
          this.cdRef.detectChanges();
        },
        (error) => {
          this.cdRef.markForCheck();
        }
      );
    if (
      this.filterSession['data'] &&
      this.filterSession['data']['audience'] &&
      this.filterSession['data']['audience']['details']
    ) {
      this.currentTargetId = this.filterSession['data']['audience']['details'][
        'currentTargetId'
      ];
      this.currentTargetName = this.filterSession['data']['audience'][
        'details'
      ]['targetAudience']['name'];
      this.isDefaultAudience = false;
      this.audienceTabType = this.filterSession['data']['audience']['details'][
        'tabType'
      ];
    } else {
      this.isDefaultAudience = true;
    }
    this.delivery_period_weeks =
      (this.filterSession['data'] &&
        this.filterSession['data']['period_days'] &&
        this.filterSession['data']['period_days'] / 7) ||
      1;

    this.selectedGeography =
      (this.filterSession['data'] &&
        this.filterSession['data']['location'] &&
        this.filterSession['data']['location']['type'] === 'geography' &&
        this.filterSession['data']['location']['selectedGeoLocation'] &&
        this.filterSession['data']['location']['selectedGeoLocation']) ||
      {};
    if (
      this.filterSession['data'] &&
      this.filterSession['data']['mediaTypeList']
    ) {
      const mediaTypeFilters = [];
      mediaTypeFilters.push({
        edit: false,
        state: "apply",
        data: "Murals",
        ids: this.filterSession['data']['mediaTypeList']['ids'],
        selection: this.filterSession['data']['mediaTypeList']['selection']
      });
      this.mediaTypeFilters = mediaTypeFilters;
    }
    if (
      this.filterSession['data'] &&
      this.filterSession['data']['operatorList']
    ) {
      this.operatorFilters = this.filterSession['data']['operatorList'];
    }

    this.loadProjects();

    this.exploreDataService
      .getSelectedTarget()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((target) => {
        if (target !== '') {
          this.selectedBaseID = target;
        } else {
          this.selectedBaseID = this.defaultAudience.audienceKey;
        }
      });
    this.exploreDataService
      .getSelectedMarket()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((market) => {
        if (
          market &&
          market.selectedMarkets &&
          market.selectedMarkets.length > 0
        ) {
          this.selectedMarket = market;
        } else {
          this.selectedMarket = [];
        }
      });
    this.setDefaultProject$
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((sandboxProject) => {
        const project = this.scenarioForm.get('project').value;
        if (project === null && !project?.['_id']) {
          this.scenarioForm.get('project').setValue(sandboxProject);
        }
      });
  }
  saveAndGoToScenario() {
    this.isForGotoScenario = true;
    this.onSubmit(this.scenarioForm);
  }
  onSubmit(scenarioForm) {
    if (this.scenarioForm.valid) {
      this.loaderService.display(true);
      const scenario = Helper.deepClone(scenarioForm.value);
      let project = {};
      if (!scenario?.['project']?.['_id']) {
        scenario['project'] = this.draftProject;
        project = this.draftProject;
      } else {
        project = scenario['project'];
      }
      delete scenario['project'];
      if (scenario['description'] === '') {
        scenario['description'] = null;
      }
      const inventoryPackageData = {
        name: scenario.name + Date.now(),
        name_key: '',
        description: '',
        client_id: this.clientId,
        isScenarioInventorySet: true
      };
      let markets = [];
      if (
        this.selectedMarket &&
        this.selectedMarket['selectedMarkets'] &&
        this.selectedMarket['selected'] !== 'us' &&
        this.selectedMarket['selected'] !== 'all'
      ) {
        markets = this.selectedMarket['selectedMarkets'].map((market) => {
          return {
            id: market.id,
            name: market['name']
          };
        });
        // markets['type'] = this.selectedMarket['submitType'];
      } else if (
        this.selectedMarket &&
        this.selectedMarket['selectedMarkets'] &&
        this.selectedMarket['selected'] === 'all'
      ) {
        const marketsName = this.selectedMarket['selectedMarkets'].map(
          (market) => {
            return market['name'];
          }
        );
        const marketsList = this.selectedMarket['selectedMarkets'].map(
          (market) => {
            return {
              id: market.id,
              name: market['name']
            };
          }
        );
        markets = [
          { id: '', marketsGroup: marketsList, name: marketsName.join() }
        ];
      } else {
        markets = [{id: "global", name: "United States"}];
      }
      let geographies = [];
      if (this.selectedGeography.length > 0) {
        geographies = this.selectedGeography.map((geo) => {
          return {
            id: geo['data']['id'],
            type: geo['data']['type'],
            name: geo['data']['label']
          };
        });
      }
      scenario['addInventoryFromFilter'] = false;
      scenario['audiences'] = [
        {
          id:
            (this.currentTargetId && this.currentTargetId) ||
            this.selectedBaseID,
          name:
            (this.currentTargetName && this.currentTargetName) ||
            this.defaultAudience['description'],
          measuresRelease: this.filterSession['data']['measuresRelease']
        }
      ];
      scenario['market'] = (markets['length'] > 0 && markets) || null;
      scenario['delivery_period_weeks'] = this.delivery_period_weeks;
      scenario['geography'] =
        (geographies.length > 0 && geographies) || null;
      if (scenario['type'] === 'MP') {
        scenario['mediaTypeFilters'] = {
          enabled: true,
          data: this.mediaTypeFilters
        };
        scenario['operators'] = {
          "enabled": true,
          "data": this.operatorFilters
        };
      }
      if (!this.validatePlanData(scenario) || !project) {
        this.loaderService.display(false);
        return false;
      }
      this.generatingBtn = true;
      this.workspaceApi.createScenario(
        project["_id"],
        scenario
      ).pipe(
        switchMap((scenarioResponse) => {
          if (scenarioResponse['status'] === 'success') {
            scenario['name'] = scenarioResponse['data']['name'];
            inventoryPackageData['name'] = scenarioResponse['data']['name'] + Date.now();
            return this.workspaceApi
              .saveInventoryPackage(
                inventoryPackageData,
                this.inventoryIDs
              )
              .pipe(
                takeUntil(this.unSubscribe),
                switchMap((packageResponse) => {
                  if (packageResponse['status'] === 'success') {
                    scenario['scenarioInventorySetId'] =
                      packageResponse['data']['id'];
                    const updateScenario = {
                      scenario: scenario
                    };
                    return this.workspaceApi
                      .updateScenario(
                        updateScenario,
                        scenarioResponse['data']['id']['scenario']
                      )
                      .pipe(
                        takeUntil(this.unSubscribe),
                        switchMap((response) => {
                          if (response['status'] === 'success') {
                            if (scenario['type'] === 'MP') {
                              const marketPlanData = this.onGeneratePlanData(scenario);
                              return this.workspaceApi
                                .generatePlans(
                                  scenarioResponse['data']['id']['scenario'],
                                  marketPlanData
                                )
                                .pipe(
                                  switchMap((mrketPlanResponse) => {
                                      return of(scenarioResponse);
                                    }
                                  ),
                                  catchError((error) => {
                                    return of(scenarioResponse);
                                  })
                                );
                            } else {
                              return this.workspaceApi
                                .generateInventoryPlan(
                                  scenarioResponse['data']['id']['scenario'],
                                  true
                                )
                                .pipe(
                                  takeUntil(this.unSubscribe),
                                  switchMap((invPlanResponse) =>
                                    of(scenarioResponse)
                                  ),
                                  catchError((error) => {
                                    return of(scenarioResponse);
                                  })
                                );
                            }
                          } else {
                            return of(response);
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
      ).subscribe(
        (scenarioResponse) => {
          if (
            this.isForGotoScenario &&
            !!scenarioResponse?.data?.id?.scenario
          ) {
            setTimeout(() => {
              this.generatingBtn = false;
              this.goToScenario(
                scenarioResponse?.data?.id?.project,
                scenarioResponse.data.id.scenario
              );
            }, 20);
          }
          const successData = {};
          successData['project'] =  {
            '_id'   : project['_id'],
            'name'  : project['name']
          }; ;
          successData['scenario'] = {
            '_id'   : scenarioResponse.data.id.scenario,
            'name'  : scenarioResponse.data.name
          };
          successData['status'] = scenarioResponse?.status;
          this.loaderService.display(false);
          this.dialogRef.close(successData);
        },
        (error) => {
          this.generatingBtn = false;
          this.loaderService.display(false);
          if (error?.error?.code === 7087) {
            scenarioForm
              .get('name')
              .setErrors({ name_exists: true });
            this.cdRef.detectChanges();
          } else {
            this.snackBar.open('Something went wrong', 'DISMISS', {
              duration: 5000
            });
          }
        }
      );
    }
  }
  validatePlanData(scenario) {
    const mandatories = [];
    if (
      scenario['type'] === ScenarioPlanLabels.MARKET_PLAN &&
      this.mediaTypeFilters?.length < 1
    ) {
      mandatories.push('Media');
    }
    if (scenario['market'].length < 1) {
      mandatories.push('Market');
    }
    if (scenario['audiences'].length < 1) {
      mandatories.push('Audience');
    }
    if (mandatories.length > 0) {
      const message = `Select at least 1 ${Helper.makeString(
        mandatories,
        '&'
      )} to Generate Plans.`;
      this.snackBar.open(message, 'DISMISS', {
        duration: 5000
      });
      return false;
    }
    return true;
  }
  private onGeneratePlanData(scenario) {
    const goals = {
      trp: 200,
      reach: null,
      frequency: 0,
      imp: null,
      type: 'trp',
      duration: Number(scenario['delivery_period_weeks']),
      effectiveReach: 1,
      allocationMethod: "equal"
    };
    const plans: Plan[] = [];
    scenario['audiences'].forEach((audience: Filter) => {
      scenario['market'].forEach((market: Market) => {
        const marketData: Market = {
          id: market.id,
          name: market.name,
          marketsGroup: market['marketsGroup'] || []
        };
        const query: Query = {
          audience: audience,
          market: marketData,
          operators: this.operatorFilters,
          goals: goals,
          mediaTypeFilters: this.marketPlanService.cleanMediaTypeData(
            this.mediaTypeFilters
          ),
          measureRangeFilters: [],
          mediaAttributes: [],
          locationFilters: null
        };
        if (query.operators && query.operators.length === 0) {
          delete query['operators'];
        }
        plans.push({
          query: query
        });
      });
    });
    const markets = scenario['market'].map((i) => {
      return {
        id: i.id,
        name: i.name,
        marketsGroup: i['marketsGroup'] || []
      };
    });
    const marketPlan: MarketPlan = {
      targets: {
        audiences: scenario['audiences'],
        markets: markets,
        goals: goals,
        mediaTypeFilters: this.marketPlanService.cleanMediaTypeData(
          this.mediaTypeFilters
        ),
        operators: this.operatorFilters,
        measureRangeFilters: [],
        locationFilters: null
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

  private goToScenario(projectId: string, scenarioId: string) {
    this.router.navigateByUrl(
      `/workspace-v3/scenario/${scenarioId}?projectId=${projectId}`
    );
  }
  public updateContainer() {
    this.panelContainer = '.project-list-autocomplete';
  }
  public displayTitle(project) {
    return project?.name ?? '';
  }

  public createNewProject() {
    this.dialogRef.close({
      type: 'createNewProject'
    });
  }
  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
