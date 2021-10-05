import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { LoggerService } from '@shared/services/logger.service';
import { ErrorHandlerResponse } from '@interTypes/error-handler.response';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorHandlerService {

  constructor(
    private logger: LoggerService
  ) {
  }

  /**
   * @description
   *   Creating error handler for specific service.
   *
   * @param serviceName
   */
  createHandleError = (serviceName: string)=><T>(operationName: string, defaultData: T)=>
      this.handleError<T>(serviceName, operationName, defaultData);

  /**
   *
   * @description
   *   Handle the Http error and print in console
   * @param serviceName
   * @param operationName
   * @param defaultData
   */
  private handleError<T>(serviceName: string, operationName: string, defaultData: T){
    return (res: HttpErrorResponse): Observable<ErrorHandlerResponse<T>> =>{
      const message = res?.error?.message ?? res.message;
      this.logger.error(`${serviceName} => ${operationName}`, message);
      return of({ data: defaultData, error: { message, status: res.status}})
    }
  }

}
