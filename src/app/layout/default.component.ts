import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {AuthenticationService, ThemeService} from '@shared/services';
@Component({
  selector: 'app-app-layout-new',
  template: '<p hidden>loading</p>',
})
export class DefaultComponent {
  constructor(private router: Router,
              private auth: AuthenticationService,
              private theme: ThemeService) {
    const exploreAllowed = this.auth.getModuleAccess('explore')['status'];
    let landingPage = this.theme.getThemeSettings() ? this.theme.getThemeSettings().landingPage : 'explore';
      if (landingPage === 'v3workspace' ) {
        landingPage = '/workspace-v3/projects/list';
      }
      else if (landingPage === 'workspace' ) {
        landingPage = 'v2/projects';
      } else if (landingPage === 'explore' && exploreAllowed !== 'active') {
        landingPage = 'places';
      }
      this.router.navigateByUrl(landingPage);
  }
}
