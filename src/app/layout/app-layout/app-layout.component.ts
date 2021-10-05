import {MediaMatcher} from '@angular/cdk/layout';
import {ChangeDetectorRef, Component, OnDestroy, OnInit, AfterViewInit} from '@angular/core';
import {ThemeService, CommonService} from '@shared/services';
import { Subject, BehaviorSubject } from 'rxjs';
@Component({
  selector: 'app-app-layout-new',
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.less']
})
export class AppLayoutComponent implements OnInit, OnDestroy , AfterViewInit {
  mobileQuery: MediaQueryList;
  themeSettings: any;
  headerHeight: any;
  private _mobileQueryListener: () => void;

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private theme: ThemeService) {
    this.mobileQuery = media.matchMedia('(max-width: 767px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }
  ngOnInit() {
    this.theme.getDimensions().subscribe(dimensions => {
      if (!this.mobileQuery.matches) {
        this.headerHeight = dimensions.headerHeight;
      } else {
        this.headerHeight = 0;
      }
    });
    this.themeSettings = this.theme.getThemeSettings();
    this.theme.themeSettings.subscribe(res => {
      this.themeSettings = this.theme.getThemeSettings();
    });
  }
  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }
  ngAfterViewInit() {
    //for collapses nav side bar when out side click
    setTimeout(() => {
      $('body .main-sidenav-content').on('click', function() {
        if ($('.initial-side-view .mat-nav-list').hasClass('collapse-menu')) {
          $('.navoutclick mat-icon').click();
        }
      });
    }, 200);
  }
}
