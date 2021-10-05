import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isObjectExists'
})
export class IsObjectExistsPipe implements PipeTransform {

  transform(value: any): boolean {
    if (value && Object.keys(value).length > 0) {
      return true;
    }
    return false;
  }

}
