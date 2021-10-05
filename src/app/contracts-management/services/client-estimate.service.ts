import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { AppConfig } from "app/app-config.service";
import { Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { ApiIncoming } from "../models";
import { ClientEstimate } from "../models/client-estimate.model";

@Injectable()
export class ClientEstimateService {
  private baseUrl: string = this.config.envSettings['API_ENDPOINT'];

  private siteName: string;

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private matSnackBar: MatSnackBar
  ) { }

  getEstimates(clientid: string, productId: string, group = false, pageParam = {}): Observable<ApiIncoming<ClientEstimate>> {
    let url = `${this.baseUrl}clients/${clientid}/estimates/search`;
    let filter = {};
    const params = {};
    if (group) {
      params['estimateGroup'] = true;
    }
    if (pageParam['page']) {
      params['page'] = pageParam['page'];
      params['perPage'] =  pageParam['perPage'];
    }
    if(productId) {
      filter = {
        filters: {
          productIds: [productId]
          }
        }
    }
    return this.http
    .post<any>(url, filter, {params: params})
    .pipe(
      catchError((err) => {
        this.showsAlertMessage(err.error.message);

        return of({});
      })
    );
  }

  getEstimate(clientid: string, estimateId: string): Observable<any> {
    const url = `${this.baseUrl}/clients/${clientid}/estimates/${estimateId}`;

    return this.http.get(url)
    .pipe(
      catchError((err) => {
        this.showsAlertMessage(err.error.message);

        return of(null);
      })
    );
  }

  private showsAlertMessage(msg) {
    const config: MatSnackBarConfig = {
      duration: 3000
    };

    this.matSnackBar.open(msg, '', config);
  }

}