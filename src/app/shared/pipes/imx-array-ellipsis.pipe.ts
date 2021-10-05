import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'imxArrayEllipsis'
})
export class ImxArrayEllipsisPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
