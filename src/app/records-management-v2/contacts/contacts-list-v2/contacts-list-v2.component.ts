import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
  Input,
  OnDestroy,
  EventEmitter,
  Output,
  Optional,
  SkipSelf,
  Inject,
  ElementRef,
} from '@angular/core';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent
} from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { filter, tap, takeUntil, map } from 'rxjs/operators';
import { IMXMatPaginator } from '@shared/common-function';
import { RecordService } from 'app/records-management-v2/record.service';
import { CustomColumnOrigin, CustomColumnsArea } from '@interTypes/enums';
import { Helper } from 'app/classes';
import { CustomizeColumnV3Component } from '@shared/components/customize-column-v3/customize-column-v3.component';
import { RecordsPagination } from '@interTypes/pagination';
import { Contact } from '@interTypes/records-management';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { saveAs } from 'file-saver';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { AuthenticationService } from '@shared/services';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
import { ElasticSearch } from '../../../classes/ElasticSearch';

@Component({
  selector: 'app-contacts-list-v2',
  templateUrl: './contacts-list-v2.component.html',
  styleUrls: ['./contacts-list-v2.component.less'],
  providers: [{ provide: MatPaginatorIntl, useClass: IMXMatPaginator }, ElasticSearch],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactsListV2Component implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) public paginator: MatPaginator;
  @Input() searchParams$: Subject<any> = new Subject<any>();
  @Input() exportCSV$: Subject<any> = new Subject<any>();
  @Input() public enableCustomizeHeader = true;
  @Input() public moduleName;
  @Input() private organizationId$: Subject<any> = new Subject<any>();
  @Input() private contactRefresh$: EventEmitter<boolean>;
  @Input() public searchFilterApplied = false;
  @Output() openContactEmit = new EventEmitter();
  @Output() openDuplicateContactEmit = new EventEmitter();
  userPermission: UserActionPermission;
  private organizationId:string;
  @Input() public reLoader$: Subject<any> = new Subject();

  @Input() public defaultColumns = [
    { displayname: 'Last Name', name: 'lastName' },
    { displayname: 'Company Name', name: 'companyName' },
    { displayname: 'Type', name: 'companyType' },
    { displayname: 'Email Address', name: 'email' },
    { displayname: 'Phone', name: 'mobile' },
    { displayname: 'State', name: 'state' },
    { displayname: 'City', name: 'city' },
    { displayname: 'Last Modified', name: 'updatedAt' },
  ];
  public sortableColumns = [
    { displayname: 'First Name', name: 'firstName' },
    { displayname: 'Action', name: 'action' },
    { displayname: 'Last Name', name: 'lastName' },
    { displayname: 'Company Name', name: 'companyName' },
    { displayname: 'Type', name: 'companyType' },
    { displayname: 'Email Address', name: 'email' },
    { displayname: 'Phone', name: 'mobile' },
    { displayname: 'State', name: 'state' },
    { displayname: 'City', name: 'city' },
    { displayname: 'Last Modified', name: 'updatedAt' },
  ];
  private columns = [];
  private currentSortables: any;
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  public scrollContent: number;
  public contactsPagination: RecordsPagination = {
    page: 1,
    perPage: 10
  };
  public isLoadingContacts = false;
  public contactsList: Contact[] = [];
  public panelContainer: string;
  public noContactMessage: string;
  public menuOpened = false;
  public hoveredIndex = -1;
  private searchFilters = {};
  private selectedSort: Sort = {
    active: 'updatedAt',
    direction: 'desc'
  };
  public sortedField = 'updatedAt';
  public sortDirection = 'desc';
  private unSubscribe$: Subject<void> = new Subject<void>();
  tableWidth: number;
  public isDialogOpenend = false;
  public paginationSizes = [10];
  pageEvent = false;
  @ViewChild('tableScrollRef', {read: ElementRef, static:false}) tableScrollRef: ElementRef;
  public hasHorizontalScrollbar = false;
  public customizeColumnService: CustomizeColumnService;
  public isSearchApplied = false;

  constructor(
    public cdRef: ChangeDetectorRef,
    private router: Router,
    public recordService: RecordService,
    private dialog: MatDialog,
    private matSnackBar: MatSnackBar,
    public elasticSearch: ElasticSearch,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<ContactsListV2Component>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public injectedData: any,
    private auth: AuthenticationService
  ) {
    this.userPermission = this.auth.getUserPermission(UserRole.CONTACTS);
    this.elasticSearch.PATH = 'contacts/search';
  }

  public ngOnInit(): void {
    //this.displayedColumns = this.defaultColumns.map((column) => column['name']);
    this.customizeColumnService = new CustomizeColumnService(this.dialog);
    this.reSize();
    // Setting keep my view contacts filters
    let sessionFilter = this.recordService.getContactListLocalSession();

    // Remove keepmy view other then contact module
    if(this.moduleName){
      sessionFilter = null;
    }

    if (sessionFilter?.contactsPagination) {
      this.contactsPagination = sessionFilter?.contactsPagination;
    }

    this.setSessionSorting();

    if (sessionFilter?.filtersInfo) {
      this.searchFilters = this.recordService.formConatctSearchFiltersForAPI(
        sessionFilter.filtersInfo
      );
    }
    //this.prepareColumns();

     // Initialize customize column
     this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.defaultColumns),
      cachedKeyName: CustomColumnsArea.CONTACTS_PLAN_TABLE,
      successCallback: () => {
        if(!this.moduleName){
          this.customizeColumnService.displayedColumns.splice(0,0,'firstName');
        }else{
          this.customizeColumnService.displayedColumns.splice(0,0,'fullname')
        }
        this.customizeColumnService.displayedColumns.splice(1,0,'action')
        this.cdRef.markForCheck();
      }
    });

    if(!this.moduleName){
      this.loadContacts();
    }

    if (this.injectedData?.dialogOpenened) {
      this.isDialogOpenend = true;
    }

    if(this.injectedData?.searchFilterApplied) {
      this.searchFilterApplied = this.injectedData?.searchFilterApplied
    }

    this.searchParams$
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe((searchInfo) => {
        this.searchFilters = searchInfo;
        this.resetContactPagination();
        this.loadContacts();
      });
    this.exportCSV$
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe((searchInfo) => {
        this.exportCSV();
      });

    this.organizationId$
    .pipe(takeUntil(this.unSubscribe$))
    .subscribe((organizationId) => {
      this.organizationId = organizationId;
      this.searchFilters = {
        filter:{
          companyIds: [this.organizationId]
        }
      };
      this.loadContacts();
    });

    if(this.contactRefresh$){
      this.contactRefresh$
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe(() => {
        this.resetContactPagination();
        this.loadContacts();
      });
    }
    this.reLoader$.pipe(takeUntil(this.unSubscribe$)).subscribe((res) => {
      if (res?.openContactTab) {
        setTimeout(() => {
          this.reSize();
        }, 200);
      }
    });
  }

  setSessionSorting(){
  let sessionFilter = this.recordService.getContactListLocalSession();
    const sortName = this.moduleName + 'Sorting';
    if(this.moduleName && sessionFilter?.[sortName]?.active){
      this.selectedSort = sessionFilter?.[sortName];
    }else if (sessionFilter?.contactsSorting?.active) {
      this.selectedSort = sessionFilter?.contactsSorting;
    }
    this.sortedField = this.selectedSort?.active ?? 'updatedAt';
    this.sortDirection = this.selectedSort?.direction ?? 'desc';
    this.cdRef.markForCheck();
  }

  public reSize() {
    if(this.moduleName === 'vendor'){
      this.scrollContent = window.innerHeight - 490;
    }else if(this.moduleName === 'client'){
      this.scrollContent = window.innerHeight - 495;
    }else if(this.moduleName === 'agency'){
      this.scrollContent = window.innerHeight - 480;
    }
    else{
      this.scrollContent = window.innerHeight - 390;
    }
    setTimeout(() => {
      this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
      this.cdRef.detectChanges();
    }, 200);
  }

  public onSorting(sort: Sort) {
    this.selectedSort = sort;
    this.contactsList = [];
    this.dataSource.data = this.contactsList;
    this.updateSessionSorting();
    this.cdRef.markForCheck();
    this.resetContactPagination(this.isDialogOpenend ? true : false);
    this.loadContacts(true);
  }

  public updateSessionSorting() {
    if(this.moduleName){
      this.recordService.setContactListLocalSession(
        this.moduleName + 'Sorting',
        this.selectedSort
      );
    }else{
      this.recordService.setContactListLocalSession(
        'contactsSorting',
        this.selectedSort
      );
    }
  }

  public openAddContact() {
    this.router.navigateByUrl('records-management-v2/contacts/add');
  }

  public openContactDetails(element: Contact) {
    if(this.moduleName){
      this.openContactEmit.emit(element);
    }else{
      if (this.isDialogOpenend) {
        this.closeDialogBox(true);
      }
      this.router.navigateByUrl(`records-management-v2/contacts/${element._id}`);
    }

  }

  public duplicateContact(element: Contact) {
    if(this.moduleName){
      this.openDuplicateContactEmit.emit(element);
    }else{
      if (this.isDialogOpenend) {
        this.closeDialogBox(true);
      }
      this.router.navigateByUrl(
      `/records-management-v2/contacts/add?contactId=${element._id}`
    );
  }


  }

public deleteContactAPI(row) {
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
            .deleteContact(row['_id'])
            .subscribe((response) => {
                this.showsAlertMessage('Contact deleted successfully!');
                this.resetContactPagination(this.isDialogOpenend ? true : false);
                this.setSessionSorting();
                this.loadContacts();
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
public deleteContact(row) {
  this.recordService.getContactAssociation(row['_id'])
    .subscribe((response) => {
      if(Object.keys(response?.associations).length > 0) {
        this.openDeleteWarningPopup();
      } else {
        this.deleteContactAPI(row);
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
    description: 'Please <b>Confirm</b> This record has already been used on a Campaign or Contract. Please double-check all relationships before deleting.',
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


  public resetContactPagination(isDialog = false) {
    this.contactsPagination = { page: 1, perPage: isDialog ? 50 : 10 };
    this.recordService.setContactListLocalSession(
      'contactsPagination',
      this.contactsPagination
    );
  }


  public onMenuOpen() {
    this.menuOpened = true;
  }

  public onMenuClosed() {
    this.menuOpened = false;
  }



  public getPageEvent(event: PageEvent) {
    this.pageEvent = true;
    this.contactsPagination.page = event.pageIndex + 1;
    this.contactsPagination.perPage = event.pageSize;
    this.loadContacts(true);
  }

  private loadContactsFromElasticSearch(isForSortingOrPaginating = false) {
    const selectedSort = Helper.deepClone(this.selectedSort);

    switch (selectedSort.active) {
      case 'address':
        selectedSort.active = 'address.line';
        break;
      case 'notes':
        selectedSort.active = 'note.notes';
        break;
      case 'companyName':
        selectedSort.active = 'companyId.name';
        break;
      case 'state':
        selectedSort.active = 'address.state.short_name';
        break;
      case 'city':
        selectedSort.active = 'address.city';
        break;
    }

    const isSortFieldString = /(firstName|lastName|companyName|companyType|email|mobile|state|city)/.test(
      this.selectedSort.active
    );
    const isunMappedTypeDate = /^(updatedAt)$/.test(this.selectedSort?.active);

    const fieldSets = [
      '_id',
      'firstName',
      'lastName',
      'companyId',
      'address',
      'updatedAt',
      'companyType',
      'email',
      'mobile',
      'note'
    ];
    const funcArgs = [
      fieldSets,
      this.searchFilters,
      selectedSort,
      isSortFieldString,
      this.contactsPagination as any,
      (res) => {
        this.contactsList = res.results;
        this.dataSource.data = this.contactsList;
        this.isLoadingContacts = false;
        this.isSearchApplied = true;
        this.cdRef.markForCheck();
        this.reSize();
        this.setPaginationFromRes(res);

        if (!this.contactsList?.length) {
          this.resetSorting();
          this.updateSessionSorting();
        }
      },
      (error) => {
        this.isSearchApplied = true;
        this.isLoadingContacts = false;
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

  public loadContacts(isForSortingOrPaginating = false) {
    if(this.selectedSort?.['active'] === 'fullname'){
      this.selectedSort['active'] = 'firstName';
    }

    this.isLoadingContacts = true;

    if (!this.moduleName) {
      this.loadContactsFromElasticSearch(isForSortingOrPaginating);
      return;
    }

    this.recordService
      .getContacts(
        this.searchFilters,
        this.contactsPagination,
        this.selectedSort,
        this.moduleName
      )
      .pipe(
        tap(() => {
          this.isLoadingContacts = false;
          this.cdRef.markForCheck();
        }),
        filter((res) => !!res.results)
      )
      .subscribe((res) => {
        this.contactsList = res.results;
        this.dataSource.data = this.contactsList;
        this.cdRef.markForCheck();
        this.reSize();
        this.setPaginationFromRes(res);
        if(!this.contactsList.length){
          this.resetSorting();
          this.updateSessionSorting();
        }
      }, error => {
         this.isLoadingContacts = false;
         this.cdRef.markForCheck();
      });
  }

  private setPaginationFromRes(result) {
    if (result?.pagination?.total) {
      this.contactsPagination.total = result['pagination']['total'];
      this.contactsPagination.found = result['pagination']['found'];
      this.setPaginationSizes(result['pagination']['found'])
    }
    this.recordService.setContactListLocalSession(
      'contactsPagination',
      this.contactsPagination
    );
    this.cdRef.markForCheck();
  }

  ngOnDestroy(): void {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }



  public customizeColumn() {
    this.customizeColumnService.customizeColumn(()=>{
      if(!this.moduleName){
        this.customizeColumnService.displayedColumns.splice(0,0,'firstName');
      }else{
        this.customizeColumnService.displayedColumns.splice(0,0,'fullname')
      }
      this.customizeColumnService.displayedColumns.splice(1, 0, 'action');
    this.reSize()
    this.cdRef.detectChanges();
    });
  }


  private exportCSV() {
    const selectedColumns = this.formatCustomColumnsForAPI();
    this.recordService
      .exportContacts(this.searchFilters, this.selectedSort, selectedColumns)
      .subscribe(
        (response) => {
          const contentType = response['headers'].get('content-type');
          if (contentType.includes('text/csv')) {
            const contentDispose = response.headers.get('content-disposition');
            const matches = contentDispose.split(';')[1].trim().split('=')[1];
            const filename = matches && matches.length > 1 ? matches : (new Date()).getUTCMilliseconds() + '.csv';
            saveAs(response.body, filename);
          } else {
            this.showsAlertMessage(response?.message ?? 'Something went wrong, Please try again later');
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

  private showsAlertMessage(msg) {
    const config = {
      duration: 3000
    } as MatSnackBarConfig;
    this.matSnackBar.open(msg, '', config);
  }

  private formatCustomColumnsForAPI() {
    const columns = Helper.deepClone(this.customizeColumnService.currentSortables);
    columns.splice(0,0,{ displayname: 'First Name', name: 'firstName' });
    const formattedColumns = {};
    columns.forEach(column => {
      switch (column['name']) {
        case 'companyName':
          formattedColumns['companyId.name'] = column['displayname']
          break;
        case 'state':
          formattedColumns['address.state.name'] = column['displayname']
          break;
        case 'city':
          formattedColumns['address.city'] = column['displayname']
          break;
        default:
          formattedColumns[column['name']] = column['displayname']
        break;
      }
    });
    return formattedColumns;
  }

  private resetSorting(){
    this.sortedField = 'updatedAt';
    this.sortDirection = 'desc';
    this.selectedSort.active = 'updatedAt';
    this.selectedSort.direction = 'desc';
    this.cdRef.markForCheck();
  }

  public closeDialogBox(skipSetup = false) {
    this.dialogRef.close(skipSetup);
  }

  public openContactFullscreenDialog() {
    this.resetContactPagination(true);
    this.dialog
      .open(ContactsListV2Component, {
        disableClose: true,
        data: {
          dialogOpenened: true,
          searchFilterApplied: this.searchFilterApplied
        },
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'contact-list-dialog-fullscreen'
      })
      .afterClosed()
      .subscribe((skipSetup) => {
        // While clikcing on duplicate action we no need to reinitialize normal table
        this.resetContactPagination();
        if (!skipSetup) {
          this.setSessionSorting();
          this.loadContacts();
        }
      });
  }
    public setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
      if (!this.pageEvent && this.isDialogOpenend) {
        this.contactsPagination.perPage = 25;
      }
      this.pageEvent = false;
    } else {
      this.paginationSizes = [10];
      if (this.isDialogOpenend) {
        this.contactsPagination.perPage = 10;
      }
    }
  }
}
