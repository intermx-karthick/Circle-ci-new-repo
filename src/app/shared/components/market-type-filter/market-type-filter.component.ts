import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, AfterContentInit } from '@angular/core';
import { InventoryService } from '@shared/services';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SelectionType, ModuleName, MarketType } from '@interTypes/marketType';
import { GeographySet } from '@interTypes/Population';
import { PopulationDataService } from '@shared/services/population-data.service';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';

@Component({
  selector: 'app-market-type-filter',
  templateUrl: './market-type-filter.component.html',
  styleUrls: ['./market-type-filter.component.less']
  
})
export class MarketTypeFilterComponent extends AbstractLazyLoadComponent implements AfterContentInit, OnDestroy {

  @Input() selectionType: SelectionType;
  @Input() module: ModuleName;
  private unSubscribe: Subject<void> = new Subject<void>();
  private allDMA: any = [];
  private allCBSA: any = [];
  private allCounties: any = [];
  public activeDMA: any = [];
  public activeCBSA: any = [];
  public activeCounties: any = [];
  public nationalList = [{id: 'global', name: 'United States' }];
  public inventoryMarketData;
  public totalPages = 0;
  public totalCountyPages = 0;
  public geoSets: GeographySet[] = [];
  private geoSetPageNo = 1;
  public totalGeoSets = 0;
  searchQuery: any;
  searchedMarkets: any[];
  // for my saved geo sets initi
  isInitialLoadCompleted: boolean;
  unsubscribeInitiator$: Subject<void> = new Subject();

  constructor(
    private inventoryService: InventoryService,
    private populationDataService: PopulationDataService) {
    super();
    this.inventoryService.getMarketsFromFile()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(response => {
        this.allDMA = response || [];
        this.activeDMA = response || [];
      });
    this.inventoryService.getMarketsCBSAFromFile().pipe(takeUntil(this.unSubscribe)).subscribe(
      response => {
        this.allCBSA = response || [];
        this.totalPages = Math.ceil(this.allCBSA.length / 100);
        this.activeCBSA = this.allCBSA.slice(0, 100);
      }
    );
    this.inventoryService.getDataFromFile('counties').pipe(takeUntil(this.unSubscribe)).subscribe(
      response => {
        this.allCounties = response || [];
        this.totalCountyPages = Math.ceil(this.allCounties.length / 100);
        this.activeCounties = this.allCounties.slice(0, 100);
      }
    );
  }

  ngAfterContentInit(): void {
    this.listenerForInitialLoad();
  }

  init(): void {
    this.loadGeoSets();
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  /**
   * Search in local from cbsa json
   * limited if search data more than 100 first 100 will be displayed
   * @param {*} { search } to be searched
   * @param params It is an object containing search text and market type values
   */
  public searchMarkets({search, type}): void {
    this.searchQuery = search.toUpperCase();
    let filteredData = [];

    switch (type) {
      case 'DMA':
        this.activeDMA = this.allDMA.filter(data => {
          return data.name.toUpperCase().match(this.searchQuery);
        });
        this.searchedMarkets = this.activeDMA;
        break;
      case 'CBSA':
        filteredData = this.allCBSA.filter(data => {
          return data.name.toUpperCase().match(this.searchQuery);
        });
        if (filteredData.length > 100) {
          this.activeCBSA = filteredData.slice(0, 100);
        } else {
          this.activeCBSA = filteredData;
        }
        this.searchedMarkets = filteredData;
        break;
      case 'County':
        filteredData = this.allCounties.filter(data => {
          return data.name.toUpperCase().match(this.searchQuery);
        });
        if (filteredData.length > 100) {
          this.activeCounties = filteredData.slice(0, 100);
        } else {
          this.activeCounties = filteredData;
        }
        this.searchedMarkets = filteredData;
        break;
      case 'GEO_SET':
        this.loadGeoSets(this.searchQuery);
        break;
    }
  }

  /**
   * This function is for markets pagination
   * @param page It is an object containing search index of the array
   */
  public loadMoreMarkets({page, type}) {
    switch (type) {
      case 'CBSA':
        this.activeCBSA = [...this.activeCBSA, ...this.allCBSA.filter( (data) => {
          return data.name.toUpperCase().match(this.searchQuery);
        }).slice((page - 1) * 100, page * 100)];
        break;
      case 'County':
        this.activeCounties = [...this.activeCounties, ...this.allCounties.filter( (data) => {
          return data.name.toUpperCase().match(this.searchQuery);
        }).slice((page - 1) * 100, page * 100)];
        break;
      case 'GEO_SET':
        this.loadMoreGeoSets();
        break;
    }
  }

  /**
   * This function is to reset the markets data
   * @param type
   */
  public resetMarkets(type: MarketType) {
    switch ( type) {
      case 'DMA':
        this.activeDMA = this.allDMA;
        break;
      case 'CBSA':
        this.activeCBSA = [...this.activeCBSA, ...this.allCBSA.filter( (data) => {
          return data.name.toUpperCase().match(this.searchQuery);
        }).slice(0, 100)];
        break;
      case 'GEO_SET':
        this.loadGeoSets();
        break;
    }
  }

  /**
   * This function is to load the Geography sets
   * @param query search text
   */
  private loadGeoSets(query: string = ''): void  {
    this.geoSetPageNo = 1;
    this.populationDataService.getAllGeoSets(query).subscribe(response => {
      this.destroyInitiator();
      if (response['pagination'] && response['pagination']['total'] > 0) {
        this.geoSets = response['results'];
        this.totalGeoSets = response['pagination']['total'];
      } else {
        this.geoSets = [];
        this.totalGeoSets = 0;
      }
    }, (err)=>this.destroyInitiator());
  }
  /**
   * This method is for Geography sets pagination
   */
  private loadMoreGeoSets(): void  {
    if (this.geoSets.length < this.totalGeoSets) {
      this.geoSetPageNo += 1;
      this.populationDataService.getAllGeoSets(this.searchQuery , this.geoSetPageNo).subscribe(response => {
        if (response['results'] && response['results'].length > 0) {
          this.geoSets.push(...response['results']);
        }
      });
    }
  }
}
