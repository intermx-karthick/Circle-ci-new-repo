export interface Inventory {
  id: number;
  plant_frame_id?: number;
  layer?: any;
  illumination_start_time: string;
  illumination_end_time: string;
  max_height: number;
  max_width: number;
  max_pixel_height: number;
  max_pixel_width: number;
  construction_date: string;
  description: string;
  full_motion: any;
  partial_motion: any;
  rotating: boolean;
  interactive: any;
  audio: any;
  digital: boolean;
  media_name: string;
  created_dtm: string;
  updated_dtm: string;
  classification_type: CommonType;
  construction: Construction;
  illumination_type: any;
  location: Location;
  media_type: CommonType;
  placement_type: any;
  status_type: CommonType;
  layouts: Layout[];
  photos: [];
  representations: Representation[];
}

interface CommonType {
  id: number;
  name: string;
  description: string;
}

interface Construction {
  id: number;
  name: string;
  description: string;
  created_dtm: string;
  updated_dtm: string;
  construction_type: CommonType;
  place: any;
  operating_hours: [];
}

interface Location {
  id: number;
  orientation: number;
  primary_read: string;
  primary_artery: string;
  level: any;
  levels_visible: any;
  latitude: number;
  longitude: number;
  blockId: string;
  elevation: any;
  frame_in_location_dtm: any;
  geometry: Geometry;
  created_dtm: string;
  updated_dtm: string;
  dma_id: any;
  zip_code: any;
}
interface Geometry {
  type: string;
  coordinates: [];
}

interface Layout {
  id: number;
  uri: string;
  full_motion: any;
  partial_motion: any;
  rotating: boolean;
  interactive: any;
  audio: any;
  faces: Face[];
}

interface Face {
  id: number;
  uri: string;
  average_spot_length: any;
  publisher_unique_face_id: string;
  height: number;
  width: number;
  pixel_height: number;
  pixel_width: number;
  top_left_pixel_x: number;
  top_left_pixel_y: number;
  spots_in_rotation: any;
  spots: Spot[];
}

interface Spot {
  id: number;
  uri: string;
  publisher_unique_id: string;
  length: any;
  full_motion: any;
  partial_motion: any;
  rotating: boolean;
  interactive: any;
  audio: any;
  measures: Measure;
}

interface Measure {
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
}

export interface Representation {
  representation_type: CommonType;
  division: Division;
}

interface Division {
  id: number;
  name: string;
  plant: Plant;
}

interface Plant {
  id: number;
  name: string;
}
export interface InventoryDetailsReq {
  spotId: number;
  target_segment: string;
  target_geography?: string;
  base_segment?: number;
}
export interface CustomizedSpot {
  opp: string;
  checked: boolean;
  fid: number;
  sid: number;
  mt: string;
  pid: string;
  totwi?: any;
  tgtwi?: any;
  tgtinmi?: any;
  compi?: any;
  reach?: any;
  cwi?: any;
  tgtinmp?: any;
  compinmi?: any;
  totinmp?: any;
  freq?: any;
  trp?: any;
  totinmi?: any;
  status: string;
  tgtmp: number;
  totmp: number;
  classification_type: string;
  construction_type: string;
  digital: string;
  max_height: string;
  max_width: string;
  primary_artery: string;
  zip_code: string;
  longitude: number;
  latitude: number;
  illumination_type: string;
  orientation: number | string;
  media_name?: string;
  client_id?: number;
  media_status_name?: string;
  media_status_description?: string;
  market_name?: string;
  market_type?: string;
  market_pop?: number | string;
  scheduled_weeks?: number;
  target_aud?: string;
  target_aud_pop?: number | string;
  per_out_market_imp?: number;
  out_market_imp?: number;
  dma_name?: any;
  cbsa_name?: any;
  county_name?: string;
  reach_net?: number;
}


/** Inventory interface */

export interface ClassificationType {
  description: string;
  id: number;
  name: string;
}

export interface ConstructionType {
  description: string;
  id: number;
  name: string;
}

export interface IlluminationType {
  description: string;
  id: number;
  name: string;
}

export interface Properties {
  base_segment: string;
  eff_freq_avg: number;
  eff_freq_min: number;
  eff_reach_net: number;
  eff_reach_pct: number;
  frame_id: number;
  freq_avg: number;
  imp: number;
  imp_inmkt: number;
  imp_target: number;
  imp_target_inmkt: number;
  index_comp_target: number;
  market: string;
  measures_type: string;
  media_type: string;
  pct_comp_imp_target: number;
  pct_comp_imp_target_inmkt: number;
  pct_comp_pop_target_inmkt: number;
  pct_imp_inmkt: number;
  pct_imp_target_inmkt: number;
  period_days: number;
  plant_frame_id: string;
  plant_operator: string;
  pop_inmkt: number;
  pop_target_inmkt: number;
  reach_net: number;
  reach_pct: number;
  target_geo: string;
  target_segment: string;
  trp: number;
  dma_name?: string;
  county_name?: string;
}

export interface InventorySpot {
  classification_type: ClassificationType;
  construction_type: ConstructionType;
  digital: boolean;
  geometry: any[];
  illumination_type: IlluminationType;
  max_height: string;
  max_width: string;
  properties: Properties;
  media_status?: any;
}

export interface MediaStatus {
  id?: number;
  name: string;
  description: string;
  updated_desc?: any;
}
export interface Geography {
  id: string;
  label: string;
  type: 'Zip Codes' | 'CBSA' | 'DMA' | 'County' | 'States' | 'National' | 'GEO_SET';
}

export interface CsvMarketFormat {
  market_name?: string;
  market_type?: string;
  target_geography_list?: string[];
}

export interface AuditStatus {
  id: number;
  name: string;
  description: string;
  updated_desc: string;
}

export interface PlacementType {
  id: number;
  name: string;
  description: string;
  updated_desc?: string;
}

export interface PlacementTypeResponse {
  placement_types: PlacementType[]
}

export interface PlaceType {
  id: number;
  name: string;
  description: string;
  minimum_visual_angle?: number;
  updated_desc?: string;
}
