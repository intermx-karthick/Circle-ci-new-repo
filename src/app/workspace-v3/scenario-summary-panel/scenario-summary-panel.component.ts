import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  Output,
  EventEmitter
} from '@angular/core';
import { FiltersService } from 'app/explore/filters/filters.service';
import { WorkspaceV3Service } from '../workspace-v3.service';
import {
  InventoryPlanJobStatus,
  ScenarioPlanTabLabels
} from '@interTypes/enums';
import { Orientation } from 'app/classes/orientation';
import { SummaryPanelActionService } from '../summary-panel-action.service';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { DeliveryGoalsType } from '@interTypes/enums';
@Component({
  selector: 'app-scenario-summary-panel',
  templateUrl: './scenario-summary-panel.component.html',
  styleUrls: ['./scenario-summary-panel.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScenarioSummaryPanelComponent implements OnInit, OnChanges {
  @Input() selectedAudiences: any = [];
  @Input() audienceSelectionType = 'multiple';
  @Input() selectedMarkets: any[];
  @Input() operators;
  @Input() mediaTypeFilters = [];
  @Input() selectedPackages = [];
  @Input() locations = [];
  @Input() measureRangeFilters;
  @Input() mediaAttributes;
  @Input() selectedPlanTab;
  @Input() planPeriodData;
  @Input() defineGoalData;
  @Input() spotFilter;
  @Output() deleteSelectedMarkets = new EventEmitter();
  @Output() deleteSelectedAudience = new EventEmitter();
  public orientationObj = new Orientation();
  public detailedPackages = [];
  isAllOperator = false;
  public labels = this.workspaceApi.workSpaceLabels;
  public tabLabel = ScenarioPlanTabLabels;

  public deliveryGoals = DeliveryGoalsType;
  
  constructor(
    public workspaceApi: WorkspaceV3Service,
    private filterService: FiltersService,
    private summaryAction: SummaryPanelActionService,
    private cdf: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.formatFilter();
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.formatFilter();
  }
  formatFilter() {
    this.isAllOperator = false;
    if (this.operators) {
      this.isAllOperator =
        this.operators.filter((op) => op === 'all' || op === 'Select All')
          .length > 0;
    }
  }
  formatTimeLabel(time): string {
    return this.filterService.timeConvert(time + ':00:00');
  }
  public removeSelectedMarkets(market) {
    this.deleteSelectedMarkets.emit(market);
  }
  public removeSelectedAudience(audience) {
    this.deleteSelectedAudience.emit(audience);
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
  public removeOperators(operator) {
    this.deletConfirmation().subscribe((response) => {
      this.summaryAction.triggerDeleteOperator(operator);
    });
  }
  public removeMedia(media) {
    this.summaryAction.triggerDeleteMedia(media);
  }
  public removeThresholds(type) {
    this.deletConfirmation().subscribe((response) => {
      const thresholds = {
        type: type,
        filters: this.measureRangeFilters
      };
      this.summaryAction.triggerDeleteThresholds(thresholds);
    });
  }
  public removeMediaAttributes(key, i = 0) {
    this.deletConfirmation().subscribe((response) => {
      if (key && typeof this.mediaAttributes[key] !== 'undefined') {
        if (key === 'auditStatusList') {
          if (this.mediaAttributes['auditStatusList']?.length) {
            this.mediaAttributes['auditStatusList'].splice(i, 1);
            if (!this.mediaAttributes['auditStatusList']?.length) {
              delete this.mediaAttributes['auditStatusList'];
            }
          }
        } else {
          delete this.mediaAttributes[key];
        }
        this.summaryAction.triggerDeleteMediaAttr(this.mediaAttributes);
      }
    });
  }
  public removeLocation(location) {
    this.deletConfirmation().subscribe((response) => {
      this.summaryAction.triggerDeleteLocation(location);
    });
  }
  public removePackage(pack) {
    this.deletConfirmation().subscribe((response) => {
      this.summaryAction.triggerDeletePackage(pack);
    });
  }
  public removeSpotFilter() {
    this.deletConfirmation().subscribe((response) => {
      this.summaryAction.triggerSpotIDFilter(true);
    });
  }
  public deletConfirmation() {
    return this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(filter((res) => res && res['action']));
  }
}
