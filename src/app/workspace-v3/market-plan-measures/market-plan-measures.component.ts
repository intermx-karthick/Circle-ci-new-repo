import {
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MarketPlanService } from '../market-plan.service';
import { debounceTime } from 'rxjs/operators';
import { AuthenticationService } from '@shared/services';
import { Helper } from 'app/classes';
import { ViewByFilter } from '@interTypes/enums';

@Component({
  selector: 'app-market-plan-measures',
  templateUrl: './market-plan-measures.component.html',
  styleUrls: ['./market-plan-measures.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketPlanMeasuresComponent implements OnInit {
  @Input() plans = [];
  @Input() planData = [];
  @Input() scenarioId;
  @Input() selectedMediaType;
  @Output() updatePlanTotal: EventEmitter<any> = new EventEmitter();
  @Input() projectOwnerEmail;
  @Input() userEmail;
  public isSaveingPlan: any = null;
  public savingPlanInput = null;
  public customInventoryAllowed = false;
  @Input() displayedColumns: string[] = [
    'MediaType',
    'Required/Total In Market',
    'Trp',
    'Reach',
    'Reach Net',
    'Frequency',
    'Target In-Market Imp',
    'Target Imp',
    'Total Imp',
    'actions'
  ];
  dataSource = new MatTableDataSource([]);
  constructor(
    private marketPlanService: MarketPlanService,
    private auth: AuthenticationService
  ) {}

  ngOnInit() {
    this.dataSource.data = this.plans;
    const explorePermissions = this.auth.getModuleAccess('explore');
    if (
      explorePermissions?.['features']?.['customInventories']?.['status'] ===
      'active'
    ) {
      this.customInventoryAllowed = true;
    }
  }
  onEditFieldValue(value, element, field) {
    if (Object.keys(value).length !== 0 && element[field] === Number(value)) {
      return false;
    }
    this.isSaveingPlan = element;
    this.savingPlanInput = field;
    const currentPlan = {};
    let lockFlag = true;
    let locks = [];
    currentPlan['plan'] = Helper.deepClone(element);
    currentPlan['changes'] = { field: field, value: value };
    const lock = {
      allocationIndex: element.allocationIndex,
      field: field,
      value: value
    };
    if (element.id === this.planData['id'] && this.scenarioId) {
      const allocation = this.planData['planData']['allocation_list'][
        element.allocationIndex
      ];
      allocation['measures']['spots'] = null;
      allocation['measures']['trp'] = null;
      allocation['measures']['reach_pct'] = null;
      allocation['measures']['freq_avg'] = null;
      allocation['measures']['eff_reach_pct'] = null;
      allocation['measures']['eff_freq_avg'] = null;
      allocation['measures']['imp_target_inmkt'] = null;
      allocation['measures']['reach_net'] = null;
      allocation['measures']['eff_reach_net'] = null;
      allocation['measures'][field] = Number(value);
      this.planData['planData']['allocation_list'][
        element.allocationIndex
      ] = allocation;
      if (allocation['media_type_group']) {
        lock['frame_media_name_list'] =
          allocation['media_type_group']['frame_media_name_list'] !== null
            ? allocation['media_type_group']['frame_media_name_list']
            : [];
        lock['operator_name_list'] =
          allocation['media_type_group']['operator_name_list'] !== null
            ? allocation['media_type_group']['operator_name_list']
            : [];
        lock['classification_type_list'] =
          allocation['media_type_group']['classification_type_list'] !== null
            ? allocation['media_type_group']['classification_type_list']
            : [];
        lock['construction_type_list'] =
          allocation['media_type_group']['construction_type_list'] !== null
            ? allocation['media_type_group']['construction_type_list']
            : [];
        lock['media_type_list'] =
          allocation['media_type_group']['media_type_list'] !== null
            ? allocation['media_type_group']['media_type_list']
            : [];
      }
      if (typeof this.planData['query']['locks'] !== 'undefined') {
        locks = this.planData['query']['locks'];
      }

      // Update my plan list TRP Frequency and reach

      const summary = this.planData['planData']['summaries'];
      // summary['total']['measures']['trp'] = null;
      summary['total']['measures']['reach_pct'] = null;
      summary['total']['measures']['reach_net'] = null;
      summary['total']['measures']['freq_avg'] = null;
      summary['total']['measures']['eff_reach_pct'] = null;
      summary['total']['measures']['eff_freq_avg'] = null;
      summary['total']['measures']['imp_target_inmkt'] = null;

      if (this.selectedMediaType === ViewByFilter.MEDIA) {
        const mediaGroup = Helper.deepClone(summary['by_media_type_group']);
        let currentMediaIndex = null;
        for (
          let i = 0;
          i <
          this.planData['planData']['summaries']['by_media_type_group'].length;
          i++
        ) {
          const ele = this.planData['planData']['summaries'][
            'by_media_type_group'
          ][i];
          let isMediaTypeMatched = false;
          const mediasGroupJoins =
            (allocation &&
              allocation['media_type_group']['frame_media_name_list']
                .sort()
                .join(',')) ||
            '';
          if (
            ele['media_type_group']['frame_media_name_list'] &&
            ele['media_type_group']['frame_media_name_list']
              .sort()
              .join(',') === mediasGroupJoins
          ) {
            isMediaTypeMatched = true;
          }
          let isMediasMatched = false;
          if (allocation && allocation['media_type_group']['media_type_list']) {
            const medias =
              (allocation &&
                allocation['media_type_group']['media_type_list']
                  .sort()
                  .join(',')) ||
              '';
            if (
              !ele['media_type_group']['media_type_list'] ||
              ele['media_type_group']['media_type_list'].sort().join(',') ===
                medias
            ) {
              isMediasMatched = true;
            }
          } else {
            isMediasMatched = true;
          }
          let isConstructionTypeMatched = false;
          if (
            allocation &&
            allocation['media_type_group']['construction_type_list']
          ) {
            const constructionGroupJoins =
              (allocation &&
                allocation['media_type_group']['construction_type_list']
                  .sort()
                  .join(',')) ||
              '';
            if (
              !ele['media_type_group']['construction_type_list'] ||
              ele['media_type_group']['construction_type_list']
                .sort()
                .join(',') === constructionGroupJoins
            ) {
              isConstructionTypeMatched = true;
            }
          } else {
            isConstructionTypeMatched = true;
          }
          let isClassificationTypeMatched = false;
          if (
            allocation &&
            allocation['media_type_group']['classification_type_list']
          ) {
            const classificationGroupJoins =
              (allocation &&
                allocation['media_type_group']['classification_type_list']
                  .sort()
                  .join(',')) ||
              '';
            if (
              !ele['media_type_group']['classification_type_list'] ||
              ele['media_type_group']['classification_type_list']
                .sort()
                .join(',') === classificationGroupJoins
            ) {
              isClassificationTypeMatched = true;
            }
          } else {
            isClassificationTypeMatched = true;
          }
          if (
            isMediaTypeMatched &&
            isMediasMatched &&
            isConstructionTypeMatched &&
            isClassificationTypeMatched
          ) {
            currentMediaIndex = i;
            break;
          }
        }
        if (currentMediaIndex !== null) {
          // mediaGroup[currentMediaIndex]['measures']['trp'] = null;
          mediaGroup[currentMediaIndex]['measures']['reach_pct'] = null;
          mediaGroup[currentMediaIndex]['measures']['reach_net'] = null;
          mediaGroup[currentMediaIndex]['measures']['freq_avg'] = null;
          mediaGroup[currentMediaIndex]['measures']['eff_reach_pct'] = null;
          mediaGroup[currentMediaIndex]['measures']['eff_reach_net'] = null;
          mediaGroup[currentMediaIndex]['measures']['eff_freq_avg'] = null;
          mediaGroup[currentMediaIndex]['measures']['imp_target_inmkt'] = null;
          summary['by_media_type_group'] = mediaGroup;
        }
      } else if (this.selectedMediaType === ViewByFilter.OPERATOR) {
        const operatorGroup = Helper.deepClone(summary['by_operator']);
        let currentMediaIndex = null;
        for (
          let i = 0;
          i < this.planData['planData']['summaries']['by_operator'].length;
          i++
        ) {
          const ele = this.planData['planData']['summaries']['by_operator'][i];
          let isMediaTypeMatched = false;
          if (
            ele['media_type_group']['operator_name_list'] &&
            ele['media_type_group']['operator_name_list'].sort().join(',') ===
              element['parent']
          ) {
            isMediaTypeMatched = true;
          }
          if (isMediaTypeMatched) {
            currentMediaIndex = i;
            break;
          }
        }
        if (currentMediaIndex !== null) {
          // mediaGroup[currentMediaIndex]['measures']['trp'] = null;
          operatorGroup[currentMediaIndex]['measures']['reach_pct'] = null;
          operatorGroup[currentMediaIndex]['measures']['reach_net'] = null;
          operatorGroup[currentMediaIndex]['measures']['freq_avg'] = null;
          operatorGroup[currentMediaIndex]['measures']['eff_reach_pct'] = null;
          operatorGroup[currentMediaIndex]['measures']['eff_reach_net'] = null;
          operatorGroup[currentMediaIndex]['measures']['eff_freq_avg'] = null;
          operatorGroup[currentMediaIndex]['measures'][
            'imp_target_inmkt'
          ] = null;

          summary['by_operator'] = operatorGroup;
        }
      }
      this.planData['planData']['summaries'] = summary;
      /* const measures = this.planData['planData']['summaries']['total']['measures'];
      if (element['reach'] !== '') {
        measures['reach_net'] = measures['reach_net'] - Number(element['reach']);
        measures['eff_reach_net'] = measures['eff_reach_net'] - Number(element['reach']);
      }
      if (element['frequency'] !== '') {
        measures['freq_avg'] = measures['freq_avg'] - Number(element['frequency']);
        measures['eff_freq_avg'] = measures['eff_freq_avg'] - Number(element['frequency']);
      }
      if (element['spots'] !== '') {
        measures['spots'] = measures['spots'] - Number(element['spots']);
      }
      if (element['trp'] !== '') {
        measures['trp'] = measures['trp'] - Number(element['trp']);
      }
      this.planData['planData']['summaries']['total']['measures'] = measures; */
      locks.map((lck) => {
        if (
          this.compare(
            lock['frame_media_name_list'],
            lck['frame_media_name_list']
          ) &&
          this.compare(lock['operator_name_list'], lck['operator_name_list']) &&
          this.compare(lock['media_type_list'], lck['media_type_list']) &&
          this.compare(
            lock['classification_type_list'],
            lck['classification_type_list']
          ) &&
          this.compare(
            lock['construction_type_list'],
            lck['construction_type_list']
          )
        ) {
          lck['field'] = lock['field'];
          lck['value'] = lock['value'];
          lockFlag = false;
        }
      });
      if (lockFlag) {
        locks.push(lock);
      }
      this.planData['query']['locks'] = currentPlan['locks'] = locks;
      this.planData['query']['mediaTypeFilters'].map((m, i) => {
        if (m['data'] === element['mediaType']) {
          m['locks'] = { field: field, value: value };
        }
      });
      const updatePlan = {
        query: this.planData['query'],
        plan: this.planData['planData']
      };
      this.marketPlanService
        .updateSinglePlan(this.scenarioId, element.id, updatePlan)
        .pipe(debounceTime(2000))
        .subscribe((response) => {
          this.isSaveingPlan = null;
          this.savingPlanInput = null;
          this.plans.map((plan) => {
            if (plan['allocationIndex'] === element.allocationIndex) {
              plan['reach'] = '';
              plan['reachNet'] = '';
              plan['spots'] = '';
              plan['frequency'] = '';
              plan['trp'] = '';
              plan['targetInMarketImp'] = '';
              plan[field] = Number(value);
              this.updatePlanTotal.emit(currentPlan);
            }
          });
        });
    }
  }
  // compare(arr1, arr2) {
  //   return arr1.sort().toString() === arr2.sort().toString();
  // }
  compare(arr1, arr2) {
    if (arr1 && arr2) {
      return arr1.sort().toString() === arr2.sort().toString();
    } else if (arr1 === null && arr2 === null) {
      return;
    }
  }
}
