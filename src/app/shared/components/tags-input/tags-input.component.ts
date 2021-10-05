import { concat } from 'rxjs';
import {Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import {COMMA, ENTER, SEMICOLON, SPACE} from '@angular/cdk/keycodes';

@Component({
  selector: 'app-tags-input',
  templateUrl: './tags-input.component.html',
  styleUrls: ['./tags-input.component.less']
})
export class TagsInputComponent implements OnInit, OnChanges {
  @Input() placeholder: string = null;
  @Input() class: string = null;
  @Input() chips: Array<string>;
  @Input() invalidChips: any;
  @Input() invalidFilterChips: any;
  @Input() form: Boolean = false;
  @Input() editable: Boolean = false;
  @Input() exploreFilters: Boolean = false;
  @Input() removedInvalidChipsStatus: Boolean = false;
  @Input() numberOnly: Boolean = false;
  @Input() keysCodes: number[];
  @Output() enableEdit = new EventEmitter();
  @Input() type: string;
  @Output() clearUnitIds = new EventEmitter();
  @Input() matFormConfig;
  @Output() chipAdded = new EventEmitter();
  @Input() hint = '';
  defaultMatFormConfig = { float: 'never' };
  @Output() focusEvt = new EventEmitter();
  @Output() blurEvt = new EventEmitter();
  public separatorKeysCodes: number[];
  constructor() { }

  ngOnInit() {
    this.separatorKeysCodes = (this.keysCodes) ? this.keysCodes : [ENTER, COMMA, SEMICOLON, SPACE];
    this.matFormConfig = this.matFormConfig ? this.matFormConfig : this.defaultMatFormConfig;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.removedInvalidChipsStatus  && changes.removedInvalidChipsStatus.currentValue) {
      const removedInvalidType = changes.removedInvalidChipsStatus.currentValue;
      if(removedInvalidType['action'] === 'invalidIds') {
        this.removingInvalidIds(this.invalidChips);
      } else {
        this.removingInvalidIds(this.invalidFilterChips);
      }
    }
  }
  /* removing invalid Ids from mat-chip */
  removingInvalidIds(invalidIDs) {
    if (invalidIDs && invalidIDs.data.length > 0) {
      // removing invalid from both GeoPanelIds and plantUnitIds
      invalidIDs.data.map(String).filter((ids) => {
        this.remove(ids);
      });
     }
    
   /* if (this.removedInvalidChipsStatus) {
      if (invalidIDs && invalidIDs.data.length > 0) {
        // removing invalid from both GeoPanelIds and plantUnitIds
        invalidIDs.data.map(String).filter((ids) => {
          this.remove(ids);
        });
       }
    }
    */
  }

  /* checking for invalid Ids */
  checkingInvalidChips(chip: any) {
    if (this.invalidChips || this.invalidFilterChips) {
      const allInvalidIds = (this.invalidFilterChips?.data || []) .concat(this.invalidChips?.data || []);
      const Ids = (typeof chip !== 'string') ? JSON.parse(chip) : chip;
      const invalidChipsData = allInvalidIds.map(String);
      for (let i = 0; i < allInvalidIds.length; i++) {
        if (Ids === invalidChipsData[i]) {
          return true;
        }
      }
    }
    return false;
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const data = event.value;
    if (
        (data || '').trim() &&
        !this.chips.includes(data) && 
        (!this.numberOnly || /^\d+$/.test(data))
      ) {
      this.chips.push(data.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
    this.chipAdded.emit(this.chips);
  }

  remove(fruit): void {
    const index = this.chips.indexOf(fruit);

    if (index >= 0) {
      this.chips.splice(index, 1);
    }
    this.chipAdded.emit(this.chips);
  }
  paste(event: ClipboardEvent): void {
    event.preventDefault(); // Prevents the default action
    if (this.numberOnly) {
      event.clipboardData
      .getData('Text') // Gets the text pasted
      .split(/\s*,| |\n|\r\n|\t\s*/) // Splits it when a SEMICOLON or COMMA or NEWLINE
      .forEach(value => {
        const isNUM = /^\d+$/.test(value);
        if (isNUM && !this.chips.includes(value)) {
          this.chips.push(value.trim()); // Push if valid
        }
      });
    } else {
      let separators = /\s*,|\n|\r\n|\t\s*/;
      if (this.separatorKeysCodes.includes(SPACE)) {
        separators =  /\s*,| |\n|\r\n|\t\s*/;
      }
      event.clipboardData
      .getData('Text') // Gets the text pasted
      .split(separators) // Splits it when a SEMICOLON or COMMA or NEWLINE
      .forEach(value => {
        if (value.trim() && !this.chips.includes(value)) {
          this.chips.push(value); // Push if valid
        }
      });
    }
  }
  onEnableEdit() {
    this.enableEdit.emit(this.editable);
  }

  onFocus(name) {
    this.clearUnitIds.emit(name);
  }
  triggerFocus() {
    this.focusEvt.emit();
  }
  triggerBlur() {
    this.blurEvt.emit();
  }
}
