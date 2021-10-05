import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
  forwardRef,
  Input, ViewContainerRef, Optional, SkipSelf, Inject, ElementRef, AfterViewInit
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgForm, ValidationErrors,
  Validators
} from '@angular/forms';
import { BehaviorSubject, EMPTY, Subject } from 'rxjs';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { filter, takeUntil } from 'rxjs/operators';

import { AbstractClientsDropDownComponent } from '../abstract-clients-drop-down.component';
import { VendorService } from '../../vendors/vendor.service';
import { RecordService } from '../../record.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { UseAutoCompleteInfiniteScroll } from '../../../classes/use-auto-complete-infinite-scroll';
import { CustomValidators } from '../../../validators/custom-validators.validator';
import { ClientProductDetailsResponse } from '@interTypes/records-management';
import { AddContactComponent } from '../../contacts/add-contact/add-contact.component';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { forbiddenNamesValidator } from '@shared/common-function';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProductFormComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ProductFormComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductFormComponent extends AbstractClientsDropDownComponent implements OnInit, AfterViewInit, ControlValueAccessor {
  @ViewChild('productFormRef') public productFormRef: NgForm;
  @Input() public submitForm$: Subject<any>;
  @Input() public disableEdit = false;

  public productForm: FormGroup;
  public parentClientsSearchStr: string;
  public panelContainer: string = '';

  public selectedBillingCompany;
  public isInitialLoadCompleted: boolean = false;
  public billingCompanyAutoComplete = new UseAutoCompleteInfiniteScroll();
  public billingContactsProvider = new UseAutoCompleteInfiniteScroll();
  public panelCompanyContainer: string;
  public unsubscribeInitiator$: Subject<void> = new Subject();
  public selectedBillingContact: any;

  private unsubscribe$: Subject<void> = new Subject();
  @ViewChild('billingContactRef', {read: ElementRef}) billingContactRef: ElementRef;
  public billingContactTooltipText = '';

  @Input() public containerScrolling$: Subject<string>;
  @ViewChild('companyInputRef', {read: MatAutocompleteTrigger})
  public companyAutoCompleteTrigger: MatAutocompleteTrigger;

  @Input() public organizationId;

  public contactPanelClass = ['imx-select','add-option-autocomplete'];


  constructor(
    private fb: FormBuilder,
    public vendorService: VendorService,
    public recordService: RecordService,
    public notificationService: NotificationsService,
    public cdRef: ChangeDetectorRef,
    public bottomSheet: MatBottomSheet,
    private dialog: MatDialog,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {
    super(recordService, notificationService, cdRef);
  }

  public ngOnInit(): void {
    this.buildForm();

    this.loadFeeBasis();
    this.loadCommissionBasis();
    this.setUpBillingCompany();
    this.setUpBillingContact();
    this.listenForContainerScroll();

    this.submitForm$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.productFormRef.onSubmit(this.productForm.value);
      this.cdRef.markForCheck();
    });

        // Billing feeBasis value change
    this.productForm?.controls?.billing?.['controls']?.feeBasis.valueChanges.subscribe(value=>{
        this.checkBillingFeeBasis(value);
    });

    // Revenue feeBasis value change
    this.productForm?.controls?.oohRevenue?.['controls']?.feeBasis.valueChanges.subscribe((value)=>{
      this.checkRevenueFeeBasis(value);
      });
    if(this.disableEdit) {
      this.productForm.disable();

    }
  }

  private  checkBillingFeeBasis(value){
    const commissonData = this.billingFeeBasis.find(bill=>bill?._id === value);
    //5fb61f5ad057ac4666fad8b2 // Commission id
    if(value === '5fb61f5ad057ac4666fad8b2' || commissonData?.name?.toLowerCase() === 'commission'){
      this.updateCommisionField(true);
    }else{
      this.updateCommisionField(false);
    }
  }

  private checkRevenueFeeBasis(value){
    const commissonData = this.ohhRevenueFeeBasis.find(bill=>bill?._id === value);
    //5fb61f5ad057ac4666fad8b2 // Commission id
    if(value === '5fb61f5ad057ac4666fad8b2' || commissonData?.name?.toLowerCase() === 'commission'){
      this.updateCommisionField(true, 'oohRevenue');
    }else{
      this.updateCommisionField(false, 'oohRevenue');
    }
  }

    private updateCommisionField(isEnableCommision = false, formGroupName='billing'){
    if(isEnableCommision){
      this.productForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.enable();
      this.productForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.setValidators([Validators.required]);
      this.productForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.updateValueAndValidity({ emitEvent: false });
      if(this.disableEdit) {
        this.productForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.disable();
      }
    }else{
      this.productForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.clearValidators();
      this.productForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.updateValueAndValidity({ emitEvent: false });
      this.productForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.setValue(null, { emitEvent: false })
      this.productForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.disable();
    }
  }


  public validate(c: AbstractControl): ValidationErrors | null {
    return this.productForm.valid
      ? null
      : { invalidForm: { valid: false, message: 'Accounting fields are invalid' } };
  }

  public registerOnChange(fn: any): void {
    this.productForm.valueChanges.subscribe(fn);
  }

  public registerOnTouched(fn: any): void {
    this.productForm.valueChanges.subscribe(fn);
  }

  public writeValue(clientProduct: ClientProductDetailsResponse): void {

    if (!clientProduct) return;

    let selectedCompany = null;
    if (clientProduct.billingCompany) {
      selectedCompany = clientProduct.billingCompany;
      this.selectedBillingCompany = clientProduct.billingCompany;
      this.billingCompanyAutoComplete.resetPagination();
      this.billingCompanyAutoComplete.pagination.perPage = 25;
      this.billingCompanyAutoComplete.searchStr = '';
      this.billingCompanyAutoComplete.loadData(null, null);
      this.billingContactsProvider.resetPagination();
      this.billingContactsProvider.pagination.perPage = 25;
      this.billingContactsProvider.loadData(null, ()=>{
        this.getBillingContactText();
      });
    }

    this.productForm.patchValue({
      productName: clientProduct.productName ?? '',
      productCode: clientProduct.productCode ?? null,
      billingCompany: selectedCompany,
      billingContact: clientProduct.billingContact ?? null,
      billing: {
        feeBasis: clientProduct.billing?.feeBasis ?? null,
        media: clientProduct.billing?.media ?? null,
        commissionBasis: clientProduct.billing?.commissionBasis ?? null
      },
      oohRevenue: {
        feeBasis: clientProduct.oohRevenue?.feeBasis ?? null,
        media: clientProduct.oohRevenue?.media ?? null,
        commissionBasis: clientProduct.oohRevenue?.commissionBasis ?? null
      },
      oiProduct: clientProduct?.oiProduct ?? false,
    });


    if (this.dialogData) {
      this.productForm.controls.productName.markAsTouched();
      this.cdRef.markForCheck();
    }
  }

  private setUpBillingCompany() {

    const billingCompanySearchCtrl = this.productForm?.controls?.billingCompany?.valueChanges;
    if (billingCompanySearchCtrl) {
      this.billingCompanyAutoComplete.loadDependency(this.cdRef, this.unsubscribe$, billingCompanySearchCtrl);

      this.billingCompanyAutoComplete.pagination.perPage = 25;
      this.billingCompanyAutoComplete.apiEndpointMethod = () => {
        return this.recordService
          .getOrganizations(
            {
              search: this.billingCompanyAutoComplete.searchStr,
              filter: {
                organizationTypes: [
                  'Client', 'Agency'
                ]
              }
            }, this.billingCompanyAutoComplete.pagination,  {active: 'name', direction: 'asc'})
          .pipe(
            filter((res) => !!res.results)
          );
      };

      this.billingCompanyAutoComplete.loadData(null, null);
      this.billingCompanyAutoComplete.listenForAutoCompleteSearch(this.productForm, 'billingCompany', null, null);

      // resetting selected and contact when clearing input
      billingCompanySearchCtrl.pipe(
        takeUntil(this.unsubscribe$),
        filter(value => {
          return !value?._id;
        })
      ).subscribe((_) => {
        const billingContactCtrl = this.productForm?.controls?.billingContact;
          billingContactCtrl?.patchValue('');
        this.selectedBillingCompany = null;
        this.billingContactTooltipText = '';
        this.billingContactsProvider.data = [];
        this.billingContactsProvider.resetPagination();
        this.cdRef.markForCheck();
      });
    }
  }


  private setUpBillingContact() {

    const billingContactCtrl = this.productForm?.controls?.billingContact?.valueChanges;
    if (billingContactCtrl) {
      this.billingContactsProvider.loadDependency(this.cdRef, this.unsubscribe$, billingContactCtrl);

      this.billingContactsProvider.pagination.perPage = 25;
      const companyId = this.productForm?.controls?.billingContact?.value;

      this.billingContactsProvider.apiEndpointMethod = () => {
        const companyId = this.selectedBillingCompany?._id;
        if (!companyId) return EMPTY;

        const filtersInfo = companyId ? { filter: { companyIds: [companyId] } } : {};
        return this.recordService.getContacts(filtersInfo, this.billingContactsProvider.pagination, {active: 'firstName', direction: 'asc'});
      };

      if (companyId) this.billingContactsProvider.loadData(null, null);
    }
  }


  public companyDisplayWithFn(company) {
    return company?.name ?? '';
  }

  public companyTrackByFn(idx: number, company) {
    return company?._id ?? idx;
  }

  public onCompanySelection(event) {
    this.selectedBillingCompany = event.option.value;
    this.clearSelectedBillingContact();

    if (this.selectedBillingCompany) {
      this.billingContactsProvider.pagination.perPage = 25;
      this.billingContactsProvider.loadData(null, null);
    }

    this.cdRef.markForCheck();
  }

  public updateCompanyContainer() {
    this.panelCompanyContainer = '.billing-company-list-autocomplete';
  }

  public createContact() {
    if (!this.selectedBillingCompany) {
      this.recordService.showsAlertMessage('Please select Billing Company first');
      return;
    }

   // this.clearSelectedBillingContact();

    const dialogData = {
      isNewConatct: true,
      enableDialog: true,
      title: 'ADDING NEW CONTACT',
      organization: this.selectedBillingCompany,
      company: {
        ...this.selectedBillingCompany,
        phone: this.selectedBillingCompany?.['phone'],
        email: this.selectedBillingCompany?.['companyEmail'],
        fax: this.selectedBillingCompany?.['fax']
      }, // todo address not comes as expected from organisation api
      contact: null,
      enableDetails: false
    };

    this.openContactDialog(dialogData);

  }

  public get isBillingCompanySelected(){
    const companyInput = this.productForm?.get('billingCompany');
    return this.selectedBillingCompany && companyInput?.value?._id;
  }

  public selectBillingContact(event, contact: any) {
    if(!event.isUserInput) return;
    this.selectedBillingContact =  contact;
    this.cdRef.markForCheck();
  }

  private buildForm() {
    this.productForm = this.fb.group({
      productName: [
        null,
        [Validators.required, CustomValidators.noWhitespaceValidator(true)]
      ],
      productCode: [
        null,
        [Validators.required, CustomValidators.noWhitespaceValidator(true)]
      ],
      billingCompany: [null, null, forbiddenNamesValidator],
      billingContact: [null],
      billing: this.fb.group({
        feeBasis: [null],
        media: [null, [Validators.min(1), Validators.max(100)]],
        commissionBasis: [null]
      }),
      oohRevenue: this.fb.group({
        feeBasis: [null],
        media: [null, [Validators.min(1), Validators.max(100)]],
        commissionBasis: [null]
      }),
      oiProduct: [null],
    });
  }

  private openContactDialog(dialogData) {
    let panelClassName = ['add-conatct-container-dialog'];
    if (dialogData?.isNewConatct) {
      panelClassName = ['add-conatct-container-dialog', 'new-contact-bottomsheet'];
    }

    this.dialog
      .open(AddContactComponent, {
        height: '570px',
        data: dialogData,
        width: '700px',
        closeOnNavigation: true,
        panelClass: panelClassName,
        autoFocus: false,
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res) return;
        this.billingContactsProvider.loadData(null, () => {
          this.productForm.patchValue({
            billingContact: res?.data?.id
          });
          this.getBillingContactText();
          this.cdRef.detectChanges();
        });
      });
  }
  private clearSelectedBillingContact(){
    this.productForm.controls.billingContact.patchValue(null);
    this.selectedBillingContact = null;
    this.billingContactTooltipText = '';
  }

  ngAfterViewInit() {
    this.getBillingContactText();
  }

  public getBillingContactText() {
    this.billingContactTooltipText = '';
    setTimeout(() => {
      this.billingContactTooltipText = (this.billingContactRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
      this.cdRef.markForCheck();
    }, 200);
  }


  public listenForContainerScroll() {
    this.containerScrolling$.pipe(takeUntil(this.unsubscribe$)).subscribe((res) => {
      this.companyAutoCompleteTrigger.closePanel();
    });
  }

  public tabLinkHandler(type: string, id: string) {

    switch (type) {
      case 'Vendor': {
        const url = `${location.origin}/records-management-v2/vendors/${id}`;
        window.open(url, '_blank');
        break;
      }
      case 'Client': {
        const url = `${location.origin}/records-management-v2/clients/${id}`;
        window.open(url, '_blank');
        break;
      }
      case 'Agency': {
        const url = `${location.origin}/records-management-v2/agencies/${id}`;
        window.open(url, '_blank');
        break;
      }
      case 'Contact': {
        const url = `${location.origin}/records-management-v2/contacts/${id}`;
        window.open(url, '_blank');
        break;
      }
    }

  }
}
