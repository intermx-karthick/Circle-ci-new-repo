import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'marketSelection'
})
export class MarketSelectionPipe implements PipeTransform {

  transform(market: any, marketOptions): any {
    if (marketOptions && marketOptions.length) {
      return marketOptions.find(option => option['id'] === market['id']);
    }
    return false;
  }
}
