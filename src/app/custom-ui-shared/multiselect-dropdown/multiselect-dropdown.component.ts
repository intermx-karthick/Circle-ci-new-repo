import { Output, forwardRef } from '@angular/core';
import { Input, EventEmitter } from '@angular/core';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { Options } from './types';

@Component({
  selector: 'app-multiselect-dropdown',
  templateUrl: './multiselect-dropdown.component.html',
  styleUrls: ['./multiselect-dropdown.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiselectDropdownComponent),
      multi: true
    }
  ]
})
export class MultiselectDropdownComponent implements ControlValueAccessor {
  @Input() public label: string;
  @Input() public tooltip: string;
  @Input() public placement = 'right';
  @Input() public delay = '200';
  @Input() public isLoading = false;
  @Input() public options: Options;

  @Output() public scrolled = new EventEmitter<boolean>();

  public multiselectControl = new FormControl('');

  public onScrolled(event: boolean): void {
    this.scrolled.emit(event);
  }

  public onChange: any = () => {};
  public onTouched: any = () => {};

  public writeValue(value: any[]): void {
    if (!value) {
      return;
    }
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
