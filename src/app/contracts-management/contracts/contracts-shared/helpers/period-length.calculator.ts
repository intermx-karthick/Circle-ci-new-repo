import { InsertionOrderRecord } from "app/contracts-management/models/insertion-order-record.model";
import { PeriodLengthForRecalculation } from "app/contracts-management/models/period-length.model";
import add from 'date-fns/add';
import addQuarters from 'date-fns/addQuarters'
import addYears from 'date-fns/addYears'
import differenceInDays from 'date-fns/differenceInDays'
import differenceInQuarters from 'date-fns/differenceInQuarters';
import differenceInYears from 'date-fns/differenceInYears'
import differenceInMonths from 'date-fns/differenceInMonths'
import * as numeral from 'numeral';
import eachDayOfInterval from 'date-fns/eachDayOfInterval'
import eachMonthOfInterval from 'date-fns/eachMonthOfInterval'
import endOfMonth from 'date-fns/endOfMonth'
import getDate from 'date-fns/getDate'
import set from 'date-fns/set'
import addMonths from 'date-fns/addMonths'
import getDaysInMonth from 'date-fns/getDaysInMonth'
import getDaysInYear from 'date-fns/getDaysInYear'
import { AppAutocompleteOptionsModel } from "@shared/components/app-autocomplete/model/app-autocomplete-option.model";
import { FormControl } from '@angular/forms';
import sub from 'date-fns/sub'
import startOfMonth from 'date-fns/startOfMonth'
import { Helper } from "app/classes";
import { getMonth, getYear } from "date-fns";


interface PeriodLengthValue {
  name: string
  readonly dayCount: number
};
export class PeriodLengthCalculator {

  public static periodLengths: AppAutocompleteOptionsModel[] = [];

  public static formatPeoridLengthData(value) {
    let noOfPeriod = 0;
    if (value > 0) {
      noOfPeriod = value >= 52 ? 52 : value;
    }
    return noOfPeriod;
  }

  public static calculateEndDate(incoming: PeriodLengthForRecalculation, peoridLength: AppAutocompleteOptionsModel[]) {
    const currentPeriodLength = { ...incoming };
    if (!currentPeriodLength.startDate || !currentPeriodLength.periodLength) {
      return currentPeriodLength;
    }

    if (currentPeriodLength.periodLength === 'One-Time') {
      currentPeriodLength.numberOfPeriods = '1';
      if (!currentPeriodLength.endDate) {
        currentPeriodLength.endDate = new Date(currentPeriodLength.startDate);
      }
      return currentPeriodLength;
    }
    // Calculate EndDate assum not enter End date
    const startDate = new Date(currentPeriodLength.startDate);
    const selectedPeriodLength = peoridLength.find(period => period.value.toLowerCase() == currentPeriodLength.periodLength.toLowerCase());

      // Calculate end date
      if (selectedPeriodLength?.unit.toLowerCase() === 'day' || selectedPeriodLength?.unit.toLowerCase() === 'week') {
        // Start Date = 1/25/2021; Period Length (new field): 4 Weeks. # of Periods = 3
        //System shall calculate the End Date = 4/18/2021
        //FORMULA: [start date + (# of periods * DayValue(PeriodLength) - 1] (Start Date + 83 Days = End Date of 4/18/2021)
        const peoridLengthCount = selectedPeriodLength?.unit === 'day' ? Number(selectedPeriodLength?.duration ?? 1) : (Number(selectedPeriodLength?.duration) * 7);
        const dayCount = ((Number(currentPeriodLength.numberOfPeriods) * peoridLengthCount) - 1);
        currentPeriodLength.endDate = add(startDate, { days: dayCount > 0 ? Math.ceil(dayCount) : 0 });

      } else {
        const periodCount = Math.floor(Number(currentPeriodLength?.numberOfPeriods));
        const decimalValue = currentPeriodLength?.numberOfPeriods.toString()?.split(".")[1];

        switch (currentPeriodLength.periodLength) {
          case 'Month':
            const monthDayCheck = [29, 30, 31];
            let monthInterval = [];
            let eDate;
            if (getDate(endOfMonth(startDate)) === getDate(startDate)) {
              eDate = add(startDate, {
                months: periodCount,
              });
              monthInterval = eachMonthOfInterval({
                start: startDate,
                end: eDate
              });
              eDate = endOfMonth(monthInterval[monthInterval.length - 1]);
              eDate = sub(eDate, { days: 1 });
              if (decimalValue && Number(decimalValue) && eDate) {
                const eNextDate = add(eDate, {
                  months: 1,
                });
                const monthDaysCount = getDaysInMonth(eNextDate);
                const dayCount = Math.round(monthDaysCount * Number('0.' + decimalValue));
                eDate = add(eDate, { days: dayCount > 1 ? dayCount : 1 });
              }
            } 
            /* else if (monthDayCheck.includes(getDate(startDate))) {
              const dateOfStartDate = getDate(startDate);
              const monthOfStartDate = getMonth(startDate);
              const yearOfStartDate = getYear(startDate);
              eDate = add(startDate, {
                months: periodCount,
              });
              if (getDate(eDate) < dateOfStartDate && getDate(endOfMonth(eDate)) !== getDate(eDate)) {
                eDate = add(startDate, {
                  days: dateOfStartDate - getDate(eDate),
                });
              }
              // monthInterval = eachMonthOfInterval({
              //   start: startDate,
              //   end: eDate
              // });
              // eDate = endOfMonth(monthInterval[monthInterval.length - 1]);
              eDate = sub(eDate, { days: 1 });
              if (decimalValue && Number(decimalValue) && eDate) {
                const eNextDate = add(eDate, {
                  months: 1,
                });
                const monthDaysCount = getDaysInMonth(eNextDate);
                const dayCount = Math.round(monthDaysCount * Number('0.' + decimalValue));
                eDate = add(eDate, { days: dayCount > 1 ? dayCount : 1 });
              }
            } */
            else {
              if (periodCount > 0) {
                Array.from({ length: periodCount }, (_, i) => i + 1).forEach(element => {
                  monthInterval.push(add(startDate, { months: element }));
                });
                eDate = sub(monthInterval[monthInterval.length - 1], { days: 1 });
              }
              if (decimalValue && Number(decimalValue) && eDate) {
                const monthDaysCount = getDaysInMonth(eDate);
                const dayCount = Math.round(monthDaysCount * Number('0.' + decimalValue));
                eDate = add(eDate, { days: dayCount > 1 ? dayCount : 1 });
              }
            }
            if (eDate) {
              currentPeriodLength.endDate = eDate;
            } else {
              const monthDayCount = getDaysInMonth(startDate);
              let endDate = add(startDate, { days: ((periodCount * monthDayCount) - 1) })
              if (decimalValue) {
                const dayCount = (monthDayCount - 1) * Number('0.' + decimalValue);
                endDate = add(endDate, { days: dayCount > 1 ? dayCount : 1 });
              }
              currentPeriodLength.endDate = endDate;
            }
            break;
          case 'Quarterly':
            let quaterEndDate = add(startDate, { months: 3 });
            let quarterCount = differenceInDays(quaterEndDate, startDate);
            let qEndDate = add(startDate, { days: ((periodCount * quarterCount) - 1) })
            if (decimalValue) {
              const dayCount = (quarterCount - 1) * Number('0.' + decimalValue);
              qEndDate = add(qEndDate, { days: dayCount > 1 ? dayCount : 1 });
            }
            currentPeriodLength.endDate = qEndDate;
            break;
          case 'Annual':
            // let annualEndDate = addYears(startDate,  periodCount);
            const YearDayCount = getDaysInYear(startDate);
            let annualEndDate = add(startDate, { days: ((periodCount * YearDayCount) - 1) })
            if (decimalValue) {
              const dayCount = (YearDayCount - 1) * Number('0.' + decimalValue);
              annualEndDate = add(annualEndDate, { days: dayCount > 1 ? dayCount : 1 });
            }
            currentPeriodLength.endDate = annualEndDate;
            break;
        }
    }
    return currentPeriodLength;
  }

  public static calculatePeriods(incoming: PeriodLengthForRecalculation, peoridLength:AppAutocompleteOptionsModel[]) {
    const currentPeriodLength = { ...incoming };
    if (!currentPeriodLength.startDate || !currentPeriodLength.periodLength) {
      return currentPeriodLength;
    }

    if (currentPeriodLength.periodLength === 'One-Time') {
      currentPeriodLength.numberOfPeriods = '1';
      if(!currentPeriodLength.endDate){
        currentPeriodLength.endDate = new Date(currentPeriodLength.startDate);
      }
      return currentPeriodLength;
    }

    /* User EITHER enters: ”Start Date,” “Period Type” and “# of Periods” (system calculates End Date)
       OR user enters “Start Date”, “End Date” and “Period Length” (system calculates # of Periods)  */
    const selectedPeriodLength = peoridLength.find(period => period.value.toLowerCase() == currentPeriodLength.periodLength.toLowerCase());

      if (currentPeriodLength.endDate) {
        // Calculate no of period value based on end date change;

        /* User creates Campaign with Start Date = 8/10/2020; End Date = 10/4/2020; Period Length (new field): 4 Weeks.
         System shall calculate that Period Quantity = 2.
         System shall display calculated “# of Periods” as a field value within the inventory lines.
         [end date - start date +1 = 56 days. 56 days / 28 days (# of days in a 4 Week period) = 2]
       */
        let startDate = new Date(currentPeriodLength.startDate);
        let endDate = new Date(currentPeriodLength.endDate);
        if (selectedPeriodLength?.unit.toLowerCase() === 'day' || selectedPeriodLength?.unit.toLowerCase() === 'week') {
          const peoridLengthCount = selectedPeriodLength?.unit === 'day' ? Number(selectedPeriodLength?.duration ?? 1) : (Number(selectedPeriodLength?.duration) * 7);
          const dayCount = differenceInDays(endDate, startDate);
          currentPeriodLength.numberOfPeriods = this.formatPeoridLengthData(numeral(((dayCount + 1) / peoridLengthCount)).format('0.[000]')).toString();
        } else {
          //[end date - start date +1]
          let totalDaysCount = differenceInDays(endDate, startDate);
          switch (currentPeriodLength.periodLength) {
            case 'Month':
              const monthDayCheck = [29, 30, 31];
              let monthInterval = [];
              if (monthDayCheck.includes(getDate(startDate))) {
                monthInterval = eachMonthOfInterval({
                  start: startDate,
                  end: endDate
                });
                let actualInterval = [];
                Array.from({ length: monthInterval.length }, (_, i) => i ).forEach(element => {
                  actualInterval.push(add(startDate, { months: element }));
                });
                actualInterval.splice(0,1);
                const preMonthsCount = actualInterval.length - 1;
                const lastMonthDate = actualInterval[actualInterval.length - 1];

                const lastMonthCount = getDaysInMonth(lastMonthDate);
                const startDateMonth = startOfMonth(lastMonthDate);
                let DayDiffCount = differenceInDays(endDate, startDateMonth) + 1;
                if(DayDiffCount<lastMonthCount){
                  ++ DayDiffCount;
                }
                const nofPeorid = preMonthsCount + ((1/lastMonthCount) * DayDiffCount);

                currentPeriodLength.numberOfPeriods = this.formatPeoridLengthData(numeral(nofPeorid).format('0.000')).toString();
              }else{
                monthInterval = eachMonthOfInterval({
                  start: startDate,
                  end: endDate
                });
                let actualInterval = [];

                Array.from({ length: monthInterval.length }, (_, i) => i ).forEach(element => {
                  actualInterval.push(add(startDate, { months: element }));
                });

                const preMonthsCount = actualInterval.length - 1;
                const lastMonthDate = actualInterval[actualInterval.length - 1];
                const lastMonthCount = getDaysInMonth(lastMonthDate);
                let DayDiffCount = differenceInDays(endDate, lastMonthDate) + 1;
                if(DayDiffCount<lastMonthCount){
                  ++ DayDiffCount;
                }
                const nofPeorid = preMonthsCount + ((1/lastMonthCount) * DayDiffCount);
                
                currentPeriodLength.numberOfPeriods = this.formatPeoridLengthData(numeral(nofPeorid).format('0.000')).toString();
              }

              // Month day count based on start date:
             /* const monthDayCount = getDaysInMonth(startDate);
              const monthCount = ((totalDaysCount + 2) / monthDayCount);
              currentPeriodLength.numberOfPeriods = this.formatPeoridLengthData(numeral(monthCount).format('0.000')).toString();*/

              break;
            case 'Quarterly':
              // calculate quartely
              let quaterEndDate = add(startDate, { months:  3 });
              let quarterCount = differenceInDays(quaterEndDate, startDate);
              const quarterPeriod = ((totalDaysCount + 1)/ quarterCount);
              currentPeriodLength.numberOfPeriods = this.formatPeoridLengthData(numeral(quarterPeriod).format('0.000')).toString();
              break;
            case 'Annual':
              // Calculate yearly
              //Year count based on start date
              const YearDayCount = getDaysInYear(startDate);
              const anualPeriodCount = ((totalDaysCount + 1) / YearDayCount);
              currentPeriodLength.numberOfPeriods = this.formatPeoridLengthData(numeral(anualPeriodCount).format('0.000')).toString();
              break;
          }
        }
      return currentPeriodLength;
    }

  }

  public static formatInsertDateRange(dateInterval: Date[], noOfPeorid) {
    let insertionOrderRecords: InsertionOrderRecord[] = []
    dateInterval.slice(0, (noOfPeorid)).forEach(element => {
      const period: InsertionOrderRecord = {
        ioDate: new FormControl(element),
        estimateNumber: null
      }
      insertionOrderRecords.push(period);
    });
    return insertionOrderRecords;
  }

  public static calculateInsertionOrdersDates(incoming: PeriodLengthForRecalculation, peoridLength:AppAutocompleteOptionsModel[]): InsertionOrderRecord[] {
    let insertionOrderRecords: InsertionOrderRecord[] = []
    if (!incoming.numberOfPeriods || !incoming.periodLength || !incoming.startDate) {
      return insertionOrderRecords;
    }

    const currentPeriodLength = { ...incoming };

    let startDate = new Date(currentPeriodLength.startDate);
    let endDate = new Date(currentPeriodLength.endDate);

    const selectedPeriodLength = peoridLength.find(period => period.value.toLowerCase() == currentPeriodLength.periodLength.toLowerCase());

    const peoridLengthCount = selectedPeriodLength?.unit === 'day' ? Number(selectedPeriodLength?.duration ?? 1) : (Number(selectedPeriodLength?.duration) * 7);

    const formatedNoPeriod = Math.ceil(Number(currentPeriodLength.numberOfPeriods)) >= 52 ? 52 : Math.ceil(Number(currentPeriodLength.numberOfPeriods));


    if (selectedPeriodLength?.unit.toLowerCase() === 'day' || selectedPeriodLength?.unit.toLowerCase() === 'week') {
      const stepCount = (peoridLengthCount) > 0 ? (peoridLengthCount) : 1;
      const dayInterval = eachDayOfInterval({
        start: startDate,
        end: endDate
      }, { step: stepCount });
      insertionOrderRecords = [...this.formatInsertDateRange(dayInterval, formatedNoPeriod)];

    } else {
      const period: InsertionOrderRecord = {
        ioDate: new FormControl(startDate),
        estimateNumber: null
      };
      insertionOrderRecords.push(period);
      if(currentPeriodLength.periodLength == 'Month'){
        const monthDayCheck = [29, 30];
        let monthInterval = []; 
        if (getDate(endOfMonth(startDate)) === getDate(startDate)) {
          monthInterval = eachMonthOfInterval({
            start: startDate,
            end: endDate
          });
          monthInterval.slice(0, formatedNoPeriod).forEach((element, index) => {
            const period: InsertionOrderRecord = {
              ioDate: new FormControl(endOfMonth(element)),
              estimateNumber: null
            }
            if (index >0 && (monthInterval.length -1 ) != index) {
              insertionOrderRecords.push(period);
            }
          });
        }
        /* else if (monthDayCheck.includes(getDate(startDate))) {
          monthInterval = eachMonthOfInterval({
            start: startDate,
            end: endDate
          });
          monthInterval.slice(0, formatedNoPeriod).forEach((element, index) => {
            const period: InsertionOrderRecord = {
              ioDate: new FormControl(endOfMonth(element)),
              estimateNumber: null
            }
            if (index >0 && (monthInterval.length -1 ) != index) {
              insertionOrderRecords.push(period);
            }
          });
        } */ 
        else {
          Array.from({ length: formatedNoPeriod-1 }, (_, i) => i + 1).forEach(element => {
            monthInterval.push(add(startDate, { months: element }));
          });
          monthInterval.slice(0, formatedNoPeriod).forEach((element, index) => {
            const period: InsertionOrderRecord = {
              ioDate: new FormControl(element),
              estimateNumber: null
            }
              insertionOrderRecords.push(period);
          });
        }
        //Getting EachMoth End Date
        insertionOrderRecords = [...insertionOrderRecords];
      }else if(currentPeriodLength.periodLength == 'Quarterly' || currentPeriodLength.periodLength == 'Annual'){
          let sequencyMonth = 12
          if (currentPeriodLength.periodLength == 'Quarterly') {
            sequencyMonth = 3;
          }
          let quarterlInterval = [];
          Array.from({ length: formatedNoPeriod }, (_, i) => i + 1).forEach(element => {
            quarterlInterval.push(add(startDate, { months: (element * sequencyMonth) }));
          });
         quarterlInterval.slice(0, formatedNoPeriod).forEach((element, index) => {
            if ((quarterlInterval.length -1 ) != index) {
              const period: InsertionOrderRecord = {
                ioDate: new FormControl(element),
                estimateNumber: null
              }
              insertionOrderRecords.push(period);
            }
          });
          insertionOrderRecords = [...insertionOrderRecords];
      }
    }
    return insertionOrderRecords;
  }
}

