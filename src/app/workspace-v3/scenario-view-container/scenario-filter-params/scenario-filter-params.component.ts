import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Orientation } from 'app/classes/orientation';
import { FiltersService } from 'app/explore/filters/filters.service';
import { WorkspaceV3Service } from 'app/workspace-v3/workspace-v3.service';
import { InventoryPlanJobStatus, ScenarioPlanTabLabels } from '@interTypes/enums';

@Component({
  selector: 'app-scenario-filter-params',
  templateUrl: './scenario-filter-params.component.html',
  styleUrls: ['./scenario-filter-params.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScenarioFilterParamsComponent implements OnInit, AfterViewInit {
  public labels = this.workspaceApi.workSpaceLabels;
  public project;
  public scenario;
  public isAllOperator = false;
  public operators = [];
  scrollContent;
  selectedMediaAttributes: any;
  public orientationObj = new Orientation();
  public tabLabel = ScenarioPlanTabLabels;
  public packages = [];
  public selectedPackages = [];
  isJobInitiated = true;
  constructor(
    public dialogRef: MatDialogRef<ScenarioFilterParamsComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    public workspaceApi: WorkspaceV3Service,
    private filterService: FiltersService,
    private cdf: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.project = this.data?.project;
    this.scenario = this.data?.scenario;
    this.packages = this.data?.packages;
    this.isAllOperator = this.scenario?.operators?.data.filter((op) => op === 'all').length > 0;
    this.scrollContent =
      document.getElementById('plan-summary-block').clientHeight -
      (100 + document.getElementById('plan-summary-title').clientHeight);
    this.operators = this.scenario?.operators?.data.filter(
      (op) => op !== 'all'
    );
    if (this.scenario?.package !== null && this.scenario?.package.length > 0) {
      this.packages.forEach((p) => {
        if (this.scenario?.package.indexOf(p['_id']) !== -1) {
          this.selectedPackages.push(p);
        }
      });
    }
    this.selectedMediaAttributes = this.scenario?.mediaAttributes?.data;
    if (
      this.scenario?.job?.status &&
      (this.scenario.job.status === InventoryPlanJobStatus.SUCCESS ||
        this.scenario.job.status === InventoryPlanJobStatus.ERROR)
    ) {
      this.isJobInitiated = false;
    }
    
    this.cdf.detectChanges();
  }
  public trackById(index, item) {
    return item.id;
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
  formatTimeLabel(time): string {
    return this.filterService.timeConvert(time + ':00:00');
  }
  openParameters() {
    this.dialogRef.close('parameter');
  }

  ngAfterViewInit(): void {
    this.scrollContent =
      document.getElementById('plan-summary-block').clientHeight -
      (100 + document.getElementById('plan-summary-title').clientHeight);
    this.cdf.detectChanges();
  }
}
