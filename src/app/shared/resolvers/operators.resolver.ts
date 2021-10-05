import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
import { InventoryService } from '@shared/services';
import {EMPTY, throwError} from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class OperatorsResolver implements Resolve<any> {
  constructor(private inventoryService: InventoryService) {}
  resolve(route: ActivatedRouteSnapshot) {
    const filterData = {};
    filterData['summary_level_list'] = ['Plant'];
    filterData['measures_required'] = false;
    filterData['status_type_name_list'] = ["*"] ;
    // filterData['measures_range_list'] = [{ 'type': 'imp', 'min': 0 }];
    return this.inventoryService.getOperators(filterData, false)
      .pipe(catchError((err, caught) => {
        return throwError(err);
      }));
  }
}
