import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';

import { PlacesTabularViewComponent } from './places-tabular-view.component';
import { InfiniteScrollModule} from 'ngx-infinite-scroll';
import { LoaderService } from '@shared/services/loader.service';
import { PlacesFiltersService } from '../places-filters.service';
import { ConvertPipe } from '@shared/pipes/convert.pipe';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('PlacesTabularViewComponent', () => {
  let component: PlacesTabularViewComponent;
  let fixture: ComponentFixture<PlacesTabularViewComponent>;
  let loaderService: LoaderService;
  let placeFilterService: PlacesFiltersService;
  let matSort: any;
  let matTableDataSource: any;

  const placeData = [{
    'count': 62,
    'industry': 'Elementary and Secondary Schools',
    'place_name': 'Atlanta City School District',
    'place_type': 'Elementary and Secondary Schools',
    'selected': true
  },
  {
    'count': 32,
    'industry': 'Other Individual and Family Services',
    'place_name': 'Atlanta City Government',
    'place_type': 'Individual and Family Services',
    'selected': true
  }];


  beforeEach(waitForAsync(() => {
    loaderService = jasmine.createSpyObj('LoaderService', [
      'display',
    ]);
    placeFilterService = jasmine.createSpyObj('PlacesFiltersService', [
      'setFilterLevel',
    ]);
    matSort = jasmine.createSpyObj('MatSort', [
      'sort'
    ]);
    matTableDataSource = jasmine.createSpyObj('MatTableDataSource', [
      'dataSource'
  ]);

    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        RouterTestingModule.withRoutes([]),
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatDialogModule,
        MatListModule,
        MatInputModule,
        MatTableModule,
        MatSortModule,
        MatCheckboxModule,
        InfiniteScrollModule
      ],
      declarations: [
        PlacesTabularViewComponent,
        ConvertPipe,
        TruncatePipe
      ],
      providers: [
        { provide: PlacesFiltersService, useValue: placeFilterService },
        { provide: LoaderService, useValue: loaderService },
        { provide: MatSort, useValue: matSort },
        { provide: MatTableDataSource, useValue: matTableDataSource }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {

    const sortables = [
      {field_name: 'Place Name', key: 'place_name'},
      {field_name: 'Place Type', key: 'place_type'},
      {field_name: 'Industry', key: 'industry'},
      {field_name: 'Number of Places', key: 'count'}
    ];

    fixture = TestBed.createComponent(PlacesTabularViewComponent);
    component = fixture.componentInstance;
    component.places = placeData;
    component.sortables = sortables;
    component.placesDataSource.data = component.places;
    fixture.detectChanges();
  });

  /* it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`should able to get 'Customize Columns'`, () => {
    fixture.detectChanges();
    const testCustomize = fixture.nativeElement.querySelector('#customize-column') as HTMLButtonElement;
    expect(testCustomize.innerHTML).toBeTruthy();
  });

  it(`should able to check 'Customize column action'`, () => {
    fixture.detectChanges();
    spyOn(component, 'customizeColumn');
    const testCustomize = fixture.nativeElement.querySelector('#customize-column') as HTMLButtonElement;
    testCustomize.click();
    expect(component.customizeColumn).toHaveBeenCalled();
    fixture.detectChanges();
  });

  it(`should be able to go to details page`, () => {
    spyOn(component, 'setActivePlace');
    const placeNames = fixture.debugElement.queryAll(By.css('.test-clsPlaceNameLink'));
    placeNames[0].nativeNode.click();
    fixture.detectChanges();
    expect(component.setActivePlace).toHaveBeenCalled();
  });

  it(`should be able to sort place name`, () => {
    spyOn(component, 'onSortting');
    const placeNameHeader = fixture.debugElement.queryAll(By.css('.mat-header-cell'));
    placeNameHeader[1].nativeNode.click();
    expect(component.onSortting).toHaveBeenCalled();
    fixture.detectChanges();
  });

   it(`should be able to unselect all places`, () => {
    spyOn(component, 'selectAll');
    const selectCheckbox = fixture.debugElement.queryAll(By.css('.mat-checkbox-inner-container'));
    selectCheckbox[0].nativeNode.click();
    fixture.detectChanges();
    expect(component.selectAll).toHaveBeenCalled();
  });

  it(`should be able to call 'loadMore' method`, () => {
    spyOn(component, 'loadMore');
    const el = fixture.debugElement.query(By.css('.test-result-tablist-scroll'));
    el.triggerEventHandler('scrolled', null);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.loadMore).toHaveBeenCalled();
    });
  });
 */
});
