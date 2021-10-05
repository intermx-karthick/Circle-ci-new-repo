import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import {
  Duration,
  WorkflowLables,
  ConfirmationDialog
} from '@interTypes/workspaceV2';
import { NewWorkspaceService } from 'app/widgets/new-workspace.service';
import { Observable } from 'rxjs';
import { CommonService } from '@shared/services';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

import { AppUSDateAdapter, AppDateFormat } from '../../classes';

@Component({
  selector: 'app-plan-week-widget',
  templateUrl: './plan-week-widget.component.html',
  styleUrls: ['./plan-week-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: DateAdapter,
      useClass: AppUSDateAdapter // custom date adapter
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: AppDateFormat.US
    },
    NewWorkspaceService
  ]
})
export class PlanWeekWidgetComponent
  implements OnInit, OnChanges, AfterViewInit {
  @Input() public periodDurations: Duration[] = [];
  public labels: WorkflowLables;

  @Input() public selectedPlanPeroid: Observable<any>;
  @Input() public filterPosition: Observable<any>;
  @Input() public planPeroid = 'generic';
  @Input() public disableSpecific = false;
  @Input() public editFlag = false;
  @Input() public spotSchedules = [];
  @Input() public scenarioId = '';
  @ViewChild('refNode', { read: ElementRef }) focusNode: ElementRef;
  public selectedDuration = 4;
  public startDate = new FormControl('', [Validators.required]);
  public endDate = new FormControl('', [Validators.required]);
  public oldStartDate = null;
  public oldEndDate = null;
  public reverseChange = false;
  public widgetStyle = { transform: 'translate(0%, 0%) ' + 'scale(' + 0 + ')' };
  // date = new FormControl();
  @Output() appliedPlanPeroid = new EventEmitter();

  constructor(
    private newWorkspaceService: NewWorkspaceService,
    private cd: ChangeDetectorRef,
    private commonService: CommonService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.labels = this.commonService.getWorkFlowLabels();

    this.selectedPlanPeroid.subscribe((data) => {
      this.selectedDuration = data['selectedDuration'];
      this.planPeroid = data['planPeroid'];
      if (this.oldStartDate !== null) {
        this.reverseChange = true;
      }
      this.startDate.patchValue(
        (data['date']['start'] && data['date']['start']) || null
      );
      if (this.oldStartDate !== null) {
        this.reverseChange = true;
      }
      this.endDate.patchValue(
        (data['date']['end'] && data['date']['end']) || null
      );
      this.oldStartDate =
        (data['date']['start'] && data['date']['start']) || null;
      this.oldEndDate = (data['date']['end'] && data['date']['end']) || null;
      this.cd.markForCheck();
    });
  }

  ngAfterViewInit() {
    this.filterPosition.subscribe((data) => {
      if (data && data.widgetData && data.index === 0) {
        const sizeData = {
          parent: {
            width: data.widgetData.width,
            height: data.widgetData.height
          },
          child: {
            width: this.focusNode.nativeElement.offsetWidth,
            height: this.focusNode.nativeElement.offsetHeight
          }
        };
        this.widgetStyle = this.commonService.doResize(sizeData);
        this.cd.markForCheck();
      }
    });
  }

  changePlanPeroid(refPlanPeroid) {
    this.onAppliedPlanPeroid();
  }
  changeDate(selectedDate, type = 'start') {
    if (this.reverseChange) {
      this.reverseChange = false;
      return false;
    }
    console.log('this.spotSchedules', this.spotSchedules);
    if (this.spotSchedules && Object.keys(this.spotSchedules).length > 0) {
      const data: ConfirmationDialog = {
        notifyMessage: false,
        confirmTitle:
          'Editing Dates for the Plan will override any edits made to specific inventory dates. Do you want to continue?',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      };
      this.dialog
        .open(ConfirmationDialogComponent, {
          data: data,
          width: '450px'
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            this.oldStartDate = this.startDate.value;
            this.oldEndDate = this.endDate.value;
            const spotUpdateData = { spots: [] };
            Object.keys(this.spotSchedules).map((spotId) => {
              spotUpdateData['spots'].push({
                id: spotId,
                schedules: []
              });
            });
            this.newWorkspaceService
              .updateSpotSchedule(this.scenarioId, spotUpdateData)
              .subscribe((response) => {
                this.onAppliedPlanPeroid(true);
              });
          } else {
            this.reverseChange = true;
            if (type === 'start') {
              this.startDate.patchValue(this.oldStartDate);
            } else if (type === 'end') {
              this.endDate.patchValue(this.oldEndDate);
            }
          }
        });
    } else {
      this.oldStartDate = this.startDate.value;
      this.oldEndDate = this.endDate.value;
      this.onAppliedPlanPeroid(true);
    }
  }

  changeDuration(selectedDuration) {
    this.selectedDuration = selectedDuration.value;
    this.onAppliedPlanPeroid();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.disableSpecific && changes.disableSpecific.currentValue) {
      this.planPeroid = 'generic';
      this.cd.markForCheck();
    }
  }
  onAppliedPlanPeroid(updateSpotSchedule = false) {
    // When we saved specific dates, the selectedDuration is saving as null.
    // The below line will make the default value selected while switching to generic
    this.selectedDuration = this.selectedDuration || 4;
    const planPeorid = {
      planPeroid: this.planPeroid,
      selectedDuration: this.selectedDuration,
      date: {
        start: this.startDate,
        end: this.endDate
      }
    };
    this.appliedPlanPeroid.emit({
      updateSpotSchedule: updateSpotSchedule,
      planPeorid: planPeorid
    });
  }
}
