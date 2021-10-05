import { Component, OnInit, OnDestroy } from '@angular/core';
import { FiltersService } from '../filters.service';
import swal from 'sweetalert2';
import { AuthenticationService } from '../../../shared/services/authentication.service';
import { takeWhile, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ExploreDataService } from '@shared/services/explore-data.service';
import {COMMA, ENTER, SEMICOLON, SPACE} from '@angular/cdk/keycodes';

@Component({
  selector: 'app-filter-by-ids',
  templateUrl: './filter-by-ids.component.html',
  styleUrls: ['./filter-by-ids.component.less']
})
export class FilterByIdsComponent implements OnInit, OnDestroy {
  private unSubscribe = true;
  public geoPanelIds = [];
  public plantUnitIds = [];
  public appliedFilters = {};
  public mod_permission: any;
  public allowInventory = '';
  public invalidGeoPanelIds: any;
  public invalidPlantUnitIds: any;
  public allEnteredIds: any;
  public removedInvalidChipsStatus: Boolean = false;
  public operatorKeyCodes = [ENTER, COMMA, SEMICOLON];
  public invalidSpotFilterChips: any;
  public invalidOperatorSpotFilterChips: any;
  public isEnableLoader: Boolean = false;
  constructor(private filtersService: FiltersService, private auth: AuthenticationService,
    private exploreDataService: ExploreDataService) { }

  ngOnInit() {
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    this.loadFilterFromSession();
    this.filtersService.onReset()
      .subscribe(type => {
        this.geoPanelIds = [];
        this.plantUnitIds = [];
        this.resetAppliedFilters();
    });
    this.filtersService.checkSessionDataPushed()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(val => {
        if (val) {
          this.loadFilterFromSession();
        }
      });
      
      this.exploreDataService.getInvalidIds().subscribe((data: any) => {
        this.isEnableLoader = false;
        if (Object.keys(data).length) {
          if (data.geoPanelIds || data.plantIds ) {
            this.invalidSpotFilterChips = {type: 'geoPanelId', data: data['geoPanelIds']};
            this.invalidOperatorSpotFilterChips = {type: 'plantUnitIds', data: data['plantIds']};
            this.invalidGeoPanelIds = {type: 'geoPanelId', data: data['invalidSpotIds']};
            this.invalidPlantUnitIds = {type: 'plantUnitIds', data: data['invalidOperatorSpotIds']};
            this.allEnteredIds = {
              totalIds: this.geoPanelIds.length + this.plantUnitIds.length,
              data: data,
              geoPanelId: this.geoPanelIds,
              plantUnitIds: this.plantUnitIds,
            };
          } else {
            this.allEnteredIds = false;
          }
        }
      });
      this.filtersService.getFilters()
      .pipe(debounceTime(200),
      distinctUntilChanged())
      .subscribe((filterData) => {
        this.allEnteredIds = false;
      });
  }

  removedIdsStatus(status: any) {
   if (status) {
      this.removedInvalidChipsStatus = status;
    }
}
  private loadFilterFromSession() {
    const filterSession = this.filtersService.getExploreSession();
    if (filterSession && filterSession['data']) {
      if (filterSession['data']['geoPanelId'] && filterSession['data']['geoPanelId'].length !== 0) {
        this.geoPanelIds = filterSession['data']['geoPanelId'];
      } else {
        this.geoPanelIds = [];
      }

      if (filterSession['data']['plantUnitId'] && filterSession['data']['plantUnitId'].length !== 0) {
        this.plantUnitIds = filterSession['data']['plantUnitId'];
      } else {
        this.plantUnitIds = [];
      }
    }
  }
  private clearFilter(type: string): void {
      this.appliedFilters['filterType'] = type;
      this.resetAppliedFilters(type);
      this.filtersService.clearFilter(this.appliedFilters['filterType'], true);
  }

  public clearAllFilter() {
    this.geoPanelIds = [];
    this.plantUnitIds = [];
    this.allEnteredIds = false;
    this.clearFilter('geoPanelId');
    this.clearFilter('plantUnitId');
  }

  public onApply() {
    this.isEnableLoader = true;
    this.removedInvalidChipsStatus = false;
    this.resetAppliedFilters();
    if (this.geoPanelIds.length !== 0) {
      this.appliedFilters['filterType'] = 'geoPanelId';
      this.appliedFilters['data'] = this.geoPanelIds;
      this.submitFilters();
    }
    if (this.plantUnitIds.length !== 0) {
      this.appliedFilters['filterType'] = 'plantUnitId';
      this.appliedFilters['data'] = this.plantUnitIds;
      this.submitFilters();
    }
    if (this.geoPanelIds.length === 0 && this.plantUnitIds.length === 0) {
      swal('', 'No valid valid IDs detected. Please enter valid IDs to search.', 'warning');
    }
  }

  private submitFilters(type = '') {
    this.appliedFilters['selectedMoreFilters'] = type;
    this.filtersService.setFilter(this.appliedFilters['filterType'], this.appliedFilters['data']);
  }
  private resetAppliedFilters(type = '') {
    this.appliedFilters = {
      data: [],
      filterType: type,
    };
  }
  public ngOnDestroy() {
    this.unSubscribe = false;
  }
  public clearUnitIds(type: string) {
    if (type === 'geoPanelId') {
      this.plantUnitIds = [];
    }
    if (type === 'plantUnitId') {
      this.geoPanelIds = [];
    }
  }
}
