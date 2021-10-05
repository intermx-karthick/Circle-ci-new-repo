import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot} from '@angular/router';
import {CommonService} from '../services/common.service';
import swal from 'sweetalert2';

@Injectable()
export class MobileViewGuard implements CanActivate, CanActivateChild {
  title: any;
  message: any;
  constructor(private commonService: CommonService) {
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    this.title = route.data.title;
    this.message = route.data.message;
    return this.checkIfMobile();
  }
  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    this.title = route.data.title;
    this.message = route.data.message;
    return this.checkIfMobile();
  }
  private checkIfMobile(): boolean {
    // If not mobile, load the route
    if (!this.commonService.isMobile()) {
      return true;
    }
    swal({
      title: this.title,
      text: this.message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: '#FFFFFF',
      customClass: 'mobile-workspace'
    });
    return false;
  }
}
