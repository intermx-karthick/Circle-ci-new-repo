import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'auditStatusLabel'
})
export class AuditStatusLabelPipe implements PipeTransform {

  transform(statusName: string): string {
    let name = statusName;
    if (statusName.includes('Published - ')) {
      name = statusName.replace('Published - ', '');
    }
    if (statusName.includes('Non-Audited')) {
      name = 'Unaudited';
    }
    return name;
  }

}
