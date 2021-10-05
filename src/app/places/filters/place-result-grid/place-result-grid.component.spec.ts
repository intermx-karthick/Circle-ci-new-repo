import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Input, NO_ERRORS_SCHEMA, SimpleChange, DebugElement } from '@angular/core';
import { PlaceResultGridComponent } from './place-result-grid.component';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('PlaceResultGridComponent', () => {
  let component: PlaceResultGridComponent;
  let fixture: ComponentFixture<PlaceResultGridComponent>;

  const placeResults = [
    {
      count: 29,
      industry: 'Full-Service Restaurants',
      place_name: 'Atlanta Bread',
      place_type: 'Restaurants and Other Eating Places',
      selected: true
    }
  ];

  const sortables = [
    {field_name: 'Place Name', key: 'place_name'},
  ];

  const paging = [
    {
      page: 0,
      size: 50,
      total: 0
    }
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        RouterTestingModule,
        BrowserAnimationsModule
      ],
      declarations: [
        PlaceResultGridComponent,
        TruncatePipe
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaceResultGridComponent);
    component = fixture.componentInstance;
    component.sortables = sortables;
    component.placeResults = placeResults;
    component.paging = paging;
    fixture.detectChanges();
  });



  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`it should call 'setActivePlace' method`, () => {
    fixture.detectChanges();
    spyOn(component, 'setActivePlace');
    const setActivePlaceLink = fixture.nativeElement.querySelector('.test-set-active-place-link') as HTMLLinkElement;
    setActivePlaceLink.click();
    fixture.detectChanges();
    expect(component.setActivePlace).toHaveBeenCalledWith('Atlanta Bread');
  });

  it(`it should call 'onSortables' method`, () => {
    spyOn(component, 'onSortables');
    const event = { value: 'place_name' };
    const el = fixture.debugElement.query(By.css('.test-place-select'));
    el.triggerEventHandler('selectionChange', event);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.onSortables).toHaveBeenCalledWith({value: 'place_name'});
    });
  });

  it(`it should call 'loadMore' method`, () => {
    spyOn(component, 'loadMore').and.callFake(() => {});
    const el = fixture.debugElement.query(By.css('.test-result-list-scroll'));
    el.triggerEventHandler('scrolled', null);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.loadMore).toHaveBeenCalled();
    });
  });

  it(`it should call 'resizeContainerHeight' method`, () => {
    component.contentHeight = 292;
    fixture.detectChanges();
    spyOn(component, 'resizeContainerHeight');
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    expect(component.resizeContainerHeight).toHaveBeenCalled();
  });

  it(`it should call 'onToggle' method`, () => {
    spyOn(component, 'onToggle').and.callFake(() => {});
    const el = fixture.debugElement.query(By.css('.test-places-checkbox'));
    el.triggerEventHandler('change', null);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.onToggle).toHaveBeenCalled();
    });
  });

});
