import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
import {PlacesFiltersService} from '../../places/filters/places-filters.service';
import {EMPTY} from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class PlaceSetResolver implements Resolve<any> {
  constructor(private placesFiltersService: PlacesFiltersService) {}
  resolve(route: ActivatedRouteSnapshot) {
    return this.placesFiltersService.getPlacesSet()
      .pipe(catchError(() => {
        return EMPTY;
      }));
  }
}
