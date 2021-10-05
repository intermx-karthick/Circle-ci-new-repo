import { Injectable, Injector } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TitleService } from './title.service';
import { BehaviorSubject, Observable, Subject, throwError as observableThrowError, EMPTY } from 'rxjs';
import { map, catchError, publishReplay, refCount } from 'rxjs/operators';
import { LoaderService } from './loader.service';
import { AppConfig } from '../../app-config.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CustomIcons } from '@interTypes/enums/custom-icons';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private dimensions = new BehaviorSubject({
    headerHeight: 120,
    windowHeight: 640,
    windowWidth: 1024,
    orientation: 'portrait'
  });
  public defaultThemeSettings: any = environment.themeSettings;
  public themeSettings: Subject<boolean> = new Subject();
  public headers = new Headers({'Content-Type': 'application/json'});
  private sitesObervable$: Observable<Object>;
  public openUserSettings: Subject<boolean> = new Subject();

  constructor(private titleService: TitleService,
              private loader: LoaderService,
              private http: HttpClient,
              private matIconRegistry: MatIconRegistry,
              private domSanitizer: DomSanitizer,
              private config: AppConfig, private route: Router) {
                this.registerIcons();
              }

  getThemeSettings() {
    let themeSettings: any;
    if (localStorage.getItem('themeSettings')) {
      themeSettings = JSON.parse(localStorage.getItem('themeSettings'));
      this.titleService.updateSiteName(themeSettings['siteName']);
      return themeSettings;
    } else {
      this.getThemeSettingsFromAPI().subscribe(response => {
        themeSettings = JSON.parse(localStorage.getItem('themeSettings'));
        this.titleService.updateSiteName(themeSettings['siteName']);
        return themeSettings;
      }, error => {
        this.route.navigate(['/error']);
        const subdomain = window.location.hostname;
        const tdomain = (environment.themeSettings1.domain).split(',');
        this.defaultThemeSettings = environment.themeSettings;
        if (tdomain.indexOf(subdomain) >= 0) {
          this.defaultThemeSettings = environment.themeSettings1;
        }
        if (localStorage.getItem('themeSettings')) {
          themeSettings = JSON.parse(localStorage.getItem('themeSettings'));
        } else {
          themeSettings = this.defaultThemeSettings;
          localStorage.setItem('themeSettings', JSON.stringify(this.defaultThemeSettings));
        }
        this.titleService.updateSiteName(themeSettings['title']);
        this.themeSettings.next(true);
        return themeSettings;
      });
    }
  }
  getThemeSettingByName(value) {
    const themeSettings = this.getThemeSettings();
    return themeSettings[value] ?? null;
  }

  generateColorTheme() {
    const themeSettings = this.getThemeSettings();
    this.themeSettings.next(true);
    const elem = $('#cssId');
    if (elem.length > 0) {
      elem.remove();
    }
    const body = document.getElementsByTagName('body')[0];
    const style = document.createElement('style');
    style.id = 'cssId';
    style.type = 'text/css';
    style.media = 'all';
    if (themeSettings) {
      const blackHigh = this.hexToRgb(themeSettings['color_sets']['gray']['base'], 0.87);
      const blackMed = this.hexToRgb(themeSettings['color_sets']['gray']['base'], 0.6);
      const blackLow = this.hexToRgb(themeSettings['color_sets']['gray']['base'], 0.38);
      $('#favicon').attr('href', themeSettings['customize']['favicon_logo']);

      let css = '';
      css += ':root{';
      /* css += '--button-bg-color:' + themeSettings['color']['button'] + ';';
      css += '--theme-primary-color:' + themeSettings['color']['primary'] + ';';
      css += '--theme-secondary-color:' + themeSettings['color']['secondary'] + ';';
      css += '--theme-highlight-color:' + themeSettings['color']['highlight'] + ';';
      css += '--login-bg-color:' + themeSettings['background']['bg_color'] + ';'; */
      css += '--button-bg-color:' + themeSettings['color_sets']['primary']['base'] + ';';
      css += '--text-primary:' + themeSettings['color_sets']['primary']['base'] + ';';
      css += '--theme-primary-color:' + themeSettings['color_sets']['primary']['base'] + ';';
      css += '--theme-secondary-color:' + themeSettings['color_sets']['secondary']['base'] + ';';
      css += '--theme-highlight-color:' + themeSettings['color_sets']['highlight']['base'] + ';';
      css += '--login-bg-color:' + themeSettings['background']['bg_color'] + ';';

      css += '--primary-bg-900:' + themeSettings['color_sets']['primary']['900'] + ';';
      css += '--primary-bg-800:' + themeSettings['color_sets']['primary']['800'] + ';';
      css += '--primary-bg-700:' + themeSettings['color_sets']['primary']['700'] + ';';
      css += '--primary-bg-600:' + themeSettings['color_sets']['primary']['600'] + ';';
      css += '--primary-bg-500:' + themeSettings['color_sets']['primary']['500'] + ';';
      css += '--primary-bg-400:' + themeSettings['color_sets']['primary']['400'] + ';';
      css += '--primary-bg-300:' + themeSettings['color_sets']['primary']['300'] + ';';
      css += '--primary-bg-200:' + themeSettings['color_sets']['primary']['200'] + ';';
      css += '--primary-bg-100:' + themeSettings['color_sets']['primary']['100'] + ';';
      css += '--primary-bg-50:' + themeSettings['color_sets']['primary']['050'] + ';';
      css += '--primary-bg:' + themeSettings['color_sets']['primary']['base'] + ';';

      css += '--secondary-bg-900:' + themeSettings['color_sets']['secondary']['900'] + ';';
      css += '--secondary-bg-800:' + themeSettings['color_sets']['secondary']['800'] + ';';
      css += '--secondary-bg-700:' + themeSettings['color_sets']['secondary']['700'] + ';';
      css += '--secondary-bg-600:' + themeSettings['color_sets']['secondary']['600'] + ';';
      css += '--secondary-bg-500:' + themeSettings['color_sets']['secondary']['500'] + ';';
      css += '--secondary-bg-400:' + themeSettings['color_sets']['secondary']['400'] + ';';
      css += '--secondary-bg-300:' + themeSettings['color_sets']['secondary']['300'] + ';';
      css += '--secondary-bg-200:' + themeSettings['color_sets']['secondary']['200'] + ';';
      css += '--secondary-bg-100:' + themeSettings['color_sets']['secondary']['100'] + ';';
      css += '--secondary-bg-50:' + themeSettings['color_sets']['secondary']['050'] + ';';
      css += '--secondary-bg:' + themeSettings['color_sets']['secondary']['base'] + ';';

      css += '--grays-bg-900:' + themeSettings['color_sets']['gray']['900'] + ';';
      css += '--grays-bg-800:' + themeSettings['color_sets']['gray']['800'] + ';';
      css += '--grays-bg-700:' + themeSettings['color_sets']['gray']['700'] + ';';
      css += '--grays-bg-600:' + themeSettings['color_sets']['gray']['600'] + ';';
      css += '--grays-bg-500:' + themeSettings['color_sets']['gray']['500'] + ';';
      css += '--grays-bg-400:' + themeSettings['color_sets']['gray']['400'] + ';';
      css += '--grays-bg-300:' + themeSettings['color_sets']['gray']['300'] + ';';
      css += '--grays-bg-200:' + themeSettings['color_sets']['gray']['200'] + ';';
      css += '--grays-bg-100:' + themeSettings['color_sets']['gray']['100'] + ';';
      css += '--grays-bg-50:' + themeSettings['color_sets']['gray']['050'] + ';';
      css += '--grays-base:' + themeSettings['color_sets']['gray']['base'] + ';';

      css += '--success-bg-900:' + themeSettings['color_sets']['success']['900'] + ';';
      css += '--success-bg-600:' + themeSettings['color_sets']['success']['600'] + ';';
      css += '--success-bg-300:' + themeSettings['color_sets']['success']['300'] + ';';
      css += '--success-base:' + themeSettings['color_sets']['success']['base'] + ';';

      css += '--warning-bg-900:' + themeSettings['color_sets']['warning']['900'] + ';';
      css += '--warning-bg-600:' + themeSettings['color_sets']['warning']['600'] + ';';
      css += '--warning-bg-300:' + themeSettings['color_sets']['warning']['300'] + ';';
      css += '--warning-base:' + themeSettings['color_sets']['warning']['base'] + ';';

      css += '--error-bg-900:' + themeSettings['color_sets']['error']['900'] + ';';
      css += '--error-bg-600:' + themeSettings['color_sets']['error']['600'] + ';';
      css += '--error-bg-300:' + themeSettings['color_sets']['error']['300'] + ';';
      css += '--error-base:' + themeSettings['color_sets']['error']['base'] + ';';

      css += '--high-emphasis:' + blackHigh + ';';
      css += '--medium-emphasis:' + blackMed + ';';
      css += '--low-emphasis:' + blackLow + ';';

      css += '--calander-color:' + themeSettings['color_sets']['primary']['base'] + ';';

      css += '}';
      style.innerText = css;
      body.appendChild(style);
    }
  }

  getThemeSettingsFromAPI(): Observable<any> {
    if (!this.sitesObervable$) {
      this.sitesObervable$ = this.http.get(window.location.origin + '/sites').pipe(publishReplay(1),
        refCount(), map(data => {
          const envData = data;
          this.defaultThemeSettings = envData;
          localStorage.setItem('themeSettings', JSON.stringify(this.defaultThemeSettings));
          this.themeSettings.next(true);
          return data;
        }), catchError((err, caught) => {
          console.log(err)
          localStorage.removeItem('themeSettings');
          this.sitesObervable$ = null;
          this.route.navigate(['/error']);
          this.handleError = err;
          return EMPTY;
        }));
    }
    return this.sitesObervable$;
  }

  public handleError = (error: Response) => {
    return observableThrowError(error);
  }
  hexToRgb(hex, percentage) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    const resultValue = 'rgba(' + parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) + ',' + percentage +
      ')';
    return result ? resultValue : null;
  }

  public getDimensions(): Observable<any> {
    return this.dimensions.asObservable();
  }

  public setDimensions(height) {
    this.dimensions.next(height);
  }


  /**
   * This function is to get the url of the Map style
   * @param mapStyle Name of the map style
   */
  getMapStyleURL(mapStyle) {
    let style = {};
    const themeSettings = this.getThemeSettings();
    style = themeSettings['basemaps'].find((map) => mapStyle === map.label);
    if (!style) {
      style = themeSettings['basemaps'].find((map) => (map.default));
    }
    return style['uri'];
  }
  public registerIcons(): void {
    Object.keys(CustomIcons).forEach((iconKey: string) => {
      this.matIconRegistry.addSvgIcon(iconKey, this.domSanitizer.bypassSecurityTrustResourceUrl(`../assets/custom-icons/${CustomIcons[iconKey]}.svg`));
    });
  }

  public getUserSettingState(): Observable<any> {
    return this.openUserSettings.asObservable();
  }
  public setUserSettingState( flag ) {
    this.openUserSettings.next(flag);
  }

}
