import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';


@Injectable()
export class LoaderHeaderInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!request.headers.has('hide-loader')) {
      return next.handle(request);
    }
    const newReq = request.clone({
      headers: request.headers.delete('hide-loader'),
    });
    return next.handle(newReq);
  }
}
