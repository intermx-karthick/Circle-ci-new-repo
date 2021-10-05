import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';

import { RequestAuditDialogComponent } from './request-audit-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
  import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { FlexLayoutModule } from '@angular/flex-layout';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { FormsModule, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GeoKeysPipe } from 'app/explore/pipes/geo-keys.pipe';
import { PlacesFiltersService } from '../filters/places-filters.service';
import { PlacesDataService, ThemeService } from '@shared/services';
import swal from 'sweetalert2';

describe('RequestAuditDialogComponent', () => {
  let component: RequestAuditDialogComponent;
  let fixture: ComponentFixture<RequestAuditDialogComponent>;
  let placeFilterService: PlacesFiltersService;
  let placesDataService: PlacesDataService;
  let themeService: ThemeService;
  const placeDetails = {
    place_name: 'sample Name',
    properties: {
      address: {
        city: 'tulsa',
        state: 'ok',
        street_address: '7625 east 87th street',
        zip_code: '74133',
      },
      brands: '',
      sub_category: 'Elementary and Secondary Schools',
      top_category: 'Elementary and Secondary Schools',
      naics_code: '611110',

    }
  };
  placeFilterService = jasmine.createSpyObj('PlacesFiltersService', [
    'requestAudit',
  ]);
  placesDataService = jasmine.createSpyObj('PlacesDataService', [
    'getStaticMapImage',
  ]);
  themeService = jasmine.createSpyObj('ThemeService', [
    'getThemeSettings',
  ]);
  
  const publicData = { placeDetail: placeDetails};
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        RequestAuditDialogComponent ,
         TruncatePipe,
         GeoKeysPipe
        ],
      imports : [
        BrowserAnimationsModule,
        MatDialogModule,
        MatCheckboxModule,
        MatButtonModule,
        FlexLayoutModule,
        MatIconModule,
        MatSelectModule,
        MatDividerModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule
      ],
      providers: [
        {provide: MatDialogRef, useValue: {}},
        { provide: MAT_DIALOG_DATA, useValue: publicData },
        { provide: PlacesFiltersService, useValue: placeFilterService },
        { provide: PlacesDataService, useValue: placesDataService },
        { provide: ThemeService, useValue: themeService },
      ],
      schemas: [NO_ERRORS_SCHEMA]

    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestAuditDialogComponent);
    component = fixture.componentInstance;
    (<jasmine.Spy>placeFilterService.requestAudit).and.returnValue(of({'mailsend': true}));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be able to render the checkbox & request it', () => {
    component.requestAuditForm.controls['placeName'].setValue(true);
    expect(component.selectedRequestAudits.length).toEqual(1);
  });

  it('should be able clear the selected audit request', () => {
    component.requestAuditForm.controls['placeName'].setValue(true);
    fixture.detectChanges();
    expect(component.selectedRequestAudits.length).toEqual(1);
    const closeItem = fixture.nativeElement.querySelector
    ('.unit-test-selected-audit mat-icon') as HTMLElement;
    closeItem.click();
    expect(component.selectedRequestAudits.length).toEqual(0);
  });

  it('should clear all the selected request audit', () => {
    component.requestAuditForm.controls['placeName'].setValue(true);
    component.requestAuditForm.controls['visitorsWork'].setValue(true);
    fixture.detectChanges();
    expect(component.selectedRequestAudits.length).toEqual(2);
    const clearAll = fixture.nativeElement.querySelector
    ('.unit-test-clear-all') as HTMLElement;
    clearAll.click();
  });

  it('should able to submit the request audit', () => {
    component.requestAuditForm.controls['placeName'].setValue(true);
    component.requestAuditForm.controls['visitorsWork'].setValue(true);
    spyOn(component, 'onSubmitAuditRequest');
    fixture.detectChanges();
    expect(component.selectedRequestAudits.length).toEqual(2);
    const requestSubmit = fixture.nativeElement.querySelector
    ('.unit-request-audit-submit') as HTMLButtonElement;
    requestSubmit.click();
    expect(component.onSubmitAuditRequest).toHaveBeenCalled();
  });

});
