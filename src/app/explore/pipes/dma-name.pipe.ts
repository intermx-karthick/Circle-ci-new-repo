import { Pipe, PipeTransform } from '@angular/core';
import {CommonService, InventoryService} from '@shared/services';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

@Pipe({
  name: 'DMANameFromID'
})
export class DmaNamePipe implements PipeTransform {
  constructor(private inventory: InventoryService) {
  }
  transform(DMAId: string): Observable<any> {
    if (!DMAId) {
      return of('');
    }
    return this.inventory.getMarketsFromFile()
      .pipe(map((res: any[]) => {
        const market = res.find(dma => dma.id === 'DMA' + DMAId);
        if (!market) {
          return '';
        }
        return market.name;
      }));
  }

}
