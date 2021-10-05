import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnInit,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { saveAs } from 'file-saver';
import { Pagination } from "app/contracts-management/models/pagination.model";
import {
  IOFilter,
  InsertionOrderFilters,
  InsertionOrdersResponse
} from "app/contracts-management/models";

import { AddLineItemDialogComponent } from './../../contracts/contracts-list/contract-details/core-details/add-line-item-dialog/add-line-item-dialog.component';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { InsertionOrdersService } from 'app/contracts-management/services/insertion-orders.service';
import { ContractLineItemsService } from "app/contracts-management/services/contract-line-items.service";
import { IMXMatPaginator } from '@shared/common-function';
import { Helper } from '../../../classes';
import { CustomColumnsArea } from '@interTypes/enums';
import { AuthenticationService, SnackbarService } from '@shared/services';

import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TabLinkHandler, TabLinkType } from '@shared/services/tab-link-handler';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';

@Component({
  selector: 'app-insertion-orders-list',
  templateUrl: './insertion-orders-list.component.html',
  styleUrls: ['./insertion-orders-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator },
    CustomizeColumnService
  ]
})
export class InsertionOrdersListComponent implements OnInit {

  @ViewChild('tableScrollRef', { read: ElementRef, static: false }) tableScrollRef: ElementRef;
  @ViewChild(MatTable) table: MatTable<any>;

  private unSub$: Subject<void> = new Subject<void>();

  public selection = new SelectionModel(true, []);

  public insertionOrdersList = new MatTableDataSource([]);
  public paginationSizes = [10];

  public selectedSort: MatSort = {
    active: "lineItemId",
    direction: "asc"
  } as MatSort

  public pagination: Pagination = {} as Pagination;

  public isDialogOpenend = false;
  public scrollContent: number;
  public hasHorizontalScrollbar = false;
  public isLoadingData = false;
  public searchFilterApplied = false;
  public searchFiltersPayload: InsertionOrderFilters = {} as InsertionOrderFilters;
  public isAllCheckboxSelected = false;
  public excludedItemsIds: string[] = [];
  public userPermission: UserActionPermission;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private matSnackBar: MatSnackBar,
    private ngZone: NgZone,
    private snackbarService: SnackbarService,
    public dialog: MatDialog,
    public customizeColumnService: CustomizeColumnService,
    public cdRef: ChangeDetectorRef,
    private insertionOrdersService: InsertionOrdersService,
    private contractLineItemsService: ContractLineItemsService,
    public dialogRef: MatDialogRef<InsertionOrdersListComponent>,
    private tabLinkHandler: TabLinkHandler,
    @Inject(MAT_DIALOG_DATA) public injectedData: any,
    private auth: AuthenticationService
    ) {
  }

  ngOnInit(): void {
    if (this.injectedData?.dialogOpenened) {
      this.isDialogOpenend = true;
      this.insertionOrdersList.data = this.injectedData?.listData;
      this.selectedSort = this.injectedData?.sortValue;
      this.pagination = this.injectedData?.paginationValue;
      this.searchFiltersPayload = this.injectedData?.searchFilter;
      this.isAllCheckboxSelected = this.injectedData?.isAllCheckboxStatus;
      this.excludedItemsIds = this.injectedData?.excludeItems;
      this.searchFilterApplied = this.injectedData?.searchFilterApplied;
    } else {
      this.insertionOrdersList = new MatTableDataSource([]);
    }
    this.reSize();
    this.initializeCustomizeColumn();
     // Commented based on IMXUIPRD-3940-Default screen should be empty on out of contracts modules.
    //this.getInsertionOrders(false);
    this.userPermission = this.auth.getUserPermission(UserRole.CONTRACT);
  }

  /**
   * @description
   * method to initialize column
   */
  public initializeCustomizeColumn() {
    const defaultColumns = [
      { displayname: 'Client Code', name: 'clientCode' },
      { displayname: 'Product Code', name: 'productCode' },
      { displayname: 'Estimate #', name: 'estimateId' },
      { displayname: 'PUB ID', name: 'pubId' },
      { displayname: 'Client Name', name: 'clientName' },
      { displayname: 'Product Name', name: 'productName' },
      { displayname: 'Estimate Name', name: 'estimateName' },
      { displayname: 'Vendor Name', name: 'vendorName' },
      { displayname: 'Media Description', name: 'mediaDescription' },
      { displayname: 'Insertion Date', name: 'insertionDate' },
      { displayname: 'Net Cost', name: 'netCost' },
      { displayname: 'Do not Export', name: 'doNotExport' },
      { displayname: 'Delete File', name: 'deletedStatus' },
      { displayname: 'Exported', name: 'exportedStatus' },
      { displayname: 'Exported Date', name: 'exportedAt' },
      { displayname: 'Revised Date', name: 'revisedAt' },
      { displayname: 'Acct Dept', name: 'accountingDept' },
    ];

    this.customizeColumnService.init({
      defaultColumns: defaultColumns,
      sortableColumns: Helper.deepClone(defaultColumns),
      cachedKeyName: CustomColumnsArea.CONTRACT_INSERTION_ORDERS_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, "lineItemCheckbox", "lineItemId");
        this.customizeColumnService.displayedColumns.splice(2, 0, 'action');
        this.cdRef.markForCheck();
      }
    });
  }

  /**
   * @description
   * method to call insertion orders API
   */
  private getInsertionOrders(hideloader = true) {
    this.isLoadingData = true;

    this.searchFilterApplied = !!(this.searchFiltersPayload?.filter && !!Object.keys(this.searchFiltersPayload?.filter).length);
    const fieldSet = ["lineItemId", "clientCode", "productCode", "estimateNumber", "vendor", "clientName",
      "productName", "estimateName", "mediaDescription", "insertionDate", "netCost", "doNotExport",
      "deletedStatus", "deletedAt", "exportedStatus", "exportedAt", "revisedAt", "accountingDept","lineItem"
    ];
    
    // get pagination and sorting from local if any
    const sessionFilter = this.insertionOrdersService.getInsertionOrderListLocal();
    if(sessionFilter?.iOrderPagination){
      this.pagination = sessionFilter?.iOrderPagination;
    }
    if(sessionFilter?.iOrderSorting?.active){
      this.selectedSort = sessionFilter?.iOrderSorting;
    }

    const sortDup = Helper.deepClone(this.selectedSort);
    const paginationDup = Helper.deepClone(this.pagination);

    this.insertionOrdersService.getInsertionOrders(
      this.searchFiltersPayload,
      sortDup,
      paginationDup,
      fieldSet,
      hideloader
    ).pipe(takeUntil(this.unSub$))
      .subscribe((res: InsertionOrdersResponse) => {
        this.isLoadingData = false;
        if (res?.results) {
          this.insertionOrdersList.data = res?.results;
          this.pagination = res?.pagination;
          this.pagination.pageSize = res?.pagination?.perPage;
          this.setPaginationSizes(this.pagination?.found);
          (this.isAllCheckboxSelected) ?
            this.insertionOrdersList.data.forEach((item) => {
              if (this.excludedItemsIds.lastIndexOf(item?._id) < 0)
                this.selection.select(item?._id);
            }) : '';
          this.ngZone?.onMicrotaskEmpty.pipe(take(3)).subscribe(() => this.table?.updateStickyColumnStyles());
          this.cdRef.markForCheck();
        }
      });
  }

  /**
   * @description
   * method used to set pagination sizes based on MAX results
   */
  public setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
    } else {
      this.paginationSizes = [10];
    }
  }

  /**
   * @description
   * page change event call back from paginator
   */
  public pageChangeEvent(event: PageEvent) {
    this.pagination.page = event.pageIndex + 1;
    this.pagination.perPage = event.pageSize
    this.insertionOrdersService.setInsertionOrderListLocal('iOrderPagination', this.pagination);
    this.getInsertionOrders();
  }

  /**
   * @description
   * sort change event call back from Mat Sort
   */
  public sortChange(event) {
    this.selectedSort = event;
    this.insertionOrdersService.setInsertionOrderListLocal('iOrderSorting', this.selectedSort);
    this.getInsertionOrders();
  }

  /**
   * @description
   * event call back from customize column service
   */
  public customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.customizeColumnService.displayedColumns.splice(0, 0, "lineItemCheckbox", "lineItemId");
      this.customizeColumnService.displayedColumns.splice(2, 0, 'action');
      this.ngZone?.onMicrotaskEmpty.pipe(take(3)).subscribe(() => this.table?.updateStickyColumnStyles());
      this.cdRef.detectChanges();
    });
  }

  /**
   * @description
   * method used to set content sizes
   */
  public reSize() {
    this.scrollContent = window.innerHeight - 460;
    setTimeout(() => {
      this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
      this.cdRef.detectChanges();
    }, 200);
    this.ngZone?.onMicrotaskEmpty.pipe(take(3)).subscribe(() => this.table?.updateStickyColumnStyles());
  }

  /**
   * @description
   * event call back from checkbox change
   */
  public toggleCheckbox(id) {
    this.selection.toggle(id);
    if (!this.selection?.isSelected(id) && this.isAllCheckboxSelected) {
      this.excludedItemsIds.push(id);
    }
    else if (this.selection?.isSelected(id) && this.isAllCheckboxSelected) {
      this.excludedItemsIds.splice(this.excludedItemsIds.lastIndexOf(id), 1);
    }
  }

  /**
   * @description
   * event call back from select all checkbox change
   */
  public masterToggle() {
    if (this.isAllCheckboxSelected && !this.excludedItemsIds.length) {
      this.selection.clear();
      this.isAllCheckboxSelected = false;
    }
    else {
      this.isAllCheckboxSelected = true;
      this.insertionOrdersList.data.forEach(row => this.selection.select(row?._id));
    }
    this.excludedItemsIds = [];
  }

  /**
   * @description
   * emit event from IO search component
   */
  public searchActionEvent(event) {
    this.pagination.page = 1;
    this.isAllCheckboxSelected = false;
    this.selection.clear();
    this.excludedItemsIds = [];

    if (event.type === "SEARCH") {
      this.searchFiltersPayload = event?.payload;
      setTimeout(() => {
        document.getElementById('contracts-management__SCROLLABLE').scrollTop = document.getElementById('insertion-orders-list').offsetTop + 50;
      }, 100)
      this.getInsertionOrders();
    } else {
      this.searchFilterApplied = false;
      this.searchFiltersPayload = {} as InsertionOrderFilters;
      // this.getInsertionOrders();
      // Rest the tablelist data.
      this.insertionOrdersList.data = [];
      this.pagination = {} as Pagination;
    }
  }

  /**
   * @description
   * methos used to call delete API
   */
  deleteInsertionOrder(element) {
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
          this.insertionOrdersService.deleteInsertionOrder(element._id)
        ),
        filter((res: any) => res?.status === 'success')
      )
      .subscribe((res) => {
        this.snackbarService.showsAlertMessage(res?.message);
        this.getInsertionOrders();
      });
  }

  /**
   * @description
   * methos used to call export API --csv
   */
  public exportCSV() {
    let filterPayload: InsertionOrderFilters = Helper.deepClone(this.searchFiltersPayload);
    !filterPayload?.filter ? filterPayload.filter = {} as IOFilter : '';

    if (this.isAllCheckboxSelected && this.excludedItemsIds.length) {
      filterPayload.filter.excludedIds = this.excludedItemsIds;
    }
    else if (!this.isAllCheckboxSelected && this.selection.selected) {
      filterPayload.filter.ids = Helper.removeDuplicate(this.selection.selected);
    }

    const sortDup = Helper.deepClone(this.selectedSort);

    this.insertionOrdersService.exportInsertionOrders(
      filterPayload,
      sortDup,
    )
      .subscribe((response: any) => {
        const contentType = response['headers'].get('content-type');
        const contentDispose = response.headers.get('Content-Disposition');
        const matches = contentDispose?.split(';')[1].trim().split('=')[1];
        if (contentType.includes('text/csv')) {
          let filename = matches && matches.length > 1 ? matches : 'Insertion_Orders.csv';
          filename = filename.slice(1, filename.length-1);
          saveAs(response.body, filename);
        }
      });

  }

  /**
   * @description
   * method to init full screen view
   */
   public enterFullScreen() {
    this.dialog.open(
      InsertionOrdersListComponent,
      {
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'insertion-list-dialog-fullscreen',
        autoFocus: false,
        disableClose: true,
        data: {
          dialogOpenened: true,
          listData: this.insertionOrdersList.data,
          sortValue: this.selectedSort,
          paginationValue: this.pagination,
          searchFilter: this.searchFiltersPayload,
          excludeItems: this.excludedItemsIds,
          isAllCheckboxStatus: this.isAllCheckboxSelected,
          searchFilterApplied: this.searchFilterApplied,
        },
      }).
      afterClosed()
      .subscribe((res) => {
        if(!res) return
        this.insertionOrdersList.data = res?.listData;
        this.selectedSort = res?.sortValue;
        this.pagination = res?.paginationValue;
        this.isDialogOpenend = res?.dialogOpenened;
        this.isAllCheckboxSelected = res?.isAllCheckboxStatus;
        this.excludedItemsIds = res?.excludeItems;
        if (this.insertionOrdersList.data.length > 0) {
          this.getInsertionOrders();
        }
      });
  }

  /**
   * @description
   * method to exit from full screen view
   */
  public exitFullScreen() {
    this.dialogRef.close({
      dialogOpenened: false,
      listData: this.insertionOrdersList.data,
      sortValue: this.selectedSort,
      paginationValue: this.pagination,
      searchFilter: this.searchFiltersPayload,
      excludeItems: this.excludedItemsIds,
      isAllCheckboxStatus: this.isAllCheckboxSelected
    });
  }

  /**
   * @description
   * method to get line item details by line item id
   *
   */
  public initLineItemView(element, newTab = false) {
    const splitId = element?.lineItemId.toString().split('-');
    this.contractLineItemsService
      .getLineItemByIineItemNo(element?.lineItem?.contract?._id, splitId[splitId.length - 1])
      .pipe(takeUntil(this.unSub$))
      .subscribe((res) => {
        if (res && res.results?.length) {
          if (newTab) {
            this.tabLinkHandler.open(TabLinkType.LINEITEM, element?.lineItem?.contract?._id, res.results[0]._id);
          } else {
            this.getLineItembyId(element?.lineItem?.contract?._id, res.results[0]._id, res?.pagination);
          }
        }
        else if (res && !res.results?.length) {
          this.snackbarService.showsAlertMessage('Line Item not found');
        }
      });
  }

   /**
   * @description
   * method to get line item details by line item id
   * @param contractId contract id
   * @param lineItemId line item id
   */
  private getLineItembyId(contractId, lineItemId, pagination) {
    let paginate = pagination?.found ? pagination : {
      total: 2,
      found: 2,
      page: 1,
      perPage: 1,
      pageSize: 1
    };
    paginate.perPage = 1;
    paginate.pageSize = 1;
    paginate.found = paginate.total;
      this.contractLineItemsService
      .getLineItemDetails(contractId, lineItemId)
      .pipe(takeUntil(this.unSub$))
      .subscribe((res) => {
        this.openLineItemDialog(res, false, paginate);
      });
    }

  /**
   * @description
   * method to open line Item dialog
   *
   */
  public openLineItemDialog(lineItemData?: any, isForDuplicate = false, pagination: any = {}) {
    const dialogRef = this.dialog.open(AddLineItemDialogComponent, {
      height: '98%',
      width: '1279px',
      panelClass: 'add-line-items-modal',
      disableClose: true,
      autoFocus: false,
      data: {
        fullScreenMode: true,
        contract: lineItemData.contract,
        lineItemData,
        isForDuplicate,
        clientId: lineItemData?.contract?.client?.id,
        pagination: pagination,
        sort: { active: 'lineItemId', direction: 'asc' },
        isOutOfContracts: true,
        userPermission: this.auth.getUserPermission(UserRole.CONTRACT),
        module: UserRole.CONTRACT
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      (result) ? this.getInsertionOrders() : '';
    });
  }

  public ngOnDestroy(): void {
    this.unSub$.next();
    this.unSub$.complete();
  }

}
