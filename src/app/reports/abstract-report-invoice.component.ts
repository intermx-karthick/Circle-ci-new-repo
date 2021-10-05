import { Component, Inject, Optional, SkipSelf } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { filter, finalize } from 'rxjs/operators';

import { PreviewReportResponse } from '@interTypes/reports/preview-report.response';
import { ReportsAPIService } from './services/reports-api.service';
import { AbstractReportActionComponent } from './abstract-report-action.component';
import { GenerateReportFilters } from '@interTypes/reports';

import { saveAs } from 'file-saver';
@Component({
  template: ''
})
export abstract class AbstractReportInvoiceComponent<T> extends AbstractReportActionComponent {

  public report: PreviewReportResponse;
  public filters: GenerateReportFilters;
  public pdfValues: any = {};

  public isLoading = false;

  protected constructor(
    protected reportService: ReportsAPIService,
    protected dialog: MatDialog,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<T>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {
    super(reportService, dialog);
    //this.loadReport();
  }

  abstract save(): void;
  abstract regenerate(): void;

  protected loadReport() {
    this.isLoading = true;

    this.reportService
      .getPreviewReport(this.dialogData?._id)
      .pipe(
        filter((res) => res.status === 'success'),
        finalize(() => (this.isLoading = false))
      )
      .subscribe((res) => {
        this.report = res;
      });
  }

  public closeDialogBox() {
    this.dialogRef.close();
  }

  public handleDelete() {
    this.deleteReport(this.report);
  }

  public handleDuplicate() {
    this.duplicateReport(this.report);
  }

  public handleExport() {
    saveAs(this.pdfValues?.body, this.pdfValues?.name);
  }

  public handleRegenerate() {
    this.dialogRef.close({ type: 'REGENERATE' });
  }

  public reportHeaderAction(actions) {
    switch (actions['action']) {
      case 'close':
        this.closeDialogBox();
        break;
      case 'regenerate':
        this.regenerate();
        break;
      case 'save':
        this.save();
        break;
      case 'export':
        this.handleExport();
        break;
      default:
        break;
    }
  }

}
