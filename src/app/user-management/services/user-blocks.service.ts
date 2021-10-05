import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AppConfig } from '../../app-config.service';

@Injectable({
  providedIn: 'root'
})
export class UserBlocksService {
  public handleError;
  private baseUrl: string = this.config.envSettings['API_ENDPOINT_V2'];

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private toast: ToastrService
  ) {}

  public unblockUser(userId: string, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}admin/users-blocks/${userId}`;

    let headers: HttpHeaders;

    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.delete<any>(url).pipe(
      catchError((err) => {
        this.toast.error(err.message);
        return of(null);
      })
    );
  }
}
