import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';
import * as numeral from 'numeral';
@Directive({
  selector: '[appNumberFormatter]'
})
export class NumberFormatterDirective implements OnInit {
  private el: HTMLInputElement;
  constructor(
    private elementRef: ElementRef
  ) {
    this.el = this.elementRef.nativeElement;
  }
  ngOnInit() {
    let number;
    number = numeral(this.el.value);
    this.el.value  = number.format('0,0');
    if (this.el.value === '0') {
      this.el.value = null;
    }
  }

  @HostListener('focus', ['$event.target.value'])
  onFocus(value) {
    if (!isNaN(value)) {
      let number;
      number = numeral(value);
      this.el.value  = number.format('0,0');
      if (this.el.value === '0') {
        this.el.value = null;
      }
    }
  }

  @HostListener('blur', ['$event.target.value'])
  onBlur(value) {
    value = value.replace(/\,/g, '');
    if (!isNaN(value)) {
      let number;
      number = numeral(value);
      this.el.value  = number.format('0,0');
      if (this.el.value === '0') {
        this.el.value = null;
      }
    }

  }
}
