import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ImxTimeStampComponent } from './imx-time-stamp.component';
import { TimeStamp } from '@interTypes/time-stamp';
import { By } from '@angular/platform-browser';

const MOCK_TIME_STAMP: TimeStamp = {
  createdBy: 'vendran',
  updatedBy: 'vendran',
  createdAt: '2020-11-17T11:19:22.817Z' as any,
  updatedAt: '2020-11-17T11:19:22.818Z' as any
};

describe('ImxTimeStampComponent', () => {
  let component: ImxTimeStampComponent;
  let fixture: ComponentFixture<ImxTimeStampComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ImxTimeStampComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImxTimeStampComponent);
    component = fixture.componentInstance;
    component.timeStampData = MOCK_TIME_STAMP as TimeStamp;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should timestamp data attach to dom', () => {
    const createdByEl = fixture.debugElement.query(By.css('#created_by'));
    expect(createdByEl.nativeElement.innerHTML).toBe(
      MOCK_TIME_STAMP.createdBy
    );
  });
});
