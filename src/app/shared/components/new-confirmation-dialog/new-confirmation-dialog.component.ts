import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  ChangeDetectorRef
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-new-confirmation-dialog',
  templateUrl: './new-confirmation-dialog.component.html',
  styleUrls: ['./new-confirmation-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewConfirmationDialogComponent implements OnInit {
  description = 'Please <b>Confirm</b> this action, it can’t be Undone!';
  modalTitle = 'Delete Confirmation';
  confirmBtnText = 'Confirm';
  cancelBtnText = 'Cancel';
  displayCancelBtn = true;
  displayIcon = true;
  footerWidth = 100;
  constructor(
    public dialogRef: MatDialogRef<NewConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.data?.title) {
      this.modalTitle = this.data.title;
    }
    if (this.data?.description) {
      this.description = this.data.description;
    }
    if (this.data?.confirmBtnText) {
      this.confirmBtnText = this.data.confirmBtnText;
    }
    if (this.data?.cancelBtnText) {
      this.cancelBtnText = this.data.cancelBtnText;
    }
    if (typeof this.data['displayCancelBtn'] !== undefined) {
      this.displayCancelBtn = this.data.displayCancelBtn;
    }
    if (typeof this.data['displayIcon'] !== undefined) {
      this.displayIcon = this.data.displayIcon;
    }
    this.footerWidth = document.getElementById('confirmation-dialog').offsetWidth;
    this.cd.markForCheck();
  }
  onActionResult() {
    this.dialogRef.close({ action: true });
  }

  onSuccess() {
    this.dialogRef.close({ success: true });
  }

  onCloseDialog() {
    this.dialogRef.close({ action: false });
  }
}
