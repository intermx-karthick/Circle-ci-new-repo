import {Component, OnInit, OnDestroy, Output, EventEmitter, Input} from '@angular/core';
import { FiltersService } from '../filters/filters.service';
import {
  CommonService,
  AuthenticationService,
  ThemeService
} from '@shared/services';
import { takeWhile, debounceTime, distinctUntilChanged, takeUntil, map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
@Component({
  selector: 'app-explore-header',
  templateUrl: './explore-header.component.html',
  styleUrls: ['./explore-header.component.less']
})
export class ExploreHeaderComponent implements OnInit, OnDestroy {
  public currentTab = '';
  public mobileView: boolean;
  public mouseIsInsideFilter = false;
  private unSubscribe = true;
  public inventoryApplyCount = 0;
  private open = false;
  mod_permission: any;
  allowInventory: any = '';
  allowInventoryAudience: any = '';
  public audienceLicense = {};
  public inventoryManagementEnabled = false;
  public marketLicense: any;
  public isDataVersionOpen = false;
  public selectedDataVersion: any = 2021;
  public dataVersions = [202106, 2021, 2020];
  public savedDataVersion = 2021;
  public iconIndex = 1;
  period_days = 7;
  public defaultDataVersion: any;
  public populationIntelligenceAccess: any;
  @Input() public isPopIntelMenuOpen;
  @Output() private onPopulationIntelClick: EventEmitter<null> = new EventEmitter<null>();
  constructor(
    private filtersService: FiltersService,
    private commonService: CommonService,
    private auth: AuthenticationService,
    private dialog: MatDialog,
    private themeService: ThemeService
  ) {}


  ngOnInit() {
    const inventoryPermission = this.auth.getUserFeaturePermissions(
      'inventory'
    );
    this.mobileView = this.commonService.isMobile();
    const defaultYear = this.themeService.getThemeSettingByName('measuresRelease');
    this.defaultDataVersion = Number(defaultYear);
    this.filtersService
      .getFilterSidenav()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe((tabState) => {
        if (!tabState['open']) {
          this.currentTab = '';
        }
      });
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory'][
      'status'
    ];
    this.populationIntelligenceAccess = this.mod_permission?.features?.populationIntelligence;
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    this.allowInventoryAudience = this.audienceLicense['status'];
    this.marketLicense = this.auth.getModuleAccess('markets');

    /** Enable inventory management inventoryManagement = Active && user inventory write : true */
    const invManagement = this.mod_permission['features'][
      'inventoryManagement'
    ];
    this.inventoryManagementEnabled =
      invManagement &&
      invManagement['status'].toLowerCase() === 'active' &&
      inventoryPermission?.write === true;

    this.filtersService
      .getFilters()
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((filters) => {
        const data = filters.data;
        this.inventoryApplyCount = 0;
        if (data['mediaTypeList']) {
          this.inventoryApplyCount += 1;
        }
        if (data['operatorList']) {
          this.inventoryApplyCount += 1;
        }
        if (data['location']) {
          this.inventoryApplyCount += 1;
        }
        if (data['geoPanelId'] || data['plantUnitId']) {
          this.inventoryApplyCount += 1;
        }
        if (data['inventorySet']) {
          this.inventoryApplyCount += 1;
        }
        if (
          data['mediaAttributes'] &&
          Object.keys(data['mediaAttributes']).length !== 0
        ) {
          this.inventoryApplyCount += 1;
        }
        if (data['thresholds']) {
          this.inventoryApplyCount += 1;
        }
        if (data['period_days']) {
          this.period_days = Number(data['period_days']) / 7;
        }
        if (data['measuresRelease']) {
          this.selectedDataVersion = data['measuresRelease'];
          this.savedDataVersion = data['measuresRelease'];
        }
      });
    const sessionFilter = this.filtersService.getExploreSession();
    if (
      sessionFilter &&
      sessionFilter['clickAudience'] &&
      sessionFilter['clickAudience'] === true
    ) {
      setTimeout(() => {
        const element: HTMLElement = document.querySelector(
          '#define-target'
        ) as HTMLElement;
        if (element) {
          element.click();
          const audience: HTMLElement = document.querySelector(
            '.select-audience-panel'
          ) as HTMLElement;
          if (audience) {
            audience.click();
          }
        }
      }, 500);
    }
    if (
      sessionFilter &&
      sessionFilter['data'] &&
      sessionFilter['data']['period_days']
    ) {
      this.period_days = Number(sessionFilter['data']['period_days']) / 7;
    }
    let formSessionFilter = false;
    let cVersion = this.defaultDataVersion;
    if (sessionFilter?.data?.measuresRelease) {
      formSessionFilter = true;
      cVersion = sessionFilter?.data?.measuresRelease;
    } else {
      formSessionFilter = false;
      const preferences = this.commonService.getUserPreferences();
      cVersion = preferences?.measures_release || this.defaultDataVersion;
    }
    if (cVersion) {
      this.selectedDataVersion = cVersion;
      this.savedDataVersion = this.selectedDataVersion;
      this.commonService.setDataVersion(this.selectedDataVersion);
      if (!formSessionFilter) {
        this.filtersService.setFilter(
          'measuresRelease',
          this.savedDataVersion
        );
      }
    } 
    this.filtersService.setFilterPill(
      'measuresRelease',
      `Data Source: ${this.savedDataVersion.toString()}`
    );


    this.filtersService.onReset()
      .subscribe(type => {
        const preferences = this.commonService.getUserPreferences();
        const measureVersion = preferences?.measures_release ?? this.defaultDataVersion;
        this.selectedDataVersion = measureVersion;
        this.savedDataVersion = this.selectedDataVersion;
        this.commonService.setDataVersion(this.selectedDataVersion);
        this.filtersService.setFilter(
          'measuresRelease',
          this.savedDataVersion
        );
        this.filtersService.setFilterPill(
          'measuresRelease',
          `Data Source: ${this.savedDataVersion.toString()}`
        );
      });
      this.filtersService.checkSessionDataPushed()
        .pipe(takeWhile(() => this.unSubscribe))
        .subscribe((val) => {
          if (val) {
            const sessionFilter = this.filtersService.getExploreSession();
            this.selectedDataVersion = sessionFilter?.data?.measuresRelease ?? this.defaultDataVersion;
            this.savedDataVersion = this.selectedDataVersion;
            this.commonService.setDataVersion(this.selectedDataVersion);
            this.filtersService.setFilterPill(
              'measuresRelease',
              `Data Source: ${this.savedDataVersion.toString()}`
            );
          }
      });
  }
  ngOnDestroy() {
    this.unSubscribe = false;
    const sessionFilter = this.filtersService.getExploreSession();
    if (sessionFilter) {
      sessionFilter['clickAudience'] = false;
      this.filtersService.saveExploreSession(sessionFilter);
    }
  }
  openFilterSiderbar(tab) {
    this.isDataVersionOpen = false;
    if (this.open && this.currentTab === tab) {
      this.open = !this.open;
    } else {
      this.open = true;
    }
    const sidenav = { open: this.open, tab: tab };
    this.currentTab = tab;
    this.filtersService.setFilterSidenav(sidenav);
  }
  mouseHover(event) {
    this.filtersService.setFilterSidenavOut(true);
  }
  mouseLeave(event) {
    this.filtersService.setFilterSidenavOut(false);
  }
  openDataVersion() {
    if (!this.isDataVersionOpen && this.currentTab !== '') {
      this.openFilterSiderbar(this.currentTab);
    }
    this.isDataVersionOpen = !this.isDataVersionOpen;
  }
  onDataVersionChange(data) {
    this.selectedDataVersion = data.option.value;
  }
  applyDataVersionChange() {
    if (this.savedDataVersion !== this.selectedDataVersion) {
      if (this.selectedDataVersion === 2020 && (this.period_days === 20 || this.period_days === 52)) {
        const dialogueData = {
          title: 'Confirmation',
          description: 'Measurement with conflicting Plan Period could be erroneous, verify before Progressing.',
          confirmBtnText: 'OK',
          cancelBtnText: 'SKIP & CONTINUE',
          headerCloseIcon: false
        };
        this.dialog.open(NewConfirmationDialogComponent, {
          data: dialogueData,
          width: '340px',
          height: '260px',
          panelClass: 'imx-mat-dialog'
        }).afterClosed().pipe(
          takeWhile(() => this.unSubscribe),
          map(res => res?.action)
        ).subscribe(flag => {
          if (flag !== undefined && !flag) {
            this.saveAndProcessMeasures();
          }
        });
      } else {
        this.saveAndProcessMeasures();
      }
      /* this.iconIndex = this.iconIndex === 1 ? 0 : 1;
      this.dialog
        .open(DataVersionConfirmationComponent, {
          width: '450px',
          height: '300px',
          panelClass: 'imx-mat-dialog',
          data: { iconIndex: this.iconIndex }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res['action']) {
            
          }
        }); */
    } else {
      this.isDataVersionOpen = false;
    }
  }
  saveAndProcessMeasures() {
    const preferences = {
      measures_release: this.selectedDataVersion
    };
    this.commonService.setUserPreferences(preferences ?? {});
    this.savedDataVersion = this.selectedDataVersion;
    this.commonService.setDataVersion(this.savedDataVersion);
    this.filtersService.clearFilter('audience', true);
    this.filtersService.setFilter(
      'measuresRelease',
      this.savedDataVersion
    );
    this.filtersService.setFilterPill(
      'measuresRelease',
      `Data Source: ${this.savedDataVersion.toString()}`
    );
    this.isDataVersionOpen = false;
    
  }
  public populationIntelligenceToggle() {
    this.onPopulationIntelClick.emit();
  }
}
