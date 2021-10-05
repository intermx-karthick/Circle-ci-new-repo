import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import swal from 'sweetalert2';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { PlacesFiltersService } from '../places-filters.service';
import { Pagination } from '@interTypes/pagination';
import { FormControl } from '@angular/forms';

import { BasePlaceSets } from 'app/classes';

@Component({
  selector: 'app-places-set',
  templateUrl: './places-set.component.html',
  styleUrls: ['./places-set.component.less']
})
export class PlacesSetComponent extends BasePlaceSets implements OnInit, OnChanges, OnDestroy {

  public placeSetHeight = 250;
  public placeSets: any = [];
  public selectedOptionId = '';
  public searchFromCtl = new FormControl('');
  public pageInation: Pagination = { page: 1, size: 10, total: 10 };
  public isSearching: boolean = false;
  private unSubscribe = new Subject();
  @Input() selectedPlaceSetId = '';
  @Input() poiData: any;
  @Input() hideClearButton = false;
  @Output() filterByPlaceSet: EventEmitter<any> = new EventEmitter();

  constructor(
    public placefilterService: PlacesFiltersService,
    public cdRef: ChangeDetectorRef,
  ) {
    super(placefilterService, cdRef);
   }

  ngOnInit() {
    this.culaculateHeight();

      // for initial loading the placesets
    this.isSearching = true;
    this.init(() => { this.isSearching = false; });

    // Place set search 
    this.listenForPlacesetsSearch();

    this.placefilterService.getClearPlaseSetFilter().pipe(takeUntil(this.unSubscribe)).subscribe(data => {
      if (data && data.clear && this.selectedPlaceSetId) {
        this.clearPlaceSet();
      }
    });
    this.placefilterService.getPlaceSetListNotification().pipe(takeUntil(this.unSubscribe)).subscribe(() => {
      this.setPlaceSets();
    });
    this.placefilterService.onReset()
    .pipe(takeUntil(this.unSubscribe))
    .subscribe(type => {
        if (type === 'All') {
            this.clearPlaceSet();
        }
    });
  }

  onSelectPlaceSets(place) {
    this.filterByPlaceSet.emit(place);
  }
  culaculateHeight() {
    this.placeSetHeight = window.innerHeight - 570;
  }
  public compare(c1, c2) {
    return c1 && c2 && c1['_id'] === c2['_id'];
  }

  public onDeletePlaceSet(place) {
    swal({
      title: 'Are you sure you want to delete "' + place['name'] + '" Place Set?',
      text: '',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'YES, DELETE',
      confirmButtonClass: 'waves-effect waves-light',
      cancelButtonClass: 'waves-effect waves-light'
    }).then((x) => {
      if (typeof x.value !== 'undefined' && x.value) {
        this.placefilterService.deletePlaceSet(place._id).pipe(takeUntil(this.freeUp$)).subscribe(response => {
          if (this.selectedOptionId && this.selectedOptionId === place._id) {
            this.filterByPlaceSet.emit('');
            this.selectedOptionId = '';
          }
          swal('Success', response['message'], 'success');
          this.setPlaceSets();
        },
        e => {
          let message = '';
          if (typeof e.error !== 'undefined' && typeof e.error.message !== 'undefined') {
            message = 'An error has occurred. Please try again later.';
          }
          swal('Error', message, 'error');
        });
      }
    }).catch(swal.noop);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      if (changes.poiData && changes.poiData.currentValue) {
        this.poiData = changes.poiData.currentValue;
      }
      this.selectedOptionId = this.selectedPlaceSetId;
    }
  }
  public clearPlaceSet() {
    this.filterByPlaceSet.emit('');
    this.selectedOptionId = '';
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

}
