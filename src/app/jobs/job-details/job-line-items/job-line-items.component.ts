import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatTable } from '@angular/material/table';

import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { IMXMatPaginator } from '@shared/common-function';
import { Helper } from '../../../classes';
import { CustomColumnsArea } from '@interTypes/enums';
import { AuthenticationService, SnackbarService } from '@shared/services';

import { JobLineItemService } from 'app/jobs/services/job-line-item.service';

import {
  JobsPagination,
  JobLineItemsResponse,
  JobDetails,
  JobLineItemDetails,
} from "../../interfaces";

import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-job-line-items',
  templateUrl: './job-line-items.component.html',
  styleUrls: ['./job-line-items.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator },
    CustomizeColumnService
  ]
})
export class JobLineItemsComponent implements OnInit {

  @ViewChild('tableScrollRef', { read: ElementRef, static: false }) tableScrollRef: ElementRef;
  @ViewChild(MatTable) table: MatTable<any>;

  @Input() set refreshTable(value: any) {
    if (value) {
      if (this.dialogRef) {
        this.dialogRef?.componentInstance?.getLineItemListByJobID?.();
      } else {
        this.getLineItemListByJobID();
        this.cdRef.detectChanges();
      }
    }
  }
  @Input() set jobDetailValues(value: any) {
    if (!value?._id) return;
    this.jobDetails = Helper.deepClone(value);
    this.getLineItemListByJobID();
    this.cdRef.detectChanges();
  };

  @Output() lineItemEdit: EventEmitter<any> = new EventEmitter<any>();
  private unSub$: Subject<void> = new Subject<void>();

  public jobDetails: JobDetails = {} as JobDetails;
  public lineItemsList = [];
  public paginationSizes = [10];

  public selectedSort: MatSort = {
    active: "lineItemId",
    direction: "asc"
  } as MatSort

  public pagination: JobsPagination = {} as JobsPagination;

  public isDialogOpenend = false;
  public scrollContent: number;
  public hasHorizontalScrollbar = false;
  public isLoadingData = false;
  userPermission: UserActionPermission;

  constructor(
    private router: Router,
    private matSnackBar: MatSnackBar,
    private ngZone: NgZone,
    private snackbarService: SnackbarService,
    private jobLineItemService: JobLineItemService,
    public dialog: MatDialog,
    public customizeColumnService: CustomizeColumnService,
    public cdRef: ChangeDetectorRef,
    public dialogRef: MatDialogRef<JobLineItemsComponent>,
    private auth: AuthenticationService,
    @Inject(MAT_DIALOG_DATA) public injectedData: any) {
  }


  ngOnInit(): void {
    this.userPermission = this.auth.getUserPermission(UserRole.PRINT_PRODUCTION);
    if (this.injectedData?.dialogOpenened) {
      this.isDialogOpenend = true;
      this.lineItemsList = this.injectedData?.listData;
      this.selectedSort = this.injectedData?.sortValue;
      this.pagination = this.injectedData?.paginationValue;
      this.jobDetails = this.injectedData?.jobDetailsValue;
    } else {
      this.lineItemsList = [];
    }
    this.reSize();
    this.initializeCustomizeColumn();
  }

  /**
  * @description
  * method to initialize column
  */
  public initializeCustomizeColumn() {
    const defaultColumns = [
      { displayname: 'Market', name: 'market' },
      { displayname: 'Printer', name: 'printer' },
      { displayname: 'Media Type', name: 'mediaType' },
      { displayname: 'Start Date', name: 'startDate' },
      { displayname: 'Materials', name: 'clientMaterialCost' },
      { displayname: 'Client Total', name: 'clientCostTotal' },
      { displayname: 'Revision Date', name: 'revisedAt' },
    ];

    this.customizeColumnService.init({
      defaultColumns: defaultColumns,
      sortableColumns: Helper.deepClone(defaultColumns),
      cachedKeyName: CustomColumnsArea.JOBS_LINE_ITEM_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, "lineItemId");
        this.customizeColumnService.displayedColumns.splice(1, 0, 'action');
        this.cdRef.markForCheck();
      }
    });
  }

  /**
   * @description
   * method to call line item list API
   */
  private getLineItemListByJobID() {
    this.isLoadingData = true;

    const sortDup = Helper.deepClone(this.selectedSort);
    const paginationDup = Helper.deepClone(this.pagination);

    this.jobLineItemService.getLineItemListByJobID(
      this.jobDetails?._id,
      sortDup,
      paginationDup,
      [],
      true
    ).pipe(takeUntil(this.unSub$))
      .subscribe((res: JobLineItemsResponse) => {
        this.isLoadingData = false;
        if (res?.results) {
          this.lineItemsList = res?.results;
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
    this.getLineItemListByJobID();
  }

  /**
   * @description
   * sort change event call back from Mat Sort
   */
  public sortChange(event) {
    this.selectedSort = event;
    this.getLineItemListByJobID();
  }

  /**
   * @description
   * event call back from customize column service
   */
  public customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.customizeColumnService.displayedColumns.splice(0, 0, "lineItemId");
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
    this.dialogRef = this.dialog.open(
      JobLineItemsComponent,
      {
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'job-line-item-fullscreen',
        autoFocus: false,
        disableClose: true,
        data: {
          dialogOpenened: true,
          listData: this.lineItemsList,
          sortValue: this.selectedSort,
          paginationValue: this.pagination,
          jobDetailsValue: this.jobDetails
        },
      });
    this.dialogRef.afterClosed()
      .subscribe((res) => {
        if (!res) return
        this.lineItemsList = res?.listData;
        this.selectedSort = res?.sortValue;
        this.pagination = res?.paginationValue;
        this.isDialogOpenend = res?.dialogOpenened;
        this.getLineItemListByJobID();
      });

    this.dialogRef.componentInstance.lineItemEdit.subscribe((res) => {
      this.lineItemEdit.emit({ ...res, isFromDialog: true });
    });
  }

  /**
   * @description
   * method to exit from full screen view
   */
  public exitFullScreen() {
    this.dialogRef.close({
      dialogOpenened: false,
      listData: this.lineItemsList,
      sortValue: this.selectedSort,
      paginationValue: this.pagination,
    });
  }

  /**
  * @description
  * method used to call delete API based on confirmation popup
  */
  public deleteJobLineItem(element) {
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
          this.jobLineItemService.deleteJobLineItem(this.jobDetails?._id, element?._id)
        ),
        filter((res: any) => res?.status === 'success')
      )
      .subscribe((res) => {
        this.snackbarService.showsAlertMessage(res?.message);
        this.getLineItemListByJobID();
      });
  }

  /**
   * @description
   * method used to perform duplicate action
   * lineItem value emitted with sort and pagination
   */
  public duplicateJobLineItem(element) {
    this.jobLineItemService
      .getLineItemDetailsByLineItemID(this.jobDetails?._id, element?._id)
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: JobLineItemDetails) => {
        this.lineItemEdit.emit({ data: res, isForDuplicate: true, sort: this.selectedSort, pagination: this.paginationCalc(element?._id) });
      });
  }

  /**
   * @description
   * method used to perform lineItem View action
   * lineItem value emitted with sort and pagination
   */
  public viewLineItem(id: string) {
    this.jobLineItemService
      .getLineItemDetailsByLineItemID(this.jobDetails?._id, id)
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: JobLineItemDetails) => {
        this.lineItemEdit.emit({ data: res, isForDuplicate: false, sort: this.selectedSort, pagination: this.paginationCalc(id) });
      });
  }

 /**
  * @description
  * pagination calculation and index find for line item view/edit modal window
  */
  private paginationCalc(lineItemId) {
    if (!lineItemId) {
      let pagination = Helper.deepClone(this.pagination) ?? {};
      pagination.page = (((this.pagination?.page - 1) * 10)) ?? 0;
      pagination.page += 1;
      pagination.perPage = 1;
      return pagination
    }
    const index = this.lineItemsList?.findIndex(each => each._id === lineItemId);
    let pagination = Helper.deepClone(this.pagination) ?? {};
    pagination.page = (((this.pagination?.page - 1) * 10) + index) ?? 0;
    pagination.page += 1;
    pagination.perPage = 1;
    return pagination;
  }


  public ngOnDestroy(): void {
    this.unSub$.next();
    this.unSub$.complete();
  }

}
