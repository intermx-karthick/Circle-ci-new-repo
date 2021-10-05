import { Component, OnInit, ChangeDetectionStrategy, Optional, SkipSelf, Inject, Input, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GenerateReportFilters } from '@interTypes/reports';
import { AbstractReportInvoiceComponent } from '../../abstract-report-invoice.component';
import { ReportsAPIService } from '../../services/reports-api.service';
import { SnackbarService } from '@shared/services';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-invoice-reports-container',
  templateUrl: './invoice-reports-container.component.html',
  styleUrls: ['./invoice-reports-container.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceReportsContainerComponent extends AbstractReportInvoiceComponent<InvoiceReportsContainerComponent>
  implements OnInit {

  @Input() isForMedia = true;

  private unSub$: Subject<void> = new Subject<void>();

  constructor(
    protected reportService: ReportsAPIService,
    protected dialog: MatDialog,
    private snackbarService: SnackbarService,
    private cdRef: ChangeDetectorRef,
    @Optional()
    @SkipSelf()
    public dialogRef: MatDialogRef<InvoiceReportsContainerComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {
    super(reportService, dialog, dialogRef, dialogData);
    this.filters = dialogData?.filters
    this.pdfValues = dialogData?.pdfValues;
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.unSub$.next();
    this.unSub$.complete();
  }

  public save(): void {
  }

  /* method used to call generate API when Re-generate action made */
  public regenerate(): void {
    this.reportService.generateReport(this.filters)
    .pipe(takeUntil(this.unSub$))
    .subscribe((res:any) => {
      if (res?.body) {
        this.snackbarService.showsAlertMessage('Report Generated Successfully');
        const contentDispose = res.headers.get('content-disposition');
        const matches = contentDispose.split(';')[1].trim().split('=')[1];
        let filename = matches && matches.length > 1 ? matches : 'report' + '.pdf';
        filename = filename.slice(1, filename.length-1);
        this.pdfValues = { body: res.body, name: filename };
      } else if (res?.success == 'success') {
        this.snackbarService.showsAlertMessage(res?.message ?? 'We will process your request and share the report through notifications');
      }
      this.cdRef.markForCheck();
    }, async (error) => {
      let message = (error?.error?.type != 'error') ? JSON.parse(await error?.error?.text()) : { error: error?.message };
      message = message?.api-message ? message.api-message : message?.error;
      if (!message) {
        message = 'Something went wrong';
      }
      this.snackbarService.showsAlertMessage(message);
    });
  }

}
