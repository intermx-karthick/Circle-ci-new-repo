import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JobsRoutingModule } from './jobs-routing.module';
import { JobsComponent } from './jobs.component';
import { SharedModule } from '@shared/shared.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BlockScrollStrategy, Overlay } from '@angular/cdk/overlay';
import { MAT_SELECT_SCROLL_STRATEGY } from '@angular/material/select';

import { RecordService } from 'app/records-management-v2/record.service';
import { ContractsSearchService } from 'app/contracts-management/services/contracts-search.service';
import { JobDetailsService } from './services/job-details.service';
import { JobsService } from './jobs.service';
import { JobLineItemService } from './services/job-line-item.service';
import { JobPurchaseOrderService } from './services/job-purchase-order.service';

import { JobsListComponent } from './jobs-list/jobs-list.component';
import { JobDetailsComponent } from './job-details/job-details.component';
import { JobCoreDetailsComponent } from './job-details/job-core-details/job-core-details.component';
import { ReportsAPIService } from 'app/reports/services/reports-api.service';
import { AddJobComponent } from './jobs-list/add-job/add-job.component';
import { PreviewAuthorizationComponent } from './preview-authorization/preview-authorization.component';
import { JobsOrganizationViewComponent } from './jobs-organization-view/jobs-organization-view.component';
import { JobsListTableComponent } from './jobs-list-table/jobs-list-table.component';
import { PreviewInvoiceComponent } from './preview-invoice/preview-invoice.component';
import { JobAttachmentsComponent } from './job-details/job-attachments/job-attachments.component';
import { JobLineItemDialogComponent } from './job-details/job-core-details/job-line-item-dialog/job-line-item-dialog.component';
import { InfiniteSelectModule } from '@shared/components/infinite-select/infinite-select.module';
import { ContractsService } from 'app/contracts-management/services/contracts.service';
import { ContractLineItemsService } from 'app/contracts-management/services/contract-line-items.service';
import { ClientsService } from 'app/contracts-management/services/clients.service';
import { VendorService } from 'app/contracts-management/services/vendor.service';
import { MediaDetailsService } from 'app/contracts-management/services/media-details.service';
import { AddressServiceService } from 'app/contracts-management/services/address-service.service';
import { ClientEstimateService } from 'app/contracts-management/services/client-estimate.service';
import { BillingExportService } from 'app/contracts-management/services/billing-export.service';
import { InsertionOrdersService } from 'app/contracts-management/services/insertion-orders.service';

import { JobLineItemsComponent } from './job-details/job-line-items/job-line-items.component';
import { JobPurchaseOrderComponent } from './job-details/job-purchase-order/job-purchase-order.component';
import { JobPuchaseOrderAttachementComponent } from './job-details/job-purchase-order/job-puchase-order-attachement/job-puchase-order-attachement.component';
import { JobLineItemsListComponent } from './job-line-items-list/job-line-items-list.component';
import { JobLineItemListTableComponent } from './job-line-items-list/job-line-item-list-table/job-line-item-list-table.component';


export function scrollFactory(overlay: Overlay): () => BlockScrollStrategy {
  return () => overlay.scrollStrategies.block();
}
@NgModule({
  declarations: [
    JobsComponent,
    JobsListComponent,
    JobDetailsComponent,
    JobCoreDetailsComponent,
    AddJobComponent,
    PreviewAuthorizationComponent,
    JobsOrganizationViewComponent,
    JobsListTableComponent,
    PreviewAuthorizationComponent,
    PreviewInvoiceComponent,
    JobAttachmentsComponent,
    JobLineItemsComponent,
    JobLineItemDialogComponent,
    JobPurchaseOrderComponent,
    JobPuchaseOrderAttachementComponent,
    JobLineItemsListComponent,
    JobLineItemListTableComponent,
  ],
  imports: [
    CommonModule,
    JobsRoutingModule,
    SharedModule,
    InfiniteSelectModule,
  ],
  providers: [
    SharedModule,
    RecordService,
    ReportsAPIService,
    ContractsSearchService,
    JobDetailsService,
    JobsService,
    ContractsService,
    ContractLineItemsService,
    ClientsService,
    VendorService,
    MediaDetailsService,
    AddressServiceService,
    ClientEstimateService,
    BillingExportService,
    InsertionOrdersService,
    JobLineItemService,
    JobPurchaseOrderService,
    {
      provide: MatDialogRef,
      useValue: {}
    },
    {
      provide: MAT_DIALOG_DATA,
      useValue: {}
    },
    { provide: MAT_SELECT_SCROLL_STRATEGY, useFactory: scrollFactory, deps: [Overlay] }
  ],
  entryComponents: [
    JobLineItemDialogComponent

  ]
})
export class JobsModule { }
