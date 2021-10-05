import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PlacesFiltersComponent } from './places-filters.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, Observable } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpClientModule } from '@angular/common/http';
import {AppConfig} from '../../../../app/app-config.service';
import { LoaderService } from '@shared/services/loader.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlacesFiltersService } from '../places-filters.service';
import { By } from '@angular/platform-browser';

describe('PlacesFiltersComponent', () => {
  let component: PlacesFiltersComponent;
  let fixture: ComponentFixture<PlacesFiltersComponent>;

  const placesFiltersService = jasmine.createSpyObj('PlacesFiltersService',
  [ 'getFilterSidenav',
    'openFilterTab',
    'setFilterLevel',
    'getFilterLevelState',
    'getPlacesSession',
    'setFilterSidenav',
    'getPlaceSetsSummary',
    'getPlacesSet',
    'savePlacesSession',
    'resetAll'
  ]);

  const loaderService = jasmine.createSpyObj('LoaderService', ['display']);

  const config = jasmine.createSpyObj('AppConfigService', [
    'load',
    'API_ENDPOINT'
  ]);

  beforeEach(waitForAsync(() => {

    TestBed.configureTestingModule({
      declarations: [ PlacesFiltersComponent],
      imports: [
        BrowserAnimationsModule,
        MatTabsModule,
        HttpClientModule
      ],
      providers: [
        {provide: AppConfig, useValue: config},
        {provide: LoaderService, useValue: loaderService},
        {provide: PlacesFiltersService, useValue: placesFiltersService},
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    const sideNav = {
      open: true,
      tab: 'findAndDefine'
    };

    const level = [{
      filterLevel: 1,
      placeResultExpand: false,
      searchHide: false
    }];

    fixture = TestBed.createComponent(PlacesFiltersComponent);
    component = fixture.componentInstance;
    (<jasmine.Spy>placesFiltersService.getFilterSidenav).and.returnValue(of(sideNav));
    (<jasmine.Spy>placesFiltersService.getFilterLevelState).and.returnValue(of(level));
    (<jasmine.Spy>placesFiltersService.getPlacesSession).and.returnValue(of());
    (<jasmine.Spy>placesFiltersService.openFilterTab).and.returnValue(of());
    (<jasmine.Spy>placesFiltersService.setFilterLevel).and.returnValue(of());
    (<jasmine.Spy>placesFiltersService.setFilterSidenav).and.returnValue(of());
    (<jasmine.Spy>placesFiltersService.getPlaceSetsSummary).and.returnValue(of());
    (<jasmine.Spy>placesFiltersService.getPlacesSet).and.returnValue(of());
    (<jasmine.Spy>placesFiltersService.resetAll).and.returnValue(of());
  });

  /* it(`it should create 'Place Filters Component'`, (done) => {
    expect(component).toBeTruthy();
    done();
  });

  it(`it should check 'onSelectedIndexChange' method`, () => {
    spyOn(component, 'onSelectedIndexChange').and.callThrough();
    const tabComponent = fixture.debugElement.query(By.css('.mat-tab-group'));
    tabComponent.triggerEventHandler('selectedIndexChange', { target: tabComponent.nativeElement });
    fixture.whenStable().then(() => {
      expect(component.onSelectedIndexChange).toHaveBeenCalled();
    });
    fixture.detectChanges();
  }); */
});
