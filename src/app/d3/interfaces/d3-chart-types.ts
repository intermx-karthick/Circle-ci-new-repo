export interface DonutChartData {
  [key: string]: any;
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
  tooltip?: string;
  margin: ChartMargin;
}

export interface LineChartData {
  name: string | Date | number; // x value
  value: number; // y value
  index?: number;
}

export interface StackedLineChartData extends LineChartData {
  group: string // which line does this data belong to
}

export interface MultiLineChartData {
  name: string;
  values: MultiLineData[];
  minValue?: number;
  maxValue?: number;
  color?: string;
}

export interface MultiLineData {
  xData: string | number;
  yData: string | number;
}
