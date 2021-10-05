import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ThemeService } from '@shared/services';

@Injectable()
export class PublicSiteRedirctGaurd implements CanActivate {
  constructor(private theme: ThemeService, private router: Router) { }
  canActivate(): boolean {
      const themesettings = this.theme.getThemeSettings();
    if (themesettings && themesettings['publicSite']) {
      this.router.navigateByUrl('/user/public');
      return false;
    } else {
      return true;
    }
  }
}
