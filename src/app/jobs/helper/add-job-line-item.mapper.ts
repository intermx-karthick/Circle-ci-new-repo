import { ClientEstimate } from "app/contracts-management/models/client-estimate.model";
import { AppAutocompleteOptionsModel } from "@shared/components/app-autocomplete/model/app-autocomplete-option.model";
import { EstimateItem } from "app/contracts-management/models/estimate-item.model";
import { Billing } from "app/contracts-management/models/client-estimate.model";
import { PeriodLength } from "app/contracts-management/models/period-length.model";
import * as numeral from 'numeral';
import { parse, isValid, fromUnixTime } from 'date-fns';
import format from 'date-fns/format'
import enUS from 'date-fns/locale/en-US';
export class AddJobLineItemMapper {
  

  public static format(value, format) {
    if(value == null || value == "") return value;

    if (String(value).length > 18) {
      value = String(value).slice(0, 18); // more than 21 formatter will crash
    }

    value = numeral(value).format(format);
    return value;
  }

  public static convertDateStringToDateInstance(dateStr, makeTimeZero = true) {
    if (!dateStr) {
      return;
    }

    const FORMATS = [
      'yyyy/MM/dd',
      'yyyy-MM-dd',
      'MM-dd-yyyy',
      'MM/dd/yyyy',
      'dd-MM-yyyy',
      'dd/MM/yyyy',
      'MM-dd-yyyy',
      'MM/dd/yyyy'
    ]; // for checking multiple format if anything failed. currently 'yyyy/MM/dd' comes from api
    let dateIns: Date;

    try {

      FORMATS.some((formatStr) => {
        dateIns = parse(dateStr, formatStr, new Date(), {
          locale: enUS
        });

        if (isValid(dateIns)) {
          return true;
        }
      });

      if (!makeTimeZero) {
        return dateIns;
      }
      dateIns.setHours(0);
      dateIns.setMinutes(0);
      dateIns.setMilliseconds(0);
    } catch (e) {
      console.log(e);
      return dateIns;
    }

    return dateIns;
  }

  public static ToPeriodLength(incoming: PeriodLength[]): AppAutocompleteOptionsModel[] {
    const autocompleteItems: AppAutocompleteOptionsModel[] =  incoming?.map((item) => {
      const autocompleteItem: AppAutocompleteOptionsModel = {
        id: item._id,
        value: item.label,
        duration:item.duration,
        unit:item.unit
      }

      return autocompleteItem;
    })

    return autocompleteItems;
  }
}
