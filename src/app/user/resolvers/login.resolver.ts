import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
import {ThemeService} from '@shared/services';
import {EMPTY} from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class LoginResolver implements Resolve<any> {
  constructor(private themeService: ThemeService) {}
  resolve(route: ActivatedRouteSnapshot) {
        return this.themeService.getThemeSettingsFromAPI().pipe(catchError(() => {
          return EMPTY;
        }));
  }
}
