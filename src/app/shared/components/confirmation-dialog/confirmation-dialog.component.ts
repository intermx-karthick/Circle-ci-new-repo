import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {ConfirmationDialog} from '@interTypes/workspaceV2';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationDialogComponent implements OnInit {
  public title: String;
  public description: String;
  public confirmText: String;
  public cancelText: String;
  public messageText: String;
  public notifyMessage = false;
  public headerCloseIcon = true;
  public cancelBtnDisabled = false;
  public secondayCancelBtnText: String;
  constructor(public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialog) { }

  ngOnInit() {
    if (this.data) {
      this.title = this.data.confirmTitle;
      this.description = this.data.confirmDesc;
      this.confirmText = this.data.confirmButtonText;
      this.cancelText = this.data.cancelButtonText;
      this.messageText = this.data.messageText;
      this.notifyMessage = this.data.notifyMessage;
      if (this.data.headerCloseIcon !== undefined) {
        this.headerCloseIcon = this.data.headerCloseIcon;
      }
      if (this.data.secondayCancelBtnText) {
        this.secondayCancelBtnText = this.data.secondayCancelBtnText;
      }
      if (this.data.disableCancelBtn !== undefined) {
        this.cancelBtnDisabled = this.data.disableCancelBtn;
      }
    }
  }

  onActionResult() {
    this.dialogRef.close({ action: true });
  }
  // This is used when 3 buttons needed in confirmation
  onSecondaryCancel() {
    this.dialogRef.close({ secondaryCancel: true });
  }

  onSuccess() {
    this.dialogRef.close(true);
  }

  onCloseDialog() {
    this.dialogRef.close();
  }
}
