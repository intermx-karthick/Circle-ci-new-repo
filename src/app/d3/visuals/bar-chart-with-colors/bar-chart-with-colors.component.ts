import { Component, OnInit, Input, AfterViewInit, OnChanges, SimpleChanges, EventEmitter, OnDestroy } from '@angular/core';
import { BarChartData, BarChartOptions } from '@d3/interfaces/bar-chart-data';
import {D3Service} from '@d3/services/d3.service';
import * as d3 from 'd3';
import * as d3Array from 'd3-array';
import { ConvertPipe } from '@shared/pipes/convert.pipe';
import { MultiLineChartData, LineChartOptions } from '@d3/interfaces/line-chart-data';
import d3Tip from 'd3-tip';
@Component({
  selector: 'app-bar-chart-with-colors',
  template: `
    <div id='{{id}}Div'>
      <svg id="{{id}}BarChart" class="colorBarChart">
      </svg>
    </div>
  `,
  styleUrls: ['./bar-chart-with-colors.component.less']
})
export class BarChartWithColorsComponent implements OnInit {
  @Input() data: BarChartData[] = [];
  @Input() lineChartConfig: LineChartOptions = {
    width: 420,
    height: 120,
    xAxis: true,
    yAxis: true,
    tooltip: 'Value: ##VALUE##',
    margin: { top: 20, right: 20, bottom: 25, left: 25 }
  };
  @Input() options: BarChartOptions = {
    width: 100,
    height: 40,
    tooltip: 'Name:##NAME## <br> Value: ##VALUE##',
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  };
  @Input() lineChartData: MultiLineChartData[] = [];
  @Input() chartName = 'default';
  private manualRefreshSubscription: any;
  // Input event that triggers slider refresh (re-positioning of slider elements)
  @Input() set manualRefresh(manualRefresh: EventEmitter<void>) {
    this.unsubscribeManualRefresh();
    this.manualRefreshSubscription = manualRefresh.subscribe(() => {
      setTimeout(() =>  {
        if (this.data.length > 0) {
          this.loadBarChart();
        }
      });
    });
  }
  public id: string;
  public colors = ['eb882d', '785232', '3a6f41', '9c429c', 'b52e2b', '59a42a', '254097'];
  public  selectedValues = [];
  public chartLineConfig = {
    width: 550,
    height: 300,
    tooltip: '<div>##NAME## Average:<br>##VALUE##% of Activities</div>',
    xAxis: true,
    yAxis: false,
    margin: {top: 20, right: 20, bottom: 25, left: 25}
  };
  constructor(
    private d3Service: D3Service,
    private convert: ConvertPipe) { }

  ngOnInit() {
    this.id = this.d3Service.generateUID();
  }

  loadBarChart () {
    const id = '#' + this.id + 'BarChart';
    this.clear();
    const margin = this.options['margin'];
    const height = this.options.height - (margin.bottom + margin.top);
    const width =  this.options.width - (margin.left + margin.right);
    const svg = d3.select(id)
      .attr('width', this.options.width)
      .attr('height', this.options.height + (margin.left + margin.right))
      .attr('class', 'basic-bar-chart')
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.left})`);
    // Setting X axis scale
    const xScale = d3.scaleBand()
      .range([0, width])
      .domain(this.data.map(d => d.name))
      .padding(0.1);

    // Setting Y axis scale
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(this.data, d => d.value)])
      .nice()
      .range([height, 0]);


    const tip = d3Tip();
    tip
      .attr('class', 'd3-tip')
      .html(d => {
        return (
          `${this.options.tooltip.replace('##NAME##', d.name).replace('##VALUE##', this.convert.transform(d.value, 'ABBREVIATE'))}`
        );
      });

    svg.call(tip);
    svg.selectAll('rect').data(this.data).enter().append('rect')
    .attr('id', (d, i) => {
      return this.id + i + 'bar';
    })
    .attr('x', d => xScale(d.name))
    .attr('y', d => {
      return yScale(d.value) > (height - 1) ? (height - 1) : yScale(d.value);
    })
    .attr('height', d => {
      return (yScale(0) - yScale(d.value)) > 1 ? (yScale(0) - yScale(d.value)) : 1;
    })
    .attr('width', xScale.bandwidth())
    .attr('fill', (d, i) => `#${this.colors[i]}`)
    .on('mousemove', (d, i, nodes) => {
      svg.select('#' + this.id + i + 'bar').classed('active', true);
      tip.show(d, nodes[i]);
    })
    .on('mouseout', (d, i, nodes) => {
      svg.select('#' + this.id + i + 'bar').classed('active', false);
      tip.hide(d, nodes[i]);
    });

    svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .attr('class', 'x-line')
    .call(d3.axisBottom(xScale).tickSize(0))
    .selectAll('g')
    .html('')
    .attr('transform', function() {
      // Have to change this logic and this is temporary
      const transform = d3.select(this).attr('transform');
      const firstSplit = transform.split('(');
      const secondSplit = firstSplit[1].split(',');
      secondSplit[0] = (parseInt(secondSplit[0], 10) - 32).toString();
      const secondSplitText = secondSplit.join(',');
      firstSplit[1] = secondSplitText;
      return firstSplit.join('(');
    })
    .data(this.data)
    .append('svg:foreignObject')
    .attr('width', 60)
    .attr('height', 60)
    .attr('y', 5)
    .append('xhtml:div')
    .attr('class', 'graph-check-box')
    // .html(d => `<span><b>${d.name}</b></span><span>${this.convert.transform(d.value, 'ABBREVIATE')}</span>`);
    .html(d => `<input type='checkbox' id='${this.id}${d.name}' class='${d.name}' value='${d.name}'><label for='${this.id}${d.name}'></label><span><b>${d.name}</b><br/>${this.convert.transform(d.value, 'ABBREVIATE')}</span>`);
    // // Have to change the way of adding inputs to svg element
    this.data.forEach(d => {
      const ele = document.getElementById(`${this.id}${d.name}`) as HTMLElement;
      if (ele) {
        ele.addEventListener('click', (event) => this.selectBar(event));
      }
    });
    /** Hided select all checkbox https://intermx.atlassian.net/browse/IMXUIPRD-1318 */
    /*svg.append('g')
    .attr('transform', `translate(-20, ${height})`)
    .append('svg:foreignObject')
    .attr('width', 20)
    .attr('height', 40)
    .append('xhtml:div')
    .attr('class', 'graph-select-all-div')
    .attr('title', 'Deselect All')
    .html(d => `<input type='checkbox' id='${this.id}allCheckBox'><label for='${this.id}allCheckBox'></label>`);*/
    const checkboxEle = document.getElementById(`${this.id}allCheckBox`) as HTMLElement;
    if (checkboxEle) {
      checkboxEle.addEventListener('click', (event) => this.selectAll(event));
    }

    const maxValue = d3.max(this.data.map(d => d.value));
    const sumData = this.data.reduce((a, b) => a + b.value, 0);
    const average = (sumData / this.data.length) || 0;
    const topAxis = d3.axisBottom(xScale).ticks(0).tickSize(0);
    const avgAxis = d3.axisBottom(xScale).ticks(0).tickSize(0);

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

    // add average line
    svg
    .append('g')
    .attr('class', 'avg-line')
    .attr('transform', `translate(0, ${ yScale(average) })`)
    .call(avgAxis)
    .append('text')
    .attr('y', 10)
    .attr('x', -15)
    .attr('transform', 'rotate(0)')
    .attr('fill', '#000')
    .text('Avg')
    .append('tspan')
    .attr('y', 25)
    .attr('x', -15)
    .attr('transform', 'rotate(0)')
    .attr('fill', '#000')
    .text(this.convert.transform(average, 'ABBREVIATE'));

    this.setAllCheckBoxes();
  }

  public selectAll(event) {
    let selectAll = false;
    this.selectedValues = [];
    const checkboxEle = document.getElementById(`${this.id}allCheckBox`) as HTMLElement;
    checkboxEle.classList.remove('intermediate');
    if (event.target.checked) {
      selectAll = true;
      this.selectedValues = this.data.map(item => item.name);
      checkboxEle.parentElement.setAttribute('title', 'Deselect All');
    } else {
      checkboxEle.parentElement.setAttribute('title', 'Select All');
    }
    this.data.forEach(d => {
      const ele = document.getElementById(`${this.id}${d.name}`) as HTMLInputElement;
      if (ele) {
        ele.checked = selectAll;
      }
    });
    this.updateLineChart();
  }

  public selectBar(event) {
    const index = this.selectedValues.findIndex(value => value === event.target.value);
    if (index >= 0) {
      this.selectedValues.splice(index, 1);
    } else {
      this.selectedValues.push(event.target.value);
    }
    /*const checkboxEle = document.getElementById(`${this.id}allCheckBox`) as HTMLInputElement;
    if (this.selectedValues.length === 0) {
      checkboxEle.classList.remove('intermediate');
      checkboxEle.checked = false;
      checkboxEle.parentElement.setAttribute('title', 'Select All');
    } else if (this.selectedValues.length < this.data.length ) {
      checkboxEle.classList.add('intermediate');
      checkboxEle.checked = true;
      checkboxEle.parentElement.setAttribute('title', 'Deselect All');
    } else {
      checkboxEle.classList.remove('intermediate');
    }*/
    this.updateLineChart();
  }
  ngAfterViewInit () {
    setTimeout(() => {
      if (this.data.length > 0) {
        this.loadBarChart();
      }
    }, 500);
  }
  private unsubscribeManualRefresh(): void {
    if (this.manualRefreshSubscription) {
      this.manualRefreshSubscription.unsubscribe();
      this.manualRefreshSubscription = null;
    }
  }
  private clear () {
    const id = '#' + this.id + 'BarChart';
    const svg = d3.select(id);
    svg.selectAll('g').remove();
  }
  ngOnDestroy() {
    this.unsubscribeManualRefresh();
    this.id = null;
  }


  private updateLineChart() {
    const filteredValues = this.lineChartData.
    filter(item => this.selectedValues.includes(item.name.toLowerCase()));
    const parentEle = document.getElementById(`${this.id}BarChart`).parentElement.parentElement.nextSibling.nextSibling as HTMLElement;
    const ele = parentEle.getElementsByClassName('multiLineChart')[0] as HTMLElement;
    let svgId = '';
    let divId = '';
    if (ele) {
      divId = ele.id;
      svgId = ele.firstElementChild.id;
    }
    if (svgId) {
      const data = filteredValues;
      const width =
        this.lineChartConfig.width - this.lineChartConfig.margin.right;
      const height =
        this.lineChartConfig.height -
        this.lineChartConfig.margin.top -
        this.lineChartConfig.margin.bottom;
      const margin = this.lineChartConfig.margin.left + this.lineChartConfig.margin.right;
      const lineOpacity = '0.8';
      const lineOpacityHover = '0.85';
      const otherLinesOpacityHover = '0.1';
      const lineStroke = '1.5px';
      const lineStrokeHover = '2.5px';
      const circleOpacity = '0.85';
      const circleOpacityOnLineHover = '0.25';
      const circleRadius = 3;
      const circleRadiusHover = 6;
      const duration = 250;
      d3.select(`#${svgId}`).selectAll('g').remove();
      const svg = d3.select(`#${svgId}`)
      .attr('width', this.lineChartConfig.width)
      .attr('height', this.lineChartConfig.height)
      .attr('class', 'basic-line-chart')
      .append('g')
      .attr(
        'transform',
        'translate(' + margin + ',' + margin + ')');
      // if (filteredValues.length === 0) {
      //   return;
      // }
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

      const tooltip = d3.select(`#${divId} .d3ChartToolTip`);
      let xDomainValues: any = [];
      if (this.chartName === 'weekly') {
        xDomainValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
      }
      if (data.length) {
        xDomainValues = data[0].values.map(d => d.xData);
      }
      const xScale = d3.scaleLinear()
      // @ts-ignore
      .domain(d3Array.extent(xDomainValues))
      .range([0, width - margin]);

      const yScale = d3.scaleLinear()
        // @ts-ignore
        .domain([0, maxValue])
        .range([height - margin, 0]);

      /* Add line into SVG */
      const line = d3.line()
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
      const xAxis = d3.axisBottom(xScale).ticks(2).tickValues([0, 12, 23]).tickFormat(function(n) {
        // @ts-ignore
        if (typeof n !== 'undefined') {
          if ( n > 0 && n <= 11) {
          return n + 'AM';
          } else if ( n === 0 || n >= 23) {
          return '12 AM';
          } else if (n === 12) {
            return '12 PM';
          } else {
            return (+n - 12) + 'PM';
          }
        }
      });

      const yAxis = d3.axisLeft(yScale).ticks(10);
      const avgAxis = d3.axisBottom(xScale).ticks(0).tickSize(0);
      const topAxis = d3.axisBottom(xScale).ticks(0).tickSize(0);

      svg
        .append('g')
        .attr('class', 'x-axi')
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
      const avgLinePosition = ((sumData / avgLine) - (margin - 20));
      // add average line
      if (data.length) {
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

      const legendsDiv = parentEle.getElementsByClassName('multi-line-legend')[0] as HTMLElement;
      const listDiv = legendsDiv.getElementsByClassName('chart-legends')[0] as HTMLElement;
      listDiv.innerHTML = '';
      let content = '';
      filteredValues.forEach(item => {
        content += `<li> <span style="background-color: ${item.color};"></span> ${item.name}</li>`;
      });
      listDiv.insertAdjacentHTML('beforeend', content);

    } // If block end


  }

  private setAllCheckBoxes() {
    this.data.forEach(d => {
      const ele = document.getElementById(`${this.id}${d.name}`) as HTMLInputElement;
      if (ele) {
        ele.checked = true;
      }
    });
    const checkboxEle = document.getElementById(`${this.id}allCheckBox`) as HTMLInputElement;
    if (checkboxEle) {
      checkboxEle.checked = true;
    }
    this.selectedValues = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  }
}
