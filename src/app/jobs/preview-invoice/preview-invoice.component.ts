import { Component, OnInit, ChangeDetectionStrategy, Optional, SkipSelf, Inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InvoiceResponse, Record } from '@interTypes/jobs/invoice-response';
import { JobsService } from '../jobs.service';

@Component({
  selector: 'app-preview-invoice',
  templateUrl: './preview-invoice.component.html',
  styleUrls: ['./preview-invoice.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewInvoiceComponent implements OnInit {
  public containerBodyHeight:number;
  public lineItemScroll;
  @ViewChild('scrollContainer', {read: ElementRef, static:false}) scrollContainer: ElementRef;
  public invoiceData: Record;
  isLoadingPreviewAPI = false;

  constructor(
    public dialogRef: MatDialogRef<PreviewInvoiceComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private cdRef: ChangeDetectorRef,
    private jobsService: JobsService,

  ) { }

  ngOnInit(): void {
    this.getInvoice();
  }

  public reSize(){
    this.lineItemScroll = (this.scrollContainer?.nativeElement?.clientWidth - 40);
    this.containerBodyHeight = (this.dialogRef?.['_containerInstance']['_elementRef']['nativeElement']?.clientHeight - 50);

    this.cdRef.detectChanges();
  }

  downloadPDF() {

  }
  copyContract() {
    
  }

  getInvoice() {
    this.isLoadingPreviewAPI = true;
    this.jobsService.getJobInvoice(this.dialogData.jobId, false).subscribe((res: InvoiceResponse) => {
      this.isLoadingPreviewAPI = false;
      this.invoiceData = this.formatAddress(res.record);
      this.cdRef.detectChanges();
    });
  }
  calcTotal(materialCost, oiCost) {
    if (materialCost && oiCost) {
      return materialCost + oiCost;
    } else {
      return 0;
    }
  }
  formatAddress(record: Record) {
    if(record?.receivableAddress) {
      record['splitedAddress'] = record?.receivableAddress.split('\n');
    }
    return record
  }

}
