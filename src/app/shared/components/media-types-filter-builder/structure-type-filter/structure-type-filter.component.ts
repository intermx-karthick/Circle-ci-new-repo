import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';

import { Helper } from '../../../../classes';
import { AbstractMediaFilter } from '../abstract-media-filter';

@Component({
  selector: 'app-structure-type-filter',
  templateUrl: './structure-type-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StructureTypeFilterComponent extends AbstractMediaFilter<any> implements OnInit, OnDestroy {

  ngOnInit(): void {
    this.setup();
    this.listenerForInitialLoad();
    this.listenerForResetSelections();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  trackById(index: number, construction: any) {
    return construction.id;
  }

  setSelectedFiltersFromFiltersState(response): any[] {
    let selectedFilters = [];

    if (response?.data?.mediaTypeList?.ids) {
      selectedFilters = response.data.mediaTypeList.ids?.construction || [];
      this.setAndEmitSelectedData(selectedFilters);
    } else this.setAndEmitSelectedData([]);
    this.cdRef.markForCheck();

    return selectedFilters;
  }

  setDataSourceForScenarioMarketPlan() {
    const response = {};
    const selected = this.mediaTypesDataForEdit?.editData?.ids?.construction ?? [];

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

  getCatchSourceData(): any {
    return this.commonService.getConstructionTypes();
  }

  formQueryForCustomInventory(filters): any {
    let query = this.inventoryService.prepareInventoryQuery(filters);
    query = this.inventoryService.addConstructionQuery(query, filters);
    query['size'] = 0;
    return query;
  }

  formatCustomInventoryData(response): Array<any> {
    const constructions = [];
    response['constructions']['buckets'].forEach(item => {
      const construction = {
        'key': item['key'],
        'count': item['spots']['spot_filter']['spot_count']['value']
      };
      constructions.push(construction);
    });

    return constructions;
  }

  formatFiltersForCustomInventoryPayload(filter): any {
    const filters = Helper.deepClone(filter);
    if (filters['construction_type_list']) {
      delete filters['construction_type_list'];
    }
    delete filters['gp_ids'];
    delete filters['custom_ids'];
    return filters;
  }

  handleAPIsResponse([summaries, elastic]: readonly [any, any], selected): void {
    this.dataSource = AbstractMediaFilter.prepareOptionsFromData(summaries, elastic, selected);
    if (this.moduleName === 'project') {
      this.commonService.setConstructionTypes(Helper.deepClone(this.dataSource));
    }
  }

  normalizeFilters(response){
    const filters = this.filterService.normalizeFilterDataNew(response);
    filters.summary_level_list = [
      'Construction Type'
    ];

    return filters;
  }
}
