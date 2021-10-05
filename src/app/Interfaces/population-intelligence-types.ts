import * as mapboxgl from "mapbox-gl";

export interface PopulationIntelProduct {
  label: string;
  value: string;
  iconName: string;
  popLimit?: number;
  demographics?: any;
}

export interface DmaOption {
  boundingBox: mapboxgl.LngLatBoundsLike,
  name: string,
  population: number,
  geographyTypes: string[],
  productTypes: string[]
}

interface ProductInfoBase {
  displayName: string,
  dateRanges: string[],
  weekdays: string[],
  showHourly?: boolean,
  popLimit?: number
}

export interface DemographicOption extends ProductInfoBase {
  calculation: string,
  units: string,
  segment: string
}

export interface ProductOption extends ProductInfoBase {
  id?: string,
  demographics?: Record<string, DemographicOption>
  resolutions?: number[][3]
}


export interface DatasetOption {
  attributes: string[],
  created: string,
  dataset: string,
  dateRange: string,
  segment: string,
  table: string,
  table_name: string,
  url: string,
  weekdays: string
}


export interface GeographyData {
  center: mapboxgl.PointLike | string,
  name: string,
  place_id: number | string,
  place_pop: number | string,
  rank?: number | string
}

export interface RecordGeographyData {
  dma_id: number | string,
  dma_name: string,
  places: GeographyData[]
}

export interface TimeframeData {
  dmaid: number | string,
  center: mapboxgl.PointLike | string,
  hourly_activity: Record<string, number[]>[]
  name: string,
  place_id: number | string,
  place_pop: number | string,
  rank: number | string
}


export interface TravelerCountWeek {
  we: string,
  arrivals: number,
  visits: number,
  unique: number
}

export interface TravelerCountSegment {
  imx_segment: string,
  weeks: TravelerCountWeek[]
}

export interface TravelerCountData {
  dmaid: string | number,
  segments: TravelerCountSegment[]
}

// nearly the same as TravelerCount, but for specific demographics, showing which dma these people came from
export interface FeederMarketWeek {
  we: string,
  unique: number
}
export interface FeederMarketSegment {
  dmaid: string | number, // where I'm coming from
  weeks: FeederMarketWeek[]
}
export interface FeederMarketData {
  dmaid: string | number,
  imx_segment: string,
  segments: FeederMarketSegment[] // week data for each dma that visited this dma
}
export interface MenuOption {
  id?: string,
  containerID?: string, // if has container type, what id goes on that container
  value: boolean | number | string,
  text: string,
  description?: string,
  data?: any // the item if we're keeping it
}

export interface DonutChartData {
  [key: string]: number;
}

export interface DonutChartOptions extends ChartOptions, LegendOptions {
  arcFormat?: (data: any, index?: number) => string,
  useRaw?: boolean, // default to use percentages
  innerRadius?: number
}
export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export interface ChartOptions {
  width: number;
  height: number;
  tooltip?: string | ((d: any) => string);
  margin: ChartMargin;
}

export interface AxisOptions {  // for charts that have an axis
  xAxis?: boolean,
  xAxisTilt?: boolean,
  xAxisTitle?: string,
  xAxisFormat?: (d: any, i?: number) => string,
  yAxis?: boolean,
  yAxisTitle?: string
  yAxisFormat?: (d: any, i?: number) => string
}
export interface LineChartOptions extends ChartOptions, AxisOptions {
  hideDots?: boolean
}
export type ChartSide = 'top' | 'right' | 'bottom' | 'left'

export interface LegendOptions { // for charts that have a legend
  legend?: boolean,
  legendSide?: ChartSide,
  legendFormat?: (d: any, index?: number) => string,
  legendRows?: number
}

export interface GroupBySettings {
  items: any[] | DonutChartData,
  key?: string | number | ((item: any) => string | number), // required if items is array to be grouped
  arrayKey?: boolean | string | number,
  valueKey?: string | number | ((item: any) => string | number)
  labelFormat?: (label: string | number) => string | number,
  valueFormat?: (value: any) => string | number,
  sortGroups?: boolean | ((a: any, b: any) => number) // true for descending value
  useGroup?: boolean // only for stacked chart
}

export type ChartType = 'bar' | 'donut' | 'line' | 'stacked-line'

export interface ChartSection {
  title: string,
  wrapperClass?: ClassLike,
  labels?: MenuOption[],
  groupBySettings?: GroupBySettings,
  chartType: ChartType,
  chartProps: {data: any, options: any}
}

export interface PageSection {
  title: string,
  header: string,
  description: string,
  charts: ChartSection[]
}
export type ClassLike = string | Record<string, boolean> | string[]
