import { ComponentFactoryResolver, Injectable, Injector, ComponentRef } from '@angular/core'
import * as mapboxgl from 'mapbox-gl'
import booleanIntersects from '@turf/boolean-intersects';
import { Feature, Point } from '@turf/helpers';
import * as h3 from 'h3-js'
import { ImxUtils } from '../classes/imx-utils';
import { LineChartOptions } from '@interTypes/population-intelligence-types';

@Injectable()
export class MapPopupService {

  constructor(
    private componentResolver: ComponentFactoryResolver,
    private injector: Injector
  ) { }

  private popup: mapboxgl.Popup = new mapboxgl.Popup({ closeButton: false, anchor: 'bottom-right' })
  private popupGeography: number | string
  private hoverCalc = {
    selectedGeography: null,
    geography: null,
    hours: null,
    featureCount: null,
    type: 'residential'
  }
  private nonlocalComponent: ComponentRef<any> = null
  private nonlocalCache = {
    dma: null,
    demographic: null
  }

  removePopup() {
    this.popup.remove()
    this.popupGeography = null
    if (this.nonlocalComponent) {
      this.nonlocalComponent.destroy()
      this.nonlocalCache = {
        dma: null,
        demographic: null
      }
    }
  }

  calculateResidentialStatistics(page: any, geography) {
    let { map } = page.mapComponent
    let dateRange = page.selectedTimeframe
    let canCalculate = page.timeframeData[dateRange] && page.timeframeData[dateRange].hourly_activity
    if (canCalculate) {
      let activeHour = page.periodMode === 'daily' ? page.scalingHour : page.selectedHour
      // FIXME this can only show what is rendered on screen because it's a vector source...
      // it'd be cool if this would be 100% accurate, but perhaps we can just limit zoom?
      let queriedFeatures = map.querySourceFeatures('zip-codes', {
        sourceLayer: 'default',
        filter: ['==', 'place_id', geography],
      })
      let shouldCalculate =
        geography !== this.hoverCalc.geography ||
        activeHour !== this.hoverCalc.hours ||
        queriedFeatures.length !== this.hoverCalc.featureCount ||
        'resident-analysis' !== this.hoverCalc.type ||
        this.hoverCalc.selectedGeography !== page.selectedGeography
      if (shouldCalculate) {
        this.hoverCalc = {
          selectedGeography: page.selectedGeography,
          geography,
          hours: activeHour,
          type: 'residential-analysis',
          featureCount: queriedFeatures.length,
        }
        let baseStats = {
          cellCount: 0,
          sum: 0,
          sumInside: 0,
          sumOutside: 0,
          min: -1,
          minInside: -1,
          minOutside: -1,
          max: 0,
          maxInside: 0,
          maxOutside: 0,
          dailySum: 0,
          dailySumInside: 0,
          dailySumOutside: 0,
          insidePercent: 0,
          outsidePercent: 0,
          dailyInsidePercent: 0,
          dailyOutsidePercent: 0
        }
        let cellStats = page.timeframeData[dateRange].hourly_activity.reduce((stats, cellContainer) => {
          let cellID = Object.keys(cellContainer)[0]
          // use the centroid pont of the hexagon to avoid double counting on edge overlap
          let cellFeature = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: h3.h3ToGeo(cellID).reverse(),
            }
          } as Feature<Point>
          let hoursData = cellContainer[cellID]
          if (queriedFeatures.some((queryFeature) => booleanIntersects(queryFeature, cellFeature))) {
            stats.sumInside += hoursData[activeHour]
            stats.dailySumInside += hoursData[page.scalingHour]
            if (stats.minInside < 0 || (hoursData[activeHour] > 0 && hoursData[activeHour] < stats.minInside)) {
              stats.minInside = hoursData[activeHour]
            }
            if (hoursData[activeHour] > stats.maxInside) {
              stats.maxInside = hoursData[activeHour]
            }
          } else {
            stats.sumOutside += hoursData[activeHour]
            stats.dailySumOutside += hoursData[page.scalingHour]
            if (stats.minOutside < 0 || (hoursData[activeHour] > 0 && hoursData[activeHour] < stats.minOutside)) {
              stats.minOutside = hoursData[activeHour]
            }
            if (hoursData[activeHour] > stats.maxOutside) {
              stats.maxOutside = hoursData[activeHour]
            }
          }
          // consider caching all the total data as it would not change with different hours or places, only time or a different selected place
          stats.cellCount += 1
          stats.sum += hoursData[activeHour]
          stats.dailySum += hoursData[page.scalingHour]
          if (stats.min < 0 || (hoursData[activeHour] > 0 && hoursData[activeHour] < stats.min)) {
            stats.min = hoursData[activeHour]
          }
          if (hoursData[activeHour] > stats.max) {
            stats.max = hoursData[activeHour]
          }
          return stats
        }, baseStats)
        // now calculate anything that requires the whole picture (averages, percentages)
        cellStats.insidePercent = cellStats.sumInside / cellStats.sum
        cellStats.outsidePercent = cellStats.sumOutside / cellStats.sum
        cellStats.dailyInsidePercent = cellStats.dailySumInside / cellStats.dailySum
        cellStats.dailyOutsidePercent = cellStats.dailySumOutside / cellStats.dailySum
        cellStats.min = cellStats.min < 0 ? 0 : cellStats.min
        cellStats.minInside = cellStats.minInside < 0 ? 0 : cellStats.minInside
        cellStats.minOutside = cellStats.minOutside < 0 ? 0 : cellStats.minOutside
        return cellStats
      }
    }
    return null
  }

  calculateTradeAreaStatistics(page, geography: number | string) {
    let { map } = page.mapComponent
    let dateRange = page.selectedTimeframe
    let canCalculate = page.timeframeData[dateRange] && page.timeframeData[dateRange].hourly_activity
    if (canCalculate) {
      let activeHour = page.periodMode === 'daily' ? page.scalingHour : page.selectedHour
      let queriedFeatures = map.querySourceFeatures('zip-codes', {
        sourceLayer: 'default',
        filter: ['==', 'place_id', geography],
      })
      let shouldCalculate = geography !== this.hoverCalc.geography || activeHour !== this.hoverCalc.hours || queriedFeatures.length !== this.hoverCalc.featureCount || 'trade-area-analysis' !== this.hoverCalc.type || this.hoverCalc.selectedGeography !== page.selectedGeography
      if (shouldCalculate) {
        this.hoverCalc = {
          selectedGeography: page.selectedGeography,
          geography,
          hours: activeHour,
          type: 'trade-area-analysis',
          featureCount: queriedFeatures.length,
        }
        let baseStats = {
          placeCount: 0,
          sum: 0,
          sumInside: 0,
          sumOutside: 0,
          min: -1,
          minInside: -1,
          minOutside: -1,
          max: 0,
          maxInside: 0,
          maxOutside: 0,
          dailySum: 0,
          dailySumInside: 0,
          dailySumOutside: 0,
          insidePercent: 0,
          outsidePercent: 0,
          dailyInsidePercent: 0,
          dailyOutsidePercent: 0
        }
        let placeStats = page.timeframeData[dateRange].hourly_activity.reduce((stats, featureContainer) => {
          let featurePlace = Object.keys(featureContainer)[0] // this is an array of [ { geography: [activity] } ]
          let hoursData = featureContainer[featurePlace]
          if (featurePlace == geography) {
            stats.sumInside += hoursData[activeHour]
            stats.dailySumInside += hoursData[page.scalingHour]
            if (stats.minInside < 0 || hoursData[activeHour] < stats.minInside) {
              stats.minInside = hoursData[activeHour]
            }
            if (hoursData[activeHour] > stats.maxInside) {
              stats.maxInside = hoursData[activeHour]
            }
          } else {
            stats.sumOutside += hoursData[activeHour]
            stats.dailySumOutside += hoursData[page.scalingHour]
            if (stats.minOutside < 0 || hoursData[activeHour] < stats.minOutside) {
              stats.minOutside = hoursData[activeHour]
            }
            if (hoursData[activeHour] > stats.maxOutside) {
              stats.maxOutside = hoursData[activeHour]
            }
          }

          stats.placeCount += 1
          stats.sum += hoursData[activeHour]
          stats.dailySum += hoursData[page.scalingHour]
          if (stats.min < 0 || hoursData[activeHour] < stats.min) {
            stats.min = hoursData[activeHour]
          }
          if (hoursData[activeHour] > stats.max) {
            stats.max = hoursData[activeHour]
          }
          return stats
        }, baseStats)
        // now calculations that require the whole picture (averages, percentages)
        placeStats.insidePercent = placeStats.sumInside / placeStats.sum
        placeStats.outsidePercent = placeStats.sumOutside / placeStats.sum
        placeStats.dailyInsidePercent = placeStats.dailySumInside / placeStats.dailySum
        placeStats.dailyOutsidePercent = placeStats.dailySumOutside / placeStats.dailySum
        placeStats.min = placeStats.min < 0 ? 0 : placeStats.min
        placeStats.minInside = placeStats.minInside < 0 ? 0 : placeStats.minInside
        placeStats.minOutside = placeStats.minOutside < 0 ? 0 : placeStats.minOutside
        return placeStats
      }
    }
  }

  private updateLocalPopup (page, geography: number | string = null, centerOn: mapboxgl.LngLatLike = null) {
    // only show this for non-zero trade-area-analysis
    if (!geography || geography == '0' || !page.selectedGeography || page.selectedGeography == '0' || page.selectedProduct !== 'trade-area-analysis' || page.selectedGeography == geography) {
      return this.removePopup()
    }
    if (centerOn) {
      this.popup.setLngLat(centerOn)
    }
    geography = geography || this.popupGeography
    if (geography) {
      // because of the if statement above, typescript knows this will always return false
      // let cellStats = page.selectedProduct === 'residential-analysis' ? this.calculateResidentialStatistics(page, geography) : this.calculateTradeAreaStatistics(page, geography)
      let cellStats = this.calculateTradeAreaStatistics(page, geography) // so use just this line until we allow residential again
      if (cellStats) {
        this.popupGeography = geography // save this for later
        let displayHour = page.selectedHour == 0 ? 12 : page.selectedHour > 12 ? page.selectedHour - 12 : page.selectedHour
        let displayPeriod = page.selectedHour >= 12 ? 'pm' : 'am'
        let valueText = ''
        let valueIndex = page.activePercentileValues.findIndex((scaleValue) => cellStats.sumInside < scaleValue) - 1
        if (page.legendMode === 'simple') {
          valueText = ['Very low', 'Low', 'Moderate', 'High', 'Very high'][valueIndex] || 'Very low'
        } else if (page.legendMode === 'percentile') {
          valueText = 'the ' + (page.activePercentiles[valueIndex] || 0) * 100 + 'th percentile'
          // true percentage of activity within this block
          // valueText = (cellStats.insidePercent * 100).toFixed(2) + '% of activity'
        } else if (page.legendMode === 'value') {
          valueText = cellStats.sumInside.toString()
        }
        let displayPlaceID = page.selectedGeographyType === 'zips' ? 'ZIP Code ' + geography : page.geographyData['nbhds'][geography].name
        let fromDisplayPlaceID = page.selectedGeographyType === 'zips' ? 'ZIP Code ' + page.selectedGeography : page.geographyData['nbhds'][page.selectedGeography].name
        let activityDisplay = { simple: 'activity', percentile: 'of activity', value: 'relative activity' }[page.legendMode]
        let text = `
          <p style="text-align:center; margin: 0;">
            Residents of ${displayPlaceID} show
            <br>
            <b>${valueText}</b>
            <br>
            ${activityDisplay} in ${fromDisplayPlaceID}
            <br>
            ${page.periodMode === 'daily' ? 'throughout the day' : 'at ' + displayHour + displayPeriod}.
          </p>
        `
        let { map } = page.mapComponent
        this.popup.setHTML(text).addTo(map)
      }
    }
  }

  private calculateNonlocalTradeAreaStatistics(page, geography: number | string) {
    let tradeArea = page.nonlocalTradeAreaData.find(d => Object.keys(d)[0] == geography)
    if (tradeArea) {
      return tradeArea[Object.keys(tradeArea)[0]]
    } else {
      return []
    }
  }

  private updateNonlocalPopup(page, geography: number | string = null, centerOn: mapboxgl.LngLatLike = null) {
    if (!geography || geography == '0' || !page.dmaID || page.dmaID == '0') {
      return this.removePopup()
    }
    if (centerOn) {
      this.popup.setLngLat(centerOn)
    }
    geography = geography || this.popupGeography
    if (geography) {
      if (geography == this.nonlocalCache.dma && page.selectedDemographic == this.nonlocalCache.demographic) {
       return
      } else {
        this.nonlocalCache = {
          dma: geography,
          demographic: page.selectedDemographic
        }
      }
      let chartData = this.calculateNonlocalTradeAreaStatistics(page, geography)
      let chartOptions: LineChartOptions = {
        width: 250,
        height: 100,
        xAxis: true,
        xAxisTilt: true,
        hideDots: true,
        xAxisFormat: (d, i) => {
          if (i % 5 == 0) {
            return d
          } else {
            return ''
          }
        },
        yAxisFormat: d => '',
        yAxis: true,
        xAxisTitle: 'Time',
        yAxisTitle: 'Activity',
        margin: { top: 10, left: 50, right: 10, bottom: 70 }
      }
      // const factory = this.componentResolver.resolveComponentFactory(NonlocalPopupComponent);
      let factory;
      if (this.nonlocalComponent) {
        this.nonlocalComponent.destroy()
      }
      this.nonlocalComponent = factory.create(this.injector)
      this.nonlocalComponent.instance.data = chartData
      this.nonlocalComponent.instance.options = chartOptions
      this.nonlocalComponent.instance.demographic = ImxUtils.displayDemographic(page.selectedDemographic)
      this.nonlocalComponent.instance.fromDma = page.dmaList[geography].name
      this.nonlocalComponent.instance.toDma = page.dmaList[page.dmaID].name
      this.popup.setDOMContent(this.nonlocalComponent.location.nativeElement).addTo(page.mapComponent.map)
      this.popupGeography = geography
      this.nonlocalComponent.changeDetectorRef.detectChanges()
    }
  }

  updatePopup(page, geography: number | string = null, centerOn: mapboxgl.LngLatLike = null) {
    if (page.localMode === 'local') {
      this.updateLocalPopup(page, geography, centerOn)
    } else {
      this.updateNonlocalPopup(page, geography, centerOn)
    }
  }
}
