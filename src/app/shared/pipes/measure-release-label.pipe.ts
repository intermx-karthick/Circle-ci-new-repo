import { Pipe, PipeTransform } from '@angular/core';

/**
 * Commented on 11/06/2021 by Vignesh.M(vicky@intermx.com)
 * This is a temporary pipe created to fulfill the label requirments for IMXMAINT-7.
 *
 * This pipe must be removed once the measure releases has been implemented with product selector component.
 *
 */

@Pipe({name: 'measure_release_label'})
export class MeasureReleaseLabelPipe implements PipeTransform {
  transform(value: any) {
    switch (value) {
      case 202106:
        return 'Forecast Jun 2021 - May 2022';
        break;
      case 2021:
        return 'Forecast Jan 2021 - Dec 2021';
        break;
      default:
        return 'Forecast Jan 2020 - Dec 2020';
        break;
    }
  }
}
