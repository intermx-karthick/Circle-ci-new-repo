import { Pipe, PipeTransform  } from '@angular/core';

@Pipe({
  name: 'padWith'
})
/**
 *
 */
export class PaddingPipe implements PipeTransform {

  transform(value: any, length: number, type: 'start' | 'end', character: string = '0'): string {
    if (value === undefined) {
      return '';
    }
    if (type === 'start') {
      return String(value).padStart(length, character);
    }
    if (type === 'end') {
      return String(value).padEnd(length, character);
    }
  }
}
