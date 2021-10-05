import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {UserComponent} from './user.component';
import {LoginComponent} from './login/login.component';
import {LoginRedirectGuard} from '@shared/guards/login-redirect.guard';
import {RegisterComponent} from './register/register.component';
import {ConfirmComponent} from './confirm/confirm.component';
import {LoginResolver} from './resolvers/login.resolver';
import { PublicSiteRedirctGaurd } from '@shared/guards/public-site-redirect.gaurd';
import {LogoutComponent} from './logout/logout.component';
import { UserLoginRedirectGuard } from '@shared/guards/user-login-redirect.guard';

@NgModule({
  imports: [

    RouterModule.forChild([
      {
        path: 'user',
        component: UserComponent,
        resolve: {themeSettings: LoginResolver},
        children: [
          {
            path: 'logout',
            component: LogoutComponent,
            data: {title: 'Logout'}
          },
          {
            path: 'login',
            canActivate: [UserLoginRedirectGuard],
            component: LoginComponent,
            data: { title: 'Login' }
          },
          {
            path: 'signup',
            component: RegisterComponent,
            canActivate: [LoginRedirectGuard],
            data: {title: 'Signup'}
          },
          {
            path: 'confirm',
            component: ConfirmComponent,
            canActivate: [LoginRedirectGuard],
            data: {title: 'Confirm'}
          },
          {
            path: 'public',
            component: LoginComponent,
            canActivate: [LoginRedirectGuard],
            resolve: {themeSettings: LoginResolver},
            data: {title: 'Public'}
          }
        ]
      }
    ])
  ],
  declarations: [],
  exports: [ RouterModule]
})
export class UserRouting { }
