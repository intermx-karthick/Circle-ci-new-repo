import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WeekSelectionComponent } from './week-selection.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {FiltersService} from '../filters.service';
import {of} from 'rxjs';
import { ExploreService } from '@shared/services';
import { CommonService } from '@shared/services';

describe('WeekSelectionComponent', () => {
  let component: WeekSelectionComponent;
  let fixture: ComponentFixture<WeekSelectionComponent>;
  let filterService: FiltersService;
  let exploreService: ExploreService;
  let commonService: CommonService;

  beforeEach(waitForAsync(() => {
    filterService = jasmine.createSpyObj('FiltersService', {
      'setFilter': new Promise(null),
      'clearFilter': new Promise(null),
      'onReset': of({}),
      'getFilters': of({}),
      'getExploreSession': {
        data: {
          period_days: 7,
        },
        selection: {}
      },
    });
    exploreService = jasmine.createSpyObj('ExploreService', {
      'getDurations':  of([]),
    });
    commonService = jasmine.createSpyObj('CommonService', {
      'getUserPreferences': {},
      'onDataVersionChange': of(2021),
    });
    TestBed.configureTestingModule({
      imports: [MatButtonToggleModule],
      declarations: [ WeekSelectionComponent ],
      providers: [
        {provide: FiltersService, useValue: filterService},
        {provide: ExploreService, useValue: exploreService},
        {provide: CommonService, useValue: commonService}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WeekSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
  it('should set value from filter session', () => {
    fixture.detectChanges();
    // value set in the spy definition to be 7
    expect(component.selectedWeek).toBe('7');
  });
  it('should apply the filter', () => {
    component.selectedWeek = '7';
    component.onSubmit();
    fixture.detectChanges();
    expect(filterService.setFilter).toHaveBeenCalledWith('period_days', 7);
  });
  it('should clear the filter', () => {
    component.clear();
    expect(component.selectedWeek).toBe('7');
    expect(filterService.clearFilter).toHaveBeenCalledWith('period_days', true);
  });
});
