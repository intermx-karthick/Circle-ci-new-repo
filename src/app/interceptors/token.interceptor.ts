import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

import { catchError, mergeMap } from 'rxjs/operators';
import { AuthenticationService } from '@shared/services';


@Injectable({
  providedIn: 'root'
})
export class TokenInterceptor implements HttpInterceptor {

  constructor(
    private injector: Injector
  ) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
      return next.handle(request);
    }

    const auth: AuthenticationService = this.injector.get(AuthenticationService);

    let tokenReq: HttpRequest<any>;
    const isToken = !request.url.includes('locations/places/search');

    if (isToken && auth.token) {
      const accept = request.headers.get('Accept');
      tokenReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${auth.token}`,
          Accept: accept && accept || 'application/json',
          apikey: apiKey,
          'Cache-Control': 'no-store',
          nonce: auth.nonce ?? ''
        }
      });
    } else {
      tokenReq = request.clone({
        setHeaders: {
          Accept: 'application/json',
          apikey: apiKey,
          'Cache-Control': 'no-store'
        }
      });
    }

    return next.handle(tokenReq);

  }

}
