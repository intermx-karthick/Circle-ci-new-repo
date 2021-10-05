import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlexLayoutModule } from '@angular/flex-layout';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';

import { EmptyNotificationsMessageComponent } from './empty-notifications-message/empty-notifications-message.component';
import { NotificationsContainerV1Component } from './notifications-container-v1/notifications-container-v1.component';
import { NotificationsV3Component } from './notifications-v3/notifications-v3.component';
import { SharedFunctionsModule } from '@shared/shared-functions.module';

@NgModule({
  declarations: [
    EmptyNotificationsMessageComponent,
    NotificationsContainerV1Component,
    NotificationsV3Component
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    FlexLayoutModule,
    InfiniteScrollModule,
    MatTooltipModule,
    MatButtonModule,
    MatTabsModule,
    MatDividerModule,
    MatRippleModule,
    SharedFunctionsModule
  ],
  exports: [
    EmptyNotificationsMessageComponent,
    NotificationsContainerV1Component,
    SharedFunctionsModule
  ]
})
export class NotificationsModule {}
