import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { ScenarioPlanTabLabels } from '@interTypes/enums';

@Component({
  selector: 'app-select-inventory-popup',
  templateUrl: './select-inventory-popup.component.html',
  styleUrls: ['./select-inventory-popup.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectInventoryPopupComponent implements OnInit {
  public packages = [];
  public operators = [];
  public scenario;
  /** Dialog view based on create & edit */
  public type = 'create';
  public selectedPlanTab = ScenarioPlanTabLabels.MARKET_PLAN;
  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<SelectInventoryPopupComponent>,
    @Inject(MAT_DIALOG_DATA) private dialogData: any
  ) {}

  ngOnInit(): void {
    if (this.dialogData?.operators) {
      this.operators = this.dialogData.operators;
    }
    if (this.dialogData?.scenario) {
      this.scenario = this.dialogData.scenario;
    }
    if (this.dialogData?.type) {
      this.type = this.dialogData.type;
    }
    if (this.dialogData?.selectedPlanTab) {
      this.selectedPlanTab = this.dialogData.selectedPlanTab;
    }
  }

  public applyFilter(event) {
    this.dialogRef.close(event);
  }
}
