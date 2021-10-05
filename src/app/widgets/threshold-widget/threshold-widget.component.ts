import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  EventEmitter,
  Input,
  Output,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { ThresholdWidget } from '@interTypes/threshold';
import { LabelType, Options } from '@angular-slider/ngx-slider';
import { ConvertPipe } from '@shared/pipes/convert.pipe';
import { Observable } from 'rxjs';
import { InventoryService } from '@shared/services';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SummaryPanelActionService } from '../../workspace-v3/summary-panel-action.service';
import { Helper } from 'app/classes';
import { IMXNgxSliderRange } from './../imx-ngx-slider/imx-ngx-slider.model';
import { THRESHOLD_TYPE } from '@constants/threshold-types';

@Component({
  selector: 'app-threshold-widget',
  templateUrl: './threshold-widget.component.html',
  styleUrls: ['./threshold-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConvertPipe]
})
export class ThresholdWidgetComponent
  implements OnInit, AfterViewInit, OnDestroy {
  public manualRefresh: EventEmitter<void> = new EventEmitter<void>();
  @Input() public editFlag = true;
  @Input() public thresholdsData: Observable<any>;
  @Input() public moduleName;
  public thresholds: ThresholdWidget = {
    inMarketCompIndex: [0, 210],
    targetImp: [0, 150000]
  };
  @Output() selecetdThresholdValue = new EventEmitter();
  targetCompPerChartData = [];
  inMarketCompIndexChartData = [];
  private unSubscribe = new Subject();
  public inMarketCompIndexMin = 0;
  public inMarketCompIndexMax = 1000;
  public targetAudienceOptions: Options = {
    floor: 0,
    ceil: 150000,
    minLimit: 0,
    step: 1,
    noSwitching: true,
    translate: (value: number): string => {
      let label = value + '';
      if (value > 1) {
        label = this.convertPipe.transform(value.toFixed(2), 'ABBREVIATE');
      }
      if (value >= 150000) {
        label = label + '+';
      }
      return label;
    }
  };
  public inMarketCompIndexOptions: Options = {
    floor: 0,
    ceil: 210,
    minLimit: 0,
    step: 1,
    noSwitching: true,
    ticksArray: [15, 90, 160],
    // ticksArray: [75, 150, 500],
    getLegend: (value: number): string => {
      switch (value) {
        case 0:
          return '0';
        case 15:
          return '75';
        case 90:
          return '150';
        case 160:
          return '500';
        case 210:
          return '1000';
        default:
          return value.toString();
      }
    },
    translate: (value: number, labelType: LabelType): string => {
      let label = '';
      switch (labelType) {
        case LabelType.Ceil:
          label = '1000';
          return label.toString();
          break;
        case LabelType.Floor:
          label = '0';
          return label.toString();;
          break;
        case LabelType.Low:
          label = value.toString();
          /** Here converting logarithmic scale value to original value.
           * 0 - 74: 15 stops
           * 75 - 149: 75 stops
           * 150 - 499: 70 stops
           * 500 - 1000: 50 stops
           **/
          this.inMarketCompIndexMin = this.targetAudienceMinMax(value);
          this.cd.markForCheck();
          return this.inMarketCompIndexMin.toString();
          break;
        case LabelType.High:
          /** Here converting logarithmic scale value to original value.
           * 0 - 74: 15 stops
           * 75 - 149: 75 stops
           * 150 - 499: 70 stops
           * 500 - 1000: 50 stops
           **/
          this.inMarketCompIndexMax = this.targetAudienceMinMax(value);
          this.cd.markForCheck();
          return this.inMarketCompIndexMax.toString();
          break;
        default:
          return value.toString();
          break;
      }
    }
  };
  public targetAudienceSliderRange: IMXNgxSliderRange;
  public inMarketCompIndexSliderRange: IMXNgxSliderRange;

  constructor(
    private convertPipe: ConvertPipe,
    private cd: ChangeDetectorRef,
    private inventoryService: InventoryService,
    private summaryPanelAction: SummaryPanelActionService
  ) {}

  ngOnInit() {
    this.setDefaultSliderValues(THRESHOLD_TYPE.TARGET_COMP);
    this.setDefaultSliderValues(THRESHOLD_TYPE.IN_MARKET_COMP_INDEX);
    this.thresholdsData.subscribe((data) => {
      this.thresholds = data;
      const { targetImp, inMarketCompIndex } = this.thresholds;
      this.updateSliderRangeValues(THRESHOLD_TYPE.TARGET_COMP, targetImp?.[0], targetImp?.[1]);
      this.updateSliderRangeValues(THRESHOLD_TYPE.IN_MARKET_COMP_INDEX, inMarketCompIndex?.[0], inMarketCompIndex?.[1])
      this.refresh();
    });
    this.summaryPanelAction
        .deleteThresholds()
        .pipe(takeUntil(this.unSubscribe))
        .subscribe((threshold) => {
          const thresholds = Helper.deepClone(threshold['filters']);
          if (threshold['type'] === THRESHOLD_TYPE.TARGET_COMP) {
            this.thresholds[THRESHOLD_TYPE.TARGET_COMP] = [0, 150000];
            this.setDefaultSliderValues(THRESHOLD_TYPE.TARGET_COMP);
            delete thresholds[THRESHOLD_TYPE.TARGET_COMP];
          } else if (threshold['type'] === THRESHOLD_TYPE.IN_MARKET_COMP_INDEX) {
            this.thresholds[THRESHOLD_TYPE.IN_MARKET_COMP_INDEX] = [10, 210];
            this.setDefaultSliderValues(THRESHOLD_TYPE.IN_MARKET_COMP_INDEX);
            delete thresholds[THRESHOLD_TYPE.IN_MARKET_COMP_INDEX];
          }
          this.selecetdThresholdValue.emit(thresholds);
          this.refresh();
        });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.inventoryService.clearButtonSource
        ?.pipe(takeUntil(this.unSubscribe))
        ?.subscribe((res) => {
          this.thresholds = {
            inMarketCompIndex: [10, 210],
            targetImp: [0, 150000]
          };
          this.refresh();
        });
    }, 1000);
  }

  public changeTargetAudience() {
    this.selecetdThresholdValue.emit(this.thresholds);
  }
  refresh() {
    this.cd.detectChanges();
  }
  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  targetAudienceMinMax(value) {
    let original = value;
    if (value <= 15) {
      original = value * 5;
    } else if (value <= 90) {
      original = value - 15 + 75;
    } else if (value <= 160) {
      original = (value - 90) * (350 / 70) + 150;
    } else if (value <= 210) {
      original = (value - 160) * (500 / 50) + 500;
    }
    return original;
  }

  public TargetAudienceSliderRangeHandler(range: IMXNgxSliderRange) {
    const { value, highValue } = range;
    this.updateSliderRangeValues(THRESHOLD_TYPE.TARGET_COMP, value, highValue);
    
  }
  public inMarketCompIndexSliderRangeHandler(range: IMXNgxSliderRange) {
    const { value, highValue } = range;
    this.updateSliderRangeValues(THRESHOLD_TYPE.IN_MARKET_COMP_INDEX, value, highValue);
  }

  public setDefaultSliderValues(sliderName: string) {
    if (sliderName === THRESHOLD_TYPE.TARGET_COMP) {
      this.targetAudienceSliderRange = { value: 0, highValue: 150000 } as IMXNgxSliderRange;
    }
    if (sliderName === THRESHOLD_TYPE.IN_MARKET_COMP_INDEX) {
      this.inMarketCompIndexSliderRange = { value: 10, highValue: 210 } as IMXNgxSliderRange;
    }
  }

  public updateSliderRangeValues(sliderName: string, low: number = null, high: number = null): void {
    if (low !== null) {
      this.thresholds[sliderName][0] = low;
      if (sliderName === THRESHOLD_TYPE.TARGET_COMP) this.targetAudienceSliderRange.value = low;
      if (sliderName === THRESHOLD_TYPE.IN_MARKET_COMP_INDEX) this.inMarketCompIndexSliderRange.value = low;
    }
    if (high !== null) {
      this.thresholds[sliderName][1] = high;
      if (sliderName === THRESHOLD_TYPE.TARGET_COMP) this.targetAudienceSliderRange.highValue = high;
      if (sliderName === THRESHOLD_TYPE.IN_MARKET_COMP_INDEX) this.inMarketCompIndexSliderRange.highValue = high;
    }
    this.selecetdThresholdValue.emit(this.thresholds);
  }

}
