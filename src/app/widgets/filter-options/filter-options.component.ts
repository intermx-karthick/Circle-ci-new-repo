import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { Subject, forkJoin } from 'rxjs';
import {AuthenticationService, InventoryService} from '@shared/services';
import { MarketType } from '@interTypes/marketType';
import { GeographySet } from '@interTypes/Population';
import { PopulationDataService } from '@shared/services/population-data.service';
import {Helper} from '../../classes';

@Component({
  selector: 'app-filter-options',
  templateUrl: './filter-options.component.html',
  styleUrls: ['./filter-options.component.less'],
})
export class FilterOptionsComponent implements OnInit, OnDestroy {

  optionsData = [];
  options: any[] = [];
  searchQuery: any;
  public selectedFilterOptions = [];
  public singleSelectOption = {};
  public selectedDummyFilterOptions = [];
  public selectAllStatus: Boolean = false;
  public method = 'multiple';
  public marketSelectionCtrl: FormControl = new FormControl();
  private unSubscribe: Subject<void> = new Subject<void>();
  cbsaList: any;
  dummyCbsaList: any;
  totalPages: any;
  dmaList: any;
  dummyDmaList: any;
  nationalList: any = [{id: 'global', name: 'United States' }];
  private currentPage = 1;
  public searchCtrl: FormControl = new FormControl();
  public enableCBSA = false;
  dummyCountiesList: any;
  totalCountyPages: any;
  countyList: any;
  public filterName: string;
  public editFilter: false;
  public geoSets: GeographySet[] = [];
  private geoSetPageNo = 1;
  public isPopulationEnabled: boolean;
  public totalGeoSets = 0;
  public enableLoader = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData,
    private dialogRef: MatDialogRef<FilterOptionsComponent>,
    private inventoryService: InventoryService,
    private populationDataService: PopulationDataService,
    private auth: AuthenticationService
  ) { }

  ngOnInit() {
    const populationAccess = this.auth.getModuleAccess('populationLibrary');
    this.isPopulationEnabled = (populationAccess && populationAccess['status'] === 'active');
    this.optionsData = this.dialogData.optionsData;
    if (this.dialogData.enableCBSA) {
      this.enableCBSA = this.dialogData.enableCBSA;
    }
    if (this.dialogData['editFilter']) {
      this.editFilter = this.dialogData['editFilter'];
    }
    this.method = this.dialogData.method;
    this.filterName = this.dialogData.type;
    if (this.method === 'single') {
      this.singleSelectOption = this.dialogData.selectedData;
    } else {
      this.selectedFilterOptions = [...this.dialogData.selectedData];
      this.selectedDummyFilterOptions = [...this.dialogData.selectedData];
      if (this.selectedFilterOptions.length > 0 && this.selectedFilterOptions[0].id === 'all') {
        this.selectedFilterOptions = this.optionsData;
        // this.selectedDummyFilterOptions = this.optionsData;
        this.selectAllStatus = true;
      } else {
        this.selectAllStatus = false;
      }
    }
    this.options = this.optionsData.map(x => Object.assign({}, x));
    this.inventoryService.getMarketsFromFile().pipe(takeUntil(this.unSubscribe)).subscribe(response => {
      this.dmaList = response;
      this.dummyDmaList = response;
      this.setMarkets(this.marketSelectionCtrl.value);
    });
    if (this.dialogData && this.dialogData['type'] === 'Market' && this.enableCBSA) {

      // removed api call and made local json  for cbsa
      const cbsa = this.inventoryService.getMarketsCBSAFromFile().pipe(takeUntil(this.unSubscribe));
      const county = this.inventoryService.getDataFromFile('counties').pipe(takeUntil(this.unSubscribe));
      forkJoin([cbsa, county]).subscribe(results => {
        if (results[0]) {
          this.dummyCbsaList = results[0] || [];
          this.totalPages = Math.ceil(this.dummyCbsaList.length / 100);
          this.cbsaList = this.dummyCbsaList.slice(0, 100);
          this.setMarkets(this.marketSelectionCtrl.value);
        }
        if (results[1]) {
          this.dummyCountiesList = results[1] || [];
          this.totalCountyPages = Math.ceil(this.dummyCountiesList.length / 100);
          this.countyList = this.dummyCountiesList.slice(0, 100);
        }
        this.setMarkets(this.marketSelectionCtrl.value);
      });
      this.marketSelectionCtrl.valueChanges.pipe(takeUntil(this.unSubscribe)).subscribe(value => {
        this.optionsData = [];
        this.searchQuery = '';
        this.searchCtrl.reset('', { emitEvent: false });
        this.currentPage = 1;
        this.setMarkets(value);
        this.selectedFilterOptions = this.getSelectedOptions();
        if (value === 'National') {
          this.selectedFilterOptions = Helper.deepClone(this.nationalList);
          this.selectedDummyFilterOptions = this.selectedFilterOptions;
        }
      });

      if (this.method === 'single') {
        this.marketSelectionCtrl.patchValue(this.singleSelectOption['type'] || 'DMA');
      } else {
        if (this.selectedFilterOptions && this.selectedFilterOptions.length) {
          const id = this.selectedFilterOptions[0]['id'];
          if (id.includes('DMA')) {
            this.marketSelectionCtrl.patchValue('DMA');
          } else if  (id.includes('CNTY')) {
            this.marketSelectionCtrl.patchValue('County');
          } else if  (id.includes('CBSA')) {
            this.marketSelectionCtrl.patchValue('CBSA');
          } else {
            this.marketSelectionCtrl.patchValue('National');
          }
        } else {
          this.marketSelectionCtrl.patchValue('National');
        }
      }
      this.searchCtrl.valueChanges.pipe(
      debounceTime(500),
      takeUntil(this.unSubscribe)).subscribe(search => {
        this.currentPage = 1;
        this.searchQuery = search;
        this.searchMarkets({ search: search });
      });
    }
  }

  /* Function to add selected options
  */
  onAdd() {
    let selectedOptions = this.selectedDummyFilterOptions;
    let marketType = this.marketSelectionCtrl.value;
    if (this.marketSelectionCtrl.value === 'GEO_SET' && this.singleSelectOption) {
      marketType = this.singleSelectOption['market_type'] === 'COUNTY' ? 'CNTY' : this.singleSelectOption['market_type'];
      selectedOptions = this.singleSelectOption['markets'].map(market => {
        return {name: market['geo_name'], id: `${marketType}${market['geo_id']}`};
      });
    }
    this.dialogRef.close({
      selectedOptions: selectedOptions,
      optionsData: this.dialogData.optionsData,
      marketType: marketType,
      addAsGroup: false
    });
  }

  /**
   * Search in local from cbsa json
   * limited if search data more than 100 first 100 will be displayed
   * @param {*} { search } to be searched
   * @memberof FilterOptionsComponent
   */
  public searchMarkets({ search }): void {
    search = search.toUpperCase();
    let filteredData = [];

    switch (this.marketSelectionCtrl.value) {
      case 'County':
        filteredData = this.dummyCountiesList.filter(function (data) { return data.name.toUpperCase().match(search); });
        if (filteredData.length > 100) {
          this.countyList = filteredData.slice(0, 100);
        } else {
          this.countyList = filteredData;
        }
        this.setMarkets(this.marketSelectionCtrl.value);
        break;
      case 'CBSA':
        filteredData = this.dummyCbsaList.filter(function (data) { return data.name.toUpperCase().match(search); });
        if (filteredData.length > 100) {
          this.cbsaList = filteredData.slice(0, 100);
        } else {
          this.cbsaList = filteredData;
        }
        this.setMarkets(this.marketSelectionCtrl.value);
        break;
      case 'GEO_SET':
        this.loadGeoSets(search, true);
        break;
    }
  }

  public searchFilters(data) {
    if (data.emptySearch) {
      this.optionsData = this.options;
    } else {
      // Finding existing selected value and keep at top
      this.optionsData = data.value;
    }
    if (this.selectedDummyFilterOptions.length && this.selectedDummyFilterOptions[0].id === 'all') {
      this.selectedFilterOptions = this.optionsData;
    } else {
      this.selectedFilterOptions = Object.assign([], this.selectedDummyFilterOptions);
    }
  }

  public compare(c1, c2) {
    return c1 && c2 && c1['id'] === c2['id'];
  }
  public onChangeOptions(selectedOption) {
    const selectedType = this.marketSelectionCtrl.value === 'County' ? 'CNTY' : this.marketSelectionCtrl.value;
    if (selectedOption['id'] === 'all') {
      if (this.selectAllStatus) {
        this.selectedFilterOptions = [];
        this.selectAllStatus = false;
      } else {
        this.selectedFilterOptions = this.optionsData;
        this.selectAllStatus = true;
      }
    }
    // checking selected options form the list
    const selectedId = this.selectedDummyFilterOptions.findIndex(opt => opt.id === selectedOption['id']);
    if (selectedId !== -1) {
      this.selectedDummyFilterOptions.splice(selectedId, 1);
    } else {
      this.selectedDummyFilterOptions.push(selectedOption);
    }
    // This code will reset the other market types data when a different type is selected
    if (this.method === 'multi-market' && this.selectedDummyFilterOptions.length) {
      const marketTypes = this.selectedDummyFilterOptions.map(option => option['type']).
      filter(type => type !== selectedType);
      if (marketTypes && marketTypes.length) {
        this.selectedDummyFilterOptions = this.selectedDummyFilterOptions.filter(option =>
           option['id'].includes(selectedType));
      }
    }
    if (this.dialogData.type && this.dialogData.type === 'Operator' && this.selectedFilterOptions.length >= 1) {
      const isSelectedALL = this.selectedFilterOptions.filter(opt => opt['id'] === 'all');
      if (selectedOption['id'] === 'all' && isSelectedALL.length !== 1) {
        this.selectedFilterOptions = [{ id: 'all', name: 'Select All', count: 0 }];
        this.selectedDummyFilterOptions = [{ id: 'all', name: 'Select All', count: 0 }];

      } else if (selectedOption['id'] !== 'all') {
        const index = this.selectedFilterOptions.findIndex(opt => opt.id === 'all');
        if (index !== -1) {
          const dummySelectedOption = Object.assign([], this.selectedFilterOptions);
          dummySelectedOption.splice(index, 1);
          this.selectedFilterOptions = dummySelectedOption;
          const allIndex = this.selectedDummyFilterOptions.findIndex(opt => opt.id === 'all');
          if (allIndex !== -1) {
            this.selectedDummyFilterOptions.splice(allIndex, 1);
          }
          this.selectedDummyFilterOptions = this.selectedFilterOptions;
        }
      } else {
        // this.selectedFilterOptions = [{ id: 'all', name: 'Select All', count: 0 }];
        this.selectedDummyFilterOptions = [{ id: 'all', name: 'Select All', count: 0 }];
      }
      if (this.selectedDummyFilterOptions.length === this.dialogData.optionsData.length - 1) {
        this.selectedFilterOptions = this.optionsData;
        this.selectAllStatus = true;
        this.selectedDummyFilterOptions = [{ id: 'all', name: 'Select All', count: 0 }];
      }
    }

  }
  addTopOption(count = 10) {
    let index = 0;
    if (this.dialogData.type === 'Operator') {
      index = 1;
      count = count + 1;
    }
    const selected = this.optionsData.slice(index, count);
    this.selectedFilterOptions = selected;
    this.selectedDummyFilterOptions = selected;
  }
  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
  private setMarkets(type: MarketType) {
    switch (type) {
      case 'DMA':
        this.optionsData = this.dmaList;
        // this.markets = this.dmaList;
        break;
      case 'CBSA':
        this.optionsData = this.cbsaList;
        // this.markets = this.cbsaList;
        break;
      case 'County':
        this.optionsData = this.countyList;
        // this.markets = this.cbsaList;
        break;
      case 'National':
        this.optionsData = this.nationalList;
        break;
      case 'GEO_SET':
        this.loadGeoSets('', true);
        break;
    }
    if (this.optionsData) {
      this.options = this.optionsData.map(x => Object.assign({}, x));
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
    switch (this.marketSelectionCtrl.value) {
      case 'CBSA':
        if (this.currentPage <= this.totalPages) {
          this.cbsaList = [...this.cbsaList, ...this.dummyCbsaList.filter( (data) => {
            return data.name.toUpperCase().match(this.searchQuery);
          }).slice((this.currentPage - 1) * 100, this.currentPage * 100)];
        }
        this.setMarkets(this.marketSelectionCtrl.value);
        break;
      case 'County':
          if (this.currentPage <= this.totalCountyPages) {
          this.countyList = [...this.countyList, ...this.dummyCountiesList.filter( (data) => {
            return data.name.toUpperCase().match(this.searchQuery);
          }).slice((this.currentPage - 1) * 100, this.currentPage * 100)];
        }
        this.setMarkets(this.marketSelectionCtrl.value);
        break;
      case 'GEO_SET':
        this.loadMoreGeoSets();
        break;
    }
  }
  private getSelectedOptions() {
    const selectedType = this.marketSelectionCtrl.value === 'County' ? 'CNTY' : this.marketSelectionCtrl.value;
    return this.selectedDummyFilterOptions.filter(option => option['id'].includes(selectedType));
  }

  public addAsGroup() {
    const selected = {};
    selected['id'] = '';
    selected['name'] = '';
    let selectedOptions = this.selectedDummyFilterOptions;
    let marketType = this.marketSelectionCtrl.value;
    if (this.marketSelectionCtrl.value === 'GEO_SET' && this.singleSelectOption) {
      marketType = this.singleSelectOption['market_type'] === 'COUNTY' ? 'CNTY' : this.singleSelectOption['market_type'];
      selectedOptions = this.singleSelectOption['markets'].map(market => {
        return {name: market['geo_name'], id: `${marketType}${market['geo_id']}`};
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
    this.dialogRef.close({
      selectedOptions: selectedOptions && selectedOptions.length ? [selected] : [],
      optionsData: this.dialogData.optionsData,
      marketType: marketType,
      addAsGroup: true
    });
  }


  /**
   * This function is to load the Geography sets
   * @param query search text
   */
  private loadGeoSets(query: string = '', loadData = false): void  {
    this.geoSetPageNo = 1;
    this.enableLoader = true;
    this.populationDataService.getAllGeoSets(query).subscribe(response => {
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
    }, error => {
      this.enableLoader = false;
    });
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
          this.optionsData = this.geoSets;
        }
      });
    }
  }
}
