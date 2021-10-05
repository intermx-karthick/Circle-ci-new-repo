import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './admin.component';
import { AdminRoutingModule } from './admin.routing';
import { SharedModule } from '@shared/shared.module';
import { AdminNavLeftComponent } from './admin-nav-left/admin-nav-left.component';
import { NewAlertComponent } from './new-alert/new-alert.component';
import { AlertHistoryComponent } from './alert-history/alert-history.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import {NotificationDetailsResolver} from './resolvers/notification-details.resolver';



@NgModule({
  declarations: [AdminComponent, AdminNavLeftComponent, NewAlertComponent, AlertHistoryComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule,
    MatPaginatorModule
  ],
  exports: [
    SharedModule,
    AdminComponent
  ],
  providers: [
    NotificationDetailsResolver,
  ]
})
export class AdminModule { }
