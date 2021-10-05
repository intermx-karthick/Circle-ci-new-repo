import { Directive, OnInit, Input, ElementRef } from '@angular/core';
import { UserRole } from '@interTypes/user-permission';
import { AuthenticationService } from '@shared/services';
@Directive({
  selector: '[appUserAccessPermission]'
})

export class UserAccessPermissionDirective implements OnInit {
  @Input() module: string;
  @Input() visiblityType: string;
  @Input() isAccessDenied: boolean;

  // Fallback module. If the "@Input() module" key/variable is already using for some other directives/purpose,
  // on where do we need to use "appUserAccessPermission" directives. So module name will be misassign
  // So avoiding that module misasing by using "@Input() userPermsModule". as fallback( In other words use userPermsModule instead of module input).
  @Input() userPermsModule: string;

  constructor(private el: ElementRef,
    private auth: AuthenticationService) { }
  ngOnInit() {
    const ele = $(this.el.nativeElement);

    // Fallback module action perform here.
    const module = this.userPermsModule ? this.userPermsModule : this.module;
    const license = this.auth.getUserPermission(module);

    // side nave/parent module access hadle here
    if (module == 'recordsManagement') {
      if (this.disableRecordsModuleAccess()) {
        ele.remove();
      }
      return;
    } else if (module == 'contractManagement' ) {
      if (!this.auth.getUserPermission(UserRole.CONTRACT) && !this.auth.getUserPermission(UserRole.BILLING_EXPORTS)) {
          ele.remove();
      }
      return;
    } else if (module == 'printProduction' ) {
      if (!this.auth.getUserPermission(UserRole.PRINT_PRODUCTION)) {
          ele.remove();
      }
      return;
    }

    // Inner module, action thinks access hadler here.
    if (!!this.isAccessDenied) {
      ele.addClass('hide-user-permission');

    } else if (!license || (license && this.visiblityType !== 'menu' && !(this.visiblityType in license))) {
      ele.remove();
    }
  }

  disableRecordsModuleAccess() {
    return (!this.auth.getUserPermission(UserRole.CLIENT_GENERAL) && !this.auth.getUserPermission(UserRole.VENDOR_GENERAL)
      && !this.auth.getUserPermission(UserRole.AGENCIES) && !this.auth.getUserPermission(UserRole.CONTACTS));
  }
}
