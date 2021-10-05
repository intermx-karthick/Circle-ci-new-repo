import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from '@shared/services';
import swal from 'sweetalert2';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.less']
})
export class ForgetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  constructor( public dialogRef: MatDialogRef<ForgetPasswordComponent>,
    private formBuilder: FormBuilder,
    private authentication: AuthenticationService) { }

  ngOnInit() {
    this.resetForm = this.formBuilder.group({
      'email': ['', [Validators.required, Validators.email]],
    });
  }
  resetPassword(data) {
    if (this.resetForm.invalid) {
      this.resetForm.controls.email.markAsDirty();
      return;
    }
    const user = {
      username : data.email
    };
    this.authentication.resetPassword(user)
      .subscribe(response => {
        this.resetForm.reset();
        this.dialogRef.close(true);
        swal('Success', response.Message);
    }, error => {
        console.log(error);
      });
  }
}
