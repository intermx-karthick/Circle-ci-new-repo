import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { LocalStorageKeys, UserRoleTypes } from '@interTypes/enums';
import { AuthenticationService } from '@shared/services/authentication.service';
import { Observable, Subject , BehaviorSubject} from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-general-form-v2',
  templateUrl: './general-form-v2.component.html',
  styleUrls: ['./general-form-v2.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralFormV2Component implements OnInit, OnDestroy {
  @Input() vendorDetails$: BehaviorSubject<any>;
  @Output() generalFormChange = new EventEmitter();
  @Input() scrolling$: Subject<any>;
  @Input() public scrollingContainer:string;

  public generalForm: FormGroup;
  public disableEdit = false;
  readonly permissionKey = Object.freeze({
    VENDORS: 'vendor_general',
  });
  private unSubscribe$: Subject<void> = new Subject<void>();

  public isMangerPermission = false;

  constructor(private fb: FormBuilder, private auth: AuthenticationService) {}

  public ngOnInit(): void {
    this.buildForm();
    this.updateFormRef();
    this.updateVendorDetailsForm();
    this.checkForEditPermission();
    this.checkManagerPermission();
  }

  public ngOnDestroy(): void {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  private buildForm() {
    this.generalForm = this.fb.group({
      basicDetails: [null],
      // notes: [null],
      doNotUseFlag: [false],
      currentFlag: [false],
      opsApprovedFlag: [false]
    });
  }

  private checkForEditPermission() {
    const permissions = this.auth.getUserPermission(this.permissionKey.VENDORS);
    if (permissions && !permissions.edit) {
      this.generalForm.disable();
      this.disableEdit = true;
    }
  }
  private updateFormRef() {
    this.generalForm.valueChanges
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe(() => {
        this.generalFormChange.emit(this.generalForm);
      });
  }

  private updateVendorDetailsForm() {
    this.vendorDetails$
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe((vendor) => {
        if (vendor) {
          this.updateGeneralFormData(vendor);
        }
      });
  }

  private updateGeneralFormData(vendor) {
    this.generalForm.patchValue({
      basicDetails: {
        name: vendor?.name ?? null,
        businessPhone: vendor?.businessPhone ?? null,
        businessFax: vendor?.businessFax ?? null,
        email: vendor?.email ?? null,
        businessWebsite: vendor?.businessWebsite ?? null,
        billingEmail: vendor?.billingEmail ?? null,
        address: {
          address: vendor?.address ?? null,
          zipCode: vendor?.zipcode ?? null,
          city: vendor?.city ?? null,
          state: vendor?.state ?? null
        },
        taxIdNumber: vendor?.taxIdNumber ?? null,
        type: vendor?.type ?? null,
        diversityOwnership: vendor?.diversityOwnership ?? null,
        pubA_id: vendor?.pubA?.id ?? null,
        pubA_edition: vendor?.pubA?.edition ?? null,
        pubB_id: vendor?.pubB?.id ?? null,
        pubB_edition: vendor?.pubB?.edition ?? null,
        parentFlag: vendor?.parentFlag ?? false,
        parentCompany: vendor?.parentCompanyId ? { name: vendor?.parentCompany, _id: vendor?.parentCompanyId }: null,
        retirementDate: vendor?.retirementDate ?? false,
        uploadInstruction: vendor?.uploadInstruction ?? null,
        instructionUrl: vendor?.instructionUrl ?? null
      },
      // notes: vendor?.notes ?? null,
      doNotUseFlag: vendor?.doNotUseFlag ?? false,
      currentFlag: vendor?.currentFlag ?? false,
      opsApprovedFlag: vendor?.opsApprovedFlag ?? false
    });
    this.checkManagerPermission();
  }

  /**
   * method to add OPS field and form Edit permission based on ROLE
   */
  private checkManagerPermission() {
    const userData = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DATA));
    const userRoleData = (userData?.[LocalStorageKeys.USER_ROLE]) ? userData?.[LocalStorageKeys.USER_ROLE] : [];
    this.isMangerPermission = (userRoleData && Array.isArray(userRoleData)) ? userRoleData.includes(UserRoleTypes.VENDOR_MANAGER_ROLE) : true;
    
    if(this.generalForm?.controls?.opsApprovedFlag.value && !this.isMangerPermission) {
      this.generalForm.disable();
      this.disableEdit = true;
    }
  }
}
