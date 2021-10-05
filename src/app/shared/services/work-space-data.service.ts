import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable, ReplaySubject } from 'rxjs';

@Injectable()
export class WorkSpaceDataService {

  constructor() {}
  public scenarioName = '';
  public scenarioDescription = '';
  public scenarioTags: any;
  private dayparts = [
    { name: 'Weekly Average', value: 'Weekly Average' }
    // {name: 'Monthly Average', value: 'Monthly Average'}
  ];
  private packages = new BehaviorSubject([]);
  private scenarios = new ReplaySubject(1);
  private newScenario = new Subject();
  private selectedPackage = new Subject();
  private customColumnChanged = new Subject();
  private customizedColumnEmitter = new BehaviorSubject('notOpen');
  public sortableColumns = [
    {
      'name': 'PLANT OPERATOR',
      'displayname': 'Plant Operator',
      'value': 'opp'
    },
    {
      'name': 'SPOT ID',
      'displayname': 'Geopath Spot ID',
      'value': 'spot_id'
    },
    {
      'name': 'FRAME ID',
      'displayname': 'Geopath Frame ID',
      'value': 'frame_id'
    },
    {
      'name': 'Media Status',
      'displayname': 'Status',
      'value': 'media_status_name'
    },
    {
      'name': 'Media Description',
      'displayname': 'Status Description',
      'value': 'media_status_description'
    },
    {
      'name': 'PLANT UNIT ID',
      'displayname': 'Operator Spot ID',
      'value': 'plant_frame_id'
    },
    {
      'name': 'MEDIA TYPE',
      'displayname': 'Media Type',
      'value': 'mt'
    },
    {
      'name': 'classification_type',
      'displayname': 'Classification',
      'value': 'classification_type'
    },
    {
      'name': 'construction_type',
      'displayname': 'Construction',
      'value': 'construction_type'
    },
    {
      'name': 'digital',
      'displayname': 'Material',
      'value': 'digital'
    },
    {
      'name': 'height',
      'displayname': 'Height (ft & in)',
      'value': 'max_height'
    },
    {
      'name': 'width',
      'displayname': 'Width (ft & in)',
      'value': 'max_width'
    },
    {
      'name': 'primary_artery',
      'displayname': 'Primary Artery',
      'value': 'primary_artery'
    },
    {
      'name': 'zip_code',
      'displayname': 'ZIP Code',
      'value': 'zip_code'
    },
    {
      'name': 'longitude',
      'displayname': 'Longitude',
      'value': 'longitude'
    },
    {
      'name': 'latitude',
      'displayname': 'Latitude',
      'value': 'latitude'
    },
    {
      'name': 'illumination_type',
      'displayname': 'Illumination Type',
      'value': 'illumination_type'
    },
    {
      'name': 'orientation',
      'displayname': 'Orientation',
      'value': 'orientation'
    },
    {
      'name': 'media_name',
      'displayname': 'Media Name',
      'value': 'media_name'
    },
    {
      'name': 'market_name',
      'displayname': 'Market Name',
      'value': 'market_name'
    },
    {
      'name': 'market_type',
      'displayname': 'Market Type',
      'value': 'market_type'
    },
    {
      'name': 'target_aud',
      'displayname': 'Target Audience',
      'value': 'target_aud'
    },
    {
      'name': 'dma_name',
      'displayname': 'Inventory Location (DMA)',
      'value': 'dma_name'
    },
    {
      'name': 'cbsa_name',
      'displayname': 'Inventory Location (CBSA)',
      'value': 'cbsa_name'
    },
    {
      'name': 'county_name',
      'displayname': 'Inventory Location (County)',
      'value': 'county_name'
    },
    {
      'name': 'Total Imp',
      'displayname': 'Total Impressions',
      'value': 'imp',
      'type': 'ABBREVIATE'
    },
   /* {
      'name': 'Inventory Location (DMA) Total Imp',
      'displayname': 'Inventory Location (DMA) Total Impressions',
      'value': 'dma_imp',
      'type': 'ABBREVIATE'
    },
    {
      'name': 'Total Imp (CBSA)',
      'displayname': 'Inventory Location (CBSA) Total Impressions',
      'value': 'cbsa_imp',
      'type': 'ABBREVIATE'
    },
    {
      'name': 'Total Imp (County)',
      'displayname': 'Inventory Location (County) Total Impressions',
      'value': 'county_imp',
      'type': 'ABBREVIATE'
    }, */
    {
      'name': 'Target Imp',
      'displayname': 'Target Impressions',
      'value': 'imp_target',
      'type': 'ABBREVIATE'
    },
    /* {
      'name': 'Target Imp (DMA)',
      'displayname': 'Inventory Location (DMA) Target Impressions',
      'value': 'dma_imp_target',
      'type': 'ABBREVIATE'
    },
    {
      'name': 'Target Imp (CBSA)',
      'displayname': 'Inventory Location (CBSA) Target Impressions',
      'value': 'cbsa_imp_target',
      'type': 'ABBREVIATE'
    },
    {
      'name': 'Target Imp (County)',
      'displayname': 'Inventory Location (County) Target Impressions',
      'value': 'county_imp_target',
      'type': 'ABBREVIATE'
    }, */
    {
      'name': 'In-Mkt Target Comp Index',
      'displayname': 'Target Audience Index',
      'value': 'index_comp_target',
      'type' : 'THOUSAND'
    },
    {
      'name': 'Inventory Location (DMA) In-Mkt Target Comp Index',
      'displayname': 'Inventory Location (DMA)Target Audience Index',
      'value': 'dma_index_comp_target',
      'type' : 'THOUSAND'
    },
    {
      'name': 'Inventory Location (CBSA) In-Mkt Target Comp Index',
      'displayname': 'Inventory Location (CBSA)Target Audience Index',
      'value': 'cbsa_index_comp_target',
      'type' : 'THOUSAND'
    },
    {
      'name': 'Inventory Location (County) In-Mkt Target Comp Index',
      'displayname': 'Inventory Location (County)Target Audience Index',
      'value': 'county_index_comp_target',
      'type' : 'THOUSAND'
    },
    {
      'name': 'In-Mkt Target Imp',
      'displayname': 'Target In-Market Impressions',
      'value': 'imp_target_inmkt',
      'type': 'ABBREVIATE'
    },
    {
      'name': 'Inventory Location (DMA) In-Mkt Target Imp',
      'displayname': 'Inventory Location (DMA) Target In-Market Impressions',
      'value': 'dma_imp_target_inmkt',
      'type': 'ABBREVIATE'
    },
    {
      'name': 'Inventory Location (CBSA) In-Mkt Target Imp',
      'displayname': 'Inventory Location (CBSA) Target In-Market Impressions',
      'value': 'cbsa_imp_target_inmkt',
      'type': 'ABBREVIATE'
    },
    {
      'name': 'Inventory Location (County) In-Mkt Target Imp',
      'displayname': 'Inventory Location (County) Target In-Market Impressions',
      'value': 'county_imp_target_inmkt',
      'type': 'ABBREVIATE'
    },
    {
      'name': 'Scheduled # of Weeks',
      'displayname': 'Scheduled # of Weeks',
      'value': 'period_days'
    },
    /* {
      'name': 'Inventory Location (DMA) Scheduled # of Weeks',
      'displayname': 'Inventory Location (DMA) Scheduled # of Weeks',
      'value': 'dma_period_days'
    },
    {
      'name': 'Inventory Location (CBSA) Scheduled # of Weeks',
      'displayname': 'Inventory Location (CBSA) Scheduled # of Weeks',
      'value': 'cbsa_period_days'
    },
    {
      'name': 'Inventory Location (County) Scheduled # of Weeks',
      'displayname': 'Inventory Location (County) Scheduled # of Weeks',
      'value': 'county_period_days'
    }, */
    {
      'name': 'Frequency',
      'displayname': 'Target In-Market Frequency',
      'value': 'freq_avg'
    },
    {
      'name': 'Inventory Location (DMA) Frequency',
      'displayname': 'Inventory Location (DMA) Target In-Market Frequency',
      'value': 'dma_freq_avg'
    },
    {
      'name': 'Inventory Location (CBSA) Frequency',
      'displayname': 'Inventory Location (CBSA) Target In-Market Frequency',
      'value': 'cbsa_freq_avg'
    },
    {
      'name': 'Inventory Location (County) Frequency',
      'displayname': 'Inventory Location (County) Target In-Market Frequency',
      'value': 'county_freq_avg'
    },
    {
      'name': 'Tot In-Market Imp',
      'displayname': 'Total In-Market Impressions',
      'value': 'imp_inmkt',
      'type' : 'ABBREVIATE'
    },
    {
      'name': 'Inventory Location (DMA) Tot In-Market Imp',
      'displayname': 'Inventory Location (DMA) Total In-Market Impressions',
      'value': 'dma_imp_inmkt',
      'type' : 'ABBREVIATE'
    },
    {
      'name': 'Inventory Location (CBSA) Tot In-Market Imp',
      'displayname': 'Inventory Location (CBSA) Total In-Market Impressions',
      'value': 'cbsa_imp_inmkt',
      'type' : 'ABBREVIATE'
    },
    {
      'name': 'Inventory Location (County) Tot In-Market Imp',
      'displayname': 'Inventory Location (County) Total In-Market Impressions',
      'value': 'county_imp_inmkt',
      'type' : 'ABBREVIATE'
    },
    {
      'name': 'Target Imp Comp Percentage',
      'displayname': 'Target % Impression Comp',
      'value': 'pct_comp_imp_target',
      'type' : 'PERCENT'
    },
    /* {
      'name': 'Inventory Location (DMA) Target Imp Comp Percentage',
      'displayname': 'Inventory Location (DMA) Target % Impression Comp',
      'value': 'dma_pct_comp_imp_target',
      'type' : 'PERCENT'
    },
    {
      'name': 'Inventory Location (CBSA) Target Imp Comp Percentage',
      'displayname': 'Inventory Location (CBSA) Target % Impression Comp',
      'value': 'cbsa_pct_comp_imp_target',
      'type' : 'PERCENT'
    },
    {
      'name': 'Inventory Location (County) Target Imp Comp Percentage',
      'displayname': 'Inventory Location (County) Target % Impression Comp',
      'value': 'county_pct_comp_imp_target',
      'type' : 'PERCENT'
    }, */
    {
      'name': 'Target % In-Market Imp',
      'displayname': 'Target % In-Market Impressions',
      'value': 'pct_imp_target_inmkt'
    },
    {
      'name': 'Inventory Location (DMA) Target % In-Market Imp',
      'displayname': 'Inventory Location (DMA) Target % In-Market Impressions',
      'value': 'dma_pct_imp_target_inmkt'
    },
    {
      'name': 'Inventory Location (CBSA) Target % In-Market Imp',
      'displayname': 'Inventory Location (CBSA) Target % In-Market Impressions',
      'value': 'cbsa_pct_imp_target_inmkt'
    },
    {
      'name': 'Inventory Location (County) Target % In-Market Imp',
      'displayname': 'Inventory Location (County) Target % In-Market Impressions',
      'value': 'county_pct_imp_target_inmkt'
    },
    {
      'name': 'Target % In-Market Impr.. Comp.',
      'displayname': 'Target % In-Market Impr. Comp.',
      'value': 'pct_comp_imp_target_inmkt'
    },
    {
      'name': 'Inventory Location (DMA) Target % In-Market Impr.. Comp.',
      'displayname': 'Inventory Location (DMA) Target % In-Market Impr. Comp.',
      'value': 'dma_pct_comp_imp_target_inmkt'
    },
    {
      'name': 'Inventory Location (CBSA) Target % In-Market Impr.. Comp.',
      'displayname': 'Inventory Location (CBSA) Target % In-Market Impr. Comp.',
      'value': 'cbsa_pct_comp_imp_target_inmkt'
    },
    {
      'name': 'Inventory Location (County) Target % In-Market Impr.. Comp.',
      'displayname': 'Inventory Location (County) Target % In-Market Impr. Comp.',
      'value': 'county_pct_comp_imp_target_inmkt'
    },
    {
      'name': 'Target In-Market Rating Points',
      'displayname': 'Target In-Market Rating Points',
      'value': 'trp'
    },
    {
      'name': 'Inventory Location (DMA) Target In-Market Rating Points',
      'displayname': 'Inventory Location (DMA) Target In-Market Rating Points',
      'value': 'dma_trp'
    },
    {
      'name': 'Inventory Location (CBSA) Target In-Market Rating Points',
      'displayname': 'Inventory Location (CBSA) Target In-Market Rating Points',
      'value': 'cbsa_trp'
    },
    {
      'name': 'Inventory Location (County) Target In-Market Rating Points',
      'displayname': 'Inventory Location (County) Target In-Market Rating Points',
      'value': 'county_trp'
    },
    {
      'name': 'Total % In-Mkt Impr.',
      'displayname': 'Total % In-Mkt Impr.',
      'value': 'pct_imp_inmkt'
    },
    {
      'name': 'Inventory Location (DMA) Total % In-Mkt Impr.',
      'displayname': 'Inventory Location (DMA) Total % In-Mkt Impr.',
      'value': 'dma_pct_imp_inmkt'
    },
    {
      'name': 'Inventory Location (CBSA) Total % In-Mkt Impr.',
      'displayname': 'Inventory Location (CBSA) Total % In-Mkt Impr.',
      'value': 'cbsa_pct_imp_inmkt'
    },
    {
      'name': 'Inventory Location (County) Total % In-Mkt Impr.',
      'displayname': 'Inventory Location (County) Total % In-Mkt Impr.',
      'value': 'county_pct_imp_inmkt'
    },
    {
      'name': 'Total Market Population',
      'displayname': 'Total Market Population',
      'value': 'pop_inmkt'
    },
    /* {
      'name': 'Inventory Location (DMA) Total Market Population',
      'displayname': 'Inventory Location (DMA) Total Market Population',
      'value': 'dma_pop_inmkt'
    },
    {
      'name': 'Inventory Location (CBSA) Total Market Population',
      'displayname': 'Inventory Location (CBSA) Total Market Population',
      'value': 'cbsa_pop_inmkt'
    },
    {
      'name': 'Inventory Location (County) pop_inmkt',
      'displayname': 'Inventory Location (County) Total Market Population',
      'value': 'county_pop_inmkt'
    }, */
    // {
    //   'name': 'Total Market Population',
    //   'displayname': 'Total Market Population',
    //   'value': 'pop_inmkt'
    // },
    /* {
      'name': 'Inventory Location (DMA) Total Market Population',
      'displayname': 'Inventory Location (DMA) Total Market Population',
      'value': 'dma_pop_inmkt'
    },
    {
      'name': 'Inventory Location (CBSA) Total Market Population',
      'displayname': 'Inventory Location (CBSA) Total Market Population',
      'value': 'cbsa_pop_inmkt'
    },
    {
      'name': 'Inventory Location (County) Total Market Population',
      'displayname': 'Inventory Location (County) Total Market Population',
      'value': 'county_pop_inmkt'
    }, */
    {
      'name': 'Target Audience Market Population',
      'displayname': 'Target Audience Market Population',
      'value': 'pop_target_inmkt'
    },
    /* {
      'name': 'Inventory Location (DMA) Target Audience Market Population',
      'displayname': 'Inventory Location (DMA) Target Audience Market Population',
      'value': 'dma_pop_target_inmkt'
    },
    {
      'name': 'Inventory Location (CBSA) Target Audience Market Population',
      'displayname': 'Inventory Location (CBSA) Target Audience Market Population',
      'value': 'cbsa_pop_target_inmkt'
    },
    {
      'name': 'Inventory Location (County) Target Audience Market Population',
      'displayname': 'Inventory Location (County) Target Audience Market Population',
      'value': 'county_pop_target_inmkt'
    }, */
    {
      'name': 'Total Out of Market Impressions',
      'displayname': 'Total Out of Market Impressions',
      'value': 'out_market_imp'
    },
    /* {
      'name': 'Inventory Location (DMA) Total Out of Market Impressions',
      'displayname': 'Inventory Location (DMA) Total Out of Market Impressions',
      'value': 'dma_out_market_imp'
    },
    {
      'name': 'Inventory Location (CBSA) Total Out of Market Impressions',
      'displayname': 'Inventory Location (CBSA) Total Out of Market Impressions',
      'value': 'cbsa_out_market_imp'
    },
    {
      'name': 'Inventory Location (County) Total Out of Market Impressions',
      'displayname': 'Inventory Location (County) Total Out of Market Impressions',
      'value': 'county_out_market_imp'
    }, */
    {
      'name': 'Total Out of Market Impressions',
      'displayname': 'Total % Out of Market Impressions',
      'value': 'per_out_market_imp'
    },
    /* {
      'name': 'Inventory Location (DMA) Total Out of Market Impressions',
      'displayname': 'Inventory Location (DMA) Total % Out of Market Impressions',
      'value': 'dma_per_out_market_imp'
    },
    {
      'name': 'Inventory Location (CBSA) Total Out of Market Impressions',
      'displayname': 'Inventory Location (CBSA) Total % Out of Market Impressions',
      'value': 'cbsa_per_out_market_imp'
    },
    {
      'name': 'Inventory Location (County) Total Out of Market Impressions',
      'displayname': 'Inventory Location (County) Total % Out of Market Impressions',
      'value': 'county_per_out_market_imp'
    }, */
    {
      'name': 'Reach Net',
      'displayname': 'Reach Net',
      'value': 'reach_net'
    },
    /* {
      'name': 'Inventory Location (DMA) Reach Net',
      'displayname': 'Inventory Location (DMA) Reach Net',
      'value': 'dma_reach_net'
    },
    {
      'name': 'Inventory Location (CBSA) Reach Net',
      'displayname': 'Inventory Location (CBSA) Reach Net',
      'value': 'cbsa_reach_net'
    },
    {
      'name': 'Inventory Location (County) Reach Net',
      'displayname': 'Inventory Location (County) Reach Net',
      'value': 'county_reach_net'
    }, */
    {
      'name': 'Reach',
      'displayname': 'Target In-Market Reach',
      'value': 'reach_pct'
    },
    /* {
      'name': 'Reach',
      'displayname': 'Inventory Location (DMA) Target In-Market Reach',
      'value': 'dma_reach_pct'
    },
    {
      'name': 'Reach',
      'displayname': 'Inventory Location (CBSA) Target In-Market Reach',
      'value': 'cbsa_reach_pct'
    },
    {
      'name': 'Reach',
      'displayname': 'Inventory Location (County) Target In-Market Reach',
      'value': 'county_reach_pct'
    }, */
    {
      'name': 'period_date',
      'displayname': 'Period Dates',
      'value': 'period_date'
    },
    {
      'name': 'period_total',
      'displayname': 'Total Days',
      'value': 'period_total'
    },
    {
      'name': 'place_type',
      'displayname': 'Place Type',
      'value': 'place_type'
    },
    {
      'name': 'place_name',
      'displayname': 'Place Name',
      'value': 'place_name'
    },
    {
      'name': 'placement_type',
      'displayname': 'Placement Type',
      'value': 'placement_type'
    },
      ];
  public getCustomizedColumnEmitter(): Observable<any> {
    return this.customizedColumnEmitter.asObservable();
  }
  public setCustomizedColumnEmitter(emitterAction) {
    this.customizedColumnEmitter.next(emitterAction);
  }
  public getPackages(): Observable<any> {
    return this.packages.asObservable();
  }
  public setPackages(packages) {
    this.packages.next(packages);
  }
  public getSelectedPackage(): Observable<any> {
    return this.selectedPackage.asObservable();
  }
  public setSelectedPackage(selectedPackage) {
    this.selectedPackage.next(selectedPackage);
  }

  public getScenarios(): Observable<any> {
    return this.scenarios.asObservable();
  }
  public setScenarios(scenarios) {
    this.scenarios.next(scenarios);
  }
  public getDayparts() {
    return this.dayparts;
  }
  public getNewScenario(): Observable<any> {
    return this.newScenario.asObservable();
  }
  public pushNewScenario(scenarios) {
    this.newScenario.next(scenarios);
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
      dma_imp_target_inmkt: 'Inventory Location (DMA) Target In-Market Impressions',
      dma_pct_comp_imp_target: 'Inventory Location (DMA) Target % Impression Comp',
      dma_pct_comp_imp_target_inmkt: 'Inventory Location (DMA) Target % In-Market Impr. Comp.',
      dma_pct_imp_inmkt: 'Inventory Location (DMA) Total % In-Mkt Impr.',
      dma_pct_imp_target_inmkt: 'Inventory Location (DMA) Target % In-Market Impressions',
      dma_reach_pct: 'Inventory Location (DMA) Target In-Market Reach',
      dma_trp: 'Inventory Location (DMA) Target In-Market Rating Points',
      dma_pop_inmkt: 'Inventory Location (DMA) Total Market Population',
      dma_scheduled_weeks: 'Inventory Location (DMA) Scheduled # of Weeks',
      dma_target_aud: 'Inventory Location (DMA) Target Audience',
      dma_per_out_market_imp: 'Inventory Location (DMA) Total % Out of Market Impressions',
      dma_out_market_imp: 'Inventory Location (DMA) Total Out of Market Impressions',
      dma_pop_target_inmkt: 'Inventory Location (DMA) Target Audience Market Population',
      dma_reach_net: 'Inventory Location (DMA) Reach Net',
      cbsa_freq_avg: 'Inventory Location (CBSA) Target In-Market Frequency',
      cbsa_imp: 'Inventory Location (CBSA) Total Impressions',
      cbsa_imp_inmkt: 'Inventory Location (CBSA) Total In-Market Impressions',
      cbsa_imp_target: 'Inventory Location (CBSA) Target Impressions',
      cbsa_index_comp_target: 'Inventory Location (CBSA) Target Audience Index',
      cbsa_imp_target_inmkt: 'Inventory Location (CBSA) Target In-Market Impressions',
      cbsa_pct_comp_imp_target: 'Inventory Location (CBSA) Target % Impression Comp',
      cbsa_pct_comp_imp_target_inmkt: 'Inventory Location (CBSA) Target % In-Market Impr. Comp.',
      cbsa_pct_imp_inmkt: 'Inventory Location (CBSA) Total % In-Mkt Impr.',
      cbsa_pct_imp_target_inmkt: 'Inventory Location (CBSA) Target % In-Market Impressions',
      cbsa_reach_pct: 'Inventory Location (CBSA) Target In-Market Reach',
      cbsa_trp: 'Inventory Location (CBSA) Target In-Market Rating Points',
      cbsa_pop_inmkt: 'Inventory Location (CBSA) Total Market Population',
      cbsa_scheduled_weeks: 'Inventory Location (CBSA) Scheduled # of Weeks',
      cbsa_target_aud: 'Inventory Location (CBSA) Target Audience',
      cbsa_per_out_market_imp: 'Inventory Location (CBSA) Total % Out of Market Impressions',
      cbsa_out_market_imp: 'Inventory Location (CBSA) Total Out of Market Impressions',
      cbsa_pop_target_inmkt: 'Inventory Location (CBSA) Target Audience Market Population',
      cbsa_reach_net: 'Inventory Location (CBSA) Reach Net',
      county_freq_avg: 'Inventory Location (County) Target In-Market Frequency',
      county_imp: 'Inventory Location (County) Total Impressions',
      county_imp_inmkt: 'Inventory Location (County) Total In-Market Impressions',
      county_imp_target: 'Inventory Location (County) Target Impressions',
      county_index_comp_target: 'Inventory Location (County) Target Audience Index',
      county_imp_target_inmkt: 'Inventory Location (County) Target In-Market Impressions',
      county_pct_comp_imp_target: 'Inventory Location (County) Target % Impression Comp',
      county_pct_comp_imp_target_inmkt: 'Inventory Location (County) Target % In-Market Impr. Comp.',
      county_pct_imp_inmkt: 'Inventory Location (County) Total % In-Mkt Impr.',
      county_pct_imp_target_inmkt: 'Inventory Location (County) Target % In-Market Impressions',
      county_reach_pct: 'Inventory Location (County) Target In-Market Reach',
      county_trp: 'Inventory Location (County) Target In-Market Rating Points',
      county_pop_inmkt: 'Inventory Location (County) Total Market Population',
      county_scheduled_weeks: 'Inventory Location (County) Scheduled # of Weeks',
      county_target_aud: 'Inventory Location (County) Target Audience',
      county_per_out_market_imp: 'Inventory Location (County) Total % Out of Market Impressions',
      county_out_market_imp: 'Inventory Location (County) Total Out of Market Impressions',
      county_pop_target_inmkt: 'Inventory Location (County) Target Audience Market Population',
      county_reach_net: 'Inventory Location (County) Reach Net',
      place_name: 'Place Name',
      placement_type : 'Placement Type',
      place_type: 'Place Type',
    };
    if (customizedColumns && customizedColumns.length > 0) {
      const customColumns = {};
      customizedColumns.forEach(column => {
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
              customColumns['operator_spot_id'] = CSVHeaders['operator_spot_id'];
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
  // To detect change in custom columns based on plan
  public setCustomColumnChanged(columns) {
    this.customColumnChanged.next(columns);
  }
  public getCustomColumnChanged(): Observable<any> {
    return this.customColumnChanged.asObservable();
  }
}
