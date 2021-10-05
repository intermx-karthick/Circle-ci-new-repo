import { Component, OnInit, Optional, SkipSelf, Inject} from '@angular/core';
import { FormatService, ExploreService } from '@shared/services';
import { PopupRef } from '@shared/popup/popup-ref';
import { InventoryImageType } from '@interTypes/enums';

@Component({
  selector: 'app-inventory-detail-view',
  templateUrl: './inventory-detail-view.component.html',
  styleUrls: ['./inventory-detail-view.component.less']
})
export class InventoryDetailViewComponent implements OnInit {
  public inventoryDetails: any;
  public feature: any;
  public summary: any = {};
  // public properties: any;
  public response: any;
  public isPortrait = true;
  public propertieDetail: any = {
    trp: '-',
    reach: '-',
    frq: '-',
    comp: '-',
    total_market_population: '',
    total_market_impressions: '',
    total_market_percentage: '',
    total_in_market_impressions: '',
    target_market_population: '',
    target_market_impressions: '',
    target_market_percentage: '',
    target_in_market_impressions: '',
    composition_market_population: '',
    composition_market_impressions: '',
    composition_market_percentage: '',
    composition_in_market_impressions: ''
  };
  public viewDetails = {
    staticMapURL: '',
    topZipDetails: [],
    topMarketDetails: [],
    match: '',
    miniLogo: '',
    height: '',
    width: ''
  };
  public contentHeight: number;
  public selectedMarket = '';
  public defaultAudience: any;
  selectedMarketToolTip: Array<any> = [];
  public hourlyImpressions = {};
  public imageType =  InventoryImageType;
  public displayMeasures = false;
  public copyrightYear;
  constructor(
    private format: FormatService,
    private exploreService: ExploreService,
    @Optional() @SkipSelf() public popupRef: PopupRef
  ) {
    this.inventoryDetails = popupRef?.data;
  }

  ngOnInit() {
    this.contentHeight = window.innerHeight - 320;
    this.feature = this.inventoryDetails.feature;
    this.response = this.inventoryDetails.inventoryDetail;
    this.isPortrait = this.inventoryDetails.portraitView;
    this.displayMeasures = this.inventoryDetails.displayMeasures;
    this.hourlyImpressions = this.response?.hourlyImpressions;
    if (this.inventoryDetails && this.inventoryDetails?.selectedMarket &&
      this.inventoryDetails.selectedMarket.selectedMarkets && this.inventoryDetails.selectedMarket.selectedMarkets.length > 0) {
      if (this.inventoryDetails.selectedMarket.selected === 'all') {
        this.inventoryDetails.selectedMarket.selectedMarkets.filter
        ((market) =>    this.selectedMarketToolTip.push(market.name));
        this.selectedMarket = 'Combined Markets';
      } else if (this.inventoryDetails.selectedMarket.selected === 'individual_all') {
        this.inventoryDetails.selectedMarket.selectedMarkets.filter
        this.selectedMarket = 'Individual Markets (all)';
        this.inventoryDetails.selectedMarket.selectedMarkets.filter
        ((market) =>    this.selectedMarketToolTip.push(market.name));
      } else if (this.inventoryDetails.selectedMarket.selected === 'us') {
        this.selectedMarket = 'United States';
        this.selectedMarketToolTip = ['United States'];
      } else {
        const slectedMarketDisp = this.inventoryDetails.selectedMarket.selectedMarkets.filter
        ((market) => this.inventoryDetails.selectedMarket.selected === market.id );
        this.selectedMarketToolTip.push(slectedMarketDisp[0].name);
        this.selectedMarket = slectedMarketDisp[0].name;
      }
    } else {
      this.selectedMarket = 'United States';
      this.selectedMarketToolTip = ['United States'];
    }
    this.defaultAudience = this.inventoryDetails.defaultAudience;
    let startTime = new Date(`2019/01/01 00:00:00`).getHours();
    let endTime = new Date(`2019/01/01 00:00:00`).getHours();

    if (this.feature['illumination_start_time']) {
      startTime = new Date(`2019/01/01 ${this.feature['illumination_start_time']}`).getHours();
    }
    if (this.feature['illumination_end_time']) {
      endTime = new Date(`2019/01/01 ${this.feature['illumination_end_time']}`).getHours();
    }

    const duration = endTime - startTime;

    this.feature['illumination_duration'] = duration + ' hrs';
    if (duration === 1) {
      this.feature['illumination_duration'] = 1 + ' hr';
    }

    this.viewDetails.staticMapURL = this.inventoryDetails.staticMapURL;

    this.viewDetails.topZipDetails = this.response?.zipcodes?.topFour || [];
    this.viewDetails.topMarketDetails = this.response?.dmaresults?.topFour || [];

    this.viewDetails.miniLogo = this.inventoryDetails.miniLogo;
    //this.properties = this.response.unitDetails.properties;
    // this.viewDetails.match = JSON.parse(this.response.match);
   /* if (
      this.feature['layouts'] &&
      this.feature['layouts'][0]['faces'] &&
      this.feature['layouts'][0]['faces'][0]['spots'] &&
      this.feature['layouts'][0]['faces'][0]['spots'][0]['measures']) {
        this.summary = this.feature['layouts'][0]['faces'][0]['spots'][0]['measures'];
    }*/
    

    if(this.feature['spot_references']?.[0]?.measures ) {
      this.summary = this.feature['spot_references'][0]['measures'];
    }

    if (this.summary['trp']) {
      this.propertieDetail.trp = this.summary.trp.toFixed(3);
    }

    if (this.summary['reach_pct'] !== 'undefined') {
      this.propertieDetail.reach =
        this.summary.reach_pct > 0
          ? this.format.convertToDecimalFormat(this.summary.reach_pct, 2) + '%'
          : '-';
    }

    if (this.summary['freq_avg']) {
      this.propertieDetail.frq =
      this.summary['freq_avg'] > 0
          ? this.format.convertToDecimalFormat(this.summary['freq_avg'], 1)
          : '-';
    }

    if (this.summary['index_comp_target']) {
      this.propertieDetail.comp = this.format.checkAndPopulate(
        this.summary['index_comp_target']
      );
    }

    // total
    this.propertieDetail.total_market_population = this.format.checkAndPopulate(
      this.summary['pop_inmkt']
    );
    this.propertieDetail.total_market_impressions = this.format.checkAndPopulate(
      this.summary['imp']
    );
    this.propertieDetail.total_market_percentage = this.format.checkAndPopulate(
      this.summary['pct_imp_inmkt'],
      true
    );
    this.propertieDetail.total_in_market_impressions = this.format.checkAndPopulate(
      this.summary['imp_inmkt']
    );

    // Target
    this.propertieDetail.target_market_population = this.format.checkAndPopulate(
      this.summary['pop_target_inmkt']
    );
    this.propertieDetail.target_market_impressions = this.format.checkAndPopulate(
      this.summary['imp_target']
    );
    this.propertieDetail.target_market_percentage = this.format.checkAndPopulate(
      this.summary['pct_imp_target_inmkt'],
      true
    );
    this.propertieDetail.target_in_market_impressions = this.format.checkAndPopulate(
      this.summary['imp_target_inmkt']
    );

    // composition
    this.propertieDetail.composition_market_population = this.format.checkAndPopulate(
      this.summary['pct_comp_pop_target_inmkt'], true
    );
    this.propertieDetail.composition_market_impressions = this.format.checkAndPopulate(
      this.summary['pct_comp_imp_target'], true
    );
    this.propertieDetail.composition_market_percentage = this.format.checkAndPopulate(
      this.summary['pct_comp_imp_target_inmkt'],
      true,
      false,
      ''
    );
    this.propertieDetail.composition_in_market_impressions = this.format.checkAndPopulate(
      this.summary['pct_comp_imp_target_inmkt'],
      true
    );
    // feet engine height and width
    this.viewDetails.height = this.format.getFeetInches(this.feature.max_height);
    this.viewDetails.width = this.format.getFeetInches(this.feature.max_width);
    this.copyrightYear = new Date().getFullYear();
  }
  onResize() {
    this.contentHeight = window.innerHeight - 320;
  }

  undo() {
    this.closePopup();
  }

  info() {
    this.closePopup();
  }

  private closePopup(){
    this.popupRef?.close?.()
  }

}
