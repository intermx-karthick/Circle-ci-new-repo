import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LayerPlaceSetComponent } from './layer-place-set.component';
import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import {SharedFunctionsModule} from '@shared/shared-functions.module';

describe('PlaceSetComponent', () => {
  let component: LayerPlaceSetComponent;
  let fixture: ComponentFixture<LayerPlaceSetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports:[SharedFunctionsModule],
      declarations: [ LayerPlaceSetComponent ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerPlaceSetComponent);
    component = fixture.componentInstance;
    const place = [{
      geohash5:[],
      geohash6:[],
      name :"cancel1",
      owner :"5c41e161cbaecd7109c15493",
      pois : ["sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:c80b9aaa28fb4efa95c0ed7685aa3167", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514"],
      selected :false,
      _id:"5d0a433681701d001936742c"
    }];
    component.filteredPlacePacks = place;
    component.type = 'place collection';
    component.layer = new EventEmitter();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
