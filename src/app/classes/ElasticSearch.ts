
import { Sort } from '@angular/material/sort';
import { Pagination } from '@interTypes/pagination';
import { catchError, delayWhen, map, retryWhen, takeUntil, tap } from 'rxjs/operators';
import { Observable, of, Subject, timer } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import { ElasticSearchResponse } from '@interTypes/elastic-search.response';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { AppConfig } from 'app/app-config.service';
import { ElasticHelpers } from './elastic-helpers';


@Injectable()
export class ElasticSearch implements OnDestroy {
  public isSearchValid = false;
  public searchId = '';

  private baseUrlV2: string = this.config.envSettings['API_ENDPOINT_V2'];
  private _PATH = '';
  private _ELASTIC_PATH = '';
  private unSub$ = new Subject();
  public SEARCH_METHOD = 'POST';

  constructor(
    private config: AppConfig,
    private http: HttpClient
  ) {
  }

  set PATH(path: string) {
    this._PATH = path;
  }

  get PATH() {
    return this._PATH;
  }

  set ELASTIC_PATH(path: string) {
    this._ELASTIC_PATH = path;
  }

  get ELASTIC_PATH() {
    return this._ELASTIC_PATH;
  }

  public handleSearch(fieldSet: string[], payload: any, sort: Sort, isSortFieldString: boolean, pagination: Pagination, successCallback: Function, errorCallback: Function, noLoader = false, isunMappedTypeDate = false) {
    return this.searchAllItemsEsRequest(fieldSet, payload, noLoader).subscribe(res => {
      this.unSub$.next(); /* to detroy old ES call if its 202 UnSubscribe handled by passing instance of it */
      this.unSub$.complete();
      this.unSub$ = new Subject();
      
      if (res) {
        this.handleSortingAndPaginating(sort, isSortFieldString, pagination, successCallback, errorCallback, noLoader, isunMappedTypeDate,this.unSub$);
      }
    });
  }

  public handleSortingAndPaginating(sort: Sort, isSortFieldString: boolean, pagination: Pagination, successCallback: Function, errorCallback: Function, noLoader = false, isunMappedTypeDate = false,unSub = this.unSub$) {
    this.getListByESSearchId(sort, isSortFieldString, pagination, noLoader, isunMappedTypeDate, unSub).subscribe(res => {
      if (res?.body) {
        if (typeof successCallback == 'function') {
          successCallback(res.body);
        }
      } else {
        if (typeof errorCallback == 'function') {
          errorCallback(res.body);
        }
      }
    });
  }

  public loadDataForNonFilters(
    fieldSet: string[],
    sort: Sort,
    isSortFieldString: boolean,
    pagination: Pagination,
    successCallback: Function,
    errorCallback: Function,
    noLoader = false,
    isunMappedTypeDate = false
  ) {
    return this.initEsRequestForNonFilters(
      fieldSet,
      sort,
      isSortFieldString,
      pagination,
      successCallback,
      errorCallback,
      noLoader
    ).subscribe((res) => {
      this.unSub$.next();
      this.unSub$.complete();
      this.unSub$ = new Subject();

      if (res) {
        this.handleSortingAndPaginating(
          sort,
          isSortFieldString,
          pagination,
          successCallback,
          errorCallback,
          noLoader,
          isunMappedTypeDate,
        );
      }
    });
  }

  public initEsRequestForNonFilters(
    fieldSet: string[],
    sort: Sort,
    isSortFieldString: boolean,
    pagination: Pagination,
    successCallback: Function,
    errorCallback: Function,
    noLoader = false,
  ) {
    let url = `${this.baseUrlV2}${this.PATH}`;

    if (Array.isArray(fieldSet) && fieldSet.length) {
      url = `${url}?fieldSet=${fieldSet.join(',')}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .get<ElasticSearchResponse>(url, { headers })
      .pipe(
        tap((res) => {
          this.searchId = res?._id;
        })
      );
  }

  public searchAllItemsEsRequest(
    fieldSet = [],
    payload,
    noLoader = false
  ): Observable<ElasticSearchResponse> {
    let url = `${this.baseUrlV2}${this.PATH}`;


    if (Array.isArray(fieldSet) && fieldSet.length) {
      url = `${url}?fieldSet=${fieldSet.join(',')}`;
    }

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }
    let searcchttpReq$ = this.http.post<ElasticSearchResponse>(url, payload, { headers });
    if (this.SEARCH_METHOD === 'PATCH') {
      searcchttpReq$ = this.http.patch<ElasticSearchResponse>(url, payload, { headers });
    }
    return searcchttpReq$.pipe(
      tap((res) => {
        this.searchId = res?._id;
      })
    );
  }

  public getListByESSearchId<T>(
    sort: Sort = null,
    isSortFieldString = false,
    pagination: Pagination = null,
    noLoader = false,
    isunMappedTypeDate = false,
    unSub = this.unSub$,
  ): Observable<HttpResponse<T>> {

    let url = `${this.baseUrlV2}${this.ELASTIC_PATH ? this.ELASTIC_PATH : this.PATH}/${this.searchId}`;
    const payload = ElasticHelpers.buildPayload(sort, pagination as any, isSortFieldString, isunMappedTypeDate);

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const ops = [catchError((error) => of(error)),
    map((res: any) => {
      if (res?.status == 202 && !unSub.isStopped) {
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
    }), tap((res: any) => {
      this.isSearchValid = res?.body?.search?.isValid;
    })
    ];
    const httpReq$ = this.http.post<T>(url, payload, { headers, observe: 'response', responseType: 'json' });
    return httpReq$.pipe.apply(httpReq$, ops);
  }

  ngOnDestroy() {
    this.unSub$.next();
    this.unSub$.complete();
  }

}
