import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfig } from '../app-config.service';
import { HttpErrorHandlerService } from '@shared/services';
import { AgencyPagination } from '@interTypes/agency';
import {
  VendorsSearchResponse
} from '@interTypes/inventory-management';
import { Sort } from '@angular/material/sort';
import { catchError, publishReplay, refCount, tap } from 'rxjs/operators';
import { JobSearchResponse } from '@interTypes/jobs/jobs-search.response';
import { InvoiceResponse } from '@interTypes/jobs/invoice-response';
import { ContractsPagination } from '@interTypes/pagination';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ApiIncoming, PeriodLength } from './interfaces/period.response';
import { BaseResponse } from '@interTypes/BaseResponse';

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  handleError;

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private matSnackBar: MatSnackBar
  ) {
    this.handleError = this.httpErrorHandler.createHandleError('Job Service');
  }

  createJob(payload: any, noLoader = false): Observable<BaseResponse<{ id: string }>>  {
    const URL = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<BaseResponse<{ id: string }>>(URL, payload, { headers }).pipe(
      catchError((errorRes) => {
        this.alertOnError(errorRes);
        return of(null);
      }),
    );
  }

  getJobStatuses(
    payload = {},
    pagination: AgencyPagination = {}
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}print-production/checkpoints/search?fieldSet=_id,name&sortBy=asc&order=updatedAt`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.post(url, payload, { headers });
  }

  searchJobs(
    payload,
    pagination = null,
    sort: Sort = null,
    noLoader = false
  ): Observable<JobSearchResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/search`;
    if (pagination) {
      url += `?page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (sort && sort?.direction !== '') {
      url += `${pagination ? '&' : '?'}sortBy=${sort.active}&order=${
        sort.direction
      }`;
    }

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post<VendorsSearchResponse>(url, payload, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('searchJobs', null))
      );
  }

  exportJobs(
    payload,
    fieldSet = '',
    sort: Sort = null,
    noLoader = false
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/export`;

    sort && sort?.direction !== ''
      ? (url += `?sortBy=${sort.active}&order=${sort.direction}`)
      : '';

    let headers;
    noLoader
      ? (headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }))
      : '';

    return this.http.post(url, payload, {
      observe: 'response',
      responseType: 'blob',
      headers
    });
  }

  deleteJob(jobId: string) {
    const url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/${jobId}`;
    return this.http.delete(url);
  }
  public getJobInvoice(
    jobId: string,
    noLoader = true
  ): Observable<InvoiceResponse> {

    let url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/${jobId}/invoices?perPage=10&page=1`;
    // By Default hide the common loader
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.get<InvoiceResponse>(url, { headers });
 }
 public deleteJobAttachment(jobId: string, key: string, attachmentId: string, noLoader  = false): Observable<any> {
  const url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/${jobId}/attachments/${attachmentId}?key=${key}`;
  let headers: HttpHeaders;
  if (noLoader) {
    headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
  }

  return this.http.delete(url, { headers });
}

public uploadJobAttachment(jobId: string, payload: any) {
  const url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/${jobId}/attachments?type=document`;
  const data = {
    attachement: payload
  }
  const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
  return this.http.post(url, payload, { headers });
}

public getJobAttachments(
  jobId: string,
  pagination: ContractsPagination = {
    page: 1,
    perPage: 10
  }
): Observable<any> {
  let url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/${jobId}/attachments?sortBy=createdAt&order=desc`;
  if (pagination) {
    url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
  }
  // By Default hide the common loader
  const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

  return this.http.get(url, { headers }).pipe(publishReplay(1), refCount());
}
public getProductsByClientId(
  clientId: string,
  perPage = '10',
  noLoader: boolean = false,
  oiProduct = null,
) {
  let url = `${this.config.envSettings['API_ENDPOINT']}clients/${clientId}/products?perPage=${perPage}`;
   
  if (oiProduct?.toString().length) {
    url += `&oiProduct=${oiProduct}`;
  }

  let headers: HttpHeaders;
  if (noLoader) {
    headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
  }

  return this.http
    .get<any>(url, { headers })
    .pipe(
      catchError((err) => {
        this.showsAlertMessage(err.message);

        return of({});
      })
    );
}
public itemStatusSearch(
  body: any,
  perPage?: string,
  noLoader: boolean = false
) {
  const url = `${this.config.envSettings['API_ENDPOINT']}print-production/statuses/search`;

  let headers: HttpHeaders;
  if (noLoader) {
    headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
  }

  return this.http
    .post<any>(url, body, { headers, params: { perPage } })
    .pipe(
      catchError((err) => {

        this.showsAlertMessage(err.message);

        return of({});
      })
    );
}

public getPeriodLength(noLoader = false): Observable<ApiIncoming<PeriodLength>> {
  const url = `${this.config.envSettings['API_ENDPOINT']}contracts/period-lengths/search?page=1&perPage=100`

  let headers;
  (noLoader) ?
    headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }) : '';

    return this.http.post(url, {}, { headers }).pipe(
      catchError((errorRes) => {
        this.showsAlertMessage(errorRes.message);
        return of(null);
      }),
    )
}

public getMediaTypes(pagination:any = {}, noLoader = false): Observable<any> {
  let reqHeaders;
  if (noLoader) {
    reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
  }
  let url = `${this.config.envSettings['API_ENDPOINT']}print-production/media-types/search`;

  url = `${url}?page=${pagination?.page || 1}&perPage=${pagination?.perPage || 100}`;
  return this.http.post(url, {}, { headers: reqHeaders });
}
public getSubStrate(pagination:any = {}, noLoader = false): Observable<any> {
  let reqHeaders;
  if (noLoader) {
    reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
  }
  let url = `${this.config.envSettings['API_ENDPOINT']}print-production/substrate-types/search`;
  url = `${url}?page=${pagination?.page || 1}&perPage=${pagination?.perPage || 100}`;

  return this.http.post(url, {}, { headers: reqHeaders });
}

public getPlaceTypes(pagination:any = {},noLoader = false): Observable<any> {
  let reqHeaders;
  if (noLoader) {
    reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
  }
  let url = `${this.config.envSettings['API_ENDPOINT']}print-production/place-types/search`;
  url = `${url}?page=${pagination?.page || 1}&perPage=${pagination?.perPage || 100}`;

  return this.http.post(url, {}, { headers: reqHeaders });
}
public shippingOption(noLoader = false): Observable<any> {
  let reqHeaders;
  if (noLoader) {
    reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
  }
  const url = `${this.config.envSettings['API_ENDPOINT']}print-production/shipping-types/search`;

  return this.http.post(url, {}, { headers: reqHeaders });
}

public saveLineItem(jobId: string, body = {} ,noLoader = false): Observable<any> {
  let reqHeaders;
  if (noLoader) {
    reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
  }
  const url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/${jobId}/line_items`;

  return this.http.post(url, body, { headers: reqHeaders  }).pipe(
    catchError((errorRes) => {
      this.showsAlertMessage(errorRes?.error?.message ? errorRes?.error?.message : errorRes.message);
      return of(null);
    }),
  )
}

public updateLineItem(
  jobId: string,
  body: any,
  itemId: string,
  noLoader = false
): Observable<any> {
  const url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/${jobId}/line_items/${itemId}`;

  let headers: HttpHeaders;
  if (noLoader) {
    headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
  }

  return this.http.patch(url, body, { headers }).pipe(
    catchError((err) => {
      this.alertOnError(err);
      return of(null);
    })
  );
}

public getLineItemDetails(jobId: string, lineItemId: string ,noLoader = false): Observable<any> {
  let reqHeaders;
  if (noLoader) {
    reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
  }
  const url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/${jobId}/line_items/${lineItemId}`;

  return this.http.get(url, { headers: reqHeaders  }).pipe(
    catchError((errorRes) => {
      this.alertOnError(errorRes);
      return of(null);
    }),
  )
}

  public cloneJobById(jobID: string, name, noLoader = false): Observable<BaseResponse<{ id: string }>> {

    const url = `${this.config.envSettings['API_ENDPOINT']}print-production/jobs/${jobID}/clone`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    return this.http.post<BaseResponse<{ id: string }>>(url, {name: name},{ headers: headers }).pipe(
      catchError((errorRes) => {
        this.alertOnError(errorRes);
        return of(null);
      }),
    )
  }

  public exportPurchaseOrderPDF(
    jobID: string,
    printerId: string
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}reports/print-production/jobs/${jobID}/purchase-orders?printer=${printerId}`;
    return this.http.get(url, { observe: 'response', responseType: 'blob' }).pipe(catchError((err) => {
        this.showsAlertMessage(err.message)
        return of({});
      }
    ));
  }

  public jobInvoicePDF(
    jobID: string,
    noLoader = false
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}reports/print-production/jobs/${jobID}/invoices`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    return this.http.get(url, { observe: 'response', responseType: 'blob' }).pipe(catchError((err) => {
      this.showsAlertMessage(err.message)
      return of({});
    }));

  }

  public exportPrinterAuthorizationPDF(
    jobID: string,
  ): Observable<any> {
    let url = `${this.config.envSettings['API_ENDPOINT']}reports/print-production/jobs/${jobID}/product-authorization`;
    return this.http.get(url, { observe: 'response', responseType: 'blob' }).pipe(catchError((err) => {
        this.showsAlertMessage(err.message)
        return of({});
      }
    ));
  }

  private showsAlertMessage(msg) {
    const config: MatSnackBarConfig = {
      duration: 3000
    };

    this.matSnackBar.open(msg, '', config);
  }

  private alertOnError(errorRes) {
    if (errorRes?.error?.message) {
      this.showsAlertMessage(errorRes?.error?.message);
    }
    else if (errorRes?.message) {
      this.showsAlertMessage(errorRes?.message);
    }
    else {
      this.showsAlertMessage(errorRes?.message);
    }
  }


}
