import { Component, OnInit, Input, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, NgForm } from '@angular/forms';
import { CommonService, PlacesDataService } from '@shared/services';
import { PlacesFiltersService } from '../places-filters.service';
import { Subject } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-places-search',
  templateUrl: './places-search.component.html',
  styleUrls: ['./places-search.component.less']
})
export class PlacesSearchComponent implements OnInit, OnDestroy {
  public searchForm: FormGroup;
  @Output() pushFilterLevel: EventEmitter<any> = new EventEmitter();
  @Output() pushFilter: EventEmitter<any> = new EventEmitter();
  isOpenedCategory = true;
  public autocompletePlaces = [];
  public fetchingSuggestion = false;
  private placesAutocompleteAPICall: any = null;
  public selectedCategory = {};
  selectedSearchPlace = {};
  public keyCodes = {
    ENTER: 13,
    PREVENT: [17, 18],
    LEFTARROW: 37,
    UPARROW: 38,
    DOWNARROW: 40
  };
  public hideTheAutocompleteSection: Boolean;
  public selectPlaceName: String;

  private ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private placesFiltersService: PlacesFiltersService,
    public placeService: PlacesDataService,
    private commonService: CommonService
  ) { }

  ngOnInit() {
    this.searchForm = this.fb.group({
      'place': ['', Validators.required]
    });

    /* this.searchForm.controls['place'].valueChanges.pipe(
      takeUntil(this.ngUnsubscribe),
      debounceTime(200))
      .subscribe(value => {
        if (value) {
          if (this.selectPlaceName !== value) {
            this.autocompletePlace(value);
          }
        } else {
          this.commonService.setDropdownState(false);
        }
      }); */

  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  onSubmit(formGroup: FormGroup) {
    if (formGroup.valid) {
      this.pushFilter.emit({filter: formGroup.value, placeTypesInit: true});
      this.commonService.setDropdownState(false);
    }
  }

  /* dropdownStageChange(state) {
      this.commonService.setDropdownState(state);
  } */

  /* @HostListener('window:keyup', ['$event']) checkingKeyCodesForAutoComplete(event: KeyboardEvent) {
    if (event.target['id'] === 'placeSearch') {
      let preventkeys = false;
      // checking keyCodes and prevent from the autocomplete
      if ((event.keyCode >= this.keyCodes.LEFTARROW && event.keyCode <= this.keyCodes.DOWNARROW)
        || event.keyCode === this.keyCodes.ENTER || this.keyCodes.PREVENT.indexOf(event.keyCode) !== -1) {
        preventkeys = true;
      }
      this.autocompletePlace(preventkeys, event);
    }

  } */

  autocompletePlace(autocompleteValue) {
    const value = autocompleteValue;
    const keyword = 'keyword';
    if (value !== '' && value.length >= 3) {
      this.commonService.setDropdownState(true);
      this.fetchingSuggestion = true;
      if (this.placesAutocompleteAPICall !== null) {
        this.placesAutocompleteAPICall.unsubscribe();
      }
      this.placesAutocompleteAPICall =
        this.placesFiltersService.getPOISuggestion(this.searchForm.getRawValue().place, keyword, true).subscribe(response => {
          if (typeof response['data']['places'] !== 'undefined') {
            this.autocompletePlaces = response['data']['places'];
          }
          this.fetchingSuggestion = false;
        },
        error => {
          this.fetchingSuggestion = false;
          this.autocompletePlaces = [];
        });
    }
  }

  selectPlace(ap) {
    this.selectPlaceName = ap.properties.location_name;
    this.searchForm.patchValue({ place: ap.properties.location_name });
    this.selectedSearchPlace = ap;
    this.commonService.setDropdownState(false);
  }

}
