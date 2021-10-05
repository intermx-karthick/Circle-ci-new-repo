import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-confirmation-dialog',
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrls: ['./delete-confirmation-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteConfirmationDialogComponent implements OnInit {
  description = 'Please <b>Confirm</b> this action, it can’t be Undone!';
  confirmBtnText = 'Confirm';
  cancelBtnText = 'Cancel';
  title = 'Delete Confirmation';
  showIcon = true;
  
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit(): void {
    if (this.data?.title) {
      this.title = this.data.title;
    }
    if (this.data?.title) {
      this.title = this.data.title;
      this.showIcon = this.data.showIcon;
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
  }
  onActionResult() {
    this.dialogRef.close({ action: true });
  }

  onSuccess() {
    this.dialogRef.close({ success: true });
  }

  onCloseDialog() {
    this.dialogRef.close();
  }
}
