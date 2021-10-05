/*
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryManagementComponent } from './inventory-management.component';
import { ExploreDataService, InventoryService, ThemeService } from '@shared/services';
import { PopupService } from '@shared/popup/popup.service';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';

describe('InventoryManagementComponent', () => {
  let component: InventoryManagementComponent;
  let fixture: ComponentFixture<InventoryManagementComponent>;
  const exploreDataService = jasmine.createSpyObj('ExploreDataService', [
    'getMapObject'
  ]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SharedModule,
        HttpClientModule
      ],
      declarations: [
        InventoryManagementComponent
      ],
      providers: [
        { provide: InventoryService, useValue: {} },
        { provide: ThemeService, useValue: {} },
        { provide: ExploreDataService, useValue: exploreDataService },
        { provide: PopupService, useValue: {} }
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    exploreDataService.getMapObject.and.returnValue(of(null));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
*/
