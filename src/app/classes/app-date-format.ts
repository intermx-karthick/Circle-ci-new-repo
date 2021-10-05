import { MatDateFormats } from '@angular/material/core';

/**
 * @description
 *
 *   Application custom date formates each format should have matchable adapter
 * else it will use Native date adapter in en-GB format
 *
 **/
 export class AppDateFormat {

  public static US: MatDateFormats = {
    parse: {
      dateInput: { month: 'short', day: 'numeric', year: 'numeric' },
    },
    display: {
      dateInput: 'MM.DD.YYYY', // this is for condition matching in adaper it could be anything
      monthYearLabel: 'MMM YYYY',
      dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
      monthYearA11yLabel: {year: 'numeric', month: 'long'},
    },
  };

}
