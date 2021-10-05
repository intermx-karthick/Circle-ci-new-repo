import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Renderer2
} from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { PlaceTypeList } from '@interTypes/placeTypeList';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { PlacesFiltersService } from './../places-filters.service';
import { PlacesElasticsearchService } from '../places-elasticsearch.service';
import { CommonService, ExploreService } from '@shared/services';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged, map } from 'rxjs/operators';
import turfCenter from '@turf/center';
import turfCircle from '@turf/circle';
import * as turfHelper from '@turf/helpers';

@Component({
  selector: 'app-places-details-search',
  templateUrl: './places-details-search.component.html',
  styleUrls: ['./places-details-search.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlacesDetailsSearchComponent implements OnInit, OnChanges {
  treeControl: NestedTreeControl<PlaceTypeList>;
  dataSource: MatTreeNestedDataSource<PlaceTypeList>;
  @Input() filterData = {};
  @Input() summary = {};
  @Input() placeTypes = [];
  @Input() filterOptions = [];
  @Input() appliedLocationFilterType = '';
  @Output() pushFilter: EventEmitter<any> = new EventEmitter();
  @Output() pushFilterLevel: EventEmitter<any> = new EventEmitter();
  // polygons filter related
  @Output() drawPolygon: EventEmitter<any> = new EventEmitter();
  @Output() drawCircularPolygon: EventEmitter<any> = new EventEmitter();
  @Output() geoPolygon: EventEmitter<any> = new EventEmitter();
  @Output() removePolygon: EventEmitter<any> = new EventEmitter();
  @Output() filterLocationsByRadius: EventEmitter<any> = new EventEmitter();
  // -- end --
  public searchKeyForm: FormGroup;
  public hideFilters = false;
  public showSearchField = false;
  public placeTypesQuery = '';
  public totalPlaceTypesCount = 0;
  public brands = [];
  public industries = [];
  filterSessionData: any;
  // polygons filter related
  public locationFiltercollapsed = false;
  public searchLocationForm: FormGroup;
  public searchMarketForm: FormGroup;
  private unSubscribe: Subject<void> = new Subject<void>();
  public selectedPlaceName: string;
  public autocompletePlaces = [];
  public fetchingSuggestion = false;
  selectedSearchPlace = {};
  isOpenedCategory = true;
  noAutoComplete = false;
  public fetchingMarkets = false;
  public selectedMarket: any = {};
  public marketsData: any = [];
  public isMarketlocationAvailable = false;
  // -- end --
  constructor(
    private fb: FormBuilder,
    private placeFilterService: PlacesFiltersService,
    private renderer: Renderer2,
    private commonService: CommonService,
    private cdRef: ChangeDetectorRef,
    private exploreService: ExploreService,
    private elasticsearchService: PlacesElasticsearchService,
  ) {
    this.treeControl = new NestedTreeControl<PlaceTypeList>(this.getChildren);
    this.dataSource = new MatTreeNestedDataSource();
  }

  public ngOnInit() {
    // this.searchKeyForm = this.fb.group({
    //   keyword: ['', Validators.required]
    // });
    this.searchLocationForm = this.fb.group({
      'location': ['', Validators.required],
      'distance': ['', Validators.required]
    });
    this.searchMarketForm = this.fb.group({
      'market': ['', Validators.required]
    });
    this.placeFilterService.setFilterLevel({ searchHide: this.hideFilters });
    // if (this.filterData['key']) {
    //   this.searchKeyForm.patchValue({
    //     keyword: this.filterData['key']
    //   });
    // }

    this.searchLocationForm.controls['location'].valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.unSubscribe))
      .subscribe(value => {
        if (value) {
          if (this.selectedPlaceName !== value) {
            this.autocompletePlace(value);
          }
        } else {
          this.commonService.setDropdownState(false);
        }
      });

    this.searchMarketForm.controls['market'].valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.unSubscribe)).subscribe(value => {
      if (value) {
        this.autoCompleteMarkets(value);
      }
    });
    this.loadSession();
  }
  private loadSession() {
    this.filterSessionData = this.placeFilterService.getPlacesSession();
    if (this.filterSessionData['appliedPolygonType']) {
      if (this.filterSessionData['appliedPolygonType'] === 'filterLocationByRadius') {
        this.searchLocationForm.patchValue({
          location: this.filterSessionData['autoCompleteSelectedPlace'],
          distance: this.filterSessionData['filters']['address']['distance']
        });
        this.noAutoComplete = true;
      }
      if (this.filterSessionData['appliedPolygonType'] === 'filterLocationByMarket') {
        this.searchMarketForm.patchValue({
          market: this.filterSessionData['marketFeature']['properties']['name']
        });
        if (this.filterSessionData['selectedGeoMarket']) {
          this.selectedMarket = this.filterSessionData['selectedGeoMarket'];
        }
        this.noAutoComplete = true;
      }
      this.appliedLocationFilterType = this.filterSessionData['appliedPolygonType'];
    }

  }
  public ngOnChanges(changes: SimpleChanges) {
    this.filterSessionData = this.placeFilterService.getPlacesSession();
    if (changes.placeTypes) {
      this.dataSource.data = this.generatePlaceTypes(this.placeTypes);
    }
    if (changes.filterOptions) {
      if (this.brands.length <= 0
        || !(this.filterSessionData && this.filterSessionData['filters'] && this.filterSessionData['filters']['brandList'])) {
        const brands = [];
        const tempBrands = changes.filterOptions.currentValue['brands'];
        if (tempBrands) {
          tempBrands.forEach(b => {
            brands.push({name: b.name, value: b.name, count: b.count});
          });
          this.brands = brands;
        }
      } else {
        this.updateBrands(changes.filterOptions.currentValue['brands']);
      }
      if (this.industries.length <= 0
        || !(this.filterSessionData && this.filterSessionData['filters'] && this.filterSessionData['filters']['industriesList'])) {
        const industries = [];
        const tempIndustries = changes.filterOptions.currentValue['industries'];
        if (tempIndustries) {
          tempIndustries.forEach(i => {
            industries.push({name: i.name, value: i.code, count: i.count});
          });
        }
        this.industries = industries;
      } else {
        this.updateIndustries(changes.filterOptions.currentValue['industries']);
      }
    }
    this.cdRef.markForCheck();
  }
  private updateIndustries(industries) {
    industries.forEach(industry => {
      const index = this.industries.findIndex(industryObj => industryObj.value === industry.code);
      if (index > -1) {
        this.industries[index].count = industry.count;
      } else {
        this.industries.push({name: industry.name, value: industry.code, count: industry.count});
      }
    });
  }
  private updateBrands(brands) {
    brands.forEach(brand => {
      const index = this.brands.findIndex(brandObj => brandObj.name === brand.name);
      if (index > -1) {
        this.brands[index].count = brand.count;
      } else {
        this.brands.push({name: brand.name, value: brand.name, count: brand.count});
      }
    });
  }
  public onSubmit(formGroup: FormGroup) {
    if (formGroup.valid) {
      this.applyFilters('location');
    }
  }
  public resetForm(emit = true) {
    if (emit && this.searchLocationForm.getRawValue()['location']) {
      this.removePolygon.emit();
    }
    this.selectedSearchPlace = {};
    this.searchLocationForm.reset();
    this.searchLocationForm.markAsPristine();
  }
  public generatePlaceTypes(placeTypesData) {
    this.totalPlaceTypesCount = 0;
    const placeTypes: PlaceTypeList[] = [];
    placeTypesData.forEach(category => {
      const placeType: PlaceTypeList = {
        name: category.top_category,
        selected: false,
        loadMoreChild: category.sub_categories.length > 3,
        count: 0
      };
      const options: PlaceTypeList[] = [];
      category.sub_categories.forEach(subCategory => {
        placeType.count += subCategory.count;
        this.totalPlaceTypesCount += subCategory.count;
        options.push({
          name: subCategory.name,
          selected: false,
          loadMoreChild: false,
          count: subCategory.count
        });
      });
      options.sort((a, b) => b.count - a.count);
      placeType.options = options;
      placeTypes.push(placeType);
    });
    if (this.filterData && this.filterData['placeTypeList'] && this.filterData['placeTypeList'].length > 0) {
      placeTypes.forEach(category => {
        if (this.filterData['placeTypeList'].findIndex(name => category.name === name) >= 0) {
          category.selected = true;
        }
        category.options.forEach(subCategory => {
          if (this.filterData['placeTypeList'].findIndex(name => subCategory.name === name) >= 0) {
            subCategory.selected = true;
          }
        });
      });
    }
    placeTypes.sort((a, b) => b.count - a.count);
    return placeTypes;
  }
  private getChildren(node: PlaceTypeList): PlaceTypeList[] {
    return node.options;
  }
  public hasChild(index: number, node: PlaceTypeList) {
    return node.options && node.options.length > 0;
  }
  public isSelected(node: PlaceTypeList) {
    return node.selected && !this.isPartiallySelected(node);
  }
  public isAllChildSelected(node: PlaceTypeList) {
    const all = node.options.every(item => item.selected);
    if (all) {
      node.selected = true;
    }
    return all;
  }
  public isPartiallySelected(node: PlaceTypeList) {
    if (!node.options) {
      return false;
    }
    const partial = node.options.some(item => item.selected);
    return partial && !this.isAllChildSelected(node);
  }

  public toggleSelection(node: PlaceTypeList) {
    if (!node.options) {
      this.dataSource.data.forEach(filterGroup => {
        const filterItem = filterGroup.options.find(item => item === node);
        if (filterItem) {
          filterGroup.selected = false; // !node.selected;
        }
      });
    }
    node.selected = !node.selected;
    if (node.options && node.options.length > 0) {
      node.options.map(item => {
        item.selected = node.selected;
      });
    }
    this.applyFilters('placeTypes', node);
  }

  private applyFilters(filterType, values: any = null) {
    const filterSessionData = this.placeFilterService.getPlacesSession();

    if (filterSessionData['filters']['summaryId']) {
      this.filterData['summaryId'] = filterSessionData['filters']['summaryId'];
    }
    switch (filterType) {
      case 'placeTypes':
        let selectedPlaceTypes = [];
        selectedPlaceTypes = this.getSelectedPlaceTypes(filterType);
        this.filterData['placeTypeList'] = selectedPlaceTypes;
        this.pushFilter.emit({filter: this.filterData, placeTypesInit: false});
        break;
      case 'industry':
        if (values.length > 0) {
          this.filterData['industriesList'] = values;
        } else {
          delete this.filterData['industriesList'];
        }
        this.pushFilter.emit({ filter: this.filterData, placeTypesInit: false });
        break;
      // case 'key':
      //   this.filterData['key'] = this.searchKeyForm.value['keyword'];
      //   this.pushFilter.emit({filter: this.filterData, placeTypesInit: false});
      case 'location':
        this.resetMarketSearch(false);
        this.searchByRadius();
        break;
      case 'brand':
        if (values.length > 0) {
          this.filterData['brandList'] = values;
        } else {
          delete this.filterData['brandList'];
        }
        this.pushFilter.emit({filter: this.filterData, placeTypesInit: false});
        break;
      case 'market':
        this.resetForm(false);
        this.searchByMarket();
        break;
    }
  }
  /**
   *
   * @param placeType This placeType is current selected node
   *  to check whether it is unseclected or not to include it in filter when seraching placetypes
   */
  private getSelectedPlaceTypes(placeType) {
    const selectedPlaceTypes = [];
    this.dataSource.data.forEach(category => {
      category.options.forEach(subCategory => {
        if (subCategory.selected) {
          selectedPlaceTypes.push(subCategory.name);
        }
      });
    });
    if (placeType['name'] && this.placeTypesQuery) {
      const filters = [...this.filterData['placeTypeList']];
      if (placeType['options']) {
        const filterKeys = placeType.options.map(option => option.name);
        filterKeys.forEach(key => {
          const index = filters.findIndex(name => key === name);
          if (index >= 0) {
            const option = placeType.options.find(name => name === key);
            if (!option.selected) {
              filters.splice(index, 1);
            }
          }
        });
      } else {
        const index = filters.findIndex(name => placeType.name === name);
        if (index >= 0) {
          if (!placeType.selected) {
            filters.splice(index, 1);
          }
        }
      }
      selectedPlaceTypes.push(...filters);
    }
    return selectedPlaceTypes;
  }
  public goBack() {
    this.placeFilterService.savePlacesSession('filters', {});
    this.removePolygon.emit(false);
    this.appliedLocationFilterType = '';
    this.placeFilterService.savePlacesSession('placeDetail', {});
    this.placeFilterService.savePlacesSession('radiusPolyFeatureCollection', '');
    this.placeFilterService.savePlacesSession('appliedPolygonType', '');
    this.placeFilterService.savePlacesSession('autoCompleteSelectedPlace', '');
    this.pushFilterLevel.emit(1);
  }

  public disableFilters() {
    this.hideFilters = true;
    this.placeFilterService.setFilterLevel({ searchHide: this.hideFilters });
  }

  public showFilters() {
    this.hideFilters = false;
    this.placeFilterService.setFilterLevel({ searchHide: this.hideFilters });
  }

  public filterPlaceTypes(eventData) {
    if (!eventData || eventData === '') {
      this.resetSearch();
      return;
    }
    const searchTerm = eventData.toLowerCase().trim();
    const filteredPlaceTypes = this.placeTypes.filter(item => {
      if (item.top_category.toLowerCase().indexOf(searchTerm) !== -1) {
        return true;
      } else {
        item.sub_categories.forEach(sub_category => {
          if (sub_category.name.toLowerCase().indexOf(searchTerm) !== -1) {
            return true;
          }
        });
      }
    });
    this.dataSource.data = this.generatePlaceTypes(filteredPlaceTypes);
  }
  public showSearch() {
    this.showSearchField = !this.showSearchField;
    if (!this.showSearchField) {
      this.placeTypesQuery = '';
      this.resetSearch();
    }
  }

  public loadMore(event) {
    this.renderer.removeClass(event.target.closest('ul'), 'show-more-filter');
    this.renderer.addClass(event.target.closest('ul'), 'show-less-filter');
  }

  public showLess(event) {
    this.renderer.removeClass(event.target.closest('ul'), 'show-less-filter');
    this.renderer.addClass(event.target.closest('ul'), 'show-more-filter');
  }
  private resetSearch() {
    this.dataSource.data = this.generatePlaceTypes(this.placeTypes);
  }

  onSingleSearch(options, type) {
    this.applyFilters(type, options);
  }

  public drawPolygonFunc() {
    this.resetAllForms();
    this.drawPolygon.emit();
  }

  public drawCircularPolygonFunc() {
    this.resetAllForms();
    this.drawCircularPolygon.emit();
  }

  public removePolygonFunc() {
    this.appliedLocationFilterType = '';
    this.removePolygon.emit();
  }

  private resetAllForms() {
    this.resetForm(false);
    this.resetMarketSearch(false);
  }
  /**
   * This method is to search the places
   * @param autocompleteValue
   */
  private autocompletePlace(autocompleteValue) {
    if (!this.noAutoComplete && autocompleteValue !== '' && autocompleteValue.length >= 3) {
      this.commonService.setDropdownState(true);
      this.fetchingSuggestion = true;
      const query = this.elasticsearchService.prepareElasticForAutocompleteQuery(autocompleteValue);
      this.elasticsearchService.getDataFromElasticSearch(query).pipe(
        map((responseData: any) => {
          const places = [];
          if (responseData && responseData['hits'] && responseData['hits']['hits']) {
            responseData['hits']['hits'].map(hit => {
              places.push(hit['_source']['safegraph_place']);
            });
          }
          return places;
        }), takeUntil(this.unSubscribe))
        .subscribe(places => {
          if (typeof places !== 'undefined') {
            this.autocompletePlaces = places;
            this.cdRef.markForCheck();
          }
          this.fetchingSuggestion = false;
        },
          error => {
            this.fetchingSuggestion = false;
            this.autocompletePlaces = [];
          });
    }
    this.noAutoComplete = false;
  }

  public selectPlace(ap) {
    this.selectedPlaceName = ap.place_name;
    this.searchLocationForm.patchValue({ location: ap.place_name });
    this.selectedSearchPlace = ap;
    this.placeFilterService.savePlacesSession('autoCompleteSelectedPlace', this.selectedPlaceName);
    this.commonService.setDropdownState(false);
  }

  private autoCompleteMarkets(value) {
    if (value !== '' && value.length >= 3) {
      this.fetchingMarkets = true;
      this.exploreService.getmarketSearch(value, true).pipe(takeUntil(this.unSubscribe)).subscribe((response) => {
        this.marketsData = response;
        let issearchdata = false;
        this.isMarketlocationAvailable = false;
        for (const key in this.marketsData) {
          if (this.marketsData[key] != null && this.marketsData[key].length) {
            issearchdata = true;
          }
        }
        if (issearchdata) {
          this.isMarketlocationAvailable = true;
        }
        this.fetchingMarkets = false;
        this.cdRef.markForCheck();
      });
    }
  }

  public selectMarket(geolocation, type) {
    this.selectedMarket = geolocation;
    this.selectedMarket['type'] = type;
    // The below changes are temporary fix. We have to follow same design for all auto completes
    this.searchMarketForm.patchValue({
      market: geolocation['name']
    },  {emitEvent: false});
    this.marketsData = [];
  }

  public resetMarketSearch(emit = true) {
    if (emit && this.searchMarketForm.getRawValue()['market']) {
      this.removePolygon.emit();
    }
    this.searchMarketForm.reset();
    this.searchMarketForm.markAsPristine();
    this.marketsData = [];
    this.selectedMarket = {};
    this.isMarketlocationAvailable = false;
  }

  public marketSearch() {
    this.applyFilters('market');
  }

  /**
   * This method is to emit the radius and selected place data for drawing polygon
   */
  private searchByRadius() {
    let featuresCollection: any;
    const radius = this.searchLocationForm.getRawValue().distance;
    featuresCollection = turfHelper.featureCollection([]);
    const center = this.selectedSearchPlace['location']['point']; // turfCenter(this.selectedSearchPlace['location']['point']);
    const circleFeature = turfCircle(center.coordinates, radius,
      { steps: 64, units: 'miles', properties: this.selectedSearchPlace['properties'] });
    featuresCollection.features.push(circleFeature);
    this.filterLocationsByRadius.emit({featureCollection: featuresCollection, polygon: center, radius: radius, session: false});
  }

  /**
   * This method is to emit the market data for drawing polygon
   */
  private searchByMarket() {
    if (this.selectedMarket && this.selectedMarket['id']) {
      this.exploreService.getmarketGeometry({id: this.selectedMarket.id, type: this.selectedMarket.type})
      .subscribe(
        response => {
          this.placeFilterService.savePlacesSession('selectedGeoMarket', this.selectedMarket);
          this.geoPolygon.emit({polygon: response, session: false, market: this.selectedMarket});
        });
    }
  }
}
