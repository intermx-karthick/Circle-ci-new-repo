import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import {debounceTime, distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators';
import { Subject } from 'rxjs';

import { Helper } from '../../../../classes';
import {PlacementType, PlacementTypeResponse, PlaceType} from '@interTypes/inventory';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';
import { InventoryService } from '@shared/services';
import { FiltersService } from '../../../../explore/filters/filters.service';

@Component({
  selector: 'app-placement-type-filter',
  templateUrl: 'placement-type-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlacementTypeFilterComponent extends AbstractLazyLoadComponent implements OnInit, OnDestroy {

  @Output() placementTypeOnSelect = new EventEmitter();
  @Input() sPlaceMentType: string[];

  placementTypes: PlacementType[];
  selectedPlacementTypes: string[];
  searchQuery = '';
  filteredPlacementTypes: PlacementType[];
  isInitialLoadCompleted: boolean = false;
  unsubscribeInitiator$: Subject<void> = new Subject<void>();

  // storing selected data from filter state if initial load was lazy loaded.
  private tmpSelectedPlacementType: string[] = [];
  private unSubscribe: Subject<void> = new Subject<void>();

  constructor(
    private inventoryService: InventoryService,
    private filterService: FiltersService,
    private cdRef: ChangeDetectorRef,
    ) {
    super();
  }

  init() {
    this.loadPlacementTypeList();
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
    this.selectedPlacementTypes = [];
    this.placementTypeOnSelect.emit(this.selectedPlacementTypes);
    this.searchQuery = '';
    this.tmpSelectedPlacementType = [];
  }

  placementTrackById(index: number, placement: PlacementType) {
    return placement.id;
  }

  filterPlacementsType(data) {
    if (data.emptySearch) {
      this.filteredPlacementTypes = this.placementTypes;
    } else {
      this.filteredPlacementTypes = data.value;
    }
    this.cdRef.markForCheck();
  }

  compare(c1, c2) {
    return c1 && c2 && c1['id'] === c2['id'];
  }

  onSelectPlacementType(selecetdPlacementType) {
    if (Array.isArray(this.selectedPlacementTypes) && this.selectedPlacementTypes.length > 0) {
      const index = this.selectedPlacementTypes.indexOf(selecetdPlacementType.name);
      if (index === -1) {
        this.selectedPlacementTypes.push(selecetdPlacementType.name);
      } else {
        this.selectedPlacementTypes.splice(index, 1);
      }
      this.placementTypeOnSelect.emit(this.selectedPlacementTypes);
    } else {
      this.selectedPlacementTypes = [];
      this.selectedPlacementTypes.push(selecetdPlacementType.name);
      this.placementTypeOnSelect.emit(this.selectedPlacementTypes);
    }
  }

  onCheckedSelection(placementType) {
    if (this.selectedPlacementTypes) {
      const index = this.selectedPlacementTypes.indexOf(placementType.name);
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
          const selectedPlacementType = response.data.mediaTypeList.ids.placementType || [];
          this.updateSelectedPlacementTypes(selectedPlacementType);
        } else {
          this.clearMediaFilter();
        }

        this.cdRef.markForCheck();
      });
  }

  private loadPlacementTypeList() {
    this.inventoryService.getPlacementTypeList()
      .pipe(
        filter(response => {
          return Array.isArray(response?.placement_types) && response.placement_types.length > 0;
        }),
        map((placementTypes: PlacementTypeResponse) => {
          return placementTypes.placement_types
            .sort((a: PlacementType, b: PlacementType) => a?.name?.toLowerCase()?.localeCompare(b?.name));
        })
      ).subscribe((response: PlacementType[]) => {
        this.destroyInitiator();
        this.placementTypes = response;
        this.filteredPlacementTypes = Helper.deepClone(response);

        // Setting selected placement types if tmpSelected data available
        if (this.tmpSelectedPlacementType.length > 0) {
          this.filterSelectedPlacementTypes(this.tmpSelectedPlacementType);
          this.tmpSelectedPlacementType = [];
        }

        this.cdRef.markForCheck();
      });
  }

  private updateSelectedPlacementTypes(selectedPlacementType: string[]) {
    if (Array.isArray(selectedPlacementType) && selectedPlacementType.length > 0) {
      this.selectedPlacementTypes = [];
      if (!this.placementTypes) {
        this.tmpSelectedPlacementType = selectedPlacementType;
        return;
      }

      this.filterSelectedPlacementTypes(selectedPlacementType);
    } else {
      this.selectedPlacementTypes = [];
      this.placementTypeOnSelect.emit(this.selectedPlacementTypes);
      this.filteredPlacementTypes = this.placementTypes;
    }
  }

  private filterSelectedPlacementTypes(selectedPlacementType: string[]) {
    selectedPlacementType.forEach((placement) => {
      const placeMentData = this.placementTypes.find((placeMentOrg) => placeMentOrg.name === placement);
      if (placeMentData) {
        this.selectedPlacementTypes.push(placeMentData.name);
      }
    });

    this.placementTypeOnSelect.emit(this.selectedPlacementTypes);
  }
}
