import {Component, EventEmitter, OnInit, Inject, HostListener, Output} from '@angular/core';
import {
  ExploreDataService,
  AuthenticationService
} from '@shared/services';
import swal from 'sweetalert2';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
// import {ExploreTabularPanelsComponent} from '../../../explore/explore-tabular-panels/explore-tabular-panels.component';
@Component({
  selector: 'app-customize-column',
  templateUrl: './customize-column.component.html',
  styleUrls: ['./customize-column.component.less'],
})
export class CustomizeColumnComponent implements OnInit {
  behaviorOption: any = {};
  @Output() tabularLoad = new EventEmitter();
  public sortables: any = [];
  public currentSortables = [];
  public displaySortables = [];
  public selectedColumns = [];
  public isControlKey = false;
  public origin;
  public keyCodes = {
    CONTROL: 17,
    COMMAND: 91
  };
  public constructor(
    private _eDataService: ExploreDataService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<CustomizeColumnComponent>,
    @Inject(MAT_DIALOG_DATA) private injectedData: any = [],
    private auth: AuthenticationService) {
  }

  public ngOnInit() {
    if (this.injectedData.sortables) {
      this.sortables = this.injectedData.sortables;
      this.setTopSelect();
    }
    if (this.injectedData.currentSortables) {
      this.currentSortables = this.injectedData.currentSortables;
    }
    this.origin = this.injectedData.origin;
  }

  setTopSelect() {
    if (this.sortables.length !== 0 ) {
      this.selectedColumns = [];
      this.selectedColumns.push(this.sortables[0]['displayname']);
    }
  }

  handleSelection(event) {
    if (event.option.selected) {
      if (!this.isControlKey) {
        event.source.deselectAll();
        event.option.selected = true;
        event.source.selectedOptions._multiple = false;
      } else {
        event.source.selectedOptions._multiple = true;
      }
    }
  }
  @HostListener('click', ['$event'])
  @HostListener('window:keydown', ['$event'])
  @HostListener('window:keyup', ['$event'])
  customColumnSelect(event: KeyboardEvent) {
    if (event.ctrlKey || (event.key && event.key.toLowerCase() === 'meta')) {
    this.isControlKey = true;
    } else {
      this.isControlKey = false;
    }
  }

  moveColumns() {
    // const selectValue  =  $('#lstBox1').val();
    const selectValue  =  this.selectedColumns;
    let dateIndex = [];
    for (let i = 0; i < selectValue.length ; i++) {
      if (selectValue[i] === 'Period Dates') {
        this.currentSortables.map(sort => {
          if (sort['value'].indexOf('start_period_date_') !== -1 || sort['value'].indexOf('end_period_date_') !== -1) {
            dateIndex.push(Number(sort['value'].split('_')[3]));
          }
        });
        dateIndex = dateIndex.filter((a, b) => dateIndex.indexOf(a) === b).sort();
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
          'name': 'period_date', 'displayname': 'Spot Start Date #' + indexValue, 'value': 'start_period_date_' + indexValue
        };
        this.currentSortables.push(startDate);
        const endDate = {
          'name': 'period_date', 'displayname': 'Spot End Date #' + indexValue, 'value': 'end_period_date_' + indexValue
        };
        this.currentSortables.push(endDate);
      } else {
        const sortableValue = this.searchArray(selectValue[i], this.sortables);
        this.currentSortables.push(sortableValue);
      }
      // const sortableValue = this.searchArray(selectValue[i], this.sortables);
      // console.log('sortableValue', JSON.parse(JSON.stringify(sortableValue)));
      // // this.currentSortables.push(sortableValue);
    }
    for (let j = 0; j < selectValue.length ; j++) {
      if (selectValue[j] !== 'Period Dates') {
        const sortableKey = this.isExist(selectValue[j], this.sortables);
        this.sortables.splice(sortableKey, 1);
      }
    }
    if (selectValue.length === 0) {
        swal('Nothing to move. You have to choose something from left column.');
        // e.preventDefault();
    }
    this.setTopSelect();
  }

  saveCustomColumns() {
    this.dialogRef.close({'currentSortables': this.currentSortables, 'action': 'saved'});
   }

  cancelCustomColumns() {
    this.dialogRef.close({'currentSortables': this.currentSortables, 'clear': true, 'action': 'cancel'});
  }

  searchArray(nameKey, myArray) {
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].displayname === nameKey) {
        return myArray[i];
      }
    }
  }

  isExist(nameKey, myArray) {
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].displayname === nameKey) {
        return i;
      }
    }
  }

  removeDuplicates(a, b) {
    for (let i = 0, len = a.length; i < len; i++) {
      for (let j = 0, len2 = b.length; j < len2; j++) {
        if (a[i].name === b[j].name) {
            b.splice(j, 1);
            len2 = b.length;
          }
      }
    }
  }

  removeFilter(idx, name) {
    const sortableValue = this.searchArray(name, this.currentSortables);
    if (sortableValue['name'] !== 'period_date') {
      this.sortables.push(sortableValue);
      this.currentSortables.splice(idx, 1);
    } else {
      const names = sortableValue['value'].split('_');
      const startIndex = this.currentSortables.findIndex(sortC => sortC['value'] === 'start_period_date_' + names[3]);
      this.currentSortables.splice(startIndex, 1);
      const endIndex = this.currentSortables.findIndex(sortC => sortC['value'] === 'end_period_date_' + names[3]);
      this.currentSortables.splice(endIndex, 1);
    }
    if (this.origin === 'explore') {
      localStorage.setItem('exploreCustomColumn', JSON.stringify(this.currentSortables));
      this._eDataService.saveCustomizedColumns(this.currentSortables);
    }
    if (this.origin === 'scenario') {
      localStorage.setItem('scenarioCustomColumn', JSON.stringify(this.currentSortables));
      this._eDataService.saveCustomizedColumns(this.currentSortables);
    }

    if (this.origin === 'papulation') {
      localStorage.setItem('papulationCustomColumn', JSON.stringify(this.currentSortables));
    }

    this.setTopSelect();
 }

 /**
  * @description
  *   Handling drop event for current view list
  */
 drop(event: CdkDragDrop<string[]>) {
  moveItemInArray(this.currentSortables, event.previousIndex, event.currentIndex);
 }

}
