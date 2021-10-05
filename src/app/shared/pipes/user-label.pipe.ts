import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'user_label'
})
export class UserLabelPipe implements PipeTransform {

  transform(userData: any) {
    let name = '';
    if(userData?.name) {
      const names = userData?.name.split(' ');
      if(names.length >= 2) {
        name = names[0].slice(0, 1)+names[1].slice(0, 1);
      } else {
        name = userData?.name.slice(0, 2);
      }
    } else {
      name = userData?.email.slice(0, 2);
    }
    return name.toUpperCase();
  }
}
