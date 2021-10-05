import {
  Vendor,
  VendorSearchPayload,
  VendorsSearchPagination,
  VendorsSearchResponse
} from '@interTypes/inventory-management';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, ReplaySubject } from 'rxjs';

import { catchError, map, publishReplay, refCount } from 'rxjs/operators';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { VendorsGroupPagination, VendorsGroupSearchResponse } from '@interTypes/vendor/vendor-group-search';
import { Sort } from '@angular/material/sort';
import { VendorTypesPagination, VendorTypesResponse } from '@interTypes/vendor';
import { AppConfig } from 'app/app-config.service';
import { StateSearchPagination, StateSearchResponse } from './address/abstract-state-list';
import { RecordsPagination } from '@interTypes/pagination';
import { AgencyPagination } from '@interTypes/agency';
import {
  ClientProductsResponse,
  AgencyFilterPayload,
  ClientAccountingPayload,
  ClientDropDownResponse,
  ClientsAccountDetails,
  CreateClientPayload,
  CreateItemResponse,
  FilterClientsPayload,
  FilterClientsResponse,
  FilteredClient,
  ClientProductDetailsPayload,
  ClientEstimatePayload
} from '@interTypes/records-management';
import { UserData } from '@interTypes/User';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ClientEstimateDetailsResponse } from '@interTypes/records-management/clients/client-estimate-details.response';
import { EstimateSearchResponse, EstimateSearchPagination, EstimateSearchFilter } from '@interTypes/inventory-management/estimate-search.response';
import {
  NotePagination
} from '@interTypes/notes';

interface ClientProductCacheInfo {
  clientId: string; perPage: number; page: number; order: string; sortBy: string;
}


@Injectable()
export class RecordService {
  public handleError;
  private siteName: string;

  private divisions$: Observable<any>;
  private offices$: Observable<any>;
  private clientTypes$: Observable<any>;
  private businessCategories$: Observable<any>;
  private accountingDepartment$: Observable<any>;
  private filesystemIds$: Observable<any>;
  private pubIdTypes$: Observable<any>;
  private invoiceDeliveries$: Observable<any>;
  private invoiceFormat$: Observable<any>;

  private codeSchemes$: Observable<any>;
  private commissionBasis$: Observable<any>;
  private feeBasis$: Observable<any>;
  private estTimings$: Observable<any>;


  private cancellationPrivileges$: Observable<any>;
  private contractTermTypes$: Observable<any>;
  private agencyTypes$: Observable<any>;
  private agencies$: Observable<any>;
  private dropDownAgencies$: Observable<any>;
  private state$: Observable<any>;
  public refreshEstimatesProductsListSubject: ReplaySubject<any> = new ReplaySubject(1);
  public refreshEstimatesProductsList$: Observable<any> = this.refreshEstimatesProductsListSubject.asObservable();
  private clientProducts$: Observable<any>;
  private clientProductCacheInfo: ClientProductCacheInfo;


  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private theme: ThemeService,
    private matSnackBar: MatSnackBar
  ) {
    const themeSettings = this.theme.getThemeSettings();
    this.siteName = themeSettings && themeSettings.site;
    this.handleError = this.httpErrorHandler.createHandleError(
      'Vendor Service'
    );
  }

  /**
   *
   * @param search Search fileds
   * @param {VendorsSearchPagination} pagination
   * @param {boolean} [noLoader=true]
   * @param siteName
   */
  getVendorBySearch(
    search: VendorSearchPayload = {},
    pagination: VendorsSearchPagination = {},
    sort: Sort = null,
    siteName = this.siteName
  ): Observable<VendorsSearchResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}vendors/search?site=${siteName}`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (sort && sort?.direction !== '') {
      url += `&sortBy=${sort.active}&order=${sort.direction}`;
    }

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .post<VendorsSearchResponse>(url, search, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getVendorBySearch', null))
      );
  }

  /**
   *
   * @param search Search fileds
   * @param {VendorsSearchPagination} pagination
   * @param {boolean} [noLoader=true]
   * @param siteName
   */
  getVendorsGroupSearch(
    search = null,
    pagination: VendorsGroupPagination = {},
    sort = {active: 'name', direction: 'asc'},
    siteName = this.siteName
  ): Observable<VendorsGroupSearchResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}vendors/vendorgroups/search?site=${siteName}`;

    let filterInfo = {
      filters: {}
    }
    if(search){
      // FIX=>IMXUIPRD-4057 - 23/07/21 avoid filters object append in twice/duplicate. 
      if (search && search.filters) {
        filterInfo = search;
      } else {
        filterInfo.filters['name'] = search;
      }
    }
    if (sort) {
      url += `&sortBy=${sort.active}&order=${sort.direction}`;
    }
    if (pagination) {
      url = `${url}&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    // By Default hide the common loader
    let headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .post<VendorsGroupSearchResponse>(url, filterInfo, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getVendorsGroupSearch', null))
      );
  }

  /**
   * @description
   *  To get the vendor types from the API.
   * @param {VendorsSearchPagination} pagination
   * @param {boolean} [noLoader=true]
   * @param siteName
   */
  getVendorsTypesSearch(
    pagination: VendorTypesPagination = {},
    siteName = this.siteName
  ): Observable<VendorTypesResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}vendors/vendortype/search?site=${siteName}`;

    if (pagination) {
      url = `${url}&page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    // By Default hide the common loader
    let headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .get<VendorTypesResponse>(url, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getVendorsTypesSearch', null))
      );
  }

  /**
   * @description
   *  To get the vendor Diversity Ownerships from the API.
   * @param {VendorsSearchPagination} pagination
   * @param {boolean} [noLoader=true]
   * @param siteName
   */
  getVendorsDiversityOwnerships(
    pagination: VendorTypesPagination = {},
    siteName = this.siteName
  ): Observable<VendorTypesResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}vendors/diversityownership/search?site=${siteName}`;

    if (pagination) {
      url = `${url}&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    // By Default hide the common loader
    let headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .get<VendorTypesResponse>(url, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getVendorsDiversityOwnerships', null))
      );
  }

  public createVendor(paylaod, noLoader = true) {
    const url = `${this.config.envSettings['API_ENDPOINT']}vendors`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post(url, paylaod, { headers });
  }

  public updateVendor(vendorId, paylaod, noLoader = true) {
    const url = `${this.config.envSettings['API_ENDPOINT']}vendors/${vendorId}`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.put(url, paylaod, { headers });
  }

  /**
   * Get vendor details by ID
   */
  public getVendorById(vendorId: string, noLoader = true): Observable<Vendor> {
    const url = `${this.config.envSettings['API_ENDPOINT']}vendors/${vendorId}`;

    let headers: HttpHeaders;

    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http
      .get<Vendor>(url, { headers })
      .pipe(
        catchError((error) => {
          const vendorErrorHandler = this.handleError(
            'getSpecificVendorDetails',
            null
          );
          return vendorErrorHandler(error);
        })
      );
  }

  public setVendorListLocal(key: string, value: any) {
    const vendorList = JSON.parse(localStorage.getItem('vendorList')) ?? {};

    vendorList[key] = value;
    localStorage.setItem('vendorList', JSON.stringify(vendorList));
  }

  public getVendorListLocal() {
    return JSON.parse(localStorage.getItem('vendorList'));
  }
  public removeVendorListLocal(key: string) {
    const vendorList = this.getVendorListLocal();
    if (vendorList?.[key]) {
      delete vendorList[key];
    }
    localStorage.setItem('vendorList', JSON.stringify(vendorList));
  }

  /**
   *
   * @param search Search fileds
   * @param {StateSearchPagination} pagination
   */
  getVendorsStateSearch(
    search = {},
    pagination: StateSearchPagination = {}
  ): Observable<StateSearchResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}locations/states/search`;

    if (pagination) {
      url += `?page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    // By Default hide the common loader
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .post<StateSearchResponse>(url, search, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getVendorsStateSearch', null))
      );
  }

  /** State catch */

  public getCatchState() {
    if (!this.state$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}locations/states/search?page=1&perPage=1000`;
      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      this.state$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.state$ = null;
          const errorHandler = this.handleError('getCatchState', []);
          return errorHandler(error);
        })
      );
    }
    return this.state$;
  }

  /**
   * @description
   * Create Contact API
   * @param paylaod
   */
  public createContact(paylaod, noLoader = false) {
    const url = `${this.config.envSettings['API_ENDPOINT']}/contacts`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.post(url, paylaod, { headers });
  }

  /**
   * @description
   * Update Contact API
   * @param paylaod
   * @param contactId
   */
  public updateContact(paylaod, contactId, noLoader = false) {
    const url = `${this.config.envSettings['API_ENDPOINT']}/contacts/${contactId}`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.patch(url, paylaod, { headers });
  }

  /**
   * @description
   * Get contact details by ID
   * @param contactId
   */
  public getContactById(contactId, noLoader = false): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}contacts/${contactId}`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.get(url, { headers });
  }

  /**
   * @description
   * Delete Contact
   * @param contactId
   */
  public deleteContact(contactId): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}contacts/${contactId}`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.delete(url, { headers });
  }

  public getClientAssociation(clientId: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/associations`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.get(url, { headers });
  }

  /**
   *
   * @param search Search fileds
   * @param {Sort}  sort
   * @param {string} fieldSet
   */
  public exportContacts(
    filters = {},
    sort: Sort = null,
    columns = null,
    noLoader = false
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}contacts/export`;

    if (sort?.direction !== '') {
      url += `?sortBy=${sort.active}&order=${sort.direction}`;
    }
    if (columns) {
      filters['headers'] = columns;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.post(url, filters, { observe: 'response', responseType: 'blob', headers: headers });
  }

  /**
   * @description
   *  To get the contacts from the API.
   * @param {RecordsPagination} pagination
   */
  public getContactTypes(pagination: RecordsPagination = {}): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}contacts/types`;

    if (pagination) {
      url = `${url}?page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.get(url, { headers }).pipe(publishReplay(1), refCount());
  }

  /**
   *
   * @param search Search fileds
   * @param {StateSearchPagination} pagination
   * @param sort
   * @param module
   */
  getContacts(
    search = {} as any,
    pagination: RecordsPagination = {},
    sort: Sort = null,
    module = '',
    fieldSet = ''
  ): Observable<any> {

    let modulePath = '';

    switch (module) {
      case 'agency':
        modulePath = `agencies/${search.filter.companyIds[0]}/`;
        break;
      case 'client':
        modulePath = `clients/${search.filter.companyIds[0]}/`;
        break;
      case 'vendor':
        modulePath = `vendors/${search.filter.companyIds[0]}/`;
        break;
    }

    if (modulePath && module) {
      search = {};
    }

    let url = `${this.config.envSettings['API_ENDPOINT']}${modulePath}contacts/search`;

    if (pagination) {
      url += `?page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    url += `&sortBy=${sort?.active || 'firstName'}&order=${sort?.direction || 'asc'}`
    if(fieldSet) {
      url += `&fieldSet=${fieldSet}`
    }
    // By Default hide the common loader
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .post(url, search, { headers })
      .pipe(publishReplay(1), refCount());
  }


  /**
   *
   * @param search Search fileds
   * @param {StateSearchPagination} pagination
   */
  getOrganizations(
    search = {},
    pagination: RecordsPagination = {},
    sort: Sort = null
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}organizations/search`;

    if (pagination) {
      url += `?page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (sort && sort?.direction !== '') {
      url += `&sortBy=${sort.active}&order=${sort.direction}`;
    }
    // By Default hide the common loader
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .post(url, search, { headers })
      .pipe(publishReplay(1), refCount());
  }


    /**
   *
   * @param Id Organization Id
   */
  getOrganizationById(Id): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}organizations/${Id}`;
    // By Default hide the common loader
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http
      .get(url, { headers })
      .pipe(publishReplay(1), refCount());
  }

  /** Agency APIs */
  /**
   *
   * @param search Search fileds
   */
  public setAgencyListLocal(key: string, value: any) {
    const agencyList = JSON.parse(localStorage.getItem('agencyList')) ?? {};

    agencyList[key] = value;
    localStorage.setItem('agencyList', JSON.stringify(agencyList));
  }
  public getAgencyListLocal() {
    return JSON.parse(localStorage.getItem('agencyList'));
  }

  public removeAgencyListLocal(key:string) {
    const agencyList = this.getAgencyListLocal();
    if(agencyList?.[key]) {
      delete agencyList[key];
    }
    localStorage.setItem('agencyList', JSON.stringify(agencyList));
  }

  public getAgenciesBySearch(searchStr: string, pagination) {
    let url = `${this.config.envSettings['API_ENDPOINT']}agencies?search=${searchStr}&sortBy=name&order=asc`;

    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.get(url, { headers }).pipe(
      publishReplay(1),
      refCount(),
      catchError((error) => {
        this.dropDownAgencies$ = null;
        const errorHandler = this.handleError('getClients', []);
        return errorHandler(error);
      })
    );
  }

  getAgenciesList(
    search = {},
    pagination: AgencyPagination = {},
    sort: Sort = null,
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}agencies/search`;

    if (pagination) {
      url += `?page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (sort && sort?.direction !== '') {
      url += `&sortBy=${sort.active}&order=${sort.direction}`;
    }
    // By Default hide the common loader
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .post(url, search, { headers })
      .pipe(publishReplay(1), refCount());
  }
  exportAgencies(search = {}, sort: Sort = null, noLoader = true): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}agencies/export`;
    if (sort && sort?.direction !== '') {
      url += `?sortBy=${sort.active}&order=${sort.direction}`;
    }

    /** When export we can enable common loader */
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http
      .post(url, search, {  observe: 'response', responseType: 'blob', headers })
      .pipe(publishReplay(1), refCount());
  }

  public createAgency(paylaod, noLoader = true) {
    const url = `${this.config.envSettings['API_ENDPOINT']}agencies`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post(url, paylaod, { headers });
  }

  public updateAgency(vendorId, paylaod, noLoader = true) {
    const url = `${this.config.envSettings['API_ENDPOINT']}agencies/${vendorId}`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.patch(url, paylaod, { headers });
  }
  public deleteAgency(agencyId): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}agencies/${agencyId}`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.delete(url, { headers });
  }

  public getAgencyAssociation(agencyId): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}agencies/${agencyId}/associations`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.get(url, { headers });
  }
  /**
   * Get vendor details by ID
   */
  public getAgencyById(agencyId): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}agencies/${agencyId}`;

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .get<any>(url, { headers })
      .pipe(
        catchError((error) => {
          const agencyErrorHandler = this.handleError(
            'getSpecificAgencyDetails',
            null
          );
          return agencyErrorHandler(error);
        })
      );
  }

  /** End of Agnecy APIs */
  public setContactListLocalSession(key: string, value: any) {
    const contactList = JSON.parse(localStorage.getItem('contactList')) ?? {};
    contactList[key] = value;
    localStorage.setItem('contactList', JSON.stringify(contactList));
  }

  public getContactListLocalSession() {
    return JSON.parse(localStorage.getItem('contactList'));
  }

  public formConatctSearchFiltersForAPI(data) {
    const searchInfo: any = {};
    if (data['name']) {
      searchInfo['search'] = data['name'];
    }
    if (data['company']?.['_id']) {
      searchInfo['filter'] = searchInfo['filter'] ?? {};
      searchInfo['filter']['companyIds'] = [data['company']['_id']];
    }
    if (data['state']?.['_id']) {
      searchInfo['filter'] = searchInfo['filter'] ?? {};
      searchInfo['filter']['states'] = [data['state']['_id']];
    }
    if (data['companyType']?.length) {
      searchInfo['filter'] = searchInfo['filter'] ?? {};
      searchInfo['filter']['companyTypes'] = data['companyType'];
    }
    if (data['city']) {
      searchInfo['filter'] = searchInfo['filter'] ?? {};
      searchInfo['filter']['city'] = data['city'];
    }
    if (data['currentFlag']) {
      searchInfo['filter'] = searchInfo['filter'] ?? {};
      searchInfo['filter']['current'] = data['currentFlag'];
    }
    return searchInfo;
  }

  public createClient(
    payload: CreateClientPayload, noLoader = false
  ): Observable<CreateItemResponse> {
    const url = `${this.config.envSettings['API_ENDPOINT']}clients`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.post<CreateItemResponse>(url, payload, { headers });
  }

  public getClients(searchStr: string, pagination) {
    let url = `${this.config.envSettings['API_ENDPOINT']}clients?sortBy=clientName&order=asc`;
    if (searchStr) {
      url += `&search=${searchStr}`;
    }
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.get(url, { headers }).pipe(
      publishReplay(1),
      refCount(),
      catchError((error) => {
        const errorHandler = this.handleError('getClients', []);
        return errorHandler(error);
      })
    );
  }

  public getDivisions() {

    if (!this.divisions$) {
      const url = `${this.config.envSettings['API_ENDPOINT']}contracts/divisions/search?perPage=50`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.divisions$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.divisions$ = null;
          const errorHandler = this.handleError('getDivisions', []);
          return errorHandler(error);
        })
      );
    }

    return this.divisions$;
  }


  public getOffices(searchStr: string = '', pagination = null) {
    if (!this.offices$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/offices/search`;
      if (pagination) {
        url += `?page=${pagination.page}&perPage=${pagination.perPage}`;
      }
      const filter = {};
      if (searchStr) {
        filter['name'] = searchStr;
      }
      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.offices$ = this.http
        .post<ClientDropDownResponse>(url, filter, { headers })
        .pipe(
          publishReplay(1),
          refCount(),
          catchError((error) => {
            this.offices$ = null;
            const errorHandler = this.handleError('getOffices', []);
            return errorHandler(error);
          })
        );
    }

    return this.offices$;
  }

  public getClientTypes() {

    if (!this.clientTypes$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/client-types/search`;
      // url += `&page=1&perPage=100`;
      
      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.clientTypes$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.clientTypes$ = null;
          const errorHandler = this.handleError('getClientTypes', []);
          return errorHandler(error);
        })
      );
    }

    return this.clientTypes$;
  }


  public getBusinessCategories() {
    if (!this.businessCategories$) {
      const url = `${this.config.envSettings['API_ENDPOINT']}contracts/business-categories/search?perPage=50`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      this.businessCategories$ = this.http
        .post<ClientDropDownResponse>(url, {}, { headers })
        .pipe(
          publishReplay(1),
          refCount(),
          catchError((error) => {
            this.businessCategories$ = null;
            const errorHandler = this.handleError('getBusinessCategories', []);
            return errorHandler(error);
          })
        );
    }

    return this.businessCategories$;
  }

  public getCodeSchemes() {

    if (!this.codeSchemes$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/code-schemes/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.codeSchemes$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.codeSchemes$ = null;
          const errorHandler = this.handleError('getCodeSchemes', []);
          return errorHandler(error);
        })
      );
    }

    return this.codeSchemes$;
  }

  public getCommissionBasis() {

    if (!this.commissionBasis$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/commission-basis/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.commissionBasis$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.commissionBasis$ = null;
          const errorHandler = this.handleError('getCommissionBasis', []);
          return errorHandler(error);
        })
      );
    }

    return this.commissionBasis$;
  }

  public getFeeBasis() {

    if (!this.feeBasis$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/fee-basis/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.feeBasis$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.feeBasis$ = null;
          const errorHandler = this.handleError('getFeeBasis', []);
          return errorHandler(error);
        })
      );
    }

    return this.feeBasis$;
  }

  public getEstTimings() {

    if (!this.estTimings$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/estimate-timings/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.estTimings$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.estTimings$ = null;
          const errorHandler = this.handleError('getEstTimings', []);
          return errorHandler(error);
        })
      );
    }

    return this.estTimings$;
  }

  public getCancellationPrivileges() {

    if (!this.cancellationPrivileges$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/cancellation-privileges/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.cancellationPrivileges$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.cancellationPrivileges$ = null;
          const errorHandler = this.handleError('getEstTimings', []);
          return errorHandler(error);
        })
      );
    }

    return this.cancellationPrivileges$;
  }

  public getContractTermTypes() {

    if (!this.contractTermTypes$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/contract-terms-types/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.contractTermTypes$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.contractTermTypes$ = null;
          const errorHandler = this.handleError('getContractTermTypes', []);
          return errorHandler(error);
        })
      );
    }

    return this.contractTermTypes$;
  }

  public getAgencyTypes() {

    if (!this.agencyTypes$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/agency-type/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.agencyTypes$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.agencyTypes$ = null;
          const errorHandler = this.handleError('getAgencyTypes', []);
          return errorHandler(error);
        })
      );
    }

    return this.agencyTypes$;
  }

  public getAccountingDepartment() {

    if (!this.accountingDepartment$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/accounting-department/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.accountingDepartment$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.accountingDepartment$ = null;
          const errorHandler = this.handleError('getAccountingDepartment', []);
          return errorHandler(error);
        })
      );
    }

    return this.accountingDepartment$;
  }

  public getFileSystemIds() {

    if (!this.filesystemIds$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/filesystem-ids/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.filesystemIds$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.filesystemIds$ = null;
          const errorHandler = this.handleError('getFileSystemIds', []);
          return errorHandler(error);
        })
      );
    }

    return this.filesystemIds$;
  }

  public getPubIdTypes() {

    if (!this.pubIdTypes$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/pubid-types/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.pubIdTypes$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.pubIdTypes$ = null;
          const errorHandler = this.handleError('getPubIdTypes', []);
          return errorHandler(error);
        })
      );
    }

    return this.pubIdTypes$;
  }

  public getInvoiceDeliveries() {

    if (!this.invoiceDeliveries$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/invoice-deliveries/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.invoiceDeliveries$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.invoiceDeliveries$ = null;
          const errorHandler = this.handleError('getInvoiceDeliveries', []);
          return errorHandler(error);
        })
      );
    }

    return this.invoiceDeliveries$;
  }

  public getInvoiceFormat() {

    if (!this.invoiceFormat$) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/invoice-format/search`;

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.invoiceFormat$ = this.http.post<ClientDropDownResponse>(url, {}, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.invoiceFormat$ = null;
          const errorHandler = this.handleError('getInvoiceFormat', []);
          return errorHandler(error);
        })
      );
    }

    return this.invoiceFormat$;
  }

  public getAgencies(filters: AgencyFilterPayload = {} as AgencyFilterPayload, pagination = null) {
    let url = `${this.config.envSettings['API_ENDPOINT']}agencies/search`;

    if (pagination) {
      url += `?page=${pagination.page}&perPage=${pagination.perPage}&sortBy=name&order=asc`;
    }

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.post<any>(url, { ...filters }, { headers }).pipe(
      publishReplay(1),
      refCount(),
      catchError((error) => {
        this.agencies$ = null;
        const errorHandler = this.handleError('getAgencies', []);
        return errorHandler(error);
      })
    );

  }

  public getAgency(agencyId: string) {

    let url = `${this.config.envSettings['API_ENDPOINT']}agencies/${agencyId}`;

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.get<any>(url, { headers }).pipe(
      publishReplay(1),
      refCount(),
      catchError((error) => {
        this.estTimings$ = null;
        const errorHandler = this.handleError('getAgency', []);
        return errorHandler(error);
      })
    );

  }

  public getManagedByUsers(searchText = '' as any, pagination = null) {
    let url = `${this.config.envSettings['API_ENDPOINT_V2']}user/search?sortBy=name&order=asc`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    const filters = {};
    if (searchText) {
      filters['search'] = searchText;
    }
    const headers = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.http.post<any>(url, filters, { headers })
      .pipe(
        map((res) => {
          return {
            pagination: res?.pagination,
            results: res?.result
          };
        }),
        catchError((error) => {
          const errorHandler = this.handleError('getManagedByUsers', []);
          return errorHandler(error);
        })
      );
  }

  public getOperationContacts(searchText = '', pagination = null) {
    let url = `${this.config.envSettings['API_ENDPOINT_V2']}user/search?sortBy=name&order=asc`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    const filtersInfo = {
      filters: {
        roles: {
          operations: {
            write: true
          }
        }
      }
    };
    if (searchText) {
      filtersInfo['search'] = searchText;
    }
    const headers = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.http.post<any>(url, filtersInfo, { headers })
      .pipe(
        map((res) => {
          return {
            pagination: res?.pagination,
            results: res?.result
          };
        }),
        catchError((error) => {
          const errorHandler = this.handleError('getOperationContacts', []);
          return errorHandler(error);
        })
      );
  }

  public getClientsByFilters(filters: FilterClientsPayload, searchStr: string, order: string, sortBy: string, pagination) {

      let url = `${this.config.envSettings['API_ENDPOINT']}clients/search?sortBy=${sortBy}&order=${order}`;

      if (pagination) {
        url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
      }

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

     return this.http.post<FilterClientsResponse>(url, filters, { headers }).pipe(
        catchError((error) => {
          const errorHandler = this.handleError('getClients', []);
          return errorHandler(error);
        })
      );
  }

  public getClientProducts(clientId: string, pagination: RecordsPagination, order: string, sortBy: string, searchStr = null) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/products?sortBy=${sortBy}&order=${order}`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    const { perPage, page } = pagination;
    if (pagination) {
      url += `&page=${page}&perPage=${perPage}`;
    }

    if(searchStr){
      url += `&search=${searchStr}`;
      return this.http.get<ClientProductsResponse>(url, { headers }).pipe(
        catchError((error) => {
          const errorHandler = this.handleError('getClientProducts', []);
          return errorHandler(error);
        })
      );
    } else {
      if (!this.clientProducts$ || (this.clientProducts$ && !this.isSameRequestData({ clientId, perPage, page, order, sortBy } as ClientProductCacheInfo))) {
        this.clientProductCacheInfo =  { clientId, perPage, page, order, sortBy } as ClientProductCacheInfo;
        this.clientProducts$ = this.http.get<ClientProductsResponse>(url, { headers }).pipe(
          publishReplay(1),
          refCount(),
          catchError((error) => {
            this.clientProducts$ = null;
            const errorHandler = this.handleError('getClientProducts', []);
            return errorHandler(error);
          })
        );
      }
      return this.clientProducts$
    }
  }



  public deleteClientProducts(clientId: string, productId: string) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/products/${productId}`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    this.clearClientProducts();
    return this.http.delete(url, { headers });
  }

  public getProductAssociation(productId: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}clients/products/${productId}/associations`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.get(url, { headers });
  }

  public setClientListLocal(key: string, value: any) {
    const cachedData = localStorage.getItem('clientList');
    const clientList = cachedData ? JSON.parse(cachedData) : {};

    clientList[key] = value;
    localStorage.setItem('clientList', JSON.stringify(clientList));
  }

  public getClientListLocal() {
    const cachedData = localStorage.getItem('clientList');
    return cachedData && JSON.parse(cachedData);
  }

  public getClient(clientId: string, noLoader = true) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<FilteredClient>(url, { headers }).pipe(
      catchError((error) => {
        const errorHandler = this.handleError('getClient', []);
        return errorHandler(error);
      })
    );

  }


  public updateClient(clientId, paylaod, noLoader = true) {
    const url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.patch(url, paylaod, { headers });
  }

  public getClientAccounting(clientId: string, noLoader = true) {
    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/accounting`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<ClientsAccountDetails>(url, { headers }).pipe(
      catchError((error) => {
        const errorHandler = this.handleError('getClientAccounting', null);
        return errorHandler(error);
      })
    );
  }

  public updateClientAccounting(clientId: string, acId: string, payload: ClientAccountingPayload, noLoader = true) {
    const url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/accounting`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.patch(url, payload, { headers });
  }

  public showsAlertMessage(msg) {
    const config = {
      duration: 3000
    } as MatSnackBarConfig;
    this.matSnackBar.open(msg, '', config);
  }

  /**
   * @description
   * Export vendor list
   * @param filters export filter data
   * @param exportType export vendor file type
   * @param fieldSet customized column
   */

  public exportVendors(
    filters: VendorSearchPayload,
    exportType = 'csv',
    fieldSet= '',
    sort: Sort = null,
    noLoader = true
    ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}vendors/export?exportType=${exportType}`;

    if (fieldSet) {
      url += `&fieldSet=${fieldSet}`;
    }

    if (sort && sort?.direction !== '') {
      url += `&sortBy=${sort.active}&order=${sort.direction}`;
    }
    /** When export we can enable common loader */
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.post(url, filters, {  observe: 'response', responseType: 'blob', headers });
  }

  public deleteClient(clientId: string) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}`;

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.delete(url, { headers }).pipe(
      catchError((error) => {
        const errorHandler = this.handleError('deleteClient', []);
        return errorHandler(error);
      })
    );

  }


  public createClientProduct(clientId: string, payload: ClientProductDetailsPayload) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/products`;

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    this.clearClientProducts();
    return this.http.post(url, payload, { headers });
  }


  public getClientProduct(clientId: string, productId: string, noLoader = true) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/products/${productId}`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get(url, { headers });
  }


  public updateClientProduct(clientId: string, productId: string, payload: ClientProductDetailsPayload) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/products/${productId}`;

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    this.clearClientProducts();
    return this.http.put(url, payload, { headers });
  }


  public createClientEstimate(clientId: string, payload: ClientEstimatePayload) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/estimates`;

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.post(url, payload, { headers });
  }


  public getClientEstimate(clientId: string, estimateId: string, noLoader = true) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/estimates/${estimateId}`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<ClientEstimateDetailsResponse>(url, { headers }).pipe(
      catchError((error) => {
        const errorHandler = this.handleError('getClientEstimate', null);
        return errorHandler(error);
      })
    );
  }

  public getClientEstimateAssociation(estimateId: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}clients/estimates/${estimateId}/associations`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.get(url, { headers });
  }


  public updateClientEstimate(clientId: string, estimateId: string, payload: ClientEstimatePayload) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/estimates/${estimateId}`;

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.put(url, payload, { headers });
  }

  public deleteClientEstimate(clientId: string, estimateId: string) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/estimates/${estimateId}`;

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.delete(url, { headers });
  }


  public exportClients(payload,  order: string, sortBy: string, pagination, noLoader = true, exportType = 'csv',) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/export?sortBy=${sortBy}&order=${order}&exportType=${exportType}`;

    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post(url, payload, { observe: 'response', responseType: 'blob', headers: headers });
  }



  public getClientLogos(
    clientId: string,
    pagination: RecordsPagination = {
      page: 1,
      perPage: 10
    }
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/logos?sortBy=createdAt&order=desc`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    // By Default hide the common loader
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.get(url, { headers }).pipe(publishReplay(1), refCount());
  }

  public uploadClientLogo(clientId: string, payload: any) {
    const url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/logos?type=document`;
    const data = {
      attachement: payload
    }
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.post(url, payload, { headers });
  }

  public deleteClientLogo(clientId: string, key: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/logos?key=${key}`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.delete(url, { headers });
  }


  public getAgencyLogos(
    agencyId: string,
    pagination: RecordsPagination = {
      page: 1,
      perPage: 10
    }
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}agencies/${agencyId}/logos?sortBy=createdAt&order=desc`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    // By Default hide the common loader
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.get(url, { headers }).pipe(publishReplay(1), refCount());
  }

  public uploadAgencyLogo(agencyId: string, payload: any) {
    const url = `${this.config.envSettings['API_ENDPOINT']}agencies/${agencyId}/logos?type=document`;
    const data = {
      attachement: payload
    }
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.post(url, payload, { headers });
  }

  public deleteAgencyLogo(agencyId: string, key: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}agencies/${agencyId}/logos?key=${key}`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.delete(url, { headers });
  }

  public getVendorAttachments(
    vendorId: string,
    pagination: RecordsPagination = {
      page: 1,
      perPage: 10
    }
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}vendors/${vendorId}/attachments?sortBy=createdAt&order=desc`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    // By Default hide the common loader
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.get(url, { headers }).pipe(publishReplay(1), refCount());
  }

  public uploadVendorAttachment(vendorId: string, payload: any) {
    const url = `${this.config.envSettings['API_ENDPOINT']}vendors/${vendorId}/attachments?type=document`;
    const data = {
      attachement: payload
    }
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.post(url, payload, { headers });
  }

  public deleteVendorAttachment(vendorId: string, key: string, noLoader  = false): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}vendors/${vendorId}/attachments?key=${key}`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.delete(url, { headers });
  }

  public updateVendorShippingAddress(vendorId, paylaod, noLoader = false) {
    const url = `${this.config.envSettings['API_ENDPOINT']}vendors/${vendorId}/shipping-address`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.patch(url, paylaod, { headers });
  }
  public deleteVendorBy(vendorId: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}vendors/${vendorId}`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.delete(url, { headers });
  }

  public getVendorAssociation(vendorId: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}vendors/${vendorId}/associations`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.get(url, { headers });
  }
  public getContactAssociation(contactId: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}contacts/${contactId}/associations`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.get(url, { headers });
  }

  /** get Estimate list  */
  /**
   * @param {EstimateSearchPagination} pagination
   * @param  clientId
   * @param siteName
   */
  getEstmateBySearch(
    clientId,
    pagination: EstimateSearchPagination = {},
    sort: Sort = null,
    siteName = this.siteName
  ): Observable<EstimateSearchResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/estimates?site=${siteName}`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (sort && sort?.direction !== '') {
      url += `&sortBy=${sort.active}&order=${sort.direction}`;
    }

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http
      .get<EstimateSearchResponse>(url, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getEstimateBySearch', null))
      );
  }


   /** get Estimate list  */
  /**
   * @param {EstimateSearchPagination} pagination
   * @param {EstimateSearchFilter} payload
   * @param  clientId
   * @param siteName
   */
  getEstmate(
    payload: EstimateSearchFilter,
    clientId,
    pagination: EstimateSearchPagination = {},
    sort: Sort = null,
    siteName = this.siteName,
    estimateGroup = false
  ): Observable<EstimateSearchResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/estimates/search?site=${siteName}`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (sort && sort?.direction !== '') {
      url += `&sortBy=${sort.active}&order=${sort.direction}`;
    }
    if (estimateGroup) {
      url += `&estimateGroup=${estimateGroup}`;
    }

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http
      .post<EstimateSearchResponse>(url,  payload, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getEstmate', null))
      );
  }

  public deleteEstimateById(estimateId: string, clientId:string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/estimates/${estimateId}`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.delete(url, { headers });
  }

  public deleteEstimateDateById(estimateId: string, clientId:string, itemId:string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/estimates/${estimateId}/items/${itemId}`;
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.delete(url, { headers });
  }


  /** Vendor Notes */

    /**
   * Get vendor details by ID
   */
  public getNoteDetailsId(noteParentId: string, pagination:NotePagination, moduleName:string, organizationId = null, noLoader = true): Observable<any> {
    let url = this.getNoteURL(noteParentId, moduleName, organizationId);
    let headers: HttpHeaders;
    url += `?sortBy=updatedAt&order=desc`;
     if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http
      .get<any>(url, { headers })
      .pipe(
        catchError((error) => {
          const NoteErrorHandler = this.handleError(
            'getNoteDetailsId',
            null
          );
          return NoteErrorHandler(error);
        })
      );
  }

  public createNoteByModuleName(noteParentId: string, payload, moduleName:string, organizationId = null) {
    let url = this.getNoteURL(noteParentId, moduleName, organizationId);
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.post(url, payload, { headers });
  }

  public updateNoteByModuleName(noteParentId: string, noteId:string, payload, moduleName:string, organizationId = null) {
    let url = this.getUpdateNoteURL(noteParentId,noteId,moduleName,organizationId);
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.patch(url, payload, { headers });
  }

  public deleteNoteByModuleName(noteParentId: string, noteId:string, moduleName:string, organizationId = null) {
    let url = this.getUpdateNoteURL(noteParentId,noteId,moduleName,organizationId);
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.delete(url, { headers });
  }

 // Format the Note url for GET or POST
  private getNoteURL(noteParentId: string, moduleName:string, organizationId = null){
    let url;
      switch (moduleName) {
      case 'vendor':
          url = `${this.config.envSettings['API_ENDPOINT']}vendors/${noteParentId}/notes`;
        break;

      case 'contact':
          url = `${this.config.envSettings['API_ENDPOINT']}contacts/${noteParentId}/notes`;
        break;

      case 'vendorContact':
          url = `${this.config.envSettings['API_ENDPOINT']}vendors/${organizationId}/contacts/${noteParentId}/notes`;
        break;

      case 'clientContact':
          url = `${this.config.envSettings['API_ENDPOINT']}clients/${organizationId}/contacts/${noteParentId}/notes`;
        break;

      case 'agencyContact':
          url = `${this.config.envSettings['API_ENDPOINT']}agencies/${organizationId}/contacts/${noteParentId}/notes`;
        break;

      case 'client':
          url = `${this.config.envSettings['API_ENDPOINT']}clients/${noteParentId}/notes`;
        break;

      case 'agency':
           url = `${this.config.envSettings['API_ENDPOINT']}agencies/${noteParentId}/notes`;
        break;

      case 'clientAccounting':
           url = `${this.config.envSettings['API_ENDPOINT']}clients/${noteParentId}/accounting/notes`;
        break;
      default:
        break;
    }
    return url;
  }

  // Format the Note url for PATCH or DELETE
  private getUpdateNoteURL(noteParentId: string, noteId:string, moduleName:string, organizationId = null){
    let url;

    switch (moduleName) {
      case 'vendor':
        url = `${this.config.envSettings['API_ENDPOINT']}vendors/${noteParentId}/notes/${noteId}`;
        break;

      case 'contact':
        url = `${this.config.envSettings['API_ENDPOINT']}contacts/${noteParentId}/notes/${noteId}`;
        break;

      case 'vendorContact':
          url = `${this.config.envSettings['API_ENDPOINT']}vendors/${organizationId}/contacts/${noteParentId}/notes/${noteId}`;
        break;

      case 'clientContact':
          url = `${this.config.envSettings['API_ENDPOINT']}clients/${organizationId}/contacts/${noteParentId}/notes/${noteId}`;
        break;

      case 'agencyContact':
          url = `${this.config.envSettings['API_ENDPOINT']}agencies/${organizationId}/contacts/${noteParentId}/notes/${noteId}`;
        break;

      case 'client':
          url = `${this.config.envSettings['API_ENDPOINT']}clients/${noteParentId}/notes/${noteId}`;
        break;

      case 'agency':
           url = `${this.config.envSettings['API_ENDPOINT']}agencies/${noteParentId}/notes/${noteId}`;
        break;

      case 'clientAccounting':
           url = `${this.config.envSettings['API_ENDPOINT']}clients/${noteParentId}/accounting/notes/${noteId}`;
        break;
      default:
        break;
    }
    return url;
  }

  public updateLogoCaption(organizationId: string, key: string, caption: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}attachments/${organizationId}?key=${key}`;
    const data = {
      caption: caption
    }
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.patch(url, data, { headers });
  }


  public getZipCodes(searchText = '' as any, pagination = null): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}locations/zipcodes?sortBy=ZipCode&order=asc&fieldSet=ZipCode,City,State`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (searchText) {
      searchText = searchText?.ZipCode ? '' : searchText;
      url += `&zipcode=${searchText}`;
    }
    const headers = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.http.get<any>(url, { headers })
      .pipe(
        catchError((error) => {
          const errorHandler = this.handleError('getZipCodes', []);
          return errorHandler(error);
        })
      );
  }

  public clearClientProducts(): void {
    this.clientProducts$ = null;
  }

  isSameRequestData(requestData: ClientProductCacheInfo): boolean {
    const keys = ['clientId', 'perPage', 'page', 'order', 'sortBy'];
    for(let key of keys) {
      if(this.clientProductCacheInfo?.[key] != requestData?.[key]) {
        return false;
      }
    }
    return true;
  };

  public formatManageByResult(items: any): any[] {
    if(!Array.isArray(items)) return [];
    return items.map(contact => {
      if(contact.hasOwnProperty('name')) return contact;
      const { id, firstName, lastName } = contact || {};
      return { id,  name: `${firstName} ${lastName}` };
    });
  }

}
