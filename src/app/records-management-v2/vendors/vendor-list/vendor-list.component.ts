import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
  ChangeDetectionStrategy,
  Optional,
  SkipSelf,
  Inject,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import {
  VendorsSearchPagination,
  Vendor,
  VendorSearchPayload
} from '@interTypes/inventory-management';
import { takeUntil, catchError, tap, filter, map } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import { VendorGroup } from '@interTypes/vendor/vendor-group-search';
import { VendorGroupAbstract } from '../vendor-group';
import { VendorService } from '../vendor.service';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent
} from '@angular/material/paginator';
import { forbiddenNamesValidator, IMXMatPaginator } from '@shared/common-function';
import { State } from '@interTypes/vendor/state';
import { VendorType } from '@interTypes/vendor';
import { RecordService } from '../../record.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { saveAs } from 'file-saver';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { AssociationsIdentifier, Helper } from '../../../classes';
import { CustomColumnsArea } from '@interTypes/enums';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { AuthenticationService } from '@shared/services/authentication.service';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';

@Component({
  selector: 'app-vendor-list',
  templateUrl: './vendor-list.component.html',
  styleUrls: ['./vendor-list.component.less'],
  providers: [{ provide: MatPaginatorIntl, useClass: IMXMatPaginator }, CustomizeColumnService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorListComponent extends VendorGroupAbstract implements OnInit, OnDestroy, AfterViewInit {
  defaultColumns = [
    // { displayname: 'Vendor Name', name: 'name' },
    { displayname: 'Parent Company', name: 'parentCompany' },
    { displayname: 'PUB ID', name: 'pubA_id' },
    { displayname: 'State', name: 'state' },
    { displayname: 'City', name: 'city' },
    { displayname: 'Parent', name: 'parentFlag' },
    { displayname: 'Current', name: 'currentFlag' },
    { displayname: 'Last Modified', name: 'updatedAt' },
  ];

  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  public scrollContent: number;
  public vendorPagination: VendorsSearchPagination = {
    page: 1,
    perPage: 10 // Default perPage size
  };
  public isLoadingVendors = false;
  private unSubscribe: Subject<void> = new Subject<void>();

  public vendorsList: Vendor[] = [];
  public vendorSearchForm: FormGroup;
  public isLoadingVendorsGroup = true;
  public parentVendors: VendorGroup[] = [];
  public filteredParentVendors: VendorGroup[] = [];
  public panelContainer: string;
  public panelStateContainer: string;
  public noVendorMessage: string;

  private formatedSearchVendor;
  private selectedSort: Sort;
  public sortName = 'updatedAt';
  public sortDirection = 'desc';

  public states: State[] = [];
  public filteredStates: State[] = [];
  public isLoadingState = false;

  public vendorTypes: VendorType[] = [];
  public vendorTypePagination = {
    perPage: 10,
    page: 1,
    total: 10
  };
  pageEvent = false;
  public isVendorTypesLoading = false;
  public customizeColumnService: CustomizeColumnService;
  public menuOpened = false;
  public hoveredIndex = -1;
  public isDialogOpenend = false;
  public paginationSizes = [10];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('vendorCompanyRef', {read: ElementRef}) vendorCompany: ElementRef;
  public vendorGroupTooltipText = '';
  public searchFilterApplied = false;
  @ViewChild('tableScrollRef', {read: ElementRef, static:false}) tableScrollRef: ElementRef;
  public hasHorizontalScrollbar = false;
  userPermission: UserActionPermission;

  constructor(
    public cdRef: ChangeDetectorRef,
    private route: Router,
    private fb: FormBuilder,
    public vendorApi: RecordService,
    private matSnackBar: MatSnackBar,
    public dialog: MatDialog,
    private auth: AuthenticationService,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<VendorListComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public injectedData: any
  ) {
    super(vendorApi, cdRef);
  }

  ngOnInit(): void {
    this.userPermission = this.auth.getUserPermission(UserRole.VENDOR_GENERAL);
    this.displayedColumns = this.defaultColumns.map((column) => column['name']);
    this.customizeColumnService = new CustomizeColumnService(this.dialog);
    this.setUpVendor();
    if (this.injectedData?.dialogOpenened) {
      this.isDialogOpenend = true;
    } else {
      this.reSize();
      this.loadVendorTypes();
  
  
      // Set the vendor group data
      this.loadVendorsGroups();
      this.setFilterVendorsGroupSubscribtion(this.vendorSearchForm, 'parentCompany');
  
      this.loadAllStates();
      // TODO: state search handle in local.. If you need API search enabe below code
      //this.setFilterStateSubscribtion(this.vendorSearchForm, 'state');
    }


   // Initialize customize column
    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.defaultColumns),
      cachedKeyName: CustomColumnsArea.VENDORS_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, "name"); // Sticky column
        this.customizeColumnService.displayedColumns.splice(1, 0, "action"); // sticky column
        this.cdRef.markForCheck();
      } 
    });
   }

  ngAfterViewInit(){
    this.getVendorGrouptext(); 
  }
  changeVendorType(event){
    this.getVendorGrouptext();
  }

  getVendorGrouptext(){
    // Tested different scenario so that added setTimeout here
    setTimeout(() => {
      this.vendorGroupTooltipText = (this.vendorCompany?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
    }, 500);
    
    
  }

  private setUpVendor() {
    // Setting keep my view vendor filters
    const sessionFilter = this.vendorApi.getVendorListLocal();
    if(sessionFilter?.vendorPagination){
      this.vendorPagination = sessionFilter?.vendorPagination
    }
    if(sessionFilter?.vendorSorting?.active){
      this.selectedSort = sessionFilter?.vendorSorting;
      this.sortName = this.selectedSort?.active ?? 'updatedAt';
      this.sortDirection =  this.selectedSort?.direction ?? 'asc';
    }
    let vendorSearch;
    if(sessionFilter?.searchVendor){
      vendorSearch = sessionFilter?.searchVendor;
    }

    this.vendorSearchForm = this.fb.group({
      name: [vendorSearch?.name ?? null],
      parentCompany: [vendorSearch?.parentCompany ?? null, null, forbiddenNamesValidator],
      type: [vendorSearch?.type ?? null],
      state: [vendorSearch?.state?._id ? vendorSearch?.state : null, null, forbiddenNamesValidator],
      city: [vendorSearch?.city ?? null],
      currentFlag: [vendorSearch?.currentFlag ?? false],
      parentFlag: [vendorSearch?.parentFlag ?? false],
    });

    if(sessionFilter?.searchVendor){
      this.searchSubmit();
    }else{
    this.loadVendors();
    }
  }
  vendorDisplayWithFn(vendorGroup: VendorGroup) {
    return vendorGroup?.name ?? '';
  }

  vGroupTrackByFn(idx: number, vendorGroup: VendorGroup) {
    return vendorGroup?._id ?? idx;
  }

  stateDisplayWithFn(state: State) {
    return state?.name ? (state?.short_name + ' - ' + state?.name) : '';
  }

  stateTrackByFn(idx: number, state: State) {
    return state?._id ?? idx;
  }

  // To make inifinte scroll work, we need to set container when the autocomplete overlay panel is opened
  public updateContainer() {
    this.panelContainer = '.vendor-group-autocomplete';
  }
  public updateStateContainer() {
    this.panelStateContainer = '.state-list-autocomplete';
  }

  public searchSubmit() {
    
    if (!this.vendorSearchForm.valid) { return; }

    const formValue = this.vendorSearchForm.value;
    let searchData = {
      name: formValue?.name ?? null,
      parentCompany: formValue?.parentCompany?.name ?? null,
      state: formValue?.state?._id ?? null,
      type: formValue?.type ?? null,
      city: formValue?.city ?? null,
      currentFlag: formValue?.currentFlag ?? false,
      parentFlag: formValue?.parentFlag ?? false
    };
    this.formatedSearchVendor = this.removeEmptyorNull(searchData);
    this.resetVendorPagination(this.injectedData?.dialogOpenened ? true : false);
    this.loadVendors();
  }

  removeEmptyorNull(searchData) {
    // Delete null or empty string from the search data;
    Object.keys(searchData).map((key) => {
        if (searchData[key] == '' || searchData[key] === null || (typeof searchData[key] === 'string' && searchData[key].trim() == '')) {
            delete searchData[key];
        }
    });
    return searchData;
  }

  resetVendorPagination(isDialog = false) {
    this.vendorPagination = { page: 1, perPage: isDialog ? 50 : 10 };
    this.vendorApi.setVendorListLocal('vendorPagination', this.vendorPagination);
  }

  setVendorPaginationFromRes(result) {
    if (result?.pagination?.total) {
      this.vendorPagination.total = result['pagination']['total'];
      this.vendorPagination.found = result['pagination']['found'];
      this.setPaginationSizes(result['pagination']['found']);
    }
    this.vendorApi.setVendorListLocal('vendorPagination', this.vendorPagination);
    this.cdRef.markForCheck();
  }

  private loadVendors() {
    // Reset pagination for each new vendor load
    this.isLoadingVendors = true;
    this.vendorApi
      .getVendorBySearch(this.formatPayloadSearchData(), this.vendorPagination, this.selectedSort)
      .pipe(
        tap(() => {
          this.isLoadingVendors = false;
          this.cdRef.markForCheck();
        }),
        filter((res) => !!res.results)
      )
      .subscribe((res) => {
        this.vendorsList = res.results;
        this.dataSource.data = this.vendorsList;
        this.setVendorPaginationFromRes(res);
        this.reSize();
        this.cdRef.markForCheck();
      },error=>{
        //Hide loader
         this.isLoadingVendors = false;
         this.cdRef.markForCheck();
         if (error?.error?.message) {
            this.showsAlertMessage(error?.error?.message);
            return;
          }else if(error?.error?.error){
            this.showsAlertMessage(error?.error.error);
            return;
          }
          this.showsAlertMessage(
            'Something went wrong, Please try again later'
          );
      });
  }

  formatPayloadSearchData() {
    let vendorSearchPayload: VendorSearchPayload = {};
    this.noVendorMessage = 'There are no vendors in the system.';
    if (this.formatedSearchVendor && Object.keys(this.formatedSearchVendor).length) {
      this.searchFilterApplied = true;
      vendorSearchPayload = {
        filters: this.formatedSearchVendor
      };
      this.noVendorMessage = 'No Vendor records found with search criteria.';
    }
    if(vendorSearchPayload?.filters){
      const formValue = this.vendorSearchForm.value;
      this.vendorApi.setVendorListLocal('searchVendor', formValue);
      this.searchFilterApplied = true;
    }else{
      this.vendorApi.removeVendorListLocal('searchVendor');
      this.searchFilterApplied = false;
    }
    return vendorSearchPayload;
  }
  // window resize
  reSize() {
    this.scrollContent = window.innerHeight - 420;
    setTimeout(() => {      
    this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
    this.cdRef.detectChanges();
    }, 200);
  }

  public onSorting(sort: Sort) {
    this.selectedSort = sort;
    this.vendorsList = [];
    this.dataSource.data = this.vendorsList;
    this.cdRef.markForCheck();
    this.resetVendorPagination(this.isDialogOpenend ? true : false);
    this.vendorApi.setVendorListLocal('vendorSorting', this.selectedSort);
    this.loadVendors();
  }

  openAddVendor() {
    this.route.navigateByUrl(`/records-management-v2/vendors/add`);
  }

  openVendorDetails(vendor){
    if (this.isDialogOpenend) {
      this.closeDialogBox(true);
    }
    this.route.navigateByUrl(`/records-management-v2/vendors/${vendor._id}`);
  }

  getPageEvent(event: PageEvent) {
    this.pageEvent = true;
    this.vendorPagination.page = event.pageIndex + 1;
    this.vendorPagination.perPage = event.pageSize;
    this.loadVendors();
  }

  public loadMoreVendorTypes() {
    const currentSize =
      this.vendorTypePagination.page * this.vendorTypePagination.perPage;
    if (currentSize > this.vendorTypePagination.total) {
      this.isVendorTypesLoading = false;
      return;
    }

    this.vendorTypePagination.total += 1;
    this.loadVendorTypes();
  }

  private loadVendorTypes() {
    this.isVendorTypesLoading = true;
    this.vendorApi
      .getVendorsTypesSearch(this.vendorTypePagination)
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        this.vendorTypes = res.results;
        this.vendorTypePagination.total = res.pagination.total;
        this.isVendorTypesLoading = false;
        this.getVendorGrouptext();
        this.cdRef.markForCheck();
      });
  }

  /** Vendor Export */
  csvExport(exportType='xlsx') {
    const fieldSet =  this.customizeColumnService.displayedColumns.filter((column) => column != 'action').join(',');
     this.vendorApi
      .exportVendors(this.formatPayloadSearchData(), exportType, fieldSet, this.selectedSort, false)
      .subscribe(
        (response) => {
          const contentType = response['headers'].get('content-type');
          const contentDispose = response.headers.get('Content-Disposition');
          const matches = contentDispose?.split(';')[1].trim().split('=')[1];
          if (contentType.includes('text/csv')) {          
          const filename = matches && matches.length > 1 ? matches : 'vendors' + '.csv';
          saveAs(response.body, filename);
          }else if(contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')){
            const filename = matches && matches.length > 1 ? matches : 'vendors' + '.xlsx';           
            saveAs(response.body, filename);
          }else{
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

  private showsAlertMessage(msg) {
    const config = {
      duration: 3000
    } as MatSnackBarConfig;
    this.matSnackBar.open(msg, '', config);
}
  public customizeColumn() {
    this.customizeColumnService.customizeColumn(()=>{
    this.customizeColumnService.displayedColumns.splice(0, 0, 'name');
    this.customizeColumnService.displayedColumns.splice(1, 0, 'action');
    this.reSize()
    this.cdRef.detectChanges();
    });
  }

  public onMenuOpen() {
    this.menuOpened = true;
  }

  public onMenuClosed() {
    this.menuOpened = false;
  }

  /*public onHoverRow(index, row) {
    if (this.isDialogOpenend) {
      const parentDiv = document.getElementById('vendor-fullscreen-scroll');
      const actionElement = document.getElementById('action-btn-main-dialog' + row['_id']);
      const ele = document.getElementById('vendorHoverid-dialog-' + index);
      if (parentDiv && actionElement && ele) {
        actionElement.style.top = (ele.offsetHeight / 2) - 12 + 'px';
        actionElement.style.left = ((parentDiv.offsetWidth - 130) + parentDiv.scrollLeft) + 'px';
        ele.appendChild(actionElement);
      }
    } else {
      const parentDiv = document.getElementById('vendor-table-scroll');
      const actionElement = document.getElementById('action-btn-main' + row['_id']);
      const ele = document.getElementById('vendorHoverid-' + index);
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
  }*/

  public onHoverOut() {
    if (!this.menuOpened) {
      this.hoveredIndex = null;
    }
    this.cdRef.markForCheck();
  }

  public deleteVendorAPI(element) {
  if (element !== null) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['action']) {
          this.vendorApi
            .deleteVendorBy(element['_id'])
            .subscribe((response) => {
              this.showsAlertMessage('Vendor deleted successfully!');
              this.resetVendorPagination(this.isDialogOpenend ? true : false);
              this.loadVendors();
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

  public deleteVendor(element) {
    this.vendorApi.getVendorAssociation(element['_id'])
      .subscribe((response) => {
        if(Object.keys(response?.associations).length > 0) {
          this.openDeleteWarningPopup();
        } else {
          this.deleteVendorAPI(element);
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


  public duplicateVendor(element) {
    if (this.isDialogOpenend) {
      this.closeDialogBox(true);
    }
    this.route.navigateByUrl(
      `/records-management-v2/vendors/add?vendorId=${element._id}`
    );
  }

  public openVendorDialog() {
    this.resetVendorPagination(true);
    this.dialog
      .open(VendorListComponent, {
        disableClose: true,
        data: {
          dialogOpenened: true
        },
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'vendor-list-dialog-fullscreen'
      })
      .afterClosed()
      .subscribe((skipSetup) => {
        // While clikcing on duplicate action we no need to reinitialize normal table
        this.resetVendorPagination();
        if (!skipSetup) {
          this.setUpVendor();
        }
      });
  }
  public closeDialogBox(skipSetup = false) {
    this.dialogRef.close(skipSetup);
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  private setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
      if (!this.pageEvent && this.isDialogOpenend) {
        this.vendorPagination.perPage = 25;
      }
      this.pageEvent = false;
    } else {
      this.paginationSizes = [10];
      if (this.isDialogOpenend) {
        this.vendorPagination.perPage = 10;
      }
    }
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
  onResetForm() {
    this.vendorSearchForm.reset();
    this.loadVendorsGroups();
    this.searchSubmit();
  }
}
