import {
  Component,
  OnInit,
  Inject,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import {
  MatDialogRef,
  MatDialog,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ValidatorFn,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';

@Component({
  selector: 'app-change-spot-schedules-dialog-v3',
  templateUrl: './change-spot-schedules-dialog-v3.component.html',
  styleUrls: ['./change-spot-schedules-dialog-v3.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeSpotSchedulesDialogV3Component
  implements OnInit, AfterViewInit {
  scheduleDateForm: FormGroup;
  scheduleDates = [];
  datesList: FormArray;
  scenarioId;
  allSchedules = [];
  action = '';
  count = 0;
  private scenarioPlanDate: any = {};
  private skipFormatting = false;
  constructor(
    public dialogRef: MatDialogRef<ChangeSpotSchedulesDialogV3Component>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private workspaceService: WorkspaceV3Service
  ) {}

  ngOnInit() {
    this.scheduleDates = this.data.schedules;
    this.scenarioId = this.data.scenarioId;
    this.action = this.data.action;
    this.count = this.data.count;
    this.scenarioPlanDate = this.data.scenarioPlanDate;
    this.allSchedules = [];
    Object.keys(this.data.allSchedules).map((key) => {
      if (key !== this.data.id) {
        this.allSchedules.push(...this.data.allSchedules[key]);
      }
    });
    // We need to display scenario plan dates if plan is generated using them.
    if (
      !this.scheduleDates.length &&
      (!this.allSchedules.length || this.data.spotFirstStartDate) &&
      this.scenarioPlanDate &&
      Object.keys(this.scenarioPlanDate).length
    ) {
      this.scheduleDates.push(this.scenarioPlanDate);
      this.allSchedules.push(this.scenarioPlanDate);
      this.skipFormatting = true;
    }
    this.scheduleDateForm = this.fb.group(
      {
        dates: this.fb.array([])
      },
      { validator: this.vaildDates() }
    );
    this.datesList = this.scheduleDateForm.get('dates') as FormArray;
  }
  initializeForm() {
    let i = 0;
    this.scheduleDates.forEach((date) => {
      i++;
      this.addItem(date);
    });
    for (let j = i; j < this.count; j++) {
      this.addItem();
    }
    // if (this.scheduleDates.length <= 0 || this.action === 'add') {
    //   this.addItem();
    // }
  }
  get datesGroup(): FormArray {
    return this.scheduleDateForm.get('dates') as FormArray;
  }
  private addItem(field = null): void {
    const formGroup = this.createFormGroup();
    if (field !== null && field.start && field.start) {
      const sDate = new Date(field.start);
      const eDate = new Date(field.end);
      if (!this.skipFormatting) {
        formGroup.controls.start.patchValue(
          new Date(
            sDate.getUTCFullYear(),
            sDate.getUTCMonth(),
            sDate.getUTCDate()
          )
        );
        formGroup.controls.end.patchValue(
          new Date(
            eDate.getUTCFullYear(),
            eDate.getUTCMonth(),
            eDate.getUTCDate()
          )
        );
      } else {
        formGroup.controls.start.patchValue(sDate);
        formGroup.controls.end.patchValue(eDate);
      }
    }
    formGroup.setValidators([this.checkDates('start', 'end')]);
    this.datesList.push(formGroup);
    this.cdRef.markForCheck();
  }
  public checkDates(startKey: string, endKey: string): ValidatorFn {
    return (group: FormGroup): ValidationErrors => {
      const startDate = group.controls[startKey];
      const endDate = group.controls[endKey];
      startDate.setErrors(null);
      endDate.setErrors(null);
      // if ((startDate.value === null || startDate.value === '') || (endDate.value === null || endDate.value === '')) {
      //   console.log('start', startDate.value);
      //   console.log('endDate', endDate.value);
      //   if ((startDate.value === null || startDate.value === '')) {
      //     startDate.setErrors({'type': 'startDateRequired', 'message': 'Start Date shouldn\'t be empty.'});
      //   }
      //   if ((endDate.value === null || endDate.value === '')) {
      //     endDate.setErrors({'type': 'endDateRequired', 'message': 'End Date shouldn\'t be empty.'});
      //   }
      // } else

      if (
        (startDate.value === null || startDate.value !== '') &&
        (endDate.value === '' || endDate.value === null)
      ) {
        endDate.setErrors({
          type: 'endDateRequired',
          message: "End Date shouldn't be empty."
        });
      } else if (
        (endDate.value === null || endDate.value !== '') &&
        (startDate.value === '' || startDate.value === null)
      ) {
        startDate.setErrors({
          type: 'startDateRequired',
          message: "Start Date shouldn't be empty."
        });
      } else if (startDate.value !== '' && endDate.value !== '') {
        const d_startDate = new Date(startDate.value);
        const d_endDate = new Date(endDate.value);
        if (d_startDate >= d_endDate) {
          startDate.setErrors({
            type: 'startDateLess',
            message: 'Start Date should be less than End Date.'
          });
          endDate.setErrors({
            type: 'startDateLess',
            message: 'End Date should be greater than Start Date.'
          });
        }
      } else {
        endDate.setErrors(null);
      }
      return;
    };
  }
  public vaildDates(): ValidatorFn {
    return (group: FormGroup): ValidationErrors => {
      const datesGroup = group['controls']['dates'];
      datesGroup.setErrors(null);
      if (datesGroup['controls']) {
        for (let i = 0; i < datesGroup['controls'].length; i++) {
          const startDate = datesGroup['controls'][i]['controls']['start'];
          const endDate = datesGroup['controls'][i]['controls']['end'];
          if (startDate.value !== '' && endDate.value !== '') {
            const startDateError = startDate.errors;
            if (
              startDateError &&
              startDateError['type'] &&
              startDateError['type'] === 'startDateLess2'
            ) {
              startDate.setErrors(null);
            }
            for (let j = 0; j < datesGroup['controls'].length; j++) {
              if (j !== i) {
                const dumStartDate =
                  datesGroup['controls'][j]['controls']['start'];
                const dumEndDate = datesGroup['controls'][j]['controls']['end'];
                if (dumStartDate.value !== '' && dumEndDate.value !== '') {
                  const c_startDate = new Date(startDate.value);
                  const c_endDate = new Date(endDate.value);
                  const d_startDate = new Date(dumStartDate.value);
                  const d_endDate = new Date(dumEndDate.value);
                  if (
                    (c_startDate >= d_startDate && c_startDate <= d_endDate) ||
                    (c_endDate >= d_startDate && c_endDate <= d_endDate)
                  ) {
                    startDate.setErrors({
                      type: 'startDateLess2',
                      message: "Date shouldn't be repeat."
                    });
                  }
                }
              }
            }
          }
        }
        if (this.allSchedules.length + datesGroup['controls'].length > 3000) {
          datesGroup.setErrors({
            type: 'error',
            message:
              'Combination of spot schedule dates should not be exist 3000. Please remove some of the date periods.'
          });
        }
      }
      return;
    };
  }
  public deleteItem(index) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res['action']) {
          this.datesList.removeAt(index);
        }
      });
  }
  createFormGroup(): FormGroup {
    return this.fb.group({
      start: [''],
      end: ['']
    });
  }
  submitForm(formGroup: FormGroup) {
    const dates = [];
    const allDates = [];
    if (formGroup.valid) {
      formGroup.value.dates.map((date) => {
        if (date['start'] && date['end']) {
          date['start'] = this.formatDate(date['start']);
          date['end'] = this.formatDate(date['end']);
          dates.push(date);
        } else {
          date['start'] = null;
          date['end'] = null;
        }
        allDates.push(date);
      });
      const data = {
        id: this.data.id,
        schedules: dates
      };
      this.workspaceService
        .updateSpotSchedule(this.scenarioId, { spots: [data] })
        .subscribe((response) => {
          this.dialogRef.close({
            id: this.data.id,
            schedules: allDates
          });
        });
    }
  }
  formatDate(date) {
    const dateDub = new Date(date);
    return (
      dateDub.getFullYear() +
      '-' +
      ('0' + (dateDub.getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + dateDub.getDate()).slice(-2)
    );
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeForm();
    }, 500);
  }
}
