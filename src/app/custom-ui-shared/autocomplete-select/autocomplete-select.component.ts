import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  forwardRef
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormControl
} from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Options, Option } from './types';

@Component({
  selector: 'app-autocomplete-select',
  templateUrl: './autocomplete-select.component.html',
  styleUrls: ['./autocomplete-select.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteSelectComponent),
      multi: true
    }
  ]
})
export class AutocompleteSelectComponent
  implements OnInit, ControlValueAccessor {
  @Input() public label: string;
  @Input() public delay = 200;
  @Input() public optionTextDelay = 200;
  @Input() public panelWidth = '160';
  @Input() public panelContainer: string;
  @Input() public tooltip: string;
  @Input() public placement = 'top';
  @Input() public optionTextPlacement = 'top';
  @Input() public options: Options;
  @Input() public isOptionSelected: boolean;
  @Input() public isLoading = false;
  @Input() public isErrors: boolean;

  @Output() public autoCompleteOpened = new EventEmitter<boolean>();
  @Output() public scrolled = new EventEmitter<boolean>();

  public readonly tooltipMaxLengh = 21;

  public filteredOptions: Observable<Options>;

  public autoCompleteControl = new FormControl('');

  ngOnInit() {
    this.filteredOptions = this.getFiltererControlValue();
  }

  public trackByFn(id: number | string, option: Option): any {
    return option?.id ?? id;
  }

  public autocompleteDisplayWith(option: Option): string {
    return option?.name ?? '';
  }

  private getFiltererControlValue() {
    return this.autoCompleteControl?.valueChanges.pipe(
      startWith(''),
      map((data: Option | string) => {
        if (data) {
          return typeof data === 'string' ? data : data.name;
        }
      }),
      map((data: Option | string) => data && this.filter(data))
    );
  }

  private filter(value: Option | string): Options {
    if (typeof value === 'string') {
      const filterValue = value.toLowerCase();
      const result = this.options.filter((option) =>
        option.name.toLowerCase().includes(filterValue)
      );

      return result;
    }
  }

  public onAutoCompleteOpened(event: boolean): void {
    this.autoCompleteOpened.emit(event);
  }

  public onScrolled(event: boolean): void {
    this.scrolled.emit(event);
  }

  public onChange: any = () => {};
  public onTouched: any = () => {};

  public writeValue(value): void {
    if (!value) {
      return;
    }

    this.filteredOptions = this.getFiltererControlValue();
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
