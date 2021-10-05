import { Observable } from 'rxjs';
import { ThemeService } from '@shared/services/theme.service';
import { HttpErrorHandlerService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RecordsPagination } from '@interTypes/pagination';
import { publishReplay, refCount } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserContactsService {
  public handleError;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT_V2'];

  private siteName: string;

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private theme: ThemeService
  ) {
    const themeSettings = this.theme.getThemeSettings();
    this.siteName = themeSettings && themeSettings.site;
    this.handleError = this.httpErrorHandler.createHandleError('User Service');
  }

  public linkContactWithUser(
    connection: string,
    userId: string,
    contactId: string,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}user/${userId}/contacts/${contactId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<any>(
      url,
      { connection },
      {
        headers
      }
    );
  }

  public sync(
    connection: string,
    body: any,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}user/sync`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<any>(url, body, { params: { connection }, headers });
  }

  public getUserContacts(
    connection: string,
    userId: string,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}user/${userId}/contacts`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<any>(url, {
      headers,
      params: {
        connection
      }
    });
  }

  public unlinkContactWithUser(
    connection: string,
    userId: string,
    contactId: string,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}user/${userId}/contacts/${contactId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.delete<any>(url, {
      headers,
      params: {
        connection
      }
    });
  }

  public getClientAccessList(
    connection: string,
    userId: string,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}user/${userId}/client-access`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<any>(url, {
      headers,
      params: {
        connection
      }
    });
  }

  public updateClientAccessList(
    connection: string,
    userId: string,
    body: any,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}user/${userId}/client-access`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.put<any>(url, body, {
      headers,
      params: {
        connection
      }
    });
  }


  /**
   * @description
   *  To get the contacts from the API.
   * @param {RecordsPagination} pagination
   */
  public getContactTypes(pagination: RecordsPagination = {}): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}contacts/types`;

    if (pagination) {
      url = `${url}?page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.get(url, { headers });
  }

}
