import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ChipsInputGroupAutoCompleteComponent } from './chips-input-group-auto-complete.component';

describe('ChipsInputComponent', () => {
  let component: ChipsInputGroupAutoCompleteComponent;
  let fixture: ComponentFixture<ChipsInputGroupAutoCompleteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChipsInputGroupAutoCompleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChipsInputGroupAutoCompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
});
