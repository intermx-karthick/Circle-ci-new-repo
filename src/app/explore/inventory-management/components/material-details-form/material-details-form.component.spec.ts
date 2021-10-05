/*
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialDetailsFormComponent } from './material-details-form.component';
import { InventoryService } from '@shared/services';
import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('MaterialDetailsFormComponent', () => {
  let component: MaterialDetailsFormComponent;
  let fixture: ComponentFixture<MaterialDetailsFormComponent>;
  const inventoryService = jasmine.createSpyObj('InventoryService', [
    "getIllumnationTypes"
  ]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        HttpClientModule,
        SharedModule,
      ],
      declarations: [ MaterialDetailsFormComponent ],
      providers: [
        {provide: InventoryService, useValue: inventoryService},
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(()=>{
    inventoryService.getIllumnationTypes.and.returnValue(of({ illumination_types: [] }))
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialDetailsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
*/
