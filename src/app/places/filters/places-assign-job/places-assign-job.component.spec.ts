// import { async, ComponentFixture, TestBed } from '@angular/core/testing';
// import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { PlacesAssignjobComponent } from './places-assign-job.component';
// import { MatSelectModule, MatFormFieldModule, MatInputModule, MatStepperModule, MatIconModule, MatDialogRef, MatButtonModule } from '@angular/material';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { FlexModule } from '@angular/flex-layout';
// import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { HttpClientModule } from '@angular/common/http';
// import { AppConfig } from 'app/app-config.service';
// import { PlacesFiltersService } from '../places-filters.service';
// import { of } from 'rxjs';
// import { By } from '@angular/platform-browser';

// describe('PlacesAssigncustomerComponent', () => {
//   let component: PlacesAssignjobComponent;
//   let fixture: ComponentFixture<PlacesAssignjobComponent>;
//   let placesFiltersService: PlacesFiltersService;
//   let config: any;
//   let element;
//   const dbFieldsData = {
//     'columns': [
//       { key: 'id', title: 'Id' },
//       { key: 'client_id', title: 'Client Id' },
//       { key: 'location_id', title: 'Location Id' }
//     ]
//   };
//   const uploadResponse = {
//     'file': '1567678934154.csv', 'headers': ['client_id', 'location_id', 'name', 'address',
//       'city', 'state', 'zip', 'lat', 'lng', 'dma_market', 'dma_rank', 'browser', 'heregeodisplat', 'heregeodisplon',
//       'heregeonavlat', 'heregeonavlon', 'heregeoaddress', 'heregeocity', 'heregeostate', 'heregeozipcode',
//       'heregeomatch', 'heregeomatchtype', 'heregeomatchrelevance', 'heregeomatchquality', 'place_id', 'display_geometry',
//       'nav_geometry']
//   };
//   const customers = [
//     {
//       client_id: 22,
//       client_name: 'FerryAds'
//     },
//     {
//       client_id: 24,
//       client_name: 'Simon'
//     }];
//   beforeEach(async(() => {

//     config = jasmine.createSpyObj('AppConfigService', [
//       'load',
//       'API_ENDPOINT'
//     ]);
//     placesFiltersService = jasmine.createSpyObj('placesFiltersService', [
//       'getCustomersList',
//       'getDBFields',
//       'updateCsvFieldsMapping',
//       'uploadFile'
//     ]);

//     TestBed.configureTestingModule({
//       declarations: [PlacesAssignjobComponent],
//       imports: [
//         BrowserAnimationsModule,
//         FormsModule,
//         ReactiveFormsModule,
//         HttpClientModule,
//         MatSelectModule,
//         FlexModule,
//         MatFormFieldModule,
//         MatInputModule,
//         MatStepperModule,
//         MatIconModule,
//         MatButtonModule
//       ],
//       providers: [
//         { provide: MatDialogRef, useValue: {} },
//         { provide: AppConfig, useValue: config },
//         { provide: PlacesFiltersService, useValue: placesFiltersService }
//       ],
//       schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
//     })
//       .compileComponents();
//   }));

//   beforeEach(() => {
//     (<jasmine.Spy>placesFiltersService.getDBFields).and.returnValue(of(dbFieldsData));
//     (<jasmine.Spy>placesFiltersService.getCustomersList).and.returnValue(of(customers));
//     (<jasmine.Spy>placesFiltersService.uploadFile).and.returnValue(of(uploadResponse));
//     (<jasmine.Spy>placesFiltersService.updateCsvFieldsMapping).and.returnValue(of({ message: 'file updated to server' }));

//     fixture = TestBed.createComponent(PlacesAssignjobComponent);


//     component = fixture.componentInstance;
//     element = fixture.nativeElement;

//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   it('able to render customer selecct & file upload Fields', () => {
//     const customerSelect: HTMLElement = fixture.debugElement.query(By.css('.e2e-customer-select')).nativeElement;
//     const uploadFile: HTMLElement = fixture.debugElement.query(By.css('.unit-fileInp')).nativeElement;
//     expect(customerSelect).toBeTruthy();
//     expect(uploadFile).toBeTruthy();
//   });

//   it('able to file upload', () => {
//     spyOn(component, 'processFile');
//     const uploadFile = element.querySelector('.unit-fileInp');
//     component.uploadForm.controls['fileName'].patchValue('sampleCSV.csv');
//     uploadFile.dispatchEvent(new Event('change'));
//     fixture.detectChanges();
//     expect(component.processFile).toHaveBeenCalled();
//   });

//   it('able to uploadFile  & match the field', () => {
//     component.uploadForm.controls['fileName'].patchValue('sampleCSV.csv');
//     // component.uploadForm.controls['customerId'].patchValue(24);
//     component.uploadFormSubmit();
//     component.selectedIndex = 1;
//     fixture.detectChanges();
//     expect(component.selectedCustomerId).toBe(24);
//     expect(component.uploadedFileName).toBe(uploadResponse.file);
//     expect(component.dbFields.length).toBe(3);
//     expect(component.fileHeaders.length).toBe(28);
//   });

//   it('able to show & hide unmatched fields', () => {
//     component.uploadForm.controls['fileName'].patchValue('sampleCSV.csv');
//     // component.uploadForm.controls['customerId'].patchValue(24);
//     component.uploadFormSubmit();
//     component.selectedIndex = 1;
//     fixture.detectChanges();
//     const showLink: HTMLElement = fixture.debugElement.query(By.css('.unit-test-showhide')).nativeElement;
//     expect(showLink.innerText).toBe('VIEW ALL UNMAPPED FIELDS');
//     showLink.click();
//     fixture.detectChanges();
//     const HideLink: HTMLElement = fixture.debugElement.query(By.css('.unit-test-showhide')).nativeElement;
//     expect(HideLink.innerText).toBe('HIDE ALL UNMAPPED FIELDS');
//   });

//   it('able to send matched fields to server', () => {
//     component.uploadForm.controls['fileName'].patchValue('sampleCSV.csv');
//     // component.uploadForm.controls['customerId'].patchValue(24);
//     component.uploadFormSubmit();
//     component.selectedIndex = 1;
//     fixture.detectChanges();
//     const fileSubmit: HTMLElement = fixture.debugElement.query(By.css('.unit-file-submit')).nativeElement;
//     fileSubmit.click();
//     fixture.detectChanges();
//     expect(component.selectedIndex).toBe(2);
//     const completeMessage: HTMLElement = fixture.debugElement.query(By.css('.upload-complete')).nativeElement;
//     expect(completeMessage.innerText).toContain('File uploaded successfully.');
//   });

//   it('able to call sample download csv function', () => {
//     spyOn(component, 'downloadSampleCSV');
//     component.selectedIndex = 0;
//     fixture.detectChanges();
//     const downloadCSVLink: HTMLElement = fixture.debugElement.query(By.css('.unit-test-domloadcsv')).nativeElement;
//     downloadCSVLink.click();
//     fixture.detectChanges();
//     expect(component.downloadSampleCSV).toHaveBeenCalled();

//   });

// });
