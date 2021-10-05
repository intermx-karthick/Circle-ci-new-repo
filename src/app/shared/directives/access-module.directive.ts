import { Directive, OnInit, Input, ElementRef } from '@angular/core';
import {AuthenticationService} from '@shared/services';
@Directive({
  selector: '[appAccessModule]'
})
export class AccessModuleDirective implements OnInit {
  @Input() navModule: string;
  @Input() navSubModule: string;

  constructor(private el:  ElementRef,
              private auth: AuthenticationService) { }
  ngOnInit() {
    const ele = $(this.el.nativeElement);
    const license = this.auth.getModuleAccess(this.navModule);
    if (license['status'] === 'hidden') {
      ele.remove();
    } else if (license['status'] === 'disabled') {
      ele.addClass('module-disable');
    } else if(this.navSubModule && this.navSubModule !== '' && license[this.navSubModule]) {
      if (license[this.navSubModule]['status'] === 'hidden') {
        ele.remove();
      } else if (license[this.navSubModule]['status'] === 'disabled') {
        ele.addClass('module-disable');
      }
    }
  }
}
