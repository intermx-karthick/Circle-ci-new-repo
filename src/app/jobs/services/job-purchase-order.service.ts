import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { Sort } from "@angular/material/sort";

import { AppConfig } from "app/app-config.service";
import { HttpErrorHandlerService, ThemeService } from "@shared/services";

import {
    JobsPagination,
    JobPurchaseOrderResponse,
} from "../interfaces";

import { Observable, of } from "rxjs";
import { catchError, tap } from "rxjs/operators";

@Injectable()
export class JobPurchaseOrderService {

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
            'Job Purchase Order Service'
        );
    }

    public getPurchaseOrderListByJobID(
        jobID: string,
        sort: Sort = null,
        pagination: JobsPagination = null,
        fieldSet = [],
        noLoader: boolean = false
    ): Observable<JobPurchaseOrderResponse> {

        let url: string = `${this.baseUrl}print-production/jobs/${jobID}/purchase-orders`;

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

        return this.http.post<JobPurchaseOrderResponse>(url, {}, { headers })
            .pipe(catchError((err) => {
                this._showsAlertMessage(err.message)
                return of({} as JobPurchaseOrderResponse);
            }
            ));
    }

    public getPurchaseOrderAttachments(
        jobID: string,
        printerID: string,
        pagination: any,
    ): Observable<any> {
        let url = `${this.baseUrl}print-production/jobs/${jobID}/signed-upload/${printerID}/attachments?sortBy=createdAt&order=desc`;
        url += `&page=${pagination?.page || 1}&perPage=${pagination?.perPage || 10}`;

        const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

        return this.http.get(url, { headers });
    }

    public uploadPurchaseOrderAttachment(
        jobID: string,
        printerID: string,
        payload: File | any,
    ) {
        let url = `${this.baseUrl}print-production/jobs/${jobID}/signed-upload/${printerID}/attachments?type=document&module=print-production/printer/docs`;

        const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

        return this.http.post(url, payload, { headers });
    }

    public updatePurchaseOrderAttachment(
        jobID: string,
        printerID: string,
        attachmentId: string,
        name: any,
    ) {
        const url = `${this.baseUrl}print-production/jobs/${jobID}/signed-upload/${printerID}/attachments/${attachmentId}`;
        const payload = {
            caption: name,
        };
        const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

        return this.http.patch(url, payload, { headers });
    }

    public deletePurchaseOrderAttachment(
        jobID: string,
        printerID: string,
        attachmentId: string,
        noLoader = false
    ): Observable<any> {
        const url = `${this.baseUrl}print-production/jobs/${jobID}/signed-upload/${printerID}/attachments/${attachmentId}`;
        let headers: HttpHeaders;
        if (noLoader) {
            headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
        }

        return this.http.delete(url, { headers });
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