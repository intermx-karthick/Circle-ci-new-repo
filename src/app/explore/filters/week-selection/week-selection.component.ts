import {Component, OnDestroy, OnInit} from '@angular/core';
import {FiltersService} from '../filters.service';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, takeUntil, tap} from 'rxjs/operators';
import { ExploreService } from '@shared/services/explore.service';
import { CommonService } from '@shared/services';
@Component({
  selector: 'app-week-selection',
  templateUrl: './week-selection.component.html',
  styleUrls: ['./week-selection.component.less']
})
export class WeekSelectionComponent implements OnInit, OnDestroy {
  public selectedWeek = "7";
  public unSubscribe: Subject<void> = new Subject<void>();
  periodDurations = [];
  public dataVersion = 2021;
  constructor(public filterService: FiltersService, private exploreService: ExploreService, private commonService: CommonService) {
  }
  ngOnInit() {
    const filterSession = this.filterService.getExploreSession() || {};
    this.exploreService.getDurations().subscribe((durations) => {
      if (durations['durations']) {
        this.periodDurations = durations['durations'];
      } else {
        this.periodDurations = [
          { duration: 1, isDefault: true, unit: 'week' },
          { duration: 2, isDefault: false, unit: 'weeks' },
          { duration: 4, isDefault: false, unit: 'weeks' },
          { duration: 8, isDefault: false, unit: 'weeks' },
          { duration: 12, isDefault: false, unit: 'weeks' },
          { duration: 26, isDefault: false, unit: 'weeks' },
          { duration: 52, isDefault: false, unit: 'weeks' }
        ];
      }
      if (filterSession['data'] && filterSession['data']['period_days']) {
        const days: number = filterSession['data']['period_days'];
        this.selectedWeek = days.toString();
      } else {
        this.selectedWeek = "7";
      }
    });
    this.commonService.onDataVersionChange().subscribe((data) => {
      this.dataVersion = Number(data);
    });

    this.filterService.onReset()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(res => {
        if (res !== 'FilterInventory') {
          this.selectedWeek = "7";
        }
      });
    this.filterService.getFilters()
      .pipe(distinctUntilChanged(),
        filter(res => res['data'] && res['data']['period_days']),
        map(res => {
          const days: number = res['data']['period_days'];
          return days;
        }),
        takeUntil(this.unSubscribe))
      .subscribe((days) => {
        this.selectedWeek = days.toString();
      });
  }
  onSubmit() {
    if (this.selectedWeek) {
      this.filterService.setFilter('period_days', Number(this.selectedWeek));
    }
  }
  clear() {
    this.selectedWeek = "7";
    this.filterService.clearFilter('period_days', true);
  }
  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
