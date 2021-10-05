import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';

import { FiltersService } from '../../../explore/filters/filters.service';
import { AuthenticationService, CommonService, InventoryService } from '@shared/services';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';

/**
 * @description
 *    This is the abstract class for media types, structure
 *  types and media class filters of media type section. Which
 *  derived common functionalities and has interface to handle the
 *  filter state changes {@member handleFilterStateChanges} for explore
 *  module and loading data source for scenario market plan
 *  {@member setDataSourceForScenarioMarketPlan}.
 *
 */
@Component({
  template: ''
})
export abstract class AbstractMediaFilter<T extends any> extends AbstractLazyLoadComponent {

  @Input() moduleName: string;
  @Input() mediaTypesDataForEdit: any;
  @Output() select = new EventEmitter();

  dataSource: T[] = [];
  selected: T[] = [];
  isInitialLoadCompleted: boolean = false;
  unsubscribeInitiator$: Subject<void> = new Subject<void>();
  customInventoryAllowed: boolean = false;
  editMediaTypes: boolean = false;
  isLoadedData = false;

  protected unsubscribe$ = new Subject();

  constructor(
    protected filterService: FiltersService,
    protected inventoryService: InventoryService,
    protected commonService: CommonService,
    protected auth: AuthenticationService,
    protected cdRef: ChangeDetectorRef
  ) {
    super();
  }

  /**
   * @description
   *  loading data for scenario market plan
   */
  abstract setDataSourceForScenarioMarketPlan(): void;

  /**
   * @description
   *  Form the query for custom inventory elastic
   *  service.
   *
   * @param filters
   */
  abstract formQueryForCustomInventory(filters): any;

  /**
   * @description
   *  Format the custom inventory es service response
   *  data.
   * @param response
   */
  abstract formatCustomInventoryData(response): Array<any>;

  /**
   * @description
   *    Get the catch data from the common
   *  service.
   */
  abstract getCatchSourceData(): any;

  /**
   * @description
   *  Set the selected data from the filters changes
   *  listener.
   *
   * @param response
   */
  abstract setSelectedFiltersFromFiltersState(response): any[];

  /**
   * @description
   *   Format the filters for custom inventory elastic
   *
   *  service
   * @param filter
   */
  abstract formatFiltersForCustomInventoryPayload(filter): any;

  /**
   * @description
   *   Set the the data to data source from the apis
   *  response and update selected state.
   *
   * @param summaries
   * @param elastic
   * @param selected
   */
  abstract handleAPIsResponse([summaries, elastic], selected): void;

  /**
   * @description
   *   Normalizing the filters using FiltersService#normalizeFilterDataNew
   * add specific summary_level_list type.
   *
   * @param response
   */
  abstract normalizeFilters(response): any;

  setup() {
    const explorePermissions = this.auth.getModuleAccess('explore');
    this.customInventoryAllowed = explorePermissions?.features?.customInventories?.status === 'active';
  }

  init(): void {
    this.cdRef.markForCheck();

    if (this.moduleName === 'project') {
      this.editMediaTypes = !!this.mediaTypesDataForEdit?.editData;
      this.setDataSourceForScenarioMarketPlan();
      return;
    }

    this.listenerForFilterStateChanges();
  }

  /**
   * @description
   *  Which is used to handle the selecting
   *  checkbox.
   * @param option
   */
  onSelectOption(option: any) {
    option.selected = !option.selected;

    if (this.selected.length > 0) {
      const index = this.selected.indexOf(option.name);
      if (!option.selected && index > -1) {
        this.selected.splice(index, 1);
      } else if (option.selected && index === -1) {
        this.selected.push(option.name);
      }
    } else if (option.selected) {
      this.selected.push(option.name);
    }

    this.select.emit(this.selected);
  }

  protected listenerForFilterStateChanges() {
    this.filterService.getFilters()
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(response => {
        this.handleFilterStateChanges(response);
      });
  }

  protected listenerForResetSelections() {
    this.filterService.onReset()
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(type => {
        if (type === 'FilterInventory' || type === 'All') {
          this.clear();
        }
      });
  }

  protected clear(){
    this.dataSource.map((item: any) => item.selected = false);
    this.setAndEmitSelectedData([]);
    this.cdRef.markForCheck();
  }

  protected handleFilterStateChanges(response: any): void {
    let selectedFilters = this.setSelectedFiltersFromFiltersState(response);
    const filters = this.normalizeFilters(response);
    filters['measures_required'] = false;
    filters['status_type_name_list'] = ['*'];
    if (filters['sort']) {
      delete filters['sort'];
    }
    if (filters['data']) {
      delete filters['data'];
      delete filters['selection'];
    }
    this.loadDataSource(filters, selectedFilters);
  }

  protected loadDataSource(filter = {}, selected = []) {
    this.isLoadedData = false;

    const isLoadedFromSessions = this.loadFromSessions(selected);
    if (isLoadedFromSessions) {
      this.isLoadedData = true;
      return;
    }

    const filters = this.formatFiltersForCustomInventoryPayload(filter);

    let customInventoy: Observable<any> = this.queryFromCustomInventoryESService(filters);
    forkJoin([
      this.inventoryService.getFilterData(filters).pipe(
        takeUntil(this.unsubscribe$),
        map((data) => data.summaries)
      ),
      customInventoy
    ])
      .subscribe((response) => {
        this.handleAPIsResponse(response, selected);
        this.isLoadedData = true;
        this.destroyInitiator();
        this.cdRef.markForCheck();
      });
  }

  protected loadFromSessions(selected): boolean {

    const data = this.getCatchSourceData();
    if (data) {
      data.forEach(parent => {
        parent.selected = selected.includes(parent.name);
      });

      this.dataSource = data;
      this.destroyInitiator();
      this.cdRef.markForCheck();
      return true;
    }

    return false;
  }

  protected queryFromCustomInventoryESService(filters) {

    if (this.customInventoryAllowed && this.inventoryService.checkToCallCustomInv(filters)) {

      let query = this.formQueryForCustomInventory(filters);
      return this.inventoryService.getFilterDataElastic(false, query)
        .pipe(
          map(this.formatCustomInventoryData),
          debounceTime(200),
          distinctUntilChanged(),
          takeUntil(this.unsubscribe$)
        );
    }

    return of([]);
  }

  protected setAndEmitSelectedData(selected) {
    if (Array.isArray(selected) && selected.length > 0) {
      this.selected = selected;
      this.select.emit(this.selected);
    } else {
      this.selected = [];
      this.select.emit([]);
    }
  }

  static prepareOptionsFromData(summaries, elastic, selected = []) {
    let options = [];
    summaries.forEach(d => {
      let codeCount = 0;
      options.push({
        id: d.summarizes.id,
        name: d.summarizes.name,
        count: d.spots + codeCount,
        disabled: false,
        selected: selected.includes(d.summarizes.name)
      });
    });
    elastic.forEach(item => {
      const optIndex = options.findIndex(option => option.name === item.key);
      if (optIndex !== -1) {
        options[optIndex]['count'] += item['count'];
      } else {
        options.push({
          id: item.key,
          name: item.key,
          count: item.count,
          disabled: false,
          selected: selected.includes(item.key)
        });
      }
    });
    options = options.sort((a, b) => {
      if (a.count > b.count) {
        return -1;
      }
      if (b.count > a.count) {
        return 1;
      }
      return 0;
    });
    return options;
  }

}
