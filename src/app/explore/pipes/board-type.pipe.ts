import {Pipe, PipeTransform} from '@angular/core';
import {ExploreDataService} from '@shared/services';

@Pipe({name: 'boardType'})
export class BoardTypePipe implements PipeTransform {
  constructor(public dataService: ExploreDataService) {
  }
  transform(properties: any) {
    if (properties.mtid) {
      return this.dataService.getMediaGroup(properties.mtid) + ' :: ' + properties.mt;
    }
  }
}
