import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  forwardRef,
  ChangeDetectorRef,
  Input,
  ViewChild,
  OnDestroy,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NgForm,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { filter, mergeMap, takeUntil, map } from 'rxjs/operators';
import { Subject, BehaviorSubject, Subscription } from 'rxjs';

import { VendorService } from 'app/records-management-v2/vendors/vendor.service';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { AbstractClientsDropDownComponent } from '../abstract-clients-drop-down.component';
import { RecordService } from '../../record.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { UseAutoCompleteInfiniteScroll } from 'app/classes/use-auto-complete-infinite-scroll';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { MyTel } from '../../telephone/telephone-input/telephone-input.component';
import { ActivatedRoute } from '@angular/router';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { forbiddenNamesValidator } from '@shared/common-function';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ClientsAddContactComponent } from '../clients-add-contact/clients-add-contact.component';
import { CkEditorConfig } from '@constants/ckeditor-config';
import { AuthenticationService } from '@shared/services/authentication.service';
import { LocalStorageKeys, UserRoleTypes } from '@interTypes/enums';
import { CONTACT_LIST_TYPES } from "@constants/contact-list-types";

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ClientFormComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ClientFormComponent),
      multi: true
    }
  ]
})
export class ClientFormComponent extends AbstractClientsDropDownComponent
  implements OnInit, ControlValueAccessor, OnDestroy {
  public clientForm: FormGroup;
  public parentClientsSearchStr: string = '';
  public panelContainer: string = '';
  @Input() submitForm$: Subject<void> = new Subject<void>();
  private unsubscribe$: Subject<void> = new Subject();
  public managedByAutoComplete = new UseAutoCompleteInfiniteScroll();
  public operationContactsAutoComplete = new UseAutoCompleteInfiniteScroll();
  public primaryAgenciesAutoComplete = new UseAutoCompleteInfiniteScroll();
  public creativeAgenciesAutoComplete = new UseAutoCompleteInfiniteScroll();
  @ViewChild('clientFormRef') clientFormRef: NgForm;
  private isEnableSameAsBillingFlag = false;
  public clientNoteId$ = new BehaviorSubject(null);
  public isClientDetailView = false;
  public initialSameASFlag = false;
  @ViewChild('clientTypeRef', {read: ElementRef}) clientTypeRef: ElementRef;
  public clientTypeTooltipText = '';
  @ViewChild('divisionRef', {read: ElementRef}) divisionRef: ElementRef;
  public divisionTooltipText = '';
  @ViewChild('businessCategoryRef', {read: ElementRef}) businessCategoryRef: ElementRef;
  public businessCategoryTooltipText = '';
  @ViewChild('diversityRef', {read: ElementRef}) diversityRef: ElementRef;
  public diversityTooltipText = '';
  @ViewChild('creativeAgencyContactRef', {read: ElementRef}) creativeAgencyContactRef: ElementRef;
  public creativeAgencyContactTooltipText = '';
  @ViewChild('primaryAgencyContactRef', {read: ElementRef}) primaryAgencyContactRef: ElementRef;
  public primaryAgencyContactTooltipText = '';
  @ViewChild('cancellationPrivilegeRef', {read: ElementRef}) cancellationPrivilegeRef: ElementRef;
  public cancellationPrivilegeTooltipText = '';
  @ViewChild('estTimingRef', {read: ElementRef}) estTimingRef: ElementRef;
  public estTimingTooltipText = '';
  public managedByPanelContainer: string = '';
  public operationContactPanelContainer: string = '';
  public primaryAgencyPanelContainer: string = '';
  public creativeAgencyPanelContainer: string = '';
  readonly permissionKey = Object.freeze({
    CLIENTS: 'client_general',
  });
  public disableEdit = false;
  public subscription: Subscription;


  @Input() public containerScrolling$: Subject<string>;
  @ViewChild('parentClientsInputRef', {read: MatAutocompleteTrigger})
  public parentClientsAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('primaryAgencyInputRef', {read: MatAutocompleteTrigger})
  public primaryAgencyAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('creativeAgencyInputRef', {read: MatAutocompleteTrigger})
  public creativeAgencyAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('managerInputRef', {read: MatAutocompleteTrigger})
  public managerAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('operationContactsInputRef', {read: MatAutocompleteTrigger})
  public operationContactsAutoCompleteTrigger: MatAutocompleteTrigger;
  @Input() public scrollingContainer:string;
  public enableDuplicate = false;
  @Input() enableDuplicate$: Subject<void> = new Subject<void>();
  public contactPanelClass = ['imx-select','add-option-autocomplete'];
  public showEditor = false;
  public editorConfig = CkEditorConfig;
  public isMangerPermission = false;

  constructor(
    private fb: FormBuilder,
    public vendorService: VendorService,
    public recordService: RecordService,
    public notificationService: NotificationsService,
    public cdRef: ChangeDetectorRef,
    private activeRoute: ActivatedRoute,
    public bottomSheet: MatBottomSheet,
    private auth: AuthenticationService
  ) {
    super(recordService, notificationService, cdRef);
  }

  private static getNamesFromValues(data, hashSet){
    const values = [];

    for (const value of data) {
      if (hashSet.size === 0) { break; }

      if (hashSet.has(value._id)) {
        values.push(value.name);
        hashSet.delete(value._id);
      }
    }

    return values;
  }


  ngOnInit(): void {
    this.buildForm();
    this.loadDiversityOwnerShips();
    this.setFilterParentClientSubscription(this.clientForm, 'parentClient');
    // Autocomplete Not needed
    this.loadCancellationPrivileges();
    this.loadCodeSchemes();
    this.loadCommissionBasis();
    this.loadContractTermTypes();
    this.loadFeeBasis();
    this.loadEstTimings();
    this.loadClientTypes();
    this.loadDivisions();
    this.loadBusinessCategories();
    this.loadOffices();
    // Autocomplete needed
    this.loadClients();
    this.listenForContainerScroll();
    this.checkManagerPermission();
    this.submitForm$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.clientFormRef.onSubmit(undefined);
      this.cdRef.markForCheck();
    });

    this.clientForm?.controls?.billing?.valueChanges.subscribe(value=>{
      if(this.clientForm?.controls?.oohRevenue?.['controls']?.isSameAsBilling.value && this.clientForm?.controls?.billing.valid){
        this.onSameAsBilling(true);
      }
    });

    //init operation contacts
    this.initOperationContacts();

    // Billing feeBasis value change
    this.clientForm?.controls?.billing?.['controls']?.feeBasis.valueChanges.subscribe(value=>{
        this.checkBillingFeeBasis(value);
    });

    // Revenue feeBasis value change
    this.clientForm?.controls?.oohRevenue?.['controls']?.feeBasis.valueChanges.subscribe((value)=>{
      this.checkRevenueFeeBasis(value);
      this.checkSameAsBilling()
      });

    this.clientForm?.controls?.oohRevenue?.['controls']?.media.valueChanges.subscribe(()=>this.checkSameAsBilling());
    this.clientForm?.controls?.oohRevenue?.['controls']?.commissionBasis.valueChanges.subscribe(()=>this.checkSameAsBilling());
    this.clientForm?.controls?.oohRevenue?.['controls']?.isSameAsBilling.valueChanges
    .subscribe((value)=>{
      if(this.initialSameASFlag || value){
          this.onSameAsBilling(value);
      }
      this.initialSameASFlag = true;
    });

    // Managed By Code
    const managedBySearchCtrl = this.clientForm?.controls?.managedBy
      ?.valueChanges;
    if (managedBySearchCtrl) {
      this.managedByAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        managedBySearchCtrl
      );
      this.managedByAutoComplete.apiEndpointMethod = () => {
        const isSearchStr = typeof this.clientForm?.controls?.managedBy?.value === 'string';
          const searchObj = {
            filter: {
              companyTypes: [
                "User"
              ]
            },
            ...(isSearchStr
              ? { search: this.clientForm?.controls?.managedBy?.value }
              : {})
          }
          return this.recordService.getContacts(
            searchObj,
            this.managedByAutoComplete.pagination,
            null,
            '',
            'id,firstName,lastName'
          );
      } // todo check pagination

      this.managedByAutoComplete.loadData(null, (res) => {
        const managedList = this.recordService.formatManageByResult(res.results);
        this.managedByAutoComplete.data = managedList;
        const selectedId = this.clientForm.controls.managedBy?.value?.id; // api response 'name' prop contains email id 
        if(selectedId) {
          this.clientForm.patchValue({
            managedBy: managedList.find(item => item?.id === selectedId)
          });
        }
        this.cdRef.markForCheck();
      });

      this.managedByAutoComplete.listenForAutoCompleteSearch(
        this.clientForm,
        'managedBy',
        null,
        (res) => {
          this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
          this.cdRef.markForCheck();
        }
      );
    }

    // primary agencies code
    const primaryAgenciesSearchCtrl = this.clientForm?.controls?.mediaAgency
      ?.valueChanges;
    if (primaryAgenciesSearchCtrl) {
      this.primaryAgenciesAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        primaryAgenciesSearchCtrl
      );
      this.primaryAgenciesAutoComplete.apiEndpointMethod = () =>
        this.recordService.getAgencyTypes().pipe(
          filter((res) => !!res),
          map((res) =>
            res.results.find((type) => type.name === 'Media Agency')
          ),
          filter((type) => !!type),
          mergeMap((type: any) => {
            return this.recordService.getAgencies(
              {
                search: this.primaryAgenciesAutoComplete.searchStr,
                filter: { types: [type._id] }
              },
              this.primaryAgenciesAutoComplete.pagination
            );
          }),
          filter((res) => !!res)
        );
      this.primaryAgenciesAutoComplete.loadData(null, (res) => {
        this.primaryAgenciesAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.primaryAgenciesAutoComplete.listenForAutoCompleteSearch(
        this.clientForm,
        'mediaAgency',
        null,
        (res) => {
          this.primaryAgencyContacts = [];
          this.primaryAgenciesAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );

      // resetting selected and contact when clearing input
      primaryAgenciesSearchCtrl.pipe(
        takeUntil(this.unsubscribe$),
        filter(value => {
          return !value?._id;
        })
      ).subscribe((_) => {
        this.primaryAgencyContactTooltipText = '';
         this.selectedPrimaryAgencyOrganizationId = '';
        this.clientForm.controls['agencyContact'].patchValue('');
        this.selectedPrimaryAgencyId = '';
        this.cdRef.markForCheck();
      });
    }
    // creative agencies code
    const creativeAgenciesSearchCtrl = this.clientForm?.controls?.creativeAgency
      ?.valueChanges;
    if (creativeAgenciesSearchCtrl) {
      this.creativeAgenciesAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        creativeAgenciesSearchCtrl
      );
      this.creativeAgenciesAutoComplete.apiEndpointMethod = () =>
        this.recordService.getAgencyTypes().pipe(
          filter((res) => !!res),
          map((res) =>
            res.results.find((type) => type.name === 'Creative Agency')
          ),
          filter((type) => !!type),
          mergeMap((type: any) => {
            return this.recordService.getAgencies(
              {
                search: this.creativeAgenciesAutoComplete.searchStr,
                filter: { types: [type._id] }
              },
              this.creativeAgenciesAutoComplete.pagination
            );
          }),
          filter((res) => !!res)
        );
      this.creativeAgenciesAutoComplete.loadData(null, (res) => {
        this.creativeAgenciesAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.creativeAgenciesAutoComplete.listenForAutoCompleteSearch(
        this.clientForm,
        'creativeAgency',
        null,
        (res) => {
          this.creativeAgencyContacts = [];
          this.creativeAgenciesAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );

      // resetting selected and contact when clearing input
      creativeAgenciesSearchCtrl.pipe(
        takeUntil(this.unsubscribe$),
        filter(value => {
          return !value?._id;
        })
      ).subscribe((_) => {
        this.creativeAgencyContactTooltipText = '';
        this.selectedCreativeAgencyOrganizationId = '';
        this.selectedCreativeAgencyId = '';
        this.clientForm.controls['creativeAgencyContact'].patchValue('');
        this.cdRef.markForCheck();
      });
    }

    this.activeRoute.params.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((params) => {
      if(params?.['id']){
        this.isClientDetailView = true;
        this.clientNoteId$.next(params['id']);
      }else{
        this.isClientDetailView = false;
      }
    });
    this.enableDuplicate$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      this.enableDuplicate = true;
    });
    this.checkForEditPermission();
  }

  private checkForEditPermission() {
    const permissions = this.auth.getUserPermission(this.permissionKey.CLIENTS);
    if (permissions && !permissions.edit) {
      this.clientForm.disable();
      this.disableEdit = true;
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
      this.clientForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.enable();
      this.clientForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.setValidators([Validators.required]);
      this.clientForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.updateValueAndValidity({ emitEvent: false });
      if(this.clientForm?.controls?.oohRevenue?.['controls']?.isSameAsBilling.value && formGroupName === 'billing'){
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.enable();
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.setValidators([Validators.required]);
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.updateValueAndValidity({ emitEvent: false });
        this.clientForm?.controls?.oohRevenue?.['controls']?.isSameAsBilling.setValue(true);
      }
      if(this.disableEdit) {
        this.clientForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.disable();
      }
    }else{
      this.clientForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.clearValidators();
      this.clientForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.updateValueAndValidity({ emitEvent: false });
      this.clientForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.setValue(null, { emitEvent: false })
      this.clientForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.disable();
       if(this.clientForm?.controls?.oohRevenue?.['controls']?.isSameAsBilling.value && formGroupName === 'billing'){
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.clearValidators({ emitEvent: true });
        this.cdRef.detectChanges();
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.disable({ emitEvent: false });
        this.clientForm?.controls?.oohRevenue?.['controls']?.isSameAsBilling.setValue(true);
      }
    }
    
  }


 /** This function used to check selected feebasis value  */
  private  checkBillingFeeBasis(value){
    const commissonData = this.billingFeeBasis.find(bill=>bill?._id === value);
    //5fb61f5ad057ac4666fad8b2 // Commission id
    if(value === '5fb61f5ad057ac4666fad8b2' || commissonData?.name?.toLowerCase() === 'commission'){
      this.updateCommisionField(true);
    }else{
      this.updateCommisionField(false);
    }
  }

  private checkSameAsBilling() {
    if(this.clientForm?.controls?.oohRevenue?.['controls']?.isSameAsBilling){
          this.clientForm?.controls?.oohRevenue?.['controls']?.isSameAsBilling.setValue(false, {emitEvent:false})

    }
  }

  public registerOnChange(fn: any): void {
    this.clientForm.valueChanges.subscribe(fn);
  }

  public registerOnTouched(fn: any): void {
    this.clientForm.valueChanges.subscribe(fn);
  }

  public writeValue(client: ClientDetailsResponse): void {
    // todo parent client is not available
    // isCurrent should always be true while creating/duplicating a client
    if (!client) return;
    this.initialSameASFlag  = false;
    if (client?.mediaAgency) {
      this.selectedPrimaryAgencyOrganizationId = client.mediaAgency['organizationId'];
      this.selectedPrimaryAgencyId = client.mediaAgency?.['_id'];
      this.loadPrimaryAgencyContacts();
    }

    if (client?.creativeAgency) {
      this.selectedCreativeAgencyOrganizationId = client.creativeAgency['organizationId'];
      this.selectedCreativeAgencyId = client.creativeAgency?._id;
      this.loadCreativeAgencyContacts();
    }

    if (client?.clientType) {
      this.clientTypeTooltipText = client.clientType.name;
    }
    if (client?.division) {
      this.divisionTooltipText = client.division.name;
    }
    if (client?.diversityOwnership?.length) {
      this.diversityTooltipText = client.diversityOwnership.map((obj) => obj.name).join(', ');
    }
    if (client?.businessCategory?.length) {
      this.businessCategoryTooltipText = client.businessCategory.map((obj) => obj.name).join(', ');
    }
    if (client?.creativeAgencyContact) {
      this.creativeAgencyContactTooltipText = `${client.creativeAgencyContact.firstName} ${client.creativeAgencyContact.lastName}`;
    }
    if (client?.agencyContact) {
      this.primaryAgencyContactTooltipText =  `${client.agencyContact.firstName} ${client.agencyContact.lastName}`;
    }
    if (client?.cancellationPrivilege) {
      this.cancellationPrivilegeTooltipText =  client.cancellationPrivilege.name;
    }
    if (client?.estTiming) {
      this.estTimingTooltipText =  client.estTiming.name;
    }
    this.clientForm.patchValue({
      clientName: client.clientName,
      parentClient: client['parentClient'] ?? null,
      isParent: client.isParent ?? false,
      clientType: client.clientType?._id ?? null,
      division: client.division?._id ?? null,
      office: client.office?._id ?? null,
      isOpsApproved: client.isOpsApproved ?? false,
      isCurrent: client.isCurrent ?? null,
      mediaAgency: client.mediaAgency,
      agencyContact: client['agencyContact']?.['_id'] ?? null,
      creativeAgency: client.creativeAgency ?? null,
      creativeAgencyContact: client['creativeAgencyContact']?.['_id'] ?? null,
      phone: this.splitValuesInMyTelFormat(client.phone),
      fax: this.splitValuesInMyTelFormat(client.fax),
      companyEmail: client.companyEmail ?? null,
      website: client.website ?? null,
      address: {
        state: client?.address?.state ?? null,
        zipCode: client?.address?.zipcode ?? null,
        city: client?.address?.city ?? null,
        address: client?.address?.line ?? null
      },
      managedBy: client?.managedBy ?? null,
      operationsContact: client?.operationsContact ?? null,
      notes: client['notes']?.['notes'] ?? null,
      mediaClientCode: client.mediaClientCode ?? null,
      interCompanyRcv: client.interCompanyRcv ?? null,
      incomeAcctCode: client.incomeAcctCode ?? null,
      prdScheme: client.prdScheme?._id ?? null,
      estScheme: client.estScheme?._id ?? null,
      estTiming: client.estTiming?._id ?? null,
      billing: {
        feeBasis: client.billing?.feeBasis?._id ?? null,
        media: client.billing?.media ?? null,
        commissionBasis: client.billing?.commissionBasis?._id ?? null
      },
      oohRevenue: {
        feeBasis: client.oohRevenue?.feeBasis?._id ?? null,
        media: client.oohRevenue?.media ?? null,
        commissionBasis: client.oohRevenue?.commissionBasis?._id ?? null,
        isSameAsBilling: client.oohRevenue?.isSameAsBilling
      },
      install: client.install ?? null,
      installBasis: client.installBasis?._id ?? null,
      oiRev: client?.oiRev ?? null,
      oiClientCode: client?.oiClientCode ?? null,
      oiClientApproved: client?.oiClientApproved ?? null,
      businessCategory: client?.businessCategory.map?.(category => category?._id) ?? null,
      diversityOwnership: client?.diversityOwnership.map?.(category => category?._id) ?? null,
      creditRating: client?.creditRating ?? null,
      cancellationPrivilege: client.cancellationPrivilege?._id ?? null,
      contractTermsType: client?.contractTermsType?._id ?? null,
      doNotUse: client?.doNotUse,
      retirementDate: client?.retirementDate ?? null,
      net: client?.net ?? null,
      gross: client?.gross ?? null,
      acPercentage: client?.acPercentage ?? null,
      clientNet: client?.clientNet ?? null,
      clientGross: client?.clientGross ?? null,
      commissionPercentage: client.commissionPercentage ?? null,
      feeAmount: client.feeAmount ?? null,
      taxAmount: client.taxAmount ?? null,
      taxPercentage: client.taxPercentage ?? null
    });
    if (this.enableDuplicate) {
      this.clientForm.patchValue({
        notes: null,
        doNotUse: false,
        isOpsApproved: false,
        retirementDate: null,
        isCurrent: true
      })
    }
    this.initialSameASFlag = (client.oohRevenue?.isSameAsBilling);
    this.checkManagerPermission();
  }

  private buildForm() {
    this.clientForm = this.fb.group({
      clientName: [
        null,
        [Validators.required, CustomValidators.noWhitespaceValidator(true), Validators.maxLength(64)]
      ],
      parentClient: [null, null, forbiddenNamesValidator],
      isParent: [false],
      clientType: [null, Validators.required],
      division: [null, Validators.required],
      office: [null, Validators.required],
      isOpsApproved: [false],
      isCurrent: [true],
      mediaAgency: [null,  null, forbiddenNamesValidator],
      agencyContact: [null],
      creativeAgency: [null, null, forbiddenNamesValidator],
      creativeAgencyContact: [null],
      phone: [null, [CustomValidators.telephoneInputValidator]],
      fax: [null, [CustomValidators.telephoneInputValidator]],
      companyEmail: [null, Validators.email],
      website: [null, CustomValidators.validUrl],
      address: [null],
      managedBy: [null, Validators.required, forbiddenNamesValidator],
      operationsContact: [null, null, forbiddenNamesValidator],
      notes: [null, [Validators.minLength(1), Validators.maxLength(2000), CustomValidators.noWhitespaceValidator(false)]],
      mediaClientCode: [
        null,
        [Validators.minLength(3), Validators.maxLength(5)]
      ],
      interCompanyRcv: [false],
      incomeAcctCode: [
        null,
        [Validators.minLength(3), Validators.maxLength(5)]
      ],
      prdScheme: [null],
      estScheme: [null],
      estTiming: [null],
      billing: this.fb.group({
        feeBasis: [null],
        media: [null, [Validators.min(1), Validators.max(100)]],
        commissionBasis: [{value: null, disabled: true}]
      }),
      oohRevenue: this.fb.group({
        feeBasis: [null],
        media: [null, [Validators.min(1), Validators.max(100)]],
        commissionBasis: [{value: null, disabled: true}],
        isSameAsBilling: [false]
      }),
      install: [null, [Validators.min(1), Validators.max(100)]],
      installBasis: [null],
      oiRev: [null, [Validators.min(1), Validators.max(100)]],
      oiClientCode: [null, [Validators.minLength(3), Validators.maxLength(5)]],
      oiClientApproved: [null],
      businessCategory: [null],
      diversityOwnership: [null],
      creditRating: [null],
      cancellationPrivilege: [null],
      contractTermsType: [null],
      doNotUse: [false],
      retirementDate: [null],
      net: [false],
      gross: [false],
      acPercentage: [false],
      clientNet: [false],
      clientGross: [false],
      commissionPercentage: [false],
      feeAmount: [false],
      taxAmount: [false],
      taxPercentage: [false]
    });
  }

  validate(c: AbstractControl): ValidationErrors | null {
    return this.clientForm.valid
      ? null
      : { invalidForm: { valid: false, message: 'Client fields are invalid' } };
  }

  // To make inifinte scroll work, we need to set container when the autocomplete overlay panel is opened
  public updateContainer() {
    this.panelContainer = '.client-list-autocomplete';
  }

  public updateMangedByContainer() {
    this.managedByPanelContainer = '.users-list-autocomplete';
  }

  public updateOperationsContactContainer() {
    this.operationContactPanelContainer = '.operation-contacts-list-autocomplete';
  }

  public updatePrimaryAgenciesContainer() {
    this.primaryAgencyPanelContainer = '.primary-agencies-list-autocomplete';
  }

  public updateCreativeAgenciesContainer() {
    this.creativeAgencyPanelContainer = '.creative-agencies-list-autocomplete';
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.subscription.unsubscribe();
  }

  public mangedByUserTrackByFn(idx: number, user: any) {
    return user?.id ?? idx;
  }

  public mangedByUserDisplayWithFn(user: any) {
    return user?.name ?? '';
  }

  public loadMoreManagementUsers() {
    this.managedByAutoComplete.loadMoreData(null, (res) => {
      this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
      this.cdRef.markForCheck();
    });
  }

  public operationContactsTrackByFn(idx: number, user: any) {
    return user?.id ?? idx;
  }

  public operationContactsDisplayWithFn(user: any) {
    return user?.name ?? '';
  }

  public loadMoreOperationContacts() {
    this.operationContactsAutoComplete.loadMoreData(null, (res) => {
      this.operationContactsAutoComplete.data = this.recordService.formatManageByResult(res.results);
      this.cdRef.markForCheck();
    });
  }

  public loadMorePrimaryAgencies() {
    this.primaryAgenciesAutoComplete.loadMoreData(null, (res) => {
      this.primaryAgenciesAutoComplete.data = res.results;
      this.cdRef.markForCheck();
    });
  }

  public creativeAgenciesTrackByFn(idx: number, agency: any) {
    return agency?._id ?? idx;
  }

  public creativeAgenciesDisplayWithFn(agency: any) {
    return agency?.name ?? '';
  }

  public loadMoreCreativeAgencies() {
    this.creativeAgenciesAutoComplete.loadMoreData(null, (res) => {
      this.creativeAgenciesAutoComplete.data = res.results;
      this.cdRef.markForCheck();
    });
  }

  public onPrimaryAgencySelection(event) {
    this.clientForm.controls.agencyContact.patchValue('');
    this.primaryAgencyContactTooltipText = '';

    if (event.option.value?.organizationId) {
      this.selectedPrimaryAgencyOrganizationId =
        event.option.value.organizationId;
        this.selectedPrimaryAgencyId = event.option.value?.['_id'];
      this.loadPrimaryAgencyContacts();
    }
  }

  public onCreativeAgencySelection(event) {
    this.clientForm.controls.creativeAgencyContact.patchValue('');
    this.creativeAgencyContactTooltipText = '';

    if (event.option.value?.organizationId) {
      this.selectedCreativeAgencyOrganizationId =
        event.option.value.organizationId;
        this.selectedCreativeAgencyId = event.option.value?.['_id'];
      this.loadCreativeAgencyContacts();
    }
  }

  public onSameAsBilling(isbillingChange = false) {
    if (isbillingChange) {
      const billingValue = this.clientForm.controls.billing.value;
      this.clientForm.controls.oohRevenue.patchValue({
        feeBasis: billingValue['feeBasis'],
        media: billingValue['media'],
        commissionBasis: billingValue['commissionBasis']
      }, {emitEvent:false});

      const commissonData = this.ohhRevenueFeeBasis.find(bill=>bill?._id === billingValue['feeBasis']);
      //5fb61f5ad057ac4666fad8b2 // Commission id
      if(commissonData?.name?.toLowerCase() === 'commission'){
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.enable();
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.setValidators([Validators.required]);
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.updateValueAndValidity({ emitEvent: false });
        this.clientForm?.controls?.oohRevenue?.['controls']?.isSameAsBilling.setValue(true, { emitEvent: false });
       
        if (this.disableEdit) {
          this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.disable({ emitEvent: false })
        }
      }else{
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.clearValidators({ emitEvent: false });
        this.cdRef.detectChanges();
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.disable({ emitEvent: false });
        this.clientForm?.controls?.oohRevenue?.['controls']?.isSameAsBilling.setValue(true, { emitEvent: false });
      }

    } else {
        this.clientForm.controls.oohRevenue.patchValue({
        feeBasis: null,
        media: null,
        commissionBasis: null
      }, {emitEvent:false});
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.clearValidators({ emitEvent: false });
        this.cdRef.detectChanges();
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.disable({ emitEvent: false });
        this.clientForm?.controls?.['oohRevenue']?.['controls']?.isSameAsBilling.setValue(false, { emitEvent: false });
    }


  }

  public onSetParent(event) {
    if (event.checked) {
      this.clientForm.controls.parentClient.patchValue(null);
    }
  }

  public onParentClientSelection(event) {
    this.clientForm.controls.isParent.patchValue(false);
  }

  private splitValuesInMyTelFormat(value) {
    if (!value) {
      return new MyTel('', '', '');
    }
    const tempVal = value.toString();
    return new MyTel(tempVal.slice(0, 3), tempVal.slice(3, 6), tempVal.slice(6, 10));
  }


  public getClientTypetext($event) {
    const value = this.clientTypes.find(v=>v._id === $event?.value);
    this.clientTypeTooltipText = value?.name;
    this.cdRef.markForCheck();
  }

  public getCancellationPrivilegeText($event) {
    const value = this.cancellationPrivileges.find(v=>v._id === $event?.value);
    this.cancellationPrivilegeTooltipText = value?.name;
    this.cdRef.markForCheck();
  }

  public getDivisionsToolTiptext($event) {
    const value = this.divisions.find(v=>v._id === $event?.value);
    this.divisionTooltipText = value?.name;
    this.cdRef.markForCheck();
  }

  public getBusinessCategoryToolTiptext($event) {
    if(!$event || $event?.length < 1) return;

    const hashSet = new Set([...$event.value]);

    const values = ClientFormComponent.getNamesFromValues(
      this.businessCategories,
      hashSet
    );
    this.businessCategoryTooltipText = values?.join(', ') || '';
    this.cdRef.markForCheck();
  }

  public getDiversityOwnershiptext($event) {
    if(!$event || $event?.length < 1) { return; }

    const hashSet = new Set([...$event.value]);
    const values = ClientFormComponent.getNamesFromValues(
      this.diversityOwnerShips,
      hashSet
    );

    this.diversityTooltipText = values?.join(', ') || '';
    this.cdRef.markForCheck();
  }

  public getCreativeAgencyContactText($event) {
    const contact = this.creativeAgencyContacts.find(v=>v._id === $event?.value);
    this.creativeAgencyContactTooltipText = `${contact['firstName']} ${contact['lastName']}`;
    this.cdRef.markForCheck();
  }

  public getPrimaryAgencyContactText($event) {
    const contact = this.primaryAgencyContacts.find(v=>v._id === $event?.value);
    this.primaryAgencyContactTooltipText =  `${contact['firstName']} ${contact['lastName']}`;
    this.cdRef.markForCheck();
  }

  public getEstTimingText($event) {
    const value = this.estTimings.find(v=>v._id === $event?.value);
    this.estTimingTooltipText = value?.name;
    this.cdRef.markForCheck();
  }

  public listenForContainerScroll(){
    this.containerScrolling$.pipe(takeUntil(this.unsubscribe$), filter(label => label === 'general_Tab')).subscribe((res)=>{
      this.parentClientsAutoCompleteTrigger.closePanel();
      this.primaryAgencyAutoCompleteTrigger.closePanel();
      this.creativeAgencyAutoCompleteTrigger.closePanel();
      this.managerAutoCompleteTrigger.closePanel();
      this.operationContactsAutoCompleteTrigger.closePanel();
    });
  }

/** This function used to create a new contact based on select client agenct */
  public createContact(field="agencyContact") {
   const formValue = this.clientForm.value;
      let selectedClientCompany = {};
      switch (field) {
        case 'agencyContact':
          selectedClientCompany = formValue?.mediaAgency;
          selectedClientCompany['organizationType'] = 'Agency';
          selectedClientCompany['parentCompany'] = formValue?.mediaAgency?.parentAgency?.name ?? null;
          break;

        case 'creativeAgencyContact':
          selectedClientCompany = formValue?.creativeAgency;
          selectedClientCompany['organizationType'] = 'Agency';
          selectedClientCompany['parentCompany'] = formValue?.creativeAgency?.parentAgency?.name ?? null;
          break;
        default:
          break;
      }
      if(!selectedClientCompany){
        return;
      }
       this.bottomSheet
      .open(ClientsAddContactComponent, {
        data: {
          company: selectedClientCompany
        },
        disableClose: true,
        panelClass:'add-contact-bottom-sheetDialog'
      })
      .afterDismissed()
      .subscribe((res) => {
        if (!res && !res?.data?.id) return;
          switch (field) {
            case 'agencyContact':

              this.loadPrimaryAgencyContacts(false, ()=>{
                this.primaryAgencyContactTooltipText = '';
                this.clientForm.controls.agencyContact.patchValue(res?.data?.id);
                this.getPrimaryAgencyContactText({value: res?.data?.id});
                this.cdRef.markForCheck();
              });

              break;
            case 'creativeAgencyContact':
              this.loadCreativeAgencyContacts(false, ()=>{
                this.creativeAgencyContactTooltipText = '';
                this.clientForm.controls.creativeAgencyContact.patchValue(res?.data?.id);
                this.getCreativeAgencyContactText({value: res?.data?.id});
                this.cdRef.markForCheck();
              });
              break;
            default:
              break;
          }
      });
  }

  // todo: need company id from api response
  public tabLinkHandler(type: string) {

    switch (type) {
      case 'parentClient': {
        const company = this.clientForm.controls?.['parentClient']?.value;
        const url = `${location.origin}/records-management-v2/clients/${company?._id}`;
        window.open(url, '_blank');
        break;
      }
      case 'agencyContact': {
        const contactId = this.clientForm.controls?.['agencyContact']?.value;
        const url = `${location.origin}/records-management-v2/contacts/${contactId}`;
        window.open(url, '_blank');
        break;
      }
      case 'creativeAgencyContact': {
        const contactId = this.clientForm.controls?.[
          'creativeAgencyContact'
        ]?.value;
        const url = `${location.origin}/records-management-v2/contacts/${contactId}`;
        window.open(url, '_blank');
        break;
      }
      case 'mediaAgency': {
        const selectedVendor = this.clientForm.controls?.['mediaAgency']?.value;
        const url = `${location.origin}/records-management-v2/agencies/${selectedVendor?._id}`;
        window.open(url, '_blank');
        break;
      }
      case 'creativeAgency': {
        const selectedVendor = this.clientForm.controls?.[
          'creativeAgency'
          ]?.value;
        const url = `${location.origin}/records-management-v2/agencies/${selectedVendor?._id}`;
        window.open(url, '_blank');
        break;
      }
    }

  }

  public get isPrimaryAgencySelected(){
    const companyInput = this.clientForm?.get('mediaAgency');
    return companyInput?.value?._id;
  }

  public get isCreativeAgencySelected(){
    const companyInput = this.clientForm?.get('creativeAgency');
    return companyInput?.value?._id;
  }
  public showEditorFunc() {
    this.showEditor = true;
    this.cdRef.markForCheck();
  }

  /**
   * method to add OPS field and form Edit permission based on ROLE
   */
  private checkManagerPermission() {
    const userData = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DATA));
    const userRoleData = (userData?.[LocalStorageKeys.USER_ROLE]) ? userData?.[LocalStorageKeys.USER_ROLE] : [];
    this.isMangerPermission = (userRoleData && Array.isArray(userRoleData)) ? userRoleData.includes(UserRoleTypes.CLIENT_MANAGER_ROLE) : true;
    
    if(this.clientForm?.controls?.isOpsApproved.value && !this.isMangerPermission) {
      this.clientForm.disable();
      this.disableEdit = true;
    }
  }

  private setOperationContacts(operationIdList: string[] = []) {
    const operationContactsSearchCtrl = this.clientForm?.controls
      ?.operationsContact?.valueChanges;
    if (operationContactsSearchCtrl) {
      this.operationContactsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        operationContactsSearchCtrl
      );
      this.operationContactsAutoComplete.apiEndpointMethod = () => {
        const isSearchStr = typeof this.clientForm?.controls?.operationsContact?.value === 'string';
          const searchObj = {
            filter: {
              companyTypes: ['User'],
              contactTypes: operationIdList
            },
            ...(isSearchStr
              ? { search: this.clientForm?.controls?.operationsContact?.value }
              : {})
          }
          return this.recordService.getContacts(
            searchObj,
            this.operationContactsAutoComplete.pagination,
            null,
            '',
            'id,firstName,lastName'
          );
      }
      this.operationContactsAutoComplete.loadData(null, (res) => {
        const operationList = this.recordService.formatManageByResult(res.results);
        this.operationContactsAutoComplete.data = operationList;
        const selectedId =this.clientForm?.controls?.operationsContact?.value?.id; // api response 'name' prop contains email id 
        if(selectedId) {
          this.clientForm.patchValue({
            operationsContact: operationList.find(item => item?.id === selectedId)
          });
        }
        this.cdRef.markForCheck();
      });

      this.operationContactsAutoComplete.listenForAutoCompleteSearch(
        this.clientForm,
        'operationsContact',
        null,
        (res) => {
          this.operationContactsAutoComplete.data = this.recordService.formatManageByResult(res.results);
          this.cdRef.markForCheck();
        }
      );
    }
  }
  private initOperationContacts() {
    this.subscription = this.recordService
      .getContactTypes({ page: 1, perPage: 50 })
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        const types: any[] = res?.results ? res.results : [];
        const selectedValue = types?.filter(each => each?.name.toLowerCase() == CONTACT_LIST_TYPES.OPERATIONS.toLowerCase()).map(_val => _val?._id);
        this.setOperationContacts(selectedValue);
      });
  }
}
