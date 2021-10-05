/*
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { GeneralFormComponent } from './general-form.component';
import { InventoryService } from '@shared/services';
import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { from, of } from 'rxjs';

describe('GeneralFormComponent', () => {
  let component: GeneralFormComponent;
  let fixture: ComponentFixture<GeneralFormComponent>;
  const inventoryService = jasmine.createSpyObj('InventoryService', [
    'getVendors'
  ]);

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SharedModule,
        HttpClientModule
      ],
      declarations: [GeneralFormComponent],
      providers: [
        { provide: InventoryService, useValue: inventoryService }
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(()=>{
    inventoryService.getVendors.and.returnValue(of({ results: [] }));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
*/
