import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { catchError, publishReplay, refCount } from 'rxjs/operators';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { Helper } from 'app/classes/helper';
import { Observable } from 'rxjs/internal/Observable';
import { VendorTypesResponse } from '@interTypes/vendor';
import { Vendor, VendorSearchPayload, VendorsSearchPagination, VendorsSearchResponse } from '@interTypes/inventory-management';
import { Sort } from '@angular/material/sort';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  public handleError;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT'];

  private siteName: string;

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

  public vendorsListSearch(
    body?: any,
    perPage = '10',
    noLoader: boolean = false,
    params = {}
  ) {
    const url = Helper.formatUrlWithParams(
      `${this.baseUrl}vendors/search`,
      params
    );
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post<any>(url, body, { headers, params: { perPage } })
      .pipe(
        catchError((err) => {
          this.showsAlertMessage(err.message);
          return of({});
        })
      );
  }

  /** to get child vendors list only */
  public childVendorsListSearch(
    body = {},
    perPage = '10',
    noLoader: boolean = false,
    params = {}
  ) {
    const url = Helper.formatUrlWithParams(
      `${this.baseUrl}vendors/search`,
      params
    );
    let headers: HttpHeaders;
    (noLoader) ? headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }) : '';
    body['filters'] = { ...body['filters'], parentFlag: false };

    return this.http
      .post<any>(url, body, { headers, params: { perPage } })
      .pipe(
        catchError((err) => {
          this.showsAlertMessage(err.message);
          return of({});
        })
      );
  }

  public searchContactsAll(
    body = {},
    pagination = {},
    noLoader = false
  ) {
    const url = `${this.baseUrl}contacts/search`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http
      .post<any>(
        url,
        body,
        {
          headers,
          params: {
            perPage: pagination['perPage'], page: pagination['page'], sortBy: 'firstName', order: 'asc'
          }
        }
      )
      .pipe(
        catchError((err) => {
          this.showsAlertMessage(err?.error?.message ?? err.message);
          return of({});
        })
      );
  }


  public getVendorByOrgId(
    vendorOrganizationId: string,
    body?: any,
    perPage?: string,
    noLoader: boolean = false
  ) {
    const url = `${this.baseUrl}vendors/${vendorOrganizationId}/contacts/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post<any>(url, body, { headers, params: { perPage } })
      .pipe(
        catchError((err) => {
          this.showsAlertMessage(err.message);

          return of({});
        })
      );
  }

  public getDesignatorByVendorId(
    vendorId: string,
    perPage?: string,
    noLoader: boolean = false
  ) {
    const url = `${this.baseUrl}vendors/${vendorId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .get<any>(url, { headers, params: { perPage } })
      .pipe(
        catchError((err) => {
          this.showsAlertMessage(err.message);

          return of({});
        })
      );
  }

  public organizationSearch(
    body = {},
    perPage?: string | number,
    noLoader = false
  ) {
    const url = `${this.baseUrl}organizations/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post<any>(url, body ?? {}, {
        headers,
        params: { perPage: String(perPage) }
      })
      .pipe(
        catchError((err) => {
          this.showsAlertMessage(err.message);

          return of({});
        })
      );
  }

  public contactsSearch(
    search: string,
    perPage?: string | number,
    companyId?: string,
    noLoader = false
  ) {
    const url = `${this.baseUrl}contacts/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post<any>(
        url,
        companyId
          ? {
              search: search || undefined,
              filter: {
                companyIds: [companyId]
              }
            }
          : {},
        {
          headers,
          params: { perPage: String(perPage) }
        }
      )
      .pipe(
        catchError((err) => {
          this.showsAlertMessage(err.message);

          return of({});
        })
      );
  }

  private showsAlertMessage(msg) {
    const config: MatSnackBarConfig = {
      duration: 3000
    };

    this.matSnackBar.open(msg, '', config);
  }

  public getVendorsTypes(
    siteName = this.siteName
  ): Observable<VendorTypesResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}vendors/vendortype/search?site=${siteName}&page=1&perPage=100`;
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
      fieldSets:string = '',
      siteName = this.siteName
    ): Observable<VendorsSearchResponse> {
      let url = `${this.config.envSettings['API_ENDPOINT']}vendors/search?site=${siteName}`;
      if (pagination) {
        url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
      }
      if (sort && sort?.direction !== '') {
        url += `&sortBy=${sort.active}&order=${sort.direction}`;
      }
      if(fieldSets !=''){
        url += `&fieldSet=${fieldSets}`;
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
            'getVendorById',
            null
          );
          return vendorErrorHandler(error);
        })
      );
  }

  public getContactById(contactId, noLoader = false): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}contacts/${contactId}`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.get(url, { headers });
  }
}
