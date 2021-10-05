import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { Observable, of, Subject, timer } from 'rxjs';
import { catchError, map, tap, retryWhen, delayWhen } from 'rxjs/operators';
import { ApiIncoming } from "../models";
import { PeriodLength } from "../models/period-length.model";
import {
  ContractLineItem,
  ContractLineItemsApiResponce
} from '../models/contract-line-item.model';
import { Pagination } from '../models/pagination.model';

import { ContractDetailsExportPayload } from '@interTypes/contract';
import { LineItemTerminologyPayload } from '@interTypes/contracts/line-item-terminology.payload';
import { LatestLineItemMappingResponse } from '@interTypes/contracts/latest-line-item-mapping.response';
import { ElasticSearchResponse } from '@interTypes/elastic-search.response';
import { ElasticHelpers } from 'app/classes';

@Injectable()
export class ContractLineItemsService {
  public handleError;
  private readonly LINE_ITEMS_LOCAL_STORAGE_KEY = 'lineItemsOutList';

  private baseUrl: string = this.config.envSettings['API_ENDPOINT'];
  private baseUrlV2: string = this.config.envSettings['API_ENDPOINT_V2'];

  private siteName: string;

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private theme: ThemeService,
    private matSnackBar: MatSnackBar
  ) {
    const themeSettings = this.theme.getThemeSettings();
    this.siteName = themeSettings && themeSettings.site;
    this.handleError = this.httpErrorHandler.createHandleError(
      'Contracts Service'
    );
  }

  /**
   * @description
   * method to set pagination, sortable values of contract details line items table
   *
   * @param key pagination or sort
   * @param value selected or choosen value
   */
  public setContractDetailLineItemProp(key: string, value: any) {
    const lineItems =
      JSON.parse(localStorage.getItem('contractDetailsLineItems')) ?? {};

    lineItems[key] = value;
    localStorage.setItem('contractDetailsLineItems', JSON.stringify(lineItems));
  }

  /**
   * @description
   * method to get pagination, sortable values of contract details line items table
   *
   * @param key pagination or sort
   */
  public getContractDetailLineItemProp(key: string) {
    const lineItems =
      JSON.parse(localStorage.getItem('contractDetailsLineItems')) ?? {};

    return lineItems[key];
  }

  public getAllLineItems(
    contractId: string,
    sort: Sort = null,
    pagination: Pagination = null,
    fieldSet = [],
  ): Observable<ContractLineItemsApiResponce> {
    let url = `${this.baseUrl}contracts/${contractId}/line_items`;

    if (!!sort) {
      url = `${url}?sortBy=${sort.active}&order=${sort.direction}`;
    }

    if (!!pagination) {
      const nestSymbol = sort ? '&' : '?';
      url = `${url}${nestSymbol}page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    if(Array.isArray(fieldSet) && fieldSet.length) {
      const nestSymbol = sort ? '&' : '?';
      url = `${url}${nestSymbol}fieldSet=${fieldSet.join(',')}`;
    }

    return this.http.get(url).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.message);

        return of(null);
      })
    );
  }

  public searchContractLineItemEsRequest(
    contractId: string,
    fieldSet = [],
    noLoader = false
  ): Observable<ElasticSearchResponse> {
    let url = `${this.baseUrlV2}contracts/${contractId}/line_items`;

    if(Array.isArray(fieldSet) && fieldSet.length) {
      url = `${url}?fieldSet=${fieldSet.join(',')}`;
    }

    let headers: HttpHeaders;
    (noLoader) ?
        (headers = new HttpHeaders({ 'hide-loader': 'hide-loader' })) : '';

    return this.http.get(url, { headers }).pipe(
      catchError((err) => {
        this.alertOnError(err);
        return of(null);
      })
    );
  }

  public getContractLineItemsByESSearchId( 
    contractId: string,
    searchId: string,
    sort: Sort = null,
    isSortFieldString = false,
    pagination: Pagination = null,
    noLoader = false,
    unsubscribe: Subject<any> = null,
    isunMappedTypeDate = false,
  ): Observable<HttpResponse<ContractLineItemsApiResponce>> {
    
    let url = `${this.baseUrlV2}contracts/${contractId}/line_items/search/${searchId}`;
    const payload = ElasticHelpers.buildPayload(sort, pagination as any, isSortFieldString, isunMappedTypeDate);

    let headers: HttpHeaders;
    (noLoader) ?
        (headers = new HttpHeaders({ 'hide-loader': 'hide-loader' })) : '';
    
    const httpReq$ = this.http.post<ContractLineItemsApiResponce>(url,  payload, { headers,  observe: 'response', responseType: 'json'});
    return httpReq$.pipe.apply(httpReq$, [catchError((error) => of(error)),
    map((res: any) => {
      if (res?.status == 202 && !unsubscribe?.isStopped) {
        throw res;
      }
      return res;
    }),
    retryWhen(errors =>
      errors.pipe(
        //restart in 2 seconds
        delayWhen(errors => timer(2000))
      )
    ),
    map((response: any) => {
      if (response.body) {
        const body = { ...response.body };
        body.results.map((item) => {
          item._id = item.id;
          return item;
        });
        response.body = body;
      }
      return response;
    })]);
  }

  /**
   * @deprecated 
   *   Use the elastic search V2 api
   * @param sort 
   * @param pagination 
   * @param fieldSet 
   * @param filter 
   * @param noLoader 
   * @returns 
   */
  public searchAllLineItems(
    sort: Sort = null,
    pagination: Pagination = null,
    fieldSet = [],
    filter,
    noLoader = false
  ): Observable<ContractLineItemsApiResponce> {
    let url = `${this.baseUrl}contracts/line_items/search`;

    if (!!sort) {
      url = `${url}?sortBy=${sort.active}&order=${sort.direction}`;
    }

    if (!!pagination) {
      const nestSymbol = sort ? '&' : '?';
      url = `${url}${nestSymbol}page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    if(Array.isArray(fieldSet) && fieldSet.length) {
      const nestSymbol = sort ? '&' : '?';
      url = `${url}${nestSymbol}fieldSet=${fieldSet.join(',')}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post(url, { filter }, { headers }).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.message);

        return of(null);
      })
    );
  }

  public searchAlLineItemsEsRequest(
    fieldSet = [],
    filter,
    noLoader = false
  ): Observable<ElasticSearchResponse> {
    let url = `${this.baseUrlV2}contracts/line_items/search`;

    
    if(Array.isArray(fieldSet) && fieldSet.length) {
      url = `${url}?fieldSet=${fieldSet.join(',')}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post(url, { filter }, { headers }).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.message);

        return of(null);
      })
    );
  }

  public getLineItemsByESSearchId( 
    searchId: string,
    sort: Sort = null,
    isSortFieldString = false,
    pagination: Pagination = null,
    noLoader = false,
    unsubscribe: Subject<any> = null,
    isunMappedTypeDate = false,
  ): Observable<HttpResponse<ContractLineItemsApiResponce>> {
    
    let url = `${this.baseUrlV2}contracts/line_items/search/${searchId}`;
    const payload = ElasticHelpers.buildPayload(sort, pagination as any, isSortFieldString, isunMappedTypeDate);

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    
    return this.http.post<ContractLineItemsApiResponce>(url,  payload, { headers,  observe: 'response', responseType: 'json'}).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.message);
        return of(err);
      }),
      map((res: any)=>{
        if (res?.status == 202 && !unsubscribe?.isStopped){
          throw res;
        }
        return res;
      }),
      retryWhen(errors =>
        errors.pipe(
          //restart in 2 seconds
          delayWhen(errors => timer(2000))
        )
      ),
      map((response: any)=>{
        if(response.body){
          const body = { ...response.body };
          body.results.map((item)=>{
            item._id = item.id;
            return item;
          });
          response.body = body;
        }
        return response;
      })
    );
  }

  public saveLineItem(
    contractId: string,
    body: any,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contracts/${contractId}/line_items`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post(url, body, { headers }).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.error.message);

        return of(null);
      })
    );
  }

  public updateLineItem(
    contractId: string,
    body: any,
    itemId: string,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contracts/line_items/${itemId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.patch(url, body, { headers }).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.error.message);

        return of(null);
      })
    );
  }

  /**
   * @description
   *   Updated the api endpoint for line items list as per api doc.
   *   `Retrieve details about a line item when a contract ID is not available (or necessary - line item IDs are unique)`
   * @param contractId
   * @param itemId
   * @param noLoader
   */
  public getLineItemDetails(
    contractId: string,
    itemId: string,
    noLoader = false
  ): Observable<ContractLineItemsApiResponce> {
    const url = `${this.baseUrl}contracts/line_items/${itemId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get(url, { headers }).pipe(
      catchError((err) => {
        this._showsAlertMessage(err?.error?.message);
        return of(null);
      })
    );
  }

  public deleteLineItem(
    contractId: string,
    itemId: string,
    noLoader = false
  ) {
    const url = `${this.baseUrl}contracts/line_items/${itemId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.delete(url, { headers }).pipe(
      catchError((errorRes) => {
        const errorHandler = this.handleError(
          'deleteLineItem',
          {}
        );
        return errorHandler(errorRes);
      }),
      tap(this.alertOnError.bind(this))
    );
  }

  public getLineItemNotes(
    contractId: string,
    itemId: string,
    type: string,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contracts/${contractId}/line_items/${itemId}/notes`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get(url, { headers, params: { type } }).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.message);

        return of(null);
      })
    );
  }

  public createNote(
    contractId: string,
    itemId: string,
    type: string,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contracts/${contractId}/line_items/${itemId}/notes`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post(url, { note: '' }, { headers, params: { type } })
      .pipe(
        catchError((err) => {
          this._showsAlertMessage(err.message);

          return of(null);
        })
      );
  }

  public getLineItemNoteById(
    contractId: string,
    itemId: string,
    noteId: string,
    type: string,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contracts/${contractId}/line_items/${itemId}/notes/${noteId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get(url, { headers, params: { type } }).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.message);

        return of(null);
      })
    );
  }


  public exportLineItems(
    payload,
    fieldSet = '',
    sort: Sort = null,
    noLoader = false
  ): Observable<any> {
    let url = `${this.baseUrl}contracts/line_items/export`;

    sort && sort?.direction !== ''
      ? (url += `?sortBy=${sort.active}&order=${sort.direction}`)
      : '';

    let headers;
    noLoader
      ? (headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }))
      : '';

    return this.http
      .post(url, payload, {
        observe: 'response',
        responseType: 'blob',
        headers
      })
      .pipe(
        catchError((errorRes) => {
          const errorHandler = this.handleError(
            'lineItemsExport',
            {}
          );
          return errorHandler(errorRes);
        }),
        tap(this.alertOnError.bind(this))
      );
  }

  public contractDetailsLineItemsExport(
    contractId: string,
    payload: ContractDetailsExportPayload,
    fieldSet = '',
    sort: Sort = null,
    noLoader = false
  ): Observable<any> {
    let url = `${this.baseUrl}contracts/${contractId}/line_items/export`;

    fieldSet ? (url += `?fieldSet=${fieldSet}`) : '';

    sort && sort?.direction !== ''
      ? (url += `&sortBy=${sort.active}&order=${sort.direction}`)
      : '';

    let headers;
    noLoader
      ? (headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }))
      : '';

    return this.http
      .post(url, payload, {
        observe: 'response',
        responseType: 'blob',
        headers
      })
      .pipe(
        catchError((errorRes) => {
          const errorHandler = this.handleError(
            'contractDetailsLineItemsExport',
            {}
          );
          return errorHandler(errorRes);
        }),
        tap(this.alertOnError.bind(this))
      );
  }

  public contractDetailsInsertionOrdersExport(
    contractId: string,
    payload: ContractDetailsExportPayload,
    fieldSet = '',
    sort: Sort = null,
    noLoader = false
  ): Observable<any> {
    let url = `${this.baseUrl}contracts/${contractId}/line_items/iodates/export`;

    fieldSet ? (url += `?fieldSet=${fieldSet}`) : '';

    sort && sort?.direction !== ''
      ? (url += `&sortBy=${sort.active}&order=${sort.direction}`)
      : '';

    let headers;
    noLoader
      ? (headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }))
      : '';

    return this.http
      .post(url, payload, {
        observe: 'response',
        responseType: 'blob',
        headers
      })
      .pipe(
        catchError((errorRes) => {
          const errorHandler = this.handleError(
            'contractDetailsInsertionOrdersExport',
            {}
          );
          return errorHandler(errorRes);
        }),
        tap(this.alertOnError.bind(this))
      );
  }

  public getPeriodLength(noLoader = false): Observable<ApiIncoming<PeriodLength>> {
    const url = `${this.baseUrl}contracts/period-lengths/search?page=1&perPage=100`

    let headers;
    (noLoader) ?
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }) : '';

      return this.http.post(url, {}, { headers }).pipe(
        catchError((errorRes) => {
          return of(null);
        }),
        tap(this.alertOnError.bind(this))
      )
  }

  public submitTerminology(
    contractId: string,
    payload: LineItemTerminologyPayload,
    noLoader = false
  ) {
    const URL = `${this.baseUrl}contracts/${contractId}/line_items/upload/terminology`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post(URL, payload, { headers }).pipe(
      catchError((errorRes) => {
        const errorHandler = this.handleError('submitTerminology', {});
        return errorHandler(errorRes);
      }),
      tap(this.alertOnError.bind(this))
    );
  }

  public submitTerminologyForDeleteScenario(
    contractId: string,
    payload: LineItemTerminologyPayload,
    noLoader = false
  ) {
    const URL = `${this.baseUrl}contracts/${contractId}/line_items/upload/update`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.patch(URL, payload, { headers }).pipe(
      catchError((errorRes) => {
        const errorHandler = this.handleError('submitTerminology', {});
        return errorHandler(errorRes);
      }),
      tap(this.alertOnError.bind(this))
    );
  }

  public getLatestLineItemMapping(
    contractId: string,
    noLoader = false
  ): Observable<LatestLineItemMappingResponse | any> {
    const URL = `${this.baseUrl}contracts/${contractId}/line_items/upload/latest_mapping_decisions`;
    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get(URL, { headers }).pipe(
      catchError((errorRes) => {
        const errorHandler = this.handleError('getLatestLineItemMapping', {});
        return errorHandler(errorRes);
      }),
      tap(this.alertOnError.bind(this))
    );
  }


  public deleteMultipleLineItems(
    contractId: string,
    ids: Array<string>,
    noLoader = false
  ) {
    const URL = `${this.baseUrl}contracts/${contractId}/line_items/delete`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const payload = {
      ids
    };

    return this.http.post(URL, payload, { headers }).pipe(
      catchError((errorRes) => {
        const errorHandler = this.handleError('deleteMultipleLineItems', {});
        return errorHandler(errorRes);
      }),
      tap(this.alertOnError.bind(this))
    );
  }

  public getLineItemBySearch(
    contractId: string,
    lineItemId: string,
    noLoader = false
  ): Observable<ContractLineItemsApiResponce> {
    const url = `${this.baseUrl}contracts/${contractId}/line_items?lineItemId=${lineItemId}&fieldSet=lineItemId`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.get(url).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.message);
        return of(null);
      })
    );
  }

  public getLineItemByIineItemNo(
    contractId: string,
    lineItemId: string,
    noLoader = false
  ): Observable<ContractLineItemsApiResponce> {
    const url = `${this.baseUrl}contracts/${contractId}/line_items?codes=${lineItemId}&fieldSet=lineItemId`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.get(url).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.message);
        return of(null);
      })
    );
  }

   /**
  * /Update do not export status for IO dates.
  * @param filters 
  * @param noLoader 
  * @returns 
  */
    public updateDoNotBillingExportStatus(
      filters: any,
      noLoader = false
    ): Observable<any> {
      const url = `${this.baseUrl}contracts/billing-exports/do_not_export/status`;
  
      let headers;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }
      return this.http.put(url,filters ,{headers}).pipe(
        catchError((err) => {
          this._showsAlertMessage(err.message);
          return of(null);
        })
      );
    }

 /**
  * /billing-exports/exported_status
  * @param filters 
  * @param noLoader 
  * @returns 
  */
  public updateBillingExportStatus(
    filters: any,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contracts/billing-exports/exported_status`;

    let headers;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.put(url,filters ,{headers}).pipe(
      catchError((err) => {
        this._showsAlertMessage(err.message);
        return of(null);
      })
    );
  }

  public setLineItemListLocal(key: string, value: any) {
    try {
      const lineItemList =
        JSON.parse(
          localStorage.getItem(this.LINE_ITEMS_LOCAL_STORAGE_KEY)
        ) ?? {};

      lineItemList[key] = value;
      localStorage.setItem(
        this.LINE_ITEMS_LOCAL_STORAGE_KEY,
        JSON.stringify(lineItemList)
      );
    } catch (e) {
      console.log(e);
    }
  }

  public getLineItemListLocal() {
    return JSON.parse(
      localStorage.getItem(this.LINE_ITEMS_LOCAL_STORAGE_KEY)
    );
  }

  public removeAllFromLineItemListLocal() {
    localStorage.removeItem(this.LINE_ITEMS_LOCAL_STORAGE_KEY);
  }

  public _showsAlertMessage(msg) {
    const config: MatSnackBarConfig = {
      duration: 3000
    };
    
    this.matSnackBar.open(msg, '', config);
  }

  private alertOnError(errorRes) {
    if (errorRes?.error?.message) {
      this._showsAlertMessage(errorRes?.error?.message);
    }
    else if (errorRes?.message) {
      this._showsAlertMessage(errorRes?.message);
    }
  }
}