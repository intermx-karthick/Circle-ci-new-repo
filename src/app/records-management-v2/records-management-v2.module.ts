import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { RecordsManagementV2RoutingModule } from './records-management-v2-routing.module';
import { RecordsManagementV2Component } from './records-management-v2.component';
import { RecordsManagementMenuV2Component } from './records-management-menu-v2/records-management-menu-v2.component';
import { SharedModule } from '@shared/shared.module';
import * as Vendors from './vendors';
import * as Address from './address';
import { VendorService } from './vendors/vendor.service';
import { TelephoneInputComponent } from './telephone/telephone-input/telephone-input.component';
import * as Contacts from './contacts';
import * as Agencies from './agencies';
import * as Clients from './clients';
import { RecordService } from './record.service';
import { ContactViewComponent } from './contacts/contact-view/contact-view.component';
import { AgenciesViewComponent } from './agencies/agencies-view/agencies-view.component';
import { AgenciesListComponent } from './agencies/agencies-list/agencies-list.component';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { ContactFormComponent } from './contacts/contact-form';
import { EstimateListComponent } from './clients/estimate-list/estimate-list.component';
import { ShippingAddressListComponent } from './shipping-address-list/shipping-address-list.component';
import { NotesComponent } from './notes/notes.component';
import { NoteDialogComponent } from './notes/note-dialog/note-dialog.component';
import { MAT_SELECT_SCROLL_STRATEGY } from '@angular/material/select';
import { Overlay, BlockScrollStrategy } from '@angular/cdk/overlay';
import { OrganiazationViewComponent } from './organiazation-view/organiazation-view.component';

/*To block overlay scroll for mat-select */
export function scrollFactory(overlay: Overlay): () => BlockScrollStrategy {
  return () => overlay.scrollStrategies.block();
}

@NgModule({
  declarations: [
    RecordsManagementV2Component,
    RecordsManagementMenuV2Component,
    Vendors.COMPONENTS,
    Address.COMPONENTS,
    Contacts.COMPONENTS,
    Agencies.COMPONENTS,
    Clients.COMPONENTS,
    TelephoneInputComponent,
    ContactViewComponent,
    AgenciesViewComponent,
    AgenciesListComponent,
    ContactFormComponent,
    ContactFormComponent,
    EstimateListComponent,
    ShippingAddressListComponent,
    NotesComponent,
    NoteDialogComponent,
    OrganiazationViewComponent,
  ],
  imports: [
    CommonModule,
    RecordsManagementV2RoutingModule,
    SharedModule,
    FlexLayoutModule,
    MatIconModule,
    MatButtonModule,
    MatBottomSheetModule
  ],
  providers: [
    VendorService, 
    RecordService,
    { provide: MAT_SELECT_SCROLL_STRATEGY, useFactory: scrollFactory, deps: [Overlay] }
    ]
})
export class RecordsManagementV2Module {}
