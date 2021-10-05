import { Component, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, Validators } from '@angular/forms';

import { AbstractAdressFormComponent } from '../abstract.adress-form.component';

@Component({
  selector: 'app-international-address',
  templateUrl: './international-address.component.html',
  styleUrls: ['./international-address.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InternationalAddressComponent),
      multi: true
    }
  ]
})
export class InternationalAddressComponent extends AbstractAdressFormComponent{
  states: any = ['LOS VEGAS', 'LOS ANGELS', 'NEW YORK'];
  countries: any = ['United States', 'India'];

  buildForm(): void {
    this.formGroup = this.fb.group({
      address: [''],
      postalCode: ['', Validators.maxLength(6)],
      country: [''],
      city: [''],
      state: ['']
    });
  }
}
