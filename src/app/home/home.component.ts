import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService, CommonService } from '@shared/services';
import { FiltersService } from '../explore/filters/filters.service';
import { Helper } from 'app/classes';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {
  public themeSettings: any;
  public isSpotListeDisplay = false;
  public isWorkspaceDisplay = false;
  public isExploreDisplay = false;
  public isPlacesDisplay = false;
  public isPopulationLibDisplay = false;
  /** Hided based on IMXUIPRD-1352 */
  // public isReportsDisplay = false;
  public homeUrl = '/v2/projects';
  public spotlights = [
    'IMX-spot-ws-banner-1',
    'IMX-electric-car',
    'IMX-eat-fast-food',
    'IMX-bike-to-work'
  ];
  public spotlightIndex = 0;
  public moduleDetails = [
    {
      name: 'Spotlight',
      description: 'The latest product news and updates from Geopath',
      isSpotListeDisplay: true,
      moduleName: 'spotlights',
      icon: ''
    },
    {
      name: 'Workspace',
      description: 'Packages, campaigns and audience insights organized in one intuitive & interactive workspace.',
      isWorkspaceDisplay: false,
      moduleName: 'workspace',
      icon: 'apps'
    },
    {
      name: 'Explore',
      description: 'More than half a million Geopath-rated inventory on a map and at your fingertips.',
      isExploreDisplay: false,
      moduleName: 'explore',
      icon: 'explore'
    },
    {
      name: 'Places Library',
      description: 'Bring points of interest and geographies together in a way that fits your needs.',
      isPlacesDisplay: false,
      moduleName: 'places',
      icon: 'place'
    },
    {
      name: 'Population Library',
      description: 'Analyze thousands of consumer profiles by home geographies, like DMAs, CBSAs or counties. Save relevant geographies into Geography Sets.',
      isPopulationLibDisplay: false,
      moduleName: 'population',
      icon: 'population'
    }
    /** Hided based on IMXUIPRD-1352 */
    /*,{
      name: 'Reports',
      description: '<span class="boldText">Coming Soon</span>: Big data doesn’t have to equal big mess. Intuitive report widgets bring valuable insights to the surface.',
      isReportsDisplay: false,
      moduleName: 'reports',
      icon: 'assessment'
    }*/
  ];
  constructor(
    private router: Router,
    private theme: ThemeService,
    private filterService: FiltersService,
    private commonService: CommonService
  ) {}

  ngOnInit() {
    this.themeSettings = this.theme.getThemeSettings();
    this.theme.themeSettings.subscribe(res => {
      this.themeSettings = this.theme.getThemeSettings();
    });
    this.spotlightIndex = Math.floor(Math.random() * 4);
    this.selectPanel('spotlights');
  }

  ngAfterViewInit() {
    Helper.themeRender('intermx-theme-old');
  }

  ngOnDestroy(): void {
    Helper.themeRender('intermx-theme-old');
  }
  
  selectPanel(module) {
    this.isSpotListeDisplay = false;
    this.isWorkspaceDisplay = false;
    this.isExploreDisplay = false;
    this.isPlacesDisplay = false;
    this.isPopulationLibDisplay = false;
    /** Hided based on IMXUIPRD-1352 */
    // this.isReportsDisplay = false;
    this.moduleDetails[0].isSpotListeDisplay = false;
    this.moduleDetails[1].isWorkspaceDisplay = false;
    this.moduleDetails[2].isExploreDisplay = false;
    this.moduleDetails[3].isPlacesDisplay = false;
    this.moduleDetails[4].isPopulationLibDisplay = false;
    /** Hided based on IMXUIPRD-1352 */
    // this.moduleDetails[4].isReportsDisplay = false;
    switch (module) {
      case 'spotlights':
        this.moduleDetails[0].isSpotListeDisplay = true;
        this.isSpotListeDisplay = true;
        break;
      case 'workspace':
        this.moduleDetails[1].isWorkspaceDisplay = true;
        this.isWorkspaceDisplay = true;
        break;
      case 'explore':
        this.moduleDetails[2].isExploreDisplay = true;
        this.isExploreDisplay = true;
        break;
      case 'places':
        this.moduleDetails[3].isPlacesDisplay = true;
        this.isPlacesDisplay = true;
        break;
      case 'population':
        // this.router.navigate(['/population']);
        this.moduleDetails[4].isPopulationLibDisplay = true;
        this.isPopulationLibDisplay = true;
        break;
      /** Hided based on IMXUIPRD-1352 */
      /*case 'reports':
        this.moduleDetails[4].isReportsDisplay = true;
        this.isReportsDisplay = true;
        break;*/
      default:
        this.isSpotListeDisplay = true;
    }
  }
  redirectModule(module) {
    switch (module) {
      case 'spotlights':
        const sessionFilter = this.filterService.getExploreSession();
        if (sessionFilter) {
          sessionFilter['clickAudience'] = true;
          this.filterService.saveExploreSession(sessionFilter);
        } else {
          this.filterService.saveExploreSession({'clickAudience': true});
          localStorage.setItem('clickAudience', 'true');
        }
        this.router.navigate(['/explore']);
        break;
      case 'workspace':
        this.commonService.getWorkSpaceState().subscribe(url => {
          if (url) {
            this.homeUrl = url;
          } else {
            this.homeUrl = '/workspace-v3';
          }
        });
        const workspaceURL = this.commonService.getRedirectUrl();
        if (workspaceURL) {
          this.homeUrl = workspaceURL;
        }
        this.router.navigate([this.homeUrl]);
        break;
      case 'explore':
        this.router.navigate(['/explore']);
        break;
      case 'places':
        this.router.navigate(['/places']);
        break;
      case 'reports':
        this.router.navigate(['/reports']);
        break;
      case 'recordsmanagement':
        this.router.navigate(['/recordsmanagement']);
        break;
      case 'newworkspace':
        this.router.navigate(['/workspace-v3/projects/list']);
        break;
      case 'population':
        this.router.navigate(['/population']);
        break;
      default:
        sessionFilter['clickAudience'] = true;
        this.filterService.saveExploreSession(sessionFilter);
        this.router.navigate(['/explore']);
    }
  }
}
