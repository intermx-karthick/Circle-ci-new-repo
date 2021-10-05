import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, TemplateRef} from '@angular/core';
import {ActionType, PeriodType} from '@interTypes/timepicker';


@Component({
  selector: 'app-timepicker',
  templateUrl: './timepicker.component.html',
  styleUrls: ['./timepicker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimepickerComponent implements OnInit {
  @Input() public mode?: 12 | 24 = 12;
  @Input() public timePeriod ?: PeriodType = 'AM';
  @Input() public minuteSplit ? = 5;
  @Input() public minuteHighlights ?: number[] = [15, 30, 45, 60];
  @Input() public actionButtons ?: TemplateRef<any>;
  @Input() public errorsTemplate?: TemplateRef<any>;
  @Output() private periodSelected: EventEmitter<string> = new EventEmitter<string>();
  @Output() private actionClicked: EventEmitter<ActionType> = new EventEmitter<ActionType>();
  @Output() private hourSelected: EventEmitter<number> = new EventEmitter<number>();
  @Output() private minuteSelected: EventEmitter<number> = new EventEmitter<number>();
  public hours: number[] = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  public displayHours: number[] = [...this.hours];
  public minutes: number[];
  public selectedHour: number;
  public selectedMinute = 0;
  constructor() { }

  ngOnInit(): void {
    // creating an empty array and filling it with 60 minutes
    this.minutes = Array(60)
      .fill(0)
      .map((e, i) => i)
      .filter(value => (value % this.minuteSplit) === 0); // displaying only the required numbers using the split value
    // handling for 24 hours clock
    if (this.mode === 24) {
      this.hours.splice(0, 1, 0);
    } else {
      this.changeHours();
    }
  }
  private changeHours(): void {
    this.hours = [...this.displayHours];
    if (this.timePeriod === 'AM') {
      this.hours.splice(12);
    } else {
      this.hours.splice(0, 12);
    }
  }
  periodChange($event): void {
    this.timePeriod = $event.value;
    this.changeHours();
    this.periodSelected.emit(this.timePeriod);
  }
  hourChange($event): void {
    this.selectedHour = $event.value;
    this.hourSelected.emit(this.selectedHour);
  }
  minuteChange($event): void {
    this.selectedMinute = $event.value;
    this.minuteSelected.emit(this.selectedMinute);
  }
  action(type: ActionType): void {
    this.actionClicked.emit(type);
  }
}
