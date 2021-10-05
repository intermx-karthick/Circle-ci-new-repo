import { publishReplay, refCount, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AddressServiceService {
  public handleError;
  public siteName;

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private theme: ThemeService
  ) {
    const themeSettings = this.theme.getThemeSettings();
    this.siteName = themeSettings && themeSettings.site;
    this.handleError = this.httpErrorHandler.createHandleError(
      'Address Service'
    );
  }

  public getStateSearch(search = {}, pagination: any = {}): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}locations/states/search`;

    if (pagination) {
      url += `?page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    // By Default hide the common loader
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .post<any>(url, search, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getVendorsStateSearch', null))
      );
  }
}
