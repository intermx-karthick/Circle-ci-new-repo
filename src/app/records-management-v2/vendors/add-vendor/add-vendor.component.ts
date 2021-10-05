import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Optional,
  SkipSelf,
  Inject,
  ViewChild,
  OnDestroy,
  AfterViewInit,
  ElementRef
} from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { filter, map, takeUntil } from 'rxjs/operators';
import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Vendor } from '@interTypes/inventory-management';
import { forbiddenNamesValidator } from '@shared/common-function';
import { VendorGroup } from '@interTypes/vendor/vendor-group-search';
import { VendorGroupAbstract } from '../vendor-group';
import { VendorType } from '@interTypes/vendor';
import { Helper } from 'app/classes';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { RecordService } from '../../record.service';
import { of, Subject } from 'rxjs';
import { MyTel } from '../../telephone/telephone-input/telephone-input.component';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { CkEditorConfig } from '@constants/ckeditor-config';

@Component({
  selector: 'app-add-edit-vendor',
  templateUrl: './add-vendor.component.html',
  styleUrls: ['./add-vendor.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddVendorComponent extends VendorGroupAbstract implements OnInit, AfterViewInit, OnDestroy {
  public createEditVendorForm: FormGroup;
  public vendors: Vendor[];
  public clearField = false;
  public scrollContent: number;
  public parentVendors: VendorGroup[] = [];
  public filteredParentVendors: VendorGroup[] = [];
  public panelContainer: string;
  public vendorTypes: VendorType[] = [];
  public vendorTypePagination = {
    perPage: 10,
    page: 1,
    total: 10
  };
  public isVendorTypesLoading = false;
  public diversityOwnerships: VendorType[] = [];
  public diversityOwnershipsPagination = {
    perPage: 10,
    page: 1,
    total: 10
  };
  public isDiversityOwnershipsLoading = false;
  public minDateForRetirementDate = new Date();
  private unSubscribe: Subject<void> = new Subject<void>();
  public vendorDetails: Vendor = {};
  @ViewChild('vendorTypeRef', {read: ElementRef}) vendorTypeRef: ElementRef;
  public vendorTypeTooltipText = '';
  @ViewChild('diversityRef', {read: ElementRef}) diversityRef: ElementRef;
  public diversityTooltipText = '';
  @ViewChild('vGroupInputRef', { read: MatAutocompleteTrigger })
  parentCompanyAutoCompleteTrigger: MatAutocompleteTrigger;
  public vendorNameLength = 96;
  public showEditor = false;
  public editorConfig = CkEditorConfig;
  constructor(
    public cdRef: ChangeDetectorRef,
    public vendorApi: RecordService,
    private fb: FormBuilder,
    private route: Router,
    private matSnackBar: MatSnackBar,
    private activeRoute: ActivatedRoute,
    @Optional() @SkipSelf() private dialogRef: MatDialogRef<AddVendorComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public data
  ) {
    super(vendorApi, cdRef);
    this.createEditVendorForm = fb.group({
      name: [
        null,
        [Validators.required, CustomValidators.noWhitespaceValidator(true), Validators.maxLength(64)]
      ],
      businessPhone: [null, [CustomValidators.telephoneInputValidator]],
      businessFax: [null, [CustomValidators.telephoneInputValidator]],
      email: [null, Validators.email],
      businessWebsite: [null, CustomValidators.validUrl],
      address: [null], // group addressLine1
      taxIdNumber: [null],
      type: [null],
      diversityOwnership: [null],
      pubA_id: [null, Validators.maxLength(8)],
      pubB_id: [null, Validators.maxLength(8)],
      pubA_edition: [null],
      pubB_edition: [null],
      notes: [null, [Validators.minLength(1), Validators.maxLength(2000), CustomValidators.noWhitespaceValidator(false)]],
      parentCompany: [null,null, forbiddenNamesValidator],
      parentFlag: [false],
      billingEmail: [null, Validators.email],
      retirementDate: [null],
      uploadInstruction: [null],
      instructionUrl: [null, CustomValidators.validUrl]
    });
  }

  public ngOnInit(): void {
    this.loadVendorsGroups();
    this.setFilterVendorsGroupSubscribtion(
      this.createEditVendorForm,
      'parentCompany'
    );

    if (this.activeRoute.snapshot.queryParams['vendorId']) {
      this.loadVendor(this.activeRoute.snapshot.queryParams['vendorId']);
    }

    this.reSize();
    this.loadVendorTypes();
    this.loadDiversityOwnerships();

    this.createEditVendorForm
      .get('parentFlag')
      .valueChanges.subscribe((value) => {
      if (value) {
        this.createEditVendorForm
          .get('parentCompany')
          .setValue(null, { emitEvent: false });
      }
    });

    this.createEditVendorForm
      .get('parentCompany')
      .valueChanges.subscribe((value) => {
      if (value) {
        this.createEditVendorForm
          .get('parentFlag')
          .setValue(false, { emitEvent: false });
      }
    });
  }

  private loadVendor(vendorId) {
    this.vendorApi
      .getVendorById(vendorId, false)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((response) => {
        if (response?._id) {
          this.vendorDetails = response;
          this.updateVendorFormData(response);
          this.reSize();
        } else {
          this.route.navigateByUrl(`/records-management-v2/vendors`);
          let message = 'Something went wrong, Please try again later';
          if (response?.error?.message) {
            message = response['error']['message'];
          } else if (response?.error?.error) {
            message = response['error']['error'];
          }
          this.showsAlertMessage(message);
        }
      });
  }
  // We are using this method to set the data to the form while duplication.
  // While duplicating we no need to set all values. For more details check ticket IMXUIPRD-3237
  private updateVendorFormData(vendor) {
    this.createEditVendorForm.patchValue({
      name: vendor?.name,
      email: vendor?.email ?? null,
      businessWebsite: vendor?.businessWebsite ?? null,
      billingEmail: vendor?.billingEmail ?? null,
      taxIdNumber: vendor?.taxIdNumber ?? null,
      type: this.formatVendorType(vendor?.type),
      diversityOwnership: this.formatDiversityOwnership(vendor?.diversityOwnership),
      parentFlag: vendor?.parentFlag ?? false,
      parentCompany: vendor?.parentCompanyId ? { name: vendor?.parentCompany, _id: vendor?.parentCompanyId } : null,
    });
  }

  public formatDiversityOwnership(diversityOwnership) {
    if (!diversityOwnership) return null;

    return diversityOwnership?.map?.((diversityOwnership => diversityOwnership?._id)) ?? null;
  }


  public formatVendorType(type) {
    if (!type) return null;
    return type?.map?.((type => type?._id)) ?? null;
  }

  public reSize() {
    this.scrollContent = window.innerHeight - (this.data?.size ? 240 : 350);
    this.vendorNameLength =  window.innerWidth < 1100 ? 70 : 96;
  }

  public onSubmit() {

    if (this.createEditVendorForm.invalid) return;

    const payload = this.buildAddVendorAPIPayload();

    this.vendorApi
      .createVendor(this.formatPayLoad(payload), false)
      .pipe(
        filter((response: any) => {
          if (!response) {
            this.showsAlertMessage(
              'Something went wrong, Please try again later'
            );
            return false;
          }

          return true;
        })
      )
      .subscribe((response) => {
        if (response['status'] === 'success') {
          this.showsAlertMessage('Vendor created successfully!');
          this.route.navigateByUrl(
            `/records-management-v2/vendors/${response.data.id}`
          );
        } else if (response['error']?.['message']) {
          this.showsAlertMessage(response['error']['message']);
        }
      }, (errorResponse) => {
        if (errorResponse.error?.message) {
          this.showsAlertMessage(errorResponse.error?.message);
          return;
        }
        this.showsAlertMessage(
          'Something went wrong, Please try again later'
        );
      });
  }

  public navigateToVendorList(result?: any) {
    if (this.dialogRef) {
      this.dialogRef.close(result);
    } else {
      this.route.navigateByUrl('/records-management-v2/vendors');
    }
  }

  public vendorDisplayWithFn(vendorGroup: VendorGroup) {
    return vendorGroup?.name ?? '';
  }

  public vGroupTrackByFn(idx: number, vendorGroup: VendorGroup) {
    return vendorGroup?._id ?? idx;
  }

  // To make inifinte scroll work, we need to set container when the autocomplete overlay panel is opened
  public updateContainer() {
    this.panelContainer = '.vendor-group-autocomplete';
  }

  public loadMoreVendorTypes() {
    const currentSize =
      this.vendorTypePagination.page * this.vendorTypePagination.perPage;
    if (currentSize > this.vendorTypePagination.total) {
      this.isVendorTypesLoading = false;
      return;
    }

    this.vendorTypePagination.total += 1;
    this.loadVendorTypes();
  }

  public loadMoreDiversityOwnerships() {
    const currentSize =
      this.diversityOwnershipsPagination.page *
      this.diversityOwnershipsPagination.perPage;
    if (currentSize > this.diversityOwnershipsPagination.total) {
      this.isDiversityOwnershipsLoading = false;
      return;
    }

    this.diversityOwnershipsPagination.total += 1;
    this.loadDiversityOwnerships();
  }

  private loadDiversityOwnerships() {
    this.isDiversityOwnershipsLoading = true;
    this.vendorApi
      .getVendorsDiversityOwnerships(this.diversityOwnershipsPagination)
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        this.diversityOwnerships = res.results;
        this.diversityOwnershipsPagination.total = res.pagination.total;
        this.isDiversityOwnershipsLoading = false;
        this.cdRef.markForCheck();
      });
  }

  private formatPayLoad(payloadData) {
    // Check vendor data & set null if empty
    Object.keys(payloadData).forEach((element) => {
      if (
        typeof payloadData[element] === 'string' &&
        payloadData[element].trim() === ''
      ) {
        payloadData[element] = null;
      }
    });
    return payloadData;
  }

  private loadVendorTypes() {
    this.isVendorTypesLoading = true;
    this.vendorApi
      .getVendorsTypesSearch(this.vendorTypePagination)
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        this.vendorTypes = res.results;
        this.vendorTypePagination.total = res.pagination.total;
        this.isVendorTypesLoading = false;
        this.cdRef.markForCheck();
      });
  }

  /**
   * @description
   *  This method is used to build the vendor creation api
   *  request payload
   */
  private buildAddVendorAPIPayload() {
    const payload = Helper.deepClone(this.createEditVendorForm.value);

    payload.parentCompany = payload.parentCompany?._id ?? null;
    payload.type =
      payload.type && !Array.isArray(payload.type)
        ? [payload.type]
        : payload.type;

    payload.diversityOwnership =
      payload.diversityOwnership && !Array.isArray(payload.diversityOwnership)
        ? [payload.diversityOwnership]
        : payload.diversityOwnership;

    if (payload.address) {
      payload.city = payload.address.city;
      payload.state = payload.address.state?._id;
      payload.zipcode = payload.address.zipCode?.ZipCode ?? '';
      payload.address = payload.address.address;
    }

    if (payload.retirementDate) {
      const retDate = new Date(payload.retirementDate);
      payload.retirementDate = format(retDate, 'MM/dd/yyyy', {
        locale: enUS
      });
    }

    if (payload.businessPhone) {
      const businessPhone = payload.businessPhone;
      payload.businessPhone = `${businessPhone.area}${businessPhone.exchange}${businessPhone.subscriber}`;
    }

    if (payload.businessFax) {
      const businessFax = payload.businessFax;
      payload.businessFax = `${businessFax.area}${businessFax.exchange}${businessFax.subscriber}`;
    }
    return Helper.removeEmptyOrNullRecursive(payload);
  }

  private showsAlertMessage(msg) {
    const config = {
      duration: 5000
    } as MatSnackBarConfig;

    this.matSnackBar.open(msg, '', config);
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  ngAfterViewInit(){
    this.getVendorTypetext();
    this.getDiversityOwnershiptext();
  }

  public getVendorTypetext(){
    setTimeout(() => {
      this.vendorTypeTooltipText = (this.vendorTypeRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
    }, 500);
  }

  public getDiversityOwnershiptext(){
    setTimeout(() => {
      this.diversityTooltipText = (this.diversityRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
    }, 500);
  }

  public openParentCompanyAutoComplete(){
    this.parentCompanyAutoCompleteTrigger.openPanel();
  }

  public handlerContainerScroll() {
    this.parentCompanyAutoCompleteTrigger.closePanel();
  }

  public tabLinkHandler(type: string) {
    let selectedVendor: any;
    selectedVendor = this.createEditVendorForm.controls?.['parentCompany']
      ?.value;

    if (selectedVendor) {
      const url = `${location.origin}/records-management-v2/vendors/${selectedVendor?._id}`;
      window.open(url, '_blank');
    }
  }

  public showEditorFunc() {
    this.showEditor = true;
    this.cdRef.markForCheck();
  }
}
