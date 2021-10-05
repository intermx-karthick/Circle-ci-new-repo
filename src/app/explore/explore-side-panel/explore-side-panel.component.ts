import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import {
  ExploreService,
  ExploreDataService,
  FormatService,
  ThemeService,
  AuthenticationService
} from '@shared/services';
import {BreakpointObserver} from '@angular/cdk/layout';
import { Representation, SpotReference } from '@interTypes/inventorySearch';
import { InventoryImageType } from '@interTypes/enums';
@Component({
  selector: 'app-explore-side-panel',
  templateUrl: './explore-side-panel.component.html',
  styleUrls: ['./explore-side-panel.component.less']
})
export class ExploreSidePanelComponent implements OnInit {
  @Input() place: any;
  @Input() sortQuery: any;
  @Input() isSelectEnabled: boolean;
  @Input() index: number;
  @Input() defaultIcon: any;
  @Output() mapViewOpen = new EventEmitter();
  @Output() placeSelect = new EventEmitter();
  noimage = false;
  initialPlaceholder = true;
  isSmallScreen = false;
  public auditStatusLabels : any;
  mod_permission: any;
  measuresLicense: any;
  public imageType =  InventoryImageType;
  constructor(
    private exploreService: ExploreService,
    private dataService: ExploreDataService,
    private formatService: FormatService,
    private auth: AuthenticationService,
    private breakpointObserver: BreakpointObserver, private theme: ThemeService) { }

  ngOnInit() {
     const themeSettings = this.theme.getThemeSettings();
     this.auditStatusLabels = themeSettings['inventoryStatuses'];
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.measuresLicense = this.mod_permission['features']['gpMeasures']['status'];
    this.breakpointObserver.observe('(max-width: 767px)').subscribe( result => {
      return  this.isSmallScreen = result['matches'];
     });
  }

  formatImpressions(value) {
    let ret;
    switch (this.sortQuery.value) {
      case 'pct_comp_imp_target' : {
        ret = (this.formatService.abbreviateNumber(value * 100, 1) + '%');
        break;
      }
      case 'pct_comp_imp_target_inmkt' : {
        ret = (this.formatService.abbreviateNumber(value * 100, 1) + '%');
        break;
      }
      case 'pct_imp_inmkt' : {
        ret = (this.formatService.abbreviateNumber(value * 100, 1) + '%');
        break;
      }
      // commented on 12/04/2019
     /* case 'tgtinmp' : {
        ret = (this.formatService.abbreviateNumber(value * 100, 1) + '%');
        break;
      }*/
      case 'reach_pct' : {
        ret = (this.formatService.convertToDecimalFormat(value, 2) + '%');
        break;
      }
      default : {
        ret = this.formatService.abbreviateDecimal(value);
      }
    }
    return ret;
  }

  getFeetFromInches(inches: number): number {
    return Math.floor(inches / 12);
  }
  getRemainderInches(inches: number): number {
    return (inches % 12);
  }
  mapView() {
    this.mapViewOpen.emit(this.place);
  }
  toggleSelection() {
    this.placeSelect.emit(this.place);
  }
  getOperatorName(representations: Representation[]): string {
    let opp = '';
    if (representations) {
      const representation = representations.filter(rep => rep['representation_type']['name'] === 'Own')[0];
      if (representation) {
        opp = representation['account']['parent_account_name'];
        // opp = representation['division']['plant']['name'];
      }
    }
    return opp;
  }
  getImpressionValue(sp: SpotReference[], sortKey: string) {
    let value = 0;
    if (sp
        && sp[0]
        && sp[0]['measures']
        && sp[0]['measures'][sortKey] !== 'undefined'
        && sp[0]['measures'][sortKey] > 0) {
          value = sp[0]['measures'][sortKey];
    }
    return value;
  }
  public setPlaceholderVisibility(status: boolean): void {
    this.noimage = status;
    if (!status) {
      this.initialPlaceholder = false;
    }
  }
}
