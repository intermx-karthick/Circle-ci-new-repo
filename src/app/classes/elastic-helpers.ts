import { Sort } from '@angular/material/sort';
import { Pagination } from '@interTypes/pagination';
import { filter, switchMap, concatMap, takeUntil, map, retryWhen, tap, delayWhen, catchError } from 'rxjs/operators';
import { of, timer } from 'rxjs';

export class ElasticHelpers {

    public static getHttpHeaders(){
      return {
        observe: 'response',
        responseType: 'json'
      }
    }

    /* changes - as per new sort header logic we should change sort param as follows */
    public static buildPayload(
        sort: Sort = null,
        pagination: Pagination = null,
        isSortFieldString = false,
        isunMappedTypeDate = false,
        ){
      const sortKey = isSortFieldString ? `${sort.active}.keyword`: sort.active;
      const unMappedType = isunMappedTypeDate ? 'date': 'keyword';
      const page = pagination.page - 1;
      let ofset =  (page * pagination.perPage);

      const payload = {
        from: ofset,
        size: pagination.perPage,
        sort: [{
          [sortKey]: { 'order': sort?.direction, 'unmapped_type': unMappedType }
        }]
     }

     return payload;
    }

    /** Deprecated -- Due to destory not achieved when page exists*/
    static RXJSOperators = [
            catchError((error)=>of(error)),
            map( (res: any)=>{
                if (res?.status == 202){
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
            map((response: any)=>{
                if(response.body){
                  const body = { ...response.body };
                  body.results.map((item)=>{
                    item._id = item.id;
                    return item;
                  });
                  response.body = body;
                }
                return response;
              })
        ]

  }
