import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toPlainText'
})
export class ToPlainTextPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    if(!value){
      return null;
    }
    // HTML to text
    let doc = new DOMParser().parseFromString(value, 'text/html');
    return doc.body.textContent || '';
    
  }

}
