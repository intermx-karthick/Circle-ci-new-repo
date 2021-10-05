import { Component, OnInit, Inject, Input, ChangeDetectionStrategy,ChangeDetectorRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CSVService, LoaderService } from '@shared/services';
import { saveAs } from 'file-saver';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { FileUploadAbstract } from '../file-upload/file-upload-abstract';

@Component({
  selector: 'app-upload-file-dialog',
  templateUrl: './upload-file-dialog.component.html',
  styleUrls: ['./upload-file-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadFileDialogComponent extends FileUploadAbstract implements OnInit {
  @Input() dialogData: any;
   constructor(
    public  dialogRef: MatDialogRef<UploadFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private csvService: CSVService,
    public dialog: MatDialog,
    public cdRef: ChangeDetectorRef
    ) {
      super(cdRef);
  }
  public dialogTitle: string;
  public submitBtnText: string;
  public closeBtnText: string;
  public attachmentName = 'attachment';

  public dialogTitleDisable = false;

  ngOnInit() {
    this.fileUploadConfig = this.data?.fileUploadConfig;
    this.dialogTitle = this.data?.dialogTitle;
    this.submitBtnText = this.data?.submitBtnText;
    this.closeBtnText = this.data?.closeBtnText;
    if (this.data?.dialogTitleDisable) {
      this.dialogTitleDisable = true;
    }
    if (this.data?.attachmentName) {
      this.attachmentName = this.data['attachmentName'];
    }
  }


  public onSubmitFile() {
    const data = {};
    data['fileData'] = this.fileData;
    this.dialogRef.close(data);
  }

  public onCancelUpload() {
    this.clearAttachment();
    this.dialogRef.close();
  }

  public downloadSampleCSV() {
    this.csvService.getSampleCSV()
    .subscribe(res => {
      saveAs(res.body, 'sample.csv');
    }, error => {
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
