export interface LineChartData {
  name: string | Date | number;
  value: number;
  index?: number;
}
export interface LineChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export interface LineChartOptions {
  width: number;
  height: number;
  tooltip: string;
  xAxis?: boolean;
  yAxis?: boolean;
  margin: LineChartMargin;
  xAxisLabels? : any;
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
