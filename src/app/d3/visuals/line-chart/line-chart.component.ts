import { Component, OnInit, Input, AfterViewInit, OnChanges, SimpleChanges, EventEmitter, OnDestroy } from '@angular/core';
import { LineChartData, LineChartOptions } from '@d3/interfaces/line-chart-data';
import { D3Service } from '@d3/services/d3.service';
// import * as d3 from 'd3';
import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';

@Component({
  selector: 'graph-line-chart',
  template: `
    <div id='{{id}}Div' class="basicLineChart">
      <svg id="{{id}}LineChart" >
      </svg>
      <div class='d3ChartToolTip' id="{{id}}Tooltip" >
      </div>
    </div>
  `,
  styleUrls: ['./line-chart.component.less']
})
export class LineChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() data: LineChartData[] = [];
  @Input() options: LineChartOptions = {
    width: 900,
    height: 500,
    xAxis: true,
    yAxis: true,
    tooltip: 'Name:##NAME## <br> Value: ##VALUE##',
    margin: {top: 20, right: 20, bottom: 25, left: 25}
  };
  private manualRefreshSubscription: any;
  // Input event that triggers slider refresh (re-positioning of slider elements)
  @Input() set manualRefresh(manualRefresh: EventEmitter<void>) {
    this.unsubscribeManualRefresh();
    this.manualRefreshSubscription = manualRefresh.subscribe(() => {
      setTimeout(() => {
        this.loadChart();
      });
    });
  }
  public id: string;
  public xAxis: any;
  constructor(private d3Service: D3Service) { }

  ngOnInit() {
    this.id = this.d3Service.generateUID();
  }
  loadChart() {
    const id = 'svg#' + this.id + 'LineChart';
    this.clear();
    this.data = this.formatData(this.data);

    const tooltip = d3.select('#' + this.id + 'Tooltip');
    const svg = d3.select(id)
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .attr('class', 'basic-line-chart')
      .append('g')
      .attr('transform', 'translate(' + this.options.margin.left + ',' + this.options.margin.top + ')');

    const width = this.options.width - this.options.margin.left - this.options.margin.right;
    const height = this.options.height - this.options.margin.top - this.options.margin.bottom;

    const x = d3Scale.scaleLinear().range([0, width - (this.options.margin.left + this.options.margin.right)]);
    const y = d3Scale.scaleLinear().range([height, 0]);

    x.domain(d3Array.extent(this.data, (d) => d.index));
    y.domain([
      (Math.floor(d3Array.min(this.data, function (d) { return d.value; }) / 10) * 10),
      (Math.ceil(d3Array.max(this.data, function (d) { return d.value; }) / 10) * 10)
    ]);

    const yTicks = [0];

    const yMax = (Math.ceil(d3Array.max(this.data, function (d) { return d.value; }) / 10) * 10);
    yTicks.push(Math.ceil(yMax / 2));
    yTicks.push(yMax);
    const g = svg.append('g')
      .attr('transform', 'translate(' + this.options.margin.left + ',' + this.options.margin.top + ')');

    g.append('g')
      .attr('class', 'grid')
      .attr('transform',
        'translate(0,' + ((height - (this.options.margin.top + 10))) + ')')
      .call(d3Axis.axisBottom(x)
        .ticks(this.data.length)
        .tickSize(-height)
        .tickFormat((d) => '')
      );
    const areaData = g.append('g')
      .attr('class', 'areaData')
      .attr('transform', 'translate(0,-30)');
    areaData.append('path')
      .attr('class', 'area-data')
      .datum(this.data)
      // @ts-ignore
      .attr('d', d3Shape.area()
        .x(function (d) { return x(d['index']); })
        .y0(height)
        .y1(function (d) { return y(d['value']); })
      );
    g.append('g')
      .attr('class', 'axis axis--x')
      .attr('fill', '#cce5df')
      .attr('transform',
        'translate(0,' + ((height - (this.options.margin.top + 10))) + ')')
      .call(d3Axis.axisBottom(x).ticks(this.data.length).tickValues(this.xAxis)
        // @ts-ignore
        .tickFormat((d) => this.data[Math.round(d)].name as string)
      );
    g.append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', 'translate(0,-30)')
      .call(d3Axis.axisLeft(y).ticks(3).tickValues(yTicks)
      // .tickFormat((d) => this.convertThousand(this.data[d.toString()].value))
      )
      .append('text')
      .attr('class', 'axis-title')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em');

    const lineAndDots = g.append('g')
      .attr('class', 'line-and-dots')
      .attr('transform', 'translate(0,-30)');
    // Data dots
    lineAndDots.selectAll('line-circle')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('class', (d) => {
        return 'data-circle dataCircle-' + this.id + d.index;
      })
      .attr('r', 3)
      .attr('cx', function (d) { return x(d.index); })
      .attr('cy', function (d) { return y(d.value); })
      .on('mousemove', (d, i) => {
        svg.select('#' + this.id + i + 'bar').classed('active', true);
        svg.select('.dataCircle-' + this.id + i ).attr('r', 5);
        tooltip
          .style('left', d3.event.offsetX - 75 + 'px')
          .style('top', d3.event.offsetY - 85 + 'px')
          .style('display', 'inline-block')
          // @ts-ignore
          .html(this.options.tooltip.replace('##NAME##', d.name).replace('##VALUE##', this.convertThousand(d.value)));
      })
      .on('mouseout', (d, i) => {
        svg.select('#' + this.id + i + 'bar').classed('active', false);
        svg.select('.dataCircle-' + this.id + i).attr('r', 3);
        tooltip.style('display', 'none');
      });


  }
  ngAfterViewInit() {
    setTimeout(() => this.loadChart(), 200);
  }
  private unsubscribeManualRefresh(): void {
    if (this.manualRefreshSubscription) {
      this.manualRefreshSubscription.unsubscribe();
      this.manualRefreshSubscription = null;
    }
  }
  private clear() {
    const id = '#' + this.id + 'Chart';
    const svg = d3.select(id);
    svg.selectAll('g#original-bar > *').remove();
    svg.selectAll('g#support-bar > *').remove();
  }
  private formatData(data) {
    const formattedData = [...data];
    const xAxis = [];
    let i = 0;
    formattedData.map(d => {
      d['index'] = i;
      xAxis.push(i);
      i++;
    });
    this.xAxis = xAxis;
    const total = formattedData.map(obj => obj.value).reduce((acc, next) => acc + next, 0);
    formattedData.forEach((obj, index) => {
      formattedData[index].value =  Math.round((obj.value / total) * 100);
    });
    return formattedData;
  }

  ngOnDestroy() {
    this.unsubscribeManualRefresh();
    this.clear();
    this.id = null;
  }
  convertThousand (value) {
    if (!isNaN(value)) {
      value = Math.round(value);
      value = value.toString();
    }
    // return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const n = String(value),
      p = n.indexOf('.');
    return n.replace(
        /\d(?=(?:\d{3})+(?:\.|$))/g,
        (m, i) => p < 0 || i < p ? `${m},` : m
    );
  }
}
