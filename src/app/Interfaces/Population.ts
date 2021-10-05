import {PopulationService} from '../population/population.service';
import {MarketSelectionState} from '@interTypes/marketType';

export interface PopulationSummary {
  populationPercentage: string;
  totalGeographies: number;
  baseAudiencePopulation: string;
  targetAudiencePopulation: string;
}
export interface Pagination {
  total: number;
  page: number;
  perPage: number;
}

export interface PopulationResultItem  {
  geoId: string;
  geoName: string;
  comp: number;
  index: number;
  formattedIndex: string;
  value: number;
  selected?: boolean;
  state?: string;
}

export interface PopulationDetailsResponse {
  baseAudienceId: string;
  baseAudienceDescription: string;
  baseAudiencePopulation: string;
  targetAudienceId: string;
  targetAudienceDescription: string;
  targetAudiencePopulation: string;
  geoType: keyof GeographyType;
  pagination: Pagination;
  results: PopulationResultItem[];
  ids?: GeoIdObject[];
}
export interface AudienceFilterState {
  audience: number;
  name: string;
}
export interface GeographyType {
  'dma';
  'cbsa';
  'county';
  'state';
  'zipcode';
}
 interface PopulationSortableKeys {
  'comp';
  'index';
}
export interface PopulationSortable {
  order: 'asc' | 'desc';
  displayName: string;
  sortKey: keyof PopulationSortableKeys;
}
export interface PopulationSelectableValues {
  'all';
  'top100';
  'top50';
  'top25';
  'custom';
  'none';
}
export
interface PopulationSortableDisplayKeys {
  'All';
  'Top 100';
  'Top 50';
  'Top 25';
  'Custom';
  'None';
}
export interface PopulationSelectable {
  display: keyof PopulationSortableDisplayKeys;
  key: keyof PopulationSelectableValues;
}
export interface PopulationFilterState {
  audience: AudienceFilterState;
  market: MarketSelectionState;
  geographyType: keyof GeographyType;
  geographySet?: GeographySet;
  specificGeography?: SpecificGeography [];
  location?: {region: { 'type': 'MultiPolygon', 'coordinates': [] }};
}

export interface SpecificGeography {
  label: string;
  data: string[]
}
export interface MapLayerDetails {
  minzoom: number;
  maxzoom: number;
  url: string;
  'source-layer': string;
}
export interface MapLayers {
  dma: MapLayerDetails;
  cbsa: MapLayerDetails;
  counties: MapLayerDetails;
  states: MapLayerDetails;
}
export interface GeoSetCreateRequest {
  name: string;
  description: string;
  market_type: string;
  markets: string[];
}

interface Region {
  coordinates: number[][][];
  type: string;
}

export interface PopulationFilters {
  ids?: string[];
  region?: Region;
}

export interface PopulationDetailsRequest {
  baseAudience: string;
  responseGeo: keyof GeographyType;
  targetAudience: string;
  market?: PopulationFilters;
}

export interface GeographySet {
  clientId: number;
  createdAt: string;
  market_type: string;
  markets: GeoSetMarket[];
  name: string;
  owner: string;
  updatedAt: string;
  _id: string;
}
export interface GeoCollectionResponse {
  pagination: Pagination;
  results: GeographySet[];
}
export interface GeoSetMarket {
  geo_id: string;
  geo_name: string;
}

export interface GeoIdObject {
  geoId: string;
  comp: number;
}