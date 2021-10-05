/*
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NameAndAttributesFormComponent } from './name-and-attributes-form.component';
import { InventoryService } from '@shared/services';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';

describe('NameAndAttributesFormComponent', () => {
  let component: NameAndAttributesFormComponent;
  let fixture: ComponentFixture<NameAndAttributesFormComponent>;
  const inventoryService = jasmine.createSpyObj('InventoryService', [
    'getMediaClasses',
    'getMediaTypes',
    'getStructureTypes',
    'getPlaceTypes'
  ]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        HttpClientModule,
        SharedModule
      ],
      declarations: [NameAndAttributesFormComponent],
      providers: [
        { provide: InventoryService, useValue: inventoryService }
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    inventoryService.getMediaClasses.and.returnValue(of({ classification_types: [] }));
    inventoryService.getMediaTypes.and.returnValue(of({ media_types: [] }));
    inventoryService.getStructureTypes.and.returnValue(of({ construction_types: [] }));
    inventoryService.getPlaceTypes.and.returnValue(of({ place_types: [] }));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NameAndAttributesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
*/
