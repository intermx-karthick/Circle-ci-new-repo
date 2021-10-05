import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AuthGuard} from '@shared/guards/auth.guard';
import {AccessGuard} from '@shared/guards/access.guard';
import {PopulationBaseComponent} from './population-base/population-base.component';
import { DefaultAudienceResolver } from '@shared/resolvers/default-audience.resolver';


const routes: Routes = [{
  path: '',
  component: PopulationBaseComponent,
  canActivate: [AuthGuard, AccessGuard],
  resolve: {defaultAudience: DefaultAudienceResolver},
  data: {title: 'Population', module: 'population'}
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PopulationRoutingModule { }
