import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { BrowserModule, By } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, DebugElement, Input } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import {
  LoaderService,
  AuthenticationService,
  CommonService,
  ExploreService,
  TitleService,
  ThemeService,
  TargetAudienceService
} from '@shared/services';
import { HttpClientModule } from '@angular/common/http';
import { AppConfig } from '../../app-config.service';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { throwError, of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from 'app/layout/app-layout/header/header.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'show-errors',
  template: '<p>Mock Product Settings Component</p>'
})
@Component({
  selector: 'mat-spinner',
  template: '<p>Mock spinner Component</p>'
})
class MockShowErrorsComponent {
  @Input() public control;
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: any;
  let common: any;
  let explore: any;
  let title: any;
  let config: any;
  let theme: any;
  let dialog: any;
  let target: any;
  let debugElement: DebugElement;
  /**
  beforeEach(async(() => {
    authService = jasmine.createSpyObj('AuthenticationService', {
      'login': function () {
        return throwError('unauth');
      },
      'logout': new Error(),
      'getUserData': function () {
        return true;
      },
      'setUserData': function(){ return false }
    });


    common = jasmine.createSpyObj('commonService', [
      'updateCurrentUrl',
      'isMobile',
    ]);
    explore = jasmine.createSpyObj('exploreService', [
      'handleError'
    ]);
    title = jasmine.createSpyObj('titleService', [
      'getTitle',
      'setTitle',
      'updateTitle',
      'updateSiteName'
    ]);
    config = jasmine.createSpyObj('AppConfigService', [
      'load',
      'API_ENDPOINT'
    ]);
    theme = jasmine.createSpyObj('ThemeService', [
      'getThemeSettings',
      'generateColorTheme',
    ]);
    target = jasmine.createSpyObj('TargetAudienceService', [
      'getDefaultAudience'
    ]);
    dialog = jasmine.createSpyObj('dialog', [
      'open'
    ]);
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([]),
        HttpClientModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
      ],
      declarations: [
        LoginComponent,
        MockShowErrorsComponent,
        HeaderComponent
      ],
      providers: [
        LoaderService,
        { provide: AuthenticationService, useValue: authService },
        { provide: CommonService, useValue: common },
        { provide: ExploreService, useValue: explore },
        { provide: TitleService, useValue: title },
        { provide: AppConfig, useValue: config },
        { provide: ThemeService, useValue: theme },
        { provide: TargetAudienceService, useValue: target },
        { provide: MatDialog, useValue: dialog },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
    });
    component.themeSettings = {
      'background': {'bg_image': './assets/images/logo-placeholder.png'},
      'logo': {'full_logo': './assets/images/logo-placeholder.png'},
      'publicSite': false
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should send credentials on submit', async () => {
    fixture.detectChanges();
    const email = fixture.nativeElement.querySelector('#defaultForm-email') as HTMLInputElement;
    email.value = 'vigneshm@intermx.com';
    email.dispatchEvent(new Event('input'));
    const password = fixture.nativeElement.querySelector('#defaultForm-pass') as HTMLInputElement;
    password.value = 'agira123';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    authService.login.and.returnValue(of({}));
    authService.setUserData.and.returnValue(false);
    const service = debugElement.injector.get(AuthenticationService);
    fixture.nativeElement
      .querySelector('#sign-in-button').click();
    expect(service.login).toHaveBeenCalledWith({
      username: 'vigneshm@intermx.com',
      password: 'agira123'
    });
  });
  it('should display error on wrong credentials', () => {
    component.loginFail = true;
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('#error-message') as HTMLDivElement;
    expect(error.style.display).toBe('block');
  });
  */
});
