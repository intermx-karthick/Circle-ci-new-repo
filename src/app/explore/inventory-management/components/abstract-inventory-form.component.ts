import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

/**
 * @description
 *  This is an abstract component. So dont
 *  declare it in module.
 */
@Component({
  template: ''
})
export abstract class AbstractInventoryFormComponent {

  @Input()
  get form(): FormGroup {
    return this._form;
  }
  set form(value: FormGroup) {
    this._form= value;
    this.formChange.emit(this._form);
  }
  public _form = null;
  @Output() formChange = new EventEmitter<FormGroup>();

  abstract updateFormRef();

}
