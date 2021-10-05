import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from '@shared/guards/auth.guard';
import { AccessGuard } from '@shared/guards/access.guard';
import { RecordsManagementV2Component } from './records-management-v2.component';
import { VendorsComponent } from './vendors/vendors.component';
import { AddVendorComponent } from './vendors/add-vendor/add-vendor.component';
import { ContactsComponent } from './contacts/contacts.component';
import { AddContactComponent } from './contacts/add-contact/add-contact.component';
import { VendorListComponent } from './vendors/vendor-list/vendor-list.component';
import { AgenciesComponent } from './agencies/agencies.component';
import { VendorViewComponent } from './vendors/vendor-view/vendor-view.component';
import { AddClientComponent } from './clients/add-client/add-client.component';
import { AddAgenciesComponent } from './agencies/add-agencies/add-agencies.component';
import { ClientsComponent } from './clients/clients.component';
import { ContactViewComponent } from './contacts/contact-view/contact-view.component';
import { AgenciesListComponent } from './agencies/agencies-list/agencies-list.component';
import { AgenciesViewComponent } from './agencies/agencies-view/agencies-view.component'
import { ClientViewComponent } from './clients/client-view/client-view.component';
import { UserPermissionGuard } from '@shared/guards/user-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: RecordsManagementV2Component,
    data: { title: 'Records Management', module: 'recordsManagement' },
    canActivate: [AuthGuard, AccessGuard],
    canActivateChild: [AccessGuard],
    children: [
      {
        path: '',
        redirectTo: 'vendors',
        pathMatch: 'full'
      },
      {
        path: 'vendors',
        component: VendorsComponent,
        canActivate: [UserPermissionGuard],
        data: { 
          title: 'Vendors',
          module: 'recordsManagement',
          submodule: 'vendor_general',
          redirectURL: 'records-management-v2/clients'
        },
        children: [
          {
            path: '',
            component: VendorListComponent,
            data: { title: 'Vendors', module: 'recordsManagement' }
          },
          {
            path: 'add',
            component: AddVendorComponent,
            data: { title: 'Vendors', module: 'recordsManagement' }
          },
          {
            path: ':id',
            component: VendorViewComponent,
            data: { title: 'Vendors', module: 'recordsManagement' }
          }
        ]
      },
      {
        path: 'contacts',
        component: ContactsComponent,
        canActivate: [UserPermissionGuard],
        data: { 
          title: 'Contacts',
          module: 'recordsManagement',
          submodule: 'contacts',
          redirectURL: '/'
        }
      },
      {
        path: 'contacts/add',
        component: AddContactComponent,
        canActivate: [UserPermissionGuard],
        data: { 
          title: 'Contacts', submodule: 'contacts',
          module: 'recordsManagement', redirectURL: '/'
         }
      },
      {
        path: 'contacts/:id',
        component: ContactViewComponent,
        canActivate: [UserPermissionGuard],
        data: { 
          title: 'Contacts', module: 'recordsManagement',
          submodule: 'contacts', redirectURL: '/'
        }
      },
      {
        path: 'clients/add',
        component: AddClientComponent,
        data: { title: 'Clients', module: 'recordsManagement' }
      },
      {
        path: 'clients',
        component: ClientsComponent,
        canActivate: [UserPermissionGuard],
        data: { 
          title: 'Clients',
          module: 'recordsManagement',
          submodule: 'client_general',
          redirectURL: 'records-management-v2/agencies'
        }
      },
      {
        path: 'clients/:id',
        component: ClientViewComponent,
        data: { title: 'Clients', module: 'recordsManagement' }
      },
      {
        path: 'agencies',
        component: AgenciesComponent,
        data: {
          title: 'Agencies',
          module: 'recordsManagement',
          submodule: 'agency',
          redirectURL: 'records-management-v2/contacts'
        },
        canActivate: [UserPermissionGuard],
        children: [
          {
            path: '',
            component: AgenciesListComponent,
            data: { title: 'Agencies', module: 'recordsManagement' }
          },
          {
            path: 'add',
            component: AddAgenciesComponent,
            data: { title: 'Agencies', module: 'recordsManagement' }
          },
          {
            path: ':id',
            component: AgenciesViewComponent,
            data: { title: 'Agencies', module: 'recordsManagement' }
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RecordsManagementV2RoutingModule {}
