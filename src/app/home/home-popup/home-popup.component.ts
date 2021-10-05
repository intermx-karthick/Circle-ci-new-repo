  import { Component, OnInit } from '@angular/core';
  import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
  import swal from 'sweetalert2';
  import {AuthenticationService} from '@shared/services';
  import { MatDialogRef } from '@angular/material/dialog';
  @Component({
    selector: 'app-home-popup',
    templateUrl: './home-popup.component.html',
    styleUrls: ['./home-popup.component.less']
  })
  export class HomePopupComponent implements OnInit {
    public upForm: FormGroup;
    public userData: any;
    constructor(private auth: AuthenticationService,
                private fb: FormBuilder,
                private dialog: MatDialogRef<HomePopupComponent>) { }
    ngOnInit() {
      this.userData = this.auth.getUserData();
      this.upForm = this.fb.group({
        'given_name': [this.userData.name],
        'family_name': [this.userData.family_name],
        'company': [this.userData.company],
        'title': [this.userData.title]
      });
    }
    onSubmit(formGroup) {
      Object.keys(formGroup.controls).forEach(field => {
        const control = formGroup.get(field);
        if (control instanceof FormControl) {
          control.markAsTouched({
            onlySelf: true
          });
        } else if (control instanceof FormGroup) {
          this.validateFormGroup(control);
        }
      });
      if (formGroup.valid) {
        $('.carousel').carousel('next');
        this.submitToServer(formGroup.value);
      }
    }
    submitToServer(formData) {
      /*const userData = {
        'given-name': '',
        'family-name': '',
        'company': '',
        'title': ''
      };
      userData['given-name'] = formData.given_name;
      userData['family-name'] = formData.family_name;
      userData['company'] = formData.company;
      userData['title'] = formData.title;*/
      this.auth.updateProfile(formData).subscribe(data => {
          const flag = this.auth.setUserData(data);
          if (!flag) {
            swal('Oops! Something went wrong, please try again.', '', 'error');
          }
        },
        error => {
          swal('Oops! Something went wrong, please try again.', '', 'error');
          this.auth.logout();
        });
    }
    validateFormGroup(formGroup: FormGroup) {
      Object.keys(formGroup.controls).forEach(field => {
        const control = formGroup.get(field);
        if (control instanceof FormControl) {
          control.markAsTouched({
            onlySelf: true
          });
        } else if (control instanceof FormGroup) {
          this.validateFormGroup(control);
        }
      });
    }
    goToExplore() {
      this.dialog.close();
    }
  }
