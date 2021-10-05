import { InfiniteSelectModule } from './../shared/components/infinite-select/infinite-select.module';
import { MatInputModule } from '@angular/material/input';
import { Overlay } from '@angular/cdk/overlay';
import { scrollFactory } from 'app/records-management-v2/records-management-v2.module';
import { MAT_SELECT_SCROLL_STRATEGY } from '@angular/material/select';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { DivisionTableComponent } from './site-configuration/division-table/division-table.component';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MatTabsModule } from '@angular/material/tabs';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { UserManagementRouting } from './user-management.routes';
import { SitesComponent } from './sites/sites.component';
import { UserManagementComponent } from './user-management.component';
import { SitesCardComponent } from './sites/site-card/site-card.component';
import { AddSiteDialog } from './sites/add-site-dialog/add-site-dialog.component';
import { SiteConfigurationComponent } from './site-configuration/site-configuration.component';
import { GroupsComponent } from './groups/groups.component';
import {
  GroupsService,
  UsersService,
  RolesService,
  SitesService,
  AccessControlsService,
  UserBlocksService,
  ModuleAccessesService,
  ClientsService
} from './services';
import { GroupDetailComponent } from './groups/group-detail.component/group-detail.component';
import { MultiSelectGroupDetailsComponent } from './groups/multi-select-group-details.component/multi-select-group-details.component';
import { AddGroupDialog } from './groups/add-group-dialog/add-group-dialog';
import { UsersComponent } from './users/users.component';
import { UserDetailsComponent } from './users/users-details/user-details.component';
import { AddUserDialogComponent } from './users/add-user-dialog/add-user-dialog.component';
import { UserDetailsDialogComponent } from './users/user-details-dialog/user-details-dialog.component';
import { ModulesInfoDialogComponent } from './site-configuration/modules-info-dialog/modules-info-dialog.component';
import { OfficesTableComponent } from './site-configuration/offices-table/offices-table.component';
import { AddOffficeDialogComponent } from './site-configuration/add-offfice-dialog/add-offfice-dialog.component';
import { AddDivisionDialogComponent } from './site-configuration/add-division-dialog/add-division-dialog.component';
import { RecordService } from 'app/records-management-v2/record.service';
import { NotesModule } from '@shared/components/notes/notes.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ClientAccessDialogComponent } from './users/client-access-dialog/client-access-dialog.component';
import { SiteAdminGuard } from './guards';

@NgModule({
  declarations: [
    UserManagementComponent,
    SitesComponent,
    SitesCardComponent,
    AddSiteDialog,
    SiteConfigurationComponent,
    GroupsComponent,
    GroupDetailComponent,
    MultiSelectGroupDetailsComponent,
    AddGroupDialog,
    UsersComponent,
    UserDetailsComponent,
    AddUserDialogComponent,
    UserDetailsDialogComponent,
    ModulesInfoDialogComponent,
    DivisionTableComponent,
    OfficesTableComponent,
    AddOffficeDialogComponent,
    AddDivisionDialogComponent,
    ClientAccessDialogComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    UserManagementRouting,
    NgxDatatableModule,
    RouterModule,
    InfiniteScrollModule,
    MatTabsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatBottomSheetModule,
    NotesModule,
    InfiniteSelectModule,
    MatInputModule,
    MatFormFieldModule,
    DragDropModule
  ],
  providers: [
    GroupsService,
    UsersService,
    RolesService,
    SitesService,
    AccessControlsService,
    UserBlocksService,
    ModuleAccessesService,
    RecordService,
    ClientsService,
    SiteAdminGuard,
    {
      provide: MAT_SELECT_SCROLL_STRATEGY,
      useFactory: scrollFactory,
      deps: [Overlay]
    }
  ]
})
export class UserManagementModule {}
