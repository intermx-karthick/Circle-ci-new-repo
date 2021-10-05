import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy
} from '@angular/core';
import { DonutChartData, ChartOptions } from '@d3/interfaces/d3-chart-types';
import { D3Service } from '@d3/services/d3.service';
import { ThemeService } from '@shared/services/theme.service';
import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Collection from 'd3-collection';
import * as d3Ease from 'd3-ease';
import {PieArcDatum} from 'd3-shape';

@Component({
  selector: 'app-donut-chart',
  template: `
    <div id="{{ id }}Div" class="donut-chart">
      <svg id="{{ id }}DonutChart" class="donutChart"></svg>
      <div class="d3ChartToolTip" id="{{ id }}Tooltip">
        <ul>
          <li *ngFor="let type of formattedData | keyvalue: valueDescOrder; let i = index">
            <span class="colorPill legendbg" [ngStyle]="{ 'background-color': colors[i]}" [attr.data-color]="colors[i]"></span>
            <span class="legend-name" id="device-{{i}}">{{type.value}}% - {{type.key | uppercase}}</span>
          </li>
        </ul>
      </div>
    </div>
  `,
  styleUrls: ['./donut-chart.component.less']
})
export class DonutChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() data: DonutChartData = {};
  @Input() options: ChartOptions = {
    width: 180,
    height: 180,
    margin: { top: 20, right: 20, bottom: 20, left: 20 }
  };
  public colors: any;
  public formattedData: DonutChartData = {};
  private themeSettings: any;
  public id: string;
  constructor(
    private d3Service: D3Service,
    private themeService: ThemeService
    ) {}

  ngOnInit() {
    this.themeSettings = this.themeService.getThemeSettings();
    this.id = this.d3Service.generateUID();
    const colorsCount = Object.keys(this.data).length;
    this.colors = this.d3Service.colorGenerater(this.themeSettings['color_sets']['primary']['base'], colorsCount > 5 ? colorsCount : 5 );
    this.formattedData = this.formatData(this.data);
  }
  private loadChart() {
    const id = 'svg#' + this.id + 'DonutChart';
    const width = this.options.width - this.options.margin.left - this.options.margin.right;
    const height = this.options.height - this.options.margin.top - this.options.margin.bottom;
    const radius = Math.min(width, height) / 2;
    const innerRadius = this.getInnerRadius(radius);
    // set the color scale
    const color = d3Scale
      .scaleOrdinal()
      // @ts-ignore
      .domain(this.formattedData)
      .range(this.colors);
    console.log(color);
    // Define arc ranges
    const arcText = d3Scale.scaleOrdinal()
      .range([0, width]);
      // Determine size of arcs
    const arc = d3Shape.arc<PieArcDatum<any>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    // Create the donut pie chart layout
    const pie = d3Shape.pie<any>()
    .value(function (d) { return d['value']; })
    .sort(null);
    // @ts-ignore
    const data_ready = pie(d3Collection.entries(this.formattedData));

    // Append SVG attributes and append g to the SVG
    const svg = d3.select(id)
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .append('g')
        .attr('transform', 'translate(' + this.options.width / 2 + ',' + this.options.height / 2 + ')');

    // Calculate SVG paths and fill in the colours
    const g = svg.selectAll('.arc')
      // @ts-ignore
      .data(data_ready)
      .enter().append('g')
      .attr('class', 'arc')
    // Append the path to each g
    g.append('path')
    .attr('d', arc)
    /*
    This line is hidden by Vignesh.M on 7th May, 2021. This method is failing after upgrading to Angular 10 due to strictness. Matthew said we have to rebuild this area anyway, so it is fine to hide it for now.

    .attr('fill', function(d, i) {
        return color(i);
    })*/
    .on('mouseover', function(d, i) {
      d3.select(this)
        .transition()
        .attr(
          'd',
          d3Shape
            .arc()
            .innerRadius(innerRadius)
            .outerRadius(radius * 1.08)
        );
      const element = document.getElementById('device-' + i);
      element.classList.add('highlight');
    })
    .on('mouseout', function(d, i) {
      d3.select(this)
        .transition()
        .duration(500)
        .ease(d3Ease.easeBounce)
        .attr(
          'd',
          d3Shape
            .arc()
            .innerRadius(innerRadius)
            .outerRadius(radius)
        );
      const element = document.getElementById('device-' + i);
      element.classList.remove('highlight');
    });

    // Append text labels to each arc
    g.append('text')
    .attr('transform', function(d) {
      // @ts-ignore
        return 'translate(' + arc.centroid(d) + ')';
    })
    .attr('dy', '.35em')
    .style('text-anchor', 'middle')
    .attr('fill', '#fff')
      // @ts-ignore
        .text(function(d, i) { return `${d.value}%`; });

  }
  /**
   * This method is to calculate innerradius.Currently it will return 50% of radius. We can make it dynamic later.
   * @param radius
   */
  private getInnerRadius(radius) {
    return (radius / 100) * 50;
  }

  ngAfterViewInit() {
    setTimeout(() => this.loadChart(), 200);
  }

  ngOnChanges(changes: SimpleChanges) {
    if ( changes.data && changes.data.currentValue) {
      this.formattedData = this.formatData(changes.data.currentValue);
    }
  }
  ngOnDestroy() {
    this.id = null;
  }
  /**
   * This method is to convert the data in to percentage format
   * @param data
   */
  private formatData(data) {
    const formattedData = {...data};
    let total = 0;
    const keys = Object.keys(formattedData);
    keys.forEach(key => {
      total += formattedData[key];
    });
    keys.forEach(key => {
      const value = Math.round((formattedData[key] / total) * 100);
      if (value <= 0) {
        delete formattedData[key]
      } else {
        formattedData[key] = value;
      }
    });
    const sortedData: DonutChartData = {};
    // Below we are sorting the data based on values
    keys.sort((a, b) => {
      return formattedData[a] - formattedData[b];
    }).reverse().forEach(function(k) {
      if (formattedData[k]) {
        sortedData[k] = formattedData[k];
      }
    });
    return sortedData;
  }

  /**
   * This method is to sort the hash based on values used along keyValue Pipe
   * @param c1
   * @param c2
   */
  public valueDescOrder(c1, c2) {
    return c1.value > c2.value ? -1 : (c2.value > c1.value ? 1 : 0);
  }
}
