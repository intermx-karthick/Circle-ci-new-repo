import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { perPageLimit } from '../consts';
import { Site, SitesApiResponce, LogoType, SiteApiModel } from '../models';

@Injectable()
export class SitesService {
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

  public getSitesList(
    perPage = perPageLimit,
    noLoader = false
  ): Observable<SitesApiResponce> {
    const url = `${this.baseUrl}admin/sites?sortBy=siteName&order=asc&perPage=${perPage}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .get<SitesApiResponce>(url, { headers })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of(null);
        })
      );
  }

  public addSite(site: Site, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}admin/sites`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<Site>(url, site).pipe(
      catchError((err) => {
        this.toast.error(err.message);

        return of(null);
      })
    );
  }

  public getSite(siteId: string, noLoader = false): Observable<SiteApiModel> {
    const url = `${this.baseUrl}admin/sites/${siteId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<Site>(url).pipe(
      catchError((err) => {
        this.toast.error(err.message);

        return of(null);
      })
    );
  }

  public updateSite(
    siteId: string,
    site: Site,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}admin/sites/${siteId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.put<Site>(url, site).pipe(
      catchError((err) => {
        this.toast.error(err.message);

        return of(null);
      })
    );
  }

  public deleteSite(siteId: string, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}admin/sites/${siteId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.delete<Site>(url).pipe(
      catchError((err) => {
        this.toast.error(err.message);

        return of(null);
      })
    );
  }

  public uploadLogo(
    siteId: string,
    logoType: LogoType,
    module: string,
    attachment: FormData,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}admin/sites/${siteId}/logos/upload`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .patch<any>(url, attachment, {
        params: {
          logoType,
          module
        }
      })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of(null);
        })
      );
  }
}
