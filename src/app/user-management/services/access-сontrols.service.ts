import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AccessControlsService {
  public handleError;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT_V2'];

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
    this.handleError = this.httpErrorHandler.createHandleError('Group Service');
  }

  public getAccessControls(siteId: string, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}admin/sites/${siteId}/access-controls`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<any>(url).pipe(
      catchError((err) => {
        this.toast.error(err.message);

        return of(null);
      })
    );
  }
}
