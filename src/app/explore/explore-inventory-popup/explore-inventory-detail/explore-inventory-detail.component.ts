import { Component, Inject, OnInit, Optional, SkipSelf } from '@angular/core';
import {
  ExploreService,
  FormatService,
  ThemeService
} from '@shared/services';
import { Inventory } from '@interTypes/inventory';
import {Orientation} from '../../../classes/orientation';
import { PopupRef } from '@shared/popup/popup-ref';
import { InventoryImageType } from '@interTypes/enums';

@Component({
  selector: 'app-explore-inventory-detail',
  templateUrl: './explore-inventory-detail.component.html',
  styleUrls: ['./explore-inventory-detail.component.less']
})
export class ExploreInventoryDetailComponent implements OnInit {
  constructor(
    private exploreService: ExploreService,
    public format: FormatService,
    private theme: ThemeService,
    @Optional() @SkipSelf() public popularRef: PopupRef
  ) {
    this.inventory = popularRef?.data;
  }
  public inventory: any;
  public selectButton: string;
  public isFeatures = false;
  public feature: Inventory;
  public boardDetail: any = { boardTitle: '', hours: '', week: '', orientation: '' };
  public haveImpressions = false;
  public impression: any;
  public isEnabled = false;
  public auditStatusLabels: any;
  public operatorSpotID: any;
  public status: any;
  public redColorStatus = ['Published - Suppressed', 'Incomplete', 'Published - Inactive', 'Unpublished - Measured', 'Unpublished - Inactive', 'Decommissioned'];
  public greenColorStatus = ['Published - Measured'];
  public greyColorStatus = ['Published - Unmeasured', 'Unaudited', 'Audited - Level 0', 'Non-Audited'];
  public yellowColorStatus = ['Published - Under Review'];
  public colorClass = 'red';
  public layerType = 'primmary';
  public imageType =  InventoryImageType;

  ngOnInit() {
    const themeSettings = this.theme.getThemeSettings();
    this.auditStatusLabels = themeSettings['inventoryStatuses'];
    // if (this.inventory.selectedFids && this.inventory.selectedFids.length <= 50000) {
    //   this.isEnabled = true;
    // } else {
    //   this.isEnabled = false;
    // }
    if (this.inventory.totalInventory && this.inventory.totalInventory <= 50000) {
      this.isEnabled = true;
    } else {
      this.isEnabled = false;
    }
    this.feature = this.inventory.feature;
    if (this.feature['spot_references'] && this.feature['spot_references'][0]['measures']) {
      const measures = this.feature['spot_references'][0]['measures'];
      if (measures['imp'] && measures['imp'] > 0) {
        this.haveImpressions = true;
          this.impression = measures['imp'];
      }
    }
    if (this.feature['layouts'] && this.feature['layouts'].length > 0 && this.feature['layouts'][0]['faces'][0]) {
      const spot = this.feature['layouts'][0]['faces'][0]['spots'][0];
      this.operatorSpotID = spot['plant_spot_id'];
    } else {
      this.operatorSpotID = '';
    }

    const layer = this.inventory.feature.layer;
    if (this.inventory.features.length > 1) {
      this.isFeatures = true;
    }
    if (this.inventory.selectedFids.length > 0 && (typeof layer === 'undefined' || layer.id.search('layerInventoryLayer') < 0)) {

      const selected = this.inventory.selectedFids.filter(place => (place.fid === this.feature.id));
      let selectedFeature = this.inventory.feature;

      if (this.inventory.type !== 'outside') {
        selectedFeature = selected[0];
      }
      if (this.inventory.isAllowInventoryAudience !== 'hidden') {
        this.selectButton = 'Selected';
        if (selected.length <= 0 || !selectedFeature['selected']) {
          if (selected.length > 0 && selected[0]['selected']) {
            this.selectButton = 'Selected';
          } else {
            this.selectButton = 'Select';
          }
        }
      }
    }
    this.boardDetail.boardTitle = this.feature.media_type.name;
    this.boardDetail.height = this.format.getFeetInches(this.feature.max_height);
    this.boardDetail.width = this.format.getFeetInches(this.feature.max_width);
    const orientation = new Orientation();
    this.boardDetail.orientation = orientation.getOrientation(this.feature.location.orientation);
    this.status = this.feature['media_status'];
    if (this.greenColorStatus.indexOf(this.status['name']) > -1) {
      this.colorClass = 'green';
    } else if (this.greyColorStatus.indexOf(this.status['name']) > -1) {
      this.colorClass = 'grey';
    } else if (this.yellowColorStatus.indexOf(this.status['name']) > -1) {
      this.colorClass = 'yellow';
    }
    this.layerType = this.inventory.layerType ? this.inventory.layerType : 'primary';
  }

  moreDetails(){
    this.popularRef?.close?.();
  }

}
