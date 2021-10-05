import { Directive, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { AuthenticationService } from '@shared/services';

@Directive({
  selector: '[appLicenseDisable]'
})
export class LicenseDisableDirective implements OnInit {
  audienceLicense = {};
  mod_permission: any;
  allowInventory = '';
  constructor(public element: ElementRef, private auth: AuthenticationService, private renderer: Renderer2) { }
  ngOnInit() {
    const element = $(this.element.nativeElement);
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    if (this.audienceLicense['status'] === 'disabled') {
      element.addClass('module-disable');
    }
    if (this.allowInventory === 'disabled') {
      element.addClass('module-disable');
    }
  }
}
