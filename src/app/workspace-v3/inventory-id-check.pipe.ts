import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'checkInventoryAbsence'
})
export class InventoryIdAbsenceCheckPipe implements PipeTransform {
    transform(id, idList = []): boolean {
      return !idList?.includes(id);
    }
}
