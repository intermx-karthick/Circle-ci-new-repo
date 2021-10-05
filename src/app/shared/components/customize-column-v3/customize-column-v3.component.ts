import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  ChangeDetectorRef
} from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Helper } from 'app/classes';
import { CustomColumnOrigin } from '@interTypes/enums';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * @description
 *  Customize coulmn v3 component. which is implemented in
 * project list scenario view table.
 */
@Component({
  selector: 'app-customize-column-v3',
  templateUrl: './customize-column-v3.component.html',
  styleUrls: ['./customize-column-v3.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomizeColumnV3Component implements OnInit {
  public currentSortables: any = [];
  public sortables: any = [];
  public isSpotScheduleEnabled = true;
  public defaultColumns: any = [];
  public ccSearchQuery = new FormControl();
  filteredSortables: any = [];
  columnCategories = [];
  columnCategory = 'detailed';
  notfilteredSortables: any = [];
  public filterCurrentSortables: any = [];
  public notfilterCurrentSortables: any = [];
  public constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<CustomizeColumnV3Component>,
    @Inject(MAT_DIALOG_DATA) private injectedData: any = [],
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ccSearchQuery = new FormControl();
    if (this.injectedData.sortables) {
      this.sortables = this.injectedData.sortables;
      this.filteredSortables = Helper.deepClone(this.sortables);
    }
    if (this.injectedData.currentSortables) {
      this.currentSortables = this.injectedData.currentSortables;
      this.filterCurrentSortables = Helper.deepClone(this.currentSortables);
    }
    if (this.injectedData?.isSpotScheduleEnabled) {
      this.isSpotScheduleEnabled = true;
    }
    if (this.injectedData.defaultColumns) {
      this.defaultColumns = this.injectedData.defaultColumns;
    }
    if (this.injectedData.columnCategories) {
      /* this.columnCategories = [{
        name: 'All',
        key: 'all'
      }]; */
      this.columnCategories.push(...this.injectedData.columnCategories);
      this.searchCustomColumns();
    }
    this.ccSearchQuery
        .valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe((searchStr) => {
          this.searchCustomColumns();
        });
  }

  public drop(event: CdkDragDrop<string[]>) {
    // dropping in same container
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // dropping in other container
      // We need to handle only date columns when spot schedule is enabled
      if (this.isSpotScheduleEnabled) {
        if (
          event.previousContainer?.data?.[event.previousIndex]?.['name'] ===
          'period_date'
        ) {
          if (
            event.previousContainer.data[event.previousIndex]['displayname'] ===
            'Period Dates'
          ) {
            // If Period Days column is moved we need to keep it on left side itself and we have to add
            // new data columns(missing date columns) in the right side.If Period Days is moved from left to right
            // we need to handle that in 3 cases
            // Case 1:
            //   We have to instert spot_start_date_1 and spot_end_date_1 if no spot date columns present on right side list
            // Case 2:
            // If right side list contains spot_start_date_1 and spot_end_date_2 then we need to insert spot_start_date_2
            // spot_end_date_2 columns
            // Case 3:
            // If right side list contains spot_start_date_1, spot_end_date_1, spot_start_date_3 and spot_end_date_3 then
            // we need to insert missing columns spot_start_date_2 and spot_end_date_2

            let dateIndex = [];
            // Finding if already any spot date columns are there
            this.filterCurrentSortables.map((sort) => {
              if (
                sort['value'].indexOf('spot_start_date_') !== -1 ||
                sort['value'].indexOf('spot_end_date_') !== -1
              ) {
                dateIndex.push(Number(sort['value'].split('_')[3]));
              }
            });
            // Removing duplicates and sorting
            dateIndex = Helper.removeDuplicate(dateIndex).sort();

            const maxValue = Math.max(...dateIndex);
            let indexValue = 0;
            if (maxValue > dateIndex.length) {
              for (let i = 1; i <= maxValue; i++) {
                if (dateIndex.indexOf(i) === -1) {
                  indexValue = i;
                  break;
                }
              }
            } else {
              indexValue = dateIndex.length + 1;
            }
            const startDate = {
              name: 'period_date',
              displayname: 'Spot Start Date #' + indexValue,
              value: 'spot_start_date_' + indexValue,
              category: 'summary'
            };
            this.filterCurrentSortables.push(startDate);
            const endDate = {
              name: 'period_date',
              displayname: 'Spot End Date #' + indexValue,
              value: 'spot_end_date_' + indexValue,
              category: 'summary'
            };
            this.filterCurrentSortables.push(endDate);
          }
          // If columns like spot_start_date_1 or spot_end_date_1 moved from right to left.
          // We need to remove corresponding dates as well.
          if (
            event.previousContainer?.data?.[event.previousIndex]?.[
              'value'
            ].includes('_date_')
          ) {
            const names = event.previousContainer.data[event.previousIndex][
              'value'
            ].split('_');
            const startIndex = this.filterCurrentSortables.findIndex(
              (column) => column['value'] === 'spot_start_date_' + names[3]
            );
            this.filterCurrentSortables.splice(startIndex, 1);
            const endIndex = this.filterCurrentSortables.findIndex(
              (column) => column['value'] === 'spot_end_date_' + names[3]
            );
            this.filterCurrentSortables.splice(endIndex, 1);
          }
        } else {
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
          this.cdRef.detectChanges();
        }
      } else {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      }
    }
    const dubData = Helper.deepClone(this.filteredSortables);
    dubData.push(...this.notfilteredSortables);
    this.sortables = dubData;

    const cSortables = Helper.deepClone(this.filterCurrentSortables);
    cSortables.push(...this.notfilterCurrentSortables);
    this.currentSortables = cSortables;
  }

  public saveCustomColumns() {
    this.dialogRef.close({
      currentSortables: this.currentSortables,
      action: 'saved'
    });
  }

  public cancelCustomColumns(actionData) {
    // TODO: No need to send data while closing popup. Need to check and remove
    this.dialogRef.close({
      currentSortables: this.defaultColumns,
      clear: true,
      action: actionData
    });
  }

  public resetToDefault() {
    // TODO: Need to remove if else conditions when reset to default is implemented in all places
    if (this.injectedData.origin === CustomColumnOrigin.recordsManagement) {
      this.dialogRef.close({
        currentSortables: this.injectedData.defaultValues
          .defaultCurrentSortables,
        clear: true,
        action: 'reset'
      });
    } else {
      this.cancelCustomColumns('reset');
    }
  }
  public onColumnCategoryChange(value) {
    this.columnCategory = value;
    this.searchCustomColumns();
  }
  searchCustomColumns () {
    const searchStr = this.ccSearchQuery.value || '';
    const currentSortables = Helper.deepClone(this.currentSortables);
    const sortables = Helper.deepClone(this.sortables);
    this.filteredSortables = sortables.filter((sort) =>  {
      return (sort.displayname.toLowerCase().includes(searchStr.toLowerCase()) && (sort.category === this.columnCategory || this.columnCategory == 'all'));
    });
    this.notfilteredSortables = sortables.filter((sort) =>  {
      return !(sort.displayname.toLowerCase().includes(searchStr.toLowerCase()) && (sort.category === this.columnCategory || this.columnCategory == 'all'));
    });
    this.filterCurrentSortables = currentSortables.filter((sort) =>  {
      return ((sort.category === this.columnCategory || this.columnCategory == 'all'));
    });
    this.notfilterCurrentSortables = currentSortables.filter((sort) =>  {
      return !((sort.category === this.columnCategory || this.columnCategory == 'all'));
    });
    this.cdRef.detectChanges();
  }
}
