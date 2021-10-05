import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  OnDestroy,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { VendorService } from '../../vendors/vendor.service';
import { RecordService } from '../../record.service';
import { VendorType } from '@interTypes/vendor';
import { debounce, debounceTime, filter, takeUntil } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators, NgForm, FormControl } from '@angular/forms';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { AbstractAgenciesDropDownComponent } from '../abstract-agencies-drop-down.component';
import { NotificationsService } from '../../../notifications/notifications.service';
import { Helper } from 'app/classes';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MyTel } from 'app/records-management-v2/telephone/telephone-input/telephone-input.component';
import { forbiddenNamesValidator } from '@shared/common-function';
import { ActivatedRoute } from '@angular/router';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { UseAutoCompleteInfiniteScroll } from 'app/classes/use-auto-complete-infinite-scroll';
import { CkEditorConfig } from '@constants/ckeditor-config';
import { AuthenticationService } from '@shared/services';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';

@Component({
  selector: 'app-agencies-form',
  templateUrl: './agencies-form.component.html',
  styleUrls: ['./agencies-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgenciesFormComponent extends AbstractAgenciesDropDownComponent
  implements OnInit,AfterViewInit, OnDestroy {
  public diversityOwnerships: VendorType[] = [];
  public parentAgenciesSearchStr = '';
  public isDiversityOwnershipsLoadingOne = false;
  public diversityOwnershipsPaginationOne = {
    perPage: 10,
    page: 1,
    total: 10
  };
  public agencyForm: FormGroup;
  private unSubscribe: Subject<void> = new Subject<void>();
  @Input() agencyDetails$: Observable<any>;
  @Output() agencyFormChanges = new EventEmitter();
  sameAsBilling = false;
  agencyDetails = {};
  @Input()  public type = 'add';
  @ViewChild('agencyFormRef') agencyFormRef: NgForm;
  @Input() submitForm$: Subject<void> = new Subject<void>();
  panelContainer: string;
  public agencyNoteId$ = new BehaviorSubject(null);
  public isAgencyDetailView = false;
  public initialSameASFlag = false;
  @ViewChild('diversityRef', {read: ElementRef}) diversityRef: ElementRef;
  @ViewChild('agencyTypeRef', {read: ElementRef}) agencyTypeRef: ElementRef;
  public diversityTooltipText = '';
  public agencyTypeTooltipText = '';
  @ViewChild('divisionRef', {read: ElementRef}) divisionRef: ElementRef;
  public divisionTooltipText = '';
  public managedByAutoComplete = new UseAutoCompleteInfiniteScroll();
  public managedBypanelContainer: string;

  @Input() public containerScrolling$: Subject<string>;
  @ViewChild('aGroupInputRef', {read: MatAutocompleteTrigger})
  public companyAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('managerInputRef', {read: MatAutocompleteTrigger})
  public managerAutoCompleteTrigger: MatAutocompleteTrigger;
  @Input() public scrollingContainer:string;
  public showEditor = false;
  public editorConfig = CkEditorConfig;
  @ViewChild('addressArea') addressArea;
  userPermission: UserActionPermission;
  // @Input() set userRolePermission(perms) {
  //   console.log(perms);
  //   this.userPermission = perms;
  //   if (perms && !perms?.edit) {
  //     console.log(this.addressArea, this.agencyForm);
  //     this.addressArea?.formGroup?.disable();
  //     this.agencyForm?.disable();
  //   }
  // }

  constructor(
    public cdRef: ChangeDetectorRef,
    public vendorApi: VendorService,
    public recordService: RecordService,
    public notificationService: NotificationsService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private activeRoute: ActivatedRoute,
    private auth: AuthenticationService
  ) {
    super(recordService, notificationService, cdRef);
  }

  ngOnInit(): void {
    this.initializeForm();
    this.listenForContainerScroll();
    this.loadAgencies();
    this.loadMoreDiversityOwnerships();
    this.loadAgencyTypes();
    this.loadDivisions();
    this.loadOffice();
    this.loadCancellationPrivileges();
    this.loadCodeSchemes();
    this.loadFeeBasis();
    this.loadEstTimings();
    this.loadCommissionBasis();
    this.updateAgencyDetailsForm();

    this.submitForm$.pipe(takeUntil(this.unSubscribe)).subscribe(() => {
      this.agencyFormRef.onSubmit(undefined);
      this.cdRef.markForCheck();
    });

    this.activeRoute.params.pipe(
      takeUntil(this.unSubscribe)
    ).subscribe((params) => {
      if(params?.['id']){
        this.isAgencyDetailView = true;
        this.agencyNoteId$.next(params['id']);
      }else{
        this.isAgencyDetailView = false;
      }
    });
  }



  initializeForm() {
    // TODO: Will formcontrol name based on API
    this.agencyForm = this.fb.group({
      name: [
        null,
        [Validators.required, CustomValidators.noWhitespaceValidator(true), Validators.maxLength(64)]
      ],
      type: [null, Validators.required],
      parentAgency: [null, null, forbiddenNamesValidator],
      isParent: [false],
      division: [null],
      office: [null],
      managedBy: [null, null, forbiddenNamesValidator],
      phone: [null],
      fax: [null],
      email: [null, Validators.email],
      website: [null, CustomValidators.validUrl],
      address: {
        state: null,
        zipCode: null,
        city: null,
        address: null
      },
      diversityOwnership: [null],
      creditRating: [null],
      cancellationPrivilege: [null],
      current: [true], // bydefault set true
      retirementDate: [null],
      note: [null, [Validators.minLength(1), Validators.maxLength(2000), CustomValidators.noWhitespaceValidator(false)]],
      intercompanyRcv: [false],
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
        sameAsBilling: [false]
      }),
      install: [null, [Validators.min(1), Validators.max(100)]],
      installBasis: [null],
      OIRev: [null, [Validators.min(1), Validators.max(100)]],
      OIClientCode: [null, [Validators.minLength(3), Validators.maxLength(5)]],
      OIClientApproved: [null]
    });

    // initial Form Emit
    this.agencyFormChanges.emit(this.agencyForm);
    // Form change Emit
    this.agencyForm.valueChanges
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(() => this.agencyFormChanges.emit(this.agencyForm));

    this.agencyForm
      .get('billing')
      .valueChanges.pipe(debounceTime(500), takeUntil(this.unSubscribe))
      .subscribe(() => {
        if (
          this.agencyForm?.controls?.oohRevenue?.['controls']?.sameAsBilling
            .value &&
          this.agencyForm?.controls?.billing.valid
        ) {
          this.onSameAsBilling(true);
        }
      });

    this.agencyForm?.controls?.oohRevenue?.['controls']?.media.valueChanges.subscribe(()=>this.checkSameAsBilling());
    this.agencyForm?.controls?.oohRevenue?.['controls']?.commissionBasis.valueChanges.subscribe(()=>this.checkSameAsBilling());
    this.agencyForm?.controls?.oohRevenue?.['controls']?.sameAsBilling.valueChanges
      .subscribe((value)=>{
        if(this.initialSameASFlag || value){
          this.onSameAsBilling(value);
        }
        this.initialSameASFlag = true;

      });


    // Billing feeBasis value change
    this.agencyForm?.controls?.billing?.['controls']?.feeBasis.valueChanges.subscribe(value=>{
        this.checkBillingFeeBasis(value);
    });

        // Revenue feeBasis value change
    this.agencyForm?.controls?.oohRevenue?.['controls']?.feeBasis.valueChanges.subscribe((value)=>{
      this.checkRevenueFeeBasis(value);
      this.checkSameAsBilling()
    });




    this.agencyForm.get('isParent').valueChanges.subscribe((value) => {
      if (value) {
        this.agencyForm
          .get('parentAgency')
          .setValue(null, { emitEvent: false });
      }
    });

    this.agencyForm.get('parentAgency').valueChanges.subscribe((value) => {
      if (value) {
        this.agencyForm.get('isParent').setValue(false, { emitEvent: false });
      }
    });
    this.setFilterAgencySubscribtion(this.agencyForm, 'parentAgency');

    // Managed By Code
    const managedBySearchCtrl = this.agencyForm?.controls?.managedBy
      ?.valueChanges;
    if (managedBySearchCtrl) {
      this.managedByAutoComplete.loadDependency(
        this.cdRef,
        this.unSubscribe,
        managedBySearchCtrl
      );
      this.managedByAutoComplete.apiEndpointMethod = () => {
        const isSearchStr = typeof this.agencyForm?.controls?.managedBy?.value === 'string';
        const searchObj = {
          filter: {
            companyTypes: [
              "User"
            ]
          },
          ...(isSearchStr
            ? { search: this.agencyForm?.controls?.managedBy?.value }
            : {})
        }
        return this.recordService.getContacts(
          searchObj,
          this.managedByAutoComplete.pagination,
          null,
          '',
          'id,firstName,lastName'
        );
      }

      this.managedByAutoComplete.loadData(null, (res) => {
        const managedList = this.recordService.formatManageByResult(res.results);
        const selectedId = this.agencyForm.controls.managedBy?.value?.id; // api response 'name' prop contains email id 
        if(selectedId) {
          this.agencyForm.patchValue({
            managedBy: managedList.find(item => item?.id === selectedId)
          });
        }
        this.managedByAutoComplete.data = managedList;
        this.cdRef.markForCheck();
      });

      this.managedByAutoComplete.listenForAutoCompleteSearch(
        this.agencyForm,
        'managedBy',
        null,
        (res) => {
          this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
          this.cdRef.markForCheck();
        }
      );
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
      this.agencyForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.enable();
      this.agencyForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.setValidators([Validators.required]);
      this.agencyForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.updateValueAndValidity({ emitEvent: false });
      if(this.agencyForm?.controls?.oohRevenue?.['controls']?.sameAsBilling.value && formGroupName === 'billing'){
        this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.enable();
        this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.setValidators([Validators.required]);
        this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.updateValueAndValidity({ emitEvent: false });
        this.agencyForm?.controls?.oohRevenue?.['controls']?.sameAsBilling.setValue(true);
      }

      if(!!this.userPermission && !this.userPermission?.edit) {
        this.agencyForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.disable({ emitEvent: false });
      }
    }else{
      this.agencyForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.clearValidators();
      this.agencyForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.updateValueAndValidity({ emitEvent: false });
      this.agencyForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.setValue(null, { emitEvent: false })
      this.agencyForm?.controls?.[formGroupName]?.['controls']?.commissionBasis.disable();
       if(this.agencyForm?.controls?.oohRevenue?.['controls']?.sameAsBilling.value && formGroupName === 'billing'){
        this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.clearValidators({ emitEvent: true });
        this.cdRef.detectChanges();
        this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.disable({ emitEvent: false });
        this.agencyForm?.controls?.oohRevenue?.['controls']?.sameAsBilling.setValue(true);
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

  public loadMoreDiversityOwnerships() {
    const currentSize =
      this.diversityOwnershipsPaginationOne.page *
      this.diversityOwnershipsPaginationOne.perPage;
    if (currentSize > this.diversityOwnershipsPaginationOne.total) {
      this.isDiversityOwnershipsLoadingOne = false;
      return;
    }

    this.diversityOwnershipsPaginationOne.total += 1;
    this.loadDiversityOwnerships();
  }

  private loadDiversityOwnerships() {
    this.isDiversityOwnershipsLoadingOne = true;
    this.vendorApi
      .getVendorsDiversityOwnerships(this.diversityOwnershipsPaginationOne)
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        this.diversityOwnerships = res.results;
        this.diversityOwnershipsPaginationOne.total = res.pagination.total;
        this.isDiversityOwnershipsLoadingOne = false;
        this.cdRef.markForCheck();
      });
  }
  /* onSameAsBilling(value) {
    const formvalue = Helper.deepClone(this.agencyForm.value);
    this.sameAsBilling = formvalue['oohRevenue']['sameAsBilling'];
    if (this.sameAsBilling) {
      this.agencyForm.get('oohRevenue').patchValue(formvalue['billing']);
    }
  } */

  public onSameAsBilling(isbillingChange = false) {
    if (isbillingChange) {
      const billingValue = this.agencyForm.controls.billing.value;
      this.agencyForm.controls.oohRevenue.patchValue({
          feeBasis: billingValue['feeBasis'],
          media: billingValue['media'],
          commissionBasis: billingValue['commissionBasis']
        },
        { emitEvent: false }
      );
      const commissonData = this.ohhRevenueFeeBasis.find(bill=>bill?._id === billingValue['feeBasis']);
      //5fb61f5ad057ac4666fad8b2 // Commission id
      if(commissonData?.name?.toLowerCase() === 'commission'){
        this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.enable();
        this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.setValidators([Validators.required]);
        this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.updateValueAndValidity({ emitEvent: false });
        this.agencyForm?.controls?.oohRevenue?.['controls']?.sameAsBilling.setValue(true, { emitEvent: false });

        if (!!this.userPermission && !this.userPermission?.edit) {
          this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.disabled({ emitEvent: false })
        }
      }else{
        this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.clearValidators({ emitEvent: false });
        this.cdRef.detectChanges();
        this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.disable({ emitEvent: false });
        this.agencyForm?.controls?.oohRevenue?.['controls']?.sameAsBilling.setValue(true, { emitEvent: false });
      }
    } else {
      this.agencyForm.controls.oohRevenue.patchValue({
          feeBasis: null,
          media: null,
          commissionBasis: null
        },
        { emitEvent: false }
      );
      this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.clearValidators({ emitEvent: false });
        this.cdRef.detectChanges();
        this.agencyForm?.controls?.['oohRevenue']?.['controls']?.commissionBasis.disable({ emitEvent: false });
        this.agencyForm?.controls?.oohRevenue?.['controls']?.sameAsBilling.setValue(false, { emitEvent: false });
    }
  }


  private checkSameAsBilling() {
    if (this.agencyForm?.controls?.oohRevenue?.['controls']?.sameAsBilling) {
      this.agencyForm?.controls?.oohRevenue?.[
        'controls'
      ]?.sameAsBilling.setValue(false, { emitEvent: false });
    }
  }

  public updateContainer() {
    this.panelContainer = '.vendor-group-autocomplete';
  }
  public displayWithFn(agency) {
    return agency?.name ?? '';
  }
  public agencyTrackByFn(idx: number, agency) {
    return agency?._id ?? idx;
  }

  private updateAgencyDetailsForm() {
    if (this.agencyDetails$) {
      this.agencyDetails$
        .pipe(takeUntil(this.unSubscribe))
        .subscribe((agency) => {
          if (agency) {
            this.agencyDetails = agency;
            if(this.type !== 'duplicate'){
              this.type = 'edit';
            }
            this.updateGeneralFormData(agency);
          }
        });
    }
  }
  private updateGeneralFormData(agency) {
    this.initialSameASFlag = false;
    let diversityOwnership = null;
    let agencyType = null;
    if(agency?.diversityOwnership) {
      diversityOwnership = agency?.diversityOwnership.map(diversity => diversity['_id']);
    }
    if(agency?.type) {
      agencyType = agency?.type.map(aType => aType['_id']);
    }
    // While duplicating we no need to set all values. For more details check ticket IMXUIPRD-3237
    // isCurrent should always be true while creating/duplicating a client
    if (this.type === 'duplicate') {
      this.agencyForm.patchValue({
        name: agency?.name,
        // type: agency?.type['_id'] ?? null,
        type: agencyType,
        parentAgency: agency?.parentAgency ?? null,
        isParent: agency?.isParent ?? null,
        division: agency?.division?._id ?? null,
        office: agency?.office?._id ?? null,
        managedBy: agency?.managedBy ?? null,
        email: agency?.email ?? null,
        website: agency?.website ?? null,
        diversityOwnership: diversityOwnership,
        creditRating: agency?.creditRating ?? null,
        cancellationPrivilege: agency?.cancellationPrivilege?._id ?? null,
        current: true,
        intercompanyRcv: agency?.intercompanyRcv ?? null,
        prdScheme: agency?.prdScheme?._id ?? null,
        estScheme: agency?.estScheme?._id ?? null,
        estTiming: agency?.estTiming?._id ?? null,
        billing: {
          feeBasis: agency?.billing?.feeBasis?._id ?? null,
          media: agency?.billing?.media ?? null,
          commissionBasis: agency?.billing?.commissionBasis?._id ?? null
        },
        oohRevenue: {
          feeBasis: agency?.oohRevenue?.feeBasis?._id ?? null,
          media: agency?.oohRevenue?.media ?? null,
          commissionBasis: agency?.oohRevenue?.commissionBasis?._id ?? null,
          sameAsBilling: agency?.oohRevenue?.sameAsBilling ?? null
        },
        install: agency?.install ?? null,
        installBasis: agency?.installBasis?._id ?? null,
        OIRev: agency?.OIRev ?? null,
        OIClientCode: agency?.OIClientCode ?? null,
        OIClientApproved: agency?.OIClientApproved ?? null
      });
    } else {
      this.agencyForm.patchValue({
        name: agency?.name,
        // type: agency?.type['_id'] ?? null,
        type: agencyType,
        parentAgency: agency?.parentAgency ?? null,
        isParent: agency?.isParent ?? null,
        division: agency?.division?._id ?? null,
        office: agency?.office?._id ?? null,
        managedBy: agency?.managedBy ?? null,
        phone: agency?.phone
          ? this.splitValuesInMyTelFormat(agency?.phone)
          : null,
        fax: agency?.fax ? this.splitValuesInMyTelFormat(agency?.fax) : null,
        email: agency?.email ?? null,
        website: agency?.website ?? null,
        address: {
          state: agency?.address?.state ?? null,
          zipCode: agency?.address?.zipcode ?? null,
          city: agency?.address?.city ?? null,
          address: agency?.address?.line ?? null
        },
        diversityOwnership: diversityOwnership,
        creditRating: agency?.creditRating ?? null,
        cancellationPrivilege: agency?.cancellationPrivilege?._id ?? null,
        current: agency?.current ?? null,
        retirementDate: agency?.retirementDate ?? null,
        note: agency?.note?.notes ?? null,
        intercompanyRcv: agency?.intercompanyRcv ?? null,
        prdScheme: agency?.prdScheme?._id ?? null,
        estScheme: agency?.estScheme?._id ?? null,
        estTiming: agency?.estTiming?._id ?? null,
        billing: {
          feeBasis: agency?.billing?.feeBasis?._id ?? null,
          media: agency?.billing?.media ?? null,
          commissionBasis: agency?.billing?.commissionBasis?._id ?? null
        },
        oohRevenue: {
          feeBasis: agency?.oohRevenue?.feeBasis?._id ?? null,
          media: agency?.oohRevenue?.media ?? null,
          commissionBasis: agency?.oohRevenue?.commissionBasis?._id ?? null,
          sameAsBilling: agency?.oohRevenue?.sameAsBilling ?? null
        },
        install: agency?.install ?? null,
        installBasis: agency?.installBasis?._id ?? null,
        OIRev: agency?.OIRev ?? null,
        OIClientCode: agency?.OIClientCode ?? null,
        OIClientApproved: agency?.OIClientApproved ?? null
      });
    }

    this.initialSameASFlag = (agency?.oohRevenue?.sameAsBilling);

    if (agency?.diversityOwnership?.length) {
      this.diversityTooltipText = agency.diversityOwnership.map((obj) => obj.name).join(',');
    }
    if (agency?.type?.length) {
      this.agencyTypeTooltipText = agency.type.map((obj) => obj.name).join(',');
    }
    if (agency?.division) {
      this.divisionTooltipText = agency.division.name;
    }
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
  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
  ngAfterViewInit(){
    this.getDiversityOwnershiptext();
    this.getAgencyTypeText();
    this.getDivisiontext();
    this.userPermission = this.auth.getUserPermission(UserRole.AGENCIES);
    if (this.userPermission && !this.userPermission?.edit) {
      this.addressArea?.formGroup?.disable();
      this.agencyForm?.disable();
    }
  }

  public getDiversityOwnershiptext(){
    this.diversityTooltipText = '';

    setTimeout(() => {
      this.diversityTooltipText = (this.diversityRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
    }, 500);
  }

  public getAgencyTypeText(){
    this.agencyTypeTooltipText = '';

    setTimeout(() => {
      this.agencyTypeTooltipText = (this.agencyTypeRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
    }, 500);
  }

  public getDivisiontext(){
    this.divisionTooltipText = '';
    setTimeout(() => {
      this.divisionTooltipText = (this.divisionRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
    }, 200);
  }

  public updateMangedByContainer() {
    this.managedBypanelContainer = '.users-list-autocomplete';
  }

  public managedByUserTrackByFn(idx: number, user: any) {
    return user?.id ?? idx;
  }

  public managedByUserDisplayWithFn(user: any) {
    return user?.name ?? '';
  }

  public loadMoreManagementUsers() {
    this.managedByAutoComplete.loadMoreData(null, (res) => {
      this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
      this.cdRef.markForCheck();
    });
  }

  public listenForContainerScroll() {
    this.containerScrolling$.pipe(takeUntil(this.unSubscribe)).subscribe((res) => {
      this.companyAutoCompleteTrigger.closePanel();
      this.managerAutoCompleteTrigger.closePanel();
    });
  }

  public tabLinkHandler(type: string) {
    const selectedParentAgency = this.agencyForm.controls?.['parentAgency']
      ?.value;

    if (selectedParentAgency) {
      const url = `${location.origin}/records-management-v2/agencies/${selectedParentAgency?._id}`;
      window.open(url, '_blank');
    }
  }

  public showEditorFunc() {
    this.showEditor = true;
    this.cdRef.markForCheck();
  }
}
