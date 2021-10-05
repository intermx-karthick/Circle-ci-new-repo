import { ProjectPagination } from "./pagination";

export interface InventoryPlanResponse {
  scenarioId: string;
  version: string;
  __v: number;
  _id: string;
  plans: Plan[];
  offlineStatus?: OfflineStatus;
}

export interface Plan {
  _id: string;
  plan_name: string;
  spots: Spot[];
  summary: Summary;
  planned: PlannedGoal;
}

export interface InventoryPlanSpotsResponse {
  results: Spot[];
  pagination: ProjectPagination;
}

export interface Spot {
  _id?: string;
  spot_id?: string;
  frame_id?: string;
  operator_spot_id?: string;
  media_status_name?: string;
  media_status_description?: string;
  plant_operator?: string;
  classification?: string;
  construction?: string;
  orientation?: string;
  illumination_type?: string;
  digital?: string;
  media_type?: string;
  media_name?: string;
  dma_name?: string;
  county_name?: string;
  cbsa_name?: string;
  height?: string;
  width?: string;
  zip_code?: string;
  place_name?: string;
  place_type?: string;
  placement_type?: string;
  market_name?: string;
  market_type?: string;
  market_pop?: string;
  scheduled_weeks?: string;
  target_aud_pop?: string;
  primary_artery?: string;
  latitude?: string;
  longitude?: string;
  imp?: string;
  imp_target?: string;
  pct_comp_imp_target?: string;
  imp_inmkt?: string;
  pct_imp_inmkt?: string;
  imp_target_inmkt?: string;
  pct_imp_target_inmkt?: string;
  pct_comp_imp_target_inmkt?: string;
  index_comp_target?: string;
  trp?: string;
  reach_pct?: string;
  reach_net?: string;
  freq_avg?: string;
  out_market_imp?: string;
  per_out_market_imp?: string;
  dma_freq_avg?: string;
  dma_imp?: string;
  dma_imp_inmkt?: string;
  dma_imp_target?: string;
  dma_index_comp_target?: string;
  dma_imp_target_inmkt?: string;
  dma_pct_comp_imp_target?: string;
  dma_pct_comp_imp_target_inmkt?: string;
  dma_pct_imp_inmkt?: string;
  dma_pct_imp_target_inmkt?: string;
  dma_reach_pct?: string;
  dma_trp?: string;
  dma_pop_inmkt?: string;
  dma_scheduled_weeks?: string;
  dma_per_out_market_imp?: string;
  dma_out_market_imp?: string;
  dma_pop_target_inmkt?: string;
  dma_reach_net?: string;
  cbsa_freq_avg?: string;
  cbsa_imp?: string;
  cbsa_imp_inmkt?: string;
  cbsa_imp_target?: string;
  cbsa_index_comp_target?: string;
  cbsa_imp_target_inmkt?: string;
  cbsa_pct_comp_imp_target?: string;
  cbsa_pct_comp_imp_target_inmkt?: string;
  cbsa_pct_imp_inmkt?: string;
  cbsa_pct_imp_target_inmkt?: string;
  cbsa_reach_pct?: string;
  cbsa_trp?: string;
  cbsa_pop_inmkt?: string;
  cbsa_scheduled_weeks?: string;
  cbsa_per_out_market_imp?: string;
  cbsa_out_market_imp?: string;
  cbsa_pop_target_inmkt?: string;
  cbsa_reach_net?: string;
  county_freq_avg?: string;
  county_imp?: string;
  county_imp_inmkt?: string;
  county_imp_target?: string;
  county_index_comp_target?: string;
  county_imp_target_inmkt?: string;
  county_pct_comp_imp_target?: string;
  county_pct_comp_imp_target_inmkt?: string;
  county_pct_imp_inmkt?: string;
  county_pct_imp_target_inmkt?: string;
  county_reach_pct?: string;
  county_trp?: string;
  county_pop_inmkt?: string;
  county_scheduled_weeks?: string;
  county_per_out_market_imp?: string;
  county_out_market_imp?: string;
  county_pop_target_inmkt?: string;
  county_reach_net?: string;
  __v?: 0;
  target_segment? : string;
  selected?:boolean;

}


export interface PlannedGoal {
  imp: string;
  trp: string;
  reach: string;
  frequency: number;
}

export interface Summary {
  aud_name: string;
  target_audience_population: string;
  market_population: string;
  reporting_level: string;
  total_frames_in_selection: number;
  target_imp: string;
  total_imp: string;
  target_comp: string;
}

  export interface Summarizes {
        type: string;
        summarizes_id_list?: any;
        id?: any;
        name?: any;
        geometry?: any;
    }

export interface PlanSummary {
    planId?: string;
    measures_type?: string;
    period_days?: number
    base_segment?: string;
    target_segment?: string;
    target_geo?: string;
    market?: string;
    index_comp_target?: number;
    pct_comp_pop_target_inmkt?: number;
    pct_comp_imp_target?: number;
    pct_comp_imp_target_inmkt?: number;
    freq_avg?: number;
    imp_target_inmkt?: number;
    imp_target?: number;
    imp_inmkt?: number;
    imp?: number;
    pct_imp_inmkt?: number;
    pct_imp_target_inmkt?: number;
    pop_inmkt?: number;
    pop_target_inmkt?: number;
    reach_pct?: number;
    reach_net?: number;
    trp?: number;
    eff_freq_min?: number;
    eff_freq_avg?: number;
    eff_reach_net?: number;
    eff_reach_pct?: number;
    summarizes?: Summarizes;
    frames?: number;
    spots?: number;
    aud_name?: string;
    market_name?: string;
    total_frames_in_selection?: number;
    target_imp?: number;
    total_imp?: number;
    target_comp?: number;
    plan_name?: string;
    audience_name?: string;
    spotsData?: Spot[];
    _id?: string;
    measures_release?: any;
}

export interface OfflineStatus {
  _id: string;
  topic: string;
  entityId: string;
  entityType: string;
  message: string;
  siteId: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryPlanQueryParams {
  page?: number;
  perPage?: number;
}
