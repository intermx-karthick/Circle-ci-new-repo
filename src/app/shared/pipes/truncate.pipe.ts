import { Pipe, PipeTransform  } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  /**
   * transform will use to do the truncate logic using below params.
   * @param value string to be truncate.
   * @param type end/middle to define which position need to truncte
   * @param prefix length of truncate part
   * @param suffix length of truncate part for suffix it need if type has middle.
   */
  transform(value: any, type: string = 'end', prefix: number = 10, suffix: number = 6): any {
    let truncatePrefixStr = '';
    let truncateSuffixStr = '';
    if (value) {
      switch (type) {
        case 'middle':
          if (value.length > (prefix + suffix + 5)) {
            truncatePrefixStr = value.substring(0, prefix);
            truncatePrefixStr += ' ... ';
            truncateSuffixStr = value.substring(value.length - suffix);
            value = truncatePrefixStr + truncateSuffixStr;
          }
          break;
        default:
          if (value.length > prefix) {
            truncatePrefixStr = value.substring(0, prefix);
            truncatePrefixStr += '...';
            value = truncatePrefixStr;
          }
          break;
      }
    }
    return value;
  }
}
