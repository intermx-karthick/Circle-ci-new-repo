import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  Input,
  Inject,
  Optional,
  ChangeDetectorRef,
  SkipSelf,
  forwardRef,
  OnDestroy,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { AbstractClientsDropDownComponent } from '../abstract-clients-drop-down.component';
import { BehaviorSubject, EMPTY, Subject } from 'rxjs';
import {
  AbstractControl,
  ControlValueAccessor,
  Form,
  FormArray,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgForm,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheet } from '@angular/material/bottom-sheet';
import { filter, finalize, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { parse, isValid, getDaysInYear, fromUnixTime } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

import { UseAutoCompleteInfiniteScroll } from '../../../classes/use-auto-complete-infinite-scroll';
import { RecordService } from '../../record.service';
import { CustomValidators } from '../../../validators/custom-validators.validator';
import { ClientProduct } from '@interTypes/records-management';
import { NotificationsService } from '../../../notifications/notifications.service';
import { ClientEstimateDetailsResponse } from '@interTypes/records-management/clients/client-estimate-details.response';
import { AddProductComponent } from '../add-product/add-product.component';
import { LocalStorageKeys, UserRoleTypes } from '@interTypes/enums';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';

@Component({
  selector: 'app-estimate-form',
  templateUrl: './estimate-form.component.html',
  styleUrls: ['./estimate-form.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EstimateFormComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EstimateFormComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstimateFormComponent extends AbstractClientsDropDownComponent
  implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('estimateFormRef') public estimateFormRef: NgForm;
  @Input() public submitForm$: Subject<void> = new Subject<void>();
  @Input() public clientId: string;
  @Input() public clientDetails: ClientDetailsResponse;
  @Input() public unTouchedValue$: BehaviorSubject<void>;
  @Input() public disableEdit: false;
  @Input() public type = 'new';

  // This input varibale is used to check whether the list duplicate action.
  // if listDuplicate is true - Add the one estimate date grou
  @Input() listDuplicate:boolean;

  public estimateForm: FormGroup;
  public parentClientsSearchStr: string;
  public panelContainer = '';

  public selectedBillingCompany;
  public isInitialLoadCompleted = false;

  public productsAutoComplete = new UseAutoCompleteInfiniteScroll();
  public panelCompanyContainer: string;
  public unsubscribeInitiator$: Subject<void> = new Subject();
  @ViewChild('productRef', { read: ElementRef }) productRef: ElementRef;
  public productTooltipText = '';

  public minDate = EstimateFormComponent.convertDateStringToDateInstance(
    '1/1/2000'
  );
  public maxDate = EstimateFormComponent.convertDateStringToDateInstance(
    '12/31/2100'
  );
  public isUserHasClientAcEditRole = false;

  private isProductChangesInProgress = false;
  private unsubscribe$: Subject<void> = new Subject();

  constructor(
    private fb: FormBuilder,
    public recordService: RecordService,
    public notificationService: NotificationsService,
    public cdRef: ChangeDetectorRef,
    public bottomSheet: MatBottomSheet,
    private dialog: MatDialog,
    @Optional() @SkipSelf() @Inject(MAT_BOTTOM_SHEET_DATA) public bootomSheetData: any,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {
    super(recordService, notificationService, cdRef);
  }

  private static convertDateStringToDateInstance(dateStr, makeTimeZero = true) {
    if (!dateStr) {
      return;
    }

    const FORMATS = [
      'yyyy/MM/dd',
      'yyyy-MM-dd',
      'MM-dd-yyyy',
      'MM/dd/yyyy',
      'dd-MM-yyyy',
      'dd/MM/yyyy',
      'MM-dd-yyyy',
      'MM/dd/yyyy'
    ]; // for checking multiple format if anything failed. currently 'yyyy/MM/dd' comes from api
    let dateIns: Date;

    try {

      FORMATS.some((formatStr) => {
        dateIns = parse(dateStr, formatStr, new Date(), {
          locale: enUS
        });

        if (isValid(dateIns)) {
          return true;
        }
      });

      if (!makeTimeZero) {
        return dateIns;
      }

      dateIns.setHours(0);
      dateIns.setMinutes(0);
      dateIns.setMilliseconds(0);
    } catch (e) {
      console.log(e);
      return dateIns;
    }

    return dateIns;
  }

  public ngOnInit(): void {
    this.checkClientAccountingEditRole();

    this.buildForm();

    this.loadFeeBasis();
    this.loadCommissionBasis();
    this.setUpProducts();

    // this.listenForEstimateValueChanges();

    this.submitForm$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.estimateFormRef.onSubmit(this.estimateForm.value);
      this.cdRef.markForCheck();
    });

    // Billing feeBasis value change
    this.estimateForm?.controls?.billing?.[
      'controls'
    ]?.feeBasis.valueChanges.subscribe((value) => {
      this.checkBillingFeeBasis(value);
    });

    // Revenue feeBasis value change
    this.estimateForm?.controls?.oohRevenue?.[
      'controls'
    ]?.feeBasis.valueChanges.subscribe((value) => {
      this.checkRevenueFeeBasis(value);
    });
  }

  private checkBillingFeeBasis(value) {
    const commissonData = this.billingFeeBasis.find(
      (bill) => bill?._id === value
    );
    if (commissonData?.name?.toLowerCase() === 'commission') {
      this.updateCommisionField(true);
    } else {
      this.updateCommisionField(false);
    }
  }

  private checkRevenueFeeBasis(value) {
    const commissonData = this.ohhRevenueFeeBasis.find(
      (bill) => bill?._id === value
    );
    if (commissonData?.name?.toLowerCase() === 'commission') {
      this.updateCommisionField(true, 'oohRevenue');
    } else {
      this.updateCommisionField(false, 'oohRevenue');
    }
  }

  private updateCommisionField(
    isEnableCommision = false,
    formGroupName = 'billing'
  ) {
    if (isEnableCommision) {
      this.estimateForm?.controls?.[formGroupName]?.[
        'controls'
      ]?.commissionBasis.enable();
      this.estimateForm?.controls?.[formGroupName]?.[
        'controls'
      ]?.commissionBasis.setValidators([Validators.required]);
      this.estimateForm?.controls?.[formGroupName]?.[
        'controls'
      ]?.commissionBasis.updateValueAndValidity({ emitEvent: false });
    } else {
      this.estimateForm?.controls?.[formGroupName]?.[
        'controls'
      ]?.commissionBasis.clearValidators();
      this.estimateForm?.controls?.[formGroupName]?.[
        'controls'
      ]?.commissionBasis.updateValueAndValidity({ emitEvent: false });
      this.estimateForm?.controls?.[formGroupName]?.[
        'controls'
      ]?.commissionBasis.setValue(null, { emitEvent: false });
      this.estimateForm?.controls?.[formGroupName]?.[
        'controls'
      ]?.commissionBasis.disable();
    }
  }

  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public validate(c: AbstractControl): ValidationErrors | null {
    return this.estimateForm.valid
      ? null
      : {
          invalidForm: {
            valid: false,
            message: 'Accounting fields are invalid'
          }
        };
  }

  public registerOnChange(fn: any): void {
    this.estimateForm.valueChanges.subscribe(fn);
  }

  public registerOnTouched(fn: any): void {
    this.estimateForm.valueChanges.subscribe(fn);
  }

  public writeValue(estimateDetails: ClientEstimateDetailsResponse): void {
    if (!estimateDetails) {
      return;
    }

    this.setEstimateFormArrayValues(estimateDetails);

    this.estimateForm.patchValue({
      product: estimateDetails.product?._id ?? null,
      productCode: estimateDetails.productCode ?? null,
      estimateName: estimateDetails.estimateName ?? null,
      billing: {
        feeBasis: estimateDetails.billing?.feeBasis?._id ?? null,
        media: estimateDetails.billing?.media ?? null,
        commissionBasis: estimateDetails.billing?.commissionBasis?._id ?? null
      },
      oohRevenue: {
        feeBasis: estimateDetails.oohRevenue?.feeBasis?._id ?? null,
        media: estimateDetails.oohRevenue?.media ?? null,
        commissionBasis:
          estimateDetails.oohRevenue?.commissionBasis?._id ?? null
      }
    });

    if (this.dialogData) {
      this.estimateForm.controls.estimateName.markAsDirty();
      this.estimateForm.controls.estimateName.markAsTouched();
      this.unTouchedValue$.next(this.estimateForm.value);
      // Validation added for editing existing value etimateId, startDate, endDate
      this.estimateForm.controls['estimate']['controls'].forEach((formControl) => {
        formControl.get('etimateId').setValidators(Validators.required);
        formControl.get('startDate').setValidators(Validators.required);
        formControl.get('endDate').setValidators(Validators.required);
      })
      this.cdRef.markForCheck();
    }
  }

  public get estimationsCount() {
    return this.estimateForm.controls['estimate']['controls']?.length;
  }

  public get estimateFC(): FormArray {
    return this.estimateForm.get('estimate')['controls'] as FormArray;
  }

  public isDateHasParseError(i: any, fieldName: string) {
    return this.estimateFC[i].controls?.[fieldName]?.errors?.[
      'matDatepickerParse'
    ];
  }

  public IsStartDateHasError(i) {
    return this.estimateFC[i].controls?.startDate?.errors?.['matDatepickerMin'];
  }

  public IsStartDateHasMaxDateError(i) {
    return this.estimateFC[i].controls?.startDate?.errors?.['matDatepickerMax'];
  }

  public IsEndDateHasError(i) {
    return this.estimateFC[i].controls?.endDate?.errors?.['matDatepickerMin'];
  }

  public IsEndDateHasMaxDateError(i) {
    return this.estimateFC[i].controls?.endDate?.errors?.['matDatepickerMax'];
  }

  public isDateOverlapIssue(i, fieldName: string) {
    return this.estimateFC[i].controls?.[fieldName]?.errors?.[
      'matDatepickerFilter'
    ];
  }
  public getMinDateForEndDate(startDate) {
    const startDateIns = EstimateFormComponent.convertDateStringToDateInstance(startDate);
    return startDateIns || this.minDate;
  }
  public getMaxDateOfEndDate(startDate) {
    if (!startDate) {
      return this.maxDate;
    }

    const startDateIns = EstimateFormComponent.convertDateStringToDateInstance(
      startDate
    );

    if (!startDateIns) { return this.maxDate; }

    // the date limit 12 months long is inclusive with selected start date
    const nextYearFromStartDateSecondsTimeStamp = ( startDateIns.getTime() +
      1000 * 60 * 60 * 24 * (getDaysInYear(startDateIns) - 1) ) / 1000;
    return fromUnixTime(nextYearFromStartDateSecondsTimeStamp);
  }

  public estimateDateFilter = (formIndex, isForEndDate = false) => {
    return (date: Date) => {
      if (!date) {
        return true;
      }

      try {
        const estimateFormControl = this.estimateForm.get('estimate')[
          'controls'
        ] as FormArray;
        if (!estimateFormControl) {
          return true;
        }

        for (const estimateIdx in estimateFormControl) {
          if (formIndex === +estimateIdx) {
            continue;
          }
          const estimateForm = estimateFormControl[+estimateIdx];

          if (estimateForm) {
            let startDate = estimateForm.value?.startDate;
            let endDate = estimateForm.value?.endDate;

            if (!startDate || !endDate) {
              continue;
            }

            if (typeof startDate === 'string') {
              startDate = EstimateFormComponent.convertDateStringToDateInstance(
                startDate
              );
            }

            if (typeof endDate === 'string') {
              endDate = EstimateFormComponent.convertDateStringToDateInstance(
                endDate
              );
            }

            // condition holds only for end date.
            if (isForEndDate) {
              const selectedEstimateForm = estimateFormControl[formIndex];
              const selectedStartDate = selectedEstimateForm.value.startDate;

              // Don't filter dates if no start date
              if (!selectedEstimateForm.value.startDate) {
                return true;
              }

              // Filter the startDate of selected endDate date picker form should be lesser
              // than other start date and selected endDate should be greater than or equal to
              // selected start date.
              if (
                selectedStartDate.getTime() < startDate.getTime() &&
                date.getTime() > selectedStartDate.getTime() &&
                date.getTime() >= startDate.getTime()
              ) {
                return false;
              } else {
                continue;
              }
            }

            // condition for start date to block between start date and end date
            // of other estimate
            if (
              startDate.getTime() <= date.getTime() &&
              endDate.getTime() >= date.getTime()
            ) {
              return false;
            }
          }
        }
      } catch (e) {
        console.log(e);
        return true;
      }

      return true;
    };
  };


  public addMoreEstimate() {
    const estimateFormControl = this.estimateForm.controls
      .estimate as FormArray;
    if (!estimateFormControl) {
      return;
    }

    estimateFormControl.push(
      this.fb.group({
        id: [null],
        etimateId: [null, [Validators.required, Validators.maxLength(5)]],
        startDate: [null, [Validators.required]],
        endDate: [null ,[Validators.required]],
        tbd: [ this.isUserHasClientAcEditRole || !this.clientDetails?.isOpsApproved],
        clientRequirementCode: [null]
      })
    );
    this.cdRef.markForCheck();
  }

  public deleteEstimation(i: number) {
    const estimateFormControl = this.estimateForm.controls
      .estimate as FormArray;
    if (!estimateFormControl) {
      return;
    }
    estimateFormControl.removeAt(i);
  }

  public companyDisplayWithFn(company) {
    return company?.name ?? '';
  }

  public companyTrackByFn(idx: number, company) {
    return company?._id ?? idx;
  }

  public selectProduct(product: ClientProduct) {
    this.estimateForm.patchValue({
      productCode: product?.productCode,
      billing: {
        feeBasis: product.billing?.feeBasis?._id ?? null,
        media: product.billing?.media ?? null,
        commissionBasis: product.billing?.commissionBasis?._id ?? null
      },
      oohRevenue: {
        feeBasis: product.oohRevenue?.feeBasis?._id ?? null,
        media: product.oohRevenue?.media ?? null,
        commissionBasis: product.oohRevenue?.commissionBasis?._id ?? null
      }
    });

    this.cdRef.markForCheck();
  }

  public updateCompanyContainer() {
    this.panelCompanyContainer = '.company-list-autocomplete';
  }

  private buildForm() {
    this.estimateForm = this.fb.group({
      product: [null, [Validators.required]],
      productCode: [null],
      estimateName: [
        null,
        [Validators.required, CustomValidators.noWhitespaceValidator(true)]
      ],
      estimate: this.fb.array(
        [
          this.fb.group({
            id: [null],
            etimateId: [null, [Validators.maxLength(5)]],
            startDate: '',
            endDate: '',
            tbd: [ this.isUserHasClientAcEditRole || !this.clientDetails?.isOpsApproved],
            clientRequirementCode: [null]
          })
        ],
        estimateFormArrayValidator()
      ),
      billing: this.fb.group({
        feeBasis: [null],
        media: [null, [Validators.min(1), Validators.max(100)]],
        commissionBasis: [null]
      }),
      oohRevenue: this.fb.group({
        feeBasis: [null],
        media: [null, [Validators.min(1), Validators.max(100)]],
        commissionBasis: [null]
      })
    });
  }

  private setUpProducts() {
    const productSearchCtrl = this.estimateForm?.controls?.product
      ?.valueChanges;
    if (productSearchCtrl) {
      this.productsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        productSearchCtrl
      );
      this.productsAutoComplete.pagination.perPage = 25;

      this.productsAutoComplete.apiEndpointMethod = () => {
        return this.recordService
          .getClientProducts(
            this.clientId,
            this.productsAutoComplete.pagination,
            'asc',
            'productName',
            this.productsAutoComplete.searchStr
          )
          .pipe(filter((res: any) => !!res.results));
      };

      this.productsAutoComplete.loadData(null, null);
    }
  }

  private listenForEstimateValueChanges() {
    if (!this.estimateForm?.get?.('estimate')) {
      return;
    }
    this.estimateForm
      .get('estimate')
      .valueChanges.pipe(takeUntil(this.unsubscribe$))
      .subscribe((value) => {
        this.swapStartAndEndDateOnError();
      });
  }

  private swapStartAndEndDateOnError() {
    try {
      for (const estimateIdx in this.estimateFC) {
        const estimateForm = this.estimateFC[+estimateIdx];
        if (estimateForm) {
          if (this.IsEndDateHasError(+estimateIdx)) {
            const tempDate = estimateForm.controls.startDate?.value;
            estimateForm.controls.startDate.patchValue(
              estimateForm.controls.endDate?.value,
              { emitEvent: false }
            );
            estimateForm.controls.endDate.patchValue(tempDate, {
              emitEvent: false
            });
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  private setEstimateFormArrayValues(estimateDetails) {
    if (!estimateDetails) {
      return;
    }

    try {
      this.resetEstimateFormArray();

      if (Array.isArray(estimateDetails.estimate)) {
        estimateDetails.estimate.forEach((individualEstimate) => {
          if (typeof individualEstimate.startDate === 'string') {
            individualEstimate.startDate = EstimateFormComponent.convertDateStringToDateInstance(
              individualEstimate.startDate
            );
          }

          if (typeof individualEstimate.endDate === 'string') {
            individualEstimate.endDate = EstimateFormComponent.convertDateStringToDateInstance(
              individualEstimate.endDate
            );
          }

          (this.estimateForm.get('estimate') as FormArray).push(
            this.fb.group({
              id: individualEstimate.id,
              startDate: individualEstimate.startDate,
              endDate: individualEstimate.endDate,
              etimateId: individualEstimate.etimateId,
              tbd: !!individualEstimate.tbd,
              clientRequirementCode:
                individualEstimate.clientRequirementCode ?? null
            })
          );
        });
      } else {
        this.addMoreEstimate();
      }
    } catch (e) {
      if (this.estimateFC.length == 0) {
        // edge cases
        this.addMoreEstimate();
      }
      console.log(e);
    }
  }

  private resetEstimateFormArray() {
    Array.from({ length: this.estimateFC.length }).forEach((_) => {
      (this.estimateForm.get('estimate') as FormArray).removeAt(0); // fifo
    });
  }

  ngAfterViewInit() {
    this.getProductTooltipText();
    /**
     * listDuplicate Input varibale, IF this initial true will add the one more estimate
     */
    if(this.listDuplicate){
      setTimeout(() => {
        this.addMoreEstimate();
      }, 500);
    }
    if(this.disableEdit) {
      this.estimateForm.disable();
      this.estimateForm.get('estimate')['controls'].forEach(control => {
        control.disable();
      });
    }

  }

  public getProductTooltipText() {
    setTimeout(() => {
      this.productTooltipText = this.productRef?.nativeElement?.querySelector(
        '.mat-select-value-text span'
      )?.innerText;
      this.cdRef.markForCheck();
    }, 500);
  }

  public get productCodeValue() {
    return this.estimateForm?.controls?.productCode?.value;
  }

  public tabLinkHandler(type: string, id: string) {
    const productIdx = this.productsAutoComplete.data.findIndex(
      (item: any) => item._id === id
    );
    if (productIdx > -1) {
      this.openProductDetails(productIdx);
    }
  }

  public openProductDetails(productIdx: any, isForUpdate = true) {

    const client = this.bootomSheetData ? this.bootomSheetData.client : this.dialogData?.client;
    const element = this.productsAutoComplete.data[productIdx];

    this.dialog
      .open(AddProductComponent, {
        minHeight: '485px',
        data: { client: client, product: element, isForUpdate, disableEdit: this.disableEdit },
        width: '770px',
        closeOnNavigation: true,
        disableClose: true,
        panelClass: 'add-product__panel',
      })
      .afterClosed()
      .pipe(
        filter((result) => result?.status === 'success'),
        tap(() => {
          this.productsAutoComplete.data[productIdx] = null;
          this.isProductChangesInProgress = true;
          this.cdRef.markForCheck();
        }),
        mergeMap((result) =>
          this.recordService.getClientProduct(client._id, element._id).pipe(
            filter((res) => !!res),
            finalize(() => {
              this.isProductChangesInProgress = false;
              this.cdRef.markForCheck();
            })
          )
        )
      )
      .subscribe((res: any) => {
        this.productsAutoComplete.data[productIdx] = res;
        const prodCodeCtrl = this.estimateForm.get('productCode');
        if (prodCodeCtrl.value !== res?.productCode) {
          prodCodeCtrl.patchValue(res?.productCode);
        }
        this.recordService.refreshEstimatesProductsListSubject.next(true);
        this.cdRef.markForCheck();
      });
  }

  public get disableProductTabLink(): boolean {
    return (
      this.isProductChangesInProgress ||
      !this.estimateForm.controls.product.value
    );
  }

  private checkClientAccountingEditRole() {
    const userData = JSON.parse(
      localStorage.getItem(LocalStorageKeys.USER_DATA)
    );
    const userRoleData = userData?.[LocalStorageKeys.USER_ROLE]
      ? userData?.[LocalStorageKeys.USER_ROLE]
      : [];
    this.isUserHasClientAcEditRole =
      userRoleData && Array.isArray(userRoleData)
        ? userRoleData.includes(UserRoleTypes.CLIENT_ACCOUNTING_EDIT_ROLE)
        : false;
  }
}

function estimateFormArrayValidator(): ValidatorFn {
  return (estimateFormArray: FormArray): { [key: string]: any } | null => {
    for (const estimateIdx in estimateFormArray.controls) {
      const estimateForm: any = estimateFormArray.controls[estimateIdx];

      if (estimateForm && estimateForm.valid) {
        // if estimated id and start/end date filled any group its valid
        if (
          estimateForm.controls.startDate.value &&
          estimateForm.controls.endDate.value &&
          estimateForm.controls.etimateId.value
        ) {
          return null;
        }
      }
    }

    return { atleastOneEstimate: true, message: 'INVALID' };
  };
}
