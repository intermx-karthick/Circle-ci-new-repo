import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'geokeys'})
export class GeoKeysPipe implements PipeTransform {
  transform(value, args: boolean = false, hideKeys: boolean = false): any {
    let keys = [];
    let key: any;
    for ( key in value ) {
      if ( args ) {
        if ( value[key] !== null ) {
          keys.push({key: key, value: value[key]});
        }
      } else {
        keys.push({key: key, value: value[key]});
      }
    }
    if (hideKeys && keys.length) {
      return keys.filter(geoKey => geoKey.key !== 'cbsa' && geoKey.key !== 'neighborhood');
    }
    return keys;
  }
}
