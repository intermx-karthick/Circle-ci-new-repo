import { NativeDateAdapter } from '@angular/material/core';
import { Injectable } from "@angular/core";

/**
 * @description
 *  us date adapter only for mat date picker component
 *
 * @example
 * use it module or component provider with dateInput condition matched
 * date fromats as follows
 * {
 *  provide: DateAdapter, useClass: AppUSDateAdapter // custom date adapter
 * },
 * {
 *   provide: MAT_DATE_FORMATS, useValue: AppDateFormat.US
 * },
 * */
@Injectable()
export class AppUSDateAdapter extends NativeDateAdapter {

  /**
   * @description
   *   parsing us formated date into date object
   * if date format is not matched it will throw null
   * so matdatepicker shows label color in red
   *
   * @param value - date string
   */
  parse(value: any): Date | null {

    // month and date should min 1, 2 length and year 4 length
    // and matching separator
    const dateReg = /^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/;
    const dateSeparatorReg  = /[./-]/; // - . / allowed in date seperator

    if ((typeof value === 'string') && value.match(dateReg)) {

      const str = value.split(dateSeparatorReg);

      if (Number(str[0]) > 12) { // 1st section consider as month.
        const temp = str[0];
        str[0] = str[1];  // swapping 24/02/2002 -> 02/24/2002
        str[1] = temp;
      }

      const year = Number(str[2]);
      const date = Number(str[1]);
      const month = Number(str[0]) - 1;
      return new Date(year, month, date);
    }

    // When user typing wrong formate trying to parse like 02262000 -> 02/26/2000
    const timestamp = typeof value === 'number' ? value : Date.parse(value);
    return isNaN(timestamp) ? null : new Date(timestamp);

  }

  /**
   * @description
   *   Formatting date to mm/dd/yyyy for displaying the date
   */
  format(date: Date, displayFormat: string): string {

    if (displayFormat === 'MM.DD.YYYY') { // when date selecting or typing
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return this.to2digit(month) + '/' + this.to2digit(day) + '/' + year;
    } else if (displayFormat === 'MMM YYYY') { // when year and month selecting
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return this.to2digit(month) + '/' + year;
    } else {
      return date.toDateString(); // if something happend
    }

  }

  /**
   * @description
   *   Appending 0 if num length is 1
   * @param n
   */
  private to2digit(n: number) {
    return ('00' + n).slice(-2);
  }

}
