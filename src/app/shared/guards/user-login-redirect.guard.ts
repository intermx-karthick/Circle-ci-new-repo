import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthenticationService, ThemeService } from '@shared/services';
import { concatMap, map } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserLoginRedirectGuard implements CanActivate {
  constructor(
    private theme: ThemeService,
    private authentication: AuthenticationService,
    private auth: AuthService,
    private router: Router) {
  }

  /**
   * @description
   *  If user not authenitcated it will redirect to login page. else it will
   *  redirect to landing page except for public site.
   *
   * @ignore the use of guard if not /user/login page
   * @param next
   * @param state
   */
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {

    return this.auth.isAuthenticated$.pipe(
      concatMap((loggedIn: boolean) => {
        if (!loggedIn) {
          this.auth.login(state.url ?? '/');
          return of(false);
        } else {
          // If authenticated, get user and set in app
          return this.auth.getIdToken$().pipe(
            map((idToken: any) => {
              if (!idToken) {
                return false;
              }
              this.authentication.token = idToken?.__raw;
              this.authentication.nonce = idToken?.nonce;
              this.navigateToLandingPage();
              return false;
            })
          );
        }
      })
    );
  }

  private navigateToLandingPage() {
    this.router.navigateByUrl('/');
  }
}
