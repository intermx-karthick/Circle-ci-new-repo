import { Component, OnInit, Inject, Input, Output, EventEmitter, Optional, SkipSelf, AfterViewInit, OnDestroy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import {Helper} from '../../classes';
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { InventoryService } from '@shared/services';
import { SummaryPanelActionService } from '../../workspace-v3/summary-panel-action.service';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
@Component({
  selector: 'app-operator-widget-dialog-w3',
  templateUrl: './operator-widget-dialog-w3.component.html',
  styleUrls: ['./operator-widget-dialog-w3.component.less']
})
export class OperatorWidgetDialogComponentW3
  implements OnInit, AfterViewInit, OnChanges,OnDestroy {
  optionsData = [];
  options: any[] = [];
  searchQuery: any;
  public singleSelectOption = {};
  public selectedDummyFilterOptions = [];
  public method = 'multiple';
  public editFilter: false;
  @Input() public moduleName;
  @Input() public includeType;
  @Input() operatorsData;
  @Output() applyOperators = new EventEmitter();
  private unsubscribe = new Subject();
  selectedOpeatorFilters = [];
  oldOpeatorFilters: any[];
  constructor(
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData,
    @Optional() @SkipSelf() private dialogRef: MatDialogRef<OperatorWidgetDialogComponentW3>,
    private inventoryService: InventoryService,
    private summaryActionService: SummaryPanelActionService,
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.setOperators();
    this.summaryActionService
      .deleteOperator()
      .pipe(
        takeUntil(this.unsubscribe)
      )
      .subscribe((data) => {
        if (data === 'all') {
          this.clearAll();
          this.selectedOpeatorFilters = [];
          this.applyOperators.emit({
            selectedOptions: this.selectedOpeatorFilters,
            optionsData: this.dialogData.optionsData,
            operatorChanges: this.isOperatorChanged()
          });
        } else {
          this.selectedOpeatorFilters.forEach((opt) => {
            opt['selected'] = true;
          });
          const selectedIndex = this.selectedOpeatorFilters.findIndex((selOpt) => selOpt.id === data);
          if (selectedIndex > -1) {
            // this.selectedOpeatorFilters[selectedIndex]['selected'] = false;
            this.selectedOpeatorFilters.splice(selectedIndex, 1);
          }
          this.selectedDummyFilterOptions = this.optionsData.map((x) =>
            Object.assign({}, x)
          );
          this.options = this.optionsData.map((x) => Object.assign({}, x));
          let selectedOptions = this.selectedOpeatorFilters.filter(
            (opt) => opt.selected
          );
          this.applyOperators.emit({
            selectedOptions: selectedOptions,
            optionsData: this.dialogData.optionsData,
            operatorChanges: this.isOperatorChanged()
          });
        }
        this.cdRef.detectChanges();
      });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.operatorsData) {
      this.setOperators();
    }
  }
  private setOperators() {
    if (this.moduleName === 'project') {
      this.dialogData = this.operatorsData;
      this.applyOperators.emit(this.operatorsData);
    }
    this.optionsData = this.dialogData?.optionsData;
    if (this.dialogData['editFilter']) {
      this.editFilter = this.dialogData['editFilter'];
    }
    this.method = this.dialogData.method;
    // TODO: We can remove single selection code as everywhere we are using mulitple operators
    if (this.method === 'single') {
      this.singleSelectOption = this.dialogData.selectedOptions;
    } else {
      const selectedOperator = [...this.dialogData?.selectedOptions];
      this.selectedOpeatorFilters = selectedOperator;
      this.oldOpeatorFilters = Helper.deepClone(selectedOperator);
    }
    this.selectedDummyFilterOptions = this.optionsData.map((x) =>
      Object.assign({}, x)
    );
    this.options = this.optionsData.map((x) => Object.assign({}, x));
  }
  ngAfterViewInit() {
    if (this.moduleName === 'project') {
      setTimeout(() => {
        this.inventoryService.clearButtonSource
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            this.clearAll();
          });
      }, 1000);
    }
  }

  clearAll() {
    this.optionsData.map((opt) => {
      opt.selected = false;
    });
    this.options.map((opt) => {
      opt.selected = false;
    });
    this.selectedDummyFilterOptions.map((opt) => {
      opt.selected = false;
    });
    this.cdRef.markForCheck();
  }

  onChangeOperator(selectedOption, optionRef) {
    if (selectedOption && selectedOption['id'] === 'all') {
      if (optionRef['_selected']) {
        this.optionsData.map((opt) => {
          opt.selected = true;
        });
        this.selectedDummyFilterOptions.map((opt) => {
          opt.selected = true;
        });
        this.options.map((opt) => {
          opt.selected = true;
        });
      } else {
        this.clearAll();
      }
    } else {
      // un selected selected all option.
      this.setSelectAlloption(false);
      const selectedIndex = this.optionsData.findIndex(
        (opt) => opt.id === selectedOption.id
      );
      if (selectedIndex > -1) {
        this.optionsData[selectedIndex]['selected'] = optionRef['_selected'];
      }
      const optionIndex = this.options.findIndex(
        (opt) => opt.id === selectedOption.id
      );
      if (optionIndex > -1) {
        this.options[optionIndex]['selected'] = optionRef['_selected'];
      }
      // check selected option for dummy
      const index = this.selectedDummyFilterOptions.findIndex(
        (opt) => opt.id === selectedOption.id
      );
      if (index > -1) {
        this.selectedDummyFilterOptions[index]['selected'] =
          optionRef['_selected'];
      }

      // check options selecetd count
      const selected = this.selectedDummyFilterOptions.filter(
        (opt) => opt.selected
      );
      if (selected.length === this.options.length - 1) {
        this.setSelectAlloption(true);
      }
    }
    // if (this.moduleName === 'project') {
    //   this.onAdd();
    // }
  }

  setSelectAlloption(selected: Boolean = false) {
    const selectedAll = this.optionsData.findIndex((opt) => opt.id === 'all');
    if (selectedAll > -1) {
      this.optionsData[selectedAll]['selected'] = selected;
    }
    const selectedAllInx = this.options.findIndex((opt) => opt.id === 'all');
    if (selectedAllInx > -1) {
      this.options[selectedAllInx]['selected'] = selected;
    }

    const dummySelectedAll = this.selectedDummyFilterOptions.findIndex(
      (opt) => opt.id === 'all'
    );
    if (dummySelectedAll > -1) {
      this.selectedDummyFilterOptions[dummySelectedAll]['selected'] = selected;
    }
    // if (this.moduleName === 'project') {
    //   this.onAdd();
    // }
  }

  /* Function to add selected options
   */
  onAdd() {
    if (this.method === 'single') {
      this.dialogRef.close({
        selectedOption: this.singleSelectOption,
        optionsData: this.dialogData.optionsData
      });
    } else {
      /* let selectedOptions = this.selectedDummyFilterOptions.filter(
        (opt) => opt.selected
      );
      const selectedAllCount = selectedOptions.filter(
        (opt) => opt['id'] === 'all' && opt.selected
      ).length;
      if (selectedAllCount && selectedOptions.length > 0) {
        selectedOptions = [{ id: 'all', name: 'Select All', count: 0 }];
      } */
      if (this.moduleName === 'project') {
        this.applyOperators.emit({
          selectedOptions: this.selectedOpeatorFilters,
          optionsData: this.dialogData.optionsData,
          operatorChanges: this.isOperatorChanged()
        });
      } else {
        this.dialogRef.close({
          selectedOptions: this.selectedOpeatorFilters,
          optionsData: this.dialogData.optionsData
        });
      }
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
    const selectedCount = this.selectedDummyFilterOptions.filter(
      (opt) => opt.selected
    ).length;
    // if (selectedCount < this.options.length - 1) {
    //   this.setSelectAlloption(false);
    // } else if (selectedCount === this.options.length) {
    //   this.setSelectAlloption(true);
    // }
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
    const selectedData = this.optionsData.filter((opt) => opt.selected);

    this.selectedDummyFilterOptions.map((opt) => {
      opt.selected = false;
    });
    selectedData.map((element) => {
      const dummyIndex = this.selectedDummyFilterOptions.findIndex(
        (opt) => opt.id === element.id
      );
      if (dummyIndex > -1) {
        this.selectedDummyFilterOptions[dummyIndex]['selected'] = true;
      }
    });
  }

  isOperatorSelected() {
   return this.optionsData.filter((opt) => opt.selected).length > 0;
  }
  addSelection() {
    const optionsData = Helper.deepClone(this.optionsData);
    const selectedData = optionsData.filter((opt) => opt.selected);
    const selectedAllIndex = selectedData.findIndex((opt) => opt.id === 'all');
    if (selectedAllIndex !== -1) {
      this.selectedOpeatorFilters = selectedData.slice(selectedAllIndex, 1);
    } else {
      if (this.selectedOpeatorFilters.find((opt) => opt.id === 'all')) {
        this.selectedOpeatorFilters = selectedData;
      } else {
        this.selectedOpeatorFilters.push(...selectedData);
      }
      this.selectedOpeatorFilters = Array.from(new Set(this.selectedOpeatorFilters.map(op => op.name)))
      .map(name => {
        return {
          name: name,
          id: name
        };
      });
    }
    this.onAdd();
    this.clearAll();
  }
  private getUniqueValues = (value, index, self) => {
    return self.indexOf(value) === index;
  };
  deleteOperatorFilter(i) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(filter((result) => result && result['action']))
      .subscribe((result) => {
        this.selectedOpeatorFilters.splice(i, 1);
        this.onAdd();
      });
  }
  isOperatorChanged() {
    return JSON.stringify(this.selectedOpeatorFilters.map((op) => op.name).sort()) !== JSON.stringify(this.oldOpeatorFilters.map((op) => op.name).sort());
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

