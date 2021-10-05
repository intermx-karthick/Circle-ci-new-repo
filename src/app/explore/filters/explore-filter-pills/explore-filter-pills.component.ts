import {Component, OnDestroy, OnInit} from '@angular/core';
import {combineLatest, Observable, Subject} from 'rxjs';
import {shareReplay, map, withLatestFrom, startWith, takeUntil} from 'rxjs/operators';
import {LayersService} from '../../layer-display-options/layers.service';
import {FiltersService} from '../filters.service';
import {AuthenticationService} from '@shared/services';

@Component({
  selector: 'app-explore-filter-pills',
  templateUrl: './explore-filter-pills.component.html',
  styleUrls: ['./explore-filter-pills.component.less'],
})
export class ExploreFilterPillsComponent implements OnInit, OnDestroy {
  private unSubscribe: Subject<void> = new Subject<void>();
  public pills: Observable<any>;
  private gpAudience: any;

  constructor(
    private filterService: FiltersService,
    private layerService: LayersService,
    private auth: AuthenticationService,
  ) {}

  ngOnInit() {
    this.gpAudience = this.auth.getModuleAccess('gpAudience');
    /**
     * author : Vignesh.m@agiratech.com
     * Usage of various Rxjs operators to combine multiple observables which fires at different rate
     * Please discuss with the author before modifying this code for anything.
     */
    this.pills = combineLatest(
      // Combines filterPills change and display options change into one observable
      // observable 1
      this.filterService.getFilterPills(),
      // Observable 2 start
      // fired when apply is clicked for display options
      this.layerService.getApplyLayers()
        .pipe(
          withLatestFrom(
            // Fires only when apply is clicked, it'll pass the last changes to the display options observable
            this.layerService.getDisplayOptions()
              .pipe(
                // sometimes default display options are overwritten by multiple sources, this prevents that
                // Starting with a default set of options to load the default value
                startWith(this.layerService.defaultDisplayOptions),
                // unsubscribing from inner observables
                takeUntil(this.unSubscribe)
              )
          ),
          map(([apply, selection]) => {
            // This map has layer apply and display options selected data
            let data = {};
            // if filter pills are enabled, set the selected options for pills
            if (selection['filterPills']) {
              data = selection['labels'];
            }
            return data;
          }),
          takeUntil(this.unSubscribe)
        )
      // Observable 2 end.
    ).pipe(
        map(([pillsData, selectedPills]) => {
          /* Here the pills created from filters, and views are coming as one observable
          and the selected options from display options -> pills are coming
          */
          return this.normalizePills(pillsData, selectedPills);
        }),
        // used to prevent observable from firing multiple times with same value
        shareReplay(1),
      );
    /*
    Not subscribing to the observable because async pipe is used in the template. If you don't subscribe, you don't have to unsubscribe
     */
  }

  private normalizePills(pills, selection) {
    const formattedPills = [];
    // looping over the pillsData
    Object.entries(pills).forEach(([pillType, value]) => {
      // if the current pillData is not enabled
      if (selection && !selection[pillType] && pillType !== 'measuresRelease') {
        /* return will not return the function, in forEach return is similar to continue, it will just go to the next iteration */
        return;
      }
      // If pill type is not filter, then its a flat pill, just push.
      if (pillType !== 'filters' && value) {
        const filterVal: string = value.toString();
        const filter = filterVal.split(':');
        if (filter[0] === 'Audience') {
          if (this.gpAudience.status === 'active') {
            formattedPills.push(value);
          }
        } else {
          formattedPills.push(value);
        }
      } else {
        // Filter type is a nested pills type, we need to flat it.
        Object.entries(value).forEach(([subFilter, filterVal]) => {
          if (filterVal) {
            formattedPills.push(filterVal);
          }
        });
      }
    });
    return formattedPills;
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
