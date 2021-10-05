import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy
} from '@angular/core';
import { DonutChartData, DonutChartOptions } from '@interTypes/population-intelligence-types';
import { ThemeService } from '@shared/services';
import { D3Service } from '@d3/services/d3.service';
import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Collection from 'd3-collection';
import { MenuOption } from '@interTypes/population-intelligence-types';

@Component({
  selector: 'donut-chart',
  template: `
    <div id="{{ id }}-div" class="donut-chart">
      <svg id="{{ id }}-donut-chart" class="donut-chart"></svg>
      <div class="donut-chart-legend" id="{{ id }}-tooltip" [hidden]="!options.legend">
        <ul>
          <li *ngFor="let type of formattedData | keyvalue: valueDescOrder; let i = index">
            <span class="color-pill legendbg" [ngStyle]="{ 'background-color': colors[i]}" [attr.data-color]="colors[i]"></span>
            <span class="legend-name" id="device-{{i}}">
              {{ legendText(type, i) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  `,
  styleUrls: ['./donut-chart.component.less']
})
export class DonutChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() data: DonutChartData = {};
  @Input() options: DonutChartOptions = {
    width: 180,
    height: 180,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    legend: true
  };
  @Output() onHighlight = new EventEmitter<MenuOption>()

  public colors: any;
  public formattedData: DonutChartData = {};
  private themeSettings: any;
  public id: string;

  private _width: number = null;
  private _height: number = null;
  private radius: number = null;
  private innerRadius: number = null;
  viewInitialized = false;
  constructor(
    private d3Service: D3Service,
    private themeService: ThemeService
  ) { }

  ngOnInit() {
    this.themeSettings = this.themeService.getThemeSettings()
    this.id = this.d3Service.generateUID();
    const colorsCount = Object.keys(this.data).length;
    this.colors = this.d3Service.colorGenerator(this.themeSettings['color_sets']['primary']['base'], colorsCount > 5 ? colorsCount : 5);
  }

  private clear () {
    d3.selectAll(`svg#${this.id}-donut-chart > *`).remove()
  }
  private loadChart() {
    this.clear()
    const id = `svg#${this.id}-donut-chart`;
    this._width = this.options.width - this.options.margin.left - this.options.margin.right;
    this._height = this.options.height - this.options.margin.top - this.options.margin.bottom;
    this.radius = Math.min(this._width, this._height) / 2;
    this.innerRadius = this.getInnerRadius(this.radius);
    if (this.options.useRaw) {
      this.formattedData = this.data
    } else {
      this.formattedData = this.d3Service.donutDataAsPercent(this.data, true)
    }
    // set the color scale
    const color = d3Scale
      .scaleOrdinal()
      // @ts-ignore
      .domain(this.formattedData)
      .range(this.colors);

    // Define arc ranges
    const arcText = d3Scale.scaleOrdinal()
      .range([0, this._width]);
    // Determine size of arcs
    const arc = d3Shape.arc()
      .innerRadius(this.innerRadius)
      .outerRadius(this.radius);

    // Create the donut pie chart layout
    const pie = d3Shape.pie()
      .value(function (d) { return d['value']; })
      .sort(null);
    // @ts-ignore
    const data_ready = pie(d3Collection.entries(this.formattedData));

    // Append SVG attributes and append g to the SVG
    const svg = d3.select(id)
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .append('g')
      .attr('class', 'arc-container')
      .attr('transform', 'translate(' + this.options.width  / 2 + ',' + this.options.height / 2 + ')');

    // Calculate SVG paths and fill in the colours
    const g = svg.selectAll('.arc')
      // @ts-ignore
      .data(data_ready)
      .enter().append('g')
      .attr('class', 'arc')
    // Append the path to each g
    let comp = this
    g.append('path')
      .attr('d', arc as any)
      .style('cursor', 'pointer')
      .attr('fill', (d: any, i: number): any => {
        return color(String(i));
      })
      .on('mouseover', (d, i) => {
        this.highlight(i)
        const element = document.getElementById('device-' + i);
        element.classList.add('highlight');
      })
      .on('mouseout', (d, i) => {
        this.unhighlight()
        const element = document.getElementById('device-' + i);
        element.classList.remove('highlight');
      });

    // Append text labels to each arc
    g.append('text')
      .attr('transform', function (d) {
        // @ts-ignore
        return 'translate(' + arc.centroid(d) + ')';
      })
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('cursor', 'pointer')
      .attr('fill', (d, i) => { // return the lightest color on the darker arcs, and the darkest color on the lighter arcs
        if (this.colors.length - i - 1 < this.colors.length / 2) {
          return this.colors[0]
        } else {
          return this.colors[this.colors.length - 1]
        }
      })
      // @ts-ignore
      .text((d, i) => {
        if (this.options.arcFormat) {
          return this.options.arcFormat(d, i)
        } else if (this.options.useRaw) {
          return d.value
        } else {
          return `${d.value}%`
        }
      })
      .on('mouseover', (d, i) => {
        this.highlight(i)
      })
      .on('mouseout', (d, i) => {
        this.unhighlight()
      })
  }

  private getInnerRadius(radius) {
    // we want to allow 0, so check specifically for undefined/null
    if (this.options.innerRadius !== undefined && this.options.innerRadius !== null) {
      return this.options.innerRadius
    }
    return radius / 2;
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.loadChart()
      this.viewInitialized = true
    })
  }

  highlight (index, report: boolean = true) {
    this.unhighlight(false)
    if (report) {
      this.onHighlight.emit({text: Object.keys(this.data)[index], value: index})
    }
    setTimeout(() => { // unhighlight above for element 0 caused it to never highlight. not sure why, but it's a timing issue
      d3.select(`.arc:nth-child(${index + 1}) path`).transition().duration(250).attr('d', d3Shape.arc().innerRadius(this.innerRadius).outerRadius(this.radius * 1.08))
    })
  }

  unhighlight (report: boolean = true) {
    if (report) {
      this.onHighlight.emit(null)
    }
    d3.selectAll('.arc path').transition().duration(250).attr('d', d3Shape.arc().innerRadius(this.innerRadius).outerRadius(this.radius))
  }

  ngOnChanges(changes: SimpleChanges) {
    // this was firing before the view was initialized sometimes and caused errors
    if (changes.data && changes.data.currentValue && this.viewInitialized) {
      this.loadChart()
    }
  }
  ngOnDestroy() {
    this.id = null;
  }
  /**
   * This method is to sort the hash based on values used along keyValue Pipe
   * @param c1
   * @param c2
   */
  public valueDescOrder(c1, c2) {
    return c1.value > c2.value ? -1 : (c2.value > c1.value ? 1 : 0);
  }

  legendText (d: {value: number, key: string}, index: number) {
    if (this.options.legendFormat) {
      return this.options.legendFormat(d, index)
    }
    return `${d.value}${ this.options.useRaw ? '' : '%' } - ${d.key.toUpperCase()}`
  }
}
