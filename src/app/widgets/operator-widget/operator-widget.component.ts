import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperatorWidgetDialogComponent } from '../operator-widget-dialog/operator-widget-dialog.component';


@Component({
  selector: 'app-operator-widget',
  templateUrl: './operator-widget.component.html',
  styleUrls: ['./operator-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperatorWidgetComponent implements OnInit {
  public operators: any = [];
  @Input() public selectedOperators = [];
  @Output() applyOperator = new EventEmitter();
  @Input() public editFlag = true;
  constructor(private activeRoute: ActivatedRoute,
    public dialog: MatDialog) { }

  ngOnInit() {
    const operators = this.activeRoute.snapshot.data.operators || [];
      const selectAll = {
        'id': 'all',
        'name': 'Select All',
        'count': 0,
        'slno': ''
      };
      this.operators.push(selectAll);
      operators.map(selected => {
        selected.id = selected.name;
        this.operators.push(selected);
      });
  }

  /* Function to open dialog popup for filters*/
  openOperatorDialog() {
    const data = {
      title: 'Add Operator',
      buttonText: 'Add Selected',
      optionsData: this.operators,
      selectedData: this.selectedOperators
    };
    this.dialog.open(OperatorWidgetDialogComponent, {
      width: '460px',
      data: data
    }).afterClosed().subscribe(result => {
      if (result) {
        let options;
        if (result.selectedOptions.length
          && result.selectedOptions[0]['id'] === 'all') {
            options = [...result.optionsData];
            options.shift();
        }
        this.selectedOperators = result.selectedOptions;
          this.applyOperator.emit({'selected': this.selectedOperators, 'options': options});
      }
    });
  }

  /**
   *
   * @param selectedOperator - selected operator to be removed from the list
   */
  removeOperator(selectedOperator) {
    const index = this.selectedOperators.findIndex(x => x.id === selectedOperator.id);
    if (index !== -1) {
      this.selectedOperators.splice(index, 1);
      this.applyOperator.emit({'selected': this.selectedOperators});
    }
  }

}
