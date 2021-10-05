import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'appArrFilter'
})
export class AppArrayFilterPipe implements PipeTransform {
    transform(items: any[], searchText: string, ...keys: Array<string>): unknown {
        if (!items) {
            return [];
        }
        if (!searchText || (typeof searchText === 'object') || searchText === null) {
            return items;
        }

        searchText = searchText?.toString().toLocaleLowerCase();

        return items.filter((val) => val.toString().toLowerCase().includes(searchText.toLowerCase()));
    }
}


