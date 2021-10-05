import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';

import { AbstractMediaFilter } from '../abstract-media-filter';
import { Helper } from '../../../../classes';

@Component({
  selector: 'app-operator-media-name-filter',
  templateUrl: './operator-media-name-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperatorMediaNameFilterComponent extends AbstractMediaFilter<any> implements OnInit, OnDestroy {

  filteredOperatorMediaName = [];
  searchQuery = '';

  get showNotFound(): boolean{
    return (
      Array.isArray(this.filteredOperatorMediaName) &&
      this.filteredOperatorMediaName.length <= 0 &&
      this.isInitiated &&
      this.isInitialLoadCompleted
    );
  }

  ngOnInit(): void {
    this.setup();
    this.listenerForInitialLoad();
    this.listenerForResetSelections();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  filterOperators(data: any) {
    if (data.emptySearch) {
      this.filteredOperatorMediaName = this.dataSource;
    } else {
      this.filteredOperatorMediaName = data.value;
    }
    this.cdRef.markForCheck();
  }

  setDataSourceForScenarioMarketPlan(): void {
    const response = {};
    const selected = this.mediaTypesDataForEdit?.editData?.ids?.medias ?? [];

    const filters = this.normalizeFilters(response);
    /* filters.measures_range_list = [
      { 'type': 'imp', 'min': 0 }
    ]; */
    filters['measures_required'] = false;
    filters['status_type_name_list'] = ['*'];
    if(filters['sort']) {
      delete filters['sort'];
    }
    this.loadDataSource(filters, selected);
  }

  protected loadFromSessions(selected): boolean {

    const data = this.getCatchSourceData();
    if (data) {
      data.forEach(parent => {
        parent.selected = selected.includes(parent.name);
      });

      this.dataSource = data;
      this.filteredOperatorMediaName = this.dataSource;
      this.destroyInitiator();
      this.cdRef.markForCheck();
      return true;
    }

    return false;
  }

  protected clear(){
    this.searchQuery = '';
    this.filteredOperatorMediaName.map((item: any) => item.selected = false);
    super.clear();
  }

  setSelectedFiltersFromFiltersState(response): any[] {
    let selectedFilters = [];

    if (response?.data?.mediaTypeList?.ids) {
      selectedFilters = response.data.mediaTypeList.ids?.medias || [];
      this.setAndEmitSelectedData(selectedFilters);
    } else this.setAndEmitSelectedData([]);
    this.cdRef.markForCheck();

    return selectedFilters;
  }

  getCatchSourceData(): any {
    return this.commonService.getMediaTypes()
  }

  formQueryForCustomInventory(filters): any {
    let query = this.inventoryService.prepareInventoryQuery(filters);
    query = this.inventoryService.addMediaNamesGroupQuery(query, filters);
    query['size'] = 0;

    return query;
  }

  formatCustomInventoryData(response): Array<any> {
    const mediaNames = [];
    response['media_types']['buckets'].forEach(item => {
      const mediaName = {
        'key': item['key'],
        'count': item['spots']['spot_filter']['spot_count']['value']
      };
      mediaNames.push(mediaName);
    });

    return mediaNames;
  }

  formatFiltersForCustomInventoryPayload(filter): any {
    const filters = Helper.deepClone(filter);
    if (filters['frame_media_name_list']) {
      delete filters['frame_media_name_list'];
    }
    delete filters['gp_ids'];
    delete filters['custom_ids'];

    return filters;
  }

  handleAPIsResponse([summaries, elastic]: readonly [any, any], selected): void {

    const mediaNames = AbstractMediaFilter.prepareOptionsFromData(summaries, elastic, selected);
    this.dataSource = mediaNames;

    if (this.searchQuery && this.searchQuery.length > 0) {
      this.filteredOperatorMediaName = this.dataSource.filter((data) => {
        return data.name.toLowerCase().match(this.searchQuery)
      });
    } else {
      this.filteredOperatorMediaName = this.dataSource;
    }

    if (this.moduleName === 'project') {
      this.commonService.setMediaTypes(Helper.deepClone(mediaNames));
    }
  }

  normalizeFilters(response): any {
    let filters = this.filterService.normalizeFilterDataNew(response);
    filters.summary_level_list = [
      'Frame Media'
    ];

    return filters;
  }
}
