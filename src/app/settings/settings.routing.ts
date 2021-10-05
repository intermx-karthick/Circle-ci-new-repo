import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {ThemeSettingsComponent} from './theme-settings/theme-settings.component';
import {UserProfileComponent} from './user-profile/user-profile.component';
import {AuthGuard} from '@shared/guards/auth.guard';
import {AccessGuard} from '@shared/guards/access.guard';
import { SettingsComponent } from './settings.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: SettingsComponent,
        data: { title: 'Settings' , module: 'explore'},
        children: [
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full'
          },
          {
            path: 'profile',
            component: UserProfileComponent,
            data: { title: 'Profile', module: 'profile' },
            canActivate: [AuthGuard, AccessGuard]
          },
          {
            path: 'theme',
            component: ThemeSettingsComponent,
            data: { title: 'Settings', module: 'settings' },
            canActivate: [AuthGuard, AccessGuard]
          }
        ]
      }
    ])
  ],
  declarations: [],
  exports: [ RouterModule ]
})

export class SettingsRouting { }
