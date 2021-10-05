import {Component, OnInit, Input, AfterViewInit, OnChanges, SimpleChanges, EventEmitter, OnDestroy} from '@angular/core';
import { BarChartData, BarChartOptions } from '@d3/interfaces/bar-chart-data';
import {D3Service} from '@d3/services/d3.service';
import * as d3 from 'd3';

@Component({
  selector: 'graph-basic-bar',
  template: `
    <div id='{{id}}Div'>
      <svg id="{{id}}Chart" class="basicBarChart">
        <g id="original-bar"></g>
        <g id="support-bar"></g>
      </svg>
      <div class='d3ChartToolTip' id="{{id}}Tooltip" >
      </div>
    </div>
  `,
  styleUrls: ['./basic-bar-chart.component.less']
})
export class BasicBarChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() data: BarChartData[] = [];
  @Input() options: BarChartOptions = {
    width: 100,
    height: 40,
    tooltip: 'Name:##NAME## <br> Value: ##VALUE##',
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  };
  @Input() chartName = 'default';
  private manualRefreshSubscription: any;
  // Input event that triggers slider refresh (re-positioning of slider elements)
  @Input() set manualRefresh(manualRefresh: EventEmitter<void>) {
    this.unsubscribeManualRefresh();
    this.manualRefreshSubscription = manualRefresh.subscribe(() => {
      setTimeout(() =>  this.loadBarChart());
    });
  }
  public id: string;
  constructor(private d3Service: D3Service) { }

  ngOnInit() {
    // this.loadBarChart();
    this.id = this.d3Service.generateUID();
  }
  loadBarChart () {
    const id = '#' + this.id + 'Chart';
    this.clear();
    const svg = d3.select(id)
        .attr('width', this.options.width)
        .attr('height', this.options.height)
        .attr('class', 'basic-bar-chart');
    const tooltip = d3.select('#' + this.id + 'Tooltip');
    const margin = this.options['margin'];
    const x = d3.scaleBand()
        .domain(this.data.map(d => d.name))
        .range([margin.left, this.options.width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(this.data, d => d.value)])
        .nice()
        .range([this.options.height - margin.bottom, margin.top]);
    svg.select('g#original-bar')
      .selectAll('rect').data(this.data).enter().append('rect')
      .attr('id', (d, i) => {
        return this.id + i + 'bar';
      })
      .attr('x', d => x(d.name))
      .attr('y', d => {
        return y(d.value) > (this.options.height - 1) ? (this.options.height - 1) : y(d.value);
      })
      .attr('height', d => {
        return (y(0) - y(d.value)) > 1 ? (y(0) - y(d.value)) : 1;
      })
      .attr('width', x.bandwidth());
    svg.select('g#support-bar')
      .selectAll('rect').data(this.data).enter().append('rect')
      .attr('class', 'supportBar')
      .attr('x', d => x(d.name))
      .attr('y', 0)
      .attr('height', this.options.height)
      .attr('width', x.bandwidth())
      .on('mousemove', (d, i) => {
        svg.select('#' + this.id + i + 'bar').classed('active', true);
        tooltip
          .style('left', d3.event.pageX - 50 + 'px')
          .style('top', d3.event.pageY - 100 + 'px')
          .style('display', 'inline-block')
          .html(this.options.tooltip.replace('##NAME##', d.name).replace('##VALUE##', d.value.toString()));
      })
      .on('mouseout', (d, i) => {
        svg.select('#' + this.id + i + 'bar').classed('active', false);
        tooltip.style('display', 'none');
      });
  }
  ngAfterViewInit () {
    // this.loadBarChart();
    setTimeout(() => this.loadBarChart(), 500);
  }
  private unsubscribeManualRefresh(): void {
    if (this.manualRefreshSubscription) {
      this.manualRefreshSubscription.unsubscribe();
      this.manualRefreshSubscription = null;
    }
  }
  private clear () {
    const id = '#' + this.id + 'Chart';
    const svg = d3.select(id);
    svg.selectAll('g#original-bar > *').remove();
    svg.selectAll('g#support-bar > *').remove();
  }
  ngOnDestroy() {
    this.unsubscribeManualRefresh();
    this.clear ();
    this.id = null;
  }
}
