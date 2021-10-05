import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {
  CommonService,
  AuthenticationService,
  LoaderService
} from '@shared/services';
import swal from 'sweetalert2';
import {Router} from '@angular/router';

@Component({
  selector: 'user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.less']
})
export class UserProfileComponent implements OnInit {

  constructor(
    private fb: FormBuilder,
    private _cService: CommonService,
    private router: Router,
    private loader: LoaderService,
    private auth: AuthenticationService,
  ) {}
  upForm: FormGroup;
  userData: any;
  ngOnInit() {
    this.upForm = this.fb.group({
      'given_name': [''], // , Validators.required
      'family_name': [''],
      'company': [''],
      'title': ['']
    });
    this.userData = this.auth.getUserData();
    this.upForm.patchValue({
      'given_name': this.userData.name,
      'family_name': this.userData.family_name,
      'company': this.userData.company,
      'title': this.userData.title
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
      this.submitToServer(formGroup.value);
    }
  }
  submitToServer(formData) {
    this.loader.display(true);
    const userData = {'given-name': '', 'family-name': '', 'company': '', 'title': ''};
    userData['given-name'] = formData.given_name;
    userData['family-name'] = formData.family_name;
    userData['company'] = formData.company;
    userData['title'] = formData.title;
    this.auth.updateProfile(userData).subscribe(data => {
      const flag = this.auth.setUserData(data);
      if (flag) {
        swal('User profile update successfully.', '', 'success');
      } else {
        swal('Oops! Something went wrong, please try again.', '', 'error');
      }
      this.loader.display(false);
    },
    error => {
      swal('Oops! Something went wrong, please try again.', '', 'error');
      this.loader.display(false);
      this.auth.logout();
    });
  }
  cancel() {
    this.router.navigateByUrl('/explore');
  }
}
