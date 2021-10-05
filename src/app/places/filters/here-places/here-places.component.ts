import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { PlacesElasticsearchService } from '../places-elasticsearch.service';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from './../../../Interfaces/workspaceV2';
import { ElasticSearchType } from '@interTypes/Place-audit-types';
import { PlacesFiltersService } from '../places-filters.service';
@Component({
  selector: 'app-here-places',
  templateUrl: './here-places.component.html',
  styleUrls: ['./here-places.component.less']
})
export class HerePlacesComponent implements OnInit, OnChanges {
  public contentHeight: number;
  @Input() searchParams;
  @Output() selectedPlaces = new EventEmitter();
  @Output() closePlaseList = new EventEmitter();
  public searchedPlaces = [];
  public isLoadingPlaceData = false;
  public selectedPlace;
  isCollapseHerePlace: boolean;
  constructor(
    private elasticsearch: PlacesElasticsearchService,
    public dialog: MatDialog,
    private placeFiltersService: PlacesFiltersService
  ) { }

  ngOnInit() {
    this.onResize();
    setTimeout(() => {
      this.placeFiltersService.setNewColumnOpened(true);
    }, 500);
  }
  onResize() {
    this.contentHeight = window.innerHeight - 183;
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.searchParams && changes.searchParams['currentValue']) {
      this.searchPlaces(changes.searchParams['currentValue'].type, changes.searchParams['currentValue'].searchText);
    }
  }

  /**
   * This function to list the places based on search text
   * @param type  safegraphId | hereID | placeName
   * @param searchValue  search value
   * @param noLoader if true not showing common loader
   */
  private searchPlaces(type: ElasticSearchType, searchText) {
    this.searchedPlaces = [];
    this.isLoadingPlaceData = true;
    this.elasticsearch.filterPlaces(type, searchText, true).subscribe(places => {
      this.isLoadingPlaceData = false;
      if (places['hits'] && places['hits']['hits']) {
        const formatePlaces = this.elasticsearch.formatPlacesData(places['hits']['hits']);
        this.searchedPlaces = [...formatePlaces];
      }
    });
  }

/**
 * 
 * @param place selected place object values
 */
  public onSelectPlace(selectedPlace) {
      this.selectedPlace = selectedPlace;
      this.selectedPlaces.emit(selectedPlace);
  }
  public closePlases(){
    const data: ConfirmationDialog = {
      // confirmTitle: 'Places List',
      notifyMessage: false,
      confirmDesc: '<h4 class="confirm-text-icon">Are you sure you want to close the Places List?</h4>',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      headerCloseIcon: false
    };
    this.dialog.open(ConfirmationDialogComponent, {
      data: data,
      width: '586px'
    }).afterClosed().subscribe(result => {
      if (result && result.action) {
        this.closePlaseList.emit({'close': true});
      }
    });
  }
  collapseHerePlace() {
    this.isCollapseHerePlace = !this.isCollapseHerePlace;
  }
}
