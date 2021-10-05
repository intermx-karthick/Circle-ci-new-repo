import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {AuthGuard} from '@shared/guards/auth.guard';
import {AccessGuard} from '@shared/guards/access.guard';
import { AdminComponent } from './admin.component';
import {NewAlertComponent} from './new-alert/new-alert.component';
import {AlertHistoryComponent} from './alert-history/alert-history.component';
import { CanExitGuard } from '@shared/guards/can-exit.guard';
import {MarketsDummyResolver} from '@shared/resolvers/markets-dummy.resolver';
import {DefaultAudienceResolver} from '@shared/resolvers/default-audience.resolver';
import {CountiesResolver} from '@shared/resolvers/counties.resolver';
import {NotificationDetailsResolver} from './resolvers/notification-details.resolver';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: AdminComponent,
        canActivate: [ AuthGuard ],
        canActivateChild: [ AccessGuard ],
        canDeactivate: [CanExitGuard],
        children: [
          {path: '', redirectTo: 'alerts/list'},
          {
            path: 'alerts/create',
            component: NewAlertComponent,
            canDeactivate: [CanExitGuard],
            data: { title: 'Create Notification', module: 'admin'},
            canActivate: [AccessGuard],
            },
          {
            path: 'alerts/list',
            component: AlertHistoryComponent,
            data: { title: 'Notifications History', module: 'admin'},
            canActivate: [AccessGuard],
          },
          {
            path: 'alerts/edit/:id',
            component: NewAlertComponent,
            data: { title: 'Edit Notification', module: 'admin'},
            canActivate: [AccessGuard],
            resolve: {
              notification: NotificationDetailsResolver,
            }
          },
        ]
      }
    ])
  ],
  declarations: [],
  exports: [ RouterModule ]
})

export class AdminRoutingModule {}
