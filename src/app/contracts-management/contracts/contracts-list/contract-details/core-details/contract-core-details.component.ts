import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input, OnDestroy, OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ApiIncoming,
  Contract,
  ContractDetails,
  NestedItem
} from 'app/contracts-management/models';
import { AddLineItemDialogComponent } from './add-line-item-dialog/add-line-item-dialog.component';
import { ImportLineItemsDialogComponent } from './import-line-items-dialog/import-line-items-dialog.component';
import { Helper } from '../../../../../classes/helper';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { ContractsMapper } from 'app/contracts-management/contracts/contracts-shared/helpers/contracts.mapper';
import { ContractStatusOptions } from 'app/contracts-management/contracts/contracts-shared/helpers/contract-status.const';
import { ContractsService } from 'app/contracts-management/services/contracts.service';
import { ContractsSearchService } from 'app/contracts-management/services/contracts-search.service';
import { ContractsSearchBuyerApi } from 'app/contracts-management/models/contracts-search-buyer.model';
import {
  AutocompleteMapper,
  AutocompleteUsersMapper
} from 'app/contracts-management/contracts/contracts-shared/helpers/autocomplete.mapper';
import {
  FilterClientsPayload,
  FilterClientsResponse,
  FilteredClient
} from '@interTypes/records-management';
import { ContractStatus } from 'app/contracts-management/models';
import { AppAutocompleteOptionsModel } from '@shared/components/app-autocomplete/model/app-autocomplete-option.model';
import { Client } from 'app/contracts-management/models/client.model';
import { ClientContact } from 'app/contracts-management/models/client-contact.model';
import {
  ContractCostsDisplay,
  ContractCostsSummary
} from 'app/contracts-management/models/contract-costs.model';
import { MapToContractCostsSummary } from 'app/contracts-management/contracts/contracts-shared/helpers/summary.mapper';
import { ContractCheckpoints } from 'app/contracts-management/contracts/contracts-shared/helpers/contract-checkpoints.enum';
import {
  MapToContractsCheckpoint,
  MapToSaveContractsCheckpoints
} from 'app/contracts-management/contracts/contracts-shared/helpers/contract-checkpoints.mapper';
import { IContractCheckpoints } from 'app/contracts-management/models/contract-checkpoints.model';
import { CreateUpdateContract } from 'app/contracts-management/models/create-contract.model';
import { ContractDetailsEmit } from 'app/contracts-management/models/contract-delails-emit.model';
import { Observable, Subject } from 'rxjs';
import { ContractEvent } from 'app/contracts-management/models/contract-event.model';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ContractLineItemsService } from 'app/contracts-management/services/contract-line-items.service';
import {
  ContractLineItem,
  ContractLineItemsApiResponce,
  ContractsLineItemsTable
} from 'app/contracts-management/models/contract-line-item.model';
import { Pagination } from 'app/contracts-management/models/pagination.model';
import { Sort } from '@angular/material/sort';
import { ImportLineItemsSteps } from '../../../contracts-shared/helpers/import-line-items-steps.enum';
import { TabLinkHandler, TabLinkType } from '@shared/services/tab-link-handler';
import { RecordsPagination } from '@interTypes/pagination';
import * as numeral from 'numeral';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { debounceTime, filter, switchMap, takeUntil } from 'rxjs/operators';
import { AuthenticationService, SnackbarService } from '@shared/services';
import { ActivatedRoute } from '@angular/router';
import { ElasticSearchResponse } from '@interTypes/elastic-search.response';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { forbiddenNamesValidator } from '@shared/common-function';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { UserRoleTypes } from '@interTypes/enums';
import { UseAutoCompleteInfiniteScroll } from 'app/classes/use-auto-complete-infinite-scroll';
import { CONTACT_LIST_TYPES } from '@constants/contact-list-types';
import { RecordService } from 'app/records-management-v2/record.service';

@Component({
  selector: 'app-contract-core-details',
  templateUrl: 'contract-core-details.component.html',
  styleUrls: ['contract-core-details.component.less']
})
export class ContractCoreDetailsComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('clientGroupInputRef', { read: MatAutocompleteTrigger })
  public clientAutoCompleteTrigger: MatAutocompleteTrigger;

  public contractDetailsForm: FormGroup;
  public contractDetails: ContractDetails;
  public contract: Contract;
  public clients: any[];
  public contractCostsDisplay: ContractCostsDisplay;
  public contractCheckpoints: IContractCheckpoints = {};
  public currentContractStatus: string;
  public contractEvents: ContractEvent[];
  public contractStatuses: ContractStatus[];
  public tableData: ContractLineItemsApiResponce;

  public isClientsListLoading = false;
  public offset = 0;
  public isComplete = false;

  public usersAutocompleteItems: AppAutocompleteOptionsModel[] = [];
  public campaignsAutocompleteItems: AppAutocompleteOptionsModel[] = [];
  public clientsAutocompleteItems: AppAutocompleteOptionsModel[] = [];
  public clientContactAutocompleteItems: AppAutocompleteOptionsModel[] = [];

  public buyerAutoComplete: UseAutoCompleteInfiniteScroll<any> = new UseAutoCompleteInfiniteScroll<any>();
  public panelBuyerContainer: string;

  public readonly CONTRACT_STATUSES = ContractStatusOptions;
  public readonly CONTRACT_CHECKPOINTS = ContractCheckpoints;

  private readonly CLIENTS_PER_PAGE_LIMIT = 25;
  public _contractId: string;
  public sort: Sort = {
    active: 'lineItemId',
    direction: 'asc'
  };
  public parentClientPagination: RecordsPagination;
  public deliveryNumericPatternRegEx = /^[0-9]{1,7}(\.[0-9]{0,2})?$/;
  public clientFilters: FilterClientsPayload = {} as FilterClientsPayload;
  public panelContainer: any;
  private pagination: Pagination = {
    total: 0,
    found: 0,
    page: 1,
    perPage: 10,
    pageSize: 1
  };

  @Input() public save$ = new Subject();
  private unsubscribe$ = new Subject<void>();
  private unSubES$: Subject<void> = new Subject<void>();

  @Input() userPermission: UserActionPermission;
  getClientsByFiltersAPI = null;
  public disableClient = false;

  @Input() set contractId(value: string) {
    if (!value) {
      return;
    }

    this._contractId = value;
    /* hided duplicate call  */
    // const pagination = {
    //   total: 0,
    //   found: 0,
    //   page: 1,
    //   perPage: 1,
    //   pageSize: 1
    // }
    // this.contractLineItemsService
    // .getAllLineItems(this._contractId, null, pagination)
    // .subscribe((res: ContractLineItemsApiResponce) => {
    //   this.pagination = res['pagination'];
    //   let perPage = 10;
    //   if (res['pagination']['total'] > 20) {
    //     perPage = 50;
    //   } else if (res['pagination']['total'] > 10) {
    //     perPage = 20;
    //   } else {
    //     perPage = 10;
    //   }
    //   this.pagination['pageSize'] = perPage;
    //   this.pagination['perPage'] = perPage;
    // });
    this._getContractsLineItems(this._contractId, this.sort, this.pagination);
  }

  @Input() set contractItem(value: Contract) {
    if (!value) {
      return;
    }

    this.contract = Helper.deepClone(value);
    this.contractDetails = ContractsMapper.ToDetailsView(this.contract);

    const contractCostsSummary = MapToContractCostsSummary(
      this.contractDetails.summary
    );
    this.contractCostsDisplay = this._adjustContractCostsSummaryForDisplay(
      contractCostsSummary
    );
    this.contractCheckpoints = MapToContractsCheckpoint(
      this.contractDetails.contractEvents
    );

    this.updateClientDisable();
    this.currentContractStatus = this.contractDetails.status?.code;

    this.contractDetailsForm.patchValue({
      contractId: this.contractDetails.contractId,
      contractName: this.contractDetails.contractName,
      buyer: this.contractDetails.buyer,
      campaign: this.contractDetails.campaign.id,
      client: this.contractDetails.client,
      clientContact: this.contractDetails.clientContact.id,
      startDate:
        this.contractDetails.startDate.getFullYear() <= 1970
          ? ''
          : this.contractDetails.startDate,
      endDate:
        this.contractDetails.endDate.getFullYear() <= 1970
          ? ''
          : this.contractDetails.endDate,
      poNumber: this.contractDetails.poNumber || '',
      totalAuthorizedAmount: this.formatAuthorizationAmount(
        this.contractDetails.totalAuthorizedAmount
      )
    });

    this.getClientsList('', true);
    this._getAllClientContacts(this.contract?.client?.organizationId);
    this._firstSaveModelInit(this.contractDetails);
  }

  @Output()
  valueChanged: EventEmitter<ContractDetailsEmit> = new EventEmitter<ContractDetailsEmit>();
  @Output() eventsSelectionChanged: EventEmitter<{
    eventsIds: string[];
    contractCheckpoints: any;
  }> = new EventEmitter<{
    eventsIds: string[];
    contractCheckpoints: any;
  }>();
  @Output()
  statusSelectionChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output()
  lineItemModified: EventEmitter<string> = new EventEmitter<string>();

  public TabLinkType = TabLinkType;
  public contractUpdate: CreateUpdateContract;
  public isLoadingLineItems = false;
  public isSearchInValid = false;
  public elasticSearchId = '';
  public selectedCampaign:any = {};
  public selectedBuyer:any = {};
  public selectedClientContact:any = {};
  public isClientContactLoading = false;

  constructor(
    public cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    public tabLinkHandler: TabLinkHandler,
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    private contractsService: ContractsService,
    private contractsSearchService: ContractsSearchService,
    private contractLineItemsService: ContractLineItemsService,
    private activeRoute: ActivatedRoute,
    public recordService: RecordService,
  ) {

    this.contractDetailsForm = fb.group({
      contractId: [null],
      contractName: [null, [Validators.required, Validators.maxLength(64)]],
      campaign: [null],
      startDate: [null],
      endDate: [null],
      buyer: [null, Validators.required, forbiddenNamesValidator],
      client: [null, Validators.required, forbiddenNamesValidator],
      mediaClientCode: [null],
      clientContact: [null],
      poNumber: ['', Validators.maxLength(64)],
      totalAuthorizedAmount: ['']
    });

    this.contractDetailsForm.valueChanges.subscribe((value) => {
      const contractUpdate: CreateUpdateContract = this._mapToContractCreate(
        value
      );
      this.contractUpdate = contractUpdate;
      const output: ContractDetailsEmit = {
        form: this.contractDetailsForm,
        model: contractUpdate
      };
      this.valueChanged.emit(output);
    });

    this._getAllCampaigns();
    this._getAllContratEvents();
    this._getAllContratStatuses();
    this.initBuyerCotactSetup();
  }
  
  private formatAuthorizationAmount(value): string {
    let numberValue = null;
    if (value && numeral(value)) {
      numberValue = numeral(value).format('0,0.00');
    }
    return numberValue;
  }
  public formatNumericValue(formCtrl: string) {
    const formObj = {};
    formObj[formCtrl] = numeral(
      this.contractDetailsForm.controls[formCtrl].value
    ).value();
    this.contractDetailsForm.patchValue(formObj);
  }

  onPaginationChanged(event: Pagination) {
    this.pagination = event;
    this.contractLineItemsService.setContractDetailLineItemProp(
      'paginationEvent',
      event
    );
    //this._getContractsLineItems(this._contractId, this.sort, this.pagination);
    this.getContractLineItemsByESSearchId(this._contractId, this.sort, this.pagination);
  }

  onSortingChanged(event: Sort) {
    this.sort = { ...event };
    this.contractLineItemsService.setContractDetailLineItemProp(
      'sortEvent',
      event
    );
    //this._getContractsLineItems(this._contractId, this.sort, this.pagination);
    this.getContractLineItemsByESSearchId(this._contractId, this.sort, this.pagination);
  }

  onEditLineItem(data: any, isForDuplicate = false, paginate = null) {
    this.onAddLineItemsDialog(data, isForDuplicate, paginate);
  }

  deleteLineItem(element) {
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
            this._contractId,
            element._id
          )
        ),
        filter((res: any) => res?.status === 'success')
      )
      .subscribe((res) => {
        this.snackbarService.showsAlertMessage(
          'Line Item deleted successfully'
        );
        this._getContractsLineItems(this._contractId, this.sort, this.pagination);
        this.lineItemModified.emit();
      });
  }

  /**
   * @description
   * pagination calculation and index find for line item edit triggered
   */
  private paginationCalc(data) {
    if (!data) {
    let pagination = Helper.deepClone(this.pagination) ?? {};
    pagination.page = pagination.page ?? 1; /* added due to ES API resp will not have key */
    pagination.page = (((this.pagination?.page - 1) * this.pagination.perPage)) ?? 0;
    pagination.page += 1;
    pagination.perPage = 1;
    return pagination
    }
    const index = this.tableData?.results.findIndex(each => each._id === data.id);
    let pagination = Helper.deepClone(this.pagination) ?? {};
    pagination.page = pagination.page ?? 1; /* added due to ES API resp will not have key */
    pagination.page = (((this.pagination.page - 1) * this.pagination.perPage) + index) ?? 0;
    pagination.page += 1;
    pagination.perPage = 1;
    return pagination;
  }

  onAddLineItemsDialog(lineItemData?: any, isForDuplicate = false, paginate = null) {
    const dialogRef = this.dialog.open(AddLineItemDialogComponent, {
      height: '98%',
      width: '1279px',
      panelClass: 'add-line-items-modal',
      disableClose: true,
      autoFocus: false,
      data: {
        fullScreenMode: true,
        contract: this.contract,
        lineItemData,
        isForDuplicate,
        elasticSearchId: this.elasticSearchId,
        clientId: this.contract?.client?._id,
        pagination: paginate !== null ? paginate : this.paginationCalc(lineItemData),
        sort: Helper.deepClone(this.sort),
        userPermission : this.userPermission,
        module: UserRole.CONTRACT
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this._getContractsLineItems(this._contractId, this.sort, this.pagination);
        this.lineItemModified.emit();
      }
    });
  }

  onImportLineItemsDialog(data = null) {
    const dialogRef = this.dialog.open(ImportLineItemsDialogComponent, {
      data: {
        ...data,
        contract: this.contract,
        contractId: this.contract?._id
      },
      panelClass: ['app-import-line-item', 'line-item-import-dialog-container'],
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.['success']) {
        this._getContractsLineItems(this._contractId, this.sort, this.pagination);
        this.lineItemModified.emit();
      }
    });
  }


  getClientsList(
    searchKey = '',
    scorll = false
  ) {
    this.isClientsListLoading = true;
    this.clientFilters.filter = {
      isParent: false
    };
    this.clientFilters.search = searchKey;
    if (scorll) {
      this.offset += this.CLIENTS_PER_PAGE_LIMIT;
    }
    if (this.getClientsByFiltersAPI !== null) {
      this.getClientsByFiltersAPI.unsubscribe();
    }
    this.getClientsByFiltersAPI = this.contractsSearchService
      .getClientsByFilters(this.offset, this.clientFilters)
      .subscribe((res: FilterClientsResponse) => {
        this.isClientsListLoading = false;
        this.clients = res?.results;
        this.clientsAutocompleteItems = AutocompleteMapper<FilteredClient>(
          res?.results
        );
        this.isComplete = this.offset >= res?.pagination?.total;
        this.parentClientPagination = res?.pagination;
      });
  }

  public onClientSelectChanged(client) {
    const value = client?.id ? client.value : client;
    this.selectedClientContact = {};
    this._getClientContactsByClientName(value);
  }

  public parentClientDisplayWithFn(client) {
    return client ? client?.value : '';
  }

  public parentClientTrackByFn(idx: number, client) {
    return client?.id ?? idx;
  }

  onCheckboxCanged(event: MatCheckboxChange) {
    const eventsIds: string[] = MapToSaveContractsCheckpoints(
      this.contractCheckpoints,
      this.contractEvents
    );

    this.eventsSelectionChanged.emit({ eventsIds, contractCheckpoints: this.contractCheckpoints });
  }

  onStatusChanged(event) {
    const currentStatus = this.contractStatuses.find(
      (status) => status.code === this.currentContractStatus
    );
    this.statusSelectionChanged.emit(currentStatus._id);
  }

  public onCampaignChanged(event, value) {
    if (!event.isUserInput) { return; }
    this.selectedCampaign = value;
  }

  public onBuyerChanged(event, value) {
    if (!event.isUserInput) { return; }
    this.selectedBuyer = value;
  }

  public onClientContactChanged(event, value) {
    if (!event.isUserInput) { return; }
    this.selectedClientContact = value;
  }

  public updateContainer() {
    this.panelContainer = '.parent-client-autocomplete';
  }

  public updateBuyerContainer() {
    this.panelBuyerContainer = '.buyer-list-autocomplete';
  }

  public buyerDisplayWithFn(buyer) {
    if (buyer?.firstName)
      return buyer?.firstName + ' ' + buyer?.lastName;
    else if (buyer?.name)
      return buyer.name
    else
      return '';
  }

  public buyerTrackByFn(idx: number, buyer) {
    return buyer?._id ?? idx;
  }

  private _findClientByName(clientName: string): AppAutocompleteOptionsModel {
    const client = this.clientsAutocompleteItems?.find(
      (client) => client.value === clientName
    );

    if (client)
      return client;
    else if (clientName && !client)  /* selected client status changed to parent -- such cases return selected client  */
      return this.contractDetails?.client;
    else
      return null;
  }

  private _mapToContractCreate(contractFormValue: any): CreateUpdateContract {
    /**
     * refractor - value emit mapper
     * Changed mapper logic - previously field value checked with auto completed, its causes field value out of range with autocomplete initial set
     * now handled with direct reactive form values with validation
     */
    const createUpdateContract: CreateUpdateContract = {
      buyer:  this.contractDetailsForm.controls?.buyer?.value?._id,
      client: this.contractDetailsForm.controls?.client?.value?.id,
      clientContact: this.contractDetailsForm.controls?.clientContact?.value,
      project: this.contractDetailsForm.controls?.campaign?.value,
      contractName: this.contractDetailsForm.controls['contractName'].value,
      poNumber: this.contractDetailsForm.controls['poNumber'].value,
      totalAuthorizedAmount: this._getTotalAuthorizedAmountAsNumber(
        this.contractDetailsForm.controls['totalAuthorizedAmount'].value
      )
    };

    return createUpdateContract;
  }

  private _firstSaveModelInit(contractDetails: ContractDetails) {
    const createUpdateContract: CreateUpdateContract = {
      buyer: contractDetails?.buyer?._id,
      client: contractDetails?.client?.id,
      clientContact: contractDetails?.clientContact?.id,
      project: contractDetails?.campaign?.id,
      contractName: contractDetails?.contractName,
      poNumber: contractDetails?.poNumber,
      totalAuthorizedAmount: +contractDetails.totalAuthorizedAmount
    };

    this.contractUpdate = createUpdateContract;

    const output: ContractDetailsEmit = {
      form: this.contractDetailsForm,
      model: createUpdateContract
    };

    this.valueChanged.emit(output);
  }

  private _getTotalAuthorizedAmountAsNumber(totalAmount: string) {
    // const floatAsString = totalAmount.slice(2);
    const floatAsString = totalAmount;

    return parseFloat(floatAsString);
  }

  /**deprecated -- User changed to contacts */
  private _getAllUsers() {
    this.contractsSearchService
      .getAllUsers()
      .subscribe((res: ContractsSearchBuyerApi) => {
        this.usersAutocompleteItems = AutocompleteUsersMapper(res.result);
      });
  }

  private initBuyerCotactSetup() {
    this.recordService
      .getContactTypes({ page: 1, perPage: 50 })
      .pipe(filter((res) => !!res.results), takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        const types: any[] = res?.results ? res.results : [];
        const selectedValue = types?.filter(each =>
          each?.name.toLowerCase() == CONTACT_LIST_TYPES.MEDIA.toLowerCase() ||
          each?.name.toLowerCase() == CONTACT_LIST_TYPES.MANAGEMENT.toLowerCase()
        ).map(_val => _val?._id);
        this.setUpBuyerContacts(selectedValue);
      });
  }

  private setUpBuyerContacts(contactTypes = []) {
    const buyerSearchCtrl = this.contractDetailsForm?.controls?.buyer?.valueChanges;

    if (buyerSearchCtrl) {
      this.buyerAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        buyerSearchCtrl
      );
      this.buyerAutoComplete.pagination.perPage = 25;

      this.buyerAutoComplete.apiEndpointMethod = () => {
        const payload = {
          search: this.buyerAutoComplete.searchStr,
          filter: {
            companyTypes: ['User'],
            contactTypes: contactTypes
          }
        };
        const fieldSet = ["_id", "firstName", "lastName", "companyId", "companyType"];
        return this.contractsSearchService
          .getContacts(
            payload,
            fieldSet,
            this.buyerAutoComplete.pagination,
          )
          .pipe(filter((res: any) => !!res.results));
      };

      this.buyerAutoComplete.listenForAutoCompleteSearch(
        this.contractDetailsForm,
        'buyer',
        null,
        (res) => {
          this.buyerAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
      this.buyerAutoComplete.loadData(null, null);
    }
  }

  private _getAllCampaigns() {
    this.contractsSearchService
      .getAllCampaigns({})
      .subscribe((res: ApiIncoming<NestedItem>) => {
        this.campaignsAutocompleteItems = AutocompleteMapper<NestedItem>(
          res.projects
        );
      });
  }

  private _getAllClientContacts(organizationId: string) {
    this.isClientContactLoading = true;
    this.contractsSearchService
      .getAllClientContacts(organizationId, true)
      .subscribe((res: ApiIncoming<ClientContact>) => {
        this.isClientContactLoading = false;
        this.clientContactAutocompleteItems = AutocompleteMapper<ClientContact>(
          res.results
        );
      });
  }

  private _getClientContactsByClientName(clientName) {
    const clientModel = this.clients?.find(
      (client) => client.clientName === clientName
    );

    if (!clientModel || !clientModel.organizationId) {
      return;
    }

    this._getAllClientContacts(clientModel.organizationId);
  }

  private _getAllContratEvents() {
    this.contractsService
      .getAllContractEvents()
      .subscribe((res: ApiIncoming<ContractEvent>) => {
        this.contractEvents = res.results;
      });
  }

  private _getAllContratStatuses() {
    this.contractsService
      .getAllContractStatuses()
      .subscribe((res: ApiIncoming<ContractStatus>) => {
        this.contractStatuses = res.results;
      });
  }

  /* method changed to init connection of ES and get elastic search ID */
  private _getContractsLineItems(
    contractId: string,
    sort: Sort = null,
    pagination: Pagination = null,
    noLoader = true,
  ) {
    this.unSubES$.next();
    this.unSubES$.complete();
    this.unSubES$ = new Subject<void>();

    const sortDup = Helper.deepClone(sort);
    if (sortDup['active'] === 'lineItemId') {
      sortDup['active'] = 'createdAt';
    }
    this.contractLineItemsService
      .searchContractLineItemEsRequest(contractId, [], noLoader)
      .subscribe((res: ElasticSearchResponse) => {
        if (res?._id) {
          this.elasticSearchId = res._id;
          this.getContractLineItemsByESSearchId(contractId, sortDup, pagination);
        }
      });
  }

  /* method used to get results from ES API call */
  private getContractLineItemsByESSearchId(
    contractId: string,
    sort: Sort = null,
    pagination: Pagination = null,
    noLoader = true
  ){
    this.isLoadingLineItems = true;
    const sortDup = Helper.deepClone(sort);
    if (sortDup['active'] === 'lineItemId') {
      sortDup['active'] = 'createdAt';
    }

    switch(sort.active){
      case 'lineItemStatus':
        sortDup.active = 'itemStatus.name';
        break;
      case 'market':
        sortDup.active = 'media.dma.name';
        break;
      case 'vendor':
        sortDup.active = 'vendor.name';
        break;
      case 'mediaType':
        sortDup.active = 'spotDetails.mediaType';
        break;
      case 'gross':
        sortDup.active = 'totalSummary.gross';
        break;
      case 'fee':
        sortDup.active = 'totalSummary.fee';
        break;
      case 'tax':
        sortDup.active = 'totalSummary.tax';
        break;
      case 'net':
        sortDup.active = 'totalSummary.net';
        break;
      case 'description':
        sortDup.active = 'spotDetails.mediaDescription';
        break;
    }

    const isFieldValueString = /^(lineItemType|lineItemStatus|market|vendor|mediaType|description)$/.test(sort.active);
    const isunMappedTypeDate = /^(startDate|endDate)$/.test(sort?.active);

    this.contractLineItemsService
    .getContractLineItemsByESSearchId(contractId,this.elasticSearchId, sortDup, isFieldValueString, pagination, noLoader, this.unSubES$, isunMappedTypeDate)
    .subscribe((res: any) => {
      this.isLoadingLineItems = false;
      const resData = res?.body;
      this.isSearchInValid = resData?.search?.isValid;

      if (!resData) {
        return;
      }
      this.pagination.total = resData?.pagination?.total;
      this.pagination.found = resData?.pagination?.found;
      this.tableData = resData;
    });
  }

  public refreshLineItems() {
    this._getContractsLineItems(this._contractId, this.sort, this.pagination);
  }

  private _adjustContractCostsSummaryForDisplay(
    contractCosts: ContractCostsSummary[]
  ): ContractCostsDisplay {
    if (!contractCosts || !contractCosts.length) {
      return;
    }

    if (contractCosts.length === 1) {
      const contractCostsDisplay: ContractCostsDisplay = {
        last: contractCosts[0]
      };

      return contractCostsDisplay;
    }

    if (contractCosts.length === 2) {
      const contractCostsDisplay: ContractCostsDisplay = {
        first: contractCosts[0],
        last: contractCosts[1]
      };

      return contractCostsDisplay;
    }

    const middleItems: ContractCostsSummary[] = [];

    for (let i = 1; i < contractCosts.length - 1; i++) {
      middleItems.push(contractCosts[i]);
    }

    const contractCostsDisplay: ContractCostsDisplay = {
      first: contractCosts[0],
      middle: middleItems,
      last: contractCosts[contractCosts.length - 1]
    };

    return contractCostsDisplay;
  }

  ngOnInit() {
    this.save$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(({ clearCheckpoints }) => {
        if (clearCheckpoints) {
          this.contractCheckpoints = {};
        }
      });
    const tab = this.activeRoute.snapshot.queryParams['tab'];
    const lineItemID = this.activeRoute.snapshot.queryParams['id'];
    if (lineItemID) {
      this.contractLineItemsService
      .getLineItemDetails(this.contractId, lineItemID)
      .subscribe((data) => {
        const splitId = data['lineItemId'].toString().split('-');
        this.contractLineItemsService
          .getLineItemByIineItemNo(data['contract']['_id'], splitId[splitId.length - 1])
          .subscribe((res) => {
            let paginate = res?.pagination?.found ? res?.pagination : {
              total: 2,
              found: 2,
              page: 1,
              perPage: 1,
              pageSize: 1
            };
            paginate.perPage = 1;
            paginate.pageSize = 1;
            paginate.found = paginate.total;
            this.onEditLineItem(data, false, paginate);
          });
      });
    }
  }

  ngAfterViewInit() {
    this.contractDetailsForm
      .get('client')
      .valueChanges.pipe(debounceTime(1000))
      .subscribe((value) => {
        if (typeof value !== 'object') {
          this.offset = 25;
          this.getClientsList(value, false);
        }
      });
    this.performUserRoleAccess(this.userPermission);
  }
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.unSubES$.next();
    this.unSubES$.complete();
  }

  public openDeleteImportValidationDialog() {
    if (this.tableData?.lastImportedDetails?.errorLines > 0) {
      this.onImportLineItemsDialog({
        dialogStatus: ImportLineItemsSteps.lineItemsValidationFromImports
      });
    }
  }

  /**
   * @description
   *  this method is used to form the text for copy to clipboard
   *  functionality.
   */
  public get contactCostSummaryText(): string {
    if (!this.contractCostsDisplay) {
      return '';
    }
    const costSummary: Array<Array<number | string>> = [
      ['', 'GROSS', 'NET', 'TAX', 'FEE', 'CLIENT NET']
    ];
    if (this.contractCostsDisplay.first) {
      costSummary.push([
        this.contractCostsDisplay.first.fieldName,
        this.contractCostsDisplay.first.costs.gross,
        this.contractCostsDisplay.first.costs.net,
        this.contractCostsDisplay.first.costs.tax,
        this.contractCostsDisplay.first.costs.fee,
        this.contractCostsDisplay.first.costs.clientNet
      ]);
    }

    // tslint:disable-next-line:max-line-length
    if (this.contractCostsDisplay.middle) {
      this.contractCostsDisplay.middle.forEach((contractCostsDisplay) =>
        costSummary.push([
          contractCostsDisplay.fieldName,
          contractCostsDisplay.costs.gross,
          contractCostsDisplay.costs.net,
          contractCostsDisplay.costs.tax,
          contractCostsDisplay.costs.fee,
          contractCostsDisplay.costs.clientNet
        ])
      );
    }

    if (this.contractCostsDisplay.last) {
      costSummary.push([
        String(this.contractCostsDisplay.last.fieldName).toUpperCase(),
        this.contractCostsDisplay.last.costs.gross,
        this.contractCostsDisplay.last.costs.net,
        this.contractCostsDisplay.last.costs.tax,
        this.contractCostsDisplay.last.costs.fee,
        this.contractCostsDisplay.last.costs.clientNet
      ]);
    }
    let str = '';
    costSummary.forEach((c) => (str += c.join('\t') + '\n'));
    return str;
  }

  copyTheCostSummary() {
    const message = `Contract Cost Summary copied to your Clipboard`;
    this.snackbarService.showsAlertMessage(message);
  }

  performUserRoleAccess(access: UserActionPermission) {
    if (!access?.edit) {
      this.contractDetailsForm.disable();
    }
  }

  openNewClientWindow() {
    window.open(`${location.origin}/records-management-v2/clients/add`, '_blank');
  }
  openNewContactWindow() {
    const url = `${location.origin}/records-management-v2/clients/${this.contractDetailsForm?.controls?.client?.value?.id}?tab=createContacts`
    window.open(url, '_blank');
  }

  /**
   * @description
   * As per ticket 4145, we are disabling the client by following condition
   * Role: Contract Editor  - The Client value cannot be edited if "Approved for Billing" = TRUE
   * @private
   */
  private updateClientDisable(): void {
    const isApprovedForBilling = this.contractCheckpoints.approvedForBillingExport; // todo
    this.disableClient =
      isApprovedForBilling &&
      AuthenticationService.checkUserRoleExistsOrNot(
        UserRoleTypes.CONTRACT_EDIT_ROLE
      );

    if (this.disableClient) {
      this.contractDetailsForm.controls.client.disable();
    } else {
      this.contractDetailsForm.controls.client.enable();
    }
  }

  // VCD is vendor contract distributed
  public get disableVCDAndApprovedForBilling(): boolean {
    return (
      !AuthenticationService.isUserContractManager() 
    );
  }
}
