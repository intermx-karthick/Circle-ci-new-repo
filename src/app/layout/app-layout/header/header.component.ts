import {AfterViewInit, Component, ElementRef, OnInit, ViewChild, HostListener, OnDestroy} from '@angular/core';
import {ThemeService, AuthenticationService} from '@shared/services';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PublicSignInComponent } from '@shared/components/publicSite/sign-in-sign-up/sign-in-sign-up.component';
import { Subject} from 'rxjs';
import {NotificationsService} from '../../../notifications/notifications.service';
import {slideTopDownAnimation} from '@shared/animations'
import {filter, takeUntil} from 'rxjs/operators';
import { AuthService } from 'app/auth/auth.service';
import {IconState} from '@interTypes/Notifications';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less'],
  animations: [
    slideTopDownAnimation
  ]
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerLayout') headerLayoutHeight: ElementRef;
  themeSettings: any;
  userData: any;
  isViewProfile = false;
  public isPublicSite = false;
  public showNotifications = false;
  public isNotificationsEnabled = false;
  public iconState: IconState;
  public isEmpty = false;
  public inProgress = true;
  public isCompleted = true;
  // TODO : Need to change count into an observable that draws from notification state
  public notificationCount = 0;
  private unsubscribe: Subject<void> = new Subject<void>();
  userSetting: boolean;
  constructor(
    private theme: ThemeService,
    private auth: AuthenticationService,
    public dialog: MatDialog,
    private auth0: AuthService,
    private breakpointObserver: BreakpointObserver,
    private notification: NotificationsService) {
  }

  ngOnInit() {
    this.userData = this.auth.getUserData();
    const notifications = this.auth.getModuleAccess('notifications');
    this.isNotificationsEnabled = (notifications && notifications['read'] && notifications['view']);
    this.themeSettings = this.theme.getThemeSettings();
    this.theme.themeSettings.subscribe(res => {
      this.themeSettings = this.theme.getThemeSettings();
    });

    if (this.themeSettings.publicSite) {
      this.isPublicSite = true;
    } else {
      this.isPublicSite = false;
      // notifications only for non-public sites
      this.loadNotifications();
    }
    this.theme.getUserSettingState().subscribe(flag => {
      this.userSetting = true;
    });
  }
  onSettingClose() {
    this.userSetting = false;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.getDimensions();
    }, 100);
  }
  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  private getDimensions() {

    const layoutChanges = this.breakpointObserver.observe([
      '(orientation: portrait)',
      '(orientation: landscape)',
    ]);
    layoutChanges.subscribe(result => {
      setTimeout(() => {
        this.theme.setDimensions({
          headerHeight: this.headerLayoutHeight.nativeElement.offsetHeight,
          windowHeight: window.innerHeight,
          windowWidth: window.innerWidth,
          orientation: result.breakpoints['(orientation: portrait)'] ? 'portrait' : 'landscape'
        });
      }, 2);
    });


  }
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.getDimensions();
  }

  showProfile() {
    this.isViewProfile = !this.isViewProfile;
  }
  openSigninUp(type) {
    this.auth0.login();
  }
  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }
  public onIconStateChange($event) {
    this.iconState = $event;
  }
  private loadNotifications(){
    this.notification.getUnreadNotificationsCount()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(count => {
        this.notificationCount = count;
      });
    this.notification.getMarkAsReadEvent()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.notificationCount = this.notificationCount - 1;
      });
  }
}
