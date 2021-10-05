import { ClientEstimate } from "app/contracts-management/models/client-estimate.model";
import { AppAutocompleteOptionsModel } from "@shared/components/app-autocomplete/model/app-autocomplete-option.model";
import { EstimateItem } from "app/contracts-management/models/estimate-item.model";
import { Billing } from "app/contracts-management/models/client-estimate.model";
import { PeriodLength } from "app/contracts-management/models/period-length.model";
import * as numeral from 'numeral';
import { parse, isValid, fromUnixTime } from 'date-fns';
import format from 'date-fns/format'
import enUS from 'date-fns/locale/en-US';
export class AddLineItemMapper {
  public static ToEstmatesDropdown(incoming: ClientEstimate[]): AppAutocompleteOptionsModel[] {
    const autocompleteItems: AppAutocompleteOptionsModel[] =  incoming?.map((item: ClientEstimate) => {
      const autocompleteItem: AppAutocompleteOptionsModel = {
        id: item._id,
        value: item.estimateName
      }

      return autocompleteItem;
    })

    return autocompleteItems;
  }

  public static ToEstimateItems(incoming: ClientEstimate): EstimateItem[] {
    const estimateItem: EstimateItem[] = incoming.estimate.map((item) => {
      const estimateItem: EstimateItem = {
        startDate: format(this.convertDateStringToDateInstance(item.startDate), 'MM/dd/yyyy'),
        endDate: format(this.convertDateStringToDateInstance(item.endDate), 'MM/dd/yyyy'),
        estimateNumber: item.etimateId,
        fee: incoming?.billing?.feeBasis?.name,
        commissionBasis: incoming?.billing?.commissionBasis?.name,
        media: incoming?.billing?.media,
        billingComm: fillOohCommFiled(incoming.billing),
        startDateAsDate: this.convertDateStringToDateInstance(item.startDate),
        endDateAsDate: this.convertDateStringToDateInstance(item.endDate)
      }

      return estimateItem;
    })

    return estimateItem;
  }

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

function fillOohCommFiled(billing: Billing) {
  let oohComm: string = ""

  if(!billing || !billing.commissionBasis || !billing.feeBasis) {
    return oohComm;
  }

  if(billing.feeBasis.name === "Commission") {
    const commissionMark = billing.commissionBasis.name.charAt(0);
    oohComm = `${numeral(billing.media).format('0.00')}% ${commissionMark}`

    return oohComm;
  }

  return oohComm;

}