import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  forwardRef,
  Input,
  ViewChild,
  OnDestroy
} from '@angular/core';
import {
  AbstractControl,
  NgForm,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { forbiddenNamesValidator } from '@shared/common-function';
import { MyTel } from 'app/records-management-v2/telephone/telephone-input/telephone-input.component';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { State } from '../abstract-state-list';

import { AbstractAdressFormComponent } from '../abstract.adress-form.component';

@Component({
  selector: 'app-shipping-address',
  templateUrl: './shipping-address.component.html',
  styleUrls: ['./shipping-address.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShippingAddressComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ShippingAddressComponent),
      multi: true
    }
  ]
})
export class ShippingAddressComponent extends AbstractAdressFormComponent
  implements OnInit, OnDestroy {
  countries: any = ['United States', 'India'];
  states: any = [];
  panelStateContainer: any;
  @Input() submitForm$: Subject<void> = new Subject<void>();
  private unsubscribe$: Subject<void> = new Subject<void>();
  @ViewChild('shippingAddressFormRef') shippingAddressFormRef: NgForm;
  @Input() public scrollingContainer:string;
  @Input() public disableEdit = false;

  ngOnInit() {
    super.ngOnInit();
    //Load all state
    this.loadAllStates();
    this.submitForm$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.shippingAddressFormRef.onSubmit(undefined);
      this.cdRef.markForCheck();
    });
    if(this.disableEdit) {
      this.formGroup.disable();      
    }
  }

  buildForm(): void {
    this.formGroup = this.fb.group({
      designator: [''],
      businessName: [''],
      address: ['', Validators.maxLength(64)],
      zipCode: ['', null, forbiddenNamesValidator],
      city: [''],
      state: ['', null, forbiddenNamesValidator],
      contactName: [''],
      phoneNumber: [null, [CustomValidators.telephoneInputValidator]],
      email: ['', Validators.email]
    });
    this.loadZipCodes(this.formGroup);
  }

  public writeValue(shippingAddress: any): void {
    this.formGroup.patchValue({
      designator: shippingAddress?.designator,
      businessName: shippingAddress?.businessName,
      email: shippingAddress?.email,
      contactName: shippingAddress?.contactName,
      address: shippingAddress?.address ?? null,
      city: shippingAddress?.city ?? null,
      state: shippingAddress?.state ?? null
    });

    if (shippingAddress?.phoneNumber) {
      this.formGroup.patchValue({
        phoneNumber: this.splitValuesInMyTelFormat(shippingAddress.phoneNumber)
      });
    }

    if (shippingAddress?.zipcode || shippingAddress?.zipCode) {
      this.formGroup.patchValue({zipCode: {ZipCode: shippingAddress.zipcode ?? shippingAddress?.zipCode ?? ''}});
    }
  }
  stateDisplayWithFn(state: State) {
    return state?.name ? (state?.short_name + ' - ' + state?.name) : '';
  }

  stateTrackByFn(idx: number, state: State) {
    return state?._id ?? idx;
  }

  splitValuesInMyTelFormat(value) {
    if (!value) {
      return new MyTel('', '', '');
    }
    const tempVal = value.toString();
    return new MyTel(
      tempVal.slice(0, 3),
      tempVal.slice(3, 6),
      tempVal.slice(6, 10)
    );
  }
  public updateStateContainer() {
    this.panelStateContainer = '.state-list-autocomplete';
  }

  validate(c: AbstractControl): ValidationErrors | null {
    return this.formGroup.valid
      ? null
      : {
          invalidForm: {
            valid: false,
            message: 'Shipping address fields are invalid'
          }
        };
  }

  public onZipCodeSelection(option) {
    if (option['State']) {
      const stateOption = this.states.find((state) => state.short_name.toLowerCase() === option['State'].toLowerCase());
      if (stateOption) {
        this.formGroup.controls.state.patchValue(stateOption);
      }
    }
    if (option['City']) {
      this.formGroup.controls.city.patchValue(option['City']);
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
