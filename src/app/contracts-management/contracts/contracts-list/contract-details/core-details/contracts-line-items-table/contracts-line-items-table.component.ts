import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from "@angular/core";
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
import { TabLinkHandler, TabLinkType } from "@shared/services/tab-link-handler";
import { UserActionPermission, UserRole } from "@interTypes/user-permission";
import { AuthenticationService } from "@shared/services";

@Component({
  selector: 'app-contracts-line-items-table',
  templateUrl: 'contracts-line-items-table.component.html',
  styleUrls: ['contracts-line-items-table.component.less'],
  providers: [
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator }
  ]
})
export class ContractsLineItemsTableComponent implements OnInit, AfterViewInit {

  displayedColumns: string[];

  customizeColumnService: CustomizeColumnService
  dataSource = new MatTableDataSource([]);

  tablePagination: Pagination = {
    page: 0,
    perPage: 10
  };
  sort: Sort;

  tableData: ContractsLineItemsTable[];
  @Input() isFromLineItems = false;
  private expandedData: Subject<TableExpandData> = new Subject<TableExpandData>()

  private defaultColumns: DisplayedColumns[] = [
    { displayname: "Type", name: "lineItemType" },
    { displayname: "Status", name: "lineItemStatus" },
    { displayname: "Market", name: "market" },
    { displayname: "Vendor", name: "vendor" },
    { displayname: "Media Type/Offering", name: "mediaType" },
    { displayname: "Client Net", name: "clientNet" },
    { displayname: "Description", name: "description" },
    { displayname: "Start Date", name: "startDate" },
    { displayname: "End Date", name: "endDate" },
    { displayname: "Last Modified", name: "updatedAt" },
  ];
  private sortableColumns: DisplayedColumns[] = [
    { displayname: "Type", name: "lineItemType" },
    { displayname: "Status", name: "lineItemStatus" },
    { displayname: "Market", name: "market" },
    { displayname: "Vendor", name: "vendor" },
    { displayname: "Media Type/Offering", name: "mediaType" },
    { displayname: "Client Net", name: "clientNet" },
    { displayname: "Gross", name: "gross" },
    { displayname: "Tax", name: "tax" },
    { displayname: "Fee", name: "fee" },
    { displayname: "Net", name: "net" },
    { displayname: "Description", name: "description" },
    { displayname: "Start Date", name: "startDate" },
    { displayname: "End Date", name: "endDate" },
    { displayname: "Last Modified", name: "updatedAt" },
  ];



  @Input() isSearchInValid = false;
  @Input() contractId: string;

  @Input() set tableRecords(value: ContractLineItemsApiResponce) {
    if(!value) {
      return;
    }

    if(!this.tablePagination){
      this.tablePagination = {
        page: 1,
        perPage: 10
      }
    }
    this.tablePagination.found = value.pagination?.found;
    this.tablePagination.total = value.pagination?.total;
    this.setPaginationSizes(this.tablePagination?.found);
    this.tableData = ContractsMapper.toLineItemsTable(value.results);
    this.expandedData.next({ tableData: this.tableData, pagination: this.tablePagination, sort: this.sort })
    this.dataSource = new MatTableDataSource<ContractsLineItemsTable>(this.tableData);
   // this.dataSource.paginator = this.paginator;
  }

  @Input() set sorting(value: Sort) {
    if (!value) {
      return;
    }

    this.sort = value;
    this.expandedData.next({ tableData: this.tableData, pagination: this.tablePagination, sort: this.sort })
  }
  @Input() set pagination(value: Pagination) {
    if (!value) {
      return;
    }

    this.tablePagination = value;
    this.expandedData.next({ tableData: this.tableData, pagination: this.tablePagination, sort: this.sort })
  }

  @Output() paginationChanged: EventEmitter<Pagination> = new EventEmitter<Pagination>();
  @Output() sortingChanged: EventEmitter<Sort> = new EventEmitter<Sort>();
  @Output() lineItemEdit: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteLineItem: EventEmitter<any> = new EventEmitter<any>();
  @Output() exportLineItem: EventEmitter<any> = new EventEmitter<any>();
  @Output() refresh: EventEmitter<any> = new EventEmitter<any>();
  @Input() isLoadingLineItems: boolean = false;
  @Input() enableExport = false;
  @Input() searchFilterApplied = false;
  public paginationSizes = [10];
  @Input() userPermission: UserActionPermission;

  constructor(public dialog: MatDialog,
    public dialogRef: MatDialogRef<ContractsLineItemsTableComponent>,
    public cdRef: ChangeDetectorRef,
    private router: Router,
    private activateRoute: ActivatedRoute,
    private contractLineItemsService: ContractLineItemsService,
    private tabLinkHandler: TabLinkHandler,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      if(data && data.tableData) {
        data.tableData.subscribe((value: TableExpandData) => {
          this.userPermission = data.userPermission;
          this.tablePagination = value?.pagination;
          this.sort = value.sort;
          this.setPaginationSizes(value?.pagination?.found);
          this.isFromLineItems = data.isFromLineItems;
          this.searchFilterApplied = data?.searchFilterApplied;
          this.isSearchInValid = data?.isSearchInValid;
          this.tableData = value.tableData;
          this.dataSource = new MatTableDataSource<ContractsLineItemsTable>(this.tableData);
        })
      }
    }

  ngOnInit() {
    this.displayedColumns = this.defaultColumns.map(column => column.name);
    this.customizeColumnService = new CustomizeColumnService(this.dialog);

    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.sortableColumns),
      cachedKeyName: !!this.isFromLineItems ? CustomColumnsArea.OUT_OF_CONTRATCTS_LINE_ITEMS_TABLE :  CustomColumnsArea.CONTRACTS_LINE_ITEMS_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, "lineItemId"); // sticky column
        this.customizeColumnService.displayedColumns.splice(1, 0, "action"); // sticky column
        this.cdRef.markForCheck();
      }
    });
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
    let config: MatDialogConfig = {
      width: '100%',
      panelClass: 'vendor-list-dialog-fullscreen',
      autoFocus: false,
      data: {
        fullScreenMode: true,
        isFromLineItems: this.isFromLineItems,
        tableData: this.expandedData,
        pagination:this.tablePagination,
        searchFilterApplied: this.searchFilterApplied,
        isSearchInValid: this.isSearchInValid,
        userPermission: this.userPermission
      }
    };

    this.dialogRef = this.dialog.open(ContractsLineItemsTableComponent, config);

    this.dialogRef.componentInstance.sortingChanged.subscribe((sort: Sort) => {
      this.sort = sort;
      this.sortingChanged.emit(this.sort)
    })

    this.dialogRef.componentInstance.paginationChanged.subscribe((pagination: Pagination) => {
      this.tablePagination = pagination;
      this.paginationChanged.emit(this.tablePagination)
    })

    this.dialogRef.componentInstance.lineItemEdit.subscribe((res) => {
      this.lineItemEdit.emit({ ...res, isFromDialog: true });
    });

    this.dialogRef.componentInstance.deleteLineItem.subscribe(res => {
      this.deleteLineItem.emit(res);
    })

    this.expandedData.next({
      pagination: this.tablePagination,
      sort: this.sort,
      tableData: this.tableData
    })
  }

  exitFullScreen() {
    this.dialogRef.close();
  }

  customizeColumn() {
    this.customizeColumnService.customizeColumn(()=>{
      this.customizeColumnService.displayedColumns.splice(0, 0, "lineItemId"); // sticky column
      this.customizeColumnService.displayedColumns.splice(1, 0, "action"); // sticky column
      this.cdRef.detectChanges();
    });
  }

  openContractDetails(id: string, newTab = false) {
    this.contractLineItemsService
      .getLineItemDetails(this.contractId, id)
      .subscribe((res) => {
        if (newTab) {
          this.tabLinkHandler.open(TabLinkType.LINEITEM,res['contract']['_id'], id);
        } else {
          this.lineItemEdit.emit({data: res});
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
      .subscribe((res: any) => {
        if (res?.IODates?.length < 2) {
          res.IODates = [];
          res.noOfPeriods = null;
          res.startDate = null;
          res.endDate = null;
        }
        res.IODates.forEach((ioDate: any) => {
          ioDate.exportedStatus = false;
        });
        this.lineItemEdit.emit({ data: res, isForDuplicate: true });
      });
  }

  exportCSV() {
    this.exportLineItem.emit(true);
  }

  saveAs() {
    this.exportLineItem.emit(false);
  }

  refreshLineItems(){
    this.refresh.emit();
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
}

export interface DisplayedColumns {
  displayname: string;
  name: string;
}

interface TableExpandData {
  tableData: ContractsLineItemsTable[];
  sort: Sort;
  pagination: Pagination;
}
