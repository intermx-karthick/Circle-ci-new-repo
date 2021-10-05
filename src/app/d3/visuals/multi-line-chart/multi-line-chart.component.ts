import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  AfterViewInit
} from '@angular/core';
import {
  MultiLineChartData,
  LineChartOptions,
  MultiLineData
} from '@d3/interfaces/line-chart-data';
import { D3Service } from '@d3/services/d3.service';
import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';
import { ConvertPipe } from '@shared/pipes/convert.pipe';
@Component({
  selector: 'app-multi-line-chart',
  template: `
    <div id='{{ id }}Div' class='multiLineChart'>
      <svg id='{{ id }}MultiLineChart'></svg>
      <div class='d3ChartToolTip' id='{{ id }}Tooltip'></div>
      <div class="multi-line-legend">
        <ul class='chart-legends'>
        <li *ngFor="let day of data"> <span [ngStyle]="{'background-color': day.color}"></span> {{day.name}}</li>
        </ul>
      </div>
    </div>
  `,
  styleUrls: ['./multi-line-chart.component.less']
})
export class MultiLineChartComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() public data: MultiLineChartData[] = [];
  @Input() options: LineChartOptions = {
    width: 420,
    height: 120,
    xAxis: true,
    yAxis: true,
    tooltip: 'Value: ##VALUE##',
    margin: { top: 20, right: 20, bottom: 25, left: 25 }
  };
  private manualRefreshSubscription: any;
  // Input event that triggers slider refresh (re-positioning of slider elements)
  @Input() set manualRefresh(manualRefresh: EventEmitter<void>) {
    this.unsubscribeManualRefresh();
    this.manualRefreshSubscription = manualRefresh.subscribe(() => {
      setTimeout(() => {
        if (this.data.length > 0) {
          this.loadChart();
        }
      });
    });
  }
  public id: string;
  public xAxis: any;

  colorData = [
    'eb882d',
    '785232',
    '3a6f41',
    '9c429c',
    'b52e2b',
    '59a42a',
    '254097'
  ];

  constructor(private d3Service: D3Service, private convert: ConvertPipe) {}

  ngOnInit() {
    this.id = this.d3Service.generateUID();
  }
  ngAfterViewInit() {
    setTimeout(() => {
      if (this.data.length > 0) {
        this.loadChart();
      }
    }, 500);
  }
  loadChart() {
    this.clear();
    const id = '#' + this.id + 'MultiLineChart';

    const data = this.data;
    const width =
      this.options.width - this.options.margin.left - this.options.margin.right;
    const height =
      this.options.height -
      this.options.margin.top -
      this.options.margin.bottom;

    const margin = this.options.margin.left + this.options.margin.right;

    const lineOpacity = '0.8';
    const lineOpacityHover = '0.85';
    const otherLinesOpacityHover = '0.1';
    const lineStroke = '1.5px';
    const lineStrokeHover = '2.5px';

    const circleOpacity = '0.85';
    const circleOpacityOnLineHover = '0.25';
    const circleRadius = 3;
    const circleRadiusHover = 4;
    const duration = 250;

    const lineValue = [];
    data.map( itemValues => {
       // @ts-ignore
      itemValues['values'].map(yData => {
        lineValue.push(yData['yData']);
      });
    });

    const maxValue = Math.max.apply(this, lineValue);
    const sumData = lineValue.reduce((a, b) => a + b, 0);
    const avgLine = (sumData / lineValue.length) || 0;

    const tooltip = d3.select('#' + this.id + 'Tooltip');
    const svg = d3
    .select(id)
    .attr('width', this.options.width)
    .attr('height', this.options.height)
    .attr('class', 'basic-line-chart')
    .append('g')
    .attr(
      'transform',
      'translate(' + margin + ',' + margin + ')');

    const xScale = d3Scale
      .scaleLinear()
      // @ts-ignore
      .domain(d3Array.extent(data[0].values, d => d.xData))
      .range([0, width - margin]);

    const yScale = d3Scale
      .scaleLinear()
      // @ts-ignore
      .domain([0, maxValue])
      .range([height - margin, 0]);


    const color = d3Scale.scaleOrdinal(this.colorData);

    /* Add line into SVG */
    const line = d3Shape
      .line()
      // @ts-ignore
      .x(d => xScale(d.xData))
      // @ts-ignore
      .y(d => yScale(d.yData));

    const lines = svg.append('g').attr('class', 'lines');

    lines
      .selectAll('.line-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'line-group')
      .on('mouseover', function(d, i) {
        svg
          .append('text')
          .attr('class', 'title-text')
          // @ts-ignore
          .style('fill', d.color)
          // @ts-ignore
          .text(d.name)
          .attr('text-anchor', 'middle')
          .attr('x', (width - margin) / 2)
          .attr('y', - 6);
      })
      .on('mouseout', function(d) {
        svg.select('.title-text').remove();
      })
      .append('path')
      .attr('class', 'line')
      // @ts-ignore
      .attr('d', d => line(d.values))
      // @ts-ignore
      .style('stroke', (d => d.color))
      .style('opacity', lineOpacity)
      .on('mouseover', function(d) {
        d3.selectAll('.line').style('opacity', otherLinesOpacityHover);
        d3.selectAll('.circle').style('opacity', circleOpacityOnLineHover);
        d3.select(this)
          .style('opacity', lineOpacityHover)
          .style('stroke-width', lineStrokeHover)
          .style('cursor', 'pointer');
      })
      .on('mouseout', function(d) {
        d3.selectAll('.line').style('opacity', lineOpacity);
        d3.selectAll('.circle').style('opacity', circleOpacity);
        d3.select(this)
          .style('stroke-width', lineStroke)
          .style('cursor', 'none');
      });


    /* Add circles in the line */
    // @ts-ignore
    lines
      .selectAll('circle-group')
      .data(data)
      .enter()
      .append('g')
      // @ts-ignore
      .style('fill', (d => d.color))
      .selectAll('circle')
       // @ts-ignore
      .data(d => d.values)
      .enter()
      .append('g')
      .attr('class', 'circle')
      .on('mouseover', function(d) {
          tooltip
          .style('left', d3.event.offsetX - 78 + 'px')
          .style('top', d3.event.offsetY - 65 + 'px')
          .style('display', 'inline-block')
          // @ts-ignore
          .html('Target Imp: ' + d.yData.toFixed(2).toString() );
      })
      .on('mouseout', function(d) {
        tooltip.style('display', 'none');
      })
      .append('circle')
       // @ts-ignore
      .attr('cx', d => xScale(d.xData))
      // @ts-ignore
      .attr('cy', d => yScale(d.yData))
      .attr('r', circleRadius)
      .style('opacity', circleOpacity)
      .on('mouseover', function(d) {
        d3.select(this)
          .transition()
          .duration(duration)
          .attr('r', circleRadiusHover);
      })
      .on('mouseout', function(d) {
        d3.select(this)
          .transition()
          .duration(duration)
          .attr('r', circleRadius);
      });

    /* Add Axis into SVG */
    const xAxis = d3Axis.axisBottom(xScale).ticks(2).tickValues([0, 12, 23]).tickFormat(function(n) {
       // @ts-ignore
       if ( n > 0 && n <= 11) {
        return n + 'AM';
       } else if ( n === 0 || n >= 23) {
        return '12 AM';
       } else if (n === 12) {
          return '12 PM';
       } else {
         return (+n - 12) + 'PM';
       }
      });

    const yAxis = d3Axis.axisLeft(yScale).ticks(10);
    const avgAxis = d3Axis.axisBottom(xScale).ticks(0).tickSize(0);
    const topAxis = d3Axis.axisBottom(xScale).ticks(0).tickSize(0);

    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height - margin})`)
      .call(xAxis);

    /*
    // If you wnat Y axis line un comment the below lines
      svg
        .append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('y', 15)
        .attr('transform', 'rotate(-90)')
        .attr('fill', '#000')
        .text('Total values');
    */
      // add average line
    svg
    .append('g')
    .attr('class', 'avg-line')
    .attr('transform', `translate(0, ${ yScale(avgLine) })`)
    .call(avgAxis)
    .append('text')
    .attr('y', 0)
    .attr('x', -15)
    .attr('transform', 'rotate(0)')
    .attr('fill', '#000')
    .text('Avg')
    .append('tspan')
    .attr('y', 15)
    .attr('x', -15)
    .attr('transform', 'rotate(0)')
    .attr('fill', '#000')
    .text(this.convert.transform(avgLine, 'ABBREVIATE'));

    svg
    .append('g')
    .attr('class', 'top-line')
    .attr('transform', `translate(0, ${ yScale(maxValue) })`)
    .call(topAxis)
    .append('text')
    .attr('y', 0)
    .attr('x', -15)
    .attr('transform', 'rotate(0)')
    .attr('fill', '#000')
    .text(this.convert.transform(maxValue, 'ABBREVIATE'));
  }
  private clear() {
    const id = '#' + this.id + 'Chart';
    const svg = d3.select(id);
    svg.selectAll('g#original-bar > *').remove();
    svg.selectAll('g#support-bar > *').remove();
  }
  ngOnChanges(changes: SimpleChanges) {
    /*if (changes.data && changes.data.currentValue) {
      this.data = changes.data.currentValue;
      if (this.data.length > 0) {
        this.loadChart();
      }
    }*/
  }
  private unsubscribeManualRefresh(): void {
    if (this.manualRefreshSubscription) {
      this.manualRefreshSubscription.unsubscribe();
      this.manualRefreshSubscription = null;
    }
  }
}
