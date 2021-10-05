import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
@Injectable()
export class LoginRedirectGuard implements CanActivate {
  constructor(private auth: AuthenticationService, private router: Router) { }
  canActivate(): boolean {
    if (localStorage.getItem('token')) {
      this.router.navigateByUrl('/explore');
      return false;
    } else {
      return true;
    }
  }
}
