import {
  Component,
  OnInit,
  OnChanges,
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
  Input,
  ChangeDetectorRef, SimpleChanges
} from '@angular/core';
import { mapTo, shareReplay } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { WorkspaceV3Service } from '../../workspace-v3.service';
import { Market2 } from '@interTypes/scenario.response';
import { CustomValidators } from '../../../validators/custom-validators.validator';
import { BehaviorSubject, Subject } from 'rxjs';
import {ScenarioPlanTabLabels} from '@interTypes/enums';

@Component({
  selector: 'app-define-target',
  templateUrl: './define-target.component.html',
  styleUrls: ['./define-target.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefineTargetComponent implements OnInit, OnChanges {
  @Input() selectedAudienceList: any = [];
  @Input() audienceSelectionType = 'multiple';
  @Input() selectedMarkets: any[];
  @Input() selectedMarketType: string;
  @Input() selectedPlanTab: string;
  @Input() selectedPlanFormCtrl: any = new FormControl();
  @Input() scheduleFormGroup: FormGroup;
  @Input() defineGoleFormGroup: FormGroup;
  @Input() deleteMarket: Subject<any>;
  @Input() deleteAudience: Subject<any>;
  @Input() scheduleFormSubmit$: Subject<any> = new Subject<any>();
  @Input() defineGoalFormSubmit$: Subject<any> = new Subject<any>();  
  @Output() selectAudience = new EventEmitter<any>();
  @Output() selectMarket = new EventEmitter<any>();
  @Output() updateDeleteMarket = new EventEmitter<any>();
  periodDurations = [];
  isScenario = true;
  openAudience = true;
  isInventory = false;
  includeType = 'sideBar';
  private deliveryGoalOptions = [
    { name: 'trp', value: 'TRP Plan Goal' },
    { name: 'imp', value: 'Target In-Mkt Imp Plan Goal' },
    { name: 'reach', value: 'Reach % Plan Goal' }
  ];
  public deliveryGoals = [];
  constructor(
    private workspaceV3Service: WorkspaceV3Service,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPlanPeriods();
    this.setDeliveryGoalOptions();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes.selectedAudienceList) {
      this.setDeliveryGoalOptions();
    }
  }
  addSelectedAudience(result: CompleteBrowsingEvent) {
    if (result?.targetAudience) {
      const resultAudience = [];

      result.targetAudience.map((aud) => {
        const index = this.selectedAudienceList.findIndex(
          (x) => x.id === aud.audience && x.measuresRelease === aud.measuresRelease
        );
        if (index < 0) {
          resultAudience.push({ name: aud.name, id: aud.audience, measuresRelease: aud.measuresRelease });
        }
      });

      this.selectedAudienceList = [
        ...this.selectedAudienceList,
        ...resultAudience
      ];
      this.setDeliveryGoalOptions();
      this.selectAudience.emit(this.selectedAudienceList);
    }
  }

  selectMarketList(result: MarketSelectEvent) {
    if (!result?.selectedOptions?.length) {
      return;
    }
    this.selectedMarkets = this.workspaceV3Service.setAndValidateMarkets(
      this.selectedMarkets,
      result.selectedOptions,
      result.addAsGroup,
      result.marketType
    );
    this.selectMarket.emit(this.selectedMarkets);
  }

  isOpened(arg: EventEmitter<void>) {
    return arg.pipe(mapTo(true), shareReplay(1));
  }

  isClosed(arg: EventEmitter<void>) {
    return arg.pipe(mapTo(false), shareReplay(1));
  }

  private loadPlanPeriods() {
    this.workspaceV3Service.getDurations().subscribe((durations) => {
      if (durations['durations']) {
        this.periodDurations = durations['durations'];
      } else {
        this.periodDurations = [
          { duration: 1, isDefault: true, unit: 'week' },
          { duration: 2, isDefault: false, unit: 'weeks' },
          { duration: 4, isDefault: false, unit: 'weeks' },
          { duration: 8, isDefault: false, unit: 'weeks' },
          { duration: 12, isDefault: false, unit: 'weeks' }
        ];
      }
    });
  }
  // To update selected audience list when an audience is removed
  public updateSelectedAudienceList(list) {
    this.selectedAudienceList = list;
    if (this.selectedPlanTab === ScenarioPlanTabLabels.MARKET_PLAN) {
      this.setDeliveryGoalOptions();
    }
    this.selectAudience.emit(this.selectedAudienceList);
  }
  private setDeliveryGoalOptions() {
    const shouldDisableReach = this.selectedAudienceList
      .some(item => {
        return item.measuresRelease === 2021 || item.measuresRelease === 202106;
      });
    if (shouldDisableReach || this.selectedAudienceList.length === 0) {
      const selectedData = this.defineGoleFormGroup
        .get('goals')['controls']['type'].value;
      if (selectedData === 'reach') {
        this.defineGoleFormGroup
          .get('goals')['controls']['type'].patchValue(null);
        this.defineGoleFormGroup
          .get('goals')['controls']['reach'].patchValue(null);
      }
      this.deliveryGoals = this.deliveryGoalOptions
        .filter(item => item.name !== 'reach');
    } else {
      this.deliveryGoals = this.deliveryGoalOptions;
    }
    this.cdRef.markForCheck();
  }
  // To update selected markets list when a market is removed
  public updateSelectedMarketsList(list) {
    this.selectedMarkets = list;
    this.updateDeleteMarket.emit(this.selectedMarkets);
  }
}

interface CompleteBrowsingEvent {
  targetAudience: any;
  selectedAudienceList: any;
  tabPosition: any;
  currentTargetKey: any;
  currentTargetId: any;
  editAudienceId: any;
  clearFilter: boolean;
  tabType: any;
}

interface MarketSelectEvent {
  selectedOptions: any;
  marketType: any;
  addAsGroup: boolean;
}
