import { Component, OnInit, ViewChild, Renderer2} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { AuthenticationService, CommonService, SnackbarService, ThemeService } from '@shared/services';

@Component({
  selector: 'app-left-nav-bar',
  templateUrl: './left-nav-bar.component.html',
  styleUrls: ['./left-nav-bar.component.less']
})
export class LeftNavBarComponent implements OnInit {
  showFiller = false;
  showMore = false;
  public notificationsEnabled = false;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  homeUrl = 'workspace-v3/projects/list';
  public helpModule: any;
  userData: any;
  themeSettings: any;
  helpUrl = '';
  defaultWorkspace: any;
  helpMatMenu = true;
  public showUserManagement = false;
  constructor(
    private auth: AuthenticationService,
    private commonService: CommonService,
    private renderer: Renderer2,
    private themeService: ThemeService,
    private authenticationService: AuthenticationService,
    private snackBar: SnackbarService
  ) {
    this.authenticationService
      .getUserDetailsUsingAuth0Token()
      .subscribe(({ permissions }) => {
        this.showUserManagement =
          permissions?.site_admin?.write || permissions?.site_config?.write;
      });
  }

  ngOnInit() {
    this.helpModule = this.auth.getModuleAccess('help');
    const notifications = this.auth.getModuleAccess('notifications');
    this.notificationsEnabled = (notifications && notifications['write'] === true);
    this.userData = this.auth.getUserData();
    this.themeSettings = this.themeService.getThemeSettings();
    this.helpUrl = this.themeSettings && this.themeSettings['customize'] && this.themeSettings['customize']['supportUrl'] || 'https://support.geopath.io';
    const projects = this.auth.getModuleAccess('projects');
    this.defaultWorkspace = projects?.default ? 'workspace' : 'newworkspace';
    this.commonService.getWorkSpaceState().subscribe(
    url => {
        if (url) {
          this.homeUrl = url;
        } else {
          this.homeUrl = '/workspace-v3/projects/list';
        }
    });
   const workspaceURL = this.commonService.getRedirectUrl();
   if (workspaceURL) {
    this.homeUrl = workspaceURL;
   }
   // disabling help mat manu with module access...
   if (this.auth.getModuleAccess('help')?.status === 'disabled') {
    this.helpMatMenu = false;
  }
  }
  onshowFiller() {
    this.showFiller = !this.showFiller;
    if (this.showFiller) {
      this.showMore = false;
      this.renderer.addClass(document.body, 'navCollapse');
    } else {
      this.renderer.removeClass(document.body, 'navCollapse');
    }
  }
  onOpenMore() {
    this.showMore = !this.showMore;
  }
  openFeedback() {
    const res = zdObject.open();
    if (!res) {
      // disabling error messaging...
      console.log(`blocked access by zdObject`);
    }
  }

  upCommingModuleAlert() {
    this.snackBar.showsAlertMessage('It will be available soon');
  }
}
