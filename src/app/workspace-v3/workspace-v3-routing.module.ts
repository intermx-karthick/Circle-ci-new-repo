import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkspaceBaseComponent } from './workspace-base/workspace-base.component';
import { WorkspaceProjectListComponent } from './workspace-project-list/workspace-project-list.component';
import { ScenarioViewContainerComponent } from './scenario-view-container/scenario-view-container.component';
import { CreateScenarioComponent } from './create-scenario/create-scenario.component';
import {ProjectViewV3Component} from './project-view-v3/project-view-v3.component';
import { DefaultAudienceResolver } from '@shared/resolvers/default-audience.resolver';
import { CanExitGuard } from '@shared/guards/can-exit.guard';

const routes: Routes = [
  {
    path: '',
    component: WorkspaceBaseComponent,
    data: { title: 'Workspace', module: 'v3workspace' },
    children: [
      {
        path: '',
        redirectTo: 'projects/list',
        pathMatch: 'full'
      },
      {
        path: 'projects/lists',
        redirectTo: 'projects/list',
        pathMatch: 'full'
      },
      {
        path: 'projects/list',
        component: WorkspaceProjectListComponent,
        data: { title: 'Workspace', module: 'v3workspace' }
      },
      {
        path: 'projects/:id',
        component: ProjectViewV3Component,
        data: { title: 'Projects', module: 'v3workspace' }
      },
      {
        path: 'scenario/:id',
        component: ScenarioViewContainerComponent,
        canDeactivate: [CanExitGuard],
        data: { title: 'Scenario', module: 'v3workspace' }
      },
      {
        path: 'plan/create',
        component: CreateScenarioComponent,
        data: { title: 'Scenario', module: 'v3workspace' },
        resolve: {
          defaultAudience: DefaultAudienceResolver
        }
      },

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkspaceV3RoutingModule { }
