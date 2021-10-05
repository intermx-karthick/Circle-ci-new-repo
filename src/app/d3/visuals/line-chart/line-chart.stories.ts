import { LineChartData, LineChartOptions } from '@d3/interfaces/line-chart-data';
import { LineChartComponent } from '@d3/visuals/line-chart/line-chart.component';
import { Meta, moduleMetadata, Story} from '@storybook/angular';
import { StoriesModuleTesting } from '../../../../stories/stories.module.testing';

export default {
  title: 'charts/line-chart',
  component: LineChartComponent,
  decorators: [moduleMetadata(StoriesModuleTesting)]
} as Meta;

const Template: Story<LineChartComponent> = (args: LineChartComponent) => ({
  component: LineChartComponent,
  props: args
});
const chartData: LineChartData[] = [
  {name: 'January', value: 190},
  {name: 'February', value: 90},
  {name: 'March', value: 300},
];
const chartOptions: LineChartOptions = {
  width: 600,
  height: 300,
  xAxis: true,
  yAxis: true,
  tooltip: 'Name:##NAME## <br> Value: ##VALUE##',
  margin: {top: 20, right: 20, bottom: 25, left: 25}
};
export const InitialState = Template.bind({});
InitialState.args = {
  data: chartData,
  options: chartOptions
};
export const CustomDimensions = Template.bind({});
CustomDimensions.args = {
  data: chartData,
  options: {...chartOptions, width: 300, height: 150}
}
export const CustomTooltip = Template.bind({});
CustomTooltip.args = {
  data: chartData,
  options: {...chartOptions, tooltip: '##NAME##: ##VALUE##'}
}
