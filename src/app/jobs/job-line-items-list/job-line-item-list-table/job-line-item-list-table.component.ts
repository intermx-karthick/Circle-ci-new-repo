import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SkipSelf
} from '@angular/core';
import { Subject } from 'rxjs';
import { JobResult } from '@interTypes/jobs/jobs-search.response';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { Pagination } from '../../../contracts-management/models/pagination.model';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TabLinkHandler, TabLinkType } from '@shared/services/tab-link-handler';
import { JobsService } from '../../jobs.service';
import { PdfPreviewerService } from '@shared/components/imx-pdf-previewer/pdf-previewer.service';
import { AuthenticationService } from '@shared/services';
import { CustomColumnsArea } from '@interTypes/enums';
import { takeUntil } from 'rxjs/operators';
import { MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { IMXMatPaginator } from '@shared/common-function';
import { JobLineItemsSearchResponse, JobLineItemsSearchResult } from '@interTypes/jobs/job-line-items-search.response';
import { Helper } from '../../../classes';
import { JobLineItemDialogComponent } from 'app/jobs/job-details/job-core-details/job-line-item-dialog/job-line-item-dialog.component';
import { JobDetailsService } from 'app/jobs/services/job-details.service';
import { JobDetails } from 'app/jobs/interfaces';

@Component({
  selector: 'app-job-line-item-list-table',
  templateUrl: './job-line-item-list-table.component.html',
  styleUrls: ['./job-line-item-list-table.component.less'],
  providers: [{ provide: MatPaginatorIntl, useClass: IMXMatPaginator }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobLineItemListTableComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @Input() searchFilterApplied = false;
  @Input() isLoading = false;
  @Input() resetSelection$: Subject<any> = new Subject<any>();
  @Output() customizedColumn = new EventEmitter<any>();
  @Output() paginationChanged: EventEmitter<Pagination> = new EventEmitter<Pagination>();
  @Output() sortingChanged: EventEmitter<Sort> = new EventEmitter<Sort>();
  @Output() editItem: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteItem: EventEmitter<any> = new EventEmitter<any>();
  @Output() duplicateItem: EventEmitter<any> = new EventEmitter<any>();
  // @Output() invoiceItem: EventEmitter<any> = new EventEmitter<any>();
  public excludedItemsIds: string[] = [];
  public displayedColumns: string[];
  public customizeColumnService: CustomizeColumnService;
  public dataSource: MatTableDataSource<JobLineItemsSearchResult>;
  public tablePagination: Pagination;
  public sort: Sort;
  public tableData: JobLineItemsSearchResult[] = [];
  public isLoadingItems = false;
  public paginationSizes = [10];
  public TabLinkType = TabLinkType;
  public userPermission: UserActionPermission;
  public jobDetails: JobDetails = {} as JobDetails;
  private expandedData: Subject<any> = new Subject<any>();
  private defaultColumns: any[] = [
    { displayname: 'Job Name', name: 'name' },
    { displayname: 'Client Name', name: 'clientName' },
    { displayname: 'Date Created', name: 'createdAt' },
    { displayname: 'Start Month', name: 'startMonth' },
    { displayname: 'Start Year', name: 'startYear' },
    { displayname: 'PO Number', name: 'pONumber' },
    { displayname: 'AX Job #', name: 'aXJob' },
    { displayname: 'AX Invoice #', name: 'aXInvoice' },
    { displayname: 'AX Invoice Date', name: 'aXInvoiceDate' },
    { displayname: 'Bill Month', name: 'billMonth' },
    { displayname: 'Bill Year', name: 'billYear' },
    { displayname: 'Net Materials Total', name: 'materials' },
    { displayname: 'Shipping Total', name: 'shippingTotal' },
    { displayname: 'Install Total', name: 'installTotal' },
    { displayname: 'Taxes Total', name: 'taxesTotal' },
    { displayname: 'OIFees Total', name: 'oIFeesTotal' },
    { displayname: 'OI Comm %', name: 'oIComm%' },
    { displayname: 'Total Job Cost', name: 'jobTotal' },
    { displayname: 'Printer', name: 'printer' },
    { displayname: 'MediaType', name: 'mediaType' },
    { displayname: 'Market', name: 'market' },
    { displayname: 'Unit Qty', name: 'unitQty' },
    { displayname: 'Design Qty', name: 'designQty' },
    { displayname: 'Unit Size', name: 'unitSize' },
    { displayname: 'Substrate', name: 'substrate' },
    { displayname: 'Approved', name: 'approved' },
    { displayname: 'Job Billed', name: 'jobBilled' },
    { displayname: 'Cancelled', name: 'cancelled' },
    { displayname: 'PO Sent to Vendor', name: 'poSentToVendor' },
    // { displayname: '4CPs', name: 'noOfColors' }, as from api discussion its need to ignore
    ];
  private availableColumns: any[] = [
    { displayname: 'Job Name', name: 'name' },
    { displayname: 'Client Name', name: 'clientName' },
    { displayname: 'Date Created', name: 'createdAt' },
    { displayname: 'Start Date', name: 'startDate' },
    { displayname: 'Start Month', name: 'startMonth' },
    { displayname: 'Start Year', name: 'startYear' },
    { displayname: 'PO Number', name: 'pONumber' },
    { displayname: 'AX Job #', name: 'aXJob' },
    { displayname: 'AX Invoice #', name: 'aXInvoice' },
    { displayname: 'AX Invoice Date', name: 'aXInvoiceDate' },
    { displayname: 'Bill Month', name: 'billMonth' },
    { displayname: 'Bill Year', name: 'billYear' },
    { displayname: 'Net Materials Total', name: 'materials' },
    { displayname: 'Shipping Total', name: 'shippingTotal' },
    { displayname: 'Install Total', name: 'installTotal' },
    { displayname: 'Taxes Total', name: 'taxesTotal' },
    { displayname: 'OIFees Total', name: 'oIFeesTotal' },
    { displayname: 'OI Comm %', name: 'oIComm%' },
    { displayname: 'Total Job Cost', name: 'jobTotal' },
    { displayname: 'Printer', name: 'printer' },
    { displayname: 'MediaType', name: 'mediaType' },
    { displayname: 'Market', name: 'market' },
    { displayname: 'Unit Qty', name: 'unitQty' },
    { displayname: 'Design Qty', name: 'designQty' },
    { displayname: 'Unit Size', name: 'unitSize' },
    { displayname: 'Substrate', name: 'substrate' },
    { displayname: 'Approved', name: 'approved' },
    { displayname: 'Job Billed', name: 'jobBilled' },
    { displayname: 'Cancelled', name: 'cancelled' },
    { displayname: 'PO Sent to Vendor', name: 'poSentToVendor' },
    { displayname: 'Job Client Notes', name: 'jobClientNotes' },
    { displayname: 'Internal Notes', name: 'jobInternalNotes' },
    { displayname: 'Client Notes (LI)', name: 'clientNotes' },
    { displayname: 'Production Notes (LI)', name: 'productionNotes' },
    { displayname: 'Internal Notes (LI)', name: 'internalNotes' },
    { displayname: 'Vendor Notes (PO only)', name: 'vendorNotes' },
    { displayname: 'JobDates: Delivery', name: 'materialDeliveryDate' },
    { displayname: 'JobDates: Files@Printer', name: 'filesDate' },
    { displayname: 'JobDates: Proofs@Client', name: 'proofsDate' },
    { displayname: 'JobDates: ProofsApproval', name: 'proofsApprovedDate' },
    { displayname: 'JobDates: MaterialsShip', name: 'materialShippingDate' },
    { displayname: 'Ship To Vendor', name: 'vendor' },
    // { displayname: '4CPs', name: 'noOfColors' }, // ignoring as discussed with api team
    { displayname: 'JobDates: No.Periods', name: 'noPeriods' },
    { displayname: 'Terms of Periods', name: 'periodLength' },
    { displayname: 'OI Producer', name: 'oIProducer' },
    { displayname: 'OOH Media Division', name: 'oOHMediaDivision' },
    { displayname: 'OOH Media Office', name: 'oOHMediaOffice' },
    { displayname: 'OOH Media Contact', name: 'oOHMediaContact' },
    { displayname: 'Client Contact', name: 'clientContact' },
    { displayname: 'Agency', name: 'agency' },
    // { displayname: 'Agency Contact', name: 'agencyContact' }, // ignoring as discussed with api team
    { displayname: 'Creative Agency', name: 'creativeAgency' },
    // { displayname: 'Creative Contact', name: 'creativeContact' },  // ignoring as discussed with api team
    { displayname: 'Billing Company', name: 'billingCompany' },
    { displayname: 'Billing Contact', name: 'billingContact' },
    { displayname: 'Billing Email', name: 'billingEmail' },
    { displayname: 'Billing Phone', name: 'billingPhone' },
    // { displayname: 'Last Modified', name: 'updatedAt' }
  ];
  private unSubscribe$ = new Subject();

  constructor(
    public dialog: MatDialog,
    public cdRef: ChangeDetectorRef,
    private router: Router,
    private activateRoute: ActivatedRoute,
    public tabLinkHandler: TabLinkHandler,
    public jobService: JobsService,
    private jobDetailsService: JobDetailsService,
    public pdfPreviewerService: PdfPreviewerService,
    private auth: AuthenticationService,
    @Optional()
    @SkipSelf()
    public dialogRef: MatDialogRef<JobLineItemListTableComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && data.tableData) {
      data.tableData.subscribe((value) => {
        this.tablePagination = value.pagination;
        this.sort = value.sort;
        this.setPaginationSizes(value.pagination.found);

        this.tableData = value.tableData;
        this.dataSource = new MatTableDataSource<JobLineItemsSearchResult>(
          this.tableData
        );
        this.cdRef.markForCheck();
      });
    }
  }

  @Input() set tableRecords(value: JobLineItemsSearchResponse) {
    if (!value) {
      return;
    }

    this.tableData = value.results;
    this.tablePagination = value.pagination;
    this.setPaginationSizes(this.tablePagination?.found);
    this.expandedData.next({
      tableData: this.tableData,
      pagination: this.tablePagination,
      sort: this.sort
    });
    this.dataSource = new MatTableDataSource<JobLineItemsSearchResult>(
      this.tableData
    );
    this.cdRef.markForCheck();
  }

  @Input() set sorting(value: Sort) {
    if (!value) {
      return;
    }

    this.sort = value;
    this.expandedData.next({
      tableData: this.tableData,
      pagination: this.tablePagination,
      sort: this.sort
    });
  }

  ngOnInit() {
    this.userPermission = this.auth.getUserPermission(
      UserRole.PRINT_PRODUCTION
    );
    this.displayedColumns = this.defaultColumns.map((column) => column.name);
    this.customizeColumnService = new CustomizeColumnService(this.dialog);

    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: this.availableColumns,
      cachedKeyName: CustomColumnsArea.JOBS_OUTSIDE_LINE_ITEM_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, 'lineItemId'); // sticky column
        this.customizedColumn.emit(
          this.customizeColumnService.currentSortables
        );
        this.cdRef.markForCheck();
      }
    });
    this.resetSelection$
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe((option) => {
        if (option?.reset || option?.newSearch) {
          this.clearAll();
        }
      });
  }

  ngAfterViewInit() {
  }


  ngOnDestroy(): void {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  public clearAll() {
    this.excludedItemsIds = [];
  }

  onSorting(sort: Sort) {
    this.sort = sort;
    let _sort = sort;
    if (/(startMonth|startYear)/.test(sort.active)) {
      _sort = Helper.deepClone(sort);
      _sort.active = 'startDate';
    }

    this.sortingChanged.emit(sort);
  }

  getPageEvent(event: PageEvent) {
    this.tablePagination.page = event.pageIndex + 1;
    this.tablePagination.perPage = event.pageSize;

    this.paginationChanged.emit(this.tablePagination);
  }

  enterFullScreen() {
    const config: MatDialogConfig = {
      id: 'job-list-table-full-screen',
      width: '90vw',
      maxWidth: '90vw',
      closeOnNavigation: true,
      panelClass: 'jobs-list-dialog-fullscreen',
      autoFocus: false,
      disableClose: true,
      data: {
        fullScreenMode: true,
        tableData: this.expandedData
      }
    };

    this.dialogRef = this.dialog.open(JobLineItemListTableComponent, config);

    this.dialogRef.componentInstance.sortingChanged.subscribe((sort: Sort) => {
      this.sort = sort;
      this.sortingChanged.emit(this.sort);
    });

    this.dialogRef.componentInstance.paginationChanged.subscribe(
      (pagination: Pagination) => {
        this.tablePagination = pagination;
        this.paginationChanged.emit(this.tablePagination);
      }
    );

    this.dialogRef.componentInstance.duplicateItem.subscribe((element) => {
      this.duplicateItem.emit({ ...element, isFromDialog: true });
    });

    this.dialogRef.componentInstance.deleteItem.subscribe((deltelm) => {
      this.deleteItem.emit(deltelm);
    });

    this.dialogRef.afterClosed().subscribe((data) => {
      setTimeout(() => {
        if (data?.data) {
          const selectedData = data?.data;
          this.cdRef.markForCheck();
        }
      }, 100);
    });

    this.expandedData.next({
      pagination: this.tablePagination,
      sort: this.sort,
      tableData: this.tableData
    });
  }

  exitFullScreen() {
    const data = {
      excludedItemsIds: this.excludedItemsIds,
      pagination: this.tablePagination,
      sort: this.sort
    };
    this.dialogRef.close({ data });
  }

  customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.customizeColumnService.displayedColumns.splice(0, 0, 'lineItemId'); // sticky column
      this.customizedColumn.emit(this.customizeColumnService.currentSortables);
      this.cdRef.detectChanges();
    });
  }

  /** Method used to call job details API by job id */
  private getJobDetailsByJobId(jobID: string, element: any) {
    this.jobDetailsService.getJobDetailsByJobId(jobID)
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe((res: JobDetails) => {
        if (res?._id)
          this.jobDetails = Helper.deepClone(res);
          this.getLineItemDetails(jobID, element?._id);
        this.cdRef.markForCheck();
      });
  }
  getLineItemDetails(jobId: string, lineItemId: string) {
    this.jobService
        .getLineItemDetails(jobId, lineItemId)
        .subscribe((jobLineItemDetails) => {
          this.onAddLineItemsDialog(jobLineItemDetails);
          if (this.data?.fullScreenMode) {
            this.dialogRef.close();
          }
        });
  }
  onAddLineItemsDialog(lineItemData?: any, isForDuplicate = false, sort = null, paginate = null) {
    const dialogRef = this.dialog.open(JobLineItemDialogComponent, {
      height: '98%',
      width: '1135px',
      panelClass: 'add-line-items-modal',
      disableClose: true,
      autoFocus: false,
      data: {
        fullScreenMode: true,
        job: this.jobDetails,
        lineItemData,
        isForDuplicate,
        clientId: this.jobDetails?.client?._id,
        clientCode: this.jobDetails?.client?.mediaClientCode,
        pagination: paginate,
        sort: sort
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
    });
  }

  openJobDetails(element, newTab = false) {
    this.getJobDetailsByJobId(element?.jobs?._id, element);
  }

  isApproved(element: JobResult) {
    return !!element?.checkPoints?.find?.(
      (v) =>
        v.name.toLowerCase() === 'signed by client & uploaded'.toLowerCase()
    );
  }

  isJobBilled(element) {
    return !!element?.checkPoints?.find?.(
      (v) => v.name.toLowerCase() === 'Job billed'.toLowerCase()
    );
  }

  isCancelled(element) {
    return !!element?.checkPoints?.find?.(
      (v) => v.name.toLowerCase() === 'Cancelled'.toLowerCase()
    );
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
