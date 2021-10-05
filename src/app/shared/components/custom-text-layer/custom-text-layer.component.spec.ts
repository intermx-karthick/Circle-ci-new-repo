import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CustomTextLayerComponent } from './custom-text-layer.component';
import { LayersService } from 'app/explore/layer-display-options/layers.service';
import { PlacesFiltersService } from 'app/places/filters/places-filters.service';
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { of } from 'rxjs';
import { PopulationDataService } from '@shared/services/population-data.service';

describe('CustomTextLayerComponent', () => {
  let component: CustomTextLayerComponent;
  let fixture: ComponentFixture<CustomTextLayerComponent>;
  let layersService: LayersService;
  let placesFiltersService: PlacesFiltersService;
  let populationDataService: PopulationDataService;

  beforeEach(waitForAsync(() => {
    layersService = jasmine.createSpyObj('LayersService', [
      'getlayersSession',
      'saveLayersSession',
      'setDisplayOptions',
      'setRemoveLogoAndText',
      'getApplyLayers'
    ]);
    placesFiltersService = jasmine.createSpyObj('PlacesFiltersService', [
      'setFilterSidenav'
    ]);
    populationDataService = jasmine.createSpyObj('PopulationDataService', [
      'setFilterSideNav'
    ]);
    TestBed.configureTestingModule({
      providers: [
        { provide: LayersService, useValue: layersService },
        { provide: PlacesFiltersService, useValue: placesFiltersService },
        { provide: PopulationDataService, useValue: populationDataService }
      ],
      declarations: [ CustomTextLayerComponent ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    (<jasmine.Spy>layersService.getApplyLayers).and.returnValue(of(false));
    (<jasmine.Spy>placesFiltersService.setFilterSidenav).and.returnValue(true);
    (<jasmine.Spy>populationDataService.setFilterSideNav).and.returnValue(true);
    fixture = TestBed.createComponent(CustomTextLayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** Hide this now code rewrited */
 /* it('should create', () => {
    expect(component).toBeTruthy();
  });
  it(`it should call 'editLogo' method`, () => {
    spyOn(component, 'loadText');
    component.loadText();
    fixture.detectChanges();
    expect(component.loadText).toHaveBeenCalled();
  });

  it(`it should call 'onDragging' method`, () => {
    spyOn(component, 'onDragging');
    component.onDragging('');
    fixture.detectChanges();
    expect(component.onDragging).toHaveBeenCalled();
  });

  it(`it should call 'onDragStop' method`, () => {
    spyOn(component, 'onDragStop');
    component.onDragStop({x:10,y:10});
    fixture.detectChanges();
    expect(component.onDragStop).toHaveBeenCalled();
  });

  it(`it should call 'onResizing' method`, () => {
    spyOn(component, 'onResizing');
    component.onResizing('');
    fixture.detectChanges();
    expect(component.onResizing).toHaveBeenCalled();
  });

  it(`it should call 'onResizeStop' method`, () => {
    spyOn(component, 'onResizeStop');
    component.onResizeStop({size:{width:10,height:10}});
    fixture.detectChanges();
    expect(component.onResizeStop).toHaveBeenCalled();
  });

  it(`it should call 'removeText' method`, () => {
    spyOn(component, 'removeText');
    component.removeText();
    fixture.detectChanges();
    expect(component.removeText).toHaveBeenCalled();
  });*/

});
