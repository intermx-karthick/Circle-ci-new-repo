import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import {BulkExportRequest} from '@interTypes/bulkExport';
import {ConfirmationDialog} from '@interTypes/workspaceV2';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {ExploreService} from '@shared/services';
import {saveAs} from 'file-saver';

@Component({
  selector: 'app-inventory-bulk-export',
  templateUrl: './inventory-bulk-export.component.html',
  styleUrls: ['./inventory-bulk-export.component.less']
})
export class InventoryBulkExportComponent implements OnInit {
  public orientation: string;
  constructor(@Inject(MAT_DIALOG_DATA) public data: BulkExportRequest,
              private exploreService: ExploreService,
              private dialogRef: MatDialogRef<InventoryBulkExportComponent>,
              private dialog: MatDialog,
              ) {
  }
  ngOnInit() {
    this.orientation = this.data.orientation;
  }
  changeOrientation($event) {
    this.data.orientation = $event.value;
  }
  exportPDF() {
    this.exploreService.inventoriesBulkExport(this.data)
      .subscribe(res => {
        if (this.data.panel_id.length === 1) {
          const contentDispose = res.headers.get('content-disposition');
          const matches = contentDispose.split(';')[1].trim().split('=')[1];
          const filename = matches && matches.length > 1 ? matches : (new Date()).getUTCMilliseconds() + '.pdf';
          saveAs(res.body, filename);
        } else {
          const data: ConfirmationDialog = {
            notifyMessage: true,
            confirmTitle: 'Success',
            messageText: 'We are generating your report, You\'ll receive a notification when it is ready.',
          };
          this.dialog.open(ConfirmationDialogComponent, {
            data: data,
            width: '450px',
          });
        }
        this.dialogRef.close();
      }, err => {
        this.dialogRef.close();
        const data: ConfirmationDialog = {
          notifyMessage: true,
          confirmTitle: 'Error',
          messageText: 'There is a problem generating the file. Please try again later.',
        };
        this.dialog.open(ConfirmationDialogComponent, {
          data: data,
          width: '450px',
        });
      });
  }
}


