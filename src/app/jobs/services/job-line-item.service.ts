import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { Sort } from "@angular/material/sort";

import { AppConfig } from "app/app-config.service";
import { HttpErrorHandlerService, ThemeService } from "@shared/services";

import {
    JobsPagination,
    JobLineItemsResponse,
    JobLineItemDetails,
} from "../interfaces";

import { Observable, of } from "rxjs";
import { catchError, tap } from "rxjs/operators";

@Injectable()
export class JobLineItemService {

    public handleError;

    private baseUrl: string = this.config.envSettings['API_ENDPOINT'];

    private siteName: string;

    constructor(
        private http: HttpClient,
        private config: AppConfig,
        private httpErrorHandler: HttpErrorHandlerService,
        private theme: ThemeService,
        private matSnackBar: MatSnackBar,
    ) {
        const themeSettings = this.theme.getThemeSettings();
        this.siteName = themeSettings && themeSettings.site;
        this.handleError = this.httpErrorHandler.createHandleError(
            'Job Line Item Service'
        );
    }

    public getLineItemListByJobID(
        jobID: string,
        sort: Sort = null,
        pagination: JobsPagination = null,
        fieldSet = [],
        noLoader: boolean = false
    ): Observable<JobLineItemsResponse> {

        let url: string = `${this.baseUrl}print-production/jobs/${jobID}/line_items`;

        url = `${url}?page=${pagination?.page || 1}&perPage=${pagination?.perPage || 10}`

        if (!!sort && sort?.active) {
            url = `${url}&sortBy=${sort?.active}&order=${sort?.direction}`
        }

        if (!!fieldSet && Array.isArray(fieldSet) && fieldSet.length) {
            url = `${url}&fieldSet=${fieldSet.join(',')}`
        }

        let headers: HttpHeaders;
        if (noLoader) {
            headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
        }

        return this.http.get<any>(url, { headers })
            .pipe(catchError((err) => {
                this._showsAlertMessage(err.message)
                return of({} as any);
            }
            ));
    }

    public deleteJobLineItem(
        jobID: string,
        lineItemId: string,
        noLoader = false
    ) {
        const url = `${this.baseUrl}print-production/jobs/${jobID}/line_items/${lineItemId}`;

        let headers: HttpHeaders;
        if (noLoader) {
            headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
        }

        return this.http.delete(url, { headers }).pipe(
            catchError((errorRes) => {
                const errorHandler = this.handleError(
                    'deleteJobLineItem',
                    {}
                );
                return errorHandler(errorRes);
            }),
            tap(this.alertOnError.bind(this))
        );
    }


    public getLineItemDetailsByLineItemID(
        jobID: string,
        lineItemId: string,
        fieldSet = [],
        noLoader: boolean = false
    ): Observable<JobLineItemDetails> {

        let url: string = `${this.baseUrl}print-production/jobs/${jobID}/line_items/${lineItemId}`;

        if (!!fieldSet && Array.isArray(fieldSet) && fieldSet.length) {
            url = `${url}?fieldSet=${fieldSet.join(',')}`
        }

        let headers: HttpHeaders;
        if (noLoader) {
            headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
        }

        return this.http.get<JobLineItemDetails>(url, { headers })
            .pipe(catchError((err) => {
                this._showsAlertMessage(err.message)
                return of({} as any);
            }
            ));
    }

    public getLineItemBySearch(
        jobID: string,
        payload: any = {},
        fieldSet: Array<String> = [],
        noLoader = false
      ): Observable<JobLineItemsResponse> {
        let url = `${this.baseUrl}print-production/jobs/${jobID}/line_items/search`;

        if (!!fieldSet && Array.isArray(fieldSet) && fieldSet.length) {
            url = `${url}?fieldSet=${fieldSet.join(',')}`
        }

        let headers;
        if (noLoader) {
          headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
        }
        return this.http.post<JobLineItemsResponse>(url, payload, { headers }).pipe(
          catchError((err) => {
            this._showsAlertMessage(err.message);
            return of(null);
          })
        );
      }

  public getLineItemListBySearch(
    payload: any = {},
    fieldSet: Array<String> = [],
    sort: Sort = null,
    pagination: JobsPagination = null,
    noLoader = false
  ): Observable<JobLineItemsResponse> {
    let url = `${this.baseUrl}print-production/line_items/search`;

    url = `${url}?page=${pagination?.page || 1}&perPage=${
      pagination?.perPage || 10
    }`;

    if (!!sort && sort?.active) {
      url = `${url}&sortBy=${sort?.active}&order=${sort?.direction}`
    }

    if (!!fieldSet && Array.isArray(fieldSet) && fieldSet.length) {
      url = `${url}&fieldSet=${fieldSet.join(',')}`
    }

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.post<JobLineItemsResponse>(url, payload, { headers }).pipe(
        catchError((err) => {
          this._showsAlertMessage(err.message);
          return of(null);
      })
    );
  }

  exportLineItems(
    payload,
    fieldSet = '',
    sort: Sort = null,
    noLoader = false
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}print-production/line_items/export`;

    sort && sort?.direction !== ''
      ? (url += `?sortBy=${sort.active}&order=${sort.direction}`)
      : '';

    let headers;
    noLoader
      ? (headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }))
      : '';

    return this.http.post(url, payload, {
      observe: 'response',
      responseType: 'blob',
      headers
    });
  }

    private _showsAlertMessage(msg) {
        const config: MatSnackBarConfig = {
            duration: 3000
        };

        this.matSnackBar.open(msg, '', config);
    }

    private alertOnError(errorRes) {
        if (errorRes?.error?.message) {
            this._showsAlertMessage(errorRes?.error?.message);
        }
    }

}
