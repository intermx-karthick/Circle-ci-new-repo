import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-save-as-file',
  templateUrl: './save-as-file.component.html',
  styleUrls: ['./save-as-file.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaveAsFileComponent implements OnInit {
  formGroup: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SaveAsFileComponent>
  ) {
  }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      filename: ''
    });
  }

  onSubmit() {
    this.dialogRef.close(this.formGroup.value.filename);
  }
}
