import { Directive, Input, ElementRef, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthenticationService } from '@shared/services';

@Directive({
  selector: '[appLicense]'
})
export class ApplicenseDirective {
  audienceLicense = {};
  mod_permission: any;
  allowInventory = '';
  constructor(
    public element: ElementRef,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private auth: AuthenticationService
    ) { }
  @Input()
  set appLicense(val) {
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    this.viewContainer.createEmbeddedView(this.templateRef);
    if (val && val === 'gpInventory') {
      if (this.allowInventory === 'hidden') {
        this.viewContainer.clear();
      }
    } else if (val && val === 'gpAudience') {
      if (this.audienceLicense['status']  === 'hidden') {
        this.viewContainer.clear();
      }
    } else {
      if (this.audienceLicense['status'] === 'hidden') {
        this.viewContainer.clear();
      }
      if (this.allowInventory === 'hidden') {
        this.viewContainer.clear();
      }
    }
  }
}
