import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  Optional,
  SkipSelf,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { saveAs } from 'file-saver';

import { toggleVisibility } from '@shared/animations';

import {
  catchError,
  debounceTime,
  filter,
  map,
  mergeMap,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { State, StateSearchPagination } from '@interTypes/vendor/state';
import {
  ClientDropDownValue,
  ClientFilter
} from '@interTypes/records-management';
import { UseRecordPagination } from '../useRecordPagination';
import {
  FilterClientsPayload,
  FilteredClient
} from '@interTypes/records-management';
import { VendorService } from '../vendors/vendor.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { RecordService } from '../record.service';
import { AbstractClientsDropDownComponent } from './abstract-clients-drop-down.component';
import { CustomColumnsArea } from '@interTypes/enums';
import { Helper } from '../../classes';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { UseAutoCompleteInfiniteScroll } from '../../classes/use-auto-complete-infinite-scroll';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { forbiddenNamesValidator } from '@shared/common-function';
import { ElasticSearch } from 'app/classes/ElasticSearch';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.less'],
  animations: [toggleVisibility],
  providers: [CustomizeColumnService, ElasticSearch],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsComponent extends AbstractClientsDropDownComponent
  implements OnInit, AfterViewInit {
  public parentClientsSearchStr = '';

  public clientSearchForm: FormGroup;
  public companyNames = [];
  public isLoadingCompanyNames: any = false;
  public panelContainer: any;
  public enableAdvancedSearch: any = false;

  public states: State[] = [];
  public isLoadingState = false;
  public statePagination: StateSearchPagination = {
    page: 1,
    perPage: 100 // Default perPage size currently 56 state only
  };
  public searchText = '';
  public panelStateContainer: string;

  public dataSource = new MatTableDataSource([]);
  public scrollContent: number;
  public clientsPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 10
  });
  pageEvent = false;

  public isLoadingClients = false;
  public clientsList: FilteredClient[] = [];
  public clientFilters: FilterClientsPayload = {} as FilterClientsPayload;
  public clientNameSearchStr = '';
  public noClientMessage: string;
  public menuOpened = false;
  public hoveredIndex = -1;

  private selectedSort: Sort = {
    active: 'updatedAt',
    direction: 'desc'
  };
  public sortName: any = 'updatedAt';
  public sortDirection = 'desc';

  public freeUp$ = new Subject<void>();
  public managedByAutoComplete = new UseAutoCompleteInfiniteScroll();
  public agencyAutoComplete = new UseAutoCompleteInfiniteScroll();
  public paginationSizes: number[] = [10];
  @ViewChild('clientTypeRef', { read: ElementRef }) clientTypeRef: ElementRef;
  public clientTypeTooltipText = '';
  @ViewChild('officeRef', { read: ElementRef }) officeRef: ElementRef;
  public officeTooltipText = '';
  @ViewChild('divisionRef', { read: ElementRef }) divisionRef: ElementRef;
  public divisionTooltipText = '';
  @ViewChild('businessCategoryRef', { read: ElementRef })
  businessCategoryRef: ElementRef;
  public businessCategoryTooltipText = '';
  public isDialogOpenend = false;
  public isDialogOpenend$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public managedByPanelContainer = '';
  public agencyPanelContainer = '';
  public searchFilterApplied = false;

  constructor(
    public recordService: RecordService,
    public notificationsService: NotificationsService,
    private router: Router,
    private fb: FormBuilder,
    public vendorApi: VendorService,
    public notificationService: NotificationsService,
    public customizeColumnService: CustomizeColumnService,
    public cdRef: ChangeDetectorRef,
    private matSnackBar: MatSnackBar,
    private dialog: MatDialog,
    public elasticSearch: ElasticSearch,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<ClientsComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public injectedData: any
  ) {
    super(recordService, notificationsService, cdRef);
    this.elasticSearch.PATH = 'clients/search';
    this.loadCachedFiltersQuery();
  }

  public ngOnInit(): void {
    if (this.injectedData?.dialogOpenened) {
      this.isDialogOpenend = true;
      this.isDialogOpenend$.next(this.isDialogOpenend);
    } else {
      this.loadMoreWithStateSearch();
      this.loadOffices();
      this.loadPrimaryAgencies();
      this.loadDivisions();
      this.loadBusinessCategories();
      this.loadClientTypes();
      this.loadClients(); // parent client

      this.toggleParentFlagValues();
      this.setFilterStateSubscribtion(this.clientSearchForm, 'state');
      this.setFilterParentClientSubscription(this.clientSearchForm, 'parent');
      const managedBySearchCtrl = this.clientSearchForm?.controls?.managedBy
        ?.valueChanges;
      if (managedBySearchCtrl) {
        this.managedByAutoComplete.loadDependency(
          this.cdRef,
          this.freeUp$,
          managedBySearchCtrl
        );
        this.managedByAutoComplete.apiEndpointMethod = () => {
          const isSearchStr = typeof this.clientSearchForm?.controls?.managedBy?.value === 'string';
          const searchObj = {
            filter: {
              companyTypes: [
                "User"
              ]
            },
            ...(isSearchStr
              ? { search: this.clientSearchForm?.controls?.managedBy?.value }
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
          this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
          this.cdRef.markForCheck();
        });
        this.managedByAutoComplete.listenForAutoCompleteSearch(
          this.clientSearchForm,
          'managedBy',
          null,
          (res) => {
            this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
            this.cdRef.markForCheck();
          }
        );
      }
      const agencySearchCtrl = this.clientSearchForm?.controls?.agency
        ?.valueChanges;
      if (agencySearchCtrl) {
        this.agencyAutoComplete.loadDependency(
          this.cdRef,
          this.freeUp$,
          agencySearchCtrl
        );
        this.agencyAutoComplete.apiEndpointMethod = () =>
          this.recordService.getAgencyTypes().pipe(
            filter((res) => !!res),
            map((res) =>
              res.results.find((type) => type.name === 'Media Agency')
            ),
            filter((types) => !!types),
            mergeMap((type: any) => {
              return this.recordService.getAgencies(
                {
                  search: this.agencyAutoComplete.searchStr,
                  filter: { types: [type._id] }
                },
                this.agencyAutoComplete.pagination
              );
            })
          );
        this.agencyAutoComplete.loadData(null, null);
        this.agencyAutoComplete.listenForAutoCompleteSearch(
          this.clientSearchForm,
          'agency',
          null,
          null
        );
      }
    }
    this.initializeCustomizeColumn();
    this.loadClientList();
  }

  public companyNameDisplayWithFn(companyName: any) {
    return companyName?.companyName ?? '';
  }

  public companyNameTrackByFn(companyName: any, index) {
    return index;
  }

  public addClient() {
    this.router.navigateByUrl('records-management-v2/clients/add');
  }

  public exportCSV(format = 'csv') {
    const filter = Helper.removeEmptyArrayAndEmptyObject(
      Helper.deepClone(this.clientFilters.filter)
    );
    const headers = this.formatCustomColumnsForAPI();
    const payload = { search: this.clientFilters?.search, filter, headers };
    this.recordService
      .exportClients(
        payload,
        this.sortDirection,
        this.sortName,
        this.clientsPagination,
        false,
        format
      )
      .subscribe(
        (response: any) => {
          const contentType = response['headers'].get('content-type');
          const contentDispose = response.headers.get('Content-Disposition');
          const matches = contentDispose?.split(';')[1].trim().split('=')[1];
          if (contentType.includes('text/csv')) {
            let filename =
              matches && matches.length > 1 ? matches : 'clients' + '.csv';
            filename = filename.slice(1, filename.length-1);
            saveAs(response.body, filename);
          } else if (
            contentType.includes(
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
          ) {
            let filename =
              matches && matches.length > 1 ? matches : 'clients' + '.xlsx';
            filename = filename.slice(1, filename.length-1);
            saveAs(response.body, filename);
          } else {
            this.showsAlertMessage(
              'Something went wrong, Please try again later'
            );
          }
        },
        (errorResponse) => {
          if (errorResponse.error?.message) {
            this.showsAlertMessage(errorResponse.error?.message);
            return;
          }
          this.showsAlertMessage(
            'Something went wrong, Please try again later'
          );
        }
      );
  }

  public toggleVisibility() {
    this.enableAdvancedSearch = !this.enableAdvancedSearch;
  }

  public updateContainer() {
    this.panelContainer = '.parent-client-autocomplete';
  }

  public search() {
    const searchFormControls = this.clientSearchForm.controls;
    this.clientFilters.search = searchFormControls.name.value || '';
    this.clientFilters.filter = {};
    if (searchFormControls['city'].value !== null) this.clientFilters.filter.city = searchFormControls.city.value;
    if (searchFormControls['state'].value) this.clientFilters.filter.states = searchFormControls['state'].value?._id ? [searchFormControls['state'].value._id] : [];
    if (searchFormControls['category'].value) this.clientFilters.filter.businessCategory = searchFormControls.category.value?.map?.(cat => cat?._id) ?? null;
    if (searchFormControls['agency'].value) this.clientFilters.filter.clientOfAgency = this.clientSearchForm.controls.agency.value?._id ? [this.clientSearchForm.controls.agency.value._id] : [];
    if (searchFormControls['type'].value) this.clientFilters.filter.clientType = this.clientSearchForm.controls.type.value;
    if (searchFormControls['office'].value) this.clientFilters.filter.offices = this.clientSearchForm.controls.office.value;
    this.clientFilters.filter.isCurrent = this.clientSearchForm.controls.currentFlag.value;
    // this.clientFilters.filter.isParent = this.clientSearchForm.controls.parentFlag.value
    if (this.clientSearchForm.controls.currentFlag.value && !this.clientSearchForm.controls.parentFlag.value) {
      this.clientFilters.filter.isParent = false;
    } else if (!this.clientSearchForm.controls.parentFlag.value) {
      this.clientFilters.filter.isParent = null;
    } else {
      this.clientFilters.filter.isParent = true;
    }
    if (searchFormControls['division'].value) {
      this.clientFilters.filter.divisions = this.clientSearchForm.controls.division.value;
    }
    this.clientFilters.filter.mediaClientCode = this.clientSearchForm.controls.clientCode.value;
    if (searchFormControls['parent'].value) this.clientFilters.filter.parentClient = this.clientSearchForm.controls.parent.value._id;
    if (searchFormControls['managedBy'].value) this.clientFilters.filter.managedBy = this.clientSearchForm.controls.managedBy.value?.id ? [this.clientSearchForm.controls.managedBy.value.id] : [];

    this.resetClientPagination(
      this.injectedData?.dialogOpenened ? true : false
    );
    this.loadClientList();
    this.storeClientSearchFilters(searchFormControls);
  }

  public storeClientSearchFilters(searchFormControls) {
    const clientFilters = {
      search: this.clientFilters.search,
      filter: {}
    } as any;
    this.recordService.setClientListLocal('searchClient', clientFilters);
    if (searchFormControls['city'].value !== null) clientFilters.filter.city = searchFormControls.city.value;
    if (searchFormControls['state'].value) clientFilters.filter.states = searchFormControls['state'].value?._id ? [searchFormControls['state'].value] : [];
    if (searchFormControls['category'].value) clientFilters.filter.businessCategory = searchFormControls.category.value;
    if (searchFormControls['agency'].value) clientFilters.filter.clientOfAgency = this.clientSearchForm.controls.agency.value?._id ? [this.clientSearchForm.controls.agency.value] : [];
    if (searchFormControls['type'].value) clientFilters.filter.clientType = this.clientSearchForm.controls.type.value;
    if (searchFormControls['office'].value) clientFilters.filter.offices = this.clientSearchForm.controls.office.value;
    clientFilters.filter.isCurrent = this.clientSearchForm.controls.currentFlag.value;
    clientFilters.filter.isParent = this.clientSearchForm.controls.parentFlag.value;
    if (searchFormControls['division'].value) {
      clientFilters.filter.divisions = this.clientSearchForm.controls.division.value;
    }
    clientFilters.filter.mediaClientCode = this.clientSearchForm.controls.clientCode.value;
    if (searchFormControls['parent']) clientFilters.filter.parentClient = this.clientSearchForm.controls.parent.value?._id ? this.clientSearchForm.controls.parent.value : null;
    if (searchFormControls['managedBy'].value) clientFilters.filter.managedBy = this.clientSearchForm.controls.managedBy.value?.id ? [this.clientSearchForm.controls.managedBy.value] : [];
    this.recordService.setClientListLocal('searchClient', clientFilters);
  }

  public restoreClientSearchFilters(clientFilters) {
    this.clientFilters.search = clientFilters.search ?? '';
    if (!clientFilters.filter) {
      this.buildForm({ search: clientFilters.search });
      return;
    }

    this.buildForm(clientFilters);

    if (!this.clientFilters.filter) {
      this.clientFilters.filter = {};
    }
    this.clientFilters.filter.city = clientFilters.filter.city;
    if (clientFilters.filter.states) this.clientFilters.filter.states = clientFilters.filter.states?.[0]?._id ? [clientFilters.filter.states?.[0]?._id] : [];
    if (clientFilters.filter.businessCategory) this.clientFilters.filter.businessCategory = clientFilters.filter.businessCategory?.map?.(cat => cat?._id) ?? null;
    if (clientFilters.filter.clientOfAgency) this.clientFilters.filter.clientOfAgency = clientFilters.filter.clientOfAgency?.[0]?._id ? [clientFilters.filter.clientOfAgency?.[0]?._id] : [];
    if (clientFilters.filter.clientType) this.clientFilters.filter.clientType = clientFilters.filter.clientType;
    if (clientFilters.filter.offices) this.clientFilters.filter.offices = clientFilters.filter.offices;
    this.clientFilters.filter.isCurrent = clientFilters.filter.isCurrent;
    // this.clientFilters.filter.isParent = clientFilters.filter.isParent;
    if (this.clientSearchForm.controls.currentFlag.value && !this.clientSearchForm.controls.parentFlag.value) {
      this.clientFilters.filter.isParent = false;
    } else if (!this.clientSearchForm.controls.parentFlag.value) {
      this.clientFilters.filter.isParent = null;
    } else {
      this.clientFilters.filter.isParent = true;
    }
    if (clientFilters.filter.divisions) this.clientFilters.filter.divisions = clientFilters.filter.divisions;
    if (clientFilters.filter.mediaClientCode) this.clientFilters.filter.mediaClientCode = clientFilters.filter.mediaClientCode;
    if (clientFilters.filter.parentClient) this.clientFilters.filter.parentClient = clientFilters.filter.parentClient?._id;
    if (clientFilters.filter.managedBy) this.clientFilters.filter.managedBy = clientFilters.filter.managedBy?.[0]?.id ? [clientFilters.filter.managedBy?.[0]?.id] : [];

  }

  public initializeCustomizeColumn() {
    const defaultColumns = [
      // { displayname: 'Client Name', name: 'clientName' },
      { displayname: 'Agency', name: 'mediaAgency.name' },
      { displayname: 'Client Code', name: 'mediaClientCode' },
      { displayname: 'Office', name: 'office.name' },
      { displayname: 'Managed By', name: 'managedBy.firstName' },
      { displayname: 'Parent', name: 'isParent' },
      { displayname: 'Current', name: 'isCurrent' },
      { displayname: 'Last Modified', name: 'updatedAt' }
    ];

    this.customizeColumnService.init({
      defaultColumns: defaultColumns,
      sortableColumns: Helper.deepClone(defaultColumns),
      cachedKeyName: CustomColumnsArea.CLIENTS_PLAN_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0,0,'clientName');
        this.customizeColumnService.displayedColumns.splice(1,0,'action');
        this.cdRef.markForCheck();
      }
    });
  }

  private buildForm(clientSearch: FilterClientsPayload) {
    this.clientSearchForm = this.fb.group({
      name: [clientSearch?.search ?? null],
      parent: [clientSearch?.filter?.parentClient ?? null, null, forbiddenNamesValidator],
      parentFlag: [clientSearch?.filter?.isParent ?? false],
      clientCode: [clientSearch?.filter?.mediaClientCode ?? null],
      division: [clientSearch?.filter?.divisions ?? null],
      office: [clientSearch?.filter?.offices ?? null],
      agency: [clientSearch?.filter?.clientOfAgency?.[0] ?? null, null, forbiddenNamesValidator],
      currentFlag: [clientSearch?.filter?.isCurrent ?? false],
      managedBy: [clientSearch?.filter?.managedBy?.[0] ?? null, null, forbiddenNamesValidator],
      type: [clientSearch?.filter?.clientType ?? null],
      category: [clientSearch?.filter?.businessCategory ?? null],
      state: [clientSearch?.filter?.states?.[0] ?? null, null, forbiddenNamesValidator],
      city: [clientSearch?.filter?.city ?? null]
    });
  }

  public compareWith(
    option: ClientDropDownValue,
    selected: ClientDropDownValue
  ) {
    return option && selected && option?._id === selected?._id;
  }

  public loadStates(searchText = {}) {
    this.isLoadingState = true;
    this.recordService
      .getVendorsStateSearch(searchText, this.statePagination)
      .pipe(
        tap(() => (this.isLoadingState = false)),
        filter((res) => !!res.results)
      )
      .subscribe((res) => {
        this.states = res.results;
        this.setStatePaginationFromRes(res);
        this.cdRef.markForCheck();
      });
  }

  public loadMoreWithStateSearch() {
    const search = {};
    const searchtxt = this.searchText ?? null;
    if (searchtxt) {
      search['search'] = searchtxt;
    }
    this.loadStates(search);
  }

  public setFilterStateSubscribtion(form, field) {
    form
      .get(field)
      .valueChanges.pipe(
      debounceTime(500),
      filter((value) => typeof value === 'string'),
      switchMap((searchStr: any) => {
        this.resetPagination();
        const search = {
          search: searchStr
        };
        this.searchText = searchStr;
        return this.recordService
          .getVendorsStateSearch(search, this.statePagination)
          .pipe(
            filter((res) => !!res.results),
            catchError((error) => {
              this.isLoadingState = false;
              this.cdRef.markForCheck();
              return of({ result: [] });
            })
          );
      }),
      tap(() => (this.isLoadingState = false))
    )
      .subscribe((res) => {
        this.states = res['results'];
        this.cdRef.markForCheck();
        this.setStatePaginationFromRes(res);
      });
  }

  public resetPagination() {
    this.statePagination = { page: 1, perPage: 100 };
  }

  public setStatePaginationFromRes(result) {
    if (result?.pagination?.total) {
      this.statePagination.total = result['pagination']['total'];
    }
  }

  public updateStateContainer() {
    this.panelStateContainer = '.state-list-autocomplete';
  }

  public stateDisplayWithFn(state: State) {
    return state?.name ? (state?.short_name + ' - ' + state?.name) : '';
  }

  public stateTrackByFn(idx: number, state: State) {
    return state?._id ?? idx;
  }

  private toggleParentFlagValues() {
    this.clientSearchForm.get('parentFlag').valueChanges.subscribe((value) => {
      if (value) {
        this.clientSearchForm
          .get('parent')
          .setValue(null, { emitEvent: false });
      }
    });

    this.clientSearchForm.get('parent').valueChanges.subscribe((value) => {
      if (value) {
        this.clientSearchForm
          .get('parentFlag')
          .setValue(false, { emitEvent: false });
      }
    });
  }

  public onSorting(sort: Sort) {
    this.selectedSort = sort;
    this.sortDirection = sort.direction;
    this.sortName = sort.active;
    this.clientsList = [];
    this.dataSource.data = this.clientsList;
    this.resetClientPagination(this.isDialogOpenend ? true : false);
    this.cdRef.markForCheck();
    this.recordService.setClientListLocal('clientSorting', this.selectedSort);
    this.loadClientList(true);
  }

  public resetClientPagination(isDialog = false) {
    if (isDialog) {
      this.clientsPagination = new UseRecordPagination({
        page: 1,
        perPage: 50,
        total: 0
      });
    } else {
      this.clientsPagination = new UseRecordPagination({
        page: 1,
        perPage: 10,
        total: 0
      });
    }
    this.recordService.setClientListLocal(
      'clientPagination',
      this.clientsPagination.getValues()
    );
  }

  public getPageEvent(event: PageEvent) {
    this.pageEvent = true;
    this.clientsPagination.doPagination(event);
    this.loadClientList(true);
  }


  public loadClientList(isForSortingOrPaginating = false) {
    const payload = Helper.removeEmptyArrayAndEmptyObject(
      Helper.deepClone(this.clientFilters.filter)
    );
    const payloadData = Helper.deepClone(payload)
    if (payloadData) {
      const filteredObj = Helper.removeEmptyOrNullRecursive(Helper.removeBooleanType(payloadData, false));
      // this.clientFilters?.search?.length > 0 || filteredObj?.isCurrent || filteredObj?.isParent || filteredObj?.mediaClientCode?.length > 0 || (filteredObj && Object.keys(filteredObj).length > 2)
      // Validating the form-submit filter values have or not.
      if ((filteredObj && Object.keys(filteredObj).length > 0) || this.clientFilters?.search?.length > 0) {
        this.searchFilterApplied = true;
      } else {
        this.searchFilterApplied = false;
      }
    }

    this.isLoadingClients = true;
    const fieldSet = ['_id', 'clientName','mediaAgency','mediaClientCode','office','managedBy','isParent','isCurrent','updatedAt'];
    const requestBody =  { search: this.clientFilters?.search, filter: payload };
    const isSortFieldString = /(clientName|mediaAgency\.name|managedBy\.firstName|office\.name|mediaClientCode)/.test(this.selectedSort.active);
    const isunMappedTypeDate = /^(updatedAt)$/.test(this.selectedSort?.active);

    let funcArgs = [
      fieldSet,
      requestBody,
      this.selectedSort,
      isSortFieldString,
      this.clientsPagination.getValues(),
      (res) => {
        this.clientsList = res.results;
        this.dataSource.data = res.results;
        this.isLoadingClients = false;
        this.setPaginationFromRes(res);
        this.cdRef.markForCheck();
      },
      (error) => {
        this.clientsList = [];
        this.dataSource.data = this.clientsList;
        this.isLoadingClients = false;
        this.cdRef.markForCheck();
      },
      false,
      isunMappedTypeDate
    ];

    let func: any = this.elasticSearch.handleSearch;
    if (isForSortingOrPaginating){
      func = this.elasticSearch.handleSortingAndPaginating;
      funcArgs.splice(0, 2);
    }

    func.apply(this.elasticSearch, funcArgs);
  }

  private setPaginationFromRes(res) {
    if (res?.pagination) {
      this.clientsPagination.updateTotal(res?.pagination.total);
      this.clientsPagination.updateFound(res?.pagination.found);
      this.setPaginationSizes(res?.pagination.found);
      this.recordService.setClientListLocal(
        'clientPagination',
        this.clientsPagination.getValues()
      );
    }
  }

  private loadCachedFiltersQuery() {
    const sessionFilter = this.recordService.getClientListLocal();
    if (
      sessionFilter?.clientPagination?.page &&
      sessionFilter?.clientPagination?.perPage
    ) {
      this.clientsPagination = new UseRecordPagination({
        ...sessionFilter.clientPagination
      });
    }
    if (sessionFilter?.clientSorting?.active) {
      this.selectedSort = sessionFilter.clientSorting;
      this.sortName = this.selectedSort?.active ?? 'clientName';
      this.sortDirection = this.selectedSort?.direction ?? 'desc';
    }

    if (sessionFilter?.searchClient) {
      const clientFilters: any = sessionFilter.searchClient as any;
      this.restoreClientSearchFilters(clientFilters);
    } else {
      this.buildForm({});
    }
  }

  public customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.customizeColumnService.displayedColumns.splice(0,0,'clientName');
      this.customizeColumnService.displayedColumns.splice(1,0,'action');
      this.cdRef.detectChanges();
    });
  }

  public mangedByUserTrackByFn(idx: number, user: any) {
    return user?.id ?? idx;
  }

  public mangedByUserDisplayWithFn(user: any) {
    return user?.name ?? '';
  }

  public loadMoreManagedByUser() {
    this.managedByAutoComplete.loadMoreData(null, (res) => {
      this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
      this.cdRef.markForCheck();
    });
  }

  public loadMoreAgencies() {
    this.agencyAutoComplete.loadMoreData(null, (res) => {
      this.agencyAutoComplete.data = res.results;
      this.cdRef.markForCheck();
    });
  }

  public updateMangedByContainer() {
    this.managedByPanelContainer = '.users-list-autocomplete';
  }

  public updateAgenciesContainer() {
    this.agencyPanelContainer = '.agencies-list-autocomplete';
  }

  public selectClient($event: any) {
    this.router.navigateByUrl(`records-management-v2/clients/${$event?._id}`);
  }

  public deleteClientAPI(event) {
    if (event !== null) {
      this.dialog
        .open(DeleteConfirmationDialogComponent, {
          width: '340px',
          height: '260px',
          panelClass: 'imx-mat-dialog'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res['action']) {
            this.recordService.deleteClient(event['_id']).subscribe(
              (response) => {
                this.showsAlertMessage('Client deleted successfully!');
                this.resetClientPagination(this.isDialogOpenend ? true : false);
                this.loadClientList();
              },
              (errorResponse) => {
                if (errorResponse.error?.message) {
                  this.showsAlertMessage(errorResponse.error?.message);
                  return;
                } else if (errorResponse.error?.error) {
                  this.showsAlertMessage(errorResponse.error?.error);
                  return;
                }
                this.showsAlertMessage(
                  'Something went wrong, Please try again later'
                );
              }
            );
          }
        });
    }
  }
  public onClientDelete(event) {
    this.recordService.getClientAssociation(event['_id'])
    .subscribe((response) => {
      if(Object.keys(response?.associations).length > 0) {
        this.openDeleteWarningPopup();
      } else {
        this.deleteClientAPI(event);
      }
    },
    (errorResponse) => {
      if (errorResponse.error?.message) {
        this.showsAlertMessage(errorResponse.error?.message);
        return;
      } else if (errorResponse.error?.error) {
        this.showsAlertMessage(errorResponse.error?.error);
        return;
      }
      this.showsAlertMessage('Something went wrong, Please try again later');
    });
  }

  public openDeleteWarningPopup() {
    const dialogueData = {
      title: 'Attention',
      description: 'Please <b>Confirm</b> Please <b>Confirm</b> This record has already been used on a Campaign or Contract. Please double-check all relationships before deleting.',
      confirmBtnText: 'OK',
      cancelBtnText: 'CANCEL',
      displayCancelBtn: false,
      displayIcon: true
    };
    this.dialog.open(NewConfirmationDialogComponent, {
      data: dialogueData,
      width: '490px',
      height: '260px',
      panelClass: 'imx-mat-dialog'
    }).afterClosed().pipe(
      map(res => res?.action)
    ).subscribe(flag => {

    });
  }
  private formatCustomColumnsForAPI() {

    const columns = this.customizeColumnService.currentSortables.filter(
      (column) => column['name'] !== 'action'
    );
    // Sticky column added
    columns.splice(0, 0, { displayname: 'Client Name', name: 'clientName' });

    const formattedColumns = {};
    columns.forEach((column) => {
      formattedColumns[column['name']] = column['displayname'];
    });
    return formattedColumns;
  }

  private showsAlertMessage(msg) {
    const config = {
      duration: 3000
    } as MatSnackBarConfig;
    this.matSnackBar.open(msg, '', config);
  }

  private setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
      if (!this.pageEvent && this.isDialogOpenend) {
        this.clientsPagination.perPage = 25;
      }
      this.pageEvent = false;
    } else {
      this.paginationSizes = [10];
      if (this.isDialogOpenend) {
        this.clientsPagination.perPage = 10;
      }
    }
    this.cdRef.markForCheck();
  }

  ngAfterViewInit() {
    if (!this.isDialogOpenend) {
      this.getClientTypetext();
      this.getDivisionsToolTiptext();
      this.getOfficeToolTiptext();
      this.getBusinessCategoryToolTiptext();
    }
  }

  public changeOption(type) {
    switch (type) {
      case 'clientType':
        this.getClientTypetext();
        break;
      case 'office':
        this.getOfficeToolTiptext();
        break;
      case 'division':
        this.getDivisionsToolTiptext();
        break;
      case 'businessCategory':
        this.getBusinessCategoryToolTiptext();
        break;
    }
  }

  private getClientTypetext() {
    setTimeout(() => {
      this.clientTypeTooltipText = this.clientTypeRef?.nativeElement?.querySelector(
        '.mat-select-value-text span'
      )?.innerText;
    }, 500);
  }

  private getOfficeToolTiptext() {
    setTimeout(() => {
      this.officeTooltipText = this.officeRef?.nativeElement?.querySelector(
        '.mat-select-value-text span'
      )?.innerText;
    }, 500);
  }

  private getDivisionsToolTiptext() {
    setTimeout(() => {
      this.divisionTooltipText = this.divisionRef?.nativeElement?.querySelector(
        '.mat-select-value-text span'
      )?.innerText;
    }, 500);
  }

  private getBusinessCategoryToolTiptext() {
    setTimeout(() => {
      this.businessCategoryTooltipText = this.businessCategoryRef?.nativeElement?.querySelector(
        '.mat-select-value-text span'
      )?.innerText;
    }, 500);
  }

  public openClientListDialog() {
    this.resetClientPagination(true);
    this.dialog
      .open(ClientsComponent, {
        disableClose: true,
        data: {
          dialogOpenened: true
        },
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'client-list-dialog-fullscreen'
      })
      .afterClosed()
      .subscribe((skipSetup) => {
        // While clikcing on duplicate action we no need to reinitialize normal table
        this.resetClientPagination();
        if (!skipSetup) {
          this.loadCachedFiltersQuery();
          this.loadClientList();
        }
      });
  }
  public closeDialogBox(skipSetup = false) {
    this.dialogRef.close(skipSetup);
  }
  public onResetForm() {
    this.clientSearchForm.reset();

    this.parentClientsSearchStr = '';
    this.loadClients();

    this.agencyAutoComplete.resetAll();
    this.agencyAutoComplete.loadData(null, null);
    this.agencyAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );

    this.managedByAutoComplete.resetAll();
    this.managedByAutoComplete.loadData(null, (res) => {
      this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
      this.cdRef.markForCheck();
    });
    this.managedByAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
    this.search();
  }
}
