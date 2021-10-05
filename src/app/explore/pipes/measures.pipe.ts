import { Pipe, PipeTransform } from '@angular/core';
import { Summary } from '@interTypes/summary';

@Pipe({
  name: 'measures'
})
export class MeasuresPipe implements PipeTransform {

  transform(summary: Summary, type: 'TARGETCOMP' | 'COMPINDEX', decimal: number = 0): any {
    if (typeof summary !== 'undefined') {
      let result;
      switch (type) {
        case 'TARGETCOMP':
          if (
            summary.frames > 0 &&
            summary.imp_target_inmkt > 0 &&
            summary.imp > 0
          ) {
            const composition = summary.imp_target_inmkt / summary.imp;
            let compositionPer = this.convertToPercentageFormat(composition, decimal);
            compositionPer = this.handleZero(compositionPer);
            result =  compositionPer + '%';
          } else if (Object.keys(summary).length <= 0) {
            result = '-';
          }
          break;
        case 'COMPINDEX':
            if (
              summary.frames > 0 &&
              summary.imp_target_inmkt > 0 &&
              summary.imp > 0
              && summary.pop_target_inmkt > 0
              && summary.pop_inmkt > 0
            ) {
              const targetCompPer = summary.imp_target_inmkt / summary.imp;
              const targetPopulationPer = summary.pop_target_inmkt / summary.pop_inmkt;
              const compIndex = targetCompPer / targetPopulationPer;
              const compositionPer = this.convertToPercentageFormat(compIndex, decimal);
              result = this.handleZero(compositionPer);
            } else if (Object.keys(summary).length <= 0) {
              result = '-';
            }
          break;
      }
      return result;
    }
    return '0%';
  }
  private convertToPercentageFormat(key, decimal = 0, addExtra = false) {
    // const percent = ((key) * 100);
    let percent = 0;
    if (key > 0 && key <= 1) {
      percent = ((key) * 100);
    } else {
      percent = key;
    }
    if (decimal > 0) {
      return this.convertToDecimalFormat(percent, decimal);
    } else {
      return Math.round(percent);
    }
  }
  private convertToDecimalFormat(val, p = 2) {
    const num = val;
    return num.toFixed(p);
  }
  private handleZero(val) {
    if (val >= 1) {
      val = Math.round(val);
    } else if (val > 0.009) {
      val = Number(val).toFixed(2);
    } else {
      val = 0;
    }
    return val;
  }

}
