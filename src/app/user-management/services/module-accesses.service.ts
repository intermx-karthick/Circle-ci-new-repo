import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpErrorHandlerService } from '@shared/services/http-error-handler.service';
import { AppConfig } from '../../app-config.service';

@Injectable({
  providedIn: 'root'
})
export class ModuleAccessesService {
  public handleError: any;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT_V2'];

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService
  ) {
    this.handleError = this.httpErrorHandler.createHandleError('Group Service');
  }

  public getModuleAccesses(siteId: string, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}admin/sites/${siteId}/module-accesses`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<any>(url);
  }
}
