import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { User, AddGroupDialogModel } from 'app/user-management/models';

@Component({
  selector: 'add-group-dialog',
  templateUrl: 'add-group-dialog.html',
  styleUrls: ['./add-group-dialog.less']
})
export class AddGroupDialog {
  public createGroupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddGroupDialog>,
    @Inject(MAT_DIALOG_DATA) public data: AddGroupDialogModel
  ) {
    this.createGroupForm = fb.group({
      name: [null, Validators.required],
      description: [null, Validators.required],
      roles: [null],
      users: [null]
    });
  }

  onUserAdded(users: User[]) {
    this.createGroupForm.patchValue({
      users
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit(formValue: any) {
    if (this.createGroupForm.valid) {
      this.dialogRef.close(formValue);
    } else if (this.createGroupForm.invalid) {
      this.createGroupForm.controls.name.markAsTouched();
      this.createGroupForm.controls.description.markAsTouched();
    }
  }
}
