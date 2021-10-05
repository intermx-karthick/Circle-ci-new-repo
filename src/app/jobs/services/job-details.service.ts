import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { Sort } from "@angular/material/sort";

import { AppConfig } from "app/app-config.service";
import { HttpErrorHandlerService, ThemeService } from "@shared/services";


import {
    JobsPagination,
    JobDetails,
    JobDetailsDropDownResponse,
    JobDetailsUpdatePayload
} from "../interfaces";
import { UseRecordPagination } from "app/records-management-v2/useRecordPagination";

import { Observable, of } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { BaseResponse } from "@interTypes/BaseResponse";

@Injectable()
export class JobDetailsService {

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
            'Job Details Service'
        );
    }

    public getProducersList(
        payload: any = {} as any,
        sort: Sort = null,
        pagination: UseRecordPagination = null,
        fieldSet = [],
        noLoader: boolean = false
    ): Observable<JobDetailsDropDownResponse> {
        let url: string = `${this.baseUrl}print-production/producers/search`;
        let headers: HttpHeaders;

        url = `${url}?sortBy=${sort?.active || 'name'}&order=${sort?.direction || 'asc'}`;
        url = `${url}&page=${pagination?.page || 1}&perPage=${pagination?.perPage || 10}`;
        (!!fieldSet && Array.isArray(fieldSet) && fieldSet.length) ?
            url = `${url}&fieldSet=${fieldSet.join(',')}` : '';
        (noLoader) ?
            headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }) : '';

        return this.http.post<JobDetailsDropDownResponse>(url, payload, { headers })
            .pipe(catchError((err) => {
                this.alertOnError(err);
                return of({} as any);
            }));
    }

    public getCheckpointsList(
        payload: any = {} as any,
        sort: Sort = null,
        pagination: JobsPagination = null,
        fieldSet = [],
        noLoader: boolean = false
    ): Observable<JobDetailsDropDownResponse> {
        let url: string = `${this.baseUrl}print-production/checkpoints/search`;
        let headers: HttpHeaders;

        url = `${url}?sortBy=${sort?.active || 'id'}&order=${sort?.direction || 'asc'}`;
        url = `${url}&page=${pagination?.page || 1}&perPage=${pagination?.perPage || 10}`;
        (!!fieldSet && Array.isArray(fieldSet) && fieldSet.length) ?
            url = `${url}&fieldSet=${fieldSet.join(',')}` : '';
        (noLoader) ?
            headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }) : '';

        return this.http.post<JobDetailsDropDownResponse>(url, payload, { headers })
            .pipe(catchError((err) => {
                this.alertOnError(err);
                return of({} as any);
            }));
    }

    public getStatusesList(
        payload: any = {} as any,
        sort: Sort = null,
        pagination: JobsPagination = null,
        fieldSet = [],
        noLoader: boolean = false
    ): Observable<JobDetailsDropDownResponse> {
        let url: string = `${this.baseUrl}print-production/statuses/search`;
        let headers: HttpHeaders;

        url = `${url}?sortBy=${sort?.active || 'id'}&order=${sort?.direction || 'asc'}`;
        url = `${url}&page=${pagination?.page || 1}&perPage=${pagination?.perPage || 10}`;
        (!!fieldSet && Array.isArray(fieldSet) && fieldSet.length) ?
            url = `${url}&fieldSet=${fieldSet.join(',')}` : '';
        (noLoader) ?
            headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }) : '';

        return this.http.post<JobDetailsDropDownResponse>(url, payload, { headers })
            .pipe(catchError((err) => {
                this.alertOnError(err);
                return of({} as any);
            }));
    }

    public getDisplayCostOptionsList(
        payload: any = {} as any,
        sort: Sort = null,
        pagination: JobsPagination = null,
        fieldSet = [],
        noLoader: boolean = false
    ): Observable<JobDetailsDropDownResponse> {
        let url: string = `${this.baseUrl}print-production/display-options/search`;
        let headers: HttpHeaders;

        url = `${url}?sortBy=${sort?.active || 'id'}&order=${sort?.direction || 'asc'}`;
        url = `${url}&page=${pagination?.page || 1}&perPage=${pagination?.perPage || 10}`;
        (!!fieldSet && Array.isArray(fieldSet) && fieldSet.length) ?
            url = `${url}&fieldSet=${fieldSet.join(',')}` : '';
        (noLoader) ?
            headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }) : '';

        return this.http.post<JobDetailsDropDownResponse>(url, payload, { headers })
            .pipe(catchError((err) => {
                this.alertOnError(err);
                return of({} as any);
            }));
    }


    public getJobDetailsByJobId(
        jobID: string,
        noLoader: boolean = false
    ): Observable<JobDetails> {
        let url: string = `${this.baseUrl}print-production/jobs/${jobID}`;
        let headers: HttpHeaders;

        (noLoader) ?
            headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }) : '';

        return this.http.get<JobDetails>(url, { headers })
            .pipe(catchError((err) => {
                this.alertOnError(err);
                return of({} as any);
            }));
    }

    public updateJobDetails(
        jobID: string,
        payload: JobDetailsUpdatePayload = {} as JobDetailsUpdatePayload,
        noLoader: boolean = false
    ): Observable<BaseResponse<{ id: string }>> {
        let url: string = `${this.baseUrl}print-production/jobs/${jobID}`;
        let headers: HttpHeaders;

        (noLoader) ?
            headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }) : '';

        return this.http.patch<BaseResponse<{ id: string }>>(url, payload, { headers })
            .pipe(catchError((err) => {
                this.alertOnError(err)
                return of({} as any);
            }));
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
        else if (errorRes?.message) {
            this._showsAlertMessage(errorRes?.message);
        }
        else {
            this._showsAlertMessage(errorRes);
        }
    }

}