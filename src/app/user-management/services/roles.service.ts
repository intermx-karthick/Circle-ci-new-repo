import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';

import { AppConfig } from 'app/app-config.service';
import { Group } from 'app/user-management/models/group.model';
import { Observable, of } from 'rxjs';

@Injectable()
export class RolesService {
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
    this.handleError = this.httpErrorHandler.createHandleError('Roles Service');
  }

  public getAllRoles(noLoader = false): Observable<any[]> {
    const url = `${this.baseUrl}admin/roles`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<any[]>(url);
  }
}
