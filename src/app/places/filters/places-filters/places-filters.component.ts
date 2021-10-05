import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { PlacesSummary, PlaceFilterParams } from '@interTypes/placeFilters';
import { PlacesFiltersService } from '../places-filters.service';
import { PlacesElasticsearchService } from '../places-elasticsearch.service';
import { takeWhile, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LoaderService } from '@shared/services/loader.service';
import swal from 'sweetalert2';
import { PlaceAuditState, AreaType, Polygon } from '@interTypes/Place-audit-types';
import { AuthenticationService } from "@shared/services";
import { forkJoin, zip } from 'rxjs';
import {Helper} from '../../../classes';

@Component({
  selector: 'app-places-filters',
  templateUrl: './places-filters.component.html',
  styleUrls: ['./places-filters.component.less']
})
export class PlacesFiltersComponent implements OnInit, OnDestroy {
  private unSubscribe = true;
  public showFilter = false;
  public open = false;
  public selectedTab = 0;
  public filterLevel = 1;
  public placeSetLevel = 0;
  public filterData = {};
  public placeData = {};
  public placeDetailData;
  public summary: PlacesSummary;
  public placesResults = {};
  public placeTypes = [];
  public industries = [];
  public filterOptions = {};
  public nationalWiseData = {};
  public poiData: any;
  public selectedPlaceSet = {};
  public appliedLocationFilterType = '';
  @Output() pushNationalData: EventEmitter<any> = new EventEmitter();
  @Output() onHoverOnCard: EventEmitter<any> = new EventEmitter();
  @Output() onLeaveOnCard: EventEmitter<boolean> = new EventEmitter();
  @Output() onClickOnCard: EventEmitter<any> = new EventEmitter();
  @Output() onChangeTab: EventEmitter<any> = new EventEmitter();
  @Output() drawPolygon: EventEmitter<any> = new EventEmitter();
  @Output() drawCircularPolygon: EventEmitter<any> = new EventEmitter();
  @Output() geoPolygon: EventEmitter<any> = new EventEmitter();
  @Output() removePolygon: EventEmitter<any> = new EventEmitter();
  @Output() loadPolygonFromSession: EventEmitter<any> = new EventEmitter();
  @Output() filterLocationsByRadius: EventEmitter<any> = new EventEmitter();
  @Output() selectedFilterFids = new EventEmitter();
  @Output() navigationStatus: EventEmitter<any> = new EventEmitter();

  public facilityMapVisible = false;
  public selectedSavedPlaceSet: any;
  public facilityMapData: Polygon;
  public buildingAreaPolygon: Polygon;
  public facilityAreaType: AreaType;
  public placePosition: number[] = [];
  public isVisibleHerePlaces = false;
  public herePlaceSearchData: any;
  public safegraphPlace: any;
  public placeAudit: PlaceAuditState;
  public updatedPlaceInfo: any;
  public updatedPlaceCoords: number[] = [];
  public openFacilityArea = false;
  placeAccess: any = {};
  public openPlaceTab = false;
  public displayOptionsList = [
    'Map Legends',
    'Map Controls',
    'Custom Logo',
    'Custom Text',
    'Base Maps'
  ];
  public layersOptionsList = [
    'inventory collection',
    'place collection',
    'geopathId',
    'place',
    'geography',
    'geo sets',
  ];

  public openCreateNewPlace = false;
  public newPlaceData;

  constructor(
    private placeFilterService: PlacesFiltersService,
    private loaderService: LoaderService,
    private elasticsearch: PlacesElasticsearchService,
    private auth: AuthenticationService,
  ) {
    this.placeFilterService.getPlaceAudit()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe((response) => {
        this.placeAudit = response;
        this.isVisibleHerePlaces = false;
        this.facilityMapVisible = false;

        /** set new place create false */
        this.openCreateNewPlace = false;
        this.newPlaceData = null;
      });
  }

  ngOnInit() {
    // this.placeFilterService.setFilterLevel({filterLevel: this.filterLevel});
    this.placeAccess = this.auth.getModuleAccess('places');
    if (this.placeAccess['tab'] !== 'undefinded' && this.placeAccess['tab']) {
      this.openPlaceTab = this.placeAccess['tab'];
    }
    this.placeFilterService
      .getFilterSidenav()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(data => {
        this.showFilter = true;
        this.open = data['open'];
        switch (data['tab']) {
          case 'myPlaces':
            this.selectedTab = 1;
            this.placeFilterService.openFilterTab = 1;
            break;
          case 'layers':
            this.selectedTab = 2;
            this.placeFilterService.openFilterTab = 2;
            break;
          case 'actions':
            this.selectedTab = 3;
            this.placeFilterService.openFilterTab = 3;
            break;
          default:
            this.selectedTab = 0;
            this.placeFilterService.openFilterTab = 0;
            break;
        }
        this.placeFilterService.setFilterLevel({});
        if (!this.open) {
          this.showFilter = false;
        }
      });

    this.loadSession();
    this.placeFilterService
      .getFilterLevelState()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(data => {
        if (this.selectedTab === 1) {
          this.filterLevel = data[1]['filterLevel'];
        } else {
          this.filterLevel = data[0]['filterLevel'];
        }
      });

      this.placeFilterService.getCreateNewPlace().pipe(takeWhile(() => this.unSubscribe))
      .subscribe(data=>{
        if(data && data['open']){
          this.placeFilterService.setFilterLevel({ 'clear': 1 });
          this.placeSetLevel = 0;
          this.isVisibleHerePlaces = false;
          this.facilityMapVisible = false;
          this.openCreateNewPlace = true;
          this.newPlaceData = data;
          this.placeAudit = null;
          this.placeFilterService.setFilterSidenav({
            open: true,
            tab: 'myPlaces'
          });
  
          /*if (placesSession['filterLevelState']) {
            this.filterLevel = placesSession['filterLevelState'][0]['filterLevel'];
            this.placeFilterService.setFilterLevel(placesSession['filterLevelState']);
          }*/
        } else {
          this.openCreateNewPlace = false;
          this.newPlaceData = null;
        }
      });

    /**
     * To subscribe the applied location filter data
     */
    this.placeFilterService
      .getLocationFilter()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(location => {
        if (location && Object.keys(location).length) {
          if (location['type'] === 'filterLocationByMarket' && location['market']) {
            this.filterData['marketFilter'] = location['market'];
            if (this.filterData['address']) {
              delete this.filterData['address'];
            }
          } else {
            this.filterData['address'] = location['region'];
            if (location['type'] === 'filterLocationByRadius') {
              this.filterData['address']['distance'] = parseInt(location.radius, 10);
            }
          }
          this.placeFilterService.savePlacesSession('appliedPolygonType', location['type']);
          this.appliedLocationFilterType = location['type'];
          this.onPushFilter({ filter: this.filterData });
        } else {
          if (this.filterData['address']) {
            delete this.filterData['address'];
          }
          if (this.filterData['marketFilter']) {
            delete this.filterData['marketFilter'];
          }
          this.appliedLocationFilterType = '';
          this.onPushFilter({ filter: this.filterData });
        }
      });
  }
  ngOnDestroy() {
    this.unSubscribe = false;
  }

  private loadSession() {
    const placesSession = this.placeFilterService.getPlacesSession();
    if (placesSession) {
      if (placesSession['selectedTab']) {
      // if (placesSession['selectedTab']['open']) {
          this.selectedTab = placesSession['selectedTab']['tab'];
       // }
        let tab = '';
        switch (this.selectedTab) {
          case 1:
            tab = 'myPlaces';
            break;
          case 2:
            tab = 'layers';
            break;
          case 3:
            tab = 'actions';
            break;
          default:
            tab = 'findAndDefine';
            break;
        }

        this.placeFilterService.setFilterSidenav({
          open: placesSession['selectedTab']['open'],
          tab: (typeof this.selectedTab === 'number' ) && tab  || this.selectedTab
        });

        if (placesSession['filterLevelState']) {
          this.filterLevel = placesSession['filterLevelState'][0]['filterLevel'];
          this.placeFilterService.setFilterLevel(placesSession['filterLevelState']);
        }
      }
      if (this.selectedTab === 0 && placesSession['filters'] && Object.keys(placesSession['filters']).length > 0) {
        this.filterData = placesSession['filters'];
        if (this.filterData) {
          this.getPlacesDataFromAPI(this.filterData);
          this.placeData = placesSession['placeDetail'];
          if (this.placeData && (this.placeData['placeName'] !== '' && this.placeData['route'] !== '')) {
            this.placeDetailData = this.placeData;
          }
          if (placesSession['appliedPolygonType']) {
            if (placesSession['appliedPolygonType'] === 'filterLocationByRadius') {
              this.filterLocationsByRadiusFunc({
                featureCollection: placesSession['radiusPolyFeatureCollection'],
                polygon: placesSession['filters']['address'],
                radius: placesSession['filters']['address']['distance'],
                session: true
              });
            } else if (placesSession['appliedPolygonType'] === 'filterLocationByMarket') {
              this.geoPolygonFunc({
                polygon: placesSession['marketFeature'],
                session: true
              });
            } else {
              this.loadPolygonFromSession.emit({
                region: placesSession['filters']['address'], appliedPolygonType: placesSession['appliedPolygonType']
              });
            }
          }
        }
      }
      if (this.selectedTab === 1 && placesSession['placeSetsFilter'] && placesSession['placeSetsFilter']['place']) {
        this.filterData = placesSession['placeSetsFilter'];
        this.selectedPlaceSet = this.filterData['place'];
        this.onFilterByPlaceSet(this.filterData['place']);
      }
    } else {
      if (this.openPlaceTab) {
        const sidenavOptions = { open: true, tab: 'findAndDefine' };
        this.placeFilterService.savePlacesSession('selectedTab', sidenavOptions);
        this.placeFilterService.setFilterSidenav(sidenavOptions);
      }
    }
  }
  onPushFilterLevel(level) {
    this.filterLevel = level;
    if (level) {
      if (level === 2) {
        this.placeDetailData = {};
      } else {
        this.pushNationalData.emit({});
        this.placeDetailData = {};
      }
    }
    this.placeFilterService.setFilterLevel({ filterLevel: level });
  }
  onPushFilter(data) {
    if (!data.filter.placeTypeList || (data.filter.placeTypeList && data.filter.placeTypeList.length === 0)) {
      delete data.filter.placeTypeList;
      data.placeTypesInit = true;
    }
    this.filterData = data.filter;
    this.placeFilterService.savePlacesSession('filters', data.filter);
    this.placeFilterService.savePlacesSession('placeDetail', { 'placeName': '', 'route': '' });
    this.getPlacesDataFromAPI(data.filter, data.placeTypesInit, data.industriesInit);
  }
  getPlacesDataFromAPI(filterData: Partial<PlaceFilterParams>, placeTypesInit = true, industriesInit = true) {
    let query = this.elasticsearch.prepareElasticQuery(filterData);
    query = this.elasticsearch.addGroupedPlacesQueries(query);
    query = this.elasticsearch.getFilterOptions(query);
    query = this.elasticsearch.addTotalQuery(query);
    const queryData = { ...query };
    this.getNationalLevelData(queryData);
    this.elasticsearch.getDataFromElasticSearch(query).pipe(map((responseData: any) => {
      const filterOptions = {};
      const res = {};
      filterOptions['brands'] = responseData['aggregations'].brands.buckets.map(data => {
        return { count: data.doc_count, name: data.key ? data.key : 'Others' };
      });
      filterOptions['industries'] = responseData['aggregations'].industries.buckets.map(data => {
        return { count: data.doc_count, name: data.key ? data.key : 'Others', code: data.ids.buckets[0] && data.ids.buckets[0]['key'] };
      });
      filterOptions['placeTypes'] = responseData['aggregations'].topCategories.buckets.map(category => {
        return {
          top_category: category.key ? category.key : 'Others', sub_categories: category.subCategories.buckets.map(subCategory => {
            return { name: subCategory.key ? subCategory.key : 'Others', count: subCategory.doc_count };
          })
        };
      });
      res['filters'] = filterOptions;
      if (responseData['aggregations'] && responseData['aggregations']['total']) {
        res['summary'] = {
          'number_of_places': responseData['hits']['total']['value'],
          'avg_weekly_traffic': 0,
          'avg_weekly_unique_visits': 0
        };
      }
      if (responseData['hits'] && responseData['hits']['hits']) {
        res['places'] = responseData['hits']['hits'];
      }
      return res;
    }), takeWhile(() => this.unSubscribe)).subscribe(response => {
      this.filterLevel = 2;
      this.selectedPlaceSet = {};
      this.placeSetLevel = 0;
      this.filterOptions = response['filters'];
      this.summary = response['summary'];
      this.placeFilterService.setFilterLevel({ filterLevel: this.filterLevel });
      this.placesResults = this.formatElasticDataToPlace(response);
      if (placeTypesInit) {
        this.placeTypes = response['filters']['placeTypes'];
      }
    },
      error => {
        this.placeFilterService.savePlacesSession('filters', {});
        this.placeFilterService.savePlacesSession('placeDetail', {});
        this.onPushFilterLevel(1);
      });
  }

  hoverOnCard(place) {
    this.onHoverOnCard.emit(place);
  }
  hoverOutOnCard() {
    this.onLeaveOnCard.emit(true);
  }
  clickOnCard(place) {
    this.onClickOnCard.emit(place);
  }
  onFilterByPlaceSet(place: object) {
    const filterData = {};
    if (!place) {
      this.placeFilterService.setFilterLevel({ 'clear': 1 });
      this.placeSetLevel = 0;
      this.placeFilterService.savePlacesSession('placeSetsFilter', { 'placeSetId': '' });
      this.pushNationalData.emit({});
      this.selectedPlaceSet = {};
      return true;
    }
    this.placeFilterService.setPlaceAudit(null);

    filterData['poiIds'] = place['pois'];
    let query = this.elasticsearch.prepareElasticQuery(filterData);
    query = this.elasticsearch.addTotalQuery(query);
    query = this.elasticsearch.addSGIDsAgg(query);
    const queryData = { ...query };
    this.selectedSavedPlaceSet = queryData;
    this.getNationalLevelData(queryData);
    this.elasticsearch.getDataFromElasticSearch(query).pipe(takeWhile(() => this.unSubscribe)).subscribe(response => {
      const placesResults = this.elasticsearch.formatPlaceDetails(response);
      if (this.selectedTab !== 1) {
        this.onPushFilterLevel(1);
      } else {
        this.onPushFilterLevel(2);
      }
      this.selectedPlaceSet = place;
      this.placeFilterService.savePlacesSession('placeSetsFilter', { 'place': place });
      const places = placesResults['places'];
      const poisData = places.map((item) => {
        item.selected = true;
        return item;
      });
      this.placeSetLevel = 1;
      this.poiData = {
        name: place['name'],
        places: poisData,
        summary: placesResults['summary'],
        sortKey: placesResults['sortKey'],
        sfids: place['pois']
      };
    },
      error => {
        swal('Error', 'An error has occurred. Please try again later.', 'error');
      });
  }
  onSelectedIndexChange() {
    const placesSession = this.placeFilterService.getPlacesSession();
    if (placesSession['selectedTab'] && placesSession['selectedTab']['open']) {
      this.placeFilterService.savePlacesSession('selectedTab', { open: true, tab: this.selectedTab });
      this.loadSession();
    }
  }

  public drawPolygonFunc() {
    this.drawPolygon.emit();
  }

  public drawCircularPolygonFunc() {
    this.drawCircularPolygon.emit();
  }

  public removePolygonFunc(data) {
    this.removePolygon.emit(data);
  }

  public geoPolygonFunc(data) {
    this.geoPolygon.emit(data);
  }

  public filterLocationsByRadiusFunc(data) {
    this.filterLocationsByRadius.emit(data);
  }

  private formatElasticDataToPlace(data) {
    const placesResults = {};
    const sortKey = [
      {
        'field_name': 'Place Name',
        'key': 'place_name'
      },
      {
        'field_name': 'Place Type',
        'key': 'place_type'
      },
      {
        'field_name': 'Industry',
        'key': 'industry'
      },
      {
        'field_name': 'Number of Places',
        'key': 'count'
      }
    ];
    placesResults['sortKey'] = sortKey;
    let noOfPlaces = 0;
    if (data['aggregations'] && data['aggregations']['total']) {
      noOfPlaces = data['aggregations']['total']['value'];
    }
    placesResults['summary'] = data['summary'];
    placesResults['places'] = [];
    let hits = [];
    if (data['places']) {
      hits = data['places'];
    }
    placesResults['places'] = this.elasticsearch.formatLocationData(hits);
    return placesResults;
  }
  public updateNationalLevelData(data) {
    const filterData = { ...data };
    const query = (filterData.query) ? this.elasticsearch.prepareElasticQuery(filterData['query']) : this.selectedSavedPlaceSet;
    if (filterData['placeNames'].length <= 0) {
      filterData['placeNames'] = ['null'];
    }
    this.getNationalLevelData(this.elasticsearch.formSelectedPlacesQuery(query, filterData));
  }

  private getNationalLevelData(query) {
    // TODO : Check if we really need a deep clone here, there is no further mutation of the value is happening.
    const totalQuery = Helper.deepClone(this.elasticsearch.addTotalQuery(query));
    this.elasticsearch
      .getDataFromElasticSearch(totalQuery)
      .subscribe(res => {
        if (res && res['hits'] && res['hits']['total'] && res['hits']['total']['value'] < 10000) {
          const state = this.elasticsearch.getDataFromElasticSearch(
            Helper.deepClone(this.elasticsearch.getNationalLevelData(query, 'state'))
          );
          const geohash5 = this.elasticsearch.getDataFromElasticSearch(
            Helper.deepClone(this.elasticsearch.getNationalLevelData(query, 'geohash5'))
          );
          const geohash6 = this.elasticsearch.getDataFromElasticSearch(
            Helper.deepClone(this.elasticsearch.getNationalLevelData(query, 'geohash6'))
          );
          const sfids = this.elasticsearch.getDataFromElasticSearch(
            Helper.deepClone(this.elasticsearch.getNationalLevelData(query, 'safegraphIds'))
          );
          forkJoin([state, geohash5, geohash6, sfids]).subscribe(results => {
            const result = {};
            result['states'] = results[0]['aggregations'].states.buckets.map(val => {
              const coordinates = [];
              coordinates.push(val.center_lon.value);
              coordinates.push(val.center_lat.value);
              return {
                geometry: { type: 'Point', coordinates: coordinates },
                properties: { code: val.key, count: val.doc_count },
                type: 'Feature'
              };
            });
            result['geohash5'] = results[1]['aggregations'].geohash5.buckets.map(data => {
              return data.key;
            });
            result['geohash6'] = results[2]['aggregations'].geohash6.buckets.map(data => {
              return data.key;
            });
            result['ids'] = results[3]['aggregations'].safegraphIds.buckets.map(id => {
              return id.key;
            });
            const statesCollection = { type: 'FeatureCollection', features: result['states'] };
            this.pushNationalData.emit({
              states: statesCollection,
              ids: result['ids'],
              geohash5: result['geohash5'],
              geohash6: result['geohash6']
            });
          }, error => {
            this.pushNationalData.emit({});
          });
        } else {
          this.pushNationalData.emit({});
        }
      });

    /* this.elasticsearch.getDataFromElasticSearch(this.elasticsearch.getNationalLevelData(query, 'state')).pipe(map((response: any) => {
      const result = {};
      result['states'] = response['aggregations'].states.buckets.map(state => {
        const coordinates = [];
        coordinates.push(state.center_lon.value);
        coordinates.push(state.center_lat.value);
        return {
          geometry: { type: 'Point', coordinates: coordinates },
          properties: { code: state.key, count: state.doc_count },
          type: 'Feature'
        };
      });
      result['ids'] = response['aggregations'].safegraphIds.buckets.map(id => {
        return id.key;
      });
      result['geohash5'] = response['aggregations'].geohash5.buckets.map(data => {
        return data.key;
      });
      result['geohash6'] = response['aggregations'].geohash6.buckets.map(data => {
        return data.key;
      });
      return result;
    }), takeWhile(() => this.unSubscribe)).subscribe(result => {
      const statesCollection = { type: 'FeatureCollection', features: result['states'] };
      console.log('sss', {
        states: statesCollection,
        ids: result['ids'],
        geohash5: result['geohash5'],
        geohash6: result['geohash6']
      });
      this.pushNationalData.emit({
        states: statesCollection,
        ids: result['ids'],
        geohash5: result['geohash5'],
        geohash6: result['geohash6']
      });
    }, error => {
      this.pushNationalData.emit({});
    }); */
  }
  public selectedFids($event) {
    this.selectedFilterFids.emit($event);
  }
  public onOpenFacilityMap({ type, polygonData, placePosition, buildingAreaPolygon }) {
    this.facilityMapVisible = true;
    this.facilityAreaType = type;
    this.facilityMapData = polygonData;
    this.placePosition = placePosition;
    this.buildingAreaPolygon = buildingAreaPolygon;
    this.openFacilityArea = !this.openFacilityArea;
  }
  public onOpenHerePlace(hereSearchParams) {
    this.isVisibleHerePlaces = true;
    this.herePlaceSearchData = hereSearchParams;
  }
  public onConfirmPlace(confirmPlace) {
    this.safegraphPlace = confirmPlace;
  }

  /**
   * This function is to update the place polygon data for the audited place
   * @param data
   */
  public updatePolygonInfo(data) {
    this.updatedPlaceInfo = Helper.deepClone(data);
  }

  /**
   * This function is to update the place coordinates
   */
  public updatePlacePosition(position) {
    this.updatedPlaceCoords = position;
  }
  public closeFacilityMap(event) {
    if (event && event.close) {
      this.facilityMapVisible = false;
    }
  }
  public closeHerePlaces(event) {
    if (event && event.close) {
      this.isVisibleHerePlaces = false;
    }
  }
  public closeDetailsWindow(event) {
    if (event && event.close) {
      this.isVisibleHerePlaces = false;
      this.facilityMapVisible = false;
      this.placeFilterService.setPlaceAudit(null);
    }
  }
  public placeCompleted() {
    // This will load the next place based on already selected place.
    this.placeFilterService.setLoadNextPlace(true);
  }
  onPushFilterStatus(flag) {
    this.navigationStatus.emit(flag);
  }

  public clearAllFromAction() {
    this.placeFilterService.resetAll();
  }
}
