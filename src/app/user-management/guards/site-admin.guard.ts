import { Router } from '@angular/router';
import { AuthenticationService } from '@shared/services';
import { Injectable } from '@angular/core';
import { CanActivate, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class SiteAdminGuard implements CanActivate {
  constructor(
    private authenticationService: AuthenticationService,
    private router: Router
  ) {}

  public isSiteAdmin: boolean;

  canActivate():
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    this.isSiteAdmin = JSON.parse(
      localStorage.getItem('user_data')
    ).permissions?.site_admin?.write;

    if (!this.isSiteAdmin) {
      return this.router.navigateByUrl('usermanagement/siteconfiguration');
    }

    return this.isSiteAdmin;
  }
}
