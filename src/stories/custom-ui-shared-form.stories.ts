import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Component } from '@angular/core';
import { moduleMetadata, storiesOf } from '@storybook/angular';
import { AutocompleteSelectComponent } from 'app/custom-ui-shared/autocomplete-select';
import { MultiselectDropdownComponent } from 'app/custom-ui-shared/multiselect-dropdown';
import { PhoneNumberInputComponent } from 'app/custom-ui-shared/phone-number-input';
import { Options } from 'app/custom-ui-shared/autocomplete-select/types';
import { StoriesModuleTesting } from './stories.module.testing';

@Component({
  selector: 'app-story-custom-ui-shared-form',
  template: `
    <form [formGroup]="form">
      <div fxLayout="row wrap" fxLayoutAlign="start center" fxLayoutGap="16px">
        <mat-form-field class="imx-input" fxFlex="150px">
          <mat-label>Search</mat-label>
          <input matInput autocomplete="off" />
        </mat-form-field>
        <mat-form-field class="imx-input" fxFlex="150px">
          <mat-label>First Name</mat-label>
          <input matInput autocomplete="off" />
        </mat-form-field>
        <mat-form-field class="imx-input" fxFlex="150px">
          <mat-label>Second Name</mat-label>
          <input matInput autocomplete="off" />
        </mat-form-field>
        <app-autocomplete-select
          [options]="options"
          label="Autocomplete"
          formControlName="autoComplete"
        ></app-autocomplete-select>
      </div>
      <div fxLayout="row wrap" fxLayoutAlign="start center" fxLayoutGap="16px">
        <div fxLayout="column" fxLayoutAlign="start start">
          <app-phone-number-input
            inputPlaceholder="Phone"
            formControlName="phone"
          ></app-phone-number-input>
          <mat-error
            style="color: #B00048 !important;"
            *ngIf="form.controls['phone']?.invalid"
            >Invalid Number</mat-error
          >
        </div>
        <div fxLayout="column" fxLayoutAlign="start start">
          <app-phone-number-input
            inputPlaceholder="FAX"
            formControlName="fax"
          ></app-phone-number-input>
          <mat-error
            style="color: #B00048 !important;"
            *ngIf="form.controls['fax']?.invalid"
            >Invalid Number</mat-error
          >
        </div>
      </div>
    </form>
  `
})
class CustomUISharedFormComponent {
  public form = new FormGroup({
    autoComplete: new FormControl(undefined),
    phone: new FormControl('', Validators.required),
    fax: new FormControl('', Validators.required)
  });

  public options: Options = [
    { id: '1', name: 'Name 1' },
    { id: '2', name: 'Name 2' },
    { id: '3', name: 'Name 3' },
    { id: '4', name: 'Name 4' },
    { id: '5', name: 'Name 5' },
    { id: '6', name: 'Name 6' },
    { id: '7', name: 'Name 7' },
    { id: '8', name: 'Name 8' },
    { id: '9', name: 'Name 9' },
    { id: '10', name: 'Name 10' },
    { id: '11', name: 'Name 11' },
    { id: '12', name: 'Loooooooooooooong Name 12' }
  ];
}

storiesOf('custom-ui-shared', module)
  .addDecorator(
    moduleMetadata({
      ...StoriesModuleTesting,
      declarations: [
        AutocompleteSelectComponent,
        MultiselectDropdownComponent,
        PhoneNumberInputComponent,
        CustomUISharedFormComponent
      ]
    })
  )
  .add('form-example', () => ({
    template: `<app-story-custom-ui-shared-form></app-story-custom-ui-shared-form>`
  }));
