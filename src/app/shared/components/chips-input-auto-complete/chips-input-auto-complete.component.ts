import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ChipSource} from '@interTypes/ChipsInput';
import {Observable, of, Subject} from 'rxjs';
import {FormControl} from '@angular/forms';
import {ENTER} from '@angular/cdk/keycodes';
import {debounce, debounceTime, filter, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-chips-autocomplete',
  templateUrl: './chips-input-auto-complete.component.html',
  styleUrls: ['./chips-input-auto-complete.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipsInputAutoCompleteComponent implements OnInit, OnDestroy {
  @Input() public chips: ChipSource<any|null>[];
  @Input() public chips$: Observable<ChipSource<any|null>[]>;
  @Input() removable?: boolean = true;
  @Input() selectable?: boolean = false;
  @Input() ariaLabel?: string = 'Multiple selected values';
  @Input() placeHolder?: string = 'Search';
  @Input() seperators?: number[] = [ENTER];
  @Input() public autoCompleteClass = '';
  @Output() removed: EventEmitter<ChipSource<any|null>> = new EventEmitter<ChipSource<any|null>>();
  @Output() search: EventEmitter<string> = new EventEmitter<string>();
  @Output() chipsChanged: EventEmitter<any> = new EventEmitter<ChipSource<any|null>>();
  @ViewChild('autoCompleteInput') autoCompleteInput: ElementRef<HTMLInputElement>;
  public autoCompleteControl: FormControl = new FormControl();
  private unsubscribe: Subject<void> =  new Subject<void>();
  constructor() { }

  ngOnInit() {
    this.autoCompleteControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribe),
        debounceTime(300),
        filter((res: string) => res.length >= 3))
      .subscribe((res: string) => {
        res = res.trim();
        if (res.length) {
          this.search.emit(res);
        }
      });
  }
  chipRemoved(chip) {
    this.removed.emit(chip);
  }

  /**
   * The selected method will only emit the selected auto-complete value,
   * The parent component is responsible to update the data so it'll be displayed in the pill
   * This is to give the parent the ability to better format the chip label based on their needs
   * @param event
   */
  selected(event) {
    this.chipsChanged.emit(event.option.value);
    this.autoCompleteInput.nativeElement.value = '';
    this.chips$ = of([]);
  }
  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
