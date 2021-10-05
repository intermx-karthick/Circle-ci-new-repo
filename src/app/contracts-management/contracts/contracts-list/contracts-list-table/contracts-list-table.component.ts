import {
  ChangeDetectorRef,
  Component, ElementRef,
  EventEmitter, Inject, Input, NgZone, OnChanges,
  OnInit, Output, SimpleChanges,
  ViewChild
} from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatPaginator, MatPaginatorIntl, PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import { MatTable, MatTableDataSource } from "@angular/material/table";
import { Router } from "@angular/router";
import { CustomColumnsArea } from "@interTypes/enums";
import { UserActionPermission, UserRole } from "@interTypes/user-permission";
import { IMXMatPaginator } from "@shared/common-function";

import { CustomizeColumnService } from "@shared/components/customize-column-v3/customize-column.service";
import { AuthenticationService } from "@shared/services";
import { Helper } from "app/classes";
import { Contract, ContractsPagination, ContractsTableItem, DisplayedColumns } from "app/contracts-management/models";
import { ContractsTableData, ContractsTableModalData } from "app/contracts-management/models/contracts-table-data.model";
import { Subject } from "rxjs";
import { take } from "rxjs/operators";

@Component({
  selector: 'app-contracts-list-table',
  templateUrl: 'contracts-list-table.component.html',
  styleUrls: ['contracts-list-table.component.less'],
  providers: [
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator },
  ]
})
export class ContractsListTableComponent implements OnInit, OnChanges {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('tableScrollRef', { read: ElementRef, static: false }) tableScrollRef: ElementRef;
  @ViewChild(MatTable) table: MatTable<any>;

  displayedColumns: string[];

  customizeColumnService: CustomizeColumnService
  dataSource;
  scrollContent: number;
  hasHorizontalScrollbar = false;
  pageEvent = false;

  paginationSizes = [50];
  tableElements: ContractsTableItem[] = [];
  contractsPagination: ContractsPagination = {};
  isDialogOpenend = false;
  сontractsTableData: ContractsTableData;
  @Input() sort: Sort = {
    active: "lastModified",
    direction: "desc"
  };

  modalData: Subject<TableExpandData> = new Subject<TableExpandData>();

  userPermission: UserActionPermission;

  @Input() set tableData(value: ContractsTableData) {
    if(!value || !value.contractTableItems) {
      return;
    }
    this.сontractsTableData = {...value, contractTableItems : [...value.contractTableItems]};
    this.modalData.next({ rows: this.сontractsTableData, sort: this.sort});
    this._init(this.сontractsTableData);
  }

  @Input() set pagination(value: ContractsPagination) {
    if(!value) {
      return;
    }

    this.contractsPagination = value;
  }

  @Input() searchFilterApplied: boolean;
  @Input() isLoadingContracts = false;

  @Output() paginationChanged: EventEmitter<ContractsPagination> = new EventEmitter<ContractsPagination>();
  @Output() sortChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() defaultCustomizedColumn: EventEmitter<any> = new EventEmitter<any>();

  @Output() listActionDuplicate: EventEmitter<Contract> = new EventEmitter<Contract>();
  @Output() listActionDelete: EventEmitter<Contract> = new EventEmitter<Contract>();

  @Input() isSearchInValid = false;
  @Output() refresh: EventEmitter<any> = new EventEmitter<any>();

  private defaultColumns: DisplayedColumns[] = [
    { displayname: "Client", name: "clientName" },
    { displayname: "Contract Name", name: "contractName" },
    { displayname: "Total Net", name: "totalNet" },
    { displayname: "Start Date", name: "startDate" },
    { displayname: "End Date", name: "endDate" },
    { displayname: "Contract Status", name: "contractStatus" },
    { displayname: "Office", name: "office" },
    { displayname: "Buyer", name: "buyer" },
    { displayname: "Date Created", name: "dateCreated" },
    { displayname: "Last Modified", name: "lastModified" },
  ];

  private availableColumn: DisplayedColumns[] = [
    { displayname: "Client", name: "clientName" },
    { displayname: "Contract Name", name: "contractName" },
    { displayname: "Total Net", name: "totalNet" },
    { displayname: "Start Date", name: "startDate" },
    { displayname: "End Date", name: "endDate" },
    { displayname: "Contract Status", name: "contractStatus" },
    { displayname: "Office", name: "office" },
    { displayname: "Buyer", name: "buyer" },
    { displayname: "Date Created", name: "dateCreated" },
    { displayname: "Last Modified", name: "lastModified" },
    { displayname: "Total Gross", name: "totalGross" },
    { displayname: "Total Tax", name: "totalTax" },
    { displayname: "Total Fee", name: "totalFee" },
    { displayname: "Total Client Net", name: "totalClientNet" },
  ];

  constructor(public dialog: MatDialog,
    public dialogRef: MatDialogRef<ContractsListTableComponent>,
    public cdRef: ChangeDetectorRef,
    private router: Router,
    private auth: AuthenticationService,
    private ngZone: NgZone,// This is used to update the sticky column position
    @Inject(MAT_DIALOG_DATA) public data: any) {
      if(!!data && data.tableData) {
        data.tableData.subscribe((tableData: TableExpandData) => {
          this._init(tableData.rows);
          this.contractsPagination = data.pagination;
          if(tableData.sort) {
            this.sort.active = tableData.sort.active,
            this.sort.direction = tableData.sort.direction
          }

        })

      }
      this.userPermission = this.auth.getUserPermission(UserRole.CONTRACT);
    }

  ngOnInit() {
    this.customizeColumnService = new CustomizeColumnService(this.dialog);

    this.reSize();

    //Emit the initial default customized column for csv download
    this.defaultCustomizedColumn.emit(this.defaultColumns);

    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.availableColumn),
      cachedKeyName: CustomColumnsArea.CONTRACTS_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, "contractId"); // sticky column
        this.customizeColumnService.displayedColumns.splice(1, 0, "action"); // sticky column

        this.cdRef.markForCheck();
      }
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes?.isLoadingContracts && !changes?.isLoadingContracts?.currentValue) {
      const matTable= document.getElementById('vendor-table-scroll');
      if(matTable){
        matTable.scrollTop = 0;
      }
    }
  }

  enterFullScreen() {
    let config: MatDialogConfig = {
      id:'fullscreen-contracts-table',
      disableClose: true,
      width: '90vw',
      closeOnNavigation: true,
      panelClass: 'vendor-list-dialog-fullscreen',
      data: {
        pagination: this.contractsPagination,
        sort: this.sort,
        fullScreenMode: true,
        tableData: this.modalData
      }
    };

    this.isDialogOpenend = true;
    this.dialogRef = this.dialog.open(ContractsListTableComponent, config);

    this.dialogRef.componentInstance.paginationChanged.subscribe((contractsPagination: ContractsPagination) => {
        this.paginationChanged.emit(contractsPagination);
      })

    this.dialogRef.componentInstance.sortChanged.subscribe((sort: Sort) => {
      this.sort = sort;
      this.sortChanged.emit(sort);
    });

    this.dialogRef.componentInstance.listActionDuplicate.subscribe(element => {
      this.listActionDuplicate.emit(element);
    });

    this.dialogRef.componentInstance.listActionDelete.subscribe(element => {
      this.listActionDelete.emit(element);
    })

    this.modalData.next({ rows: this.сontractsTableData, sort: this.sort});
  }

  exitFullScreen() {
    this.dialogRef.close();
    this.isDialogOpenend = false;
  }

  customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.customizeColumnService.displayedColumns.splice(0, 0, "contractId"); // sticky column
      this.customizeColumnService.displayedColumns.splice(1, 0, "action"); // sticky column
      this.reSize();
      this.cdRef.detectChanges();
    });
  }

  openContractDetails(id: string) {
    if (!!this.dialogRef?.componentInstance) {
      this.dialogRef.close();
    }
    this.router.navigateByUrl(`/contracts-management/contracts/${id}`);
  }

  reSize() {
    this.scrollContent = window.innerHeight - 420;

    setTimeout(() => {
      this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
      this.cdRef.detectChanges();
    }, 200);
    this.ngZone?.onMicrotaskEmpty.pipe(take(3)).subscribe(() => this.table?.updateStickyColumnStyles());
  }

  getPageEvent(event: PageEvent) {
    this.pageEvent = true;
    this.contractsPagination.page = event.pageIndex + 1;
    this.contractsPagination.perPage = event.pageSize;

    this.paginationChanged.emit(this.contractsPagination);
    //this.loadVendors();
  }

  refreshLineItems(){
    this.refresh.emit();
  }

  public onSorting(sort: Sort) {
    this.sort = sort;
    this.sortChanged.emit(sort);
  }

  private _setPaginationSizes(total: number) {
    if (total > 100) {
      this.paginationSizes = [50, 100, 150];
    } else if (total > 50) {
      this.paginationSizes = [50, 100];
      if (!this.pageEvent && this.isDialogOpenend) {
        this.contractsPagination.perPage = 100;
      }
      this.pageEvent = false;
    } else {
      this.paginationSizes = [50];
      if (this.isDialogOpenend) {
        this.contractsPagination.perPage = 50;
      }
    }
  }

  private _init(сontractsTableData: ContractsTableData) {
    this.contractsPagination.total = сontractsTableData.total;
    this.contractsPagination.found = сontractsTableData.found;

    this.tableElements = [...сontractsTableData.contractTableItems];
    this._setPaginationSizes(this.contractsPagination.total);
    this.dataSource = new MatTableDataSource<ContractsTableItem>(сontractsTableData.contractTableItems);
  }
}

interface TableExpandData {
  rows: ContractsTableData,
  sort: Sort
}
