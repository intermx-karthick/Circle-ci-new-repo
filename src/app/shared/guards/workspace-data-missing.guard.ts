import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {WorkSpaceDataService} from '../services/work-space-data.service';

@Injectable()
export class WorkspaceDataMissingGuard implements CanActivate {
  constructor(private workSpace: WorkSpaceDataService) {
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const mandatory = route.data.mandatory;
    if (
      !this.workSpace[mandatory] ||
      this.workSpace['mandatory'] === ''
    ) {
      return false;
    }
    return true;
  }
}
