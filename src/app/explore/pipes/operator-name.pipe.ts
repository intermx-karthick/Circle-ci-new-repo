import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'operatorName'
})
export class OperatorNamePipe implements PipeTransform {

  transform(representations: any, args?: any): any {
    let opp = null;
    if (representations) {
      const representation = representations.filter(rep => rep['representation_type'] && rep['representation_type']['name'] === 'Own')[0];
      if (representation) {
        // opp = representation['division']['plant']['name'];
        opp = representation['account']['parent_account_name'];
      }
    }
    return opp;
  }

}
