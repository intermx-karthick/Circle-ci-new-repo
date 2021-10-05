import { Directive, Input, ElementRef, HostListener, Renderer2, SimpleChanges, OnChanges, SimpleChange } from '@angular/core';
import { from } from 'rxjs';

@Directive({
  selector: '[tooltip]'
})

export class TooltipDirective implements OnChanges {
  @Input('tooltip') tooltipTitle: string;
  @Input() placement: string;
  @Input() tooltipClass: string;
  @Input() customClass = '';
  @Input() delay: string;
  @Input() tooltipDisabled = false;
  tooltip: HTMLElement;
  // Distance between host element and tooltip element
  offset = 10;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    renderer.addClass(this.el.nativeElement, 'cursor-link');
  }

  @HostListener('mouseenter') onMouseEnter() {
    if (!this.tooltipDisabled) {
      this.renderer.addClass(this.el.nativeElement, 'cursor-link');
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'cursor-link');
    }

    if (!this.tooltip  && this.tooltipTitle !== '' && !this.tooltipDisabled) { this.show(); }
  }
  
  @HostListener('mouseleave') onMouseLeave() {
    if (this.tooltip) { this.hide(); }
  }
  @HostListener('click') onClick() {
    if (this.tooltip) { this.hide(); }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes?.tooltipDisabled) {
      if (this.tooltipDisabled) {
        this.hide();
      }
    }
  }

  show() {
    this.create();
    this.setPosition();
    this.renderer.addClass(this.tooltip, 'ng-tooltip-show');
  }

  hide() {
    try {
      if (this.renderer && document.body !== null && this.tooltip !== null) {
        this.renderer.removeClass(this.tooltip, 'ng-tooltip-show');
        window.setTimeout(() => {
          if (this.renderer && document.body !== null && this.tooltip !== null) {
            this.renderer.removeChild(document.body, this.tooltip);
            this.tooltip = null;
          }
        }, Number(this.delay));
      }
    } catch (e) {
      
    }
  }

  create() {
    this.tooltip = this.renderer.createElement('div');
    const tooltipText = this.renderer.createElement('span');
    tooltipText.innerHTML = this.tooltipTitle;
    this.renderer.appendChild(
      this.tooltip,
      tooltipText // textNode
    );

    this.renderer.appendChild(document.body, this.tooltip);
    // this.renderer.appendChild(this.el.nativeElement, this.tooltip);

    this.renderer.addClass(this.tooltip, 'ng-tooltip');
    this.renderer.addClass(this.tooltip, `ng-tooltip-${this.placement}`);
    if(this.tooltipClass){
      this.renderer.addClass(this.tooltip, `${this.tooltipClass}`);
    }
    if(this.customClass){
      this.renderer.addClass(this.tooltip, `${this.customClass}`);
    }
    this.renderer.setStyle(this.tooltip, '-webkit-transition', `opacity ${this.delay}ms`);
    this.renderer.setStyle(this.tooltip, '-moz-transition', `opacity ${this.delay}ms`);
    this.renderer.setStyle(this.tooltip, '-o-transition', `opacity ${this.delay}ms`);
    this.renderer.setStyle(this.tooltip, 'transition', `opacity ${this.delay}ms`);
  }

  setPosition() {
    // Host element size and position information
    const hostPos = this.el.nativeElement.getBoundingClientRect();

    // size and position information for the tooltip element
    const tooltipPos = this.tooltip.getBoundingClientRect();

    // windows scroll top
    // The getBoundingClientRect method returns the relative position in the viewport.
    // If scrolling occurs, the vertical scroll coordinate value should be reflected on the top of the tooltip element.
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    let top, left;

    if (this.placement === 'top') {
      top = hostPos.top - tooltipPos.height - this.offset;
      left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
    }

    if (this.placement === 'bottom') {
      top = hostPos.bottom + this.offset;
      left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
    }

    if (this.placement === 'left') {
      top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
      left = hostPos.left - tooltipPos.width - this.offset;
    }

    if (this.placement === 'right') {
      top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
      left = hostPos.right + this.offset;
    }

    // If scrolling occurs, the vertical scroll coordinate value should be reflected on the top of the tooltip element.
    this.renderer.setStyle(this.tooltip, 'top', `${top + scrollPos}px`);
    this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
  }
  ngOnDestroy(): void {
    if (this.tooltip) {
      this.hide();
    }
  }
}
