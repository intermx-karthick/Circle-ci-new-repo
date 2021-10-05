import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ChipSource, GroupAutocompleteChipSource} from '@interTypes/ChipsInput';
import {Observable, of, Subject} from 'rxjs';
import {FormControl} from '@angular/forms';
import {ENTER} from '@angular/cdk/keycodes';
import {debounce, debounceTime, filter, map, takeUntil} from 'rxjs/operators';
import {ChipsInputAutoCompleteComponent} from '@shared/components/chips-input-auto-complete/chips-input-auto-complete.component';

@Component({
  selector: 'app-chips-group-autocomplete',
  templateUrl: './chips-input-group-auto-complete.component.html',
  styleUrls: ['./chips-input-group-auto-complete.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipsInputGroupAutoCompleteComponent extends ChipsInputAutoCompleteComponent implements OnInit, OnDestroy {
  @Input() public chips: ChipSource<any|null>[];
  @Input() public chips$: Observable<GroupAutocompleteChipSource<any|null>[]>;

  public autoCompleteControl: FormControl = new FormControl();
  ngOnInit() {
    super.ngOnInit();
  }
}
