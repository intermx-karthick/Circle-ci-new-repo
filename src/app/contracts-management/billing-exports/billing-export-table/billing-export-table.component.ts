import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { Sort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { CustomColumnsArea } from "@interTypes/enums";

import { CustomizeColumnService } from "@shared/components/customize-column-v3/customize-column.service";
import { Helper } from "app/classes";
import { ContractsMapper } from "app/contracts-management/contracts/contracts-shared/helpers/contracts.mapper";
import { ContractLineItem, ContractLineItemsApiResponce, ContractsLineItemsTable } from "app/contracts-management/models/contract-line-item.model";
import { Pagination } from "app/contracts-management/models/pagination.model";
import { ContractLineItemsService } from "app/contracts-management/services/contract-line-items.service";
import { Subject } from "rxjs";
import { IMXMatPaginator } from '@shared/common-function';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { AuthenticationService, SnackbarService } from '@shared/services';
import { BillingExportApiResponce, BillingExportItemsTable } from "app/contracts-management/models/billing-export.model";
import { SelectionModel } from "@angular/cdk/collections";
import { NewConfirmationDialogComponent } from "@shared/components/new-confirmation-dialog/new-confirmation-dialog.component";
import { TabLinkHandler, TabLinkType } from "@shared/services/tab-link-handler";
import { AddLineItemDialogComponent } from "app/contracts-management/contracts/contracts-list/contract-details/core-details/add-line-item-dialog/add-line-item-dialog.component";
import { UserRole } from "@interTypes/user-permission";

@Component({
  selector: 'app-billing-export-table',
  templateUrl: './billing-export-table.component.html',
  styleUrls: ['./billing-export-table.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator }
  ]
})
export class BillingExportTableComponent implements OnInit, AfterViewInit , OnDestroy{
  public selection = new SelectionModel(true, []);
  public isAllCheckboxSelected = false;
  public excludedItemsIds: string[] = [];
  displayedColumns: string[];

  customizeColumnService: CustomizeColumnService
  dataSource;

  tablePagination: Pagination;
  sort: Sort;

  tableData: BillingExportItemsTable[];
  private expandedData: Subject<TableExpandData> = new Subject<TableExpandData>()

  private defaultColumns: DisplayedColumns[] = [
    { displayname: "Client Code", name: "clientCode" },
    { displayname: "Product Code", name: "productCode" },
    { displayname: "Estimate #", name: "estimateNumber" },
    { displayname: "PUB ID", name: "pubId" },
    { displayname: "Client Name", name: "clientName" },
    { displayname: "Product Name", name: "productName" },
    { displayname: "Estimate Name", name: "estimateName" },
    { displayname: "Vendor Name", name: "vendor" },
    { displayname: "Media Description", name: "mediaDescription" },
    { displayname: "Insertion Date", name: "insertionDate" },
    { displayname: "Net Cost", name: "netCost" },
    { displayname: "Do Not Export", name: "doNotExport" },
    { displayname: "Delete File", name: "deletedStatus" },
    { displayname: "Exported", name: "exportedStatus" },
    { displayname: "Exported Date", name: "exportedAt" },
    { displayname: "Revised Date", name: "revisedAt" },
    { displayname: "Acct Dept", name: "accountingDept" },
  ];

  @Input() contractId: string;
  @Input() searchFilterApplied = false;
  @Input() isLoading = false;

  @Input() set tableRecords(value: BillingExportApiResponce) {
    if(!value) {
      return;
    }
    
    if(this.dialogRef?.componentInstance?.isAllCheckboxSelected !== undefined){
      this.isAllCheckboxSelected = this.dialogRef.componentInstance.isAllCheckboxSelected;
    }   

    this.tablePagination = value.pagination;
    this.setPaginationSizes(this.tablePagination?.found);
    this.tableData = ContractsMapper.toBillingExportTable(value?.results);
    if(this.dialogRef?.componentInstance){
      (this.isAllCheckboxSelected) ?
    this.tableData.forEach((item) => {
      if (this.excludedItemsIds.lastIndexOf(item?.IODateId) < 0)
      this.dialogRef?.componentInstance.selection.select(item?.IODateId);
    }) : '';
    }else{
      (this.isAllCheckboxSelected) ?
      this.tableData.forEach((item) => {
        if (this.excludedItemsIds.lastIndexOf(item?.IODateId) < 0)
          this.selection.select(item?.IODateId);
      }) : '';
    }

    this.cdRef.markForCheck();
    this.expandedData.next({ tableData: this.tableData, pagination: this.tablePagination, sort: this.sort })
    this.dataSource = new MatTableDataSource<BillingExportItemsTable>(this.tableData);
    
   // this.dataSource.paginator = this.paginator;
  }

  @Input() set sorting(value: Sort) {
    if (!value) {
      return;
    }

    this.sort = value;
    this.expandedData.next({ tableData: this.tableData, pagination: this.tablePagination, sort: this.sort })
  }

  @Output() paginationChanged: EventEmitter<Pagination> = new EventEmitter<Pagination>();
  @Output() sortingChanged: EventEmitter<Sort> = new EventEmitter<Sort>();
  @Output() lineItemEdit: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteLineItem: EventEmitter<any> = new EventEmitter<any>();
  @Output() billingReExportUpdateEmit: EventEmitter<any> = new EventEmitter<any>();
  isLoadingLineItems: boolean = false;
  @Output() exportIOsAccountingEmit: EventEmitter<any> = new EventEmitter<any>();
  @Output() billingMarkExportEmit: EventEmitter<any> = new EventEmitter<any>();
  @Input() resetSelection$: Subject<any> = new Subject<any>();

  private unSubscribe$ = new Subject();

  public paginationSizes = [10];
  public TabLinkType = TabLinkType;
  constructor(public dialog: MatDialog,
    public dialogRef: MatDialogRef<BillingExportTableComponent>,
    public cdRef: ChangeDetectorRef,
    private router: Router,
    private activateRoute: ActivatedRoute,
    private contractLineItemsService: ContractLineItemsService,
    public tabLinkHandler: TabLinkHandler,
    private auth: AuthenticationService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      if(data && data.tableData) {
        data.tableData.subscribe((value: TableExpandData) => {
          this.tablePagination = value.pagination;
          this.sort = value.sort;
          this.setPaginationSizes(value.pagination.found);

          this.tableData = value.tableData;
          this.dataSource = new MatTableDataSource<BillingExportItemsTable>(this.tableData);
          this.cdRef.markForCheck();
        })
      }
      if(data?.selectedData){
        this.isAllCheckboxSelected = data?.selectedData.isAllCheckboxSelected;
        this.excludedItemsIds = data?.selectedData.excludedItemsIds;
        this.selection.select(...data?.selectedData.selection);
      }
    this.searchFilterApplied = this.data?.searchFilterApplied;
    }

  ngOnInit() {
    this.displayedColumns = this.defaultColumns.map(column => column.name);
    this.customizeColumnService = new CustomizeColumnService(this.dialog);
    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.defaultColumns),
      cachedKeyName: CustomColumnsArea.BILLING_EXPORT_ITEMS_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, "lineItemCheckbox", "lineItemId"); // sticky column
        this.customizeColumnService.displayedColumns.splice(2, 0, "action"); // sticky column
        this.cdRef.markForCheck();
      }
    });
    this.resetSelection$.pipe(takeUntil(this.unSubscribe$)).subscribe((option) => {
      if(option?.reset || option?.newSearch){
        this.clearAll();
      }
    });
  }

  ngOnDestroy() {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

 /**
 * This function used to clear the selection | Examlpe reset & new search
 */
  public clearAll(){
    this.selection.clear();
    this.isAllCheckboxSelected = false;
    this.excludedItemsIds = [];
  }

  onSorting(sort: Sort) {
    this.sort = sort;

    this.sortingChanged.emit(this.sort);
  }

  getPageEvent(event: PageEvent) {
    this.tablePagination.page = event.pageIndex + 1;
    this.tablePagination.perPage = event.pageSize;

    this.paginationChanged.emit(this.tablePagination);
  }

  enterFullScreen() {
    const selectedData = {
      isAllCheckboxSelected: this.isAllCheckboxSelected,
      selection: this.selection?.selected,
      excludedItemsIds: this.excludedItemsIds
    };
    let config: MatDialogConfig = {
      width: '100%',
      panelClass: 'billing-export-dialog-fullscreen',
      autoFocus: false,
      disableClose:true,
      data: {
        fullScreenMode: true,
        tableData: this.expandedData,
        selectedData: selectedData,
        searchFilterApplied: this.searchFilterApplied,
      }
    };

    this.dialogRef = this.dialog.open(BillingExportTableComponent, config);

    this.dialogRef.componentInstance.sortingChanged.subscribe((sort: Sort) => {
      this.sort = sort;
      this.sortingChanged.emit(this.sort)
    });

    this.dialogRef.componentInstance.paginationChanged.subscribe((pagination: Pagination) => {
      this.tablePagination = pagination;
      this.paginationChanged.emit(this.tablePagination)
    });

    this.dialogRef.componentInstance.billingReExportUpdateEmit.subscribe(data => {
      this.billingReExportUpdateEmit.emit(data);
    });

    this.dialogRef.componentInstance.exportIOsAccountingEmit.subscribe(data => {
      this.exportIOsAccountingEmit.emit(data);
    });

    this.dialogRef.componentInstance.billingMarkExportEmit.subscribe(data => {
      this.billingMarkExportEmit.emit(data);
    });


    this.dialogRef.afterClosed().subscribe(data=>{
      setTimeout(() => {
        if(data?.data){
          const selectedData = data?.data;
          this.selection.clear();
          if(selectedData.isAllCheckboxSelected !== undefined){
          this.isAllCheckboxSelected = selectedData.isAllCheckboxSelected;        }
          this.excludedItemsIds = selectedData?.excludedItemsIds;
          this.selection.select(...selectedData?.selection);
          this.cdRef.markForCheck();
        }
      }, 100);      
    });


    this.expandedData.next({
      pagination: this.tablePagination,
      sort: this.sort,
      tableData: this.tableData
    })
  }

  exitFullScreen() {
    const data = {
      isAllCheckboxSelected: this.isAllCheckboxSelected,
      selection: this.selection?.selected,
      excludedItemsIds: this.excludedItemsIds,
      pagination: this.tablePagination,
      sort: this.sort,
    };
    this.dialogRef.close({data});
  }

  customizeColumn() {
    this.customizeColumnService.customizeColumn(()=>{
      this.customizeColumnService.displayedColumns.splice(0, 0, "lineItemCheckbox", "lineItemId"); // sticky column
      this.customizeColumnService.displayedColumns.splice(2, 0, "action"); 
      this.cdRef.detectChanges();
    });
  }

  /**
   * @description
   * event call back from checkbox change
   */
   public toggleCheckbox(IODateId) {
    this.selection.toggle(IODateId);
    if (!this.selection?.isSelected(IODateId) && this.isAllCheckboxSelected) {
      this.excludedItemsIds.push(IODateId);
    }
    else if (this.selection?.isSelected(IODateId) && this.isAllCheckboxSelected) {
      this.excludedItemsIds.splice(this.excludedItemsIds.lastIndexOf(IODateId), 1);
    }

    if(this.excludedItemsIds?.length === this.tablePagination?.found) {
      this.clearAll();
    }
    if(!this.isAllCheckboxSelected && this.selection?.selected.length === this.tablePagination?.found){
      this.isAllCheckboxSelected = true;
    }
  }
  /**
   * @description
   * event call back from select all checkbox change
   */
  public masterToggle() {
    if(this.dataSource?.data?.length > 0) {
      if (this.isAllCheckboxSelected && !this.excludedItemsIds.length) {
        this.selection.clear();
        this.isAllCheckboxSelected = false;
        if(this.dialogRef?.componentInstance){
          this.dialogRef?.componentInstance.selection.clear();
        }
      }
      else {
        this.isAllCheckboxSelected = true;
        this.dataSource.data.forEach(row => this.selection.select(row?.IODateId));
      }
      this.excludedItemsIds = [];
      this.cdRef.markForCheck();
    } 
  }
  
  private setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
    } else {
      this.paginationSizes = [10];
    }
  }

  openContractDetails(element, newTab = false) {
    this.contractLineItemsService
      .getLineItemDetails(this.contractId, element._id)
      .subscribe((res) => {
        if (newTab) {
          this.tabLinkHandler.open(TabLinkType.LINEITEM,res['contract']['_id'],  element._id);
        } else {
          // this.lineItemEdit.emit({data: res});
          this.onEditLineItem(res, false)
        }
      });
  }

  onEditLineItem(data: any, isForDuplicate = false) {
    const splitId = data?.lineItemId.toString().split('-');
    this.contractLineItemsService
      .getLineItemByIineItemNo(data?.contract?._id, splitId[splitId.length - 1])
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
        this.onAddLineItemsDialog(data.contract, data, isForDuplicate, paginate);
      });
  }
  onAddLineItemsDialog(contract, lineItemData?: any, isForDuplicate = false, paginate = {}) {
    const dialogRef = this.dialog.open(AddLineItemDialogComponent, {
      height: '98%',
      width: '1279px',
      panelClass: 'add-line-items-modal',
      disableClose: true,
      autoFocus: false,
      data: {
        fullScreenMode: true,
        contract: contract,
        lineItemData,
        isForDuplicate,
        clientId: contract?.client?._id,
        pagination: paginate,
        sort: Helper.deepClone(this.sort),
        isOutOfContracts: true,
        userPermission: this.auth.getUserPermission(UserRole.BILLING_EXPORTS),
        module: UserRole.BILLING_EXPORTS
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.paginationChanged.emit(this.tablePagination);
        // this.searchBillingExportItems(this.sort, this.pagination);
      }
    });
  }
  ngAfterViewInit() {

  }

  delete(element) {
    this.deleteLineItem.emit(element);
  }

  duplicate(element) {
    this.contractLineItemsService
      .getLineItemDetails(this.contractId, element._id)
      .subscribe((res) => {
        this.lineItemEdit.emit({ data: res, isForDuplicate: true });
      });
  }

  exportCSV() {

  }

  saveAs() {

  }

  /**
   * UnMark as "Do not Export”
   */
  public unMarkDoNotExport(status: boolean) {
    if (!this.selection?.selected.length && !this.isAllCheckboxSelected) {
      this.contractLineItemsService._showsAlertMessage("Please select at least one Line Item");
      return true;
    }

    const dialogueData = {
      title: 'Do Not Export Action Confirmation',
      description: `Please confirm this action to <br> <b> ${status ? 'Mark' : 'Unmark'} as Do Not Export</b>`,
      confirmBtnText: 'CONFIRM',
      cancelBtnText: 'CANCEL',
      displayCancelBtn: true,
      displayIcon: false
    };
    this.dialog.open(NewConfirmationDialogComponent, {
      data: dialogueData,
      width: '340px',
      height: '260px',
      panelClass: ['imx-mat-dialog', 'export-billing-confirm-dialog']
    }).afterClosed().pipe(
      map(res => res?.action)
    ).subscribe(flag => {
      if (flag) {
        const data = {
          isAllCheckboxSelected: this.isAllCheckboxSelected,
          selection: this.selection?.selected,
          excludedItemsIds: this.excludedItemsIds,
          isMarks:status
        };
        this.billingMarkExportEmit.emit(data);
      }
      this.cdRef.markForCheck();
    });
  }

  /**
   * 
   *  Mark as Re-Export
   */

  public onReExportUpdate() {
    if (!this.selection?.selected.length && !this.isAllCheckboxSelected) {
      this.contractLineItemsService._showsAlertMessage("Please select at least one Line Item");
      return true;
    }

    const dialogueData = {
      title: 'Re-Export Action Confirmation',
      description: 'Please confirm this action to <br> <b>Mark as Re-Export</b>',
      confirmBtnText: 'CONFIRM',
      cancelBtnText: 'CANCEL',
      displayCancelBtn: true,
      displayIcon: false
    };
    this.dialog.open(NewConfirmationDialogComponent, {
      data: dialogueData,
      width: '340px',
      height: '260px',
      panelClass: ['imx-mat-dialog', 'export-billing-confirm-dialog']
    }).afterClosed().pipe(
      map(res => res?.action)
    ).subscribe(flag => {
      if (flag) {
        const data = {
          isAllCheckboxSelected: this.isAllCheckboxSelected,
          selection: this.selection?.selected,
          excludedItemsIds: this.excludedItemsIds,
        };
       this.billingReExportUpdateEmit.emit(data);        
      }
      this.cdRef.markForCheck();
    });
  }

  /**
   * 
   *  Export I/Os to Accounting
   */

  public onExportIOsAccounting() {
    if (!this.selection?.selected.length && !this.isAllCheckboxSelected) {
      this.contractLineItemsService._showsAlertMessage("Please select at least one Line Item");
      return true;
    }
    const dialogueData = {
      title: 'I/Os to Accounting Action Confirmation',
      description: 'Please confirm this action to <br> <b>Export I/Os to Accounting</b>',
      confirmBtnText: 'CONFIRM',
      cancelBtnText: 'CANCEL',
      displayCancelBtn: true,
      displayIcon: false
    };
    this.dialog.open(NewConfirmationDialogComponent, {
      data: dialogueData,
      width: '340px',
      height: '260px',
      panelClass: ['imx-mat-dialog', 'export-billing-confirm-dialog']
    }).afterClosed().pipe(
      map(res => res?.action)
    ).subscribe(flag => {
      if (flag) {
        const data = {
          isAllCheckboxSelected: this.isAllCheckboxSelected,
          selection: this.selection?.selected,
          excludedItemsIds: this.excludedItemsIds
        };
        this.exportIOsAccountingEmit.emit(data);
      }
      this.cdRef.markForCheck();
    });
  }

}



export interface BillingExportStatus {
  status: boolean;
  ioIds: string[];
}
export interface DisplayedColumns {
  displayname: string;
  name: string;
}

interface TableExpandData {
  tableData: BillingExportItemsTable[];
  sort: Sort;
  pagination: Pagination;
}
