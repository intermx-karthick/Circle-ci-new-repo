import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-print-view-public-dialog',
  templateUrl: './print-view-public-dialog.component.html',
  styleUrls: ['./print-view-public-dialog.component.less']
})
export class PrintViewPublicDialogComponent implements OnInit {
  printViewForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<PrintViewPublicDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public formtype,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.printViewForm = this.formBuilder.group({
      'password': ['', [Validators.required, Validators.maxLength(10)]]
    });
  }

  /**
   * Function to close the Dialog
   *
   * @memberof PrintViewPublicDialogComponent
   */
  closeDialog() {
    this.dialogRef.close(true);
  }

  /**
 * function for signup
 *
 * @param {*} formValues
 * @memberof PrintViewPublicDialogComponent
 */
  public signin(formValues) {
  }
}
