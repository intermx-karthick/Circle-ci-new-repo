import {ChangeDetectorRef, Component, OnInit, Renderer2, OnDestroy} from '@angular/core';
import {
  AuthenticationService,
  TitleService,
  CommonService,
  ThemeService, InventoryService, TargetAudienceService
} from '@shared/services';
import { ActivatedRoute, NavigationEnd, NavigationStart, ResolveEnd, Router } from '@angular/router';
import {environment} from '../environments/environment';
import { filter, map, mergeMap, takeUntil, tap } from 'rxjs/operators';
import {BreakpointObserver} from '@angular/cdk/layout';
import {AppLoaderComponent} from './app-loader.component';
import {CacheService} from '@shared/services/cache';
import {PopulationDataService} from '@shared/services/population-data.service';
import {Subject} from 'rxjs';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [AuthenticationService, TitleService]
})
export class AppComponent implements OnInit, OnDestroy {
  public appLoaderComponent = AppLoaderComponent;
  title = 'app';
  sitename = environment.siteName;
  themeSettings = environment.themeSettings;
  protected unsubscribe: Subject<void> = new Subject<void>();
  isAuth0Loading = true;
  canShowLoading = true;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: TitleService,
    private _cService: CommonService,
    private cdRef: ChangeDetectorRef,
    private auth: AuthenticationService,
    private auth0: AuthService,
    private theme: ThemeService,
    private breakpointObserver: BreakpointObserver,
    private renderer: Renderer2,
    private cache: CacheService,
    private populationDataService: PopulationDataService,
    private inventoryService: InventoryService,
    private targetAudienceService: TargetAudienceService
  ) {
    this.hideLoadingOnError();
  }

  ngOnInit() {

    this.auth0.isAuthenticated$.subscribe((loggedId)=>{
      this.isAuth0Loading = !loggedId;
    });

    this.auth.clearCache$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(res => {
        this.cache.clear();
        this.populationDataService.clearCaches();
        this.inventoryService.clearCaches();
        this.targetAudienceService.clearCaches();
      });
    const themeSettings = JSON.parse(localStorage.getItem('themeSettings'));
    if (themeSettings && themeSettings['siteName']) {
      this.sitename = themeSettings['siteName'];
    }

    this.breakpointObserver.observe('(max-width: 767px)').subscribe( result => {
      this._cService.setMobileBreakPoint(result['matches']);
      if (result['matches']) {
        this.renderer.addClass(document.body, 'isMobile');
      } else {
        this.renderer.removeClass(document.body, 'isMobile');
      }
     });
    const self = this;
    this.theme.generateColorTheme();
    this.auth.createIdentify();

    this.hideLoadingOnError();

    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationStart)) {
        return;
      }
      const url = evt.url;
      self._cService.updateCurrentUrl(url);

    });
    this.router.events
      .pipe(
        tap(routerData=>{
          if(routerData instanceof ResolveEnd){
            this.updateUILoadingMsgState(routerData.url);
          }
        })
      , filter((event) => event instanceof NavigationEnd)
      , tap(()=>{
          this.hideLoadingOnError();
        })
      , map(() => this.activatedRoute)
      , map((route) => {
        while (route.firstChild) { route = route.firstChild; }
        return route;
      })
      , filter((route) => route.outlet === 'primary')
      , mergeMap((route) => route.data))
      .subscribe((event) => this.titleService.setTitle(event['title'] + ' :: ' + this.sitename));
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  /**
   * @description
   *  Update the loading msg state in ui.
   * @param urlPathStr
   */
  private updateUILoadingMsgState(urlPathStr){
    const params = window.location.search;
    const isAppInAuth0Error = params.includes('error=') && params.includes('error_description=');
    this.canShowLoading = !isAppInAuth0Error && urlPathStr !== '/user/public';
  }

  private hideLoadingOnError(){
    if(/\/error/.test(location.href) || /\/404/.test(location.href)) {
      this.canShowLoading = false;
      this.isAuth0Loading = false;
      (window as any)?.zE?.hide?.();
    }
  }
}
