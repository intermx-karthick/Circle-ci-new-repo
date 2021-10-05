import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatBytes'
})
export class FormatBytesPipe implements PipeTransform {
  transform(value: any, decimal: number = 0, ...args: any[]): any {
    const bytes = Number(value);
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = decimal < 0 ? 0 : decimal;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
  }
}
