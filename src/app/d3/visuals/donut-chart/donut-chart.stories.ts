import {Meta, moduleMetadata, Story} from '@storybook/angular';
import { DonutChartComponent } from '@d3/visuals/donut-chart/donut-chart.component';
import { StoriesModuleTesting } from 'stories/stories.module.testing';
import {ChartOptions, DonutChartData} from '@d3/interfaces/d3-chart-types';
import {Input} from '@angular/core';

export default {
  title: 'charts/donut-chart',
  component: DonutChartComponent,
  decorators: [moduleMetadata(StoriesModuleTesting)]
} as Meta;

const Template: Story<DonutChartComponent> = (args: DonutChartComponent) => ({
  component: DonutChartComponent,
  props: args
});
const data: DonutChartData = {'a': 9, 'b': 20, 'c':30, 'd':8, 'e':12}
const defaultOptions: ChartOptions = {
  width: 180,
  height: 180,
  margin: { top: 20, right: 20, bottom: 20, left: 20 }
};
export const InitialState = Template.bind({});
InitialState.args = {
  data: data,
  options: defaultOptions
}
export const CustomDimensions = Template.bind({});
CustomDimensions.args = {
  data: data,
  options: {...defaultOptions, width: 20, height: 20}
}
