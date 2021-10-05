import { Observable } from 'rxjs';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { perPageLimit } from '../consts';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {
  public handleError;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT'];

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

  public getListOfContacts(
    perPage = perPageLimit,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contacts`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<any>(url, {
      headers,
      params: { perPage: String(perPage) }
    });
  }

  public getListOfContactsByOrgId(
    perPage = perPageLimit,
    noLoader = false,
    companyIds?: string[],
    companyTypes?: string[]
  ): Observable<any> {
    const url = `${this.baseUrl}contacts/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<any>(
      url,
      {
        filter: {
          companyIds,
          companyTypes
        }
      },
      {
        headers,
        params: { perPage: String(perPage) }
      }
    );
  }

  public createContact(body: any, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}contacts`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<any>(url, body, {
      headers
    });
  }

  public contactsSearch(body: any, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}contacts/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<any>(url, body, {
      headers
    });
  }

  public getContactTypes(perPage, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}contacts/types?perPage=${perPage}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<any>(url, {
      headers
    });
  }

  public updateContact(
    contactId: string,
    body: any,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contacts/${contactId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.patch<any>(url, body, {
      headers
    });
  }
}
