import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { ThemeService } from '../services/theme.service';

@Injectable()
export class AccessGuard implements CanActivateChild, CanActivate {
  constructor(
    private auth: AuthenticationService,
    private router: Router,
    private theme: ThemeService
  ) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.canActivateChild(route, state);
  }
  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const mod = next.data['module'];
    let submodule = next.data['submodule'];
    let redirectURL = next.data['redirectURL'];
    const reportId = next.params?.id || '';
    const url = state.url;
    let themeSettings = JSON.parse(localStorage.getItem('themeSettings'));
    let userAgreementAgreed = localStorage.getItem('userAgreementAgreed');
    const userData = JSON.parse(localStorage.getItem('user_data'));
    this.theme.themeSettings.subscribe(res => {
      themeSettings = this.theme.getThemeSettings();
    });
    if (mod === 'common') {
      return true;
    }
    if (mod === 'admin') {
      const notificationAccess = this.auth.getModuleAccess('notifications');
      if (notificationAccess && notificationAccess['write'] === true) {
        return true;
      } else {
        console.warn('You are not an admin, this incident will be reported');
        return false;
      }
    }
    /** Commented by vignesh M on 9/5/2019 because these conditions doesn't seem to be required when we are using module access data.
    if (url === '/projects/home') {
      if (
        userData &&
        typeof userData['workspace'] !== 'undefined' &&
        typeof userData['workspace']['projects'] !== 'undefined'
      ) {
        this.router.navigate(['/projects/lists']);
      }
    } else if (url === '/projects/lists') {
      if (
        userData &&
        typeof userData['workspace'] === 'undefined' ||
        typeof userData['workspace']['projects'] === 'undefined'
      ) {
        this.router.navigate(['/projects/home']);
      }
    }*/
    if (!mod) {
      return true;
    }
    
    const module_access = this.auth.getModuleAccess(mod);
    if (submodule) {
     
    }
    if (
      module_access &&
      typeof module_access.status !== 'undefined' &&
      !(module_access.status === 'active')
    ) {
      if (redirectURL) {
        this.router.navigateByUrl(redirectURL);
      }
      return false;
    }
    if (submodule === 'subReports') {
      submodule = reportId.split('_')
      .map((val, i) => {
          if (i > 0) {
              return val.charAt(0).toUpperCase() + val.slice(1);
          } else {
              return val;
          }
      })
      .join('');
      switch (submodule) {
        case 'weeklyImpVariation':
          redirectURL = 'reports/cbsa_report/report';
          break;
        case 'cbsaReport':
          redirectURL = 'reports/state_report/report';
          break;
        case 'stateReport':
          redirectURL = 'reports/cbsa_explorer/report';
          break;
        case 'cbsaExplorer':
          redirectURL = 'reports/state_explorer/report';
          break;
        case 'stateExplorer':
          redirectURL = '/';
          break;
        default:
          break;
      }
    }
    if (submodule && submodule !== '') {
      if (module_access && 
        typeof module_access[submodule] !== 'undefined' && 
        typeof module_access[submodule].status !== 'undefined' &&
        !(module_access[submodule].status === 'active')
      ) {
        if (redirectURL) {
          this.router.navigateByUrl(redirectURL);
        }
        console.log(`blocked access to ${mod} -> ${submodule} by access.guard`);
        return false;
      }
    } 
    return true;
  }
}
