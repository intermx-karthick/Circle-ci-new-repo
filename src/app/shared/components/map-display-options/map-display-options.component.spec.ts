import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MapDisplayOptionsComponent } from './map-display-options.component';
import { LayersService } from 'app/explore/layer-display-options/layers.service';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { ThemeService } from '@shared/services';

describe('MapDisplayOptionsComponent', () => {
  let component: MapDisplayOptionsComponent;
  let fixture: ComponentFixture<MapDisplayOptionsComponent>;
  let layersService: LayersService;
  let themeService: ThemeService;
  let cdRef: ChangeDetectorRef;

  beforeEach(waitForAsync(() => {
    layersService = jasmine.createSpyObj('LayersService', [
      'defaultDisplayOptions',
      'getApplyLayers',
      'getlayersSession',
      'saveLayersSession',
      'setDisplayOptions',
      'setRemoveLogoAndText',
      'getRemoveLogoAndText'
    ]);
    themeService = jasmine.createSpyObj('ThemeService', [
      'getThemeSettings'
    ]);
    layersService.defaultDisplayOptions = {
      mapLegend: true,
      mapControls: true,
      filterPills: true,
      labels: {
        audience: true,
        market: true,
        filters: true,
        deliveryWeeks: true,
        'saved view': true,
      },
      showUnselectedInventory: true,
      baseMap: '',
      isLogoEnabled: false,
      isTextEnabled: false,
      mapLabel: false,
      mapLabels: {
        'geopath spot IDs': false,
        'operator spot IDs': false
      }
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: LayersService, useValue: layersService },
        { provide: ThemeService, useValue: themeService },
        {provide: ChangeDetectorRef, useValue: cdRef}
      ],
      declarations: [ MapDisplayOptionsComponent ],
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
    (<jasmine.Spy>layersService.getApplyLayers).and.returnValue(of(false));
    (<jasmine.Spy>themeService.getThemeSettings).and.returnValue(theme);
    (<jasmine.Spy>layersService.getApplyLayers).and.returnValue(of(false));
    (<jasmine.Spy>layersService.getRemoveLogoAndText).and.returnValue(of('logo'));
    layersService.exploreCustomLogo = {
       'primary' : {},
       'secondary' : {}
     };
    fixture = TestBed.createComponent(MapDisplayOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it(`it should call 'changeMapOptions' method`, () => {
  //   spyOn(component, 'changeMapOptions');
  //   component.changeMapOptions('place', {checked: true});
  //   fixture.detectChanges();
  //   expect(component.changeMapOptions).toHaveBeenCalled();
  // });

  // it(`it should call 'changeMapStyle' method`, () => {
  //   spyOn(component, 'changeMapStyle');
  //   component.changeMapStyle('light');
  //   fixture.detectChanges();
  //   expect(component.changeMapStyle).toHaveBeenCalled();
  // });

  /**  */
  /*it(`it should call 'updateCustomText' method`, () => {
    spyOn(component, 'updateCustomText');
    component.updateCustomText('');
    fixture.detectChanges();
    expect(component.updateCustomText).toHaveBeenCalled();
  });

  it(`it should call 'clearFile' method`, () => {
    spyOn(component, 'clearFile');
    component.clearFile();
    fixture.detectChanges();
    expect(component.clearFile).toHaveBeenCalled();
  });

  it(`it should call 'addBackground' method`, () => {
    spyOn(component, 'addBackground');
    component.addBackground('logo', {checked:true});
    fixture.detectChanges();
    expect(component.addBackground).toHaveBeenCalled();
  });

  it(`it should call 'clearCustomText' method`, () => {
    spyOn(component, 'clearCustomText');
    component.clearCustomText();
    fixture.detectChanges();
    expect(component.clearCustomText).toHaveBeenCalled();
  });*/

});
