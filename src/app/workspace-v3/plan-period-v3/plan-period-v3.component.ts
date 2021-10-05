import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnDestroy
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CustomValidators } from '../../validators/custom-validators.validator';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import * as numeral from 'numeral';
import { debounceTime, filter, map, takeUntil } from 'rxjs/operators';
import { Patterns, ScenarioPlanTabLabels, AppRegularExp } from '@interTypes/enums';
import { Subject } from 'rxjs';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
@Component({
  selector: 'app-plan-period-v3',
  templateUrl: './plan-period-v3.component.html',
  styleUrls: ['./plan-period-v3.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanPeriodV3Component implements OnInit, OnDestroy {
  planPeriodType = 'generic';
  periodDurations = [];
  @Input() scheduleFormGroup: FormGroup;
  @Input() selectedPlanTab: string;
  @Input() selectedAudienceList;
  effectReaches = [1, 3];
  spotSchedules = [];
  public oldStartDate = null;
  public oldEndDate = null;
  public reverseChange = false;
  public planTabLabels = ScenarioPlanTabLabels;
  public deliveryGoals = [
    {name: 'trp', value: 'TRP Plan Goal'},
    {name: 'imp', value: 'Target In-Mkt Imp Plan Goal'},
    {name: 'reach', value: 'Reach % Plan Goal'}
  ]
  deliveryGoalTooltip = {name: 'trp', value: 'TRP Plan Goal'};
  public numericPattern: any = Patterns.COMMA_SEPARATED_NUMBER;
  public numericPatternRegEx: any = new RegExp(Patterns.COMMA_SEPARATED_NUMBER);
  AppRegularExp: any = AppRegularExp;
  @Input() scheduleFormSubmit$: Subject<any> = new Subject<any>();
  private unSubscribe$: Subject<void> = new Subject<void>();

  public maxDate = new Date('12/31/9999');
  constructor(
    private fb: FormBuilder,
    private workspaceV3Service: WorkspaceV3Service,
    private cdRef: ChangeDetectorRef,
    public matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPlanPeriods();
    const formValue = this.scheduleFormGroup.value;
    if (this.selectedPlanTab === this.planTabLabels.INVENTORY_PLAN && formValue?.plan_period_type) {
      this.planPeriodType = formValue?.plan_period_type;
    }
    this.scheduleFormGroup.valueChanges.subscribe((data) => {
      if (data?.plan_period_type) {
        this.planPeriodType = data?.plan_period_type;
        this.cdRef.detectChanges();
      }
    });
    this.workspaceV3Service.getSpotSchedulesData().subscribe((schedules) => {
      this.spotSchedules = schedules;
    });

    this.scheduleFormSubmit$?.pipe(takeUntil(this.unSubscribe$)).subscribe(() => {
      this.scheduleFormGroup.markAllAsTouched();
      this.scheduleFormGroup.controls['delivery_period_weeks'].setErrors({
        type: 'planPeriodConflict',
        message: 'planPeriodConflict.'
      });
      this.cdRef.markForCheck();
    });

    // this.scheduleFormGroup?.controls?.goals['controls']?.trp.valueChanges
    //   .pipe(debounceTime(1500))
    //   .subscribe((trp) => {
    //     // this.formatDeliveryGoals('trp', trp);
    //   });
    //
    // this.scheduleFormGroup?.controls?.goals['controls']?.imp.valueChanges
    //   .pipe(debounceTime(1500))
    //   .subscribe((imp) => {
    //     this.formatDeliveryGoals('imp', imp);
    //   });

    // this.scheduleFormGroup?.controls?.goals['controls']?.reach.valueChanges
    //   .pipe(debounceTime(1500))
    //   .subscribe((reach) => {
    //     this.formatDeliveryGoals('reach', reach);
    //   });
  }
  formatDeliveryGoals(formControlName, formValue) {
    if (formValue != null && !isNaN(formValue)) {
      let number = numeral(formValue).format('0,0');
      let formatValue = null;
      if (number !== '0') {
        formatValue = number;
        if (
          formControlName === 'reach' &&
          Number(numeral(formValue).format('0')) > 100
        ) {
          this.scheduleFormGroup.controls.goals['controls'][
            formControlName
          ].setErrors({ required: true });
          this.scheduleFormGroup.controls.goals['controls'][
            formControlName
          ].setValue(Number(numeral(formValue).format('0')), {
            emitEvent: false
          });
        } else {
          this.scheduleFormGroup.controls.goals['controls'][
            formControlName
          ].setValue(formatValue, { emitEvent: false });
        }
      }
      this.cdRef.detectChanges();
    } else if (formValue != null) {
      this.scheduleFormGroup.controls.goals['controls'][
        formControlName
      ].setErrors({ required: true });
      this.cdRef.markForCheck();
    }
  }

  onPlanPeriodTypeChange(e) {
    this.planPeriodType = e.value;
  }

  /**
   * @description
   * method to watch and set value on matInput VALUE tag 
   * due to angular mat datepicker custom parse we get NULL if users enters 555555 (6 digit number) (IMXUIPRD-3524)
   *   in that case matInput value not getting updated while reactive form value does, so custom update made it
   * 
   * Max date error alert maintained to validate date which have more than 12/31/9999
   */
  dateValueChange($event: any, type: string) {
    const dtValue = this.scheduleFormGroup.controls.spot_schedule['controls'][type].value;
    if (!dtValue) {
      document.getElementById(type + 'DtPicker')['value'] = dtValue;
    }
    else if (new Date(dtValue).getFullYear() > 9999) {
      this.scheduleFormGroup.controls.spot_schedule['controls'][type].setErrors({ matDatepickerMax: true });
    }
    this.cdRef.markForCheck();
  }

  changeDate($event: any, type: string) {
    if (this.reverseChange) {
      this.reverseChange = false;
      return false;
    }
    const formValues = this.scheduleFormGroup.value;
    if (
      this.spotSchedules &&
      Object.keys(this.spotSchedules).length > 0 &&
      this.scheduleFormGroup.value['update_spot_schedule'] !== 1 &&
      ((type === 'start' &&
        this.oldStartDate !== null &&
        this.oldStartDate !== formValues['spot_schedule']['start']) ||
        (type === 'end' &&
          this.oldEndDate !== null &&
          this.oldEndDate !== formValues['spot_schedule']['end']))
    ) {
      const data = {
        title: 'Confirmation',
        description: 'Editing Dates for the Plan will override any edits made to specific inventory dates. Do you want to continue?',
        confirmBtnText: 'Yes',
        cancelBtnText: 'No',
        displayCancelBtn: true
      };
      this.matDialog
        .open(NewConfirmationDialogComponent, {
          data: data,
          width: '340px',
          height: '260px',
          panelClass: 'imx-mat-dialog'
        })
        .afterClosed()
        .pipe(filter((result) => result !== undefined), map(res => res?.action))
        .subscribe((result) => {
          if (result) {
            this.oldStartDate = formValues['spot_schedule']['start'];
            this.oldEndDate = formValues['spot_schedule']['end'];
            this.scheduleFormGroup.get('update_spot_schedule').patchValue(1);
          } else {
            this.reverseChange = true;
            this.scheduleFormGroup.get('update_spot_schedule').patchValue(0);
            if (type === 'start') {
              this.scheduleFormGroup
                .get('spot_schedule')
                .get('start')
                .patchValue(this.oldStartDate);
            } else if (type === 'end') {
              this.scheduleFormGroup
                .get('spot_schedule')
                .get('end')
                .patchValue(this.oldEndDate);
            }
          }
        });
    } else {
      this.oldStartDate = formValues['spot_schedule']['start'];
      this.oldEndDate = formValues['spot_schedule']['end'];
    }
  }

  private loadPlanPeriods() {
    this.workspaceV3Service.getDurations().subscribe((durations) => {
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
  }
  onDeliveryGoalChange(event) {
    this.deliveryGoalTooltip = this.deliveryGoals.find((del) => del.name === event.value);
  }
  checkMeasureRelease() {
    return (this.selectedAudienceList.filter((aud) => aud.measuresRelease === 2020).length > 0 && this.selectedAudienceList.filter((aud) => aud.measuresRelease === 2021).length <= 0)
  }

  ngOnDestroy() {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }
}
