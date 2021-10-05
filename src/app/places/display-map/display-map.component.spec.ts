// import { async, ComponentFixture, TestBed } from '@angular/core/testing';
// import {StaticMapProperties} from '@interTypes/staticMapProperties';
// import {LoaderService, TitleService} from '@shared/services';
// import {of} from 'rxjs';
// import { DisplayMapComponent } from './display-map.component';
// import {ThemeService} from '@shared/services';
// import { HttpClientModule } from '@angular/common/http';
// import { AppConfig } from 'app/app-config.service';

// describe('DisplayMapComponent', () => {
//   let component: DisplayMapComponent;
//   let fixture: ComponentFixture<DisplayMapComponent>;
//   let theme;
//   let config: any;
//   const themeSettings = {
//     logo: {
//       full_logo: '/assets/images/geopath_black_logo.png',
//       mini_logo: '/assets/images/geo_path_mini_logo.png'
//     },
//     background: {
//       bg_image: '/assets/images/login_image-gp.jpg',
//       bg_color: '#922A95'
//     },
//     customize: {
//       favicon_logo: '/assets/images/geo_path_mini_logo.png',
//       supportUrl: 'https://support.geopath.io',
//       media_types: [
//         {
//           mtidPrint: [
//             '21'
//           ],
//           mtidDigital: [
//             '20'
//           ],
//           mtidInteractive: [],
//           displayName: 'Bulletins',
//           colorName: 'Red',
//           color: '#FC644B',
//           printSymbol: 'winks_mt01',
//           colors: {
//             light: '#FF5A14',
//             dark: '#FF3D00',
//             satellite: '#FF5A14'
//           },
//           print: {
//             font: 'icon-wink-round',
//             symbol: 'e'
//           },
//           digital: {
//             font: 'icon-wink-round-dig',
//             symbol: 'f'
//           },
//           digitalSymbol: 'winks_mt15',
//           printPBSymbol: 'squinks_mt01',
//           digitalPBSymbol: 'squinks_mt15',
//           interactivePBSymbol: 'squinks_mt15i'
//         },
//         {
//           mtidPrint: [
//             '30',
//             '40'
//           ],
//           mtidDigital: [
//             '31',
//             '41'
//           ],
//           mtidInteractive: [],
//           displayName: 'Posters',
//           colorName: 'Yellow',
//           color: '#FEC546',
//           printSymbol: 'winks_mt04',
//           colors: {
//             light: '#FFCD00',
//             dark: '#FF9A00',
//             satellite: '#FFCD00'
//           },
//           print: {
//             font: 'icon-wink-round',
//             symbol: 'e'
//           },
//           digital: {
//             font: 'icon-wink-round-dig',
//             symbol: 'f'
//           },
//           digitalSymbol: 'winks_mt18',
//           printPBSymbol: 'squinks_mt04',
//           digitalPBSymbol: 'squinks_mt18',
//           interactivePBSymbol: 'squinks_mt18i'
//         },
//         {
//           mtidPrint: [
//             '51'
//           ],
//           mtidDigital: [
//             '50'
//           ],
//           mtidInteractive: [
//             '10002'
//           ],
//           displayName: 'Street Furniture',
//           colorName: 'Green',
//           color: '#1BADA8',
//           printSymbol: 'winks_mt08',
//           colors: {
//             light: '#98D037',
//             dark: '#47FF00',
//             satellite: '#47FF00'
//           },
//           print: {
//             font: 'icon-wink-square',
//             symbol: 'g'
//           },
//           digital: {
//             font: 'icon-wink-square-dig',
//             symbol: 'h'
//           },
//           digitalSymbol: 'winks_mt21',
//           printPBSymbol: 'squinks_mt08',
//           digitalPBSymbol: 'squinks_mt21',
//           interactivePBSymbol: 'squinks_mt21i'
//         },
//         {
//           mtidPrint: [
//             '10'
//           ],
//           mtidDigital: [
//             '11'
//           ],
//           mtidInteractive: [],
//           displayName: 'Walls & Murals',
//           colorName: 'Purple',
//           color: '#7854E5',
//           printSymbol: 'winks_mt14',
//           colors: {
//             light: '#AE57FF',
//             dark: '#C400FF',
//             satellite: '#D857FF'
//           },
//           print: {
//             font: 'icon-wink-flat',
//             symbol: 'a'
//           },
//           digital: {
//             font: 'icon-wink-flat-dig',
//             symbol: 'b'
//           },
//           digitalSymbol: 'winks_mt23',
//           printPBSymbol: 'squinks_mt14',
//           digitalPBSymbol: 'squinks_mt23',
//           interactivePBSymbol: 'squinks_mt23i'
//         },
//         {
//           mtidPrint: [
//             '999'
//           ],
//           mtidDigital: [
//             '990'
//           ],
//           mtidInteractive: [],
//           displayName: 'Place Based',
//           colorName: 'Blue',
//           color: '#1C8DD3',
//           colors: {
//             light: '#1C8DD3',
//             dark: '#008FFF',
//             satellite: '#55D8FF'
//           },
//           print: {
//             font: 'icon-wink-pb',
//             symbol: 'c'
//           },
//           digital: {
//             font: 'icon-wink-pb-dig',
//             symbol: 'd'
//           }
//         }
//       ]
//     },
//     workflow: {
//       project: [
//         'Project',
//         'Projects'
//       ],
//       'sub-project': [
//         'Sub-Project',
//         'Sub-Projects'
//       ],
//       folder_0: [
//         'Folder',
//         'Folders'
//       ],
//       scenario_0: [
//         'Scenario',
//         'Scenarios'
//       ]
//     },
//     _id: '5cc1625aa00f4c69d56d2485',
//     site: 'geopath',
//     siteName: 'Geopath',
//     version: 'BETA',
//     legal: 'geopathTerms',
//     home: 'geopathWalkthough',
//     title: 'Geopath Insights Suite',
//     productName: 'Insights Suite',
//     welcome: 'If you are a Geopath member, sign in below.',
//     homepage: 'http://www.geopath.org',
//     landingPage: 'explore',
//     orientation: 'portrait',
//     color_sets: {
//       primary: {
//         '100': '#E2BEE0',
//         '200': '#D094CD',
//         '300': '#BD6AB8',
//         '400': '#AE4BA9',
//         '500': '#9F2E9B',
//         '600': '#922A95',
//         '700': '#81248D',
//         '800': '#711F84',
//         '900': '#551875',
//         base: '#922A95',
//         '050': '#F3E5F2'
//       },
//       secondary: {
//         '100': '#B4EFF4',
//         '200': '#83E4EE',
//         '300': '#51D9E7',
//         '400': '#29D0E1',
//         '500': '#00C7DD',
//         '600': '#00B7C9',
//         '700': '#00A1AF',
//         '800': '#008D97',
//         '900': '#00696C',
//         base: '#008D97',
//         '050': '#E1F9FB'
//       },
//       gray: {
//         '100': '#F5F5F5',
//         '200': '#EEEEEE',
//         '300': '#E0E0E0',
//         '400': '#BDBDBD',
//         '500': '#9E9E9E',
//         '600': '#757575',
//         '700': '#616161',
//         '800': '#424242',
//         '900': '#212121',
//         base: '#212121',
//         '050': '#FAFAFA'
//       },
//       error: {
//         '300': '#FAF0F4',
//         '600': '#EFCCDA',
//         '900': '#B00048',
//         base: '#B00048'
//       },
//       warning: {
//         '300': '#FFF7F5',
//         '600': '#FFE6DD',
//         '900': '#FF8256',
//         base: '#FF8256'
//       },
//       success: {
//         '300': '#F0FCF8',
//         '600': '#CDF5E8',
//         '900': '#05D08C',
//         base: '#05D08C'
//       },
//       highlight: {
//         base: '#FCBD32'
//       }
//     },
//     basemaps: [
//       {
//         'default': false,
//         label: 'antique',
//         uri: 'mapbox://styles/intermx/cjtfv47l30ijs1fo2pj03ttue'
//       },
//       {
//         'default': true,
//         label: 'light',
//         uri: 'mapbox://styles/intermx/cjtfv8f541ejn1fqlnc1cg2lv'
//       },
//       {
//         'default': false,
//         label: 'dark',
//         uri: 'mapbox://styles/intermx/cjt76lctk67js1fnjuwsr710i'
//       },
//       {
//         'default': false,
//         label: 'satellite',
//         uri: 'mapbox://styles/intermx/cjt76ogcp24ya1fushwy830tk'
//       }
//     ],
//     gpLogin: true,
//     domain: 'http://localhost:4200',
//     environment: 'development'
//   };
//   const mapProps: StaticMapProperties = {
//     width: 100,
//     height: 100,
//     zoom: 15,
//     alt: 'No',
//     coordinates: [13.071344, 80.257405],
//   }
//   beforeEach(async(() => {
//     config = jasmine.createSpyObj('AppConfigService', [
//       'load',
//       'API_ENDPOINT'
//     ]);
//     theme = jasmine.createSpyObj('ThemeService', [
//       'themeSettings',
//       'getThemeSettings',
//       'getMapStyleURL'
//     ]);
//   theme.themeSettings = of(false);
//     (<jasmine.Spy>theme.getThemeSettings).and.returnValue(themeSettings);
//     (<jasmine.Spy>theme.getMapStyleURL).and.returnValue('cjt76ogcp24ya1fushwy830tk');
//     TestBed.configureTestingModule({
//       imports: [HttpClientModule],
//       declarations: [ DisplayMapComponent ],
//       providers: [
//         {provide: ThemeService, useValue: theme},
//         { provide: AppConfig, useValue: config },
//       ]
//     })
//     .compileComponents();
//   }));

//   beforeEach(() => {
//     fixture = TestBed.createComponent(DisplayMapComponent);
//     component = fixture.componentInstance;
//     component.properties = mapProps;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
//   it('should not load js map by default', () => {
//     expect(component.isMapNeeded).toBeFalsy();
//   });
//   it('should enable js map if image fails', async() => {
//     component.imageError();
//     fixture.detectChanges();
//     expect(component.map).toBeDefined();
//   });
// });
