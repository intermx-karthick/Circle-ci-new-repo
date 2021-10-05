import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output, AfterViewInit } from '@angular/core';

import { AbstractMediaFilterW3 } from '../abstract-media-filter-w3';
import { Helper } from '../../../../classes';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-material-filter-w3',
  templateUrl: './material-filter-w3.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialFilterComponentW3 extends AbstractMediaFilterW3<any>
  implements OnInit, OnDestroy, AfterViewInit {
  @Output() setMaterialMedias = new EventEmitter();

  selectedMaterial = '';
  loadedLoadedDigital: boolean;
  digitalCount: number;
  nonDigitalCount: number;

  materialMedias: {};

  static formatElasticResults(aggregated) {
    const result = [];
    if (aggregated['digitals'] && aggregated['digitals']['buckets']) {
      const temp = aggregated['digitals']['buckets'];
      const digital = temp.find((item) => item['key_as_string'] === 'true');
      const nonDigital = temp.find((item) => item['key_as_string'] === 'false');
      result['digital'] =
        (digital && digital['spots']['spot_filter']['spot_count']['value']) ||
        0;
      result['non-digital'] =
        (nonDigital &&
          nonDigital['spots']['spot_filter']['spot_count']['value']) ||
        0;
    }
    return result;
  }

  static formatMediaTypeResults(aggregated) {
    const result = [];
    if (aggregated['constructions'] && aggregated['constructions']['buckets']) {
      return aggregated['constructions']['buckets'];
    }
    return result;
  }

  ngOnInit(): void {
    this.setup();
    this.listenerForInitialLoad();
    this.listenerForResetSelections();
  }

  ngAfterViewInit(): void {
    if (this.moduleName === 'project') {
      setTimeout(() => {
        this.inventoryService.clearButtonSource
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe((res) => {
            this.selectedMaterial = '';
            this.cdRef.markForCheck();
          });
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  changeMaterial(value) {
    this.select.emit({ value });
  }

  clear() {
    this.selectedMaterial = null;
    this.select.emit({ value: null });
  }

  formQueryForCustomInventory(filters): any {
    let query = this.inventoryService.prepareInventoryQuery(filters);
    query = this.inventoryService.addDigitalQuery(query, filters);
    query['size'] = 0;
    return query;
  }

  formatCustomInventoryData(response): any {
    let data = {};
    data['digital'] = MaterialFilterComponentW3.formatElasticResults(response);
    data['medias'] = MaterialFilterComponentW3.formatMediaTypeResults(response);
    return data;
  }

  formatFiltersForCustomInventoryPayload(filter): any {
    const filters = Helper.deepClone(filter);
    if (typeof filters['digital']) {
      delete filters['digital'];
    }
    delete filters['gp_ids'];
    delete filters['custom_ids'];
    return filters;
  }

  getCatchSourceData(): any {
    return this.commonService.getMaterialCounts();
  }

  handleAPIsResponse(
    [summaries, elastic]: readonly [any, any],
    selected
  ): void {
    let digitalCount = 0;
    let nonDigitalCount = 0;
    const materialMedias = { digital: [], nondigital: [] };

    summaries.map((summary) => {
      if (
        summary['summarizes'] &&
        summary['summarizes']['summarizes_id_list'] &&
        summary['summarizes']['summarizes_id_list'][1]
      ) {
        if (
          summary['summarizes']['summarizes_id_list'][0][
            'name'
          ].toLowerCase() === 'true'
        ) {
          digitalCount += summary['spots'];
          materialMedias['digital'].push(
            summary['summarizes']['summarizes_id_list'][1]['name']
          );
        } else {
          materialMedias['nondigital'].push(
            summary['summarizes']['summarizes_id_list'][1]['name']
          );
          nonDigitalCount += summary['spots'];
        }
      }
    });
    if (elastic && elastic['digital'] && elastic['digital']['digital']) {
      digitalCount += elastic['digital']['digital'];
    }
    if (elastic && elastic['digital'] && elastic['digital']['non-digital']) {
      nonDigitalCount += elastic['digital']['non-digital'];
    }

    this.digitalCount = digitalCount;
    this.nonDigitalCount = nonDigitalCount;
    this.materialMedias = materialMedias;
    this.setMaterialMedias.emit(materialMedias);

    if (this.moduleName === 'project') {
      this.commonService.setMaterialCounts({
        digital: digitalCount,
        nondigital: nonDigitalCount,
        materialMedias: materialMedias
      });
    }

    this.isLoadedData = true;
    this.destroyInitiator();
    this.cdRef.markForCheck();
  }

  normalizeFilters(filters): any {
    filters['summary_level_list'] = ['Digital', 'Frame Media'];
    return filters;
  }

  setDataSourceForScenarioMarketPlan(): void {
    const response = {};

    if (this.mediaTypesDataForEdit?.editData) {
      if (this.mediaTypesDataForEdit.editData?.['ids']) {
        this.selectedMaterial = this.mediaTypesDataForEdit.editData['ids'][
          'material'
        ];
      }

      if (
        (this.mediaTypesDataForEdit.editData['isDigital'] !== undefined &&
          this.mediaTypesDataForEdit.editData['isDigital']) ||
        (this.mediaTypesDataForEdit.editData['isNonDigital'] !== undefined &&
          this.mediaTypesDataForEdit.editData['isNonDigital'])
      ) {
        if (
          this.mediaTypesDataForEdit.editData['isDigital'] &&
          this.mediaTypesDataForEdit.editData['isNonDigital']
        ) {
          this.selectedMaterial = 'both';
        } else {
          this.selectedMaterial =
            (this.mediaTypesDataForEdit.editData['isDigital'] && 'true') ||
            'false';
        }
      }
    }

    const filters = this.normalizeFilters(response);
    // filters.measures_range_list = [{ type: 'imp', min: 0 }];
    filters['measures_required'] = false;
    filters['status_type_name_list'] = ['*'];
    if(filters['sort']) {
      delete filters['sort'];
    }
    this.loadDataSource(filters);
  }

  loadFromSessions(selected): boolean {
    const data = this.getCatchSourceData();
    if (data) {
      this.digitalCount = data['digital'];
      this.nonDigitalCount = data['nondigital'];
      this.materialMedias = data['materialMedias'];
      this.setMaterialMedias.emit(data['materialMedias']);

      this.isLoadedData = true;
      this.destroyInitiator();
      this.cdRef.markForCheck();
      return true;
    }

    return false;
  }

  setSelectedFiltersFromFiltersState(response) {
    if (response?.data?.mediaTypeList?.ids) {
      this.selectedMaterial = response.data.mediaTypeList.ids?.material;
      return this.selectedMaterial as any;
    }
  }
}
