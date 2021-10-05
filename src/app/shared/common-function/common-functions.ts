import { AbstractControl } from '@angular/forms';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { isAfter, isBefore, isValid, parse } from 'date-fns';

export function forbiddenNamesValidator(control: AbstractControl) {
  const selection: any = control.value;
  return of(selection !== '' && typeof selection === 'string').pipe(
    map((result) => (result ? { invalid: true } : null))
  );
}


export function usDateFormatValidator(control: AbstractControl) {
  const _parse = (date) => parse(date, 'MM-dd-yyyy', new Date());
  const parsedDate = _parse(control.value);
  const _isBefore = () => isBefore(parsedDate, _parse('12-31-9999'));
  const _isAfter = () => isAfter(parsedDate, _parse('01-01-1000'));
  return isValid(parsedDate) && _isBefore() && _isAfter()
    ? null
    : { dateFormatError: true };
}

export function usAPPDateRangeValidator(control: AbstractControl) {
  const _parse = (date) => parse(date, 'MM-dd-yyyy', new Date());
  const parsedDate = _parse(control.value);
  const _isBefore = () => isBefore(parsedDate, _parse('12-31-2099'));
  const _isAfter = () => isAfter(parsedDate, _parse('01-01-2000'));
  return isValid(parsedDate) && _isBefore() && _isAfter()
    ? null
    : { dateValidationError: true };
}
