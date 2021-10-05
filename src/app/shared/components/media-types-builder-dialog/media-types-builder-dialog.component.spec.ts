import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MediaTypesBuilderDialogComponent } from './media-types-builder-dialog.component';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatTreeModule } from '@angular/material/tree';
import { CommonService, InventoryService } from '@shared/services';
import { FiltersService } from 'app/explore/filters/filters.service';
import { of } from 'rxjs';

@Component({ selector: 'app-media-types-filter-builder', template: '' })
class MediaTypesFilterBuilderComponent { }

describe('MediaTypesBuilderDialogComponent', () => {
  let component: MediaTypesBuilderDialogComponent;
  let fixture: ComponentFixture<MediaTypesBuilderDialogComponent>;
  let filterService: FiltersService;

  beforeEach(waitForAsync(() => {

    filterService = jasmine.createSpyObj('FiltersService', [
      'normalizeFilterDataNew'
    ]);

    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatCheckboxModule,
        MatTreeModule,
        MatDialogModule
      ],
      declarations: [ MediaTypesBuilderDialogComponent, MediaTypesFilterBuilderComponent ],
      providers: [
        {provide: MatDialogRef, useValue: ''},
        {provide: MAT_DIALOG_DATA, useValue: ''},
        {provide: CommonService, useValue: ''},
        {provide: InventoryService, useValue: ''},
        {provide: FiltersService, useValue: filterService}
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaTypesBuilderDialogComponent);
    component = fixture.componentInstance;
    (<jasmine.Spy>filterService.normalizeFilterDataNew).and.returnValue(of());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
