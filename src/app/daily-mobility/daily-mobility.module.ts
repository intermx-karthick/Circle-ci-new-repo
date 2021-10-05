import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { DailyMobilityRoutingModule } from './daily-mobility-routing.module';
import { DailyMobilityComponent } from './daily-mobility.component';
import { DailyMobilityHomeComponent } from './daily-mobility-home/daily-mobility-home.component';



@NgModule({
  declarations: [DailyMobilityComponent, DailyMobilityHomeComponent],
  imports: [
    CommonModule,
    SharedModule,
    DailyMobilityRoutingModule
  ]
})
export class DailyMobilityModule { }
