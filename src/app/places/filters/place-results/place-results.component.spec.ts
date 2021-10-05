import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { ConvertPipe } from '@shared/pipes/convert.pipe';
import { PlaceResultsComponent } from './place-results.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Input, NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PlacesFiltersService } from '../places-filters.service';
import { PlacesDataService } from '@shared/services/places-data.service';
import { AppConfig } from '../../../app-config.service';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SavePlaceSetsDialogComponent } from '@shared/components/save-place-sets-dialog/save-place-sets-dialog.component';



describe('PlaceResultsComponent', () => {
  let component: PlaceResultsComponent;
  let fixture: ComponentFixture<PlaceResultsComponent>;
  let placeFilterService: PlacesFiltersService;
  const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of({}), close: null });
  let dialogSpy: jasmine.Spy;
  let dialogRef;

  const sortables = [
    {field_name: 'Place Name', key: 'place_name'}
  ];

  const summary = {
    avg_weekly_traffic: 0,
    avg_weekly_unique_visits: 0,
    number_of_places: 2427
  };

  const routes = {
    'placeResultsGrid': 'placeResultsGrid',
    'placeResultsList': 'placeResultsList',
    'placeDetailsGrid': 'placeDetailsGrid',
    'placeDetailsList': 'placeDetailsList',
  };

  const reqParams = {
    page: 0,
    placeNameList: ['Atlanta Bread Company'],
    size: 100,
    place: 'Atlanta'
  };
  const res = [{
      location_name: 'Atlanta Bread Company',
      longitude: '-84.544345',
      naics_code: '',
      parent_safegraph_place_id: 'sg:67c8996a0235454c92dfc0a61c1eb641',
      phone_number: '',
      safegraph_brand_ids: '',
      safegraph_place_id: 'sg:5432212100a342a1abbc52d0601b6f5a',
      selected: true,
      state: 'ga',
      street_address: '120 142 woodstock square avenue',
      sub_category: '',
      top_category: '',
      zip_code: '30189'
    }];

    const TEST_DIRECTIVES = [
      SavePlaceSetsDialogComponent
    ];

  beforeEach(waitForAsync(() => {
    placeFilterService = jasmine.createSpyObj('PlacesFiltersService', [
      'setFilterLevel',
      'savePlacesSession',
      'getPlacesSession'
    ]);
    dialogRef = jasmine.createSpyObj('MatDialogRef', [
      'data'
    ]);
    TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        RouterTestingModule,
        MatMenuModule,
        HttpClientModule,
        HttpClientTestingModule,
        MatDialogModule,
        BrowserAnimationsModule

      ],

      declarations: [
        PlaceResultsComponent,
        TruncatePipe,
        ConvertPipe,
        SavePlaceSetsDialogComponent
       ],
       providers: [
        { provide: PlacesFiltersService, useValue: placeFilterService },
        { provide: MatDialogRef, useValue: dialogRef },
        PlacesDataService,
        AppConfig
       ],
       schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaceResultsComponent);
    component = fixture.componentInstance;
    component.sortables = sortables;
    component.summary = summary;
    dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj);
    const filterData = {
      'mapPosition': {
        'type': 'MultiPolygon',
        'coordinates': [
          [
            [
              [
                -23.126167724655488,
                56.60829704983004
              ]
            ]
          ]
        ]
      },
      'filterLevelState': [
        {
          'filterLevel': 1,
          'searchHide': false,
          'placeResultExpand': false
        },
        {
          'filterLevel': 1,
          'searchHide': false,
          'placeResultExpand': false
        }
      ],
      'filters': {
        'place': 'atlanta',
        'summaryId': '5ca60d1fb4142400190f45c2'
      },
      'placeDetail': {
        'placeName': 'Atlanta Bread Company',
        'route': 'placeDetailsList'
      }
    };


    const sort = {
      'sort_by': 'count',
      'order_by': 1
    };


    component.currentSort = sort;
    component.filterData = filterData;
    component.reqParams.place = 'Atlanta';
    component.routes.placeDetailsList = routes.placeDetailsList;
    (<jasmine.Spy>placeFilterService.getPlacesSession).and.returnValue(filterData);

    fixture.detectChanges();
  });

  /* it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`it should call 'setActiveView' method case-1`, () => {
    component.setActiveView('placeResultsGrid');
    fixture.detectChanges();
  });

  it(`it should call 'setActiveView' method case-2`, () => {
    component.setActiveView('placeDetailsList');
    fixture.detectChanges();
  });

  it(`it should call 'setViewDetail' method with viewName`, () => {
    component.setViewDetail('placeDetailsGrid');
    fixture.detectChanges();
  });

  it(`it should call 'openDetails' with place name`, () => {
    component.openDetails('Atlanta');
    fixture.detectChanges();
  });

  it(`it should call 'onDetailsPaging' on paging`, () => {
    component.onDetailsPaging(1);
    fixture.detectChanges();
  });

  it(`it should call 'onPagination' on paging`, () => {
    component.onPagination(1);
    fixture.detectChanges();
  });

  it(`it should call 'onSorting' on paging`, () => {
    component.onSorting(component.clickOnCard);
    fixture.detectChanges();
  });

  it(`it should call 'onDetailsSorting' on sorting detail data case-1`, () => {
    const detailSort = {
      'sort_by': 'city',
      'order_by': 1
    };
    component.selectedTab = 0;
    component.onDetailsSorting(detailSort);
    fixture.detectChanges();
  });

  it(`it should call 'onDetailsSorting' on sorting detail data case-2`, () => {
    const detailSort = {
      'sort_by': 'city',
      'order_by': 1
    };
    component.selectedTab = 1;
    component.onDetailsSorting(detailSort);
    fixture.detectChanges();
  });

  it(`it should call 'onOpenSavePlaseSet' method case-1`, () => {
    component.activeRoute = component.routes.placeResultsGrid;
    component.onOpenSavePlaseSet();
    fixture.detectChanges();
    expect(dialogSpy).toHaveBeenCalled();
  });

  it(`it should call 'onOpenSavePlaseSet' method case-2`, () => {
    component.activeRoute = component.routes.placeResultsList;
    component.onOpenSavePlaseSet();
    fixture.detectChanges();
    expect(dialogSpy).toHaveBeenCalled();
  });

  it(`it should call 'onOpenSavePlaseSet' method case-3`, () => {
    component.activeRoute = component.routes.placeDetailsGrid;
    component.onOpenSavePlaseSet();
    fixture.detectChanges();
    expect(dialogSpy).toHaveBeenCalled();
  });

  it(`it should call 'onOpenSavePlaseSet' method case-4`, () => {
    component.activeRoute = component.routes.placeDetailsList;
    component.onOpenSavePlaseSet();
    fixture.detectChanges();
    expect(dialogSpy).toHaveBeenCalled();
  });

  it(`it should call 'onOpenSaveToExistingPlaseSet' method case-1`, () => {
    component.activeRoute = component.routes.placeResultsGrid;
    component.onOpenSaveToExistingPlaseSet();
    fixture.detectChanges();
    expect(dialogSpy).toHaveBeenCalled();
  });

  it(`it should call 'onOpenSaveToExistingPlaseSet' method case-2`, () => {
    component.activeRoute = component.routes.placeResultsList;
    component.onOpenSaveToExistingPlaseSet();
    fixture.detectChanges();
    expect(dialogSpy).toHaveBeenCalled();
  });

  it(`it should call 'onOpenSaveToExistingPlaseSet' method case-2`, () => {
    component.activeRoute = component.routes.placeDetailsGrid;
    component.onOpenSaveToExistingPlaseSet();
    fixture.detectChanges();
    expect(dialogSpy).toHaveBeenCalled();
  });

  it(`it should call 'onOpenSaveToExistingPlaseSet' method case-2`, () => {
    component.activeRoute = component.routes.placeDetailsList;
    component.onOpenSaveToExistingPlaseSet();
    fixture.detectChanges();
    expect(dialogSpy).toHaveBeenCalled();
  }); */

});
