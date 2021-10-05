import {ChangeDetectorRef, Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {of, Subject} from 'rxjs';
import {
  catchError,
  debounceTime,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {PlacesFiltersService} from '../places/filters/places-filters.service';
import {Pagination} from '@interTypes/pagination';
/**
 * @description
 *  This is base classes for Place sets searching and
 * loadmore function for  infinite scroll
 *
 */
@Component({
  selector: 'base-place-set',
  template: ''
})
export class BasePlaceSets {
  public searchFromCtl = new FormControl();
  public placeSets = [];
  public pageInation: Pagination = {page: 1, size: 10, total: 10};
  public isSearching = false;
  public isLoading = false;
  protected freeUp$ = new Subject();

  constructor(
    public placefilterService: PlacesFiltersService,
    public cdRef: ChangeDetectorRef
  ) {
  }

  /**
   * @description
   *   Loading dependency manually its only for using via service
   * @param cdRef
   */
  loadDependency(cdRef: ChangeDetectorRef){
     this.cdRef = cdRef;
  }

  /**
   * @description
   *   call this is ngOnInit to initial setup
   *
   * @param callback
   */
  init(callback = () => {
  }) {
    this.setPlaceSets(callback);
    this.cdRef.markForCheck();
  }
  /**
   * @param callback - to handle anything after  success response
   */
  setPlaceSets(callback = () => {
  }) {
    this.placefilterService.getPlacesSet(null, true).pipe(takeUntil(this.freeUp$))
      .subscribe(res => {
        this.resetPagination();
        // gaurd for loaders
        this.isSearching = false;
        this.isLoading = false;
        this.cdRef.markForCheck();
        if (res && res['data']) {
          this.placeSets = res['data'];
          this.setPaginationFromRes(res);
          if (callback) {
            callback();
          }
        }
      });
  }


  /**
   * @description
   *
   *  This is used to infinite scroll  load more handler
   *
   * @param callback - to handle after any success response
   */
  loadMorePlaceSets(callback = () => {
  }) {
    // if req size is larger than total size stop here
    if (this.pageInation.page * this.pageInation.size > this.pageInation.total) {
      this.isLoading = false;
      this.isSearching = false;
      this.cdRef.markForCheck();
      return;
    }
    this.pageInation.page += 1;
    this.isLoading = true;
    this.cdRef.markForCheck();

    this.placefilterService.getPlacesSet(null, true, this.pageInation, this.searchFromCtl.value)
      .pipe(
        takeUntil(this.freeUp$),
        catchError(error => {
          this.isLoading = false;
          this.cdRef.markForCheck();
          console.log(error);
          return of({data: []});
        })
      )
      .subscribe(res => {
        this.isLoading = false;
        this.cdRef.markForCheck();
        if (res && res['data']) {
          this.placeSets = this.placeSets.concat(res['data']);
           this.setPaginationFromRes(res);
          if (callback) {
            callback();
          }
        }
      });
  }
  /**
   * @description
   *
   *  To get the placesets data for while searching.
   * @param callback - to handle after any success response
   */
  listenForPlacesetsSearch(callback = () => {
  }) {
    this.searchFromCtl.valueChanges.pipe(
      takeUntil(this.freeUp$),
      debounceTime(500),
      tap(() => this.isSearching = true),
      switchMap((searchStr) => {
        this.resetPagination();
        return this.placefilterService.getPlacesSet(null, true, this.pageInation, searchStr)
          .pipe(catchError(error => {
            console.log(error);
            this.isSearching = false;
            this.cdRef.markForCheck();
            return of({data: []});
          }));
      }),
      tap(() => this.isSearching = false)
    ).subscribe(result => {
      this.isSearching = false;
      this.cdRef.markForCheck();
      if (result && result['data']) {
        this.pageInation.page = 1;
        this.setPaginationFromRes(result);
        this.placeSets = result['data'];
        this.cdRef.markForCheck();
        if (callback) {
          this.isLoading = false;
          callback();
        }
      }
    });
  }

  canShowPlaceSetsNotFound() {
    return !this.isSearching && !this.isLoading && this.placeSets.length <= 0;
  }
  setPaginationFromRes(result) {
    this.isLoading = false;
    if (result['pagination'] && result['pagination']['total']) {
      this.pageInation.total =  result['pagination']['total'];
    }
  }
  resetPagination() {
    this.pageInation = {page: 1, size: 10, total: 10};
  }

  /**
   * @description
   *  Call this on  ngOnDestroy of sub class (component).
   */
  ngOnDestroy(): void {
    this.freeUp$.next();
    this.freeUp$.complete();
  }
}
