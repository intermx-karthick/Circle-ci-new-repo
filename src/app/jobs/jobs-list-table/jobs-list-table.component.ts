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
  SkipSelf,
  ViewChild
} from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomColumnsArea } from '@interTypes/enums';

import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { Helper } from 'app/classes';
import { Pagination } from 'app/contracts-management/models/pagination.model';
import { ContractLineItemsService } from 'app/contracts-management/services/contract-line-items.service';
import { Subject } from 'rxjs';
import { IMXMatPaginator } from '@shared/common-function';
import { takeUntil, filter } from 'rxjs/operators';
import { TabLinkHandler, TabLinkType } from '@shared/services/tab-link-handler';
import {
  JobResult,
  JobSearchResponse
} from '@interTypes/jobs/jobs-search.response';
import { IMXPDFPreviewerComponent } from '@shared/components/imx-pdf-previewer/imx-pdf-previewer.component';
import { JobsService } from '../jobs.service';
import { PdfPreviewerService } from '@shared/components/imx-pdf-previewer/pdf-previewer.service';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { AuthenticationService } from '@shared/services/authentication.service';

@Component({
  selector: 'app-jobs-list-table',
  templateUrl: './jobs-list-table.component.html',
  styleUrls: ['./jobs-list-table.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MatPaginatorIntl, useClass: IMXMatPaginator }]
})
export class JobsListTableComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @Input() searchFilterApplied = false;
  @Input() isLoading = false;
  @Input() resetSelection$: Subject<any> = new Subject<any>();
  @Input() set tableRecords(value: JobSearchResponse) {
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
    this.dataSource = new MatTableDataSource<JobResult>(this.tableData);
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
  @Output() customizedColumn = new EventEmitter<any>();
  @Output()
  paginationChanged: EventEmitter<Pagination> = new EventEmitter<Pagination>();
  @Output() sortingChanged: EventEmitter<Sort> = new EventEmitter<Sort>();
  @Output() editItem: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteItem: EventEmitter<any> = new EventEmitter<any>();
  @Output() duplicateItem: EventEmitter<any> = new EventEmitter<any>();
  @Output() invoiceItem: EventEmitter<any> = new EventEmitter<any>();
  public excludedItemsIds: string[] = [];
  public displayedColumns: string[];
  public customizeColumnService: CustomizeColumnService;
  public dataSource;
  public tablePagination: Pagination;
  public sort: Sort;
  public tableData: JobResult[] = [];
  public isLoadingItems = false;
  public paginationSizes = [10];
  public TabLinkType = TabLinkType;
  private expandedData: Subject<any> = new Subject<any>();
  private defaultColumns: any[] = [
    { displayname: 'Client Name', name: 'clientName' },
    { displayname: 'Job Name', name: 'name' },
    { displayname: 'Date Created', name: 'createdAt' },
    { displayname: 'Start Date', name: 'startDate' },
    { displayname: 'Job Total', name: 'jobTotal' },
    { displayname: 'Approved', name: 'approved' },
    { displayname: 'Job Billed', name: 'jobBilled' },
    { displayname: 'Cancelled', name: 'cancelled' },
    { displayname: 'Last Modified', name: 'updatedAt' }
  ];
  private unSubscribe$ = new Subject();
  userPermission: UserActionPermission;


  constructor(
    public dialog: MatDialog,
    public cdRef: ChangeDetectorRef,
    private router: Router,
    private activateRoute: ActivatedRoute,
    public tabLinkHandler: TabLinkHandler,
    public jobService: JobsService,
    public pdfPreviewerService: PdfPreviewerService,
    private auth: AuthenticationService,
    @Optional()
    @SkipSelf()
    public dialogRef: MatDialogRef<JobsListTableComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && data.tableData) {
      data.tableData.subscribe((value) => {
        this.tablePagination = value.pagination;
        this.sort = value.sort;
        this.setPaginationSizes(value.pagination.found);

        this.tableData = value.tableData;
        this.dataSource = new MatTableDataSource<JobResult>(this.tableData);
        this.cdRef.markForCheck();
      });
    }
  }

  ngOnInit() {
    this.userPermission = this.auth.getUserPermission(UserRole.PRINT_PRODUCTION);
    this.openJobListOnPasteURL();
    this.displayedColumns = this.defaultColumns.map((column) => column.name);
    this.customizeColumnService = new CustomizeColumnService(this.dialog);

    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.defaultColumns),
      cachedKeyName: CustomColumnsArea.JOBS_ITEMS_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, 'jobId'); // sticky column
        this.customizeColumnService.displayedColumns.splice(1, 0, 'action'); // sticky column
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

  ngOnDestroy() {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  public clearAll() {
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

    this.dialogRef = this.dialog.open(JobsListTableComponent, config);

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
      this.customizeColumnService.displayedColumns.splice(0, 0, 'jobId'); // sticky column
      this.customizeColumnService.displayedColumns.splice(1, 0, 'action');
      this.customizedColumn.emit(this.customizeColumnService.currentSortables);
      this.cdRef.detectChanges();
    });
  }

  openJobDetails(element, newTab = false) {
    this.router.navigateByUrl(`/jobs/${element._id}`);
    if(this.data?.fullScreenMode) {
      this.dialogRef.close();
    }
  }

  ngAfterViewInit() {}

  delete(element) {
    this.deleteItem.emit(element);
  }

  duplicate(element) {}

  saveAs() {}

  private setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
    } else {
      this.paginationSizes = [10];
    }
  }

  viewProductionAuthorization(element) {}


  isApproved(element: JobResult) {
    return !!element.checkPoints.find(
      (v) =>
        v.name.toLowerCase() === 'signed by client & uploaded'.toLowerCase()
    );
  }

  isJobBilled(element) {
    return !!element.checkPoints.find(
      (v) => v.name.toLowerCase() === 'Job billed'.toLowerCase()
    );
  }

  isCancelled(element) {
    return !!element.checkPoints.find(
      (v) => v.name.toLowerCase() === 'Cancelled'.toLowerCase()
    );
  }

  public viewJobInvoicePDF(element) {
    this.jobService
      .jobInvoicePDF(element?._id)
      .pipe(filter((res) => !!res?.body))
      .subscribe((res: any) => {
        const contentDispose = res.headers.get('content-disposition');
        const matches = contentDispose.split(';')[1].trim().split('=')[1];
        let filename = matches && matches.length > 1 ? matches : 'Job_Client_Invoice' + '.pdf';
        filename = filename.slice(1, filename.length-1);
        const copyUrl = location.origin + `/jobs?preview=${element?._id}&type=job-invoice`;
        this.openPdfViewer(res.body, filename, filename, copyUrl);
      });
  }

  public openPrinterAuthorizationPDF(element) {
    this.jobService
      .exportPrinterAuthorizationPDF(element?._id)
      .pipe(filter((res) => !!res?.body))
      .subscribe((res: any) => {
        const contentDispose = res.headers.get('content-disposition');
        const matches = contentDispose.split(';')[1].trim().split('=')[1];
        let filename = matches && matches.length > 1 ? matches : 'pinter-production' + '.pdf';
        filename = filename.slice(1, filename.length-1);
        const copyURL = `${location.origin}/jobs?preview=${element?._id}&type=printer-authorization`;
        this.openPdfViewer(res.body, filename, filename, copyURL); // for now sending file name as title
      });
  }

  public openPdfViewer(blob, title, filename, copyURL) {
    this.pdfPreviewerService
      .open({
        pdfSrc: blob,
        title: title,
        downloadFileName: filename,
        copyURL: copyURL
      })
      .subscribe((res) => {
      });
  }

  public openJobListOnPasteURL() {
    const previewId = this.activateRoute.snapshot.queryParamMap.get('preview');
    const previewType = this.activateRoute.snapshot.queryParamMap.get('type');
    switch (previewType){
      case 'printer-authorization':
        this.openPrinterAuthorizationPDF({ _id: previewId });
        break;
      case 'job-invoice':
        this.viewJobInvoicePDF({ _id: previewId });
        break;
    }
  }
}
