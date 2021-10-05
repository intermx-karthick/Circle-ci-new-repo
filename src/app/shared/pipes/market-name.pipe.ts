import { Pipe, PipeTransform } from '@angular/core';
import { MarketTypeEnum } from '@interTypes/enums';
import { Helper } from 'app/classes';

@Pipe({
  name: 'marketName'
})
export class MarketNamePipe implements PipeTransform {

  transform(value: any, format = false, marketType = null): any {
    if (value && value.length) {
      if (!format) {
        return value.map(market => market['name']).join(',');
      } else {
        switch (marketType) {
          case MarketTypeEnum.NATIONAL:
            if (value.length === 1) {
              return value[0]['name'];
            }
          break;
          case MarketTypeEnum.DMA:
            const dmaList = Helper.deepClone(value);
            if (dmaList.length === 1) {
              return this.formatDMAName(value[0]['name']);
            }
            const lastDMAMarket = dmaList[dmaList.length - 1];
            dmaList.pop();
            let dmaMarketName = dmaList.map(market => this.formatDMAName(market['name'])).join(', ');
            dmaMarketName = dmaMarketName + ' and ' + this.formatDMAName(lastDMAMarket['name']);
            return dmaMarketName;
          break;
          case MarketTypeEnum.CBSA:
            if (value.length === 1) {
              return value[0]['name'];
            }
            const cbsaList = Helper.deepClone(value);
            const lastCBSAMarket = cbsaList[cbsaList.length - 1];
            cbsaList.pop();
            let cbsaMarketName = cbsaList.map(market => market['name']).join(', ');
            cbsaMarketName = cbsaMarketName + ' and ' + lastCBSAMarket['name'];
            return cbsaMarketName;
          break;
          case MarketTypeEnum.COUNTY:
            const marketsList = Helper.deepClone(value);
            if (value.length === 1) {
              return this.formatCountyName(value[0]['name']);
            }
            const lastMarket = marketsList[marketsList.length - 1];
            marketsList.pop();
            let marketName = marketsList.map(market => this.formatCountyName(market['name'])).join(', ');
            marketName = marketName + ' and ' + this.formatCountyName(lastMarket['name']);
            return marketName;
          break;
        }
      }
    } else {
      return null;
    }
  }

  private formatDMAName(name) {
    const code = name.split(', ').pop();
    const formattedName = name.replace(`, ${code}`, ` (${code})`);
    return formattedName;
  }

  private formatCountyName(name) {
    const code = name.split(',').shift();
    const formattedName = name.replace(`${code}, `, `(${code}) `);
    return formattedName;
  }

}
