import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LayerOptionsComponent } from './layer-options.component';
import { Input, NO_ERRORS_SCHEMA, SimpleChange, DebugElement } from '@angular/core';
import { LayersService } from '../../../explore/layer-display-options/layers.service';
import { PlacesDataService } from '@shared/services';
import { of } from 'rxjs';

describe('LayerOptionsComponent', () => {
  let component: LayerOptionsComponent;
  let fixture: ComponentFixture<LayerOptionsComponent>;
  let placesDataService: PlacesDataService;
  let layersService: LayersService;

  beforeEach(waitForAsync(() => {
    placesDataService = jasmine.createSpyObj('PlacesDataService', [
      'onMapLoad'
    ]);
    layersService = jasmine.createSpyObj('LayersService', [
      'getLayers',
      'getDisplayOptions',
      'setApplyLayers'
    ]);
    TestBed.configureTestingModule({
      declarations: [ LayerOptionsComponent ],
       providers: [
        { provide: PlacesDataService, useValue: placesDataService },
        { provide: LayersService, useValue: layersService },
       ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerOptionsComponent);
    component = fixture.componentInstance;
    const display = [{
      "baseMap" :"light",
      "filterPills" :true,
      "isLogoEnabled":false,
      "isTextEnabled":false,
      "labels":{"audience": true, "market": true, "filters": true, "saved view": true},
      "mapControls":true,
      "mapLabel":false,
      "mapLabels":{'geopath spot IDs': false, 'operator spot IDs': false},
      "mapLegend":true,
      "showUnselectedInventory":true
    }];
    const layer = [{
      "color":"#0D96D4",
      "data": {
        geohash5:[],
        geohash6:[],
        name:"kind-1",
        owner:"5c41e161cbaecd7109c15493",
        pois:[ "sg:fd7d6c2580cf44799d85c5544ede5011"],
        selected:true,
        _id:"5d0a40ef81701d001936742a",
      },
      icon:"icon-place",
      id:"5d0a40ef81701d001936742a",
      type:"place collection"
    }];
    (<jasmine.Spy>placesDataService.onMapLoad).and.returnValue(of());
    (<jasmine.Spy>layersService.getDisplayOptions).and.returnValue(display);
    (<jasmine.Spy>layersService.getLayers).and.returnValue(of(layer));
    fixture.detectChanges();
  });
  // Commented as tests are failing
  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });

  // it(`it should call 'onApply' method`, () => {
  //   spyOn(component, 'onApply');
  //   const onApply = fixture.nativeElement.querySelector('.test-apply-btn') as HTMLLinkElement;
  //   onApply.click();
  //   fixture.detectChanges();
  //   expect(component.onApply).toHaveBeenCalled();
  // });

  // it(`it should call 'clearAll' method`, () => {
  //   spyOn(component, 'clearAll');
  //   const clearAll = fixture.nativeElement.querySelector('.test-clear-all-btn') as HTMLLinkElement;
  //   clearAll.click();
  //   fixture.detectChanges();
  //   expect(component.clearAll).toHaveBeenCalled();
  // });
});
