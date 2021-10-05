import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
    JobDetails,
    JobPurchaseOrder
} from 'app/jobs/interfaces';

import { JobPurchaseOrderService } from 'app/jobs/services/job-purchase-order.service';
import { JobPuchaseOrderAttachementComponent } from './job-puchase-order-attachement/job-puchase-order-attachement.component';

@Injectable()
export class JobPurchaseOrderActionsHelper {

    public jobDetails: JobDetails;

    constructor(
        private jobPurchaseOrderService: JobPurchaseOrderService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
    ) {
    }


    public openUploader(element: JobPurchaseOrder, callback = null) {
        this.dialog
            .open(JobPuchaseOrderAttachementComponent, {
                data: {
                    purchaseOrder: element,
                    jobDetails: this.jobDetails,
                    isUploadSigned: true
                },
                height: '31.75rem',
                id: 'vc-uploader',
                width: '54.375rem',
                panelClass: 'job-purchase-order-attachment-panel-class'
            })
            .afterClosed()
            .subscribe((result) => {
                if (callback) {
                    callback(result)
                }
            });
    }


    private showAlertMessage(message: string) {
        this.snackBar.open(message, '', {
            duration: 3000
        });
    }
}
