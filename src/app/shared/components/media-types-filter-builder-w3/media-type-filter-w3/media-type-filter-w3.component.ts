import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';

import { AbstractMediaFilterW3 } from '../abstract-media-filter-w3';
import { Helper } from '../../../../classes';


@Component({
  selector: 'app-media-type-filter-w3',
  templateUrl: './media-type-filter-w3.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaTypeFilterComponentW3 extends AbstractMediaFilterW3<any> implements OnInit, OnDestroy, AfterViewInit {

  ngOnInit(): void {
    this.setup();
    this.listenerForInitialLoad();
    this.listenerForResetSelections();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit(): void {
    this.clearProjectInventory(); 
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

  setSelectedFiltersFromFiltersState(response): any[]{
    let selectedFilters = [];

    if (response?.data?.mediaTypeList?.ids) {
      selectedFilters = response.data.mediaTypeList.ids?.mediaTypes || [];
      this.setAndEmitSelectedData(selectedFilters);
    } else this.setAndEmitSelectedData([]);
    this.cdRef.markForCheck();

    return selectedFilters;
  }

  formQueryForCustomInventory(filters): any {
    let query = this.inventoryService.prepareInventoryQuery(filters);
    query = this.inventoryService.addMediaTypeGroupQuery(query, filters);
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

  getCatchSourceData(): any {
    return this.commonService.getMediaNameTypes();
  }

  formatFiltersForCustomInventoryPayload(filter){
    const filters = Helper.deepClone(filter);
    if (filters['media_type_list']) {
      delete filters['media_type_list'];
    }
    delete filters['gp_ids'];
    delete filters['custom_ids'];
    return filters;
  }

  handleAPIsResponse([summaries, elastic], selected){
    this.dataSource = AbstractMediaFilterW3.prepareOptionsFromData(summaries, elastic, selected);
    if (this.moduleName === 'project') {
      this.commonService.setMediaNameTypes(Helper.deepClone(this.dataSource));
    }
  }

  normalizeFilters(response) {
    let filters = this.filterService.normalizeFilterDataNew(response);
    filters.summary_level_list = [
      'Media Type'
    ];

    return filters;
  }
}
