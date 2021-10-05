import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { forbiddenNamesValidator } from '@shared/common-function';
import { AuthenticationService, SnackbarService } from '@shared/services';
import { DOCUMENT, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
  ViewChild
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { AddressServiceService } from '../../../../../services/address-service.service';
import { MediaDetailsService } from '../../../../../services/media-details.service';
import { ContractLineItemsService } from '../../../../../services/contract-line-items.service';
import { ContractsService } from '../../../../../services/contracts.service';
import { ClientsService } from '../../../../../services/clients.service';
import { VendorService } from '../../../../../services/vendor.service';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { MyTel } from '@shared/components/telephone-input/telephone-input.component';
import {
  ReplaySubject,
  Subject,
  of,
  combineLatest,
  forkJoin,
  interval,
  EMPTY
} from 'rxjs';
import {
  startWith,
  debounceTime,
  takeUntil,
  distinctUntilChanged,
  switchMap,
  catchError,
  take,
  map,
  filter,
  mergeMap,
  tap,
  finalize,
  skip
} from 'rxjs/operators';
import { SpotIdResultsDialogComponent } from '../spot-id-results-dialog/spot-id-results-dialog.component';
import { CostCalculation } from 'app/contracts-management/models/estimate-item.model';
import { TabLinkHandler, TabLinkType } from '@shared/services/tab-link-handler';
import { AbstractContractComponent } from 'app/contracts-management/contracts/contracts-shared/components/abstract-contract.component';
import { PlacementType } from '@interTypes/inventory';
import {
  SPOT_MINUTES,
  SPOT_SECONDS
} from './../../../../contracts-shared/helpers/min-sec.const';
import * as numeral from 'numeral';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { VendorType, VendorTypesPagination } from '@interTypes/vendor';
import { VendorSearchPayload } from '@interTypes/inventory-management';
import { LineItemCkEditorConfig } from '@constants/contract-line-item-ckeditor-config';
import { formatDistance } from 'date-fns';
import { Helper } from './../../../../../../classes/helper';
import { LineItemStatus, UserRoleTypes } from '@interTypes/enums';
import { RecordService } from 'app/records-management-v2/record.service';
import { UserActionPermission } from '@interTypes/user-permission';
import { MapToContractsCheckpoint } from '../../../../contracts-shared/helpers/contract-checkpoints.mapper';
import { InsertionOrderRecord } from '../../../../../models/insertion-order-record.model';
import { AddLineItemMapper } from '../../../../contracts-shared/helpers/add-line-item.mapper';
import { Sort, SortDirection } from '@angular/material/sort';
import { Pagination } from '../../../../../models/pagination.model';
import { ElasticSearchResponse } from '@interTypes/elastic-search.response';

@Component({
  selector: 'add-line-item-dialog',
  templateUrl: 'add-line-item-dialog.component.html',
  styleUrls: ['add-line-item-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [DatePipe]
})
export class AddLineItemDialogComponent
  extends AbstractContractComponent
  implements OnInit, OnDestroy {
  public createdDateAt: Date;
  userPermission: UserActionPermission;
  @ViewChild('vendorInputRef', { read: MatAutocompleteTrigger })
  public vendorAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('vendorRep1', { read: MatAutocompleteTrigger })
  public contactAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('vendorRep2', { read: MatAutocompleteTrigger })
  public contactAuto2CompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('companyNameRef', { read: MatAutocompleteTrigger })
  public resellerAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('resellerRepRef', { read: MatAutocompleteTrigger })
  public resellerContactAutoCompleteTrigger: MatAutocompleteTrigger;
  public isLoadingLineItems = false;
  public lineItems: any[] = [];
  public lineItemPagination: Pagination = {
    total: 0,
    found: 0,
    page: 1,
    perPage: 10,
    pageSize: 1
  };
  public isSearchInValid = false;

  constructor(
    public dialogRef: MatDialogRef<AddLineItemDialogComponent>,
    public tabLinkHandler: TabLinkHandler,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private contractsService: ContractsService,
    private contractLineItemsService: ContractLineItemsService,
    private clientsService: ClientsService,
    private vendorService: VendorService,
    private fb: FormBuilder,
    private mediaDetailsService: MediaDetailsService,
    private addressServiceService: AddressServiceService,
    public dialog: MatDialog,
    private recordService: RecordService,
    private snackbarService: SnackbarService,
    public readonly cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private readonly document: Document,
    private renderer: Renderer2,
    public datepipe: DatePipe
  ) {
    super(cdRef, mediaDetailsService);
    this.notesForm = fb.group({
      contractNotes: null,
      productionNotes: null,
      clientNotes: null,
      internalNotes: null
    });
    this.vendorForm = fb.group({
      selectedVendor: [null, Validators.required, forbiddenNamesValidator],
      primaryEmail: [null, Validators.email],
      primaryOfficePhone: [null, CustomValidators.telephoneInputValidator],
      primaryCellPhone: [null, CustomValidators.telephoneInputValidator],
      secondaryEmail: [null, Validators.email],
      secondaryOfficePhone: [null, CustomValidators.telephoneInputValidator],
      secondaryCellPhone: [null, CustomValidators.telephoneInputValidator],
      vendorRepPrimary: [null, Validators.required, forbiddenNamesValidator],
      vendorRepSecondary: [null, null, forbiddenNamesValidator],
      designator: [null],
      shipToBusinessName: [null],
      address: [null],
      contactName: [null],
      phoneNumber: [null, CustomValidators.telephoneInputValidator],
      emailAddress: [null],
      company: [null, null, forbiddenNamesValidator],
      resellerRep: [null, null, forbiddenNamesValidator],
      resellerEmail: [null, Validators.email],
      resellerOfficePhone: [null, CustomValidators.telephoneInputValidator],
      resellerCellPhone: [null, CustomValidators.telephoneInputValidator],
      designatorItem: [null]
    });
    this.mediaDetailsForm = fb.group({
      mediaType: [null, Validators.required],
      placeType: [null],
      mediaClass: [null],
      vendorMediaName: [null],
      material: [null],
      placeName: [null],
      placementType: [null, null, forbiddenNamesValidator],
      structureType: [null],
      placeCategory: [null],
      mediaDescription: [
        null,
        [
          Validators.required,
          CustomValidators.noWhitespaceValidator(true),
          Validators.maxLength(200)
        ]
      ],
      dma: [
        null,
        null,
        forbiddenNamesValidator
      ] /* remove require validation */,
      cbsa: [null, null, forbiddenNamesValidator],
      state: [null],
      city: [null],
      mediaUnitQty: [null],
      placeQty: [null],
      unitSize: [null],
      unitHeight: [null],
      unitWidth: [null],
      spotsPerLoop: [null],
      spotsInRotation: [null],
      spotDuration: [null],
      spotMins: [
        '0',
        null,
        (control: AbstractControl) => {
          return of(
            control.value && SPOT_MINUTES.indexOf(control.value) === -1
              ? { invalid: true }
              : null
          ); /* to handle spot duration via min and sec -- added fields */
        }
      ],
      spotSec: [
        '0',
        null,
        (control: AbstractControl) => {
          return of(
            control.value && SPOT_SECONDS.indexOf(control.value) === -1
              ? { invalid: true }
              : null
          );
        }
      ],
      gpImpressionsPerPeriod: [null],
      impressionsPerPeriod: [null],
      targetImpressionsPerPeriod: [null],
      targetMarketType: [null],
      targetAudience: [
        JSON.parse(localStorage.getItem('defaultAudience'))['2021'],
        null,
        forbiddenNamesValidator
      ],
      targetRatingPoints: [null],
      locationDescription: [null],
      distance: [null],
      streetSide: [null],
      facing: [null],
      readByVehicle: [null],
      longitude: [null],
      latitude: [null],
      geopathSpotId: null,
      vendorSpotId: null
    });
    this.getClientProducts();
    this.getBuyMethods();
    this.getLineItemTypes();
    this.getItemStatuses();
    this.getVendorsList();

    // get programmic
    // this.getOrganizations();
    if (this.data.lineItemData) {
      this.isForDuplicate = this.data.isForDuplicate;
      if (this.isForDuplicate) {
        this.data.lineItemData.lineItemId = '';
      }
      this.populateLineItemModal();
    } else {
      /* to show media details required field - add units method initiated to open media details section */
      this.addUnits();
    }
    if (data) {
      this.clientId = data.clientId;
    }
    if (data.userPermission) {
      this.userPermission = data.userPermission;
      this.performUserRolePermission(this.userPermission);
    }
  }

  public geopathSpotIdRegex: RegExp = /^[0-9,]*$/;

  public vendorTypes: VendorType[] = [];

  public editorConfig = LineItemCkEditorConfig;
  public TabLinkType = TabLinkType;
  public selectedMedia = 'Geopath';
  public spotId = '';
  public isStandart = true;
  public isShowDetails = true;
  public timeAndCostData: CostCalculation;

  public mediaDetailsForm: FormGroup;

  public clientId: string;

  public destroy: ReplaySubject<any> = new ReplaySubject<any>(1);

  public states: any[] = [];
  public mediaTypes: any[] = [];
  public placeTypes: any[] = [];
  public classificationTypes: any[] = [];
  public placementTypes: any[] = [];
  public constructionTypes: any[] = [];
  public targetMarketTypes: string[] = ['DMA', 'CBSA', 'County'];
  public dmaItems: any[] = [];
  public cbsaItems: any[] = [];
  public targetAudienceItems: any[] = [];

  public selectDmaPanelContainer: string;
  public dmaLimit = 10;
  public dmaOffset = 0;
  public isDmaLoading = false;
  public dmaSearchPayload: string;
  public dmaPerPage;
  public dmaCompleted;
  public dmaInvalidEntry = false;

  public selectCbsaPanelContainer: string;
  getVendorById;
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

  public buyMethods: any[] = [];
  public buyOptionsToDisplay: any[] = [];
  public isBuyMethodsLoading = false;
  public buyMethodsTotal: string | number;

  public vendors: any[] = [];
  public isVendorsLoading = false;
  public vendorsTotal: string | number;

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

  public vendorForm: FormGroup;

  public parentVendorName: string;
  public parentVendorId: string;

  public parentCompanyId: any;
  public vendorsOffset = 0;
  public vendorsLimit = 10;
  public vendorsComplete = false;
  public vendorsPerPage;

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

  public doNotExport = false;

  public lineItemId: any;

  public lineItemType: any;

  public itemStatus: any;

  public buyMethod: any;

  public lineItemTypeError = false;
  public itemStatusError = false;
  public buyMethodError = false;
  public clientProductError = false;

  lineItemTypeSelectedValue;
  itemStatusSelectedValue;
  buyMethodSelectedValue;
  clientProductSelectedValue;

  public targetChosenItem;

  public inventoryNum = undefined;

  // reGex allow only number and comma type
  public impressionNumericPatternRegEx = /^[0-9,]*$/;
  public targetRatingPtsRegEx = /^(?=.*[0-9])\d{0,6}(\.\d{0,2})?$/;

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

  public programmaticResellerPagination: VendorTypesPagination = {
    page: 1,
    perPage: 25,
    total: 0
  };
  public isVendorResellerLoading = false;
  public companySearchtext: string;

  public spotMinutes = SPOT_MINUTES;
  public spotSeconds = SPOT_SECONDS;
  public isForDuplicate = false;
  public showMediaMeasurement = true;
  // this field using for update the list
  public isFormUpdated = false;

  public staticDMAItems = [
    {
      id: 'Nationwide',
      name: 'Nationwide'
    },
    {
      id: 'Multiple Markets',
      name: 'Multiple Markets'
    }
  ];

  public goTolineItemId = '';

  public get showEditActions() {
    return this.data.lineItemData && !this.isForDuplicate;
  }

  public get previousVendor(): string {
    if (!this.showEditActions) return '';
    const vendorRep = this.data.lineItemData.vendorRep?.primary;
    const vendorRepFC = this.vendorForm.controls.vendorRepPrimary.value;
    return vendorRep?._id !== vendorRepFC?._id? `${vendorRep.firstName} ${vendorRep.lastName}` : '';
  }

  public disableClientFields = false;
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
    this.goTolineItemId = this.data?.lineItemData?.code;
    this.refreshLastUpdatedTime();
    this.updateClientFieldsDisable();
    this.getContractLineItemsByESSearchId();
    this.vendorForm.controls.selectedVendor.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        startWith(''),
        takeUntil(this.destroy)
      )
      .subscribe((value) => {
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
    this.vendorForm.controls.vendorRepPrimary.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        startWith(''),
        takeUntil(this.destroy),
        skip(1),
      )
      .subscribe((value) => {
        if (typeof value === 'string') {
          this.vendorsRepPrPagination = {
            page: 0,
            pageSize: 0,
            perPage: 10,
            total: 0
          };
          this.getVendorsByOrgId(
            false,
            value
              ? {
                  search: value
                }
              : {}
          );
        }
      });
    this.vendorForm.controls.vendorRepSecondary.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        startWith(''),
        takeUntil(this.destroy),
        skip(1),
      )
      .subscribe((value) => {
        if (typeof value === 'string') {
          this.vendorsRepScPagination = {
            page: 0,
            pageSize: 0,
            perPage: 10,
            total: 0
          };
          this.getVendorsByOrgId(
            true,
            value
              ? {
                  search: value
                }
              : {}
          );
        }
      });
    this.vendorForm.controls.company.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        startWith(''),
        takeUntil(this.destroy)
      )
      .subscribe((value) => {
        if(value?.length === 0) {
          this.buyMethodOptionUpdate(null, false);
        }
        this.companySearchtext = '';
        if (typeof value === 'string') {
          this.companySearchtext = value;
          this.resetVendorResellerPagination();
          this.getVendorProgrammaticAndReseller();
        }
      });
    this.vendorForm.controls.resellerRep.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        startWith(''),
        takeUntil(this.destroy)
      )
      .subscribe((value) => {
        if (this.resellersPerPage && typeof value === 'string') {
          this.getResellers(this.resellersPerPage, true, value, true);
        }
      });
    this.mediaDetailsForm.controls.dma.valueChanges
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
    this.mediaDetailsForm.controls.cbsa.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        startWith(''),
        takeUntil(this.destroy)
      )
      .subscribe((value) => {
        if (this.cbsaPerPage && typeof value === 'string') {
          this.getCbsaList(this.cbsaPerPage, true, value ? value : '', true);
        }
      });
    this.mediaDetailsForm.controls.targetAudience.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        startWith(''),
        takeUntil(this.destroy)
      )
      .subscribe((value) => {
        if (this.targetAudiencePerPage && typeof value === 'string') {
          this.getTargetAudienceList(
            this.targetAudiencePerPage,
            true,
            value ? value : '',
            true
          );
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
    this.searchPlacementType(this.mediaDetailsForm, 'placementType');

    this.vendorService
      .getVendorsTypes()
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        // Programmatic // Reseller
        this.vendorTypes = res?.results.filter(
          (type) =>
            type?.name.toLowerCase().includes('programmatic') ||
            type?.name.toLowerCase().includes('reseller')
        );
        this.getVendorProgrammaticAndReseller();
      });

    this.populateMediaDetails();
  }

  public openSearchIdDialog() {
    if (this.spotId) {
      this.mediaDetailsService
        .spotIdSearch({
          id_list: [this.spotId],
          id_type:
            this.selectedMedia === 'Geopath' ? 'spot_id' : 'plant_frame_id',
          status_type_name_list: ['*'],
          measures_required: false
        })
        .pipe(take(1))
        .subscribe((res) => {
          this.inventoryNum = +res.inventory_count;

          if (res.frame_list) {
            this.dialog
              .open(SpotIdResultsDialogComponent, {
                width: '960px',
                panelClass: 'spot-id-results-modal',
                data: {
                  frameList: res.frame_list
                }
              })
              .afterClosed()
              .subscribe((frame) => {
                if (frame) {
                  this.isShowDetails = true;
                  this.populateMediaDetails(frame);
                }
              });
          }

          this.cdRef.markForCheck();
        });
    }
  }

  public loadLineItems() {
    this.lineItemPagination = {
      total: 0,
      found: 0,
      page: 1,
      perPage: 10,
      pageSize: 1
    };
    this.isLoadingLineItems = true;
    this.contractLineItemsService
      .searchContractLineItemEsRequest(
        this.data.contract._id,
        [],
        true
      )
      .pipe(
        catchError((err) => {
          this.isSearchInValid = true;
          this.isLoadingLineItems = false;
          this.cdRef.markForCheck();
          return of(err);
        }),
      )
      .subscribe((res: ElasticSearchResponse) => {
        if (res?._id) {
          this.data.elasticSearchId = res._id;
          this.getContractLineItemsByESSearchId();
        }
      });
  }

  /* method used to get results from ES API call */
  public getContractLineItemsByESSearchId(isForLoadMore = false) {
    this.isLoadingLineItems = true;
    const sortDup: any = {
      active: 'createdAt',
      direction: 'asc'
    };

    this.contractLineItemsService
      .getContractLineItemsByESSearchId(
        this.data.contract._id,
        this.data.elasticSearchId,
        sortDup,
        false,
        this.lineItemPagination,
        true,
        this.unsubscribe$,
        false
      )
      .pipe(
        catchError((err: any) => {
          this.isSearchInValid = true;
          this.isLoadingLineItems = false;
          this.cdRef.markForCheck();
          return of(err);
        }),
        finalize(() => {
          this.isLoadingLineItems = false;
          this.cdRef.markForCheck();
        })
      )
      .subscribe((res: any) => {
        this.isLoadingLineItems = false;
        const resData = res?.body;
        this.isSearchInValid = !resData?.search?.isValid;

        if (!resData) {
          return;
        }

        this.lineItemPagination.total = resData?.pagination?.total;
        this.lineItemPagination.found = resData?.pagination?.found;
        if (isForLoadMore) {
          this.lineItems = this.lineItems.concat(resData.results);
        } else {
          this.lineItems = resData.results;
        }
        this.cdRef.markForCheck();
      });
  }

  public loadMoreLineItems() {
    this.lineItemPagination.page++;
    this.getContractLineItemsByESSearchId(true);
  }

  public lineItemsTrackByFn(idx, item: any): string {
    return item?._id;
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
          return this.mediaDetailsService.getMediaTypes();
        }),
        switchMap(({ media_types }) => {
          this.mediaTypes = media_types;
          return this.mediaDetailsService.getPlaceTypes();
        }),
        switchMap(({ place_types }) => {
          this.placeTypes = place_types;
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
          this.patchMediaDetailsWithSpot(frame);
        } else {
          const placementTypeValue = this.placementType.find(
            (option) =>
              option.name == this.data?.lineItemData?.media?.placementType
          );
          this.mediaDetailsForm.patchValue({
            mediaType: this.data.lineItemData?.media?.mediaType,
            placeType: this.data.lineItemData?.media?.placeType,
            mediaClass: this.data.lineItemData?.media?.mediaClass,
            vendorMediaName: this.data.lineItemData?.media?.vendorMediaName,
            material: this.data.lineItemData?.media?.material,
            placeName: this.data.lineItemData?.media?.placeName,
            placementType: placementTypeValue,
            structureType: this.data.lineItemData?.media?.structureType,
            placeCategory: this.data.lineItemData?.media?.placeCategory,
            mediaDescription: this.data.lineItemData?.media?.mediaDescription,
            dma: this.data.lineItemData?.media?.dma,
            cbsa: this.data.lineItemData?.media?.cbsa,
            state:
              this.data.lineItemData?.media?.state &&
              this.states.find(
                (state) => this.data.lineItemData?.media.state === state._id
              ),
            city: this.data.lineItemData?.media?.city,
            mediaUnitQty: this.data.lineItemData?.media?.mediaUnitQty,
            placeQty: this.data.lineItemData?.media?.venueQty,
            unitHeight: this.data.lineItemData?.media?.unitHeight,
            unitWidth: this.data.lineItemData?.media?.unitWidth,
            spotsPerLoop: this.data.lineItemData?.media?.spotsPerLoop,
            spotsInRotation: this.data.lineItemData?.media?.spotsInRotation,
            spotDuration: this.data.lineItemData?.media?.spotDuration,
            spotMins:
              this.data.lineItemData?.media?.spotDuration &&
              this.data.lineItemData?.media?.spotDuration
                .toString()
                .split(':')[0]
                ? this.data.lineItemData.media.spotDuration.split(':')[0]
                : '0',
            spotSec:
              this.data.lineItemData?.media?.spotDuration &&
              this.data.lineItemData?.media?.spotDuration
                .toString()
                .split(':')[1]
                ? this.data.lineItemData.media.spotDuration.split(':')[1]
                : '0',
            gpImpressionsPerPeriod: this.formatNumberValue(
              this.data.lineItemData?.media?.gpImpressionPerPeriod
            ),
            impressionsPerPeriod: this.formatNumberValue(
              this.data.lineItemData?.media?.impressionPerPeriod
            ),
            targetImpressionsPerPeriod: this.formatNumberValue(
              this.data.lineItemData?.media?.targetImpressionPerPeriod
            ),
            targetMarketType: this.data.lineItemData?.media?.targetMarketType,
            targetAudience: this.targetChosenItem,
            targetRatingPoints: this.formatTargetRatingsPts(
              this.data.lineItemData?.media?.targetRatingPoints
            ),
            locationDescription: this.data.lineItemData?.media
              ?.locationDescription,
            distance: this.data.lineItemData?.media?.direction,
            streetSide: this.data.lineItemData?.media?.streetSide,
            facing: this.data.lineItemData?.media?.facing,
            readByVehicle: this.data.lineItemData?.media?.read,
            longitude: this.data.lineItemData?.media?.lng,
            latitude: this.data.lineItemData?.media?.lat,
            geopathSpotId: this.data.lineItemData?.media?.geopathSpotId,
            vendorSpotId: this.data.lineItemData?.media?.vendorSpotId
          });
        }
        this.toggleMediaMeasurements();
        this.cdRef.markForCheck();
      });
    this.getDmaList();
    this.getCbsaList();
    this.getTargetAudienceList();
  }

  private formatNumberValue(value): string {
    let numberValue = null;
    if (value && numeral(value)) {
      numberValue = numeral(value).format('0,0');
    }
    return numberValue;
  }

  private formatTargetRatingsPts(value) {
    let numberValue = null;
    if (value && numeral(value)) {
      numberValue = numeral(value).format('0.00');
    }
    return numberValue;
  }

  public patchMediaDetailsWithSpot(frame) {
    this.mediaDetailsService
      .getInventoryByFrameId(frame.frame_id)
      .subscribe((res) => {
        this.mediaDetailsForm.patchValue({
          mediaType: frame.media_type?.name,
          placeType:
            frame.location?.place_type
              ?.name /* added conditional operator to handle 'null' error */,
          mediaClass: frame.classification_type?.name,
          vendorMediaName: frame.media_name,
          material: frame.digital ? 'Digital' : 'Printed',
          placementType: frame?.placement_type ?? null,
          structureType: frame.construction_type?.name,
          placeCategory: frame.location?.place_type?.name,
          mediaDescription: frame.location?.primary_artery,
          dma: { id: frame.location?.dma_id, name: frame.location?.dma_name },
          cbsa: {
            id: `CBSA${frame.location?.cbsa_code}`,
            name: frame.location?.cbsa_name
          },
          state:
            frame.location?.state &&
            this.states.find(
              (state) => frame.location.state === state.short_name
            ),
          city: frame.location?.dma_name,
          unitHeight: String(frame.max_height || ''),
          unitWidth: String(frame.max_width || ''),
          spotsInRotation: res.layouts[0]?.faces[0]?.spots_in_rotation,
          spotDuration: frame.spot_references[0]?.length,
          spotMins:
            frame.spot_references[0]?.length &&
            frame.spot_references[0]?.length?.toString().includes(':') &&
            frame.spot_references[0]?.length?.toString().split(':')[0]
              ? frame.spot_references[0].length.toString().split(':')[0]
              : '0',
          spotSec:
            frame.spot_references[0]?.length &&
            frame.spot_references[0]?.length?.toString().split(':')[1]
              ? frame.spot_references[0].length.toString().split(':')[1]
              : frame.spot_references[0]?.length
              ? frame.spot_references[0]?.length.toString()
              : '0',
          gpImpressionsPerPeriod: this.formatNumberValue(
            frame.spot_references[0]?.measures?.imp
          ),
          impressionsPerPeriod: this.formatNumberValue(
            frame.spot_references[0]?.measures?.imp
          ),
          targetImpressionsPerPeriod: this.formatNumberValue(
            frame.spot_references[0]?.measures?.imp_target_inmkt
          ),
          targetRatingPoints: this.formatTargetRatingsPts(
            frame.spot_references[0]?.measures?.trp
          ),
          locationDescription: String(frame.location?.primary_artery || ''),
          facing: String(frame.location?.orientation || ''),
          readByVehicle: String(frame.location?.primary_read || ''),
          longitude: String(frame.location?.longitude || ''),
          latitude: String(frame.location?.latitude || ''),
          geopathSpotId: String(frame.spot_references[0]?.spot_id || ''),
          vendorSpotId: String(frame.spot_references[0]?.plant_spot_id || '')
        });
      });
    this.isStandart = !frame.digital;
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

  public getCbsaList(
    perPage = this.cbsaOffset + this.cbsaLimit,
    noLoader = false,
    q?: string,
    isSearch = false
  ) {
    this.cbsaInvalidEntry = false;
    this.cbsaSearchPayload = q || '';
    this.isCbsaLoading = true;
    this.mediaDetailsService
      .marketsSearch('cbsa', this.cbsaSearchPayload, perPage, noLoader)
      .pipe(
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.cbsaInvalidEntry = true;
          }
          return of([]);
        })
      )
      .subscribe((res) => {
        this.cbsaItems = res.markets;
        this.cbsaPerPage = perPage;
        if (!isSearch) {
          this.cbsaOffset += this.cbsaLimit;
        }
        this.cbsaCompleted = res.number_of_pages === 1;
        this.isCbsaLoading = false;
        this.cdRef.detectChanges();
      });
  }

  public getTargetAudienceList(
    perPage = this.targetAudienceOffset + this.targetAudienceLimit,
    noLoader = false,
    search?: any,
    isSearch = false
  ) {
    this.targetAudienceInvalidEntry = false;
    this.targetAudienceSearchPayload = search ? { search } : undefined;
    this.isTargetAudienceLoading = true;

    this.mediaDetailsService
      .getAudienceByDataVersion(
        this.targetAudienceSearchPayload,
        perPage,
        noLoader
      )
      .pipe(
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.targetAudienceInvalidEntry = true;
          }
          return of([]);
        })
      )
      .subscribe((res) => {
        this.targetAudienceItems = res.options;
        this.targetAudiencePerPage = perPage;
        if (!isSearch) {
          this.targetAudienceOffset += this.targetAudienceLimit;
        }
        this.targetAudienceCompleted =
          this.targetAudienceOffset >= this.targetAudienceLimit;
        this.isTargetAudienceLoading = false;
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
    this.selectDmaPanelContainer = '.media-dma-autocomplete';
  }

  public updateSelectCbsaContainer() {
    this.selectCbsaPanelContainer = '.media-cbsa-autocomplete';
  }

  public updateSelectTargetAudienceContainer() {
    this.selectTargetAudiencePanelContainer =
      '.media-target-audience-autocomplete';
  }

  public populateLineItemModal() {
    this.lineItemType = this.data.lineItemData.lineItemType;
    this.toggleMediaMeasurements();
    this.lineItemTypeSelectedValue = this.data.lineItemData.lineItemType;
    this.itemStatus = this.data.lineItemData.itemStatus;
    this.itemStatusSelectedValue = this.data.lineItemData.itemStatus;
    this.buyMethod = this.data.lineItemData.buyMethod;
    this.buyMethodSelectedValue = this.data.lineItemData.buyMethod;
    this.selectedProduct = this.data.lineItemData.clientProduct;
    this.clientProductSelectedValue = this.data.lineItemData.clientProduct;
    this.doNotExport = this.data.lineItemData.doNotExport;
    this.parentVendorName = this.data.lineItemData?.vendor?.parentCompany?.name;
    this.primaryVendorOrgId = this.data.lineItemData?.vendor?.organizationId
      ? [this.data.lineItemData.vendor.organizationId]
      : [];
    this.parentVendorId = this.data.lineItemData?.vendor?.parentCompany?._id;

    this.companyId = this.data?.lineItemData?.company?._id ?? '';
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
    if (this.data.lineItemData?.vendor?.parentCompany?._id) {
      const childrenBody = {
        filters: {
          parentIds: [this.data.lineItemData?.vendor?.parentCompany?._id]
        }
      };
      const childrenParams = {
        isParentSearch: true,
        onlyChildIds: true
      };
      combineLatest([
        this.vendorService.getDesignatorByVendorId(
          this.data.lineItemData.vendor?.parentCompany?._id
        ),
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
    } else if (this.data.lineItemData?.vendor?.organizationId) {
      this.parentCompanyId = this.primaryVendorOrgId; /* to init secondaryVendorsRep assigned primary venodr post param */
      this.getVendorsByOrgId(false, {});
    }

    this.getDesignator(this.data.lineItemData?.vendor?._id);
    this.vendorForm.patchValue({
      selectedVendor: this.data.lineItemData.vendor,
      vendorRepPrimary: this.data.lineItemData.vendorRep?.primary,
      vendorRepSecondary: this.data.lineItemData.vendorRep?.secondary,
      company: this.data.lineItemData.company,
      resellerRep: this.data.lineItemData.resellerRep,
      designatorItem: this.data.lineItemData.designator
    });

    this.notesForm.patchValue({
      contractNotes: this.data.lineItemData.contractNotes,
      productionNotes: this.data.lineItemData.prodNotes,
      clientNotes: this.data.lineItemData.clientNotes,
      internalNotes: this.data.lineItemData.intNotes
    });

    if (this.data.lineItemData.designator) {
      this.onDesignatorChange(this.data.lineItemData.designator);
    }

    if (this.data.lineItemData.vendorRep?.primary) {
      this.onPrimaryVendorsRepSelectChanged(
        this.data.lineItemData.vendorRep.primary
      );
    }
    if (this.data.lineItemData.vendorRep?.secondary) {
      this.onSecondaryVendorsRepSelectChanged(
        this.data.lineItemData.vendorRep?.secondary
      );
    }
    if (this.data?.lineItemData?.resellerRep) {
      this.getResellers();
      this.onResellerSelection(this.data.lineItemData.resellerRep);
    }

    this.mediaDetailsService
      .getAudienceByDataVersion({
        search: this.data.lineItemData.media.targetAudience
      })
      .subscribe(({ options }) => {
        if (options) {
          this.targetChosenItem = options.find(
            (item) =>
              this.data.lineItemData.media.targetAudience === item.description
          );
        }
      });

    this.populateMediaDetails();
    this.isShowDetails = true;
    this.isStandart = !this.data.lineItemData.media.isDigital;
    if (
      this.isStandart &&
      this.data?.lineItemData?.media?.material?.toLowerCase() == 'digital'
    ) {
      this.isStandart = false;
    }
    !this.isStandart
      ? this.mediaDetailsForm.controls['material'].setValue('Digital')
      : this.mediaDetailsForm.controls['material'].setValue('');
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
        type: this.vendorTypes.map((type) => type._id)
      }
    };
    if (this.companySearchtext) {
      vendorSearchPayload.filters.name = this.companySearchtext;
    }
    return vendorSearchPayload;
  }

  /**
   * Reset the vendor Programmatic And Reseller pagination
   */

  public resetVendorResellerPagination() {
    this.programmaticResellerPagination = {
      page: 1,
      perPage: 25
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
    if (currentSize > this.programmaticResellerPagination.total) { return; }
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
    const payload = {
      search: this.companySearchtext,
      filter: {
        organizationTypes: ['Vendor', 'Agency']
      }
    };
    this.recordService
      .getOrganizations(payload, this.programmaticResellerPagination, {
        active: 'name',
        direction: 'asc'
      })
      .pipe(filter((res: any) => !!res.results))
      .subscribe(
        (res) => {
          this.isVendorResellerLoading = false;
          if (!moreVendors) {
            this.companies = res?.results ?? [];
          } else {
            this.companies = [...this.companies, ...(res?.results ?? [])];
          }
          this.programmaticResellerPagination.total =
            res?.['pagination']?.['total'] ?? 0;
          this.cdRef.markForCheck();
        },
        (error) => {
          // Hide loader
          this.isVendorResellerLoading = false;
          this.cdRef.markForCheck();
          if (error?.error?.message) {
            this.contractsService._showsAlertMessage(error?.error?.message);
            return;
          } else if (error?.error?.error) {
            this.contractsService._showsAlertMessage(error?.error.error);
            return;
          }
          this.contractsService._showsAlertMessage(
            'Something went wrong, Please try again later'
          );
        }
      );
  }

  /*public getOrganizations(
    perPage = this.companiesLimit + this.companiesOffset,
    noLoader = false,
    body = {},
    isSearch = false
  ) {
    this.companiesPayload = body || {};

    this.vendorService
      .organizationSearch(
        body,
        this.companiesLimit + this.companiesOffset,
        noLoader
      )
      .subscribe((res) => {
        this.companies = res.results;
        this.companiesPerPage = perPage;
        this.companiesTotal = res.pagination.total;
        if (!isSearch) {
          this.companiesOffset += this.companiesLimit;
        }
        this.companiesComplete = this.companiesOffset >= this.companiesTotal;
        this.companiesLoading = false;
        this.cdRef.detectChanges();
      });
  }*/

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
    body?,
    isSearch = false
  ) {
    this.isVendorsLoading = true;
    this.vendorsSearchPayload = body || {};
    this.vendorService
      .childVendorsListSearch(
        body,
        String(perPage),
        noLoader
      ) /* Changed to new API to get only child vendors */
      .subscribe((res) => {
        this.vendors = res.results;
        this.vendorsPerPage = perPage;
        this.vendorsTotal = res.pagination.total;
        if (!isSearch) {
          this.vendorsOffset += this.vendorsLimit;
        }
        this.vendorsComplete = this.vendorsOffset >= this.vendorsTotal;
        this.isVendorsLoading = false;
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

  public updateSelectVendorRepScContainer() {
    this.selectVendorRepScPanelContainer = '.add-line-items-vendor-rep-sc-autocomplete';
  }

  public updateSelectCompanies() {
    this.selectCompanyPanelContainer = '.add-line-items-companies-autocomplete';
  }

  public updateResellersContainer() {
    this.selectResellerRepContainer = '.add-line-items-resellers-autocomplete';
  }

  /* Added OIProduct filter type False as per IMXUIPRD-4191 */
  public getClientProducts(
    perPage = '10',
    noLoader = false
  ) {
    this.isClientProdutsLoading = true;
    this.clientsService
      .getProductsByClientId(this.data.contract.client._id, perPage, noLoader, false)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        this.productsPerPage = perPage;
        this.clientProduts = res.results;
        this.clientProdutsTotal = res.pagination.total;
        this.isClientProdutsLoading = false;
      });
  }

  public onScrollClientProducts(value) {
    this.getClientProducts(value, true);
  }

  public onProductNameChanged(value) {
    this.selectedProduct = value;
    this.clientProductError = !value;
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
    this.contractsService
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

  public getBuyMethods(perPage = '10', noLoader = false) {
    this.isBuyMethodsLoading = true;
    this.contractsService
      .buyMethodsSearch({}, perPage, noLoader)
      .subscribe((res) => {
        this.buyMethods = res.results;
        this.buyOptionsToDisplay = res.results;
        this.buyMethodsTotal = res.pagination.total;
        this.isBuyMethodsLoading = false;
        if(this.data?.lineItemData?.company) {
          this.buyMethodOptionUpdate(this.data?.lineItemData?.company, false);
        }
      });
  }

  public onScrollBuyMethods(value) {
    this.getBuyMethods(value, true);
  }

  public onVendorSelectChanged(value) {
    if(!value) return; // for NULL selection (while clearing)
    this.vendorForm.patchValue(
      {
        vendorRepPrimary: '',
        vendorRepSecondary: '',
        primaryEmail: '',
        primaryOfficePhone: '',
        primaryCellPhone: '',
        secondaryEmail: '',
        secondaryOfficePhone: '',
        secondaryCellPhone: '',
        designator: null,
        shipToBusinessName: null,
        address: null,
        contactName: null,
        phoneNumber: '',
        emailAddress: null
      },
      { emitEvent: false }
    );
    this.designatorItems = [];

    this.primaryVendorOrgId = [value.organizationId];
    this.parentVendorName = value.parentCompany;
    this.parentVendorId = value.parentCompanyId;

    this.getDesignator(value._id);
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

    if (value.parentCompanyId) {
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
        this.getVendorsByOrgId(true, {});
      });
    } else if (value.organizationId) {
      this.parentCompanyId = this.primaryVendorOrgId; /* to init secondaryVendorsRep assigned primary venodr post param */
      this.getVendorsByOrgId(false, {});
      this.getVendorsByOrgId(true, {});
      // this.secondaryVendorsRep = [];
      this.cdRef.detectChanges();
    }
  }

  public getDesignator(vendorId) {
    if (vendorId) {
      this.vendorService
        .getDesignatorByVendorId(vendorId, String(10))
        .subscribe(({ shippingAddress }) => {
          if (shippingAddress?.length) {
            this.designatorItems = shippingAddress;
          }
        });
    }
  }

  public onDesignatorChange(value) {
    this.vendorForm.patchValue({
      designator: value?._id || '',
      shipToBusinessName: value?.businessName || '',
      address: {
        address: value?.address || '',
        city: value?.city || '',
        state: value?.state || '',
        zipCode: value?.zipcode || ''
      },
      contactName: value?.contactName || '',
      phoneNumber:
        value?.phoneNumber || ''
          ? this.splitValuesInMyTelFormat(value?.phoneNumber)
          : '',
      emailAddress: value?.email || ''
    });
  }

  dateValueChange() {
    const dtValue = this.revisedDate.value;
    if (!dtValue) {
      document.getElementById('revisedDt')['value'] = dtValue;
      this.revisedDate.setErrors(null);
    } else if (new Date(dtValue).getFullYear() > 9999) {
      this.revisedDate.setErrors({ invalid: true });
    }
    this.cdRef.markForCheck();
  }

  public saveLineItem() {
    this.submitBtnDis = true;
    this.clickformStream$.next(true);
    this.lineItemTypeError = !this.lineItemType;
    this.itemStatusError = !this.itemStatus;
    this.buyMethodError = !this.buyMethod;
    this.clientProductError = !this.selectedProduct;
    const spotDur =
      (this.mediaDetailsForm.controls.spotMins.value || '0') +
      ':' +
      (this.mediaDetailsForm.controls.spotSec.value || '0');

    if (
      !this.timeAndCostData.isPeriodFormValid ||
      this.lineItemTypeError ||
      this.itemStatusError ||
      this.buyMethodError ||
      this.clientProductError ||
      this.vendorForm.invalid ||
      this.timeAndCostData?.isIOdateError ||
      (this.isShowDetails && this.mediaDetailsForm.invalid) ||
      this.revisedDate?.invalid ||
      this.getErrorFields.errMsgs.length
    ) {
      this.vendorForm.markAllAsTouched();
      if (this.isShowDetails) {
        this.mediaDetailsForm.markAllAsTouched();
      }
      this.submitBtnDis = false;
      return;
    }
    const saveLineItemPayload = {
      lineItemType: this.lineItemType?._id,
      itemStatus: this.itemStatus?._id,
      buyMethod: this.buyMethod?._id,
      doNotExport: this.doNotExport,
      lineItemId: this.lineItemId,
      clientProduct: this.selectedProduct?._id,
      vendor: this.vendorForm.value.selectedVendor?._id,
      vendorRep: {
        primary: this.vendorForm.value.vendorRepPrimary?._id,
        secondary: this.vendorForm.value.vendorRepSecondary?._id
      },
      company: this.vendorForm.value.company?._id
        ? this.vendorForm.value.company?._id
        : '', // set empty value if user cleared company (optional filed)
      resellerRep: this.vendorForm.value.resellerRep?._id ?? '',
      designator: this.vendorForm.value.designator,
      contractNotes: this.notesForm.value.contractNotes,
      prodNotes: this.notesForm.value.productionNotes,
      clientNotes: this.notesForm.value.clientNotes,
      intNotes: this.notesForm.value.internalNotes,
      media: this.isShowDetails
        ? {
            isDigital: !this.isStandart,
            mediaType: this.mediaDetailsForm?.value?.mediaType,
            placeType: this.mediaDetailsForm?.value?.placeType,
            mediaClass: this.mediaDetailsForm.value.mediaClass,
            vendorMediaName: this.mediaDetailsForm.value.vendorMediaName,
            material: this.mediaDetailsForm.value.material,
            placeName: this.mediaDetailsForm.value.placeName,
            placeCategory: this.mediaDetailsForm.value.placeCategory,
            placementType:
              this.mediaDetailsForm.value.placementType?.name ?? null,
            structureType: this.mediaDetailsForm.value.structureType,
            dma: {
              id: this.mediaDetailsForm.value.dma?.id,
              name: this.mediaDetailsForm.value.dma?.name
            },
            cbsa: {
              id: this.mediaDetailsForm.value.cbsa?.id,
              name: this.mediaDetailsForm.value.cbsa?.name
            },
            state: this.states.find(
              (el) =>
                el.short_name === this.mediaDetailsForm.value.state?.short_name
            )?._id,
            stateCode: this.mediaDetailsForm.value.state?.short_name,
            city: this.mediaDetailsForm.value.city || null,
            mediaDescription: this.mediaDetailsForm.value.mediaDescription,
            lat: this.mediaDetailsForm.value.latitude,
            lng: this.mediaDetailsForm.value.longitude,
            mediaUnitQty: +this.mediaDetailsForm.value.mediaUnitQty,
            venueQty: +this.mediaDetailsForm.value.placeQty,
            spotsPerLoop: this.mediaDetailsForm.value.spotsPerLoop,
            spotsInRotation: this.mediaDetailsForm.value.spotsInRotation,
            spotDuration: spotDur,
            unitHeight: this.mediaDetailsForm.value.unitHeight,
            unitWidth: this.mediaDetailsForm.value.unitWidth,
            // vendorUnit: this.mediaDetailsForm.value.mediaUnitQty,
            locationDescription: this.mediaDetailsForm.value
              .locationDescription,
            direction: this.mediaDetailsForm.value.distance,
            streetSide: this.mediaDetailsForm.value.streetSide,
            facing: this.mediaDetailsForm.value.facing,
            read: this.mediaDetailsForm.value.readByVehicle,
            gpImpressionPerPeriod:
              numeral(this.mediaDetailsForm.value.gpImpressionsPerPeriod)
                .value()
                ?.toString() ?? null,
            impressionPerPeriod:
              numeral(this.mediaDetailsForm.value.impressionsPerPeriod)
                .value()
                ?.toString() ?? null,
            targetImpressionPerPeriod:
              numeral(this.mediaDetailsForm.value.targetImpressionsPerPeriod)
                .value()
                ?.toString() ?? null,
            targetMarketType: this.mediaDetailsForm.value.targetMarketType,
            targetAudience: this.mediaDetailsForm.value.targetAudience
              ?.description,
            targetRatingPoints:
              numeral(this.mediaDetailsForm.value.targetRatingPoints)
                .value()
                ?.toString() ?? null,
            geopathSpotId: this.mediaDetailsForm.value.geopathSpotId,
            vendorSpotId: this.mediaDetailsForm.value.vendorSpotId
          }
        : undefined,
      clientEstimate: this.timeAndCostData?.clientEstimate,
      periodLength: this.timeAndCostData?.periodLength,
      startDate: this.timeAndCostData?.startDate,
      endDate: this.timeAndCostData?.endDate,
      net: this.timeAndCostData?.net,
      agencyCommission: this.timeAndCostData?.agencyCommission,
      noOfPeriods: this.timeAndCostData?.noOfPeriods,
      installs: this.timeAndCostData?.installs,
      IODates: this.timeAndCostData?.IODates,
      tax: this.timeAndCostData?.tax,
      marketRate: this.timeAndCostData?.marketRate,
      installCost: this.timeAndCostData?.installCost,
      isAuto: this.timeAndCostData.isAuto,
      revisedAt: this.showEditActions
        ? this.datepipe.transform(this.revisedDate?.value, 'MM/dd/yyyy') ?? null
        : null
    };
    if (!this.isForDuplicate && this.data.lineItemData) {
      this.contractLineItemsService
        .updateLineItem(
          this.data.contract._id,
          saveLineItemPayload,
          this.data.lineItemData._id
        )
        .pipe(finalize(() => (this.submitBtnDis = false)))
        .subscribe(({ message }) => {
          this.isFormUpdated = true;
          this.snackbarService.showsAlertMessage(message);
          this.contractLineItemsService
            .getLineItemDetails(
              this.data.contract._id,
              this.data.lineItemData._id
            )
            .subscribe((res) => {
              this.data.lineItemData = res;
            });
        });
    } else {
      this.contractLineItemsService
        .saveLineItem(this.data.contract._id, saveLineItemPayload)
        .pipe(finalize(() => (this.submitBtnDis = false)))
        .subscribe(({ message, data }) => {
          if (message !== null) {
            // this.dialogRef.close(true);
            this.snackbarService.showsAlertMessage(message);
          }
          if (data?.id) {
            this.contractLineItemsService
              .getLineItemDetails(this.data.contract._id, data['id'])
              .subscribe((res) => {
                // Add the new line items
                this.data.lineItemData = res;
                // Set duplicate false once add new items
                this.data.isForDuplicate = false;
                this.isForDuplicate = false;
                // Set the pagination
                const pagination = this.data.pagination;
                pagination.found = pagination?.found + 1;
                pagination.page = pagination?.found;
                pagination.pageSize = pagination?.found;
                pagination.total = pagination?.found;
                this.data.pagination = pagination;
                // Set the form updated - it'll refrese the line item table once cloase the line items
                this.isFormUpdated = true;
                this.updateClientFieldsDisable();
                this.data.contract = { ...this.data.contract };
                this.data.isForDuplicate = false;
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
              if (result.results) {
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

  public onPrimaryVendorsRepSelectChanged(value) {
    this.vendorForm.patchValue({
      primaryEmail: value?.email?.[0] ?? '',
      primaryOfficePhone: value?.office
        ? this.splitValuesInMyTelFormat(value.office)
        : '',
      primaryCellPhone: value?.mobile
        ? this.splitValuesInMyTelFormat(value.mobile)
        : ''
    });
  }

  public onSecondaryVendorsRepSelectChanged(value) {
    this.vendorForm.patchValue({
      secondaryEmail: value?.email?.[0] ?? '',
      secondaryOfficePhone: value?.office
        ? this.splitValuesInMyTelFormat(value?.office)
        : '',
      secondaryCellPhone: value?.mobile
        ? this.splitValuesInMyTelFormat(value?.mobile)
        : ''
    });
  }

  public onCompanySelection(value) {
    this.companyId = value?._id;
    this.getResellers(this.resellersPerPage, false, '', false);

    this.vendorForm.patchValue({
      resellerEmail: '',
      resellerOfficePhone: '',
      resellerCellPhone: '',
      resellerRep: ''
    });
    this.buyMethodOptionUpdate(value);
  }

  public buyMethodOptionUpdate(value = null, checkOption = true){
    if (value) {
      this.buyOptionsToDisplay = this.buyMethods?.filter(each =>
        each?.groups[0]?.toLowerCase() == "RESELLER".toLowerCase()).map(_val => _val);
    } else {
      this.buyOptionsToDisplay = this.buyMethods;
    }
    const selectedOption = this.buyOptionsToDisplay?.filter(each =>
      each?._id === this.buyMethodSelectedValue?._id).map(_val => _val);
    if( checkOption && selectedOption && selectedOption.length === 0) {
      this.buyMethodSelectedValue = value;
      this.cdRef.detectChanges();
      this.buyMethodSelectedValue = null;
      this.onBuyMethodChange(null);
    } 
  }

  public onResellerSelection(value) {
    this.vendorForm.patchValue({
      resellerEmail: value?.email?.[0] ?? '',
      resellerOfficePhone: value?.office
        ? this.splitValuesInMyTelFormat(value?.office)
        : '',
      resellerCellPhone: value?.mobile
        ? this.splitValuesInMyTelFormat(value?.mobile)
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

  public onLineItemTypeChanged(value) {
    this.lineItemType = value;
    this.lineItemTypeError = !this.lineItemType;
    this.toggleMediaMeasurements();
  }

  public onItemStatusChange(value) {
    this.itemStatus = value;
    this.itemStatusError = !this.itemStatus;
    if (this.itemStatus?.name === LineItemStatus.REVISED) {
      this.revisedDate.setValue(
        this.data?.lineItemData?.revisedAt ?? new Date()
      );
    }
  }

  public onBuyMethodChange(value) {
    this.buyMethod = value;
    this.buyMethodSelectedValue = value;
    this.buyMethodError = !this.buyMethod;
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
      this.data.contract.client?._id,
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
    if (this.goTolineItemId?.length) {
      this._getContractsLineItemBySearch(this.goTolineItemId);
    }
  }

  /**
   * @description
   * page change event method from line item traversing pagination
   */
  pageChangeEvent(pageIndex) {
    this.goTolineItemId = '';
    this.data.pagination.page = pageIndex;
    this._getContractsLineItems();
  }

  /**
   * @description
   * method to get line item list based on pagination and sort
   */
  private _getContractsLineItems() {
    const sortDup = Helper.deepClone(this.data?.sort);
    if (sortDup['active'] === 'lineItemId') {
      sortDup['active'] = 'createdAt';
    }

    const pagination = Helper.deepClone(this.data?.pagination);

    const fieldSet = ['lineItemId'];

    this.contractLineItemsService
      .getAllLineItems(this.data.contract._id, sortDup, pagination, fieldSet)
      .subscribe((res) => {
        this.getLineItembyId(res.results[0]._id);
      });
  }

  /**
   * @description
   * method to get line item details by line item id
   * @param id line item id
   */
  public getLineItembyId(id) {
    this.contractLineItemsService
      .getLineItemDetails(this.data.contract._id, id)
      .subscribe((res) => {
        this.data.lineItemData = res;
        /**
         * All Form will be resetted due to resolve previous value cache issue
         */
        this.vendorForm?.reset();
        this.mediaDetailsForm?.reset();
        this.notesForm?.reset();
        this.cdRef.markForCheck();
        setTimeout(() => {
          this.populateLineItemModal();
          this.lineItemPagination = {
            total: 0,
            found: 0,
            page: 1,
            perPage: 10,
            pageSize: 1
          };
        }, 500);
      });
  }

  /**
   * @description
   * method to get line item by search
   */
  private _getContractsLineItemBySearch(lineItemId) {
    this.contractLineItemsService
      .getLineItemByIineItemNo(this.data.contract._id, lineItemId)
      .subscribe((res) => {
        if (res && res.results?.length) {
          if (
            res.results[0].lineItemId !== this.data?.lineItemData?.lineItemId
          ) {
            this.getLineItembyId(res.results[0]._id);
          }
        } else if (res && !res.results?.length) {
          this.snackbarService.showsAlertMessage('Line Item not found');
        }
      });
  }

  public get getErrorFields() {
    const fields = { errMsgs: [], errTemp: '' };

    !this.lineItemType ? fields.errMsgs.push('Select Line item Type') : '';
    !this.itemStatus ? fields.errMsgs.push('Select Item Status') : '';
    !this.buyMethod ? fields.errMsgs.push('Select Buy Method') : '';
    !this.selectedProduct ? fields.errMsgs.push('Select Product Name') : '';
    this.vendorForm.controls['selectedVendor'].invalid
      ? fields.errMsgs.push('Select Vendor')
      : '';
    this.vendorForm.controls['vendorRepPrimary'].invalid
      ? fields.errMsgs.push('Assign Vendor Rep')
      : '';
    this.mediaDetailsForm.controls['mediaType'].invalid
      ? fields.errMsgs.push('Select Media Type')
      : '';
    this.mediaDetailsForm.controls['mediaDescription'].hasError('required')
      ? fields.errMsgs.push('Enter Media / Location Description')
      : '';
    !this.mediaDetailsForm.controls.mediaDescription?.hasError('required') &&
    this.mediaDetailsForm?.controls?.mediaDescription?.hasError('whitespace')
      ? fields.errMsgs.push('Invalid Media / Location Description')
      : '';
    this.mediaDetailsForm.controls.mediaDescription?.hasError('maxlength')
      ? fields.errMsgs.push(
          'Media / Location Description can be max 200 characters long'
        )
      : '';
    !this.timeAndCostData?.periodLength
      ? fields.errMsgs.push('Select Period Length')
      : '';
    this.showEditActions && this.revisedDate?.invalid
      ? this.revisedDate?.errors?.matDatepickerMin
        ? fields.errMsgs.push(
            'Revised Date should not be lesser than Create Date'
          )
        : fields.errMsgs.push('Revised Date should be valid (MM/DD/YYYY)')
      : '';
    this.mediaDetailsForm.controls.city.value &&
    !this.mediaDetailsForm.controls.state.value
      ? fields.errMsgs.push('Select State')
      : '';
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
    this.isLoadingLineItems = true;
    this.contractLineItemsService
      .getLineItemDetails(this.data.contract._id, this.data.lineItemData._id)
      .pipe(
        finalize(() => {
          this.isLoadingLineItems = false;
        }),
        filter((res) => !!res)
      )
      .subscribe((res: any) => {
        this.data.lineItemData = res;
        if (res?.IODates?.length < 2) {
          res.IODates = [];
          res.noOfPeriods = null;
          res.startDate = null;
          res.endDate = null;
        }
        this.data.lineItemData?.IODates.forEach((element) => {
          element.exportedStatus = false;
        });
        this.data.lineItemData.lineItemId = '';
        this.populateLineItemModal();
        this.loadLineItems();
        this.isForDuplicate = true;
        this.updateClientFieldsDisable();
        this.data.contract = { ...this.data.contract };
        this.data.isForDuplicate = true;
        this.cdRef.detectChanges();
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
          this.contractLineItemsService.deleteLineItem(
            this.data.contract._id,
            this.data.lineItemData._id
          )
        ),
        filter((res: any) => res?.status === 'success')
      )
      .subscribe((res) => {
        this.snackbarService.showsAlertMessage(
          'Line Item deleted successfully'
        );
        this.dialogRef.close(true);
      });
  }

  /**
   * @description
   *  Hiding the media measurement when the line item type
   *  chosen the production, install, extension
   * @private
   */
  private toggleMediaMeasurements() {
    if (!this.lineItemType) { return; }
    if (
      /^(production|install|extension)$/i.test(
        this.lineItemType.name.toLowerCase()
      )
    ) {
      this.showMediaMeasurement = false;
      this.mediaDetailsForm.patchValue({
        gpImpressionsPerPeriod: '',
        targetMarketType: '',
        impressionsPerPeriod: '',
        targetAudience: '',
        targetImpressionsPerPeriod: '',
        targetRatingPoints: ''
      });
    } else {
      this.showMediaMeasurement = true;
    }
  }

  public refreshDropdowns() {
    const vendorId = this.vendorForm['controls']['selectedVendor'].value?._id;
    const resellerId = this.vendorForm['controls']['company'].value?._id;
    const vendorPrimaryRepId = this.vendorForm['controls']['vendorRepPrimary']
      .value?._id;
    const vendorSecondaryRepId = this.vendorForm['controls'][
      'vendorRepSecondary'
    ].value?._id;
    const resellerRepId = this.vendorForm['controls']['resellerRep'].value?._id;
    this.loadLineItems();
    this.refreshVendor(vendorId, vendorPrimaryRepId, vendorSecondaryRepId);
    this.refreshReseller(resellerId, resellerRepId);
    this.refreshProducts();
    this.lastRefreshedTime = new Date();
  }

  private refreshVendor(vendorId, vendorPrimaryRepId, vendorSecondaryRepId) {
    if (vendorId) {
      const vendorRepControls = [];
      const vendorRepCallBacks = [];
      this.vendorService
        .getVendorById(vendorId)
        .pipe(
          catchError((err) => EMPTY),
          filter((res) => {
            if (res.error) {
              this.vendorForm['controls']['selectedVendor'].patchValue('');
              this.vendorForm['controls']['vendorRepPrimary'].patchValue('');
              this.vendorForm['controls']['vendorRepSecondary'].patchValue('');
              this.onPrimaryVendorsRepSelectChanged({});
              this.onSecondaryVendorsRepSelectChanged({});
              this.cdRef.markForCheck();
              return false;
            }
            return true;
          }),
          mergeMap((res) => {
            this.onVendorSelectChanged(res);
            this.vendorForm['controls']['selectedVendor'].patchValue(res);
            const vendorRepRequests = [];
            if (vendorPrimaryRepId) {
              vendorRepRequests.push(
                this.vendorService.getContactById(vendorPrimaryRepId).pipe(
                  catchError((err) => of('')),
                  tap((repRes) => {
                    const value = !!repRes ? `${repRes?.firstName ?? ''}` : '';
                    this.vendorsRepPrPagination.page--;
                    this.getVendorsByOrgId(
                      false,
                      value
                        ? {
                            search: value
                          }
                        : {}
                    );
                  })
                )
              );
              vendorRepControls.push(
                this.vendorForm['controls']['vendorRepPrimary']
              );
              vendorRepCallBacks.push((value) => {
                this.onPrimaryVendorsRepSelectChanged(value);
              });
            }
            if (vendorSecondaryRepId) {
              vendorRepRequests.push(
                this.vendorService.getContactById(vendorSecondaryRepId).pipe(
                  catchError((err) => of('')),
                  tap((repRes) => {
                    const value = !!repRes ? `${repRes?.firstName ?? ''}` : '';
                    this.vendorsRepScPagination['page']--;
                    this.getVendorsByOrgId(
                      true,
                      value
                        ? {
                            search: value
                          }
                        : {}
                    );
                  })
                )
              );
              vendorRepControls.push(
                this.vendorForm['controls']['vendorRepSecondary']
              );
              vendorRepCallBacks.push((value) => {
                this.onSecondaryVendorsRepSelectChanged(value);
              });
            }
            return forkJoin(vendorRepRequests);
          })
        )
        .subscribe((responses) => {
          responses.forEach((res, index) => {
            vendorRepControls[index].patchValue(res);
            vendorRepCallBacks[index](res);
            this.cdRef.markForCheck();
          });
        });
    } else { /* to get refresh value in vendor even not selected venodr */
      this.getVendorsList();
    }
  }

  refreshReseller(resellerId, resellerRepId) {
    if (resellerId) {
      this.recordService
        .getOrganizationById(resellerId)
        .pipe(
          filter((res) => {
            if (res.error) {
              this.vendorForm['controls']['company'].patchValue('');
              this.vendorForm['controls']['resellerRep'].patchValue('');
              this.onResellerSelection({});
              return false;
            }
            return true;
          }),
          mergeMap((res) => {
            this.vendorForm['controls']['company'].patchValue(res, { emitEvent: false });
            if (resellerRepId) {
              return this.vendorService.getContactById(resellerRepId).pipe(
                catchError((err) => of('')),
                tap((repRes) => {
                  const value = !!repRes ? `${repRes?.firstName ?? ''}` : '';
                  this.getResellers(this.resellersPerPage, true, value, true);
                })
              );
            } else {
              this.getResellers();
              return of('');
            }
          })
        )
        .subscribe((res) => {
          this.vendorForm['controls']['resellerRep'].patchValue(res);
          this.onResellerSelection(res);
        });
    } else { /* to get refresh value in reseller even not selected reseller */
      this.resetVendorResellerPagination();
      this.getVendorProgrammaticAndReseller();
    }
  }

  private refreshProducts() {
    if (this.selectedProduct?._id) {
      this.onScrollClientProducts(this.productsPerPage);
      this.clientsService
        .getClientProduct(
          this.data.contract.client._id,
          this.selectedProduct._id
        )
        .subscribe((res) => {
          this.selectedProduct = res;
          this.selectedProduct.refresh = true;
          this.refreshLineItem$.next(res);
        });
    } else { /* to get refresh value in products even not selected product */
      this.getClientProducts();
    }
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
  // Making saved/Edit line-item title.
  get editItempopUpTitle() {
    if (this.data?.lineItemData?.contract?.client?.mediaClientCode) {
      return `${this.data?.lineItemData?.contract?.contractId} (Line Item: ${this.data?.lineItemData?.contract?.client?.mediaClientCode}-${this.data?.lineItemData?.clientProduct?.productCode}-${this.data?.lineItemData?.contract?.contractId}-${this.data?.lineItemData?.code})`;
    } else {
      return `${this.data?.lineItemData?.contract?.contractId} (Line Item: ${this.data?.lineItemData?.clientProduct?.productCode}-${this.data?.lineItemData?.contract?.contractId}-${this.data?.lineItemData?.code})`;
    }
  }

  performUserRolePermission(access: UserActionPermission) {
    if (!access?.edit) {
      this.vendorForm.disable();
      this.mediaDetailsForm.disable();
      this.notesForm.disable();
      this.revisedDate.disable();
      this.editorConfig.readOnly = true;
    }
  }

  openNewVendorWindow() {
    window.open(
      `${location.origin}/records-management-v2/vendors/add`,
      '_blank'
    );
  }
  openNewContactWindow() {
    const url = `${location.origin}/records-management-v2/vendors/${this.vendorForm.controls.selectedVendor.value?._id}?tab=createContacts`;
    window.open(url, '_blank');
  }
  openNewResellerContactWindow() {
    const url = `${location.origin}/records-management-v2/vendors/${this.vendorForm.controls.company.value?.organizationTypeId}?tab=createContacts`;
    window.open(url, '_blank');
  }
  openNewShippingWindow() {
    const url = `${location.origin}/records-management-v2/vendors/${this.vendorForm.controls.selectedVendor.value?._id}?tab=createShippingAddress`;
    window.open(url, '_blank');
  }
  openNewProductWindow() {
    const url = `${location.origin}/records-management-v2/clients/${this.clientId}?tab=products`;
    window.open(url, '_blank');
  }
  resetPrimaryVendorRep(){
    this.vendorForm.controls['primaryEmail'].setValue('');
    this.vendorForm.controls['primaryOfficePhone'].setValue('');
    this.vendorForm.controls['primaryCellPhone'].setValue('');
  }
  resetSecondaryVendorRep(){
    this.vendorForm.controls['secondaryEmail'].setValue('');
    this.vendorForm.controls['secondaryOfficePhone'].setValue('');
    this.vendorForm.controls['secondaryCellPhone'].setValue('');
  }
  resetResellerRep(){
    this.vendorForm.controls['resellerEmail'].setValue('');
    this.vendorForm.controls['resellerOfficePhone'].setValue('');
    this.vendorForm.controls['resellerCellPhone'].setValue('');
  }

  /**
   * @description
   *  As per card 4146, we need to disable the entire time cost if following condition matched
   *  Role: Contract Editor - The Client Line Items value [Critical values (Product, Estimate, Vendor, IO Dates) ]
   *  cannot be edited if "Approved for Billing" = TRUE
   *  (Row 12)
   */
  private updateClientFieldsDisable(): void {
    if (this.showEditActions) {
      const contractCheckpoints = MapToContractsCheckpoint(
        this.data.contract.contractEvents
      );
      const isApprovedForBilling = contractCheckpoints.approvedForBillingExport;
      this.disableClientFields =
        this.showEditActions &&
        isApprovedForBilling &&
        AuthenticationService.checkUserRoleExistsOrNot(
          UserRoleTypes.CONTRACT_EDIT_ROLE
        );

      if (this.disableClientFields) {
        // this.vendorForm.controls.selectedVendor.disable();
        // this.vendorForm.controls.vendorRepPrimary.disable();
      }
      this.cdRef.markForCheck();
    } else {
      this.disableClientFields = false;
      this.vendorForm.controls.selectedVendor.enable();
      this.vendorForm.controls.vendorRepPrimary.enable();
    }
  }

  public onCityFocusOut(event: any) {
    const stateControl = this.mediaDetailsForm.get('state');
    event?.target?.value
      ? stateControl.setValidators(Validators.required)
      : stateControl.clearValidators();
    stateControl.updateValueAndValidity();
  }
}
