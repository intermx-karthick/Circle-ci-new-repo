import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SummaryRequest } from '@interTypes/summary';
import {
  AuthenticationService,
  CommonService,
  ExploreDataService,
  FormatService,
  InventoryService,
  ThemeService,
  TargetAudienceService
} from '@shared/services';
import { map, takeWhile, tap, delay, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { FiltersService } from '../filters/filters.service';
import { of, forkJoin } from 'rxjs';
import {Helper} from '../../classes';

@Component({
  selector: 'app-explore-metrics',
  templateUrl: './explore-metrics.component.html',
  styleUrls: ['./explore-metrics.component.less']
})
export class ExploreMetricsComponent implements OnInit, OnDestroy, OnChanges {
  marketNamesTitle: string;
  marketData: any;
  constructor(
    private dataService: ExploreDataService,
    private commonService: CommonService,
    private formatService: FormatService,
    private filterService: FiltersService,
    private auth: AuthenticationService,
    private activatedRoute: ActivatedRoute,
    private inventoryService: InventoryService,
    private theme: ThemeService,
    private targetAudienceService: TargetAudienceService) { }
  public totalPage: any = 0;
  mobileView: boolean;
  public inventorySummary: any;
  public inventorySummaryOriginal: any;
  private alive = true;
  public allowInventory;
  public targetName = 'Total Pop 0+ yrs';
  public marketNames = [];
  public audienceLicense = {};
  public measuresLicense: any;
  customInventories: any;
  @Input() permission: any;
  @Input() places: any = [];
  @Input() selectQuery: any;
  @Input() sortQuery: any;
  @Input() filters: any;
  @Input() selectedFidsArray: any;
  @Input() filterApiCallLoaded: any;
  @Input() totalInventory: number;
  isTabularViewEnabled: any;
  @Output() changeTotalPage: EventEmitter<any> = new EventEmitter();
  public isSmallScreen = false;
  metricProcessValue = 40;
  private inventorySummaryTimeout: any = null;
  public defaultAudience: any;
  debounceTimer = null;
  public selected = 0;
  public site = 'geopath';
  ngOnInit() {
    this.commonService.getMobileBreakPoint()
      .subscribe(isMobile => { this.isSmallScreen = isMobile; });
    this.mobileView = this.commonService.isMobile();
    this.allowInventory = this.permission['features']['gpInventory']['status'];
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    this.measuresLicense = this.permission['features']['gpMeasures']['status'];
    this.customInventories = this.permission['features']['customInventories']['status'];
    const moduleaccesData = this.auth.getModuleAccess('explore');
    this.isTabularViewEnabled = moduleaccesData['features']['inventoryTabularView'];
    this.defaultAudience = this.activatedRoute.snapshot.data.defaultAudience;
    this.commonService.onDataVersionChange().subscribe((data) => {
      this.targetAudienceService
          .getDefaultAudience(false, data.toString())
          .subscribe((audience) => {
            this.defaultAudience = audience;
          });
    }); 
    const themeSettings = this.theme.getThemeSettings();
    this.site = themeSettings.site;
    this.dataService.getSummary()
      .pipe(takeWhile(() => this.alive))
      .subscribe(summary => {
        this.inventorySummary = summary;
        if (!summary.reset) {
          this.inventorySummaryOriginal = Helper.deepClone(summary);
        }
        delete this.inventorySummary.reset;
      });
    this.dataService.getSelectedTargetName()
      .pipe(takeWhile(() => this.alive))
      .subscribe(target => {
        if (target && target !== '' && target.length ) {
          this.targetName = target;
        }
      });
    this.dataService.getSelectedMarket()
      .pipe(takeWhile(() => this.alive))
      .subscribe(market => {
        if (market && typeof market !== 'undefined' && market.selectedMarkets && market.selectedMarkets.length > 0) {
          this.marketNames = market.selectedMarkets.map(item => item.name);
          this.marketNamesTitle = '';
          this.marketNames.forEach(element => {
            if (this.marketNamesTitle) {
              this.marketNamesTitle = this.marketNamesTitle + 
              '<div style="display: list-item;list-style-type: disc; list-style-position: inside; text-align:left; ">' 
              + element + '</div>';

            } else {
              this.marketNamesTitle =
              '<div style="display: list-item; text-align:left; list-style-type: disc;list-style-position: inside; ">'
               + element + '</div>';

            }
          });
        } else {
          this.marketNames = [];
        }
      });
    this.filterService.getFilters()
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeWhile(() => this.alive),
        // tap(data => this.filterService.normalizeFilterDataNew(data)),
        map(data => {
          /**
           * To change the filter format and modify scenario and inventory
           * set into geoPanelID array we're using the below function
           */
          this.marketData = data['data']['market'] && data['data']['market'] || {};
          return this.filterService.normalizeFilterDataNew(data);
        }))
      .subscribe((filters: Partial<SummaryRequest>) => {
        this.dataService.setSummary({ reset: true });
        this.loadSummaryFromAPI(filters);
      });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.places && changes.places.currentValue) {
      this.places = changes.places.currentValue;
    }
    if (changes.selectQuery && changes.selectQuery.currentValue) {
      if (this.places && this.places.length > 0 && this.inventorySummary && typeof this.inventorySummary['imp'] !== 'undefined') {
        this.loadSummaryFromAPI(this.filters);
      } else if (changes.selectQuery.previousValue === 'None') {
        this.loadSummaryFromAPI(this.filters);
      }
    }
    if (changes.selectedFidsArray && changes.selectedFidsArray.currentValue) {
      if (this.places && this.places.length > 0 && this.inventorySummary && typeof this.inventorySummary['imp'] !== 'undefined') {
        this.loadSummaryFromAPI(this.filters);
      }
    }
  }

  loadSummaryFromAPI(filterData) {
    if (this.inventorySummaryTimeout !== null) {
      this.inventorySummaryTimeout.unsubscribe();
    }
    if (this.selectQuery === 'None') {
      this.dataService.setSummary({});
      return;
    }
    const filters = Helper.deepClone(filterData);
    if (this.selectQuery !== 'All') {
      const selected = this.selectedFidsArray.filter(f => f.selected);
      const fids = selected.map(s => s.fid);
      if (fids && fids.length > 0) {
        filters['id_type'] = 'spot_id';
        filters['id_list'] = fids;
      }
    }

    if (!filterData['audience'] && !filterData['target_segment']) {
      filters['target_segment'] = this.defaultAudience['audienceKey'];
      this.dataService.setSelectedTarget(this.defaultAudience['audienceKey']);
    } else if (filterData['target_segment']) {
      filters['target_segment'] = filterData['target_segment'];
    } else {
      filters['target_segment'] = filterData['audience']['key'];
    }
    delete filters['audience'];
    delete filters['page'];
    const filtersTemp = Helper.deepClone(filters);
    delete filtersTemp['gp_ids'];
    delete filtersTemp['custom_ids'];
    const r1 = this.inventoryService
      .getSummary(filtersTemp, true);
    const summaryAPIs = [r1];
    if (this.customInventories === 'active' && this.inventoryService.checkToCallCustomInv(filters)) {
      summaryAPIs.push(this.getInventoryIDsFromES(filters));
    }
    this.inventorySummaryTimeout = forkJoin(summaryAPIs).subscribe(results => {
      const summary = results[0];
      if (results[1]) {
        summary['spots'] = Number(summary['spots']) + Number(results[1]);
      }
      if (summary) {
        this.dataService.setSummary(summary);
      }
    });
    /* this.inventorySummaryTimeout = this.inventoryService
    .getSummary(filters, true)
    .subscribe(summary => {
      if (summary) {
        this.dataService.setSummary(summary);
      }
    }); */
  }

  getInventoryIDsFromES(filtersData) {
    let query = this.inventoryService.prepareInventoryQuery(filtersData);
    // query = this.inventoryService.addTotalQuery(query);
    query = this.inventoryService.addTotalSpotQuery(query, filtersData);
    query['size'] = 0;
    return this.inventoryService.getInventoryFromElasticSearch(query)
      .pipe(map(res => {
        return res['aggregations']['spots']['spot_filter']['spot_count']['value'];
      }), catchError(error => of([])));
  }

  convertCurrency(x) {
    return this.formatService.convertCurrencyFormat(x);
  }
  abbreviateNumber(number, decPlaces) {
    return this.formatService.abbreviateNumber(number, decPlaces);
  }
  convertToPercentage(key, decimal = 0) {
    return this.formatService.convertToPercentageFormat(key, decimal);
  }

  ngOnDestroy() {
    this.alive = false;
  }
  calculateProgressBarPercentage() {
    if (this.inventorySummary && this.inventorySummary.target_inMarket_impressions && this.inventorySummary.total_impressions) {
      const differentance = this.inventorySummary.total_impressions - this.inventorySummary.target_inMarket_impressions;
      const differentancePercantage = differentance / this.inventorySummary.total_impressions * 100;
      this.metricProcessValue = (100 - differentancePercantage);
    } else {
      this.metricProcessValue = 0;
    }
  }
  changePageTotal(value) {
    this.changeTotalPage.emit(value);
  }

  expandTable() {
    this.dataService.setMapViewPositionState('tabularView');
  }
  marketChanges(event) {
    this.marketData['selected'] = event.value;
    const marketData = Helper.deepClone(this.marketData);
    if (event.value !== 'all' && event.value !== 'us' && event.value !== 'individual_all') {
      const marketGeo = this.marketData.selectedMarkets.filter(market => {
        return event.value === market.id;
      });
      marketData['selectedMarkets'] = marketGeo;
    } else if (event.value === 'all' || event.value === 'individual_all') {
      marketData['selectedMarkets'] = this.marketData.selectedMarkets;

    } else if (event.value === 'us') {
      marketData['selectedMarkets'] = [];
    }
    this.inventoryService.showGeographiesOverrideDiaglog()
      .afterClosed()
      .subscribe(confirm => {
        if (confirm) {
          this.filterService.overrideGeographyFilter(marketData);
        }
        this.filterService.setFilter('market', this.marketData);
      });
  }
}
