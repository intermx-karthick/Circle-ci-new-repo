import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  AfterViewInit,
  OnDestroy,
  ViewEncapsulation,
  Output,
  EventEmitter
} from '@angular/core';
import { ListKeyManager } from '@angular/cdk/a11y';
import { ArrowNavigationComponent } from '@shared/components/arrow-navigation/arrow-navigation.component';
import { PlacesFiltersService } from '../places-filters.service';

@Component({
  selector: 'app-places-single-level-filter',
  templateUrl: './places-single-level-filter.component.html',
  styleUrls: ['./places-single-level-filter.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class PlacesSingleLevelFilterComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() options = [];
  @Input() title = '';
  @Input() filterKey = '';
  @Output() onSingleSearch: EventEmitter<any> = new EventEmitter();
  public filteredOptions: any = [];
  public selectedOptions = [];
  public searchSelectedOption = {};
  public arrowKeyPosition = { operator: 0};
  @ViewChild('optionSearch') focusOption: ElementRef;
  public keyboardEventsManager: ListKeyManager<any>;
  @ViewChildren(ArrowNavigationComponent) listItems: QueryList<ArrowNavigationComponent>;
  public mod_permission: any;
  public allowInventory = '';
  public defaultAudience: any;
  public unSubscribe = true;
  public showSearchField = false;
  public searchQuery = '';
  public filterSessionData = [];
  public subscriberOption = null;
  loadMoreChild: boolean;
  constructor(private placeFilterService: PlacesFiltersService) { }

  ngOnInit() {
    this.filterSessionData = this.placeFilterService.getPlacesSession();
    if (this.filterSessionData && this.filterSessionData['filters'] && this.filterSessionData['filters'][this.filterKey]) {
      this.selectedOptions = this.filterSessionData['filters'][this.filterKey];
    }
  }
  public ngOnChanges(changes: SimpleChanges) {
    if (changes.options) {
      this.filteredOptions = changes.options.currentValue;
    }
  }
  public ngAfterViewInit() {
    if (this.listItems['_results']) {
      this.keyboardEventsManager = new ListKeyManager<any>(this.listItems).withWrap().withTypeAhead();
    }
  }

  public ngOnDestroy() {
    this.unSubscribe = false;
  }
  public showSearch() {
    this.showSearchField = !this.showSearchField;
    if (!this.showSearchField) {
      this.searchQuery = '';
      this.filteredOptions = this.options;
    }
  }
  public setSelectedOption(selectedOption) {
    if (typeof this.searchSelectedOption['value'] !== 'undefined') {
      const index = this.selectedOptions.findIndex(opp => opp === this.searchSelectedOption['value']);
      this.selectedOptions.splice(index, 1);
      this.searchSelectedOption = {};
    }
    if (typeof selectedOption.value !== 'undefined') {
      const matches = this.selectedOptions.filter(v => v === selectedOption.value);
      if (matches.length <= 0) {
        this.searchSelectedOption = selectedOption;
        this.selectedOptions.push(selectedOption.value);
      }
    }
    this.pushSearch(1000);
  }
  public filterOptions(data) {
    if (data.emptySearch) {
      this.filteredOptions = this.options;
    } else {
      this.filteredOptions = data.value;
    }
  }
  public onSelectOption(list) {
    this.selectedOptions = list.selectedOptions.selected.map(item => item.value.value);
    this.pushSearch();
  }
  checkIsSelected(option) {
    const matches = this.selectedOptions.filter(v => v === option.value);
    return matches.length > 0;
  }
  public compare(c1, c2) {
    return c1 && c2 && c1['_id'] === c2['_id'];
  }
  private pushSearch(delay = 1000) {
    if (this.subscriberOption !== null) {
      clearTimeout(this.subscriberOption);
    }
    this.subscriberOption = setTimeout(e => {
      this.onSingleSearch.emit(this.selectedOptions);
    }, delay);
  }
  public showMoreLess(event) {
    this.loadMoreChild = !this.loadMoreChild;
  }
}
