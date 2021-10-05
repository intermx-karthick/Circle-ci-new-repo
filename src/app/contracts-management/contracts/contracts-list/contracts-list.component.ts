import { ContractsListTableComponent } from './contracts-list-table/contracts-list-table.component';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { User } from "@auth0/auth0-spa-js";
import { ApiIncoming, Contract, ContractEvent, ContractsPagination, ContractsSearch, ContractsTableItem, CreateContractDialog, CreateContractResultDialog, DisplayedColumns, NestedItem, Pagination } from "app/contracts-management/models";
import { ContractsSearchService } from "app/contracts-management/services/contracts-search.service";
import { ContractsService } from "app/contracts-management/services/contracts.service";
import { ContractsMapper } from "../contracts-shared/helpers/contracts.mapper";
import { AutocompleteMapper } from "../contracts-shared/helpers/autocomplete.mapper";
import { AddContractDialogComponent } from "./add-contract-dialog/add-contract-dialog.component";
import { FilterClientsPayload, FilterClientsResponse, FilteredClient } from "@interTypes/records-management";
import { ContractStatus } from "app/contracts-management/models/contract-status.model";
import { MapToContractSearch } from "../contracts-shared/helpers/contract-search-model.mapper";
import { ContractsSearchBuyerApi } from "app/contracts-management/models/contracts-search-buyer.model";
import { AppAutocompleteOptionsModel } from "@shared/components/app-autocomplete/model/app-autocomplete-option.model";
import { ContractsTableData } from "app/contracts-management/models/contracts-table-data.model";
import { CreateUpdateContract } from "app/contracts-management/models/create-contract.model";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { CreateContractResponse } from "app/contracts-management/models/create-contract-response.model";
import { Sort } from "@angular/material/sort";
import { CustomColumnsArea } from "@interTypes/enums";
import { saveAs } from 'file-saver';
import { DeleteConfirmationDialogComponent } from "@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component";

import { Subject } from "rxjs";
import { debounceTime, filter, takeUntil } from "rxjs/operators";
import { Helper } from 'app/classes';
import { ElasticSearchResponse } from '@interTypes/elastic-search.response';
import { AuthenticationService } from '@shared/services';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { RecordsPagination } from '@interTypes/pagination';
import { forbiddenNamesValidator } from '@shared/common-function';
import { UseAutoCompleteInfiniteScroll } from 'app/classes/use-auto-complete-infinite-scroll';
import { RecordService } from 'app/records-management-v2/record.service';
import { CONTACT_LIST_TYPES } from '@constants/contact-list-types';

interface ContractsSearchValues {
  search: string;
  filters: {
    buyer: string;
    client: string;
    contractName: string;
    status: string;
    contractEvents: string;
    project: string;
    startDate: string;
    endDate: string;
    contractId?: string;
    clientValue?: string;
  };
}

interface ContractsSearchCriteriaModel {
  searchCriteria: ContractsSearchValues;
  pagination: Pagination;
  sort: Sort;
}

@Component({
    selector: 'app-contracts-list',
    templateUrl: './contracts-list.component.html',
    styleUrls: ['./contracts-list.component.less']
})
export class ContractsListComponent implements OnInit, OnDestroy {

  private unSub$: Subject<void> = new Subject<void>();
  private unSubES$: Subject<void> = new Subject<void>();

  private modelBoxListner$: Subject<any> = new Subject<any>();

  public contractSearchForm: FormGroup;
  public maxDate = new Date('12/31/9999');
  public usersAutocompleteItems: AppAutocompleteOptionsModel[] = [];
  public clientsAutocompleteItems: AppAutocompleteOptionsModel[] = [];
  public contrtactStatusesAutocompleteItems: AppAutocompleteOptionsModel[] = [];
  public campaignsAutocompleteItems: AppAutocompleteOptionsModel[] = [];
  public contractsTableData: ContractsTableData = {}

  public buyerAutoComplete: UseAutoCompleteInfiniteScroll<any> = new UseAutoCompleteInfiniteScroll<any>();
  public panelBuyerContainer: string;

  public isClientsListLoading = false;
  public panelContainer: any;
  public parentClientPagination: RecordsPagination;
  public contractEvents: ContractEvent[];

  private readonly CLIENTS_PER_PAGE_LIMIT = 10;
  public offset = 0;
  public searchValue: ContractsSearch;
  public isComplete = false;

  public contractsPagination: ContractsPagination = {
    page: 1,
    perPage: 50 // Default perPage size
  }

  public sort: Sort = {
    active: "lastModified",
    direction: "desc"
  };
   public isActionDuplicate = false;
  public contractId = '';
  public contractDetails: Contract = {} as Contract;
  public isLoadingContracts = false;
  public elasticSearchId = '';
  public isSearchInValid = false;
  public searchFilterApplied = false;
  public clientFilters: FilterClientsPayload = {
    filter: {
      isParent: false
    }
  } as FilterClientsPayload;

  private defaultColumns:DisplayedColumns[] = []

  userPermission: UserActionPermission;
  private LOCAL_STORAGE_KEY = 'contracts-list-search-criteria';

  constructor(
    public cdRef: ChangeDetectorRef,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private contractsService: ContractsService,
    private contractsSearchService: ContractsSearchService,
    private router: Router,
    private activateRoute: ActivatedRoute,
    public contractTable: MatDialogRef<ContractsListTableComponent>,
    private auth: AuthenticationService,
    public recordService: RecordService,
  ) {
    this.contractId = this.activateRoute.snapshot?.queryParams['contractId'];
    this.isActionDuplicate = !!this.contractId;
    this.contractSearchForm = fb.group({
      contractId: [null, Validators.pattern("^[0-9]*$"),],
      buyer: [null,null,forbiddenNamesValidator],
      clientName: [null, null, forbiddenNamesValidator],
      contactName: [null],
      contactStatus: [null],
      contractEvents: [null],
      campaign: [null],
      start: [],
      end: []
    });
    this.updateLastSearchCriteria();
    this.listnerToOpenModel();
    this.getClientsList();

    this._getAllContractStatuses();
    this._getAllCampaigns();
    this._getAllContratEvents();
    this.initBuyerCotactSetup();

    this.onSearch(true);
    this.userPermission = this.auth.getUserPermission(UserRole.CONTRACT);

    this.contractSearchForm.get('clientName').valueChanges.pipe(debounceTime(1000)).subscribe((value) => {
      if(typeof value !== 'object') {
        this.getClientsList(value, false)
      }
    });
  }

  ngOnInit(): void {

  }

  openAddContractDialog() {
    let modalData: CreateContractDialog = {
      clients: [...this.clientsAutocompleteItems],
      buyers: [...this.usersAutocompleteItems],
      campaigns: [...this.campaignsAutocompleteItems]
    }

    /** Append contract details for duplicate action call  */
    if (this.isActionDuplicate) {
      modalData.preloadValues = { selectedContract: this.contractDetails };
    }

    const dialogRef = this.dialog.open(AddContractDialogComponent, {
      width: '700px',
      data: modalData
    });

    dialogRef.afterClosed().subscribe((result: CreateContractResultDialog) => {
      if(!result) {
        return;
      }
      this.isActionDuplicate = false; // will set action value false once action done
      const createContract: CreateUpdateContract = ContractsMapper.ToCreateContractModel(result);

      this.contractsService.createContract(createContract)
      .subscribe((res: CreateContractResponse) => {
        if(!res) {
          return;
        }

        this._showsAlertMessage(res.message)

        if(res.data.id) {
          if(this.dialog?.getDialogById('fullscreen-contracts-table')?.getState() == 0) {
            this.dialog.getDialogById('fullscreen-contracts-table').close();
          }
          this.router.navigateByUrl(`/contracts-management/contracts/${res.data.id}`)
        }

        //this._getContracts(this.sort, this.contractsPagination);
       })
    });
  }

  onSearch(isForInitialLoad = false) {
    const formValue = this.contractSearchForm.value;

    // use search value ONLY with Mapper!
    // TODO: fix
    this.searchValue = MapToContractSearch(formValue);

    if (!isForInitialLoad) {
      this.searchFilterApplied = true;
      this.contractsPagination = {
        page: 1,
        perPage: 50
      };
    }

    this._getContracts(this.sort, this.contractsPagination, this.searchValue);
    if (!isForInitialLoad) {
      this.setFiltersInLocalstorage(
        this.searchValue,
        this.contractsPagination,
        this.sort
      );
    }
  }

  public parentClientDisplayWithFn(client) {
    return client?.value ? client.value : '';
  }

  public parentClientTrackByFn(idx: number, client) {
    return client?.id ?? idx;
  }

  public updateContainer() {
    this.panelContainer = '.parent-client-autocomplete';
  }

  public getClientsList(searchKey = '', searchClient = true) {
    this.isClientsListLoading = true;
    if(searchClient) {
      this.offset += this.CLIENTS_PER_PAGE_LIMIT;
    }
    this.clientFilters.search = searchKey;
    this.contractsSearchService.getClientsByFilters(this.offset, this.clientFilters)
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: FilterClientsResponse) => {
        this.isClientsListLoading = false;
        this.clientsAutocompleteItems = AutocompleteMapper<FilteredClient>(res && res?.results ? res?.results : []);
        this.modelBoxListner$.next('clientList'); // sent value to sub listener once res received
        this.isComplete = this.offset >= res?.pagination?.total;
        this.parentClientPagination = res?.pagination;
      });
  }

  onReset() {
    this.contractSearchForm.reset();
    this.searchValue = {};
    this.searchFilterApplied = false;
    this.isSearchInValid = false;
    this._getContracts(this.sort, this.contractsPagination, this.searchValue);
    this.resetLocalstorageSearchCriteria();
  }

  onPaginationChanged(event: ContractsPagination) {
    this.contractsPagination = event;
    this.getContractsByESSearchId(this.sort, this.contractsPagination, false);
    this.setFiltersInLocalstorage(null, this.contractsPagination, this.sort);
  }

  onSortChanged(sort: Sort) {
    this.sort = sort;
    this.getContractsByESSearchId(sort, this.contractsPagination, false);
    this.setFiltersInLocalstorage(null, this.contractsPagination, this.sort);
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

  /**deprecated -- User changed to contacts */
  private _getAllUsers() {
    this.contractsSearchService.getAllUsers().pipe(takeUntil(this.unSub$))
      .subscribe((res: ContractsSearchBuyerApi) => {
        this.usersAutocompleteItems = AutocompleteMapper<User>(res && res.result ? res.result : []);
        this.modelBoxListner$.next('allUsers'); // sent value to sub listener once res received
    })
  }

  private initBuyerCotactSetup() {
    this.recordService
      .getContactTypes({ page: 1, perPage: 50 })
      .pipe(filter((res) => !!res.results), takeUntil(this.unSub$))
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
    const buyerSearchCtrl = this.contractSearchForm?.controls?.buyer?.valueChanges;

    if (buyerSearchCtrl) {
      this.buyerAutoComplete.loadDependency(
        this.cdRef,
        this.unSub$,
        buyerSearchCtrl
      );
      this.buyerAutoComplete.pagination.perPage = 25;

      this.buyerAutoComplete.apiEndpointMethod = () => {
        const payload = {
          search: this.buyerAutoComplete.searchStr,
          filter: {
            companyTypes: ['User'],
            contactTypes: contactTypes,
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
        this.contractSearchForm,
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

  private _getAllContractStatuses() {
    this.contractsService.getContractStatuses().pipe(takeUntil(this.unSub$))
    .subscribe((res: ApiIncoming<ContractStatus>) => {
      this.contrtactStatusesAutocompleteItems = AutocompleteMapper<ContractStatus>(res.results);
      this.modelBoxListner$.next('contractStatus'); // sent value to sub listener once res received

    });
  }

  private _getAllCampaigns() {
    this.contractsSearchService.getAllCampaigns({}).pipe(takeUntil(this.unSub$))
    .subscribe((res: ApiIncoming<NestedItem>) => {
      this.campaignsAutocompleteItems = AutocompleteMapper<NestedItem>(res && res?.projects ? res.projects : []); // Fix for projects assign as undefine.
      this.modelBoxListner$.next('campaigns'); // sent value to sub listener once res received
    })
  }


 // table related code
  private _getContracts(
    sort: Sort = null,
    pagination: ContractsPagination = null,
    searchValue: ContractsSearch = null,
    noLoader = true
  ) {
    const payload = searchValue;
    if(!payload) return;
    this.unSubES$.next();
    this.unSubES$.complete();
    this.unSubES$ = new Subject<void>();
    this.isLoadingContracts = true;
    const fieldsets = this.getLineItemsFieldSets();
    const sortDup = Helper.deepClone(sort);
    this.contractsSearchService
      .searchAllContractsEsRequest(fieldsets, payload, noLoader)
      .subscribe((res: ElasticSearchResponse) => {
        if (res?._id) {
          this.elasticSearchId = res._id;
          this.getContractsByESSearchId(sort, pagination, noLoader);
        }
      });
  }

  private getContractsByESSearchId(
    sort: Sort = null,
    pagination: ContractsPagination = null,
    noLoader = true
  ) {
    this.isLoadingContracts = true;
    const sortDup = Helper.deepClone(sort);

    switch(sort.active){
      case 'contractStatus':
        sortDup.active = 'status.name';
        break;
      case 'buyer':
        sortDup.active = 'buyer.name';
        break;
      case 'clientName':
        sortDup.active = 'client.clientName';
        break;
      case 'contractName':
        sortDup.active = 'contractName';
        break;
      case 'office':
        sortDup.active = 'client.office.name';
        break;
      case 'dateCreated':
        sortDup.active = 'createdAt';
        break;
      case 'lastModified':
        sortDup.active = 'updatedAt';
        break;
      case 'totalClientNet':
        sortDup.active = 'summary.total.clientNet';
        break;
      case 'totalNet':
        sortDup.active = 'summary.total.net';
        break;
      case 'totalGross':
        sortDup.active = 'summary.total.gross';
        break;
      case 'totalTax':
        sortDup.active = 'summary.total.tax';
        break;
      case 'totalFee':
        sortDup.active = 'summary.total.fee';
        break;
      }

    const isFieldValueString = /^(contractStatus|buyer|clientName|contractName|office|startDate|endDate)$/.test(sort.active);
    const isunMappedTypeDate = /^(dateCreated|lastModified)$/.test(sort?.active);

    this.contractsSearchService
    .getContractsByESSearchId(this.elasticSearchId, sortDup, isFieldValueString, pagination, noLoader, this.unSubES$, isunMappedTypeDate)
    .subscribe((res: any) => {
      this.isLoadingContracts = false;
      const resData = res?.body;
      this.isSearchInValid = resData?.search?.isValid;

      if (!resData) {
        return;
      }

      const foundContracts = ContractsMapper.ToTableViewModel([...resData.results]);
      this.contractsTableData.contractTableItems = foundContracts;
      this.contractsTableData.found = resData.pagination.found;
      this.contractsTableData.total = resData.pagination.total;
      this.contractsTableData = {...this.contractsTableData, contractTableItems: this.contractsTableData.contractTableItems};

      this.cdRef.markForCheck();
    });
  }

  private getLineItemsFieldSets(){
    return [
      '_id',
      'contractId',
      'contractName',
      'contractStatus',
      'client',
      'summary',
      'startDate',
      'endDate',
      'buyer',
      'createdAt',
      'updatedAt',
      'status'
    ]

  }

  /**
   * @description
   * methot to call contract details by ID API
   * Queryparams removed , based on action validation Add model will be call
   */
  private _getContractById() {
    this.contractsService.getContractById(this.contractId).pipe(takeUntil(this.unSub$))
      .subscribe((res: Contract) => {
        if (res?._id) {
          this.contractDetails = res;
          this.contractDetails.buyer = { ...this.contractDetails?.buyer, ...this.contractDetails?.buyer?.name };
          (this.isActionDuplicate) ? this.openAddContractDialog() : '';
        }
      });
    this.router.navigate([], { relativeTo: this.activateRoute, queryParams: {} });
  }


  /**
   * @description
   * API response complete - listner for all add contract model widow depended API's
   * To trigger contract details API call once all other responses received
   */
   private async listnerToOpenModel() {
    const receivedVal = [];
    this.modelBoxListner$.subscribe((values) => {
      receivedVal.push(values);
      if (receivedVal.includes('campaigns') &&
        receivedVal.includes('clientList') && receivedVal.includes('contractStatus') && this.isActionDuplicate) {
        this._getContractById();
      }
    });
  }


  private _showsAlertMessage(msg, action = '') {
    const config: MatSnackBarConfig = {
      duration: !action ? 3000 : null
    };

    this.matSnackBar.open(msg, action, config);
  }

  /**
 *
 * @param defaultColumn  Default customized column
 */
  public onDefaultColumn(defaultColumn){
    this.defaultColumns = [...defaultColumn];
  }

  public exportContractCSV() {
    const cachedColumns = localStorage.getItem(CustomColumnsArea.CONTRACTS_TABLE);
    const localCustomColums = cachedColumns ? JSON.parse(cachedColumns) : this.defaultColumns;
    localCustomColums.splice(0, 0, { displayname: "Contract ID", name: "contractId" })
    const fieldSet = localCustomColums.filter((column) => column.name != 'action').map(column => column.name).join(',');
    this.contractsService
      .exportContractList(this.searchValue, fieldSet, this.sort, 'csv', false)
      .subscribe(
        (response) => {
          const contentType = response['headers'].get('content-type');
          const contentDispose = response.headers.get('Content-Disposition');
          const matches = contentDispose?.split(';')[1].trim().split('=')[1];
          if (contentType.includes('text/csv')) {
            let filename = matches && matches.length > 1 ? matches : 'contract' + '.csv';
            filename = filename.slice(1, filename.length-1);
            saveAs(response.body, filename);
          } else if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
            let filename = matches && matches.length > 1 ? matches : 'contract' + '.xlsx';
            filename = filename.slice(1, filename.length-1);
            saveAs(response.body, filename);
          } else {
            this._showsAlertMessage(
              'Something went wrong, Please try again later'
            );
          }
        },
        (errorResponse) => {
          if (errorResponse.error?.message) {
            this._showsAlertMessage(errorResponse.error?.message);
            return;
          }
          this._showsAlertMessage(
            'Something went wrong, Please try again later'
          );
        }
      );
  }

  initListActionDuplicate(element) {
    this.contractId = element?.id;
    this.isActionDuplicate = true;
    this._getContractById();
  }

  /**
   * @description
   * method to init API call for delete contract by id
   */
   listActionDeleteContract(element) {
    if (element !== null && element?.id) {
      this.dialog
        .open(DeleteConfirmationDialogComponent, {
          width: '340px',
          height: '260px',
          panelClass: 'imx-mat-dialog'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res['action']) {
            this.contractsService
              .deleteContract(element.id)
              .pipe(takeUntil(this.unSub$))
              .subscribe((response) => {
                if (response.status == 'success') {
                  this._showsAlertMessage(response.message);
                  setTimeout(() => {
                    this._getContracts(this.sort, this.contractsPagination, this.searchValue);
                  }, 500);
                }
                else {
                  if (response.error.status === 400){
                    this._showsAlertMessage(
                      response?.error?.message ?? response?.message, 'Dismiss'
                    );
                  }else{
                    this._showsAlertMessage(
                      response?.error?.message ?? response?.message
                    );
                  }
                }
              });
          }
        });
    }
  }
  private _getAllContratEvents() {
    this.contractsService
      .getAllContractEvents()
      .subscribe((res: ApiIncoming<ContractEvent>) => {
        this.contractEvents = res.results;
      });
  }
  private setFiltersInLocalstorage(
    searchValue: ContractsSearch,
    pagination: ContractsPagination,
    sort: Sort
  ): void {
    try {
      const cachedSearchCriteriaStr = localStorage.getItem(
        this.LOCAL_STORAGE_KEY
      );
      let cachedSearchCriteria = {} as any;

      if (cachedSearchCriteriaStr) {
        cachedSearchCriteria = JSON.parse(cachedSearchCriteriaStr);
      }

      if (searchValue) {
        cachedSearchCriteria.searchCriteria = searchValue;
        cachedSearchCriteria.searchCriteria.filters.buyer =
          this.contractSearchForm.controls?.buyer?.value ?? '';
        cachedSearchCriteria.searchCriteria.filters.client =
          this.contractSearchForm.controls?.clientName?.value ?? '';
      }
      if (pagination) {
        cachedSearchCriteria.pagination = pagination;
      }
      if (sort) {
        cachedSearchCriteria.sort = sort;
      }

      localStorage.setItem(
        this.LOCAL_STORAGE_KEY,
        JSON.stringify(cachedSearchCriteria)
      );
    } catch (e) {}
  }

  private getSearchCriteriaFromLocalStorage(): ContractsSearchCriteriaModel {
    const cachedSearchCriteriaStr = localStorage.getItem(
      this.LOCAL_STORAGE_KEY
    );

    if (cachedSearchCriteriaStr) {
      return JSON.parse(cachedSearchCriteriaStr);
    }

    return null;
  }

  private updateLastSearchCriteria(): void {
    const cachedSearchCriteria = this.getSearchCriteriaFromLocalStorage();
    if (!cachedSearchCriteria) {
      return;
    }
    if (cachedSearchCriteria.pagination) {
      this.contractsPagination = cachedSearchCriteria.pagination;
    }
    if (cachedSearchCriteria.sort) {
      this.sort = cachedSearchCriteria.sort;
    }
    const searchCriteria = cachedSearchCriteria.searchCriteria;
    if (searchCriteria) {
      searchCriteria.filters = searchCriteria.filters ?? ({} as any);
      const isFiltersApplied = Object.keys(searchCriteria.filters ?? {}).some(
        (key) => !!searchCriteria.filters[key]
      );
      if (searchCriteria?.search || isFiltersApplied) {
        this.searchFilterApplied = true;
      }

      this.contractSearchForm.patchValue({
        contractId: searchCriteria?.search ?? '',
        buyer: searchCriteria?.filters?.buyer ?? '',
        clientName: searchCriteria?.filters?.client ?? '',
        contactName: searchCriteria?.filters?.contractName ?? '',
        contactStatus: searchCriteria?.filters?.status ?? '',
        contractEvents: searchCriteria?.filters?.contractEvents ?? '',
        campaign: searchCriteria?.filters?.project ?? '',
        start: searchCriteria?.filters?.startDate ?? '',
        end: searchCriteria?.filters?.endDate ?? ''
      });
    }
  }

  public get minDateForEndDate() {
    let minDate: any = '';
    if (this.contractSearchForm.controls?.start?.value) {
      minDate = new Date(this.contractSearchForm.controls?.start?.value);
      minDate.setDate(minDate.getDate());
    }

    return minDate;
  }

  resetLocalstorageSearchCriteria(): void {
    localStorage.setItem(this.LOCAL_STORAGE_KEY, '');
  }

  public ngOnDestroy(): void {
    this.unSub$.next();
    this.unSub$.complete();
    this.unSubES$.next();
    this.unSubES$.complete();
    this.matSnackBar.dismiss();
  }
}
