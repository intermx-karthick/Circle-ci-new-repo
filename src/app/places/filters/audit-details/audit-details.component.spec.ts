import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AuditDetailsComponent } from './audit-details.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonService } from '@shared/services';
import { AppConfig } from 'app/app-config.service';
import { PlacesFiltersService } from '../places-filters.service';
import { of } from 'rxjs';

@Component({selector: 'app-dropdown', template: ''})
class DropdownComponent {}

describe('AuditDetailsComponent', () => {
  let component: AuditDetailsComponent;
  let fixture: ComponentFixture<AuditDetailsComponent>;
  let commonService: CommonService;
  let placesFiltersService: PlacesFiltersService;
  let config: any;
  const statuses = [
    {id: 0, status: "None"},
    {id: 1, status: "Requested"},
    {id: 2, status: "Started"},
    {id: 3, status: "Requires Review"},
    {id: 4, status: "Reviewed"},
    {id: 5, status: "Certified"},
    {id: 6, status: "Expired"},
    {id: 7, status: "Closed"}
  ];
  beforeEach(waitForAsync(() => {
    config = jasmine.createSpyObj('AppConfigService', [
      'load',
      'API_ENDPOINT'
    ]);
    commonService = jasmine.createSpyObj('CommonService', [
      'setDropdownState'
    ]);
    placesFiltersService = jasmine.createSpyObj('placesFiltersService', [
      'getPlaceStatuses'
    ]);
    TestBed.configureTestingModule({
      declarations: [
        AuditDetailsComponent,
        DropdownComponent
      ],
      imports: [
        BrowserAnimationsModule,
        MatFormFieldModule,
        FlexLayoutModule,
        MatTabsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatSelectModule,
        MatInputModule,
        MatIconModule,,
        MatDialog,
        FormsModule,
        ReactiveFormsModule,
        OverlayModule
      ],
      providers: [
        { provide: CommonService, useValue: commonService },
        { provide: AppConfig, useValue: config },
        { provide: PlacesFiltersService, useValue: placesFiltersService}
       ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditDetailsComponent);
    (<jasmine.Spy>placesFiltersService.getPlaceStatuses).and.returnValue(of(statuses));
    component = fixture.componentInstance;
    component.place = {
      place_id: null,
      client_id: 2,
      id: 1,
      location_id: 'ddfsadf',
      location_name: 'dfdsf',
      street_address: 'sdf',
      city: 'sdfasdf',
      state: 'adfadsf',
      zip_code: 'sadfsadf',
      lat: 'asdfsadf',
      lng: 'sdfasdf',
      dma_market: 'adfasdfs',
      dma_rank: 22,
      heregeodisplat: 'asdfsdaf',
      heregeodisplon: 'sadfasdf',
      heregeonavlat: 'sdfasdf',
      heregeonavlon: 'asdfasdf',
      heregeoaddress: 'sadfads',
      heregeocity: 'sadfsadf',
      heregeostate: 'sdfasdf',
      heregeozipcode: 234324,
      heregeomatch: 'adsfs',
      heregeomatchtype: 'sdfsdf',
      heregeomatchrelevance: 23,
      heregeomatchquality: 32,
      display_geometry: {
        type: 'sdf',
        coordinates: [32, 32],
      },
      nav_geometry: {
        type: 'sdf',
        coordinates: [32, 32],
      },
    };
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
