import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { CommonService } from '../services/common.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';

@Directive({
  selector: '[authenticate]',
  host: {
    '(click)': 'onClick($event)'
  }
})
export class AuthenticateDirective implements OnInit {
  @Input() module: string;
  @Input() url: string;
  // @HostListener("click", ["$event"]);
  mod_permission: any;
  constructor(
    private el: ElementRef,
    private r: Renderer2,
    private _cService: CommonService,
    private router: Router,
    private auth: AuthenticationService
  ) {}
  ngOnInit() {
    const ele = $(this.el.nativeElement);
    const url = this.router.url;
    /*if(url == this.url)
  	{
  		ele.parent('li').addClass('active');
  		ele.addClass('active');
    }*/
    this.mod_permission = this.auth.getModuleAccess(this.module);
    if (
      this.mod_permission &&
      typeof this.mod_permission.status !== 'undefined'
    ) {
      if (this.mod_permission['status'] === 'active') {
        ele.parent('li').addClass('menu-enabled');
        ele.addClass('menu-enabled');
      } else if (this.mod_permission['status'] === 'disabled') {
        ele.parent('li').addClass('menu-disabled');
        ele.addClass('menu-disabled');
      } else {
        /*ele.parent('li').addClass('menu-hidden');
    		ele.addClass('menu-hidden');*/
        ele.parent('li').remove();
        ele.remove();
      }
    } else {
      ele.parent('li').remove();
      ele.remove();
    }
  }
  public onClick(event: any) {
    if (this.mod_permission['status'] === 'disabled') {
      // disabling error messaging...
      console.log(`blocked access by authenticate directive`);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }
}
