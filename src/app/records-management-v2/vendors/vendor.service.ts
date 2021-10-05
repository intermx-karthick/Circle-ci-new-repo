import {
  Vendor,
  VendorUpdateResponse,
  VendorsSearchPagination,
  VendorsSearchResponse,
  VendorSearchPayload
} from '@interTypes/inventory-management';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import { AppConfig } from '../../app-config.service';
import { catchError, publishReplay, refCount } from 'rxjs/operators';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import {
  VendorsGroupPagination,
  VendorsGroupSearchResponse
} from '@interTypes/vendor/vendor-group-search';
import {
  StateSearchPagination,
  StateSearchResponse
} from '@interTypes/vendor/state';
import { Sort } from '@angular/material/sort';
import { VendorTypesPagination, VendorTypesResponse } from '@interTypes/vendor';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  public handleError;
  private siteName: string;

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private theme: ThemeService
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
      url += `&sortField=${sort.active}&sortOrder=${sort.direction}`;
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
    let headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .post<StateSearchResponse>(url, search, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getVendorsStateSearch', null))
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
    search = {},
    pagination: VendorsGroupPagination = {},
    siteName = this.siteName
  ): Observable<VendorsGroupSearchResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}vendors/vendorgroups/search?site=${siteName}`;

    if (pagination) {
      url = `${url}&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    // By Default hide the common loader
    let headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .post<VendorsGroupSearchResponse>(url, search, { headers })
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
      .post(url, paylaod, { headers })
      .pipe(catchError(this.handleError('create vendor', null)));
  }

  /**
   * Get vendor details by ID
   */
  public getVendorById(vendorId): Observable<Vendor> {
    const url = `${this.config.envSettings['API_ENDPOINT']}vendors/${vendorId}`;

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

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

}
