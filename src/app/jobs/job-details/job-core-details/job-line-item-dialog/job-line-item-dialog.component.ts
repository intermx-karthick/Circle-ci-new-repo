import {
  Component,
  Inject,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
  ViewChildren,
  Renderer2,
  QueryList,
  ViewChild,
} from '@angular/core';
import { DOCUMENT, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';

import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { AuthenticationService, SnackbarService } from '@shared/services';
import { MyTel } from '@shared/components/telephone-input/telephone-input.component';
import { CostCalculation } from 'app/contracts-management/models/estimate-item.model';
import { TabLinkHandler, TabLinkType } from '@shared/services/tab-link-handler';
import { AbstractContractComponent } from 'app/contracts-management/contracts/contracts-shared/components/abstract-contract.component';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';

import { PlacementType } from '@interTypes/inventory';
import { VendorType, VendorTypesPagination } from '@interTypes/vendor';
import { VendorSearchPayload } from '@interTypes/inventory-management';
import { LineItemStatus } from "@interTypes/enums";
import {
  JobDetails,
  JobLineItemDetails,
  JobLineItemsResponse
} from 'app/jobs/interfaces';

import { LineItemCkEditorConfig } from '@constants/contract-line-item-ckeditor-config';
import { SPOT_MINUTES, SPOT_SECONDS } from 'app/contracts-management/contracts/contracts-shared/helpers/min-sec.const';
import { Helper } from 'app/classes/helper';
import { VendorTypeNames } from "@interTypes/enums";

import { ClientsService } from 'app/contracts-management/services/clients.service';
import { VendorService } from 'app/contracts-management/services/vendor.service';
import { MediaDetailsService } from 'app/contracts-management/services/media-details.service';
import { AddressServiceService } from 'app/contracts-management/services/address-service.service';
import { ContractsService } from 'app/contracts-management/services/contracts.service';
import { JobsService } from 'app/jobs/jobs.service';
import { ApiIncoming, PeriodLength } from 'app/jobs/interfaces/period.response';
import { AppAutocompleteOptionsModel } from '@shared/components/app-autocomplete/model/app-autocomplete-option.model';
import { AddJobLineItemMapper } from 'app/jobs/helper/add-job-line-item.mapper';
import { JobLineItemService } from 'app/jobs/services/job-line-item.service';
import { JobDetailsService } from 'app/jobs/services/job-details.service';

import * as numeral from 'numeral';

import { ReplaySubject, of, combineLatest, interval, EMPTY, forkJoin } from 'rxjs';
import {
  startWith,
  debounceTime,
  takeUntil,
  distinctUntilChanged,
  switchMap,
  catchError,
  map, filter, finalize, mergeMap, tap
} from 'rxjs/operators';
import { UserRole } from '@interTypes/user-permission';
import { Subject } from 'rxjs';
import { forbiddenNamesValidator } from '@shared/common-function';
import { formatDistance } from 'date-fns';

@Component({
  selector: 'app-job-line-item-dialog',
  templateUrl: './job-line-item-dialog.component.html',
  styleUrls: ['./job-line-item-dialog.component.less'],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.Default
})
export class JobLineItemDialogComponent extends AbstractContractComponent implements OnInit {

  public createdDateAt: Date;
  public periodPatternRegEx = /^[0-9]{1,7}(\.[0-9]{0,3})?$/;
  constructor(
    public dialogRef: MatDialogRef<JobLineItemDialogComponent>,
    public tabLinkHandler: TabLinkHandler,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private contractsService: ContractsService,
    private clientsService: ClientsService,
    private jobsService: JobsService,
    private vendorService: VendorService,
    private fb: FormBuilder,
    private mediaDetailsService: MediaDetailsService,
    private addressServiceService: AddressServiceService,
    private jobLineItemService: JobLineItemService,
    public dialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private snackbarService: SnackbarService,
    public readonly cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private readonly document: Document,
    private renderer: Renderer2,
    public datepipe: DatePipe,
    private auth: AuthenticationService,
    private jobDetailsService: JobDetailsService,
  ) {
    super(cdRef, mediaDetailsService);
    this.notesForm = fb.group({
      contractNotes: null,
      productionNotes: null,
      clientNotes: null,
      internalNotes: null
    });
    this.jobLineItemForm = fb.group({
      printer: [null, Validators.required, forbiddenNamesValidator],
      contact: [null, null, forbiddenNamesValidator],
      vendor: [null, null, forbiddenNamesValidator],
      designator: [null],
      startDate: [null],
      filesDate: [null],
      noOfPeriods: [null, Validators.max(52)],
      proofsDate: [null],
      periodLength: [null],
      proofsApprovedDate: [null],
      materialShippingDate: [null],
      materialDeliveryDate: [null],
      mediaType: [null],
      unitQty: [null],
      venueType: [null],
      dma: [null, null],
      designQty: [null],
      unitHeight: [null],
      unitWidth: [null],
      state: [null],
      stateCode: [null],
      substrateType: [null],
      materials: [0.00],
      salesTax: [0.00],
      shippingCost: [0.00],
      shippingType: [null],
      installCost: [0.00],
      printerNetTotal: [0.00],
      oiCommissionAmt: [null],
      oiCommissionPercentage: [null],
      clientMaterialCost: [null],
      clientCostTotal: [null],
      clientNotes: [null, Validators.maxLength(2000)],
      vendorNotes: [null, Validators.maxLength(2000)],
      productionNotes: [null, Validators.maxLength(2000)],
      internalNotes: [null, Validators.maxLength(2000)],
    });

    this.getClientProducts();
    this.getItemStatuses();
    //this.getVendorsList();
    this.getTermsOfPeriod();
    this.getShippingOptions();

    this.fixedReferencePercentage = this.data?.job?.client?.oiRev || 0.00;

    //get programmic
    if (this.data.lineItemData) {
      this.isForDuplicate = this.data.isForDuplicate;
      if (this.isForDuplicate) {
        this.data.lineItemData.lineItemId = '';
      }
      this.populateLineItemModal();
    }
    else { /* to show media details required field - add units method initiated to open media details section */
      this.addUnits();
    }
    if (data) {
      this.clientId = data.clientId;
    }
  }

  @ViewChild('printerInputRef', { read: MatAutocompleteTrigger })
  public printerAutoCompleteTrigger: MatAutocompleteTrigger;

  @ViewChild('vendorInputRef', { read: MatAutocompleteTrigger })
  public shipVendorAutoCompleteTrigger: MatAutocompleteTrigger;

  @ViewChild('vendorRep1', { read: MatAutocompleteTrigger })
  public contactAutoCompleteTrigger: MatAutocompleteTrigger;

  public geopathSpotIdRegex:RegExp = /^[0-9,]*$/
  public deliveryNumericPatternRegEx = /^[0-9]{1,7}(\.[0-9]{0,2})?$/;

  public vendorTypes: VendorType[] = [];
  public printerVendorTypes: VendorType[] = [];

  public editorConfig = LineItemCkEditorConfig;
  public TabLinkType = TabLinkType;
  public selectedMedia = 'Geopath';
  public spotId = '';
  public isStandart = true;
  public isShowDetails = false;
  public timeAndCostData: CostCalculation;
  public showClientNotesEditor = false;
  public showVendorNotesEditor = false;
  public showProductionNotesEditor = false;
  public showInternalNotesEditor = false;
  public mediaDetailsForm: FormGroup;

  public clientId: string;

  public destroy: ReplaySubject<any> = new ReplaySubject<any>(1);
  public shippingOptions: any[] = [] ;
  public referenceCalculatedValue = 0.00;
  public fixedReferencePercentage = 0.00;
  public oiPercentage = 0.00;
  public selectedDesignator: any;
  public states: any[] = [];
  public subtrateTypes: any[] = [];
  public mediaTypes: any[] = [];
  public placeTypes: any[] = [];
  public classificationTypes: any[] = [];
  public placementTypes: any[] = [];
  public constructionTypes: any[] = [];
  public targetMarketTypes: string[] = ['DMA', 'CBSA', 'County'];
  public dmaItems: any[] = [];
  public cbsaItems: any[] = [];
  public targetAudienceItems: any[] = [];
  public periodLengths: AppAutocompleteOptionsModel[]

  public selectDmaPanelContainer: string;
  public dmaLimit = 10;
  public dmaOffset = 0;
  public isDmaLoading = false;
  public dmaSearchPayload: string;
  public dmaPerPage;
  public dmaCompleted;
  public dmaInvalidEntry = false;

  public selectCbsaPanelContainer: string;getVendorById
  public cbsaLimit = 10;
  public cbsaOffset = 0;
  public isCbsaLoading = false;
  public cbsaSearchPayload: string;
  public cbsaPerPage;
  public cbsaCompleted;
  public cbsaInvalidEntry = false;

  public selectTargetAudiencePanelContainer: string;
  public targetAudienceLimit = 20;
  public targetAudienceOffset = 0;
  public isTargetAudienceLoading = false;
  public targetAudienceSearchPayload: any;
  public targetAudiencePerPage =
    this.targetAudienceOffset + this.targetAudienceLimit;
  public targetAudienceCompleted;
  public targetAudienceInvalidEntry = false;

  public notesForm: FormGroup;

  public clientProduts: any[] = [];
  public isClientProdutsLoading = false;
  public clientProdutsTotal: string | number;

  public lineItemTypeItems: any[] = [];
  public isLineItemTypeItemsLoading = false;
  public lineItemTypeTotal: string | number;

  public itemStatuses: any[] = [];
  public isItemStatusesLoading = false;
  public itemStatusesTotal: string | number;

  public vendors: any[] = [];
  public isVendorsLoading = false;
  public vendorsTotal: string | number;

  public shipVendors: any[] = [];
  public isShipVendorsLoading = false;
  public shipVendorsTotal: string | number;

  public primaryVendorsRep: any[] = [];
  public isPrimaryVendorsRepLoading = false;
  public primaryVendorsRepTotal: string | number;

  public secondaryVendorsRep: any[] = [];
  public isSecondaryVendorsRepLoading = false;
  public secondaryVendorsRepTotal: string | number;

  public selectedProduct: any;

  public primaryVendorOrgId: any;

  public primaryVendorRep: any;
  public secondartVendorRep: any;

  public jobLineItemForm: FormGroup;

  public parentVendorName: string;
  public parentVendorId: string;

  public parentCompanyId: any;
  public vendorsOffset = 0;
  public vendorsLimit = 10;
  public vendorsComplete = false;
  public vendorsPerPage;

  public shipVendorsOffset = 0;
  public shipVendorsLimit = 10;
  public shipVendorsComplete = false;
  public shipVendorsPerPage;

  public vendorsRepPrOffset = 0;
  public vendorsRepPrLimit = 10;
  public vendorsRepPrComplete = false;
  public vendorsRepPrPerPage;

  public vendorsRepScOffset = 0;
  public vendorsRepScLimit = 10;
  public vendorsRepScComplete = false;
  public vendorsRepScPerPage;

  public selectVendorPanelContainer;
  public selectVendorRepPrPanelContainer;
  public selectPrinterPanelContainer;
  public selectVendorRepScPanelContainer;
  public selectCompanyPanelContainer;
  public selectResellerRepContainer;

  public isPrimaryVendorsRepComplete: boolean;
  public isSecondaryVendorsRepComplete: boolean;

  public designatorItems: any[] = [];

  public vendorsSearchPayload;

  public primaryVendorsPayload;
  public secondaryVendorsPayload;

  public companyId: string;
  public companiesOffset = 0;
  public companies: any[] = [];
  public companiesLimit = 10;
  public companiesComplete = false;
  public companiesPerPage;
  public companiesLoading = false;
  public companiesTotal;
  public companiesPayload;

  public resellersOffset = 0;
  public resellers: any[] = [];
  public resellersLimit = 10;
  public resellersComplete = false;
  public resellersPerPage;
  public resellersLoading = false;
  public resellersTotal;
  public resellersPayload;

  public lineItemId: any;

  public lineItemType: any;

  public itemStatus: any;

  public lineItemTypeError = false;

  lineItemTypeSelectedValue;
  itemStatusSelectedValue;
  clientProductSelectedValue;

  public targetChosenItem;

  public inventoryNum = undefined;

  // reGex allow only number and comma type
  public impressionNumericPatternRegEx = /^[0-9,]*$/;
  public targetRatingPtsRegEx = /^(?=.*[0-9])\d{0,6}(\.\d{0,2})?$/;
  public disableEdit = false;
  public pureNumbers = /^[0-9]*$/;

  private unlistener: () => void;
  @ViewChildren(MatAutocompleteTrigger)
  autoRefs: QueryList<MatAutocompleteTrigger>;

  public vendorsRepPrPagination = {
    page: 0,
    pageSize: 0,
    perPage: 10,
    total: 0
  };
  public vendorsRepScPagination = {
    page: 0,
    pageSize: 0,
    perPage: 10,
    total: 0
  };

  public programmaticResellerPagination:VendorTypesPagination = {
    page: 1,
    perPage: 10,
    total:0
  };
  public isVendorResellerLoading = false;
  public companySearchtext:string;

  public spotMinutes = SPOT_MINUTES;
  public spotSeconds = SPOT_SECONDS;
  public isForDuplicate = false;
  public showMediaMeasurement = true;
  // this field using for update the list
  public isFormUpdated = false;

  public staticDMAItems = [
    {
      id: "Nationwide",
      name: "Nationwide"
    },
    {
      id: "Multiple Markets",
      name: "Multiple Markets"
    }
  ];

  public goTolineItemId = '';

  public get showEditActions() {
    return this.data.lineItemData && !this.isForDuplicate;
  }
  public productsPerPage = '10';
  public lastRefreshedDate!: string;
  public lastRefreshedTime = new Date();
  public refreshLineItem$: Subject<any> = new Subject<any>();
  public submitBtnDis = false;
  public LineItemStatus = LineItemStatus;

  public revisedDate = new FormControl('');
  public maxDate = new Date('12/31/9999');
  public minDate = new Date();
  public clickformStream$: Subject<any> = new Subject<any>();
  ngOnInit() {
    this.refreshLastUpdatedTime();
    this.jobLineItemForm.controls.printer.valueChanges
      .pipe(
        debounceTime(200),
        filter((value) => typeof value === 'string'), // guard
        // distinctUntilChanged(), // value changedetect issues
        startWith(''),
        takeUntil(this.destroy)
      )
      .subscribe((value) => {

        if (!!value.length) {  // Avoiding startwith empty/Initially time, make empty.
          this.jobLineItemForm.patchValue({ contact: null }, { emitEvent: false });
        }
        this.getVendorsList(
          this.vendorsPerPage,
          true,
          value
            ? {
              filters: { name: value }
            }
            : {},
          true
        );
      });

      this.jobLineItemForm.controls.vendor.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        startWith(''),
        takeUntil(this.destroy)
      )
      .subscribe((value) => {
        if (typeof value === 'string')
          this.getShipVendorsList(
            this.shipVendorsPerPage,
            true,
            value
              ? {
                filters: { name: value }
              }
              : {},
            true
          );
      });

      this.jobLineItemForm.controls.contact.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        startWith(''),
        takeUntil(this.destroy),
        filter(res => typeof res === 'string')
      ).subscribe((value) => {
        //when search is happen pagination change to initial page.
        this.vendorsRepPrPagination.page = 0;
        this.vendorsRepPrPagination.pageSize = 0;
        this.vendorsRepPrPagination.total = 0;
        this.getVendorsByOrgId(false, {search: value});
      });
    this.jobLineItemForm.controls.dma.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        startWith(''),
        takeUntil(this.destroy)
      )
      .subscribe((value) => {
        if (this.dmaPerPage && typeof value === 'string') {
          this.getDmaList(this.dmaPerPage, true, value ? value : '', true);
        }
      });
    if (this.document.querySelector('.line-item-body')) {
      this.unlistener = this.renderer.listen(
        this.document.querySelector('.line-item-body'),
        'scroll',
        () => {
          this.autoRefs.forEach((ref) => {
            ref.closePanel();
          });
        }
      );
    }
    this.vendorService
      .getVendorsTypes()
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        // Programmatic // Reseller
        this.vendorTypes = res?.results.filter(type=>type?.name.toLowerCase().includes('programmatic') || type?.name.toLowerCase().includes('reseller'));
        this.printerVendorTypes = res?.results.filter(type=>type?.name.toLowerCase().includes(VendorTypeNames.PRODUCTION) || type?.name.toLowerCase().includes(VendorTypeNames.INSTALLER));
        this.getVendorProgrammaticAndReseller();
        this.getVendorsList();
      });
    this.getShipVendorsList();
    this.checkForEditPermission();
  }

  public refreshDropdowns() {
    const lineItemFormControl = this.jobLineItemForm.controls;
    this.getClientProducts();
    this.getVendorsList();
    this.getShipVendorsList();
    this.refreshJobDetails();
    const printerId = lineItemFormControl['printer'].value?._id;
    const vendorId = lineItemFormControl['vendor'].value?._id;
    const contactId = lineItemFormControl['contact'].value?._id;
    const designatorId = lineItemFormControl['designator'].value?._id;
    this.refreshVendor(printerId, vendorId, contactId, designatorId);
    this.lastRefreshedTime = new Date();
  }
  private refreshLastUpdatedTime() {
    interval(3000)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        this.lastRefreshedDate = formatDistance(
          new Date(),
          this.lastRefreshedTime
        );
      });
  }
  private refreshVendor(printerId, vendorId, contactId, designatorId){
    if (printerId) {
      this.vendorService
        .getVendorById(printerId)
        .pipe(
          catchError((err) => EMPTY),
          filter((res) => {
            if (res.error) {
              this.jobLineItemForm['controls']['printer'].patchValue('');
              this.jobLineItemForm['controls']['vendor'].patchValue('');
              this.jobLineItemForm['controls']['contact'].patchValue('');
              this.jobLineItemForm['controls']['designator'].patchValue('');
              this.selectedDesignator = null;
              this.cdRef.markForCheck();
              return false;
            }
            return true;
          }),
          mergeMap((res) => {
            this.jobLineItemForm['controls']['printer'].patchValue(res);
            this.onVendorSelectChanged(res, false);
            const vendorRepRequests = [];
            if (contactId) {
              vendorRepRequests.push(
                this.vendorService.getContactById(contactId)
                  .pipe(
                    catchError((err) => of('')),
                    tap((repRes) => {
                      this.jobLineItemForm['controls']['contact'].patchValue(repRes);
                    })
                  )
              );
            }
            if (vendorId) {
              this.getDesignator(vendorId, designatorId);
              vendorRepRequests.push(
                this.vendorService.getVendorById(vendorId)
                  .pipe(
                    catchError((err) => of('')),
                    tap((repRes) => {
                      this.jobLineItemForm['controls']['vendor'].patchValue(repRes);
                    })
                  )
              );
            }
            return forkJoin(vendorRepRequests);
          })
        )
        .subscribe((responses) => {
          responses.forEach((res, index) => {
            this.cdRef.markForCheck();
          });
        });
    }
  }

  /* method used to fetch job details to update dependent fields */
  private refreshJobDetails() {
    this.jobDetailsService.getJobDetailsByJobId(this.data.job?._id)
      .pipe(takeUntil(this.destroy))
      .subscribe((res: JobDetails) => {
        if (res?._id)
          this.data.job = Helper.deepClone(res);

        this.fixedReferencePercentage = this.data?.job?.client?.oiRev || 0.00;
        this.calculateTotal();
        this.cdRef.markForCheck();
      });
  }

  private checkForEditPermission() {
    const permissions = this.auth.getUserPermission(UserRole.PRINT_PRODUCTION);
    if (permissions && !permissions.edit) {
      this.jobLineItemForm.disable();
      this.disableEdit = true;
      this.editorConfig.readOnly = true;
    }
  }
  public addUnits() {
    if (!this.isShowDetails) {
      this.isShowDetails = true;
      this.populateMediaDetails();
    }
  }

  public populateMediaDetails(frame?: any) {
    this.addressServiceService
      .getStateSearch()
      .pipe(
        switchMap(({ results }) => {
          this.states = results;
          return this.jobsService.getMediaTypes();
        }),
        switchMap(({ results }) => {
          this.mediaTypes = results;
          return this.jobsService.getSubStrate();
        }),
        switchMap(({ results }) => {
          this.subtrateTypes = results;
          return this.jobsService.getPlaceTypes();
        }),
        switchMap(({ results }) => {
          this.placeTypes = results;
          return this.mediaDetailsService.getClassificationTypes();
        }),
        switchMap(({ classification_types }) => {
          this.classificationTypes = classification_types;
          this.setUpPlacementType();
          return this.mediaDetailsService.getConstructionTypes();
        })
      )
      .subscribe(({ construction_types }) => {
        this.constructionTypes = construction_types;
        if (frame) {
          // this.patchMediaDetailsWithSpot(frame);
        } else {
          const placementTypeValue = this.placementType.find(
            (option) =>
              option.name == this.data?.lineItemData?.media?.placementType
          );
        }
        this.cdRef.markForCheck();
      });
    this.getDmaList();
  }

  public getDmaList(
    perPage = this.dmaOffset + this.dmaLimit,
    noLoader = false,
    q?: string,
    isSearch = false
  ) {
    this.dmaInvalidEntry = false;
    this.dmaSearchPayload = q || '';
    this.isDmaLoading = true;
    this.mediaDetailsService
      .marketsSearch('dma', this.dmaSearchPayload, perPage, noLoader)
      .pipe(
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.dmaInvalidEntry = true;
          }
          return of([]);
        })
      )
      .subscribe((res) => {
        this.dmaItems = res.markets;
        this.dmaPerPage = perPage;
        if (!isSearch) {
          this.dmaOffset += this.dmaLimit;
        }
        this.dmaCompleted = res.number_of_pages === 1;
        this.isDmaLoading = false;
        this.cdRef.detectChanges();
      });
  }

  displayWithNameFn(value) {
    return value?.name ?? '';
  }

  displayWithDescFn(value) {
    return value?.description ?? '';
  }

  trackById(idx: number, item) {
    return item?.id ?? idx;
  }

  public updateSelectDmaContainer() {
    this.selectDmaPanelContainer = '.job-media-dma-autocomplete';
  }

  public updateSelectCbsaContainer() {
    this.selectCbsaPanelContainer = '.media-cbsa-autocomplete';
  }

  public updateSelectTargetAudienceContainer() {
    this.selectTargetAudiencePanelContainer =
      '.media-target-audience-autocomplete';
  }

  public populateLineItemModal() {
    this.itemStatus = this.data.lineItemData.itemStatus;
    this.itemStatusSelectedValue = this.data.lineItemData.itemStatus;
    this.selectedProduct = this.data.lineItemData.clientProduct;
    this.clientProductSelectedValue = this.data.lineItemData.clientProduct;
    this.jobLineItemForm.patchValue(this.data.lineItemData);
    const lineItemFormControl = this.jobLineItemForm.controls;

    if (this.data.lineItemData.printer) {
      lineItemFormControl.printer.setValue(this.data.lineItemData.printer);
    }
    if (this.data.lineItemData.periodLength) {
      lineItemFormControl.periodLength.setValue(this.data.lineItemData.periodLength._id);
    }
    if (this.data.lineItemData.mediaType) {
      lineItemFormControl.mediaType.setValue(this.data.lineItemData.mediaType._id);
    }
    if (this.data.lineItemData.venueType) {
      lineItemFormControl.venueType.setValue(this.data.lineItemData.venueType._id);
    }
    if (this.data.lineItemData.state) {
      lineItemFormControl.state.setValue(this.data.lineItemData.state);
    }
    if (this.data.lineItemData.shippingType) {
      lineItemFormControl.shippingType.setValue(this.data.lineItemData.shippingType?._id);
    }
    if(this.data.lineItemData?.clientNotes?.length > 0) {
      this.showClientNotesEditorFunc();
    }
    if(this.data.lineItemData?.vendorNotes?.length > 0) {
      this.showVendorNotesEditorFunc();
    }
    if(this.data.lineItemData?.productionNotes?.length > 0) {
      this.showProductionNotesEditorFunc();
    }
    if(this.data.lineItemData?.internalNotes?.length > 0) {
      this.showInternalNotesEditorFunc();
    }

    this.calculateTotal();
    this.getVendorsList();
    this.getShipVendorsList();
    this.populateMediaDetails();


    this.parentVendorName = this.data.lineItemData?.printer?.parentCompany;
    this.primaryVendorOrgId = this.data.lineItemData?.printer?.organizationId
      ? [this.data.lineItemData.printer.organizationId]
      : [];
    this.parentVendorId = this.data.lineItemData?.printer?.parentCompany?._id;

    this.companyId = this.data?.lineItemData?.company?.organizationId ?? '';
    this.revisedDate.setValue(this.data?.lineItemData?.revisedAt ?? null);

    this.createdDateAt = new Date(this.data?.lineItemData?.createdAt);

    this.vendorsRepPrPagination = {
      page: 0,
      pageSize: 0,
      perPage: 10,
      total: 0
    };
    this.vendorsRepScPagination = {
      page: 0,
      pageSize: 0,
      perPage: 10,
      total: 0
    };
    if (this.data.lineItemData?.printer?.parentCompany) {
      this.vendorService.getDesignatorByVendorId(this.data.lineItemData.printer?._id).subscribe((res) => {
        const vendorDetail = res;
        const childrenBody = {
          filters: {
            parentIds: [vendorDetail?.parentCompanyId]
          }
        };
        const childrenParams = {
          isParentSearch: true,
          onlyChildIds: true
        };
        combineLatest([
          this.vendorService.getDesignatorByVendorId(vendorDetail?.parentCompanyId),
          this.vendorService
            .vendorsListSearch(childrenBody, '10', false, childrenParams)
            .pipe(map((res) => res?.results[0]))
        ]).subscribe((result) => {
          const childOrgs = result[1]['childOrgs'];
          const vendorIds = [result[0]['organizationId']];
          vendorIds.push(...childOrgs);
          this.primaryVendorOrgId = vendorIds;
          this.parentCompanyId = vendorIds;
          this.cdRef.detectChanges();
          this.getVendorsByOrgId(false, {});
          this.getVendorsByOrgId(true, {});
        });
      });

    } else if (this.data.lineItemData?.printer?.organizationId) {
      this.getVendorsByOrgId(false, {});
    }

    this.data.lineItemData?.vendor?._id ? this.getDesignator(this.data.lineItemData?.vendor?._id) : '';

    if (this.data.lineItemData.designator) {
      this.onDesignatorChange(this.data.lineItemData.designator);
    }
    if (this.data?.lineItemData?.resellerRep) {
      this.getResellers();
      this.onResellerSelection(this.data.lineItemData.resellerRep);
    }
    this.cdRef.markForCheck();
  }

  public compareObjects(o1: any, o2: any): boolean {
    return o1._id === o2?._id;
  }

  /**
   *
   * @returns formated vendor search
   */

  private formatPayloadSearchData() {
    let vendorSearchPayload: VendorSearchPayload = {};
    vendorSearchPayload = {
      filters: {
        type:this.vendorTypes.map(type=>type._id)
      }
    };
    if(this.companySearchtext){
      vendorSearchPayload.filters.name = this.companySearchtext;
    }
    return vendorSearchPayload;
  }

  /**
   * Reset the vendor Programmatic And Reseller pagination
   */

  public resetVendorResellerPagination(){
    this.programmaticResellerPagination ={
      page: 1,
      perPage:10
    };
  }

  /**
   * load more vendor Programmatic And Reseller
   * @returns if current data count equeal or greater
   */

  public loadMoreVendorProgrammaticAndReseller() {
    const currentSize =
      this.programmaticResellerPagination.page *
      this.programmaticResellerPagination.perPage;
    if (currentSize > this.programmaticResellerPagination.total) return;
    this.isVendorResellerLoading = true;
    this.programmaticResellerPagination.page += 1;
    this.cdRef.markForCheck();
    this.getVendorProgrammaticAndReseller(true);
  }

  /**
   * This function used to get the vendor based on type Programmatic And Reselle
   * @param moreVendors boolean; if true concate the response;
   */

  public getVendorProgrammaticAndReseller(moreVendors = false) {
    this.vendorService
      .getVendorBySearch(this.formatPayloadSearchData(), this.programmaticResellerPagination, {'active':'name', 'direction': 'asc'})
      .pipe(
        filter((res) => !!res.results)
      )
      .subscribe((res) => {
        this.isVendorResellerLoading = false;
        if(!moreVendors){
          this.companies = res?.results ?? [];
        }else{
          this.companies = [...this.companies, ...res?.results ?? []];
        }
        this.programmaticResellerPagination.total = res?.['pagination']?.['found'] ?? 0;
        this.cdRef.markForCheck();
      },error=>{
        //Hide loader
        this.isVendorResellerLoading = false;
        this.cdRef.markForCheck();
        if (error?.error?.message) {
          this._showsAlertMessage(error?.error?.message);
          return;
        }else if(error?.error?.error){
          this._showsAlertMessage(error?.error.error);
          return;
        }
        this._showsAlertMessage(
          'Something went wrong, Please try again later'
        );
      });
  }

  public getResellers(
    perPage = this.resellersLimit + this.resellersOffset,
    noLoader = false,
    search = '',
    isSearch = false
  ) {
    if(!this.companyId) return;
    this.resellersPayload = search || '';
    this.vendorService
      .contactsSearch(search, perPage, this.companyId, noLoader)
      .subscribe((res) => {
        this.resellers = res.results;
        this.resellersPerPage = perPage;
        this.resellersTotal = res.pagination.total;
        if (!isSearch) {
          this.resellersOffset += this.resellersLimit;
        }
        this.resellersComplete = this.resellersOffset >= this.resellersTotal;
        this.resellersLoading = false;
        this.cdRef.detectChanges();
      });
  }

  public getVendorsList(
    perPage = this.vendorsLimit + this.vendorsOffset,
    noLoader = false,
    body = {},
    isSearch = false
  ) {
    this.isVendorsLoading = true;
    let payload: any = body || {};
    payload['filters'] = {
      ...payload?.['filters'],
      type: this.printerVendorTypes.map(type => type._id),
    };
    this.vendorService
      .vendorsListSearch(
        payload,
        String(perPage),
        noLoader
      ) /* Changed to new API to get only child vendors */
      .pipe(takeUntil(this.destroy))
      .subscribe((res) => {
        this.vendors = res.results;
        this.vendorsPerPage = perPage;
        this.vendorsTotal = res.pagination.found;
        if (!isSearch) {
          this.vendorsOffset += this.vendorsLimit;
        }
        this.vendorsComplete = this.vendorsOffset >= this.vendorsTotal;
        this.isVendorsLoading = false;
        this.cdRef.detectChanges();
      });
  }

  /* new method to get ship vendors without type filters  */
  public getShipVendorsList(
    perPage = this.shipVendorsLimit + this.shipVendorsOffset,
    noLoader = false,
    body?,
    isSearch = false
  ) {
    this.isShipVendorsLoading = true;
    this.vendorsSearchPayload = body || {};
    this.vendorService
      .vendorsListSearch(
        body,
        String(perPage),
        noLoader
      ) /* Changed to new API to get only child vendors */
      .pipe(takeUntil(this.destroy))
      .subscribe((res) => {
        this.shipVendors = res.results;
        this.shipVendorsPerPage = perPage;
        this.shipVendorsTotal = res.pagination.total;
        if (!isSearch) {
          this.shipVendorsOffset += this.shipVendorsLimit;
        }
        this.shipVendorsComplete = this.shipVendorsOffset >= this.shipVendorsTotal;
        this.isShipVendorsLoading = false;
        this.cdRef.detectChanges();
      });
  }

  vendorTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  vendorRepPrTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  vendorRepScTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  resellersRepScTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  companiesTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  selectVendorDisplayWithFn(value) {
    return value?.name ?? '';
  }

  displayWithPlacmentFn(placementValue: PlacementType) {
    return placementValue?.name ?? '';
  }

  vendorRepPrimaryDisplayWithFn(value) {
    const separator = value?.firstName && value?.lastName ? ' ' : '';
    return (value?.firstName ?? '') + separator + (value?.lastName ?? '');
  }

  public updateSelectVendorContainer() {
    this.selectVendorPanelContainer =
      '.add-line-items-vendor-select-autocomplete';
  }

  public updateSelectVendorRepPrContainer() {
    this.selectVendorRepPrPanelContainer =
      '.add-line-items-vendor-rep-pr-autocomplete';
  }
  public updateSelectPrinterContainer() {
    this.selectPrinterPanelContainer =
      '.add-line-items-vendor-select-autocomplete';
  }

  public updateSelectVendorRepScContainer() {
    this.selectVendorRepScPanelContainer =
      '.add-line-items-vendor-rep-sc-autocomplete';
  }

  public updateSelectCompanies() {
    this.selectCompanyPanelContainer = '.add-line-items-companies-autocomplete';
  }

  public updateResellersContainer() {
    this.selectResellerRepContainer = '.add-line-items-resellers-autocomplete';
  }

  public getClientProducts(
    perPage = '10',
    noLoader = false,
    checkSelectedProductId = false
  ) {
    this.isClientProdutsLoading = true;
    this.jobsService
      .getProductsByClientId(this.data?.job?.client?._id, perPage, noLoader, true)
      .subscribe((res) => {
        this.productsPerPage = perPage;
        this.clientProduts = res.results;
        this.clientProdutsTotal = res?.pagination?.total;
        this.isClientProdutsLoading = false;

        // for refresh, to check the item is deleted or not.
        if (checkSelectedProductId) {
          this.clientsService
            .getClientProduct(
              this.data.job.client?._id,
              this.clientProductSelectedValue?._id
            )
            .subscribe((selectedProduct: any) => {
              if (!selectedProduct) {
                this.clientProductSelectedValue = undefined;
              }
            });
        }
      });
  }

  public onScrollClientProducts(value) {
    this.getClientProducts(value, true);
  }

  public onProductNameChanged(value) {
    this.selectedProduct = value;
  }

  public getLineItemTypes(perPage = '10', noLoader = false) {
    this.isLineItemTypeItemsLoading = true;
    this.contractsService
      .lineItemTypeSearch({}, perPage, noLoader)
      .subscribe((res) => {
        this.lineItemTypeItems = res.results;
        this.lineItemTypeTotal = res.pagination.total;
        this.isLineItemTypeItemsLoading = false;
      });
  }

  public onScrollLineItemTypes(value) {
    this.getLineItemTypes(value, true);
  }

  public getItemStatuses(perPage = '10', noLoader = false) {
    this.isItemStatusesLoading = true;
    this.jobsService
      .itemStatusSearch({}, perPage, noLoader)
      .subscribe((res) => {
        this.itemStatuses = res.results;
        this.itemStatusesTotal = res.pagination.total;
        this.isItemStatusesLoading = false;

        /* check if its new line item - set item status default value (NEW) and assign already used values*/
        if (
          !this.data?.lineItemData &&
          !this.data?.lineItemData?._id &&
          this.itemStatuses.length
        ) {
          this.itemStatusSelectedValue = this.itemStatuses.filter(
            (status) => status.name == this.LineItemStatus.NEW
          )[0];
          this.itemStatus = this.itemStatusSelectedValue;
        }
      });
  }

  public onScrollStatuses(value) {
    this.getItemStatuses(value, true);
  }
  public onScrollVendors(value) {
    this.getVendorsList(value)
  }

  public onVendorSelectChanged(value, byCompany = true) {
    this.jobLineItemForm.patchValue(
      {
        contact: null
      },
      { emitEvent: false }
    );

    this.vendorsRepPrPagination = {
      page: 0,
      pageSize: 0,
      perPage: 10,
      total: 0
    };
    this.vendorsRepScPagination = {
      page: 0,
      pageSize: 0,
      perPage: 10,
      total: 0
    };

    if (value.parentCompanyId && byCompany) {
      const childrenBody = {
        filters: {
          parentIds: [value.parentCompanyId]
        }
      };
      const childrenParams = {
        isParentSearch: true,
        onlyChildIds: true
      };
      combineLatest([
        this.vendorService.getDesignatorByVendorId(value.parentCompanyId),
        this.vendorService
          .vendorsListSearch(childrenBody, '10', false, childrenParams)
          .pipe(map((res) => res?.results[0]))
      ]).subscribe((result) => {
        const childOrgs = result[1]['childOrgs'];
        const vendorIds = [result[0]['organizationId']];
        vendorIds.push(...childOrgs);
        this.primaryVendorOrgId = vendorIds;
        this.parentCompanyId = vendorIds;
        this.cdRef.detectChanges();
        this.getVendorsByOrgId(false, {});
        // this.getVendorsByOrgId(true, {});
      });
    } else if (value.organizationId) {
      this.parentCompanyId = this.primaryVendorOrgId; /* to init secondaryVendorsRep assigned primary venodr post param */
      this.primaryVendorOrgId = [value.organizationId];
      this.parentCompanyId = [value.organizationId];
      this.getVendorsByOrgId(false, {});
      // this.getVendorsByOrgId(true, {});
      // this.secondaryVendorsRep = [];
      this.cdRef.detectChanges();
    }
  }

  public onShippingVendorChanged(value) {
    this.jobLineItemForm.patchValue(
      {
        designator: null,
      },
      { emitEvent: false }
    );
    this.designatorItems = [];
    this.selectedDesignator = null;
    this.getDesignator(value._id);
  }

  public getDesignator(vendorId, selectedDesignator = null) {
    if(vendorId){
      this.vendorService
        .getDesignatorByVendorId(vendorId, String(10))
        .subscribe(({ shippingAddress }) => {
          if (shippingAddress?.length) {
            this.designatorItems = shippingAddress;
            if (selectedDesignator) {
              const findDesignator = shippingAddress.find(
                (designator) =>
                  designator._id == selectedDesignator
              );
              this.jobLineItemForm['controls']['designator'].patchValue(findDesignator);
              this.selectedDesignator = findDesignator;
            }
          }
        });
    }

  }

  public onDesignatorChange(value) {
    this.selectedDesignator = value;
  }

  openNewVendorWindow() {
      window.open(`${location.origin}/records-management-v2/vendors/add`, '_blank');
  }

  openNewContactWindow() {
    const url = `${location.origin}/records-management-v2/vendors/${this.jobLineItemForm.controls.printer.value?._id}?tab=createContacts`
    window.open(url, '_blank');
  }

  openNewDesignator() {
    const url = `${location.origin}/records-management-v2/vendors/${this.jobLineItemForm.controls?.vendor?.value?._id}?tab=createShippingAddress`
    window.open(url, '_blank');
  }

  dateValueChange() {
    const dtValue = this.revisedDate.value;
    if (!dtValue) {
      document.getElementById('revisedDt')['value'] = dtValue;
      this.revisedDate.setErrors(null);
    }
    else if (new Date(dtValue).getFullYear() > 9999) {
      this.revisedDate.setErrors({ invalid: true });
    }
    this.cdRef.markForCheck();
  }

  public saveLineItem() {
    this.submitBtnDis = true;

    if (
      this.jobLineItemForm.invalid
    ) {
      this.jobLineItemForm.markAllAsTouched();
      this.submitBtnDis = false;
      return;
    }
    const formData = this.jobLineItemForm.value;
    const saveLineItemPayload = {
      clientProduct: this.selectedProduct?._id,
      itemStatus: this.itemStatus?._id,
      printer: formData.printer?._id,
      contact: formData.contact?._id,
      vendor: formData.vendor?._id,
      designator: formData.designator?._id,
      startDate: this.datepipe.transform(formData.startDate, 'MM/dd/yyyy') ?? null,
      filesDate: this.datepipe.transform(formData.filesDate, 'MM/dd/yyyy') ?? null,
      noOfPeriods: formData.noOfPeriods,
      proofsDate: this.datepipe.transform(formData.proofsDate, 'MM/dd/yyyy') ?? null,
      periodLength: formData.periodLength,
      proofsApprovedDate: this.datepipe.transform(formData.proofsApprovedDate, 'MM/dd/yyyy') ?? null,
      materialShippingDate: this.datepipe.transform(formData.materialShippingDate, 'MM/dd/yyyy') ?? null,
      materialDeliveryDate: this.datepipe.transform(formData.materialDeliveryDate, 'MM/dd/yyyy') ?? null,
      mediaType: formData.mediaType,
      unitQty: formData.unitQty,
      venueType: formData.venueType,
      dma: {
        id: formData.dma?.id,
        name: formData.dma?.name
      },
      designQty: formData.unitQty,
      unitHeight: formData.unitHeight,
      unitWidth: formData.unitWidth,
      state: formData.state?._id,
      stateCode: formData.state?.short_name,
      substrateType: formData.substrateType?._id,
      materials: Number(formData.materials),
      salesTax: Number(formData.salesTax),
      shippingCost: Number(formData.shippingCost),
      shippingType: formData.shippingType,
      installCost: Number(formData.installCost),
      printerNetTotal: formData.printerNetTotal,
      oiCommissionAmt: Number(formData.oiCommissionAmt),
      oiCommissionPercentage: Number(formData.oiCommissionPercentage),
      clientMaterialCost: formData.clientMaterialCost,
      clientCostTotal: formData.clientCostTotal,
      clientNotes: formData.clientNotes,
      vendorNotes: formData.vendorNotes,
      productionNotes: formData.productionNotes,
      internalNotes: formData.internalNotes
    };

    if (!this.isForDuplicate && this.data.lineItemData) {
      this.jobsService
        .updateLineItem(
          this.data.job._id,
          saveLineItemPayload,
          this.data.lineItemData._id
        )
        .pipe(finalize(() => this.submitBtnDis = false))
        .subscribe(({ message }) => {
          this.snackbarService.showsAlertMessage(message);
          this.jobsService
            .getLineItemDetails(this.data.job._id, this.data.lineItemData._id)
            .subscribe((res) => {
              this.isFormUpdated = true;
              this.data.lineItemData = res;
              this.cdRef.detectChanges();
            });
        });
    } else {
      this.jobsService
        .saveLineItem(this.data.job._id, saveLineItemPayload)
        .pipe(finalize(() => this.submitBtnDis = false))
        .subscribe(({ message, data }) => {
          if (message !== null) {
            this.snackbarService.showsAlertMessage(message);
          }
          if(data?.id){
            this.jobsService
              .getLineItemDetails(this.data.job._id, data['id'])
              .subscribe((res) => {
                this.isFormUpdated = true;
                //Add the new line items
                this.data.lineItemData = res;
                //Set duplicate false once add new items
                this.data.isForDuplicate = false;
                this.isForDuplicate = false;
                //Set the pagination
                // const pagination = this.data.pagination;
                // pagination.found = pagination?.found + 1;
                // pagination.page = pagination?.found;
                // pagination.pageSize = pagination?.found;
                // pagination.total = pagination?.found;
                // this.data.pagination = pagination;
                // Set the form updated - it'll refrese the line item table once cloase the line items
                // this.cdRef.markForCheck();
                this.cdRef.detectChanges();
              });
          }
        });
    }
  }

  public getVendorsByOrgId(isSecondary = false, body?) {
    const vendorIds = isSecondary
      ? this.parentCompanyId
      : this.primaryVendorOrgId;
    if (vendorIds) {
      let paginationParams;
      if (isSecondary) {
        this.secondaryVendorsPayload = body || {};
        this.isSecondaryVendorsRepLoading = true;
        this.vendorsRepScPagination['page'] =
          this.vendorsRepScPagination['page'] + 1;
        paginationParams = this.vendorsRepScPagination;
      } else {
        this.primaryVendorsPayload = body || {};
        this.isPrimaryVendorsRepLoading = true;
        this.vendorsRepPrPagination['page'] =
          this.vendorsRepPrPagination['page'] + 1;
        paginationParams = this.vendorsRepPrPagination;
      }
      if (
        paginationParams['total'] == 0 ||
        paginationParams['page'] <= paginationParams['total']
      ) {
        const contactBody = {
          search: body['search'] || '',
          filter: {
            companyIds: vendorIds,
            companyTypes: ['Vendor']
          }
        };
        this.vendorService
          .searchContactsAll(contactBody, paginationParams, true)
          .subscribe((result) => {
            if (isSecondary) {
              if (this.vendorsRepScPagination['page'] <= 1) {
                this.vendorsRepScPagination['total'] = Math.ceil(
                  result.pagination['found'] /
                  this.vendorsRepScPagination['perPage']
                );
                this.secondaryVendorsRep = result.results;
              } else {
                this.secondaryVendorsRep.push(...result.results);
              }
              this.isSecondaryVendorsRepLoading = false;
            } else {
              if(result.results){
                if (this.vendorsRepPrPagination['page'] <= 1) {
                  this.vendorsRepPrPagination['total'] = Math.ceil(
                    result?.pagination['found'] /
                    this.vendorsRepPrPagination['perPage']
                  );
                  this.primaryVendorsRep = result.results;
                } else {
                  this.primaryVendorsRep.push(...result.results);
                }
              }
              this.isPrimaryVendorsRepLoading = false;
            }
            this.cdRef.detectChanges();
          });
      } else {
        if (isSecondary) {
          this.isSecondaryVendorsRepLoading = false;
        } else {
          this.isPrimaryVendorsRepLoading = false;
        }
      }
    }
  }

  public onCompanySelection(value) {
    this.companyId = value?.organizationId;
    this.getResellers(this.resellersPerPage, false, '', false);

    this.jobLineItemForm.patchValue({
      resellerEmail: '',
      resellerOfficePhone: '',
      resellerCellPhone: '',
      resellerRep: ''
    });
  }

  public onResellerSelection(value) {
    this.jobLineItemForm.patchValue({
      resellerEmail: value.email?.[0] ?? '',
      resellerOfficePhone: value?.office
        ? this.splitValuesInMyTelFormat(value.office)
        : '',
      resellerCellPhone: value.mobile
        ? this.splitValuesInMyTelFormat(value.mobile)
        : ''
    });
  }

  private splitValuesInMyTelFormat(value) {
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

  public onClose() {
    this.dialogRef.close(this.isFormUpdated);
  }

  public onItemStatusChange(value) {
    this.itemStatus = value;
    if (this.itemStatus?.name ===  LineItemStatus.REVISED) {
      this.revisedDate.setValue(this.data?.lineItemData?.revisedAt ?? new Date());
    }
  }

  public onIsStandartChanged(value: boolean) {
    !value
      ? this.mediaDetailsForm.controls['material'].setValue('Digital')
      : this.mediaDetailsForm.controls['material'].setValue('');
    if (!value) {
      this.mediaDetailsForm.controls.spotsPerLoop.setValidators([
        Validators.required
      ]);
      this.mediaDetailsForm.controls.spotDuration.setValidators([
        Validators.required
      ]);
    } else {
      this.mediaDetailsForm.controls.spotsPerLoop.clearValidators();
      this.mediaDetailsForm.controls.spotDuration.clearValidators();
    }
  }

  public openProductNameInNewTab(productId: string) {
    this.tabLinkHandler.open(
      TabLinkType.PRODUCT,
      this.data.job.client?._id,
      this.selectedProduct?._id
    );
  }

  public onEstimateCostCalculation(event: CostCalculation) {
    this.timeAndCostData = event;
  }

  public minTrackByFn(idx: number, value: string) {
    return value ? value : idx;
  }

  public secTrackByFn(idx: number, value: string) {
    return value ? value : idx;
  }

  /**
   * @description
   * form control value change listener for Go to line Item id search
   */
  lineItemIdSearch() {
    this.goTolineItemId = this.goTolineItemId?.trim();
    if (this.goTolineItemId?.length)
      this._getJobsLineItemBySearch(this.goTolineItemId);
  }

  /**
   * @description
   * page change event method from line item traversing pagination
   */
  pageChangeEvent(pageIndex) {
    this.goTolineItemId = '';
    this.data.pagination.page = pageIndex;
    this._getJobsLineItem();
  }

  /**
   * @description
   * method to get line item list based on pagination and sort
   */
  private _getJobsLineItem() {
    const sortDup = Helper.deepClone(this.data?.sort);
    if (sortDup['active'] === 'lineItemId') {
      sortDup['active'] = 'createdAt';
    }

    let pagination = Helper.deepClone(this.data?.pagination);

    const fieldSet = ['lineItemId'];

    this.jobLineItemService
      .getLineItemListByJobID(this.data.job._id, sortDup, pagination, fieldSet)
      .pipe(takeUntil(this.destroy))
      .subscribe((res) => {
        this.getLineItembyId(res.results[0]._id);
      });
  }

  /**
   * @description
   * method to get line item details by line item id
   * @param id line item id
   */
  private getLineItembyId(id) {
    this.jobLineItemService
      .getLineItemDetailsByLineItemID(this.data?.job?._id, id)
      .pipe(takeUntil(this.destroy))
      .subscribe((res: JobLineItemDetails) => {
        this.data.lineItemData = res;
        this.populateLineItemModal();
      });
  }

  /**
   * @description
   * method to get line item by search
   */
  private _getJobsLineItemBySearch(lineItemId) {
    const fieldSet = ['lineItemId'];
    const payload = { filter: { codes: [lineItemId] } };
    this.jobLineItemService
      .getLineItemBySearch(this.data.job._id, payload, fieldSet)
      .pipe(takeUntil(this.destroy))
      .subscribe((res:JobLineItemsResponse) => {
        if (res && res.results?.length) {
          if (res.results[0].lineItemId !== this.data?.lineItemData?.lineItemId) {
            this.getLineItembyId(res.results[0]._id);
          }
        }
        else if (res && !res.results?.length) {
          this.snackbarService.showsAlertMessage('Line Item not found');
        }
      });
  }

  public get getErrorFields() {
    let fields = { errMsgs: [], errTemp: '' };
    (this.jobLineItemForm.controls['printer'].invalid) ? fields.errMsgs.push('Select Printer') : '';
    for (let i = 0; i < fields.errMsgs.length; i++) {
      fields.errTemp += `${i + 1}. ${fields.errMsgs[i]}<br/>`;
    }
    return fields;
  }

  ngOnDestroy() {
    this.unlistener();
    this.destroy.next(null);
    this.destroy.complete();
  }

  public duplicate() {
    this.jobLineItemService
      .getLineItemDetailsByLineItemID(this.data.job._id, this.data.lineItemData._id)
      .pipe(
        filter(res => !!res),
        takeUntil(this.destroy)
      )
      .subscribe((res) => {
        this.data.lineItemData = res;
        this.data.lineItemData.lineItemId = '';
        this.populateLineItemModal();
        this.isForDuplicate = true;
      });
  }

  public delete() {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(
        filter((res) => res && res['action']),
        switchMap(() =>
          this.jobLineItemService.deleteJobLineItem(
            this.data.job._id,
            this.data.lineItemData._id
          )
        ),
        takeUntil(this.destroy),
        filter((res: any) => res?.status === 'success')
      )
      .subscribe((res) => {
        this.snackbarService.showsAlertMessage('Line Item deleted successfully');
        this.dialogRef.close(true)
      });
  }

  getTermsOfPeriod() {
    this.jobsService.getPeriodLength()
      .subscribe((res: ApiIncoming<PeriodLength>) => {
        this.periodLengths = AddJobLineItemMapper.ToPeriodLength(res.results);
      });
  }

  getShippingOptions() {
    this.jobsService.shippingOption()
      .subscribe((res: any) => {
        this.shippingOptions = res.results;
      });
  }

  public formatNumericValue(formCtrl:AbstractControl){
    formCtrl.setValue(numeral(formCtrl.value).value() > 0 ? numeral(formCtrl.value).value() : null);
  }

  public formatBlankInput(formCtrl: AbstractControl){
    if(!formCtrl.value) {
      formCtrl.setValue('0.00');
    }
  }

  public calculateTotal(){
    const jobForm = this.jobLineItemForm;
    const totalNet =
      Number(jobForm.value.materials) +
      Number(jobForm.value.salesTax) +
      Number(jobForm.value.shippingCost) +
      Number(jobForm.value.installCost);
    const numMaterial = numeral(jobForm.value.materials).value();
    const numTotal = numeral(totalNet).value();
    const numOiCommissionAmt = numeral(jobForm.value.oiCommissionAmt).value();
    jobForm.controls.printerNetTotal.setValue(this.roundOfCost(totalNet));
    this.referenceCalculatedValue = numMaterial * numeral(this.fixedReferencePercentage).value() / 100;
    jobForm.controls.clientMaterialCost.setValue(this.roundOfCost(numMaterial + numOiCommissionAmt));
    jobForm.controls.clientCostTotal.setValue(this.roundOfCost(numTotal + numOiCommissionAmt));
    if(jobForm.value.materials) {
      // jobForm.controls.oiCommissionPercentage.setValue(((jobForm.value.oiCommissionAmt / jobForm.value.materials) * 100).toFixed(4));
      if (jobForm.value.oiCommissionAmt && jobForm.value.oiCommissionAmt > 0 && +(jobForm.value.materials) > 0) {
        jobForm.controls.oiCommissionPercentage.setValue(((jobForm.value.oiCommissionAmt / +(jobForm.value.materials)) * 100).toFixed(4));
      }

    }
  }

  public roundOfCost(value, digimal = 4) {
    return Number(value.toFixed(digimal));
  }
  public showClientNotesEditorFunc() {
    this.showClientNotesEditor = true;
    this.cdRef.markForCheck();
  }
  public showVendorNotesEditorFunc() {
    this.showVendorNotesEditor = true;
    this.cdRef.markForCheck();
  }
  public showProductionNotesEditorFunc() {
    this.showProductionNotesEditor = true;
    this.cdRef.markForCheck();
  }
  public showInternalNotesEditorFunc() {
    this.showInternalNotesEditor = true;
    this.cdRef.markForCheck();
  }
  openNewProductWindow() {
    const url = `${location.origin}/records-management-v2/clients/${this.clientId}?tab=products`
    window.open(url, '_blank');
  }

  private _showsAlertMessage(msg) {
    const config: MatSnackBarConfig = {
        duration: 3000
    };

    this.matSnackBar.open(msg, '', config);
  }

}
