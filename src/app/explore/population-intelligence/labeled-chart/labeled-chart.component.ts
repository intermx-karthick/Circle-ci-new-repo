import { Component, Input, OnInit, Output, EventEmitter, ContentChild, forwardRef, OnChanges, SimpleChanges } from '@angular/core';
import { ClassLike, MenuOption } from '@interTypes/population-intelligence-types';
/*import { BasicBarChartComponent } from "../basic-bar-chart/basic-bar-chart.component";*/
import { DonutChartComponent } from '../donut-chart/donut-chart.component';
/*import { LineChartComponent } from "../line-chart/line-chart.component";
import { StackedLineChartComponent } from "../stacked-line-chart/stacked-line-chart.component"; */
import { GroupBySettings } from '@interTypes/population-intelligence-types';
import { D3Service } from '@d3/services/d3.service';

@Component({
  selector: 'labeled-chart',
  template: `
    <div class="labeled-chart-container" [ngClass]="wrapperClass">
      <div class="labeled-chart-title" *ngIf="title">
        {{title}}
      </div>
      <hr class="labeled-chart-break">
      <div class="labeled-chart-content">
        <div class="labels">
          <table>
            <tbody (mouseleave)="unhighlight()">
              <tr
                *ngFor="let labelOption of displayLabels; let i = index"
                (mouseenter)="highlight(labelOption, i)"
                [ngClass]="{ highlighted: lastHighlight === i, clickable: clickableLabels }"
                (click)="handleLabelClick(labelOption, i, $event)"
              >
                <td class="label-chart-label">{{labelOption.text}}</td>
                <td class="label-chart-value">{{labelOption.value}}</td>
                <td *ngIf="labelOption.description" class="label-chart-description">
                  {{ labelOption.description }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="chart-container">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./labeled-chart.component.less']
})
export class LabeledChartComponent implements OnInit, OnChanges {
  @Input() title: string = null
  @Input() wrapperClass: ClassLike = null
  @Input() labels: MenuOption[] = null
  @Input() groupBySettings: GroupBySettings = null
  @Input() clickableLabels: boolean = false
  @Output() onLabelClick = new EventEmitter<MenuOption>()
  @Input() chartHighlight: MenuOption | number = null

  // allow us to talk to our child components
  @ContentChild(DonutChartComponent) donutChart: DonutChartComponent
  /*@ContentChild(BasicBarChartComponent) barChart: BasicBarChartComponent
  @ContentChild(LineChartComponent) lineChart: LineChartComponent
  // circular dependencies https://stackoverflow.com/a/42904954/10725504
  @ContentChild(forwardRef(() => StackedLineChartComponent)) stackedLineChart: StackedLineChartComponent*/

  constructor(private d3Service: D3Service) { }

  lastHighlight: any = null
  highlight (label: MenuOption, index: number) {
    if (this.lastHighlight === index) {
      return
    }
    this.lastHighlight = index
    if (this.donutChart) {
      // donut chart is sorted by values, and we know donut chart data is a number based value.
      // we'll find the index using the display labels sorted by value, matching value and text to the one we want
      // this may be wrong IIF two slices have the same name and same value
      let valueSortedIndex = [...this.displayLabels].sort((a: MenuOption, b: MenuOption) => parseFloat(b.value as string) - parseFloat(a.value as string)).findIndex(d => d.value == label.value && d.text == label.text)
      this.donutChart.highlight(valueSortedIndex, false)
    } /*else if (this.barChart) {
      this.barChart.highlight(index)
    } else if (this.lineChart) {
      this.lineChart.highlight(index)
    } else if (this.stackedLineChart) {
      let useGroup = this.groupBySettings && (this.groupBySettings.key === 'group' || this.groupBySettings.useGroup)
      this.stackedLineChart.highlight(index, useGroup)
    }*/
  }
  unhighlight () {
    this.lastHighlight = null
    if (this.donutChart) {
      this.donutChart.unhighlight(false)
    } /*else if (this.barChart) {
      this.barChart.unhighlight()
    } else if (this.lineChart) {
      this.lineChart.unhighlight()
    } else if (this.stackedLineChart) {
      this.stackedLineChart.unhighlight()
    }*/
  }

  public displayLabels: MenuOption[] = []

  ngOnInit () {
    this.updateLabels()
    this.onChartHighlight()
  }

  updateLabels () {
    let showLabels = []
    if (this.labels) {
      showLabels = this.labels
    } else if (this.groupBySettings) {
      let { items, key, arrayKey, valueKey, labelFormat, valueFormat, sortGroups } = this.groupBySettings
      let groups = {}
      if (Array.isArray(items)) {
        groups = this.d3Service.groupReduceValue(items, key, arrayKey, valueKey)
      } else {
        groups = items
      }

      if (sortGroups) {
        if (typeof sortGroups === 'function') {
          // idk why this says sortGroups is not callable when we just checked it's a function
          // @ts-ignore
          groups = Object.keys(groups).sort((a, b) => sortGroups(groups[a], groups[b])).reduce((sortedGroups, key) => {
            sortedGroups[key] = groups[key]
            return sortedGroups
          }, {})
        } else {
          groups = Object.keys(groups).sort((a, b) => groups[a][valueKey] - groups[b][valueKey]).reduce((sortedGroups, key) => {
            sortedGroups[key] = groups[key]
            return sortedGroups
          }, {})
        }
      }

      Object.entries(groups).forEach(([text, value]) => {
        let label = {
          text: labelFormat ? labelFormat(text) : text,
          value: valueFormat ? valueFormat(value) : value
        }
        showLabels.push(label)
      })
    }
    this.displayLabels = showLabels
  }

  ngOnChanges (changes: SimpleChanges) {
    if (changes.labels || changes.groupBySettings) {
      this.updateLabels()
    }
    if (changes.chartHighlight) {
      this.onChartHighlight()
    }
  }

  handleLabelClick (option: MenuOption, index: number, evt: Event) {
    if (this.clickableLabels) {
      this.onLabelClick.emit(option)
    }
  }

  onChartHighlight () {
    let label = null
    let labelIndex = null
    if (typeof this.chartHighlight === 'number') {
      label = this.displayLabels[this.chartHighlight]
      labelIndex = this.chartHighlight
    } else if (this.chartHighlight) {
      label = this.displayLabels.find(o => o.value === (this.chartHighlight as MenuOption).value)
    }
    if (label) {
      this.highlight(label, labelIndex)
    } else {
      this.unhighlight()
    }
  }
}
