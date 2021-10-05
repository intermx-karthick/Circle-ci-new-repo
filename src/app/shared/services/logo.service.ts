import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfig } from 'app/app-config.service';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';


@Injectable()
export class LogoService {

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private theme: ThemeService,
    private matSnackBar: MatSnackBar
  ) { }

  public updateLogoCaption(organizationId: string, key: string, caption: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}attachments/${organizationId}?key=${key}`;
    const data = {
      caption: caption
    }
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.patch(url, data, { headers });
  }

  public updateJobLogoCaption(jobId: string, attachmentId: string, key: string, caption: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/${jobId}/attachments/${attachmentId}?key=${key}`;
    const data = {
      caption: caption
    }
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.patch(url, data, { headers });
  }

  public showsAlertMessage(msg) {
    const config = {
      duration: 3000
    } as MatSnackBarConfig;
    this.matSnackBar.open(msg, '', config);
  }
}