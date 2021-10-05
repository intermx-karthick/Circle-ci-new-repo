import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  NgZone,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatTable } from '@angular/material/table';

import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { IMXMatPaginator } from '@shared/common-function';
import { Helper } from '../../../classes';
import { CustomColumnsArea } from '@interTypes/enums';
import { AuthenticationService, SnackbarService } from '@shared/services';
import { JobPurchaseOrderActionsHelper } from './job-purchase-order-actions-helper';

import { JobPurchaseOrderService } from 'app/jobs/services/job-purchase-order.service';

import {
  JobsPagination,
  JobDetails,
  JobPurchaseOrderResponse,
  JobPurchaseOrder,
} from "../../interfaces";

import { take, takeUntil, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { JobsService } from '../../jobs.service';
import { PdfPreviewerService } from '@shared/components/imx-pdf-previewer/pdf-previewer.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { UserRole } from '@interTypes/user-permission';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-job-purchase-order',
  templateUrl: './job-purchase-order.component.html',
  styleUrls: ['./job-purchase-order.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator },
    CustomizeColumnService,
    JobPurchaseOrderActionsHelper
  ]
})
export class JobPurchaseOrderComponent implements OnInit {

  @ViewChild('tableScrollRef', { read: ElementRef, static: false }) tableScrollRef: ElementRef;
  @ViewChild(MatTable) table: MatTable<any>;

  @Input() set jobDetailValues(value: any) {
    if (!value?._id) return;
    this.jobDetails = Helper.deepClone(value);
    this.jobPurchaseOrderActionsHelper.jobDetails = Helper.deepClone(value);
    this.getPurchaseOrderListByJobID();
    this.cdRef.detectChanges();
  };
  @Input() jobUpdateListener: Subject<any>;

  private unSub$: Subject<void> = new Subject<void>();

  public jobDetails: JobDetails = {} as JobDetails;
  public purchaseOrderList = [];
  public paginationSizes = [10];

  public selectedSort: MatSort = {
    active: "updatedAt",
    direction: "desc"
  } as MatSort

  public pagination: JobsPagination = {} as JobsPagination;

  public isDialogOpenend = false;
  public scrollContent: number;
  public hasHorizontalScrollbar = false;
  public isLoadingData = false;
  public disableEdit = false;

  constructor(
    private router: Router,
    private matSnackBar: MatSnackBar,
    private ngZone: NgZone,
    private snackbarService: SnackbarService,
    private jobService: JobsService,
    private activateRoute: ActivatedRoute,
    private jobPurchaseOrderService: JobPurchaseOrderService,
    private jobPurchaseOrderActionsHelper: JobPurchaseOrderActionsHelper,
    public dialog: MatDialog,
    public pdfPreviewerService: PdfPreviewerService,
    public customizeColumnService: CustomizeColumnService,
    public cdRef: ChangeDetectorRef,
    public dialogRef: MatDialogRef<JobPurchaseOrderComponent>,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    private auth: AuthenticationService,
    @Inject(MAT_DIALOG_DATA) public injectedData: any) {
  }


  ngOnInit(): void {
    if (this.injectedData?.dialogOpenened) {
      this.isDialogOpenend = true;
      this.purchaseOrderList = this.injectedData?.listData;
      this.selectedSort = this.injectedData?.sortValue;
      this.pagination = this.injectedData?.paginationValue;
      this.jobDetails = this.injectedData?.jobDetailsValue;
      this.jobPurchaseOrderActionsHelper.jobDetails = Helper.deepClone(this.injectedData?.jobDetailsValue);
      this.jobUpdateListener = this.injectedData?.jobUpdateListener;
    } else {
      this.purchaseOrderList = [];
    }
    this.reSize();
    this.initializeCustomizeColumn();
    this.initJobUpdateListener();
    this.checkForEditPermission();
  }

  private checkForEditPermission() {
    const permissions = this.auth.getUserPermission(UserRole.PRINT_PRODUCTION);
    if (permissions && !permissions.view) {
      this.disableEdit = true;
    }
  }

  /**
  * @description
  * method to initialize column
  */
  public initializeCustomizeColumn() {
    const defaultColumns = [
      { displayname: 'Printer Name', name: 'printerName' },
      { displayname: 'Signed', name: 'signed' },
      { displayname: 'Start Date', name: 'startDate' },
      { displayname: 'Printer Rep. Name', name: 'contactName' },
      { displayname: 'Printer Rep. Email Address', name: 'contactEmail' },
      { displayname: 'Last Modified', name: 'updatedAt' },
    ];

    this.customizeColumnService.init({
      defaultColumns: defaultColumns,
      sortableColumns: Helper.deepClone(defaultColumns),
      cachedKeyName: CustomColumnsArea.JOBS_PURCHASE_ORDER_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, "jobId");
        this.customizeColumnService.displayedColumns.splice(1, 0, 'action');
        this.cdRef.markForCheck();
      }
    });
  }

  /**
   * @description
   * method to call purchase order list API
   */
  private getPurchaseOrderListByJobID() {
    this.isLoadingData = true;
    this.cdRef.markForCheck();
    
    const sortDup = Helper.deepClone(this.selectedSort);
    const paginationDup = Helper.deepClone(this.pagination);

    this.jobPurchaseOrderService.getPurchaseOrderListByJobID(
      this.jobDetails?._id,
      sortDup,
      paginationDup,
      [],
      true
    ).pipe(takeUntil(this.unSub$))
      .subscribe((res: JobPurchaseOrderResponse) => {
        this.isLoadingData = false;
        if (res?.results) {
          this.purchaseOrderList = res?.results;
          this.pagination = res?.pagination;
          this.pagination.pageSize = res?.pagination?.perPage;
          this.setPaginationSizes(this.pagination?.found);
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
    this.pagination.perPage = event.pageSize;
    this.getPurchaseOrderListByJobID();
  }

  /**
   * @description
   * sort change event call back from Mat Sort
   */
  public sortChange(event) {
    this.selectedSort = event;
    this.getPurchaseOrderListByJobID();
  }

  /**
   * @description
   * event call back from customize column service
   */
  public customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.customizeColumnService.displayedColumns.splice(0, 0, "jobId");
      this.customizeColumnService.displayedColumns.splice(1, 0, 'action');
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
 * method to init full screen view
 */
  public enterFullScreen() {
    this.dialog.open(
      JobPurchaseOrderComponent,
      {
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'job-purchase-order-fullscreen',
        autoFocus: false,
        disableClose: true,
        data: {
          dialogOpenened: true,
          listData: this.purchaseOrderList,
          sortValue: this.selectedSort,
          paginationValue: this.pagination,
          jobDetailsValue: this.jobDetails,
          jobUpdateListener: this.jobUpdateListener,
        },
      }).
      afterClosed()
      .subscribe((res) => {
        if (!res) return
        this.purchaseOrderList = res?.listData;
        this.selectedSort = res?.sortValue;
        this.pagination = res?.paginationValue;
        this.isDialogOpenend = res?.dialogOpenened;
        this.getPurchaseOrderListByJobID();
      });
  }

  /**
   * @description
   * method to exit from full screen view
   */
  public exitFullScreen() {
    this.dialogRef.close({
      dialogOpenened: false,
      listData: this.purchaseOrderList,
      sortValue: this.selectedSort,
      paginationValue: this.pagination,
    });
  }

  /** method to open attachment upload dialog */
  public uploadSignedDocument(element: JobPurchaseOrder) {
    this.jobPurchaseOrderActionsHelper.openUploader(element, (result) => {
      this.getPurchaseOrderListByJobID();
      this.cdRef.markForCheck();
    });
  }

   /** method to open signed document in new tab */
  public openSignedDocument(element: JobPurchaseOrder) {
    saveAs(element?.signedAttachment?.url, element?.signedAttachment?.name);
  }


  public openPurchaseOrderPDF(element) {
    if (this.disableEdit) {
      return;
    }
    this.jobService
      .exportPurchaseOrderPDF(this.jobDetails?._id, element.printer?._id)
      .pipe(filter((res) => !!res?.body))
      .subscribe((res: any) => {
        const contentDispose = res.headers.get('content-disposition');
        const matches = contentDispose.split(';')[1].trim().split('=')[1];
        let filename = matches && matches.length > 1 ? matches : 'purchase-order' + '.pdf';
        filename = filename.slice(1, filename.length-1);
        const copyURL = `${location.origin}/jobs/${this.jobDetails?._id}?preview=${element?._id}&type=purchase-order&printer=${element?.printer?._id}`;
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

  /**
   * @description
   * method to initialize Job Form Update Listener to update Purchase Order if job details updated
   */
  private initJobUpdateListener() {
    this.jobUpdateListener.pipe(takeUntil(this.unSub$)).subscribe((res) => {
      this.getPurchaseOrderListByJobID();
    });
  }

  public ngOnDestroy(): void {
    this.unSub$.next();
    this.unSub$.complete();
  }
  copyURL(element) {
    const copyURL = `${location.origin}/jobs/${this.jobDetails?._id}?preview=${element?._id}&type=purchase-order&printer=${element?.printer?._id}`;
    this.clipboard.copy(copyURL);
    this.snackBar.open('URL copied to your Clipboard', '', {
      duration: 3000
    });
  }

}
