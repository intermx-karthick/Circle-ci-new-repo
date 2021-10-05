import {Component, Input} from '@angular/core';
import {AbstractControl, AbstractControlDirective} from '@angular/forms';

@Component({
  selector: 'show-errors',
  template: `
    <span *ngIf="shouldShowErrors()" class="validation-errors help-block">
     {{getError()}}
    </span>
  `,
})
export class ShowErrorsComponent {

  private static readonly errorMessages = {
    'required': (params) => '##FIELD## can\'t be blank',
    'minlength': (params) => '##FIELD## should be minimum ' + params.requiredLength + ' characters',
    'maxlength': (params) => '##FIELD## should not be greater then ' + params.requiredLength + ' characters',
    'pattern': (params) => '##FIELD## should contain only numbers',
    'email': (params) => 'Should be valid email.',
    'vaildEmail': (params) => 'Should be valid email',
    'validUrl': (params) => 'Please include http:// or https:// with valid URL',
    'notEquivalent': (params) => 'Password entries must match',
    // '##FIELD## should match with Password',
    'uniqueName': (params) => 'Name is already exists',
    'min': (params) => '##FIELD## should be minimum length of 16'
  };

  @Input()
  private control: AbstractControlDirective | AbstractControl;

  shouldShowErrors(): boolean {

    return this.control &&
      this.control.errors &&
      (this.control.dirty || this.control.touched);
  }

  listOfErrors(): string[] {
    return Object.keys(this.control.errors)
      .map(field => this.getMessage(field, this.control.errors[field],  this.control));
  }
  getError(): string {
    const errors = Object.keys(this.control.errors)
     .map(field => this.getMessage(field, this.control.errors[field], this.control));
    if (errors[0] === 'Phone Number should contain only numbers' ||
    errors[0] === 'Phone Number should be minimum 10 characters' || errors[0] === 'Phone Number should not be greater then 10 characters') {
      errors[0] = 'Phone number must be 10 characters, numbers only';
    } else if (errors[0] === "Phone Number can't be blank"){
      errors[0] ="Phone number can't be blank"
  }

return errors[0];

 }
  private getMessage(type: string, params: any, control: any) {
    let fname = this.getControlName(control);
    fname = (fname === 'is_recurring_enabled' ? 'donation_type' : fname);
    fname = fname.replace('_', ' ');
    fname = fname.replace('_', ' ');
    fname = fname.replace('_', ' ');
    fname = fname.replace('_', ' ');
    fname = fname.replace(' ids', ' ');
    fname = fname.replace(' id', '').toLowerCase();
    fname = fname.replace(/\b\w/g, l => l.toUpperCase());
    const msg = ShowErrorsComponent.errorMessages[type](params);
    return msg.replace('##FIELD##', fname);
  }
  getControlName(c: AbstractControl): string | null {
      const formGroup = c.parent.controls;
      return Object.keys(formGroup).find(name => c === formGroup[name]) || null;
  }
}
