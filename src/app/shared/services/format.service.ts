import {Injectable} from '@angular/core';
import * as numeral from 'numeral';

@Injectable()
export class FormatService {

  public constructor() {}
  public convertCurrencyFormat(num) {
  // return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const n = String(num),
          p = n.indexOf('.');
    return n.replace(
      /\d(?=(?:\d{3})+(?:\.|$))/g,
      (m, i) => p < 0 || i < p ? `${m},` : m
    );
  }

  public convertToPercentageFormat(key, decimal = 0) {
    const percent = ((key) * 100);
    if (decimal > 0) {
      return this.convertToDecimalFormat(percent, decimal);
    } else {
      return Math.round(percent);
    }
  }

  public convertToDecimalFormat(val, p = 2) {
    if (val) {
      return val.toFixed(p);
    } else {
      return val;
    }
  }
  /**
   *
   * @param {number} number the number to be shortened
   * @param {number} decPlaces number of decimal places we need to display
   * @returns {number} if you give 1000 as number it'll return as 1k.
   */
  public abbreviateNumber(number, decPlaces) {
    if (number < 1000) {
      return Math.ceil(number);
    }
    decPlaces = Math.pow(10, decPlaces);
    const abbrev = ['k', 'm', 'b', 't'];
    for (let i = abbrev.length - 1; i >= 0; i--) {
      const size = Math.pow(10, (i + 1) * 3);
      if (size <= number) {
        number = Math.round(number * decPlaces / size) / decPlaces;
        if ((number === 1000) && (i < abbrev.length - 1)) {
          number = 1;
          i++;
        }
        number += abbrev[i];
        break;
      }
    }
    return number;
  }
  public abbreviateDecimal(number) {
    let abbreviateNumber;
    let result;
    abbreviateNumber = numeral(number);
    result = abbreviateNumber.format('0.[0]a');
    const chknumber = result.replace(/[^\d.-]/g, '');
    if ( chknumber > 10) {
      result = abbreviateNumber.format('0a');
    }
    return result;
  }

  public sanitizeString(desc) {
    let itemDesc;
    if (desc) {
      itemDesc = desc.replace(/(\r\n|\n|\r|\s+|\t|&nbsp;)/gm, ' ');
      itemDesc = itemDesc.replace(/"/g, '""');
      itemDesc = itemDesc.replace(/ +(?= )/g, '');
    } else {
      itemDesc = '';
    }
    return itemDesc;
  }

  public getFeetInches(inches: number) {
    const feet = Math.floor(inches / 12);
    const inch = Math.round(inches % 12);
    let response = '';
    if (feet > 0) {
      response += feet + '\'';
      if (inch > 0) {
        response += ' ' + inch + '\"';
      }
    } else if (inch > 0) {
      response += inch + '\"';
    } else {
      response = 'undefined';
    }
    return response;
  }

  public checkAndPopulate(key, isPercentage = false, noFormat = false, returnError = 'undefined') {
    if (typeof key !== 'undefined' && key !== 'null') {
      if (isPercentage) {
        return this.convertToPercentageFormat(key) + '%';
      } else if (noFormat) {
        return key;
      } else {
        return this.convertCurrencyFormat(Math.round(key));
      }
    } else {
      return returnError;
    }
  }
  public sortAlphabetic(item1, item2, key = 'name') {
    let sortable1 = '';
    if (item1[key] != null) {
      sortable1 = item1[key].toUpperCase();
    }
    let sortable2 = '';
    if (item2[key] != null) {
      sortable2 = item2[key].toUpperCase();
    }
    if (sortable1 < sortable2) {
      return -1;
    }
    if (sortable1 > sortable2) {
      return 1;
    }
    return 0;
  }

  getObjectTitle(data, titleType, field) {
    const searchItem = 'Untitled ' + titleType + ' ';
    let filteredItems: any;
    // This is to save the integer part in the untitled names
    const untitledNums = [];
    if (field === 'name') {
      filteredItems = data.filter((item) => item.name.includes(searchItem)).sort();
      filteredItems.map(item => {
        untitledNums.push(parseInt(item.name.split(' ')[2], 10));
      });
    } else {
      filteredItems = data.filter((item) => item.title.includes(searchItem)).sort();
      filteredItems.map(item => {
        untitledNums.push(parseInt(item.title.split(' ')[2], 10));
      });
    }
    untitledNums.sort((a, b) => a - b);
    if (filteredItems.length > 0) {
      const lastItemCount = untitledNums.pop();
      if (parseInt(lastItemCount, 10)) {
        return searchItem + (parseInt(lastItemCount, 10) + 1);
      } else {
        return searchItem + 1;
      }
    } else {
      return searchItem + 1 ;
    }
  }
}
