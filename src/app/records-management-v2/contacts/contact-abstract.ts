import {ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import { Subject, of } from 'rxjs';
import {
  debounceTime,
  tap,
  filter,
  takeUntil,
  catchError,
  switchMap
} from 'rxjs/operators';
import { RecordService } from '../record.service';
import { RecordsPagination } from '@interTypes/pagination';
import { ContactType } from '@interTypes/records-management/contacts';
import { VendorSearchPayload } from '@interTypes/inventory-management';
import { StateAbstract } from '../vendors/state-autocomplete';

@Component({
  selector: 'base-contact-abstract',
  template: ''
})
export class ContactAbstract extends StateAbstract implements OnDestroy {
  public contactTypes: ContactType[] = [];
  public contactTypePagination: RecordsPagination = {
    perPage: 10,
    page: 1
  };
  public isContactTypesLoading = false;
  public isCompaniesLoading = true;
  public companies: any[] = [];
  public companyPagination: RecordsPagination = {
    perPage: 25,
    page: 1
  };
  protected freeUp$ = new Subject();
  public searchText;

  constructor(
    public recordService: RecordService,
    public cdRef: ChangeDetectorRef
  ) {
    super(recordService, cdRef);
  }

  public loadMoreContactTypes() {
    const currentSize =
      this.contactTypePagination.page * this.contactTypePagination.perPage;
    if (currentSize > this.contactTypePagination.total) {
      this.isContactTypesLoading = false;
      return;
    }
    this.contactTypePagination.total += 1;
    this.loadContactTypes();
  }

  public loadContactTypes() {
    this.isContactTypesLoading = true;
    this.recordService
      .getContactTypes(this.contactTypePagination)
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        this.contactTypes = res.results;
        this.contactTypePagination.total = res.pagination.total;
        this.isContactTypesLoading = false;
        this.cdRef.markForCheck();
      });
  }

  public loadCompanies() {
    this.isCompaniesLoading = true;
    this.recordService
      .getOrganizations(this.formatSearchPayLoad(), this.companyPagination, {active: 'name', direction: 'asc'})
      .pipe(
        tap(() => (this.isCompaniesLoading = false)),
        filter((res) => !!res.results)
      )
      .subscribe((response) => {
        this.companies = response.results;
        this.setCompanyPaginationFromRes(response);
        this.cdRef.markForCheck();
      });
  }

  public loadMoreCompanies() {
    // Checking total page
    if(!this.isCompaniesLoading) {
      if (
        this.companyPagination.page * this.companyPagination.perPage >
        this.companyPagination.total
      ) {
        this.isCompaniesLoading = false;
        this.cdRef.markForCheck();
        return;
      }
      this.companyPagination.page += 1;
      this.isCompaniesLoading = true;
      this.cdRef.markForCheck();
      this.recordService
        .getOrganizations(this.formatSearchPayLoad(), this.companyPagination, {active: 'name', direction: 'asc'})
        .pipe(
          takeUntil(this.freeUp$),
          filter((res) => !!res.results),
          catchError((error) => {
            this.companyPagination.page -= 1;
            this.isCompaniesLoading = false;
            return of({ results: [] });
          })
        )
        .subscribe((res) => {
          this.isCompaniesLoading = false;
          this.companies = this.companies.concat(res['results']);
          this.setCompanyPaginationFromRes(res);
          this.cdRef.markForCheck();
        });
    }

  }

  public setFilterCompanySubscribtion(form, field, callback = () => {}) {
    form
      .get(field)
      .valueChanges.pipe(
        debounceTime(500),
        filter((value) => typeof value === 'string'),
        switchMap((searchStr: string) => {
          this.resetPagination();
          this.searchText = searchStr;
          return this.recordService
            .getOrganizations(
              this.formatSearchPayLoad(),
              this.companyPagination,
              {active: 'name', direction: 'asc'}
            )
            .pipe(
              filter((res) => !!res.results),
              catchError((error) => {
                this.isCompaniesLoading = false;
                callback();
                this.cdRef.markForCheck();
                return of({ result: [] });
              })
            );
        }),
        tap(() => (this.isCompaniesLoading = false))
      )
      .subscribe((res) => {
        this.companies = res['results'];
        callback();
        this.cdRef.markForCheck();
        this.setCompanyPaginationFromRes(res);
      });
  }

  formatSearchPayLoad() {
    const searchText = {};
    if (this.searchText) {
      searchText['search'] = this.searchText;
    }
    return searchText;
  }
  resetPagination() {
    this.companyPagination = { page: 1, perPage: 25 };
  }

  setCompanyPaginationFromRes(result) {
    if (result?.pagination?.total) {
      this.companyPagination.total = result['pagination']['total'];
    }
  }
  ngOnDestroy(): void {
    this.freeUp$.next();
    this.freeUp$.complete();
  }
}
