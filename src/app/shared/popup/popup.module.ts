import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

import { PopupComponent } from './popup.component';



@NgModule({
  declarations: [
    PopupComponent,
  ],
  imports: [
    CommonModule,
    MatIconModule,
    OverlayModule,
    PortalModule,
  ]
})
export class PopupModule { }
