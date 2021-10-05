import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PlaceDetailsGridComponent } from './place-details-grid.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { of } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import {AppConfig} from '../../../../app/app-config.service';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('PlaceDetailsGridComponent', () => {
  let component: PlaceDetailsGridComponent;
  let fixture: ComponentFixture<PlaceDetailsGridComponent>;
  const placesFiltersService = jasmine.createSpyObj('PlacesFiltersService', [ 'openFilterTab' ]);
  const config = jasmine.createSpyObj('AppConfigService', [
    'load',
    'API_ENDPOINT'
  ]);

  beforeEach(waitForAsync(() => {
    placesFiltersService.openFilterTab.and.returnValue(of());

    TestBed.configureTestingModule({
      declarations: [
        PlaceDetailsGridComponent,
        TruncatePipe
      ],
      imports: [
        BrowserAnimationsModule,
        HttpClientModule,
        MatIconModule,
        MatMenuModule,
        MatDialogModule,
        MatButtonModule,
        MatCheckboxModule,
        MatSelectModule
      ],
      providers: [
        {provide: AppConfig, useValue: config}
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaceDetailsGridComponent);
    component = fixture.componentInstance;

    const inputValue =  [
      {id: 'sg:78703c3c20d14d669b90180ccebd4312', selected: true},
      {id: 'sg:15ac71fd997c40dea207c7845f55ea7b', selected: true}];
      const placeResults = [
        {
          brands: '',
          city: 'anchorage',
          created_datetime: '2019-02-28T00:00:00',
          latitude: '61.135901',
          location_name: 'Alaska USA Federal Credit Union',
          longitude: '-149.83893',
          naics_code: '522110',
          open_hours: '10:00',
          parent_safegraph_place_id: '',
          phone_number: '',
          safegraph_brand_ids: '',
          safegraph_place_id: 'sg:b82f3299d21a46dbbf07a7807666643c',
          selected: true,
          state: 'ak',
          street_address: '2300 abbott road',
          sub_category: 'Commercial Banking',
          top_category: 'Depository Credit Intermediation',
          zip_code: '99507',
          begin_time: '2019-02-28T00:00:00'
        }
      ];
      const sortables = [{
        field_name: 'Place Name',
        key: 'location_name'
      }];

    component.sfids = inputValue;
    component.placeResults = placeResults;
    component.sortables = sortables;

    fixture.detectChanges();
  });

  /* it(`it should create 'Place Details Grid Component'`, () => {
    expect(component).toBeTruthy();
  });

  it(`it should check 'selectCheckboxToggle' method`, () => {
    spyOn(component, 'selectCheckboxToggle');
    const placeCheckbox = fixture.nativeElement.querySelector('.result-item .mat-checkbox-inner-container-no-side-margin') as HTMLElement;
    placeCheckbox.click();
    fixture.detectChanges();
    expect(component.selectCheckboxToggle).toHaveBeenCalled();
  });

  it(`it should click 'onCardClick' method to get details`, () => {
    spyOn(component, 'onCardClick');
    const element = fixture.nativeElement.querySelector('.result-item h6') as HTMLElement;
    element.click();
    fixture.detectChanges();
    expect(component.onCardClick).toHaveBeenCalled();
  });

  it(`it should call 'hoverOnCard' method`, () => {
    spyOn(component, 'hoverOnCard');
    const event = new Event('mouseenter');

    const element = fixture.nativeElement.querySelector('.result-item') as HTMLElement;
    element.dispatchEvent(event);
    fixture.detectChanges();
    expect(component.hoverOnCard).toHaveBeenCalled();
  });

  it(`it should call 'hoverOutOnCard' method`, () => {
    spyOn(component, 'hoverOutOnCard');
    const event = new Event('mouseleave');
    const element = fixture.nativeElement.querySelector('.result-item') as HTMLElement;
    element.dispatchEvent(event);
    fixture.detectChanges();
    expect(component.hoverOutOnCard).toHaveBeenCalled();
  });

  it(`it should call 'loadMore' method`, () => {
    spyOn(component, 'loadMore');
    const element = fixture.debugElement.query(By.css('.result-list-container'));
    element.triggerEventHandler('scrolled', null);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.loadMore).toHaveBeenCalled();
    });
  });

  it(`it should call 'onResize' method`, () => {
    component.contentHeight = 292;
    fixture.detectChanges();
    spyOn(component, 'onResize');
    const event = new Event('resize');
    window.dispatchEvent(event);
    fixture.detectChanges();
    expect(component.onResize).toHaveBeenCalled();
  });

  it(`it should call 'onSortables' method`, () => {
    spyOn(component, 'onSortables');
    const event = { value: 'place_name' };
    const element = fixture.debugElement.query(By.css('mat-select'));
    element.triggerEventHandler('selectionChange', event);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.onSortables).toHaveBeenCalledWith({value: 'place_name'});
    });
  }); */

});
