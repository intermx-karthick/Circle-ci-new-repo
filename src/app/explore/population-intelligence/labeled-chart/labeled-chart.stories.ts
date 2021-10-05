import { Meta, moduleMetadata, Story } from '@storybook/angular'
import { LabeledChartComponent } from './labeled-chart.component'
import { D3ModuleTesting } from '../../d3.module.testing'
import { DonutChartData } from '../../interfaces/donut-chart-data'
import { StackedLineChartData } from '../../interfaces/line-chart-data'

export default {
  title: 'charts/labeled-chart',
  component: LabeledChartComponent,
  decorators: [moduleMetadata(D3ModuleTesting)]
} as Meta

const Template: Story<LabeledChartComponent> = (args: LabeledChartComponent) => ({
  component: LabeledChartComponent,
  props: {
    title: args.title,
    wrapperClass: args.wrapperClass,
    labels: args.labels,
    groupBySettings:args.groupBySettings
  }
})

// const chartData: DonutChartData = { c: 30, b: 20, e: 12, a: 9, d: 8} // sorted by value
const chartData: DonutChartData = { a: 9, b: 20, c: 30, d: 8, e: 12 } // sorted by name
const makeArgs = (args = null) => {
  return Object.assign({
    title: 'Choices',
    groupBySettings: {
      items: chartData,
      labelFormat: label => label.toUpperCase(),
      valueFormat: value => ((value / Object.values(chartData).reduce((sum, value) => sum + value) || 0) * 100).toFixed(1) + '%'
    }
  }, args)
}

export const InitialState = Template.bind({})
InitialState.args = makeArgs()

// we must allow additional args to pass as props for the donut chart
const DonutTemplate: Story<LabeledChartComponent> = (args: LabeledChartComponent | any) => ({
  template: `
    <labeled-chart
      [title]="title"
      [wrapperClass]="wrapperClass"
      [labels]="labels"
      [groupBySettings]="groupBySettings"
    >
      <donut-chart
        [data]="groupBySettings ? groupBySettings.items : items || {}"
        [options]="donutChartOptions"
      ></donut-chart>
    </labeled-chart>
  `,
  props: {
    title: args.title,
    wrapperClass: args.wrapperClass,
    labels: args.labels,
    groupBySettings: args.groupBySettings,
    items: args.items,
    donutChartOptions: args.donutChartOptions
  }
})
const donutChartOptions = { width: 120, height: 120, legend: false, margin: { left: 10, right: 10, bottom: 10, top: 10 } }

export const DonutChartInSlot = DonutTemplate.bind({})
DonutChartInSlot.args = makeArgs({ donutChartOptions })

export const SpecifiedWidth = DonutTemplate.bind({})
SpecifiedWidth.args = makeArgs({ wrapperClass: 'storybook-container', donutChartOptions })


const BarTemplate: Story<LabeledChartComponent> = (args: LabeledChartComponent | any) => ({
  template: `
    <labeled-chart
      [title]="title"
      [wrapperClass]="wrapperClass"
      [labels]="labels"
      [groupBySettings]="groupBySettings"
    >
      <bar-chart
        [data]="groupBySettings ? groupBySettings.items : items || []"
        [options]="barChartOptions"
      ></bar-chart>
    </labeled-chart>
  `,
  props: {
    title:args.title,
    wrapperClass: args.wrapperClass,
    labels: args.labels,
    groupBySettings: args.groupBySettings,
    items: args.items,
    barChartOptions: args.barChartOptions
  }
})
const barChartOptions = {
  width: 300,
  height: 120,
  tooltip: 'Name:##NAME## <br> Value: ##VALUE##',
  margin: { top: 10, right: 30, bottom: 30, left: 30 },
  xAxis: true,
  yAxis: true,
  xAxisTilt: false,
}

export const BarChartInSlot = BarTemplate.bind({})
BarChartInSlot.args = makeArgs({
  barChartOptions,
  title: 'Months',
  groupBySettings: {
    items: [
      { name: 'January', value: 10 },
      { name: 'February', value: 2 },
      { name: 'March', value: 13 },
      { name: 'April', value: 6 },
    ],
    key: 'name',
    valueKey: 'value',
  }
})

export const FormattedLabels = BarTemplate.bind({})
FormattedLabels.args = makeArgs({
  barChartOptions,
  title: 'Months (formatted)',
  groupBySettings: {
    items: [
      { name: 'January', value: 10 },
      { name: 'February', value: 2 },
      { name: 'March', value: 13 },
      { name: 'April', value: 6 },
    ],
    key: 'name',
    valueKey: 'value',
    labelFormat: label => label.slice(0, 3) + '.'
  }
})


const LineTemplate: Story<LabeledChartComponent> = (args: LabeledChartComponent | any) => ({
  template: `
    <labeled-chart
      [title]="title"
      [wrapperClass]="wrapperClass"
      [labels]="labels"
      [groupBySettings]="groupBySettings"
    >
      <line-chart
        [data]="groupBySettings ? groupBySettings.items : items || []"
        [options]="lineChartOptions"
      ></line-chart>
    </labeled-chart>
  `,
  props: {
    title:args.title,
    wrapperClass: args.wrapperClass,
    labels: args.labels,
    groupBySettings: args.groupBySettings,
    items: args.items,
    lineChartOptions: args.lineChartOptions
  }
})
const lineChartOptions = {
  width: 300,
  height: 200,
  xAxis: true,
  yAxis: true,
  tooltip: 'Name:##NAME## <br> Value: ##VALUE##',
  margin: { top: 0, right: 20, left: 30, bottom: 30 }
}

export const LineChartInSlot = LineTemplate.bind({})
LineChartInSlot.args = makeArgs({
  lineChartOptions,
  title: 'Months',
  groupBySettings: {
    items: [
      { name: 'January', value: 190 },
      { name: 'February', value: 90 },
      { name: 'March', value: 300 },
    ],
    key: 'name',
    valueKey: 'value'
  }
})

const StackedLineTemplate: Story<LabeledChartComponent> = (args: LabeledChartComponent | any) => ({
  template: `
    <labeled-chart
      [title]="title"
      [wrapperClass]="wrapperClass"
      [labels]="labels"
      [groupBySettings]="groupBySettings"
    >
      <stacked-line-chart
        [data]="groupBySettings ? groupBySettings.items : items || []"
        [options]="stackedChartOptions"
      ></stacked-line-chart>
    </labeled-chart>
  `,
  props: {
    title: args.title,
    wrapperClass: args.wrapperClass,
    labels: args.label,
    groupBySettings: args.groupBySettings,
    items: args.items,
    stackedChartOptions: args.stackedChartOptions
  }
})
const stackedChartData: StackedLineChartData[] = [
  { name: 'January', value: 12, group: 'geodav.tech' },
  { name: 'January', value: 24, group: 'Intermx' },
  { name: 'February', value: 45, group: 'geodav.tech' },
  { name: 'February', value: 33, group: 'Intermx' },
  { name: 'March', value: 3, group: 'geodav.tech' },
  { name: 'March', value: 20, group: 'Intermx' },
  { name: 'April', value: 14, group: 'geodav.tech' },
  { name: 'April', value: 32, group: 'Intermx' }
]
let keys = Array.from(new Set(stackedChartData.map(d => d.group)))
let groupedChartData = stackedChartData.reduce((groups, item) => {
  let name = item.name as string
  if (!groups[name]) {
    groups[name] = keys.reduce((keyValues, key) => {
      keyValues[key] = 0
      return keyValues
    }, {})
  }
  groups[name][item.group] += item.value
  return groups
}, {})
let tooltip = d => {
  let nameTotal = Object.values(groupedChartData[d.name]).reduce((sum: number, value: number) => sum + value)
  return `Group: ${d.group} <br> Name: ${d.name} <br> Value: ${d.value} <br> Total: ${nameTotal}`
}
const stackedChartOptions = {
  width: 300,
  height: 200,
  xAxis: true,
  yAxis: true,
  tooltip,
  margin: { top: 10, left: 20, right: 20, bottom: 100 },
  legend: true,
  legendSide: 'bottom'
}

export const StackedLineChartInSlot = StackedLineTemplate.bind({})
StackedLineChartInSlot.args = makeArgs({
  stackedChartOptions,
  title: 'Visits',
  groupBySettings: {
    items: stackedChartData,
    key: 'name',
    valueKey: 'value'
  }
})
