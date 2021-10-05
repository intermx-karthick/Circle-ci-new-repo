import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { Sort } from "@angular/material/sort";
import { VendorContractsResponse } from "@interTypes/contracts/vendor-contracts.response";
import { HttpErrorHandlerService, ThemeService } from "@shared/services";
import { AppConfig } from "app/app-config.service";
import { Observable, of, Subject, timer } from "rxjs";
import { catchError, filter, map, tap, publishReplay, refCount, retryWhen, delayWhen, takeWhile  } from 'rxjs/operators';
import { ContractsPagination, ContractsSearch, ContractsSearchBuyerApi, VContractsResponse, VendorContractSearch } from "../models";
import { ContractStatus } from "../models/contract-status.model";
import { ApiIncoming, Contract } from "../models/contract.model";
import { CreateUpdateContract } from "../models/create-contract.model";
import { ContractHeaderFooter, ContractTerms } from "@interTypes/contract/contract-layout";
import { LineItemPagination, LineItemsResponse } from "@interTypes/contract/contract-line-item";
import { VendorTypesResponse } from "@interTypes/contract/vendor-type.response";
import { ContactFilterPayload, ContactResponse, ContractEventPayload, ContractEventResponse } from "@interTypes/records-management";
import { Pagination } from "@interTypes/pagination";
import { ElasticSearchResponse } from "@interTypes/elastic-search.response";
import { ElasticHelpers } from "app/classes";

@Injectable()
export class ContractsService {
  public handleError;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT'];
  private baseUrlV2: string = this.config.envSettings['API_ENDPOINT_V2'];

  private siteName: string;
  private contractFilterData = new Subject<any>();
  private filter;
  private readonly VENDOR_CONTRACT_LOCAL_STORAGE_KEY = 'vendorContractOutList';

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private theme: ThemeService,
    private matSnackBar: MatSnackBar,
  ) {
    const themeSettings = this.theme.getThemeSettings();
    this.siteName = themeSettings && themeSettings.site;
    this.handleError = this.httpErrorHandler.createHandleError(
      'Contracts Service'
    );
    this.contractFilterData.subscribe(event => this.filter = event);
  }

  public getContractFilter(): Observable<any> {
    return this.contractFilterData.asObservable();
  }
  public setContractFilter(type): void {
    this.contractFilterData.next(type);
  }

  public getContracts(sort: Sort = null, pagination: ContractsPagination = null, noLoader: boolean = false): Observable<ApiIncoming<Contract> | {}> {
    let url: string = `${this.baseUrl}contracts`;

    if (!!sort) {
      url = `${url}?sortBy=${sort.active}&order=${sort.direction}`
    }

    if (!!pagination) {
      const nestSymbol = sort ? '&' : '?';

      url = `${url}${nestSymbol}page=${pagination.page}&perPage=${pagination.perPage}`
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<ApiIncoming<Contract>>(url)
      .pipe(catchError((err) => {
        this._showsAlertMessage(err.message)

        return of({});
      }
      ));
  }

  public getContractStatuses(noLoader: boolean = false): Observable<ApiIncoming<ContractStatus> | {}> {
    const url = `${this.baseUrl}contracts/statuses/search`

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<ApiIncoming<ContractStatus>>(url, {})
      .pipe(catchError((err) => {


        return of({});
      }
      ));
  }

  public getContractById(id: string, noLoader: boolean = false): Observable<Contract | {}> {
    const url = `${this.baseUrl}contracts/${id}`

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<Contract>(url)
      .pipe(catchError((err) => {
        this._showsAlertMessage(err.message)

        return of({});
      }
      ));
  }


  public getLatestAttachmentOfVendorContract(
    contractId: string,
    parentVendors: any[],
    childVendors: any[],
    vendorReps: any[],
    noLoader = false,
  ) {
    let URL = `${this.baseUrl}contracts/${contractId}/contract_views/attachments`;
    URL += `?sortBy=createdAt&order=desc`;
    let headers;
    if (parentVendors?.length > 0) {
      URL += `&parentVendors=${parentVendors.join(',')}`;
    }
    if (childVendors?.length > 0) {
      URL += `&childVendors=${childVendors.join(',')}`;
    }
    if (vendorReps?.length > 0) {
      URL += `&vendorReps=${vendorReps.join(',')}`;
    }

    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get(URL, { headers }).pipe(
      catchError((error) => {
        const errorHandler = this.handleError(
          'getLatestAttachmentOfVendorContract',
          {}
        );
        return errorHandler(error);
      }),
      tap(this.alertOnError.bind(this)),
      filter((res: any) => Array.isArray(res.results))
    );
  }

  public createContract(contract: CreateUpdateContract, noLoader: boolean = false): Observable<any> {
    const url = `${this.baseUrl}contracts`

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<any>(url, contract)
      .pipe(catchError((err) => {
        const message = err.error.message;
        this._showsAlertMessage(message)

        return of();
      }
      ));
  }

  updateContract(contract: CreateUpdateContract, contractId: string, noLoader: boolean = false) {
    const url = `${this.baseUrl}contracts/${contractId}`

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.patch<any>(url, contract)
      .pipe(catchError((err) => {
        const message = err.error.message;
        this._showsAlertMessage(message)

        return of();
      }
      ));
  }

  getVendorsContracts(pagination: ContractsPagination = {}, sort: Sort = null, id: string, body = {}, noLoader: boolean = false): Observable<VendorContractsResponse> {
    let url = `${this.baseUrl}contracts/${id}/contract_views`
    if (pagination) {
      url = `${url}?page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (sort && sort?.direction !== '') {
      url += `&sortBy=${sort.active}&order=${sort.direction}`;
    }
    // By Default hide the common loader
    let headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.post<VendorContractsResponse>(url, body, { headers });
  }

  public setVendorContractListLocal(key: string, value: any) {
    const vendorContractList = JSON.parse(localStorage.getItem('vendorContractList')) ?? {};

    vendorContractList[key] = value;
    localStorage.setItem('vendorContractList', JSON.stringify(vendorContractList));
  }

  public getVendorListLocal() {
    return JSON.parse(localStorage.getItem('vendorContractList'));
  }

  public uploadContractAttachment(contractId: string, payload: any) {
    const url = `${this.baseUrl}contracts/${contractId}/attachments?type=document`;
    const data = {
      attachement: payload
    }
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.post(url, payload, { headers });
  }

  public getContractAttachments(
    contractId: string,
    pagination: ContractsPagination = {
      page: 1,
      perPage: 10
    }
  ): Observable<any> {
    let url = `${this.baseUrl}contracts/${contractId}/attachments?sortBy=createdAt&order=desc`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    // By Default hide the common loader
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.get(url, { headers }).pipe(publishReplay(1), refCount());
  }

  public deleteContractAttachment(contractId: string, key: string, noLoader  = false): Observable<any> {
    const url = `${this.baseUrl}contracts/${contractId}/attachments?key=${key}`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.delete(url, { headers });
  }

  public getAllContractEvents(noLoader  = false): Observable<any> {
    const url = `${this.baseUrl}contracts/events/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post(url, {}, { headers })
  }

  public getAllContractStatuses(noLoader  = false): Observable<any> {
    const url = `${this.baseUrl}contracts/statuses/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post(url, {}, { headers })
  }

  public lineItemTypeSearch(
    body: any,
    perPage?: string,
    noLoader: boolean = false
  ) {
    const url = `${this.baseUrl}contracts/line-item-types/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post<any>(url, body, { headers, params: { perPage } })
      .pipe(
        catchError((err) => {
          this._showsAlertMessage(err.message);

          return of({});
        })
      );
  }

  public itemStatusSearch(
    body: any,
    perPage?: string,
    noLoader: boolean = false
  ) {
    const url = `${this.baseUrl}contracts/statuses/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post<any>(url, body, { headers, params: { perPage } })
      .pipe(
        catchError((err) => {

          this._showsAlertMessage(err.message);

          return of({});
        })
      );
  }

  public buyMethodsSearch(
    body: any,
    perPage?: string,
    noLoader: boolean = false
  ) {
    const url = `${this.baseUrl}contracts/buy-methods/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .post<any>(url, body, { headers, params: { perPage } })
      .pipe(
        catchError((err) => {
          this._showsAlertMessage(err.message);

          return of({});
        })
      );
  }

  public updateVendorContractAttachment(
    contractId: string,
    attachmentId: string,
    name: any,
    parentVendors: any[],
    childVendors: any[],
    vendorReps: any[]
  ) {
    const url = `${this.baseUrl}contracts/${contractId}/contract_views/attachments/${attachmentId}`;
    const payload = {
      caption: name,
      filter: {
        parentVendors: parentVendors,
        childVendors: childVendors,
        vendorReps: vendorReps
      }
    };
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.patch(url, payload, { headers });
  }

  public uploadVendorContractAttachment(
    contractId: string,
    payload: any,
    parentVendors: any[],
    childVendors: any[],
    vendorReps: any[]
  ) {
    let url = `${this.baseUrl}contracts/${contractId}/contract_views/attachments?type=document`;
    if (parentVendors?.length > 0) {
      url += `&parentVendors=${parentVendors.join(',')}`;
    }
    if (childVendors?.length > 0) {
      url += `&childVendors=${childVendors.join(',')}`;
    }
    if (vendorReps?.length > 0) {
      url += `&vendorReps=${vendorReps.join(',')}`;
    }

    const data = {
      attachement: payload
    };
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    return this.http.post(url, payload, { headers });
  }

  public getVendorContractAttachments(
    contractId: string,
    pagination: ContractsPagination = {
      page: 1,
      perPage: 10
    },
    parentVendors: any[],
    childVendors: any[],
    vendorReps: any[]
  ): Observable<any> {
    let url = `${this.baseUrl}contracts/${contractId}/contract_views/attachments?sortBy=createdAt&order=desc`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (parentVendors?.length > 0) {
      url += `&parentVendors=${parentVendors.join(',')}`;
    }
    if (childVendors?.length > 0) {
      url += `&childVendors=${childVendors.join(',')}`;
    }
    if (vendorReps?.length > 0) {
      url += `&vendorReps=${vendorReps.join(',')}`;
    }
    // By Default hide the common loader
    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.get(url, { headers });
  }

  public deleteVendorContractAttachment(
    contractId: string,
    attachmentId,
    key: string,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contracts/${contractId}/contract_views/attachments/${attachmentId}`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.delete(url, { headers });
  }

  public getContractTerms(contractId: string, vendorId: string): Observable<any> {
    const url = `${this.baseUrl}contracts/${contractId}/contract_views/terms`;
    let headers: HttpHeaders;
    headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.patch(url, this.filter, { headers }).pipe(
      catchError((errorRes) => {
        const errorHandler = this.handleError('getContractTerms', {});
        return errorHandler(errorRes);
      }),
      tap(this.alertOnError.bind(this))
    );
  }

  public getSortingOption(contractId: string): Observable<any> {
    const url = `${this.baseUrl}contracts/${contractId}/contract_views/sorting-paging`;
    let headers: HttpHeaders;
    headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.patch(url, this.filter, { headers }).pipe(
      catchError((errorRes) => {
        const errorHandler = this.handleError('getContractTerms', {});
        return errorHandler(errorRes);
      }),
      tap(this.alertOnError.bind(this))
    );
  }
  public updateContractTerms(contractId: string, vendorId: string, postObj: any, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}contracts/${contractId}/contract_views/terms`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    let body = {...postObj, ...this.filter};
    return this.http.post(url, body, { headers }).pipe(
      catchError(this.handleError('updateContractTerms', null))
    )
  }


  public  _showsAlertMessage(msg) {
    try {
      const config: MatSnackBarConfig = {
        duration: 3000
      };

      this.matSnackBar.open(msg, '', config);
    }catch (e) {

    }
  }

  private alertOnError(errorRes) {
    if (errorRes?.error?.message) {
      this._showsAlertMessage(errorRes?.error?.message);
    }
    else if (errorRes?.message) {
      this._showsAlertMessage(errorRes?.message);
    }
  }

  /**
   * This function used to get the contract preview header & footer data
   * @param contractId Contract id
   * @param typeId selected conatct type id
   * @param type type name
   * @returns
   */

  public getCantractLayout(
    contractId: string,
    typeId: string,
    type = 'vendor',
    noLoader = true
  ): Observable<ContractHeaderFooter> {
    let url = `${this.baseUrl}contracts/${contractId}/contract_views/layout`;
    // By Default hide the common loader
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.patch<ContractHeaderFooter>(url, this.filter, { headers });
  }

    /**
   * This function used to get the contract preview terms data
   * @param contractId Contract id
   * @param typeId selected conatct type id
   * @param type type name
   * @returns
   */

     public getCantractTerms(
      contractId: string,
      typeId: string,
      type = 'vendor',
      noLoader = true
    ): Observable<ContractTerms> {
      let url = `${this.baseUrl}contracts/${contractId}/contract_views/terms`;
      // By Default hide the common loader
      let headers: HttpHeaders;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }
      return this.http.patch<ContractTerms>(url, this.filter, { headers });
    }

    /**
     *
     * @param contractId contract number
     * @param typeId vendor number
     * @param type type name
     * @param pagination
     * @param noLoader
     * @returns
     */

    public getContractLineItems(
      contractId: string,
      typeId: string,
      type = 'vendor',
      pagination: LineItemPagination = {
        page: 1,
        perPage: 10
      },
      sort: {},
      noLoader = true,
    ): Observable<LineItemsResponse> {
      console.log('ssss',sort,this.filter)
      let body = {...sort, ...this.filter};
      let url = `${this.baseUrl}contracts/${contractId}/contract_views`;
      if (pagination) {
        url += `?page=${pagination.page}&perPage=${pagination.perPage}`;
      }
      // By Default hide the common loader
      let headers;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }
      return this.http.patch<LineItemsResponse>(url, body, { headers }).pipe(publishReplay(1), refCount());
    }

    public setSortingOption(
      contractId: string,
      sort: {},
      pagination,
      noLoader = true,
    ): Observable<any> {

      let body = {...sort, ...this.filter, ...pagination};
      let url = `${this.baseUrl}contracts/${contractId}/contract_views/sorting-paging`;
      let headers;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }
      return this.http.post<any>(url, body, { headers }).pipe(publishReplay(1), refCount());
    }
/**
 *
 * @param contractId conatct id
 * @param vendorId selected conatct vendor id
 * @param perPage set treu = single item per page
 * @param noLoader common loader
 * @returns
 */
  // Contract download pdf
  public downloadContractPdf(contractId, perPage = false, noLoader = false,): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    let url = `${this.baseUrl}contracts/${contractId}/contract_views/reports`;
    if (perPage) {
      url += `?perPage=1`;
    }
    return this.http.post(url, this.filter , { headers: reqHeaders, observe: 'response', responseType: 'blob' });
  }

   /**
   * @description
   * Export contract list
   * @param filters export filter data
   * @param fieldSet customized column
   * @param sort list sorting order info
   * @param exportType export vendor file type
   */

    public getVendorList(
      pagination,
      filter = {},
      noLoader = true
    ): Observable<VendorTypesResponse> {
      let url = `${this.baseUrl}vendors/search?fieldSet=id,name,parentFlag`;
      if (pagination) {
        url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
      }
      let headers: HttpHeaders;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }
      return this.http.post<VendorTypesResponse>(url, filter, { headers }).pipe(publishReplay(1), refCount());
    }
    public getVCVendorsList(
      pagination,
      filter = {},
      noLoader = true
    ): Observable<VendorTypesResponse> {
      let url = `${this.baseUrl}/contracts/contract_views/vendors?fieldSet=id,name,parentFlag,parentCompanyId`;
      if (pagination) {
        url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
      }
      let headers: HttpHeaders;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }
      return this.http.post<VendorTypesResponse>(url, filter, { headers }).pipe(publishReplay(1), refCount());
    }

     public exportContractList(
      filters: ContractsSearch,
      fieldSet= '',
      sort: Sort = null,
      exportType = 'csv',
      noLoader = true
      ): Observable<any> {
      let url = `${this.baseUrl}contracts/export?exportType=${exportType}`;

      if (fieldSet) {
        url += `&fieldSet=${fieldSet}`;
      }

      if (sort && sort?.direction !== '') {
        url += `&sortBy=${sort.active}&order=${sort.direction}`;
      }
      /** When export we can enable common loader */
      let headers: HttpHeaders;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }
      return this.http.post(url, filters, {  observe: 'response', responseType: 'blob', headers });
    }

  public deleteContract(contractId: string, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}contracts/${contractId}`;
    let headers: HttpHeaders;
    (noLoader) ? headers = new HttpHeaders({ 'hide-loader': 'hide-loader' }) : '';

    return this.http.delete(url, { headers }).pipe(
      catchError((errorRes) => {
        const errorHandler = this.handleError('deleteContract', {});
        return errorHandler(errorRes);
      }),
      tap(this.alertOnError.bind(this))
    );
  }

  /**
   * This service function used to get the sample CSV for line item
   * @param noLoader common loader
   * @returns
   */

  public getLineItemsSampleCSV(noLoader = false) {
    let reqHeaders =  new HttpHeaders();
    if (noLoader) {
      reqHeaders = reqHeaders.set('hide-loader', 'hide-loader');
    }
    reqHeaders = reqHeaders.set('Accept', 'text/csv');
    const url = `${this.baseUrl}contracts/line_items/headers`;
    return this.http.get(url, { observe: 'response', responseType: 'blob', headers: reqHeaders });
  }

  /**
 * This function is to upload the line items
 * @param contractId contact Id
 * @param fileData uploaded file
 * @param noLoader
 */
  public uploadLineItemsCSV(contractId, fileData, noLoader = false) {
    const url = `${this.baseUrl}contracts/${contractId}/line_items/upload?type=document`;
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.post(url, fileData, { headers: reqHeaders });
  }

  /**
 * This functions is to send matched field names of csv and places db
 * @param contractId contact Id
 * @param mappingData csv and db fields mapping info
 * @param noLoader
 */
  public lineItemsCsvFieldsMapping(
    contractId,
    mappingInfo,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}contracts/${contractId}/line_items/upload/mapping_decisions`;
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.post(url, mappingInfo, { headers: reqHeaders });
  }


  /**
   *
   * @param filters contract event filters
   * @param order Asc | Dec
   * @param sortBy | sort by name = id,name
   * @param pagination contract event pagination
   * @returns
   */
  public getContractEvents(filters: ContractEventPayload, order: string, sortBy: string, pagination) {

    let url = `${this.config.envSettings['API_ENDPOINT']}contracts/events/search?sortBy=${sortBy}&order=${order}`;

    // if (pagination) {
    //   url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    // }

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http.post<ContractEventResponse>(url, filters, { headers }).pipe(
      catchError((error) => {
        const errorHandler = this.handleError('getContractEvents', []);
        return errorHandler(error);
      })
    );
  }

    /**
   *
   * @param filters Contact filters
   * @param order Asc | Dec
   * @param sortBy | sort by name = id,name
   * @param pagination Contact pagination
   * @returns
   */
     public getContacts(filters: ContactFilterPayload, order: string, sortBy: string, pagination,fieldSets:string = '') {

      let url = `${this.config.envSettings['API_ENDPOINT']}contacts/search?sortBy=${sortBy}&order=${order}`;

      if (pagination) {
        url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
      }

      if (fieldSets) {
        url += `&fieldSet=${fieldSets}`;
      }

      const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

      return this.http.post<ContactResponse>(url, filters, { headers }).pipe(
        catchError((error) => {
          const errorHandler = this.handleError('getContacts', []);
          return errorHandler(error);
        })
      );
    }

/**
 * @deprecated
 *   Use version 2 api
 * @param search
 * @param pagination
 * @param sort
 * @param noLoader
 * @returns
 */
  public getVendorContractBySearch( search: VendorContractSearch,
    pagination: ContractsPagination,
    sort: Sort = null,
    noLoader = false
  ): Observable<VContractsResponse> {
    let url = `${this.config.envSettings['API_ENDPOINT']}contracts/contract_views/search?site=${this.siteName}`;
    if (pagination) {
      url += `&page=${pagination.page}&perPage=${pagination.perPage}`;
    }
    if (sort && sort?.direction !== '') {
      url += `&sortBy=${sort.active}&order=${sort.direction}`;
    }

    let headers;
    if (noLoader)
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

    return this.http
      .post<VContractsResponse>(url, search, { headers })
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getVendorContractBySearch', null))
      );
  }

  public searchAllVendorContractsEsRequest(
    fieldSet = [],
    payload,
    noLoader = false
  ): Observable<ElasticSearchResponse> {
    let url = `${this.baseUrlV2}contracts/contract_views/search`;


    if(Array.isArray(fieldSet) && fieldSet.length) {
      url = `${url}?fieldSet=${fieldSet.join(',')}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<ElasticSearchResponse>(url, payload, { headers });
  }

  public getVendorContractsByESSearchId(
    searchId: string,
    sort: Sort = null,
    isSortFieldString = false,
    pagination: ContractsPagination = null,
    noLoader = false,
    unsubscribe: Subject<any> = null,
    isunMappedTypeDate = false,
  ): Observable<HttpResponse<VContractsResponse>> {

    let url = `${this.baseUrlV2}contracts/contract_views/search/${searchId}`;
    const payload = ElasticHelpers.buildPayload(sort, pagination as any, isSortFieldString, isunMappedTypeDate);

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const httpReq$ = this.http.post<VContractsResponse>(url,  payload, { headers,  observe: 'response', responseType: 'json'});
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

  public getLineItemErrorCount(
    filter = {},
    noLoader = true
  ): Observable<VendorTypesResponse> {
    let url = `${this.baseUrl}contracts/line_items/error-count`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    return this.http.post<VendorTypesResponse>(url, filter, { headers }).pipe(publishReplay(1), refCount());
  }

  public setVendorListLocal(key: string, value: any) {
    try {
      const vendorList =
        JSON.parse(
          localStorage.getItem(this.VENDOR_CONTRACT_LOCAL_STORAGE_KEY)
        ) ?? {};

      vendorList[key] = value;
      localStorage.setItem(
        this.VENDOR_CONTRACT_LOCAL_STORAGE_KEY,
        JSON.stringify(vendorList)
      );
    } catch (e) {
      console.log(e);
    }
  }

  public getVendorOutListLocal() {
    return JSON.parse(
      localStorage.getItem(this.VENDOR_CONTRACT_LOCAL_STORAGE_KEY)
    );
  }

  public removeVendorListLocal(key: string) {
    try {
      const vendorList = this.getVendorOutListLocal();
      if (vendorList?.[key]) {
        delete vendorList[key];
      }
      localStorage.setItem(
        this.VENDOR_CONTRACT_LOCAL_STORAGE_KEY,
        JSON.stringify(vendorList)
      );
    } catch (e) {
      console.log(e);
    }
  }

  public removeAllFromVendorContractListLocal() {
    localStorage.removeItem(this.VENDOR_CONTRACT_LOCAL_STORAGE_KEY);
  }

}
