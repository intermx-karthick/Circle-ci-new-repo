import { publishReplay, refCount, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
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

    url += `?page=${pagination.page || 1}&perPage=${pagination.perPage || 100}`;

    return this.http.post<any>(url, search).pipe(publishReplay(1), refCount());
  }
}
