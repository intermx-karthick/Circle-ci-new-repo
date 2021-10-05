/*
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaClassDetailsFormComponent } from './media-class-details-form.component';
import { InventoryService } from '@shared/services';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';

describe('MediaClassDetailsFormComponent', () => {
  let component: MediaClassDetailsFormComponent;
  let fixture: ComponentFixture<MediaClassDetailsFormComponent>;
  const inventoryService = jasmine.createSpyObj('InventoryService', [
    "getStatusTypes",
    "getPlacementTypeList"
  ]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        HttpClientModule,
        SharedModule,
      ],
      declarations: [ MediaClassDetailsFormComponent ],
      providers: [
        {provide: InventoryService, useValue: inventoryService},
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(()=>{
    inventoryService.getStatusTypes.and.returnValue(of({ status_types: [] }));
    inventoryService.getPlacementTypeList.and.returnValue(of({ placement_types: [] }));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaClassDetailsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
*/
