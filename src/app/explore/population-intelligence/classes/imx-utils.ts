import { Observable } from 'rxjs'
import { PrizmSegments } from './prizm-segments'

// static class helpers to be used throughout the map
export class ImxUtils {
  // converts an observable (http request for example) into a promise returning the same result
  static asPromised<T>(observable: Observable<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      observable.subscribe(resolve, reject)
    })
  }

  // Converts an rgba(r,g,b,a) string into an array of 4 values to be used with deck.gl for coloring
  static toDeckColor(rgba: string): number[] {
    let colors = rgba.replace('rgba(', '').replace(')', '').split(',').map(n => parseFloat(n))
    // deck opacity was too intense, so we'll only make it to 200 instead of 255
    colors[colors.length - 1] = parseFloat((colors[colors.length - 1] * 199).toFixed(1))
    return colors
  }

  static parseDate(yyyymmdd: string): Date {
    let year = parseInt(yyyymmdd.slice(0, 4))
    let month = parseInt(yyyymmdd.slice(4, 6)) - 1 // month is 0-11, not 1-12
    let day = parseInt(yyyymmdd.slice(6, 8))
    return new Date(year, month, day)
  }

  static toRange (date: Date): string {
    let year = date.getFullYear()
    let month = (date.getMonth() + 1).toString()
    let day = date.getDate().toString()
    if (month.length < 2) {
      month = '0' + month
    }
    if (day.length < 2) {
      day = '0' + day
    }
    return `${year}${month}${day}`
  }

  static displayDemographic(demographic: string): string {
    let display = ''
    if (!demographic) {
      return display
    }
    if (demographic.startsWith('hisp_')) {
      display += 'Hispanic, '
      if (demographic === 'hisp_esp_dependent') {
        display += 'Spanish Dependent'
      }
      demographic = demographic.replace('hisp_', '')
    }
    if (demographic.startsWith('hhi_')) {
      if (!display.length) {
        display += 'Household Income '
      } else {
        display += 'HHI '
      }
      demographic = demographic.replace('hhi_', '')
      if (demographic.includes('t')) {
        let [low, high]: (number | string)[] = demographic.split('t')
        low = parseInt(low)
        high = parseInt(high)
        display += `$${low}${low ? 'k' : ''} - ${high}k`
      } else {
        let value = parseInt(demographic)
        display += value ? `> $${value}k` : '> $0'
      }
    }
    if (demographic === 'age_00plus') {
      display += 'All persons'
    } else if (demographic.startsWith('age_')) {
      display += 'Age '
      demographic = demographic.replace('age_', '')
      if (demographic.includes('t')) {
        let [low, high]: (number | string)[] = demographic.split('t')
        low = parseInt(low)
        high = parseInt(high)
        display += `${low} - ${high}`
      } else {
        display += `${parseInt(demographic)}+`
      }
    }

    if (demographic.startsWith('pz_')) {
      display += PrizmSegments.displaySegment(demographic)
    }

    return display
  }
}
