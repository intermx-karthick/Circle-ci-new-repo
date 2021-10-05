import {Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges} from '@angular/core';
import {Place, PlacesSortables, PlaceSortParams} from '@interTypes/placeFilters';
@Component({
  selector: 'app-place-result-grid',
  templateUrl: './place-result-grid.component.html',
  styleUrls: ['./place-result-grid.component.less']
})
export class PlaceResultGridComponent implements OnInit, OnChanges {
  @Input() sortables: PlacesSortables[];
  @Input() placeResults: Place[];
  @Input() paging;
  @Output() placeSelect: EventEmitter<string> = new EventEmitter<string>();
  @Output() sortingChanges: EventEmitter<PlaceSortParams> = new EventEmitter<PlaceSortParams>();
  @Output() pagination: EventEmitter<any> = new EventEmitter();
  @Input() currentSort: PlaceSortParams;
  @Output() selectionChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() selectedStage;
  currentSortKey = '';
  currentPage = 0;
  public contentHeight: number;
  constructor() { }

  ngOnInit() {
    this.resizeContainerHeight();
    this.onToggle(true);
  }
  public setActivePlace(placeName: string) {
    this.placeSelect.emit(placeName);
  }
  onSortables(sortValue) {
    const sort = {sort_by: sortValue.value, order_by: 1};
    this.sortingChanges.emit(sort);
  }
  loadMore() {
    if (this.paging && this.paging['page'] < this.paging['total'] && this.currentPage === this.paging['page']) {
      this.currentPage = this.paging['page'] + 1;
      this.pagination.emit({page: this.currentPage});
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.placeResults && changes.placeResults.currentValue) {
      this.placeResults = changes.placeResults.currentValue;
      this.onToggle(true);
    }
    if (changes.currentSort && changes.currentSort.currentValue) {
      this.currentSort = changes.currentSort.currentValue;
      this.currentSortKey = this.currentSort['sort_by'];
    } else {
      this.currentSortKey = '';
    }
    if (changes.paging && changes.paging.currentValue) {
      this.paging = changes.paging.currentValue;
      this.currentPage = this.paging['page'];
    }
    if (this.placeResults.length <= 0) {
      this.resizeContainerHeight();
    }
  }
  resizeContainerHeight() {
    if (this.placeResults.length <= 0) {
      this.contentHeight = window.innerHeight - 380;
    } else {
      this.contentHeight = window.innerHeight - 405;
    }
  }
  public selectCheckboxToggle(place) {
    this.onToggle();
  }
  public onToggle(initCall = false) {
    const selected = this.placeResults.filter(p => p.selected);
    let placeNames = [];
    if (this.selectedStage === 'selected') {
      placeNames = this.placeResults.filter(placeObj => placeObj.selected).map(placeDetail => placeDetail.place_name);
    } else {
      placeNames = this.placeResults.filter(placeObj => !placeObj.selected).map(placeDetail => placeDetail.place_name);
    }
    this.selectionChange.emit({
      count: selected.length,
      placeNames: placeNames,
      selectedStage: this.selectedStage,
      resultType: 'grouped',
      initCall: initCall,
      removedPlaces: this.getSelectedPlaceNames()
    });
  }
  private getSelectedPlaceNames() {
    let places = [];
    if (this.placeResults) {
      places = this.placeResults.filter(placeObj => placeObj.selected).
        map(placeDetail => placeDetail['id']);
    }
    return places;
  }
}
