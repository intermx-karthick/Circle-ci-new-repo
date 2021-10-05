import { ChangeDetectorRef, Component } from '@angular/core';

import { RecordService } from '../record.service';
import { UseRecordPagination } from '../useRecordPagination';
import { debounceTime, filter, map, mergeMap, switchMap } from 'rxjs/operators';
import { NotificationsService } from '../../notifications/notifications.service';
import { ClientDropDownValue } from '@interTypes/records-management';
import { UserData } from '@interTypes/User';
import { Sort } from '@angular/material/sort';

/**
 * @description
 *   This dropdown api implementation you can use across the records management
 *   It covers the most of the dropdown.
 *
 *   Don't worry about this class multiple dropdown api implementation
 *   if you are going to use it in list or somewhere.
 *
 *   use if some drop down matches in your page.
 *
 *   @example
 *   export class Agencies extends AbstractAgenciesDropDownComponent{
 *        protected constructor(
 *            public recordService: RecordService,
 *            public notificationService: NotificationsService,
 *            public cdRef: ChangeDetectorRef
 *        ) {
 *              super(recordService, notificationService, cdRef)
 *            }
 *   }
 */
export interface  AgenciesDropDownComponent {
  parentAgencies: Array<any>;
  parentAgenciesSearchStr: string;

  divisions: Array<ClientDropDownValue>;
  agencyTypes: Array<ClientDropDownValue>;
  businessCategories: Array<ClientDropDownValue>;
  clientsOfAgency: Array<any>;
  currentStatus: Array<any>;
  managedBy: Array<UserData>;
  operationContacts: Array<any>;

  estScheme: Array<ClientDropDownValue>;
  estTimings: Array<ClientDropDownValue>;
  prodScheme: Array<ClientDropDownValue>;
  billingFeeBasis: Array<ClientDropDownValue>;
  ohhRevenueFeeBasis: Array<ClientDropDownValue>;
  billingCommissionBasis: Array<ClientDropDownValue>;
  ohhRevenueCommissionBasis: Array<ClientDropDownValue>;
  prodInstallBasis: Array<ClientDropDownValue>;

  cancellationPrivileges: Array<ClientDropDownValue>;
  contractTermTypes: Array<ClientDropDownValue>;
  diversityOwnerShips: Array<ClientDropDownValue>; // multi selection drop down

  primaryAgencies: Array<any>;
  primaryAgencyContacts: Array<any>; // get contact as per selected primary agency
  creativeAgencies: Array<any>;
  creativeAgencyContacts: Array<any>; // get contact as per selected creative agency


  loadAgencies();

  loadMoreAgencies();

  loadDivisions();

  loadOffice();

  loadAgencyTypes();

  loadBusinessCategories();

  loadCurrentStatus();

  loadAgenciesOfAgency();

  loadCodeSchemes();

  loadCommissionBasis();

  loadFeeBasis();

  loadEstTimings();

  loadPrimaryAgencies();

  loadPrimaryAgencyContacts(agencyId: string);

  loadCreativeAgencies();

  loadCreativeAgencyContacts(agencyId: string);

  loadCancellationPrivileges();

  loadContractTermTypes();

  loadDiversityOwnerShips();

}


@Component({
  template: ''
})
export abstract class AbstractAgenciesDropDownComponent implements AgenciesDropDownComponent {

  abstract parentAgenciesSearchStr = ''; // update this value when parent vendor searching

  public parentAgenciesPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 10
  });
  parentAgenciesSortng: Sort = {active: 'name', direction: 'asc'};
  public parentAgencies = [];
  public isParentAgenciesLoading = false;

  private diversityOwnershipsPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 10
  });
  public diversityOwnerShips: Array<any> = [];
  private isDiversityOwnershipsLoading: boolean = false;

  public divisions: Array<ClientDropDownValue> = [];
  public agencyTypes: Array<ClientDropDownValue> = [];
  public businessCategories: Array<ClientDropDownValue> = [];
  public clientsOfAgency: Array<any> = [];
  public currentStatus: Array<any> = [];
  public managedBy: Array<UserData> = [];
  operationContacts: Array<any>;

  public offices: Array<ClientDropDownValue> = [];

  // these things are common for add/update agencies/clients
  public commissionBasis: Array<ClientDropDownValue> = [];
  public estScheme: Array<ClientDropDownValue> = [];
  public prodInstallBasis: Array<ClientDropDownValue> = [];
  public prodScheme: Array<ClientDropDownValue> = [];
  public estTimings: Array<ClientDropDownValue> = [];
  public billingFeeBasis: Array<ClientDropDownValue> = [];
  public ohhRevenueFeeBasis: Array<ClientDropDownValue> = [];
  public billingCommissionBasis: Array<ClientDropDownValue> = [];
  public ohhRevenueCommissionBasis: Array<ClientDropDownValue> = [];

  public cancellationPrivileges: Array<any> = [];
  public contractTermTypes: Array<any> = [];

  public creativeAgencies: Array<any> = [];
  public creativeAgenciesPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 10
  });
  public isCreativeAgenciesLoading = false;

  public creativeAgencyContacts: Array<any> = [];

  public primaryAgencies: Array<any> = [];
  public primaryAgenciesPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 10
  });
  public primaryAgencyContacts: Array<any> = [];
  public isPrimaryAgenciesLoading = false;

  protected constructor(
    public recordService: RecordService,
    public notificationService: NotificationsService,
    public cdRef: ChangeDetectorRef
  ) {
  }
  public setFilterAgencySubscribtion(form, field) {
    form
      .get(field)
      .valueChanges.pipe(
        debounceTime(500),
        filter((value) => typeof value === 'string')
      )
      .subscribe((res: any) => {
        this.parentAgenciesSearchStr = res;
        this.parentAgenciesPagination.resetPagination();
        this.loadAgencies();
      });
  }
  public loadAgencies(loadMore = false) {
    this.isParentAgenciesLoading = true;
    this.cdRef.detectChanges();
    const filters = {
      search: this.parentAgenciesSearchStr,
      filter: {
        isParent: true
      }
    };
    this.recordService
      .getAgenciesList(
        filters,
        this.parentAgenciesPagination.getValues(),
        this.parentAgenciesSortng
      )
      .subscribe((res: any) => {
        if (loadMore) {
          this.parentAgencies.push(...res.results);
        } else {
          this.parentAgencies = res.results;
        }
        this.parentAgenciesPagination.updateTotal(res.pagination.total);
        this.isParentAgenciesLoading = false;
        this.cdRef.detectChanges();
      });
  }

  public loadMoreAgencies() {
    if (this.parentAgenciesPagination.isPageSizeReachedTotal()) {
      this.isParentAgenciesLoading = false;
      return;
    }
    this.parentAgenciesPagination.moveNextPage();
    this.loadAgencies(true);
  }


  public loadOffice() {
    this.recordService.getOffices()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.offices = res;
      });
  }

  public loadBusinessCategories() {
    this.recordService.getBusinessCategories()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.businessCategories = res;
      });
  }

  public loadAgencyTypes() {
    this.recordService.getAgencyTypes()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.agencyTypes = res;
      });
  }

  public loadDivisions() {
    this.recordService.getDivisions()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.divisions = res;
      });
  }

  // todo
  public loadAgenciesOfAgency() {
  }

  // todo
  public loadCurrentStatus() {
  }

  public loadCodeSchemes() {
    this.recordService.getCodeSchemes()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        // Don't do deep clone. for dropdown object reference is better.
        this.estScheme = res;
        this.prodScheme = res;
      });
  }

  public loadCommissionBasis() {
    this.recordService.getCommissionBasis()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        // Don't do deep clone. for dropdown object reference is better.
        this.billingCommissionBasis = res;
        this.ohhRevenueCommissionBasis = res;
        this.prodInstallBasis = res;
      });
  }

  public loadFeeBasis() {
    this.recordService.getFeeBasis()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {

        // Don't do deep clone. for dropdown object reference is better.
        this.billingFeeBasis = res;
        this.ohhRevenueFeeBasis = res;
      });
  }

  public loadEstTimings() {
    this.recordService.getEstTimings()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.estTimings = res;
      });
  }

  public loadCancellationPrivileges() {
    this.recordService.getCancellationPrivileges()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.cancellationPrivileges = res;
      });
  }

  public loadContractTermTypes() {
    this.recordService.getContractTermTypes()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.cancellationPrivileges = res;
      });
  }

  public loadDiversityOwnerShips() {
    this.isDiversityOwnershipsLoading = true;
    this.recordService
      .getVendorsDiversityOwnerships(this.diversityOwnershipsPagination.getValues())
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        this.diversityOwnerShips = res.results;
        this.diversityOwnershipsPagination.updateTotal(res.pagination.total);
        this.isDiversityOwnershipsLoading = false;
        this.cdRef.markForCheck();
      });
  }

  public loadMoreDiversityOwnerships() {
    if (this.diversityOwnershipsPagination.isPageSizeReachedTotal()) {
      this.isDiversityOwnershipsLoading = false;
      return;
    }

    this.diversityOwnershipsPagination.moveNextPage();
    this.loadDiversityOwnerShips();
  }

  // todo check and add creative type id
  public loadCreativeAgencies() {
    this.isCreativeAgenciesLoading = true;

    this.recordService.getAgencyTypes().pipe(
      filter(res => !!res),
      map(res => res.results.find(type => type.name === 'Creative Agency')),
      filter(types => types.length > 0),
      map(types => types[0]),
      mergeMap((type: any) => {
        return this.recordService.getAgencies({ search: '', filter: { types: type._id } });
      }),
      filter(res => !!res),
    ).subscribe((res) => {
      this.creativeAgencies = res.results;
      this.isCreativeAgenciesLoading = true;
      this.creativeAgenciesPagination.updateTotal(res?.pagination?.total)
    });
  }

  public loadMoreCreativeAgencies(){
    if (this.creativeAgenciesPagination.isPageSizeReachedTotal()) {
      this.isCreativeAgenciesLoading = false;
      return;
    }

    this.creativeAgenciesPagination.moveNextPage();
    this.loadCreativeAgencies();
  }

  // todo check
  public loadCreativeAgencyContacts(agencyId: string) {
    this.recordService.getAgency(agencyId)
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.creativeAgencyContacts = res;
      });
  }

  // todo check and add primary type id
  public loadPrimaryAgencies() {
    this.isPrimaryAgenciesLoading = true;

    this.recordService.getAgencyTypes().pipe(
      filter(res => !!res),
      map(res => res.results.find(type => type.name === 'Media Agency')),
      filter(types => types.length > 0),
      map(types => types[0]),
      mergeMap((type: any) => {
        return this.recordService.getAgencies({ search: '', filter: { types: type._id } });
      }),
      filter(res => !!res),
      map(res => res.results)
    ).subscribe((res) => {
      this.primaryAgencies = res.results;
      this.isPrimaryAgenciesLoading = false;
      this.primaryAgenciesPagination.updateTotal(res.pagination.total)
    });
  }

  public loadMorePrimaryAgencies(){
    if (this.primaryAgenciesPagination.isPageSizeReachedTotal()) {
      this.isCreativeAgenciesLoading = false;
      return;
    }

    this.primaryAgenciesPagination.moveNextPage();
    this.loadPrimaryAgencies();
  }

  // todo check
  public loadPrimaryAgencyContacts(agencyId: string) {
    this.recordService.getAgency(agencyId)
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.primaryAgencyContacts = res;
      });
  }

}
