import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  Optional,
  SkipSelf,
  Inject
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent
} from '@angular/material/paginator';
import { forbiddenNamesValidator, IMXMatPaginator } from '@shared/common-function';
import { AgencyPagination } from '@interTypes/agency';
import { RecordService } from '../../record.service';
import { filter, map, tap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NotificationsService } from 'app/notifications/notifications.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { CustomColumnOrigin, CustomColumnsArea } from '@interTypes/enums';
import { Helper } from 'app/classes';
import { CustomizeColumnV3Component } from '@shared/components/customize-column-v3/customize-column-v3.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { saveAs } from 'file-saver';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { UseAutoCompleteInfiniteScroll } from 'app/classes/use-auto-complete-infinite-scroll';
import { AuthenticationService } from '@shared/services';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { ElasticSearch } from 'app/classes/ElasticSearch';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';

@Component({
  selector: 'app-agencies-list',
  templateUrl: './agencies-list.component.html',
  styleUrls: ['./agencies-list.component.less'],
  providers: [
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator },
     CustomizeColumnService,
     ElasticSearch,
    ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgenciesListComponent implements OnInit, AfterViewInit, OnDestroy {
  defaultColumns = [
    // { displayname: 'Agency Name', name: 'name' },
    { displayname: 'Agency Type', name: 'type' },
    { displayname: 'Division', name: 'division' },
    { displayname: 'Phone', name: 'phone' },
    { displayname: 'State', name: 'state' },
    { displayname: 'City', name: 'city' },
    { displayname: 'Last Modified', name: 'updatedAt' },
  ];

  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  public agenciesPagination: AgencyPagination = {
    page: 1,
    perPage: 10
  };
  pageEvent = false;
  public agenciesList = [];
  public isLoadingAgency = false;
  public agenciesSearchForm: FormGroup;
  public scrollContent: number;
  public menuOpened = false;
  public hoveredIndex = null;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  public noAgencyMessage = 'There are no agencies in the system.';
  public selectedSort:  Sort = {
    active: 'updatedAt',
    direction: 'desc'
  };;
  private unSubscribe: Subject<void> = new Subject<void>();
  public divisions = [];
  public agencyTypes = [];
  public offices = [];
  public formattedAgencySearch: any;

  private columns = [];
  private currentSortables: any;
  tableWidth: number;
  public customizeColumnService: CustomizeColumnService;
  @ViewChild('agencyTypeRef', { read: ElementRef }) agencyTypeRef: ElementRef;
  public agencyTypeTooltipText = '';
  @ViewChild('officeRef', { read: ElementRef }) officeRef: ElementRef;
  public officeTooltipText = '';
  @ViewChild('divisionRef', { read: ElementRef }) divisionRef: ElementRef;
  public divisionTooltipText = '';
  public isDialogOpenend = false;
  public paginationSizes = [10];
  public managedByAutoComplete = new UseAutoCompleteInfiniteScroll();
  public panelContainer: string = '';
  public searchFilterApplied = false;
  @ViewChild('tableScrollRef', {read: ElementRef, static:false}) tableScrollRef: ElementRef;
  public hasHorizontalScrollbar = false;
  userPermission: UserActionPermission;


  constructor(
    public cdRef: ChangeDetectorRef,
    private route: Router,
    private fb: FormBuilder,
    public recordService: RecordService,
    private notificationService: NotificationsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public auth: AuthenticationService,
    public elasticSearch: ElasticSearch,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<AgenciesListComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public injectedData: any
  ) { 

  }

  ngOnInit(): void {
    this.userPermission = this.auth.getUserPermission(UserRole.AGENCIES);
    this.displayedColumns = this.defaultColumns.map((column) => column['name']);
    this.customizeColumnService = new CustomizeColumnService(this.dialog);

    this.setupElasticSearchPath();
    this.setUpAgency();
    if (this.injectedData?.dialogOpenened) {
      this.isDialogOpenend = true;
    } else {
      this.reSize();
      this.loadAgencyTypes();
      this.loadDivisions();
      // this.loadAgency();
      this.loadOffices();
    }

    // Initialize customize column
    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.defaultColumns),
      cachedKeyName: CustomColumnsArea.AGENCY_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0,0,'name');
        this.customizeColumnService.displayedColumns.splice(1,0,'action');
        this.cdRef.markForCheck();
      }
    });
  }

  private setUpAgency() {
    const sessionFilter = this.recordService.getAgencyListLocal();

    if (sessionFilter?.agenciesPagination) {
      this.agenciesPagination = sessionFilter?.agenciesPagination;
    }

    if (sessionFilter?.agencySorting?.active) {
      this.selectedSort = sessionFilter?.agencySorting;
    }

    let agencySearch;
    if (sessionFilter?.search) {
      agencySearch = sessionFilter?.search;
    }

    this.agenciesSearchForm = this.fb.group({
      name: [agencySearch?.name ?? null],
      agencyType: [agencySearch?.agencyType ?? null],
      division: [agencySearch?.division ?? null],
      office: [agencySearch?.office ?? null],
      managedBy: [agencySearch?.managedBy?.id ? agencySearch.managedBy : null, null, forbiddenNamesValidator]
    });
    if (sessionFilter?.search) {
      this.searchSubmit();
    } else {
      this.loadAgency();
    }
    const managedBySearchCtrl = this.agenciesSearchForm?.controls?.managedBy?.valueChanges;
    if (managedBySearchCtrl) {
      this.managedByAutoComplete.loadDependency(this.cdRef, this.unSubscribe, managedBySearchCtrl);
      // this.managedByAutoComplete.apiEndpointMethod = () => this.recordService.getManagedByUsers(this.agenciesSearchForm?.controls?.managedBy?.value, this.managedByAutoComplete.pagination);
      this.managedByAutoComplete.apiEndpointMethod = () => {
        const isSearchStr = typeof this.agenciesSearchForm?.controls?.managedBy?.value === 'string';
        const searchObj = {
          filter: {
            companyTypes: [
              "User"
            ]
          },
          ...(isSearchStr
            ? { search: this.agenciesSearchForm?.controls?.managedBy?.value }
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
      this.managedByAutoComplete.listenForAutoCompleteSearch(this.agenciesSearchForm, 'managedBy', null, (res) => {
        this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
        this.cdRef.markForCheck();
      });
    }
  }
  public loadAgencyTypes() {
    this.recordService
      .getAgencyTypes()
      .pipe(
        takeUntil(this.unSubscribe),
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.agencyTypes = res;
      });
  }
  public loadDivisions() {
    this.recordService
      .getDivisions()
      .pipe(
        takeUntil(this.unSubscribe),
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.divisions = res;
      });
  }

  public loadOffices() {
    this.recordService
      .getOffices()
      .pipe(
        takeUntil(this.unSubscribe),
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.offices = res;
      });
  }
  public searchSubmit() {
    const formValue = this.agenciesSearchForm.value;
    const filters = {};
    if (formValue?.agencyType?.length > 0) {
      filters['types'] = formValue?.agencyType;
    }
    if (formValue?.division?.length > 0) {
      filters['divisions'] = formValue?.division;
    }
    if (formValue?.office?.length > 0) {
      filters['offices'] = formValue?.office;
    }
    if (formValue?.managedBy?.id) {
      filters['managedBy'] = [formValue?.managedBy?.id];
    }
    const searchData = {
      search: formValue?.name ?? null,
      filter: filters
    };
    this.recordService.setAgencyListLocal('search', formValue);
    this.formattedAgencySearch = this.removeEmptyorNull(searchData);
    this.resetAgencyPagination(this.injectedData?.dialogOpenened ? true : false);
    this.loadAgency();
  }

  public loadAgency(isForSortingOrPaginating = false) {
    if (this.formattedAgencySearch?.search?.length > 0 || (this.formattedAgencySearch?.filter && Object.keys(this.formattedAgencySearch.filter).length > 0)) {
      this.searchFilterApplied = true;
    } else {
      this.searchFilterApplied = false;
    }
    this.isLoadingAgency = true;

    const fieldSet = [];
    const requestBody =  this.formattedAgencySearch;
    const sortDup = Helper.deepClone(this.selectedSort);

    switch(this.selectedSort?.active){
      case 'type':
        sortDup.active = 'type.name';
        break;
      case 'division':
        sortDup.active = 'division.name';
        break;
      case 'state':
        sortDup.active = 'address.state.short_name';
        break;
      case 'city':
        sortDup.active = 'address.city';
        break;
    }

    const isSortFieldString = /^(name|type|division|phone|state|city)$/.test(this.selectedSort?.active);
    const isunMappedTypeDate = /^(updatedAt)$/.test(this.selectedSort?.active);

    let funcArgs = [
      fieldSet,
      requestBody,
      sortDup,
      isSortFieldString,
      this.agenciesPagination,
      (res) => {
        this.agenciesList = res.results;
        this.formatAgencyType(this.agenciesList)
        this.dataSource.data = this.agenciesList;
        this.dataSource.data = res.results;
        this.isLoadingAgency = false;
        this.setAngencyPaginationFromRes(res);
        this.isLoadingAgency = false;
        this.cdRef.markForCheck();
        this.reSize();
      },
      (error) => {
        this.agenciesList = [];
        this.dataSource.data = this.agenciesList;
        this.isLoadingAgency = false;
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

  formatAgencyType(data) {
    data.map((list) => {
      list.type = list.type.map(aType => aType.name).join(', ');
    })
  }

  setAngencyPaginationFromRes(result) {
    if (result?.pagination?.total) {
      this.agenciesPagination.total = result['pagination']['total'];
      this.agenciesPagination.found = result['pagination']['found'];
      this.setPaginationSizes(result['pagination']['found']);
    }
    this.recordService.setAgencyListLocal(
      'agenciesPagination',
      this.agenciesPagination
    );
    this.cdRef.markForCheck();
  }
  removeEmptyorNull(searchData) {
    // Delete null or empty string from the search data;
    Object.keys(searchData).map((key) => {
      if (
        searchData[key] === '' ||
        searchData[key] === null ||
        (typeof searchData[key] === 'string' && searchData[key].trim() === '')
      ) {
        delete searchData[key];
      }
    });
    return searchData;
  }

  resetAgencyPagination(isDialog = false) {
    this.agenciesPagination = { page: 1, perPage: isDialog ? 50 : 10 };
    this.recordService.setAgencyListLocal(
      'agenciesPagination',
      this.agenciesPagination
    );
  }
  exportAgencies() {
    const formValue = this.agenciesSearchForm.value;
    const filters = {};
    if (formValue?.agencyType?.length) {
      filters['types'] = formValue?.agencyType;
    }
    if (formValue?.division?.length) {
      filters['divisions'] = formValue?.division;
    }
    if (formValue?.office?.length) {
      filters['offices'] = formValue?.office;
    }

    if (formValue?.managedBy?._id) {
      filters['managedBy'] = [formValue?.managedBy?._id];
    }
    const searchData = {
      search: formValue?.name ?? null,
      filter: filters
    };
    const defaultHeader = [
      { displayname: 'Agency Name', name: 'name', filed: 'name' },
      { displayname: 'Agency Type', name: 'type', filed: 'type.name' },
      { displayname: 'Phone', name: 'phone', filed: 'phone' },
      { displayname: 'Division', name: 'division', filed: 'division.name' },
      { displayname: 'Last Modified', name: 'updatedAt', filed: 'updatedAt' },
      { displayname: 'State', name: 'state', filed: 'address.state.short_name' },
      { displayname: 'City', name: 'city', filed: 'address.city' },
    ];
    /** Adding customize column for header */
    let customerHeader = {};
    this.customizeColumnService.displayedColumns
      .filter((column) => {
        let obj = defaultHeader.find(header => header.name === column);
        if (obj) {
          const data = { [obj.filed]: obj.displayname };
          customerHeader = { ...customerHeader, ...data };
        }
      });

    searchData['headers'] = customerHeader

    this.recordService
      .exportAgencies(searchData, this.selectedSort, false)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(
        (agencies) => {
          const contentType = agencies['headers'].get('content-type');
          const contentDispose = agencies.headers.get('Content-Disposition');
          const matches = contentDispose?.split(';')[1].trim().split('=')[1];
          if (contentType.includes('text/csv')) {
            let filename = matches && matches.length > 1 ? matches : 'agencies' + '.csv';
            filename = filename.slice(1, filename.length-1);
            saveAs(agencies.body, filename);
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

  public onMenuOpen() {
    this.menuOpened = true;
  }

  public onMenuClosed() {
    this.menuOpened = false;
  }

  /*public onHoverRow(index, row) {
    if (this.isDialogOpenend) {
      const parentDiv = document.getElementById('agency-fullscreen-scroll');
      const actionElement = document.getElementById('action-btn-main-dialog' + row['_id']);
      const ele = document.getElementById('hoverid-dialog-' + index);
      if (parentDiv && actionElement && ele) {
        actionElement.style.top = (ele.offsetHeight / 2) - 12 + 'px';
        actionElement.style.left = ((parentDiv.offsetWidth - 130) + parentDiv.scrollLeft) + 'px';
        ele.appendChild(actionElement);
      }
    } else {
      const parentDiv = document.getElementById('agency-table-scroll');
      const actionElement = document.getElementById('action-btn-main' + row['_id']);
      const ele = document.getElementById('hoverid-' + index);
      if (parentDiv && actionElement && ele) {
        actionElement.style.top = (ele.offsetHeight / 2) - 12 + 'px';
        actionElement.style.left = ((parentDiv.offsetWidth - 130) + parentDiv.scrollLeft) + 'px';
        ele.appendChild(actionElement);
      }
    }
    if (!this.menuOpened) {
      this.hoveredIndex = index;
    }
    this.cdRef.markForCheck();
  }
  onHoverOut() {
    if (!this.menuOpened) {
      this.hoveredIndex = null;
    }
    this.cdRef.markForCheck();
  }*/
  // window resize
  reSize() {
    this.scrollContent = window.innerHeight - 430;    
    this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
    this.cdRef.detectChanges();
  }

  public onSorting(sort: Sort) {
    this.selectedSort = sort;
    this.agenciesList = [];
    this.dataSource.data = this.agenciesList;
    this.cdRef.markForCheck();
    this.resetAgencyPagination(this.isDialogOpenend ? true : false);
    this.recordService.setAgencyListLocal('agencySorting', this.selectedSort);
    this.loadAgency(true);
  }

  getPageEvent(event: PageEvent) {
    this.pageEvent = true;
    this.agenciesPagination.page = event.pageIndex + 1;
    this.agenciesPagination.perPage = event.pageSize;
    this.loadAgency(true);
  }

  openAddAgency() {
    this.route.navigateByUrl(`/records-management-v2/agencies/add`);
  }

  public customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.customizeColumnService.displayedColumns.splice(0,0,'name');
      this.customizeColumnService.displayedColumns.splice(1,0,'action');    
      this.cdRef.detectChanges();
      this.reSize()
    });
  }

  openAgency(agency) {
    if (this.isDialogOpenend) {
      this.closeDialogBox(true);
    }
    this.route.navigateByUrl(`/records-management-v2/agencies/${agency['_id']}`);
  }
  public deleteAgencyAPI(row) {
    if (row !== null) {
      this.dialog
        .open(DeleteConfirmationDialogComponent, {
          width: '340px',
          height: '260px',
          panelClass: 'imx-mat-dialog'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res['action']) {
            this.recordService
              .deleteAgency(row['_id'])
              .subscribe((response) => {
                this.showsAlertMessage('Agency deleted sccessfully!');
                this.resetAgencyPagination(this.isDialogOpenend ? true : false);
                this.loadAgency();
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
        });
    }
  }

  public deleteAgency(row) {
    this.recordService.getAgencyAssociation(row['_id'])
    .subscribe((response) => {
      if(Object.keys(response?.associations).length > 0) {
        this.openDeleteWarningPopup();
      } else {
        this.deleteAgencyAPI(row);
      }
    },
    (errorResponse) => {
      if (errorResponse.error?.message) {
        this.recordService.showsAlertMessage(errorResponse.error?.message);
        return;
      } else if (errorResponse.error?.error) {
        this.recordService.showsAlertMessage(errorResponse.error?.error);
        return;
      }
      this.recordService.showsAlertMessage('Something went wrong, Please try again later');
    });
  }

  public openDeleteWarningPopup() {
    const dialogueData = {
      title: 'Attention',
      description: 'Please <b>Confirm</b>. This record has already been used on a Campaign or Contract. Please double-check all relationships before deleting.',
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

  private showsAlertMessage(msg) {
    const config = {
      duration: 5000
    } as MatSnackBarConfig;

    this.snackBar.open(msg, '', config);
  }
  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  duplicateAgency(element) {
    if (this.isDialogOpenend) {
      this.closeDialogBox(true);
    }
    this.route.navigateByUrl(`/records-management-v2/agencies/add?agencyId=${element._id}`);
  }

  ngAfterViewInit() {
    if (!this.isDialogOpenend) {
      this.getAgencyTypetext();
      this.getDivisionsToolTiptext();
      this.getOfficeToolTiptext();
    }
  }


  public changeOption(type) {
    switch (type) {
      case 'agencyType':
        this.getAgencyTypetext();
        break;
      case 'office':
        this.getOfficeToolTiptext();
        break;
      case 'division':
        this.getDivisionsToolTiptext();
        break;
    }
  }

  private getAgencyTypetext() {
    setTimeout(() => {
      this.agencyTypeTooltipText = (this.agencyTypeRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
    }, 500);
  }

  private getOfficeToolTiptext() {
    setTimeout(() => {
      this.officeTooltipText = (this.officeRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
    }, 500);
  }

  private getDivisionsToolTiptext() {
    setTimeout(() => {
      this.divisionTooltipText = (this.divisionRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
    }, 500);
  }

  private setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
      if (!this.pageEvent && this.isDialogOpenend) {
        this.agenciesPagination.perPage = 25;
      }
      this.pageEvent = false;
    } else {
      this.paginationSizes = [10];
      if (this.isDialogOpenend) {
        this.agenciesPagination.perPage = 10;
      }
    }
  }

  public openAgenciesDialog() {
    this.resetAgencyPagination(true);
    this.dialog
      .open(AgenciesListComponent, {
        disableClose: true,
        data: {
          dialogOpenened: true
        },
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'agencies-list-dialog-fullscreen'
      })
      .afterClosed()
      .subscribe((skipSetup) => {
        // While clikcing on duplicate action we no need to reinitialize normal table
        this.resetAgencyPagination();
        if (!skipSetup) {
          this.setUpAgency();
        }
      });
  }

  public closeDialogBox(skipSetup = false) {
    this.dialogRef.close(skipSetup);
  }

  public mangedByUserTrackByFn(idx: number, user: any) {
    return user?.id ?? idx;
  }

  public mangedByUserDisplayWithFn(user: any) {
    return user?.name ?? '';
  }

  public updateMangedByContainer() {
    this.panelContainer = '.users-list-autocomplete';
  }

  public loadMoreManagementUsers() {
    this.managedByAutoComplete.loadMoreData(null, (res) => {
      this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
      this.cdRef.markForCheck();
    });
  }
  
  private setupElasticSearchPath() {
    this.elasticSearch.PATH = `agencies/search`;
    this.elasticSearch.ELASTIC_PATH = `agencies/search`;
  }
  public onResetForm() {
    this.agenciesSearchForm.reset();

    this.managedByAutoComplete.resetAll();
    this.managedByAutoComplete.loadData(null, (res) => {
      this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
      this.cdRef.markForCheck();
    });
    this.managedByAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
    this.searchSubmit();
  }
}
