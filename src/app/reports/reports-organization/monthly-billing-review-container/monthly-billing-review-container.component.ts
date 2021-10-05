import { Component, OnInit, ChangeDetectionStrategy, Optional, SkipSelf, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AbstractReportInvoiceComponent } from '../../abstract-report-invoice.component';
import { ReportsAPIService } from '../../services/reports-api.service';

@Component({
  selector: 'app-monthly-billing-review-container',
  templateUrl: './monthly-billing-review-container.component.html',
  styleUrls: ['./monthly-billing-review-container.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthlyBillingReviewContainerComponent
  extends AbstractReportInvoiceComponent<MonthlyBillingReviewContainerComponent>
  implements OnInit {

  constructor(
    protected reportService: ReportsAPIService,
    protected dialog: MatDialog,
    @Optional()
    @SkipSelf()
    public dialogRef: MatDialogRef<MonthlyBillingReviewContainerComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {
    super(reportService, dialog, dialogRef, dialogData);
  }

  ngOnInit(): void {
  }

  public save(): void {
  }

  public regenerate(): void { 
  }
}
