import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  OnDestroy
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, NgForm } from '@angular/forms';
import { ShippingAddress, ShippingAddressPayload } from '@interTypes/records-management';
import { AuthenticationService } from '@shared/services/authentication.service';
import { Helper } from 'app/classes';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecordService } from '../record.service';

@Component({
  selector: 'app-shipping-address-list',
  templateUrl: './shipping-address-list.component.html',
  styleUrls: ['./shipping-address-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShippingAddressListComponent
  implements OnInit, OnChanges, OnDestroy {
  shippingAddressForm: FormGroup;
  @Input() shippingAddresses: ShippingAddress[] = [];
  @Input() vendorId: string;
  @Input() submitForm$: Subject<void> = new Subject<void>();
  @Input() addShippingAddress$: Subject<boolean> = new Subject<boolean>();
  private unsubscribe$: Subject<void> = new Subject<void>();
  public addressGroup: FormArray;
  public disableEdit = false;
  readonly permissionKey = Object.freeze({
    VENDORS: 'vendor_shipping',
  });
  @Input() public scrollingContainer:string;
  
  constructor(
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private recordService: RecordService,
    private auth: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.shippingAddressForm = this.fb.group({
      shippingAddressList: this.fb.array([])
    });
    this.addressGroup = this.shippingAddressForm.get(
      'shippingAddressList'
    ) as FormArray;
    this.addNewShippingAddress();
    this.submitForm$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      if (this.shippingAddressForm.valid) {
        this.updateShippingAddresses();
      }
    });
    this.addShippingAddress$.pipe(takeUntil(this.unsubscribe$)).subscribe((flag) => {
      if (flag) {
        this.addNewShippingAddress();
      }
    });
    this.checkForEditPermission();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes?.shippingAddresses?.currentValue?.length) {
      this.addressGroup?.clear();
      this.loadAddresses();
    }
  }
  private checkForEditPermission() {
    const permissions = this.auth.getUserPermission(this.permissionKey.VENDORS);
    if (permissions && !permissions.edit) {
      this.disableEdit = true;
    }
  }
  private loadAddresses() {
    this.shippingAddresses.forEach((address) => {
      this.addNewShippingAddress(address);
    });
  }
  // get addressGroup(): FormArray {
  //   return this.shippingAddressForm.get('shippingAddressList') as FormArray;
  // }

  /**
   * This method is to add new formGroup to formArray
   *
   */
  public addNewShippingAddress(address = null,index=0) {
    if (!this.shippingAddressForm) {
      return;
    }
    this.addressGroup.insert(index,
      this.fb.group({
        shippingAddress: [address ?? null]
      })
    );
    this.cdRef.detectChanges();
  }

  /**
   * This method is to delete formGroup to formArray
   *
   */
  public deleteShippingAddress(index: number) {
    this.addressGroup.removeAt(index);
    // Loading default form in case if all the items are deleted
    if (this.addressGroup.length === 0) {
      this.addNewShippingAddress();
    }
  }

  public duplicateShippingAddress(index: number) {
    const formArray = this.shippingAddressForm.get(
      'shippingAddressList'
    ) as FormArray;
    const formData = Helper.deepClone(formArray.controls[index].value);
    if (formData.shippingAddress?.designator) {
      formData.shippingAddress.designator = `Copy of ${formData.shippingAddress?.designator}`;
    }
    if (formData.shippingAddress?.phoneNumber?.area) {
      const phoneNumber = formData.shippingAddress.phoneNumber;
      formData.shippingAddress.phoneNumber = `${phoneNumber.area}${phoneNumber.exchange}${phoneNumber.subscriber}`;
    }
    if (formData?.shippingAddress?.zipCode) {
      formData.shippingAddress.zipCode = formData.shippingAddress.zipCode?.ZipCode ?? formData.shippingAddress.zipCode ?? '';
    }
    this.addNewShippingAddress(formData.shippingAddress, index);
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private updateShippingAddresses() {
    const addressList = this.shippingAddressForm.value.shippingAddressList;
    const payload = {
      shippingAddress: []
    };
    addressList.forEach((address) => {
      const data: ShippingAddressPayload = {
        designator: address.shippingAddress?.designator ?? null,
        businessName: address.shippingAddress?.businessName ?? null,
        email: address.shippingAddress?.email ?? null,
        contactName: address.shippingAddress?.contactName ?? null,
        address: address.shippingAddress?.address ?? null,
        city: address.shippingAddress?.city ?? null,
        state: address.shippingAddress?.state?._id ?? null,
        // To make the code reusable I changes shipping address for zipcode to zipCode
        // Here we might get data in three ways depend up on the form status(touched or not)
        zipcode: address.shippingAddress?.zipCode?.ZipCode ?? address.shippingAddress?.zipCode ?? address.shippingAddress?.zipcode ?? ''
      }
      if (address.shippingAddress?.phoneNumber?.area) {
        const phoneNumber = address.shippingAddress.phoneNumber;
        data.phoneNumber = `${phoneNumber.area}${phoneNumber.exchange}${phoneNumber.subscriber}`;
      } else {
        data.phoneNumber = address.shippingAddress?.phoneNumber ?? null;
      }
      payload.shippingAddress.push(data);
    });
    this.recordService
      .updateVendorShippingAddress(this.vendorId, payload)
      .subscribe(
        (response) => {
          this.recordService.showsAlertMessage(
            'Shipping address updated successfully!'
          );
        },
        (errorResponse) => {
          if (errorResponse.error?.message) {
            this.recordService.showsAlertMessage(errorResponse.error?.message);
            return;
          }
          this.recordService.showsAlertMessage(
            'Something went wrong, Please try again later'
          );
        }
      );
  }
}
