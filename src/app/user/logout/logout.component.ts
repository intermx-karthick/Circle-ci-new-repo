import {Component, OnInit, Optional, SkipSelf} from '@angular/core';
import {Router} from '@angular/router';
import {ExploreDataService} from '@shared/services';
import {PopulationService} from '../../population/population.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  template: ``
})
export class LogoutComponent implements OnInit {
  constructor(
    private router: Router,
    private exploreDataService: ExploreDataService,
    private auth: AuthService,
    // only inject if instance was created already in population module
    @Optional() @SkipSelf() private populationService?: PopulationService
  ) {
  }

  ngOnInit(): void {
    this.exploreDataService.resetMapViewPositionState();
    // resetting the population filters
    if (!!this.populationService) {
      this.populationService.resetFilters();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('apiKey');
    localStorage.removeItem('user_data');
    localStorage.removeItem('module_access');
    localStorage.removeItem('dontShowAgreement');
    localStorage.removeItem('userAgreementAgreed');
    localStorage.removeItem('exploreSession');
    localStorage.removeItem('workSpaceSession');
    localStorage.removeItem('placesSession');
    localStorage.removeItem('savedExploreSession');
    localStorage.removeItem('customColumn');
    localStorage.removeItem('layersSession');
    localStorage.removeItem('user_permission');
    localStorage.clear();
    zdObject.destroyIdentify();
    fsObject.destroyIdentify();
    this.auth.logout();
  }
}
