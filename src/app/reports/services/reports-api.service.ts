import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfig } from '../../app-config.service';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { ProjectsList } from '@interTypes/workspaceV2';
import { of } from 'rxjs';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { catchError, filter, tap } from 'rxjs/operators';
import { HttpErrorHandlerService } from '@shared/services';
import { PreviewReportResponse } from '@interTypes/reports/preview-report.response';
import { GenerateReportFilters } from '@interTypes/reports';
import { Sort } from '@angular/material/sort';
import { Pagination } from '../models/pagination.model';

@Injectable()
export class ReportsAPIService {
    // Using it for duplicating report
    public duplicateTrigger: Subject<PreviewReportResponse> = new Subject<any>();
    public duplicateTrigger$ = this.duplicateTrigger.asObservable();
    public handleError;
    public scrolling$ = new Subject();
    private openCloseNaviBar = new Subject();

    constructor(
      private config: AppConfig,
      private http: HttpClient,
      private httpErrorHandler: HttpErrorHandlerService,
      private matSnackBar: MatSnackBar,
    ) {
      this.handleError = this.httpErrorHandler.createHandleError(
        'Report Service'
      );
    }

  public deleteReport(id: string, noLoader = false){
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    const url = `${this.config.envSettings['API_ENDPOINT']}reports/${id}`;
    return this.http.delete(url,{ headers: reqHeaders })
      .pipe(
        catchError((error) => {
          const errorHandler = this.handleError('deleteReport', null);
          return errorHandler(error);
        }),
        tap(this.showsAlertMessage.bind(this))
      );
  }


  public exportReport(id: string, exportType, noLoader = true){
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    const url = `${this.config.envSettings['API_ENDPOINT']}reports/${id}/export`;
    return this.http
      .post(url, exportType, {
        headers: reqHeaders
      })
      .pipe(
        catchError((error) => {
          const errorHandler = this.handleError('exportReport', null);
          return errorHandler(error);
        }),
        tap(this.showsAlertMessage.bind(this))
      );
  }


  getImpData(noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = '../../../assets/imp.json';
        return this.http.get(url, { headers: reqHeaders });
    }
    getTableauVisualURLs(noLoader = false) {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        return this.http.get(
            this.config.envSettings['API_ENDPOINT'] + 'visualization/view',
            { headers: reqHeaders }
        );
        // return this.http.get(
        //     '../../assets/viz.json',
        //     { headers: reqHeaders }
        // );
    }
    public getOpenCloseNaviBarStatus(): Observable<any> {
        return this.openCloseNaviBar.asObservable();
    }
    public setOpenCloseNaviBarStatus(emitterAction) {
        this.openCloseNaviBar.next(emitterAction);
    }

  public getCategories(noLoader = true) {
    let url = this.config.envSettings['API_ENDPOINT'] + 'reports/categories/search';
    url += `?page=1&perPage=100`;

    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    return this.http.post(url, {}, { headers: reqHeaders });
  }

  public getReportTypes(noLoader = true) {
    let url = this.config.envSettings['API_ENDPOINT'] + 'reports/types/search';
    url += `?page=1&perPage=100`;

    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.post(url, {}, { headers: reqHeaders });
  }

  public getCostTypes(noLoader = true, filters = {}) {
    let url = this.config.envSettings['API_ENDPOINT'] + 'reports/cost-types/search';
    url += `?page=1&perPage=100`;

    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const paylodFilter = { ...filters };
    paylodFilter['isActive'] = true;

    return this.http.post(url, paylodFilter, { headers: reqHeaders });
  }

  public getProjects(searchStr = '', fieldSet='',  pagination = null, noLoader = true): Observable<ProjectsList> {
    let url = this.config.envSettings['API_ENDPOINT_V2.1'] + 'workflows/projects?sortBy=name&order=asc';

    if(fieldSet){
      url += `&fieldSet=${fieldSet}`;
    }
    if(searchStr){
      url += `&q=${searchStr}`;
    }
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
   return this.http.get<ProjectsList>(url, {
      headers: reqHeaders
    }).pipe(

      catchError(error => of({ projects: [] }))
    );
}

  public getPreviewReport(id: string, noLoader = true): Observable<PreviewReportResponse>{
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    const url = `${this.config.envSettings['API_ENDPOINT']}reports/${id}`;
    return this.http.get<PreviewReportResponse>(url, { headers: reqHeaders });
  }

  public regenerateReport(id: string, noLoader = true){
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    const url = `${this.config.envSettings['API_ENDPOINT']}reports/${id}/regenerate`;
    return this.http.post(url, {}, { headers: reqHeaders })
      .pipe(
        catchError((error) => {
          const errorHandler = this.handleError('regenerateReport', null);
          return errorHandler(error);
        }),
        tap(this.showsAlertMessage.bind(this))
      );
  }
  public generateReport(postObject: GenerateReportFilters = {} as GenerateReportFilters, noLoader = false) {
    const url = `${this.config.envSettings['API_ENDPOINT']}reports/contracts`;

    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    return this.http.post(url, postObject, {  headers: reqHeaders, observe: 'response', responseType: 'blob' });
  }
  public searchAllReport(
    sort: Sort = null,
    pagination: Pagination = null,
    fieldSet = [],
    filters,
    noLoader: boolean = true
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}reports/search`;

    const defaultFilters = {
      module: "contract-reports"
    }
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

    return this.http.post(url, { filters, defaultFilters }, { headers: headers}).pipe(
      catchError((err) => {
        tap(this.showsAlertMessage.bind(this))
        return of(null);
      })
    );
  }

  public searchCategory(pagination: Pagination = null, noLoader: boolean = true) {
    let url = `${this.config.envSettings['API_ENDPOINT']}reports/categories`;

    let headers: HttpHeaders;
    if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.get(url, { headers: headers}).pipe(
      catchError((err) => {
        tap(this.showsAlertMessage.bind(this))
        return of(null);
      })
    );
  }

  public searchType(pagination: Pagination = null, noLoader: boolean = true) {
    let url = `${this.config.envSettings['API_ENDPOINT']}reports/types`;

    let headers: HttpHeaders;
    if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    if (!!pagination) {
      url = `${url}?page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    return this.http.get(url, { headers: headers}).pipe(
      catchError((err) => {
        tap(this.showsAlertMessage.bind(this))
        return of(null);
      })
    );
  }

  public dispatchScroll(): void {
      this.scrolling$.next();
  }

  public listenForContainerScroll(){
      return this.scrolling$;
  }

  public showSnackBar(message: string){
      const config = {
        duration: 3000
      } as MatSnackBarConfig;
      this.matSnackBar.open(message, '', config);
  }

  private showsAlertMessage(errorRes) {
    if (errorRes?.error?.message) {
      this.showSnackBar(errorRes.error.message);
    }
    else if (errorRes?.message) {
      this.showSnackBar(errorRes.message);
    }
  }
}
