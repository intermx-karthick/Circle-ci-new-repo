import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'imxFileExtFormat'
})
export class ImxFileExtFormatPipe implements PipeTransform {

  transform(value: string[]): unknown {
    const extensions = value.map((v) => "." + v);
    return extensions.join();
  }

}
