import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, throwError as observableThrowError, of, Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MockThemeService {
  private dimensions = new BehaviorSubject({
    headerHeight: 120,
    windowHeight: 640,
    windowWidth: 1024,
    orientation: 'portrait'
  });
  public defaultThemeSettings: any = environment.themeSettings;
  public themeSettings: Subject<boolean> = new Subject();
  public headers = new Headers({'Content-Type': 'application/json'});

  constructor() {
    this.registerIcons();
  }

  getThemeSettings() {
    return JSON.parse('{"logo":{"full_logo":"/assets/images/geopath_black_logo.png","mini_logo":"/assets/images/geo_path_mini_logo.png"},"background":{"bg_image":"/assets/images/login_image-gp.jpg","bg_color":"#922A95"},"customize":{"supportUrl":"https://support.geopath.io","favicon_logo":"/assets/images/geo_path_mini_logo.png","media_types":[{"mtidPrint":["21"],"mtidDigital":["20"],"mtidInteractive":[],"displayName":"Bulletins","colorName":"Red","color":"#FC644B","printSymbol":"winks_mt01","colors":{"light":"#FF5A14","dark":"#FF3D00","satellite":"#FF5A14","Pop Art":"#FF5A14","Blueprint":"#FF5A14","Decimal":"#FF5A14","Minimal":"#FF5A14","Valentine\'s":"#FF5A14"},"print":{"font":"icon-wink-round","symbol":"e"},"digital":{"font":"icon-wink-round-dig","symbol":"f"},"digitalSymbol":"winks_mt15","printPBSymbol":"squinks_mt01","digitalPBSymbol":"squinks_mt15","interactivePBSymbol":"squinks_mt15i"},{"mtidPrint":["30","40"],"mtidDigital":["31","41"],"mtidInteractive":[],"displayName":"Posters","colorName":"Yellow","color":"#FEC546","printSymbol":"winks_mt04","colors":{"light":"#FFCD00","dark":"#FF9A00","satellite":"#FFCD00","Pop Art":"#FFCD00","Blueprint":"#FFCD00","Decimal":"#FFCD00","Minimal":"#FFCD00","Valentine\'s":"#FFCD00"},"print":{"font":"icon-wink-round","symbol":"e"},"digital":{"font":"icon-wink-round-dig","symbol":"f"},"digitalSymbol":"winks_mt18","printPBSymbol":"squinks_mt04","digitalPBSymbol":"squinks_mt18","interactivePBSymbol":"squinks_mt18i"},{"mtidPrint":["51"],"mtidDigital":["50"],"mtidInteractive":["10002"],"displayName":"Street Furniture","colorName":"Green","color":"#1BADA8","printSymbol":"winks_mt08","colors":{"light":"#98D037","dark":"#47FF00","satellite":"#47FF00","Pop Art":"#98D037","Blueprint":"#98D037","Decimal":"#98D037","Minimal":"#98D037","Valentine\'s":"#98D037"},"print":{"font":"icon-wink-square","symbol":"g"},"digital":{"font":"icon-wink-square-dig","symbol":"h"},"digitalSymbol":"winks_mt21","printPBSymbol":"squinks_mt08","digitalPBSymbol":"squinks_mt21","interactivePBSymbol":"squinks_mt21i"},{"mtidPrint":["10"],"mtidDigital":["11"],"mtidInteractive":[],"displayName":"Walls & Murals","colorName":"Purple","color":"#7854E5","printSymbol":"winks_mt14","colors":{"light":"#AE57FF","dark":"#C400FF","satellite":"#D857FF","Pop Art":"#AE57FF","Blueprint":"#AE57FF","Decimal":"#AE57FF","Minimal":"#AE57FF","Valentine\'s":"#AE57FF"},"print":{"font":"icon-wink-flat","symbol":"a"},"digital":{"font":"icon-wink-flat-dig","symbol":"b"},"digitalSymbol":"winks_mt23","printPBSymbol":"squinks_mt14","digitalPBSymbol":"squinks_mt23","interactivePBSymbol":"squinks_mt23i"},{"mtidPrint":["999"],"mtidDigital":["990"],"mtidInteractive":[],"displayName":"Place Based","colorName":"Blue","color":"#1C8DD3","colors":{"light":"#1C8DD3","dark":"#008FFF","satellite":"#55D8FF","Pop Art":"#1C8DD3","Blueprint":"#1C8DD3","Decimal":"#1C8DD3","Minimal":"#1C8DD3","Valentine\'s":"#1C8DD3"},"print":{"font":"icon-wink-pb","symbol":"c"},"digital":{"font":"icon-wink-pb-dig","symbol":"d"}},{"mtidPrint":["979"],"mtidDigital":["970"],"mtidInteractive":[],"displayName":"Fleet Exterior - Scheduled","colorName":"Grey","color":"#272626","colors":{"light":"#272626","dark":"#272626","satellite":"#272626","Pop Art":"#272626","Blueprint":"#272626","Decimal":"#272626","Minimal":"#272626","Valentine\'s":"#272626"},"print":{"font":"icon-wink-fleet-fixed","symbol":"T"},"digital":{"font":"icon-wink-fleet-fixed-dig","symbol":"S"}},{"mtidPrint":["989"],"mtidDigital":["980"],"mtidInteractive":[],"displayName":"Fleet Exterior - Dynamic","colorName":"Grey","color":"#272626","colors":{"light":"#272626","dark":"#272626","satellite":"#272626","Pop Art":"#272626","Blueprint":"#272626","Decimal":"#272626","Minimal":"#272626","Valentine\'s":"#272626"},"print":{"font":"icon-wink-fleet-dyn","symbol":"R"},"digital":{"font":"icon-wink-fleet-dyn-dig","symbol":"Q"}}]},"workflow":{"project":["Project","Projects"],"sub-project":["Sub-Project","Sub-Projects"],"folder_0":["Folder","Folders"],"scenario_0":["Scenario","Scenarios"]},"inventoryStatuses":{"audited":"Audited","under_review":"Under Review","suppressed":"Suppressed","un_audited":"Un-Audited"},"auth0":{"allowedConnections":["geopath","Intermx"],"connections":"geopath","clientId":"D0N04Gg8oNjujuwQ1rRHf9RGj1ahhE5J","domain":"https://intermx-integration.us.auth0.com","connectionType":"open id connect"},"sameAsOwner":true,"baseAudienceRequired":false,"landingPage":"home","measuresRelease":"2021","orientation":"portrait","gpLogin":true,"publicSite":false,"authenticationFlowV2":true,"retiredDate":null,"_id":"5cc1625aa00f4c69d56d2485","site":"geopath","siteName":"Geopath","version":"","legal":"hidden","home":"geopathWalkthough","title":"Geopath Insights Suite","productName":"Insights Suite","welcome":"If you are a Geopath member, sign in below.","homepage":"http://www.geopath.org","color_sets":{"primary":{"100":"#E2BEE0","200":"#D094CD","300":"#BD6AB8","400":"#AE4BA9","500":"#9F2E9B","600":"#922A95","700":"#81248D","800":"#711F84","900":"#551875","base":"#922A95","050":"#F3E5F2"},"secondary":{"100":"#B4EFF4","200":"#83E4EE","300":"#51D9E7","400":"#29D0E1","500":"#00C7DD","600":"#00B7C9","700":"#00A1AF","800":"#008D97","900":"#00696C","base":"#008D97","050":"#E1F9FB"},"gray":{"100":"#F5F5F5","200":"#EEEEEE","300":"#E0E0E0","400":"#BDBDBD","500":"#9E9E9E","600":"#757575","700":"#616161","800":"#424242","900":"#212121","base":"#212121","050":"#FAFAFA"},"error":{"300":"#FAF0F4","600":"#EFCCDA","900":"#B00048","base":"#B00048"},"warning":{"300":"#FFF7F5","600":"#FFE6DD","900":"#FF8256","base":"#FF8256"},"success":{"300":"#F0FCF8","600":"#CDF5E8","900":"#05D08C","base":"#05D08C"},"highlight":{"base":"#FCBD32"}},"basemaps":[{"default":true,"label":"light","uri":"mapbox://styles/intermx/cjtfv8f541ejn1fqlnc1cg2lv"},{"default":false,"label":"dark","uri":"mapbox://styles/intermx/cjt76lctk67js1fnjuwsr710i"},{"default":false,"label":"satellite","uri":"mapbox://styles/intermx/cjt76ogcp24ya1fushwy830tk"},{"default":false,"label":"Pop Art","uri":"mapbox://styles/intermx/ck5ylh4xe13zi1isaq1lzn6cn"},{"default":false,"label":"Blueprint","uri":"mapbox://styles/intermx/ck5ylkrp52dz81inxb1vtd3hw"},{"default":false,"label":"Decimal","uri":"mapbox://styles/intermx/ck6ir7vuo0mv31jrv94q5w0l8"},{"default":false,"label":"Minimal","uri":"mapbox://styles/intermx/ck6ir796n0f6u1imyj6uw24oy"},{"default":false,"label":"Valentine\'s","uri":"mapbox://styles/intermx/ck6jomqtb004p1imuwumgo7mm"}],"clientId":"125","auth0Connections":"geopath","acAdministrator":"bharani","accountOwner":"bharani","administratorEmail":"bharani@intermx.com","createdAt":"2020-02-15T14:54:03.914Z","createdBy":"5ecf074a789a870a0b36ee81","description":"site description","ownerEmail":"bharani@intermx.com","status":"active","updatedAt":"2021-02-15T14:54:05.951Z","updatedBy":"5ecf074a789a870a0b36ee81","url":"https://intermx-integration.us.auth0.com/login","organizationId":"604a6434ab79cf77cc33519d","domain":"https://gp.intermx.io","environment":"integration","apiKey":"3vKtHnLbBB9wkxPXhXBQG5WIEDYTIyAO"}');
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
    return of([]);
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
  }


  /**
   * This function is to get the url of the Map style
   * @param mapStyle Name of the map style
   */
  getMapStyleURL(mapStyle) {
  }
  public registerIcons(): void {
  }
}
