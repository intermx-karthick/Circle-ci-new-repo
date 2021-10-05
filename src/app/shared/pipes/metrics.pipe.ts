import { Pipe, PipeTransform } from '@angular/core';
import { Helper } from 'app/classes';

@Pipe({
  name: 'metrics'
})
export class MetricsPipe implements PipeTransform {

  transform(value: [], size: number = 2) {
    let formattedArray = [];
    let dubArray = Helper.deepClone(value);
    if (value.length > 0) {
      for (let i = 0; i < Math.ceil(value.length / size); i++) {
        formattedArray.push(dubArray.splice(0, size));
      }
    }
    return formattedArray;
  }

}
