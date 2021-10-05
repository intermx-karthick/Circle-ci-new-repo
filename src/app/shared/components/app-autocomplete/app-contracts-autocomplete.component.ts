import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { AppAutocompleteOptionsModel } from "./model/app-autocomplete-option.model";

@Component({
    selector: 'app-contracts-autocomplete',
    templateUrl: './app-contracts-autocomplete.component.html',
    styleUrls: ['./app-contracts-autocomplete.component.less'],
    providers: [
      {
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => AppContractsAutocompleteComponent),
        multi: true
      }
    ]
})
export class AppContractsAutocompleteComponent implements ControlValueAccessor {
    autocompleteControl = new FormControl();
    filteredOptions: Observable<AppAutocompleteOptionsModel[]>;
    items: AppAutocompleteOptionsModel[];

    selected: AppAutocompleteOptionsModel;
    onChange: any = () => { };
    onTouched: any = () => { };
    disabled = false;

    @Input() placeholder: string;
    @Input() set current(value: AppAutocompleteOptionsModel) {
      if(!value) {
        return;
      }

      this.selected = value;

      if(!!this.selected.value) {
        this.autocompleteControl.patchValue(this.selected.value)
      }
    }

    @Output() optionSelected: EventEmitter<AppAutocompleteOptionsModel> = new EventEmitter<AppAutocompleteOptionsModel>();

    constructor() {
      this.onChange(null);

      this.autocompleteControl.valueChanges.subscribe((value) => {
        if(value === "") {
          this.onChange(null);

          return;
        }

        const item: AppAutocompleteOptionsModel[] = this._filter(value);

        if(!!item && item.length) {
          this.onChange(item[0].id);
        } else {
          this.onChange(null);
        }
      })
    }
  
    writeValue(value: AppAutocompleteOptionsModel[]): void {
      if(!value) {
        this.autocompleteControl.patchValue('');

        return;
      }

      this.items = value;

      this.filteredOptions = this.autocompleteControl.valueChanges.pipe(
        startWith('' ),
        map(value => this._filter(value))
      );
    }
  
    registerOnChange(fn: any): void {
      this.onChange = fn;
    }
  
    registerOnTouched(fn: any): void {
      this.onTouched = fn;
    }
  
    setDisabledState?(isDisabled: boolean): void {
      this.disabled = isDisabled;
    }

    onOptionClick(option): void {
      this.optionSelected.emit(option);
    }
  
    private _filter(value: string): AppAutocompleteOptionsModel[] {
      if(!this.items || !this.items.length) {
        return;
      }

      const filterValue = value.toLowerCase();
  
      return this.items.filter(option => option.value.toLowerCase().indexOf(filterValue) === 0);
    }

}