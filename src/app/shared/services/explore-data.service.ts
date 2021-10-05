import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Orientation} from '../../classes/orientation';
import {FiltersService} from '../../explore/filters/filters.service';
import {CommonService} from './common.service';
import {FormatService} from './format.service';
import {ThemeService} from './theme.service';
import {KeyLegend} from '@interTypes/keyLegend';

@Injectable()
/**
 * Class to act as data store for explore component
 */
export class ExploreDataService {
  /**
   * Here the Behavioursubjects are private because we should not expose them directly to the subscriber.
   * we can but we should not because it'll give the ability for subscribers (consumers) to emit new values.
   * It'll create event chain in an un-manageable way.
   */
  private places = new BehaviorSubject([]);
  private summary = new BehaviorSubject({});
  private mapObject = new BehaviorSubject({});
  private mapSecondaryObject = new BehaviorSubject({});
  public nationalFeatures = new BehaviorSubject({});
  private filters = new BehaviorSubject({});
  private fids = new Subject();
  private arrowPostion = new Subject();
  private mapLoadedEvent = new Subject();
  private secondaryMapLoadedEvent = new Subject();
  private populationOpen$: Subject<boolean> = new Subject<boolean>();

  /* Comment: selectedPlacesCtrlValue and radiusCtrlValue are used to set value to controller values
   in explore-filters compoent to handle Place(POI) based search */
  private selectedPlacesCtrlValue = new Subject();
  private radiusCtrlValue = new Subject();
  private selectedMarketLocationValue = new Subject();
  private topMapData = new Subject();
  /* static data part starts */
  private sortables = [
    {name: 'Total Impression', value: 'imp'},
    {name: 'Target Impression', value: 'imp_target'},
    {name: 'Target Composition Percentage', value: 'pct_comp_imp_target'}
  ];
  private sortKeyWithoutMarket = [
    {name: 'Total Impression', value: 'imp'},
    {name: 'Target Impression', value: 'imp_target'},
    {name: 'Target Composition Percentage', value: 'pct_comp_imp_target'},
  ];
  private sortKeyWithMarket = [
    {name: 'Total Impression', value: 'imp'},
    {name: 'Target Impression', value: 'imp_target'},
    {name: 'Target Composition Percentage', value: 'pct_comp_imp_target'},
    {name: 'In-Market Total Impression', value: 'imp_inmkt'},
    {name: 'Total Percentage In-Market', value: 'pct_imp_inmkt'},
    {name: 'In-Market Target Impression', value: 'imp_target_inmkt'},
    {name: 'Target Percentage In-Market', value: 'pct_imp_target_inmkt'},
    {name: 'In-Market Target Composition Percentage', value: 'pct_comp_imp_target_inmkt'},
    {name: 'In-Market Target Composition Index', value: 'index_comp_target'},
    {name: 'Target Ratings', value: 'trp'},
    {name: 'Target Reach', value: 'reach_pct'},
    {name: 'Target Frequency', value: 'freq_avg'}
  ];
  private selectedTarget = new BehaviorSubject('');
  private selectedMarket = new BehaviorSubject([]);
  private selectedMarketName = new BehaviorSubject('');
  private selectedTargetName = new BehaviorSubject([]);
  private searchStarted = new BehaviorSubject(false);
  private tabularViewPlaces = new BehaviorSubject([]);
  public keyCodes = {
    ENTER: 13,
    LEFTARROW: 37,
    UPARROW: 38,
    DOWNARROW: 40,
    RIGHTARROW: 39
  };
  public mapViewPostionState: BehaviorSubject<string>;
  // mapView / inventoryView / tabularView / tabularViewExtended

  public searchCriteria = {}; // Use to store search criteria.
  private themeSettings;
  private inventoryGroups = [];
  private inventoryGroupsResult;
  private inventoryGroupIds = {};
  private inventoryGroupDigitalIds = {};
  private inventoryGroupNonDigitalIds = {};
  private inventoryGroupsPlaces = [];
  mapStyle: any;
  mapAccessTkn: any;

  constructor(private common: CommonService,
              private theme: ThemeService,
              private format: FormatService,
              private filtersService: FiltersService
  ) {
    const userData = JSON.parse(localStorage.getItem('user_data'));
    if (userData) {
      this.mapAccessTkn = userData['layers']['key'];
    }

    this.themeSettings = this.theme.getThemeSettings();
    if (this.themeSettings) {
      this.mapStyle = this.themeSettings.basemaps.find((base) => base.default);
      this.mapViewPostionState = new BehaviorSubject(this.getPanelState() || 'inventoryView');
      this.inventoryGroupsResult = this.themeSettings.customize.media_types;
      // TODO: As of now just removed the Place Based category from the media types. But need to handle in feature.
      if (this.inventoryGroupsResult) {
        this.inventoryGroupsPlaces = this.inventoryGroupsResult.filter(place => place['displayName'] === 'Place Based');
      }
      // if (this.inventoryGroupsResult && this.inventoryGroupsResult.length > 4) {
      // this.inventoryGroupsResult.pop();
      // }
      const nameArray = [];
      for (const groupIndex in this.inventoryGroupsResult) {
        if (this.inventoryGroupsResult[groupIndex]['displayName']) {
          const displayName = this.inventoryGroupsResult[groupIndex]['displayName'];
          nameArray.push(displayName);
          this.inventoryGroups[groupIndex] = this.inventoryGroupsResult[groupIndex];
          /* const mtidPrint  = [];
          this.inventoryGroups[groupIndex]['mtidPrint'].map(id => {
            mtidPrint.push(Number(id));
          });
          this.inventoryGroups[groupIndex]['mtidPrint'] = mtidPrint; */
          if (this.inventoryGroupsResult[groupIndex]['mtidPrint'].length <= 0) {
            this.inventoryGroups[groupIndex]['mtidPrint'] = ['null1' + groupIndex];
          }
          /* const mtidDigital = [];
          this.inventoryGroups[groupIndex]['mtidDigital'].map(id => {
            mtidDigital.push(Number(id));
          });
          this.inventoryGroups[groupIndex]['mtidDigital'] = mtidDigital; */
          if (this.inventoryGroupsResult[groupIndex]['mtidDigital'].length <= 0) {
            this.inventoryGroups[groupIndex]['mtidDigital'] = ['null' + groupIndex];
          }
        }
      }
      if (this.inventoryGroupsResult) {
        this.inventoryGroupsResult.map(item => {
          this.inventoryGroupIds[item.displayName] = [...item.mtidPrint, ...item.mtidDigital];
          this.inventoryGroupDigitalIds[item.displayName] = [...item.mtidDigital];
          this.inventoryGroupNonDigitalIds[item.displayName] = [...item.mtidPrint];
        });
      }
    }
  }

  public keyLegends: BehaviorSubject<Partial<KeyLegend[]>> = new BehaviorSubject<Partial<KeyLegend[]>>([]);

  /* static data part ends */
  /**
   * The function to return the places as an observable, you have to subscribe to these functions.
   * @returns {Observable<any>}
   */
  public getPlaces(): Observable<any> {
    return this.places.asObservable();
  }

  /**
   * This is the function to return the summary as an observable
   * @returns {Observable<any>} returns the summary data.
   * strict  typing is not implemented to maintain flexibility of the data structure
   */
  public getSummary(): Observable<any> {
    return this.summary.asObservable();
  }

  /**
   * This is the function to return the summary as an observable
   * @returns {Observable<any>} returns the summary data.
   * strict  typing is not implemented to maintain flexibility of the data structure
   */
  public getNationalFeatures(): Observable<any> {
    return this.nationalFeatures.asObservable();
  }

  public getFids(): Observable<any> {
    return this.fids.asObservable();
  }

  // To set selected Target
  public setSelectedTarget(target) {
    this.selectedTarget.next(target);
  }

  // To get selected Target
  public getSelectedTarget(): Observable<any> {
    return this.selectedTarget.asObservable();
  }

  // To set selected Target
  public setSelectedTargetName(target) {
    this.selectedTargetName.next(target);
  }

  // To get selected Target
  public getSelectedTargetName(): Observable<any> {
    return this.selectedTargetName.asObservable();
  }

  // To set selected Market
  public setSelectedMarket(market) {
    this.selectedMarket.next(market);
  }

  // To get selected Market
  public getSelectedMarket(): Observable<any> {
    return this.selectedMarket.asObservable();
  }

  public onMapLoad(): Observable<any> {
    return this.mapLoadedEvent.asObservable();
  }

  public mapLoaded(isLoaded: boolean): void {
    this.mapLoadedEvent.next(isLoaded);
  }

  public onSecondaryMapLoad(): Observable<any> {
    return this.secondaryMapLoadedEvent.asObservable();
  }

  public secondarymapLoaded(isLoaded: boolean): void {
    this.secondaryMapLoadedEvent.next(isLoaded);
  }

  /**
   * This is the function to return the invalid ids as an observable
   * @returns {Observable<any>} returns the invalid ids (geopath panel ids and plant unit ids).
   */
  public getInvalidIds(): Observable<any> {
    return this.filters.asObservable();
  }

  /**
   * This is the function to set places from external service.
   * the values are not stored anywhere, they'll be just echoed into the stream for the subscribers.
   * @param places
   */
  public setPlaces(places) {
    this.places.next(places);
  }

  /**
   * This is the function to set the invalid inventory ids
   * @param filters
   */
  public setInvalidIds(filters) {
    this.filters.next(filters);
  }

  /**
   * This is the function to set the values for inventory summary
   * @param summary
   */
  public setSummary(summary) {
    this.summary.next(summary);
  }

  /**
   * This is the function to set the values for inventory summary
   * @param summary
   */
  public setNationalFeatures(nationalFeatures) {
    this.nationalFeatures.next(nationalFeatures);
  }


  /**
   * @param fids
   */
  public setFids(fids) {
    this.fids.next(fids);
  }

  /**
   * @returns {{name: string; value: string}[]}
   */
  public getSortables() {
    return this.sortables;
  }

  /**
   * @returns {{name: string; value: string}[]}
   */
  public getSortKeyWithoutMarkets() {
    return this.sortKeyWithoutMarket;
  }

  /**
   * @returns {{name: string; value: string}[]}
   */
  public getAllSortKeys() {
    return this.sortKeyWithMarket;
  }

  /**
   * This is the function to set the values for map object
   * @param mapObject
   */
  public setMapObject(mapObject) {
    this.mapObject.next(mapObject);
  }

  /**
   * This is the function to return the map object as an observable
   * @returns {Observable<any>} returns the map object data.
   * strict  typing is not implemented to maintain flexibility of the data structure
   */
  public getMapObject(): Observable<any> {
    return this.mapObject.asObservable();
  }

  public setSecondaryMapObject(mapObject) {
    this.mapSecondaryObject.next(mapObject);
  }

  public getSecondaryMapObject(): Observable<any> {
    return this.mapSecondaryObject.asObservable();
  }

  /**
   * This is the function to get the hightlighted position while navigating filters using arrow keys
   */
  public getHighlightedPosition(): Observable<any> {
    return this.arrowPostion.asObservable();
  }

  /**
   * This is the function to set the hightlighted position while navigating filters using arrow keys
   */
  public setHighlightedPosition(position) {
    this.arrowPostion.next(position);
  }

  // end

  public getInventoryGroups() {
    return this.inventoryGroups;
  }

  public getInventoryGroupIds() {
    return this.inventoryGroupIds;
  }

  public getInventoryGroupDigitalIds() {
    return this.inventoryGroupDigitalIds;
  }

  public getInventoryGroupNonDigitalIds() {
    return this.inventoryGroupNonDigitalIds;
  }

  public getMediaGroup(mid) {
    if (mid !== 'undefined' && mid != null && mid !== 'null') {
      let groupSelected;
      const mtid = String(mid);
      for (let group in this.inventoryGroups) {
        const groupData = this.inventoryGroups[group];
        // The below is ES6 spread operator which merges multiple arrays into one
        // We're merging three arrays into one and searching for a string in it below, That's all
        const isValuePresent = [
          ...groupData.mtidPrint,
          ...groupData.mtidDigital,
          ...groupData.mtidInteractive
        ].indexOf(mtid);
        if (isValuePresent !== -1) {
          groupSelected = groupData;
          break;
        }
      }
      return groupSelected['displayName'];
    }
    return 'undefined';
  }

  public getCSVHeaders(customizedColumns = []) {
    const CSVHeasers = {
      spot_id: 'Geopath Spot ID',
      frame_id: 'Geopath Frame ID',
      media_status_name: 'Status',
      media_status_description: 'Status Description',
      operator_spot_id: 'Operator Spot ID',
      plant_operator: 'Plant Operator',
      classification: 'Classification',
      construction: 'Construction',
      digital: 'Material',
      media_type: 'Media Type',
      media_name: 'Media Name',
      orientation: 'Orientation',
      height: 'Height (ft & in)',
      width: 'Width (ft & in)',
      latitude: 'Latitude',
      longitude: 'Longitude',
      zip_code: 'ZIP Code',
      freq_avg: 'Target In-Market Frequency',
      illumination_type: 'Illumination Type',
      imp: 'Total Impressions',
      imp_inmkt: 'Total In-Market Impressions',
      imp_target: 'Target Impressions',
      index_comp_target: 'Target Audience Index',
      imp_target_inmkt: 'Target In-Market Impressions',
      pct_comp_imp_target: 'Target % Impression Comp',
      pct_comp_imp_target_inmkt: 'Target % In-Market Impr. Comp.',
      pct_imp_inmkt: 'Total % In-Mkt Impr.',
      pct_imp_target_inmkt: 'Target % In-Market Impressions',
      primary_artery: 'Primary Artery',
      reach_pct: 'Target In-Market Reach',
      trp: 'Target In-Market Rating Points',
      market_name: 'Market Name',
      market_type: 'Market Type',
      market_pop: 'Total Market Population',
      scheduled_weeks: 'Scheduled # of Weeks',
      target_aud: 'Target Audience',
      per_out_market_imp: 'Total % Out of Market Impressions',
      out_market_imp: 'Total Out of Market Impressions',
      target_aud_pop: 'Target Audience Market Population',
      reach_net: 'Reach Net',
      county_name: 'Inventory Location (County)',
      dma_name: 'Inventory Location (DMA)',
      cbsa_name: 'Inventory Location (CBSA)',
      place_type: 'Place Type',
      place_name: 'Place Name',
      placement_type: 'Placement Type',
    };
    if (customizedColumns.length > 0) {
      const customColumns = {};
      customizedColumns.forEach(column => {
        if (column['name'] !== 'CHECKBOX' && column['name'] !== 'SLNO') {
          switch (column['value']) {
            case 'classification_type':
              customColumns['classification'] = column['displayname'];
              break;
            case 'construction_type':
              customColumns['construction'] = column['displayname'];
              break;
            case 'max_height':
              customColumns['height'] = column['displayname'];
              break;
            case 'max_width':
              customColumns['width'] = column['displayname'];
              break;
            case 'plant_frame_id':
              customColumns['operator_spot_id'] = column['displayname'];
              break;
            default:
              customColumns[column['value']] = column['displayname'];
              break;
          }
        }
      });
      return customColumns;
    } else {
      return CSVHeasers;
    }
  }

  public getStaticMapImage(coOrds, width, height) {
    let starImageURL = '/assets/images/static_images/geopath.png';
    if (this.themeSettings.site !== null && this.themeSettings.site !== undefined) {
      starImageURL = '/assets/images/static_images/' + this.themeSettings.site + '.png';
    }
    const icon = encodeURIComponent(window.location.origin + starImageURL);
    const styleID = this.mapStyle['uri'].substring(this.mapStyle['uri'].lastIndexOf('/') + 1);
    return 'https://api.mapbox.com/styles/v1/intermx/'+styleID+'/static/url-' + icon +
      '(' + coOrds[0] + ',' + coOrds[1] + ')/' +
      coOrds[0] + ',' + coOrds[1] + '40.45704,10.0,0,0/' + width + 'x' + height + '?access_token=' + this.mapAccessTkn;
  }


  // This two methods are for arrow navigation of market filters
  public getMapViewPositionState(): Observable<any> {
    return this.mapViewPostionState.asObservable();
  }

  public setMapViewPositionState(state) {
    this.filtersService.updateFiltersData({mapViewPostionState: state});
    this.mapViewPostionState.next(state);
  }

  /**
   * @description
   *
   *  Reset the map view state in explore after logout.
   *  this issue raised due to state is not reseting even after
   *  logout.
   *
   * @see https://intermx.atlassian.net/browse/IMXUIPRD-1777.
   */
  public resetMapViewPositionState() {
    if (this.mapViewPostionState) {
      this.mapViewPostionState.complete();
      this.mapViewPostionState.next('inventoryView');
    }
  }

  // This two methods are use set and get filter params
  public getSearchCriteria() {
    return this.searchCriteria;
  }

  public setSearchCriteria(params) {
    this.searchCriteria = params;
  }

  public getSearchStarted(): Observable<any> {
    return this.searchStarted.asObservable();
  }

  public setSearchStarted(param) {
    this.searchStarted.next(param);
  }

  saveExploreSession(filterSession) {
    const localStorageData = this.getExploreSession();
    if (localStorageData) {
      Object.keys(filterSession).map((key) => {
        if (filterSession[key] || filterSession[key] === 0 || filterSession[key] === false || key === 'placeLayerVisibility') {
          localStorageData[key] = filterSession[key];
        }
      });
      localStorage.setItem('exploreSession', JSON.stringify(localStorageData));
    } else {
      localStorage.setItem('exploreSession', JSON.stringify(filterSession));
    }
  }

  getExploreSession() {
    return JSON.parse(localStorage.getItem('exploreSession'));
  }

  // TODO : Need to remove this legacy methods and related methods to them
  saveSelectedOptions(selectQuery) {
    const filterSession = this.getExploreSession();
    if (filterSession) {
      filterSession.selectQuery = selectQuery;
      this.saveExploreSession(filterSession);
    }
  }

  getPanelState() {
    const filterSession = this.getExploreSession();
    if (filterSession) {
      return filterSession.mapViewPostionState;
    } else {
      return '';
    }
  }

  saveCustomizedColumns(customColumns) {
    const filterSession = this.getExploreSession();
    if (filterSession) {
      filterSession.customColumns = customColumns;
      this.saveExploreSession(filterSession);
    }
  }

  savePlaceSetInfo(data) {
    const filterSession = this.getExploreSession();
    if (filterSession) {
      filterSession.placePackState = data;
      this.saveExploreSession(filterSession);
    }
  }

  /**
   * This is the function to get tabularView places while loading session
   */
  public getTabularViewPlaces(): Observable<any> {
    return this.tabularViewPlaces.asObservable();
  }

  /**
   * This is the function to set tabularView places while loading session
   */
  public setTabularViewPlaces(places) {
    this.tabularViewPlaces.next(places);
  }

  /**
   setter and getter method for selectedPlacesCtrlValue and radiusCtrlValue to handle place based search.
   **/
  public setSelectedPlacesCtrlValue(value) {
    this.selectedPlacesCtrlValue.next(value);
  }

  public getSelectedPlacesCtrlValue() {
    return this.selectedPlacesCtrlValue.asObservable();
  }

  public setRadiusCtrlValue(value) {
    this.radiusCtrlValue.next(value);
  }

  public getRadiusCtrlValue() {
    return this.radiusCtrlValue.asObservable();
  }

  public setTopMapData(value) {
    this.topMapData.next(value);
  }

  public getTopMapData() {
    return this.topMapData.asObservable();
  }

  /**
   *  getInventoryGroupsPlaces used to get the Places from /sites in media_type.
   */
  public getInventoryGroupsPlaces() {
    return this.inventoryGroupsPlaces;
  }

  /**
   * pushKeyLegends This method using to push the key legends from other components.
   * @param legend It will contain the data of legend need to push. Must be in KeyLegend format
   */
  public pushKeyLegends(legend: KeyLegend[], key: string) {
    const keys = this.keyLegends.getValue();
    keys[key] = legend;
    this.keyLegends.next(keys);
  }

  public clearKeyLegend(keys: any) {
    const keyLegends = this.keyLegends.getValue();
    keys.forEach(key => {
      delete keyLegends[key];
    });
    this.keyLegends.next(keyLegends);
  }

  public keyLegendsSubscriber(): Observable<any> {
    return this.keyLegends.asObservable();
  }

  getOperatorName(representations): string {
    let opp = '';
    if (representations) {
      const representation = representations.filter(rep => rep['representation_type']['name'] === 'Own')[0];
      if (representation) {
        opp = representation['account']['parent_account_name'];
        // opp = representation['division']['plant']['name'];
      }
    }
    return opp;
  }

  getSummaryFromSpots(spotRefers, id) {
    let summary = {};
    if (spotRefers) {
      const spotRefer = spotRefers.filter(rep => rep['spot_id'] && rep['spot_id'] === id)[0];
      if (spotRefer) {
        summary = spotRefer['measures'];
      }
    }
    return summary;
  }
  public getPopulationOpenState$(): Observable<boolean> {
    return this.populationOpen$.asObservable();
  }
  public setPopulationOponState$(state: boolean): void {
    this.populationOpen$.next(state);
  }
}
