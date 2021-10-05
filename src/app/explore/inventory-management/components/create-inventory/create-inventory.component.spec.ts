/*
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateInventoryComponent } from './create-inventory.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '@shared/services';
import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';

describe('CreateInventoryComponent', () => {
  let component: CreateInventoryComponent;
  let fixture: ComponentFixture<CreateInventoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
        HttpClientModule,
      ],
      declarations: [CreateInventoryComponent],
      providers: [
        { provide: MatDialogRef, useValue: { data: null, close: (dialogResult: any) => { }} },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: CommonService, useValue: {} }
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
*/
