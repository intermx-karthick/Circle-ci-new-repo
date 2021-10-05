import { Injectable } from '@angular/core';
import { Subject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, publishReplay, refCount } from 'rxjs/operators';

import {
  GeoCollectionResponse
} from '@interTypes/Population';
import { AppConfig } from '../../app-config.service';
import { CacheService } from '@shared/services/cache';
import { HttpErrorHandlerService } from '@shared/services/http-error-handler.service';

@Injectable()
export class PopulationDataService {
  public handleError;
  public geoSets$: Observable<GeoCollectionResponse> = null;

  private geoSetCreatedNotification = new Subject();
  private filterSideNav = new Subject<{ open: boolean, tab: string }>();

  constructor(
    private config: AppConfig,
    private http: HttpClient,
    private cache: CacheService,
    private httpErrorHandler: HttpErrorHandlerService
  ) {
    this.handleError = this.httpErrorHandler.createHandleError('PopulationData Service');
  }

  /**
   * Use this function to set sidenav object
   * @param sideNav: MatSidenav object which will use to control filter sidenav.
   **/
  public setFilterSideNav(sideNav): void {
    this.filterSideNav.next(sideNav);
  }

  public getFilterSideNav(): Observable<any> {
    return this.filterSideNav.asObservable();
  }


  /**
   * This method is to get list of markets based on type and search value
   * @param searchText search value
   * @param page page number
   * @param noLoader
   * @param isNeedFromCache - forcing to get date from server
   */
  public getAllGeoSets(searchText: string = '', page = 1, noLoader = true,
                       isNeedFromCache = true): Observable<GeoCollectionResponse> {
    let reqHeaders;
    const perPage = 20;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    let url = `${this.config.envSettings.API_ENDPOINT}markets/collections`;
    if (searchText) {
      url = `${url}?q=${searchText}&page=${page}&perPage=${perPage}`;
    } else {
      url = `${url}?page=${page}&perPage=${perPage}`;

      // Only cache mechanism works for initial load
      if (isNeedFromCache && page === 1) {
        if(!this.geoSets$) {
          this.geoSets$ = this.http.get<GeoCollectionResponse>(url, { headers: reqHeaders })
            .pipe(
              publishReplay(1),
              refCount(),
              catchError(e=>{
                this.geoSets$ = null;
                return throwError(e);
              })
            );
        }

        return this.geoSets$;
      }

    }

    return this.http.get<GeoCollectionResponse>(url, { headers: reqHeaders });
  }

  // The below methods are needed to update the sets list when a new set is created
  public getGeoSetSaveNotification(): Observable<any> {
    return this.geoSetCreatedNotification.asObservable();
  }

  public setGeoSetSaveNotification(): void {
    this.geoSetCreatedNotification.next();
  }

  public clearCaches(){
    this.geoSets$ = null;
  }

}
