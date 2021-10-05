import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';

export class CustomValidators {
  public static ZIP_CODE_REG_EX = /^\d{5}(?:[-\s]\d{4})?$/;

  static vaildPassword(c: FormControl): ValidationErrors {
    const password = c.value;
    const reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/;
    let isValid = true;
    const message = {
      vaildPassword: {
        // tslint:disable-next-line:max-line-length
        message:
          'Passwords must be at lease 8 characters and contain at least one:capital letter,lower case letter,number, or symbol(-+_!@#$%^&*.,?).'
      }
    };
    if (reg.test(password)) {
      isValid = true;
    } else {
      isValid = false;
    }
    return isValid ? null : message;
  }

  static vaildEmail(c: FormControl): ValidationErrors {
    const email = c.value;
    const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    let isValid = true;
    const message = {
      vaildEmail: {
        message: 'Should be valid email.'
      }
    };
    if (reg.test(email)) {
      isValid = true;
    } else {
      isValid = false;
    }
    return isValid ? null : message;
  }

  static multipleEmailValidate(control: FormControl): ValidationErrors {
    let isValid = true;
    const emails = control.value?.split(';').map((e) => e.trim());
    isValid = emails?.some((email) => Validators.email(new FormControl(email)));
    const message = {
      vaildEmail: {
        message: 'Should be valid email.'
      }
    };
    return isValid ? message : null;
  }

  static isCSV(c: FormControl): ValidationErrors {
    const fileName = c.value;
    const reg = /([a-zA-Z0-9\s_\\.\-\(\):])+(.csv)$/;
    let isValid = true;
    const message = {
      inValidFile: {
        message: 'Should be CSV file.'
      }
    };
    if (reg.test(fileName)) {
      isValid = true;
    } else {
      isValid = false;
    }
    return isValid ? null : message;
  }

  static validUrl(c: FormControl): ValidationErrors {
    const url = c.value;
    const reg = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
    //const reg = /^(http|https):\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
    let isValid = true;
    const message = {
      validUrl: {
        message: 'Should be valid Url.'
      }
    };
    if (reg.test(url) || !url) {
      isValid = true;
    } else {
      isValid = false;
    }
    return isValid ? null : message;
  }

  static noWhitespaceValidator(isRequired:boolean = true){
    return (control: FormControl): ValidationErrors => {
      const trimmed = control.value?.trim();
      if (trimmed?.length <= 0 && isRequired) {
        return { whitespace: true };
      } else {
        if(trimmed?.length <= 0 && !isRequired && control.value?.length>0){
          return { whitespace: true };
        }
        return null;
      }
    };
  }

  static validDateRange(startKey: string, endKey: string): ValidationErrors {
    return (formGroup: FormGroup) => {
      const fromDate = formGroup.controls[startKey];
      const toDate = formGroup.controls[endKey];
      // if both dates are not present
      if (!fromDate.value && !toDate.value) {
        return null;
      }
      // if both dates are present
      if (fromDate.value && toDate.value) {
        const d_startDate = new Date(fromDate.value);
        const d_endDate = new Date(toDate.value);
        if (d_startDate >= d_endDate) {
          return {
            dates: 'Start Date should be less than End Date'
          };
        } else {
          return null;
        }
      }
      // if either one date is present
      if (toDate.touched && toDate.value === 'null') {
        return {
          dates: 'Both start and end date must be entered or left blank'
        };
      }
    };
  }

  static validRange(min: string, max: string): ValidationErrors {
    return (formGroup: FormGroup) => {
      const min_value = Number(formGroup.controls[min].value);
      const max_value = Number(formGroup.controls[max].value);
      if (min_value > max_value && max_value !== 0) {
        return {
          errors: 'Max value should be greater than min value.'
        };
      }
    };
  }

  static validNumberRange(min: string, max: string): ValidationErrors {
    return (formGroup: FormGroup) => {
      if (
        formGroup.controls[min].value !== '' &&
        formGroup.controls[min].value !== null &&
        formGroup.controls[max].value !== '' &&
        formGroup.controls[max].value !== null
      ) {
        const min_value = Number(formGroup.controls[min].value);
        const max_value = Number(formGroup.controls[max].value);
        if (min_value > max_value) { 
          return {
            errors: 'Max value should be greater than min value.'
          };
        }
      } else {
        return null;
      }
    };
  }

  static minmax(min: string, max: string): ValidationErrors {
    return (formGroup: FormGroup) => {
      const min_value = Number(formGroup.controls[min].value);
      const max_value = Number(formGroup.controls[max].value);
      if (min_value > 24 || min_value < 0) {
        return {
          errors: 'Min value should be between 0 to 24'
        };
      }
      if (max_value > 24 || max_value < 0) {
        return {
          errors: 'Max value should be between 0 to 24'
        };
      }
    };
  }

  static validSelectProject(fieldKey: string): ValidationErrors {
    return (formGroup: FormGroup) => {
      const project = formGroup.controls[fieldKey].value;
      if (project && !project?.id && !project?._id) {
        formGroup.controls[fieldKey].setErrors({
          type: 'projectNotSelcted',
          message: 'Please select from the drop down list.'
        });
      }
      return null;
    };
  }

  static telephoneInputValidator(control: AbstractControl) {
    let selection: any = control.value;

    // if no value it will be empty string
    if (typeof selection === 'string') {
      return null;
    }

    // according to telephone input component the value will be undefined, when error came.
    return typeof selection === 'undefined'? { invalid: true } : null;
  }

  static invoiceInputValidator(control: AbstractControl) {
    let selection: any = control.value;
    // if no value it will be empty string
    if (typeof selection === 'string') {
      return null;
    }
    return typeof selection === 'undefined'? { invalid: true } : null;
  }

  static validateZipCode(control: AbstractControl): ValidationErrors {
    if (!(control.dirty || control.touched)) return;
    if (!control.value) return;
    const result = CustomValidators.ZIP_CODE_REG_EX.test(control.value);
    if (!result) return {
      validZipcode: { message: 'Zipcode should be valid' }
    };
  }

}
