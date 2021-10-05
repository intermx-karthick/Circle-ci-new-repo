import {Injectable} from '@angular/core';
import {ActivatedRoute, ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot} from '@angular/router';
import { AuthService } from 'app/auth/auth.service';
import { concatMap, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate, CanLoad {
  constructor(private auth: AuthService, private router: Router, private arouter: ActivatedRoute) {}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.checkToken(state);
  }

  canLoad(route: Route)  {
    return this.checkToken();
  }

  checkToken(state?: RouterStateSnapshot) {
    return this.auth.isAuthenticated$.pipe(
      concatMap((loggedIn: boolean) => {
        if (!loggedIn) {
          this.auth.login(state.url ?? '/');
        }else {
          // If authenticated, get user and set in app
          return !!this.auth.authentication.token? of(true): this.auth.getIdToken$().pipe(
            map((idToken: any)=>{
              if(!idToken) return false;
              this.auth.authentication.token = idToken?.__raw;
              this.auth.authentication.nonce = idToken?.nonce;
              return true;
            })
          );
        }}),
    );
  }
}
