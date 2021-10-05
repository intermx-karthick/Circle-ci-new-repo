import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HerePlacesComponent } from './here-places.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PlacesElasticsearchService } from '../places-elasticsearch.service';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { of } from 'rxjs';
describe('HerePlacesComponent', () => {
  let component: HerePlacesComponent;
  let fixture: ComponentFixture<HerePlacesComponent>;
  let elasticsearch: PlacesElasticsearchService;
  const searchById = {
    'hits': {
      'hits': [
        {
          '_source': {
            'place_name': 'Vibrant Massage',
            'location': {
              'county_id': '25013',
              'county_name': 'Hampden',
              'state_usps': 'MA',
              'state_name': 'Massachusetts',
              'DMA_id': '543',
              'DMA_name': 'Springfield-Holyoke, MA',
              'polygon': {
                'type': 'Polygon',
                'coordinates': [
                  [
                    [
                      -72.479206,
                      42.157215
                    ],
                    [
                      -72.479144,
                      42.157128
                    ],
                    [
                      -72.479118,
                      42.157139
                    ],
                    [
                      -72.479099,
                      42.157113
                    ],
                    [
                      -72.479082,
                      42.157119
                    ],
                    [
                      -72.47907,
                      42.157102
                    ],
                    [
                      -72.47897,
                      42.157141
                    ],
                    [
                      -72.479035,
                      42.157232
                    ],
                    [
                      -72.479094,
                      42.157209
                    ],
                    [
                      -72.479121,
                      42.157247
                    ],
                    [
                      -72.479206,
                      42.157215
                    ]
                  ]
                ]
              },
              'geo_point': 'drkrydqr7',
              'point': {
                'type': 'Point',
                'coordinates': [
                  -72.479052,
                  42.15719
                ]
              }
            },
            'properties': {
              'address': {
                'street_address': '154 east street',
                'city': 'ludlow',
                'state': 'ma',
                'zip_code': '01056'
              },
              'operating_information': {
                'phone_number': '+14136366424',
                'open_hours': {
                  'SUN': [],
                  'MON': [],
                  'TUE': [
                    {
                      'open': '1700',
                      'close': '2030'
                    }
                  ],
                  'WED': [],
                  'THU': [
                    {
                      'open': '1700',
                      'close': '2030'
                    }
                  ],
                  'FRI': [],
                  'SAT': []
                }
              },
              'ids': {
                'safegraph_place_id': 'sg:f16454a1701b4bf28937053add90ef95',
                'parent_safegraph_place_id': ''
              },
              'brands': '',
              'safegraph_brand_ids': '',
              'naics_code': '812199',
              'type': 'Feature',
              'sub_category': 'Other Personal Care Services',
              'top_category': 'Personal Care Services',
              'created_datetime': '2019-04-30T00:00:00',
              'created_user': 'sd-bigquery'
            }
          }
        },
        {
          '_source': {
            'place_name': 'Golf Savings Bank',
            'location': {
              'county_id': '53025',
              'county_name': 'Grant',
              'state_usps': 'WA',
              'state_name': 'Washington',
              'DMA_id': '881',
              'DMA_name': 'Spokane, WA',
              'polygon': {
                'type': 'Polygon',
                'coordinates': [
                  [
                    [
                      -119.283166141124,
                      47.1294479775882
                    ],
                    [
                      -119.283326647162,
                      47.1293895030084
                    ],
                    [
                      -119.283292044532,
                      47.1293455395615
                    ],
                    [
                      -119.283487986968,
                      47.1292741548634
                    ],
                    [
                      -119.283412084426,
                      47.1291777186586
                    ],
                    [
                      -119.283055635952,
                      47.1293075782202
                    ],
                    [
                      -119.283166141124,
                      47.1294479775882
                    ]
                  ]
                ]
              },
              'geo_point': 'c27hjess5',
              'point': {
                'type': 'Point',
                'coordinates': [
                  -119.283207359703,
                  47.1293265588908
                ]
              }
            },
            'properties': {
              'address': {
                'street_address': '406 west broadway avenue',
                'city': 'moses lake',
                'state': 'wa',
                'zip_code': '98837'
              },
              'operating_information': {
                'phone_number': '+15097663620'
              },
              'ids': {
                'safegraph_place_id': 'sg:25f235b9f5ec475cae7dc7dc049b370f',
                'parent_safegraph_place_id': ''
              },
              'brands': '',
              'safegraph_brand_ids': '',
              'naics_code': '522110',
              'type': 'Feature',
              'sub_category': 'Commercial Banking',
              'top_category': 'Depository Credit Intermediation',
              'created_datetime': '2019-04-30T00:00:00',
              'created_user': 'sd-bigquery'
            }
          }
        }
      ]
    }
  };
  const formdata = [
    {
      'location_name': 'Vibrant Massage',
      'location': {
        'county_id': '25013',
        'county_name': 'Hampden',
        'state_usps': 'MA',
        'state_name': 'Massachusetts',
        'DMA_id': '543',
        'DMA_name': 'Springfield-Holyoke, MA',
        'polygon': {
          'type': 'Polygon',
          'coordinates': [
            [
              [
                -72.479206,
                42.157215
              ],
              [
                -72.479144,
                42.157128
              ],
              [
                -72.479118,
                42.157139
              ],
              [
                -72.479099,
                42.157113
              ],
              [
                -72.479082,
                42.157119
              ],
              [
                -72.47907,
                42.157102
              ],
              [
                -72.47897,
                42.157141
              ],
              [
                -72.479035,
                42.157232
              ],
              [
                -72.479094,
                42.157209
              ],
              [
                -72.479121,
                42.157247
              ],
              [
                -72.479206,
                42.157215
              ]
            ]
          ]
        },
        'geo_point': 'drkrydqr7',
        'point': {
          'type': 'Point',
          'coordinates': [
            -72.479052,
            42.15719
          ]
        }
      },
      'address': {
        'street_address': '154 east street',
        'city': 'ludlow',
        'state': 'ma',
        'zip_code': '01056'
      },
      'operating_information': {
        'phone_number': '+14136366424',
        'open_hours': {
          'SUN': [],
          'MON': [],
          'TUE': [
            {
              'open': '1700',
              'close': '2030'
            }
          ],
          'WED': [],
          'THU': [
            {
              'open': '1700',
              'close': '2030'
            }
          ],
          'FRI': [],
          'SAT': []
        }
      },
      'ids': {
        'safegraph_place_id': 'sg:f16454a1701b4bf28937053add90ef95',
        'parent_safegraph_place_id': ''
      },
      'brands': '',
      'safegraph_brand_ids': '',
      'naics_code': '812199',
      'type': 'Feature',
      'sub_category': 'Other Personal Care Services',
      'top_category': 'Personal Care Services',
      'created_datetime': '2019-04-30T00:00:00',
      'created_user': 'sd-bigquery'
    },
    {
      'location_name': 'Golf Savings Bank',
      'location': {
        'county_id': '53025',
        'county_name': 'Grant',
        'state_usps': 'WA',
        'state_name': 'Washington',
        'DMA_id': '881',
        'DMA_name': 'Spokane, WA',
        'polygon': {
          'type': 'Polygon',
          'coordinates': [
            [
              [
                -119.283166141124,
                47.1294479775882
              ],
              [
                -119.283326647162,
                47.1293895030084
              ],
              [
                -119.283292044532,
                47.1293455395615
              ],
              [
                -119.283487986968,
                47.1292741548634
              ],
              [
                -119.283412084426,
                47.1291777186586
              ],
              [
                -119.283055635952,
                47.1293075782202
              ],
              [
                -119.283166141124,
                47.1294479775882
              ]
            ]
          ]
        },
        'geo_point': 'c27hjess5',
        'point': {
          'type': 'Point',
          'coordinates': [
            -119.283207359703,
            47.1293265588908
          ]
        }
      },
      'address': {
        'street_address': '406 west broadway avenue',
        'city': 'moses lake',
        'state': 'wa',
        'zip_code': '98837'
      },
      'operating_information': {
        'phone_number': '+15097663620'
      },
      'ids': {
        'safegraph_place_id': 'sg:25f235b9f5ec475cae7dc7dc049b370f',
        'parent_safegraph_place_id': ''
      },
      'brands': '',
      'safegraph_brand_ids': '',
      'naics_code': '522110',
      'type': 'Feature',
      'sub_category': 'Commercial Banking',
      'top_category': 'Depository Credit Intermediation',
      'created_datetime': '2019-04-30T00:00:00',
      'created_user': 'sd-bigquery'
    }
  ];
  beforeEach(waitForAsync(() => {
    elasticsearch = jasmine.createSpyObj('PlacesElasticsearchService', [
      'searchByHereId',
      'formatPlacesData'
    ]);
    (<jasmine.Spy>elasticsearch.filterPlaces).and.returnValue(of(searchById));
    (<jasmine.Spy>elasticsearch.formatPlacesData).and.returnValue(formdata);
    TestBed.configureTestingModule({
      declarations: [HerePlacesComponent],
      imports: [
        BrowserAnimationsModule,
        MatCheckboxModule,
        MatCardModule,
        FlexLayoutModule,
        MatButtonModule
      ],
      providers: [
        { provide: PlacesElasticsearchService, useValue: elasticsearch }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HerePlacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
  // it('should render `here place list! & able to click confirm`', () => {
  //   const params = {
  //     type: 'safegraph_place_id',
  //     searchId: '370'
  //   };
  //   component.searchParams = params;
  //   component.ngOnChanges({
  //     searchParams: new SimpleChange(null, component.searchParams, null)
  //   });
  //   fixture.detectChanges();
  //   expect(component.currentSearchType).toBe('Safegraph ID');
  //   expect(component.searchedPlaces.length).toBe(2);
  //   fixture.detectChanges();

  //   // Checking confirm checkboc click
  //   const onConfirm = fixture.nativeElement.querySelectorAll('mat-card button') as HTMLButtonElement;
  //   onConfirm[0].click();
  //   fixture.detectChanges();
  //   expect(component.selectedPlace.location_name).toBe('Vibrant Massage');
  //   fixture.detectChanges();
  // });
});
