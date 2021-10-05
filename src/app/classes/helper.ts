import { MyTel } from '../records-management-v2/telephone/telephone-input/telephone-input.component';
import { format, isValid, parse } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

/**
 * @description
 *  Helper functions class
 */
export class Helper {
  /**
   *
   * @description
   *   To get the unique id
   *
   * @example
   *   Helper.generateUniqueId('name');
   *   name-kadye58y1vjm81vz6he
   *
   * @param extraString - to append extra string with id
   * @param prefix - whether string append to prefix or not
   * @param delimiter - separator name and id
   */
  static generateUniqueId(extraString = '', delimiter = '-', prefix = true) {
    const uid = Date.now().toString(36) + Math.random().toString(36).substr(2);
    return prefix
      ? `${extraString}${delimiter}${uid}`
      : `${uid}${delimiter}${extraString}`;
  }

  /**
   * @description
   *   To remove duplicates in array of primitives  and array of objects
   *
   * @example
   *   Helper.removeDuplicate([{id: 1}, {id: 1}, {id: 2}], 'id');
   *   [ { id: 1 }, { id: 2 } ]
   *
   * @param array - array of data
   * @param id - for array of objects
   */
  static removeDuplicate<T>(array: Array<T>, id = ''): Array<T> {
    // guard
    if (!array) {
      return array;
    }

    if (!id) {
      return array.filter((val, idx) => array.indexOf(val) === idx);
    }
    return array.filter((oVal, idx) => {
      return array.findIndex((iVal) => iVal[id] == oVal[id]) === idx;
    });
  }

  /**
   * @description
   *   Cloning first order keys of object
   * @param data
   */
  static shallowClone(data) {
    if (data) {
      return Array.isArray(data) ? [...data] : { ...data };
    }
  }

  /**
   * @description
   *   Cloning deeply
   *
   * @param data
   */
  static deepClone(data) {
    if (data) {
      return JSON.parse(JSON.stringify(data));
    }
  }

  /**
   * @description
   *  Remove the html element from dom
   *
   * @example
   *    Helper.removeHTMLElementById('submit');
   *
   * @param elId - html element id
   * @return true - if removed else return false
   */
  static removeHTMLElementById(elId: string): boolean {
    const existingStarEl = document.getElementById(elId);
    if (existingStarEl) {
      existingStarEl.remove();
      return true;
    }
    return false;
  }

  /**
   * @description
   *  Remove the html element from dom
   *
   * @example
   *    Helper.isArrayEqual(arrayOne, arrayTwo);
   *
   */

  static isArrayEqual(arrayOne, arrayTwo) {
    if (arrayOne === arrayTwo) {
      return true;
    }
    if (
      arrayOne == null ||
      arrayTwo == null ||
      arrayOne.length !== arrayTwo.length
    ) {
      return false;
    }
    arrayOne = arrayOne.sort();
    arrayTwo = arrayTwo.sort();
    for (let i = 0; i < arrayOne.length; ++i) {
      if (arrayOne[i] !== arrayTwo[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * @description
   *  formatUrlWithParams
   *
   * @param url
   * @param params
   */
  static formatUrlWithParams(url: string, params: ParamsObject) {
    if (url && params) {
      Object.keys(params).forEach((key, index) => {
        if (params[key] && params[key] !== null) {
          let o = '&';
          if (index === 0) {
            o = '?';
          }
          url += `${o}${key}=${params[key]}`;
        }
      });
      return url;
    }
  }
  static makeString(arr, separator = 'and') {
    if (arr.length === 1) {
      return arr[0];
    }
    const firsts = arr.slice(0, arr.length - 1);
    const last = arr[arr.length - 1];
    let str = firsts.join(', ');
    if (last && arr.length > 1) {
      str = str + ' ' +separator+ ' ' + last;
    }
    return str;
  }

  static removeEmptyOrNull(searchData) {
    // Delete null or empty string from the search data;
    Object.keys(searchData).map((key) => {
      if (
        searchData[key] == '' ||
        searchData[key] === null ||
        (typeof searchData[key] === 'string' && searchData[key].trim() == '')
      ) {
        delete searchData[key];
      }
    });
    return searchData;
  }

  static removeEmptyOrNullRecursive(obj) {
    Object.entries(obj).forEach(
      ([key, val]) =>
        (val &&
          typeof val === 'object' &&
          this.removeEmptyOrNullRecursive(val)) ||
        ((val === null || val === '' || val === 'undefined') && delete obj[key])
    );
    return obj;
  }

  static removeEmptyArrayAndEmptyObject(payload) {
    if(!payload) return payload;

    Object.keys(payload).forEach(key => {
      const value = payload[key];
      if (Array.isArray(value) && value.length === 0) {
        delete payload[key];
        return;
      }

      if (!!value && !Array.isArray(value) && typeof value === 'object' && Object.keys(value).length === 0) {
        delete payload[key];
      }
    });

    return payload;
  }

  public static splitValuesInMyTelFormat(value) {
    if (!value) {
      return new MyTel('', '', '');
    }
    const tempVal = value.toString();
    return new MyTel(tempVal.slice(0, 3), tempVal.slice(3, 6), tempVal.slice(6, 10));
  }

  static parseMyTelFCValue(value){

    if (value?.area || value?.area == "") {
      const phoneNumber = value;
      return `${phoneNumber.area}${phoneNumber.exchange}${phoneNumber.subscriber}`;
    }

    return value;
  }

  static removeBooleanType(payload, type: boolean) {
    Object.keys(payload).forEach(key => {
      if (payload[key] === type ) {
        delete payload[key];
      }
    })
    return payload;
  }
  static formatDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return format(date, 'MM/dd/yyyy', {
      locale: enUS
    });
  }

  /**
   * @description
   *   Parsing date string using date fns for save from
   *   the timezone issue.
   *
   * @param dateStr
   * @param makeTimeZero - it will make zero the time hh:mm. pls make sure when using
   * @private
   */
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

  static themeRender(themeClassName: 'intermx-theme-new' | 'intermx-theme-old') {
    const body = document.body;
    if (body.classList.contains(themeClassName)) {
      body.classList.remove(themeClassName);
    } else {
      body.classList.add(themeClassName)
    }
  }
}

interface ParamsObject {
  [k: string]: any;
}
