import { catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorHandlerService } from '@shared/services/http-error-handler.service';
import { AppConfig } from '../../app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { perPageLimit } from '../consts';

@Injectable({
  providedIn: 'root'
})
export class DivisionsService {
  public handleError;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT'];

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private toast: ToastrService
  ) {
    this.handleError = this.httpErrorHandler.createHandleError(
      'Divisions Service'
    );
  }

  public getDivisionsList(
    sortBy = 'updatedAt',
    order = 'desc',
    perPage = String(perPageLimit),
    page = '1',
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contracts/divisions`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .get<any>(url, { params: { sortBy, order, perPage, page } })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of([]);
        })
      );
  }

  public retriveDivisionById(
    divisionId: string,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contracts/divisions/${divisionId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .get<any>(url, { headers })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of([]);
        })
      );
  }

  public createDivision(body, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}contracts/divisions`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post<any>(url, body, { headers })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of([]);
        })
      );
  }

  public patchDivision(
    divisionId: string,
    body: any,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contracts/divisions/${divisionId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .patch<any>(url, body, { headers })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of([]);
        })
      );
  }

  public removeDivision(divisionId: string, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}contracts/divisions/${divisionId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .delete<any>(url, { headers })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of([]);
        })
      );
  }
}
