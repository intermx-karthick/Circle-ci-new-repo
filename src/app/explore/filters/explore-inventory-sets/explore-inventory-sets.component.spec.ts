/** import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ExploreInventorySetsComponent } from './explore-inventory-sets.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { WorkSpaceService } from '../../../shared/services/work-space.service';
import { SearchDirective } from '../../../shared/directives/search.directive';
import { IMXHighlightPipe } from '../../../shared/pipes/highlight.pipe';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { WorkSpaceDataService } from '../../../shared/services/work-space-data.service';
import { FiltersService } from '../filters.service';
import { AuthenticationService } from '../../../shared/services/authentication.service';
import { ExploreDataService } from '../../../shared/services/explore-data.service';
import { ExploreService } from '../../../shared/services/explore.service';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ThemeService } from '../../../shared/services/theme.service';
import { CommonService, FormatService } from '@shared/services';

describe('ExploreInventorySetsComponent', () => {
  let component: ExploreInventorySetsComponent;
  let fixture: ComponentFixture<ExploreInventorySetsComponent>;
  let workSpaceService: WorkSpaceService;
  let workSpaceDataService: WorkSpaceDataService;
  let filtersService: FiltersService;
  let auth: AuthenticationService;
  let exploreDataService: ExploreDataService;
  let exploreService: ExploreService;
  let route: ActivatedRoute;
  let dialogRef;
  let dialogData;
  let theme: ThemeService;
  let commonSrv: CommonService;
  const packageData = [
    {
      'description':'Test one..',
      'name':'abilene inventory sets',
      'owner':'5afd1db1e8c630e6d5f05158',
      '_id':'5b76746066269f3cdf6f901d',
      'inventory': [
        {
          'id':140852,
          'type':'geopathPanel',
          '_id':'5b7674ee66269f3cdf6f904f'
        }
      ]
    }
  ];
  beforeEach(waitForAsync(() => {
    workSpaceService = jasmine.createSpyObj('WorkSpaceService', [
      'getExplorePackages'
    ]);
    workSpaceDataService = jasmine.createSpyObj('WorkSpaceDataService', [
      'setPackages',
      'getPackages'
    ]);
    filtersService = jasmine.createSpyObj('FiltersService', [
      'onReset',
      'checkSessionDataPushed',
      'getExploreSession',
      'setFilter',
      'clearFilter',
      'openPackage'
    ]);
    auth = jasmine.createSpyObj('AuthenticationService', [
      'getModuleAccess'
    ]);
    theme = jasmine.createSpyObj('ThemeService', [
      'getThemeSettings'
    ]);
    exploreDataService = jasmine.createSpyObj('ExploreDataService', [
      'getSelectedMarket',
      'getHighlightedPosition'
    ]);
    exploreService = jasmine.createSpyObj('ExploreService', [
      'getInventoryFilters'
    ]);
    dialogRef = jasmine.createSpyObj('MatDialogRef', [
      'data',
    ]);
    dialogData = jasmine.createSpyObj('MAT_DIALOG_DATA', [
      ''
    ]);

    commonSrv = jasmine.createSpyObj('CommonService', ['getSavedInventorySets']);
    
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        RouterTestingModule.withRoutes([]),
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatDialogModule,
        MatListModule,
        MatInputModule
      ],
      declarations: [
        ExploreInventorySetsComponent,
        SearchDirective,
        IMXHighlightPipe,
        TruncatePipe
      ],
      providers: [
        { provide: WorkSpaceService, useValue: workSpaceService },
        { provide: WorkSpaceDataService, useValue: workSpaceDataService },
        { provide: FiltersService, useValue: filtersService },
        { provide: AuthenticationService, useValue: auth },
        { provide: ExploreDataService, useValue: exploreDataService },
        { provide: ExploreService, useValue: exploreService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: ThemeService, useValue: theme },
        { provide: CommonService, useValue: commonSrv},
        {
          provide: ActivatedRoute, useValue: {
            snapshot: {
              'data': {
                packages:{
                packages:{
                'description':'Test one..',
                'name':'abilene inventory sets',
                'owner':'5afd1db1e8c630e6d5f05158',
                '_id':'5b76746066269f3cdf6f901d',
                'inventory': [
                  {
                    'id':140852,
                    'type':'geopathPanel',
                    '_id':'5b7674ee66269f3cdf6f904f'
                  }
                ]
              }
              }
            }
            },
            queryParams: of([{}]),
          }
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    const mod_permission = {
      features: {
        gpInventory: {
          'status': 'active'
        },
        customInventories: {
          'status': 'active'
        }
      }
    };
    const scenario_mod_permission = {
      'status': 'active'
    };
    const themeSettings = {
      clientId: '125'
    };
    (<jasmine.Spy>auth.getModuleAccess).and.returnValue(mod_permission);
    (<jasmine.Spy>filtersService.onReset).and.returnValue(of(null));
    (<jasmine.Spy>filtersService.checkSessionDataPushed).and.returnValue(of(null));
    (<jasmine.Spy>theme.getThemeSettings).and.returnValue(themeSettings);

    fixture = TestBed.createComponent(ExploreInventorySetsComponent);
    component = fixture.componentInstance;

    (<jasmine.Spy>workSpaceDataService.setPackages).and.returnValue(of(packageData));
    (<jasmine.Spy>workSpaceDataService.getPackages).and.returnValue(of(packageData));
  });

  it('search and edit of inventory set', async() => {
    fixture.detectChanges();
    component.searchedPackages = packageData;
    const inventorySearch = fixture.nativeElement.parentNode.querySelector('.inventory-search-field') as HTMLInputElement;
    inventorySearch.click();
    component.searchQuery = 'abilene';
    inventorySearch.value = 'abilene';
    fixture.detectChanges();
    component.filterPackages({
      value: []
    });
    const editInvButton = fixture.nativeElement.querySelector('.test-inv-edit-icon') as HTMLLinkElement;
    editInvButton.click();
    fixture.detectChanges();
  });

  it('filter using inventory sets', () => {
    const filterData = {'placeBased': true, 'geopathPanelIdList':[140852,140921,140709,140837,140775], 'audience': 'pz_seg01', 'market': ' ' , 'base': 'pf_pop_a18p', 'sort': 'cwi'};
    const result = exploreService.getInventoryFilters(filterData);
    const resultFilter = {
      filter: {
        fids: [ 140852, 140921, 140709, 140837, 140775]
      }
    };
    (<jasmine.Spy>exploreService.getInventoryFilters).and.returnValue(of(resultFilter));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); **/
