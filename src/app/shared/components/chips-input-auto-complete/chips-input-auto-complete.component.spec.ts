import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ChipsInputAutoCompleteComponent } from './chips-input-auto-complete.component';

describe('ChipsInputComponent', () => {
  let component: ChipsInputAutoCompleteComponent;
  let fixture: ComponentFixture<ChipsInputAutoCompleteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChipsInputAutoCompleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChipsInputAutoCompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
});
