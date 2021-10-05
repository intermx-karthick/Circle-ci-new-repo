import { Component, OnInit, ChangeDetectionStrategy, Optional, SkipSelf, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AbstractReportInvoiceComponent } from '../../abstract-report-invoice.component';
import { ReportsAPIService } from '../../services/reports-api.service';

@Component({
  selector: 'app-detailed-recap-report-container',
  templateUrl: './detailed-recap-report-container.component.html',
  styleUrls: ['./detailed-recap-report-container.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailedRecapReportContainerComponent extends AbstractReportInvoiceComponent<DetailedRecapReportContainerComponent>
  implements OnInit {

  constructor(
    protected reportService: ReportsAPIService,
    protected dialog: MatDialog,
    @Optional()
    @SkipSelf()
    public dialogRef: MatDialogRef<DetailedRecapReportContainerComponent>,
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
