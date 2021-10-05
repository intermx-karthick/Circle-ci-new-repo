import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
import {ExploreService} from '@shared/services';
import {EMPTY} from 'rxjs';
import { catchError } from 'rxjs/operators';
import {PlacesFiltersService} from '../../places/filters/places-filters.service';

@Injectable()
export class PlacesResolver implements Resolve<any> {
  constructor(private exploreService: ExploreService, private placesFilterService: PlacesFiltersService) {}
  resolve(route: ActivatedRouteSnapshot) {
    return this.placesFilterService.getPlacesSet(false, true)
    .pipe(catchError(() => {
        return EMPTY;
    }));
  }
}
