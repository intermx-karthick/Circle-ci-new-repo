import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LayerSpecificGeographyComponent } from './layer-specific-geography.component';
import { ExploreService } from '@shared/services';
import { NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {SharedFunctionsModule} from '@shared/shared-functions.module';

describe('LayerSpecificGeographyComponent', () => {
  let component: LayerSpecificGeographyComponent;
  let fixture: ComponentFixture<LayerSpecificGeographyComponent>;
  let exploreService: ExploreService;

  beforeEach(waitForAsync(() => {
    exploreService = jasmine.createSpyObj('ExploreService', [
      'getmarketSearch'
    ]);
    TestBed.configureTestingModule({
      imports: [SharedFunctionsModule],
      declarations: [ LayerSpecificGeographyComponent ],
      providers: [
        { provide: ExploreService, useValue: exploreService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    (<jasmine.Spy>exploreService.getmarketSearch).and.returnValue([]);
    fixture = TestBed.createComponent(LayerSpecificGeographyComponent);
    component = fixture.componentInstance;
    component.selectedLayers = [];
    component.clearLayer = false;
    component.layer = new EventEmitter();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`it should set input value in 'searchGeography'`, () => {
    component.searchGeography.setValue('atlanta');
    expect(component.searchGeography.value).toEqual('atlanta');
  });

  it(`it should call 'moveLayer' method`, () => {
    spyOn(component, 'moveLayer');
    const layer = {
      geohash5:[],
      geohash6:[],
      name :"cancel1",
      owner :"5c41e161cbaecd7109c15493",
      pois : ["sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:c80b9aaa28fb4efa95c0ed7685aa3167", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514"],
      selected :false,
      _id:"5d0a433681701d001936742c"
    }
    component.moveLayer(layer,'place collection',0);
    fixture.detectChanges();
    expect(component.moveLayer).toHaveBeenCalled();
  });

});
