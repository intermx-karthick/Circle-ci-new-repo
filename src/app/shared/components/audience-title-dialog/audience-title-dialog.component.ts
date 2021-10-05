import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { CustomValidators } from '../../../validators/custom-validators.validator';

@Component({
  selector: 'app-audience-title-dialog',
  templateUrl: './audience-title-dialog.component.html',
  styleUrls: ['./audience-title-dialog.component.less']
})
export class AudienceTitleDialogComponent {
  public audienceTitleFc = new FormControl('', [
    Validators.required,
    CustomValidators.noWhitespaceValidator(true)
  ]);

  constructor(
    public dialogRef: MatDialogRef<AudienceTitleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.audienceTitleFc.setValue(data?.audience?.title ?? '');
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  save() {
    if(this.audienceTitleFc.valid){
      this.dialogRef.close(this.audienceTitleFc.value);
    }
  }
}
