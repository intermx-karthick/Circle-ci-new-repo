import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { catchError, debounceTime, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

import { Helper } from '../../classes';
import { RecordService } from '../record.service';

@Component({
  template: ``
})
export class AbstractStateList implements OnDestroy {

  public statePagination: StateSearchPagination = {
    page: 1,
    perPage: 100 // Default perPage size
  };
  public isLoadingState = true;
  public states: any[] = [];
  public filteredStates: any[] = [];
  protected freeUp$ = new Subject();
  public searchText;

  constructor(public inventoryApi: RecordService, public cdRef: ChangeDetectorRef) {
  }


  public loadStates(searchText = {}) {
    this.isLoadingState = true;
    this.inventoryApi
      .getVendorsStateSearch(searchText, this.statePagination)
      .pipe(
        tap(() => (this.isLoadingState = false)),
        filter((res) => !!res.results)
      )
      .subscribe((res) => {
        this.states = res.results;
        this.filteredStates = Helper.deepClone(this.states);
        this.setStatePaginationFromRes(res);
        this.cdRef.markForCheck();
      });
  }

  public loadAllStates() {
  this.isLoadingState = true;
  this.inventoryApi
    .getCatchState()
    .pipe(
      tap(() => (this.isLoadingState = false)),
      filter((res) => !!res.results)
    )
    .subscribe((res) => {
      this.states = res.results;
      this.filteredStates = Helper.deepClone(this.states);
      this.cdRef.markForCheck();
    });
  }



  public loadMoreWithStateSearch() {
    let search = {};
    const searchtxt = this.searchText ?? null;
    if (searchtxt) {
      search['search'] = searchtxt;
    }
    this.loadMoreStates(search);
  }

  public loadMoreStates(searchText = {}) {
    // Checking total page
    if (
      this.statePagination.page * this.statePagination.perPage >
      this.statePagination.total
    ) {
      this.isLoadingState = false;
      this.cdRef.markForCheck();
      return;
    }
    this.statePagination.page += 1;
    this.isLoadingState = true;
    this.cdRef.markForCheck();
    this.inventoryApi
      .getVendorsStateSearch(searchText, this.statePagination)
      .pipe(
        takeUntil(this.freeUp$),
        filter(res => !!res.results),
        catchError((error) => {
          this.statePagination.page -= 1;
          this.isLoadingState = false;
          return of({ results: [] });
        })
      )
      .subscribe((res) => {
        this.isLoadingState = false;
        this.states = this.states.concat(res['results']);
        this.filteredStates = Helper.deepClone(this.states);
        this.setStatePaginationFromRes(res);
        this.cdRef.markForCheck();
      });
  }

  public setFilterStateSubscribtion(form, field) {
    form.get(field).valueChanges
      .pipe(
        debounceTime(500),
        filter(value => typeof value === 'string'),
        switchMap((searchStr) => {
          this.resetPagination();
          const search = {
            search: searchStr
          };
          this.searchText = searchStr;
          return this.inventoryApi.getVendorsStateSearch(search, this.statePagination)
            .pipe(
              filter(res => !!res.results),
              catchError(error => {
                this.isLoadingState = false;
                this.cdRef.markForCheck();
                return of({ result: [] });
              }));
        }),
        tap(() => this.isLoadingState = false)).subscribe(res => {
      this.states = res['results'];
      this.filteredStates = Helper.deepClone(this.states);
      this.cdRef.markForCheck();
      this.setStatePaginationFromRes(res);
    });
  }

  resetPagination() {
    this.statePagination = { page: 1, perPage: 100 };
  }

  setStatePaginationFromRes(result) {
    if (result?.pagination?.total) {
      this.statePagination.total = result['pagination']['total'];
    }
  }

  ngOnDestroy(): void {
    this.freeUp$.next();
    this.freeUp$.complete();
  }

}

export interface State {
  _id: string;
  deletedAt?: any;
  name: string;
  short_name?: string;
  geo_type?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StateSearchResponse {
  pagination?: StateSearchPagination;
  results?: State[];
}

export interface StateSearchPagination {
  total?: number;
  page?: number;
  perPage?: number;
}
