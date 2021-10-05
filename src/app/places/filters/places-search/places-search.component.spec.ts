import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PlacesSearchComponent } from './places-search.component';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { HttpClientModule } from '@angular/common/http';
import { AppConfig } from 'app/app-config.service';
import { PlacesDataService, CommonService } from '@shared/services';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { PlacesFiltersService } from '../places-filters.service';
import { of } from 'rxjs';

@Component({ selector: 'app-dropdown', template: '' })
class DropdownComponent { }

describe('PlacesSearchComponent', () => {
  let component: PlacesSearchComponent;
  let fixture: ComponentFixture<PlacesSearchComponent>;
  let dom: any;
  let config: any;
  let placesDataService: PlacesDataService;
  let commonService: CommonService;
  let placesFiltersService: PlacesFiltersService;
  const autocompleteData = {
    'data': {
      'places': [
        {
          'geometry': {
            'coordinates': [
              [
                [
                  -84.396632,
                  33.792969
                ],
                [
                  -84.396632,
                  33.79302
                ],
              ]
            ],
            'type': 'Polygon'
          },
          'properties': {
            'safegraph_place_id': 'sg:896d2387b7db405b83c6de4401ec03b6',
            'parent_safegraph_place_id': 'sg:9245e200a8a345619ec0188a0e9cff2a',
            'safegraph_brand_ids': '',
            'location_name': 'Atlantic Grill at Atlantic Station',
            'brands': '',
            'top_category': 'Restaurants and Other Eating Places',
            'sub_category': 'Full-Service Restaurants',
            'naics_code': '722511',
            'latitude': '33.793296',
            'longitude': '-84.396821',
            'street_address': '264 nineteenth street north west',
            'city': 'atlanta',
            'state': 'ga',
            'zip_code': '30363',
            'open_hours': {
              'Mon': [
                [
                  '11:00',
                  '22:00'
                ]
              ],
              'Tue': [
                [
                  '11:00',
                  '22:00'
                ]
              ],
              'Wed': [
                [
                  '11:00',
                  '22:00'
                ]
              ],
              'Thu': [
                [
                  '11:00',
                  '22:00'
                ]
              ],
              'Fri': [
                [
                  '11:00',
                  '24:00'
                ]
              ],
              'Sat': [
                [
                  '11:00',
                  '24:00'
                ]
              ],
              'Sun': [
                [
                  '12:00',
                  '22:00'
                ]
              ]
            },
            'phone_number': '',
            'created_datetime': '2019-02-28T00:00:00'
          },
          '_id': '5c88da0b1f69bd8597f47a23',
          'type': 'Feature'
        },
        {
          'geometry': {
            'coordinates': [
              [
                [
                  -75.979213,
                  36.858448
                ],
                [
                  -75.979237,
                  36.858541
                ],
                [
                  -75.979238,
                  36.858544
                ],
                [
                  -75.979254,
                  36.85854
                ],
                [
                  -75.979527,
                  36.858494
                ],
                [
                  -75.97955,
                  36.85849
                ],
                [
                  -75.979583,
                  36.858484
                ],
                [
                  -75.979557,
                  36.85839
                ],
                [
                  -75.979213,
                  36.858448
                ]
              ]
            ],
            'type': 'Polygon'
          },
          'properties': {
            'safegraph_place_id': 'sg:74b97c702caf488b96fd5874ce0860c3',
            'parent_safegraph_place_id': '',
            'safegraph_brand_ids': '',
            'location_name': 'The Atlantic',
            'brands': '',
            'top_category': 'Restaurants and Other Eating Places',
            'sub_category': 'Full-Service Restaurants',
            'naics_code': '722511',
            'latitude': '36.858474',
            'longitude': '-75.979257',
            'street_address': '3004 pacific avenue',
            'city': 'virginia beach',
            'state': 'va',
            'zip_code': '23451',
            'open_hours': {
              'Mon': [
                [
                  '11:00',
                  '24:00'
                ]
              ],
              'Tue': [
                [
                  '11:00',
                  '24:00'
                ]
              ],
              'Wed': [
                [
                  '11:00',
                  '24:00'
                ]
              ],
              'Thu': [
                [
                  '11:00',
                  '24:00'
                ]
              ],
              'Fri': [
                [
                  '11:00',
                  '24:00'
                ]
              ],
              'Sat': [
                [
                  '11:00',
                  '24:00'
                ]
              ],
              'Sun': [
                [
                  '11:00',
                  '24:00'
                ]
              ]
            },
            'phone_number': '17574222122',
            'created_datetime': '2019-02-28T00:00:00'
          },
          '_id': '5c88dbd01f69bd85971976c2',
          'type': 'Feature'
        },
      ]
    }
  };

  beforeEach(waitForAsync(() => {

    config = jasmine.createSpyObj('AppConfigService', [
      'load',
      'API_ENDPOINT'
    ]);

    placesDataService = jasmine.createSpyObj('PlacesDataService', [
      'setPlacesCategory',
      'setSelectedPlaceSetName',
      'getPlacesCategory',
      'setSelectedCategoryName',
      'getSelectedCategoryName',
      'getHighlightedPosition',
      'setHighlightedPosition'
    ]);

    commonService = jasmine.createSpyObj('CommonService', [
      'getDropdownState',
      'setDropdownState'
    ]);

    placesFiltersService = jasmine.createSpyObj('placesFiltersService', [
      'getPOISuggestion'
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
        MatCardModule,
        MatListModule,
        OverlayModule,
        FlexLayoutModule,
        MatRadioModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        MatMenuModule,
        MatButtonModule,
        MatIconModule
      ],
      declarations: [
        PlacesSearchComponent,
        DropdownComponent,
        TruncatePipe,
       ],
       providers: [
        { provide: AppConfig, useValue: config },
        { provide: PlacesDataService, useValue: placesDataService },
        { provide: CommonService, useValue: commonService },
        { provide: PlacesFiltersService, useValue: PlacesFiltersService}
       ],
       schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlacesSearchComponent);
    component = fixture.componentInstance;
    (<jasmine.Spy>placesFiltersService.getPOISuggestion).and.returnValue(of(autocompleteData));
    fixture.detectChanges();
    dom = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid when empty', () => {
    expect(component.searchForm.valid).toBeFalsy();
  });


  it('Passing a value to search place text field', async() => {
    fixture.detectChanges();
    const textValue = fixture.nativeElement.querySelector('#placeSearch') as HTMLInputElement;
    textValue.click();
    textValue.value = 'mcd';
    fixture.detectChanges();
    // component.autocompletePlace(textValue.value);
    // component.dropdownStageChange(true);
    component.autocompletePlaces = autocompleteData.data.places;
    fixture.detectChanges();
  });

  it('select the autocomplete places', async() => {
    fixture.detectChanges();
    // component.dropdownStageChange(true);
    component.autocompletePlaces = autocompleteData.data.places;
    component.selectPlace(component.autocompletePlaces[0]);
    fixture.detectChanges();
  });

  it('onSubmit of the selected place', async() => {
    fixture.detectChanges();
    component.selectPlace(autocompleteData.data.places[0]);
    const searchForm: any  = component.searchForm.controls['place'];
    searchForm.value = 'mcd';
    component.onSubmit(component.searchForm);
  });


});
