import { Pipe, PipeTransform } from '@angular/core';
import { parse, isValid } from 'date-fns';

@Pipe({
  name: 'appSortBy',
  pure: false
})
export class AppSortByPipe implements PipeTransform {
  constructor() {}

  public static getValueByType(
    value,
    type: SortByType = 'number',
    itemGetter = false,
    key: number | string = ''
  ) {
    // for nested array [[1,2], [3,4] or array of object [{id: 1}, {id: 2}]
    if (itemGetter) {
      value = value?.[key] ?? '';
    }

    switch (type) {
      case 'number':
        return Number(value);
      case 'string':
        return String(value).toLowerCase();
      case 'date':
        const date =
          value instanceof Date
            ? value
            : parse(value, 'MM-dd-yyyy', new Date());
        return isValid(date) ? date.getTime() : value;
    }
    return value;
  }

  public transform<T>(
    array: Array<T>,
    reverse = false,
    type: SortByType = 'number',
    itemGetter = false,
    key: string | number = ''
  ): Array<T> {
    if(!array || !Array.isArray(array)) return;
    array.sort((a: any, b: any) => {
      const a_value = AppSortByPipe.getValueByType(a, type, itemGetter, key);
      const b_value = AppSortByPipe.getValueByType(b, type, itemGetter, key);
      if (a_value < b_value) {
        return reverse ? 1 : -1;
      } else if (a_value > b_value) {
        return reverse ? -1 : 1;
      } else {
        return 0;
      }
    });
    return array;
  }
}

export type SortByType = 'number' | 'string' | 'date';
