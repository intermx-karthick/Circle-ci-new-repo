import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {ConfirmComponent} from './confirm.component';
import {UserService} from '../user.service';
import {ThemeService} from '@shared/services';
import {Observable, of} from 'rxjs';

describe('ConfirmComponent', () => {
  let component: ConfirmComponent;
  let fixture: ComponentFixture<ConfirmComponent>;
  let themeService: any;
  let userService: any;
  beforeEach(waitForAsync(() => {
    themeService = jasmine.createSpyObj('ThemeService', [
      'themeSettings',
      'getThemeSettings'
    ]);
    themeService.themeSettings = of(false);
    userService = jasmine.createSpyObj('UserService', ['getUser']);
    userService.getUser.and.callFake(() => {
      return {
        email: 'vigneshm@agiratech.com'
      };
    });
    TestBed.configureTestingModule({
      declarations: [ConfirmComponent],
      providers: [
        {provide: ThemeService, useValue: themeService},
        {provide: UserService, useValue: userService}
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.themeSettings = {
      'background': {'bg_image': './assets/images/logo-placeholder.png'},
      'logo': {'full_logo': './assets/images/logo-placeholder.png'},
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should display user email', () => {
    fixture.detectChanges();
    const message = fixture.nativeElement.querySelector('#message-container') as HTMLElement;
    fixture.detectChanges();
    expect(message.innerHTML).toContain('vigneshm@agiratech.com');
  });
});
