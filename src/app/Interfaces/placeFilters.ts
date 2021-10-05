export interface PlacesSummary {
  avg_weekly_traffic: number;
  avg_weekly_unique_visits: number;
  number_of_places: number;
}
export interface PlacesSortables {
  field_name: string;
  key: string;
}
export interface Place {
  selected?: boolean;
  count: number;
  industry: string;
  place_type: string;
  place_name: string;
}
export interface PlaceFilterParams {
  place: string;
  key: string;
  page: number;
  size: number;
  sort_by: string;
  order_by: number;
  placeNameList: string[];
  placeTypeList: string[];
}
export interface GeoPolygon {
  coordinates: number[];
  type: string;
}
export interface PlaceProperties {
  safegraph_place_id: string;
  parent_safegraph_place_id: string;
  safegraph_brand_ids: string;
  location_name: string;
  brands: string;
  top_category: string;
  sub_category: string;
  naics_code: string;
  latitude: string;
  longitude: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  open_hours: string;
  phone_number: string;
  begin_time: string;
  selected?: boolean;
}
export interface PlaceDetails {
  geometry: GeoPolygon;
  properties: PlaceProperties;
  _id: string;
  type: string;
}
export interface PlaceOrderBy {
  key: string;
  value: number;
}
export interface PlaceDetailsModel {
  sortKey: PlacesSortables[];
  orderBy: PlaceOrderBy[];
  places: PlaceDetails[];
  summary: PlacesSummary;
  ids: any;
}
export interface PlaceDetailsRequest {
  placeNameList: string[];
  page: number;
  size?: number;
  sort_by?: string;
  order_by?: number;
  place: string;
  poiIds?: string[];
}
export interface PlaceSortParams {
  sort_by: string;
  order_by: number;
}

export interface matRangeDatepickerRangeValue<D> {
  begin: D | null;
  end: D | null;
}