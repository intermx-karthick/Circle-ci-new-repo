import {Pipe, PipeTransform} from '@angular/core';
import * as numeral from 'numeral';

@Pipe({
  name: 'convert'
})
export class ConvertPipe implements PipeTransform {
  transform(value: any, type: any = 'THOUSAND', decimal: number = 0, isDecimalPercentage = false,format='0.[00]'): any {
    if (typeof value !== 'undefined') {
      if (type === 'THOUSAND') {
        if (!isNaN(value)) {
          if(isDecimalPercentage) {
            value = Number(value).toFixed(decimal)
          } else {
            value = Math.round(value);
          }
          value = value.toString();
        }
        // return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const n = String(value),
          p = n.indexOf('.');
        return n.replace(
            /\d(?=(?:\d{3})+(?:\.|$))/g,
            (m, i) => p < 0 || i < p ? `${m},` : m
        );
      } else if (type === 'PERCENT') {
        if(isDecimalPercentage) {
          return this.convertToPercentage(value, decimal);
        } else {
          return this.convertToPercentageFormat(value, decimal);
        }
      } else if (type === 'ABBREVIATE') {
        let result;
        let number;
        number = numeral(value);
        result = number.format('0.[0]a');
        const chknumber = result.replace(/[^\d.-]/g, '');
        if ( chknumber > 10) {
          result = number.format('0a');
        }
        return result;
      } else if (type === 'DECIMAL') {
        let result;
        let number;
        number = numeral(value);
        if (decimal && decimal === 3) {
          result = number.format('0.00[0]');
        } else if (decimal && decimal === 1) {
          result = number.format('0.[0]');
        } else {
          result = number.format('0.[00]');
        }
        return result;
      }else if (type === 'NUMERICALFORMAT') {
        let result;
        let number;
        number = numeral(value);
        result = number.format(format);
        return result;
      } else if (type === 'GETMEDIALEN') {
        const medias = Object.keys(value).reduce((r, k) => {
          if (value[k].length > 0) {
            return r.concat(value[k]);
          } else {
            return r;
          }
        }, []);
        return medias.length;
      } else if (type === 'COMMASEP') {
        return value.join(',');
      } else if (type === 'COMMASEPATT') {
        const formatValue = value.map(data => data.displayName);
        return formatValue.join(',');
      }
    } else {
      return value;
    }
  }

  private convertToPercentageFormat(key, decimal = 0) {
    // const percent = ((key) * 100);
    let percent = 0;
    if (key > 0 && key <= 1) {
      percent = ((key) * 100);
    } else {
      percent = key;
    }
    if (decimal > 0 && percent < 10) {
      return this.convertToDecimalFormat(percent, 1);
    } else {
      return Math.round(percent);
    }
  }

  private convertToPercentage(key, decimal = 0) {
    let percent = 0;
    if (key > 0 && key <= 1) {
      percent = ((key) * 100);
    } else {
      percent = key;
    }
    let number;
    number = numeral(percent);
    return number.format('0.00');
  }

  private convertToDecimalFormat(val, p = 2) {
    const num = val;
    return num.toFixed(p);
  }
  private abbreviateNumber(number, decPlaces) {
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
}
