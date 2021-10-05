import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotificationsV3Component } from './notifications-v3.component';

describe('NotificationsV3Component', () => {
  let component: NotificationsV3Component;
  let fixture: ComponentFixture<NotificationsV3Component>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationsV3Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationsV3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
