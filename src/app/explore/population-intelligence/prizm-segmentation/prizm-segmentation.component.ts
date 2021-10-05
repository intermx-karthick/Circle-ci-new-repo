import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from "@angular/core"
import { ActivatedRoute, Router } from '@angular/router'
import { MenuOption } from '@interTypes/population-intelligence-types';
import { DonutChartData, DonutChartOptions } from '@interTypes/population-intelligence-types';
import { DataByteService } from '../services/data-bytes.service';
import * as numeral from 'numeral'
import { ImxUtils } from '../classes/imx-utils';
import { TravelerCountData } from '@interTypes/population-intelligence-types';

@Component({
  selector: 'prizm-segmentation',
  template: `
    <div  *ngIf="prizmDataReady; else noData">
      <labeled-chart
        [labels]="chartLabels"
        [ngClass]="{'hide-bar': !withBar}"
        [clickableLabels]="clickableLabels"
        (onLabelClick)="onLabelClick.emit($event)"
        [chartHighlight]="chartHighlight"
      >
        <donut-chart
          [data]="prizmData"
          [options]="chartOptions"
          (onHighlight)="onChartHighlight($event)"
        ></donut-chart>
      </labeled-chart>
    </div>
    <ng-template #noData>
      Loading data...
    </ng-template>
  `,
  styleUrls: ['./prizm-segmentation.component.less']
})
export class PrizmSegmentationComponent implements OnInit, OnChanges {
  @Input() withBar: boolean = false
  @Input() showSegments: string[] | ((d: string) => boolean)
  @Input() clickableLabels: boolean = false

  @Output() onLabelClick = new EventEmitter<MenuOption>()
  @Output() onDataLoad = new EventEmitter<TravelerCountData>()

  private dmaID: number | string = 535 // zip code?
  private dateRange: string = null // '20210101_20210131'
  // probably this link
  // /anytimepop/dma/dma535/tradearea/zip/dates20200401_20200430/{segment}/pl43001_wd1234567_hrs.json (local/non-local)
  // currently
  // /anytimepop/dma/dma${dmaID}/nonlocal/stats/historical/wd1234567.json
  prizmData: DonutChartData = null
  prizmDataReady: boolean = false
  dataWeeks: MenuOption[] = []
  chartOptions: DonutChartOptions = {
    width: 300,
    height: 300,
    margin: { left: 10, right: 10, bottom: 10, top: 10 }
  }
  chartLabels: MenuOption[] = []
  chartHighlight: MenuOption | number = null

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dataByte: DataByteService
  ) { }

  ngOnInit() {
    // TODO: Need to change this into non-URL based code by passing Input and output
    // redraw any time the queryParams change (nested in map)
    this.route.queryParams.subscribe(params => {
      this.readUrl(params)
      this.getChartData()
    })
  }

  /**
   *
   * @param params url parameters from this.route.queryParams
   * png: asImage
   * d: dma
   * t: time frame/date range
   */
  readUrl(params): void {
    if (params.d) {
      this.dmaID = params.d
    }
    if (params.t) {
      this.dateRange = params.t
    }
  }

  ngOnChanges (changes: SimpleChanges) {
    if (changes.showSegments) {
      this.getChartData()
    }
  }

  private cachedDmaID = null
  private cachedData: TravelerCountData = null
  getChartData() {
    this.prizmDataReady = false
    this.dataWeeks = [{ value: null, text: 'All weeks' }]
    if (this.cachedDmaID === this.dmaID && this.cachedData) {
      this.setChartData(this.cachedData)
      this.prizmDataReady = true
    } else {
      this.dataByte.getPrizmSegmentationData(this.dmaID).then(data => {
        this.setChartData(data)
        this.cachedData = data
        this.cachedDmaID = this.dmaID
      }).catch(error => {
        this.cachedData = null
      }).finally(() => {
        this.prizmDataReady = true
      })
    }
  }

  setChartData(data: TravelerCountData) {
    let takeTop = 10
    let grouped = data.segments.reduce((segmentGroups: Record<string, number>, segment) => {
      let name = segment.imx_segment
      let startDate = null
      let endDate = null
      if (this.dateRange) {
        let [sd, ed] = this.dateRange.split('_')
        startDate = ImxUtils.parseDate(sd)
        endDate = ImxUtils.parseDate(ed)
      }
      // we may be filtering the data to only include these groups
      let include = name.includes('pz_') // default behavior
      if (this.showSegments) { // component specified groups
        if (typeof this.showSegments === 'function') {
          include = this.showSegments(name)
        } else {
          include = this.showSegments.includes(name)
        }
      }
      if (include) {
        segment.weeks.forEach(weekData => {
          if (!this.dataWeeks.find(option => option.data === weekData.we)) {
            let weekEnd = new Date(weekData.we + ' 00:00:00')
            let weekStart = new Date(weekData.we + ' 00:00:00')
            weekStart.setDate(weekEnd.getDate() - 6)
            let value = `${ImxUtils.toRange(weekStart)}_${ImxUtils.toRange(weekEnd)}`
            let text = weekStart.toLocaleDateString() + ' - ' + weekEnd.toLocaleDateString()
            this.dataWeeks.push({ text, value, data: weekData.we })
          }

          let weekDate = new Date(weekData.we + ' 00:00:00') // use to limit date range
          if (!this.dateRange || (weekDate >= startDate && weekDate <= endDate)) {
            // this could use arrivals, visits, or unique. other datasets have only unique, so we'll use that for now
            segmentGroups[name] = (segmentGroups[name] || 0) + weekData.unique
          }
        })
      }
      return segmentGroups
    }, {})

    let sorted: [string, number][] = Object.entries(grouped).sort(([keyA, valueA], [keyB, valueB]) => {
      return valueB - valueA
    })
    if (takeTop) {
      sorted = sorted.slice(0, takeTop)
    }
    let chartData = sorted.reduce((chartData: DonutChartData, [segment, unique]) => {
      // put the object keys in order
      chartData[segment] = unique
      return chartData
    }, {})

    if (this.dateRange && !this.dataWeeks.find(option => option.value === this.dateRange)) {
      let [ds, de] = this.dateRange.split('_')
      let dateStart = ImxUtils.parseDate(ds)
      let dateEnd = ImxUtils.parseDate(de)
      this.dataWeeks.push({ text: dateStart.toLocaleDateString() + ' - ' + dateEnd.toLocaleDateString(), value: this.dateRange })
    }

    this.prizmData = chartData
    let total = Object.values(this.prizmData).reduce((sum, val) => sum + val, 0)
    this.chartLabels = Object.entries(this.prizmData).reduce((options: MenuOption[], [text, dataValue]) => {
      let value = `${(dataValue / total * 100).toFixed(1)}%`
      let description = numeral(dataValue).format('0.0a')
      options.push({ text: ImxUtils.displayDemographic(text), value, description, data: text })
      return options
    }, [])
    this.onDataLoad.emit(data)
  }

  updateSelectedDataWeek(newWeek) {
    this.dateRange = newWeek
    this.setChartData(this.cachedData)
  }

  onChartHighlight(option: MenuOption) {
    // option with { text: object key, value: index }
    this.chartHighlight = option ? option.value as number : null
  }
}
