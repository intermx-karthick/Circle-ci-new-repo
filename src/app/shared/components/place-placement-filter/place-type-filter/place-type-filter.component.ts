import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import {debounceTime, distinctUntilChanged, filter, finalize, map, takeUntil} from 'rxjs/operators';
import { Subject } from 'rxjs';

import { Helper } from '../../../../classes';
import { PlaceType } from '@interTypes/inventory';
import { AbstractLazyLoadComponent, LazyLoaderService } from '@shared/custom-lazy-loader';
import { InventoryService } from '@shared/services';
import { FiltersService } from '../../../../explore/filters/filters.service';
import {PlaceTypesResponse} from '@interTypes/inventory-management';

@Component({
  selector: 'app-place-type-filter',
  templateUrl: 'place-type-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceTypeFilterComponent extends AbstractLazyLoadComponent implements OnInit, OnDestroy {

  @Output() placeTypeOnSelect = new EventEmitter();
  @Input() sPlaceType: string[];

  placeTypes: PlaceType[];
  selectedPlaceTypes: string[];
  searchPlaceQuery = '';
  filteredPlaceTypes: PlaceType[];
  isInitialLoadCompleted: boolean = false;
  unsubscribeInitiator$: Subject<void> = new Subject<void>();

  // storing selected data from filter state if initial load was lazy loaded.
  private tmpSelectedPlaceType: string[] = [];
  private unSubscribe: Subject<void> = new Subject<void>();

  constructor(
    private inventoryService: InventoryService,
    private filterService: FiltersService,
    private cdRef: ChangeDetectorRef,
  ) {
    super();
  }

  init(): void {
    this.loadPlaceTypeList();
    this.cdRef.markForCheck();
  }

  ngOnInit() {
    this.listenerForInitialLoad();
    this.listenerForPlaceAndPlacementTypeFilter();

    this.filterService.onReset()
      .pipe(
        takeUntil(this.unSubscribe),
        filter(type => type === 'FilterInventory' || type === 'All')
      )
      .subscribe(type => {
        this.clearMediaFilter();
        this.cdRef.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  clearMediaFilter() {
    this.selectedPlaceTypes = [];
    this.placeTypeOnSelect.emit(this.selectedPlaceTypes);
    this.filteredPlaceTypes = this.placeTypes;
    this.searchPlaceQuery = '';
    this.tmpSelectedPlaceType = [];
  }

  placeTrackById(index: number, place: PlaceType){
    return place.id;
  }

  filterplaceTypes(data) {
    if (data.emptySearch) {
      this.filteredPlaceTypes = this.placeTypes;
    } else {
      this.filteredPlaceTypes = data.value;
    }
    this.cdRef.markForCheck();
  }

  compare(c1, c2) {
    return c1 && c2 && c1['id'] === c2['id'];
  }

  onSelectPlaceType(selecetdPlaceType) {
    if (Array.isArray(this.selectedPlaceTypes) && this.selectedPlaceTypes.length > 0) {
      const index = this.selectedPlaceTypes.indexOf(selecetdPlaceType.name);
      if (index === -1) {
        this.selectedPlaceTypes.push(selecetdPlaceType.name);
      } else {
        this.selectedPlaceTypes.splice(index, 1);
      }
      this.placeTypeOnSelect.emit(this.selectedPlaceTypes);
    } else {
      this.selectedPlaceTypes = [];
      this.selectedPlaceTypes.push(selecetdPlaceType.name);
      this.placeTypeOnSelect.emit(this.selectedPlaceTypes);
    }
  }

  onCheckedPlace(placeType) {
    if (this.selectedPlaceTypes) {
      const index = this.selectedPlaceTypes.indexOf(placeType.name);
      if (index !== -1) {
        return true;
      }
    }
  }

  private listenerForPlaceAndPlacementTypeFilter() {
    this.filterService.getFilters()
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.unSubscribe))
      .subscribe(response => {
        if (response?.data?.mediaTypeList?.ids) {
          const selectedPlaceType = response.data.mediaTypeList.ids.placeType || [];
          this.updateSelectedPlaceTypes(selectedPlaceType);
        } else {
          this.clearMediaFilter();
        }
        this.cdRef.markForCheck();
      });
  }

  private loadPlaceTypeList() {
    this.inventoryService.getPlaceTypeList(false)
      .pipe(
        filter(response =>Array.isArray(response?.place_types) && response.place_types.length > 0),
        map((response: PlaceTypesResponse) => {
          return response?.place_types.sort((a: PlaceType, b: PlaceType) =>
            a?.name?.toLowerCase()?.localeCompare(b?.name)
          );
        }),
        finalize(() => this.destroyInitiator())
      )
      .subscribe((response: PlaceType[]) => {
        this.placeTypes = response;
        this.filteredPlaceTypes = Helper.deepClone(response);

        // Setting selected placement types if tmpSelected data available
        if (this.tmpSelectedPlaceType.length > 0) {
          this.filterSelectedPlaceTypes(this.tmpSelectedPlaceType);
          this.tmpSelectedPlaceType = [];
        }

        this.cdRef.markForCheck();
      });
  }

  private updateSelectedPlaceTypes(selectedPlaceType: string[]) {
    if (Array.isArray(selectedPlaceType) && selectedPlaceType.length > 0) {
      this.selectedPlaceTypes = [];
      if(!this.placeTypes){
        this.tmpSelectedPlaceType = selectedPlaceType;
        return;
      }

      this.filterSelectedPlaceTypes(selectedPlaceType);
    } else {
      this.selectedPlaceTypes = [];
      this.placeTypeOnSelect.emit(this.selectedPlaceTypes);
      this.filteredPlaceTypes = this.placeTypes;
    }
  }

  private filterSelectedPlaceTypes(selectedPlaceType: string[]) {
    selectedPlaceType.forEach((place) => {
      const placeData = this.placeTypes.find((placeOrg) => placeOrg.name === place);
      if (placeData) {
        this.selectedPlaceTypes.push(placeData.name);
      }
    });

    this.placeTypeOnSelect.emit(this.selectedPlaceTypes);
  }
}

