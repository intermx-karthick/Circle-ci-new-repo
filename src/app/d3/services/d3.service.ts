import { Injectable } from '@angular/core';
import { GradientColor } from '../../classes/gradient-color';
import { DonutChartData } from '@interTypes/population-intelligence-types';

@Injectable()
export class D3Service {
    constructor() {}
    generateUID() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
   * generate 5 colors using parent color
   * @param color primary or secondary color
   * @param count No of colors required
   */
  public colorGenerater(color: string, count: number) {
    const grad = new GradientColor();
    const colors = grad.generate(color, count);
    return colors;
  }
  convertThousand(value: number | string, round: boolean = false): string {
    if (typeof value === 'number') {
      if (round) {
        value = Math.round(value)
      }
      value = value.toString()
    }
    let decimalIndex = value.indexOf('.')
    return value.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, (m, i) => decimalIndex < 0 || i < decimalIndex ? `${m},` : m)
  }
  /**
   * turn an array of objects into an object grouping the objects by some key value
   * e.g. group students by school
   * input: [StudentA, StudentB, StudentC, StudentD]
   * output: {
   *  'CMU': [studentA, studentB],
   *  'CU-Boulder': [StudentC, StudentD]
   * }
   *
   * @param items an array of things to group
   * @param key the parameter to group by. string|number for simple groups, function for complex. function key(item) { return someGroupIdentifier }
   * @param arrayKey items[key] is an array, group by all values. boolean for simple arrays, string|number for object arrays
   *
   * @return Record<string, any[]> the values grouped by some key
   */
  public groupBy(items: any[], key: string | number | Function, arrayKey: boolean | string | number = false): Record<string, any[]> {
    return items.reduce((groups, item) => {
      if (!item) { // we cannot dereference this, we'll keep it in an undefined group
        groups.undefined = groups.undefined || []
        groups.undefined.push(item)
      }

      if (typeof key === 'function') {
        // key should return some hashable for grouping. common example is to keep multiple fields in a template literal (item => `${item.id}.${item.name}`)
        let useKey = key(item)
        groups[useKey] = groups[useKey] || []
        groups[useKey].push(item)
      } else if (arrayKey && Array.isArray(item[key])) {
        // item[key] should be an array, we'll group it by which keys it has defined
        // this means 1 item can be in two groups
        item[key].forEach(keyItem => {
          if (typeof arrayKey === 'boolean') { // must be true based on if above + this. means that this is a simple array (number, boolean, string) e.g. ['bob', 'bill', 'james']
            groups[keyItem] = groups[keyItem] || []
            groups[keyItem].push(item)
          } else { // this is a complex array. arrayKey is the inner item's identifer e.g. school.students[i].grade (where grade is the arrayKey)
            groups[keyItem[arrayKey]] = groups[keyItem[arrayKey]] || []
            groups[keyItem[arrayKey]].push(item)
          }
        })
      } else { // this is a simple grouping by item[key]
        groups[item[key]] = groups[item[key]] || []
        groups[item[key]].push(item)
      }
      return groups
    }, {})
  }

  /**
   *
   * @param groups the result of a groupBy, structure like: {identifier: [items that match group]}
   * @param valueKey how do we obtain the value from 1 group member. e.g. 'value' or (d => d.morningTotal + d.eveningTotal)
   * @returns the reduced values grouped by their identifier. e.g. { january: 1, february: 42, march: 13, ...}
   */
  private reduceValue(groups: Record<string, any[]>, valueKey: string | number | Function = null): DonutChartData {
    valueKey = valueKey || (d => 1) // default count
    return Object.keys(groups).reduce((chartData: DonutChartData, key) => {
      groups[key].forEach(groupMember => {
        if (typeof valueKey === 'function') {
          chartData[key] = (chartData[key] || 0) + valueKey(groupMember)
        } else {
          chartData[key] = (chartData[key] || 0) + groupMember[valueKey]
        }
      })
      return chartData
    }, {})
  }

  /**
   *
   * @param items items to be grouped and reduced down to some number
   * @param key how do we group the items
   * @param arrayKey if item[key] is an array, how do we identify groups based on array members
   * @param valueKey how do we get a number out of an item
   * @returns
   */
  public groupReduceValue(items: any[], key: string | number | Function, arrayKey: boolean | string | number = null, valueKey: string | number | Function = null): DonutChartData {
    return this.reduceValue(this.groupBy(items, key, arrayKey), valueKey)
  }


  /**
   * converts donut chart data with raw values to percentages of the whole
   *
   * @param data donut chart data as raw values
   * @param round round percentages to be whole numbers
   * @returns donut chart data with values as percentages of the whole
   */
  public donutDataAsPercent(data: DonutChartData, round: boolean = false): DonutChartData {
    let total = Object.values(data).reduce((sum, val) => sum + val, 0)
    return Object.entries(data).sort(([key1, val1], [key2, val2]) => val2 - val1).reduce((newData, [key, value]) => {
      newData[key] = total ? value / total * 100 : 0
      if (round) {
        newData[key] = Math.round(newData[key])
      }
      return newData
    }, {})
  }
}
