import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit
} from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Logo } from '@interTypes/records-management';
import { FileUploadConfig } from '@interTypes/file-upload';
import { UseRecordPagination } from 'app/records-management-v2/useRecordPagination';
import {
  JobDetails,
  JobPurchaseOrder
} from 'app/jobs/interfaces';

import { AbstractAttachmentsComponent } from '@shared/components/logos/abstract-attachments.component';
import { JobPurchaseOrderService } from 'app/jobs/services/job-purchase-order.service';

import { map } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-job-puchase-order-attachement',
  templateUrl: './job-puchase-order-attachement.component.html',
  styleUrls: ['./job-puchase-order-attachement.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobPuchaseOrderAttachementComponent extends AbstractAttachmentsComponent implements OnInit {

  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: true,
    acceptedFormats: ['pdf', 'xlsx', 'xls', 'gif', 'jpg', 'png', 'jpeg', 'svg'],
    sizeLimit: 10,
    displayFileHint: true
  };

  public title = '';
  public isUploadSignedJob = false;
  public purchaseOrder: JobPurchaseOrder;
  public jobDetails: JobDetails;

  public updateCaptionAPIFunc = (attachmentId, logoKey, captionName) =>
    this.jobPurchaseOrderService.updatePurchaseOrderAttachment(
      this.jobDetails?._id,
      this.purchaseOrder?.printer?._id,
      attachmentId,
      captionName,
    );

  constructor(
    public jobPurchaseOrderService: JobPurchaseOrderService,
    public matSnackBar: MatSnackBar,
    public cdRef: ChangeDetectorRef,
    public dialogRef: MatDialogRef<JobPuchaseOrderAttachementComponent>,
    @Inject(MAT_DIALOG_DATA) dialogData: any
  ) {
    super(matSnackBar, cdRef);

    this.title = "Upload Signed Job " + dialogData?.purchaseOrder?.jobId;
    this.isUploadSignedJob = dialogData?.isUploadSigned;
    this.purchaseOrder = dialogData?.purchaseOrder;
    this.jobDetails = dialogData?.jobDetails;
  }

  public ngOnInit(): void {
    this.loadAttachments();
  }

  public getAttachmentsAPI<T>(pagination: UseRecordPagination): Observable<T> {
    return this.jobPurchaseOrderService
      .getPurchaseOrderAttachments(
        this.jobDetails?._id,
        this.purchaseOrder?.printer?._id,
        pagination,
      )
      .pipe(
        map((res: any) => {
          return {
            pagination: res?.pagination,
            result: {
              attachments: res?.results ?? []
            }
          } as any;
        })
      );
  }

  public uploadAttachmentsAPI(file: File | any): Observable<any> {
    return this.jobPurchaseOrderService.uploadPurchaseOrderAttachment(
      this.jobDetails?._id,
      this.purchaseOrder?.printer?._id,
      file,
    );
  }

  public deleteAttachmentsAPI<T>(logo: Logo): Observable<T> {
    return this.jobPurchaseOrderService.deletePurchaseOrderAttachment(
      this.jobDetails?._id,
      this.purchaseOrder?.printer?._id,
      logo._id,
    );
  }

}