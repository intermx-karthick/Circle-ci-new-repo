import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  ChangeDetectorRef
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  MatBottomSheetRef,
  MAT_BOTTOM_SHEET_DATA
} from '@angular/material/bottom-sheet';
import { MarketPlanService } from '../market-plan.service';
import { Duration, ViewByType } from '@interTypes/workspaceV2';
import { AppRegularExp, ViewByFilter } from '@interTypes/enums';
import { debounceTime } from 'rxjs/operators';
import { Patterns } from '@interTypes/enums';
import * as numeral from 'numeral';
@Component({
  selector: 'app-edit-plan',
  templateUrl: './edit-plan.component.html',
  styleUrls: ['./edit-plan.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditPlanComponent implements OnInit {
  public goalsForm: FormGroup;
  private numericPattern = Patterns.COMMA_SEPARATED_NUMBER;
  public weeklyDurations: Duration[];
  private deliveryGoalOptions = [
    { name: 'trp', value: 'TRP Plan Goal' },
    { name: 'imp', value: 'Target In-Mkt Imp Plan Goal' },
    { name: 'reach', value: 'Reach % Plan Goal' }
  ]
  public deliveryGoals = [];

  deliveryGoalTooltip = { name: 'trp', value: 'TRP Plan Goal' };
  public deliveryNumericPattern = Patterns.COMMA_SEPARATED_NUMBER;
  deliveryNumericPatternRegEx = new RegExp(this.deliveryNumericPattern);
  AppRegularExp: any = AppRegularExp;

  constructor(
    private fb: FormBuilder,
    private marketPlanService: MarketPlanService,
    private cdRef: ChangeDetectorRef,
    private bottomSheetRef: MatBottomSheetRef<EditPlanComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.setDeliveryGoalOptions(this.data['measuresRelease'])
    this.goalsForm = this.fb.group({
      allocationMethod: 'equal',
      trp: [
        null,
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
      ],
      type: 'trp',
      duration: 1,
      effectiveReach: 1,
      plan_period_type: 'generic'
      // measuresViewType: this.viewByType.MEDIA
    });

    this.goalsForm.controls.type.valueChanges.subscribe((value) => {
      switch (value) {
        case 'reach':
          this.goalsForm.get('trp').setValidators([]);
          this.goalsForm.get('imp').setValidators([]);
          this.goalsForm
            .get('reach')
            .setValidators([
              Validators.required,
              Validators.pattern(Patterns.DECIMAL_NUMBER),
              Validators.max(100),
              Validators.min(1)
            ]);
          break;
        case 'imp':
          this.goalsForm.get('trp').setValidators([]);
          this.goalsForm.get('reach').setValidators([]);
          this.goalsForm
            .get('imp')
            .setValidators([
              Validators.required,
              Validators.pattern(this.deliveryNumericPattern),
              Validators.min(1)
            ]);
          break;
        case 'trp':
          this.goalsForm.get('reach').setValidators([]);
          this.goalsForm.get('imp').setValidators([]);
          this.goalsForm
            .get('trp')
            .setValidators([
              Validators.required,
              Validators.pattern(this.deliveryNumericPattern),
              Validators.min(1)
            ]);
          break;
        default:
          break;
      }
    });

    // this.goalsForm.controls.trp.valueChanges
    // .pipe(debounceTime(1500)).subscribe(trp=>{
    //   this.formatDeliveryGoals('trp', trp);
    // });
    //
    //
    // this.goalsForm.controls.imp.valueChanges
    // .pipe(debounceTime(1500)).subscribe(imp=>{
    //   this.formatDeliveryGoals('imp', imp);
    // });
    //
    // this.goalsForm.controls.reach.valueChanges
    // .pipe(debounceTime(1500)).subscribe(reach=>{
    //   this.formatDeliveryGoals('reach', reach);
    // });

    this.marketPlanService.getDurations().subscribe((durations) => {
      if (durations['durations']) {
        this.weeklyDurations = durations['durations'];
      } else {
        this.weeklyDurations = [
          { duration: 1, isDefault: true, unit: 'week' },
          { duration: 2, isDefault: false, unit: 'weeks' },
          { duration: 4, isDefault: false, unit: 'weeks' },
          { duration: 8, isDefault: false, unit: 'weeks' },
          { duration: 12, isDefault: false, unit: 'weeks' }
        ];
      }
      this.goalsForm.controls['duration'].patchValue(this.data['goalsInfo']['duration']);
    });
    if (this.data) {
      this.loadGoalData();
    }
  }

  formatDeliveryGoals(formControlName, formValue) {
    if (formValue != null && !isNaN(formValue)) {
      const number = numeral(formValue).format('0,0');
      let formatValue = null;
      if (number !== '0') {
        formatValue = number;
        if (
          formControlName === 'reach' &&
          Number(numeral(formValue).format('0')) > 100
        ) {
          this.goalsForm.controls[formControlName].setErrors({
            required: true
          });
          this.goalsForm.controls[formControlName].setValue(
            Number(numeral(formValue).format('0')),
            { emitEvent: false }
          );
        } else {
          this.goalsForm.controls[formControlName].setValue(formatValue, {
            emitEvent: false
          });
        }
      }
      this.cdRef.markForCheck();
    } else if (formValue != null) {
      this.goalsForm.controls[formControlName].setErrors({ required: true });
      this.cdRef.markForCheck();
    }
  }
  private setDeliveryGoalOptions(measureRelease) {
    if (measureRelease === 2020) {
      this.deliveryGoals = this.deliveryGoalOptions;
    } else {
      this.deliveryGoals = this.deliveryGoalOptions
        .filter(item => item.name !== 'reach');
    }
    this.cdRef.markForCheck();
  }
  private loadGoalData() {
    this.goalsForm.patchValue({
      allocationMethod: this.data['goalsInfo']['allocationMethod'],
      trp:
        this.data['goalsInfo']['trp'] === 0
          ? null
          : this.data['goalsInfo']['trp'],
      reach:
        this.data['goalsInfo']['reach'] === 0
          ? null
          : this.data['goalsInfo']['reach'],
      imp:
        this.data['goalsInfo']['imp'] === 0
          ? null
          : this.data['goalsInfo']['imp'],
      type: this.data['goalsInfo']['type'],
      frequency: this.data['goalsInfo']['frequency'],
      duration: Number(this.data['goalsInfo']['duration']),
      effectiveReach: this.data['goalsInfo']['effectiveReach']
      // measuresViewType: this.data['viewBy'] ?? this.viewByType.MEDIA
    });
  }
  public closeSheet() {
    this.bottomSheetRef.dismiss();
  }

  public onSubmit() {
    const value = this.goalsForm.get('type').value;
    switch (value) {
      case 'reach':
        this.goalsForm.get('trp').patchValue(null);
        this.goalsForm.get('imp').patchValue(null);
        break;
      case 'imp':
        this.goalsForm.get('trp').patchValue(null);
        this.goalsForm.get('reach').patchValue(null);
        break;
      case 'trp':
        this.goalsForm.get('imp').patchValue(null);
        this.goalsForm.get('reach').patchValue(null);
        break;
      default:
        break;
    }
    if (this.goalsForm.valid) {
      this.bottomSheetRef.dismiss(this.goalsForm.value);
    }
  }

  public trackDurations(index, item) {
    return item.duration;
  }
  onDeliveryGoalChange(event) {
    this.deliveryGoalTooltip = this.deliveryGoals.find(
      (del) => del.name === event.value
    );
  }
}
