import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'audienceName'
})
export class AudienceNamePipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {

    if (value && value.length) {
      return value.map(aud => '('+ (aud['measuresRelease'] ? aud['measuresRelease'] : '2020') +') ' + aud['name']).join(', ');
    } else {
      return null;
    }
  }

}
