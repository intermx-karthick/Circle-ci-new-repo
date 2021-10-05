import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccessGuard } from '@shared/guards/access.guard';
import { AuthGuard } from '@shared/guards/auth.guard';
import { GroupsComponent } from './groups/groups.component';
import { SiteConfigurationComponent } from './site-configuration/site-configuration.component';
import { SitesComponent } from './sites/sites.component';
import { UserManagementComponent } from './user-management.component';
import { UsersComponent } from './users/users.component';
import { SiteAdminGuard } from './guards';
import { UserPermissionGuard } from '@shared/guards/user-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: UserManagementComponent,
    data: { title: 'User Management', module: 'userManagement' },
    canActivate: [AuthGuard, AccessGuard],
    canActivateChild: [AccessGuard],
    children: [
      {
        path: '',
        redirectTo: 'sites',
        pathMatch: 'full'
      },
      {
        path: 'sites',
        component: SitesComponent,
        canActivate: [SiteAdminGuard],
        data: { title: 'Sites', module: 'userManagement' }
      },
      {
        path: 'siteconfiguration',
        component: SiteConfigurationComponent,
        canActivate: [UserPermissionGuard],
        data: {
          title: 'Organization', module: 'userManagement',
          submodule: 'organizations', redirectURL: 'usermanagement/groups'
        }
      },
      {
        path: 'siteconfiguration/:siteId',
        component: SiteConfigurationComponent,
        canActivate: [UserPermissionGuard],
        data: {
          title: 'Organization', module: 'userManagement',
          submodule: 'organizations', redirectURL: 'usermanagement/groups'
        }
      },
      {
        path: 'groups',
        component: GroupsComponent,
        canActivate: [UserPermissionGuard],
        data: {
          title: 'Groups & Roles', module: 'userManagement',
          submodule: 'groups', redirectURL: 'usermanagement/users'
        }
      },
      {
        path: 'users',
        component: UsersComponent,
        data: { title: 'Users', module: 'userManagement' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
  exports: [RouterModule]
})
export class UserManagementRouting {}
