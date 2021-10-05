import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { StoriesModuleTesting } from 'stories/stories.module.testing';
import { BasicBarChartComponent } from '@d3/visuals/basic-bar-chart/basic-bar-chart.component';
import { BarChartData, BarChartOptions } from '@d3/interfaces/bar-chart-data';

export default {
  title: 'charts/bar-chart',
  component: BasicBarChartComponent,
  decorators: [moduleMetadata(StoriesModuleTesting)],
} as Meta;

const Template: Story<BasicBarChartComponent> = (args: BasicBarChartComponent) => ({
  component: BasicBarChartComponent,
  props: args
});

const sampleData: BarChartData[] = [
  {name: 'January', value: 10},
  {name: 'February', value: 2},
  {name: 'March', value: 13},
  {name: 'April', value: 6},
]
const defaultOptions: BarChartOptions = {
  width: 100,
  height: 40,
  tooltip: 'Month:##NAME## <br> Orders: ##VALUE##',
  margin: {
    top: 0, right: 0, bottom: 0, left: 0
  }
};
export const InitialState = Template.bind({});
InitialState.args = {
  data: sampleData,
  options: defaultOptions
};
export const CustomDimensions = Template.bind({});
CustomDimensions.args = {
  data: sampleData,
  options: {...defaultOptions, width: 400, height: 160},
};
export const CustomTooltips = Template.bind({});
CustomTooltips.args = {
  data: sampleData,
  options: {...defaultOptions, tooltip: '##NAME##: ##VALUE##',}
};
export const CustomMargins = Template.bind({});
CustomMargins.args = {
  data: sampleData,
  options: {...defaultOptions, margin: {
      top: 2, right: 2, bottom: 2, left: 2
    }
  }
};

