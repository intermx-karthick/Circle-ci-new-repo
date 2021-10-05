import { Pipe, PipeTransform } from '@angular/core';
import isValid from 'date-fns/isValid';
import formatRelative from 'date-fns/formatRelative';
import enUS from 'date-fns/locale/en-US';
import format from 'date-fns/format';

@Pipe({
  name: 'dateAgo'
})

export class DateAgoPipe implements PipeTransform {
  transform(value: any, type='old',  ...args: any[]): any {
    // Ref Link : https://date-fns.org/v2.0.0-alpha.37/docs/I18n-Contribution-Guide#formatrelative
    const formatRelativeLocale = {
      yesterday: "HH:mm 'Yesterday'",
      today: "HH:mm 'Today'",
      other: "MMM, d yyyy",
      lastWeek: "MMM, d yyyy",
      tomorrow: "HH:mm 'Tomorrow'",
      nextWeek: "MMM, d yyyy",
    };
    const locale = {
      ...enUS,
      formatRelative: (token) => formatRelativeLocale[token],
    };
    if (isValid(new Date(value))) {
      if(type === 'old'){
      return formatRelative(new Date(value), new Date(), { locale });
      } else {
        return `${format(new Date(value), "hh:mm a")} <br> ${format(new Date(value), "MM-dd-yyyy")}`
      }
      
    } else {
      return '';
    }
  }
}
