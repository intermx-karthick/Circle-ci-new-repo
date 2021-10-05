import { Pipe, PipeTransform  } from '@angular/core';

@Pipe({
  name: 'canSort',
  pure: true
})
export class InventoryListSortTogglePipe implements PipeTransform {
  private allowedKeys = ['imp',
    'imp_target',
    'pct_comp_imp_target',
    'imp_inmkt',
    'pct_imp_inmkt',
    'imp_target_inmkt',
    'tgtinmp',
    'pct_imp_target_inmkt',
    'index_comp_target',
    'trp',
    'reach_pct',
    'freq_avg',
    'frame_id',
    'plant_frame_id',
    'reach_net',
    'comp' ,
    'index'
  ];
  transform(tableKey: string): boolean {
    return !this.allowedKeys.includes(tableKey);
  }
}
