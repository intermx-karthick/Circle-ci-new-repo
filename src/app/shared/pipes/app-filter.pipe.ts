import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appFilter'
})
export class AppFilterPipe implements PipeTransform {
  transform(items: any[], searchText: string, ...keys:Array<string>): unknown {
    if (!items) {
      return [];
    }
    if (!searchText || (typeof searchText === 'object') || searchText === null) {
      return items;
    }

    searchText = searchText?.toLocaleLowerCase();

    return items.filter((val)=> keys.reduce((state,key)=> state || val[key].toLowerCase().includes(searchText.toLowerCase()) ,false))
  }
}


