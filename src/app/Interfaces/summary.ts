export interface Summary {
  measures_type: string;
  period_days: number;
  target_segment: string;
  target_geo: string;
  market: string;
  index_comp_target: number;
  pct_comp_pop_target_inmkt: number;
  pct_comp_imp_target: number;
  pct_comp_imp_target_inmkt: number;
  freq_avg: number;
  imp_target_inmkt: number;
  imp_target: number;
  imp_inmkt: number;
  imp: number;
  pct_imp_inmkt: number;
  pct_imp_target_inmkt: number;
  pop_inmkt: number;
  pop_target_inmkt: number;
  reach_pct: number;
  reach_net: number;
  trp: number;
  eff_freq_min: number;
  eff_freq_avg: number;
  eff_reach_net: number;
  eff_reach_pct: number;
  frames?: number;
  summarizes: {
    type: string;
    id: null | string;
    name: null | string;
  };
  spots: number;
}
export interface SummaryResponse {
  summaries: Summary[];
}

export interface NumericRange {
  min: number;
  max: number;
}
// Request interfaces
export interface SummaryRequest {
  target_segment: string;
  target_geography: string;
  target_geography_list: any;
  operator_name_list: string[];
  plant_name_list: string;
  media_type_list: string[];
  construction_type_list: string[];
  id_type: string ;//'frame_id' | 'spot_id' | 'plant_frame_id';
  id_list: string[];
  measures_range_list: SummaryMeasures[];
  orientation: NumericRange;
  digital: boolean;
  frame_height: NumericRange;
  frame_width: NumericRange;
  sort: SortParams;
  page: number;
  page_size: number;
  cid_list?: string[];
  summary_level: 'DMA' | 'state' | 'Plant' | 'Universe' | 'Classification Type'| 'Construction Type' | 'Media Type';
  gp_ids ?: string[];
  custom_ids ?: string[];
  summary_level_list?: string[];
  frame_media_name_list?: string[];
  status_type_name_list?: string[];
  measures_required?: boolean;
}
interface SummaryMeasures {
  type: string;
  min: number;
  max?: number;
}
interface SortParams {
  measure: string;
  type: string;
}
