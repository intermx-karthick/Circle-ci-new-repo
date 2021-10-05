import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Component } from '@angular/core';
import {AuthenticationService} from '@shared/services';
import { MyPlacesFilterComponent } from './my-places-filter.component';
import { MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexModule } from '@angular/flex-layout';
import {MatFormFieldModule} from '@angular/material/form-field';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {MatDialogModule} from '@angular/material/dialog';
import { HttpClientModule } from '@angular/common/http';
import { PlacesFiltersService } from '../places-filters.service';
import { AppConfig } from 'app/app-config.service';
import { of } from 'rxjs';

@Component({ selector: 'app-audit-jobs-filter', template: '' })
class AduitJobsFilterComponent { }

describe('MyPlacesFilterComponent', () => {
  let component: MyPlacesFilterComponent;
  let fixture: ComponentFixture<MyPlacesFilterComponent>;
  let placesFiltersService: PlacesFiltersService;
  let AuthService: AuthenticationService;
  let config: any;
  const jobs = [
      {name: 'Job 1', title: 'Processing'},
      {name: 'Job 2', title: 'Completed'},
    ];
  beforeEach(waitForAsync(() => {
    config = jasmine.createSpyObj('AppConfigService', [
      'load',
      'API_ENDPOINT'
    ]);
    placesFiltersService = jasmine.createSpyObj('placesFiltersService', [
      'getJobs',
      'getNewColumnOpened',
      'setNewColumnOpened',
      'getCreateNewPlace'
    ]);
    AuthService = jasmine.createSpyObj('AuthenticationService', [
      'getModuleAccess'
    ]);
    TestBed.configureTestingModule({
      declarations: [
        MyPlacesFilterComponent , AduitJobsFilterComponent,
       ],
      imports: [
        MatExpansionModule,
        BrowserAnimationsModule,
        FlexModule,
        HttpClientModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatIconModule,
        MatDialogModule
         ],
         providers: [
          {provide: MatDialogRef, useValue: {}},
          { provide: AppConfig, useValue: config },
          { provide: PlacesFiltersService, useValue: placesFiltersService},
          { provide: AuthenticationService, useValue: AuthService},
         ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    (<jasmine.Spy>placesFiltersService.getJobs).and.returnValue(of(jobs));
    (<jasmine.Spy>placesFiltersService.getNewColumnOpened).and.returnValue(of(false));
    (<jasmine.Spy>placesFiltersService.getCreateNewPlace).and.returnValue(of({}));
    fixture = TestBed.createComponent(MyPlacesFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
