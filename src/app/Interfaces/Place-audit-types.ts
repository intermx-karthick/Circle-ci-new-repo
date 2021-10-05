import {ActionType, PeriodType} from '@interTypes/timepicker';

export interface Geometry<T = number[]> {
  type: string;
  coordinates: T;
}

export interface Place {
  id: number;
  place_id?: any;
  client_id: number;
  location_id: string;
  location_name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  lat: string;
  lng: string;
  dma_market: string;
  dma_rank: number;
  heregeodisplat: string;
  heregeodisplon: string;
  heregeonavlat: string;
  heregeonavlon: string;
  heregeoaddress: string;
  heregeocity: string;
  heregeostate: string;
  heregeozipcode: number;
  heregeomatch: string;
  heregeomatchtype: string;
  heregeomatchrelevance: number;
  heregeomatchquality: number;
  display_geometry: Geometry;
  nav_geometry: Geometry;
  udp_places?: any[];
}

export interface PlaceDetails {
  place: Place | AuditedPlace;
}
export interface PlaceAuditState {
  currentPlace: Place | AuditedPlace;
  nextPlaceId?: number | string;
  clientId: number | string;
}

export interface Status {
  audit_status_cd: number;
  status: string;
}

export interface OutCome {
  audit_outcome_id: number;
  outcome: string;
}

export interface PlaceType {
  place_type_id: number;
  name: string;
}
/** Flat node with expandable and level information */
export class AuditPlaceNode {
  constructor(
    public name: string,
    public count: number,
    public level = 1,
    public placeId: any,
    public id = '',
    public expandable = false,
    public isLoading = false,
    public parent = '',
    public superParent = '',
    public isExpand = false,
    public children = []
  ) {}
}
export interface Polygon {
  type?: string;
  coordinates?: any;
}

export interface BuildingArea {
  building_area_id?: string;
  no_floors?: number;
  no_entrances?: number;
  no_concourses?: number;
  no_platforms?: number;
  no_gates?: number;
  geometry?: Polygon;
  is_focused?: any;
  is_data_collection_area?: any;
  is_active?: any;
}


export interface PropertyArea {
  property_area_id?: string;
  geometry?: Polygon;
  is_focused?: any;
  is_data_collection_area?: any;
  is_active?: any;
}

export interface OpenHours<T = string> {
  su?: T;
  mo?: T;
  tu?: T;
  we?: T;
  th?: T;
  fr?: T;
  sa?: T;
}
export interface Hours {
  from: string;
  to: string;
  next: string;
}


export interface AuditedPlace {
  open_hours: OpenHours<string>;
  building_area: BuildingArea;
  property_area: PropertyArea;
  place_id: string;
  parent_place_id?: any;
  location_name: string;
  short_name?: any;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  iso_country_code: string;
  display_geometry: Geometry;
  nav_geometry: Geometry;
  place_type_id?: number;
  audit_status_cd: number;
  cleansed_address_id: string;
  audit_outcome_id?: any;
  safegraph_id?: any;
  here_id?: any;
  census_id?: any;
  create_user: string;
  update_user: string;
  create_ts: Date;
  update_ts: Date;
  udp_places?: any[];
}
export interface CreatePlaceReq {
  client_id: number | string;
  building_area: BuildingArea;
  property_area: PropertyArea;
  audit_outcome_id: number;
  location_name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  iso_country_code: string;
  here_id?: string;
  safegraph_id: string;
  census_id?: string;
  open_hours: OpenHours<string>;
  is_focused: boolean;
  is_active: boolean;
  is_data_collection_area: boolean;
  display_geometry: Geometry;
  nav_geometry: Geometry;
  audit_status_cd?: number;
  place_type_id: number;
  parent_place_id?: string;
}

export interface CreateNewPlace {
  building_area?: BuildingArea;
  property_area?: PropertyArea;
  location_name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  iso_country_code?: string;
  here_id?: string;
  safegraph_id?: string;
  open_hours?: OpenHours<string>;
  is_active?: boolean;
  display_geometry?: Geometry;
  nav_geometry?: Geometry;
  location_id?: string;
  place_id?: string;
  parent_place_id?: string;
  phone_number?: string;
  short_name?: string;
  transit_system?: Transit;
  transit_line?: Transit;
  DMA_id?: string;
  DMA_name?: string;
  county_id?: string;
  county_name?: string;
  lat?: string | number;
  lng?: string | number;
}
export interface Transit {
  name?: string;
  description?: string;
}
export interface PlaceCreateResponse {
  place_id: string;
}
export interface OpenHoursDataItem {
  value: string;
  label: string;
}


export type  AreaType = 'building' | 'property';

export type ElasticSearchType = 'safegraphId' | 'hereID' | 'placeName';

export interface SearchPlaceRequest {
  fieldset: Array<string>;
  top_right_point: Geometry;
  bottom_left_point: Geometry;
  search?: string;
  page_size?: number;
  page?: number;
}

export interface PlaceArea {
  place_id: string;
  fieldset: string;
  name: string;
  geometry: Geometry;
}

export interface PlacesAreaGroup {
  [key: string]: PlaceArea[];
}
export type HourType = 'from' | 'to' | 'next';

export interface TimePickerOpenEvent {
  formGroup: string;
  field: HourType;
}
export interface TimePickerResponse {
  period: PeriodType;
  hour: number;
  minute: number;
  belongsTo: TimePickerOpenEvent;
  // need to enable once we upgraded to Angular 9/ts 3.7 to use Omit, right now not available
  // batchApply?: Omit<ActionType, 'close' | 'apply'>;
  batchApply?: ActionType;
}

export interface DeleteUdpPlace {
  udp_place_id: number;
  client_id: number;
  place_id:number
}
export interface PlaceUploadMapping {
  source_key: string;
  dest_key: string;
}

export interface PlaceUploadRequest {
  mappings: PlaceUploadMapping[];
  place_set_name?: string;
  place_set_id?: string;
  type?: string;
  audit_status?: string;
}
