import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { catchError, publishReplay, refCount } from 'rxjs/operators';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ClientDropDownResponse, FilterClientsPayload, FilterClientsResponse } from '@interTypes/records-management';

@Injectable()
export class ClientsService {
  public handleError;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT'];

  private siteName: string;
  private offices$: Observable<any>;
  private divisions$: Observable<any>;

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
      'Clients Service'
    );
  }

  public getProductsByClientId(
    clientId: string,
    perPage = '10',
    noLoader: boolean = false,
    oiProduct = null,
  ) {
    let url = `${this.baseUrl}clients/${clientId}/products?perPage=${perPage}`;

    if (oiProduct?.toString().length) {
      url += `&oiProduct=${oiProduct}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .get<any>(url, { headers })
      .pipe(
        catchError((err) => {
          this.showsAlertMessage(err.message);

          return of({});
        })
      );
  }

  public getClientProduct(
    clientId: string,
    productId: string,
    noLoader = true
  ) {
    const url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/products/${productId}`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get(url, { headers }).pipe(
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


  public getOffices(searchStr: string = '', pagination = null) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/offices/search`;
      if (pagination) {
        url += `?page=${pagination.page}&perPage=${pagination.perPage}`;
      }
      const filter = {};
      if (searchStr) {
        filter['search'] = searchStr;
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

    return this.offices$;
  }

  public getDivisions(searchStr: string = '', pagination = null) {
      let url = `${this.config.envSettings['API_ENDPOINT']}contracts/divisions/search`;
      if (pagination) {
        url += `?page=${pagination.page}&perPage=${pagination.perPage}`;
      }
      const filter = {};
      if (searchStr) {
        filter['search'] = searchStr;
      }
      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      this.divisions$ = this.http.post<ClientDropDownResponse>(url, filter, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error) => {
          this.divisions$ = null;
          const errorHandler = this.handleError('getDivisions', []);
          return errorHandler(error);
        })
      );

    return this.divisions$;
  }

  public getBuyerUsers(searchStr: string = '', pagination = null) {
    const baseUrl: string = this.config.envSettings['API_ENDPOINT'];
    let url = `${baseUrl}admin/users`
    if (pagination) {
      url += `?page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    const filter = {
      filters: {
        group: "OMG Buyer"
      }
    };
    if (searchStr) {
      filter['search'] = searchStr;
    }

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.post<ClientDropDownResponse>(url, filter, { headers });
  }
}
