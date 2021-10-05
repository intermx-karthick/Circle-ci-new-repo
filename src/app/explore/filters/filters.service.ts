import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, ReplaySubject, Subject } from 'rxjs';

import { FilterPillTypes } from '@interTypes/displayOptions';
import { Filters } from '@interTypes/filters';
import { SummaryRequest } from '@interTypes/summary';
import { ExploreSavePackageComponent } from '@shared/components/explore-save-package/explore-save-package.component';
import { WorkSpaceDataService } from '@shared/services/work-space-data.service';
import { Geography } from '@interTypes/inventory';
import { ChipSource } from '@interTypes/ChipsInput';
import { MarketSelectionState } from '@interTypes/marketType';
import { InventoryService } from '@shared/services/inventory.service';
import { TargetAudienceService } from '@shared/services/target-audience.service';

@Injectable()
export class FiltersService {
  private filterData: Partial<Filters> = {};
  private filterSelection: Partial<Filters> = {};
  private filterState = new ReplaySubject(1);
  private filterReset = new Subject<keyof Filters | 'All' | 'FilterInventory'>();
  private filterSidenav = new Subject();
  private filterSidenavOut = new Subject();
  private sessionDataPushed = new Subject();
  private selectedBaseID = 'pf_pop_a18p';
  private filterPills = new Subject();
  private createInventorySet: Subject<void> = new Subject<void>();
  private geographyOverride: Subject<MarketSelectionState> = new Subject<MarketSelectionState>();
  private filterPillData = {
    filters: {}
  };
  public isSessionFilter = false;
  public defaultAudience: any = {};
  public counties: any = [];
  private baseAudience = false;
  constructor(
    private workSpaceDataService: WorkSpaceDataService,
    public dialog: MatDialog,
    private inventoryService: InventoryService,
    private targetAudienceService: TargetAudienceService,
  ) {
    const themeSettings = JSON.parse(localStorage.getItem('themeSettings'));
    this.baseAudience = themeSettings?.baseAudienceRequired ?? false;
  }

  private emitData() {
    const selectedFilters: Partial<Filters> = {};
    Object.keys(this.filterSelection)
      .filter(item => (this.filterSelection[item]))
      .map(item => {
        selectedFilters[item] = this.filterData[item];
      });
    this.filterState.next({
      'data': selectedFilters,
      'selection': this.filterSelection
    });
  }

  public createNewInventorySet() {
    this.createInventorySet.next();
  }

  public onCreateNewInventorySet(): Observable<void> {
    return this.createInventorySet.asObservable();
  }

  /**
   * Use this function to set your filter data to service
   * @param filterType: String any one of filer type
   * @param data: the processed data from your filter which is ready
   * to be sent to gpFilter API directly, do not send unprocessed
   * data into this service
   */
  public setFilter(filterType: keyof Filters, data: any): void {
    if (filterType === 'plantUnitId') {
      this.filterData['geoPanelId'] = [];
    } else if (filterType === 'geoPanelId') {
      this.filterData['plantUnitId'] = [];
    }
    (this['filterData'][filterType] as any) = data;
    this.inventoryService.clearFilterCaches();
    this.targetAudienceService.clearFiltersCache();
    this.toggleFilter(filterType, true);
    // this.setFilterSidenav({open: false, tab: ''});
  }

  /**
   * Use this function in explore to get all the filters and get updates
   * every time a new filter is set or changed.
   */
  public getFilters(): Observable<any> {
    return this.filterState.asObservable();
  }

  /**
   * use this function to clear the filter
   * @param filterType: String any one of filer type
   * @param clearData: Boolean field and it will be true for reset the  data for that filter
   */
  public clearFilter(filterType: keyof Filters, clearData: boolean = false) {
    delete this.filterData[filterType];
    if (clearData) {
      this.toggleFilter(filterType, false, clearData);
      // this.emitData();
    }
  }

  public onReset(): Observable<any> {
    return this.filterReset.asObservable();
  }
  public resetFilter(type): void {
    this.filterReset.next(type);
  }

  public resetAll(): void {
    this.filterSelection = {};
    // this.emitData();
    this.filterReset.next('All');
  }

  /**
   * To clear filter inventory
   */

  public resetInventoryFilter() {
    const defineTarget = {};
    if (this.filterSelection['audience']) {
      defineTarget['audience'] = this.filterSelection['audience'];
    }
    if (this.filterSelection['market']) {
      defineTarget['market'] = this.filterSelection['market'];
    }
    if (this.filterSelection['period_days']) {
      defineTarget['period_days'] = this.filterSelection['period_days'];
    }
    this.filterSelection = { ...defineTarget };
    this.filterReset.next('FilterInventory');
  }

  /**
   * Use this function to toggle individual filters on and off without
   * losing the filter data
   * @param type type of the filter any one from Filters Interface
   * @param enabled
   */
  public toggleFilter(type: keyof Filters, enabled: boolean, clear: boolean = false): void {
    if (clear) {
      delete this.filterSelection[type];
    } else {
      (this.filterSelection[type] as any) = enabled;
    }
    this.emitData();
  }

  /**
   * This function used to toggle the filter inventories by id
   *
   * @param enabled
   */
  public toggleCombinedFilters(enabled: boolean): void {
    if (this.filterSelection['geoPanelId'] !== undefined || this.filterSelection['geoPanelId'] !== undefined) {
      this.filterSelection['geoPanelId'] = enabled;
      this.filterSelection['plantUnitId'] = enabled;
    }
    if (this.filterSelection['inventorySet'] !== undefined) {
      this.filterSelection['inventorySet'] = enabled;
    }
    this.emitData();
  }

  /**
   * Use this function to assign the inventory set and scenario
   * data into geopanel ID for submitting into the gpFilter API.
   *
   * @param filters: filter data need to format.
   * @formatThreshold flag to define it need to format Threshold or not
   */
  public normalizeFilterDataNew(filters: Object, formatThreshold: boolean = true): Partial<SummaryRequest> {
    const data: Partial<SummaryRequest> = {
      status_type_name_list: ['*']
    };
    // If no data, just return an empty array
    if (!filters['data']) {
      return {};
    }
    // If plant unit ID is there rest of the IDs and scenarios will be ignored
    if (filters['data']['plantUnitId'] &&
      filters['data']['plantUnitId'].length) {
      data.id_type = 'plant_frame_id';
      data.id_list = filters['data']['plantUnitId'];
    } else if (
      filters['data']['inventorySet'] ||
      filters['data']['scenario'] ||
      filters['data']['geoPanelId'] &&
      filters['data']['geoPanelId'].length) {
      data.id_type = 'spot_id';
      data.id_list = [
        ...(filters['data']['geoPanelId'] || []),
        ...(typeof filters['data']['inventorySet'] !== 'undefined' ? filters['data']['inventorySet']['ids']['gp_ids'] && filters['data']['inventorySet']['ids']['gp_ids'] || [] : []),
        ...(typeof filters['data']['scenario'] !== 'undefined' ? filters['data']['scenario']['ids']['gp_ids'] && filters['data']['scenario']['ids']['gp_ids'] || [] : [])
      ];
    }

    /*
      Here gp_ids and custom_ids is dummy array to maintain
      Geopath panel ids and custom db panel ids to decide which ids have to passed
      which APIs (Geopath or Elastic)
    */
    data.gp_ids = [];
    data.custom_ids = [];
    if (filters['data']['inventorySet'] || filters['data']['scenario']) {
      data.gp_ids = [
        ...(typeof filters['data']['inventorySet'] !== 'undefined' ? filters['data']['inventorySet']['ids']['gp_ids']
          && filters['data']['inventorySet']['ids']['gp_ids'] || [] : []),
        ...(typeof filters['data']['scenario'] !== 'undefined' ? filters['data']['scenario']['ids']['gp_ids']
          && filters['data']['scenario']['ids']['gp_ids'] || [] : [])
      ];
      data.custom_ids = [
        ...(typeof filters['data']['inventorySet'] !== 'undefined' ? filters['data']['inventorySet']['ids']['custom_ids']
          && filters['data']['inventorySet']['ids']['custom_ids'] || [] : []),
        ...(typeof filters['data']['scenario'] !== 'undefined' ? filters['data']['scenario']['ids']['custom_ids']
          && filters['data']['scenario']['ids']['custom_ids'] || [] : [])
      ];
    }
    /* if (filters['data']['geoPanelId']) {
      data.id_type = 'frame_id';
      data.id_list = filters['data']['geoPanelId'] || [];
      if (filters['data']['inventorySet']) {
        data.id_list.push(...filters['data']['inventorySet']);
        if (filters['data']['scenario']) {
          data.id_list.push(...filters['data']['scenario']['ids']);
        }
      }
    } */
    if (filters['data']['mediaTypeList'] && filters['data']['mediaTypeList']['selection']) {
      /* if (filters['data']['mediaTypeList']['selection']['medias']) {
        const medias = JSON.parse(JSON.stringify(filters['data']['mediaTypeList']['ids']['medias']));
        const frame_medias = [];
        Object.keys(medias).map(keyOne => {
          Object.keys(medias[keyOne]).map(keyTwo => {
            frame_medias.push(...medias[keyOne][keyTwo]);
          });
        });
        data['media_type_list'] =  Object.keys(medias);
        data['frame_media_name_list'] = frame_medias;
      } */
      if (filters['data']['mediaTypeList']['selection']['medias']) {
        data['frame_media_name_list'] = filters['data']['mediaTypeList']['ids']['medias'];
      }
      if (filters['data']['mediaTypeList']['selection']['mediaTypes']) {
        data['media_type_list'] = filters['data']['mediaTypeList']['ids']['mediaTypes'];
      }

      if (filters['data']['mediaTypeList']['selection']['classification']) {
        data['classification_type_list'] = filters['data']['mediaTypeList']['ids']['environments'];
      }
      if (filters['data']['mediaTypeList']['selection']['placeType']) {
        data['place_type_name_list'] = filters['data']['mediaTypeList']['ids']['placeType'];
      }
      if (filters['data']['mediaTypeList']['selection']['placementType']) {
        data['placement_type_name_list'] = filters['data']['mediaTypeList']['ids']['placementType'];
      }
      if (filters['data']['mediaTypeList']['selection']['placeName']) {
        data['place_id_list'] = filters['data']['mediaTypeList']['ids']['placeName'];
      }
      if (filters['data']['mediaTypeList']['ids']['construction'] && filters['data']['mediaTypeList']['selection']['construction']) {
        data['construction_type_list'] = filters['data']['mediaTypeList']['ids']['construction'];
      }
      if (filters['data']['mediaTypeList']['ids']['material'] !== 'both'
        && filters['data']['mediaTypeList']['selection']['material']) {
        data['digital'] = filters['data']['mediaTypeList']['ids']['material'] === 'true' ? true : false;
      }

      // selected media type count update & avoid duplicate
      /* if (filters['data']['mediaTypeList']['mediaParent'].length > 0) {
        data['construction_type_list'] = filters['data']['mediaTypeList']['mediaParent'];
      } */
      // have commented lines because no need to send digital true or false in filter get API request
      // if (filters['data']['mediaTypeList']['isDigital']
      // && !filters['data']['mediaTypeList']['isNonDigital']) {
      //   data['digital'] = true;
      // }
      // if (filters['data']['mediaTypeList']['isNonDigital']
      // && !filters['data']['mediaTypeList']['isDigital']) {
      //   data['digital'] = false;
      // }
    }
    /* if (filters['data']['mediaTypeList']) {
      const mediaTypes = JSON.parse(JSON.stringify(filters['data']['mediaTypeList']));
      if (mediaTypes.indexOf('Digital Only') > -1) {
        data['digital'] = true;
        mediaTypes.splice(0, 1);
      }
      const construction = [];
      const furniture = mediaTypes.indexOf('Furniture');
      const freeStanding = mediaTypes.indexOf('Freestanding');
      const exteriorWall = mediaTypes.indexOf('Exterior Wall');
      if (furniture > -1) {
        construction.push(mediaTypes[furniture]);
        mediaTypes.splice(furniture, 1);
      }
      if (freeStanding > -1) {
        construction.push(mediaTypes[freeStanding]);
        mediaTypes.splice(freeStanding, 1);
      }
      if (exteriorWall > -1) {
        construction.push(mediaTypes[exteriorWall]);
        mediaTypes.splice(exteriorWall, 1);
      }
      if (construction.length > 0) {
        data['construction_type_list'] = construction;
      }
      if (mediaTypes.length > 0) {
        data['media_type_list'] = mediaTypes;
      }
    } */
    if (filters['data']['mediaAttributes']) {
      const media = filters['data']['mediaAttributes'];
      if (media['orientationList']) {
        data['orientation'] = media['orientationList'];
      }
      // We are multiplying with 12 to convert feets to inches as API expecting inches
      if (media['panelSizeWidthRange']) {
        data['frame_width'] = {
          min: media['panelSizeWidthRange'][0] * 12,
          max: media['panelSizeWidthRange'][1] * 12,
        };
      }
      if (media['panelSizeHeightRange']) {
        data['frame_height'] = {
          min: media['panelSizeHeightRange'][0] * 12,
          max: media['panelSizeHeightRange'][1] * 12,
        };
      }

      if (media['spotLength']) {
        data['spot_length'] = media['spotLength'];
      }
      if (media['rotating'] !== '') {
        data['rotating'] = media['rotating'];
      }
      if (
        media['spotAudio'] !== undefined &&
        media['spotAudio'] !== null &&
        media['spotAudio'] !== '' &&
        media['spotAudio'] !== 'all'
      ) {
        data['spot_audio'] = media['spotAudio'];
      }
      if (
        media['spotFullMotion'] !== undefined &&
        media['spotFullMotion'] !== null &&
        media['spotFullMotion'] !== '' &&
        media['spotFullMotion'] !== 'all'
      ) {
        data['spot_full_motion'] = media['spotFullMotion'];
      }
      if (
        media['spotPartialMotion'] !== undefined &&
        media['spotPartialMotion'] !== null &&
        media['spotPartialMotion'] !== '' &&
        media['spotPartialMotion'] !== 'all'
      ) {
        data['spot_partial_motion'] = media['spotPartialMotion'];
      }
      if (
        media['spotInteractive'] !== undefined &&
        media['spotInteractive'] !== null &&
        media['spotInteractive'] !== '' &&
        media['spotInteractive'] !== 'all'
      ) {
        data['spot_interactive'] = media['spotInteractive'];
      }

      if (media['illuminationHrsRange'] && (media['illuminationHrsRange'][0] !== '00:00:00' || media['illuminationHrsRange'][1] !== '23:59:59')) {
        data['illumination_start_time'] = media['illuminationHrsRange'][0];
        data['illumination_end_time'] = media['illuminationHrsRange'][1];
      }
      if (media['auditStatusList'] && media['auditStatusList'].length) {
        data['status_type_name_list'] = media['auditStatusList'].map(status => status.name);
      }
    }
    if (
      filters['data']['market'] && filters['data']['market']
      && filters['data']['market']['selectedMarkets']
      && filters['data']['market']['selected'] !== 'us'
    ) {
      switch (filters['data']['market']['selected']) {
        case 'all':
          data['target_geography_list'] = filters['data']['market']['selectedMarkets'].map(market => market.id);
          break;
        case 'individual_all':
          if (filters['data']['market']['type'] === 'GEO_SET') {
            data['target_geography_list'] = [`local_${filters['data']['market']['selectedGeographySet']['market_type'].toLowerCase()}`];
          } else {
            data['target_geography_list'] = [`local_${filters['data']['market']['type'].toLowerCase()}`];
          }
          break;
        default:
          data['target_geography_list'] = [filters['data']['market']['selected']];
          break;
      }
    }
    if (this.defaultAudience && this.defaultAudience['audienceKey'] && this.baseAudience) {
      data['base_segment'] = this.defaultAudience['audienceKey'];
    }
    if (filters['data']['audience']) {
      data['target_segment'] = filters['data']['audience']['key'];
    } else {
      data['target_segment'] = this.defaultAudience['audienceKey'];
    }
    if (filters['data']['period_days']) {
      data['period_days'] = filters['data']['period_days'];
    }
    if (typeof filters['data']['operatorList'] !== 'undefined' &&
      filters['data']['operatorList'].length > 0) {
      data['operator_name_list'] = filters['data']['operatorList'];
    }
    // default call as descending order
    const sort = { 'measure': 'pct_comp_imp_target', 'type': 'desc' };
    if (filters && filters['data']['sortQuery'] && filters['data']['sortQuery']['value']) {
      sort['measure'] = filters['data']['sortQuery']['value'];
      sort['type'] = 'desc';
      // If sort order is set from the filter call, use that value. Used in tabular view
      if (filters['data']['sortQuery']['sortOrder']) {
        sort['type'] = filters['data']['sortQuery']['sortOrder'];
      }
    }
    data['sort'] = sort;
    if (formatThreshold && filters['data']['thresholds']) {
      const measures_range_list = [];
      /** As API team requested we have conventing the percentage value in to float here (value / 100) eg: 1%/100 = 0.01 **/
      if (typeof filters['data']['thresholds']['targetCompPer'] !== 'undefined') {
        const targetCompPer = {
          type: 'pct_comp_imp_target',
          min: filters['data']['thresholds']['targetCompPer'][0] / 100,
          max: filters['data']['thresholds']['targetCompPer'][1] / 100
        };
        measures_range_list.push(targetCompPer);
      }
      if (typeof filters['data']['thresholds']['targetImp'] !== 'undefined') {
        const targetImp = {
          type: 'imp_target',
          min: filters['data']['thresholds']['targetImp'][0],
          max: filters['data']['thresholds']['targetImp'][1]
        };
        if (targetImp['max'] >= 150000) {
          delete targetImp['max'];
        }
        measures_range_list.push(targetImp);
      }
      if (typeof filters['data']['market'] !== 'undefined') {
        if (typeof filters['data']['thresholds']['inMarketCompPer'] !== 'undefined') {
          const inMarketCompPer = {
            type: 'pct_comp_imp_target_inmkt',
            min: filters['data']['thresholds']['inMarketCompPer'][0] / 100,
            max: filters['data']['thresholds']['inMarketCompPer'][1] / 100
          };
          measures_range_list.push(inMarketCompPer);
        }
        /** Here converting logarithmic scale value to original value
         * 0 - 74: 15 stops
         * 75 - 149: 75 stops
         * 150 - 499: 70 stops
         * 500 - 1000: 50 stops
         **/
        if (typeof filters['data']['thresholds']['inMarketCompIndex'] !== 'undefined') {
          const inMarketCompIndex = {
            type: 'index_comp_target',
            min: this.targetAudienceMinMax(filters['data']['thresholds']['inMarketCompIndex'][0]),
            max: this.targetAudienceMinMax(filters['data']['thresholds']['inMarketCompIndex'][1])
          };
          measures_range_list.push(inMarketCompIndex);
        }
      }
      if (measures_range_list) {
        data['measures_range_list'] = measures_range_list;
      }
    }

    if (filters['data']['measuresRelease']) {
      data['measures_release'] = filters['data']['measuresRelease'];
    }
    // data['base'] = this.selectedBaseID;
    if (filters['data']['location'] && filters['data']['location']['region']) {
      if (filters['data']['location']['type'] === 'placeSetView') {
        data.id_type = 'spot_id';
        if (filters['data']['location']['placePackState'] &&
          filters['data']['location']['placePackState']['spatialSearchInvIds'] &&
          filters['data']['location']['placePackState']['spatialSearchInvIds'].length) {
          data.id_list = filters['data']['location']['placePackState']['spatialSearchInvIds'];
        }
      }
      if (filters['data']['location']['type'] === 'circularPolygon' ||
        filters['data']['location']['type'] === 'regularPolygon' ||
        filters['data']['location']['type'] === 'mapViewPolygon') {
        data['region'] = filters['data']['location']['region'];
        data.id_type = 'spot_id';
        if (filters['data']['location']['polygonIdsArray'] &&
          filters['data']['location']['polygonIdsArray'].length) {
          data.id_list = filters['data']['location']['polygonIdsArray'];
        }
      }
    }

    if (filters['data']['location'] && filters['data']['location']['selectedGeoLocation']) {
      const selected: string[] = [];
      const original: ChipSource<Geography>[] = filters['data']['location']['selectedGeoLocation'];
      original.forEach(item => {
        if (item.data.type !== 'States') {
          selected.push(item.data.id);
        } else {
          // For states we are sending counties as GP API doesn't support states
          const selectedCounties = this.counties
            .filter(county => county.state === item.data.id)
            .map(county => county.id);
          selected.push(...selectedCounties);
        }
      });
      if (selected.length > 0) {
        data['inventory_market_list'] = selected;
      }
    }
    return data;
  }

  targetAudienceMinMax(value) {
    let original = value;
    if (value <= 15) {
      original = value * 5;
    } else if (value <= 90) {
      original = (value - 15) + 75;
    } else if (value <= 160) {
      original = (value - 90) * (350 / 70) + 150;
    } else if (value <= 210) {
      original = (value - 160) * (500 / 50) + 500;
    }
    return original;
  }

  /**
   * Use this function to set sidenav object
   * @param sidenav: MatSidenav object which will use to control filter sidenav.
   **/
  public setFilterSidenav(filterSidenav): void {
    this.filterSidenav.next(filterSidenav);
  }

  public getFilterSidenav(): Observable<any> {
    return this.filterSidenav.asObservable();
  }

  public setFilterSidenavOut(state): void {
    this.filterSidenavOut.next(state);
  }

  public getFilterSidenavOut(): Observable<any> {
    return this.filterSidenavOut.asObservable();
  }

  public saveExploreSession(filters) {
    localStorage.setItem('savedExploreSession', JSON.stringify(filters));
  }

  public getExploreSession() {
    return JSON.parse(localStorage.getItem('savedExploreSession'));
  }

  public setFilterFromSession(filters) {
    const filterData = filters;
    this.filterData = filters['data'] || {};
    filterData['data'] = filters['data'] || {};
    this.filterSelection = filters['selection'] || {};
    filterData['selection'] = filters['selection'] || {};

    if (Object.keys(filters['selection']).length !== 0
      && filters['selection'].constructor === Object) {
      this.isSessionFilter = true;
    }
    this.filterState.next(filterData);
  }

  public setFilterFromView(filters) {
    const filterData = filters;
    this.filterData = filters['data'] || {};
    filterData['data'] = filters['data'] || {};
    this.filterSelection = filters['selection'] || {};
    filterData['selection'] = filters['selection'] || {};
    this.sessionDataPushed.next(true);
  }

  /**
   * Use this function act as trigger to set filter data while filters pushed in session.
   * it will call every time a filter data pushed in session.
   */
  public checkSessionDataPushed(): Observable<any> {
    return this.sessionDataPushed.asObservable();
  }

  public getFilterData() {
    return this.filterData;
  }

  public updateFiltersData(data = {}) {
    const filters = this.getExploreSession();
    if (data && filters && filters['data']) {
      Object.keys(data)
        .map(key => {
          filters['data'][key] = data[key];
        });
      this.saveExploreSession(filters);
    }
  }

  public saveMapPosition(polygon) {
    let filters = this.getExploreSession();
    if (filters && filters['data']) {
      filters['data']['mapPosition'] = polygon;
      this.saveExploreSession(filters);
    } else {
      filters = {};
      filters['data'] = {};
      filters['data']['mapPosition'] = polygon;
      this.saveExploreSession(filters);
    }
  }

  public saveSelectedFids(fids) {
    let filters = this.getExploreSession();
    if (filters && filters['data']) {
      filters['data']['selectedFids'] = fids;
      this.saveExploreSession(filters);
    } else {
      filters = {};
      filters['data'] = {};
      filters['data']['selectedFids'] = fids;
    }
  }

  openPackage(type = 'add', p = null, saveFromFilter = false, selectedFidsArray = [], selectedPackage = {}, clientId = null, callback = null) {
    const data = {};
    let width = '500px';
    const height = 'auto';
    data['inventories'] = selectedFidsArray;
    data['from'] = 'explore';
    data['type'] = type;
    data['saveFromFilter'] = saveFromFilter;
    data['clientId'] = clientId;
    if (type !== 'add') {
      if (p != null) {
        data['package'] = p;
      } else {
        data['package'] = selectedPackage;
      }
    }
    if (type === 'exist') {
      width = '586px';
    }
    const browser = this.dialog.open(ExploreSavePackageComponent, {
      height: height,
      data: data,
      width: width,
      closeOnNavigation: true,
      panelClass: 'save-package-container'
    }).afterClosed().subscribe(res => {
      this.workSpaceDataService.getPackages();
      if(res && callback) callback(); // reload inventory sets an only updates
    });
  }

  public overrideGeographyFilter(data: MarketSelectionState) {
    this.geographyOverride.next(data);
  }

  public onOverrideGeographyFilter(): Observable<MarketSelectionState> {
    return this.geographyOverride.asObservable();
  }

  public getFilterPills(): Observable<any> {
    return this.filterPills.asObservable();
  }

  public setFilterPill(
    pillKey: keyof FilterPillTypes,
    pill: string,
    subKey = null
  ): void {
    if (pillKey === 'filters' && subKey) {
      if (!this.filterPillData[pillKey]) {
        this.filterPillData[pillKey] = {};
      }
      this.filterPillData[pillKey][subKey] = pill;
    } else {
      this.filterPillData[pillKey] = pill;
    }
    this.filterPills.next(this.filterPillData);
  }

  public removeFilterPill(pillKey: keyof FilterPillTypes) {
    delete this.filterPillData[pillKey];
    this.filterPills.next(this.filterPillData);
  }

  public clearFilterPills(): void {
    this.filterPillData = {
      filters: {}
    };
    this.filterPills.next(this.filterPillData);
  }

  setCounties(counties) {
    this.counties = counties;
  }

  /**
   *
   * @param timeString inpot the time Exp: 00, 01 , 02
   */
  public timeConvert(timeString) {
    const hourEnd = timeString.indexOf(':');
    const H = +timeString.substr(0, hourEnd);
    const h = H % 12 || 12;
    const ampm = (H < 12 || H === 24) ? ' AM' : ' PM';
    timeString = h + timeString.substr(hourEnd, 3) + ampm;
    return timeString; // return adjusted time or original string
  }
}
