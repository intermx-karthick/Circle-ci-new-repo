import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PlaceCustomizeLayerComponent } from './place-customize-layer.component';
import { ExploreDataService } from '@shared/services/explore-data.service';
import { FormatService } from '@shared/services/format.service';
import { ThemeService } from '@shared/services/theme.service';
import { CommonService } from '@shared/services/common.service';
import { ExploreService } from '@shared/services';
import { LayersService } from '../../../explore/layer-display-options/layers.service';
import {SharedFunctionsModule} from '@shared/shared-functions.module';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {PlacesFiltersService} from '../places-filters.service';



describe('PlaceCustomizeLayerComponent', () => {
  let component: PlaceCustomizeLayerComponent;
  let fixture: ComponentFixture<PlaceCustomizeLayerComponent>;
  let exploreDataService: ExploreDataService;
  let layersService: LayersService;
  let formatService: FormatService;
  let themeService: ThemeService;
  let commonService: CommonService;
  let exploreService: ExploreService;
  let placefilterService: PlacesFiltersService;

  beforeEach(waitForAsync(() => {
    exploreDataService = jasmine.createSpyObj('ExploreDataService', [
      'getMapObject'
    ]);
    layersService = jasmine.createSpyObj('LayersService', [
      'getApplyLayers',
      'cleanUpMap',
      'saveLayersSession',
      'setLayers',
      'getlayersSession'
    ]);
    formatService = jasmine.createSpyObj('FormatService', [
      'sortAlphabetic'
    ]);
    themeService = jasmine.createSpyObj('ThemeService', [
      'getThemeSettings'
    ]);
    commonService = jasmine.createSpyObj('CommonService', [
      'getMobileBreakPoint'
    ]);
    exploreService = jasmine.createSpyObj('ExploreService', [
      'getmarketGeometry'
    ]);
    placefilterService = jasmine.createSpyObj('PlacesFiltersService', [
      'getPlacesSet'
    ]);


    TestBed.configureTestingModule({
      imports: [
        SharedFunctionsModule,
        MatProgressSpinnerModule,
        InfiniteScrollModule,
      ],
      declarations: [ PlaceCustomizeLayerComponent ],
      providers: [
        { provide: ExploreDataService, useValue: exploreDataService },
        { provide: LayersService, useValue: layersService },
        { provide: FormatService, useValue: formatService },
        { provide: ThemeService, useValue: themeService },
        { provide: CommonService, useValue: commonService },
        { provide: ExploreService, useValue: exploreService },
        { provide: PlacesFiltersService, useValue: placefilterService },
       ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    const theme = {
      background : {bg_image: "/assets/images/theme2/login_bg.jpg", bg_color: "#0D96D4"},
      basemaps : [
      {default: false, label: "antique", uri: "mapbox://styles/intermx/cjtfv47l30ijs1fo2pj03ttue"},
      {default: true, label: "light", uri: "mapbox://styles/intermx/cjtfv8f541ejn1fqlnc1cg2lv"},
      {default: false, label: "dark", uri: "mapbox://styles/intermx/cjt76lctk67js1fnjuwsr710i"},
      {default: false, label: "satellite", uri: "mapbox://styles/intermx/cjt76ogcp24ya1fushwy830tk"}],
      "color_sets"  :
      {
        error : {"300": "#FAF0F4", "600": "#EFCCDA", "900": "#B00048", "base": "#B00048"},
        gray : {"100": "#F5F5F5", "200": "#EEEEEE", "300": "#E0E0E0", "400": "#BDBDBD", "500": "#9E9E9E", "600": "#757575", "700": "#616161", "800": "#424242", "900": "#212121", "base": "#212121", "050": "#FAFAFA"},
        highlight :  {"base": "#FCBD32"},
        primary :   {"100": "#B2E3F6", "200": "#81D1F0", "300": "#52BEE9", "400": "#31B1E6", "500": "#13A4E2", "600": "#0D96D4", "700": "#0483C1", "800": "#0473AD", "900": "#00538B", "base": "#0D96D4", "050": "#E1F4FB"},
        secondary: {"100": "#CEE8CC", "200": "#AEDAAC", "300": "#8FCC8B", "400": "#78C172", "500": "#61B659", "600": "#58A650", "700": "#4C9445", "800": "#42833B", "900": "#2E6429", "base": "#8FCC8B", "050": "#EAF6EA"},
        success :  {300: "#F0FCF8", 600: "#CDF5E8", 900: "#05D08C", base: "#05D08C"},
        warning :  {300: "#FFF7F5", 600: "#FFE6DD", 900: "#FF8256", base: "#FF8256"}
      },
      customize : {supportUrl: "https://support.intermx.com", favicon_logo: "/assets/images/theme2/mini_logo.png", media_types: []},
      domain : "https://wow.intermx.io",
      gpLogin:  false,
      home : "zoomExtents",
      homepage : "http://www.intermx.com",
      landingPage : "explore",
      legal : "hidden",
      logo : {full_logo: "/assets/images/theme2/logo.png", mini_logo: "/assets/images/theme2/mini_logo.svg"},
      orientation : "portrait",
      productName: "Insights Suite",
      site : "intermx",
      siteName : "INTERMX",
      title : "Intermx Insights Suite",
      version:  "ALPHA",
      welcome : "Sign in below.",
      workflow :{
        "folder_0" : ["Folder", "Folders"],
        "project": ["Project", "Projects"],
        "scenario_0": ["Scenario", "Scenarios"],
        "sub-project": ["Sub-Project", "Sub-Projects"]
      },
      _id:  "5cc168a0a00f4c69d56d2499"
    };
    const place = [{
      geohash5:[],
      geohash6:[],
      name :"cancel1",
      owner :"5c41e161cbaecd7109c15493",
      pois : ["sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:c80b9aaa28fb4efa95c0ed7685aa3167", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514", "sg:32dd574e3acf4fc88c02eb79b161f514"],
      selected :false,
      _id:"5d0a433681701d001936742c"
    }];

    const placeSets = {
      data: [
        {
          name: 'atlanta place set',
          owner: '5afd1db1e8c630e6d5f05158',
          pois: ['sg:111964a5c4134ae1908e73f78b64d2f6', 'sg:5354b9b0e9154e75bafc2c52616c8a46'],
          _id: '5c937b874df9d80012b716c8'
        }
      ]
    };

    (<jasmine.Spy>themeService.getThemeSettings).and.returnValue(theme);
    (<jasmine.Spy>commonService.getMobileBreakPoint).and.returnValue(of(false));
    (<jasmine.Spy>exploreDataService.getMapObject).and.returnValue(of({}));
    (<jasmine.Spy>formatService.sortAlphabetic).and.returnValue(1);
    (<jasmine.Spy>layersService.getApplyLayers).and.returnValue(of(true));
    (<jasmine.Spy>placefilterService.getPlacesSet).and.returnValue(of(placeSets));

    fixture = TestBed.createComponent(PlaceCustomizeLayerComponent);
    fixture.componentInstance.filteredPlacePacks = [];
    // component.filteredPlacePacks = [];
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`it should call 'moveLayer' method`, () => {
    spyOn(component, 'moveLayer');
    const layer = {
      geohash5: [],
      geohash6: [],
      name : 'cancel1',
      owner : '5c41e161cbaecd7109c15493',
      pois : ['sg:32dd574e3acf4fc88c02eb79b161f514',
        'sg:32dd574e3acf4fc88c02eb79b161f514',
        'sg:32dd574e3acf4fc88c02eb79b161f514',
        'sg:c80b9aaa28fb4efa95c0ed7685aa3167',
        'sg:32dd574e3acf4fc88c02eb79b161f514',
        'sg:32dd574e3acf4fc88c02eb79b161f514',
        'sg:32dd574e3acf4fc88c02eb79b161f514'],
      selected : false,
      _id: '5d0a433681701d001936742c'
    };
    component.moveLayer(layer,'place collection',0);
    fixture.detectChanges();
    expect(component.moveLayer).toHaveBeenCalled();
  });

  it(`it should call 'removeLayer' method`, () => {
    spyOn(component, 'removeLayer');
    const layer = {
      geohash5: [],
      geohash6: [],
      name : 'cancel1',
      owner : '5c41e161cbaecd7109c15493',
      pois : ['sg:32dd574e3acf4fc88c02eb79b161f514',
        'sg:32dd574e3acf4fc88c02eb79b161f514',
        'sg:32dd574e3acf4fc88c02eb79b161f514',
        'sg:c80b9aaa28fb4efa95c0ed7685aa3167',
        'sg:32dd574e3acf4fc88c02eb79b161f514',
        'sg:32dd574e3acf4fc88c02eb79b161f514',
        'sg:32dd574e3acf4fc88c02eb79b161f514'],
      selected : false,
      _id: '5d0a433681701d001936742c'
    };
    component.removeLayer(layer,'place collection',0);
    fixture.detectChanges();
    expect(component.removeLayer).toHaveBeenCalled();
  });

  it(`it should call 'layer' method`, () => {
    spyOn(component, 'layer');
    const event = {
      layer: {
        geohash5: [],
        geohash6: [],
        name : 'cancel1',
        owner : '5c41e161cbaecd7109c15493',
        pois : ['sg:32dd574e3acf4fc88c02eb79b161f514',
          'sg:32dd574e3acf4fc88c02eb79b161f514',
          'sg:32dd574e3acf4fc88c02eb79b161f514',
          'sg:c80b9aaa28fb4efa95c0ed7685aa3167',
          'sg:32dd574e3acf4fc88c02eb79b161f514',
          'sg:32dd574e3acf4fc88c02eb79b161f514',
          'sg:32dd574e3acf4fc88c02eb79b161f514'],
        selected : false,
        _id: '5d0a433681701d001936742c'
      },
        position: 0,
        type: 'place collection'
      };
      component.layer(event);
      fixture.detectChanges();
      expect(component.layer).toHaveBeenCalled();
  });

  it(`it should call 'openColorPalet' method`, () => {
    spyOn(component, 'openColorPalet');
    component.openColorPalet('5d0a40ef81701d001936742a');
    fixture.detectChanges();
    expect(component.openColorPalet).toHaveBeenCalled();
  });

  it(`it should call 'onAppColorChange' method`, () => {
    spyOn(component, 'onAppColorChange');
    const event = {
      color: '#12181b',
      data: {
        geohash5: [],
        geohash6: [],
        name : 'cancel1',
        owner : '5c41e161cbaecd7109c15493',
        pois : ['sg:32dd574e3acf4fc88c02eb79b161f514',
          'sg:32dd574e3acf4fc88c02eb79b161f514',
          'sg:32dd574e3acf4fc88c02eb79b161f514',
          'sg:c80b9aaa28fb4efa95c0ed7685aa3167',
          'sg:32dd574e3acf4fc88c02eb79b161f514',
          'sg:32dd574e3acf4fc88c02eb79b161f514',
          'sg:32dd574e3acf4fc88c02eb79b161f514'],
        selected : false,
        _id: '5d0a433681701d001936742c'
      },
        icon: 'icon-place',
        id : '5d0a40ef81701d001936742a',
        type : 'place collection'
      };
      component.onAppColorChange(event, '#12181b', 'place collection');
      fixture.detectChanges();
      expect(component.onAppColorChange).toHaveBeenCalled();
  });

  it(`it should call 'onDragStart' method`, () => {
    spyOn(component, 'onDragStart');
      component.onDragStart('');
      fixture.detectChanges();
      expect(component.onDragStart).toHaveBeenCalled();
  });

  it(`it should call 'onDragEnd' method`, () => {
    spyOn(component, 'onDragEnd');
    component.onDragEnd('');
    fixture.detectChanges();
    expect(component.onDragEnd).toBeTruthy();
  });

  it(`it should call 'onClose' method`, () => {
    spyOn(component, 'onClose');
    component.onClose(true);
    fixture.detectChanges();
    expect(component.onClose).toBeTruthy();
  });

});
