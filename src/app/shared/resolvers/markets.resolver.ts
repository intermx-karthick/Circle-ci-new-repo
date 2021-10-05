import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
// import {ExploreService} from '@shared/services';
import { InventoryService } from '@shared/services';
import {EMPTY} from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class MarketsResolver implements Resolve<any> {
  constructor(private inventoryService: InventoryService) {}
  resolve(route: ActivatedRouteSnapshot) {
    return this.inventoryService.getMarkets()
      .pipe(catchError(() => {
        return EMPTY;
      }));
  }
}
