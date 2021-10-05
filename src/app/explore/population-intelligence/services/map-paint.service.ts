/*
import { Injectable } from "@angular/core"
import { ImxUtils } from "src/modules/shared/classes/imx-utils"
import { TimeframeData } from "../interfaces/map-types"
import { MapCalculationService } from "./map-calculation.service"

export interface ValueLevelData {
  activePercentiles: number[],
  activePercentileValues: (number | string)[],
  valueLevels: (number | string)[]
}

export interface AnytimePaintData extends ValueLevelData {
  getFillColor: (d: any) => number[]
}
export interface PaintData extends ValueLevelData{
  paint: any[]
}

@Injectable()
export class MapPaintService {
  constructor (private mapCalculation: MapCalculationService) { }

  getValueLevels(values: number[] = null): ValueLevelData {
    let steps = [0, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]
    let activeLevels = [0, 4, 5, 6, 7, 8] // the steps we use to determine the scale
    let valueLevels: (number | string)[] = ['N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']
    if (values) {
      valueLevels = steps.reduce((levels: number[], step: number) => {
        levels.push(
          Math.max(
            values[Math.min(Math.ceil(values.length * step), values.length - 1)],
            (levels[levels.length - 1] || 0) + 0.01
          )
        )
        return levels
      }, [])
    }

    let activePercentiles = activeLevels.map(l => steps[l])
    let activePercentileValues = activeLevels.map(l => valueLevels[l])
    return { activePercentiles, activePercentileValues, valueLevels }
  }

  getAnytimePaint(features: any[], hour: number, scalingHour: number, type: string, colorSequence: string[]): AnytimePaintData {
    if (!features || !features.length) {
      return { getFillColor: (d) => [0, 0, 0, 0], ...this.getValueLevels() }
    }
    let allHours = Array(scalingHour + 1).fill(0).map((z, i) => i)
    let values = features.reduce((valueList, feature) => {
      allHours.forEach(whichHour => {
        valueList.push(this.mapCalculation.valueFunc(type, whichHour, feature))
      })
      return valueList
    }, []).sort((a, b) => a - b)

    let { valueLevels, activePercentiles, activePercentileValues } = this.getValueLevels(values)
    let colorMap = {
      0: ImxUtils.toDeckColor(colorSequence[0]),
      [valueLevels[0]]: ImxUtils.toDeckColor(colorSequence[0]),
      [valueLevels[4]]: ImxUtils.toDeckColor(colorSequence[1]),
      [valueLevels[5]]: ImxUtils.toDeckColor(colorSequence[2]),
      [valueLevels[6]]: ImxUtils.toDeckColor(colorSequence[3]),
      [valueLevels[7]]: ImxUtils.toDeckColor(colorSequence[4]),
      [valueLevels[8]]: ImxUtils.toDeckColor(colorSequence[5]),
    }
    let colorValues = Object.keys(colorMap).map(k => Number(k)).sort((a, b) => b - a)
    const getFillColor = d => {
      let value = this.mapCalculation.valueFunc(type, hour, d)
      let level = colorValues.find(v => value >= v) || 0
      return colorMap[level]
    }
    return { getFillColor, valueLevels, activePercentiles, activePercentileValues }
  }

  getResidentialPaint(hourlyActivity: number[][], periodMode: string, selectedHour: number, scalingHour: number, colorSequence: string[]): PaintData {
    let residentScale = periodMode === 'daily' ? [scalingHour] : Array(scalingHour).fill(0).map((z, i) => i)
    let values = hourlyActivity.reduce((vals, activity) => {
      residentScale.forEach(scaleHour => {
        if (activity[scaleHour]) {
          vals.push(activity[scaleHour])
        }
      })
      return vals
    }, []).sort((a, b) => a - b)
    let { valueLevels, activePercentiles, activePercentileValues } = this.getValueLevels(values)

    let paint = [
      'interpolate',
      ['linear'],
      ['to-number', ['get', `hr${periodMode === 'daily' ? scalingHour : selectedHour}`]],
      0, colorSequence[0],
      valueLevels[0], colorSequence[0],
      valueLevels[4], colorSequence[1],
      valueLevels[5], colorSequence[2],
      valueLevels[6], colorSequence[3],
      valueLevels[7], colorSequence[4],
      valueLevels[8], colorSequence[5]
    ]

    return { paint, valueLevels, activePercentiles, activePercentileValues }
  }

  getTradeAreaPaint(hourlyActivity: number[][], scalingHour: number, timeFrameData: TimeframeData, colorSequence: string[]): PaintData {
    let paint = null
    if (!hourlyActivity || !hourlyActivity.length || !timeFrameData || !timeFrameData.hourly_activity || !timeFrameData.hourly_activity.length) {
      return { paint, ...this.getValueLevels() }
    }
    let values = hourlyActivity.reduce((vals, activity) => {
      if (activity[scalingHour]) {
        vals.push(activity[scalingHour])
      }
      return vals
    }, []).sort((a, b) => a - b)
    let { valueLevels, activePercentiles, activePercentileValues } = this.getValueLevels(values)
    paint = ['match', ['get', 'place_id']]
    timeFrameData.hourly_activity.forEach(homeActivity => {
      let place = parseInt(Object.keys(homeActivity)[0]) || 0
      let dailyActivity = homeActivity[place][scalingHour] || 0
      if (dailyActivity > 0) {
        if (dailyActivity < valueLevels[0]) {
          paint.push(place, colorSequence[0])
        } else if (dailyActivity < valueLevels[4]) {
          paint.push(place, colorSequence[1])
        } else if (dailyActivity < valueLevels[5]) {
          paint.push(place, colorSequence[2])
        } else if (dailyActivity < valueLevels[6]) {
          paint.push(place, colorSequence[3])
        } else if (dailyActivity < valueLevels[7]) {
          paint.push(place, colorSequence[4])
        } else {
          paint.push(place, colorSequence[5])
        }
      }
    })
    paint.push(colorSequence[0])
    return { paint, valueLevels, activePercentiles, activePercentileValues }
  }

  getNonlocalTradeAreaPaint(activity: any, colorSequence: string[]): PaintData {
    let paint = null
    if (!activity || !activity.length) {
      return { paint, ...this.getValueLevels() }
    }
    let values = activity.reduce((vals, dmaActivity) => {
      let dma = Object.keys(dmaActivity)[0]
      dmaActivity[dma].forEach(week => {
        vals.push(week.value)
      })
      return vals
    }, []).sort((a, b) => a - b)
    let { valueLevels, activePercentiles, activePercentileValues } = this.getValueLevels(values)
    paint = ['match', ['get', 'dmaid']]
    activity.forEach(dmaActivity => {
      let dma = Object.keys(dmaActivity)[0] || '0' // this has to be a string
      let avg = dmaActivity[dma].reduce((sum, week) => sum + week.value, 0) / dmaActivity[dma].length
      if (avg < valueLevels[0]) {
        paint.push(dma, colorSequence[0])
      } else if (avg < valueLevels[4]) {
        paint.push(dma, colorSequence[1])
      } else if (avg < valueLevels[5]) {
        paint.push(dma, colorSequence[2])
      } else if (avg < valueLevels[6]) {
        paint.push(dma, colorSequence[3])
      } else if (avg < valueLevels[7]) {
        paint.push(dma, colorSequence[4])
      } else {
        paint.push(dma, colorSequence[5])
      }
    })
    paint.push(colorSequence[0])
    return { paint, valueLevels, activePercentiles, activePercentileValues }
  }
}
*/
