import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ForgetPasswordComponent } from './forget-password.component';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {AuthenticationService} from '@shared/services';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('ForgetPasswordComponent', () => {
  let component: ForgetPasswordComponent;
  let fixture: ComponentFixture<ForgetPasswordComponent>;
  let dialogRef;
  let dialogData;
  let authService: any;
  beforeEach(waitForAsync(() => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', [
      'close',
      'data'
    ]);
    dialogData = jasmine.createSpyObj('MAT_DIALOG_DATA', [
      ''
    ]);
    authService = jasmine.createSpyObj('AuthenticationService', [
     'resetPassword'
    ]);

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatDialogModule,
        MatInputModule,
      ],
      declarations: [ ForgetPasswordComponent ],
      providers: [
        {provide: MatDialogRef, useValue: dialogRef},
        {provide: MAT_DIALOG_DATA, useValue: dialogData},
        {provide: AuthenticationService, useValue: authService},

      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ForgetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should display empty email warning', () => {
    fixture.nativeElement.querySelector('#submit-button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.innerHTML).toContain('Email can\'t be blank');
  });
  it('should display invalid email warning', () => {
    const email = fixture.nativeElement.querySelector('#defaultForm-email') as HTMLInputElement;
    email.value = 'vigneshm';
    email.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('#submit-button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.innerHTML).toContain('Should be valid email');
  });
  it('should have link to geopath email', () => {
    const link = fixture.nativeElement.querySelector('#login-title-link') as HTMLLinkElement;
    expect(link.getAttribute('href')).toBe('mailto:geekout@geopath.org');
  });
  it('should send email on submit', () => {
    const email = fixture.nativeElement.querySelector('#defaultForm-email') as HTMLInputElement;
      email.value = 'vigneshm@agiratech.com';
    email.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    authService.resetPassword.and.returnValue(of({'Message': 'Success'}));
    const service = fixture.debugElement.injector.get(AuthenticationService);
    fixture.nativeElement.querySelector('#submit-button').click();
    fixture.detectChanges();
    expect(service.resetPassword).toHaveBeenCalledWith({
      username: 'vigneshm@agiratech.com'
    });
  });
});
