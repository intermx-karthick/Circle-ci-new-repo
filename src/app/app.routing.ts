import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@shared/guards/auth.guard';
import { MobileViewGuard } from '@shared/guards/mobile-view-guard.service';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { AccessGuard } from '@shared/guards/access.guard';
import {DefaultComponent} from './layout/default.component';
import { CustomPreloadingStrategy } from './custom-preload-strategy';
import { DefaultPageComponent } from '@shared/components/default-page/default-page.component';
import { CallbackComponent } from './auth/callback/callback.component';
import { NetworkError500Component, PageNotFound404Component } from '@shared/components/network-errors';
import { AddAgencyComponent } from './add-agency/add-agency.component';

const appRoutes: Routes = [
  {
    path: 'callback',
    component: CallbackComponent,
    data: { title: 'Callback', module: 'Auth' },
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: DefaultComponent,
      },
      {
        path: 'home',
        component: HomeComponent,
        data: { title: 'Home', module: 'home' },
        canActivate: [AuthGuard, AccessGuard]
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { title: 'Dashboard', module: 'projects' },
        canActivate: [AuthGuard]
      },
      // {
      //   path: 'bootstrap-agency-layout',
      //   component: AddAgencyComponent,
      //   data: { title: 'Add Agency' },
      // },
      {
        path: 'explore',
        loadChildren: () => import('app/explore/explore.module').then(m => m.ExploreModule),
        // canLoad: [AuthGuard],
        // Set preload true if you want to preload load the modules
        data: { preload: true }
      },
      {
        path: 'population',
        loadChildren: () => import('app/population/population.module').then(m => m.PopulationModule),
        canActivate: [AccessGuard],
        data: { preload: true, module: 'populationLibrary'}
      },
      {
        path: 'reports',
        loadChildren: () => import('app/reports/reports.module').then(m => m.ReportsModule),
        // canLoad: [AuthGuard],
        canActivate: [AccessGuard],
        data: { module: 'reports' }
      },
      {
        path: 'settings',
        loadChildren: () => import('app/settings/settings.module').then(m => m.SettingsModule),
        // canLoad: [AuthGuard],
        canActivate: [AccessGuard],
        data: { module: 'settings' }
      },
      {
        path: 'places',
        loadChildren: () => import('app/places/places.module').then(m => m.PlacesModule),
        canActivate: [MobileViewGuard, AccessGuard],
        data: {
          title: 'Places',
          message: 'The Places experience is currently available only in the desktop version of our app.',
          module: 'places',
          preload: true
        },
        // canLoad: [AuthGuard]
      },
      {
        path: 'v2/projects',
        redirectTo: 'workspace-v3/projects/list'
      },
      {
        path: 'admin',
        loadChildren: () => import('app/admin/admin.module').then(m => m.AdminModule),
        data: { module: 'Admin' }
      },
      {
        path: 'daily-mobility',
        loadChildren: () => import('app/daily-mobility/daily-mobility.module').then(m => m.DailyMobilityModule),
        canActivate: [AuthGuard, MobileViewGuard, AccessGuard],
        canActivateChild: [MobileViewGuard],
        data: {
          title: 'Daily Mobility',
          message: '',
          module: 'dailyMobility'
        }
      },
      {
        path: 'citycast',
        loadChildren: () => import('app/city-cast/city-cast.module').then(m => m.CityCastModule),
        canActivate: [AuthGuard, MobileViewGuard, AccessGuard],
        canActivateChild: [MobileViewGuard],
        data: {
          title: 'CityCast',
          message: '',
          module: 'networkLibrary'
        }
      },
      {
        path: 'usermanagement',
        loadChildren: () => import('app/user-management/user-management.module').then(m => m.UserManagementModule),
        canActivate: [AuthGuard, MobileViewGuard, AccessGuard],
        canActivateChild: [MobileViewGuard],
        data: {
          title: 'User Management',
          message: '',
          module: 'userManagement'
         }
      },
      {
        path: 'contracts-management',
        loadChildren: () => import('app/contracts-management/contracts-management.module').then(m => m.ContractsManagementModule),
        canActivate: [AuthGuard, MobileViewGuard, AccessGuard],
        canActivateChild: [MobileViewGuard],
        data: {
          title: 'Contracts',
          message: '',
          module: 'contractManagement'
         }
      },
      {
        path: 'records-management-v2',
        loadChildren: () =>
          import('app/records-management-v2/records-management-v2.module').then(
            (m) => m.RecordsManagementV2Module
          ),
        canActivate: [AuthGuard, MobileViewGuard, AccessGuard],
        canActivateChild: [MobileViewGuard],
        data: {
          title: 'Records Management',
          message: '',
          module: 'recordsManagement'
        }
      },
      {
        path: 'workspace-v3',
        loadChildren: () =>
          import('app/workspace-v3/workspace-v3.module').then(
            (m) => m.WorkspaceV3Module
          ),
        canActivate: [AuthGuard, AccessGuard],
        canActivateChild: [AccessGuard],
        data: {
          title: 'Workspace',
          message: '',
          module: 'v3workspace'
        }
      },
      {
        path: 'jobs',
        loadChildren: () =>
          import('app/jobs/jobs.module').then((m) => m.JobsModule),
        data: { module: 'jobs', title: 'Jobs', message: '' }
      },
      {
        path: 'tasks',
        loadChildren: () => import('app/tasks/tasks.module').then(m => m.TasksModule),
        canActivate: [AuthGuard, MobileViewGuard, AccessGuard],
        data: { module: 'tasks', title: 'tasks', message: '' }
      }
    ]
  },
  {
    path: 'user',
    loadChildren: () => import('app/user/user.module').then(m => m.UserModule)
  },
  {
    path: 'error',
    component: NetworkError500Component,
    data: {title: 'Intermx'}
  },
  {
    path: '404',
    component: PageNotFound404Component,
    data: {title: 'Page Not Found'}
  },
  {
    path: '**',
    redirectTo: '/404'
  }
];

export const AppRouting = RouterModule.forRoot(appRoutes, { preloadingStrategy: CustomPreloadingStrategy, enableTracing: false, relativeLinkResolution: 'legacy' });
