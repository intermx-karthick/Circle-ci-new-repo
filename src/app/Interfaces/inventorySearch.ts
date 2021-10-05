export interface InventroySearch {
  frame_id: number; // frame id / inventory id
  plant_frame_id: string;
  uri: string;
  representations: Representation [];
  media_type: MediaType;
  media_status: MediaStatus;
  location: Location;
  spot_references: SpotReference[];
  selected?: boolean;
}
export interface Representation {
  representation_type: RepresentationType[];
  division: Division[];
}
export interface RepresentationType {
  id: number;
  name: string;
  description: string;
}
export interface Division {
  id: number;
  name: string;
  plant: Plant;
}
export interface Plant {
  id: number;
  name: string;
}
export interface MediaType {
  id: number;
  name: string;
  description: string;
}
export interface MediaStatus {
  id: number;
  name: string;
  description: string;
}
export interface Location {
  id: number;
  geometry: Geometry;
}
export interface SpotReference {
  spot_id: number;
  uri: string;
  measures: Measure;
}
export interface Measure {
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
  out_market_imp?: number;
  per_out_market_imp?: number;
}

export interface Geometry {
  type: string;
  coordinates: any;
}
export interface InventroySearchResponse {
  summarise: InventroySearch[];
}
