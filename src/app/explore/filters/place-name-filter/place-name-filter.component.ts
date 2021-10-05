import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FiltersService } from '../filters.service';
import { takeUntil, debounceTime, distinctUntilChanged, map, finalize } from 'rxjs/operators';
import { InventoryService } from '@shared/services/inventory.service';
import { Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';

@Component({
  selector: 'app-place-name-filter',
  templateUrl: './place-name-filter.component.html',
  styleUrls: ['./place-name-filter.component.less'],
})
export class PlaceNameFilterComponent extends AbstractLazyLoadComponent implements OnInit, OnDestroy {
  public places: any = [];
  public selectedPlaces: any = [];
  public searchCtrl: FormControl = new FormControl();
  public selectedPlacesCtrl: FormControl = new FormControl();
  private page = 1;
  private totalPlacesLoaded = false;
  private unSubscribe: Subject<void> = new Subject<void>();
  public enableLoader = false;
  @Output() updatePlaceNameFilterSelection = new EventEmitter();
  isInitialLoadCompleted: boolean = false;
  unsubscribeInitiator$: Subject<void> = new Subject<void>();

  constructor(
    private inventoryService: InventoryService,
    private filtersService: FiltersService,
  ) {
    super();
  }

  init(): void {
    this.loadPlaces();
  }

  ngOnInit() {
    this.listenerForInitialLoad();
    this.loadFilterFromSession();
    this.filtersService.onReset()
      .subscribe(type => {
        if (type === 'FilterInventory' || type === 'All') {
          this.clearPlaces();
        }
      });
    this.searchCtrl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.unSubscribe)).subscribe(value => {
        this.loadPlaces(value);
      });
    this.filtersService.getFilters()
    .pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.unSubscribe),
      map(filters => {
        return this.filtersService.normalizeFilterDataNew(filters);
      }))
    .subscribe(filterData => {
      if (!(filterData['place_id_list'] && filterData['place_id_list'].length)) {
        this.clearPlaces();
      }
    });
  }

  private loadPlaces(query: string = '') {
    this.enableLoader = true;
    this.inventoryService.getPlaces(query)
      .pipe(finalize(()=>{
        this.enableLoader = false;
        this.destroyInitiator()
      }))
      .subscribe(places => {
        if (places && places.length) {
          this.places = places;
          this.setPlaces();
        } else {
          this.places = [];
        }
      });
  }

  private loadFilterFromSession() {
    const filterSession = this.filtersService.getExploreSession();
    if (filterSession) {
      if (filterSession['data'] && filterSession['data']['mediaTypeList'] &&
      filterSession['data']['mediaTypeList']['selectedPlaces'] &&
      filterSession['data']['mediaTypeList']['selectedPlaces'].length
      ) {
        this.selectedPlacesCtrl.patchValue(filterSession['data']['mediaTypeList']['selectedPlaces']);
        this.selectedPlaces = filterSession['data']['mediaTypeList']['selectedPlaces'];
        this.updatePlaceNameFilterSelection.emit(this.selectedPlaces);
      }
    }
  }

  // Compare function for mat-selection
  public compare(c1, c2) {
    return c1 && c2 && c1['id'] === c2['id'];
  }

  public clearPlaces() {
    this.selectedPlacesCtrl.patchValue([]);
    this.selectedPlaces = [];
    if (this.searchCtrl.value) {
      this.searchCtrl.patchValue('');
    }
    this.updatePlaceNameFilterSelection.emit(this.selectedPlaces);
  }


  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  public loadMorePlaces() {
    if (!this.totalPlacesLoaded) {
      this.page += 1;
      this.inventoryService.getPlaces(this.searchCtrl.value, this.page).subscribe(places => {
        if (places && places.length) {
          this.places.push(...places);
          this.setPlaces();
          this.totalPlacesLoaded = false;
        } else {
          this.totalPlacesLoaded = true;
        }
      });
    }
  }

  private setPlaces() {
    if (this.selectedPlaces.length) {
      setTimeout(() => {
        this.selectedPlacesCtrl.patchValue(this.selectedPlaces);
      }, 500);
    }
  }

  public onSelectPlace(option) {
    // We are saving the selected places in separate varaible because re-assigning the places variable with new data
    // collection while searching is resetting the mat selection control.
    const index = this.selectedPlaces.findIndex(place => place.id === option._value['id']);
    if (index > -1) {
      if (!option._selected) {
        this.selectedPlaces.splice(index, 1);
      }
    } else {
      this.selectedPlaces.push(option._value);
    }
    this.updatePlaceNameFilterSelection.emit(this.selectedPlaces);
  }

  public trackPlaces(item, index) {
    return item.id;
  }
}
