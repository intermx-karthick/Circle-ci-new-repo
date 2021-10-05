import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'marketFilter'
})
export class MarketFilterPipe implements PipeTransform {

  transform(markets, group = false): any {
    if (markets?.length) {
      if (group) {
        return markets.filter((market) => market?.marketsGroup?.length)
      } else {
        return markets.filter((market) => !market?.marketsGroup?.length)
      }
    }
    return markets;
  }
}
