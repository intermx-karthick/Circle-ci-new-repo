import {
  Component, OnInit, QueryList, ViewChildren, AfterViewInit, Input,
  Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy
} from '@angular/core';
import { ListKeyManager } from '@angular/cdk/a11y';
import { ArrowNavigationComponent } from '@shared/components/arrow-navigation/arrow-navigation.component';
import { FiltersService } from '../filters.service';
import { AuthenticationService } from '@shared/services/authentication.service';
import { ExploreDataService } from '@shared/services/explore-data.service';
import {debounceTime, distinctUntilChanged, filter, takeUntil, map} from 'rxjs/operators';
import {Market, MarketSelectionState, MarketType} from '@interTypes/marketType';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import {InventoryService} from '@shared/services';
import { GeographySet } from '@interTypes/Population';
import {Helper} from '../../../classes';

/**
 * @deprecated This component is deprecated and will be removed. Any new implementation should not be based on this component.
 * This is Deprecated because it had assumptions that this will be only used within explore and a lot of hacks are included here
 * when it begun to be used outside explore module. So a better generic version of component is created for this purpose and that
 * should be used instead.
 */
@Component({
  selector: 'app-market-filter',
  templateUrl: './market-filter.component.html',
  styleUrls: ['./market-filter.component.less']
})
export class MarketFilterComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() dmaList: any = [];
  @Input() cbsaList: Market[] = [];
  @Input() countyList: any = [];
  @Input() nationalList: any = [];
  @Input() searchedMarkets: any = [];
  @Input() geoSetsList: GeographySet[] = [];
  @Input() totalPages = 0;
  @Input() totalCountyPages = 0;
  @Input() geoSetsLoader = false;
  @Output() searchMarkets: EventEmitter<any> = new EventEmitter();
  @Output() loadMoreMarkets: EventEmitter<any> = new EventEmitter();
  @Output() resetMarkets: EventEmitter<any> = new EventEmitter();
  public searchCtrl: FormControl = new FormControl();
  public marketSelectionCtrl: FormControl = new FormControl();
  public markets: any = [];
  public filteredMarkets: Market[] = [];
  public appliedMarkets: any = [];
  public keyboardEventsManager: ListKeyManager<any>;
  @ViewChildren(ArrowNavigationComponent) listItems: QueryList<ArrowNavigationComponent>;
  private mod_permission: any;
  public allowInventory = '';
  public isPopulationEnabled: boolean;
  public audienceLicense = {};
  private unSubscribe: Subject<void> = new Subject<void>();
  private currentPage = 0;
  private selectedGeographyFilters = [];
  selectedOptions: any = [];
  selectedPreviewOptions: any = [];
  public selectedGeoSetCtrl: FormControl = new FormControl();
  constructor(
    private filtersService: FiltersService,
    private auth: AuthenticationService,
    private exploreDataService: ExploreDataService,
    private inventoryService: InventoryService,
  ) { }

  ngOnInit() {
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    const populationAccess = this.auth.getModuleAccess('populationLibrary');
    this.isPopulationEnabled = (populationAccess && populationAccess['status'] === 'active');
    this.filtersService.getFilters()
      .pipe(debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.unSubscribe))
      .subscribe((filters) => {
        this.setSelectedMarket();
        const filterSession = this.filtersService.getExploreSession();
        if (filterSession && filterSession['data'] && filterSession['data']['market'] &&
        filterSession['data']['market']['selectedMarkets']) {
          if (filterSession['data']['market']['type'] === 'GEO_SET' &&
          filterSession['data']['market']['selectedGeographySet']) {
            this.selectedOptions = filterSession['data']['market']['selectedMarkets'];
            this.selectedGeoSetCtrl.patchValue(filterSession['data']['market']['selectedGeographySet']['_id']);
          } else {
            this.selectedOptions = filterSession['data']['market']['selectedMarkets'];
            this.appliedMarkets = filterSession['data']['market']['selectedMarkets'];
            this.selectedPreviewOptions  = Helper.deepClone(this.appliedMarkets);
            this.setData(filterSession['data']['market']);
          }
          if (this.marketSelectionCtrl.value !== filterSession['data']['market']['type']) {
            this.marketSelectionCtrl.patchValue(filterSession['data']['market']['type']);
          }
        } else {
          this.selectedOptions = [...this.nationalList];
          this.appliedMarkets = [...this.nationalList];
          this.selectedPreviewOptions = [...this.nationalList];
          this.marketSelectionCtrl.patchValue('National');
        }
        if (filterSession &&
          filterSession['data'] &&
          filterSession['data']['location'] &&
          filterSession['data']['location']['selectedGeoLocation']) {
          this.selectedGeographyFilters = filterSession['data']['location']['selectedGeoLocation'];
        } else {
          this.selectedGeographyFilters = [];
        }
      });
    this.filtersService.onReset().pipe(takeUntil(this.unSubscribe)).subscribe(type => {
      if (type !== 'FilterInventory') {
        this.resetFilter();
      }
    });

    this.marketSelectionCtrl.valueChanges.pipe(takeUntil(this.unSubscribe)).subscribe(value => {
      if (this.searchCtrl.value && this.searchCtrl.value.length > 0) {
        this.searchMarkets.emit({ search: this.searchCtrl.value, type: value });
      } else {
        this.searchMarkets.emit({ search: '' , type: value});
      }
      if (this.selectedPreviewOptions.length > 0) {
        this.selectedOptions = this.selectedPreviewOptions;
      } else {
        this.selectedOptions = this.appliedMarkets;
        this.selectedPreviewOptions  = Helper.deepClone(this.appliedMarkets);
      }
      this.currentPage = 1;
      this.setMarkets(value);
    });
    this.searchCtrl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.unSubscribe)).subscribe(value => {
        this.currentPage = 1;
        this.searchMarkets.emit({ search: value, type: this.marketSelectionCtrl.value });
      });
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.setMarkets(this.marketSelectionCtrl.value);
    if (this.marketSelectionCtrl.value !== 'National') {
      this.selectedOptions = this.selectedPreviewOptions;
    }
  }

  public ngAfterViewInit() {
    if (this.listItems['_results']) {
      this.keyboardEventsManager = new ListKeyManager<any>(this.listItems).withWrap().withTypeAhead();
      // This code is not use so commenting and see
      // const filterSession = this.filtersService.getExploreSession();
      // if (filterSession && filterSession['data'] && filterSession['data']['audienceMarket']) {
      //   const market = this.findMarket(filterSession['data']['audienceMarket']);
      //   if (market) {
      //     this.selectedMarket = market;
      //     this.appliedMarkets = market;
      //   }
      // }
    }
  }

  public resetFilter() {
    this.selectedOptions = [];
    this.selectedPreviewOptions = [];
    this.appliedMarkets = [];
    this.keyboardEventsManager.setActiveItem(null);
    if (this.marketSelectionCtrl.value === 'CBSA') {
      this.resetMarkets.emit('CBSA');
    }
    this.marketSelectionCtrl.patchValue('National');
    this.resetMarkets.emit('National');
    this.selectedPreviewOptions = [...this.nationalList];
    this.setData(this.selectedOptions);
    this.searchCtrl.patchValue('');
    this.searchMarkets.emit({ search: '' });
  }

  public clearFilter() {
    this.resetFilter();
    // this.setGeographyData([]);
    this.filtersService.clearFilter('market', true);
  }

  public setSelectedMarket(selectedMarket = {}) {
    if (typeof selectedMarket['id'] !== 'undefined') {
      this.selectedOptions = [selectedMarket];
    } else {
      if (this.appliedMarkets && this.appliedMarkets['selectedMarkets'] &&
       this.appliedMarkets['selectedMarkets'].length > 0) {
        this.selectedOptions = this.appliedMarkets;
      } else {
        this.selectedOptions = [];
      }
    }
  }

  public submitMarket(type) {
    let selectedGeoSet: GeographySet;
    if (this.marketSelectionCtrl.value === 'GEO_SET') {
      selectedGeoSet = this.getSelectedGeoSet();
      if (selectedGeoSet && selectedGeoSet.markets.length) {
        const marketType = selectedGeoSet.market_type === 'COUNTY' ? 'CNTY' : selectedGeoSet.market_type;
        this.selectedOptions = selectedGeoSet.markets.map(market => {
          return { id: `${marketType}${market.geo_id}`, name: market.geo_name };
        });
      }
    } else if (this.marketSelectionCtrl.value !== 'National') {
      this.selectedOptions = this.selectedPreviewOptions;
      this.appliedMarkets = this.selectedOptions;
    }
    let selectionValue = 'all';
    if (this.selectedOptions.length > 1) {
      if (type === 'group') {
        selectionValue = 'all';
      } else {
        selectionValue = 'individual_all';
      }
    } else {
      selectionValue = this.selectedOptions[0]['id'];
    }
    const dataSelected: MarketSelectionState = {
      selectedMarkets: this.selectedOptions,
      selected: selectionValue,
      type: this.marketSelectionCtrl.value,
      selectedGeographySet: selectedGeoSet,
      submitType: type
    };
    // If user already have some geographies applied, confirm with them otherwise just overwrite
    if (this.selectedGeographyFilters.length > 0) {
      this.inventoryService.showGeographiesOverrideDiaglog()
        .afterClosed()
        .subscribe(confirm => {
          if (confirm) {
            this.filtersService.overrideGeographyFilter(dataSelected);
          }
          this.filtersService.setFilter('market', dataSelected);
          this.setData(dataSelected);
        });
    } else {
      this.inventoryService.showGeographiesOverrideDiaglog('Would you like to use this market selection to filter inventory?', 'Please note: If you choose not to filter inventory by the location of the Target Market, target impressions can be delivered by inventory from all regions.')
        .afterClosed()
        .subscribe(confirm => {
          if (confirm) {
            this.filtersService.overrideGeographyFilter(dataSelected);
          }
          this.filtersService.setFilter('market', dataSelected);
          this.setData(dataSelected);
        });
    }
  }
  private getSelectedGeoSet() {
    return this.geoSetsList.find(set => set._id === this.selectedGeoSetCtrl.value);
  }

  private setData(market) {
    if ( market && market.selectedMarkets && market.selectedMarkets.length > 0) {
      this.exploreDataService.setSelectedMarket(market);
    } else {
      this.exploreDataService.setSelectedMarket({});
    }
  }
  public findMarket(id) {
    return this.markets.find(market => market.id === id);
  }

  private setMarkets(type: MarketType) {
    switch (type) {
      case 'DMA':
        this.filteredMarkets = this.dmaList;
        this.markets = this.dmaList;
        break;
      case 'CBSA':
        this.filteredMarkets = this.cbsaList;
        this.markets = this.cbsaList;
        break;
      case 'County':
        this.filteredMarkets = this.countyList;
        this.markets = this.countyList;
        break;
      case 'National':
        this.filteredMarkets = this.nationalList;
        this.markets = this.nationalList;
        this.selectedOptions = [...this.nationalList];
    }
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  public loadMore() {
    this.currentPage += 1;
    let total = 0;
    switch (this.marketSelectionCtrl.value) {
      case 'CBSA':
        total = this.totalPages;
        break;
      case 'County':
        total = this.totalCountyPages;
        break;
    }
    if (this.currentPage <= total || this.marketSelectionCtrl.value === 'GEO_SET') {
      this.loadMoreMarkets.emit({ page: this.currentPage, type: this.marketSelectionCtrl.value });
    }
  }

  public onSelectOptions(selectedMarket) {
    // Saving selected options in separate var to maintaing selection when switching b/w DMA & CBSA
    const filterType = this.marketSelectionCtrl.value === 'County' ? 'CNTY' : this.marketSelectionCtrl.value;
    const index = this.selectedPreviewOptions.findIndex(market => market.id === selectedMarket._value['id']);
    if (index > -1) {
      if (!selectedMarket._selected) {
        this.selectedPreviewOptions.splice(index, 1);
      }
    } else {
      this.selectedPreviewOptions.push(selectedMarket._value);
    }
    // Will filter the values based on selected Market type
    this.selectedPreviewOptions = this.selectedPreviewOptions.filter(option => option['id'].includes(filterType));
  }

  public compare(c1, c2) {
    return c1 && c2 && c1['id'] === c2['id'];
  }

  /**
   * This function will be calle from UI
   * This funtion will add selected options(markets) to temp var that is `@this.selectedPreviewOptions`
   * @param {number} [count=0]
   * @memberof MarketFilterComponent
   */
  public addList(count = 0) {
    const index = 0;
    const filterType = this.marketSelectionCtrl.value === 'County' ? 'CNTY' : this.marketSelectionCtrl.value;
    if (count === 0) {
      // whenenver search is enabled then only add all will be enabled so combining selected and markets
      this.selectedPreviewOptions = [];
      this.selectedOptions = [...this.selectedOptions, ...this.searchedMarkets];
      this.selectedOptions = this.selectedOptions.filter(option => option['id'].includes(filterType));
      this.selectedOptions.map((market) => {
        const foundIndex = this.selectedPreviewOptions.findIndex(previewMarket => market.id === previewMarket.id);
        if (foundIndex === -1) {
          this.selectedPreviewOptions.push(market);
        }
      });

    } else {
      this.selectedOptions = this.markets.slice(index, count);
      this.selectedOptions = this.selectedOptions.filter(option => option['id'].includes(filterType));
      this.selectedPreviewOptions = this.selectedOptions;
    }
  }
  public removeMarket(market) {

    const filterType = this.marketSelectionCtrl.value === 'County' ? 'CNTY' : this.marketSelectionCtrl.value;

    const foundIndex = this.selectedPreviewOptions.findIndex(previewMarket => market.id === previewMarket.id);
    if (foundIndex > -1) {
      this.selectedPreviewOptions.splice(foundIndex, 1);
    }
    /** Include only selected market type values */
    this.selectedPreviewOptions = this.selectedPreviewOptions.filter(previewMarket => previewMarket['id'].includes(filterType));

    const index = this.selectedOptions.findIndex(previewMarket => market.id === previewMarket.id);
    if (index > -1) {
      this.selectedOptions.splice(index, 1);
    }
    /** Include only selected market type values */
    this.selectedOptions = this.selectedOptions.filter(option => option['id'].includes(filterType));
  }
}
