import { FormControl, FormGroup } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import {ChangeDetectorRef, Component} from '@angular/core';
import {
  catchError,
  debounceTime,
  filter,
  switchMap,
  takeUntil,
  tap,
  map
} from 'rxjs/operators';

import { UseRecordPagination } from '../records-management-v2/useRecordPagination';
import { Helper } from './helper';
import { Vendor } from '@interTypes/inventory-management';

/**
 * @description
 *  This is the reusable auto complete infinite scroll
 *  implementation.
 *
 *  Pls refer the code before going to use.
 *
 *  the data update may vary for diff response but however you can
 *  handle by successcallback
 *  @example
 *  You can find the implemented code in ClientsComponent for managedBy and client of agency
 */
@Component({
  selector: 'base-auto-complete',
  template: ''
})
export class UseAutoCompleteInfiniteScroll<T> {
  public searchFromCtl = new Observable();
  public data = [];
  public pagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    // To avoid autocomplete infinite scroll container issue, we need to set perPage as 25
    perPage: 25
  });
  public isSearching = false;
  public isLoading = false;
  public apiEndpointMethod: () => Observable<any>;
  public cdRef: ChangeDetectorRef;
  public freeUp$: Subject<void>;
  public searchStr = '';
  public excludingIDs = [];
  // only for multiple options
  public selectedData = [];

  /**
   * @description
   *   Loading dependency manually its only for using via service
   * @param cdRef
   * @param freeUp$
   * @param formControl
   */
  loadDependency(
    cdRef: ChangeDetectorRef,
    freeUp$: Subject<void>,
    formControl: Observable<any>
  ) {
    this.cdRef = cdRef;
    this.freeUp$ = freeUp$;
    this.searchFromCtl = formControl;
  }

  /**
   * @param errorCallback
   * @param successCallback
   */
  loadData(errorCallback: Function, successCallback: Function) {
    this.isLoading = true;
    this.cdRef?.markForCheck();

    this.apiEndpointMethod()
      .pipe(takeUntil(this.freeUp$))
      .pipe(
        catchError((errorRes) => {
          this.isLoading = false;
          if (errorCallback && typeof errorCallback === 'function') {
            errorCallback(errorRes);
          }

          return of(errorRes);
        })
      )
      .subscribe((res: any) => {
        this.resetPagination();

        this.isSearching = false;
        this.isLoading = false;

        this.pagination.updateTotal(res?.pagination?.total ?? 10);
        this.pagination.updateFound(res?.pagination?.found ?? 10);
        this.cdRef.markForCheck();
        let results = Helper.deepClone(res?.results ?? []);
        if(res?.['projects']){ // This condition when response have projects
          results = Helper.deepClone(res?.projects);
        }
        if(res?.['result']){ // This condition when response have result
          results = Helper.deepClone(res?.result);
        }

        if (this.excludingIDs.length > 0) {
          results = results.filter((data) => this.excludingIDs.indexOf(data['_id']) === -1);
        }
        this.data = results;
        this.updateSelectedDataOnReloading();
        if (successCallback && typeof successCallback === 'function') {
          successCallback(res);
        }
      });
  }

  /**
   * @description
   *
   *  This is used to infinite scroll  load more handler
   *
   * @param errorCallback
   * @param successCallback
   * @param apiEndpointMethod
   */
  loadMoreData(
    errorCallback: Function,
    successCallback: Function,
    apiEndpointMethod = null
  ) {
    if (!this.isLoading) {
      if (this.pagination.isPageSizeReachedTotal()) {
        this.isLoading = false;
        this.isSearching = false;
        this.cdRef.markForCheck();
        return;
      }

      this.pagination.moveNextPage();
      this.isLoading = true;
      this.cdRef.markForCheck();

      this.apiEndpointMethod()
        .pipe(
          takeUntil(this.freeUp$),
          catchError((errorRes) => {
            this.isLoading = false;
            this.cdRef.markForCheck();
            this.isLoading = false;

            if (errorCallback && typeof errorCallback === 'function') {
              errorCallback(errorRes);
            }

            return of({ results: [] });
          })
        )
        .subscribe((res: any) => {
          this.isLoading = false;
          this.cdRef.markForCheck();
          if (res && res['results']) {
            let results = Helper.deepClone(res?.results);
            if (this.excludingIDs.length > 0) {
              results = results.filter((data) => this.excludingIDs.indexOf(data['_id']) === -1);
            }
            this.data = this.data.concat(results);
            res['results'] = this.data;
            this.pagination.updateTotal(res?.pagination?.total ?? 10);
            this.updateSelectedDataOnReloading();
            if (successCallback && typeof successCallback === 'function') {
              successCallback(res);
            }
            this.cdRef.markForCheck();
          }
        });
    }
  }

  /**
   * @description
   *
   *  To get the data data for while searching.
   * @param form
   * @param field
   * @param form
   * @param field
   * @param errorCallback
   * @param successCallback
   * @param apiEndpointMethod
   */
  listenForAutoCompleteSearch(
    form: FormGroup,
    field: string,
    errorCallback: Function,
    successCallback: Function,
    apiEndpointMethod = null
  ) {
    form
      .get(field)
      .valueChanges.pipe(
        takeUntil(this.freeUp$),
        debounceTime(400),
        filter((value) => typeof value === 'string'), // guard
        tap(() => (this.isSearching = true)),
        switchMap((searchStr) => {
          this.searchStr = searchStr;
          this.resetPagination();
          this.data = [];
          this.isLoading = true;
          this.cdRef.markForCheck();

          return this.apiEndpointMethod().pipe(
            catchError((errorRes) => {
              console.log(errorRes);
              this.isSearching = false;
              this.isLoading = false;
              this.cdRef.markForCheck();

              if (errorCallback && typeof errorCallback === 'function') {
                errorCallback(errorRes);
              }

              return of({ results: [] });
            })
          );
        }),
        tap(() => {
          this.isSearching = false;
          this.isLoading = false;
        })
      )
      .subscribe((res: any) => {
        this.isSearching = false;
        this.cdRef.markForCheck();
        if ((res && res['results']) || (res && res?.['projects']) || (res && res?.['result'])) {
          this.pagination.page = 1;
          let results = Helper.deepClone(res?.results);
          if(res?.['projects']){ // This condition when response have projects
            results = Helper.deepClone(res?.projects);
          }
          if(res?.['result']){ // This condition when response have result
            results = Helper.deepClone(res?.result);
          }
          if (this.excludingIDs.length > 0) {
            results = results.filter((data) => this.excludingIDs.indexOf(data['_id']) === -1);
          }
          this.data = results;
          this.updateSelectedDataOnReloading();
          this.pagination.updateTotal(res?.pagination?.total ?? 10);
          this.pagination.updateFound(res?.pagination?.found ?? 10);
          this.cdRef.markForCheck();
          if (successCallback && typeof successCallback === 'function') {
            successCallback(res);
          }
        }
      });
  }


  /**
   * @description
   *
   *  To get the data data for while searching.
   * @param formControl
   * @param form
   * @param field
   * @param errorCallback
   * @param successCallback
   * @param apiEndpointMethod
   */
  listenForAutoCompleteSearchFormControl(
    formControl: FormControl,
    errorCallback: Function,
    successCallback: Function,
    apiEndpointMethod = null
  ) {
    formControl.valueChanges.pipe(
        takeUntil(this.freeUp$),
        debounceTime(400),
        filter((value) => typeof value === 'string'), // guard
        tap(() => (this.isSearching = true)),
        switchMap((searchStr) => {
          this.searchStr = searchStr;
          this.resetPagination();
          this.data = [];
          this.isLoading = true;
          this.cdRef.markForCheck();

          return this.apiEndpointMethod().pipe(
            catchError((errorRes) => {
              console.log(errorRes);
              this.isSearching = false;
              this.isLoading = false;
              this.cdRef.markForCheck();

              if (errorCallback && typeof errorCallback === 'function') {
                errorCallback(errorRes);
              }

              return of({ results: [] });
            })
          );
        }),
        tap(() => {
          this.isSearching = false;
          this.isLoading = false;
        })
      )
      .subscribe((res: any) => {
        this.isSearching = false;
        this.cdRef.markForCheck();

        if (res && res['results']) {
          this.pagination.page = 1;
          let results = Helper.deepClone(res?.results);
          if (this.excludingIDs.length > 0) {
            results = results.filter((data) => this.excludingIDs.indexOf(data['_id']) === -1);
          }
          this.data = results;
          this.cdRef.markForCheck();

          this.pagination.updateTotal(res?.pagination?.total ?? 10);
          this.updateSelectedDataOnReloading();
          if (successCallback && typeof successCallback === 'function') {
            successCallback(res);
          }
        }
      });
  }

  public clickOption(event, item) {
    const index = this.selectedData.findIndex(
      (client) => client._id === item._id
    );
    // Select the item
    if (event.checked && index < 0) {
      this.updateSelectedData(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.updateSelectedData(item, false);
    }
  }

  public updateSelectedData<T extends any>(item: T, checkedItem = false) {
    const index = this.selectedData.findIndex(
      (_contract) => _contract._id === item['_id']
    );
    const selecteDataIdx = this.selectedData.findIndex(
      (_contract) => _contract._id === item['_id']
    );

    if (checkedItem) {
      this.selectedData.push(item);
      if (selecteDataIdx > -1) {
        this.data[selecteDataIdx].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedData.splice(index, 1);
      }
      if (selecteDataIdx > -1) {
        this.data[selecteDataIdx].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  updateSelectedDataOnReloading(): void{
    if (Array.isArray(this.selectedData) && this.selectedData.length > 0) {
      this.data.map((element) => {
        const index = this.selectedData.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
    }
  }

  canShowDataNotFound() {
    return !this.isSearching && !this.isLoading && this.data.length <= 0;
  }

  resetPagination() {
    this.pagination.resetPagination();
  }

  resetAll(): void {
    this.searchStr = '';
    this.selectedData = [];
    this.data.forEach(
      (v) => (v.selected = false)
    );
    this.resetPagination();
  }

  get selectedIds() {
    return this.selectedData.map((data) => data?._id);
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
