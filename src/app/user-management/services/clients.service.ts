import { ToastrService } from 'ngx-toastr';
import { catchError } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class ClientsService {
  public handleError;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT'];

  private siteName: string;

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private theme: ThemeService,
    private toast: ToastrService
  ) {
    const themeSettings = this.theme.getThemeSettings();
    this.siteName = themeSettings && themeSettings.site;
    this.handleError = this.httpErrorHandler.createHandleError('User Service');
  }

  public clientSearchList(
    ids?: string[],
    officeIds?: string[],
    name?: string,
    perPage?: string,
    skipIds?: string[],
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}clients/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post<any>(
        url,
        {
          search: name,
          filter: {
            ids,
            offices: officeIds,
            skipIds: skipIds?.length ? skipIds : undefined
          }
        },
        { headers, params: { perPage } }
      )
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of([]);
        })
      );
  }
}
