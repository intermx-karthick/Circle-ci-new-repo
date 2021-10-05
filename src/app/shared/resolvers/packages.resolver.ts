import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
import {WorkSpaceService} from '@shared/services';
import {EMPTY} from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class PackagesResolver implements Resolve<any> {
  constructor(private workSpaceService: WorkSpaceService) {}
  resolve(route: ActivatedRouteSnapshot) {
    return this.workSpaceService.getExplorePackages()
      .pipe(catchError(() => {
        return EMPTY;
      }));
  }
}
