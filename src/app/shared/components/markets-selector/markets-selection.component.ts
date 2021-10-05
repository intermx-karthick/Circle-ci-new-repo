import {
  Component, OnInit, QueryList, ViewChildren, AfterViewInit, Input,
  Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy
} from '@angular/core';
import { ListKeyManager } from '@angular/cdk/a11y';
import { ArrowNavigationComponent } from '@shared/components/arrow-navigation/arrow-navigation.component';
import { AuthenticationService } from '@shared/services/authentication.service';
import {catchError, debounceTime, map, startWith, take, takeUntil, tap} from 'rxjs/operators';
import {GeographySetsState, Market, MarketSelectionState, MarketSelectorConfig, MarketType} from '@interTypes/marketType';
import { FormControl } from '@angular/forms';
import {combineLatest, Observable, of, Subject} from 'rxjs';
import {InventoryService} from '@shared/services';
import {GeographySet} from '@interTypes/Population';
import {Helper} from '../../../classes';
import { PopulationService } from 'app/population/population.service';
import { PlacesFiltersService } from 'app/places/filters/places-filters.service';

@Component({
  selector: 'imx-market-selector',
  templateUrl: './markets-selection.component.html',
  styleUrls: ['./markets-selection.component.less']
})

export class MarketsSelectionComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  dmaList$: Observable<Market[]> = null;
  cbsaList$: Observable<Market[]> = null;
  countyList$: Observable<Market[]> = null;
  nationalList$: Observable<Market[]> = null;
  private defaultMarkets = [{id: 'global', name: 'United States' }];
  @Input() selectedMarkets: any[] = this.defaultMarkets;
  @Input() activeMarketType: MarketType = 'National';
  @Input() public listOption = 'checkbox';
  @Input() public clearSet: Observable<any>;
  @Input() config: MarketSelectorConfig = {
    cancelButtonLabel: 'CLEAR',
    groupButtonLabel: 'Add as Group',
    singleButtonLabel: 'Add as Individual',
    groupSelectionEnabled: true,
    allowedGeoTypes: ['County', 'CBSA', 'DMA', 'National', 'GEO_SET']
  };
  @Output() resetMarkets: EventEmitter<void> = new EventEmitter<void>();
  @Output() applyMarkets = new EventEmitter<MarketSelectionState | GeographySetsState>();

  public searchCtrl: FormControl = new FormControl();
  public marketSelectionCtrl: FormControl = new FormControl();
  public filteredMarkets$: Observable<any[]> = null;
  public appliedMarkets: any = [];
  public keyboardEventsManager: ListKeyManager<any>;
  @ViewChildren(ArrowNavigationComponent) listItems: QueryList<ArrowNavigationComponent>;
  private mod_permission: any;
  public allowInventory = '';
  public audienceLicense = {};
  private unSubscribe: Subject<void> = new Subject<void>();
  selectedOptions: any = [];
  selectedPreviewOptions: any = [];
  public cdkContainerHeight = 300;

  constructor(private auth: AuthenticationService,
              private inventoryService: InventoryService,
              private populationService: PopulationService,
              private placeFilterService: PlacesFiltersService,
              ) { }

  ngOnInit() {
    // CDK container dynamic height calculation
    this.cdkContainerHeight = window.innerHeight - 515;
    this.dmaList$ = this.inventoryService.getMarketsFromFile();
    this.cbsaList$ = this.inventoryService.getMarketsCBSAFromFile();
    this.countyList$ = this.inventoryService.getDataFromFile('counties');
    this.nationalList$ = of([{id: 'global', name: 'United States' }]);
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    this.selectedOptions = [...this.selectedMarkets ];
    this.appliedMarkets = [...this.selectedMarkets ];
    this.selectedPreviewOptions = [...this.selectedMarkets ];
    this.marketSelectionCtrl.patchValue(this.activeMarketType);
    this.populationService.onReset()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(type => {
      if (type === 'All') {
        this.resetFilter();
      }
    });
    this.placeFilterService.onReset()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(type => {
      if (type === 'All') {
        this.resetFilter();
      }
    });
    this.marketSelectionCtrl.valueChanges
      .pipe(takeUntil(this.unSubscribe)).subscribe(value => {
      if (this.selectedPreviewOptions.length > 0) {
        this.selectedOptions = this.selectedPreviewOptions;
      } else {
        this.selectedOptions = this.appliedMarkets;
        this.selectedPreviewOptions  = Helper.deepClone(this.appliedMarkets);
      }
      this.setMarkets(value);
    });
    this.setMarkets(this.activeMarketType);
    this.resetFilter();
    
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.activeMarketType) {
      this.marketSelectionCtrl.setValue(changes.activeMarketType.currentValue);
    }
    this.setMarkets(this.marketSelectionCtrl.value);
    if (this.marketSelectionCtrl.value !== 'National') {
      this.selectedOptions = this.selectedPreviewOptions;
    }
  }

  public ngAfterViewInit() {
    if (this.listItems['_results']) {
      this.keyboardEventsManager = new ListKeyManager<any>(this.listItems).withWrap().withTypeAhead();
    }
  }

  public resetFilter() {
    this.selectedOptions = [...this.defaultMarkets];
    this.selectedPreviewOptions = [...this.defaultMarkets];
    this.appliedMarkets = [...this.defaultMarkets];
    this.keyboardEventsManager.setActiveItem(null);
    this.marketSelectionCtrl.patchValue('National');
    this.resetMarkets.emit();
    this.searchCtrl.patchValue('');
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
    if (this.marketSelectionCtrl.value !== 'National') {
      this.selectedOptions = this.selectedPreviewOptions;
      this.appliedMarkets = this.selectedOptions;
    }
    let selectionValue = 'all';
    if (this.selectedOptions.length > 1 && type === 'group') {
      selectionValue = 'all';
    } else {
      selectionValue = this.selectedOptions[0]['id'];
    }
    const dataSelected: MarketSelectionState = {
      selectedMarkets: this.selectedOptions,
      selected: selectionValue,
      type: this.marketSelectionCtrl.value,
      submitType: type
    };
    this.applyMarkets.emit(dataSelected);
  }

  private setMarkets(type: MarketType): void {
    switch (type) {
      case 'DMA':
        this.filteredMarkets$ = this.getSearchableStream(this.dmaList$);
        break;
      case 'CBSA':
        this.filteredMarkets$ = this.getSearchableStream(this.cbsaList$);
        break;
      case 'County':
        this.filteredMarkets$ = this.getSearchableStream(this.countyList$);
        break;
      case 'National':
        // Search is disabled for now for national, use the above stream method to enable search for national
        this.filteredMarkets$ = this.nationalList$;
    }
  }
  private getSearchableStream(marketList$: Observable<Market[]>): Observable<Market[]> {
    if (!marketList$) {
      return of(null);
    }
    const marketObservable$: Observable<Market[]> = marketList$.pipe(
      catchError(() => []),
      takeUntil(this.unSubscribe)
    );
    const searchObservable$: Observable<string> = this.searchCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(500),
      takeUntil(this.unSubscribe)
    );
    return combineLatest(marketObservable$, searchObservable$)
      .pipe(map(([markets, searchTerm]) => {
        if (searchTerm.length <= 0) {
          return markets;
        }
        return markets.filter(market => market.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }));
  }
  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  public onSelectOptions(selectedMarket) {
    // Saving selected options in separate var to maintaing selection when switching b/w DMA & CBSA
    const filterType = this.marketSelectionCtrl.value === 'County' ? 'CNTY' : this.marketSelectionCtrl.value;
    if(this.listOption == 'checkbox') {
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
    } else{
      this.selectedPreviewOptions = [selectedMarket._value];
    }
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
    // The take(1) should just subscribe to the stream once and then stop it. Need to dig into that though.
    this.filteredMarkets$.pipe(take(1))
      .subscribe((res: Market[]) => {
        if (count === 0) {
          /*
            when search is added, we have to do the search again because the stream is resubscribing to the
            valuechanges, which won't return the searched value happened before this subscription.
            So here we are getting the value directly from the field and rerunning the search again.
          */
          const searchTerm = this.searchCtrl.value;
          const results = res.filter(market => market.name.toLowerCase().includes(searchTerm.toLowerCase()));
          this.selectedPreviewOptions = [];
          // Since this is search, we don't want to overwrite any existing additions, so we are using both value below
          [...this.selectedOptions, ...results].map((market) => {
            const exist = this.selectedPreviewOptions.find(previewMarket => market.id === previewMarket.id);
            // removing duplicates that might have been in the array due to merging two arrays
            if (!exist) {
              this.selectedPreviewOptions.push(market);
            }
          });
          this.selectedOptions = this.selectedPreviewOptions;
        } else {
          this.selectedOptions = res.slice(0, count);
          this.selectedPreviewOptions = this.selectedOptions;
        }
      });
  }
  public removeMarket(market) {
    const filterType = this.marketSelectionCtrl.value === 'County' ? 'CNTY' : this.marketSelectionCtrl.value;
    const foundIndex = this.selectedPreviewOptions.findIndex(previewMarket => market.id === previewMarket.id);
    this.selectedOptions.splice(foundIndex, 1);
    this.selectedOptions = this.selectedOptions.filter(option => option['id'].includes(filterType));
    this.selectedPreviewOptions = this.selectedOptions;
  }
  public trackByFn(index, item: Market): any {
    return item.id;
  }

  /**
   * @description
   *
   *  Emit the selected geography set
   *
   * @param selectedGeographySets
   */
  onGeoSetSelected(selectedGeographySets: GeographySet) {
    this.applyMarkets.emit({
      type: 'GEO_SET',
      selectedGeographySets: selectedGeographySets
    });
  }

  /**
   * @description
   *
   *  Reset the selected geography sets
   *
   */
  onGeoSetCleared() {
    this.resetMarkets.emit();
  }
}
