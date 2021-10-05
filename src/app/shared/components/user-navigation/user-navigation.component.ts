import {AfterViewInit, Component, OnInit, Optional, SkipSelf} from '@angular/core';
import {ExploreDataService, ThemeService, TargetAudienceService} from '@shared/services';
import {AuthenticationService} from '../../services/authentication.service';
import {Router} from '@angular/router';

import {FiltersService} from '../../../explore/filters/filters.service';
import {PopulationService} from '../../../population/population.service';

@Component({
  selector: 'user-navigation',
  templateUrl: './user-navigation.component.html',
  styleUrls: ['./user-navigation.component.less']
})
export class UserNavigationComponent implements OnInit, AfterViewInit {
  public audienceLicense = {};
  public isGpLoginRequired: boolean;
  themeSettings: any;
  constructor(
              private auth: AuthenticationService,
              public router: Router,
              private filtersService: FiltersService,
              private themeService: ThemeService,
              private exploreDataService: ExploreDataService,
              private trargetAudienceService: TargetAudienceService,
              // only inject if instance was created already in population module
              @Optional() @SkipSelf() private populationService?: PopulationService,
  ) {
    this.themeSettings = themeService.getThemeSettings();
    this.isGpLoginRequired = this.themeSettings.gpLogin;
  }

  userData: any;
  mod_permission: any;
  allowInventory = '';
  allowInventoryAudience = '';

  ngOnInit() {
    try {
      this.userData = this.auth.getUserData();
      this.mod_permission = this.auth.getModuleAccess('explore');
      this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
      this.audienceLicense = this.auth.getModuleAccess('gpAudience');
      this.allowInventoryAudience = this.audienceLicense['status'];
      this.auth.userDataUpdate.subscribe(res => {
        this.userData = this.auth.getUserData();
      });
    } catch (e) {
      console.log(e);
    }
  }

  ngAfterViewInit() {
    // closing user navigation sub menu when we clicked on outside of seetings icon if it is open
    $(document).click(function (event) {
      const clickover = $(event.target);
      const opened = $('#usermenu').hasClass('in');
      if (opened === true && !clickover.hasClass('settings')) {
        $('.mobile-menu-item.settings').click();
      }

      setTimeout(function () {
        const openedSettingsMenu = $('#usermenu').hasClass('in');
        const openedFiltersMenu = $('#mobile-filter-menu').hasClass('in');

        if (openedSettingsMenu === true && !$('.mobile-menu-item.settings').hasClass('active')) {
          $('.mobile-menu-item.settings').addClass('active');
        }
        if (!openedSettingsMenu && $('.mobile-menu-item.settings').hasClass('active')) {
          $('.mobile-menu-item.settings').removeClass('active');
        }

        if (openedFiltersMenu === true && !$('.mobile-menu-item.filters').hasClass('active')) {
          $('.mobile-menu-item.filters').addClass('active');
        }
        if (!openedFiltersMenu && $('.mobile-menu-item.filters').hasClass('active')) {
          $('.mobile-menu-item.filters').removeClass('active');
        }
      }, 500);
    });
  }
  onLogout() {
    this.auth.logout();
  }

  openFilterSidebar() {
    const sidenav = {open: true, tab: 'target'};
    this.filtersService.setFilterSidenav(sidenav);
  }
  openUserSetting() {
    this.themeService.setUserSettingState(true);

    this.themeService.setUserSettingState(false);
  }
}
