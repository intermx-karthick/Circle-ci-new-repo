import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'inchesToFeet'})
export class InchesToFeetPipe implements PipeTransform {

  transform(value: number) {
    if (value) {
      const feet = Math.floor(value / 12);
      const inch = Math.round(value % 12);
      let response = '';
      if (feet > 0) {
        response += feet + '\'';
        if (inch >= 0) {
          response += ' ' + inch + '\"';
        }
      } else if (inch >= 0) {
        response += inch + '\"';
      } else {
        response = 'undefined';
      }
      return response;
    }
    return value;
  }
}
