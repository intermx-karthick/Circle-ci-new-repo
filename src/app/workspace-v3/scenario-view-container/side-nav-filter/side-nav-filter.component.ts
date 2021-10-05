import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { catchError, filter, map, takeUntil } from 'rxjs/operators';
import { combineLatest, forkJoin, Subject, BehaviorSubject, of } from 'rxjs';
import { InventoryService, TargetAudienceService, ThemeService } from '@shared/services';
import { WorkspaceV3Service } from '../../workspace-v3.service';
import { Market2, ScenarioDetails } from '@interTypes/scenario.response';
import { CustomValidators } from '../../../validators/custom-validators.validator';
import { ILocationFilters } from '@interTypes/ILocationFilters';
import { Patterns, ScenarioPlanTabLabels } from '@interTypes/enums';
import { Helper } from 'app/classes';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AfterViewChecked } from '@angular/core';
import { values } from 'd3';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { MatDialog } from '@angular/material/dialog';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';

@Component({
  selector: 'app-side-nav-filter',
  templateUrl: './side-nav-filter.component.html',
  styleUrls: ['./side-nav-filter.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideNavFilterComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() scenario$: BehaviorSubject<ScenarioDetails>;
  @Input() selectedPlanTab: string;
  @Input() inventoryPlanIDs = [];
  @Input() projectOwnerEmail;
  @Input() userEmail;
  @Output() close = new EventEmitter();
  @Output() applyGeneratePlan = new EventEmitter();
  public deleteMarket$ = new Subject();
  public deleteAudience$ = new Subject();
  public selectedAudienceList = [];
  audienceSelectionType = 'multiple';
  public selectedTab = 0;
  selectedMarkets: any[] = [];
  selectedMarketType: string;
  selectedPlanFormCtrl: any = new FormControl();
  includeOutsideMarketInventoryCtrl: any = new FormControl();

  type = 'create';
  periodDurations: Array<{
    duration: number;
    isDefault: boolean;
    unit: string;
  }> = [];
  selectedDuration: number;
  selectedInventory;
  private defaultAudience;
  private defaultMarket = [{ id: 'global', name: 'United States' }];
  private defaultOperator = [{ id: 'all', name: 'Select All' }];
  public scenario: ScenarioDetails;
  scheduleFormGroup: any;
  defineGoleFormGroup:any;
  private unSubscribe$ = new Subject();
  private numericPattern = Patterns.NUMERIC;
  private deliveryPattern = Patterns.COMMA_SEPARATED_NUMBER;
  public spotSchedules = {};
  planPeriod: any;
  errorMessages = [];
  public isExpandMediaType = false;
  public planTabLabels = ScenarioPlanTabLabels;
  mainContentHeight = 750;
  @Input() public operators = [];
  isInvalidMediaAttribFrom = false;
  public selectedMediaAttributes = null;
  public mediaAttributes = null;
  public measureRangeFilters = null;
  public locationFilters = null;
  public operatorFilters = [];
  public mediaTypeFilters = [];
  public selectedPackages = [];
  public filterMarketsFormIDs = [];
  public inventoryCount = 0;
  public inventoryIDs = [];
  planPeriodData: any;
  defineGoalData: any;
  public includeType = 'sideBar';
  public spotFilter: {};
  public scheduleFormSubmit$: Subject<any> = new Subject<any>();
  public defineGoalFormSubmit$: Subject<any> = new Subject<any>();
  //This variable used show error message based on length
  public mandatoriesErrorLength = 0;
  @Input() regeneratePlans$: Subject<any> = new Subject<any>();
  measuresRelease: any;
  constructor(
    private workspaceV3Service: WorkspaceV3Service,
    private inventoryService: InventoryService,
    private targetAudience: TargetAudienceService,
    private cdRef: ChangeDetectorRef,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private themeService: ThemeService
  ) {
    /**
     * Market Plan and Inventory Plan are using different plan period attrbpute
     * So here we seprated the plan period as delivery_period_weeks (IP) and goals.duration (MP)
     * And also market plan wont have support for specific type.
     */
    this.scheduleFormGroup = this.fb.group({
      spot_schedule: this.fb.group(
        {
          start: [null],
          end: [null]
        },
        { validator: CustomValidators.validDateRange('start', 'end') }
      ),
      delivery_period_weeks: 1,
      plan_period_type: 'generic',
      plan_period_type_mp: 'generic',
      goals: this.fb.group({
        duration: 1
      }),
      update_spot_schedule: 0
    });

    /**
     * Market Plan Define gole form
     */
    this.defineGoleFormGroup = this.fb.group({
      goals: this.fb.group({
        type: 'trp',
        allocationMethod: 'equal',
        effectiveReach: 1,
        trp: [
          200,
          [Validators.pattern(this.deliveryPattern), Validators.min(1)]
        ],
        reach: [null, [Validators.pattern(Patterns.DECIMAL_NUMBER)]],
        frequency: [null, Validators.pattern(this.numericPattern)],
        imp: [null, [Validators.pattern(this.deliveryPattern), Validators.min(1)]]
      })
    });


    this.scheduleFormGroup.valueChanges.subscribe((data) => {
      const planPeriodData = {
        delivery_period_weeks : null,
        plan_period_type: 'generic',
        spot_schedule: null
      };
      if (this.scenario['type'] === 'IP') {
        if (data['plan_period_type'] === 'specific' || (data?.spot_schedule && data['plan_period_type'] !== 'generic')) {
          planPeriodData['spot_schedule'] = data['spot_schedule'];
          planPeriodData['plan_period_type'] = 'specific';
          this.scheduleFormGroup.controls.spot_schedule['controls']['start'].setValidators([Validators.required]);
          this.scheduleFormGroup.controls.spot_schedule['controls']['end'].setValidators([Validators.required]);
          this.scheduleFormGroup.controls.spot_schedule.setValidators([CustomValidators.validDateRange('start', 'end')]);
        } else {
          planPeriodData['delivery_period_weeks'] = data['delivery_period_weeks'];
          this.scheduleFormGroup.controls.spot_schedule['controls']['start'].setValidators(null);
          this.scheduleFormGroup.controls.spot_schedule['controls']['start'].setErrors(null);
          this.scheduleFormGroup.controls.spot_schedule['controls']['end'].setValidators(null);
          this.scheduleFormGroup.controls.spot_schedule['controls']['end'].setErrors(null);
          this.scheduleFormGroup.controls.spot_schedule.setValidators(null);
          this.scheduleFormGroup.controls.spot_schedule.setErrors(null);
        }
      } else {
        planPeriodData['delivery_period_weeks'] = data?.goals?.duration;
      }
      this.planPeriodData = planPeriodData;
      this.cdRef.detectChanges();
    });

    this.defineGoleFormGroup.valueChanges.subscribe((data) => {
      this.defineGoalData = data?.['goals'];
      this.cdRef.detectChanges();
    });
  }

  ngOnInit(): void {
    // this.loadInventoryFilter();
    this.loadScenario();
    this.listenForClearFilters();
    this.listenForPlanPeriodUpdate();
    this.workspaceV3Service
      .getSpotSchedulesData()
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe((spotSchedules) => {
        this.spotSchedules = spotSchedules;
      });
    const typeVlaue = this.defineGoleFormGroup.controls.goals['controls'].type
      .value;
    this.changeValidation(typeVlaue);
    this.defineGoleFormGroup.controls.goals[
      'controls'
    ].type.valueChanges.subscribe((value) => {
      this.changeValidation(value);
    });
    this.reSize();
    this.regeneratePlans$.pipe(takeUntil(this.unSubscribe$)).subscribe(() => {
      this.reGenerate();
    })
  }

  ngOnDestroy() {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  changeValidation(value) {
    switch (value) {
      case 'reach':
        this.defineGoleFormGroup.controls['goals'].get('trp').setValidators([]);
        this.defineGoleFormGroup.controls['goals'].get('imp').setValidators([]);
        this.defineGoleFormGroup.controls['goals']
          .get('reach')
          .setValidators([
            Validators.pattern(Patterns.DECIMAL_NUMBER),
            Validators.max(100),
            Validators.min(1)
          ]);
        break;
      case 'imp':
        this.defineGoleFormGroup.controls['goals'].get('trp').setValidators([]);
        this.defineGoleFormGroup.controls['goals'].get('reach').setValidators([]);
        this.defineGoleFormGroup.controls['goals']
          .get('imp')
          .setValidators([
            Validators.pattern(this.deliveryPattern),
            Validators.min(1)
          ]);
        break;
      case 'trp':
        this.defineGoleFormGroup.controls['goals'].get('reach').setValidators([]);
        this.defineGoleFormGroup.controls['goals'].get('imp').setValidators([]);
        this.defineGoleFormGroup.controls['goals']
          .get('trp')
          .setValidators([
            Validators.pattern(this.deliveryPattern),
            Validators.min(1)
          ]);
        break;
      default:
        break;
    }
  }

  applyFilter(data: any) {
    if (data?.filterData?.fileData?.planPeriod) {
      this.setSpotSchedule(data.filterData.fileData.planPeriod);
    }
    this.addInventoryFilter(data);
    this.cdRef.markForCheck();
    this.reGenerate();
  }

  selectAudience(result) {
    this.selectedAudienceList = result;
    this.selectedAudienceList = Object.assign([], this.selectedAudienceList);
    this.cdRef.detectChanges();

  }

  /**
   * 
   * @param result selected markets
   * @param deleteFlag This flag used to when delete market  
   */
  selectMarket(result, deleteFlag = false) {
    if (!deleteFlag && this.shouldAskUserForConsent(result) && this.selectedPlanTab !== ScenarioPlanTabLabels.MARKET_PLAN) {
      this.inventoryService
        .showGeographiesOverrideDiaglog()
        .afterClosed()
        // tslint:disable-next-line:no-shadowed-variable
        .subscribe((confirm) => {
          // if user wants to apply the same markets as location filter
          if (confirm['action']) {
            this.scenario.locationFilters.data = this.convertMarketsToLocations(
              result
            );

            this.scenario = {
              ...this.scenario
            };
            this.cdRef.detectChanges();
          }
        });
    }

    this.selectedMarkets = result;
    this.selectedMarkets = Object.assign([], this.selectedMarkets);
    this.cdRef.detectChanges();
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

  closeSideNav() {
    this.close.emit();
  }

  addInventoryFilter(data: any) {
    this.isInvalidMediaAttribFrom = data?.filterData?.inventoryFilters?.isInvalidMediaAttribFrom;
    if (this.selectedInventory) {
      const existingIndex = this.selectedInventory.findIndex(
        (inventory) =>
          inventory?.selectedFilters?.selected ===
          data?.filterData?.selectedFilters?.selected
      );
      if (existingIndex > -1) {
        this.selectedInventory.splice(existingIndex, 1) ;
      }
    } else {
      this.selectedInventory = [];
    }
    this.selectedInventory.push(data?.filterData);
    this.formatInventoryFilter();
    this.cdRef.markForCheck();
  }

  clearAll() {
    this.workspaceV3Service.clearScenarioFilters$.next({
      clear: true
    });
  }

  resetAll() {
    this.selectedAudienceList = [this.defaultAudience];
    this.selectedInventory = [
      {
        selectedFilters: {
          data: [],
          selected: null
        },
        filterType: 'Inventory',
        inventoryFilters: {
          operator: {
            optionsData: [],
            selectedOptions: this.defaultOperator
          }
        },
        fileData: null
      }
    ];
    this.scheduleFormGroup.reset();
    this.defineGoleFormGroup.reset();
    
    this.selectedAudienceList = Object.assign([], this.selectedAudienceList);
    this.cdRef.detectChanges();
  }
  validateTargetData() {
    const mandatories = [];
    const messages = [];
    this.errorMessages = [];
    const selectedInventory = Helper.deepClone(this.selectedInventory);
    const inventoryFilters = selectedInventory?.[0]?.inventoryFilters;
    if (
      this.selectedPlanTab === ScenarioPlanTabLabels.MARKET_PLAN &&
      inventoryFilters?.mediaTypeFilters?.length < 1
    ) {
      mandatories.push('Media');
    }
    if (this.selectedMarkets.length < 1) {
      mandatories.push('Market');
    }
    if (this.selectedAudienceList.length < 1) {
      mandatories.push('Audience');
    }
    
    if (mandatories.length > 0) {
      const message = `Select at least 1 ${Helper.makeString(
        mandatories,
        '&'
      )} to Generate Plans.`;
      messages.push(message);
    }

    this.mandatoriesErrorLength = mandatories.length;

    if (inventoryFilters?.mediaTypeFilters?.length > 19) {
      messages.push('You can select only upto 19 media types.');
    }
    const goalData = this.planPeriod?.goals ?? {
      type: 'trp',
      allocationMethod: 'equal',
      effectiveReach: 1,
      duration: 1,
      trp: 200,
      reach: 0,
      frequency: 0,
      imp: 0
    };
    switch (goalData['type'] || 'trp') {
      case 'trp':
        if (goalData['trp'] === null || !goalData['trp']) {
          messages.push('Please enter TRP Plan Goal value.');
        }
        break;
      case 'reach':
        if (goalData['reach'] === null || !goalData['reach']) {
          messages.push('Please enter Reach % Plan Goal value.');
        }
        break;
      case 'imp':
        if (goalData['imp'] === null || !goalData['imp']) {
          messages.push('Please enter Target In-Mkt Imp Plan Goal value.');
        }
        break;
      default:
        break;
    }
    if (
      !goalData.duration &&
      this.selectedPlanTab !== ScenarioPlanTabLabels.MARKET_PLAN
    ) {
      messages.push('Please Select Plan length');
      this.cdRef.markForCheck();
    }
    if (messages.length > 0) {
      this.errorMessages = messages;
      this.cdRef.markForCheck();
      return false;
    }
    return true;
  }
  validateFormGroup(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({
          onlySelf: true
        });
      } else if (control instanceof FormGroup) {
        this.validateFormGroup(control);
      }
    });
  }

  reGenerate() {
    const mediaFilters = [{ inventoryFilters: {} }];
    mediaFilters[0]['inventoryFilters'] = {
      mediaTypeFilters: this.scenario?.mediaTypeFilters?.data || []
    };
    if (!this.selectedInventory) {
      this.selectedInventory = mediaFilters;
    }
    this.planPeriod = this.scheduleFormGroup.value;
    const defineGoal = this.defineGoleFormGroup.value;
    let delivery_period_weeks = 1;
    let planPeriodType = "generic";
    /** Add the define goal values */

    this.planPeriod['goals']['allocationMethod'] = defineGoal?.['goals']?.['allocationMethod'];
    this.planPeriod['goals']['effectiveReach'] = defineGoal?.['goals']?.['effectiveReach'];
    this.planPeriod['goals']['frequency'] = defineGoal?.['goals']?.['frequency'];
    this.planPeriod['goals']['imp'] = defineGoal?.['goals']?.['imp'];
    this.planPeriod['goals']['reach'] = defineGoal?.['goals']?.['reach'];
    this.planPeriod['goals']['trp'] = defineGoal?.['goals']?.['trp'];
    this.planPeriod['goals']['type'] = defineGoal?.['goals']?.['type'];

    const defineGoalType = defineGoal['goals']['type'];
    switch (defineGoalType) {
      case 'reach':
        this.defineGoleFormGroup.controls['goals'].get('trp').patchValue(null);
        this.defineGoleFormGroup.controls['goals'].get('imp').patchValue(null);
        break;
      case 'imp':
        this.defineGoleFormGroup.controls['goals'].get('trp').patchValue(null);
        this.defineGoleFormGroup.controls['goals'].get('reach').patchValue(null);
        break;
      case 'trp':
        this.defineGoleFormGroup.controls['goals'].get('imp').patchValue(null);
        this.defineGoleFormGroup.controls['goals'].get('reach').patchValue(null);
        break;
      default:
        break;
    }

    Object.keys(this.scheduleFormGroup.controls).forEach((field) => {
      const control = this.scheduleFormGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({
          onlySelf: true
        });
      } else if (control instanceof FormGroup) {
        this.validateFormGroup(control);
      }
    });

    Object.keys(this.defineGoleFormGroup.controls).forEach((field) => {
      const control = this.defineGoleFormGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({
          onlySelf: true
        });
      } else if (control instanceof FormGroup) {
        this.validateFormGroup(control);
      }
    });
    if (this.scenario['type'] == 'MP') {
      delivery_period_weeks = this.scheduleFormGroup.controls['goals'].controls['duration'].value;
      planPeriodType = this.scheduleFormGroup.controls['plan_period_type_mp'].value;
    } else {
      delivery_period_weeks = this.scheduleFormGroup.controls['delivery_period_weeks'].value;
      planPeriodType = this.scheduleFormGroup.controls['plan_period_type'].value;
    }
    if ((planPeriodType === 'generic' && this.selectedAudienceList.filter((aud) => aud.measuresRelease === 2020).length > 0 && this.selectedAudienceList.filter((aud) => aud.measuresRelease === 2021).length <= 0) && (delivery_period_weeks === 26 || delivery_period_weeks === 52)) {
      this.scheduleFormGroup.controls['delivery_period_weeks'].setErrors({
        type: 'planPeriodConflict',
        message: 'planPeriodConflict.'
      });
      this.scheduleFormGroup.controls['goals'].controls['duration'].setErrors({
        type: 'planPeriodConflict',
        message: 'planPeriodConflict.'
      });
    } else {
      this.scheduleFormGroup.controls['delivery_period_weeks'].setErrors(null);
      this.scheduleFormGroup.controls['goals'].controls['duration'].setErrors(null);
    }
    
    /* if(this.dataOldVersion && (delivery_period_weeks === 26 || delivery_period_weeks === 52)) {
      this.scenarioForm.controls['delivery_period_weeks'].setErrors({
        type: 'planPeriodConflict',
        message: 'planPeriodConflict.'
      });
    } else {
      this.scenarioForm.controls['delivery_period_weeks'].setErrors(null);
    } */

    const targetDataValidation = this.validateTargetData();
    if (this.scheduleFormGroup.invalid || !targetDataValidation) {
      if (this.scheduleFormGroup.invalid) {
        //  && this.errorMessages.length <= 0
        this.scheduleFormSubmit$.next();
        this.snackBar.open('Invalid data in Plan Period section.', 'DISMISS', {
          duration: 3000
        });
      }
      this.cdRef.markForCheck();
      return;
    }
    if (this.defineGoleFormGroup.invalid || !targetDataValidation) {
      if (this.defineGoleFormGroup.invalid) {
        //  && this.errorMessages.length <= 0
        this.defineGoalFormSubmit$.next();
        this.snackBar.open('Invalid data in define goals section.', 'DISMISS', {
          duration: 3000
        });
      }
      this.cdRef.markForCheck();
      return;
    }
    /*  if (!this.validateTargetData()) {
      return;
    }*/
    
    if ((planPeriodType === 'generic' && this.selectedAudienceList.filter((aud) => aud.measuresRelease === 2020).length > 0 && this.selectedAudienceList.filter((aud) => aud.measuresRelease === 2021).length > 0) && (delivery_period_weeks === 26 || delivery_period_weeks === 52)) {
      const dialogueData = {
        title: 'Confirmation',
        description: 'Measurement with conflicting Plan Period could be erroneous, verify before Progressing.',
        confirmBtnText: 'OK',
        cancelBtnText: 'SKIP & CONTINUE'
      };
      this.dialog.open(NewConfirmationDialogComponent, {
        data: dialogueData,
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      }).afterClosed()
        .pipe(
            takeUntil(this.unSubscribe$),
            map(res => res?.action)
        ).subscribe((flag) => {
          if (flag !== undefined && !flag) {
           this.submitToServer();
          }
        });
    } else {
      this.submitToServer();
    }
  }
  private submitToServer() {
    if (
      this.planPeriod['update_spot_schedule'] === 1 &&
      this.planPeriod['plan_period_type'] === 'specific' &&
      this.scenario['type'] === 'IP'
    ) {
      const spotUpdateData = { spots: [] };
      Object.keys(this.spotSchedules).map((spotId) => {
        spotUpdateData['spots'].push({
          id: spotId,
          schedules: []
        });
      });
      this.workspaceV3Service
        .updateSpotSchedule(this.scenario['_id'], spotUpdateData)
        .subscribe((response) => {
          this.scheduleFormGroup.get('update_spot_schedule').patchValue(0);
          this.generatePlan();
        });
    } else {
      this.generatePlan();
    }
  }
  private generatePlan() {
    this.applyGeneratePlan.emit({
      audiences: this.selectedAudienceList,
      market: this.selectedMarkets,
      planPeriod: this.planPeriod,
      inventory: this.selectedInventory,
      includeOutsideMarketInventory: this.includeOutsideMarketInventoryCtrl
        .value
    });
  }
  private loadScenario() {
    this.measuresRelease = Number(this.themeService.getThemeSettingByName('measuresRelease')); 
    combineLatest([
      this.targetAudience
        .getDefaultAudience(false, this.measuresRelease.toString())
        .pipe(map(data => {
            const formatted = {
              id: data.audienceKey,
              name: data.description,
              measuresRelease: Number(data.measuresRelease),
            };
            return formatted;
        })),
      this.scenario$
    ]).subscribe(([audience, scenario]) => {
      this.scenario = scenario;
      this.defaultAudience = audience;
      if (
        Array.isArray(scenario?.audiences) &&
        scenario?.audiences.length > 0
      ) {
        const audiences = Helper.deepClone(scenario.audiences);
        this.selectedAudienceList = audiences.map((aud) => {
          aud['id'] = Number(aud['id']);
          return aud;
        });
      } else {
        this.selectedAudienceList = [this.defaultAudience];
      }
      this.selectedAudienceList = Object.assign([], this.selectedAudienceList);
      if (Array.isArray(scenario?.market) && scenario?.market.length > 0) {
        this.applyMarkets(scenario.market);
      } else {
        this.applyMarkets(this.defaultMarket);
      }

      if (scenario?.delivery_period_weeks) {
        this.scheduleFormGroup
          .get('delivery_period_weeks')
          .patchValue(scenario.delivery_period_weeks);
        this.scheduleFormGroup.get('plan_period_type').patchValue('generic');
      }
      if (scenario?.spot_schedule) {
        this.scheduleFormGroup.get('spot_schedule').patchValue({
          start:
            (scenario['spot_schedule'] &&
              new Date(scenario['spot_schedule'].start)) ||
            null,
          end:
            (scenario['spot_schedule'] &&
              new Date(scenario['spot_schedule'].end)) ||
            null
        });
        this.scheduleFormGroup.get('plan_period_type').patchValue('specific');
      }
      if (scenario?.marketPlans?.targets?.goals) {
        this.defineGoleFormGroup
          .get('goals')
          .patchValue(scenario?.marketPlans?.targets?.goals);
        this.scheduleFormGroup?.controls?.['goals']
          .get('duration')
          .patchValue(scenario?.marketPlans?.targets?.goals?.duration ?? 1);
      }
      if (scenario?.operators?.data?.length > 0) {
        this.operatorFilters = scenario?.operators?.data;
      }
      this.includeOutsideMarketInventoryCtrl.patchValue(
        scenario?.includeOutsideMarketInvs
      );
      if (this.projectOwnerEmail && this.projectOwnerEmail !== this.userEmail) {
        this.includeOutsideMarketInventoryCtrl.disable();
      }
      this.cdRef.markForCheck();
    });
  }

  private loadInventoryFilter() {
    const filterData = {};
    filterData['summary_level_list'] = ['Plant'];
    filterData['measures_required'] = false;
    filterData['status_type_name_list'] = ['*'];
    // filterData['measures_range_list'] = [{ type: 'imp', min: 0 }];
    this.inventoryService
      .getOperators(filterData, false)
      .pipe(catchError((error) => of([])))
      .subscribe((operatorsRes) => {
        this.operators = operatorsRes;
        this.cdRef.markForCheck();
      });
  }

  private applyMarkets(selectedMarket: Market2[]) {
    this.selectedMarkets = selectedMarket;
    this.selectedMarkets = Object.assign([], this.selectedMarkets);
    this.cdRef.detectChanges();
  }

  private listenForClearFilters() {
    this.workspaceV3Service?.clearScenarioFilters$
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe(() => {
        this.resetAll();
      });
  }

  private listenForPlanPeriodUpdate() {
    this.workspaceV3Service.updateSceanrioPlanPeriod$
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe((dateObj) => {
        const startDate = this.scheduleFormGroup.controls.spot_schedule[
          'controls'
        ]['start'].value;
        const endDate = this.scheduleFormGroup.controls.spot_schedule[
          'controls'
        ]['end'].value;
        if (!startDate || startDate !== '') {
          if (!startDate || dateObj['start'] < new Date(startDate)) {
            this.scheduleFormGroup.controls.spot_schedule['controls'][
              'start'
            ].patchValue(dateObj['start']);
          }
        }
        if (!endDate || endDate !== '') {
          if (!endDate || dateObj['end'] > new Date(endDate)) {
            this.scheduleFormGroup.controls.spot_schedule['controls'][
              'end'
            ].patchValue(dateObj['end']);
          }
        }
      });
  }

  onOpenMediaAndPlacement(event) {
    this.isExpandMediaType = event?._expanded;
  }
  public onTabChange(event) {
    // this.selectedInventory = null;
    this.reSize();
    // The below is a fix for IMXUIPRD-2825, tab labels related issue. Don't remove
    // https://github.com/angular/components/issues/2236#issuecomment-370134509
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 20);
  }
  public reSize() {
    this.mainContentHeight =
      window.innerHeight - (55 + (this.selectedTab === 0 ? 45 : -10));
    this.cdRef.detectChanges();
  }

  private setSpotSchedule(date) {
    this.scheduleFormGroup.get('spot_schedule').patchValue({
      start: new Date(date.start) || null,
      end: new Date(date.end) || null
    });
    this.scheduleFormGroup.get('plan_period_type').patchValue('specific');
  }
  formatInventoryFilter() {
    this.mediaAttributes = null;
    this.measureRangeFilters = null;
    this.locationFilters = null;
    this.operatorFilters = null;
    this.mediaTypeFilters = null;
    this.selectedMediaAttributes = null;
    this.filterMarketsFormIDs = [];
    this.inventoryCount = 0;
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
            if(!inventory.selectedFilters?.cancelAutoAssign) {
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
            if(!inventory.selectedFilters?.cancelAutoAssign) {
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
                    this.mediaAttributes = this.workspaceV3Service.formatMediaattribute(
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
                    this.operatorFilters = inventory.selectedFilters.filterInventory[
                      key
                    ]['selectedOptions']
                      .map((op) => op.name);
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
      this.selectedMarkets = this.filterMarketsFormIDs;
    }
    /* this.updateSelectCount(); */

    this.cdRef.detectChanges();
  }
  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  deleteSelectedMarkets(market) {
    this.deleteMarket$.next(market);
    this.cdRef.detectChanges();
  }
  deleteSelectedAudience(audience) {
    this.deleteAudience$.next(audience);
    this.cdRef.detectChanges();
  }
  onSelectInventorySet(packages) {
    const selectedPackages = [];
    packages.forEach((pack) => {
      selectedPackages.push({id : pack['_id'], name: pack['name']});
    });
    this.selectedPackages = selectedPackages;
    this.cdRef.detectChanges();
  }
  onSpotFilterChange(spotFilter) {
    const selectedPackages = [];
    this.spotFilter = spotFilter;
    this.cdRef.detectChanges();
  }
}
