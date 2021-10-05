import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {Helper} from '../../classes';
@Component({
  selector: 'app-operator-widget-dialog',
  templateUrl: './operator-widget-dialog.component.html',
  styleUrls: ['./operator-widget-dialog.component.less']
})
export class OperatorWidgetDialogComponent implements OnInit {

  optionsData = [];
  options: any[] = [];
  searchQuery: any;
  public singleSelectOption = {};
  public selectedDummyFilterOptions = [];
  public method = 'multiple';
  public editFilter: false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData,
    private dialogRef: MatDialogRef<OperatorWidgetDialogComponent>) { }

  ngOnInit() {
    this.optionsData = this.dialogData.optionsData;
   
    if (this.dialogData['editFilter']) {
      this.editFilter = this.dialogData['editFilter'];
    }
    this.method = this.dialogData.method;
    if (this.method === 'single') {
      this.singleSelectOption = this.dialogData.selectedData;
    } else {
      const selectedOperator = [...this.dialogData.selectedData]
      if (selectedOperator.length > 0 && selectedOperator[0].id === 'all') {
        this.optionsData.map(opt => {
          opt['selected'] = true;
        });
      } else {
        this.optionsData.map(opt => {
          const selectedIndex = this.dialogData.selectedData.findIndex(selOpt => selOpt.id === opt.id);
          if (selectedIndex > -1) {
            opt['selected'] = true;
          } else {
            opt['selected'] = false;
          }
        });
      }
    }

    this.selectedDummyFilterOptions = this.optionsData.map(x => Object.assign({}, x));
    this.options = this.optionsData.map(x => Object.assign({}, x));

  }


  onChangeOperator(selectedOption, optionRef) {
      if (selectedOption && selectedOption['id'] === 'all') {
        if (optionRef['_selected']) {
          this.optionsData.map(opt => {
            opt.selected = true;
          });
          this.selectedDummyFilterOptions.map(opt => {
            opt.selected = true;
          });
        } else {
          this.optionsData.map(opt => {
            opt.selected = false;
          });
          this.selectedDummyFilterOptions.map(opt => {
            opt.selected = false;
          });
        }
      } else {
        // un selected selected all option.
        this.setSelectAlloption(false);

        const selectedIndex = this.optionsData.findIndex(opt => opt.id === selectedOption.id);
        if (selectedIndex > -1) {
          this.optionsData[selectedIndex]['selected'] = optionRef['_selected'];
        }
        // check selected option for dummy
        const index = this.selectedDummyFilterOptions.findIndex(opt => opt.id === selectedOption.id);
        if (index > -1) {
          this.selectedDummyFilterOptions[index]['selected'] = optionRef['_selected'];
        }

        // check options selecetd count
        const selected = this.selectedDummyFilterOptions.filter(opt => opt.selected);
        if (selected.length === (this.options.length - 1)) {
          this.setSelectAlloption(true);
        }
      }
  }


  setSelectAlloption(selected: Boolean = false) {
    const selectedAll = this.optionsData.findIndex(opt => opt.id === 'all');
    if (selectedAll > -1) {
      this.optionsData[selectedAll]['selected'] = selected;
    }

    const dummySelectedAll = this.selectedDummyFilterOptions.findIndex(opt => opt.id === 'all');
    if (dummySelectedAll > -1) {
      this.selectedDummyFilterOptions[dummySelectedAll]['selected'] = selected;
    }
  }

  /* Function to add selected options
  */
  onAdd() {
    if (this.method === 'single') {
      this.dialogRef.close({
        selectedOption: this.singleSelectOption,
        optionsData: this.dialogData.optionsData,
      });
    } else {
      let selectedOptions = this.selectedDummyFilterOptions.filter(opt => opt.selected);
      const selectedAllCount = selectedOptions.filter(opt => opt['id'] === 'all' && opt.selected).length;
      if (selectedAllCount || selectedOptions.length < 1) {
        selectedOptions = [{ id: 'all', name: 'Select All', count: 0 }];
      }
      this.dialogRef.close({
        selectedOptions: selectedOptions,
        optionsData: this.dialogData.optionsData,
      });
    }
  }

  public searchFilters(data) {
    if (data.emptySearch) {
      this.optionsData = this.options;
    } else {
      // Finding existing selected value and keep at top
      this.optionsData = data.value;
    }
    // check options selecetd count
    const selectedCount = this.selectedDummyFilterOptions.filter(opt => opt.selected).length;
    if (selectedCount < (this.options.length - 1)) {
      this.setSelectAlloption(false);
    } else if (selectedCount === (this.options.length)) {
      this.setSelectAlloption(true);
    }
  }

  public compare(c1, c2) {
    return c1 && c2 && c1['id'] === c2['id'];
  }

  addTopOption(count = 10) {
    let index = 0;
    if (this.optionsData[0]['id'] === 'all') {
      index = 1;
    }
    this.optionsData.map((opt, i) => {
      if (i >= index && i <= count) {
        opt.selected = true;
      } else {
        opt.selected = false;
      }
    });
    const selectedData = this.optionsData.filter(opt => opt.selected);

    this.selectedDummyFilterOptions.map(opt => {
      opt.selected = false;
    });
    selectedData.map(element => {
      const dummyIndex = this.selectedDummyFilterOptions.findIndex(opt => opt.id === element.id);
      if (dummyIndex > -1) {
        this.selectedDummyFilterOptions[dummyIndex]['selected'] = true;
      }
    });
  }

}

