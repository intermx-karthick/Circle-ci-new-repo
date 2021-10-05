import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Summary, SummaryRequest, SummaryResponse } from '@interTypes/summary';
import {
  InventroySearch,
  InventroySearchResponse
} from '@interTypes/inventorySearch';
import {Geography, Inventory, InventoryDetailsReq, AuditStatus} from '@interTypes/inventory';
import { forkJoin, Observable, of, throwError, zip, concat, fromEvent } from 'rxjs';
import { map, filter, tap, publishReplay, refCount, catchError, withLatestFrom, publish } from 'rxjs/operators';
import { AppConfig } from '../../app-config.service';
import {Market, MarketType} from '@interTypes/marketType';
import { ThemeService } from '@shared/services/theme.service';
import {GroupAutocompleteChipSource} from '@interTypes/ChipsInput';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {ConfirmationDialog} from '@interTypes/workspaceV2';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {Helper} from '../../classes';
import { HttpErrorHandlerService } from '@shared/services/http-error-handler.service';
import {
  StructureTypesResponse,
  StatusTypeResponse,
  CreateInventoryResponse,
} from '@interTypes/inventory-management';
import { PlacementTypeResponse } from '@interTypes/inventory';
import {
  MediaClassResponse,
  MediaTypesResponse,
  PlaceTypesResponse,
  VendorsSearchPagination,
  VendorsSearchResponse,
  IllumnationTypeResponse
} from '@interTypes/inventory-management';
import { CreateInventoryPayload } from '../../explore/inventory-management/create-inventory.payload';

const IVENTORY_COUNT_LIMIT = 10000;

@Injectable()
export class InventoryService {

  // TO be used for elastic search calls
  private siteName: string;
  private states: Observable<any>;
  private dmaObservable: Observable<Market[]>;
  private counties: any;
  private savedVendors$: Observable<VendorsSearchResponse> = null;
  private savedMediaClasses$: Observable<MediaClassResponse> = null;
  private savedMediaTypes$: Observable<MediaTypesResponse> = null;
  private savedStructureTypes$: Observable<StructureTypesResponse> = null;
  private statusTypes$: Observable<StatusTypeResponse> = null;
  private placementTypeList$: Observable<PlacementTypeResponse> = null;
  private savedPlaceTypes$: Observable<PlaceTypesResponse> = null;
  private illuminationTypes$: Observable<any> = null;
  private operatorFilterData$: Observable<any> = null;
  private operatorFilterDataFromES$: Observable<any> = null;
  private placeName$: Observable<any> = null;
  private placeType$: Observable<any> = null;
  private segmentsCatalogList$: Observable<any> = null;

  private handleError: <T>(operationName: string, defaultData: T) => (res: HttpErrorResponse) => Observable<any>;
  // TODO: Need to change name
  public clearButtonSource: Observable<any> = null;
  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private theme: ThemeService,
    private matDialog: MatDialog,
    private httpErrorHandler: HttpErrorHandlerService,
  ) {
    const themeSettings = this.theme.getThemeSettings();
    this.siteName = themeSettings && themeSettings.site;
    this.handleError = this.httpErrorHandler.createHandleError('Inventory Service');
  }

  getSummary(filters: Partial<SummaryRequest>, noLoader = true): Observable<Partial<Summary>> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http
      .post(
        this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/summary/search',
        this.formatFilters(filters),
        { headers: reqHeaders }
      ).pipe(map((response: SummaryResponse) => response.summaries[0]));
  }
  public getSummaryForAllGeographies(filters: Partial<SummaryRequest>, noLoader = true): Observable<SummaryResponse> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http
      .post<SummaryResponse>(
        this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/summary/search',
        this.formatFilters(filters),
        { headers: reqHeaders }
      );
  }
  private formatFilters(filters) {
    const formattedFilters = Helper.deepClone(filters);
    if (formattedFilters['region']) {
      delete formattedFilters['region'];
    }
    return formattedFilters;
  }
  getInventoryIds(filters: Partial<SummaryRequest>, noLoader = true): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const filter = Helper.deepClone(filters);
    delete filter['sort'];
    filter['page_size'] = 500001;
    return this.http.post(
      this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/frame/id/search',
      filter,
      { headers: reqHeaders }
    );
  }

  getInventorySpotIds(filters: Partial<SummaryRequest>, noLoader = true, pageSize = 50001, removeSort = true): Observable<any> {
    let reqHeaders = new HttpHeaders();
    if (noLoader) {
      reqHeaders = reqHeaders.set('hide-loader', 'hide-loader');
    }
    const filter = Helper.deepClone(filters);
    if (removeSort) {
      delete filter['sort'];
    }
    if (filter['region']) {
      delete filter['region'];
    }
    filter['page_size'] = pageSize; // Changes from 500001 to 50000 because the API returin buffer issue due to large data set.
    return this.http.post(
      this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/spot/id/search',
      filter,
      { headers: reqHeaders }
    );
  }

  /**
   * This method takes the GP filter data and returns an array of spot IDs from the API
   * The main difference between this and @getInventorySpotIds method is,
   * this handles the data part and returns just the array of spot ids.
   * @param filters
   * @param noLoader
   */
  getSpotIdsFromAPI(filters: Partial<SummaryRequest>, pageSize = 50001): Observable<any> {
    // TODO : need to change this method in places where the below method is used in explore and workspace
    return this.getInventorySpotIds(filters, false, pageSize, false)
      .pipe(map(res => {
        if (!res['inventory_summary'] || !res['inventory_summary']['frame_list']) {
          return [];
        }
        return res['inventory_summary']['frame_list'].flatMap((frame) => frame['spot_id_list']);
      }));
  }
  getResidesInventories(
    selectedFilters: Partial<SummaryRequest>,
    type = 'dma',
    ids = [],
    noLoader = true
  ): Observable<any> {
    selectedFilters['target_geography_list'] = ['local_' + type];
    selectedFilters['id_type'] = 'spot_id';
    selectedFilters['id_list'] = ids;
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const filters = Helper.deepClone(selectedFilters);
    filters['page'] = 1;
    if (!filters['page_size']) {
      filters['page_size'] = 100;
    }
    return this.http
      .post(this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/search', filters, { headers: reqHeaders })
      .pipe(
        filter((result: InventroySearchResponse) => result['inventory_summary']['inventory_count'] > 0),
        map((result: InventroySearchResponse) => {
            const spotMeasures = {};
            result['inventory_summary']['inventory_items'].forEach(item => {
              item.spot_references.forEach(spot => {
                const localMeasures = {};
                Object.keys(spot['measures']).forEach(measureKey => {
                  localMeasures[`${type}_${measureKey}`] = spot['measures'][measureKey];
                });
                // calculating out market by subtracting in market from total impressions
                localMeasures[`${type}_out_market_imp`] = (spot['measures']['imp'] > 0 ? spot['measures']['imp'] : 0) -
                  (spot['measures']['imp_inmkt'] > 0 ? spot['measures']['imp_inmkt'] : 0);
                localMeasures[`${type}_per_out_market_imp`] = Math.round((localMeasures['out_market_imp'] * 100) /
                  (spot['measures']['imp'] > 0 ? spot['measures']['imp'] : 0));
                spotMeasures[spot['spot_id']] = localMeasures;
              });
            });
            return spotMeasures;
        }));
  }
  getInventories(
    filters: Partial<SummaryRequest>,
    noLoader = true
  ): Observable<InventroySearch[]> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const filter = Helper.deepClone(filters);
    if (!filter['page_size']) {
      filter['page_size'] = 100;
    }
    return this.http
      .post(this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/search', filter, { headers: reqHeaders })
      .pipe(
        map(
          (result: InventroySearchResponse) =>
            result['inventory_summary']['inventory_items']
        )
      );
  }
  getInventoryDetails$( filters: Partial<SummaryRequest>, noLoader = true): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const filter = Helper.deepClone(filters);
    if (!filter['page_size']) {
      filter['page_size'] = 100;
    }
    return this.http.post(
      this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/search', filter, {headers: reqHeaders})
      .pipe(map((result) => result['inventory_summary']), catchError(error => {
        return of({
          inventory_items: []
        });
      }));
  }
  getInventoryFrame(params, noLoader = true): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    let url = this.config.envSettings['API_ENDPOINT_V2.1'] +
      'inventory/' + params['frameId'] + '?';

    if (params['measures']) {
      url = url + 'measures=' + params['measures'] + '&';
    }
    // url = url + 'hourly_measures=' + hoursMeasure + '&';
    // As we don't have data for otheraudiences so that we configured static data.
    if (params.base_segment) {
      url = url + 'base_segment=' + params['base_segment'] + '&';
    }
    // if (params.target_segment) {
      url = url + 'target_segment=' + params['target_segment'] + '&';
      if (params['measures_release']) {
        url = url + 'measures_release=' + params['measures_release'] + '&';
      }
    // }
    /* if (params.target_geography) {
      url = url + 'target_geography=' + params.target_geography;
    }*/
    url = url.replace(/\?$/, '');
    url = url.replace(/&$/, '');
    return this.http
      .get(url, { headers: reqHeaders });
  }

  /**
 *
 * @param filters  filter spot id data
 * @param noLoader
 * This function is used to calculate the pagination
 */

  getInventoriesPagesCount(
    filters: Partial<SummaryRequest>,
    noLoader = true
  ): Observable<InventroySearch[]> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const filter = Helper.deepClone(filters);
    filter['page_size'] = 100;
    return this.http
      .post(this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/search', filter, { headers: reqHeaders })
      .pipe(
        map(
          (result: InventroySearchResponse) =>
            result['inventory_summary']['pagination']
        )
      );
  }

  /**
   *
   * @param params  spotids
   * @param noLoader
   * This function user to get the sppecific spot inventory data
   */

  getSingleInventory(params: InventoryDetailsReq, noLoader = true): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    let url = this.config.envSettings['API_ENDPOINT_V2.1'] +
      'inventory/search';
   const apiParams = {
      'id_list': [ params['spotId'] ],
      'id_type': 'spot_id'
    };
   /* if (params.base_segment) {
      url = url + 'base_segment=' + params.base_segment + '&';
    }
    if (params.target_segment) {
      url = url + 'target_segment=' + params.target_segment + '&';
    }
    if (params.target_geography) {
      url = url + 'target_geography=' + params.target_geography;
    }
    url = url.replace(/\?$/, '');
    url = url.replace(/&$/, '');*/
    return this.http
      .post(url, apiParams, { headers: reqHeaders })
      .pipe(map((response: Inventory) => response));
  }


  /**
   * This method is to get the filters data
   * @param filters
   */
  public getFilterData(filters: Partial<SummaryRequest>, noLoader = true): Observable<any> {
    let reqHeaders  = new HttpHeaders();
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.post(
      this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/summary/search',
      this.formatFilters(filters), { headers: reqHeaders }
    );
  }

  /**
   * This method is to get the filters data
   * @param filters
   */
  public getOperatorsFilterData(filters: Partial<SummaryRequest>): Observable<any> {
    return this.operatorFilterData$ ||
      (
        this.operatorFilterData$ = this.getFilterData(filters)
          .pipe(
            publishReplay(1),
            refCount(),
            catchError(error=>{
              this.operatorFilterData$ = null;
              return throwError(error);
            })
          )
      )
  }

  /**
   * This is new method to get the operators
   * @param filters
   */
  public getOperators(filters: Partial<SummaryRequest>, noLoader = true): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.post(
      this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/summary/search',
      this.formatFilters(filters), { headers: reqHeaders }
    ).pipe(filter((results: any) => {
      return results.summaries.sort((operator1, operator2) => operator2.spots - operator1.spots);
    }),
      map((data: any) => {
        return data.summaries.map((operator, index) => {
          return { id: operator.summarizes.id, name: operator.summarizes.name, count: operator.spots, slno: index + 1 };
        }).filter((operator) => operator.id);
      }));
  }
  /**
   * This method is to get the marketTotals
   * @param filters
   */
  public getMarketTotals(filters: Partial<SummaryRequest>, noLoader = true): Observable<any> {
    const filterData = Helper.deepClone(filters);
    if (filterData['region']) {
      delete filterData['region'];
    }
    filterData['summary_level_list'] = ['DMA'];
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.post(
      this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/summary/search',
      filterData, { headers: reqHeaders }
    ).pipe(map(response => this.formatMarketBubble(response['summaries'])));
  }
  public formatMarketBubble(summaries) {
    const frames = [];
    if (summaries && summaries.length > 0) {
      summaries.map(summary => {
        const temp = {};
        temp['type'] = 'Feature';
        temp['geometry'] = summary['summarizes']['geometry'];

        temp['properties'] = {};
        temp['properties']['id'] = summary['summarizes']['id'];
        temp['properties']['name'] = summary['summarizes']['name'];
        temp['properties']['panelCount'] = summary['spots'];
        // checking whether frames are available or not minimum required is 1
        if (summary['frames'] > 0) {
          frames.push(temp);
        }
      });
    }
    return { 'type': 'FeatureCollection', 'features': frames };
  }


  getMarkets() {
    const data = { 'summary_level_list': ['DMA'] };
    const reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.http
      .post(this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/summary/search', data, { headers: reqHeaders })
      .pipe(map(response => {
        const markets = [];
        response['summaries']
          .map(summary => {
            if (summary['summarizes'] && summary['summarizes']['type'] === 'DMA') {

              markets.push({
                name: summary['summarizes']['name'],
                id: summary['summarizes']['id'],
                count: summary['frames'],
              });
            }
          });
        return markets.sort((a, b) => {
          const nameA = a.name.toUpperCase(); // ignore upper and lowercase
          const nameB = b.name.toUpperCase(); // ignore upper and lowercase
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        });
      }));
  }
  getMarketsFromFile(): Observable<Market[]> {
    if (!this.dmaObservable) {
      return this.dmaObservable =  this.http.get<Market[]>('../../../assets/DMAs.json').pipe(
        publishReplay(1),
        refCount());
    }
    return this.dmaObservable;
  }

  /**
   *This funtion call the local file from assets
   *
   * @returns CBSA List Market
   * @memberof InventoryService
   */
  getMarketsCBSAFromFile(): Observable<Market[]> {
    return this.http.get<Market[]>('../../../assets/CBSAs.json');
  }

  /**
   * This method is to filter the inventories in scenarios module
   * @param filters
   */
  public normalizeFilterDataNew(filters: Object): Partial<SummaryRequest> {
    /* We are using  defaultAudience by default all API call so taken directly from localstorage*/
    const defaultAudience = JSON.parse(localStorage.getItem('defaultAudience'));
    const data: Partial<SummaryRequest> = {
      status_type_name_list: ['*']
    };
    // If no data, just return an empty array
    if (!filters) {
      return {};
    }
    // If plant unit ID is there rest of the IDs and scenarios will be ignored
    if (filters['operatorPanelIdList'] && filters['operatorPanelIdList'].length > 0) {
      data.id_type = 'plant_frame_id';
      data.id_list = filters['operatorPanelIdList'];
    } else if (filters['geopathPanelIdList'] && filters['geopathPanelIdList'].length > 0) {
      data.id_type = 'spot_id';
      data.id_list = filters['geopathPanelIdList'];
    }
    if (filters['customPanelIdList'] && filters['customPanelIdList'].length > 0) {
      data.id_type = 'spot_id';
      data.custom_ids = filters['customPanelIdList'];
    }

    if (filters['audienceMarket'] && filters['audienceMarket'].length) {
      data['target_geography_list'] = filters['audienceMarket'];
    }

    if (filters['geographies'] && filters['geographies'].length) {
      data['inventory_market_list'] = filters['geographies'];
    }

    const sort = { 'measure': 'pct_comp_imp_target', 'type': 'asc' };
    if (filters['sort']) {
      sort['measure'] = filters['sort'];
      sort['type'] = filters['sort_type'];
    }
    data['sort'] = sort;
    if (filters['audience']) {
      data['target_segment'] = filters['audience'];
    }
    if (defaultAudience && defaultAudience['audienceKey']) {
      data['base_segment'] = defaultAudience['audienceKey'];
    }
    if (filters['period_days']) {
      data['period_days'] = filters['period_days'];
    }
    // Media types API request formatting
    data['frame_media_name_list'] = [];
    data['classification_type_list'] = [];
    data['media_type_list'] = [];
    data['construction_type_list'] = [];
    data['place_type_name_list'] = [];
    data['placement_type_name_list'] = [];
    if (filters['mediaTypeList'] && filters['mediaTypeList'].length) {
      filters['mediaTypeList'].forEach(mediaType => {
        if (mediaType.ids.medias && mediaType.ids.medias.length > 0) {
          data['frame_media_name_list'].push(...mediaType.ids.medias);
        }
        if (mediaType.ids['environments'] && mediaType.ids.environments.length > 0) {
          data['classification_type_list'].push(...mediaType.ids.environments);
        }
        if (mediaType.ids['construction'] && mediaType.ids.construction.length > 0) {
          data['construction_type_list'].push(...mediaType.ids.construction);
        }
        if (mediaType.ids['mediaTypes'] && mediaType.ids.mediaTypes.length > 0) {
          data['media_type_list'].push(...mediaType.ids.mediaTypes);
        }
        if (mediaType.ids['placeType']) {
          data['place_type_name_list'].push(mediaType.ids.plalaceType);
        }
        if (mediaType.ids['placementType']) {
          data['placement_type_name_list'].push(mediaType.ids.placementType);
        }
      });
      if (
        !this.isAllMedia(filters['mediaTypeList']) &&
        !this.isMaterialMediaNotSelected(filters['mediaTypeList'])
      ) {
        if (this.isAllDigitalMedia(filters['mediaTypeList'])) {
          data['digital'] = true;
        } else if (this.isAllNonDigitalMedia(filters['mediaTypeList'])) {
          data['digital'] = false;
        }
      }
    }
    if (!data['frame_media_name_list'].length) {
      delete data['frame_media_name_list'];
    }
    if (!data['classification_type_list'].length) {
      delete data['classification_type_list'];
    }
    if (!data['media_type_list'].length) {
      delete data['media_type_list'];
    }
    if (!data['construction_type_list'].length) {
      delete data['construction_type_list'];
    }
    if (!data['place_type_name_list'].length) {
      delete data['place_type_name_list'];
    }
    if (!data['placement_type_name_list'].length) {
      delete data['placement_type_name_list'];
    }
    // Media formatting end
    if (typeof filters['operatorList'] !== 'undefined' &&
    filters['operatorList'].length > 0) {
      data['operator_name_list'] = filters['operatorList'].map(operator => operator['id']);
    }
    if (filters['thresholds']) {
      data['measures_range_list'] = this.formatMeasuresRangeList(filters['thresholds']);
    }
    if (filters['mediaAttributes']) {
      const media = filters['mediaAttributes'];
      if (media['orientationList']) {
        data['orientation'] = media['orientationList'];
        /** Remove orientation filter is selected value all */
        if ((data['orientation'] && data['orientation']['option'] && data['orientation']['option'] === 'All') ||  (data['orientation']['min'] === null && data['orientation']['max'] === null)) {
          delete data['orientation'];
        }
        /* Remove scenatio media attribute dummy showing option */
        if (data['orientation'] && data['orientation']['option'] !== undefined && data['orientation']['option']) {
          delete data['orientation']['option'];
        }
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
        data['spot_length'] = {};
        data['spot_length']['min'] = parseInt(media['spotLength']['min']);
        data['spot_length']['max'] = parseInt(media['spotLength']['max']);
      }
      if ((media['rotating'] !== '' && media['rotating'] !== null) && (media['rotating'] !== undefined && media['rotating'].toString().toLowerCase() !== 'all')) {
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
      if (media['illuminationHrsRange']) {
        data['illumination_start_time'] = media['illuminationHrsRange'][0];
        data['illumination_end_time'] = media['illuminationHrsRange'][1];
      }
      if (media['auditStatusList'] && media['auditStatusList'].length) {
        data['status_type_name_list'] = media['auditStatusList'].map(status =>  status && status.name);
      }
    }
    return data;
  }

  // The below two methods have to move to common place as these are also in market plan service
  private formatMeasuresRangeList(thresholdMeasure) {
    const measures_range_list = [];
    if (typeof thresholdMeasure['inMarketCompIndex'] !== 'undefined' || typeof thresholdMeasure['targetImp'] !== 'undefined') {
      /** As API team requested we have conventing the percentage value in to float here (value / 100) eg: 1%/100 = 0.01 **/
      if (typeof thresholdMeasure['inMarketCompIndex'] !== 'undefined') {
       /** Here converting logarithmic scale value to original value
         * 0 - 74: 15 stops
         * 75 - 149: 75 stops
         * 150 - 499: 70 stops
         * 500 - 1000: 50 stops
        **/
      //  if (typeof filters['data']['thresholds']['inMarketCompIndex'] !== 'undefined') {}

      const inMarketCompIndex = {
        type: 'index_comp_target',
        min: this.targetAudienceMinMax(thresholdMeasure['inMarketCompIndex'][0]),
        max: this.targetAudienceMinMax(thresholdMeasure['inMarketCompIndex'][1])
      };
      measures_range_list.push(inMarketCompIndex);
     }
      if (typeof thresholdMeasure['targetImp'] !== 'undefined') {
        const targetImp = {
          type: 'imp_target',
          min: thresholdMeasure['targetImp'][0],
          max: thresholdMeasure['targetImp'][1]
        };
        if (targetImp['max'] >= 150000) {
          delete targetImp['max'];
        }
        measures_range_list.push(targetImp);
      }
    } else {
      /** Adding default threshold filter values for existing market plan */
      const threshold = [{
          type: 'index_comp_target',
          min: 50,
          max: 1000
          }, {
            type: 'imp_target',
            min: 0
          }
        ];
        measures_range_list.push(...threshold);
    }
    return measures_range_list;
  }

  private targetAudienceMinMax (value) {
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


  getInventoriesWithAllData(
    filters: Partial<SummaryRequest>,
    noLoader = true
  ): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const filter = Helper.deepClone(filters);
    return this.http
      .post(this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/search', filter, { headers: reqHeaders });
  }

  /**
   * This method is to get list of markets for geography filter
   * @param searchText
   * @param noLoader
   */
  public getGeographies(searchText, noLoader = true): Observable<GroupAutocompleteChipSource<Geography>[]> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const reqUrl = this.config.envSettings['API_ENDPOINT_V2.1'] + 'markets/search?q=' + searchText;
    const geographies$ = this.http.get(reqUrl, { headers: reqHeaders })
      .pipe(catchError(error => {
        const emptyData = {
          markets: []
        };
        return of(emptyData);
      }));
    return forkJoin(geographies$, this.getFilteredStatesFromFile(searchText))
      .pipe(
        map(([geoData, states]) => {
          // Grouping the API data based on its type and formatting it to interface
          const groupedGeography: [] = geoData['markets'].reduce(
            (geographies, geography) =>
              Object.assign(geographies, {
                [geography.type]: (geographies[geography.type] || []).concat({
                  label: geography.name,
                  type: geography.type,
                  id: geography.id,
                })
              }),
            {}
          );
          // formatting and merging local file state data
          if (states.length > 0) {
            groupedGeography['States'] = states.map(state => {
              return {
                label: state.name,
                type: 'States',
                id: state.id,
              };
            });
          }


          // Reformatting combined data to be able to use with option-groups
          const formattedData: GroupAutocompleteChipSource<Geography>[] = [];
          Object.keys(groupedGeography).forEach(key => {
            formattedData.push({label: key, data: groupedGeography[key]});
          });
          return formattedData.sort((a, b) => a.label.localeCompare(b.label));
        })
      );
  }
  public showGeographiesOverrideDiaglog(title='Would you like to apply the target market selection as a geographical filter for inventory?', description='This will override any previous geographical filters you may have applied.'): MatDialogRef<ConfirmationDialogComponent> {
    const dialogData: ConfirmationDialog = {
      cancelButtonText: 'No',
      confirmButtonText: 'Yes',
      confirmTitle: title,
      confirmDesc: description,
      headerCloseIcon: false,
    };
    return this.matDialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '580px',
      panelClass: 'location-overriding-dialog'
    });
  }
  

  /**
   * This method is to get list of markets based on type and search value
   * @param searchText search value
   * @param marketType Any one of CBSA, DMA, Zip Codes & County
   * @param noLoader
   */
  public getMarketsData(marketType: MarketType, searchText: string = '', page = 0, noLoader = true) {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    let url = `${this.config.envSettings['API_ENDPOINT_V2.1']}markets/search`;
    if (searchText) {
      url = `${url}?q=${searchText}&type=${marketType}&page=${page}`;
    } else {
      url = `${url}?type=${marketType}&page=${page}`;
    }
    return this.http.get(url, { headers: reqHeaders });
  }

  /**
   * This method is to get list of markets based on type and search value
   * @param marketId Market ID
   * @param noLoader
   */
  public getMarketByID(marketId, noLoader = true) {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url = `${this.config.envSettings['API_ENDPOINT_V2.1']}markets/${marketId}`;
    return this.http.get(url, { headers: reqHeaders });
  }

  /**
   *
   * @param spotId inventory search by spot id
   * @param noLoader Common loader no need by default
   */
  searchInventoryById(spotId, noLoader = true): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url = this.config.envSettings['API_ENDPOINT_V2.1'] +
      'inventory/spot/' + spotId;
    return this.http
      .get(url, { headers: reqHeaders })
      .pipe(map((response: Inventory) => response));
  }
  getDataFromFile(filename = ''): Observable<Market[]> {
    return this.http.get<Market[]>('../../../assets/data/' + filename + '.json');
  }
  getFilteredStatesFromFile(query: string = ''): Observable<any> {
    if (!this.states) {
      this.states = this.http.get('../../../assets/data/states.json')
        .pipe(
          publishReplay(1),
          refCount(),
          catchError(error => of([]))
        );
    }
    return this.states.pipe(map(response => {
      return response.filter(state => {
        return state.name.toLowerCase().includes(query.toLowerCase());
      });
    }));
  }

  /**
   * This method will prepare the elastic search query based on applied filters
   * @param filters
   * @param selectedGeographies Thses geographies data will be coming from scenario module
   */
  public prepareInventoryQuery(filters, selectedGeographies = []) {
    const query = {};
    let from = 0;
    const size = 100;
    if (filters['page']) {
      from = filters['page'] * size;
    }
    const session = JSON.parse(localStorage.getItem('savedExploreSession'));
    query['from'] = from;
    query['size'] = size;
    query['track_total_hits'] = true;
    if ([
      'region',
      'threshold',
      'target_geography',
      'operator_name_list',
      'media_type_list',
      'id_type',
      'id_list',
      'inventory_market_list',
      'construction_type_list',
      'orientation',
      'frame_width',
      'frame_height',
      'spot_length',
      'frame_media_name_list',
      'classification_type_list',
      'place_type_name_list',
      'placement_type_name_list',
      'gp_ids',
      'custom_ids',
      'target_geography_list',
      'rotating',
      'digital'
    ].some(key => filters[key])) {
      const must = [];
      Object.keys(filters).map(key => {
        switch (key) {
          case 'operator_name_list':
            must.push({
              terms: {
                'representations.account.parent_account_name.keyword': filters['operator_name_list']
              }
            });
            break;
          case 'target_geography_list':
            if (filters['target_geography_list'].length > 0) {
              const markets = filters['target_geography_list'];
              const marketValues = [];
              let spliter = 'DMA';
              if (markets[0].indexOf('CBSA') > -1) {
                spliter = 'CBSA';
              }
              markets.map(market => {
                marketValues.push(market.split(spliter)[1]);
              });
              must.push({
                terms: {
                  'location.dma_id': marketValues
                }
              });
            }
            break;
          case 'id_type':
            if (filters['id_type'] === 'spot_id') {
              let ids = filters['id_list'];
              /* if (filters['gp_ids']) {
                ids = filters['gp_ids'];
              } */
              if (filters['custom_ids'] && filters['custom_ids'].length  > 0) {
                ids.push(...filters['custom_ids']);
              }
              if (session['data'] && session['data']['location']) {
                if (session['data']['location']['type'] === 'placeSetView') {
                  if (session['data']['location']['placePackState'] &&
                  session['data']['location']['placePackState']['spatialSearchCustomInvIds'] &&
                  session['data']['location']['placePackState']['spatialSearchCustomInvIds'].length) {
                    ids = session['data']['location']['placePackState']['spatialSearchCustomInvIds'];
                  }
                }
              }
              must.push({
                nested: {
                  path: 'layouts.faces.spots',
                  query: {
                    terms: {
                      'layouts.faces.spots.id': ids
                    }
                  },
                  inner_hits : {}
                }
              });
            } else {
              must.push({
                nested: {
                  path: 'layouts.faces.spots',
                  query: {
                    terms: {
                      'layouts.faces.spots.plant_spot_id': filters['id_list']
                    }
                  },
                  inner_hits : {}
                }
              });
            }
            break;
          case 'orientation':
            must.push({
              range: {
                'location.orientation': {
                  gte: filters['orientation']['min'],
                  lte: filters['orientation']['max']
                }
              }
            });
            break;
          case 'rotating':
            if (filters['rotating'] !== null && filters['rotating'] !== undefined) {
              must.push({
                nested: {
                  path: 'layouts.faces.spots',
                  query: {
                    term: {
                      'layouts.faces.spots.rotating': filters['rotating']
                    }
                  }
                  // ,
                  // inner_hits : {}
                }
              });
            }
            break;
          case 'spot_audio':
            if (
              filters['spot_audio'] !== null &&
              filters['spot_audio'] !== undefined
            ) {
              must.push({
                nested: {
                  path: 'layouts.faces.spots',
                  query: {
                    term: {
                      'layouts.faces.spots.audio': filters['spot_audio']
                    }
                  }
                }
              });
            }
            break;
          case 'spot_full_motion':
            if (
              filters['spot_full_motion'] !== null &&
              filters['spot_full_motion'] !== undefined
            ) {
              must.push({
                nested: {
                  path: 'layouts.faces.spots',
                  query: {
                    term: {
                      'layouts.faces.spots.full_motion': filters['spot_full_motion']
                    }
                  }
                }
              });
            }
            break;
          case 'spot_partial_motion':
            if (
              filters['spot_partial_motion'] !== null &&
              filters['spot_partial_motion'] !== undefined
            ) {
              must.push({
                nested: {
                  path: 'layouts.faces.spots',
                  query: {
                    term: {
                      'layouts.faces.spots.partial_motion': filters['spot_partial_motion']
                    }
                  }
                }
              });
            }
            break;
          case 'spot_interactive':
            if (
              filters['spot_interactive'] !== null &&
              filters['spot_interactive'] !== undefined
            ) {
              must.push({
                nested: {
                  path: 'layouts.faces.spots',
                  query: {
                    term: {
                      'layouts.faces.spots.interactive': filters['spot_interactive']
                    }
                  }
                }
              });
            }
            break;
          case 'frame_width':
            must.push({
              range: {
                max_width: {
                  gte: filters['frame_width']['min'],
                  lte: filters['frame_width']['max']
                }
              }
            });
            break;
          case 'frame_height':
            must.push({
              range: {
                max_height: {
                  gte: filters['frame_height']['min'],
                  lte: filters['frame_height']['max']
                }
              }
            });
            break;
          case 'classification_type_list':
            if (filters['classification_type_list'].length > 0) {
              must.push({
                terms: {
                  'classification_type.name.keyword': filters['classification_type_list']
                }
              });
            }
            break;
          case 'place_type_name_list':
            if (filters['place_type_name_list'].length > 0) {
              must.push({
                terms: {
                  'place_type_name_list.name.keyword': filters['place_type_name_list']
                }
              });
            }
            break;
          case 'placement_type_name_list':
            if (filters['placement_type_name_list'].length > 0) {
              must.push({
                terms: {
                  'placement_type_name_list.name.keyword': filters['placement_type_name_list']
                }
              });
            }
            break;
          case 'frame_media_name_list':
            if (filters['frame_media_name_list'].length > 0) {
              must.push({
                terms: {
                  'media_name': filters['frame_media_name_list']
                }
              });
            }
            break;
          case 'construction_type_list':
            if (filters['construction_type_list'].length > 0) {
              must.push({
                terms: {
                  'construction.construction_type.name.keyword': filters['construction_type_list']
                }
              });
            }
            break;
          case 'inventory_market_list':
            const inventoryMarketQuery = this.formatInventoryMarketList(filters['inventory_market_list'], selectedGeographies);
            if (inventoryMarketQuery) {
              must.push(inventoryMarketQuery);
            }
            break;
          case 'region':
            if (filters['region']) {
              if (session['data'] && session['data']['location'] &&
               (session['data']['location']['type'] === 'circularPolygon' ||
               session['data']['location']['type'] === 'regularPolygon' ||
               session['data']['location']['type'] === 'mapViewPolygon')) {
                must.push({
                  geo_shape: {
                    'location.geometry': {
                      shape: {
                        type: 'multipolygon',
                        coordinates: filters['region']['coordinates']
                      }
                    }
                  }
                });
              }
            }
            break;
          case 'media_type_list':
            if (filters['media_type_list'].length > 0) {
              must.push({
                terms: {
                  'media_type.name.keyword': filters['media_type_list']
                }
              });
            }
            break;
        case 'digital':
          must.push({
            nested: {
              path: 'layouts.faces.spots',
              query: {
                term: {
                  'layouts.faces.spots.digital': filters['digital']
                }
              }
              // ,
              // inner_hits : {}
            }
          });
          break;
        }
        if (must.length > 0) {
          query['query'] = { 'bool': { 'must': must } };
        }
      });
    }
    return query;
  }

  /**
   * This method will prepare the query for national wide data
   * @param query
   */
  public nationalLevelElasticQuery(query, filters = {}) {
    query['aggs'] = {};
    const idsQuery = this.getIdsQuery(filters);
    query['aggs']['states'] = {
      terms: {
        field: 'location.dma_id.keyword',
        size: IVENTORY_COUNT_LIMIT
      },
      aggs: {
        spots : {
          nested : {
            path : 'layouts.faces.spots'
          },
          aggs : {
            'spot_filter': {
              'filter': {
                'bool': idsQuery
              },
              'aggs': {
                'spot_count': {
                  'value_count': {
                    'field': 'layouts.faces.spots.id'
                  }
                }
              }
            }
          }
        },
        center_lat: {
          avg: {
            script: {
              lang: 'painless',
              source: 'params._source["location"].geometry.coordinates[1]'
            }
          }
        },
        center_lon: {
          avg: {
            script: {
              lang: 'painless',
              source: 'params._source["location"].geometry.coordinates[0]'
            }
          }
        }
      }
    };
    return query;
  }

  addTotalQuery(query = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }
    const distinctAggs = {
      'cardinality': {
        'field': 'plant_frame_id'
      }
    };
    query['aggs']['total'] = distinctAggs;
    return query;
  }
  public addInventoryIdsQuery(query, filters = {}) {
    query['size'] = 0;
    if (!query['aggs']) {
      query['aggs'] = {};
    }
    const idsQuery = this.getIdsQuery(filters);
    query['aggs']['spotIds'] = {};
    query['aggs']['spotIds'] = {
      'nested': {
        'path': 'layouts.faces.spots'
      },
      'aggs': {
        'spot_filter': {
          'filter': {
            'bool': idsQuery
          },
          'aggs': {
            'ids': {
              'terms': {
                'field': 'layouts.faces.spots.id',
                'size': 13500
              }
            }
          }
        }
      }
    };
    return query;
  }

  private formatInventoryMarketList(data, selectedGeographies = []) {
    const session = JSON.parse(localStorage.getItem('savedExploreSession'));
      if ((session['data'] && session['data']['location'] &&
         session['data']['location']['selectedGeoLocation']) || selectedGeographies.length) {
      let locations = [];
      if (selectedGeographies.length) {
        locations = selectedGeographies;
      } else {
        locations = session['data']['location']['selectedGeoLocation'];
      }
      const filterData: any = {};
      locations.map(location => {
        if (!filterData[location['data']['type']]) {
          filterData[location['data']['type']] = [];
        }
        let id = location['data']['id'];
        switch (location['data']['type']) {
          case 'Zip Codes':
              id = location['data']['id'].split('ZIP')[1];
            break;
          case 'DMA':
              id = location['data']['id'].split('DMA')[1];
            break;
          case 'County':
              id = location['data']['label'].split(',')[0].trim();
            break;
        }
        filterData[location['data']['type']].push(id);
      });
      const query = {
        'bool' : {
          'should' : []
        }
      };
      Object.keys(filterData).map(key => {
        switch (key) {
          case 'Zip Codes':
              query['bool']['should'].push({
                terms: {
                  'location.zip_code': filterData[key]
                }
              });
            break;
          case 'States':
              query['bool']['should'].push({
                terms: {
                  'location.state': filterData[key]
                }
              });
            break;
          case 'CBSA':
              query['bool']['should'].push({
                terms: {
                  'location.cbsa': filterData[key]
                }
              });
            break;
          case 'DMA':
              query['bool']['should'].push({
                terms: {
                  'location.dma_id': filterData[key]
                }
              });
            break;
          case 'County':
              query['bool']['should'].push({
                terms: {
                  'location.county_name': filterData[key]
                }
              });
            break;
          default:
            return false;
            break;
        }
      });
      return query;
    }
  }
  addTotalSpotQuery(query = {}, filters = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }
    const idsQuery = this.getIdsQuery(filters);
    query['aggs']['spots'] = {};
    query['aggs']['spots'] = {
      nested: {
        path: 'layouts.faces.spots'
      },
      aggs: {
        'spot_filter': {
          'filter': {
            'bool': idsQuery
          },
          'aggs': {
            'spot_count': {
              'value_count': {
                'field': 'layouts.faces.spots.id'
              }
            }
          }
        }
      }
    };

    return query;
  }
  addTotalFramesQuery(query = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }
    const distinctAggs = {
      'frames_count': {
        'value_count': {
          'field': 'id'
        }
      }
    };
    query['aggs'] = distinctAggs;
    return query;
  }
  public addClassificationQuery(query = {}, filters = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }
    const idsQuery = this.getIdsQuery(filters);
    const aggregation = {
      'size': 0,
      'aggregations': {
        'classification': {
          'terms': {
            'field': 'classification_type.name.keyword',
            'size': 10000,
          },
          'aggregations': {
            'spots' : {
              'nested' : {
                'path' : 'layouts.faces.spots'
              },
              'aggs' : {
                'spot_filter': {
                  'filter': {
                    'bool': idsQuery
                  },
                  'aggs': {
                    'spot_count': {
                      'value_count': {
                        'field': 'layouts.faces.spots.id'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    query['aggs'] = aggregation.aggregations;
    return query;
  }

  public addConstructionQuery(query = {}, filters = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }
    const idsQuery = this.getIdsQuery(filters);
    const aggregation = {
      'size': 0,
      'aggregations': {
        'constructions': {
          'terms': {
            'field': 'construction.construction_type.name.keyword',
            'size': 10000,
          },
          'aggregations': {
            'spots' : {
              'nested' : {
                'path' : 'layouts.faces.spots'
              },
              'aggs' : {
                'spot_filter': {
                  'filter': {
                    'bool': idsQuery
                  },
                  'aggs': {
                    'spot_count': {
                      'value_count': {
                        'field': 'layouts.faces.spots.id'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    query['aggs'] = aggregation.aggregations;
    return query;
  }

  public addOperatorMediaNameQuery(query = {}, filters = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }
    const idsQuery = this.getIdsQuery(filters);
    const aggregation = {
      'size': 0,
      'aggregations': {
        'operator_medias': {
          'terms': {
            'field': 'media_name',
            'size': 10000,
          },
          'aggregations': {
            'spots' : {
              'nested' : {
                'path' : 'layouts.faces.spots'
              },
              'aggs' : {
                'spot_filter': {
                  'filter': {
                    'bool': idsQuery
                  },
                  'aggs': {
                    'spot_count': {
                      'value_count': {
                        'field': 'layouts.faces.spots.id'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    query['aggs'] = aggregation.aggregations;
    return query;
  }

  public addDigitalQuery(query = {}, filters = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }
    const idsQuery = this.getIdsQuery(filters);
    const aggregation = {
      'size': 0,
      'aggregations': {
        'digitals': {
          'terms': {
            'field': 'digital',
            'size': 10000,
          },
          'aggregations': {
            'spots' : {
              'nested' : {
                'path' : 'layouts.faces.spots'
              },
              'aggs' : {
                'spot_filter': {
                  'filter': {
                    'bool': idsQuery
                  },
                  'aggs': {
                    'spot_count': {
                      'value_count': {
                        'field': 'layouts.faces.spots.id'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    query['aggs'] = aggregation.aggregations;
    return query;
  }

  public addMediaNamesGroupQuery(query = {}, filters = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }
    const idsQuery = this.getIdsQuery(filters);
    const aggregation = {
      'size': 0,
      'aggregations': {
        'media_types': {
          'terms': {
            'field': 'media_name',
            'size': 10000,
          },
          'aggregations': {
            'spots' : {
              'nested' : {
                'path' : 'layouts.faces.spots'
              },
              'aggs' : {
                'spot_filter': {
                  'filter': {
                    'bool': idsQuery
                  },
                  'aggs': {
                    'spot_count': {
                      'value_count': {
                        'field': 'layouts.faces.spots.id'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    query['aggs'] = aggregation.aggregations;
    return query;
  }

  public addMediaTypeGroupQuery(query = {}, filters = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }
    const idsQuery = this.getIdsQuery(filters);
    const aggregation = {
      'size': 0,
      'aggregations': {
        'media_types': {
          'terms': {
            'field': 'media_type.name.keyword',
            'size': 10000,
          },
          'aggregations': {
            'spots' : {
              'nested' : {
                'path' : 'layouts.faces.spots'
              },
              'aggs' : {
                'spot_filter': {
                  'filter': {
                    'bool': idsQuery
                  },
                  'aggs': {
                    'spot_count': {
                      'value_count': {
                        'field': 'layouts.faces.spots.id'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    query['aggs'] = aggregation.aggregations;
    return query;
  }


  public addSampleMediaQuery(query = {}, filters = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }

    const idsQuery = this.getIdsQuery(filters);
    const aggregation = {
      'size': 0,
      'aggregations': {
        'spots' : {
          'nested' : {
            'path' : 'layouts.faces.spots'
          },
          'aggs' : {
            'spot_filter': {
              'filter': {
                'bool': idsQuery
              },
              'aggs': {
                'spot_count': {
                  'value_count': {
                    'field': 'layouts.faces.spots.id'
                  }
                }
              }
            }
          }
        },
        'isDigital': {
          'terms': {
            'field': 'digital',
            'size': 10000
          },
          'aggregations': {
            'spots' : {
              'nested' : {
                'path' : 'layouts.faces.spots'
              },
              'aggs' : {
                'spot_filter': {
                  'filter': {
                    'bool': idsQuery
                  },
                  'aggs': {
                    'spot_count': {
                      'value_count': {
                        'field': 'layouts.faces.spots.id'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        'mediaTypes': {
          'terms': {
            'field': 'media_type.name.keyword',
            'size': 10000
          },
          'aggregations': {
            'spots' : {
              'nested' : {
                'path' : 'layouts.faces.spots'
              },
              'aggs' : {
                'spot_filter': {
                  'filter': {
                    'bool': idsQuery
                  },
                  'aggs': {
                    'spot_count': {
                      'value_count': {
                        'field': 'layouts.faces.spots.id'
                      }
                    }
                  }
                }
              }
            },
            'isDigital': {
              'terms': {
                'field': 'digital',
                'size': 10000
              },
              'aggregations': {
                'spots' : {
                  'nested' : {
                    'path' : 'layouts.faces.spots'
                  },
                  'aggs' : {
                    'spot_filter': {
                      'filter': {
                        'bool': idsQuery
                      },
                      'aggs': {
                        'spot_count': {
                          'value_count': {
                            'field': 'layouts.faces.spots.id'
                          }
                        }
                      }
                    }
                  }
                },
                'frames': {
                  'terms': {
                    'field': 'media_name',
                    'size': 10000
                  },
                  'aggregations': {
                    'spots' : {
                      'nested' : {
                        'path' : 'layouts.faces.spots'
                      },
                      'aggs' : {
                        'spot_filter': {
                          'filter': {
                            'bool': idsQuery
                          },
                          'aggs': {
                            'spot_count': {
                              'value_count': {
                                'field': 'layouts.faces.spots.id'
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    query['aggs'] = aggregation.aggregations;
    return query;
  }

  public addMediaQuery(query = {}, filters = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }

    const idsQuery = this.getIdsQuery(filters);
    const aggregation = {
      'size': 0,
      'aggregations': {
        'spots' : {
          'nested' : {
            'path' : 'layouts.faces.spots'
          },
          'aggs' : {
            'spot_filter': {
              'filter': {
                'bool': idsQuery
              },
              'aggs': {
                'spot_count': {
                  'value_count': {
                    'field': 'layouts.faces.spots.id'
                  }
                }
              }
            }
          }
        },
        'isDigital': {
          'terms': {
            'field': 'digital',
            'size': 10000
          },
          'aggregations': {
            'spots' : {
              'nested' : {
                'path' : 'layouts.faces.spots'
              },
              'aggs' : {
                'spot_filter': {
                  'filter': {
                    'bool': idsQuery
                  },
                  'aggs': {
                    'spot_count': {
                      'value_count': {
                        'field': 'layouts.faces.spots.id'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        'constructions': {
          'terms': {
            'field': 'construction.construction_type.name.keyword',
            'size': 10000
          },
          'aggregations': {
            'spots' : {
              'nested' : {
                'path' : 'layouts.faces.spots'
              },
              'aggs' : {
                'spot_filter': {
                  'filter': {
                    'bool': idsQuery
                  },
                  'aggs': {
                    'spot_count': {
                      'value_count': {
                        'field': 'layouts.faces.spots.id'
                      }
                    }
                  }
                }
              }
            },
            'mediaTypes': {
              'terms': {
                'field': 'media_type.name.keyword',
                'size': 10000
              },
              'aggregations': {
                'spots' : {
                  'nested' : {
                    'path' : 'layouts.faces.spots'
                  },
                  'aggs' : {
                    'spot_filter': {
                      'filter': {
                        'bool': idsQuery
                      },
                      'aggs': {
                        'spot_count': {
                          'value_count': {
                            'field': 'layouts.faces.spots.id'
                          }
                        }
                      }
                    }
                  }
                },
                'isDigital': {
                  'terms': {
                    'field': 'digital',
                    'size': 10000
                  },
                  'aggregations': {
                    'spots' : {
                      'nested' : {
                        'path' : 'layouts.faces.spots'
                      },
                      'aggs' : {
                        'spot_filter': {
                          'filter': {
                            'bool': idsQuery
                          },
                          'aggs': {
                            'spot_count': {
                              'value_count': {
                                'field': 'layouts.faces.spots.id'
                              }
                            }
                          }
                        }
                      }
                    },
                    'frames': {
                      'terms': {
                        'field': 'media_name',
                        'size': 10000
                      },
                      'aggregations': {
                        'spots' : {
                          'nested' : {
                            'path' : 'layouts.faces.spots'
                          },
                          'aggs' : {
                            'spot_filter': {
                              'filter': {
                                'bool': idsQuery
                              },
                              'aggs': {
                                'spot_count': {
                                  'value_count': {
                                    'field': 'layouts.faces.spots.id'
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    query['aggs'] = aggregation.aggregations;
    return query;
  }
  public addOperatorQuery(query = {}, filters = {}) {
    if (!query['aggs']) {
      query['aggs'] = {};
    }
    const idsQuery = this.getIdsQuery(filters);
    const aggregation = {
      'size': 0,
      'aggregations': {
        'operators': {
          'terms': { 'field': 'representations.account.parent_account_id', 'size': 10000 },
          'aggregations': {
            'ids': {
              'terms': { 'field': 'representations.account.parent_account_name.keyword', 'size': 10000 },
              'aggregations': {
                'spots' : {
                  'nested' : {
                    'path' : 'layouts.faces.spots'
                  },
                  'aggs' : {
                    'spot_filter': {
                      'filter': {
                        'bool': idsQuery
                      },
                      'aggs': {
                        'spot_count': {
                          'value_count': {
                            'field': 'layouts.faces.spots.id'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    query['aggs'] = aggregation.aggregations;
    return query;
  }

  /**
   * This method is to get inventory from elastic search
   * @param query filter query
   * @param noLoader
   */
  public getInventoryFromElasticSearch(query = {}, noLoader = true, siteName = this.siteName) {
    let reqHeaders;
    const url = `${this.config.envSettings['API_ENDPOINT']}inventory/search?site=${siteName}`;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.post(url, query, { headers: reqHeaders });
  }

  public getFilterDataElastic(noLoader = true, query) {
    // When need to reset the filter data, like when new filter is applied, set this.filtersFromAPI$ to null;

    const url = `${this.config.envSettings['API_ENDPOINT']}inventory/search?site=${this.siteName}`;
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    return this.http.post(url, query, { headers: reqHeaders })
      .pipe(map(res => res['aggregations']));
  }

  /**
   * @description
   *   Get the filtered operators from cache if available else
   *  get it from server.
   *
   * @param noLoader
   * @param query
   */
  public getOperatorFilterDataElastic(noLoader = true, query): Observable<any>{
    return (
      this.operatorFilterDataFromES$ ||
      (
        this.operatorFilterDataFromES$ = this.getFilterDataElastic(noLoader, query)
          .pipe(
            publishReplay(1),
            refCount(),
            catchError(err => {
              this.operatorFilterDataFromES$ = null;
              return throwError(err);
            })
          )
      )
    )
  }

  public formatSpotElasticData(esData) {
    const inventory = [];
    if (esData && esData['hits'] && esData['hits']['hits']) {
      esData['hits']['hits'].map(hit => {
        const source = hit['_source'];
        source['media_status'] = hit['_source']['status_type'];
        if (hit['inner_hits']) {
          source['layouts'][0]['faces'][0]['spots'] = hit['inner_hits']['layouts.faces.spots']['hits']['hits'].map(inner_hit => inner_hit['_source']);
        }
        inventory.push(source);
      });
    }
    return inventory;
  }
  /*
    This function used to get Spot count from the Custom ElasticSearch index
    This to display the total count of the spots in summary
  */
  getCustomDBSpotsCount(filtersData) {
    let query = this.prepareInventoryQuery(filtersData);
    query = this.addTotalSpotQuery(query, filtersData);
    query['size'] = 0;
    return this.getInventoryFromElasticSearch(query)
      .pipe(map(res => {
        return res['aggregations']['spots']['spot_filter']['spot_count']['value'];
      }));
  }
  /**
  *
  * @param spotIDs Array of customDB spotIDs
  */
  public prepareInventorySpotQuery(spotIDs = []) {
    const query = {
       'from': 0,
       'size': 10000,
       'track_total_hits': true,
       'query': {
           'terms': {
               'layouts.faces.spots.id': spotIDs
           }
       }
     };
     return query;
   }
  /**
   * This method will prepare the elastic query for radius filter
   * @param idsQuery list of geo distance queries
   */
  public prepareGeoSpatialQuery(idsQuery = []) {
    return {
      size: 0,
      query: {
        bool: {
          should: idsQuery
        }
      },
      aggs : {
        spots : {
          nested : {
              path : 'layouts.faces.spots'
          },
          aggs : {
            ids: {
              terms: {
                field: 'layouts.faces.spots.id',
                size: 10000
              }
            }
          }
        }
      }
    };
  }
  /**
   * This method will prepare the elastic query for polygons filter
   * @param region polygon object
   */
  public preparePolygonQuery(region) {
    return {
      size: 0,
      query: {
        bool: {
          should: [{
            geo_shape: {
              'location.geometry': {
                shape: {
                  type: 'multipolygon',
                  coordinates: region['coordinates']
                }
              }
            }
          }]
        }
      },
      aggs : {
        spots : {
          nested : {
              path : 'layouts.faces.spots'
          },
          aggs : {
            ids: {
              terms: {
                field: 'layouts.faces.spots.id',
                size: 10000
              }
            }
          }
        }
      }
    };
  }
  /**
   * This method will generate id queries if present which will helpful to get exact count of spots
   * as we have nested index in elastic search
   * @param filters
   */

  private getIdsQuery(filters = {}) {
    let ids = [];
    let filterType = 'must_not';
    if (filters && filters['id_list'] && filters['id_list'].length > 0) {
      ids = filters['id_list'];
      filterType = 'must';
    }
    const idsQuery = {};
    if (filters['id_type'] && filters['id_type'] === 'plant_frame_id') {
        idsQuery[filterType] = [
        {
          'terms': {
            'layouts.faces.spots.plant_spot_id': ids
          }
        }
      ];
    } else {
      if (filters && filters['custom_ids'] && filters['custom_ids'].length) {
        ids = filters['custom_ids'];
      }
      idsQuery[filterType] = [
        {
          'terms': {
            'layouts.faces.spots.id': ids
          }
        }
      ];
    }
    return idsQuery;
  }

  public exportParamFormat(marketData) {
    const pdfReqHeaders = {};
    if (marketData && marketData['selectedMarkets'] &&
      marketData['selectedMarkets'].length > 0) {
      pdfReqHeaders['target_geography_list'] = [];
      if (marketData['selected'] === 'us') {
        pdfReqHeaders['market_name'] = '';
        pdfReqHeaders['market_type'] = '';
        pdfReqHeaders['target_geography_list'] = [];
      } else {
        const market_name = marketData['selectedMarkets'].map(market => market['name']).join(', ');
        pdfReqHeaders['market_name'] = market_name;
        pdfReqHeaders['market_type'] = marketData['type'];
        if (marketData['selected'] === 'individual_all') {
          pdfReqHeaders['target_geography_list'] = [`local_${marketData['type'].toLowerCase()}`];
        } else {
          marketData['selectedMarkets'].filter
            ((market) => pdfReqHeaders['target_geography_list'].push(market.id));
        }
      }
    } else {
      pdfReqHeaders['target_geography_list'] = [];
      pdfReqHeaders['market_type'] = '';
      pdfReqHeaders['market_name'] = '';
    }
    return pdfReqHeaders;
  }


  getTopSegments(
    filters: Partial<SummaryRequest>,
    noLoader = true
  ): Observable<InventroySearch[]> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const filter = Helper.deepClone(filters);
    if (!filter['page_size']) {
      filter['page_size'] = 100;
    }
    return this.http
      .post(this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/measures/summary/segments', filter, { headers: reqHeaders })
      .pipe(
        map(
          (result) =>
            result['segment_summaries']
        )
      );
  }

  getSpotHourlyImpressions(params, hoursMeasure= true, measures = false, noLoader = true): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    let url = this.config.envSettings['API_ENDPOINT_V2.1'] +
      'inventory/spot/' + params['spotId'] + '?';

    url = url + 'measures=' + measures + '&';
    url = url + 'hourly_measures=' + hoursMeasure + '&';
    // As we don't have data for otheraudiences so that we configured static data.
    // if (params.base_segment) {
      url = url + 'base_segment=' + 2032 + '&';
    // }
    // if (params.target_segment) {
      url = url + 'target_segment=' + 2032 + '&';
    // }
    /* if (params.target_geography) {
      url = url + 'target_geography=' + params.target_geography;
    }*/
    if (params.measures_release) {
      url = url + 'measures_release=' + params.measures_release + '&';
    }
    url = url.replace(/\?$/, '');
    url = url.replace(/&$/, '');
    return this.http
      .get(url, { headers: reqHeaders })
      .pipe(map((response: Inventory) => response));
  }

  public formatHourlyImpressionData(data , colors= ['#eb882d', '#785232', '#3a6f41' , '#9c429c', '#b52e2b', '#59a42a', '#254097'
  ]) {
    const formattedData = Object.assign({}, data);
    delete formattedData.measures_type;
    delete formattedData.target_segment;
    delete formattedData.target_geo;
    delete formattedData.market;
    const xAxis = [];
    const chartFormatData = [];
    const voice = data['voice'];

    Object.keys(formattedData).forEach((key, i) => {
      const firstLetter = key.substr(0, 1);
      const item = {
        name : firstLetter.toUpperCase() + key.substr(1),
        color: colors[i],
        values : []
      };
      if (formattedData[key]  && key !== 'voice') {
        if (voice.digital) {
          Object.keys(formattedData[key]).forEach(( dayKey ) => {
            const val = formattedData[key][dayKey] * ((3600 * voice.layer_voice) / (voice['spot_count'] / voice['spot_voice']));
            const valueItem  = {xData: Number(dayKey), yData: val};
            item.values.push(valueItem);
            xAxis.push(dayKey);
          });
        } else {
          Object.keys(formattedData[key]).forEach(( dayKey ) => {
            const val = formattedData[key][dayKey];
            const valueItem  = {xData: Number(dayKey), yData: val};
            item.values.push(valueItem);
            xAxis.push(dayKey);
          });
        }
        chartFormatData.push(item);
      }
    });

    const uniqueXAxis = xAxis.filter(function(elem, index, self) {
      return index === self.indexOf(elem);
    });
   return chartFormatData;
  }


  /**
   * This method is to get list of audit statuses
   * @param noLoader
   */
  public getAuditStatusList(noLoader = true): Observable<AuditStatus[]> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const url = `${this.config.envSettings['API_ENDPOINT_V2.1']}inventory/status_types`;
    return this.http.get(url, { headers: reqHeaders }).pipe(map(response => response['status_types']));
  }

 /**
   * This method is to get the list of Place type list
   * @param {boolean} [noLoader=true]
   * @memberof InventoryService
   */
   public getPlaceTypeList(noLoader = true) {

     if(!this.placeType$){
       let reqHeaders;
       if (noLoader) {
         reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
       }

       const url = `${this.config.envSettings['API_ENDPOINT_V2.1']}inventory/place_types`;
       this.placeType$ = this.http.get(url, { headers: reqHeaders }).pipe(
         publishReplay(1),
         refCount(),
         catchError(err=>{
           this.placeType$ = null;
           return throwError(err)
         })
       );
     }

     return this.placeType$;
   }

  /**
   * This method is to get the list of Placement type list
   * @param {boolean} [noLoader=true]
   * @memberof InventoryService
   */
  public getPlacementTypeList(noLoader = true) :Observable<PlacementTypeResponse> {
    if (!this.placementTypeList$) {
    const url = `${this.config.envSettings['API_ENDPOINT_V2.1']}inventory/placement_types`;
      this.placementTypeList$ = this.http.get<PlacementTypeResponse>(url)
        .pipe(
          publishReplay(1),
          refCount(),
          catchError(this.handleError('getPlacementTypeList', null)),
        );
    }
    return this.placementTypeList$;
  }


  // We won't call elastic search API's if filters contain thresholds & if audit status filter does not contain unaudited
  public checkToCallCustomInv(filters) {
    let callAPI = true;
    if ((filters['measures_range_list']
    && filters['measures_range_list'].length > 1)) {
      filters['measures_range_list'].forEach((val) => {
        if (val['min'] > 0) {
          callAPI = false;
        }
      });
    }
    if (filters['status_type_name_list'] &&
      filters['status_type_name_list'].length &&
      !filters['status_type_name_list'].some(status => status.includes('Unaudited'))) {
        callAPI = false;
    }
    return callAPI;
  }


  /**
   * This method is to get list of markets based on type and search value
   * @param searchText search value
   * @param page page number
   * @param noLoader
   */
  public getPlaces(searchText: string = '', page = 1, noLoader = true) {
    let reqHeaders;
    const page_size = 250;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    let url = `${this.config.envSettings['API_ENDPOINT_V2.1']}inventory/places`;
    if (searchText) {
      url = `${url}?place_name=${searchText}&page=${page}&page_size=${page_size}`;
    } else {
      if(!this.placeName$){
        url = `${url}?page=${page}&page_size=${page_size}`;
        this.placeName$ = this.http.get(url, { headers: reqHeaders }).pipe(map(result => result['places']));
      }

      return this.placeName$;
    }
    return this.http.get(url, { headers: reqHeaders }).pipe(map(result => result['places']));
  }
  public setScheduleMeasuresToSpots(spotScheduleResponse, inventories) {
    // set measures to all spots to null, this it to invalidate measures for any spot that's not in the spot schedule response.
    const spots = inventories;
    /*const spots = Helper.deepClone(inventories).map(spot => {
      return this.clearSpotMeasures(spot);
    });*/
    const inventorySpotIds = spots.map(inventory => inventory['spot_id']);
    if (spotScheduleResponse['measures_summaries'] && spotScheduleResponse['measures_summaries']['by_spot_overall']) {
      spotScheduleResponse['measures_summaries']['by_spot_overall'].forEach(summary => {
        const spotId = parseInt(summary['summarizes']['id_list'][0], 10);
        if (inventorySpotIds.includes(spotId)) {
          const inventoryItemIndex = spots.findIndex(inventory => inventory.spot_id === spotId);
          const inventoryItem = spots[inventoryItemIndex];
          inventoryItem['measures_type'] = summary['measures_type'];
          inventoryItem['period_days'] = summary['period_days'];
          inventoryItem['index_comp_target'] = summary['index_comp_target'];
          inventoryItem['pct_comp_pop_target_inmkt'] = summary['pct_comp_pop_target_inmkt'];
          inventoryItem['pct_comp_imp_target'] = summary['pct_comp_imp_target'];
          inventoryItem['pct_comp_imp_target_inmkt'] = summary['pct_comp_imp_target_inmkt'];
          inventoryItem['freq_avg'] = summary['freq_avg'];
          inventoryItem['imp_target_inmkt'] = summary['imp_target_inmkt'];
          inventoryItem['imp_target'] = summary['imp_target'];
          inventoryItem['imp_inmkt'] = summary['imp_inmkt'];
          inventoryItem['imp'] = summary['imp'];
          inventoryItem['pct_imp_inmkt'] = summary['pct_imp_inmkt'];
          inventoryItem['pct_imp_target_inmkt'] = summary['pct_imp_target_inmkt'];
          inventoryItem['pop_inmkt'] = summary['pop_inmkt'];
          inventoryItem['pop_target_inmkt'] = summary['pop_target_inmkt'];
          inventoryItem['reach_pct'] = summary['reach_pct'];
          inventoryItem['reach_net'] = summary['reach_net'];
          inventoryItem['trp'] = summary['trp'];
          inventoryItem['eff_freq_min'] = summary['eff_freq_min'];
          inventoryItem['eff_freq_avg'] = summary['eff_freq_avg'];
          inventoryItem['eff_reach_net'] = summary['eff_reach_net'];
          inventoryItem['eff_reach_pct'] = summary['eff_reach_pct'];
          spots[inventoryItemIndex] = inventoryItem;
        }
      });
    }
    // Updating Inventory which are not having measures
    if (spotScheduleResponse['spots_with_no_measures'] && spotScheduleResponse['spots_with_no_measures'].length) {
      const ids = [];
      spotScheduleResponse['spots_with_no_measures'].forEach(batch => {
        ids.push(...batch.id_list);
      });
      ids.forEach(id => {
        const spotId = parseInt(id, 10);
        if (inventorySpotIds.includes(spotId)) {
          const inventoryItemIndex = spots.findIndex(inventory => inventory.spot_id === spotId);
          const inventoryItem = spots[inventoryItemIndex];
          this.clearSpotMeasures(inventoryItem);
          spots[inventoryItemIndex] = inventoryItem;
        }
      });
    }
    return spots;
  }
  private clearSpotMeasures(inventoryItem) {
    // TODO : Need to set all the measures to null or need to discuss with Jagadeesh and Matthew if that's required.
    inventoryItem['measures_type'] = null;
    inventoryItem['period_days'] = null;
    inventoryItem['index_comp_target'] = null;
    inventoryItem['pct_comp_pop_target_inmkt'] = null;
    inventoryItem['pct_comp_imp_target'] = null;
    inventoryItem['pct_comp_imp_target_inmkt'] = null;
    inventoryItem['freq_avg'] = null;
    inventoryItem['imp_target_inmkt'] = null;
    inventoryItem['imp_target'] = null;
    inventoryItem['imp_inmkt'] = null;
    inventoryItem['imp'] = null;
    inventoryItem['pct_imp_inmkt'] = null;
    inventoryItem['pct_imp_target_inmkt'] = null;
    inventoryItem['pop_inmkt'] = null;
    inventoryItem['pop_target_inmkt'] = null;
    inventoryItem['reach_pct'] = null;
    inventoryItem['reach_net'] = null;
    inventoryItem['trp'] = null;
    inventoryItem['eff_freq_min'] = null;
    inventoryItem['eff_freq_avg'] = null;
    inventoryItem['eff_reach_net'] = null;
    inventoryItem['eff_reach_pct'] = null;
    return inventoryItem;
  }

  public getMarketType(marketType) {
    if (marketType === 'National') {
      return 'Universe';
    }
    return marketType;
  }

  public inventoryFromThisMarket(marketType, marketId, inventory, marketGroups = []) {
    try {
      if (marketType === 'County') {
        marketType = 'CNTY';
      }
      let geometry = {};
      if (inventory['geometry']) {
        geometry = inventory['geometry'];
      } else {
        geometry = inventory['location'];
      }
      const geoIds = new Set();
      geoIds.add(marketType + geometry['dma_id']);
      geoIds.add(marketType + geometry['cbsa_code']);
      geoIds.add(marketType + geometry['county_id']);
      if (marketGroups.length <= 0) {
        return geoIds.has(marketId);
      } else {
        return marketGroups.some(item => geoIds.has(item.id));
      }
    } catch (e) {
      console.trace(marketType, marketId, inventory, 'Something is not right', e);
      return false;
    }
  }


  /**
   * @description
   *   Create inventory
   * @param payload - inventory form data
   * @param noLoader - not in use
   * @param siteName - not in use
   */
   public createInventory(payload: CreateInventoryPayload, noLoader = true, siteName = this.siteName): Observable<CreateInventoryResponse> {
     const url = `${this.config.envSettings['API_ENDPOINT']}inventory?site=${siteName}`;
     let headers: HttpHeaders;

     if (noLoader) {
       headers = new HttpHeaders({'hide-loader': 'hide-loader'});
     }

     return this.http.post<CreateInventoryResponse>(url, payload, {headers}).
       pipe(
         catchError(this.handleError('createInventory', null))
       );
  }

  /**
   * @description
   *   To get the vendors list
   * @param paylaod
   * @param noLoader - not in use
   * @param siteName - not in use
   */
  public getVendors( paylaod: VendorsSearchPagination = {}, noLoader = true, siteName = this.siteName):Observable<VendorsSearchResponse>{

   if(!this.savedVendors$) {
     const url = `${this.config.envSettings['API_ENDPOINT']}vendors/search?site=${siteName}`;
     let headers: HttpHeaders;
     if (noLoader) {
       headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
     }

     this.savedVendors$ = this.http.post<VendorsSearchResponse>(url, paylaod, { headers })
       .pipe(
         publishReplay(1),
         refCount(),
         catchError((error)=>{
           this.savedVendors$ = null;
           const savedVendorsErrorHandler = this.handleError('getVendors', null);
           return savedVendorsErrorHandler(error);
         }),
       );
    }

    return this.savedVendors$;

  }

  /**
   * @description
   *   Get the media classes data from the geopath API
   * @param noLoader
   */
  public getMediaClasses(noLoader = true):Observable<MediaClassResponse>{

    if(!this.savedMediaClasses$) {
      const url = `${this.config.envSettings['API_ENDPOINT_V2.1']}inventory/classification_types`;
      let headers: HttpHeaders;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }

      this.savedMediaClasses$ = this.http.get<MediaClassResponse>(url, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error)=>{
          this.savedMediaClasses$ = null;
          const savedMediaClassesErrorHandler = this.handleError('getMediaClasses', null)
          return savedMediaClassesErrorHandler(error);
        }),
      );
    }
    return this.savedMediaClasses$;

  }

  /**
   * @description
   *   Get the media types data from the geopath API
   *
   * @param noLoader
   */
  public getMediaTypes( noLoader = true):Observable<MediaTypesResponse>{

    if(!this.savedMediaTypes$) {
      const url = `${this.config.envSettings['API_ENDPOINT_V2.1']}inventory/media_types`;
      let headers: HttpHeaders;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }

      this.savedMediaTypes$ = this.http.get<MediaTypesResponse>(url, { headers }).pipe(
        publishReplay(1),
        refCount(),
        catchError((error)=>{
          this.savedMediaTypes$ = null;
          const savedMediaTypesErrorHandler = this.handleError('getMediaTypes', null)
          return savedMediaTypesErrorHandler(error);
        }),
      );
    }
    return this.savedMediaTypes$;

  }

  /**
   * @description
   *  Get the structure types data from the geopath API
   * @param noLoader
   */
  public getStructureTypes( noLoader = true):Observable<StructureTypesResponse> {

    if (!this.savedStructureTypes$) {
      const url = `${this.config.envSettings['API_ENDPOINT_V2.1']}inventory/construction_types`;
      let headers: HttpHeaders;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }

      this.savedStructureTypes$ = this.http.get<StructureTypesResponse>(url, { headers }).pipe(
       publishReplay(1),
       refCount(),
       catchError((error)=>{
         this.savedStructureTypes$ = null;
         const savedStructureTypesErrorHandler =  this.handleError('getStructureTypes', null);
         return savedStructureTypesErrorHandler(error);
       }),
      );
    }
    return this.savedStructureTypes$;

  }

  /**
   * This method is to get status types from geopath API
   * @param {boolean} [noLoader=true]
   * @returns {Observable<StatusTypes>}
   * @memberof InventoryService
   */
  public getStatusTypes(noLoader = true): Observable<StatusTypeResponse> {
    if (!this.statusTypes$) {
      const url = `${this.config.envSettings['API_ENDPOINT_V2.1']}inventory/status_types`;
      this.statusTypes$ = this.http.get<StatusTypeResponse>(url)
        .pipe(
          publishReplay(1),
          refCount(),
          catchError((error)=>{
            this.statusTypes$ = null;
            const statusTypesErrorHandler = this.handleError('getStatusTypes', null)
            return statusTypesErrorHandler(error);
          }),
        );
    }
    return this.statusTypes$;
  }

  /**
   * @description
   *  Get the place types data from the geopath API
   *
   * @param noLoader
   */
  public getPlaceTypes( noLoader = true):Observable<PlaceTypesResponse> {

    if (!this.savedPlaceTypes$) {
      const url = `${this.config.envSettings['API_ENDPOINT_V2.1']}inventory/place_types`;
      let headers: HttpHeaders;
      if (noLoader) {
        headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
      }

      this.savedPlaceTypes$ = this.http.get<PlaceTypesResponse>(url, { headers })
        .pipe(
          publishReplay(1),
          refCount(),
          catchError((error)=>{
            this.savedPlaceTypes$ = null
            const savedPlaceTypesErrorHandler = this.handleError('getPlaceTypes', null);
            return savedPlaceTypesErrorHandler(error);
          }),
        );
      }
    return this.savedPlaceTypes$;

  }

  /**
   * @description
   * This function is to format the inventory form data to display it in a popup
   * @param data - inventory form data
   */
  public formatFeatureForDisplay(data: CreateInventoryPayload) {
    const feature = data;
    feature['frame_id'] = data['id'];
    if (data?.construction?.construction_type) {
      feature['construction_type'] = data.construction.construction_type;
      delete feature['construction'];
    }
    if (data?.status_type) {
      feature['media_status'] = data?.status_type;
      delete feature['status_type'];
    }
    feature['spot_references'] = [];
    if (data?.layouts?.[data['id']]?.['faces']?.[data['id']]?.['spots']) {
      const spotObj = data.layouts[data['id']]['faces'][data['id.' +
      ' `']]['spots'];
      const spotId = Object.keys(spotObj)[0];
      const spot: any = spotObj[spotId];
      spot.spot_id = spotId;
      feature['spot_references'].push(spot);
    }
    return feature;
  }

  /**
   * This functon is to get illumnation type list
   * @param {boolean} [noLoader=true]
   * @returns {Observable<IllumnationTypeResponse>}
   * @memberof InventoryService
   */
  public getIllumnationTypes(noLoader = true): Observable<IllumnationTypeResponse> {
    if (!this.illuminationTypes$) {
      const url = `${this.config.envSettings['API_ENDPOINT_V2.1']}inventory/illumination_types`;
      this.illuminationTypes$ = this.http.get<IllumnationTypeResponse>(url)
        .pipe(
          publishReplay(1),
          refCount(),
          catchError((error)=>{
            this.illuminationTypes$ = null;
            const illuminationTypeErrorHandler = this.handleError('getIllumnationTypes', null);
            return illuminationTypeErrorHandler(error);
          }),
        );
    }
    return this.illuminationTypes$;
  }

  clearOperatorsCaches(){
    this.operatorFilterData$ = null;
    this.operatorFilterDataFromES$ = null;
  }

  clearFilterCaches(){
    this.placeType$ = null;
    this.placeName$ = null;
    this.clearOperatorsCaches();
  }

  clearCaches(){
    this.savedVendors$ = null;
    this.savedMediaClasses$ = null;
    this.savedMediaTypes$ = null;
    this.savedStructureTypes$ = null;
    this.statusTypes$ = null;
    this.placementTypeList$ = null;
    this.savedPlaceTypes$ = null;
    this.illuminationTypes$= null;
    this.clearFilterCaches();
  }

  /**
   *
   * @param filters applied filters which are not normalized as we need to access media type data.
   * @param marketType We need to pass marketType only for inventory plan 3 and 4 cases
   */
  public getSummaryAPIObservable(filters, marketType = '') {
    /**
     *  We are making summary group call if mulitple media combinations(digital & non-digital) are selected and
     *  only if following conditions met
     *  1)  Material value in the media['ids'] object should not be both (becuase in this case we won't send digital
     *  attribute to API.)
     *  2) Material value in the media['ids'] object should not be false (if all selected medias are non digital then no
     *  need we can simply send digital as false)
     *  3) Material value in the media['ids'] object should not be true (if all selected medias are digital then no
     *  need we can simply send digital as true)
     */
    if (this.checkToConfirmMultiMediaSelection(filters['mediaTypeList'])
     ) {
      const normalizedFilters = this.normalizeFilterDataNew(filters);
      delete normalizedFilters['digital'];
      const digitalMedias = [];
      filters['mediaTypeList'].forEach(mediaFilter => {
        if (mediaFilter.ids.material) {
          digitalMedias.push(...mediaFilter.ids.material_medias);
        }
      });
      if (digitalMedias.length) {
        if (!normalizedFilters['frame_media_name_list']) {
          normalizedFilters['frame_media_name_list'] = [];
        }
        normalizedFilters['frame_media_name_list'].push(...digitalMedias);
      }
      normalizedFilters['summary_level_list'] = [
        'Media Type',
        'Frame Media',
        'Plant',
        'Classification Type',
        'Construction Type',
        'Digital'
      ];
      normalizedFilters['summary_level_list'].push('DMA');
      if (marketType) {
        normalizedFilters['summary_level_list'].push(this.getMarketType(marketType));
      }
      return this.getTotalSummary(normalizedFilters).pipe(
      map((summaries: Summary[]) => {
        return this.calculateSummary(summaries, filters['mediaTypeList']);
      }));
    } else {
      return this.getSummary(this.normalizeFilterDataNew(filters));
    }
  }
  // To check if material media is selected or not
  private isMaterialMediaNotSelected(mediaFilters) {
    return mediaFilters.every(media => media.ids['material'] === '');
  }
  // To check whether all selected media are both digital/non digital
  private isAllMedia(mediaFilters) {
    return mediaFilters.every(media => media.ids['material'] === 'both');
  }
  // To check whether all selected media are digital
  private isAllDigitalMedia(mediaFilters) {
    return mediaFilters.every(media => media.ids['material'] === 'true');
  }
  // To check whether all selected media are non digital
  private isAllNonDigitalMedia(mediaFilters) {
    return mediaFilters.every(media => media.ids['material'] === 'false');
  }

  /**
   * To check and make multiple calls if different media groups applied
   * @param filters applied filters which are not normalized as we need to access media type data.
   */
  public getSpotIdsAPIObservable(filters) {
    /**
     *  We are making multiple calls if mulitple media combinations(digital & non-digital) are selected and
     *  only if following conditions met
     *  1)  Material value in the media['ids'] object should not be both (becuase in this case we won't send digital
     *  attribute to API.)
     *  2) Material value in the media['ids'] object should not be false (if all selected medias are non digital then no
     *  need we can simply send digital as false)
     *  3) Material value in the media['ids'] object should not be true (if all selected medias are digital then no
     *  need we can simply send digital as true)
     */
    if (this.checkToConfirmMultiMediaSelection(filters['mediaTypeList'])) {
      const newFilters = Helper.deepClone(filters);
      const mediaFilters = Helper.deepClone(newFilters['mediaTypeList']);
      delete newFilters['mediaTypeList'];
      const requests = [];
      mediaFilters.forEach(filter => {
        newFilters['mediaTypeList'] = [];
        newFilters['mediaTypeList'].push(filter);
        const normalizedFilters = Helper.deepClone(this.normalizeFilterDataNew(newFilters));
        requests.push(this.getSpotIdsFromAPI(normalizedFilters));
      });
      return zip(...requests).pipe(map(resultsArray => {
        const spotIds = [].concat(...resultsArray);
        return Helper.removeDuplicate(spotIds);
      }));
    } else {
      return this.getSpotIdsFromAPI(this.normalizeFilterDataNew(filters));
    }
  }

  getTotalSummary(filters: Partial<SummaryRequest>, noLoader = true): Observable<Summary[]> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http
      .post(
        this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/summary/search',
        this.formatFilters(filters),
        { headers: reqHeaders }
      ).pipe(map((response: SummaryResponse) => response.summaries));
  }

  public checkToConfirmMultiMediaSelection(mediaFilters) {
    return mediaFilters?.length > 1 &&
    !this.isMaterialMediaNotSelected(mediaFilters) &&
    !this.isAllMedia(mediaFilters) &&
    !this.isAllDigitalMedia(mediaFilters) &&
    !this.isAllNonDigitalMedia(mediaFilters);
  }

  /**
   * To check and modify  combined summary calls if different media groups applied
   * @param filters
   * @param marketType
   */

  public getSummaryForAllGeographiesAPI(filters, marketType): Observable<SummaryResponse> {

    /**
     *  We are making summary group call if mulitple media combinations(digital & non-digital) are selected and
     *  only if following conditions met
     *  1)  Material value in the media['ids'] object should not be both (becuase in this case we won't send digital
     *  attribute to API.)
     *  2) Material value in the media['ids'] object should not be false (if all selected medias are non digital then no
     *  need we can simply send digital as false)
     *  3) Material value in the media['ids'] object should not be true (if all selected medias are digital then no
     *  need we can simply send digital as true)
     */
    const normalizedFilters = this.normalizeFilterDataNew(filters);
    normalizedFilters['summary_level_list'] = [this.getMarketType(marketType)];
    if (this.checkToConfirmMultiMediaSelection(filters['mediaTypeList'])
     ) {
      delete normalizedFilters['digital'];
      const digitalMedias = [];
      filters['mediaTypeList'].forEach(mediaFilter => {
        if (mediaFilter.ids.material) {
          digitalMedias.push(...mediaFilter.ids.material_medias);
        }
      });
      if (digitalMedias.length) {
        if (!normalizedFilters['frame_media_name_list']) {
          normalizedFilters['frame_media_name_list'] = [];
        }
        normalizedFilters['frame_media_name_list'].push(...digitalMedias);
      }
      normalizedFilters['summary_level_list'] = [
        'Media Type',
        'Frame Media',
        'Plant',
        'Classification Type',
        'Construction Type',
        'Digital',
      ];
      // Doing it again to maintain the index position in the summary logic
      normalizedFilters['summary_level_list'].push(this.getMarketType(marketType));
      return this.getSummaryForAllGeographies(normalizedFilters).pipe(
      map((summaryResponse: SummaryResponse) => {
        // Grouping the summaries based on market
        const summaryGroups = summaryResponse.summaries.reduce((group, summary) => {
          group[summary.summarizes['summarizes_id_list']['6']['id']] = [...group[summary.summarizes['summarizes_id_list']['6']['id']] || [], summary];
          return group;
         }, {});
        const totalSummaries = [];

        // Summing up the market summaries
        Object.keys(summaryGroups).forEach(key => {
          const marketSummary = this.calculateSummary(summaryGroups[key], filters['mediaTypeList']);
          marketSummary['summarizes'] = { type: null, id: key, name: summaryGroups[key][0].summarizes['summarizes_id_list']['6']['name']};
          totalSummaries.push(marketSummary);
        });
        return { summaries: totalSummaries};
      }));
    } else {
      return this.getSummaryForAllGeographies(normalizedFilters);
    }

  }
  /**
   * This method will sum up all the summaries
   * @param summaries List of summaries return from the API
   * @param mediaFilters The applied media filters used to filter the summaries
   */
  private calculateSummary(summaries, mediaFilters) {
    const filteredSummaries = [];
    const totalSummary: Partial<Summary> = {
      imp: 0,
      imp_target: 0,
      index_comp_target: 0,
      imp_target_inmkt: 0,
      reach_pct: null,
      freq_avg: null,
      imp_inmkt: 0,
      pct_comp_imp_target: 0,
      pct_imp_target_inmkt: 0,
      pct_comp_imp_target_inmkt: 0,
      trp: 0,
      pct_imp_inmkt: 0,
      pop_inmkt: 0,
      pop_target_inmkt: 0,
      reach_net: null,
      spots: 0
    };
    /**
     * Sample response from API for comparison
     * ['Media Type', 'Frame Media', 'Plant', 'Classification Type', 'Construction Type', 'Digital'];
     * 0: {id: "2", name: "Bulletin"}
     * 1: {id: "Tension Fabric Display", name: "Tension Fabric Display"}
     * 2: {id: "1", name: "Clear Channel"}
     * 3: {id: "4", name: "Place Based"}
     * 4: {id: "4", name: "Furniture"}
     * 5: {id: "false", name: "false"}
     * 6: {id: "DMA602", name: "Chicago, IL"}
     */
    mediaFilters.forEach(mediaFilter => {
      let mediaSummaries = [...summaries];
      // Filter by Digital or Non digital inventory
      if (mediaFilter['selection']?.['material'] && mediaFilter['ids']['material'] !== 'both') {
        mediaSummaries = mediaSummaries.filter(
          (summary) =>
            summary['summarizes']['summarizes_id_list'][5]['name'] ===
            mediaFilter['ids']['material']
        );
      }
      // Filter by Media types
      if (mediaFilter['selection']?.['mediaTypes'] && mediaFilter['ids']['mediaTypes'].length) {
        mediaSummaries = mediaSummaries.filter(
          summary => mediaFilter['ids']['mediaTypes'].includes(summary['summarizes']['summarizes_id_list'][0]['name']));
      }
      // Filter by Classification types
      if (mediaFilter['selection']?.['classification'] && mediaFilter['ids']['environments'].length) {
        mediaSummaries = mediaSummaries.filter(
          summary => mediaFilter['ids']['environments'].includes(summary['summarizes']['summarizes_id_list'][3]['name']));
      }
      // Filter by Construction Type'
      if (mediaFilter['selection']?.['construction'] && mediaFilter['ids']['construction'].length) {
        mediaSummaries = mediaSummaries.filter(
          summary => mediaFilter['ids']['construction'].includes(summary['summarizes']['summarizes_id_list'][4]['name']));
      }
      // Filter by Frame Media
      if (mediaFilter['selection']?.['medias'] && mediaFilter['ids']['medias'].length) {
        mediaSummaries = mediaSummaries.filter(
          summary => mediaFilter['ids']['medias'].includes(summary['summarizes']['summarizes_id_list'][1]['name']));
      }
      filteredSummaries.push(...mediaSummaries);
    });
    filteredSummaries.forEach((summary: Summary) => {
      totalSummary.spots += summary.spots;
      totalSummary.imp += summary.imp;
      totalSummary.imp_target += summary.imp_target;
      totalSummary.imp_target_inmkt += summary.imp_target_inmkt;
      totalSummary.imp_inmkt += summary.imp_inmkt;

    });
    totalSummary.pop_inmkt = filteredSummaries?.[0]?.['pop_inmkt'] || totalSummary.pop_inmkt;
    totalSummary.pop_target_inmkt = filteredSummaries?.[0]?.['pop_target_inmkt'] || totalSummary.pop_target_inmkt;
    // Index comp target calculation
    // ((sum of all imp_target_inmkt/sum of all imp_inmkt) / (any value of pop_target_inmkt/any value of pop_inmkt)) * 100
    if (totalSummary.imp_inmkt > 0 && totalSummary.pop_inmkt) {
      totalSummary.index_comp_target =
      (totalSummary.imp_target_inmkt /
        totalSummary.imp_inmkt /
        (totalSummary.pop_target_inmkt / totalSummary.pop_inmkt)) *
      100;
    }

    // Target % Impression Comp calculation
    // (sum of imp_target / sum of imp) * 100
    if (totalSummary.imp > 0) {
      totalSummary.pct_comp_imp_target =  (totalSummary.imp_target / totalSummary.imp) * 100;
    }

    // Target % In-Market Impressions calculation
    // (sum of imp_target_inmkt / sum of imp_target) * 100
    if (totalSummary.imp_inmkt > 0) {
      totalSummary.pct_imp_target_inmkt = (totalSummary.imp_target_inmkt / totalSummary.imp_target) * 100;
    }

    // Target % In-Market Impr. Comp. calculation
    // (sum of imp_target_inmkt / sum of imp_inmkt) * 100
    if (totalSummary.imp_inmkt > 0) {
      totalSummary.pct_comp_imp_target_inmkt = (totalSummary.imp_target_inmkt / totalSummary.imp_inmkt) * 100;
    }

    // Target In-Market Rating Points(TRP) calculation
    // ((sum of all imp_target_inmkt) / any value of pop_target_inmkt) * 100
    if (totalSummary.pop_target_inmkt > 0) {
      totalSummary.trp = (totalSummary.imp_target_inmkt / totalSummary.pop_target_inmkt) * 100;
    }

    // Total % In-Mkt Impr.) calculation
    // (sum of imp_inmkt / sum of imp) * 100
    if (totalSummary.imp > 0) {
      totalSummary.pct_imp_inmkt = (totalSummary.imp_inmkt / totalSummary.imp) * 100;
    }
    return totalSummary;
  }


  /**
   * This method is to get the list of Placement type list
   * @param {boolean} [noLoader=true]
   * @memberof InventoryService
   */
   public getSegmentsCatelog(dataSource, noLoader = true) :Observable<any> {
    if (!this.segmentsCatalogList$) {
    const url = `${this.config.envSettings['API_ENDPOINT_V2.1']}segments/catalog?product_name_q=${dataSource}`;
      this.segmentsCatalogList$ = this.http.get<any>(url)
        .pipe(
          publishReplay(1),
          refCount(),
          catchError(this.handleError('getSegmentsCatelog', null)),
        );
    }
    return this.segmentsCatalogList$;
  }

  public getSegmentsSearch(dataSource, noLoader = true): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http
      .post<any>(
        this.config.envSettings['API_ENDPOINT_V2.1'] + 'segments/search',
        {
          "id_list": ['*'],
          "product_name": dataSource,
          "fieldset": ["id","source_name", "category_name", "subcategory_name", "base_population_segment_list", "base_population_segment_default", 'product_feature_list', 'name', 'description']
        },
        { headers: reqHeaders }
      );
  }
  
  /** Clear all event add inventory - parent to child */
  public clearAll(element) {
    this.clearButtonSource = fromEvent(element, 'click');
  }
}

