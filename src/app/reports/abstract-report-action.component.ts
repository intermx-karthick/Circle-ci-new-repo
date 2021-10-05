import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter, mergeMap } from 'rxjs/operators';

import { ReportsAPIService } from './services/reports-api.service';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';

@Component({
  template: ''
})
export abstract class AbstractReportActionComponent {
  protected constructor(
    protected reportService: ReportsAPIService,
    protected dialog: MatDialog
  ) {
  }

  public deleteReport(report) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(
        filter((result) => result && result['action']),
        mergeMap((result) => {
          return this.reportService.deleteReport(report?._id);
        }),
        filter((res: any) => res.status === 'success')
      )
      .subscribe((result) => {
        this.reportService.showSnackBar(result.mesage);
      });
  }

  public downloadReport(report, isForPDF = false) {
    this.reportService
      .exportReport(report?._id, { type: isForPDF ? 'PDF' : 'Excel' })
      .pipe(filter((res: any) => res.status === 'success'))
      .subscribe((res: any) => {
        this.reportService.showSnackBar(res.message);
      });
  }

  public duplicateReport(report) {
    this.reportService
      .getPreviewReport(report?._id)
      .pipe(filter((res) => !!res))
      .subscribe((res) => {
        this.reportService.duplicateTrigger.next(res);
      });
  }

  public regenerateReport(report) {
    this.reportService
      .regenerateReport(report?._id)
      .pipe(filter((res: any) => res.status === 'success'))
      .subscribe((res) => {
        this.reportService.showSnackBar(res.message);
      });
  }
}
