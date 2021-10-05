import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { ThemeService } from '@shared/services';
import { Router } from '@angular/router';
import { CustomValidators } from '../../validators/custom-validators.validator';
import { UserService } from '../user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.less']
})
export class RegisterComponent implements OnInit {
  themeSettings: any;
  registerForm: FormGroup;

  constructor(
    private theme: ThemeService,
    private formBuilder: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.themeSettings = this.theme.getThemeSettings();
    this.theme.themeSettings.subscribe(res => {
      this.themeSettings = this.theme.getThemeSettings();
    });
    this.registerForm = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      job_title: ['', Validators.required],
      company_name: ['', Validators.required],
      company_email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, CustomValidators.vaildPassword]]
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
      this.userService.setUser({
        email: formGroup.controls.company_email.value
      });
      this.router.navigate(['/user/confirm']);
    }
  }
  /*canDeactivate(): Promise<any> {
    return this.common.confirmExit(this.registerForm);
  }*/
}
