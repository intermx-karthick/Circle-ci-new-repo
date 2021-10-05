import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export const InterceptorSkipHeader = 'X-Skip-Interceptor';
@Injectable()
export class OriginInterceptor implements HttpInterceptor {
  /**
   * siteUrl should be changed to send the origin
   */
  private siteUrl = 'https://omg.integration.intermx.io';
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (environment.production) {
      return next.handle(request);
    }
    if (!this.siteUrl) {
      console.warn('You should set the site URL on which you`re working');
      return next.handle(request);
    }
    if (request.headers.has(InterceptorSkipHeader)) {
      const headers = request.headers.delete(InterceptorSkipHeader);
      return next.handle(request.clone({ headers }));
    }
    const newReq = request.clone({
      headers: request.headers.append('X-Intermx-Delivery-Origin', this.siteUrl)
    });
    return next.handle(newReq);
  }
}
