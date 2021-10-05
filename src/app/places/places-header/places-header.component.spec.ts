import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { PlacesHeaderComponent } from './places-header.component';
import { PlacesFiltersService } from '../filters/places-filters.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('PlacesHeaderComponent', () => {
  let component: PlacesHeaderComponent;
  let fixture: ComponentFixture<PlacesHeaderComponent>;
  let placesFiltersService: PlacesFiltersService;

  const tabData = {
    'open': true,
    'tab': 'findAndDefine'
  };

  beforeEach(waitForAsync(() => {

    placesFiltersService = jasmine.createSpyObj('placesFiltersService', [
      'getFilterSidenav',
      'setFilterSidenav',
      'setFilterSidenavOut'
    ]);

    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatIconModule
      ],
      declarations: [ PlacesHeaderComponent ],
      providers: [
        { provide: PlacesFiltersService, useValue: placesFiltersService}
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlacesHeaderComponent);
    component = fixture.componentInstance;

    (<jasmine.Spy>placesFiltersService.getFilterSidenav).and.returnValue(of(tabData));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open tabs', () => {
    spyOn(component, 'openFilterSiderbar');
    const tab = fixture.debugElement.queryAll(By.css('.places-filter-btn'));
    tab[0].nativeNode.click();
    expect(component.openFilterSiderbar).toHaveBeenCalled();
    fixture.detectChanges();
  });
});
