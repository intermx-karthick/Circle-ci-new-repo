import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import * as numeral from 'numeral';
import { Patterns } from '@interTypes/enums';

/**
 * @description
 *  Number formatter
 *   refer http://numeraljs.com
 */
@Directive({
  selector: '[appNumeral]'
})
export class AppNumeralDirective implements OnInit {
  @Input('min') public MIN: number;
  @Input('max') public MAX: number;
  @Input('length') public MAX_NO_OF_DIGITS: number;
  @Input('format') public FORMAT: string;
  @Input('isDecimal') public FORMATDECIMAL: boolean = false;
  @Input() regex: RegExp = new RegExp(/^[0-9,]+(\.[0-9]*){0,1}$/g);

  // private regex: RegExp = new RegExp(Patterns.NUMERIC);
  private specialKeys: Array<string> = ['Backspace', 'Delete', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  private el: HTMLInputElement;

  constructor(
    private elementRef: ElementRef
  ) {
    this.el = this.elementRef.nativeElement;
  }

  public ngOnInit() {
    this.format(this.el.value);
  }


  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    // Allow Backspace, tab, end, and home keys '-', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    // metaKey For Mac
    if ((this.specialKeys.indexOf(event.key) !== -1) || (event.key === 'v' && event.ctrlKey) || (event.key === 'v' && event.metaKey) || ((event.key === 'x' && event.ctrlKey) || (event.key === 'x' && event.metaKey))) {
      return;
    }
    let next: string = this.getNextValue(event);
    this.preventIfNotNumber(event, next);
    this.preventIfReachedMaxDigits(event, next);
    this.preventIfLesserThanMinimum(event, next);
    this.preventIfLesserThanMaximun(event, next);
  }


  @HostListener('focus', ['$event.target.value'])
  public onFocus(value) {
    if (!isNaN(value)) {
      this.format(value);

      if (this.el.value === '0') {
        this.el.value = null;
      }
    }
  }

  @HostListener('blur', ['$event.target.value'])
  public onBlur(value) {
    value = value.replace(/\,/g, '');
    if (!isNaN(value)) {
      this.format(value);
      if (this.el.value === '0') {
        this.el.value = null;
      }
    }

  }

  private preventIfLesserThanMinimum(event, next) {
    if (this.MIN && numeral(next).value() < Number(this.MIN)) {
      if (event) event.preventDefault();
    }
  }

  private preventIfLesserThanMaximun(event, next) {
    if (this.MAX && numeral(next).value() > Number(this.MAX)) {
      if (event) event.preventDefault();
    }
  }



  private getNextValue(event) {
    let current = this.elementRef.nativeElement.value;
    if(!this.FORMATDECIMAL){
      current = numeral(current).value();
    }
    if (!!current) {
      return this.addStr(String(current), event.key);
    }
    else return event.key;
  }
  addStr(str, stringToAdd){
    return (
      str.substring(0, this.elementRef.nativeElement.selectionStart) +
      stringToAdd +
      str.substring(this.elementRef.nativeElement.selectionEnd, str.length)
    );
  }

  private format(value) {
    if(this.el.value == null || this.el.value == "") return;

    if (String(value).length > 18) {
      value = String(value).slice(0, 18); // more than 21 formatter will crash
    }

    this.el.value = numeral(value).format(this.FORMAT);
  }

  // only for keydown
  private preventIfNotNumber(event, next) {
    if (next && !String(next).match(this.regex)) {
      event.preventDefault();
    }
  }

  private preventIfReachedMaxDigits(event, next) {
    if (this.MAX_NO_OF_DIGITS && String(next).length > this.MAX_NO_OF_DIGITS) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event']) blockPaste(event) {
    // Ensure that it is a number and stop the paste
    if (event.clipboardData.getData('Text').match(/[^\d\.?\d]/)) {
      event.preventDefault();
    }
  }
}
