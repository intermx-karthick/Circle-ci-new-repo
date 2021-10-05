import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Sort } from "@angular/material/sort";
import { Pagination } from "@interTypes/pagination";
import { FilterClientsPayload, FilterClientsResponse } from "@interTypes/records-management";
import { ProjectListQueryParams, ProjectsList } from "@interTypes/workspaceV2";
import { HttpErrorHandlerService, ThemeService } from "@shared/services";
import { AppConfig } from "app/app-config.service";
import { ElasticHelpers, Helper } from "app/classes";
import { ToastrService } from "ngx-toastr";
import { Observable, of, Subject, timer } from "rxjs";
import { catchError, delayWhen, map, retryWhen } from "rxjs/operators";
import { ApiIncoming, Contract, ContractsPagination, NestedItem } from "../models";
import { ContractsSearchBuyerApi } from "../models/contracts-search-buyer.model";
import { ContractsSearch } from "../models/search-contracts.model";
import { ElasticSearchResponse } from '@interTypes/elastic-search.response';

@Injectable()
export class ContractsSearchService {
  public handleError;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT'];
  private baseUrlV2: string = this.config.envSettings['API_ENDPOINT_V2'];

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
    this.handleError = this.httpErrorHandler.createHandleError(
      'Contracts Search Service'
    );
  }

  /**
   * @deprecated
   *   use elastic search v2 api
   * @param sort
   * @param pagination
   * @param model
   * @param noLoader
   * @returns
   */
  public search(sort: Sort = null, pagination: ContractsPagination = null, model: ContractsSearch, noLoader = false): Observable<ApiIncoming<Contract>> {
    const baseUrl: string = this.config.envSettings['API_ENDPOINT'];
    let url = `${baseUrl}contracts/search`

    if(!!sort) {
      url = `${url}?sortBy=${sort.active}&order=${sort.direction}`
    }

    if(!!pagination) {
      const nestSymbol = sort ? '&' : '?';

      url = `${url}${nestSymbol}page=${pagination.page}&perPage=${pagination.perPage}`
    }

    let headers: HttpHeaders;

    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<ApiIncoming<Contract>>(url, model,{ headers });
  }

  public searchAllContractsEsRequest(
    fieldSet = [],
    payload,
    noLoader = false
  ): Observable<ElasticSearchResponse> {
    let url = `${this.baseUrlV2}contracts/search`;


    if(Array.isArray(fieldSet) && fieldSet.length) {
      url = `${url}?fieldSet=${fieldSet.join(',')}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<ElasticSearchResponse>(url, payload, { headers });
  }

  public getContractsByESSearchId(
    searchId: string,
    sort: Sort = null,
    isSortFieldString = false,
    pagination: ContractsPagination = null,
    noLoader = false,
    unsubscribe: Subject<any> = null,
    isunMappedTypeDate = false,
  ): Observable<HttpResponse<ApiIncoming<Contract>>> {

    let url = `${this.baseUrlV2}contracts/search/${searchId}`;
    const payload = ElasticHelpers.buildPayload(sort, pagination as any, isSortFieldString, isunMappedTypeDate);

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const httpReq$ = this.http.post<ApiIncoming<Contract>>(url,  payload, { headers,  observe: 'response', responseType: 'json'});
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

  public getAllUsers(noLoader = false): Observable<ContractsSearchBuyerApi> {
    const baseUrl: string = this.config.envSettings['API_ENDPOINT'];
    const url = `${baseUrl}admin/users`

    let headers: HttpHeaders;

    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<ContractsSearchBuyerApi>(url, {filters: {
      group: "OMG Buyer"
   } },  { headers });
  }

  public getClientsByFilters(perPage: number = 10, filters: FilterClientsPayload = {}) {

    let url = `${this.config.envSettings['API_ENDPOINT']}clients/search?sortBy=clientName&order=asc&perPage=${perPage}`;

    const headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });

   return this.http.post<FilterClientsResponse>(url, filters, { headers }).pipe(
      catchError((error) => {
        const errorHandler = this.handleError('getClients', []);
        return errorHandler(error);
      })
    );
  }

  public getAllCampaigns(params: ProjectListQueryParams): Observable<ApiIncoming<NestedItem> | {}> {
    const url = Helper.formatUrlWithParams(
      `${this.config.envSettings['API_ENDPOINT_V2.1']}workflows/projects?fieldSet=_id,name`,
      params
    );

    let reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.http.get<ApiIncoming<NestedItem>>(url, {
        headers: reqHeaders
      })
      .pipe(catchError((error) => of({ })));
  }

  public getAllClientContacts(organizationId: string, noLoader = false): Observable<any> {
    const baseUrl: string = this.config.envSettings['API_ENDPOINT'];
    const url = `${baseUrl}clients/${organizationId}/contacts/search`

    let headers: HttpHeaders;

    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<any>(url,{}, { headers })
      .pipe(catchError((error) => of({ })));
  }

  public getContacts(payload: any = {}, fieldSet: string[] = [], pagination: ContractsPagination = {}, sort: any = {}, noLoader = true): Observable<any> {
    const baseUrl: string = this.config.envSettings['API_ENDPOINT'];
    let url = `${baseUrl}contacts/search`
   
    url += `?page=${pagination?.page || 1}&perPage=${pagination?.perPage || 25}`;
    url += `&sortBy=${sort?.active || 'firstName'}&order=${sort?.direction || 'asc'}`
    if (Array.isArray(fieldSet) && fieldSet?.length) {
      url += `&fieldSet=${fieldSet.join(',')}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<any>(url, payload, { headers })
      .pipe(catchError((error) => of({})));
  }
}
