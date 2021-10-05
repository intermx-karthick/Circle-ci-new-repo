import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
import {EMPTY} from 'rxjs';
import { catchError } from 'rxjs/operators';
import {TargetAudienceService} from '@shared/services';

@Injectable()
export class SavedAudienceResolver implements Resolve<any> {
  constructor(private audience: TargetAudienceService) {}
  resolve(route: ActivatedRouteSnapshot) {
    return this.audience.getSavedAudiences()
      .pipe(catchError(() => {
        return EMPTY;
      }));
  }
}
