import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'projectJobStatus'
})

export class ProjectJobStatusPipe implements PipeTransform {
  transform(projectData): any {
    for (const scenario of projectData.scenarios) {
      if (scenario?.job) {
        return true;
      }
    }
    return false;
  }
}
