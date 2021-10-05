import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { Sort } from "@angular/material/sort";
import { Pagination } from "app/contracts-management/models/pagination.model";
import { HttpErrorHandlerService, ThemeService } from "@shared/services";
import { AppConfig } from "app/app-config.service";
import { Observable, of } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import {
    InsertionOrderFilters,
    InsertionOrdersResponse
} from "../models";

@Injectable()
export class InsertionOrdersService {

    public handleError;

    private baseUrl: string = this.config.envSettings['API_ENDPOINT'];

    private siteName: string;
      private readonly INSERTION_ORDER_LOCAL_STORAGE_KEY = 'insertionOrderOutList';


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
            'Insertion Orders Service'
        );
    }

    public getInsertionOrders(
        filters: InsertionOrderFilters = {} as InsertionOrderFilters,
        sort: Sort = null,
        pagination: Pagination = null,
        fieldSet = [],
        noLoader: boolean = false
    ): Observable<InsertionOrdersResponse> {

        let url: string = `${this.baseUrl}contracts/iodates/search`;

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

        return this.http.post<InsertionOrdersResponse>(url, filters, { headers })
            .pipe(catchError((err) => {
                this._showsAlertMessage(err.message)
                return of({} as InsertionOrdersResponse);
            }
            ));
    }

    public exportInsertionOrders(
        filters: InsertionOrderFilters = {} as InsertionOrderFilters,
        sort: Sort = null,
        noLoader = false
    ): Observable<any> {
        let url = `${this.baseUrl}contracts/line_items/iodates/export`;

        if (!!sort && sort?.active) {
            url = `${url}?sortBy=${sort?.active}&order=${sort?.direction}`
        }

        let headers;
        (noLoader) ?
            (headers = new HttpHeaders({ 'hide-loader': 'hide-loader' })) : '';

        return this.http
            .post(url, filters, {
                observe: 'response',
                responseType: 'blob',
                headers
            })
            .pipe(catchError((err) => {
                this._showsAlertMessage(err.message)
                return of({});
            }
            ));
    }

    public deleteInsertionOrder(
        ioItemId: string,
        noLoader = false
      ) {
        const url = `${this.baseUrl}contracts/iodates/${ioItemId}`;
    
        let headers: HttpHeaders;
        if (noLoader) {
          headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
        }
    
        return this.http.delete(url, { headers }).pipe(
          catchError((errorRes) => {
              const errorHandler = this.handleError(
                  'deleteInsertionOrder',
                  {}
              );
              return errorHandler(errorRes);
          }),
          tap(this.alertOnError.bind(this))
        );
      }
    
    public setInsertionOrderListLocal(key: string, value: any) {
    try {
        const lineItemList =
        JSON.parse(
            localStorage.getItem(this.INSERTION_ORDER_LOCAL_STORAGE_KEY)
        ) ?? {};

        lineItemList[key] = value;
        localStorage.setItem(
        this.INSERTION_ORDER_LOCAL_STORAGE_KEY,
        JSON.stringify(lineItemList)
        );
        } catch (e) {
            console.log(e);
        }
    }

    public getInsertionOrderListLocal() {
    return JSON.parse(
        localStorage.getItem(this.INSERTION_ORDER_LOCAL_STORAGE_KEY)
    );
    }

    public removeAllFromInsertionOrderListLocal() {
        localStorage.removeItem(this.INSERTION_ORDER_LOCAL_STORAGE_KEY);
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