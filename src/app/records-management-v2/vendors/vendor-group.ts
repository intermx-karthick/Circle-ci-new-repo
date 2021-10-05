import {ChangeDetectorRef, Component, OnDestroy, ViewChild} from '@angular/core';
import { VendorsGroupPagination, VendorGroup } from '@interTypes/vendor/vendor-group-search';
import { Subject, of } from 'rxjs';
import { debounceTime, map, tap, filter, takeUntil, catchError, switchMap } from 'rxjs/operators';
import { Helper } from 'app/classes/helper';
import { RecordService } from '../record.service';
import { StateAbstract } from './state-autocomplete';
import { VendorService } from './vendor.service';

@Component({
  selector: 'base-vendor-group',
  template: '',
})
export class VendorGroupAbstract  extends StateAbstract implements OnDestroy {

  public pagination: VendorsGroupPagination = {
    page: 1,
    perPage: 25 // Default perPage size
  };
  public isLoadingVendorsGroup = true;
  public parentVendors: VendorGroup[] = [];
  public filteredParentVendors: VendorGroup[] = [];
  protected freeUp$ = new Subject();
  public searchText;

  constructor(public inventoryApi: RecordService, public cdRef: ChangeDetectorRef) {
    super(inventoryApi, cdRef);
  }

  public loadVendorsGroups(searchText = {}) {
    this.isLoadingVendorsGroup = true;
    this.inventoryApi
      .getVendorsGroupSearch(searchText, this.pagination)
      .pipe(
        tap(() => (this.isLoadingVendorsGroup = false)),
        filter((res) => !!res.results)
      )
      .subscribe((res) => {
        this.parentVendors = res.results;
        this.filteredParentVendors =  Helper.deepClone(this.parentVendors);
        this.setPaginationFromRes(res);
        this.cdRef.markForCheck();
      });
  }


  public loadMoreWithSearch(){
    let search = {}
    const searchtxt = this.searchText ?? null;
    if(searchtxt){
      search['filters'] = {
        "name" : searchtxt
      };
    }

    this.loadMoreVendorsGroup(search);
  }

  public loadMoreVendorsGroup(searchText= {}) {
    // Checking total page
    if (
      this.pagination.page * this.pagination.perPage >
      this.pagination.total
    ) {
      this.isLoadingVendorsGroup = false;
      this.cdRef.markForCheck();
      return;
    }
    this.pagination.page += 1;
    this.isLoadingVendorsGroup = true;
    this.cdRef.markForCheck();
    this.inventoryApi
      .getVendorsGroupSearch(searchText, this.pagination)
      .pipe(
        takeUntil(this.freeUp$),
        filter( res => !!res.results),
        catchError((error) => {
          this.pagination.page -= 1;
          this.isLoadingVendorsGroup = false;
          return of({ results: [] });
        })
      )
      .subscribe((res) => {
        this.isLoadingVendorsGroup = false;
        this.parentVendors = this.parentVendors.concat(res['results']);
        this.filteredParentVendors = Helper.deepClone(this.parentVendors);
        this.setPaginationFromRes(res);
        this.cdRef.markForCheck();
      });
  }

  public setFilterVendorsGroupSubscribtion(form, field) {
    form.get(field).valueChanges
    .pipe(
      debounceTime(500),
      filter(value => typeof value === 'string'),
      switchMap( (searchStr) => {
          this.resetPagination();
          const search = {
           filters:  {
              name : searchStr
            }
          };

          this.parentVendors = [];
          this.filteredParentVendors = [];
          this.searchText = searchStr;
          this.isLoadingVendorsGroup = true;
          this.cdRef.markForCheck();

          return this.inventoryApi.getVendorsGroupSearch(search, this.pagination)
          .pipe(
            filter(res=> !!res.results),
            catchError(error => {
            this.isLoadingVendorsGroup = false;
            this.cdRef.markForCheck();
            return of({result: []});
          }));
      }),
      tap(() => this.isLoadingVendorsGroup = false)).subscribe( res => {
        this.parentVendors = res['results'];
        this.filteredParentVendors =  Helper.deepClone(this.parentVendors);
        this.cdRef.markForCheck();
        this.setPaginationFromRes(res);
      });
  }

  resetPagination() {
    this.pagination = {page: 1, perPage: 25};
  }
  setPaginationFromRes(result) {
    if (result?.pagination?.total) {
      this.pagination.total = result['pagination']['total'];
    }
  }

  ngOnDestroy(): void {
    this.freeUp$.next();
    this.freeUp$.complete();
  }

}
