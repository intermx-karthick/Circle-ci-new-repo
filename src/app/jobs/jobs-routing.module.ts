import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { JobsComponent } from './jobs.component';
import { AuthGuard } from '@shared/guards/auth.guard';
import { AccessGuard } from '@shared/guards/access.guard';
import { JobsListComponent } from './jobs-list/jobs-list.component';
import { JobDetailsComponent } from './job-details/job-details.component';
import { UserPermissionGuard } from '@shared/guards/user-permission.guard';
import { JobLineItemsListComponent } from './job-line-items-list/job-line-items-list.component';

const routes: Routes = [
  {
    path: '',
    component: JobsComponent,
    data: { title: 'Jobs', module: 'printProduction' },
    canActivate: [AuthGuard, AccessGuard],
    children: [
      {
        path: '',
        component: JobsListComponent,
        canActivate: [UserPermissionGuard],
        data: {
          title: 'Jobs',
          module: 'printProduction',
          submodule: 'print_production',
          redirectURL: '/explore'
        }
      },
      {
        path: 'line-items',
        component: JobLineItemsListComponent,
        data: {
          title: 'Jobs Line Items',
          module: 'printProduction',
          submodule: 'jobsLineItems',
          redirectURL: '/explore'
        }
      },
      {
        path: ':id',
        component: JobDetailsComponent,
        data: { title: 'Jobs', module: 'printProduction' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobsRoutingModule { }
