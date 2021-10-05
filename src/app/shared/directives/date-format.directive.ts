import { Directive, ElementRef, HostListener, Input  } from '@angular/core';

@Directive({
  selector: '[appDateFormat]'
})
export class DateFormatDirective {
  // Allow decimal numbers and negative values
 private regex: RegExp = new RegExp(/^[0-9\/]*$/);
 // (\/){1}[0-9]{0,2}(\/){1}[0-9]{0,4}
 // Allow key codes for special events. Reflect :
 // Backspace, tab, end, home
 private specialKeys: Array<string> = [ 'Backspace', 'Delete', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown' ];
  constructor(private el: ElementRef) {}
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Allow Backspace, tab, end, and home keys '-', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    // metaKey For Mac
    if (
      this.specialKeys.indexOf(event.key) !== -1 ||
      (event.key === 'v' && event.ctrlKey) ||
      (event.key === 'v' && event.metaKey) ||
      (event.key === 'x' && event.ctrlKey) ||
      (event.key === 'x' && event.metaKey)
    ) {
      return;
    }
    /**
     * This condition is user to allow only numbers with out checking min and max values
     */
    const current: string = this.el.nativeElement.value;
    const next: string = current.concat(event.key);
    if (next && !this.regex.test(next)) {
      event.preventDefault();
    }
  }
  @HostListener('paste', ['$event']) blockPaste(event) {
    // Ensure that it is a number and stop the paste
    if (!event.clipboardData.getData('Text').match(/^[0-9\/]*$/)) {
      event.preventDefault();
    }
  }
}
