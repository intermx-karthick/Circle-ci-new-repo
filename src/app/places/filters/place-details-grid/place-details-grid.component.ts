import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, OnInit} from '@angular/core';
import {PlaceProperties, PlaceSortParams, PlacesSortables} from '@interTypes/placeFilters';
import { PlacesFiltersService } from '../places-filters.service';
@Component({
  selector: 'app-place-details-grid',
  templateUrl: './place-details-grid.component.html',
  styleUrls: ['./place-details-grid.component.less']
})
export class PlaceDetailsGridComponent implements OnChanges, OnInit {
  @Input() public sortables: PlacesSortables[];
  @Input() public placeResults: PlaceProperties[];
  @Input() page: number;
  @Input() currentSort: PlaceSortParams;
  @Input() sfids;
  @Output() placeSelect: EventEmitter<string> = new EventEmitter<string>();
  @Output() sortingChanges: EventEmitter<PlaceSortParams> = new EventEmitter<PlaceSortParams>();
  @Output() pagination: EventEmitter<any> = new EventEmitter();
  @Output() onHoverOnCard: EventEmitter<string> = new EventEmitter<string>();
  @Output() onLeaveOnCard: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onClickOnCard: EventEmitter<any> = new EventEmitter<any>();
  @Output() selectionChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() selectedStage;

  currentSortKey = '';
  placeIds = [];
  currentTab: any;
  public contentHeight: number;
  constructor (private placeFilterService: PlacesFiltersService) {
  }
  ngOnInit() {
    this.currentTab = this.placeFilterService.openFilterTab;
    this.onResize();
    this.onToggle(true);
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.placeResults && changes.placeResults.currentValue) {
      this.placeResults = changes.placeResults.currentValue;
    }
    if (changes.sfids && changes.sfids.currentValue) {
      this.sfids = changes.sfids.currentValue;
    }
    if (changes.sortables && changes.sortables.currentValue) {
      this.sortables = changes.sortables.currentValue;
    }
  }
  onSortables(sortValue) {
    // const sort = {sort_by: sortValue.value, order_by: 1};
    // this.sortingChanges.emit(sort);
    const sort = {
      sort_by: sortValue.value,
      order_by: 1,
      sfids: this.getAllPlaceIds()
    };
    this.sortingChanges.emit(sort);
  }
  
  loadMore() {
    this.page += 1;
    this.pagination.emit({
      page: this.page,
      selectAll: true,
      selectedCount: this.getSelectedPlaceIds().length,
      sfids: this.getAllPlaceIds()
    });
  }
  private getAllPlaceIds() {
    if (!this.sfids) {
      return [];
    }
    return this.sfids.map(placeDetail => placeDetail.id);
  }
  private getSelectedPlaceIds() {
    if (!this.sfids) {
      return [];
    }
    return this.sfids.filter(placeObj => placeObj.selected).
    map(placeDetail => placeDetail.id);
  }
  onResize() {
    if (this.currentTab !== 1) {
      this.contentHeight = window.innerHeight - 450;
    } else {
      this.contentHeight = window.innerHeight - 409;
    }
  }

  hoverOnCard(place) {
    this.onHoverOnCard.emit(place);
  }
  hoverOutOnCard() {
    this.onLeaveOnCard.emit(true);
  }
  onCardClick(place) {
    this.onClickOnCard.emit(place);
  }
  public selectCheckboxToggle(place) {
    this.sfids.map(sf => {
      if (sf.id === place.ids.safegraph_place_id) {
        sf.selected = place.selected;
      }
    });
    this.onToggle();
  }
  public onToggle(initCall = false) {
    const selected = this.sfids.filter(p => p.selected);
    let placeNames = [];
    if (this.selectedStage === 'selected') {
      placeNames = this.sfids.filter(placeObj => placeObj.selected).map(placeDetail => placeDetail['id']);
    } else {
      placeNames = this.sfids.filter(placeObj => !placeObj.selected).map(placeDetail => placeDetail['id']);
    }
    this.selectionChange.emit({
      count: selected.length,
      placeNames: placeNames,
      selectedStage: this.selectedStage,
      resultType: 'single',
      initCall: initCall,
      removedPlaces: this.getSelectedPlaceNames()
    });
  }
  private getSelectedPlaceNames() {
    let places = [];
    if (this.sfids) {
      places = this.sfids.filter(placeObj => placeObj.selected).
        map(placeDetail => placeDetail.id);
    }
    return places;
  }
}
