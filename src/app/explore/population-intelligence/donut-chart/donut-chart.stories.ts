import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { DonutChartComponent } from './donut-chart.component';
import { D3ModuleTesting } from '../../d3.module.testing';
import { DonutChartData, DonutChartOptions } from '../../interfaces/donut-chart-data';

export default {
  title: 'charts/donut-chart',
  component: DonutChartComponent,
  decorators: [moduleMetadata(D3ModuleTesting)]
} as Meta;

const Template: Story<DonutChartComponent> = (args: DonutChartComponent) => ({
  component: DonutChartComponent,
  props: {
    data: args.data,
    options: args.options
  }
});
const data: DonutChartData = { 'a': 9, 'b': 20, 'c': 30, 'd': 8, 'e': 12 }
const defaultOptions: DonutChartOptions = {
  width: 180,
  height: 180,
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
  legend: true
};

export const InitialState = Template.bind({});
InitialState.args = {
  data: data,
  options: defaultOptions
}

export const CustomDimensions = Template.bind({});
CustomDimensions.args = {
  data: data,
  options: { ...defaultOptions, width: 300, height: 300 }
}

export const CustomInnerRadius = Template.bind({})
CustomInnerRadius.args = {
  data,
  options: { ...defaultOptions, innerRadius: 0 }
}
