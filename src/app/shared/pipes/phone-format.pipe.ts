import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneFormat'
})
export class PhoneFormatPipe implements PipeTransform {

  transform(value: string, ...args: any[]): string {
    if (!value) { return ''; }
    let phone = value.toString().trim().replace(/^\+/, '');
    if (phone.match(/[^0-9]/)) {
        return value;
    }
    let city, number;
    city = phone.slice(0, 3);
    number = phone.slice(3);
    // Format phone number ###-###-####
    number = number.slice(0, 3) + '-' + number.slice(3);
    return (city + "-" + number).trim();
  }

}
