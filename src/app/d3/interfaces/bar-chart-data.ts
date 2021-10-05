export interface BarChartData {
  name: string;
  value: number;
}
export interface BarChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export interface BarChartOptions {
  width: number;
  height: number;
  tooltip: string;
  margin: BarChartMargin;
}
