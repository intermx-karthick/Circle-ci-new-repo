import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import { AudienceFilterDialogComponent } from '../audience-filter-dialog/audience-filter-dialog.component';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { MarketFilterDialogComponent } from '../market-filter-dialog/market-filter-dialog.component';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { SelectInventoryPopupComponent } from '../select-inventory-popup/select-inventory-popup.component';
import { AuthenticationService, InventoryService, ThemeService } from '@shared/services';
import { ProjectListAbstract } from '../project-list';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { ConfirmationDialog, Market, MarketPlan, Plan, Project, ProjectListQueryParams, Query } from '@interTypes/workspaceV2';
import { Helper } from 'app/classes';
import { MatSnackBarConfig } from '@angular/material/snack-bar/snack-bar-config';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { MarketPlanService } from '../market-plan.service';
import { Filter } from '@interTypes/filter';
import { AppRegularExp, Patterns, ScenarioPlanTabLabels } from '@interTypes/enums';
import * as numeral from 'numeral';
import { KeyValue } from '@angular/common';
import { Orientation } from '../../classes/orientation';
import { FiltersService } from 'app/explore/filters/filters.service';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { WorkspaceProjectAddComponent } from '../workspace-project-add/workspace-project-add.component';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { SelectOperatorPopupComponent } from '../select-operator-popup/select-operator-popup.component';
import { ILocationFilters } from '@interTypes/ILocationFilters';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
@Component({
  selector: 'app-create-scenario',
  templateUrl: './create-scenario.component.html',
  styleUrls: ['./create-scenario.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateScenarioComponent extends ProjectListAbstract
  implements OnInit, AfterViewInit {

  public labels = this.workspaceApi.workSpaceLabels;
  private defaultMarket = [{ id: 'global', name: 'United States' }];
  public scenarioForm: FormGroup;
  public inventoryForm: FormGroup;
  public isOpenAudience = false;
  public isOpenMarket = false;
  public isOpenInventories = false;
  private selectedMarketType = 'National';
  public selectedMarket = [];
  public periodDurations = [];
  public selectedAudiences = [];
  operators = [];
  public inventoryIDs = [];
  public selectedInventory = [];
  public panelContainer: string;
  public planPeriodType = 'generic';
  clientId: any;
  themeSettings: any;
  public defaultAudience: any = {};
  public generatingBtn = false;
  public selectedMediaAttributes = null;
  public mediaAttributes = null;
  public measureRangeFilters = null;
  public locationFilters = null;
  public operatorFilters = [];
  public mediaTypeFilters = [];
  public selectedPackages = [];
  public filterMarketsFormIDs = [];
  public selectedTabIndex = 0;
  public orientation: Orientation;
  inventoryCount = 0;
  operatorCount = 0;
  public selectedTabLabel = ScenarioPlanTabLabels.MARKET_PLAN;
  public numericPattern = Patterns.NUMERIC;
  public deliveryNumericPattern = Patterns.COMMA_SEPARATED_NUMBER;
  public deliveryNumericPatternRegEx = new RegExp(Patterns.COMMA_SEPARATED_NUMBER);
  public AppRegularExp = AppRegularExp;
  // Related to Permissions
  public allowInventory = '';
  private mod_permission: any;
  public audienceLicense = {};
  private projectPermission: any;
  public isVisibleMarketPlanTab = true;
  public isVisibleInventoryTab = true;
  // End  permissions
  deliveryGoalTooltip = { name: 'trp', value: 'TRP Plan Goal' };
  isAudienceSelected: boolean;
  isMarketSelected: boolean;
  ismediaTypeSelected: boolean;
  errorList = '';
  public errorClass = 'dispNone';
  project: Project;
  projectLink: string;
  projectParams = {};
  private unsubscribe$: Subject<void> = new Subject<void>();
  @ViewChild('mpProjectInputRef', { read: MatAutocompleteTrigger }) marketPlanProjectAutoComplete: MatAutocompleteTrigger;
  @ViewChild('projectInputRef', { read: MatAutocompleteTrigger }) inventoryPlanProjectAutoComplete: MatAutocompleteTrigger;
  public deleteDefaultAudience = false;
  public deleteDefaultMarket = false;
  public errorClassIP = 'dispNone';
  public errorListIP = '';
  isIPAudienceSelected: boolean;
  isIPMarketSelected: boolean;
  isMPDefaultAudienceSelected: boolean;
  isGenerateFromType = '';
  private deliveryGoalsData = [
    { name: 'trp', value: 'TRP Plan Goal' },
    { name: 'imp', value: 'Target In-Mkt Imp Plan Goal' },
    { name: 'reach', value: 'Reach % Plan Goal' }
  ];
  // Reach hidden by default and should only be enabled when 2020 audience alone is selected. IMXMAINT-178
  public deliveryGoals;
  public scrollContent: number;
  public operatorModulePermission = false;
  public projectQueryParams: ProjectListQueryParams = {
    page: 1,
    perPage: 10,
    sortField: 'createdAt',
    sortOrder: 'asc',
    fieldSet: '_id,name'
  };
  public maxDate = new Date('12/31/9999');
  static getSnackBarConfig(): MatSnackBarConfig {
    return {
      duration: 5000
    };
  }
  originalOrder = (
    a: KeyValue<number, string>,
    b: KeyValue<number, string>
  ): number => {
    return 0;
  }
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private inventoryService: InventoryService,
    public workspaceApi: WorkspaceV3Service,
    public themeService: ThemeService,
    public cdRef: ChangeDetectorRef,
    private matSnackBar: MatSnackBar,
    public activatedRoute: ActivatedRoute,
    private marketPlanService: MarketPlanService,
    private filterService: FiltersService,
    private authService: AuthenticationService
  ) {
    super(workspaceApi, cdRef);
  }

  ngOnInit(): void {
    this.onResize();
    this.themeSettings = this.themeService.getThemeSettings();
    this.clientId = this.themeSettings.clientId;
    this.loadProjects();
    this.defaultAudience = this.activatedRoute.snapshot.data.defaultAudience;
    this.orientation = new Orientation();
    this.projectPermission = this.authService.getModuleAccess('v3workspace');
    this.operatorModulePermission = (this.projectPermission?.['scenarios']?.['operators']?.['status'] === 'active');

    // Permissions
    this.mod_permission = this.authService.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory'][
      'status'
    ];
    this.audienceLicense = this.authService.getModuleAccess('gpAudience');

    this.isVisibleMarketPlanTab =
      this.projectPermission?.['scenarios']?.['marketPlans']?.['status'] ===
      'active';

    this.isVisibleInventoryTab =
      this.projectPermission?.['scenarios']?.['package']?.['status'] ===
      'active';

    if (!this.isVisibleMarketPlanTab) {
      this.selectedTabIndex = 0;
      this.selectedTabLabel = ScenarioPlanTabLabels.INVENTORY_PLAN;
    }

    const queryParams = this.activatedRoute.snapshot.queryParams;
    if (queryParams?.planType === 'inventory') {
      this.selectedTabIndex = 1
    }
    if (queryParams?.scenarioId) {
      this.getScenarioDetails(queryParams.scenarioId);
    }


    this.scenarioForm = this.fb.group(
      {
        scenario_tags: [[]],
        name: new FormControl(null, [
          CustomValidators.noWhitespaceValidator(false)
        ]),
        description: new FormControl(null,
          CustomValidators.noWhitespaceValidator(false)
        ),
        project: new FormControl(null,),
        delivery_period_weeks: 1,
        goals: this.fb.group({
          type: 'trp',
          allocationMethod: 'equal',
          effectiveReach: '1',
          trp: [
            200,
            [Validators.pattern(this.deliveryNumericPattern), Validators.min(1)]
          ],
          reach: [
            null,
            [
              Validators.pattern(Patterns.DECIMAL_NUMBER),
              Validators.max(100),
              Validators.min(1)
            ]
          ],
          frequency: [null, Validators.pattern(this.numericPattern)],
          imp: [
            null,
            [Validators.pattern(this.deliveryNumericPattern), Validators.min(1)]
          ]
        }),
        plan_period_type: 'generic'
      }, {
      validator: [CustomValidators.validSelectProject('project')]
    }
    );

    this.inventoryForm = this.fb.group({
      project: new FormControl(null),
      name: new FormControl(null, [
        CustomValidators.noWhitespaceValidator(false)
      ]),
      description: new FormControl(null,
        CustomValidators.noWhitespaceValidator(false)
      ),
      plan_period_type: 'generic',
      delivery_period_weeks: 1,
      spot_schedule: this.fb.group(
        {
          start: [null],
          end: [null]
        },
        { validator: CustomValidators.validDateRange('start', 'end') }
      ),
      includeOutsideMarketInvs: false
    }, {
      validator: [CustomValidators.validSelectProject('project')]
    });

    this.inventoryForm.controls['plan_period_type'].valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
      if (value === 'specific') {
        this.inventoryForm.controls.spot_schedule['controls']['start'].setValidators([Validators.required]);
        this.inventoryForm.controls.spot_schedule['controls']['end'].setValidators([Validators.required]);
      } else {
        this.inventoryForm.controls.spot_schedule['controls']['start'].setValidators(null);
        this.inventoryForm.controls.spot_schedule['controls']['end'].setValidators(null);
      }
    });

    if (this.activatedRoute.snapshot.queryParams['projectId']) {
      if (history.state?._id) {
        this.project = history.state;
        this.projectParams = {};
        this.projectLink = `/workspace-v3/projects/${this.activatedRoute.snapshot.queryParams['projectId']}`
        if (this.project && this.project.isDraft) {
          this.projectLink = `/workspace-v3/projects/list`;
          this.projectParams = {type: 'sandbox'};
        }
        this.scenarioForm.get('project').setValue(this.project);
      } else {
        this.workspaceApi
          .getProject(this.activatedRoute.snapshot.queryParams['projectId'])
          .subscribe((result) => {
            this.projectParams = {};
            this.projectLink = `/workspace-v3/projects/${this.activatedRoute.snapshot.queryParams['projectId']}`
            if (result && result.isDraft) {
              this.projectLink = `/workspace-v3/projects/list`;
              this.projectParams = {type: 'sandbox'};
            }
            this.project = result;
            this.scenarioForm.get('project').setValue(result);
          });
      }
    }
    this.setDefaultProject$.pipe(take(1)).subscribe((sandboxProject) => {
      if (!this.activatedRoute.snapshot.queryParams['projectId']) {
        if (this.selectedTabLabel === ScenarioPlanTabLabels.MARKET_PLAN) {
          const project = this.scenarioForm.get('project').value;
          if (project === null) {
            this.scenarioForm.get('project').setValue(sandboxProject);
          }
        } else {
          const project = this.inventoryForm.get('project').value;
          if (project === null) {
            this.inventoryForm.get('project').setValue(sandboxProject);
          }
        }
      }
    })
    this.scenarioForm.controls.goals['controls'].type.valueChanges.subscribe(
      (value) => {
        switch (value) {
          case 'reach':
            this.scenarioForm.controls['goals'].get('trp').setValidators([]);
            this.scenarioForm.controls['goals'].get('imp').setValidators([]);
            this.scenarioForm.controls['goals']
              .get('reach')
              .setValidators([
                Validators.pattern(Patterns.DECIMAL_NUMBER),
                Validators.max(100),
                Validators.min(1)
              ]);
            break;
          case 'imp':
            this.scenarioForm.controls['goals'].get('trp').setValidators([]);
            this.scenarioForm.controls['goals'].get('reach').setValidators([]);
            this.scenarioForm.controls['goals']
              .get('imp')
              .setValidators([
                Validators.pattern(this.deliveryNumericPattern),
                Validators.min(1)
              ]);
            break;
          case 'trp':
            this.scenarioForm.controls['goals'].get('reach').setValidators([]);
            this.scenarioForm.controls['goals'].get('imp').setValidators([]);
            this.scenarioForm.controls['goals']
              .get('trp')
              .setValidators([
                Validators.pattern(this.deliveryNumericPattern),
                Validators.min(1)
              ]);
            break;
          default:
            break;
        }
      }
    );

    this.workspaceApi.getDurations().subscribe((durations) => {
      if (durations['durations']) {
        this.periodDurations = durations['durations'];
      } else {
        this.periodDurations = [
          { duration: 1, isDefault: true, unit: 'week' },
          { duration: 2, isDefault: false, unit: 'weeks' },
          { duration: 4, isDefault: false, unit: 'weeks' },
          { duration: 8, isDefault: false, unit: 'weeks' },
          { duration: 12, isDefault: false, unit: 'weeks' },
          { duration: 26, isDefault: false, unit: 'weeks' },
          { duration: 52, isDefault: false, unit: 'weeks' }
        ];
      }
    });

    // TODO:  This service function will move parent component
    const filterData = {};
    filterData['summary_level_list'] = ['Plant'];
    filterData['measures_required'] = false;
    filterData['status_type_name_list'] = ['*'];
    // filterData['measures_range_list'] = [{ type: 'imp', min: 0 }];
    this.inventoryService
      .getOperators(filterData)
      .subscribe((operators) => {
        this.operators = operators;
      });

    this.setFilterProjectFormSearch(this.scenarioForm, 'project');
    this.setFilterProjectFormSearch(this.inventoryForm, 'project');

    // this.scenarioForm?.controls?.goals['controls']?.trp.valueChanges
    //   .pipe(debounceTime(1500))
    //   .subscribe((trp) => {
    //     // debugger;
    //     // this.formatDeliveryGoals('trp', trp);
    //   });
    //
    // this.scenarioForm?.controls?.goals['controls']?.imp.valueChanges
    //   .pipe(debounceTime(1500))
    //   .subscribe((imp) => {
    //     this.formatDeliveryGoals('imp', imp);
    //   });

    // this.scenarioForm?.controls?.goals['controls']?.reach.valueChanges
    //   .pipe(debounceTime(1500))
    //   .subscribe((reach) => {
    //     this.formatDeliveryGoals('reach', reach);
    //   });

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
    this.inventoryForm.controls.project.valueChanges
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
    this.updateErrorList();
    this.adjustDeliveryGoals();
  }

  ngAfterViewInit() {
    this.onResize();
  }

  formatDeliveryGoals(formControlName, formValue) {
    if (formValue != null && !isNaN(formValue)) {
      let number = numeral(formValue).format('0,0');
      let formatValue = null;
      if (number !== '0') {
        formatValue = number;
        // Set the error if reach greater then 100
        if (
          formControlName === 'reach' &&
          Number(numeral(formValue).format('0')) > 100
        ) {
          this.scenarioForm.controls.goals['controls'][
            formControlName
          ].setErrors({ required: true });
          this.scenarioForm.controls.goals['controls'][
            formControlName
          ].setValue(Number(numeral(formValue).format('0')), {
            emitEvent: false
          });
        } else {
          this.scenarioForm.controls.goals['controls'][
            formControlName
          ].setValue(formatValue, { emitEvent: false });
        }
      }

      this.cdRef.detectChanges();
    } else if (formValue != null) {
      this.scenarioForm.controls.goals['controls'][formControlName].setErrors({
        required: true
      });
      this.cdRef.markForCheck();
    }
  }

  public openAudienceDialog() {
    this.dialog
      .open(AudienceFilterDialogComponent, {
        height: '550px',
        data: { isScenario: true },
        width: '700px',
        closeOnNavigation: true,
        panelClass: 'audience-browser-container'
      })
      .afterClosed()
      .pipe(filter((result) => result?.targetAudience?.length))
      .subscribe((result) => {
        if (result?.targetAudience) {
          result.targetAudience.forEach((audienceObj) => {
            const index = this.selectedAudiences.findIndex(
              (audience) => audience.id === audienceObj.audience && audience.measuresRelease === audienceObj.measuresRelease
            );
            if (index < 0) {
              this.selectedAudiences.push({
                name: audienceObj.name,
                id: audienceObj.audience,
                audienceKey: audienceObj.audience,
                measuresRelease: audienceObj.measuresRelease
              });
            }
          });
          this.selectedAudiences = [...this.selectedAudiences];
          if (this.selectedAudiences.length > 0) {
            this.isAudienceSelected = true;
            this.isIPAudienceSelected = true;
            this.updateErrorList();
            if (this.selectedTabLabel === ScenarioPlanTabLabels.MARKET_PLAN && this.getDefaultAudienceIdx() !== -1) {
              this.isMPDefaultAudienceSelected = true;
            }
            this.adjustDeliveryGoals();
          }
          this.cdRef.markForCheck();
        }
      });
  }

  private adjustDeliveryGoals() {
    const shouldDisableReach = this.selectedAudiences
      .some(item => item.measuresRelease === 2021 || item.measuresRelease === 202106);
    if (shouldDisableReach || this.selectedAudiences.length === 0) {
      const deliveryGoalTypeField = this.scenarioForm.controls.goals['controls']['type'];
      if (deliveryGoalTypeField.value === 'reach') {
        deliveryGoalTypeField.patchValue('trp');
      }
      this.deliveryGoals = this.deliveryGoalsData
        .filter(item => item.name !== 'reach');
    } else {
      this.deliveryGoals = this.deliveryGoalsData;
    }
  }

  checkErrorList() {
    const errorListData = [];
    if (this.isAudienceSelected !== true) {
      errorListData.push(`${errorListData.length + 1}. Audience not Selected`);
    }
    if (this.isMarketSelected !== true) {
      errorListData.push(`${errorListData.length + 1}. Market not Selected`);
    }
    if (this.ismediaTypeSelected !== true) {
      errorListData.push(`${errorListData.length + 1}. Media Type not Selected`);
    }
    this.errorList = errorListData.join(' <br>');
    if (errorListData.length > 0) {
      this.errorClass = 'imx-tooltip-v3';
    }
    this.cdRef.markForCheck();
  }

  checkInventoryPlanErrorList() {
    const errorListData = [];
    if (this.isIPAudienceSelected !== true && this.deleteDefaultAudience) {
      errorListData.push(`${errorListData.length + 1}. Audience not Selected`);
    }
    if (this.isIPMarketSelected !== true && this.deleteDefaultMarket) {
      errorListData.push(`${errorListData.length + 1}. Market not Selected`);
    }
    this.errorListIP = errorListData.join(' <br>');
    if (errorListData.length > 0) {
      this.errorClassIP = 'imx-tooltip-v3';
    }
    this.cdRef.markForCheck();
  }

  public openMarketDialog() {
    const dialogData = {
      title: 'SELECT MARKET(S)',
      marketType: this.selectedMarketType
    };
    this.dialog
      .open(MarketFilterDialogComponent, {
        // height: '464px',
        data: dialogData,
        width: '642px',
        closeOnNavigation: true,
        panelClass: 'imx-market-dialog-container'
      })
      .afterClosed()
      .pipe(filter((res) => !!res?.selectedOptions.length))
      .subscribe((result) => {
        this.selectedMarketType = result.marketType;
        this.selectedMarket = this.workspaceApi.setAndValidateMarkets(
          this.selectedMarket,
          result.selectedOptions,
          result.addAsGroup,
          result.marketType
        );
        if (this.selectedMarket.length > 0) {
          // Ask selected market asign to location
          if (this.shouldAskUserForConsent(this.selectedMarket) && this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN) {
            this.inventoryService
              .showGeographiesOverrideDiaglog()
              .afterClosed()
              // tslint:disable-next-line:no-shadowed-variable
              .subscribe((confirm) => {
                // if user wants to apply the same markets as location filter
                if (confirm['action']) {
                  this.locationFilters = this.convertMarketsToLocations(
                    this.selectedMarket
                  );
                  this.updateSelectCount();
                  this.cdRef.markForCheck();
                }
              });
          }

          this.isMarketSelected = true;
          this.isIPMarketSelected = true;
          this.deleteDefaultMarket = true;
          this.updateErrorList();

        }
        this.cdRef.markForCheck();
      });
  }

  // whether we need to ask the user for the location filter override or not
  private shouldAskUserForConsent(selectedMarket: Array<any>) {
    // when they selected only US/National, don't ask. Otherwise ask
    return (
      selectedMarket.length > 1 ||
      (selectedMarket.length === 1 && selectedMarket[0]['id'] !== 'global')
    );
  }

  /**
 * Method to convert the selected markets into the format of location widget results, see the return type
 * @param selectedMarkets
 * @return array of ILocationFilters;
 */
  private convertMarketsToLocations(selectedMarkets): ILocationFilters[] {
    const selectedLocations: ILocationFilters[] = [];
    selectedMarkets.forEach((item) => {
      // if it is group selection use recursion to convert the group of markets.
      if (item.marketsGroup) {
        const nestedResults = this.convertMarketsToLocations(item.marketsGroup);
        selectedLocations.push(...nestedResults);
      } else {
        if (!this.isDuplicate(item.id, selectedLocations)) {
          selectedLocations.push({
            id: item.id,
            type: this.getGeoTypeFromID(item.id),
            label: item.name
          });
        }
      }
    });
    return selectedLocations;
  }

  private isDuplicate(geoId, locationArray: ILocationFilters[]) {
    return locationArray.find((item) => item.id === geoId);
  }

  private getGeoTypeFromID(id: string): 'DMA' | 'CBSA' | 'County' {
    if (id.includes('DMA')) {
      return 'DMA';
    } else if (id.includes('CBSA')) {
      return 'CBSA';
    } else if (id.includes('CNTY')) {
      return 'County';
    }
  }
  public openSelectOperatorDialog() {
    const dialogData = {
      operators: this.operators,
      type: 'create'
    };
    const scenario = Helper.deepClone(this.scenarioForm.value);
    delete scenario['project'];
    delete scenario['goals'];

    if (this.operatorFilters?.length) {
      scenario['operators'] = {
        enabled: true,
        data: this.operatorFilters
      };
    }

    dialogData['scenario'] = scenario;
    dialogData['selectedPlanTab'] = this.selectedTabLabel;
    this.dialog
      .open(SelectOperatorPopupComponent, {
        panelClass: 'imx-mat-dialog',
        width: '590px',
        height: '620px',
        data: dialogData
      })
      .afterClosed()
      .subscribe((data) => {
        if (data?.filterData?.filterType) {
          if (data?.filterData?.selectedFilters?.filterInventory?.operator) {
            this.operatorFilters = data?.filterData?.selectedFilters?.filterInventory?.operator['selectedOptions']
              .map((op) => op.id === 'all' ? 'all' : op.name);
          }
          this.updateSelectCount();
          this.cdRef.detectChanges();
        }
      });
  }

  public openSelectInvnetoryDialog() {
    const dialogData = {
      operators: this.operators,
      type: 'create'
    };
    const scenario = Helper.deepClone(this.scenarioForm.value);
    delete scenario['project'];
    delete scenario['goals'];
    const inventoryIDs = [];
    if (this.selectedMarket.length > 0) {
      scenario['market'] = this.selectedMarket;
    } else {
      scenario['market'] = this.defaultMarket;
    }
    if (this.selectedAudiences.length > 0) {
      scenario['audiences'] = this.selectedAudiences;
    } else {
      scenario['audiences'] = [
        {
          id: this.defaultAudience['audienceKey'],
          name: this.defaultAudience['description'],
          measuresRelease: this.defaultAudience['measuresRelease']
        }
      ];
    }
    if (this.mediaAttributes) {
      scenario['mediaAttributes'] = this.mediaAttributes;
    }
    if (this.measureRangeFilters) {
      scenario['measureRangeFilters'] = this.workspaceApi.formatThreshold(
        this.measureRangeFilters
      );
    }
    if (this.locationFilters) {
      scenario['locationFilters'] = {
        enabled: true,
        data: this.locationFilters
      };
    }
    if (this.mediaTypeFilters) {
      const mediaTypeFilters = {
        enabled: true,
        data: []
      };
      mediaTypeFilters['data'] = this.mediaTypeFilters;
      mediaTypeFilters['enabled'] = mediaTypeFilters['data'].length > 0;
      scenario['mediaTypeFilters'] = mediaTypeFilters;
    }
    if (this.operatorFilters?.length) {
      scenario['operators'] = {
        enabled: true,
        data: this.operatorFilters
      };
    }
    if (this.selectedPackages?.length) {
      scenario['package'] = this.selectedPackages;
    }
    dialogData['scenario'] = scenario;
    // TODO: Need to change
    dialogData['selectedPlanTab'] = this.selectedTabLabel;
    // saving the dialog ref for later reference IMXMAINT-51.
    this.dialog.open(
      SelectInventoryPopupComponent,{
        panelClass: 'imx-mat-dialog',
        width: '590px',
        height: '800px',
        data: dialogData
      })
      .afterClosed()
      .subscribe((data) => {
        if (data?.filterData?.filterType) {
          if (data?.filterData?.selectedFilters?.marketData) {
            this.selectedMarketType = data?.filterData?.selectedFilters?.marketType;
          }

          if (data?.filterData?.selectedFilters?.selected == 'filterInventory' &&
            this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN) {
            data.filterData.selectedFilters.filterInventory = Helper.shallowClone(
              data.filterData.selectedFilters.filterInventory
            );
            delete data.filterData.selectedFilters.filterInventory?.operator;
          }

          this.setFilterInventory(data);
          this.formatInventoryFilter();
        }
      });
  }

  private setFilterInventory(data: any) {

    let existingIndex = -1;

    if (data?.filterData?.selectedFilters?.selected == 'filterInventory' &&
      this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN) {
      if (data?.filterData?.selectedFilters?.filterInventory?.hasOwnProperty?.('operator')) {
        existingIndex = this.selectedInventory.findIndex(
          (inventory) =>
            inventory?.selectedFilters.selected ===
            data?.filterData?.selectedFilters?.selected &&
            inventory.selectedFilters.filterInventory?.hasOwnProperty?.(
              'operator'
            ) ===
            data.filterData.selectedFilters.filterInventory?.hasOwnProperty?.(
              'operator'
            )
        );
      } else {
        existingIndex = this.selectedInventory.findIndex(
          (inventory) =>
            inventory?.selectedFilters.selected ===
            data?.filterData?.selectedFilters?.selected &&
            !inventory.selectedFilters.filterInventory?.hasOwnProperty?.(
              'operator'
            ) ===
            !data?.filterData.selectedFilters.filterInventory?.hasOwnProperty?.(
              'operator'
            )
        );
      }
    } else {
      existingIndex = this.selectedInventory.findIndex(
        (inventory) =>
          inventory?.selectedFilters.selected ===
          data?.filterData?.selectedFilters?.selected
      );
    }

    if (existingIndex > -1) {
      this.selectedInventory.splice(existingIndex, 1);
    }
    this.selectedInventory.push(data?.filterData);
    this.cdRef.markForCheck();
  }

  public projectTrackByFn(index, item: Project) {
    return item._id;
  }

  // To make inifinte scroll work, we need to set container when the autocomplete overlay panel is opened
  public updateContainer() {
    this.panelContainer = '.project-list-autocomplete';
  }
  public displayTitle(project) {
    return project?.name ?? project;
  }
  deleteConfirmation() {
    return this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(filter((result) => result && result.action));
  }
  public removeFilterFormInventory(planType, index = 0) {
    switch (planType) {
      case 'audience':
        this.selectedAudiences.splice(index, 1);
        const idx = this.getDefaultAudienceIdx();
        if (!this.deleteDefaultAudience && this.selectedTabLabel == ScenarioPlanTabLabels.INVENTORY_PLAN) {
          if (idx > -1 && idx === index || idx === -1 && index === 0) this.deleteDefaultAudience = true; // default audience index is -1 then selectedAudience index is 0 for defaultAudience
        }
        if (this.selectedTabLabel == ScenarioPlanTabLabels.MARKET_PLAN) {
          if (idx === index) this.isMPDefaultAudienceSelected = false;
          this.adjustDeliveryGoals();
          this.cdRef.markForCheck();
        }
        if (!this.selectedAudiences.length) {
          this.isAudienceSelected = false;
          this.isIPAudienceSelected = !this.deleteDefaultAudience;
          this.updateErrorList();
        }
        break;
      case 'market':
        this.selectedMarket.splice(index, 1);
        break;
      case 'media':
        this.mediaTypeFilters.splice(index, 1);
        this.ismediaTypeSelected = !!this.mediaTypeFilters.length;
        break;
      case 'location':
        this.locationFilters.splice(index, 1);
        break;
      case 'operator':
        this.operatorFilters.splice(index, 1);
        break;
      case 'inventorySet':
        if (this.selectedPackages[index]) {
          this.removeDeletedPackageInventoryIds(this.selectedPackages[index]);
        }
        this.selectedPackages.splice(index, 1);
        break;
      case 'MediaAttribute':
        this.selectedMediaAttributes = null;
        this.mediaAttributes = null;
        break;
      case 'geopathPanel':
        this.inventoryIDs = [];
        break;
      default:
        break;
    }
    this.updateSelectCount();
  }

  private updateErrorList() {
    this.checkErrorList();
    this.checkInventoryPlanErrorList();
  }
  public removeDeletedPackageInventoryIds(inventorySet) {
    this.selectedInventory.forEach((inventoryInfo, index) => {
      if (inventoryInfo?.filterType === 'Inventory' && inventoryInfo?.selectedFilters?.selected === 'packagePanel') {
        if (inventoryInfo.selectedFilters.additionalData.length === 1) {
          const setIds = inventoryInfo.selectedFilters.additionalData[index]?.['inventory'] ?? [];
          this.inventoryIDs = this.inventoryIDs.filter(id => !setIds.includes(id));
          this.selectedInventory.splice(index, 1);
          this.inventoryIDs = [];
        } else {
          inventoryInfo.selectedFilters.additionalData.forEach((inventorySetData, setIndex) => {
            if (inventorySetData['name'] === inventorySet['name']) {
              const ids = inventorySetData['inventory'].map((idObject) => idObject.id);
              inventoryInfo.selectedFilters.data = inventoryInfo.selectedFilters.data.filter(id => !ids.includes(id));
              this.inventoryIDs = this.inventoryIDs.filter(idObject => !ids.includes(idObject.id));
              inventoryInfo.selectedFilters.additionalData.splice(setIndex, 1);
            }
          })
        }
      }
    });
  }

  public removeSelectedMarkets(marketName) {
    this.selectedMarket = this.selectedMarket.filter((market) => market['name'] !== marketName);
    this.updateSelectCount();
    if (!this.selectedMarket?.length) {
      this.isMarketSelected = false;
      this.isIPMarketSelected = !this.deleteDefaultMarket;
      this.updateErrorList();
    }
  }
  public removeAuditStatusFilter(index) {
    if (this.selectedMediaAttributes['auditStatusList']?.length) {
      this.selectedMediaAttributes['auditStatusList'].splice(index, 1);
      if (!this.selectedMediaAttributes['auditStatusList']?.length) {
        delete this.selectedMediaAttributes['auditStatusList']
        this.deleteMediaAttributes();
        this.updateSelectCount();
      }
    }
  }
  public removeMediaAttributes(key) {
    if (key && typeof this.selectedMediaAttributes[key] !== 'undefined') {
      delete this.selectedMediaAttributes[key];
      this.updateSelectCount();
      this.deleteMediaAttributes();
    }
  }
  // To remove main object if child objects are removed
  private deleteMediaAttributes() {
    if (!Object.keys(this.selectedMediaAttributes).length) {
      this.selectedMediaAttributes = null;
      this.mediaAttributes = null;
      this.checkErrorList();
    }
  }
  public removeThresholdFilters(key) {
    if (key && this.measureRangeFilters[key]) {
      delete this.measureRangeFilters[key];
      this.updateSelectCount();
      // TODO: need to check why isObjectExist pipe is not triggering
      if (!Object.keys(this.measureRangeFilters).length) {
        this.measureRangeFilters = null;
      }
    }
  }
  public trackById(index, item) {
    return item.id;
  }

  public trackAudiences(index, item) {
    return item.id;
  }
  public trackMediaType(index, item) {
    return item.data;
  }

  /**
   * @description
   * method to watch and set value on matInput VALUE tag 
   * due to angular mat datepicker custom parse we get NULL if users enters 555555 (6 digit number) (IMXUIPRD-3524)
   *   in that case matInput value not getting updated while reactive form value does, so custom update made it
   * 
   * Max date error alert maintained to validate date which have more than 12/31/9999
   */
   changeDate(event, type = 'start') { 
    const dtValue = this.inventoryForm.controls.spot_schedule['controls'][type].value;
    if (!dtValue) {
      document.getElementById(type + 'DtPicker')['value'] = dtValue;
    }
  }

  formatInventoryFilter(resetInventoryCount = true) {
    this.mediaAttributes = null;
    this.measureRangeFilters = null;
    this.locationFilters = null;
    if (this.selectedTabLabel !== ScenarioPlanTabLabels.INVENTORY_PLAN) {
      this.operatorFilters = null;
    }

    this.mediaTypeFilters = null;
    this.selectedMediaAttributes = null;
    this.selectedPackages = [];
    this.filterMarketsFormIDs = [];
    if (resetInventoryCount) {
      this.inventoryCount = 0;
    }
    let filterMarketsFormIDFlag = false;
    if (this.selectedInventory.length > 0) {
      this.selectedInventory.forEach((inventory) => {
        switch (inventory.selectedFilters.selected) {
          case 'packagePanel':
            inventory.selectedFilters.additionalData.forEach((d) => {
              this.selectedPackages.push({ id: d['_id'], name: d['name'] });
            });
            inventory.selectedFilters.data.forEach((d) => {
              this.inventoryIDs.push({
                id: d,
                type: 'geopathPanel'
              });
            });
            this.inventoryIDs = Helper.removeDuplicate(this.inventoryIDs, 'id');
            if (inventory.selectedFilters?.marketData) {
              this.filterMarketsFormIDs.push(
                ...(inventory.selectedFilters?.marketData || [])
              );
              filterMarketsFormIDFlag = true;
            }

            break;
          case 'geopathPanel':
            inventory.selectedFilters.data.forEach((d) => {
              this.inventoryIDs.push({
                id: d,
                type: 'geopathPanel'
              });
            });
            this.inventoryIDs = Helper.removeDuplicate(this.inventoryIDs, 'id');

            if (inventory.selectedFilters?.marketData) {
              this.filterMarketsFormIDs.push(
                ...(inventory.selectedFilters?.marketData || [])
              );
              filterMarketsFormIDFlag = true;
            }

            break;
          case 'filterInventory':
            Object.keys(inventory.selectedFilters.filterInventory).forEach(
              (key) => {
                switch (key) {
                  case 'mediaAttributes':
                    this.selectedMediaAttributes =
                      inventory.selectedFilters.filterInventory[key];
                    this.mediaAttributes = this.workspaceApi.formatMediaattribute(
                      inventory.selectedFilters.filterInventory[key]
                    );
                    break;
                  case 'thresholds':
                    this.measureRangeFilters =
                      inventory.selectedFilters.filterInventory[key];
                    break;
                  case 'location':
                    this.locationFilters =
                      inventory.selectedFilters.filterInventory[key]['data'];
                    break;
                  case 'operator':
                    if (this.selectedTabLabel !== ScenarioPlanTabLabels.INVENTORY_PLAN) {
                      this.operatorFilters = inventory.selectedFilters.filterInventory[
                        key
                      ]['selectedOptions']
                        .map((op) => op.id === 'all' ? 'all' : op.name);
                    }
                    break;
                  case 'mediaTypeFilters':
                    this.mediaTypeFilters =
                      inventory.selectedFilters.filterInventory[key];
                    break;
                  default:
                    break;
                }
              }
            );
            break;
          default:
            break;
        }
      });
    }
    if (filterMarketsFormIDFlag) {
      this.selectedMarket = this.filterMarketsFormIDs;
      if (this.selectedMarket?.length > 0) {
        this.isMarketSelected = true;
        this.isIPMarketSelected = true;
        this.updateErrorList();
      }
    }
    this.updateSelectCount(resetInventoryCount);
    this.cdRef.detectChanges();
  }
  private updateSelectCount(countOnlyInventory = true) {

    if (!countOnlyInventory || this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN || this.selectedTabLabel === ScenarioPlanTabLabels.MARKET_PLAN) {
      this.operatorCount = 0;
      if (this.operatorFilters?.length > 0) {
        this.operatorCount = this.operatorFilters.length;
      }
    }

    this.inventoryCount = 0;
    if (
      this.selectedMediaAttributes !== null &&
      Object.keys(this.selectedMediaAttributes).length > 0
    ) {
      this.inventoryCount += 1;
    }
    if (
      this.measureRangeFilters !== null &&
      Object.keys(this.measureRangeFilters).length > 0
    ) {
      this.inventoryCount += 1;
    }
    if (
      this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN &&
      this.selectedPackages.length > 0
    ) {
      this.inventoryCount += 1;
    }
    if (
      this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN &&
      this.inventoryIDs.length > 0 && !this.selectedPackages?.length
    ) {
      this.inventoryCount += 1;
    }
    if (
      this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN &&
      this.locationFilters !== null &&
      this.locationFilters.length > 0
    ) {
      this.inventoryCount += 1;
    }
    if (this.mediaTypeFilters?.length > 0) {
      this.inventoryCount += 1;
    }
    // if (this.operatorFilters?.length > 0 && this.selectedTabLabel === ScenarioPlanTabLabels.MARKET_PLAN) {
    //   this.inventoryCount += 1;
    // }
    if (this.mediaTypeFilters?.length > 0) {
      this.ismediaTypeSelected = true;
      this.checkErrorList();
    } else {
      this.checkErrorList();
    }
  }
  private onGeneratePlanData() {
    const goals = {
      trp: this.scenarioForm.value['goals']['trp'],
      reach: this.scenarioForm.value['goals']['reach'],
      frequency: 0,
      imp: this.scenarioForm.value['goals']['imp'],
      type: this.scenarioForm.value['goals']['type'],
      duration: Number(this.scenarioForm.value['delivery_period_weeks']),
      effectiveReach: Number(
        this.scenarioForm.value['goals']['effectiveReach']
      ),
      allocationMethod: this.scenarioForm.value['goals']['allocationMethod']
    };
    const plans: Plan[] = [];
    this.selectedAudiences.forEach((audience: Filter) => {
      this.selectedMarket.forEach((market: Market) => {
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
          measureRangeFilters: [this.measureRangeFilters],
          mediaAttributes: this.mediaTypeFilters,
          locationFilters: this.locationFilters
        };
        if (query.operators && query.operators.length === 0) {
          delete query['operators'];
        }
        plans.push({
          query: query
        });
      });
    });
    const markets = this.selectedMarket.map((i) => {
      return {
        id: i.id,
        name: i.name,
        marketsGroup: i['marketsGroup'] || []
      };
    });
    const marketPlan: MarketPlan = {
      targets: {
        audiences: this.selectedAudiences,
        markets: markets,
        goals: goals,
        mediaTypeFilters: this.marketPlanService.cleanMediaTypeData(
          this.mediaTypeFilters
        ),
        operators: this.operatorFilters,
        measureRangeFilters: [this.measureRangeFilters],
        locationFilters: this.locationFilters
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
  private checkValidationForMarketPlan(type = 'market') {
    if (
      type !== 'market' ||
      (this.selectedAudiences?.length > 0 &&
        this.selectedMarket?.length > 0 &&
        this.mediaTypeFilters?.length > 0)
    ) {
      this.errorClass = 'dispNone';
      return true;
    } else {
      const config = CreateScenarioComponent.getSnackBarConfig();
      this.matSnackBar.open(
        'Market Plan should have atleast one Audience, Market and Media Type',
        'DISMISS',
        {
          ...config
        }
      );
      const errorListData = [];
      if (!this.selectedAudiences.length) {
        this.isAudienceSelected = false;
        errorListData.push(`${errorListData.length + 1}. Audience not Selected`);
        this.cdRef.markForCheck();
      } else {
        this.isAudienceSelected = true;
      }
      if (!this.selectedMarket.length) {
        this.isMarketSelected = false;
        errorListData.push(`${errorListData.length + 1}. Market not Selected`);
        this.cdRef.markForCheck();
      } else {
        this.isMarketSelected = true;
      }
      if (!this.mediaTypeFilters?.length) {
        this.ismediaTypeSelected = false;
        errorListData.push(`${errorListData.length + 1}. Media Type not Selected`);
        this.cdRef.markForCheck();
      } else {
        this.ismediaTypeSelected = true;
      }     

      this.errorList = errorListData.join(' <br>');
      if (errorListData.length > 0) {
        this.errorClass = 'imx-tooltip-v3';
      }
      return false;
    }
  }

  private checkValidationForInventoryPlan() {
    if (
      ((this.selectedAudiences?.length > 0 || !this.deleteDefaultAudience) &&
        (this.selectedMarket?.length > 0 || !this.deleteDefaultMarket))
    ) {
      this.errorClassIP = 'dispNone';
      return true;
    } else {
      const config = CreateScenarioComponent.getSnackBarConfig();
      this.matSnackBar.open(
        'Inventory Plan should have atleast one Audience and Market',
        'DISMISS',
        {
          ...config
        }
      );
      const errorListData = [];
      if (!this.selectedAudiences.length && this.deleteDefaultAudience) {
        this.isIPAudienceSelected = false;
        errorListData.push(`${errorListData.length + 1}. Audience not Selected`);
        this.cdRef.markForCheck();
      } else {
        this.isIPAudienceSelected = true;
      }
      if (!this.selectedMarket.length && this.deleteDefaultMarket) {
        this.isIPMarketSelected = false;
        errorListData.push(`${errorListData.length + 1}. Market not Selected`);
        this.cdRef.markForCheck();
      } else {
        this.isIPMarketSelected = true;
      }

      this.errorListIP = errorListData.join(' <br>');
      if (errorListData.length > 0) {
        this.errorClassIP = 'imx-tooltip-v3';
      }
      return false;
    }
  }

  public onMarketPlanSubmit(scenarioForm, type = 'market') {
    if (!scenarioForm.value?.['project']?.['_id']) {
      this.scenarioForm.get('project').patchValue(this.draftProject);
      this.inventoryForm.get('project').patchValue(this.draftProject);
    }
    /**
     * Scenario create will be 3 steps.
     * 1. Create default inventory set to manage inventory plan
     * 2. Create scenario with created inventory set ids
     * 3. Add audinces, markets and inventory for market plan its only for Market Plan tab (optional)
     */
    if (type === 'market') {
      const value = this.scenarioForm.controls['goals'].get('type').value;
      switch (value) {
        case 'reach':
          this.scenarioForm.controls['goals'].get('trp').patchValue(null);
          this.scenarioForm.controls['goals'].get('imp').patchValue(null);
          break;
        case 'imp':
          this.scenarioForm.controls['goals'].get('trp').patchValue(null);
          this.scenarioForm.controls['goals'].get('reach').patchValue(null);
          break;
        case 'trp':
          this.scenarioForm.controls['goals'].get('imp').patchValue(null);
          this.scenarioForm.controls['goals'].get('reach').patchValue(null);
          break;
        default:
          break;
      }
    }
    let checkValidation: boolean;
    if (scenarioForm.controls['plan_period_type'].value === 'generic') {
      const delivery_period_weeks = scenarioForm.controls['delivery_period_weeks'].value;
      if(this.checkMeasureRelease() && (delivery_period_weeks === 26 || delivery_period_weeks === 52)) {
        scenarioForm.controls['delivery_period_weeks'].setErrors({
          type: 'planPeriodConflict',
          message: 'planPeriodConflict.'
        });
      } else {
        scenarioForm.controls['delivery_period_weeks'].setErrors(null);
      }
    }
    
    if (type === 'market') {
      checkValidation = this.checkValidationForMarketPlan(type);
    } else {
      checkValidation = this.checkValidationForInventoryPlan();
    }
    if (scenarioForm.valid && checkValidation) {
      const delivery_period_weeks = scenarioForm.controls['delivery_period_weeks'].value;
      if (scenarioForm.controls['plan_period_type'].value === 'generic' && (this.selectedAudiences.filter((aud) => aud.measuresRelease === 2020).length > 0 && this.selectedAudiences.filter((aud) => aud.measuresRelease === 2021).length > 0) && (delivery_period_weeks === 26 || delivery_period_weeks === 52)) {
        this.getInformationPopupState().subscribe((flag) => {
          if (flag !== undefined && !flag) {
            this.submitToServer(scenarioForm, type);
          }
        });
      } else {
        this.submitToServer(scenarioForm, type);
      }
    }
  }
  submitToServer(scenarioForm, type) {
    if (!scenarioForm.value?.['project']?.['_id']) {
      scenarioForm.controls.project.patchValue(this.draftProject);
    }
    this.generatingBtn = true;
    const scenario = Helper.deepClone(scenarioForm.value);
    if (!scenario?.description?.length) {
      delete scenario['description'];
    }
    delete scenario['project'];
    delete scenario['goals'];
    if (this.selectedMarket.length > 0) {
      scenario['market'] = this.selectedMarket;
    } else {
      scenario['market'] = this.defaultMarket;
    }
    if (this.selectedAudiences.length > 0) {
      scenario['audiences'] = this.selectedAudiences;
    } else {
      scenario['audiences'] = [
        {
          id: this.defaultAudience['audienceKey'],
          name: this.defaultAudience['description'],
          measuresRelease: this.defaultAudience['measuresRelease']
        }
      ];
    }
    if (this.mediaAttributes) {
      scenario['mediaAttributes'] = this.mediaAttributes;
    }
    if (this.measureRangeFilters) {
      scenario['measureRangeFilters'] = this.workspaceApi.formatThreshold(
        this.measureRangeFilters
      );
    }
    if (
      this.locationFilters &&
      this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN
    ) {
      scenario['locationFilters'] = {
        enabled: true,
        data: this.locationFilters
      };
    }
    if (this.mediaTypeFilters) {
      const mediaTypeFilters = {
        enabled: true,
        data: []
      };
      mediaTypeFilters['data'] = this.mediaTypeFilters;
      scenario['mediaTypeFilters'] = mediaTypeFilters;
    }
    if (this.operatorFilters?.length) {
      scenario['operators'] = {
        enabled: true,
        data: this.operatorFilters
      };
    }
    const inventoryPackageData = {
      name: '',
      name_key: '',
      description: '',
      client_id: this.clientId,
      isScenarioInventorySet: true
    };
    if (
      this.selectedPackages?.length &&
      this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN
    ) {
      scenario['package'] = this.selectedPackages.map(
        (pack) => pack['id']
      );
    }
    if (this.selectedTabLabel === ScenarioPlanTabLabels.MARKET_PLAN) {
      scenario['delivery_period_weeks'] = Number(
        scenarioForm.value['delivery_period_weeks']
      );
      scenario['spot_schedule'] = null;
    } else {
      if (scenarioForm.value['plan_period_type'] === 'generic') {
        scenario['delivery_period_weeks'] = Number(
          scenarioForm.value['delivery_period_weeks']
        );
        scenario['spot_schedule'] = null;
      } else {
        scenario['delivery_period_weeks'] = null;
        scenario['spot_schedule'] = {
          start: this.workspaceApi.formatDate(scenarioForm.value['spot_schedule'].start),
          end: this.workspaceApi.formatDate(scenarioForm.value['spot_schedule'].end)
        }
      }
    }
    if (type !== 'market') {
      if (this.inventoryIDs.length > 0) {
        scenario['addInventoryFromFilter'] = false;
      } else {
        scenario['addInventoryFromFilter'] = true;
      }
    }
    scenario['type'] = type === 'market' ? 'MP' : 'IP';
    this.workspaceApi.createScenario(
      scenarioForm.value["project"]["_id"],
      scenario
    ).pipe(
      switchMap((scenarioResponse) => {
        if (scenarioResponse['status'] === 'success') {
          scenario['name'] = scenarioResponse['data']['name'];
          inventoryPackageData['name'] = scenarioResponse['data']['name'] + Date.now();
          return this.workspaceApi
            .saveInventoryPackage(inventoryPackageData, this.inventoryIDs).pipe(
              switchMap((packageResponse) => {
                if (packageResponse['status'] === 'success') {
                  scenario['scenarioInventorySetId'] =
                    packageResponse['data']['id'];
                  const updateScenario = {
                    scenario: scenario
                  };
                  return this.workspaceApi
                    .updateScenario(updateScenario, scenarioResponse['data']['id']['scenario']).pipe(
                      switchMap((response) => {
                        if (response['status'] === 'success') {
                          // Checking the plan type and performing corresponding actions
                          const config = CreateScenarioComponent.getSnackBarConfig();
                          this.matSnackBar.open(scenarioResponse.message, 'DISMISS', {
                            ...config
                          });
                          if (type === 'market') {
                            const marketPlanData = this.onGeneratePlanData();
                            return this.workspaceApi
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
                            return this.workspaceApi
                              .generateInventoryPlan(
                                scenarioResponse['data']['id']['scenario']
                              )
                              .pipe(
                                switchMap((invPlanResponse) => {
                                  if (invPlanResponse['status'] === 'success') {
                                    this.matSnackBar.open('Plan is being generated. We shall notify you soon.', 'DISMISS', {
                                      ...config
                                    });
                                  }
                                  return of(scenarioResponse)
                                }),
                                catchError((error) => {
                                  return of(scenarioResponse);
                                })
                              );
                          }
                        } else {
                          of(response)
                        }
                      })
                    )

                } else {
                  return of(packageResponse)
                }
              })
            )
        } else {
          return of(scenarioResponse);
        }
      })
    ).subscribe(
      (response) => {
        let url;
        // if (response.status === 'success') {
        //   const config = CreateScenarioComponent.getSnackBarConfig();
        //   this.matSnackBar.open(response.message, 'DISMISS', {
        //     ...config
        //   });
        // }
        if (type === 'inventory') {
          if (this.project && this.project.isDraft && this.project._id === response['data']['id']['project']) {
            url = `/workspace-v3/projects/list?type=sandbox`;
          } else {
            url = `/workspace-v3/projects/${response['data']['id']['project']}`;
          }
          // url = `/workspace-v3/projects/${response['data']['id']['project']}`;
        } else {
          url = `/workspace-v3/scenario/${response['data']['id']['scenario']}?projectId=${response['data']['id']['project']}&planType=${type}`;
        }
        this.router.navigateByUrl(url);
      },
      (error) => {
        if (error?.error?.code === 7087) {
          scenarioForm
            .get('name')
            .setErrors({ name_exists: true });
          this.generatingBtn = false;
          this.cdRef.detectChanges();
        } else {
          const config = CreateScenarioComponent.getSnackBarConfig();
          this.matSnackBar.open('Something went wrong', 'DISMISS', {
            ...config
          });
          this.generatingBtn = false;
        }

      }
    );
  }
  getInformationPopupState(): Observable<any> {
    const dialogueData = {
      title: 'Confirmation',
      description: 'Measurement with conflicting Plan Period could be erroneous, verify before Progressing.',
      confirmBtnText: 'OK',
      cancelBtnText: 'SKIP & CONTINUE'
    };
    return this.dialog.open(NewConfirmationDialogComponent, {
      data: dialogueData,
      width: '340px',
      height: '260px',
      panelClass: 'imx-mat-dialog'
    }).afterClosed()
      .pipe(
          takeUntil(this.unsubscribe$),
          map(res => res?.action)
      );
 }
  onSelectedTabChange(e) {
    this.selectedTabIndex = e.index;
    this.selectedTabLabel = e?.tab?.ariaLabel;
    let values = Helper.deepClone(this.scenarioForm.value);
    let fromGroup = this.inventoryForm;

    const defaultAudienceIdx = this.getDefaultAudienceIdx();
    if (this.selectedTabLabel === ScenarioPlanTabLabels.MARKET_PLAN) {
      values = Helper.deepClone(this.inventoryForm.value);
      fromGroup = this.scenarioForm;
      if (!this.deleteDefaultAudience && defaultAudienceIdx > -1 && !this.isMPDefaultAudienceSelected) {
        this.selectedAudiences.splice(defaultAudienceIdx, 1);
      }
      this.adjustDeliveryGoals();
      this.cdRef.markForCheck();
    }

    if (this.selectedTabLabel === ScenarioPlanTabLabels.INVENTORY_PLAN) {
      if (!this.deleteDefaultAudience && defaultAudienceIdx < 0) {
        this.selectedAudiences.unshift({
            ...this.defaultAudience,
            id: this.defaultAudience['audienceKey'],
            name: this.defaultAudience['description'],
            measuresRelease: this.defaultAudience['measuresRelease']
          });
      }
    }

    fromGroup.patchValue({
      name: values['name'],
      description: values['description'],
      project: values['project'],
      delivery_period_weeks: values['delivery_period_weeks']
    });
    this.updateSelectCount(false);
    this.cdRef.markForCheck();
  }
  onPlanPeriodTypeChange(e) {
    this.planPeriodType = e.value;
  }
  targetAudienceMinMax(value) {
    let original = value;
    if (value <= 15) {
      original = value * 5;
    } else if (value <= 90) {
      original = value - 15 + 75;
    } else if (value <= 160) {
      original = (value - 90) * (350 / 70) + 150;
    } else if (value <= 210) {
      original = (value - 160) * (500 / 50) + 500;
    }
    return original;
  }
  formatTimeLabel(time): string {
    return this.filterService.timeConvert(time + ':00:00');
  }

  getScenarioDetails(scenarioId) {
    forkJoin([
      this.workspaceApi.getScenariobyId(scenarioId),
      this.workspaceApi.getScenarioMediaTypes(scenarioId).pipe(map((mediaType) => mediaType['mediaTypeFilters']))
    ])
      .subscribe((results) => {
        const result = results[0];
        const mediaTypes = results[1];
        this.isGenerateFromType = result?.scenario['type'];
        if (result?.scenario?.audiences?.length > 0) {
          this.selectedAudiences = result?.scenario?.audiences;
          this.isAudienceSelected = true;
          this.isIPAudienceSelected = true;
          this.deleteDefaultAudience = true;
        }
        if (result?.scenario?.market?.length > 0) {
          this.selectedMarket = result?.scenario?.market;
          this.isMarketSelected = true;
          this.isIPMarketSelected = true;
          this.deleteDefaultMarket = true;
        }
        if (result?.scenario?.operators?.data?.length > 0) {
          this.operatorFilters = result?.scenario?.operators?.data;
        }
        if (result?.scenario?.mediaTypeFilters?.data?.length > 0) {
          this.mediaTypeFilters = result?.scenario?.mediaTypeFilters?.data;
        } else if (mediaTypes) {
          this.mediaTypeFilters = mediaTypes;
        }
        if (result?.scenario?.measureRangeFilters?.data?.length > 0) {
          const thresholds = {
            inMarketCompIndex: [10, 210],
            targetImp: [0, 150000]
          };
          result?.scenario?.measureRangeFilters?.data.map((threshold) => {
            if (threshold['type'] === 'index_comp_target') {
              thresholds['inMarketCompIndex'][0] = threshold['min'];
              thresholds['inMarketCompIndex'][1] = threshold['max'];
            }
            if (threshold['type'] === 'imp_target') {
              thresholds['targetImp'][0] = threshold['min'];
              thresholds['targetImp'][1] = threshold['max'];
            }
          });

          this.measureRangeFilters = thresholds;
        }
        if (result?.scenario?.mediaAttributes?.data) {
          this.selectedMediaAttributes = this.workspaceApi.formatMediaAttributeReverse(result?.scenario?.mediaAttributes?.data);
          this.mediaAttributes = result?.scenario?.mediaAttributes;
        }
        if (result?.scenario?.locationFilters?.data) {
          this.locationFilters = result?.scenario?.locationFilters?.data;
        }
        this.updateErrorList();
        if (result?.scenario?.delivery_period_weeks) {
          this.scenarioForm.get('delivery_period_weeks').setValue(result?.scenario?.delivery_period_weeks);
        }
        this.scenarioForm.get('name').setValue(result?.scenario?.name);
        if (result?.scenario?.description) {
          this.scenarioForm.get('description').setValue(result?.scenario?.description);
        }
        this.updateSelectCount();
        this.cdRef.detectChanges();
      })
  }

  public onResize() {
    this.scrollContent = window.innerHeight - 300;
  }
  public createNewProject() {
    this.dialog
      .open(WorkspaceProjectAddComponent, {
        panelClass: 'imx-mat-dialog',
        width: '500px',
        data: {
          project: null
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe((data) => {
        this.marketPlanProjectAutoComplete.closePanel();
        this.inventoryPlanProjectAutoComplete.closePanel();
        if (!data) return;
        const project = { _id: data['response']['data']['id'], name: data['name'] };
        if (this.selectedTabLabel === ScenarioPlanTabLabels.MARKET_PLAN) {
          this.scenarioForm.get('project').setValue(project);
        } else {
          this.inventoryForm.get('project').setValue(project);
        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  onDeliveryGoalChange(event) {
    this.deliveryGoalTooltip = this.deliveryGoals.find((del) => del.name === event.value);
  }

  public deleteDefaultMarketFunc() {
    this.deleteDefaultMarket = true;
    this.isIPMarketSelected = false;
    this.isMarketSelected = false;
    this.checkInventoryPlanErrorList();
  }
  public deleteDefaultAudiencetFunc() {
    this.deleteDefaultAudience = true;
    this.checkInventoryPlanErrorList();
  }
  checkMeasureRelease() {
    return (this.selectedAudiences.filter((aud) => aud.measuresRelease === 2020).length > 0 && this.selectedAudiences.filter((aud) => aud.measuresRelease === 2021).length <= 0)
  }
  private getDefaultAudienceIdx() {
    return this.selectedAudiences.findIndex(aud => (aud?.audienceKey == this.defaultAudience?.audienceKey) || (aud?.id == this.defaultAudience?.id));
  }
}
