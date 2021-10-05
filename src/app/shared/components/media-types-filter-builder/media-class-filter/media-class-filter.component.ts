import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';

import { AbstractMediaFilter } from '../abstract-media-filter';
import { Helper } from '../../../../classes';

@Component({
  selector: 'app-media-class-filter',
  templateUrl: './media-class-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaClassFilterComponent extends AbstractMediaFilter<any> implements OnInit, OnDestroy {

  ngOnInit(): void {
    this.setup();
    this.listenerForInitialLoad();
    this.listenerForResetSelections();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  setDataSourceForScenarioMarketPlan(): void {
    const response = {};
    const selected = this.mediaTypesDataForEdit?.editData?.ids?.environments ?? [];

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

  setSelectedFiltersFromFiltersState(response): any[] {
    let selectedFilters = [];

    if (response?.data?.mediaTypeList?.ids) {
      selectedFilters = response.data.mediaTypeList.ids?.environments || [];
      this.setAndEmitSelectedData(selectedFilters);
    } else {
      this.setAndEmitSelectedData([]);
    }
    this.cdRef.markForCheck();

    return selectedFilters;
  }

  getCatchSourceData(): any {
    if (this.moduleName === 'project') {
      return this.commonService.getClassificationTypes();
    }
    return null;
  }

  formQueryForCustomInventory(filters): any {
    let query = this.inventoryService.prepareInventoryQuery(filters);
    query = this.inventoryService.addClassificationQuery(query, filters);
    query['size'] = 0;

    return query;
  }

  formatCustomInventoryData(response): Array<any> {
    const classification = [];

    response['classification']['buckets'].forEach(item => {
      const classified = {
        'key': item['key'],
        'count': item['spots']['spot_filter']['spot_count']['value']
      };
      classification.push(classified);
    });

    return classification;
  }

  formatFiltersForCustomInventoryPayload(filter): any {
    const filters = Helper.deepClone(filter);
    if (filters['classification_type_list']) {
      delete filters['classification_type_list'];
    }
    delete filters['gp_ids'];
    delete filters['custom_ids'];
    return  filters;
  }

  handleAPIsResponse([summaries, elastic], selected) {

    const classifications = AbstractMediaFilter.prepareOptionsFromData(summaries, elastic, selected);
    const keys = classifications.map(c => c.id);

    if (!keys.includes('1') && !keys.includes('Roadside')) {
      classifications.push({
        name: 'Roadside',
        count: 0,
        disabled: false,
        selected: false
      });
    }

    if (!keys.includes('4') && !keys.includes('Place Based')) {
      classifications.push({
        name: 'Place Based',
        count: 0,
        disabled: false,
        selected: false
      });
    }

    if (this.moduleName === 'project') {
      this.commonService.setClassificationTypes(Helper.deepClone(classifications));
    }

    this.dataSource = classifications;
  }

  normalizeFilters(response) {
    let filters = this.filterService.normalizeFilterDataNew(response);
    filters.summary_level_list = [
      'Classification Type'
    ];

    return filters;
  }
}
