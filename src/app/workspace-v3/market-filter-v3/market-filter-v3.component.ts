import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  ChangeDetectorRef,
  Optional,
  SkipSelf,
  Input,
  EventEmitter,
  Output,
  OnChanges,
  SimpleChanges,
  OnDestroy
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { Subject, forkJoin, BehaviorSubject } from 'rxjs';
import { InventoryService, AuthenticationService } from '@shared/services';
import { takeUntil, debounceTime, filter } from 'rxjs/operators';
import { GeographySet } from '@interTypes/Population';
import { PopulationDataService } from '@shared/services/population-data.service';
import { MarketType } from '@interTypes/marketType';
import { Helper } from 'app/classes';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-market-filter-v3',
  templateUrl: './market-filter-v3.component.html',
  styleUrls: ['./market-filter-v3.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketFilterV3Component implements OnInit, OnChanges, OnDestroy {
  public optionsData = [];
  @Input() selectedMarketsData = [];
  @Input() hideClearBtn = false;
  @Input() deleteMarket: Subject<any>;
  @Output() select = new EventEmitter();
  @Output() updateSelectedMarketsList: EventEmitter<any> = new EventEmitter();
  options: any[] = [];
  searchQuery: any;
  public selectedFilterOptions = [];
  public singleSelectOption = {};
  public selectedDummyFilterOptions = [];
  private unSubscribe: Subject<void> = new Subject<void>();
  cbsaList: any;
  dummyCbsaList: any;
  totalPages: any;
  dmaList: any;
  dummyDmaList: any;
  nationalList: any = [{ id: 'global', name: 'United States' }];
  private currentPage = 1;
  public searchCtrl: FormControl = new FormControl();
  dummyCountiesList: any;
  totalCountyPages: any;
  countyList: any;

  public geoSets: GeographySet[] = [];
  private geoSetPageNo = 1;
  public isPopulationEnabled: boolean;
  public totalGeoSets = 0;
  public enableLoader = false;

  public selectedMarketTab = 0;
  public selectedMarketLabel: MarketType = 'National';
  public disableInfiniteScroll = true;
  constructor(
    @Optional()
    @SkipSelf()
    private dialogRef: MatDialogRef<MarketFilterV3Component>,
    private inventoryService: InventoryService,
    private populationDataService: PopulationDataService,
    private cdRef: ChangeDetectorRef,
    private auth: AuthenticationService,
    private workspaceV3Service: WorkspaceV3Service,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const populationAccess = this.auth.getModuleAccess('populationLibrary');
    this.isPopulationEnabled =
      populationAccess && populationAccess['status'] === 'active';

    this.setSelectedOptions(this.selectedMarketsData, true);
    if (this.dialogData?.selectedMarketsData) {
      this.setSelectedOptions(this.dialogData.selectedMarketsData,true);
    }
    this.inventoryService
      .getMarketsFromFile()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((response) => {
        this.dmaList = response;
        this.dummyDmaList = response;
        this.setMarkets(this.selectedMarketLabel);
      });

    const cbsa = this.inventoryService
      .getMarketsCBSAFromFile()
      .pipe(takeUntil(this.unSubscribe));
    const county = this.inventoryService
      .getDataFromFile('counties')
      .pipe(takeUntil(this.unSubscribe));
    forkJoin([cbsa, county]).subscribe((results) => {
      if (results[0]) {
        this.dummyCbsaList = results[0] || [];
        this.totalPages = Math.ceil(this.dummyCbsaList.length / 100);
        this.cbsaList = this.dummyCbsaList.slice(0, 100);
        this.setMarkets(this.selectedMarketLabel);
      }
      if (results[1]) {
        this.dummyCountiesList = results[1] || [];
        this.totalCountyPages = Math.ceil(this.dummyCountiesList.length / 100);
        this.countyList = this.dummyCountiesList.slice(0, 100);
      }
      this.setMarkets(this.selectedMarketLabel);
    });

    this.searchCtrl.valueChanges
      .pipe(debounceTime(500), takeUntil(this.unSubscribe))
      .subscribe((search) => {
        this.currentPage = 1;
        this.searchQuery = search;
        this.searchMarkets({ search: search });
      });
    this.listenForClearFilters();
    if (this.deleteMarket) {
      this.deleteMarket.subscribe((data) => {
        const marketIndex = this.selectedMarketsData.findIndex((d) => d['id'] === data['id']);
        this.removeSelectedMarket(
          this.selectedMarketsData[marketIndex],
          marketIndex
        );
      });
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    // if (changes.selectedMarketsData) {
    //   this.setSelectedOptions(changes.selectedMarketsData.currentValue);
    // }
  }
  public trackMarkets(index, item) {
    return item;
  }
  private setSelectedOptions(options, initial = false) {
    this.selectedDummyFilterOptions = [...options];
    this.selectedFilterOptions = [...options];
    if(initial){    
      if(this.selectedDummyFilterOptions?.[0]?.['id']){
        this.setMarketTabSelection(this.selectedDummyFilterOptions?.[0]?.['id'])
      }else if(this.selectedDummyFilterOptions?.[0]?.['id'] == "" && this.selectedDummyFilterOptions?.[0]?.marketsGroup?.[0]?.['id']){
        this.setMarketTabSelection(this.selectedDummyFilterOptions?.[0]?.marketsGroup?.[0]?.['id']);
      }
    }
  }

  setMarketTabSelection(id:string) {
      if(id){
        if(id.includes('DMA')){
          this.selectedMarketLabel = 'DMA';
          this.selectedMarketTab = 1;
        }else if(id.includes('CBSA')){
          this.selectedMarketLabel = 'CBSA';
          this.selectedMarketTab = 2;
        }else if(id.includes('CNTY')){
          this.selectedMarketLabel = 'County';
          this.selectedMarketTab = 3;
        }else{
          this.selectedMarketLabel = 'National';
          this.selectedMarketTab = 0;
        }
      }
  }

  public searchFilters(data) {
    if (data.emptySearch) {
      this.optionsData = this.options;
    } else {
      // Finding existing selected value and keep at top
      this.optionsData = data.value;
    }
    if (
      this.selectedDummyFilterOptions.length &&
      this.selectedDummyFilterOptions[0].id === 'all'
    ) {
      this.selectedFilterOptions = this.optionsData;
    } else {
      this.selectedFilterOptions = Object.assign(
        [],
        this.selectedDummyFilterOptions
      );
    }
  }

  clearMarket() {
    this.selectedDummyFilterOptions = [];
    this.selectedFilterOptions = [];
    this.singleSelectOption = {};
    this.selectedMarketsData= [];
  }

  /* Function to add selected options
   */
  onAddSelectedMarket() {
    let selectedOptions = this.selectedDummyFilterOptions;
    let marketType = this.selectedMarketLabel;
    if (this.selectedMarketLabel === 'GEO_SET' && this.singleSelectOption) {
      marketType =
        this.singleSelectOption['market_type'] === 'COUNTY'
          ? 'CNTY'
          : this.singleSelectOption['market_type'];
      selectedOptions = this.singleSelectOption['markets'].map((market) => {
        return {
          name: market['geo_name'],
          id: `${marketType}${market['geo_id']}`
        };
      });
    }

    const data = {
      selectedOptions: selectedOptions,
      marketType: marketType,
      addAsGroup: false
    };
    // selected market to scenario view sidenav filter
    if (!this.dialogData && !this.dialogRef) {
      this.select.emit(data);
      return;
    }
    this.dialogRef.close(data);
  }

  public compare(c1, c2) {
    return c1 && c2 && c1['id'] === c2['id'];
  }

  public onChangeOptions(selectedOption) {
    const selectedType =
      this.selectedMarketLabel === 'County' ? 'CNTY' : this.selectedMarketLabel;
    // checking selected options form the list
    const selectedId = this.selectedDummyFilterOptions.findIndex(
      (opt) => opt.id === selectedOption['id']
    );
    if (selectedId !== -1 ) {
      this.selectedDummyFilterOptions.splice(selectedId, 1);
    } else {
      if (selectedType === 'National') {
        this.selectedDummyFilterOptions = [selectedOption];
      } else {
        this.selectedDummyFilterOptions.push(selectedOption);
      }
    }
    // This code will reset the other market types data when a different type is selected
    if (selectedType !== 'National') {
      this.selectedDummyFilterOptions = this.selectedDummyFilterOptions.filter(
        (option) => option['id'].includes(selectedType)
      );
    }
    /* if (selectedType === 'National') {
      this.selectedDummyFilterOptions = JSON.parse(
        JSON.stringify(this.nationalList)
      );
    } else {
      this.selectedDummyFilterOptions = this.selectedDummyFilterOptions.filter(
        (option) => option['id'].includes(selectedType)
      );
    } */
  }

  closeDialogBox() {
    this.dialogRef.close();
  }

  onSelectMarketType(event) {
    this.optionsData = [];
    this.searchQuery = '';
    this.searchCtrl.reset('', {
      emitEvent: false
    });
    if(this.selectedMarketLabel === 'CBSA' || this.selectedMarketLabel === 'County') {
      this.searchMarkets({ search: '' });
    }
    this.currentPage = 1;
    this.selectedMarketTab = event?.index;
    this.selectedMarketLabel = event?.tab?.ariaLabel;
    this.cdRef.markForCheck();
    this.setMarkets(this.selectedMarketLabel);
    // if (this.selectedMarketLabel === 'National') {
    //   this.selectedFilterOptions = Helper.deepClone(this.nationalList);
    //   this.selectedDummyFilterOptions = this.selectedFilterOptions;
    // }
    this.disableInfiniteScroll = false;
  
  }

  private setMarkets(type: MarketType) {
    switch (type) {
      case 'DMA':
        this.optionsData = this.dmaList;
        break;
      case 'CBSA':
        this.optionsData = this.cbsaList;
        break;
      case 'County':
        this.optionsData = this.countyList;
        break;
      case 'National':
        this.optionsData = this.nationalList;
        break;
      case 'GEO_SET':
        this.loadGeoSets('', true);
        break;
    }
    if (this.optionsData) {
      this.options = this.optionsData.map((x) => Object.assign({}, x));
    }
    this.setSelectedOptions(this.selectedDummyFilterOptions);
    this.cdRef.markForCheck();
  }

  /**
   * Search in local from cbsa json
   * limited if search data more than 100 first 100 will be displayed
   * @param {*} { search } to be searched
   * @memberof FilterOptionsComponent
   */
  public searchMarkets({ search }): void {
    this.disableInfiniteScroll = false;
    search = search.toUpperCase();
    let filteredData = [];
    switch (this.selectedMarketLabel) {
      case 'County':
        filteredData = this.dummyCountiesList.filter(function (data) {
          return data.name.toUpperCase().match(search);
        });
        if (filteredData.length > 100) {
          this.countyList = filteredData.slice(0, 100);
        } else {
          this.countyList = filteredData;
        }
        this.setMarkets(this.selectedMarketLabel);
        break;
      case 'CBSA':
        filteredData = this.dummyCbsaList.filter(function (data) {
          return data.name.toUpperCase().match(search);
        });
        if (filteredData.length > 100) {
          this.cbsaList = filteredData.slice(0, 100);
        } else {
          this.cbsaList = filteredData;
        }
        this.setMarkets(this.selectedMarketLabel);
        break;
      case 'GEO_SET':
        this.loadGeoSets(search, true);
        break;
    }
  }

  /**
   * Filter data for infinite scroll
   *
   * @private
   * @memberof FilterOptionsComponent
   */
  public loadMore() {
    this.currentPage += 1;
    switch (this.selectedMarketLabel) {
      case 'CBSA':
        if (this.cbsaList.length > this.totalPages * 100) {
          this.disableInfiniteScroll = true;
        } else {
          this.disableInfiniteScroll = false;
        }
        if (this.currentPage <= this.totalPages) {
          this.cbsaList = [
            ...this.cbsaList,
            ...this.dummyCbsaList
              .filter((data) => {
                return data.name.toUpperCase().match(this.searchQuery);
              })
              .slice((this.currentPage - 1) * 100, this.currentPage * 100)
          ];
        }
        this.setMarkets(this.selectedMarketLabel);
        break;
      case 'County':
        if (this.countyList.length > this.totalCountyPages * 100) {
          this.disableInfiniteScroll = true;
        } else {
          this.disableInfiniteScroll = false;
        }
        if (this.currentPage <= this.totalCountyPages) {
          this.countyList = [
            ...this.countyList,
            ...this.dummyCountiesList
              .filter((data) => {
                return data.name.toUpperCase().match(this.searchQuery);
              })
              .slice((this.currentPage - 1) * 100, this.currentPage * 100)
          ];
        }
        this.setMarkets(this.selectedMarketLabel);
        break;
      case 'GEO_SET':
        this.loadMoreGeoSets();
        break;
    }
  }

  /**
   * This function is to load the Geography sets
   * @param query search text
   */
  private loadGeoSets(query: string = '', loadData = false): void {
    this.geoSetPageNo = 1;
    this.enableLoader = true;
    this.populationDataService.getAllGeoSets(query).subscribe(
      (response) => {
        if (response['pagination'] && response['pagination']['total'] > 0) {
          this.geoSets = response['results'];
          this.totalGeoSets = response['pagination']['total'];
        } else {
          this.geoSets = [];
          this.totalGeoSets = 0;
        }
        this.enableLoader = false;
        if (loadData) {
          this.optionsData = this.geoSets;
        }
        this.cdRef.markForCheck();
      },
      (error) => {
        this.enableLoader = false;
        this.cdRef.markForCheck();
      }
    );
  }
  /**
   * This method is for Geography sets pagination
   */
  private loadMoreGeoSets(): void {
    if (this.geoSets.length < this.totalGeoSets) {
      this.disableInfiniteScroll = false;
      this.geoSetPageNo += 1;
      this.populationDataService
        .getAllGeoSets(this.searchQuery, this.geoSetPageNo)
        .subscribe((response) => {
          if (response['results'] && response['results'].length > 0) {
            this.geoSets.push(...response['results']);
            this.optionsData = this.geoSets;
          }
        });
    } else {
      this.disableInfiniteScroll = true;
    }
    this.cdRef.markForCheck();
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  public addAsGroup() {
    const selected = {};
    selected['id'] = '';
    selected['name'] = '';
    let selectedOptions = this.selectedDummyFilterOptions;
    let marketType = this.selectedMarketLabel;
    if (this.selectedMarketLabel === 'GEO_SET' && this.singleSelectOption) {
      marketType =
        this.singleSelectOption['market_type'] === 'COUNTY'
          ? 'CNTY'
          : this.singleSelectOption['market_type'];
      selectedOptions = this.singleSelectOption['markets'].map((market) => {
        return {
          name: market['geo_name'],
          id: `${marketType}${market['geo_id']}`
        };
      });
    }
    selected['marketsGroup'] = selectedOptions.map((option, i) => {
      if (i === 0) {
        selected['name'] += option.name;
      } else {
        selected['name'] += ',' + option.name;
      }
      return { id: option.id, name: option.name };
    });
    const data = {
      selectedOptions: selectedOptions?.length ? [selected] : [],
      marketType: marketType,
      addAsGroup: true
    };
    // selected market to scenario view sidenav filter
    if (!this.dialogData && !this.dialogRef) {
      this.select.emit(data);
      return;
    }
    this.dialogRef.close(data);
  }
  public removeMarket(market) {
    const filterType = this.selectedMarketLabel === 'County' ? 'CNTY' : this.selectedMarketLabel;

    const foundIndex = this.selectedDummyFilterOptions.findIndex(previewMarket => market.id === previewMarket.id);
    if (foundIndex > -1) {
      this.selectedDummyFilterOptions.splice(foundIndex, 1);
    }
    /** Include only selected market type values */
    this.selectedDummyFilterOptions = this.selectedDummyFilterOptions.filter(previewMarket => previewMarket['id'].includes(filterType));

    const index = this.selectedFilterOptions.findIndex(previewMarket => market.id === previewMarket.id);
    if (index > -1) {
      this.selectedFilterOptions.splice(index, 1);
    }
    /** Include only selected market type values */
    this.selectedFilterOptions = this.selectedFilterOptions.filter(option => option['id'].includes(filterType));
  }

  public removeSelectedMarket(market, index) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(filter((result) => result && result['action']))
      .subscribe((result) => {
        this.selectedMarketsData.splice(index, 1);
        this.updateSelectedMarketsList.emit(this.selectedMarketsData);
      });
  }
  private listenForClearFilters(){
    this.workspaceV3Service.clearScenarioFilters$.pipe(
      takeUntil(this.unSubscribe)
    ).subscribe(()=>{
      this.clearMarket();
      this.cdRef.markForCheck();
    })
  }

}
