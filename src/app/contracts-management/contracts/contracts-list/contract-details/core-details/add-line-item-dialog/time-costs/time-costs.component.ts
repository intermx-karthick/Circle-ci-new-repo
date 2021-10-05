import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  SimpleChanges, Inject
} from '@angular/core';
import { MatSelectChange } from "@angular/material/select";
import { AppAutocompleteOptionsModel } from "@shared/components/app-autocomplete/model/app-autocomplete-option.model";
import { AddLineItemMapper } from "app/contracts-management/contracts/contracts-shared/helpers/add-line-item.mapper";
import { ApiIncoming } from "app/contracts-management/models";
import { ClientEstimate } from "app/contracts-management/models/client-estimate.model";
import { CostCalculation, EstimateItem, IODate } from "app/contracts-management/models/estimate-item.model";
import { ClientEstimateService } from "app/contracts-management/services/client-estimate.service";
import { Helper } from "app/classes/helper"
import { ContractLineItemsService } from "app/contracts-management/services/contract-line-items.service";
import { PeriodLength, PeriodLengthForRecalculation } from "app/contracts-management/models/period-length.model";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { PeriodLengthCalculator } from "app/contracts-management/contracts/contracts-shared/helpers/period-length.calculator";
import { InsertionOrderRecord } from "app/contracts-management/models/insertion-order-record.model";
import { AppRegularExp, UserRoleTypes } from '@interTypes/enums';
import { DatePipe } from "@angular/common";
import * as numeral from 'numeral';
import isBefore from 'date-fns/isBefore'
import { TabLinkHandler, TabLinkType } from '@shared/services/tab-link-handler';
import differenceInDays from 'date-fns/differenceInDays'
import getDaysInMonth from 'date-fns/getDaysInMonth'
import getDaysInYear from 'date-fns/getDaysInYear'
import add from 'date-fns/add';
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import max from 'date-fns/max'
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UserActionPermission } from '@interTypes/user-permission';
import { AfterViewInit } from '@angular/core';
import { AuthenticationService } from '@shared/services';
import { MapToContractsCheckpoint } from '../../../../../contracts-shared/helpers/contract-checkpoints.mapper';

@Component({
  selector: 'contracts-time-costs',
  templateUrl: 'time-costs.component.html',
  styleUrls: ['time-costs.component.less'],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.Default
})
export class TimeCostsComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  public periodForm: FormGroup;
  public estimateAutocompleteItems: AppAutocompleteOptionsModel[]
  public periodLengths: AppAutocompleteOptionsModel[]

  public estimateItems: EstimateItem[] = [];
  public lastModifiedPeriodField = LastModifiedPeriodField;
  public insertionOrderRecords: InsertionOrderRecord[];
  selectedEstimate = ({id: null} as AppAutocompleteOptionsModel);
  private _clientId: string;
  private _productId: string;
  public selectedEstimateId:string;
  // cost calculation

  public unitNetCtrl: FormControl = new FormControl(0);
  public taxCtrl: FormControl = new FormControl(0, [Validators.max(100), Validators.min(0)]);
  public agencyCommCtrl: FormControl = new FormControl(15.00, [Validators.max(100), Validators.min(0)]);


  public marketRateCtrl: FormControl = new FormControl(0.00);
  public installCostCtrl: FormControl = new FormControl(0.00);
  public installsCtrl: FormControl = new FormControl();

  public deliveryNumericPatternRegEx = /^[0-9]{1,7}(\.[0-9]{0,2})?$/;
  public periodPatternRegEx = /^[0-9]{1,7}(\.[0-9]{0,3})?$/;

  // This regEx allow 0 to 99.99
  public percentagePatternRegEx = /^(?=.*[0-9])\d{0,2}(\.\d{0,2})?$/;
 // This regEx allow 0 to 99.99999
  public taxPatternRegEx = /^(?=.*[0-9])\d{0,2}(\.\d{0,5})?$/;

  public AppRegularExp = AppRegularExp;

  public totalNet = 0;

  public unitAgencyComm = 0;
  public totalAgencyComm = 0;

  public unitGrassMedia = 0;
  public totalGrassMedia = 0;

  public unitTax = 0;
  public totalTax = 0;

  public unitFee = 0;
  public totalFee = 0;

  public unitClientNet = 0;
  public totalClientNet = 0;
  public totalContracClientNet = 0;

  public costEstimatePayload:CostCalculation;
  public lineItemObj;
  public TabLinkType = TabLinkType;
  public actualContractTotal = 0;
  public addOptions = [...Array(10).keys()];
  public weekOptions = ['4 Weeks', '3 Weeks', '2 Weeks', '1 Week']
  public selectedOption = 1;
  public estimationPagination = {
    page: 0,
    perPage: 10,
    total: 0
  }
  public isEstimationListLoading = false;
  public ioDateErr: any = {};

  public autoManualToggle = false;
  private _disableEntireTimeAndCost = false;
  @Input() isForDuplicate = false;

  @Input() set contract(contract: any) {
    this.setContractApprovedForBilling(contract);
    this._disableEntireTimeAndCost =
      this.showEditActions &&
      this.isContractApprovedForBilling &&
      !AuthenticationService.isUserContractManager();
    // this.updateClientFieldsDisable();
  }
  isContractApprovedForBilling = false;

  @Input() set lineItemData(data: any) {
    if(!data) {
      return;
    }
    this.lineItemObj = data;
  };
  @Output() estimateCostEmit = new EventEmitter();
  @Input() set clientId(value: string) {
    if(!value) {
      return;
    }
    this._clientId = value;
  }
  public get getClientId() {
    return this._clientId;
  }
  @Input() refreshLineItem$: Subject<any> = new Subject<any>();
  @Input() clickformStream$: Subject<any> = new Subject<any>();

  @Input() set selectedProduct(value: any) {
    this.clearEstimate();
    if(!value?._id) {
      return;
    }
    if(value.refresh){
      return;
    }
    this._productId = value?._id;
    this.estimateItems = [];
    if (!value?.refresh) {
      this.estimationPagination = {
        page: 1,
        perPage: 100,
        total: 0
      }
    }
    this.isEstimationListLoading = true;
    this.clientEstimateService.getEstimates(this._clientId, this._productId, true, this.estimationPagination)
      .subscribe((res: ApiIncoming<ClientEstimate>) => {
        this.isEstimationListLoading = false;
        this.estimationPagination['page'] = 1;
        this.estimationPagination['total'] = Math.ceil(res?.['pagination']?.['total'] / this.estimationPagination['perPage']);
        const autocompleteItems = AddLineItemMapper.ToEstmatesDropdown((res?.results || []));
        this.estimateAutocompleteItems = autocompleteItems;
        if(value?.refresh || this.lineItemObj?.clientEstimate?.id) {
          let selected: any;
          if (!value.refresh) selected = this.estimateAutocompleteItems.filter(item => item.id === this.lineItemObj?.clientEstimate?.id)
          if (value.refresh) selected = this.estimateAutocompleteItems.filter(item => item.id === this.selectedEstimate?.id);
          if(selected.length > 0) {
            this.selectedEstimate = selected[0];
            this.getEstimateTableData(this.selectedEstimate.id, true)
            this.selectedEstimateId = this.selectedEstimate.id;
            // setting the value in edit
            this.calculateCost();
            this.cdRef.detectChanges();
          } else {
            this.selectedEstimateId = '';
            this.selectedEstimate = { id: null } as AppAutocompleteOptionsModel;
            this.cdRef.detectChanges();
            this.getEstimateTableData(this.lineItemObj?.clientEstimate?.id);
          }
        }

      });
  }
  private unSubscribe$ = new Subject();
  public minDate = Helper.convertDateStringToDateInstance(
   '1/1/1900'
  );
  public maxDate = Helper.convertDateStringToDateInstance(
   '12/31/9999'
  );
  @Input() userPermission: UserActionPermission;

  constructor(
    private clientEstimateService: ClientEstimateService,
    private fb: FormBuilder, public tabLinkHandler: TabLinkHandler,
    public datepipe: DatePipe,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private contractLineItemsService: ContractLineItemsService, private cdRef:ChangeDetectorRef,
    private dialog: MatDialog
    ) {
      this.periodForm = fb.group({
        numberOfPeriods: ["", [Validators.min(0), Validators.max(52)]],
        periodLength: [null, Validators.required],
        startDate: "",
        endDate: ""
      })

    this.contractLineItemsService.getPeriodLength()
    .subscribe((res: ApiIncoming<PeriodLength>) => {
      this.periodLengths = AddLineItemMapper.ToPeriodLength(res.results);
      this.setCostEstimate() /* init call to select period length after API response received */
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    /**
     * Traversing Prev/Next on Line item model values not get updated
     * Handled initial value set logic to changes method too
     */
    if (changes?.lineItemData) {
      this.initValues();
    }
  }

  ngOnInit() {
    this.refresh();
    this.initValues();
  }

  ngAfterViewInit() {
    // this.updateClientFieldsDisable();
  }

  ngOnDestroy() {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  /**
   * Default value set and method event call handled by seprete method hence make resuable
   */
  public initValues() {
    if (this.lineItemObj) {
      const sDate = this.lineItemObj?.startDate && AddLineItemMapper.convertDateStringToDateInstance(this.lineItemObj.startDate);
      const eDate = this.lineItemObj?.endDate && AddLineItemMapper.convertDateStringToDateInstance(this.lineItemObj.endDate);
      this.periodForm.patchValue({
        numberOfPeriods: this.lineItemObj?.noOfPeriods,
        periodLength: this.lineItemObj?.periodLength?.label,
        startDate: sDate,
        endDate: eDate,
      });
      this.insertionOrderRecords = [];
      if (this.lineItemObj?.IODates?.length) {
        this.lineItemObj?.IODates.forEach(element => {
          const period: InsertionOrderRecord = {
            ioDate: new FormControl(element.date !== null ? AddLineItemMapper.convertDateStringToDateInstance(element.date) : null),
            estimateNumber: element.estimateId,
            netAmount: AddLineItemMapper.format(element.net, '0,0.00[000]'),
            id: element.id,
            disabled: this.disableEntireTimeAndCost,
            exportedStatus: element?.exportedStatus,
          };
          this.autoManualToggle = element?.exportedStatus && !element?.deletedStatus ? true : this.autoManualToggle;
          this.insertionOrderRecords.push(period);
        });
      }
      this.unitNetCtrl.setValue(this.lineItemObj?.net?.toFixed(2));
      this.agencyCommCtrl.setValue(this.lineItemObj?.agencyCommission?.toFixed(2));
      this.taxCtrl.patchValue(AddLineItemMapper.format(this.lineItemObj?.tax, '0,0.00[000]'));
      this.installsCtrl.setValue(this.lineItemObj?.installs ?? '');
      this.installCostCtrl.setValue(this.lineItemObj?.installCost ?? 0.00);
      this.marketRateCtrl.patchValue(this.lineItemObj?.marketRate ?? 0.00);
      this.totalNet = this.lineItemObj?.actualContractCost;
      this.cdRef.detectChanges();
      this.calculateCost();
      this.setAutoContractTotal();
      this.updateAddOptions();
    }
  }

  /**
   * @description
   *  As per card 4146, we need to disable the entire time cost if following condition matched
   *  Role: Contract Editor - The Client Line Items value [Critical values (Product, Estimate, Vendor, IO Dates) ]
   *  cannot be edited if "Approved for Billing" = TRUE
   *  (Row 12)
   */
  get disableEntireTimeAndCost(): boolean {
    return this.showEditActions && this._disableEntireTimeAndCost;
  }

  // only for edit line item not for add and duplicate
  public get showEditActions() {
    return this.data.lineItemData && !this.data.isForDuplicate;
  }

  public updateClientFieldsDisable() {
    if (!this.userPermission?.edit || this.disableEntireTimeAndCost) {
      this.periodForm.disable();
      this.agencyCommCtrl.disable();
      this.taxCtrl.disable();
      this.marketRateCtrl.disable();
      this.unitNetCtrl.disable();
      this.installCostCtrl.disable();
      this.installsCtrl.disable();
    } else if (this.userPermission?.edit && !this.disableEntireTimeAndCost) {
      this.periodForm.enable();
      this.agencyCommCtrl.enable();
      this.taxCtrl.enable();
      this.marketRateCtrl.enable();
      this.unitNetCtrl.enable();
      this.installCostCtrl.enable();
      this.installsCtrl.enable();
      this.cdRef.markForCheck();
    }
  }
  public isStartDateHasError() {
    return this.periodForm.controls?.startDate?.errors?.['matDatepickerMin'];
  }

  public isStartDateHasMaxDateError() {
    return this.periodForm.controls?.startDate?.errors?.['matDatepickerMax'];
  }

  public isEndDateHasError() {
    return this.periodForm.controls?.endDate?.errors?.['matDatepickerMin'];
  }

  public IsEndDateHasMaxDateError() {
    return this.periodForm.controls?.endDate?.errors?.['matDatepickerMax'];
  }

  public onToggleChanges(event:MatSlideToggleChange){
    if (!event.checked) {
      event.source.checked = this.autoManualToggle;
      const dialogueData = {
        title: 'Confirmation',
        description: 'Changes to your IO Dates will be overridden. Confirm to proceed.',
        confirmBtnText: 'OK',
        cancelBtnText: 'CANCEL',
        displayCancelBtn: true
      };
      this.dialog.open(NewConfirmationDialogComponent, {
        data: dialogueData,
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      }).afterClosed().pipe(
        map(res => res?.action)
      ).subscribe(flag => {
        if (flag) {
          this.autoManualToggle = event.checked;
        } else {
          event.source.checked = this.autoManualToggle;
          this.cdRef.markForCheck();
        }
        if(!this.autoManualToggle){
          this._setPeriodAndEndDate();
          this.recalculatePeriodLenght();
        }
      });
    } else {
      this.autoManualToggle = event.checked;
      this.cdRef.markForCheck();
    }

  }

  public loadMoreEstimations() {
    if (this.estimationPagination['page'] < this.estimationPagination['total']) {
      this.isEstimationListLoading = true;
      this.estimationPagination['page'] = this.estimationPagination['page'] + 1;
      if(this._clientId) { /* to avoid undefined call when client not selected */
      this.clientEstimateService.getEstimates(this._clientId, this._productId, true, this.estimationPagination)
        .subscribe((res: ApiIncoming<ClientEstimate>) => {
          const autocompleteItems = AddLineItemMapper.ToEstmatesDropdown(res.results);
          this.estimateAutocompleteItems.push(...autocompleteItems);
          this.isEstimationListLoading = false;
        });
      }
    }
  }

  public calculateCost(isNewCalculate = false){
    const ioDateCount = this.insertionOrderRecords?.length ?? 0;
    if(isNewCalculate){
      this.unitNetCtrl.setValue(0.00);
      this.agencyCommCtrl.setValue(0.00);
      this.taxCtrl.setValue(0.00);
    }

    const peoridFormData = this.periodForm.getRawValue();
    const noOfPeriod = peoridFormData?.numberOfPeriods ?? 0.0;

    const netUnitFormValue = numeral(this.unitNetCtrl.value).value() ?? 0.00;
    const unitTaxFormValue = numeral(this.taxCtrl.value).value() ?? 0.00;
    const unitAgencyCommFormValue = numeral(this.agencyCommCtrl.value).value() ?? 0.00;

    //Calculate Agency commission

    //Calculate Gross Media
    //Formula: Net / (1-agencycommision%)
    this.unitGrassMedia = this.roundOfCost(netUnitFormValue / (1-(unitAgencyCommFormValue/100)));

    this.unitAgencyComm =this.roundOfCost(this.unitGrassMedia * (unitAgencyCommFormValue/100));
    //Sum of value across insertion orders

    //Calculate Fee
    /**
     * Variable calc based on Fee Type & Fee Basis.
        If Fee Type is NOT commission, Fee Amount is 0.
        If Fee Type IS Commission, look to Commission Basis (gross or net).
        If CommBasis = Net, Fee Amount = (Net Per Period*Fee%)
        If CommBasis = Gross, Fee Amount = (Gross Per Period * Fee%)
     */
    if(this.estimateItems?.[0]?.fee?.toLowerCase() === 'commission'){
      if(this.estimateItems?.[0]?.commissionBasis?.toLowerCase() === 'gross'){
        this.unitFee =  this.roundOfCost((this.unitGrassMedia * (Number(this.estimateItems?.[0]?.media))/100) ?? 0);
      }else{
        this.unitFee =  this.roundOfCost((netUnitFormValue * (Number(this.estimateItems?.[0]?.media))/100) ?? 0);
      }
    } else {
      this.unitFee = 0;
    }

    //Calculate Fee
    // Tax Amount Per Period --- TaxPercent * Net
    this.unitTax = this.roundOfCost(Number((unitTaxFormValue/100)) * netUnitFormValue);
    // Client net calculation
    // Net Per Period + Fee Amount
    this.unitClientNet = this.roundOfCost(netUnitFormValue + this.unitFee + this.unitTax);
    //Sum of "Client Net" calc across insertion orders

    this.setCostEstimate();
    this.setAutoContractTotal();
    // Total Contract Calculation
    this.totalNet = this.roundOfCost(this.actualContractTotal);
    this.totalGrassMedia = this.roundOfCost(this.totalNet / (1-(unitAgencyCommFormValue/100)));
    this.totalAgencyComm = this.roundOfCost(this.totalGrassMedia * (unitAgencyCommFormValue/100));
    this.totalTax = this.roundOfCost(Number((unitTaxFormValue/100)) * this.totalNet);
    if(this.estimateItems?.[0]?.fee?.toLowerCase() === 'commission'){
      if(this.estimateItems?.[0]?.commissionBasis?.toLowerCase() === 'gross'){
        this.totalFee = this.roundOfCost((this.totalGrassMedia * (Number(this.estimateItems?.[0]?.media))/100) ?? 0);
      }else{
        this.totalFee =  this.roundOfCost((this.totalNet * (Number(this.estimateItems?.[0]?.media))/100) ?? 0);
      }
    } else {
      this.totalFee = 0;
    }
    this.totalContracClientNet = this.roundOfCost(this.totalNet + this.totalFee + this.totalTax);
    this.totalClientNet = this.roundOfCost(netUnitFormValue * noOfPeriod);

    this.cdRef.markForCheck();
  }

  public setCostEstimate(){
    const peoridFormData = this.periodForm.getRawValue();
    const peoridLength = this.periodLengths?.find(peorid=>peorid.value == peoridFormData.periodLength);
    this.costEstimatePayload = {
      clientEstimate:this.selectedEstimateId,
      noOfPeriods:peoridFormData.numberOfPeriods,
      periodLength: peoridLength?.['id']?? null,
      startDate: this.datepipe.transform(peoridFormData?.startDate, 'MM/dd/yyyy') ?? null,
      endDate: this.datepipe.transform(peoridFormData?.endDate, 'MM/dd/yyyy') ?? null,
      net: numeral(this.unitNetCtrl.value).value(),
      tax:numeral(this.taxCtrl.value).value(),
      agencyCommission: numeral(this.agencyCommCtrl.value).value(),
      installs: this.installsCtrl.value,
      installCost:this.installCostCtrl.value,
      marketRate: this.marketRateCtrl.value,
      IODates: this.formatIODates(),
      isAuto: this.autoManualToggle === false ? true : false,
      isPeriodFormValid: this.periodForm.valid,
      isIOdateError: (Object.keys(Helper.removeBooleanType(this.ioDateErr, false)).length > 0)
    };
    this.estimateCostEmit.emit(this.costEstimatePayload);
  }

  private formatIODates() {
    const estimateIODate:IODate[] = [];
    this.insertionOrderRecords?.forEach(element => {
      const localEstimateIO:IODate = {
        date: this.datepipe.transform((element?.ioDate as FormControl).value?.toString(), 'MM/dd/yyyy'),
        net: Number(numeral(element.netAmount).format('0.00')),
        estimateId: element.estimateNumber
      };
      if (element.id) {
        localEstimateIO['_id'] = element.id;
      }
      estimateIODate.push(localEstimateIO);
    });
    return estimateIODate;
  }

  public formatNumericValue(formCtrl:FormControl){
    const valueInNumeral = numeral(formCtrl.value).value();
    if(valueInNumeral > 0) {
      formCtrl.setValue(numeral(formCtrl.value).value());
    } else {
      formCtrl.setValue(null);
    }
  }
  public formatBlankInput(formCtrl:FormControl){
    const valueInNumeral = numeral(formCtrl.value).value();
    if(valueInNumeral == null) {
      formCtrl.setValue('0.00');
    }
  }
  public onFocusIOAmount(record){
    const formatValue = numeral(record.netAmount).value() ?? 0.00;
    record.netAmount = null;
    if(formatValue > 0) {
      setTimeout(() => {
        record.netAmount = formatValue;
        this.cdRef.markForCheck();
      }, 10);
    }
   //this.insertionOrderRecords[index].netAmount = formatValue.toString();

  }
  public formatBlankInputIO(record){
    const formatValue = numeral(record.netAmount).value();
    if(formatValue == null) {
      record.netAmount = '0.00'
      this.cdRef.markForCheck();
    }
  }
  public onBlurIOAmount(index:number){
    // this.setAutoContractTotal();
    // this.setCostEstimate();
    this.calculateCost();
  }

  public addEstimateNumber(estimateId, index) {
    this.insertionOrderRecords[index].estimateNumber = estimateId;
    this.setCostEstimate();
  }

  public onEstimateSelectionChange(event: MatSelectChange) {
    if (!event?.value?.id) {
      this.estimateItems = [];
      this.calculateCost();
      this.recalculatePeriodLenght();
    }
    else {
      const estimateId = event.value.id;
      this.selectedEstimateId = estimateId;
      this.selectedEstimate = event.value;
      this.getEstimateTableData(estimateId);
    }
  }

  public getEstimateTableData(estimateId, initialCall = false) {
    this.clientEstimateService.getEstimate(this._clientId, estimateId)
      .subscribe((res: any) => {
        if(!res) {
          return;
        }
        this.estimateItems = [];
        res['estimate'] = this.sortByStartDate(res);
        const est = AddLineItemMapper.ToEstimateItems(res)
        this.estimateItems.push(...est);
        this.calculateCost();
        if(!initialCall){
          this.recalculatePeriodLenght();
        }
      })
  }

  public sortByStartDate(response: ClientEstimate) {
    return response.estimate.sort((a, b ) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }

  public onPeriodChanged(event: MatSelectChange) {

  }

  public recalculatePeriodLenght(lastModified?: LastModifiedPeriodField, evt = null) {
    if (this.periodForm.controls.startDate.invalid) {
      this.periodForm.patchValue({
        endDate: ""
      });
      this.setCostEstimate();
      return;
    }
    if (this.periodForm.controls.endDate.invalid){
      this.setCostEstimate();
      return;
    }

    if (this.periodForm.controls.numberOfPeriods.invalid && this.periodForm.controls.periodLength.value !== 'One-Time') {
      return;
    }
    if (!this.autoManualToggle) {
      if (this.periodForm.controls.periodLength.value === 'One-Time') {
        this.periodForm.patchValue({
          numberOfPeriods: '1'
        }, {
          emitEvent: false
        });

        this.periodForm.controls.numberOfPeriods.disable();
        // this.periodForm.controls.endDate.disable();
      } else {
        this.periodForm.controls.numberOfPeriods.enable();
        // this.periodForm.controls.endDate.enable();
      }

      const formValue: PeriodLengthForRecalculation = this.periodForm.getRawValue();
      if (!formValue.periodLength && formValue.startDate && formValue.endDate && formValue.numberOfPeriods) {
        this.periodForm.controls.periodLength.setErrors({ required: true });
        this.periodForm.controls.periodLength.markAsTouched();
        this.periodForm.updateValueAndValidity();
        this.setCostEstimate();
        this.cdRef.markForCheck();
      return;
    }
    if(formValue?.startDate && formValue.endDate && isBefore(formValue?.endDate, formValue?.startDate )){
      this.periodForm.controls.endDate.setErrors({ endDateError: true });
      this.periodForm.updateValueAndValidity();
      this.cdRef.markForCheck();
      return ;
    }
    let periodLengthsRecalculated;

    if(!lastModified){
      // Check endDate & number of period is there
      if(!formValue.endDate && formValue.numberOfPeriods){
        periodLengthsRecalculated = PeriodLengthCalculator.calculateEndDate(formValue, this.periodLengths);
        this.periodForm.patchValue(periodLengthsRecalculated);
      }else if(formValue.endDate){
        periodLengthsRecalculated = PeriodLengthCalculator.calculatePeriods(formValue, this.periodLengths);
        this.periodForm.patchValue(periodLengthsRecalculated);
      }
    }else if(lastModified == LastModifiedPeriodField.EndDate){
      if(formValue.startDate){
        formValue.numberOfPeriods = "";
      }
      periodLengthsRecalculated = PeriodLengthCalculator.calculatePeriods(formValue, this.periodLengths);
      this.periodForm.patchValue(periodLengthsRecalculated);
    } else if(lastModified == LastModifiedPeriodField.NumberOfPeriods) {
      if(formValue.startDate){
        formValue.endDate = null;
      }
      periodLengthsRecalculated = PeriodLengthCalculator.calculateEndDate(formValue, this.periodLengths);
      this.periodForm.patchValue(periodLengthsRecalculated);
    } else if(lastModified == LastModifiedPeriodField.PeriodLengthChange) {
      if(formValue.numberOfPeriods){
        periodLengthsRecalculated = PeriodLengthCalculator.calculateEndDate(formValue, this.periodLengths);
        this.periodForm.patchValue(periodLengthsRecalculated);
      }else{
        periodLengthsRecalculated = PeriodLengthCalculator.calculatePeriods(formValue, this.periodLengths);
        this.periodForm.patchValue(periodLengthsRecalculated);
      }
    }

    // Calculate IO dates
    if(periodLengthsRecalculated?.numberOfPeriods && periodLengthsRecalculated?.endDate && periodLengthsRecalculated?.periodLength && periodLengthsRecalculated?.startDate){
      const exportedRecords = [];
      this.insertionOrderRecords?.forEach((element) => {
        if (element.exportedStatus || element.disabled) {
          exportedRecords.push(element);
        }
      })
      this.insertionOrderRecords = PeriodLengthCalculator.calculateInsertionOrdersDates(periodLengthsRecalculated, this.periodLengths);
      exportedRecords.forEach((element) => {
        const ind = this.insertionOrderRecords.findIndex(ele => new Date(ele?.ioDate?.value)?.getTime() === new Date(element?.ioDate?.value)?.getTime());
        (ind > -1) ? this.insertionOrderRecords.splice(ind, 1) : '';
      })
      this.insertionOrderRecords.unshift(...exportedRecords);
      this._fillInsertionOrdersValues();
      this.updateAddOptions();
    }
    this.calculateCost();
    this.costInsertionOrdersValues();
}
      this.cdRef.detectChanges();
  }

  public costInsertionOrdersValues() {
    const formValue: PeriodLengthForRecalculation = this.periodForm.getRawValue();
    const netUnitFormValue = numeral(this.unitNetCtrl.value).value() ?? 0.00;
    const decimalValue = formValue?.numberOfPeriods?.toString()?.split(".")[1] ?? 0;
    // COSTS: (cost per period) / (# of days in Period Length) = Cost Per Day
    // IO cost for partial period = # of days in partial period * Cost Per Day
    this.insertionOrderRecords?.forEach((element, index) => {
      if ((this.insertionOrderRecords.length - 1) === index && Number(decimalValue) && this.insertionOrderRecords[index].ioDate.value && !this.insertionOrderRecords[index].exportedStatus) {
        const lastdayCount = differenceInDays(
          new Date(formValue.endDate),
          this.insertionOrderRecords[index].ioDate.value
        );

        const selectedPeriodLength = this.periodLengths.find(period => period.value.toLowerCase() == formValue.periodLength.toLowerCase());

        const peoridLengthCount = selectedPeriodLength?.unit === 'day' ? Number(selectedPeriodLength?.duration ?? 1) : (Number(selectedPeriodLength?.duration) * 7);

        let decimalAmout = 0;
        if ((selectedPeriodLength?.unit.toLowerCase() === 'day' || selectedPeriodLength?.unit.toLowerCase() === 'week') && lastdayCount) {
          const perDayCost = (netUnitFormValue / peoridLengthCount);
          decimalAmout = perDayCost * (lastdayCount + 1);
        } else if (lastdayCount == 0 && (selectedPeriodLength?.unit.toLowerCase() === 'day' || selectedPeriodLength?.unit.toLowerCase() === 'week')) {
          const perDayCost = (netUnitFormValue / peoridLengthCount);
          decimalAmout = perDayCost;
        } else {
          let countOfDays = 0;
          switch (formValue.periodLength) {
            case 'Month':
              countOfDays = getDaysInMonth(new Date(formValue.startDate));
              break;
            case 'Quarterly':
              const quaterEndDate = add(formValue.startDate, { months: 3 });
              countOfDays = differenceInDays(quaterEndDate, formValue.startDate);
              break;

            case 'Annual':
              countOfDays = getDaysInYear(formValue.startDate);
              break;

            default:
              break;
          }
          const perDayCost = (netUnitFormValue / (countOfDays - 1));
          decimalAmout = perDayCost * (lastdayCount + 1);
          if (lastdayCount <= 0) {
            decimalAmout = perDayCost;
          }
        }
        this.insertionOrderRecords[index].netAmount = numeral(decimalAmout).format('0,0.00').toString();
      } else if(!this.insertionOrderRecords[index].exportedStatus){
        this.insertionOrderRecords[index].netAmount = numeral(netUnitFormValue).format('0,0.00').toString();
      }
    });
    // this.setAutoContractTotal();
    // this.setCostEstimate();
    this.calculateCost();
  }

  public setAutoContractTotal(){
    this.actualContractTotal = 0;
    this.insertionOrderRecords?.forEach(element => {
        const amount = element?.netAmount ?? 0;
        this.actualContractTotal += Number(numeral(amount).value());
    });
    this.cdRef.markForCheck();
  }

  public removeAll() {
    this.insertionOrderRecords = [];
    this.periodForm.patchValue({
      numberOfPeriods: "",
      endDate: "",
    });
    this.calculateCost();
    this.updateAddOptions();
  }

  public onRemoveSelected() {
    for(let i = 0; i < this.insertionOrderRecords.length; i++) {
      if(this.insertionOrderRecords[i].selected) {
        this.insertionOrderRecords.splice(i, 1)
        i--;
      }
    }
    this.calculateCost();
    this.updateAddOptions();
    if(!this.autoManualToggle){
      this._setPeriodAndEndDate();
    }
  }

  public ioDateChanged(event: any, index) {
    this.insertionOrderRecords[index].estimateNumber = null;
    this.ioDateErr[index] = event?.value && !(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(event?.value?.toLocaleDateString()));
    const newDate: Date = event.value;
    const dtValueParse = Date.parse(newDate?.toDateString());
    this.insertionOrderRecords[index].ioDate.patchValue(newDate);
    for(let i = 0; i < this.estimateItems.length; i++) {
      const estimateItem = this.estimateItems[i];
      const startDtParse = Date.parse(estimateItem.startDateAsDate.toDateString());
      const endDtParse = Date.parse(estimateItem.endDateAsDate.toDateString());
      if (dtValueParse >= startDtParse && dtValueParse <= endDtParse) { /* logic rewrites as value passed between start and end dt range */
        this.insertionOrderRecords[index].estimateNumber = estimateItem.estimateNumber;
      }
    }
    this.setCostEstimate();

    // Calcualte end date or peorid length based IO date change
    // This function call when auto calcualtion enabled this.autoManualToggle === false
    // this.ioDateEr if have IO date field error not update the end date.
    if(!this.autoManualToggle && Object.keys(Helper.removeBooleanType(this.ioDateErr, false)).length <= 0){
      this._setPeriodAndEndDate();
    }
  }

  private _setPeriodAndEndDate(){
      const ioDates = this.insertionOrderRecords.map(io=>io.ioDate.value);
      const maxDate = max(ioDates);
      const beforeFormValue: PeriodLengthForRecalculation = this.periodForm.getRawValue();
      if(isBefore(beforeFormValue?.endDate, maxDate)){
        this.periodForm.controls.endDate.setValue(maxDate, {emitEvent:false});
        const formValue: PeriodLengthForRecalculation = this.periodForm.getRawValue();
        const periodLengthsRecalculated = PeriodLengthCalculator.calculatePeriods(formValue, this.periodLengths);
        this.periodForm.patchValue(periodLengthsRecalculated);
        this.cdRef.markForCheck();
        this.calculateCost();
      }
  }

  private _fillInsertionOrdersValues() {
    this.ioDateErr = {};
    for(let i = 0; i < this.estimateItems.length; i++) {
      const estimateItem = this.estimateItems[i];
      const startDtParse = Date.parse(estimateItem.startDateAsDate.toDateString());
      const endDtParse = Date.parse(estimateItem.endDateAsDate.toDateString());

      for(let j = 0; j < this.insertionOrderRecords.length; j++) {
        const insertionOrder = this.insertionOrderRecords[j];
        const dtValueParse = Date.parse(insertionOrder.ioDate.value.toDateString());

        // if( insertionOrder.ioDate.getDate() === estimateItem.startDateAsDate.getDate() && insertionOrder.ioDate.getMonth() === estimateItem.startDateAsDate.getMonth() && insertionOrder.ioDate.getFullYear() === estimateItem.startDateAsDate.getFullYear())

        // this.insertionOrderRecords[j].estimateNumber = estimateItem.estimateNumber
        if (dtValueParse >= startDtParse && dtValueParse <= endDtParse) { /* logic rewrites as value passed between start and end dt range */
          this.insertionOrderRecords[j].estimateNumber = estimateItem.estimateNumber;
        }
      }
    }

  }
  private updateAddOptions() {
    const peoridLength = this.periodForm.value?.periodLength;
    this.addOptions = [...Array(10).keys()];
    if(this.weekOptions.includes(peoridLength)) {
      const optLength = 52 - this.insertionOrderRecords?.length;
      this.addOptions = [...Array(optLength).keys()];
    }
    this.selectedOption = 1;
  }

  public addNewIODate() {
    const netUnitFormValue = numeral(this.unitNetCtrl.value).value() ?? 0.00;
    if (this.selectedOption > 0) {
      for(let i = 0; i < this.selectedOption; i++) {
        const period: InsertionOrderRecord = {
        ioDate: new FormControl(null),
        estimateNumber: null,
        netAmount: numeral(netUnitFormValue).format('0,0.00')
        };
        this.insertionOrderRecords.push(period);
      }
      this.calculateCost();
    }
    this.updateAddOptions();
  }

  refresh() {
    this.refreshLineItem$.pipe(takeUntil(this.unSubscribe$)).subscribe((product) => {
      if (product?._id) this.setupEstimates();
    });

    this.clickformStream$.pipe(takeUntil(this.unSubscribe$)).subscribe((isFormSubmit) => {
      Object.keys(this.periodForm.controls).forEach(field => {
        const control = this.periodForm.get(field);
        control.markAsTouched({ onlySelf: true });
      });
    });
  }

  openNewEstimateWindow(){
    const url = `${location.origin}/records-management-v2/clients/${this._clientId}?tab=new_estimates`
    window.open(url, '_blank');
  }

  private setupEstimates() {
    if(this._clientId) { /* to avoid undefined call when client not selected */
      this.isEstimationListLoading = true;
      if (!this._productId) {
        this.clearEstimate();
        return;
      }

      this.clientEstimateService
        .getEstimates(
          this._clientId,
          this._productId,
          true,
          this.estimationPagination
        )
        .subscribe((res: ApiIncoming<ClientEstimate>) => {
          this.estimationPagination['page'] = 1;
          this.estimationPagination['total'] = Math.ceil(res['pagination']['total'] / this.estimationPagination['perPage']);
          const autocompleteItems = AddLineItemMapper.ToEstmatesDropdown(res.results);
          this.isEstimationListLoading = false;
          this.estimateAutocompleteItems = autocompleteItems;
          if(this.selectedEstimate?.id) {
            const selected = this.estimateAutocompleteItems.filter(item => item.id === this.selectedEstimate?.id)
            if(selected.length > 0) {
              this.selectedEstimate = selected[0];
              this.getEstimateTableData(this.selectedEstimate.id, true);
              this.selectedEstimateId = this.selectedEstimate.id;
              // setting the value in edit
              this.calculateCost();
              this.cdRef.detectChanges();
            } else {
              this.isEstimationListLoading = false;
              this.estimateItems = [];
              this.selectedEstimateId = '';
              this.selectedEstimate = { id: null } as AppAutocompleteOptionsModel;
              this.cdRef.markForCheck();
            }
          }
        });
    }
  }

  private clearEstimate() {
    this.isEstimationListLoading = false;
    this.estimateItems = [];
    this.estimateAutocompleteItems = [];
    this.selectedEstimateId = '';
    this.selectedEstimate = { id: null } as AppAutocompleteOptionsModel;
    this.calculateCost();
    this.recalculatePeriodLenght();
    this.cdRef.markForCheck();
  }

  public roundOfCost(value, digimal = 2) {
    return Number(value.toFixed(digimal));
  }

  public setContractApprovedForBilling(contract): void{
    const contractCheckpoints = MapToContractsCheckpoint(
      contract.contractEvents
    );
    this.isContractApprovedForBilling = contractCheckpoints.approvedForBillingExport;
  }
}


enum LastModifiedPeriodField {
  EndDate = 'endDate',
  NumberOfPeriods = 'numberOfPeriods',
  PeriodLengthChange = 'PeriodLengthChange'
}
