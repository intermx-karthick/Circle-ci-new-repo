import { ChangeDetectorRef, Component } from '@angular/core';

import { RecordService } from '../record.service';
import { UseRecordPagination } from '../useRecordPagination';
import {
  catchError,
  debounceTime,
  filter,
  map,
  mergeMap,
  switchMap,
  tap
} from 'rxjs/operators';
import { NotificationsService } from '../../notifications/notifications.service';
import { ClientDropDownValue } from '@interTypes/records-management';
import { UserData } from '@interTypes/User';
import { VendorGroup } from '@interTypes/vendor';
import { of } from 'rxjs';
import { Helper } from '../../classes';

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
 *   export class Clients extends AbstractClientsDropDownComponent{
 *        protected constructor(
 *            public recordService: RecordService,
 *            public notificationService: NotificationsService,
 *            public cdRef: ChangeDetectorRef
 *        ) {
 *              super(recordService, notificationService, cdRef)
 *            }
 *   }
 */
export interface ClientsDropDownComponent {
  parentClients: Array<any>;
  parentClientsSearchStr: string;

  divisions: Array<ClientDropDownValue>;
  clientTypes: Array<ClientDropDownValue>;
  businessCategories: Array<ClientDropDownValue>;
  clientsOfAgency: Array<any>;
  currentStatus: Array<any>;
  mangedBy: Array<UserData>;
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

  loadClients();

  loadMoreClients();

  loadDivisions();

  loadOffices();

  loadClientTypes();

  loadBusinessCategories();

  loadCurrentStatus();

  loadClientsOfAgency();

  loadCodeSchemes();

  loadCommissionBasis();

  loadFeeBasis();

  loadEstTimings();

  loadPrimaryAgencies();

  loadPrimaryAgencyContacts();

  loadCreativeAgencies();

  loadCreativeAgencyContacts();

  loadCancellationPrivileges();

  loadContractTermTypes();

  loadDiversityOwnerShips();
}

@Component({
  template: ''
})
export abstract class AbstractClientsDropDownComponent
  implements ClientsDropDownComponent {
  abstract parentClientsSearchStr = ''; // update this value when parent vendor searching

  public parentClientPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 10
  });
  public parentClients = [];
  public isParentClientsLoading = false;

  private diversityOwnershipsPagination: UseRecordPagination = new UseRecordPagination(
    {
      page: 1,
      perPage: 10
    }
  );
  public diversityOwnerShips: Array<any> = [];
  public isDiversityOwnershipsLoading: boolean = false;

  public divisions: Array<ClientDropDownValue> = [];
  public clientTypes: Array<ClientDropDownValue> = [];
  public businessCategories: Array<ClientDropDownValue> = [];
  public clientsOfAgency: Array<any> = [];
  public currentStatus: Array<any> = [];
  public mangedBy: Array<UserData> = [];
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
  public creativeAgenciesPagination: UseRecordPagination = new UseRecordPagination(
    {
      page: 1,
      perPage: 10
    }
  );
  public isCreativeAgenciesLoading = false;

  public creativeAgencyContacts: Array<any> = [];

  public primaryAgencies: Array<any> = [];
  public primaryAgenciesPagination: UseRecordPagination = new UseRecordPagination(
    {
      page: 1,
      perPage: 10
    }
  );
  public primaryAgencyContacts: Array<any> = [];
  public isPrimaryAgenciesLoading = false;
  public isOfficesLoading = false;
  public officesPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 20
  });
  public officeSearchStr: string;
  public isPrimaryAgenciesContactsLoading = false;
  public isCreativeAgenciesContactsLoading = false;

  private primaryAgenciesContactsPagination: UseRecordPagination = new UseRecordPagination(
    {
      page: 1,
      perPage: 10
    }
  );
  private creativeAgenciesContactsPagination: UseRecordPagination = new UseRecordPagination(
    {
      page: 1,
      perPage: 10
    }
  );
  public selectedPrimaryAgencyOrganizationId: string;
  public selectedPrimaryAgencyId: string;
  public selectedCreativeAgencyOrganizationId: string;
  public selectedCreativeAgencyId:string;
  protected constructor(
    public recordService: RecordService,
    public notificationService: NotificationsService,
    public cdRef: ChangeDetectorRef
  ) {}

  public loadClients(nextPage = false) {
    this.isParentClientsLoading = true;
    const filters = {
      search: this.parentClientsSearchStr,
      filter: {
        isParent: true
      }
    };
    this.recordService
      .getClientsByFilters(
        filters,
        this.parentClientsSearchStr,
        'asc',
        'clientName',
        this.parentClientPagination.getValues()
      )
      .pipe(filter((res: any) => !!res))
      .subscribe((res: any) => {
        if (nextPage) {
          this.parentClients.push(...res.results);
        } else {
          this.parentClients = res.results;
        }
        this.parentClientPagination.updateTotal(res.pagination.total);
        this.isParentClientsLoading = false;
        this.cdRef.markForCheck();
      });
  }

  public loadMoreClients() {
    if (!this.isParentClientsLoading) {
      if (this.parentClientPagination.isPageSizeReachedTotal()) {
        this.isParentClientsLoading = false;
        return;
      }
      this.parentClientPagination.moveNextPage();
      this.loadClients(true);
    }
  }

  public loadOffices(nextPage = false) {
    this.isOfficesLoading = true;
    this.recordService
      .getOffices(this.officeSearchStr, this.officesPagination.getValues())
      .pipe(
        tap(() => (this.isOfficesLoading = false)),
        filter((res) => !!res),
        catchError((error) => {
          return of({ result: [] });
        })
      )
      .subscribe((res) => {
        if (nextPage) {
          this.offices.concat(res.results);
        } else {
          this.offices = res.results;
        }
        this.officesPagination.updateTotal(res.pagination.total);
        this.cdRef.markForCheck();
      });
  }

  public loadMoreOffices() {
    if (this.officesPagination.isPageSizeReachedTotal()) {
      this.isOfficesLoading = false;
      return;
    }

    this.officesPagination.moveNextPage();
    this.loadOffices(true);
  }
  public loadBusinessCategories() {
    this.recordService
      .getBusinessCategories()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.businessCategories = res;
      });
  }

  public loadClientTypes() {
    this.recordService
      .getClientTypes()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.clientTypes = res;
      });
  }

  public loadDivisions() {
    this.recordService
      .getDivisions()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.divisions = res;
      });
  }

  // todo
  public loadClientsOfAgency() {}

  // todo
  public loadCurrentStatus() {}

  public loadCodeSchemes() {
    this.recordService
      .getCodeSchemes()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        // Don't do deep clone. for dropdown object reference is better.
        this.estScheme = res;
        this.prodScheme = res;
      });
  }

  public loadCommissionBasis() {
    this.recordService
      .getCommissionBasis()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        // Don't do deep clone. for dropdown object reference is better.
        this.billingCommissionBasis = res;
        this.ohhRevenueCommissionBasis = res;
        this.prodInstallBasis = res;

      });
  }

  public loadFeeBasis() {
    this.recordService
      .getFeeBasis()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        // Don't do deep clone. for dropdown object reference is better.
        this.billingFeeBasis = res;
        this.ohhRevenueFeeBasis = res;
      });
  }

  public loadEstTimings() {
    this.recordService
      .getEstTimings()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.estTimings = res;
      });
  }

  public loadCancellationPrivileges() {
    this.recordService
      .getCancellationPrivileges()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.cancellationPrivileges = res;
      });
  }

  public loadContractTermTypes() {
    this.recordService
      .getContractTermTypes()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.contractTermTypes = res;
      });
  }

  public loadDiversityOwnerShips(nextPage = false) {
    this.isDiversityOwnershipsLoading = true;
    this.recordService
      .getVendorsDiversityOwnerships(
        this.diversityOwnershipsPagination.getValues()
      )
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        if (nextPage) {
          this.diversityOwnerShips.concat(res.results);
        } else {
          this.diversityOwnerShips = res.results;
        }
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
    this.loadDiversityOwnerShips(true);
  }

  // todo check and add creative type id
  public loadCreativeAgencies(nextPage = false) {
    this.isCreativeAgenciesLoading = true;

    this.recordService
      .getAgencyTypes()
      .pipe(
        filter((res) => !!res),
        map((res) =>
          res.results.find((type) => type.name === 'Creative Agency')
        ),
        filter((type) => !!type),
        mergeMap((type: any) => {
          return this.recordService.getAgencies(
            {
              search: '',
              filter: { types: [type._id] }
            },
            this.creativeAgenciesPagination
          );
        }),
        filter((res) => !!res)
      )
      .subscribe((res) => {
        if (nextPage) {
          this.creativeAgencies.concat(res.results);
        } else {
          this.creativeAgencies = res.results;
        }
        this.isCreativeAgenciesLoading = true;
        this.creativeAgenciesPagination.updateTotal(res?.pagination?.total);
      });
  }

  public loadMoreCreativeAgencies() {
    if (this.creativeAgenciesPagination.isPageSizeReachedTotal()) {
      this.isCreativeAgenciesLoading = false;
      return;
    }

    this.creativeAgenciesPagination.moveNextPage();
    this.loadCreativeAgencies(true);
  }

  public loadCreativeAgencyContacts(nextPage = false, successCallback = null) {
    this.isCreativeAgenciesContactsLoading = true;
    this.cdRef.markForCheck();
    const filtersInfo = {
      filter: {
        companyIds: [this.selectedCreativeAgencyOrganizationId]
      }
    };
    const pagination = {
      page:1,
      perPage: 100
    };
    this.recordService
      .getContacts(filtersInfo, pagination, {
        active: 'firstName',
        direction: 'asc'
      })
      .pipe(
        filter((res) => !!res),
        tap(() => (this.isCreativeAgenciesContactsLoading = false)),
        catchError((error) => {
          this.cdRef.markForCheck();
          return of({ results: [] });
        })
      )
      .subscribe((res) => {
        if (nextPage) {
          this.creativeAgencyContacts.concat(res.results);
        } else {
          this.creativeAgencyContacts = res.results;
        }
        this.creativeAgenciesContactsPagination.updateTotal(res.pagination.total);
        if(!!successCallback && typeof successCallback  == 'function'){
          successCallback();
        }

        this.cdRef.markForCheck();
      });
  }

  public loadMoreCreativeAgencyContacts() {
    if (this.creativeAgenciesContactsPagination.isPageSizeReachedTotal()) {
      this.isCreativeAgenciesContactsLoading = false;
      return;
    }

    this.creativeAgenciesContactsPagination.moveNextPage();
    this.loadCreativeAgencyContacts(true);
  }

  public loadPrimaryAgencies(nextPage = false) {
    this.isPrimaryAgenciesLoading = true;

    this.recordService
      .getAgencyTypes()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results.find((type) => type.name === 'Media Agency')),
        filter((type) => !!type),
        mergeMap((type: any) => {
          return this.recordService.getAgencies(
            {
              search: '',
              filter: { types: [type._id] }
            },
            this.primaryAgenciesPagination
          );
        }),
        filter((res) => !!res)
      )
      .subscribe((res) => {
        if (nextPage) {
          this.primaryAgencies.concat(res.results);
        } else {
          this.primaryAgencies = res.results;
        }
        this.isPrimaryAgenciesLoading = false;
        this.primaryAgenciesPagination.updateTotal(res.pagination.total);
      });
  }

  public loadMorePrimaryAgencies() {
    if (this.primaryAgenciesPagination.isPageSizeReachedTotal()) {
      this.isCreativeAgenciesLoading = false;
      return;
    }

    this.primaryAgenciesPagination.moveNextPage();
    this.loadPrimaryAgencies(true);
  }

  public loadPrimaryAgencyContacts(nextPage = false, successCallback = null) {
    this.isPrimaryAgenciesContactsLoading = true;
    this.cdRef.markForCheck();
    const filtersInfo = {
      filter: {
        companyIds: [this.selectedPrimaryAgencyOrganizationId]
      }
    };
    const pagination = {
      page:1,
      perPage: 100
    };
    this.recordService
      .getContacts(filtersInfo, pagination, {
        active: 'firstName',
        direction: 'asc'
      })
      .pipe(
        filter((res) => !!res),
        tap(() => (this.isPrimaryAgenciesContactsLoading = false)),
        catchError((error) => {
          this.cdRef.markForCheck();
          return of({ results: [] });
        })
      )
      .subscribe((res) => {
        if (nextPage) {
          this.primaryAgencyContacts.concat(res.results);
        } else {
          this.primaryAgencyContacts = res.results;
        }
        this.primaryAgenciesContactsPagination.updateTotal(res.pagination.total);
        this.cdRef.markForCheck();

        if(!!successCallback && typeof successCallback  == 'function'){
          successCallback();
        }
      });
  }

  public loadMorePrimaryAgencyContacts() {
    if (this.primaryAgenciesContactsPagination.isPageSizeReachedTotal()) {
      this.isPrimaryAgenciesContactsLoading = false;
      return;
    }

    this.primaryAgenciesContactsPagination.moveNextPage();
    this.loadPrimaryAgencyContacts(true);
  }

  // TODO: Need to add interface
  public parentClientDisplayWithFn(client) {
    return client?.clientName ?? '';
  }

  // TODO: Need to add interface
  public clientOfAgencyDisplayWithFn(client) {
    return client?.name ?? '';
  }

  public parentClientTrackByFn(idx: number, client) {
    return client?._id ?? idx;
  }

  public clientOfAgencyTrackByFn(idx: number, client) {
    return client?._id ?? idx;
  }


  public officeDisplayWithFn(office) {
    return office?.name ?? '';
  }

  public officeTrackByFn(idx: number, office) {
    return office?._id ?? idx;
  }

  public setFilterParentClientSubscription(form, field) {
    form
      .get(field)
      .valueChanges.pipe(
        debounceTime(500),
        filter((value) => typeof value === 'string'),
        switchMap((searchStr: string) => {
          this.parentClientPagination.resetPagination();
          const search = {
            search: searchStr
          };
          this.parentClientsSearchStr = searchStr;
          const filters = {
            search: this.parentClientsSearchStr,
            filter: {
              isParent: true
            }
          };
          return this.recordService
            .getClientsByFilters(
              filters,
              this.parentClientsSearchStr,
              'asc',
              'clientName',
              this.parentClientPagination.getValues()
            )
            .pipe(
              filter((res) => !!res['results']),
              catchError((error) => {
                this.isParentClientsLoading = false;
                this.cdRef.markForCheck();
                return of({ result: [] });
              })
            );
        }),
        tap(() => (this.isParentClientsLoading = false))
      )
      .subscribe((res) => {
        this.parentClients = res['results'];
        this.parentClientPagination.updateTotal(res.pagination.total);
        this.cdRef.markForCheck();
      });
  }

  public setOfficeFilterSubscription(form, field) {
    form
      .get(field)
      .valueChanges.pipe(
        debounceTime(500),
        filter((value) => typeof value === 'string'),
        switchMap((searchStr: string) => {
          this.officesPagination.resetPagination();
          this.officeSearchStr = searchStr;
          return this.recordService
            .getOffices(
              this.officeSearchStr,
              this.officesPagination.getValues()
            )
            .pipe(
              filter((res) => !!res.results),
              catchError((error) => {
                this.isOfficesLoading = false;
                this.cdRef.markForCheck();
                return of({ result: [] });
              })
            );
        }),
        tap(() => (this.isOfficesLoading = false))
      )
      .subscribe((res) => {
        this.offices = res['results'];
        this.officesPagination.updateTotal(res.pagination.total);
        this.cdRef.markForCheck();
      });
  }
}
