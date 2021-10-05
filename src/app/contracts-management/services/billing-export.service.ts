import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { HttpErrorHandlerService, ThemeService } from '../../shared/services';
import { AppConfig } from '../../../app/app-config.service';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApiIncoming } from "../models";
import { PeriodLength } from "../models/period-length.model";
import {
  ContractLineItem,
  ContractLineItemsApiResponce
} from '../models/contract-line-item.model';
import { Pagination } from '../models/pagination.model';

@Injectable()
export class BillingExportService {
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
      'Contracts Service'
    );
  }

  public setContractDetailLineItemProp(key: string, value: any) {
    const lineItems =
      JSON.parse(localStorage.getItem('contractDetailsLineItems')) ?? {};

    lineItems[key] = value;
    localStorage.setItem('contractDetailsLineItems', JSON.stringify(lineItems));
  }
  
  public searchAllBillings(
    sort: Sort = null,
    pagination: Pagination = null,
    fieldSet = [],
    filter,
    noLoader: boolean = true
  ): Observable<any> {
    let url = `${this.baseUrl}contracts/billing-exports/search`;

    if (!!sort) {
      url = `${url}?sortBy=${sort.active}&order=${sort.direction}`;
    }

    if (!!pagination) {
      const nestSymbol = sort ? '&' : '?';
      url = `${url}${nestSymbol}page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    if (Array.isArray(fieldSet) && fieldSet.length) {
      const nestSymbol = sort ? '&' : '?';
      url = `${url}${nestSymbol}fieldSet=${fieldSet.join(',')}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post(url, { filter }, { headers: headers}).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.error ? err.error.code === 101010 ? `Don't have permission` : err.error.message : err.message);
        return of(null);
      })
    );
  }

  /**
   * 
   * @param sort Set the export sorting
   * @param filter | export search payload
   * @returns 
   */

  public billingExports(
    sort: Sort = null,
    filter,
    offline = false
  ): Observable<any> {
    let url = `${this.baseUrl}reports/billing-exports`;
    if (!!sort) {
      url = `${url}?sortBy=${sort.active}&order=${sort.direction}`;
    }
    if (!!offline) {
      const nestSymbol = sort ? '&' : '?';
      url = `${url}${nestSymbol}offline=${offline}`;
    }
    return this.http.post(url, { filter }).pipe(
      catchError((err) => {
        const error = err?.error?.message ?? err.message;
        this._showsAlertMessage(error);
        return of(null);
      })
    );
  }

  public getArchivedExports(
    payload: any = {},
    pagination: Pagination = null,
    sort: Sort = null,
    noLoader = false
  ): Observable<any> {

    let url = `${this.baseUrl}reports/search`;
    url = `${url}?sortBy=${sort?.active || 'id'}&order=${sort?.direction || 'asc'}`;
    url = `${url}&page=${pagination?.page || 1}&perPage=${pagination?.perPage || 10}`;

    let filters = { ...payload };
    filters['module'] = "billing-exports";

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post(url, { filters }, { headers }).pipe(
      catchError((err) => {
        const error = err?.error?.message ?? err.message;
        this._showsAlertMessage(error);
        return of(null);
      })
    );
  }

  public _showsAlertMessage(msg) {
    const config: MatSnackBarConfig = {
      duration: 3000
    };

    this.matSnackBar.open(msg, '', config);
  }
}