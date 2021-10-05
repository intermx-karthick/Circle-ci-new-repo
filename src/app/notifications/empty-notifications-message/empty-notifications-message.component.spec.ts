import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EmptyNotificationsMessageComponent } from './empty-notifications-message.component';

describe('EmptyNotificationsMessageComponent', () => {
  let component: EmptyNotificationsMessageComponent;
  let fixture: ComponentFixture<EmptyNotificationsMessageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EmptyNotificationsMessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmptyNotificationsMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
