import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { SharedModule } from "@shared/shared.module";
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {ClipboardModule} from '@angular/cdk/clipboard';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BlockScrollStrategy, CloseScrollStrategy, Overlay } from '@angular/cdk/overlay';
import { MAT_SELECT_SCROLL_STRATEGY } from '@angular/material/select';
import { MAT_AUTOCOMPLETE_SCROLL_STRATEGY } from '@angular/material/autocomplete';

import { ContractsManagementComponent } from "./contracts-management.component"
import { ContractsRoutingModule } from "./contracts-management.routes";
import { AddContractDialogComponent } from "./contracts/contracts-list/add-contract-dialog/add-contract-dialog.component";
import { ContractDetailsComponent } from "./contracts/contracts-list/contract-details/contract-details.component";
import { ContractCoreDetailsComponent } from "./contracts/contracts-list/contract-details/core-details/contract-core-details.component";
import { ContractsLineItemsTableComponent } from "./contracts/contracts-list/contract-details/core-details/contracts-line-items-table/contracts-line-items-table.component";
import { ImportLineItemsDialogComponent } from "./contracts/contracts-list/contract-details/core-details/import-line-items-dialog/import-line-items-dialog.component";
import { UploadLineItemsComponent } from "./contracts/contracts-list/contract-details/core-details/import-line-items-dialog/upload-line-items/upload-line-items.component";
import { ContractsListTableComponent } from "./contracts/contracts-list/contracts-list-table/contracts-list-table.component";
import { ContractsListComponent } from "./contracts/contracts-list/contracts-list.component";
import { ContractsComponent } from "./contracts/contracts.component";
import { ValidateImportedDataComponent } from "./contracts/contracts-list/contract-details/core-details/import-line-items-dialog/validate-imported-data/validate-imported-data.component";
import { ValidatingDataFromImportsComponent } from "./contracts/contracts-list/contract-details/core-details/import-line-items-dialog/validating-data-from-imports/validating-data-from-imports.component";
import { AddLineItemDialogComponent } from "./contracts/contracts-list/contract-details/core-details/add-line-item-dialog/add-line-item-dialog.component";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { ContractsService } from "./services/contracts.service";
import { ContractsSearchService } from "./services/contracts-search.service";
import { NumbersOnly } from "./contracts/contracts-shared/directives/currency-amount.directive";
import { VendorContractListComponent } from './contracts/contracts-shared/components/vendor-contract-list/vendor-contract-list.component';
import { InfiniteSelectModule } from '@shared/components/infinite-select/infinite-select.module';
import { ClientsService } from './services/clients.service';
import { VendorService } from './services/vendor.service';
import { ContractPreviewComponent } from './contract-preview/contract-preview.component';
import { ContractsLineItemComponent } from './contracts-line-item/contracts-line-item.component';
import { ContractAttachmentsComponent } from './contracts/contracts-list/contract-attachments/contract-attachments.component';
import { EditingContractComponent } from './editing-contract/editing-contract.component';
import { VendorContractsAttachmentComponent } from './contracts/contracts-shared/components/vendor-contract-list/vendor-contracts-attachment/vendor-contracts-attachment.component';
import { ContractLineItemsService } from "./services/contract-line-items.service";
import { RecordService } from 'app/records-management-v2/record.service';
import { TermsComponent } from './editing-contract/tab-components/terms/terms.component';
import { HeaderFooterComponent } from './editing-contract/tab-components/header-footer/header-footer.component';
import { MediaDetailsService } from './services/media-details.service';
import { SpotIdResultsDialogComponent } from './contracts/contracts-list/contract-details/core-details/spot-id-results-dialog/spot-id-results-dialog.component';
import { AddressServiceService } from './services/address-service.service';
import { TimeCostsComponent } from "./contracts/contracts-list/contract-details/core-details/add-line-item-dialog/time-costs/time-costs.component";
import { ClientEstimateService } from "./services/client-estimate.service";
import { MatRippleModule } from '@angular/material/core';
import { InsertionOrdersComponent } from './insertion-orders/insertion-orders.component';
import { InsertionOrdersListComponent } from './insertion-orders/insertion-orders-list/insertion-orders-list.component';
import { InsertionOrdersSearchComponent } from './insertion-orders/insertion-orders-search/insertion-orders-search.component';
import { InsertionOrdersService } from "./services/insertion-orders.service";
import { LineItemsComponent } from './line-items/line-items.component';
import { VendorContractsComponent } from './vendor-contracts/vendor-contracts/vendor-contracts.component';
import { VContractListComponent } from "./vendor-contracts/vcontract-list/vcontract-list.component";
import { ExportSearchComponent } from './billing-exports/export-search/export-search.component';
import { BillingExportTableComponent } from './billing-exports/billing-export-table/billing-export-table.component';
import { BillingExportService } from "./services/billing-export.service";
import { BillingExportDialogComponent } from './billing-exports/billing-export-dialog/billing-export-dialog.component';
import { ArchivedExportsComponent } from './archived-exports/archived-exports.component';

export function scrollFactory(overlay: Overlay): () => BlockScrollStrategy {
  return () => overlay.scrollStrategies.block();
}

export function scrollFactoryAutoComplete(overlay: Overlay): () => CloseScrollStrategy {
  return () => overlay.scrollStrategies.close();
}
@NgModule({
  declarations: [
    ContractsManagementComponent,
    ContractsComponent,
    ContractsListComponent,
    ContractsListTableComponent,
    AddContractDialogComponent,
    ContractDetailsComponent,
    ContractCoreDetailsComponent,
    ContractsLineItemsTableComponent,
    ImportLineItemsDialogComponent,
    UploadLineItemsComponent,
    ValidateImportedDataComponent,
    ValidatingDataFromImportsComponent,
    AddLineItemDialogComponent,
    NumbersOnly,
    VendorContractListComponent,
    ContractPreviewComponent,
    ContractsLineItemComponent,
    ContractAttachmentsComponent,
    EditingContractComponent,
    VendorContractsAttachmentComponent,
    TermsComponent,
    HeaderFooterComponent,
    SpotIdResultsDialogComponent,
    TimeCostsComponent,
    InsertionOrdersComponent,
    InsertionOrdersListComponent,
    InsertionOrdersSearchComponent,
    VendorContractsComponent,
    VContractListComponent,
    LineItemsComponent,
    ExportSearchComponent,
    BillingExportTableComponent,
    BillingExportDialogComponent,
    ArchivedExportsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    ContractsRoutingModule,
    MatProgressBarModule,
    ScrollingModule,
    InfiniteScrollModule,
    InfiniteSelectModule,
    ClipboardModule,
    MatSlideToggleModule,
    MatRippleModule,
    InfiniteScrollModule,
  ],
  providers: [
    ContractsService,
    ContractsSearchService,
    ClientsService,
    VendorService,
    ContractLineItemsService,
    RecordService,
    MediaDetailsService,
    AddressServiceService,
    ClientEstimateService,
    BillingExportService,
    InsertionOrdersService,
    {
      provide: MatDialogRef,
      useValue: {}
    },
    {
      provide: MAT_DIALOG_DATA,
      useValue: {}
    },
    { provide: MAT_SELECT_SCROLL_STRATEGY, useFactory: scrollFactory, deps: [Overlay] },
    { provide: MAT_AUTOCOMPLETE_SCROLL_STRATEGY, useFactory: scrollFactoryAutoComplete, deps: [Overlay] }
  ]
})
export class ContractsManagementModule {}
