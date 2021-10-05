import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AudienceGhostComponent } from './audience-ghost.component';

describe('AudienceGhostComponent', () => {
  let component: AudienceGhostComponent;
  let fixture: ComponentFixture<AudienceGhostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AudienceGhostComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AudienceGhostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
