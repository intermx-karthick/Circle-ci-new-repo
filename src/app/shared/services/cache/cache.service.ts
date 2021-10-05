import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, publishReplay, refCount, takeUntil, tap } from 'rxjs/operators';

// model
interface Cache {
  [urlWithQueryParams: string]: Observable<any>
}

class CacheOption {
  // is need to kill cache data by ttl
  isTimerRequired = true;
  // expire time
  ttl? = -1;
}

/**
 * @description
 *    This is an single tone cache storage to capture
 *  the data and store it in its cache property.
 *
 * Note
 *    You can store any observable to cache unlike only
 *  Http request. make sure for http request as of now its
 *  designed for GET request only.
 *
 * @example
 * operationName(){
 *   let url = 'url';
 *   return this.cache.get<GeoCollectionResponse>(url) ||
 *     this.cache.setAndGet<GeoCollectionResponse>(
 *       url,
 *       this.http.get<GeoCollectionResponse>(url, { headers: reqHeaders }),
 *       this.httpErrorHandler.handleError('operationName', null),
 *       true,
 *       5*1000
 *     );
 *  }
 *
 *  @see https://stackblitz.com/edit/angular-advanced-caching-xy7c2f -
 *  for working model.
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {

  // Default expire time of cached request
  private expireTime = 60 * 1000;
  // store
  private store: Cache = {};

  /**
   * @description
   *   Get the cached data
   *
   * @param urlWithQueryParams
   */
  get<T = any>(urlWithQueryParams: string): Observable<T> {
    return this.store[urlWithQueryParams];
  }

  /**
   * @description
   *    Set the data in cache store and return the
   *  cached data.
   *
   * Note:
   *   Time will run in background for given req
   *  when the expired time closed data will be
   *  clear in cache and timer is an optional but
   *  default it has expire time.
   *
   * @param urlWithQueryParams - give url with or without endpoint.
   * @param req - should be observable
   * @param {(error)=>Observable<any>} errorHandler
   * @param {CacheOption} option
   */
  setAndGet<R = any, E = any>(
    urlWithQueryParams: string, req: Observable<R>,
    errorHandler: (error) => Observable<E> = null,
    option: CacheOption = new CacheOption()
  ): Observable<R> {

    this.store[urlWithQueryParams] = req.pipe(
      publishReplay(1),
      refCount(),
      catchError((error) => {
        delete this.store[urlWithQueryParams];
        return errorHandler?.(error) ?? throwError(error);
      })
    );

    if (option.isTimerRequired) {
      const timer$ = this.createTimer(urlWithQueryParams, option.ttl);
      this.store[urlWithQueryParams].pipe(
        takeUntil(timer$)
      );
      timer$?.subscribe();
    }

    return this.store[urlWithQueryParams];
  }

  /**
   * @description
   *  Clear all the cached data
   */
  clear() {
    this.store = {};
  }

  /**
   * @description
   *  Removing the cached data for specific url or key.
   *
   * @param urlWithQueryParams
   * @param matchWithRegExp - To delete based on regexp mostly clearing all
   * pagination req.
   */
  delete(urlWithQueryParams: string, matchWithRegExp = false) {
    if (matchWithRegExp) {
      this.deleteMatchedWithRegExp(urlWithQueryParams);
      return true;
    }

    return delete this.store[urlWithQueryParams];
  }

  /**
   * @description
   *    Deleting cached data where the given path matched
   *  with store keys.
   * @param urlWithQueryParams
   */
  deleteMatchedWithRegExp(urlWithQueryParams: string) {
    const regExp = new RegExp(urlWithQueryParams);
    for (let key in this.store) {
      if (this.store.hasOwnProperty(key) && regExp.test(key)) {
        delete this.store[key];
      }
    }
  }

  /**
   * @description
   *    Create timer with expiretime to destroy the
   *  subscriber and clear the data from cache
   *
   * @memberOf setAndGet
   * @param urlWithQueryParams
   * @param ttl
   */
  private createTimer(urlWithQueryParams: string, ttl = -1) {
    return timer(ttl === -1 ? this.expireTime : ttl).pipe(
      tap(_ => {
        delete this.store[urlWithQueryParams];
      })
    );
  }
}
