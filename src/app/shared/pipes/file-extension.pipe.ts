import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileExtn'
})
export class FileExtensionPipe implements PipeTransform {

  transform(value: string, ...args: any[]): string {
    return value.split('.').pop();
  }

}
