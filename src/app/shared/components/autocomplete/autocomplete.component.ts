import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutocompleteComponent implements OnInit {
  @Input() scenarioValues: any;
  @Input() currentTitle: string;
  @Input() placeHolder: string;
  @Input() isMarket: boolean;
  @Input() selectedValue = '';
  @Output() createAudience  = new EventEmitter();
  @Output() selectedScenario = new EventEmitter();

  public defaultControl = new FormControl(this.selectedValue);
  public filteredData: any;

  constructor() { }

  ngOnInit() {
    this.filteredData = this.defaultControl.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : this.isMarket ? value.name : value.title)),
      map(name => (name ? this.autoCompletefilter(name, 'market') : this.scenarioValues.slice()))
    );

    this.placeHolder = this.isMarket ? 'Market' : 'Audience';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes.selectedValue && changes.selectedValue.currentValue &&
      changes.selectedValue.currentValue['title'] !== 'Select An Audience') {
      this.defaultControl.patchValue(changes.selectedValue.currentValue);
    }
  }

  public displayValue(market?: any): string | undefined {
    if (this.isMarket) {
      return market ? market.name : undefined;
    }
    if (!this.isMarket) {
      return market ? market.title : undefined;
    }
  }

  private autoCompletefilter(name: string, type?: string) {
    const filterValue = name.toLowerCase();
    if (this.isMarket) {
      return this.scenarioValues.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
    }

    if (!this.isMarket) {
      return this.scenarioValues.filter(option => option.title.toLowerCase().indexOf(filterValue) === 0);
    }
  }

  public change($event) {
    this.selectedScenario.emit($event);
  }

  public browserAudience($event) {
    this.createAudience.emit($event);
  }
}
