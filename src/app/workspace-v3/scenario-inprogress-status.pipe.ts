import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'scenarioinProgressStatus'
})

export class ScenarioInProgressStatusPipe implements PipeTransform {
  transform(scenario): any {
    if (scenario?.job?.status === 'inProgress') {
      return true;
    }
    return false;
  }
}
