import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService, ExploreService, ThemeService, TargetAudienceService, TitleService } from '@shared/services';
import swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { ForgetPasswordComponent } from '../forget-password/forget-password.component';
import { AppConfig } from '../../app-config.service';
import { PublicSignInComponent } from '@shared/components/publicSite/sign-in-sign-up/sign-in-sign-up.component';
import { saveAs } from 'file-saver';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit, OnDestroy {
  bodyClasses = 'skin-blue sidebar-mini';
  body: HTMLBodyElement = document.getElementsByTagName('body')[0];
  loginForm: FormGroup;
  resetForm: FormGroup;
  loginFail: any;
  userData: {
    'name': string; 'family_name': string; 'email': string; 'company': string; 'title': string;
    'picture': string; 'gpLoginStatus': boolean;
  };
  themeSettings: any;
  @ViewChild('close_reset') closeReset: ElementRef;
  isPdfDownload: boolean;
  constructor(private formBuilder: FormBuilder,
    private router: Router,
    private authentication: AuthenticationService,
    private exploreService: ExploreService,
    private theme: ThemeService,
    public route: ActivatedRoute,
    public dialog: MatDialog,
    private config: AppConfig,
    private trargetAudienceService: TargetAudienceService,
    private titleService: TitleService,
    private auth0: AuthService,
              ) {
  }
  ngOnInit() {
    this.userData = this.authentication.getUserData();
    this.themeSettings = this.route.snapshot.data.themeSettings;
    if (this.themeSettings && this.themeSettings.publicSite) {
      this.titleService.updateTitle('Public');
      if (this.router.url !== '/user/public') {
        this.router.navigate(['/user/public']);
      }
    }
    this.loginForm = this.formBuilder.group({
      'email': ['', [Validators.required, Validators.email]],
      'password': ['', Validators.required]
    });
    this.resetForm = this.formBuilder.group({
      'email': ['', [Validators.required, Validators.email]],
    });
    this.theme.generateColorTheme();
  }
  ngOnDestroy() {
    // remove the the body classes
    this.body.classList.remove('login-page');
  }

  validateFormGroup(formGroup: FormGroup) {
    // console.log("validateFormGroup", formGroup);
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
      this.submitToServer({ username: formGroup.value.email, password: formGroup.value.password });
    }
  }

  submitToServer(formData) {
    this.authentication.login(formData).subscribe(data => {
      this.loginFail = false;
      const flag = this.authentication.setUserData(data.userData);
      if (flag) {
        localStorage.setItem('token', data.userData.token.access_token);
        localStorage.setItem('apiKey', data.apiKey);
        this.config.envSettings['API_KEY'] = data.apiKey;
        setTimeout(() => {
          this.trargetAudienceService.getDefaultAudience(true)
            .subscribe();
        }, 300);
          this.router.navigate(['']);
      } else {
        swal('Oops! Something went wrong, please try again.', '', 'error');
      }
    }, error => {
      this.loginFail = true;
    });
  }
  forgetPasswordDialog() {
    const dialogRef = this.dialog.open(ForgetPasswordComponent, {
      width: '524px',
      panelClass: 'forget-password-dialog',
    });
  }
  /**
  * Function to download PDF if public site logged in
  *
  * @memberof LoginComponent
  */
  download() {
    this.isPdfDownload = true;
    const filename = 'Geopath-Standards-and-Best-Practices-Document.pdf';
    saveAs('../../assets/images/Geopath-Standards-and-Best-Practices-Document.pdf', filename);
    setTimeout(() => {
      this.isPdfDownload = false;
    }, 200);
  }
  /**
  * Function for redirect to explore page if logged in
  * Public login
  * @memberof LoginComponent
  */
  exploreredirect() {
    this.router.navigate(['/explore']);
  }
  redirectToRableau() {
    this.router.navigate(['/daily-mobility/home']);
  }
  /**
   *Function to open public login Popup
   *
   * @memberof LoginComponent
   */
  login() {
    this.auth0.login();
  }
}
