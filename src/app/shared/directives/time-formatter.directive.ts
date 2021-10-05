import { Directive, HostListener, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[timeFormatter]'
})
export class TimeFormatterDirective {
  private el: HTMLInputElement;

  constructor(private elementRef: ElementRef, private control : NgControl) {
    this.el = this.elementRef.nativeElement;
  }
  @HostListener('keyup', ['$event'])
  onKeyUp(event) {
    let e = <KeyboardEvent>event;
    let value = e?.target['value'];
    value = value.replace(/:/g, '');
    value = value.replace(/\d(?=(?:\d{2})+(?:\.|$))/g, (m, i) => `${m}:`);
    this.control.control.setValue(value);
  }
}
