import { Component, OnInit, Input, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import {Helper} from '../../../../classes';

@Component({
  selector: 'app-sign-in-sign-up',
  templateUrl: './sign-in-sign-up.component.html',
  styleUrls: ['./sign-in-sign-up.component.less']
})
export class PublicSignInComponent implements OnInit {
  signinForm: FormGroup;
  emailForm: FormGroup;
  isEmailSubmited = false;
  themeSettings: any;
  constructor(public dialogRef: MatDialogRef<PublicSignInComponent>,
    @Inject(MAT_DIALOG_DATA) public formtype,
    private formBuilder: FormBuilder,
    public route: ActivatedRoute,
    private authService: AuthenticationService,
    private config: AppConfig,
    private router: Router,
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.themeSettings = this.route.snapshot.data.themeSettings;
    this.emailForm = this.formBuilder.group({
      'email': ['', [Validators.required, Validators.email]],
    });
    this.signinForm = this.formBuilder.group({
      'email': ['', [Validators.required, Validators.email]],
      'password': ['', [Validators.required, Validators.maxLength(10)]]
    });
  }



  /**
   * Function is to change the view of the modal
   * @param {String} type
   * @memberof SignInSignUpComponent
   */
  typeChnge(type: String) {
    this.formtype = type;
    this.signinForm.reset();
  }

  /**
   * Funtion for login
   *
   * @param {*} formValues
   * @memberof SignInSignUpComponent
   */
  private signin(formValues) {
    if (!this.isEmailSubmited) {
      const body = { username: formValues.email };
      this.authService.publicLoginEmail(body).subscribe(data => {
        const dialogData: ConfirmationDialog = {
          notifyMessage: true,
          confirmTitle: 'Success',
          messageText: 'Thank you! We have sent a verification code to your email. If you do not receive it, please email <a href="mailto:geekout@geopath.org" class="button-primary-link">geekOUT@geopath.org</a>',
        };
        this.dialog.open(ConfirmationDialogComponent, {
          data: dialogData,
          panelClass: 'public-signin-dialog'
        });
        this.isEmailSubmited = true;
        this.signinForm['controls'].email.patchValue(formValues.email);
      }, error => {
        const dialogData: ConfirmationDialog = {
          notifyMessage: true,
          confirmTitle: 'Error',
          messageText: 'Please try again.',
        };
        this.dialog.open(ConfirmationDialogComponent, {
          data: dialogData,
          width: '450px',
        });
      });

    } else {
      const body = { username: formValues.email, password: formValues.password };

      this.authService.publicLogin(body).subscribe(response => {
        const data = Helper.deepClone(response);
        this.closeDialog();
        const flag = this.authService.setUserData(data.userData);
        if (flag) {
          localStorage.setItem('token', data.userData.token.access_token);
          localStorage.setItem('apiKey', data.apiKey);
          this.config.envSettings['API_KEY'] = data.apiKey;
          const themeSettings = localStorage.getItem('themeSettings');
          this.router.navigate(['']);
        } else {
          const dialogData: ConfirmationDialog = {
            notifyMessage: true,
            confirmTitle: 'Error',
            messageText: 'Oops! Something went wrong, please try again.',
          };
          this.dialog.open(ConfirmationDialogComponent, {
            data: dialogData,
            width: '450px',
          });
        }
      }, error => {
        const dialogData: ConfirmationDialog = {
          notifyMessage: true,
          confirmTitle: 'Error',
          messageText: 'Oops! Something went wrong, please try again.',
        };
        this.dialog.open(ConfirmationDialogComponent, {
          data: dialogData,
          width: '450px',
        });
      });
    }

  }

  /**
   * function for signup
   * this signup functions are not used hence design has been changed
   * still keeping this if there is any change
   * @param {*} formValues
   * @memberof SignInSignUpComponent
   */
  private signup(formValues) {
    // console.log(formValues);
  }

  /**
   * Function to close the Dialog
   *
   * @memberof SignInSignUpComponent
   */
  closeDialog() {
    this.dialogRef.close(true);
  }
}
