import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {TimePickerOpenEvent, TimePickerResponse} from '@interTypes/Place-audit-types';
import {ActionType, PeriodType} from '@interTypes/timepicker';

@Component({
  selector: 'app-timepicker-dialog',
  templateUrl: './timepicker-dialog.component.html',
  styleUrls: ['./timepicker-dialog.component.less']
})
export class TimepickerDialogComponent implements OnInit {
  private selectedHour;
  private selectedMinute = 0;
  public selectedPeriod: PeriodType;
  public validationError: string;
  constructor(private matRef: MatDialogRef<TimepickerDialogComponent>,
              @Inject(MAT_DIALOG_DATA) private fieldData: TimePickerOpenEvent) {
  }
  ngOnInit(): void {
    if (this.fieldData.field === 'to') {
      this.selectedPeriod = 'PM';
    } else {
      this.selectedPeriod = 'AM';
    }
  }

  public action(type: ActionType): void {
    let dialogData: TimePickerResponse;
    if (type !== 'close') {
      if (!this.selectedHour) {
        this.validationError = 'Please select any hour before applying';
        return;
      }
      dialogData = {
        period: this.selectedPeriod,
        hour: this.selectedHour,
        minute: this.selectedMinute,
        belongsTo: this.fieldData,
      };
    }
    if (type === 'applyWeekDays' || type === 'applyAll') {
      dialogData.batchApply = type;
    }
    this.matRef.close(dialogData);
  }
  public hourSelected(value): void {
    this.selectedHour = value;
  }
  public minuteSelected(value): void {
    this.selectedMinute = value;
  }
  public periodSelected(value): void {
    this.selectedPeriod = value;
  }

}
