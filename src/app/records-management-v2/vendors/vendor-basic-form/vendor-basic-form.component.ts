import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Optional,
  SkipSelf,
  Inject,
  forwardRef,
  ViewChild,
  ElementRef,
  AfterViewInit, Input, OnChanges
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup, NG_VALIDATORS,
  NG_VALUE_ACCESSOR, ValidationErrors, Validator,
  Validators
} from '@angular/forms';
import { filter, takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { Vendor } from '@interTypes/inventory-management';
import { UploadAttachments } from '@interTypes/uploadAttachments';
import { FileUploadConfig } from '@interTypes/file-upload';
import { VendorGroup, VendorType } from '@interTypes/vendor';
import { VendorGroupAbstract } from '../vendor-group';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { RecordService } from '../../record.service';
import { MyTel } from '../../telephone/telephone-input/telephone-input.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { forbiddenNamesValidator } from '@shared/common-function';

/**
 * @description
 *   This component can be reusable to add vendor and general form
 * @example
 *     <app-vendor-basic-form formControlName="basicDetails"></app-vendor-basic-form>
 */
@Component({
  selector: 'app-vendor-basic-form',
  templateUrl: './vendor-basic-form.component.html',
  styleUrls: ['./vendor-basic-form.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VendorBasicFormComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VendorBasicFormComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorBasicFormComponent extends VendorGroupAbstract
  implements OnInit, OnChanges, ControlValueAccessor,AfterViewInit, Validator {
  public createEditVendorForm: FormGroup;
  public vendors: Vendor[];
  public acceptedFileFormats = ['csv'];
  public attachments: any = [];
  public attachmentFile: UploadAttachments[];
  public clearField = false;
  public scrollContent: number;
  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: true
  };
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
  public vendorNoteId$ = new BehaviorSubject(null);

  public vendorId;
  private urlPatten = 'https?://.+';
  @ViewChild('vendorTypeRef', {read: ElementRef}) vendorTypeRef: ElementRef;
  public vendorTypeTooltipText = '';
  @ViewChild('diversityRef', {read: ElementRef}) diversityRef: ElementRef;
  public diversityTooltipText = '';

  @Input() scrolling$: Subject<any>;
  @ViewChild('vGroupInputRef', { read: MatAutocompleteTrigger })
  parentCompanyAutoCompleteTrigger: MatAutocompleteTrigger;
  @Input() public scrollingContainer:string;
  @Input() public disableEdit: boolean;

  constructor(
    private fb: FormBuilder,
    public vendorApi: RecordService,
    private route: Router,
    private matSnackBar: MatSnackBar,
    public cdRef: ChangeDetectorRef,
    private activeRoute: ActivatedRoute,
    @Optional()
    @SkipSelf()
    private dialogRef: MatDialogRef<VendorBasicFormComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public data
  ) {
    super(vendorApi, cdRef);
  }

  public ngOnInit(): void {
    this.buildForm();
    this.listenForScroll();
    this.loadVendorsGroups();
    this.setFilterVendorsGroupSubscribtion(
      this.createEditVendorForm,
      'parentCompany'
    );

    this.loadVendorTypes();
    this.loadDiversityOwnerships();

    this.createEditVendorForm
      .get('parentFlag')
      .valueChanges.pipe(
      takeUntil(this.freeUp$),
      filter((value) => !!value)
    )
      .subscribe((value) => {
        this.createEditVendorForm
          .get('parentCompany')
          .patchValue(null, { emitEvent: false });
      });

    this.createEditVendorForm
      .get('parentCompany')
      .valueChanges.pipe(
      takeUntil(this.freeUp$),
      filter((value) => !!value)
    )
      .subscribe((value) => {
        if(!value.name) return;
        this.createEditVendorForm
          .get('parentFlag')
          .patchValue(false, { emitEvent: false });
      });


    this.activeRoute.params.pipe(
      takeUntil(this.freeUp$)
    ).subscribe((params) => {
     this.vendorNoteId$.next(params['id']);
    });
    if(this.disableEdit) {
      this.createEditVendorForm.disable();      
    }
  }

  /* added to watch disable listen when its depends dynamic form values */
  public ngOnChanges(): void {
    if (this.disableEdit && this.createEditVendorForm) {
      this.createEditVendorForm?.disable();
    }
  }

  public vendorDisplayWithFn(vendorGroup: VendorGroup) {
    return vendorGroup?.name ?? '';
  }

  public vGroupTrackByFn(idx: number, vendorGroup: VendorGroup) {
    return vendorGroup?._id ?? idx;
  }

  public onSubmit(value) {
    console.log('this.createEditVendorForm', this.createEditVendorForm);
    // TODO : Implement API integration
  }

  public navigateToVendorList(result?: any) {
    if (this.dialogRef) {
      this.dialogRef.close(result);
    } else {
      this.route.navigateByUrl('/records-management-v2/vendors');
    }
  }

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

  public registerOnChange(fn: any): void {
    this.createEditVendorForm.valueChanges
      .pipe(takeUntil(this.freeUp$))
      .subscribe(fn);
  }

  public registerOnTouched(fn: any): void {
    this.createEditVendorForm.valueChanges
      .pipe(takeUntil(this.freeUp$))
      .subscribe(fn);
  }

  public writeValue(vendor: any): void {
    if(!vendor) return;
    this.createEditVendorForm.patchValue({
      name: vendor?.name ?? null,
      businessPhone: this.splitValuesInMyTelFormat(vendor?.businessPhone) ?? null,
      businessFax: this.splitValuesInMyTelFormat(vendor?.businessFax) ?? null,
      email: vendor?.email ?? null,
      businessWebsite: vendor?.businessWebsite ?? null,
      billingEmail: vendor?.billingEmail ?? null,
      address: {
        address: vendor?.address?.address ?? null,
        zipCode: vendor?.address?.zipCode ?? null,
        city: vendor?.address?.city ?? null,
        state: vendor?.address?.state ?? null
      },
      taxIdNumber: vendor?.taxIdNumber ?? null,
      type: this.formatVendorType(vendor?.type),
      diversityOwnership: this.formatDiversityOwnership(vendor?.diversityOwnership),
      pubA_id: vendor?.pubA_id ?? null,
      pubA_edition: vendor?.pubA_edition ?? null,
      pubB_id: vendor?.pubB_id ?? null,
      pubB_edition: vendor?.pubB_edition ?? null,
      parentFlag: !!vendor.parentFlag,
      parentCompany: vendor?.parentCompany ?? null,
      uploadInstruction: vendor?.uploadInstruction ?? null,
      instructionUrl: vendor?.instructionUrl ?? null
    });

    if( vendor?.retirementDate){
      this.createEditVendorForm.patchValue({retirementDate: vendor.retirementDate})
    }

    if (vendor?.diversityOwnership?.length) {
      this.diversityTooltipText = vendor.diversityOwnership.map((obj) => obj.name).join(',');
    }
    if (vendor?.type?.length) {
      this.vendorTypeTooltipText = vendor.type.map((obj) => obj.name).join(',');
    }
  }

  private buildForm() {
    this.createEditVendorForm = this.fb.group({
      name: [
        null,
        [Validators.required, CustomValidators.noWhitespaceValidator(true), Validators.maxLength(64)]
      ],
      businessPhone: [null, [CustomValidators.telephoneInputValidator]],
      businessFax: [null, [CustomValidators.telephoneInputValidator]],
      email: [null, Validators.email],
      businessWebsite: [null, CustomValidators.validUrl],
      address: [null],
      taxIdNumber: [null],
      type: [null],
      diversityOwnership: [null],
      pubA_id: [null, Validators.maxLength(8)],
      pubB_id: [null, Validators.maxLength(8)],
      pubA_edition: [null],
      pubB_edition: [null],
      parentCompany: [null, null, forbiddenNamesValidator],
      parentFlag: [false],
      billingEmail: [null, Validators.email],
      retirementDate: [null],
      uploadInstruction: [null],
      instructionUrl: [null, CustomValidators.validUrl]
    });
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

  splitValuesInMyTelFormat(value){
    if(!value){
      return new MyTel('', '', '')
    }
    const tempVal = value.toString();
    return new MyTel(tempVal.slice(0, 3), tempVal.slice(3, 6), tempVal.slice(6, 10))
  }

  public validate(c: AbstractControl): ValidationErrors | null {
    return this.createEditVendorForm.valid
      ? null
      : {
        invalidForm: { valid: false, message: 'Vendor form fields are invalid' }
      };
  }

  public formatVendorType(type){
    if(!type) return null;

    return type?.map?.((type=>type?._id)) ?? null;
  }

  public formatDiversityOwnership(diversityOwnership){
    if(!diversityOwnership) return null;

    return diversityOwnership?.map?.((diversityOwnership=>diversityOwnership?._id)) ?? null;
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

  public listenForScroll(){
    this.scrolling$?.pipe?.(takeUntil(this.freeUp$)).subscribe(_=>{
      this.parentCompanyAutoCompleteTrigger.closePanel();
    })
  }

  public openParentCompanyAutoComplete(){
    this.parentCompanyAutoCompleteTrigger.openPanel();
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
}
