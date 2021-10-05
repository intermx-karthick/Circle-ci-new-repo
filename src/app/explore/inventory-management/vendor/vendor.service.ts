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
import { AppConfig } from '../../../app-config.service';
import { catchError, publishReplay, refCount } from 'rxjs/operators';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import {
  VendorsGroupPagination,
  VendorsGroupSearchResponse
} from '@interTypes/vendor/vendor-group-search';
import {Sort} from '@angular/material/sort';
import { VendorTypesPagination, VendorTypesResponse } from '@interTypes/vendor';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  public handleError;
  private savedVendorsGroup$: Observable<VendorsGroupSearchResponse> = null;
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
   *
   * @param paylaod Vendor update payload data
   * @param vendorid updated vendor id
   * @param noLoader common loader
   */

  public updateVendor(paylaod, vendorid, noLoader = true): Observable<VendorUpdateResponse> {
    const url = `${this.config.envSettings['API_ENDPOINT']}vendors/${vendorid}`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .put<VendorUpdateResponse>(url, paylaod, { headers })
      .pipe(catchError(this.handleError('update vendor', null)));
  }

  public updateAttachment(file, id, module = 'vendors'): Observable<any> {
    let moduleParam = '';
    let typeParam = '';

    if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.fileType)) {
      moduleParam = module + '/logos';
      typeParam = 'logo';
    } else {
      moduleParam = module + '/docs';
      typeParam = 'document';
    }

    const url = `${this.config.envSettings['API_ENDPOINT']}vendors/${id}/upload?module=${moduleParam}&type=${typeParam}`;

    return this.http.patch(url, file.fileFormData).pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }

  /**
   * getSpecificVendorDetails
   */
  public getSpecificVendorDetails(vendorId, noLoader = false): Observable<Vendor> {
    const url = `${this.config.envSettings['API_ENDPOINT']}vendors/${vendorId}`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<Vendor>(url, { headers }).pipe(
      catchError((error) => {
        const getSpecificVendorDetailsErrorHandler = this.handleError(
          'getSpecificVendorDetails',
          null
        );
        return getSpecificVendorDetailsErrorHandler(error);
      })
    );
  }
  /**
   * @description
   *   To get the vendors group
   * @param paylaod
   * @param noLoader - common API loader
   * @param siteName - site name
   */
  public getVendorsGroup(
    paylaod: VendorsGroupPagination = {},
    noLoader = true,
    siteName = this.siteName
  ): Observable<VendorsGroupSearchResponse> {
    if (!this.savedVendorsGroup$) {
      const url = `${this.config.envSettings['API_ENDPOINT']}vendors/vendorgroups/search?site=${siteName}`;
      let headers: HttpHeaders;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }

      this.savedVendorsGroup$ = this.http
        .post<VendorsGroupSearchResponse>(url, paylaod, { headers })
        .pipe(
          publishReplay(1),
          refCount(),
          catchError((error) => {
            this.savedVendorsGroup$ = null;
            const savedVendorsGroupErrorHandler = this.handleError(
              'getVendorsGroup',
              null
            );
            return savedVendorsGroupErrorHandler(error);
          })
        );
    }

    return this.savedVendorsGroup$;
  }

   /**
  *
  * @param search Search fileds
  * @param {VendorsSearchPagination} pagination
  * @param {boolean} [noLoader=true]
  * @param siteName
  */
 getVendorsGroupSearch(search = {}, pagination: VendorsGroupPagination = {}, noLoader = true, siteName = this.siteName):Observable<VendorsGroupSearchResponse> {

  let url =  `${this.config.envSettings['API_ENDPOINT']}vendors/vendorgroups/search?site=${siteName}`;

  if (pagination) {
    url = `${url}&page=${pagination.page}&perPage=${pagination.perPage}`;
  }

  let headers: HttpHeaders;
  if (noLoader) {
    headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
  }
  return this.http.post<VendorsGroupSearchResponse>(url, search, { headers })
     .pipe(
       publishReplay(1),
       refCount(),
       catchError(this.handleError('getVendorsGroupSearch', null)),
     );
}


  clearCaches() {
    this.savedVendorsGroup$ = null;
  }

  deleteAttachment(vendorId, key, noLoader = false) {
    const url =
      this.config.envSettings['API_ENDPOINT'] +
      'vendors/' +
      vendorId +
      '/remove?key=' +
      key;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.delete(url, { headers: headers });
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
    noLoader = true,
    siteName = this.siteName
  ): Observable<VendorsSearchResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}vendors/search?site=${siteName}`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (sort && sort?.direction !== '') {
      url += `&sortField=${sort.active}&sortOrder=${sort.direction}`;
    }
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({'hide-loader': 'hide-loader'});
    }
    return this.http
      .post<VendorsSearchResponse>(url, search, {headers})
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getVendorBySearch', null))
      );
  }

  /**
   * @description
   *  To get the vendor types from the API.
   * @param {VendorsSearchPagination} pagination
   * @param {boolean} [noLoader=true]
   * @param siteName
   */
  getVendorsTypesSearch(pagination: VendorTypesPagination = {}, noLoader = true, siteName = this.siteName):Observable<VendorTypesResponse> {

    let url =  `${this.config.envSettings['API_ENDPOINT']}vendors/vendortype/search?site=${siteName}`;

    if (pagination) {
      url = `${url}&page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.get<VendorTypesResponse>(url, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getVendorsTypesSearch', null)),
      );
  }

  /**
   * @description
   *  To get the vendor Diversity Ownerships from the API.
   * @param {VendorsSearchPagination} pagination
   * @param {boolean} [noLoader=true]
   * @param siteName
   */
  getVendorsDiversityOwnerships(pagination: VendorTypesPagination = {}, noLoader = true, siteName = this.siteName):Observable<VendorTypesResponse> {

    let url =  `${this.config.envSettings['API_ENDPOINT']}vendors/diversityownership/search?site=${siteName}`;

    if (pagination) {
      url = `${url}&page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<VendorTypesResponse>(url, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getVendorsDiversityOwnerships', null)),
      );
  }
}
