/*
import { Injectable } from '@angular/core';
import { FeederMarketData, TravelerCountData } from '@interTypes/population-intelligence-types';
import { DonutChartData, StackedLineChartData } from '@d3/interfaces/d3-chart-types';
import { ImxUtils } from '../classes/imx-utils';

@Injectable()
export class MapCalculationService {
  private productCalculations = {
    // to prevent code-injection from executing a value string from the `product_config.json` we'll have function definitions here
    target_total: (hoursData, hour) => hoursData.occLocTgt[hour] + hoursData.occNonLocTgt[hour],
    target_nonlocal: (hoursData, hour) => hoursData.occNonLocTgt[hour],
    target_penetration: (hoursData, hour) => {
      let numerator = hoursData.occLocTgt[hour] + hoursData.occNonLocTgt[hour]
      let denominator = hoursData.occ[hour]
      // use Math.min(someVal, 100) to cap at 100, fixing off-by-1 errors in loc + nonLoc !== occ
      return Math.min(numerator / denominator * 100, 100) || 0 // utilize (NaN || 0) === 0
    },
    target_nonlocal_penetration: (hoursData, hour) => (hoursData.occNonLocTgt[hour] / hoursData.occ[hour] * 100) || 0,
  }

  valueFunc(calculationType: string, hour: number | string, hoursData: any): number {
    let calcData = hoursData && hoursData.properties ? hoursData.properties : hoursData
    if (this.productCalculations[calculationType]) {
      return this.productCalculations[calculationType](calcData, hour)
    } else {
      return 0
    }
  }

  /!**
   * @param data data from traveler_counts.json
   * @param takeTop only take the top X results
  *!/
  popularTravelSegments (data: TravelerCountData, takeTop: number = null, limitTimeframe: string = null): DonutChartData {
    let startDate: Date = null
    let endDate: Date = null
    if (limitTimeframe) {
      let [start, end] = limitTimeframe.split('_')
      startDate = ImxUtils.parseDate(start)
      endDate = ImxUtils.parseDate(end)
    }
    let grouped = data.segments.reduce((segmentGroups: Record<string, number>, segment) => {
      let name = segment.imx_segment
      segmentGroups[name] = segmentGroups[name] || 0
      segment.weeks.forEach(weekData => {
        let weekDate = new Date(weekData.we + ' 00:00:00')
        // this could use either arrivals, visits, or unique. I think arrivals makes the most sense
        if (!limitTimeframe || (weekDate >= startDate && weekDate <= endDate)) {
          segmentGroups[name] += weekData.arrivals
        }
      })
      return segmentGroups
    }, {})
    let sorted = Object.entries(grouped).sort(([keyA, valueA], [keyB, valueB]) => {
      return valueB - valueA
    })
    if (takeTop) {
      sorted = sorted.slice(0, takeTop)
    }
    return sorted.reduce((chartData: DonutChartData, [segment, arrivals]) => {
      chartData[segment] = Number(arrivals)
      return chartData
    }, {})
  }

  getFeederMarketTrends (data: FeederMarketData, takeTop: number = null): StackedLineChartData[] {
    let reference: Record<string, number> = {}
    let chartData =  data.segments.reduce((chartPoints: StackedLineChartData[], segment) => {
      let group = segment.dmaid as string
      reference[group] = reference[group] || 0
      segment.weeks.forEach(week => {
        chartPoints.push({ group, name: week.we, value: week.unique })
        reference[group] += week.unique
      })
      return chartPoints
    }, []).sort((a, b) => { // put the most popular groups at the bottom for better visibility
      return reference[b.group] - reference[a.group]
    })
    if (takeTop) {
      let topKeys = Object.keys(reference).slice(0, takeTop)
      chartData = chartData.filter(d => topKeys.includes(d.group))
    }
    return chartData
  }
}
*/
