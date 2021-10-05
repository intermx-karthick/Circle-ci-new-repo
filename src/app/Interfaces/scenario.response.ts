export interface Area {
  height: number;
  width: number;
  background: string;
}
​
export interface Widget {
  position: number;
  height: number;
  width: number;
}
​
export interface Content {
  area: Area;
  widgets: Widget[];
}
​
export interface FilterCard {
  name: string;
  type: string;
  content: Content;
}
​
export interface SpotSchedule {
  start: string;
  end: string;
}
​
export interface Geography {
  id: string;
  type: string;
}
​
export interface When {
  start: Date;
  end: Date;
}
​
export interface Access {
  _id: string;
  scope: string;
}
​
export interface Goal {
  impressions: number;
  trp: number;
  reach: number;
  frequency: number;
  type: string;
  allocationMethod: string;
  effectiveReach: number;
}
​
export interface Audience {
  a1: string;
  a2: string;
}
​
export interface Market {
  m1: string;
  m2: string;
}
​
export interface Goals {
  trp: number;
  reach: number;
  frequency: number;
  duration: number;
  effectiveReach: number;
  allocationMethod: string;
}
​
export interface MediaTypeFilter {
  type: string;
  ref: string[];
}
​
export interface LocationFilter {
  label: string;
  type: string;
  id: string;
}
​
export interface Targets {
  audiences: Audience[];
  markets: Market[];
  operators: string[];
  goals: Goals;
  mediaTypeFilters: MediaTypeFilter[];
  locationFilters: LocationFilter[];
}
​
export interface Goals2 {
  trp: number;
  reach: number;
  frequency: number;
  duration: number;
  effectiveReach: number;
  allocationMethod: string;
}
​
export interface MediaTypeFilter2 {
  type: string;
  ref: string[];
}
​
export interface LocationFilter2 {
  label: string;
  type: string;
  id: string;
}
​
export interface Lock {
  allocationIndex: number;
  field: string;
  value: number;
  frame_media_name_list: string;
  operator_name_list: string;
}
​
export interface Query {
  audience: string;
  market: string;
  operator: string;
  goals: Goals2;
  mediaTypeFilters: MediaTypeFilter2[];
  locationFilters: LocationFilter2[];
  locks: Lock[];
}
​
export interface Measures {
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
​
export interface MediaTypeGroup {
  classification_type_list: string[];
  construction_type_list: string[];
  media_type_list: string[];
  frame_media_name_list: string[];
}
​
export interface LockedMeasure {
  measure: string;
  value: number;
}
​
export interface Allocation {
  measures_type: string;
  measures: Measures;
  media_type_group: MediaTypeGroup;
  locked_measure: LockedMeasure;
  spots: number;
}
​
export interface Plan2 {
  allocation: Allocation;
}
​
export interface Plan {
  query: Query;
  plan: Plan2;
}
​
export interface MarketPlans {
  targets: Targets;
  plans: Plan[];
}
​
export interface Attachment {
  name: string;
  url: string;
  key: string;
}
​
export interface Logo {
  url: string;
  key: string;
  name: string;
}
​
export interface Audience2 {
  id: number;
  name: string;
}
​
export interface MarketsGroup {
  id: string;
  name: string;
}
​
export interface Market2 {
  id: string;
  name: string;
  marketsGroup?: MarketsGroup[];
}
​
export interface Operators {
  enabled: boolean;
  data: string[];
}
​
export interface Ids {
  medias: string[];
  environments: any[];
  isDigital: boolean;
  isNonDigital: boolean;
}
​
export interface Datum {
  data: string;
  ids: Ids;
}
​
export interface MediaTypeFilters {
  enabled: boolean;
  data: Datum[];
}
​
export interface Datum2 {
  inMarketCompIndex: number[];
  targetImp: number[];
}
​
export interface MeasureRangeFilters {
  enabled: boolean;
  data: Datum2[];
}
​
export interface Datum3 {
  label: string;
  type: string;
  id: string;
}
​
export interface LocationFilters {
  enabled: boolean;
  data: Datum3[];
}
​
export interface MediaAttributes {
}
​
export interface Budget {
  amount: number;
  currency: string;
}
​
export interface ScenarioDetails {
  delivery_period_weeks: number;
  filterInventoryByMarket: boolean;
  addInventoryFromFilter: boolean;
  includeOutsideMarketInvs: boolean;
  filter_card: FilterCard;
  spot_schedule: SpotSchedule;
  geography: Geography[];
  when: When;
  package: string[];
  labels: string[];
  places: string[];
  _id: string;
  name: string;
  description: string;
  notes: string;
  access: Access;
  goals: Goal[];
  marketPlans: MarketPlans;
  attachments: Attachment[];
  logo: Logo;
  audiences: Audience2[];
  market: Market2[];
  operators: Operators;
  mediaTypeFilters: MediaTypeFilters;
  measureRangeFilters: MeasureRangeFilters;
  locationFilters: LocationFilters;
  mediaAttributes: any;
  budget: Budget;
}
​
export interface ScenarioResponse {
  scenario: ScenarioDetails;
}
​