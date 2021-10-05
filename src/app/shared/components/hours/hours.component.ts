import { Component, OnInit, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, FormGroup, ControlValueAccessor, FormBuilder, FormArray } from '@angular/forms';
import { HourType, TimePickerOpenEvent, TimePickerResponse } from '@interTypes/Place-audit-types';
import { TimepickerDialogComponent } from 'app/places/timepicker-dialog/timepicker-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-hours',
  templateUrl: './hours.component.html',
  styleUrls: ['./hours.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HoursComponent),
      multi: true
    }
  ]
})
export class HoursComponent implements OnInit, ControlValueAccessor {
  public hoursForm: FormGroup;
  public onTouched:  () => void = ()=> {}; 
  private hoursFieldchanges = false;

  public readonly duration = {
    WEEKDAYS: 'WD',
    ALL: 'ALL'
  };
  
  constructor(private fb:FormBuilder, private dialog: MatDialog) {}
   
  ngOnInit(): void {
    this.hoursForm = this.fb.group({
      mo: this.fb.group({
        from: '',
        to: '',
        next: ''
      }),
      tu: this.fb.group({
        from: '',
        to: '',
        next: ''
      }),
      we: this.fb.group({
        from: '',
        to: '',
        next: ''
      }),
      th: this.fb.group({
        from: '',
        to: '',
        next: ''
      }),
      fr: this.fb.group({
        from: '',
        to: '',
        next: ''
      }),
      sa: this.fb.group({
        from: '',
        to: '',
        next: ''
      }),
      su: this.fb.group({
        from: '',
        to: '',
        next: ''
      }),
    });
  }

  /**
   * TODO : Will use for set patch values 
   * Update the model and changes needed for the view here.
   */
  writeValue(name: any) {}

 
  registerOnChange(fn: any) {
    this.hoursForm.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: any) {
    this.hoursForm.valueChanges.subscribe(fn);
  }

  openTimePicker(formGroup: string, field: HourType) {
    const data: TimePickerOpenEvent = {
      formGroup: formGroup,
      field: field,
    };
    this.dialog.open(TimepickerDialogComponent, {
      width: '600px',
      data: data,
    }).afterClosed()
      .pipe(filter(res => res))
      .subscribe((res: TimePickerResponse) => {
        const formattedTime = String(res.hour).padStart(2, '0') + String(res.minute).padStart(2, '0');
        if (res.batchApply) {
          switch (res.batchApply) {
            case 'applyAll':
              this.handleBatchApply(res.belongsTo.field, formattedTime, 6);
              break;
            default:
              this.handleBatchApply(res.belongsTo.field, formattedTime, 4);
              break;
          }
        } else {
          this.handleApply(res.belongsTo.formGroup, res.belongsTo.field, formattedTime);
          this.handleDependantValues(res.belongsTo.field, res.belongsTo.formGroup, formattedTime);
        }
    });
  }

  /**
   * Function to fill the open hours as batch operation limited to the length such as weekdays or all
   * @param field which field it is, either from, to, or next
   * @param value selected time in the picker
   * @param length how many form fields need to be filled from the top
   */
  private handleBatchApply(field: string, value: string, length: number): void {
    Object.keys(this.hoursForm['controls']).forEach((day, index) => {
      if (index <= length) {
        this.hoursForm['controls'][day]['controls'][field].patchValue(value);
        this.handleDependantValues(field, day, value);
      }
    });
  }

  /**
   * Function to fill just a single field
   * @param formGroup formGroup of the day of the week
   * @param field which field it is, either from, to, or next
   * @param value selected time in the picker
   */
  private handleApply(formGroup: string, field: string, value: string): void {
    // set value to the field
    this.hoursForm
      ['controls'][formGroup]['controls'][field]
      .patchValue(value);
  }

  /**
   * To set/reset To and Next day values based on user selection such as,
   * if next day is selected and to is selected or has a different value, it should be set to 2400
   * if to is selected, then next day value should be reset to empty
   * @param field field name
   * @param formGroup formgroup day of the week
   * @param value selected value
   */
  private handleDependantValues(field: string, formGroup: string, value: string) {
    // if next day is selected, to should be 2400
    if (field === 'next') {
      this.hoursForm
        ['controls'][formGroup]['controls']['to']
        .patchValue('2400');
    }
    // if to is selected and not 24, next day should be emptied
    if (field === 'to' && value !== '2400') {
      this.hoursForm
        ['controls'][formGroup]['controls']['next']
        .patchValue('');
    }
  }

  clearAllTimeData() {
    Object.keys(this.hoursForm.controls).map((day, index) => {
      this.hoursForm['controls'][day]['controls']['from'].patchValue(null);
      this.hoursForm['controls'][day]['controls']['to'].patchValue(null);
      this.hoursForm['controls'][day]['controls']['next'].patchValue(null);
    });
  }

  public copyValues(range: string) {
    const from = this.hoursForm['controls']['mo']['controls']['from']['value'];
    const to = this.hoursForm['controls']['mo']['controls']['to']['value'];
    const next = this.hoursForm['controls']['mo']['controls']['next']['value'];
    // setting range by checking if this is weekdays only or all
    const limit = (range === this.duration.ALL) ? 6 : 4;
    Object.keys(this.hoursForm.controls).map((day, index) => {
      if (index !== 0 && index <= limit) {
        if (from && from !== 'undefined') {
          this.hoursForm['controls'][day]['controls']['from'].patchValue(from);
          this.hoursFieldchanges = true;
        }
        if (to) {
          this.hoursForm['controls'][day]['controls']['to'].patchValue(to);
          this.hoursFieldchanges = true;
        }
        if (next) {
          this.hoursForm['controls'][day]['controls']['next'].patchValue(next);
        }
      } else if (index !== 0 &&  index >= limit) {
        this.hoursForm['controls'][day]['controls']['from'].patchValue('');
        this.hoursForm['controls'][day]['controls']['to'].patchValue('');
        this.hoursForm['controls'][day]['controls']['next'].patchValue('');
      }
    });
  }

}
