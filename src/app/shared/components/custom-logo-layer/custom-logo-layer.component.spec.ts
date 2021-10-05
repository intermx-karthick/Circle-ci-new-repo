import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CustomLogoLayerComponent } from './custom-logo-layer.component';
import { LayersService } from 'app/explore/layer-display-options/layers.service';
import { PlacesFiltersService } from 'app/places/filters/places-filters.service';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PopulationDataService } from '@shared/services/population-data.service';

describe('CustomLogoLayerComponent', () => {
  let component: CustomLogoLayerComponent;
  let fixture: ComponentFixture<CustomLogoLayerComponent>;
  let layersService: LayersService;
  let placesFiltersService: PlacesFiltersService;
  let populationDataService: PopulationDataService;

  beforeEach(waitForAsync(() => {
    layersService = jasmine.createSpyObj('LayersService', [
      'getApplyLayers',
      'getlayersSession',
      'saveLayersSession',
      'setDisplayOptions',
      'setRemoveLogoAndText',

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
      declarations: [ CustomLogoLayerComponent ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    (<jasmine.Spy>placesFiltersService.setFilterSidenav).and.returnValue(true);
    (<jasmine.Spy>populationDataService.setFilterSideNav).and.returnValue(true);
    (<jasmine.Spy>layersService.getApplyLayers).and.returnValue(of(false));
    (<jasmine.Spy>layersService.getlayersSession).and.returnValue(of(true));
    fixture = TestBed.createComponent(CustomLogoLayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  /** Hide this now code rewrited */
  /*it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`it should call 'editLogo' method`, () => {
    spyOn(component, 'editLogo');
    component.editLogo();
    fixture.detectChanges();
    expect(component.editLogo).toHaveBeenCalled();
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

  it(`it should call 'removeLogo' method`, () => {
    spyOn(component, 'removeLogo');
    component.removeLogo();
    fixture.detectChanges();
    expect(component.removeLogo).toHaveBeenCalled();
  });*/

});
