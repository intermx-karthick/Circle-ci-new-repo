import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Place, PlacesSortables, PlaceSortParams, PlaceProperties } from '@interTypes/placeFilters';
import { CustomizeColumnComponent } from '@shared/components/customize-column/customize-column.component';
import { SelectionModel } from '@angular/cdk/collections';
import { LoaderService } from '@shared/services/loader.service';
import { PlacesFiltersService } from '../places-filters.service';
import {Helper} from '../../../classes';

@Component({
  selector: 'app-places-tabular-view',
  templateUrl: './places-tabular-view.component.html',
  styleUrls: ['./places-tabular-view.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PlacesTabularViewComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  placesDataSource = new MatTableDataSource([]);
  @ViewChild(MatSort) placeSort: MatSort;
  @Input() public sortables: PlacesSortables[];
  @Input() public places;
  @Input() currentSort: PlaceSortParams;
  @Output() sortingChanges: EventEmitter<PlaceSortParams> = new EventEmitter();
  @Input() page: number;
  @Input() totalCount: number;
  @Input() enableHover: string;
  @Input() sfids;
  @Input() selectedTab;
  @Output() pagination: EventEmitter<any> = new EventEmitter();
  @Output() placeSelect: EventEmitter<string> = new EventEmitter<string>();
  @Output() selectionChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onHoverOnCard: EventEmitter<string> = new EventEmitter<string>();
  @Output() onLeaveOnCard: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onClickOnCard: EventEmitter<any> = new EventEmitter<any>();
  currentSortables = [];
  displaySortables = [];
  tableWidth = 700;
  selectAllCheckbox = true;
  currentSortKey = '';
  currentSortDir = 'asc';
  selection = new SelectionModel(true, []);
  defaultColumns = [];
  public contentHeight: number;
  public placesTabulaHeight: number;
  clickedRowIndex: any;
  public selectedCount = 0;
  public sortingElement = '';
  public isSameColumnSort = 0;
  public selectedPlacesCount = 0;
  constructor(
    private cdr: ChangeDetectorRef,
    public loaderService: LoaderService,
    public dialog: MatDialog,
    public placesFiltersService: PlacesFiltersService
  ) { }

  ngOnInit() {
    const save = this.placesFiltersService.getPlacesSession();
    this.contentHeight = window.innerHeight - 380;
    this.placesTabulaHeight = window.innerHeight - 330;
    this.currentSortables = Helper.deepClone(this.sortables);
    const obj = {
      'field_name': '',
      'key': 'checked'
    };
    this.currentSortables.splice(0, 0, obj);
    this.currentSortables.map(sort => {
      sort.displayname = sort.field_name;
    });
    this.defaultColumns = this.currentSortables.map(x => Object.assign({}, x));
    this.placesDataSource.data = this.places;
    this.displaySortables = this.currentSortables.map(c => c['key']);
    this.tableWidth = (this.displaySortables.length - 1) * 150 + 50;
    this.selectAllCheckbox = true;
    this.placesDataSource.data.filter((data) => {
      if (!data.selected) {
        if (data.count) {
          this.selectedCount -= data.count;
        } else {
          this.selectedCount--;
        }
      }
    });
    if (this.selectedCount < this.totalCount) {
      this.selectAllCheckbox = false;
      let selectedStage = 'unselected';
      let resultType = 'grouped';
      if (this.selectAllCheckbox) {
        selectedStage = 'unselected';
      } else {
        selectedStage = 'selected';
      }
      if (this.sfids) {
        resultType = 'single';
        selectedStage = 'selected';
      }
      this.selectionChange.emit({
        count: this.selectedCount,
        placeNames: [],
        selectedStage: selectedStage,
        resultType: resultType,
        initCall: true
      });
    }
  }

  ngOnDestroy() {
    this.currentSortables = [];
    this.displaySortables = [];
    this.tableWidth = 700;
    this.selectAllCheckbox = true;
    this.placesDataSource.data = [];
  }
  ngAfterViewInit() {
    this.placeSort.sortChange.subscribe(response => {
      const sort = {
        sort_by: response.active,
        order_by: (response.direction === 'asc' ? 1 : -1),
        sfids: this.getAllPlaceIds()
      };
      this.sortingChanges.emit(sort);
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.places && changes.places.currentValue) {
      this.places = changes.places.currentValue;
      this.placesDataSource.data = this.places;
    }
    if (changes.currentSort && changes.currentSort.currentValue) {
      this.currentSort = changes.currentSort.currentValue;
      this.currentSortKey = this.currentSort['sort_by'];
      this.currentSortDir = (this.currentSort['order_by'] === -1 ? 'desc' : 'asc');
    }
    if (changes.totalCount && changes.totalCount.currentValue) {
      this.selectedCount = changes.totalCount.currentValue;
      this.totalCountUpdate(true, [], true);
    }
    if (changes.sfids && changes.sfids.currentValue) {
      this.sfids = changes.sfids.currentValue;
    }
    if (this.selectedCount === this.totalCount) {
      this.selectAllCheckbox = true;
    }
    /* if (!this.selectAllCheckbox) {
      this.selectAllCheckbox = true;
    } */
  }
  loadMore() {
    if (this.places.length !== this.totalCount) {
      this.page += 1;
      this.pagination.emit({
        page: this.page,
        selectAll: this.selectAllCheckbox,
        selectedCount: this.selectedCount,
        sfids: this.getAllPlaceIds()
      });
    }
  }
  public setActivePlace(placeName: string) {
    this.placesFiltersService.setFilterLevel({ 'placeResultExpand': false });
    this.placeSelect.emit(placeName);
  }
  public selectionCountUpdate(checkValue, place) {
    let resultType = 'grouped';
    let placeNames = [];
    let selectedStage = 'selected';
    this.selectedPlacesCount = (checkValue) ? this.selectedPlacesCount + place.count : this.selectedPlacesCount - place.count;
    if (this.sfids) {
      resultType = 'single';
      // this.selectedCount = this.sfids.filter(sf => sf.selected).length;
      if (checkValue) {
        this.selectedCount += 1;
      } else {
        if (this.selectedCount) {
          this.selectedCount -= 1;
        }
      }
    } else {
      resultType = 'grouped';
      if (checkValue) {
        this.selectedCount += place.count;
      } else {
        if (this.selectedCount) {
          this.selectedCount -= place.count;
        }
      }
    }
    if (this.selectAllCheckbox) {
      placeNames = this.getUnSelectedPlaceNames();
      selectedStage = 'unselected';
    } else {
      if (this.selectedCount !== this.selectedPlacesCount) {
        placeNames = this.getUnSelectedPlaceNames();
        selectedStage = 'unselected';
      } else {
        placeNames = this.getSelectedPlaceNames();
        selectedStage = 'selected';
      }
    }
    if (this.sfids) {
      placeNames = this.getSelectedPlaceNames();
      resultType = 'single';
      selectedStage = 'selected';
    }
    this.selectionChange.emit({
      count: this.selectedCount,
      placeNames: placeNames,
      selectedStage: selectedStage,
      resultType: resultType,
      removedPlaces : this.getSelectedPlaceNames()
    });
  }

  selectAll() {
    this.selectAllCheckbox = !this.selectAllCheckbox;
    if (this.selectAllCheckbox) {
      this.selectList('All');
    } else {
      this.selectList('None');
    }
  }
  private getUnSelectedPlaceNames() {
    let places = [];
    if (this.sfids) {
      places = this.sfids.filter(placeObj => !placeObj.selected).
        map(placeDetail => placeDetail.id);
    } else {
      places = this.placesDataSource.data.filter(placeObj => !placeObj.selected).
        map(placeDetail => placeDetail['place_name'] || placeDetail['location_name']);
    }
    return places;
  }
  private getSelectedPlaceNames() {
    let places = [];
    if (this.sfids) {
      places = this.sfids.filter(placeObj => placeObj.selected).
        map(placeDetail => placeDetail.id);
    } else {
      places = this.placesDataSource.data.filter(placeObj => placeObj.selected).
        map(placeDetail => placeDetail['place_name'] || placeDetail['location_name']);
    }
    return places;
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
  private selectList(type) {
    switch (type) {
      case 'All':
        this.setPlaces(true);
        break;
      case 'None':
        this.setPlaces(false);
        break;
      default:
        this.setPlaces(false);
        break;
    }
  }

  private setPlaces(value) {
    this.placesDataSource.data.map((place) => {
      place.selected = value;
    });
    if (this.sfids) {
      this.sfids.map(sf => {
        sf.selected = value;
      });
    }
    this.selectAllCheckbox = value;

    this.totalCountUpdate(value, this.getUnSelectedPlaceNames());
  }
  private totalCountUpdate(value, unSelectedPlaceNames = [], initCall = false) {
    let placeNames = [];
    let selectedStage = 'unselected';
    let resultType = 'grouped';
    if (value) {
      this.selectedCount = this.totalCount;
    } else {
      this.selectedCount = 0;
    }
    if (this.selectAllCheckbox) {
      placeNames = this.getUnSelectedPlaceNames();
      selectedStage = 'unselected';
    } else {
      placeNames = this.getSelectedPlaceNames();
      selectedStage = 'selected';
      this.selectedPlacesCount = 0;
    }
    if (this.sfids) {
      placeNames = this.getSelectedPlaceNames();
      resultType = 'single';
      selectedStage = 'selected';
    }
    this.selectionChange.emit({
      count: this.selectedCount,
      placeNames: placeNames,
      selectedStage: selectedStage,
      resultType: resultType,
      initCall: initCall,
      removedPlaces : this.getSelectedPlaceNames()
    });
  }
  public selectCheckboxToggle(place, checkValue) {
    const index = this.placesDataSource.data.indexOf(place);
    if (this.sfids) {
      this.sfids.map(sf => {
        if (sf.id === place['ids']['safegraph_place_id']) {
          sf.selected = checkValue;
        }
      });
    }
    if (index > -1) {
      this.placesDataSource.data[index].selected = checkValue;
      this.selectionCountUpdate(checkValue, place);
    }
    this.checkAllSelected();
  }

  private checkAllSelected() {
    const selected = this.placesDataSource.data.filter(item => item.selected);
    if (selected.length < this.placesDataSource.data.length) {
      this.selectAllCheckbox = false;
    } else {
      this.selectAllCheckbox = true;
    }
  }

  public customizeColumn() {
    let currentSortables = Helper.deepClone(this.currentSortables);
    const sortables = Helper.deepClone(this.sortables);
    sortables.map(sort => {
      sort.displayname = sort.field_name;
    });
    if (currentSortables && this.currentSortables.length > 0) {
      currentSortables = currentSortables.map(x => Object.assign({}, x));
      this.removeDuplicates(currentSortables, sortables);
    } else {
      currentSortables = this.defaultColumns.map(x => Object.assign({}, x));
    }

    currentSortables = currentSortables.filter(column => column['key'] !== 'checked');
    const ref = this.dialog.open(CustomizeColumnComponent, {
      data: { 'sortables': sortables, 'currentSortables': currentSortables, 'origin': 'places' },
      width: '700px',
      closeOnNavigation: true,
      panelClass: 'audience-browser-container',
    });
    ref.afterClosed().subscribe(res => {
      if (res && res['action'] === 'saved') {
        this.loaderService.display(true);
        this.currentSortables = res.currentSortables;
        if (this.currentSortables.length === 0) {
          this.currentSortables = this.defaultColumns;
        } else {
          const obj = {
            'field_name': '',
            'displayname': '',
            'key': 'checked'
          };
          this.currentSortables.splice(0, 0, obj);
        }
        this.displaySortables = this.currentSortables.map(c => c['key']);
      }
      setTimeout(() => {
        this.cdr.detectChanges();
        this.loaderService.display(false);
      }, 1000);
    });
  }

  removeDuplicates(a, b) {
    for (let i = 0, len = a.length; i < len; i++) {
      for (let j = 0, len2 = b.length; j < len2; j++) {
        if (a[i].key === b[j].key) {
          b.splice(j, 1);
          len2 = b.length;
        }
      }
    }
  }
  onResize() {
    this.contentHeight = window.innerHeight - 380;
    this.placesTabulaHeight = window.innerHeight - 330;
  }

  /**
   *
   * @param sortValue table sorting option
   */
  public onSortting(sortValue) {
    if (this.sortingElement === '' || this.sortingElement !== sortValue) {
      this.isSameColumnSort = 1;
    } else if (this.sortingElement === sortValue) {
      ++this.isSameColumnSort;
    }
    if (this.isSameColumnSort < 3) {
      this.sortingElement = sortValue;
    } else {
      this.sortingElement = '';
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
}
