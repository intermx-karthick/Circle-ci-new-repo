import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ScenarioPlanTabLabels } from '@interTypes/enums';
import { Helper } from 'app/classes';


@Component({
  selector: 'app-select-operator-popup',
  templateUrl: './select-operator-popup.component.html',
  styleUrls: ['./select-operator-popup.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectOperatorPopupComponent implements OnInit {

  public operators = [];
  public scenario;
  public type = 'create';
  public selectedPlanTab = ScenarioPlanTabLabels.MARKET_PLAN;
  /** Operator input data */
  public operatorsData = {
    optionsData: [],
    selectedOptions: []
  };
  private filters = {};



  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<SelectOperatorPopupComponent>,
    @Inject(MAT_DIALOG_DATA) private dialogData: any
  ) { }

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
    this.setOperatorData();

  }

  public applyFilter(event) {
    this.dialogRef.close(event);
  }

  private setOperatorData() {
    const selectAll = {
      id: 'all',
      name: 'Select All',
      count: 0,
      slno: ''
    };
    this.operatorsData.optionsData =  [];
    if (this.operators?.length > 0) {
      this.operatorsData.optionsData.push(selectAll);
      this.operators.map((selected) => {
        selected.id = selected.name;
        this.operatorsData.optionsData.push(selected);
      });
    }
    if (this.scenario?.operators === undefined) {
      this.operatorsData.selectedOptions = [{ id: 'all', name: 'Select All' }];
    } else if (this.scenario?.operators?.data?.length > 0) {
      this.operatorsData.selectedOptions = this.scenario.operators.data.map(
        (operatorName) => {
          return { id: operatorName, name: operatorName };
        }
      );
    } else {
      this.operatorsData.selectedOptions = [];
    }

    // For triggering changes in child comp

    this.filters['operator'] = this.operatorsData;
    this.operatorsData = Helper.deepClone(this.operatorsData);
  }

}
