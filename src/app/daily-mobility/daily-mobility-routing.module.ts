import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DailyMobilityComponent } from './daily-mobility.component';
import { DailyMobilityHomeComponent } from './daily-mobility-home/daily-mobility-home.component';

const routes: Routes = [
  {
    path: '',
    component: DailyMobilityComponent,
    data: { title: 'Daily Mobility', module: 'dailyMobility' },
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        component: DailyMobilityHomeComponent,
        data: { title: 'Daily Mobility', module: 'dailyMobility' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
  exports: [RouterModule]
})
export class DailyMobilityRoutingModule { }
