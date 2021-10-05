import {Pipe, PipeTransform} from '@angular/core';
import {Orientation} from '../../classes/orientation';

@Pipe({name: 'direction'})
export class DirectionPipe implements PipeTransform {
  transform(value: any) {
    const orientation = new Orientation();
    return orientation.getOrientation(value);
  }
}
