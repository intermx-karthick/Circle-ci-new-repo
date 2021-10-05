import { InventoryDetailsReq, Inventory } from '@interTypes/inventory';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { AppConfig } from 'app/app-config.service';
import { Helper } from 'app/classes';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SummaryRequest } from '@interTypes/summary';
import { Injectable } from '@angular/core';

@Injectable()
export class MediaDetailsService {
  constructor(private http: HttpClient, private config: AppConfig) {}

  public getInventoryDetails$(
    filters: Partial<SummaryRequest>,
    noLoader = false
  ): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const filter = Helper.deepClone(filters);
    if (!filter['page_size']) {
      filter['page_size'] = 100;
    }
    return this.http
      .post(
        this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/search',
        filter,
        { headers: reqHeaders }
      )
      .pipe(
        map((result) => result['inventory_summary']),
        catchError(() => {
          return of({
            inventory_items: []
          });
        })
      );
  }

  public spotIdSearch(
    filters: Partial<SummaryRequest>,
    noLoader = false
  ): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const filter = Helper.deepClone(filters);
    if (!filter['page_size']) {
      filter['page_size'] = 100;
    }
    return this.http
      .post(
        this.config.envSettings['API_ENDPOINT_V2.1'] +
          'inventory/spot/id/search',
        filter,
        { headers: reqHeaders }
      )
      .pipe(
        map((result) => result['inventory_summary']),
        catchError(() => {
          return of({
            inventory_items: []
          });
        })
      );
  }

  public getInventoryByFrameId(
    frameId: string,
    noLoader = false
  ): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    return this.http
      .get(
        this.config.envSettings['API_ENDPOINT_V2.1'] + `inventory/${frameId}`,
        { headers: reqHeaders }
      )
      .pipe(
        catchError(() => {
          return of(null);
        })
      );
  }

  public getSingleInventory(
    params: InventoryDetailsReq,
    noLoader = false
  ): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url =
      this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/search';
    const apiParams = {
      id_list: [params['spotId']],
      id_type: 'spot_id'
    };

    return this.http
      .post(url, apiParams, { headers: reqHeaders })
      .pipe(map((response: Inventory) => response));
  }

  public getMediaTypes(noLoader = false): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url =
      this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/media_types';

    return this.http.get(url, { headers: reqHeaders });
  }

  public getPlaceTypes(noLoader = false): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url =
      this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/place_types';

    return this.http.get(url, { headers: reqHeaders });
  }

  public getClassificationTypes(noLoader = false): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url =
      this.config.envSettings['API_ENDPOINT_V2.1'] +
      'inventory/classification_types';

    return this.http.get(url, { headers: reqHeaders });
  }

  public getPlacementTypes(noLoader = false): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url =
      this.config.envSettings['API_ENDPOINT_V2.1'] +
      'inventory/placement_types';

    return this.http.get(url, { headers: reqHeaders });
  }

  public getConstructionTypes(noLoader = false): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url =
      this.config.envSettings['API_ENDPOINT_V2.1'] +
      'inventory/construction_types';

    return this.http.get(url, { headers: reqHeaders });
  }

  public marketsSearch(
    type?: string,
    q?: string,
    perPage?: number | string,
    noLoader = false
  ): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url = this.config.envSettings['API_ENDPOINT_V2.1'] + 'markets/search';

    return this.http.get(url, {
      headers: reqHeaders,
      params: { type, q, pageSize: String(perPage) }
    });
  }

  public getAudienceByDataVersion(
    data = {},
    perPage?: number | string,
    noLoader = false,
    year = 2021
  ): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    let url =
      this.config.envSettings['API_ENDPOINT'] + 'audiences/' + year + '?';
    if (data['search']) {
      url = url + 'search=' + encodeURIComponent(data['search']);
    }
    return this.http.get<any>(url, {
      headers: reqHeaders,
      params: { perPage: String(perPage) }
    });
  }
}
