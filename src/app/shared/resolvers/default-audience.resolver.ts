import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
import {TargetAudienceService, CommonService} from '@shared/services';
import {EMPTY} from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class DefaultAudienceResolver implements Resolve<any> {
  private measuresRelease: any;
  constructor(private targetAudienceService: TargetAudienceService,
              private commonService: CommonService) {
    const pathname = window.location.pathname;
    const themeSettings = JSON.parse(localStorage.getItem('themeSettings'));
    let defaultMeasureRelease = Number(themeSettings['measuresRelease']);
    if (pathname.includes('explore')) {
      const preferences = this.commonService.getUserPreferences();
      if (preferences?.measures_release) {
        defaultMeasureRelease = preferences['measures_release'];
      } else {
        const user_preferences = {};
        user_preferences['measures_release'] = defaultMeasureRelease;
        this.commonService.setUserPreferences(user_preferences);
      }
    }
    this.measuresRelease = defaultMeasureRelease;
  }
  resolve(route: ActivatedRouteSnapshot) {
    
    return this.targetAudienceService.getDefaultAudience(false, this.measuresRelease)
      .pipe(catchError(() => {
        return EMPTY;
      }));
  }
}
