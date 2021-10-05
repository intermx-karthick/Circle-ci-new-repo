import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivateChild, Router } from '@angular/router';
import { AuthenticationService } from '@shared/services/authentication.service';
import { SnackbarService } from '@shared/services/snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class UserPermissionGuard implements CanActivate, CanActivateChild {
  constructor(
    private auth: AuthenticationService,
    private router: Router,
    private snackbarService: SnackbarService
  ) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.canActivateChild(route, state);
  }
  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    let submodule = next.data['submodule'];
    const redirectURL = next.data['redirectURL'];
    if (submodule === 'billingExports') {
      submodule = 'billing_exports';
    } else if (['vendorContract', 'lineItems', 'insertionOrders', 'archivedExports'].indexOf(submodule) !== -1) {
      submodule = 'contract';
    }
    const module_access = this.auth.getUserPermission(submodule);
    if (!module_access) {
      if (redirectURL) {
        this.router.navigateByUrl(redirectURL);
      }
      console.log(`blocked access to ${submodule} by access.guard`);
      this.snackbarService.showsAlertMessage("You don't access for this module.");
      return false;
    }
    
    return true;
  }
  
}
