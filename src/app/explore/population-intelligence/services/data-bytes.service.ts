import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { ImxUtils } from '../classes/imx-utils'
import { TravelerCountData } from '@interTypes/population-intelligence-types';
import { DonutChartData } from '@interTypes/population-intelligence-types';
import { StackedLineChartData } from '@d3/interfaces/d3-chart-types';

@Injectable()
export class DataByteService {
  constructor (private http: HttpClient) { }

  private loadTrendingDemographics(dmaID: number | string): Promise<TravelerCountData> {
    return ImxUtils.asPromised(this.http.get<TravelerCountData>(`/anytimepop/dma/dma${dmaID}/nonlocal/stats/historical/wd1234567.json`))
  }
  /**
   *
   * @param dmaID which dma are we looking at
   * @param takeTop only take the top N results
   * @param onlyGroups only use data from this string[] or passing this function(string) {return boolean}
   * @returns Promise<DonutChartData> representing the top N demographics in that dma historically
   * while this is currently what is used for prizm segments, it likely will not be in the future
   * the prizm segments look like they will use
   * anytimepop/dma/dma{dmaID}/tradearea/zip/dates{dateRange}/{segment}/pl{zip|nbhd}_wd1234567_hrs.json (local/non-local)
   * then we can use this to find people who arrived on which night, and how long they stayed
   */
  getPrizmSegmentationData(dmaID: number | string, takeTop: number = null, onlyGroups: string[] | ((string) => boolean) = null, dateRange: string = null): Promise<TravelerCountData> {
    return this.loadTrendingDemographics(dmaID)
  }

  getTrendingDemographics(dmaID: number | string, takeTop: number = null, onlyGroups: string[] | ((string) => boolean), dateRange: string = null): Promise<{ data: StackedLineChartData[], scaling: Record<string, number>}> {
    const displayWeek = (yyyymmdd) => `${parseInt(yyyymmdd.slice(5, 7))}/${parseInt(yyyymmdd.slice(8, 10))}/${yyyymmdd.slice(2, 4)}` // yyyy-mm-dd -> d/m/yy
    return this.loadTrendingDemographics(dmaID).then((data: TravelerCountData) => {
      let chartData: StackedLineChartData[] = []
      let startDate = null
      let endDate = null
      if (dateRange) {
        let [sd, ed] = dateRange.split('_')
        startDate = ImxUtils.parseDate(sd)
        endDate = ImxUtils.parseDate(ed)
      }

      let scaling = {}
      let scalingSegment = data.segments.find(seg => seg.imx_segment === 'age_00plus')
      let forWeeks = scalingSegment.weeks.filter(week => {
        let weekDate = new Date(week.we + ' 00:00:00')
        return !dateRange || (weekDate >= startDate && weekDate <= endDate)
      })
      
      forWeeks.forEach((week, index) => {
        // value based scaling
        // scaling[displayWeek(week.we)] = week.arrivals

        // growth based scaling
        if (index < forWeeks.length - 2) {
          let name = displayWeek(forWeeks[index + 2].we)
          let current = forWeeks[index + 2].arrivals
          let previous = forWeeks[index + 1].arrivals
          let furtherPrevious = week.arrivals
          let value = (current + previous / 2) - (previous + furtherPrevious / 2)
          scaling[name] = value
        }
      })

      let grouped: Record<string, {total: number, data: StackedLineChartData[]}> = {}
      data.segments.forEach(segment => {
        let group = segment.imx_segment
        let include = !onlyGroups
        if (onlyGroups && typeof onlyGroups == 'function') {
          include = onlyGroups(group)
        } else if (onlyGroups && Array.isArray(onlyGroups)) {
          include = onlyGroups.includes(group)
        }

        if (include) {
          let forWeeks = segment.weeks.filter(week => {
            let weekDate = new Date(week.we + ' 00:00:00')
            return !dateRange || (weekDate >= startDate && weekDate <= endDate)
          })

          forWeeks.forEach((week, index) => {
            // value based chart
            // let name = displayWeek(week.we)
            // let value = week.arrivals
            // grouped[group] = grouped[group] || {total: 0, data: []}
            // grouped[group].total += value
            // grouped[group].data.push({ group, name, value })
            
            // growth based chart
            // current week + half of previous week - (previous week + half of week prior)
            // requires at least 3 weeks of data to calculate growth for a single week (suggested minimum 5 weeks)
            if (index < forWeeks.length - 2) {
              let name = displayWeek(forWeeks[index + 2].we)
              let current = forWeeks[index + 2].arrivals
              let previous = forWeeks[index + 1].arrivals
              let furtherPrevious = week.arrivals
              let value = (current + previous / 2) - (previous + furtherPrevious / 2)
              grouped[group] = grouped[group] || {total: 0, data: []}
              grouped[group].total += value
              // total * (1 + index * .1) // adjust the values such that the latest weeks have the most impact on the overall value
              grouped[group].data.push({ group, name, value })
            }
          })
        }
      })

      let sorted = Object.entries(grouped).sort(([groupA, dataForA], [groupB, dataForB]) => dataForB.total - dataForA.total).reduce((sortedGroups: Record<string, StackedLineChartData[]>, [group, {data, total}]) => {
        sortedGroups[group] = (sortedGroups[group] || []).concat(data)
        return sortedGroups
      }, {})

      if (takeTop) {
        chartData = [].concat(...Object.values(sorted).slice(0, takeTop))
      } else {
        chartData = [].concat(...Object.values(sorted))
      }
      return Promise.resolve({data: chartData, scaling })
    })
  }
}
