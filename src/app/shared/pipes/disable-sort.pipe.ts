import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'disableSort'})
export class DisableSortPipe implements PipeTransform {

  transform(value: any) {
    /** Disable temporarily to implement IMXUI1900 */
    /* const sortEnabledFor = ['measures_type','period_days','base_segment','target_segment','target_geo','market','index_comp_target','pct_comp_pop_target_inmkt','pct_comp_imp_target','pct_comp_imp_target_inmkt','freq_avg','imp_target_inmkt','imp_target','imp_inmkt','imp','pct_imp_inmkt','pct_imp_target_inmkt','pop_inmkt','pop_target_inmkt','reach_pct','reach_net','trp','eff_freq_min','eff_freq_avg','eff_reach_net','eff_reach_pct','out_market_imp','per_out_market_imp', 'frame_id', ];
    if (sortEnabledFor.includes(value)) {
      return false;
    } */
    return true;
  }
}

