import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsComponent } from './reports.component';
import { ReportsRouting } from './reports.routing';
import { SharedModule } from '@shared/shared.module';
import { D3Module } from '@d3/d3.module';
import { ReportsHomeComponent } from './reports-home/reports-home.component';
import { ReportsAPIService } from './services/reports-api.service';
import { ReportsTableauImpVariationComponent } from './reports-tableau-imp-variation/reports-tableau-imp-variation.component';
import { ReportsImpressionVariationComponent } from './reports-impression-variation/reports-impression-variation.component';
import { ReportsNavLeftComponent } from './reports-nav-left/reports-nav-left.component';
import { ReportsTableauReportsComponent } from './reports-tableau-reports/reports-tableau-reports.component';
import { TableauVisualiserResolver } from './resolvers/tableau-visualiser.resolver';
import { ReportsOrganizationComponent } from './reports-organization/reports-organization.component';
import { ReportsListComponent } from './reports-list/reports-list.component';
import { InvoiceReportsContainerComponent } from './reports-organization/invoice-reports-container/invoice-reports-container.component';
import { ReportsPreviewHeaderComponent } from './reports-organization/reports-preview-header/reports-preview-header.component';
import { ReportGenerateFormComponent } from './report-generate-form/report-generate-form.component';
import { VendorService } from '../records-management-v2/vendors/vendor.service';
import { RecordService } from '../records-management-v2/record.service';
import { InventoryService } from '@shared/services';
import { FiltersService } from '../explore/filters/filters.service';
import { ReportLineItemDescriptionComponent } from './report-line-item-description/report-line-item-description.component';
import { ReportPreviewTableMonthlyComponent } from './report-preview-table-monthly/report-preview-table-monthly.component';
import { InvoiceDetailsComponent } from './reports-organization/invoice-reports-container/invoice-details/invoice-details.component';
import { ReportPreviewTableYearlyComponent } from './report-preview-table-yearly/report-preview-table-yearly.component';
import { DetailedContractRecapComponent } from './detailed-contract-recap/detailed-contract-recap.component';
import { DetailedRecapReportContainerComponent } from './reports-organization/detailed-recap-report-container/detailed-recap-report-container.component';
import { MonthlyBillingReviewContainerComponent } from './reports-organization/monthly-billing-review-container/monthly-billing-review-container.component';
import { ReportBillingInstructionComponent } from './report-billing-instruction/report-billing-instruction.component';
import { InvoiceSeparateGenericTableComponent } from './invoice-separate-generic-table/invoice-separate-generic-table.component';
import { InvoiceEndNoteComponent } from './invoice-end-note/invoice-end-note.component';
import { InvoiceInputComponent } from './invoice-input/invoice-input.component';

@NgModule({
    imports: [CommonModule, ReportsRouting, SharedModule, D3Module],
    declarations: [
        ReportsComponent,
        ReportsHomeComponent,
        ReportsTableauImpVariationComponent,
        ReportsImpressionVariationComponent,
        ReportsNavLeftComponent,
        ReportsTableauReportsComponent,
        ReportsOrganizationComponent,
        ReportsListComponent,
        InvoiceReportsContainerComponent,
        ReportsPreviewHeaderComponent,
        ReportGenerateFormComponent,
        ReportPreviewTableMonthlyComponent,
        InvoiceDetailsComponent,
        ReportLineItemDescriptionComponent,
        ReportPreviewTableYearlyComponent,
        DetailedContractRecapComponent,
        DetailedRecapReportContainerComponent,
        MonthlyBillingReviewContainerComponent,
        ReportBillingInstructionComponent,
        InvoiceSeparateGenericTableComponent,
        InvoiceEndNoteComponent,
        InvoiceInputComponent,
    ],
    exports: [ReportsComponent, SharedModule, D3Module],
    providers: [
      ReportsAPIService,
      TableauVisualiserResolver,
      VendorService,
      RecordService,
      InventoryService,
      FiltersService,
    ]
})
export class ReportsModule {}
