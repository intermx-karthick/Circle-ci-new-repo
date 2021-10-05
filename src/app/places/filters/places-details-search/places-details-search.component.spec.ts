import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PlacesDetailsSearchComponent } from './places-details-search.component';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { OverlayModule } from '@angular/cdk/overlay';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ConvertPipe } from '@shared/pipes/convert.pipe';
import { DebounceDirective } from '@shared/directives/debounce.directive';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { AppConfig } from 'app/app-config.service';
import { CommonService } from '@shared/services';

describe('PlacesDetailsSearchComponent', () => {
  let component: PlacesDetailsSearchComponent;
  let fixture: ComponentFixture<PlacesDetailsSearchComponent>;
  let config: any;
  let commonService: CommonService;
  const placesType = [
    {
      'sub_categories': [
        {
          'name': 'General Automotive Repair',
          'count': 2
        }
      ],
      'top_category': 'Automotive Repair and Maintenance'
    }
  ];
  let searchKeywordValue: any;

  beforeEach(waitForAsync(() => {

    config = jasmine.createSpyObj('AppConfigService', [
      'load',
      'API_ENDPOINT'
    ]);

    commonService = jasmine.createSpyObj('CommonService', [
      'setDropdownState'
    ]);

    TestBed.configureTestingModule({
      imports : [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        RouterTestingModule.withRoutes([]),
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatListModule,
        OverlayModule,
        FlexLayoutModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatExpansionModule,
        MatTreeModule,
        MatCheckboxModule
      ],
      declarations: [
        PlacesDetailsSearchComponent,
        ConvertPipe,
        DebounceDirective,
        TruncatePipe
       ],
       providers: [
        { provide: AppConfig, useValue: config },
        { provide: CommonService, useValue: commonService }
       ],
       schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlacesDetailsSearchComponent);
    component = fixture.componentInstance;
    component.filterData = {
      place: 'mcd'
    };
    component.dataSource = new MatTreeNestedDataSource();
    component.dataSource.data = component.generatePlaceTypes(placesType);
    /* searchKeywordValue = fixture.nativeElement.querySelector('#searchKeyword') as HTMLInputElement;
    searchKeywordValue.click();
    fixture.detectChanges();
    searchKeywordValue.value = 'mcd'; */
    component.showSearchField = false;
    fixture.detectChanges();
  });

  /* it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid when empty', () => {
    expect(component.searchKeyForm.valid).toBeFalsy();
  });

  it('select the places type', async() => {
    fixture.detectChanges();
    const checkBoxElement: HTMLElement = fixture.debugElement.query(By.css('.mat-checkbox-inner-container input')).nativeElement;
    checkBoxElement.click();
    fixture.detectChanges();
  });

  it('open and close the mat-accordion', async() => {
    fixture.detectChanges();
    const checkBoxElement: HTMLElement = fixture.debugElement.query(By.css('#placeTypes')).nativeElement;
    checkBoxElement.click();
    fixture.detectChanges();
  });

  it('show the place types search bar', async() => {
    component.showSearch();
    fixture.detectChanges();
  });

  it('reset key Form', async() => {
    component.showSearchField = true;
    // component.resetKeyForm();
    fixture.detectChanges();
  }); */

});
