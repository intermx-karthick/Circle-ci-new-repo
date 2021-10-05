import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  forwardRef,
  ChangeDetectorRef,
  Input,
  ViewChild, OnDestroy, ElementRef, AfterViewInit
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR, NgForm, ValidationErrors,
  Validators
} from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BehaviorSubject, EMPTY, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';

import { RecordService } from '../../record.service';
import { CustomValidators } from '../../../validators/custom-validators.validator';
import { ClientsAccountDetails } from '@interTypes/records-management/clients/clients-accounting.response';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';
import { ClientDropDownValue } from '@interTypes/records-management';
import { UseAutoCompleteInfiniteScroll } from '../../../classes/use-auto-complete-infinite-scroll';
import { ClientsAddContactComponent } from '../clients-add-contact/clients-add-contact.component';
import { ActivatedRoute } from '@angular/router';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { forbiddenNamesValidator } from '@shared/common-function';
import { AuthenticationService } from '@shared/services/authentication.service';

@Component({
  selector: 'app-client-accounting-form',
  templateUrl: './client-accounting-form.component.html',
  styleUrls: ['./client-accounting-form.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ClientAccountingFormComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ClientAccountingFormComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAccountingFormComponent extends AbstractLazyLoadComponent implements OnInit, ControlValueAccessor,AfterViewInit, OnDestroy {

  @Input() submitForm$: Subject<void> = new Subject<void>();
  @Input() clientDetails$: BehaviorSubject<ClientDetailsResponse>;

  @ViewChild('clientAccountingFormRef') private clientAccountingFormRef: NgForm;
  @ViewChild('uploadCostRef') private uploadCostRef: MatSlideToggle;

  public clientAccountingForm: FormGroup;
  public accountingDepts: ClientDropDownValue[] = [];
  public fileSystems: ClientDropDownValue[] = [];
  public pubIdTypes: ClientDropDownValue[] = [];
  public invoiceFormats: ClientDropDownValue[] = [];
  public invoiceDeliveries: ClientDropDownValue[] = [];
  public uploadCostTypes: ClientDropDownValue[] = [];

  public selectedBillingCompany;
  public selectedVendorCompany;
  public isInitialLoadCompleted: boolean = false;
  public billingCompanyAutoComplete = new UseAutoCompleteInfiniteScroll();
  public billingContactsProvider = new UseAutoCompleteInfiniteScroll();
  public vendorCompanyAutoComplete = new UseAutoCompleteInfiniteScroll();
  public vendorContactsProvider = new UseAutoCompleteInfiniteScroll();
  public panelCompanyContainer: string;
  public unsubscribeInitiator$: Subject<void> = new Subject();
  public clientAccountNoteId$ = new BehaviorSubject(null);
  public selectedBillingContact: any;

  private unsubscribe$: Subject<void> = new Subject();
  @ViewChild('invoiceFormatRef', {read: ElementRef}) invoiceFormatRef: ElementRef;
  public invoiceFormatTooltipText = '';
  @ViewChild('billingContactRef', {read: ElementRef}) billingContactRef: ElementRef;
  public billingContactTooltipText = '';
  @ViewChild('invoiceDeliveryRef', {read: ElementRef}) invoiceDeliveryRef: ElementRef;
  @ViewChild('vendorContactRef', {read: ElementRef}) vendorContactRef: ElementRef;
  public invoiceDeliveryTooltipText = '';

  @Input() public containerScrolling$: Subject<string>;
  @ViewChild('companyInputRef', {read: MatAutocompleteTrigger}) companyInputRef: ElementRef;
  @ViewChild('vendorInputRef', {read: MatAutocompleteTrigger})  vendorInputRef: ElementRef;
  public companyAutoCompleteTrigger: MatAutocompleteTrigger;
  public vendorAutoCompleteTrigger: MatAutocompleteTrigger;
  public clientAccountNoteId;
  @Input() private organizationId$: Subject<any> = new Subject<any>();
  organizationId: any;
  vendorContactTooltipText: any;
  panelVendorCompanyContainer: string;
  selectedVendorContact: any;
  @Input() public accountTabSelectId = null;
  public contactPanelClass = ['imx-select','add-option-autocomplete'];
  readonly permissionKey = Object.freeze({
    CLIENTS: 'client_accounting',
  });
  public disableEdit = false;
  constructor(
    private fb: FormBuilder,
    public recordService: RecordService,
    public bottomSheet: MatBottomSheet,
    public cdRef: ChangeDetectorRef,
    private activeRoute: ActivatedRoute,
    private auth: AuthenticationService
  ) {
    super();
  }

  public setup() {
    this.buildForm();
    // these should call after buildForm. Don't change the order
    this.setUpBillingCompany();
    this.setUpBillingContact();

    this.setUpVendorCompany();
    this.setUpVendorContact();
  }

  public ngOnInit(): void {

    this.listenerForInitialLoad();
    this.listenForClientDetailsChange();

    this.setup();

    this.listenForContainerScroll();

    this.submitForm$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.clientAccountingFormRef.onSubmit(this.clientAccountingForm.value);
      this.cdRef.markForCheck();
    });
    this.activeRoute.params.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((params) => {
      if (params?.['id']) {
        this.clientAccountNoteId = params['id'];
        this.clientAccountNoteId$.next(params['id']);
      }
    });
    this.organizationId$
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe((organizationId) => {
      this.organizationId = organizationId;
      this.billingCompanyAutoComplete.loadData(null, null);
    });
    this.checkForEditPermission();
  }

  private checkForEditPermission() {
    const permissions = this.auth.getUserPermission(this.permissionKey.CLIENTS);
    if (permissions && !permissions.edit) {
      this.clientAccountingForm.disable();
      this.disableEdit = true;
    }
  }
  
  public init(): void {
    this.loadAccountingDepts();
    this.loadFileSystemIds();
    this.loadPubIdTypes();
    this.loadInvoiceDeliveries();
    this.loadInvoiceFormat();
    this.loadCommissionBasis();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private buildForm() {
    this.clientAccountingForm = this.fb.group({
      clientName: [
        null,
        [Validators.required, CustomValidators.noWhitespaceValidator(true)]
      ],
      accountingDept: [null],
      fileSystemId: [null],
      pubIdType: [null],
      invoiceFormat: [null],
      invoiceDelivery: [null],
      uploadCostType: [null],
      clientCodeRequired: [null],
      clientCode: [null],
      billingCompany: [null, null, forbiddenNamesValidator],
      billingContact: [null],
      billingNotes: [null],
      vendorPayableCompany: [null, null, forbiddenNamesValidator],
      vendorPayableContact: [null],
    });
  }

  public validate(c: AbstractControl): ValidationErrors | null {
    return this.clientAccountingForm.valid
      ? null
      : { invalidForm: { valid: false, message: 'Accounting fields are invalid' } };
  }

  public registerOnChange(fn: any): void {
    this.clientAccountingForm.valueChanges.subscribe(fn);
  }

  public registerOnTouched(fn: any): void {
    this.clientAccountingForm.valueChanges.subscribe(fn);
  }

  public writeValue(clientAccount: ClientsAccountDetails): void {
    if (!clientAccount) return;
    let selectedCompany = null;
    if (clientAccount.billingCompany) {
      selectedCompany = clientAccount.billingCompany;
      this.selectedBillingCompany = clientAccount.billingCompany;
      this.billingContactsProvider.resetPagination();
      this.billingContactsProvider.pagination.perPage = 25;
      this.billingContactsProvider.loadData(null, null);
    }
    let selectedVendorCompany = null;
    if (clientAccount?.vendorPayableCompany) {
      selectedVendorCompany = clientAccount.vendorPayableCompany;
      this.selectedVendorCompany = clientAccount.vendorPayableCompany;
      this.vendorContactsProvider.resetPagination();
      this.vendorContactsProvider.pagination.perPage = 25;
      this.vendorContactsProvider.loadData(null, null);
    }

    this.clientAccountingForm.patchValue({
      clientName: clientAccount.clientName ?? null,
      accountingDept: clientAccount.accountingDept?._id ?? null,
      fileSystemId: clientAccount.fileSystemId?._id ?? null,
      pubIdType: clientAccount.pubIdType?._id ?? null,
      invoiceFormat: clientAccount.invoiceFormat?._id ?? null,
      invoiceDelivery: clientAccount.invoiceDelivery?._id ?? null,
      uploadCostType: clientAccount.uploadCostType?._id ?? null,
      clientCodeRequired: clientAccount.clientCodeRequired ?? null,
      clientCode: clientAccount.clientCode ?? null,
      billingCompany: selectedCompany,
      billingContact: clientAccount.billingContact?._id ?? null,
      billingNotes: clientAccount.billingNotes?.['notes'] ?? null,
      vendorPayableCompany: selectedVendorCompany,
      vendorPayableContact: clientAccount.vendorPayableContact?._id ?? null

    });
    if (clientAccount?.invoiceDelivery) {
      this.invoiceDeliveryTooltipText = clientAccount.invoiceDelivery.name;
    }
    if (clientAccount?.invoiceFormat) {
      this.invoiceFormatTooltipText = clientAccount.invoiceFormat.name;
    }
    if (clientAccount?.billingContact) {
      this.billingContactTooltipText = `${clientAccount.billingContact['firstName']} ${clientAccount.billingContact['lastName']}`;
    }
    this.uploadCostRef.checked = this.isGross;
    this.cdRef.markForCheck();
  }

  public createContact(type = 'billing') {
    let selectedCompany;
    if (type === 'billing') {
      if (!this.selectedBillingCompany ) {
        this.recordService.showsAlertMessage('Please select Billing Company first');
        return;
      }
      selectedCompany = this.selectedBillingCompany;
    } else if (type === 'vendor') {
      if (!this.selectedVendorCompany ) {
        this.recordService.showsAlertMessage('Please select Vendor Payable Company first');
        return;
      }
      selectedCompany = this.selectedVendorCompany;
    }
    //this.clearSelectedBillingContact();

    this.bottomSheet
      .open(ClientsAddContactComponent, {
        data: {
          company: selectedCompany
        },
        disableClose: true,
        panelClass:'add-contact-bottom-sheetDialog'
      })
      .afterDismissed()
      .subscribe((res) => {
        if (!res) return;
        if (type === 'billing') {
          this.billingContactsProvider.loadData(null, () => {
            this.clientAccountingForm.patchValue({
              billingContact: res?.data?.id
            });
            this.getBillingContactText();
          });
        } else if (type === 'vendor') {
          this.vendorContactsProvider.loadData(null, () => {
            this.clientAccountingForm.patchValue({
              vendorPayableContact: res?.data?.id
            });
            this.getVendorContactText();
          });
        }
      });
  }

  private loadAccountingDepts() {
    this.recordService.getAccountingDepartment()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.destroyInitiator();
        this.accountingDepts = res ?? [];
        this.cdRef.markForCheck();
      });
  }

  private loadFileSystemIds() {
    this.recordService.getFileSystemIds()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.fileSystems = res ?? [];
        this.cdRef.markForCheck();
      });
  }


  private loadPubIdTypes() {
    this.recordService.getPubIdTypes()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.pubIdTypes = res ?? [];
        this.cdRef.markForCheck();
      });
  }

  private loadInvoiceDeliveries() {
    this.recordService.getInvoiceDeliveries()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.invoiceDeliveries = res ?? [];
        this.cdRef.markForCheck();
      });
  }


  private loadInvoiceFormat() {
    this.recordService.getInvoiceFormat()
      .pipe(filter(res => !!res), map(res => res.results))
      .subscribe((res) => {
        this.invoiceFormats = res ?? [];
        this.cdRef.markForCheck();
      });
  }

  private setUpBillingCompany() {

    const billingCompanySearchCtrl = this.clientAccountingForm?.controls?.billingCompany?.valueChanges;
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
            },
            this.billingCompanyAutoComplete.pagination,
            { active: 'name', direction: 'asc' })
          .pipe(
            filter((res) => !!res.results)
          );
      };

      this.billingCompanyAutoComplete.loadData(null, null);
      this.billingCompanyAutoComplete.listenForAutoCompleteSearch(this.clientAccountingForm, 'billingCompany', null, null);

      // resetting selected and contact when clearing input
      billingCompanySearchCtrl.pipe(
        takeUntil(this.unsubscribe$),
        filter(value => {
          return !value?._id;
        })
      ).subscribe((_) => {
        const billingContactCtrl = this.clientAccountingForm?.controls?.billingContact;
        billingContactCtrl.patchValue('');
        this.billingContactTooltipText = '';
        this.selectedBillingCompany = null;
        this.billingContactsProvider.data = [];
        this.billingContactsProvider.resetPagination();
        this.cdRef.markForCheck();
      });
    }
  }

  public loadMoreBillingCompanies() {
    this.billingCompanyAutoComplete.loadMoreData(null, (res) => {
      this.billingCompanyAutoComplete.data = res.results;
      this.cdRef.markForCheck();
    });
  }

  private setUpBillingContact() {
    const billingContactCtrl = this.clientAccountingForm?.controls?.billingContact?.valueChanges;
    if (billingContactCtrl) {
      this.billingContactsProvider.loadDependency(this.cdRef, this.unsubscribe$, billingContactCtrl);

      this.billingContactsProvider.pagination.perPage = 25;
      const companyId = this.clientAccountingForm?.controls?.billingContact?.value;

      this.billingContactsProvider.apiEndpointMethod = () => {
        const companyId = this.selectedBillingCompany?._id;
        if (!companyId) return EMPTY;

        const filtersInfo = companyId ? { filter: { companyIds: [companyId] } } : {};
        return this.recordService.getContacts(filtersInfo, this.billingContactsProvider.pagination, {
          active: 'firstName',
          direction: 'asc'
        });
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

  public onVendorCompanySelection(event) {
    this.selectedVendorCompany = event.option.value;
    this.clearSelectedVendorContact();
    if (this.selectedVendorCompany) {
      this.vendorContactsProvider.pagination.perPage = 25;
      this.vendorContactsProvider.loadData(null, null);
    }

    this.cdRef.markForCheck();
  }

  public updateCompanyContainer() {
    this.panelCompanyContainer = '.company-list-autocomplete';
  }
  public updateVendorCompanyContainer() {
    this.panelVendorCompanyContainer = '.vendor-company-list-autocomplete';
  }
  public loadCommissionBasis() {
    this.recordService
      .getCommissionBasis()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.uploadCostTypes = res;
      });
  }

  public get isNet() {
    const id = this.clientAccountingForm.controls['uploadCostType']?.value;
    const value = this.uploadCostTypes?.find?.(type => type._id === id);
    return /Net/i.test(value?.name);
  }

  public get isGross() {
    const id = this.clientAccountingForm.controls['uploadCostType']?.value;
    const value = this.uploadCostTypes?.find?.(type => type._id === id);
    return /Gross/i.test(value?.name);
  }

  public setUploadCostTypeValue(e: MatSlideToggleChange) {
    const control = this.clientAccountingForm.controls['uploadCostType'];
    const NET = this.uploadCostTypes?.find?.(type => /Net/i.test(type.name));
    const GROSS = this.uploadCostTypes?.find?.(type => /Gross/i.test(type.name));
    if (e?.source?.checked) {
      control.setValue(GROSS._id);
    } else {
      control.setValue(NET._id);
    }
  }

  public get isBillingCompanySelected() {
    const companyInput = this.clientAccountingForm?.get('billingCompany');
    return this.selectedBillingCompany && companyInput?.value?._id;
  }
  public get isVendorCompanySelected() {
    const companyInput = this.clientAccountingForm?.get('vendorPayableCompany');
    return this.selectedVendorCompany && companyInput?.value?._id;
  }
  public selectBillingContact(event, contact: any) {
    if (!event.isUserInput) return;
    this.selectedBillingContact = contact;
    this.cdRef.markForCheck();
  }
  public selectVendorContact(event, contact: any) {
    if (!event.isUserInput) return;
    this.selectedVendorContact = contact;
    this.cdRef.markForCheck();
  }

  private listenForClientDetailsChange() {
    this.clientDetails$?.pipe(takeUntil(this.unsubscribe$)).subscribe?.((client) => {
      if (this.clientAccountingForm) {
        this.clientAccountingForm.controls.clientName.patchValue(client?.clientName);
      }
    })
  }

  private clearSelectedBillingContact() {
    this.clientAccountingForm.controls.billingContact.patchValue(null);
    this.selectedBillingContact = null;
    this.billingContactTooltipText = '';
    this.getBillingContactText();
  }
  private clearSelectedVendorContact() {
    this.clientAccountingForm.controls.vendorPayableContact.patchValue(null);
    this.selectedVendorContact = null;
    this.vendorContactTooltipText = '';
    this.getVendorContactText();
  }
  ngAfterViewInit() {
    this.getBillingContactText();
    this.getInvoiceFormatText();
    this.getInvoiceDeliveryText();
    this.getVendorContactText();
  }

  public getBillingContactText() {
    this.billingContactTooltipText = '';
    setTimeout(() => {
      this.billingContactTooltipText = (this.billingContactRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
      this.cdRef.markForCheck();
    }, 200);
  }

  public getInvoiceDeliveryText() {
    this.invoiceDeliveryTooltipText = '';
    setTimeout(() => {
      this.invoiceDeliveryTooltipText = (this.invoiceDeliveryRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
      this.cdRef.markForCheck();
    }, 200);
  }

  public getInvoiceFormatText() {
    this.invoiceFormatTooltipText = '';
    setTimeout(() => {
      this.invoiceFormatTooltipText = (this.invoiceFormatRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
      this.cdRef.markForCheck();
    }, 200);
  }
  public getVendorContactText() {
    this.vendorContactTooltipText = '';
    setTimeout(() => {
      this.vendorContactTooltipText = (this.vendorContactRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
      this.cdRef.markForCheck();
    }, 200);
  }

  public listenForContainerScroll() {
    this.containerScrolling$.pipe(takeUntil(this.unsubscribe$), filter(label=> label === 'accounting_tab')).subscribe((res) => {
       if(this.companyAutoCompleteTrigger) {
          this.companyAutoCompleteTrigger.closePanel();
       }
       if(this.vendorAutoCompleteTrigger) {
        this.vendorAutoCompleteTrigger.closePanel();
       }
    });
  }

  public openBillingCompanyAutoComplete(){
    if(this.companyAutoCompleteTrigger) {
      this.companyAutoCompleteTrigger.openPanel();
    }
  }
  public openVendorCompanyAutoComplete(){
    if(this.vendorAutoCompleteTrigger) {
      this.vendorAutoCompleteTrigger.openPanel();
     }
  }


  private setUpVendorCompany() {

    const vendorCompanySearchCtrl = this.clientAccountingForm?.controls?.vendorPayableCompany?.valueChanges;
    if (vendorCompanySearchCtrl) {
      this.vendorCompanyAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        vendorCompanySearchCtrl
      );

      this.vendorCompanyAutoComplete.pagination.perPage = 25;

      this.vendorCompanyAutoComplete.apiEndpointMethod = () => {
        return this.recordService
          .getOrganizations(
          {
            search: this.vendorCompanyAutoComplete.searchStr,
            filter: {
              organizationTypes: [
                'Client', 'Agency'
              ]
            }
          },
          this.vendorCompanyAutoComplete.pagination,
          { active: 'name', direction: 'asc' })
          .pipe(
            filter((res) => !!res.results)
          );
      };

      this.vendorCompanyAutoComplete.loadData(null, null);
      this.vendorCompanyAutoComplete.listenForAutoCompleteSearch(this.clientAccountingForm, 'vendorPayableCompany', null, null);

      // resetting selected and contact when clearing input
      vendorCompanySearchCtrl.pipe(
        takeUntil(this.unsubscribe$),
        filter(value => {
          return !value?._id;
        })
      ).subscribe((_) => {
        const vendorContactCtrl = this.clientAccountingForm?.controls?.vendorPayableContact;
        vendorContactCtrl.patchValue('');
        this.vendorContactTooltipText = '';
        this.selectedVendorCompany = null;
        this.vendorContactsProvider.data = [];
        this.vendorContactsProvider.resetPagination();
        this.cdRef.markForCheck();
      });
    }
  }

  public loadMoreVendorCompanies() {
    this.vendorCompanyAutoComplete.loadMoreData(null, (res) => {
      this.vendorCompanyAutoComplete.data = res.results;
      this.cdRef.markForCheck();
    });
  }
  private setUpVendorContact() {
    const vendorContactCtrl = this.clientAccountingForm?.controls?.vendorPayableContact?.valueChanges;
    if (vendorContactCtrl) {
      this.vendorContactsProvider.loadDependency(this.cdRef, this.unsubscribe$, vendorContactCtrl);

      this.vendorContactsProvider.pagination.perPage = 25;
      const companyId = this.clientAccountingForm?.controls?.vendorPayableContact?.value;

      this.vendorContactsProvider.apiEndpointMethod = () => {
        const companyId = this.selectedVendorCompany?._id;
        if (!companyId) return EMPTY;

        const filtersInfo = companyId ? { filter: { companyIds: [companyId] } } : {};
        return this.recordService.getContacts(filtersInfo, this.vendorContactsProvider.pagination, {
          active: 'firstName',
          direction: 'asc'
        });
      };

      if (companyId) this.vendorContactsProvider.loadData(null, null);
    }
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
