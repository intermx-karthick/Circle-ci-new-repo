import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SingleTextSuggestionComponent } from './single-text-suggestion.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

describe('SingleTextSuggestionComponent', () => {
  let component: SingleTextSuggestionComponent;
  let fixture: ComponentFixture<SingleTextSuggestionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SingleTextSuggestionComponent ],
      imports: [ BrowserAnimationsModule,
        MatDialogModule,
        MatCheckboxModule,
        MatButtonModule,
        FlexLayoutModule,
        MatIconModule,
        MatSelectModule,
        MatDividerModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleTextSuggestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
