import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfig } from '../app-config.service';
import { EMPTY, Observable, of, Subject } from 'rxjs';
import {
  CreateProjectReq,
  DeleteProject,
  DuplicateProjectReq,
  DuplicateScenarioReq,
  MarketPlan,
  ProjectListQueryParams,
  ProjectsList,
  WorkflowLables,
  Duration
} from '@interTypes/workspaceV2';
import { catchError, publishReplay, refCount, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Market2 } from '@interTypes/scenario.response';
import { BaseResponse } from '@interTypes/BaseResponse';
import {
  InventoryPlanQueryParams,
  InventoryPlanResponse,
  InventoryPlanSpotsResponse
} from '@interTypes/inventory-plan';
import { Helper } from 'app/classes';
import { ThemeService } from '@shared/services';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceV3Service {
  public clearScenarioFilters$ = new Subject();
  private reqHeaders: HttpHeaders;
  private duration$: Observable<Duration>;
  public updateSceanrioPlanPeriod$ = new Subject();
  private spotSchedulesData: Subject<any> = new Subject<any>();
  private inventorySetIds: Subject<any> = new Subject<any>();

  constructor(private http: HttpClient, private config: AppConfig,private themeService: ThemeService) {
    this.reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
  }
  public getProjects(
    params: ProjectListQueryParams
  ): Observable<ProjectsList> {
    const url = Helper.formatUrlWithParams(
      `${this.config.envSettings['API_ENDPOINT_V2.1']}workflows/projects`,
      params
    );
    return this.http
      .get<ProjectsList>(url, {
        headers: this.reqHeaders
      })
      .pipe(catchError((error) => of({ projects: [] })));
  }
  public createProject(projectData: CreateProjectReq): Observable<any> {
    const url =
      this.config.envSettings['API_ENDPOINT_V2'] + 'workflows/projects/';
    return this.http.post(url, projectData).pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }
  public updateProject(projectId, projectData): Observable<any> {
    const url =
      this.config.envSettings['API_ENDPOINT'] +
      'workflows/projects/' +
      projectId;
    return this.http.patch(url, projectData);
  }
  public workSpaceLabels = this.getWorkFlowLabels();
  public deleteProject(params: DeleteProject): Observable<any> {
    const url =
      this.config.envSettings['API_ENDPOINT_V2'] +
      'workflows/projects/' +
      params['_id'];
    return this.http.delete(url, { headers: this.reqHeaders });
  }
  public duplicateProjects(params: DuplicateProjectReq): Observable<any> {
    return this.http
      .post(
        this.config.envSettings['API_ENDPOINT_V2'] +
          'workflows/projects/' +
          params['_id'] +
          '/clone',
        params,
        { headers: this.reqHeaders }
      )
      .pipe(
        catchError((error) => {
          return of(error);
        })
      );
  }
  public getProjectDetails(projectId: string): Observable<any> {
    const reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.http
      .get(
        `${this.config.envSettings['API_ENDPOINT_V2']}workflows/projects/${projectId}?sort_field=createdAt`,
        {
          headers: reqHeaders
        }
      )
      .pipe(
        catchError((error) => {
          return of(error);
        })
      );
  }

  public getScenariobyId(scenarioId: string): Observable<any> {
    return this.http
      .get(
        this.config.envSettings['API_ENDPOINT_V2'] +
          'workflows/scenarios/' +
          scenarioId
      )
      .pipe(catchError((error) => of(error)));
  }

  public getProject(projectId: string): Observable<any> {
    const reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.http
      .get(
        this.config.envSettings['API_ENDPOINT_V2'] +
          'workflows/projects/' +
          projectId,
          {
            headers: reqHeaders
          }
      )
      .pipe(catchError((error) => of(error)));
  }

  public moveScenarioOrProject(type = 'scenarios', id, projectId) {
    return this.http.post(
      `${this.config.envSettings['API_ENDPOINT_V2']}accounts/${type}/${id}/move/${projectId}`,
      {},
      { headers: this.reqHeaders }
    );
  }
  public getDraftProject(params = {}): Observable<any> {
    const url = Helper.formatUrlWithParams(
      `${this.config.envSettings['API_ENDPOINT_V2']}workflows/projects/draft`,
      params
    );
    return this.http
      .get(
        url,
        { headers: this.reqHeaders }
      )
      .pipe(catchError((error) => of(error)));
  }
  public createDraftProject(projectData: CreateProjectReq): Observable<any> {
    const url =
      this.config.envSettings['API_ENDPOINT_V2'] + 'workflows/projects/draft';
    return this.http.post(url, projectData).pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }
  /** Scenario managment API */

  createScenario(projectId, scenario): Observable<any> {
    const reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.http.post(
      this.config.envSettings['API_ENDPOINT_V2'] +
        'workflows/projects/' +
        projectId +
        '/scenarios',
      scenario,
      { headers: reqHeaders }
    );
  }
  updateScenario(scenario, scenarioId): Observable<any> {
    const reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    const url = `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}`;
    return this.http.patch(url, scenario, { headers: reqHeaders });
  }
  public duplicateScenario(
    data: DuplicateScenarioReq,
    id: string
  ): Observable<any> {
    return this.http.post(
      this.config.envSettings['API_ENDPOINT_V2'] +
        'workflows/scenarios/' +
        id +
        '/clone',
      data,
      { headers: this.reqHeaders }
    );
  }
  deleteScenarios(id) {
    return this.http.delete(
      this.config.envSettings['API_ENDPOINT_V2'] + 'workflows/scenarios/' + id
    );
  }
  saveInventoryPackage(inputs, data = []): Observable<any> {
    const pack = { name: inputs.name, description: inputs.description };
    if (pack['description'] === '') {
      pack['description'] = null;
    }
    pack['inventory'] = data;
    if (inputs.client_id) {
      pack['client_id'] = Number(inputs.client_id);
    }
    if (inputs && inputs['isScenarioInventorySet']) {
      pack['isScenarioInventorySet'] = true;
    }
    const body = { package: pack };
    if (inputs.name_key !== '' && inputs.name_key != null) {
      return this.http.patch(
        this.config.envSettings['API_ENDPOINT'] +
          'inventory/collections/' +
          inputs.id,
        body,
        { headers: this.reqHeaders }
      );
    } else {
      return this.http.post(
        this.config.envSettings['API_ENDPOINT'] + 'inventory/collections',
        body,
        { headers: this.reqHeaders }
      );
    }
  }
  getExplorePackagesById(noLoader = false, inventorySetId) {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.get(
      this.config.envSettings['API_ENDPOINT'] +
        'inventory/collections/' +
        inventorySetId,
      { headers: reqHeaders }
    );
  }

  formatMediaattribute(mediaAttribute) {
    if (mediaAttribute) {
      let data = {};
      const media = mediaAttribute;
      if (media['orientationList']) {
        data['orientation'] = media['orientationList'];
      }
      // We are multiplying with 12 to convert feets to inches as API expecting inches
      if (media['panelSizeWidthRange']) {
        data['frame_width'] = {
          min: media['panelSizeWidthRange'][0],
          max: media['panelSizeWidthRange'][1]
        };
      }

      if (media['spotLength']) {
        data['spot_length'] = {
          min: media['spotLength']['min'],
          max: media['spotLength']['max']
        };
      }

      if (media['panelSizeHeightRange']) {
        data['frame_height'] = {
          min: media['panelSizeHeightRange'][0],
          max: media['panelSizeHeightRange'][1]
        };
      }
      if (
        media['rotating'] !== undefined &&
        media['rotating'] !== null &&
        media['rotating'] !== ''
      ) {
        data['rotating'] = media['rotating'];
      }
      if (media['illuminationHrsRange']) {
        data['illumination_start_time'] = media['illuminationHrsRange'][0];
        data['illumination_end_time'] = media['illuminationHrsRange'][1];
      }
      if (media['auditStatusList'] && media['auditStatusList'].length) {
        data['status_type_name_list'] = media['auditStatusList'];
      }
      if (
        media['spotAudio'] !== undefined &&
        media['spotAudio'] !== null &&
        media['spotAudio'] !== ''
      ) {
        data['spot_audio'] = media['spotAudio'];
      }
      if (
        media['spotFullMotion'] !== undefined &&
        media['spotFullMotion'] !== null &&
        media['spotFullMotion'] !== ''
      ) {
        data['spot_full_motion'] = media['spotFullMotion'];
      }
      if (
        media['spotPartialMotion'] !== undefined &&
        media['spotPartialMotion'] !== null &&
        media['spotPartialMotion'] !== ''
      ) {
        data['spot_partial_motion'] = media['spotPartialMotion'];
      }
      if (
        media['spotInteractive'] !== undefined &&
        media['spotInteractive'] !== null &&
        media['spotInteractive'] !== ''
      ) {
        data['spot_interactive'] = media['spotInteractive'];
      }
      return {
        enabled: true,
        data: data
      };
    }
  }
  public formatMediaAttributeReverse(media) {
    const mediaAttribute = {};
    if (media) {
      if (media['orientation']) {
        mediaAttribute['orientationList'] = {
          min: media['orientation']['min'],
          max: media['orientation']['max']
        };
        if (media['orientation']['option']) {
          mediaAttribute['orientationList']['option'] = media['orientation']['option'];
        }
      }

      if (media['illumination_start_time'] && media['illumination_end_time']) {
        mediaAttribute['illuminationHrsRange'] = [ media['illumination_start_time'], media['illumination_end_time']];
      }
      if (media['frame_width']) {
        mediaAttribute['panelSizeWidthRange'] = [ media['frame_width']['min'] ,  media['frame_width']['max'] ];
      }
      if (media['frame_height']) {
        mediaAttribute['panelSizeHeightRange'] = [ media['frame_height']['min'] ,  media['frame_height']['max'] ];
      }

      if (media['spot_length']) {
        mediaAttribute['spotLength'] = { min: media['spot_length']['min'] ,max: media['spot_length']['max'] };
      }

      if (media['rotating'] || media['rotating'] === false) {
        mediaAttribute['rotating'] = media['rotating'];
      }
      if (media['status_type_name_list']) {
        mediaAttribute['auditStatusList'] = media['status_type_name_list'];
      }
      if (
        media['spot_audio'] !== undefined &&
        media['spot_audio'] !== null &&
        media['spot_audio'] !== ''
      ) {
        mediaAttribute['spotAudio'] = media['spot_audio'];
      }
      if (
        media['spot_full_motion'] !== undefined &&
        media['spot_full_motion'] !== null &&
        media['spot_full_motion'] !== ''
      ) {
        mediaAttribute['spotFullMotion'] = media['spot_full_motion'];
      }
      if (
        media['spot_partial_motion'] !== undefined &&
        media['spot_partial_motion'] !== null &&
        media['spot_partial_motion'] !== ''
      ) {
        mediaAttribute['spotPartialMotion'] = media['spot_partial_motion'];
      }
      if (
        media['spot_interactive'] !== undefined &&
        media['spot_interactive'] !== null &&
        media['spot_interactive'] !== ''
      ) {
        mediaAttribute['spotInteractive'] = media['spot_interactive'];
      }
    }
    return mediaAttribute;
  }
  formatThreshold(thresholds) {
    const thresholdFilers = [];
    if (thresholds['inMarketCompIndex']) {
      thresholdFilers.push({
        type: 'index_comp_target',
        min: thresholds['inMarketCompIndex'][0],
        max: thresholds['inMarketCompIndex'][1]
      });
    }
    if (thresholds['targetImp']) {
      thresholdFilers.push({
        type: 'imp_target',
        min: thresholds['targetImp'][0],
        max: thresholds['targetImp'][1]
      });
    }
    return {
      enabled: true,
      data: thresholdFilers
    };
  }

  public generatePlans(
    scenarioId: string,
    planData,
    update: boolean = false
  ): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}/marketPlans`;
    if (update) {
      return this.http.put(url, planData, { headers: this.reqHeaders });
    } else {
      return this.http.post(url, planData, { headers: this.reqHeaders });
    }
  }

  public getDurations(): Observable<Duration> {
    if (!this.duration$) {
      const url =
        this.config.envSettings['API_ENDPOINT_V2'] + 'workflows/durations/';
      this.duration$ = this.http
        .get<Duration>(url, {
          headers: this.reqHeaders
        })
        .pipe(
          publishReplay(1),
          refCount(),
          catchError((error) => {
            this.duration$ = null;
            return EMPTY;
          })
        );
    }
    return this.duration$;
  }

  public getExplorePackages() {
    return this.http.get(
      this.config.envSettings['API_ENDPOINT'] + 'inventory/collections',
      { headers: this.reqHeaders }
    );
  }
  public getInventorySetById(inventorySetId: string): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT']}inventory/collections/${inventorySetId}`;
    return this.http.get(url, { headers: this.reqHeaders });
  }
  public getSavedInventorySets(search = '', page = 1, perPage = 10): Observable<any[]> {
    const url = `${this.config.envSettings['API_ENDPOINT']}inventory/collections/search?fieldSet=name,_id,inventory,isScenarioInventorySet,owner,client_id&page=${page}&perPage=${perPage}`;
    const searchTerm = {'search': search};
    return this.http.post<any[]>(url, searchTerm, { headers: this.reqHeaders });
  }
  // CSV export for inventory plan
  public exportPlan(id, data, noLoader = false, csv = false) {
    let reqHeaders = new HttpHeaders();
    let options = {};
    if (noLoader) {
      reqHeaders = reqHeaders.set('hide-loader', 'hide-loader');
    }
    if (csv) {
      reqHeaders = reqHeaders.set('Accept', 'application/json, text/csv');
      options = { observe: 'response', responseType: 'blob' };
    }
    options['headers'] = reqHeaders;
    const url = `${this.config.envSettings['API_ENDPOINT']}reports/scenario/${id}/export`;
    return this.http.post(url, data, options);
  }

  public getCSVHeaders(customizedColumns = []) {
    const CSVHeaders = {
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
      illumination_type: 'Illumination Type',
      freq_avg: 'Target In-Market Frequency',
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
      pop_inmkt: 'Total Market Population',
      scheduled_weeks: 'Scheduled # of Weeks',
      target_aud: 'Target Audience',
      per_out_market_imp: 'Total % Out of Market Impressions',
      out_market_imp: 'Total Out of Market Impressions',
      pop_target_inmkt: 'Target Audience Market Population',
      reach_net: 'Reach Net',
      county_name: 'Inventory Location (County)',
      dma_name: 'Inventory Location (DMA)',
      cbsa_name: 'Inventory Location (CBSA)',
      dma_freq_avg: 'Inventory Location (DMA) Target In-Market Frequency',
      dma_imp: 'Inventory Location (DMA) Total Impressions',
      dma_imp_inmkt: 'Inventory Location (DMA) Total In-Market Impressions',
      dma_imp_target: 'Inventory Location (DMA) Target Impressions',
      dma_index_comp_target: 'Inventory Location (DMA) Target Audience Index',
      dma_imp_target_inmkt:
        'Inventory Location (DMA) Target In-Market Impressions',
      dma_pct_comp_imp_target:
        'Inventory Location (DMA) Target % Impression Comp',
      dma_pct_comp_imp_target_inmkt:
        'Inventory Location (DMA) Target % In-Market Impr. Comp.',
      dma_pct_imp_inmkt: 'Inventory Location (DMA) Total % In-Mkt Impr.',
      dma_pct_imp_target_inmkt:
        'Inventory Location (DMA) Target % In-Market Impressions',
      dma_reach_pct: 'Inventory Location (DMA) Target In-Market Reach',
      dma_trp: 'Inventory Location (DMA) Target In-Market Rating Points',
      dma_pop_inmkt: 'Inventory Location (DMA) Total Market Population',
      dma_scheduled_weeks: 'Inventory Location (DMA) Scheduled # of Weeks',
      dma_target_aud: 'Inventory Location (DMA) Target Audience',
      dma_per_out_market_imp:
        'Inventory Location (DMA) Total % Out of Market Impressions',
      dma_out_market_imp:
        'Inventory Location (DMA) Total Out of Market Impressions',
      dma_pop_target_inmkt:
        'Inventory Location (DMA) Target Audience Market Population',
      dma_reach_net: 'Inventory Location (DMA) Reach Net',
      cbsa_freq_avg: 'Inventory Location (CBSA) Target In-Market Frequency',
      cbsa_imp: 'Inventory Location (CBSA) Total Impressions',
      cbsa_imp_inmkt: 'Inventory Location (CBSA) Total In-Market Impressions',
      cbsa_imp_target: 'Inventory Location (CBSA) Target Impressions',
      cbsa_index_comp_target: 'Inventory Location (CBSA) Target Audience Index',
      cbsa_imp_target_inmkt:
        'Inventory Location (CBSA) Target In-Market Impressions',
      cbsa_pct_comp_imp_target:
        'Inventory Location (CBSA) Target % Impression Comp',
      cbsa_pct_comp_imp_target_inmkt:
        'Inventory Location (CBSA) Target % In-Market Impr. Comp.',
      cbsa_pct_imp_inmkt: 'Inventory Location (CBSA) Total % In-Mkt Impr.',
      cbsa_pct_imp_target_inmkt:
        'Inventory Location (CBSA) Target % In-Market Impressions',
      cbsa_reach_pct: 'Inventory Location (CBSA) Target In-Market Reach',
      cbsa_trp: 'Inventory Location (CBSA) Target In-Market Rating Points',
      cbsa_pop_inmkt: 'Inventory Location (CBSA) Total Market Population',
      cbsa_scheduled_weeks: 'Inventory Location (CBSA) Scheduled # of Weeks',
      cbsa_target_aud: 'Inventory Location (CBSA) Target Audience',
      cbsa_per_out_market_imp:
        'Inventory Location (CBSA) Total % Out of Market Impressions',
      cbsa_out_market_imp:
        'Inventory Location (CBSA) Total Out of Market Impressions',
      cbsa_pop_target_inmkt:
        'Inventory Location (CBSA) Target Audience Market Population',
      cbsa_reach_net: 'Inventory Location (CBSA) Reach Net',
      county_freq_avg: 'Inventory Location (County) Target In-Market Frequency',
      county_imp: 'Inventory Location (County) Total Impressions',
      county_imp_inmkt:
        'Inventory Location (County) Total In-Market Impressions',
      county_imp_target: 'Inventory Location (County) Target Impressions',
      county_index_comp_target:
        'Inventory Location (County) Target Audience Index',
      county_imp_target_inmkt:
        'Inventory Location (County) Target In-Market Impressions',
      county_pct_comp_imp_target:
        'Inventory Location (County) Target % Impression Comp',
      county_pct_comp_imp_target_inmkt:
        'Inventory Location (County) Target % In-Market Impr. Comp.',
      county_pct_imp_inmkt: 'Inventory Location (County) Total % In-Mkt Impr.',
      county_pct_imp_target_inmkt:
        'Inventory Location (County) Target % In-Market Impressions',
      county_reach_pct: 'Inventory Location (County) Target In-Market Reach',
      county_trp: 'Inventory Location (County) Target In-Market Rating Points',
      county_pop_inmkt: 'Inventory Location (County) Total Market Population',
      county_scheduled_weeks:
        'Inventory Location (County) Scheduled # of Weeks',
      county_target_aud: 'Inventory Location (County) Target Audience',
      county_per_out_market_imp:
        'Inventory Location (County) Total % Out of Market Impressions',
      county_out_market_imp:
        'Inventory Location (County) Total Out of Market Impressions',
      county_pop_target_inmkt:
        'Inventory Location (County) Target Audience Market Population',
      county_reach_net: 'Inventory Location (County) Reach Net',
      place_name: 'Place Name',
      placement_type: 'Placement Type',
      place_type: 'Place Type'
    };
    if (customizedColumns && customizedColumns.length > 0) {
      const customColumns = {};
      customizedColumns.forEach((column) => {
        if (column['name'] !== 'CHECKBOX' && column['name'] !== 'SLNO') {
          switch (column['value']) {
            case 'classification_type':
              customColumns['classification'] = CSVHeaders['classification'];
              break;
            case 'construction_type':
              customColumns['construction'] = CSVHeaders['construction'];
              break;
            case 'max_height':
              customColumns['height'] = CSVHeaders['height'];
              break;
            case 'max_width':
              customColumns['width'] = CSVHeaders['width'];
              break;
            case 'plant_frame_id':
              customColumns['operator_spot_id'] =
                CSVHeaders['operator_spot_id'];
              break;
            case 'checked':
              break;
            case 'opp':
              customColumns['plant_operator'] = CSVHeaders['plant_operator'];
              break;
            case 'mt':
              customColumns['media_type'] = CSVHeaders['media_type'];
              break;
            case 'period_days':
              customColumns['scheduled_weeks'] = CSVHeaders['scheduled_weeks'];
              break;
            default:
              customColumns[column['value']] = CSVHeaders[column['value']];
              break;
          }
        }
      });
      return customColumns;
    } else {
      return CSVHeaders;
    }
  }
  public formatScenarioData(scenario) {
    // Remove UI unmanaged properties from the scenario object.
    delete scenario?._id;
    delete scenario?.access;
    delete scenario?.budget;
    delete scenario?.createdAt;
    delete scenario.updatedAt;
    delete scenario.attachments;
    delete scenario.geography;
    delete scenario.marketPlans;
    // delete scenario.spot_schedule;
    delete scenario.filterInventoryByMarket;
    delete scenario.duration;
    scenario.markets = null;
    scenario.market = this.getFormattedMarkets(scenario);
    if (scenario?.package?.length <= 0) {
      scenario.package = null;
    }
    // Tags were not in the new design.
    if (scenario?.labels?.length <= 0) {
      scenario.labels = null;
    }
    // goals can be empty for inventory plan, but API needs it regardless as null object.
    if (
      scenario?.goals?.length <= 0 ||
      Object.keys(scenario?.goals[0]).length <= 0
    ) {
      scenario.goals = [
        {
          impressions: null,
          trp: null,
          reach: null,
          frequency: null
        }
      ];
    }
    if (scenario?.places?.length <= 0) {
      scenario.places = null;
    }
    if (!scenario.when) {
      scenario.when = {
        end: null,
        start: null
      };
    }
    if (!scenario.notes) {
      // TODO: have confusion between notes and discussion, there is no note in new designs, so setting as null.
      scenario.notes = null;
    }
    if (!scenario.mediaAttributes) {
      scenario.mediaAttributes = {
        data: {},
        enabled: false
      };
    }
   /*  if (scenario.operators?.data?.length <= 0) {
      scenario.operators.data = ['all'];
    } */
    if (scenario?.spot_schedule) {
      scenario.spot_schedule = {
        start: this.formatDate(scenario?.spot_schedule['start']),
        end: this.formatDate(scenario?.spot_schedule['end'])
      };
    }
    // TODO : Need to add additional validations after inventory plan state is created.
    return scenario;
  }
  formatDate(date) {
    const dateDub = new Date(date);
    return (
      dateDub.getFullYear() +
      '-' +
      ('0' + (dateDub.getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + dateDub.getDate()).slice(-2)
    );
  }

  private getFormattedMarkets(scenario) {
    return scenario?.market?.map((market) => {
      if (market?.marketsGroup?.length <= 0) {
        delete market?.marketsGroup;
      }
      return market;
    });
  }

  public setAndValidateMarkets(
    existingOptions: Market2[],
    selectedOptions: Market2[],
    addAsGroup,
    marketType
  ) {
    marketType =
      marketType === 'County' || marketType === 'COUNTY' ? 'CNTY' : marketType;

    // Filtering the existing markets based on newly selected market type
    const selectedMarkets = existingOptions.filter((option) => {
      if (option?.marketsGroup?.length) {
        return option.marketsGroup[0]['id'].includes(marketType);
      } else {
        return option.id.includes(marketType)
      }
    });
    const existingIds = selectedMarkets.map((option: Market2) => option.id);
    selectedOptions.forEach((option: Market2) => {
      if (
        !existingIds.includes(option['id']) &&
        !option?.marketsGroup?.length
      ) {
        selectedMarkets.push({ id: option['id'], name: option['name'] });
      }
    });
    if (addAsGroup) {
      // Group means only one object will be there
      if (selectedOptions[0].marketsGroup.length) {
        const selectedGroupIds =
          selectedOptions[0] &&
          selectedOptions[0]['marketsGroup'].map((obj) => obj['id']).join(',');
        const existingMarketGroups = selectedMarkets.filter(
          (option: Market2) => option?.marketsGroup?.length
        );
        if (existingMarketGroups.length) {
          // Checking If group is already existed or not
          let isExisted = false;
          existingMarketGroups.forEach((marketObj) => {
            if (marketObj['marketsGroup'] && marketObj['marketsGroup'].length) {
              const existingGroupName = marketObj['marketsGroup']
                .map((obj) => obj['id'])
                .join(',');
              if (existingGroupName === selectedGroupIds) {
                isExisted = true;
              }
            }
          });
          if (!isExisted) {
            selectedMarkets.push(selectedOptions[0]);
          }
        } else {
          selectedMarkets.push(selectedOptions[0]);
        }
      }
    }
    return selectedMarkets;
  }

  /**
   * @description
   * To generate inventory plan
   *
   * @param scenarioId
   */
  public generateInventoryPlan(
    scenarioId: string,
    noLoader = false
  ): Observable<BaseResponse<any>> {
    let reqHeaders: HttpHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http
      .post(
        `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}/inventoryPlans`,
        {},
        { headers: reqHeaders }
      )
      .pipe(
        catchError((error) => {
          return of(error);
        })
      );
  }

  /**
   * @description
   * To get inventory plan data
   * We need to make intial call with out sending plan name in query to get all the plan details
   * @param scenarioId
   * @param planName to get plan wise detials
   *
   */
  public getInventoryPlans(
    scenarioId: string,
    planName = '',
    noLoader = true
  ): Observable<InventoryPlanResponse> {
    let reqHeaders: HttpHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    let url = `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}/inventoryPlans`
    if (planName) {
      url = `${url}?plan=${planName}`;
    }
    return this.http.get(url, { headers: reqHeaders }).pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }

  /**
   * @description
   * To get spots data of a particular inventory plan
   * @param scenarioId
   * @param plan Name of the plan
   * @param query
   *
   */
  public getInventorySpotsByPlan(
    scenarioId: string,
    plan,
    query: InventoryPlanQueryParams = {
      perPage: 50,
      page: 1
    },
    noLoader = true
  ): Observable<InventoryPlanSpotsResponse> {
    let reqHeaders: HttpHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    const url = Helper.formatUrlWithParams(
      `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}/inventoryPlans/${plan}/spots`,
      query
    );
    return this.http.get(url, { headers: reqHeaders }).pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }

  /**
   * This function is to spot schedules csv
   * @param scenarioId Scenario Id
   * @param fileInfo uploaded file info
   * @param noLoader
   */
  public uploadSpotScheduleCSV(scenarioId, fileInfo, noLoader = false) {
    const requestUrl = `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}/spot_schedule/import?type=document`;
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.post(requestUrl, fileInfo, { headers: reqHeaders });
  }
  /**
   * This functions is to send matched field names of csv and places db
   * @param scenarioId selected customer Id
   * @param filename uploaded file name sent by API
   * @param mappingInfo csv and db fields mapping info
   * @param noLoader
   */
  public updateCsvFieldsMapping(
    scenarioId,
    filename,
    mappingInfo,
    noLoader = false
  ): Observable<any> {
    const requestUrl = `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}/spot_schedule/import/${filename}`;
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.post(requestUrl, mappingInfo, { headers: reqHeaders });
  }

  public getAllSpotSchedules(scenarioId, noLoader = false): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}/spot_schedule`;
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.get(url, { headers: reqHeaders });
  }

  public updateSpotSchedule(scenarioId, data, noLoader = false) {
    const requestUrl = `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}/spot_schedule`;
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.patch(requestUrl, data, { headers: reqHeaders });
  }
  public getSpotSchedulesData(): Observable<any> {
    return this.spotSchedulesData.asObservable();
  }
  public setSpotSchedulesData(data): void {
    if (data) {
      this.spotSchedulesData.next(data);
    }
  }

  getWorkFlowLabels(): WorkflowLables {
    let labels: WorkflowLables = {
      project: ['Project', 'Projects'],
      scenario: ['Scenario', 'Scenarios'],
      subProject: ['Sub Project', 'Sub Projects'],
      folder: ['Folder', 'Folders'],
    };
    const theme = this.themeService.getThemeSettings();
    if (theme && theme['workflow']) {
      const workflow = theme['workflow'];
      labels = {
        project: workflow['project'],
        scenario: workflow['scenario_0'],
        subProject: workflow['sub-project'],
        folder: workflow['folder_0'],
      };
    }
    return labels;
  }

  public getScenarioMediaTypes(scenarioId: string): Observable<any> {
    return this.http
      .get(
        this.config.envSettings['API_ENDPOINT_V2'] +
          'workflows/scenarios/' +
          scenarioId +
          '/mediaTypes'
      )
      .pipe(catchError((error) => of(error)));
  }
  public getUpdateInventorySetIds(): Observable<any> {
    return this.inventorySetIds.asObservable();
  }
  public setUpdateInventorySetIds(data): void {
    if (data) {
      this.inventorySetIds.next(data);
    }
  }
}
