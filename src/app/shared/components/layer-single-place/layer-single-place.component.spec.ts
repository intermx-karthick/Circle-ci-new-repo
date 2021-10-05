import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LayerSinglePlaceComponent } from './layer-single-place.component';
import {CommonService} from '@shared/services/common.service';
import {PlacesFiltersService} from '../../../places/filters/places-filters.service';
import {FormControl} from '@angular/forms';
import { NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {SharedFunctionsModule} from '@shared/shared-functions.module';
import { of } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { fakeAsync, tick } from '@angular/core/testing';

describe('LayerSinglePlaceComponent', () => {

  let component: LayerSinglePlaceComponent;
  let fixture: ComponentFixture<LayerSinglePlaceComponent>;
  let commonService: CommonService;
  let placesFiltersService: PlacesFiltersService;

  beforeEach(waitForAsync(() => {
    commonService = jasmine.createSpyObj('CommonService', [
      'getMapBoundingBox'
    ]);
    placesFiltersService = jasmine.createSpyObj('PlacesFiltersService', [
      'getPOISuggestion'
    ]);
    TestBed.configureTestingModule({
      imports:[
        SharedFunctionsModule,
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [ LayerSinglePlaceComponent ],
      providers: [
        { provide: CommonService, useValue: commonService },
        { provide: PlacesFiltersService, useValue: placesFiltersService }],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    const bound = {
      coordinates: [[[[-174.9648437500008, -16.9413344373162],
      [-22.035156249990877, 71.53531108109948]]]],
      type:"MultiPolygon"
    };
    const res = {
      "api-message" :"The poi autocomplete fetched response successfully",
      data: {
      places:[{
        geometry: {
        coordinates:[],
        type:"Polygon"},
        properties: {
          brands:"",
          city:"atlanta",
          created_datetime:"2019-03-27T00:00:00",
          geohash:"djupbwkdy",
          location_name:"OneBite ATL",
          naics_code:"",
          open_hours:{Mon: [], Tue: [], Wed: [], Thu: [], Fri: []},
          parent_safegraph_place_id:"",
          phone_number:"16786441399",
          point:{type: "Point", coordinates: []},
          safegraph_brand_ids:"",
          safegraph_place_id:"sg:2e7d39c8df0643d4b4e50c1d2359867e",
          state:"ga",
          status:"Active",
          street_address:"479 flat shoals avenue south east",
          sub_category:"",
          top_category:"",
          zip_code:"30316"
        }, _id: "5caaed703a7e9180a627a60b",
        type: "Feature"
      },
      {geometry: {
        coordinates:[],
        type:"Polygon"},
        properties: {
          brands:"",
          city:"atlanta",
          created_datetime:"2019-03-27T00:00:00",
          geohash:"djupbwkdy",
          location_name:"OneBite ATL",
          naics_code:"",
          open_hours:{Mon: [], Tue: [], Wed: [], Thu: [], Fri: []},
          parent_safegraph_place_id:"",
          phone_number:"16786441399",
          point:{type: "Point", coordinates: []},
          safegraph_brand_ids:"",
          safegraph_place_id:"sg:2e7d39c8df0643d4b4e50c1d2359867e",
          state:"ga",
          status:"Active",
          street_address:"479 flat shoals avenue south east",
          sub_category:"",
          top_category:"",
          zip_code:"30316"
        }, _id: "5caaed6d3a7e9180a6277901", type: "Feature"},
      {geometry: {
        coordinates:[],
        type:"Polygon"},
        properties: {
          brands:"",
          city:"atlanta",
          created_datetime:"2019-03-27T00:00:00",
          geohash:"djupbwkdy",
          location_name:"OneBite ATL",
          naics_code:"",
          open_hours:{Mon: [], Tue: [], Wed: [], Thu: [], Fri: []},
          parent_safegraph_place_id:"",
          phone_number:"16786441399",
          point:{type: "Point", coordinates: []},
          safegraph_brand_ids:"",
          safegraph_place_id:"sg:2e7d39c8df0643d4b4e50c1d2359867e",
          state:"ga",
          status:"Active",
          street_address:"479 flat shoals avenue south east",
          sub_category:"",
          top_category:"",
          zip_code:"30316"
        }, _id: "5caaed4d3a7e9180a6254867", type: "Feature"}]},
      message:"The poi autocomplete data fetched successfully",
      status:"success"
    };
    (<jasmine.Spy>commonService.getMapBoundingBox).and.returnValue(bound);
    (<jasmine.Spy>placesFiltersService.getPOISuggestion).and.returnValue(of(res));
    fixture = TestBed.createComponent(LayerSinglePlaceComponent);
    component = fixture.componentInstance;
    component.selectedLayers = [];
    component.type = 'place';
    component.clearLayer = false;
    component.map = {};
    component.layer = new EventEmitter();
    fixture.detectChanges();
    tick();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`it should set input value in 'searchPlaceCtrl'`, () => {
    component.selectedLayers = [];
    component.searchPlaceCtrl.setValue('atlanta');
    expect(component.searchPlaceCtrl.value).toEqual('atlanta');
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
