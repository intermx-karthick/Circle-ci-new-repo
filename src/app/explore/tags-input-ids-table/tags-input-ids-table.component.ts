import { Component, Input, OnInit, EventEmitter, Output, OnChanges } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TagsInputIdsDialogComponent } from '../tags-input-ids-dialog/tags-input-ids-dialog.component';

@Component({
  selector: 'app-tags-input-ids-table',
  templateUrl: './tags-input-ids-table.component.html',
  styleUrls: ['./tags-input-ids-table.component.less']
})
export class TagsInputIdsTableComponent implements OnChanges, OnInit {
  @Input() allEnteredIds: any;
  @Output() valueChange = new EventEmitter();
  public countingValidIDs: any;
  public removedIDsStatus: Boolean = false;
  public invalidFilterIDs = [];
  public validIDs = [];
  public totalCountIDs = 0;
  public totalInvalidIds = [];
  constructor(public dialog: MatDialog) { }

  ngOnChanges() {
    if (this.allEnteredIds && this.allEnteredIds.data && this.allEnteredIds.data.geoPanelIds && this.allEnteredIds.data.plantIds) {
      // counting total valid IDs
      this.countingValidIDs = this.allEnteredIds.totalIds || 0 -
        (this.allEnteredIds.data.geoPanelIds.length + this.allEnteredIds.data.plantIds.length);
      // seperating valid and invalid IDs
      this.invalidFilterIDs = this.allEnteredIds.data.geoPanelIds.concat(this.allEnteredIds.data.plantIds);
      if (this.allEnteredIds.data.geoPanelIds.length <= 0 && this.allEnteredIds.data.plantIds.length <= 0) {
        this.removedIDsStatus = true;
        this.invalidFilterIDs = [];
        this.validIDs = [];
      } else {
        this.removedIDsStatus = false;
      }

    }
    if (this.allEnteredIds && this.allEnteredIds.data && this.allEnteredIds.data.geoPanelIds &&
      this.allEnteredIds.data.invalidSpotIds && this.allEnteredIds.data.invalidOperatorSpotIds && this.allEnteredIds.plantUnitIds &&
      this.allEnteredIds.geoPanelId) {
      this.totalCountIDs =
        this.allEnteredIds.geoPanelId.length +
        this.allEnteredIds.plantUnitIds.length;
      const allInvalidSpotIDs = [...this.allEnteredIds.data.geoPanelIds, ...this.allEnteredIds.data.invalidSpotIds];
      const validGeoPanelIds = this.checkingValidAndInvalid(allInvalidSpotIDs, this.allEnteredIds.geoPanelId);
      const allInvalidOperatorIds = [...this.allEnteredIds.data.plantIds, ...this.allEnteredIds.data.invalidOperatorSpotIds];
      const validPlantIds = this.checkingValidAndInvalid(allInvalidOperatorIds, this.allEnteredIds.plantUnitIds);
      this.validIDs = validGeoPanelIds.valid.concat(validPlantIds.valid);
      /**
       * adding Invalid IDs
       */
      this.totalInvalidIds = [...this.allEnteredIds.data.invalidSpotIds, ...this.allEnteredIds.data.invalidOperatorSpotIds];
    }
  }

  ngOnInit() {}

  checkingInvalidIDs(array1, array2) {
    const concatArray = array1.map(String).concat(array2);
    let matchedStatus: boolean;
    const resultArray = concatArray.filter(this.onlyUniqueIDs);
    // checking whether the invalid ids is matching the existing IDs or not
    array1.map(String).forEach((item1, i) => {
      array2.forEach((item2) => {
        if (item1 === item2) {
          matchedStatus = true;
          const item = resultArray.indexOf(item2);
          resultArray.splice(item, 1);
        }
      });
    });
    // when invalid IDs is not matched
    if (!matchedStatus) {
      this.invalidIDsNotMatched(array1, resultArray);
    }
    return resultArray;
  }

  invalidIDsNotMatched(array1, resultArray) {
    let item: any;
    array1.filter((ids) => {
      // checking IDs type whether string or number
      if (typeof ids === 'string') {
        item = resultArray.indexOf(ids);
      } else {
        item = resultArray.indexOf(JSON.stringify(ids));
      }
      resultArray.splice(item, 1);
    });

    return resultArray;
  }

  // getting only unique IDs
  onlyUniqueIDs(value, index, self) {
    return self.indexOf(value) === index;
  }

  checkingValidAndInvalid(array1, array2) {
    const enteredIDs = array2.map(String);
    const invalidIDs = [];
    let validAndInvalidObj: any;
    // checking whether the invalid ids is matching the existing IDs or not
    array1.map(String).forEach((item1, i) => {
      array2.forEach((item2) => {
        if (item1 === item2) {
          invalidIDs.push(item2);
          const item = enteredIDs.indexOf(item2);
          enteredIDs.splice(item, 1);
        }
      });
    });

    return validAndInvalidObj = {invalid: invalidIDs, valid: enteredIDs};

  }

  /* this dialog for showing valid and Invalid IDs */
  openDialogForIDs(title: any, type: String): void {
    let IDs: any;
    if (type === 'validIDs') {
      IDs = this.validIDs;
    } else if (type === 'invalidFilterIDs') {
      IDs = this.invalidFilterIDs;
    } else {
      IDs = this.totalInvalidIds;
    }
    // setting data for dialog
    const dialogRef = this.dialog.open(TagsInputIdsDialogComponent, {
      data: {
        title: title,
        ids: IDs
      }
    });
  }

  /* removing invalid IDs from mat-chip*/
  removeInvalidIDs(type = 'invalidIds') {
    if (type === 'filterIds') {
      this.invalidFilterIDs = [];
    } else {
      this.totalInvalidIds = [];
    }
    this.valueChange.emit({action: type});
    this.removedIDsStatus = true;
  }


}
