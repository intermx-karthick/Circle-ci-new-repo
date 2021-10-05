import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PlaceSetsDialogComponent } from './place-sets-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import {MatRadioModule, MatRadioButton} from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { DebugElement } from '@angular/core';
import {By} from '@angular/platform-browser';

describe('PlaceSetsDialogComponent', () => {
  let component: PlaceSetsDialogComponent;
  let fixture:
  ComponentFixture<PlaceSetsDialogComponent>;
  let radioLabelElements: HTMLLabelElement[];
  let radioDebugElements: DebugElement[];
  let radioInstances: MatRadioButton[];
  const placeSets = [
    {
      'name': 'plase set test1',
      'pois': [],
      '_id' : '123123sfasdf123'
    },
    {
      'name': 'plase set test2',
      'pois': [],
      '_id' : '123123sfasdf124'
    }
  ];
  beforeEach(waitForAsync(() => {
    let dialogRef;
    let dialogData;
    dialogRef = jasmine.createSpyObj('MatDialogRef', [
      'data',
      'close'
    ]);
    dialogData = jasmine.createSpyObj('MAT_DIALOG_DATA', [
      ''
    ]);
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        RouterTestingModule.withRoutes([]),
        MatRadioModule
      ],
      declarations: [PlaceSetsDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaceSetsDialogComponent);
    component = fixture.componentInstance;
    component.dialogData = placeSets;
    fixture.detectChanges();
    radioDebugElements = fixture.debugElement.queryAll(By.css('mat-radio-button'));
    radioLabelElements = radioDebugElements
    .map(debugEl => debugEl.query(By.css('label')).nativeElement);
    radioInstances = radioDebugElements.map(debugEl => debugEl.componentInstance);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`should be the title 'Place sets'`, () => {
    const title = fixture.nativeElement.querySelector('.title') as HTMLLinkElement;
    const titleCaptions = fixture.nativeElement.querySelector('.title-caption') as HTMLLinkElement;
    expect(title.innerText).toBe('Place sets');
    expect(titleCaptions.innerText).toBe('Please select from your saved place sets below.');
  });

  it('should be able to list the place sets', () => {    expect(radioDebugElements.length).toBe(component.dialogData.length);
  });

  it('should select the place sets option', () => {
    radioLabelElements[0].click();
    fixture.detectChanges();
    expect(radioInstances[0].checked).toBe(true);
    expect(component.selectedPlaceSet['name']).toBe(component.dialogData[0]['name']);
  });

  it(`should have 'cancel & apply button'`, () => {
    const cancelBtn = fixture.nativeElement.querySelector('.test-cancel-btn') as HTMLButtonElement;
    const applyBtn = fixture.nativeElement.querySelector('.test-apply-btn') as HTMLButtonElement;
    expect(cancelBtn.innerText).toBe('CANCEL');
    expect(applyBtn.innerText).toBe('APPLY');
  });

  it(`should able to apply the 'selected place set'`, () => {
    radioLabelElements[1].click();
    fixture.detectChanges();
    expect(radioInstances[1].checked).toBe(true);
    const applyBtn = fixture.nativeElement.querySelector('.test-apply-btn') as HTMLButtonElement;
    applyBtn.click();
    expect(component.selectedPlaceSet['name']).toBe(component.dialogData[1]['name']);
  });

});
