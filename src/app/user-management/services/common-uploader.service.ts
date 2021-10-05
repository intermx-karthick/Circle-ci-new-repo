import { ToastrService } from 'ngx-toastr';
import { catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { HttpErrorHandlerService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonUploaderService {
  public handleError;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT'];

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private toast: ToastrService
  ) {
    this.handleError = this.httpErrorHandler.createHandleError(
      'Common Uploader Service'
    );
  }

  public upload(attachment: FormData, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}common/upload`;

    let headers: HttpHeaders;

    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post<any>(url, attachment, { headers })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of(null);
        })
      );
  }
}
