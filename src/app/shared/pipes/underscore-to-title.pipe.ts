import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'underscoreToTitle'
})
export class UnderscoreToTitlePipe implements PipeTransform {

  transform(value: any): string {
    let val = value;
    val = val.replace('_', ' ');
    return this.titleCase(val);
  }
  titleCase(val) {
    let sentence = val.toLowerCase().split(' ');
    for (let i = 0; i < sentence.length; i++) {
      sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    sentence = sentence.toString().replace(',', ' ')
    return sentence;
  }
}
