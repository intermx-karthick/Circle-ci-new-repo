import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import { Role } from '@interTypes/user/v2-user-details.repsonse';
import { User } from 'app/user-management/models';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-multi-select-group-details',
  templateUrl: 'multi-select-group-details.component.html',
  styleUrls: ['multi-select-group-details.component.less']
})
export class MultiSelectGroupDetailsComponent {
  disableEditing: boolean;
  @Input() label: string;
  @Input() isDisabled = false;
  @Input() isShowCount = true;
  @Input() hideChipList = false;
  @Input() showSearhIcon = false;
  @Input() set elements(value: Role[] | User[]) {
    if (!value) {
      return;
    }

    this.allElements = value;
    this.filteredElements = this.elementsCtrl.valueChanges.pipe(
      startWith(''),
      map((el: string | null) =>
        el ? this._filter(el) : this.allElements.slice()
      )
    );
  }

  @Input() set current(value: Role[] | User[]) {
    if (!value) {
      return;
    }

    this.selectedElements = value;
  }
  @Input() set disableEdit(value: boolean) {
    this.disableEditing = !!value;
  }
  @Output() selectionChanged = new EventEmitter<any[]>();
  @Output() selectionsRemoved = new EventEmitter<any[]>();

  visible = true;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  elementsCtrl = new FormControl();
  filteredElements: Observable<any[]>;
  selectedElements: any[] = [];
  allElements: any[] = [];
  elementsToDelete: any[] = [];

  @ViewChild('multiSelectInput') multiSelectInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  constructor() { }

  remove(element: Role[] | User[]): void {
    const index = this.selectedElements.indexOf(element);

    if (index >= 0) {
      this.selectedElements.splice(index, 1);
      this.elementsToDelete.push(element);
      this.selectionsRemoved.emit(element);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const elementToAdd: any = event.option.value;

    if (!this.selectedElements.map((x) => x.name).includes(elementToAdd.name)) {
      this.selectedElements.push(elementToAdd);
      this.selectionChanged.emit(this.selectedElements);
    }

    this.multiSelectInput.nativeElement.value = '';
    this.elementsCtrl.setValue(null);
  }

  private _filter(value: any): Role[] | User[] {
    const filterValue =
      typeof value === 'string'
        ? value.toLowerCase()
        : value.name.toLowerCase();

    return this.allElements.filter(
      (element) => element.name.toLowerCase().indexOf(filterValue) === 0
    );
  }
}
