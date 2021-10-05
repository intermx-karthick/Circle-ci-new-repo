import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from '@angular/material/dialog';

import { AuthenticationService, SnackbarService } from '@shared/services';
import { TimeStamp } from "@interTypes/time-stamp";
import { Helper } from 'app/classes';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';

import { BaseResponse } from '@interTypes/BaseResponse';

import { JobDetailsService } from '../services/job-details.service';
import { JobsService } from '../jobs.service';

import {
  JobDetailsUpdatePayload,
  JobDetails
} from "../interfaces";

import { Subject} from "rxjs";
import { filter, switchMap, takeUntil } from 'rxjs/operators';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { PdfPreviewerService } from '@shared/components/imx-pdf-previewer/pdf-previewer.service';
import { JobResult } from '@interTypes/jobs/jobs-search.response';
import { AddJobComponent } from '../jobs-list/add-job/add-job.component';
import { ContractsMapper } from 'app/contracts-management/contracts/contracts-shared/helpers/contracts.mapper';

@Component({
  selector: 'app-job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobDetailsComponent implements OnInit {

  private unSub$: Subject<void> = new Subject<void>();
  public scrolling$: Subject<void> = new Subject<void>();

  public formSave$: Subject<any> = new Subject<any>();
  public jobUpdateListener$: Subject<any> = new Subject<any>();

  public scrollContent: number;
  public timeStamp = {} as TimeStamp;
  public selectedTabIndex: number;

  public jobDetails: JobDetails = {} as JobDetails;
  public JobID: string;
  userPermission: UserActionPermission;

  readonly tabItems = Object.freeze({
    CORE_DETAILS: 'job-core-details',
    ATTACHMENTS: 'job-attachments',
    PURCHASE_ORDER: 'job-purchase-order'
  });

  constructor(
    private fb: FormBuilder,
    private matSnackBar: MatSnackBar,
    private snackbarService: SnackbarService,
    private dialog: MatDialog,
    private activateRoute: ActivatedRoute,
    private router: Router,
    private jobDetailsService: JobDetailsService,
    private cdRef: ChangeDetectorRef,
    private jobService: JobsService,
    private auth: AuthenticationService,
    public pdfPreviewerService: PdfPreviewerService,
  ) {
    this.scrollContent = window.innerHeight - 340;
  }

  ngOnInit(): void {
    this.userPermission = this.auth.getUserPermission(UserRole.PRINT_PRODUCTION);
    this.routeParamListner();
  }

  get logosAccess() {
    return !!this.auth.getUserPermission(UserRole.ATTACHMENT);
  }
  /** route param listener to get Job Id */
  private routeParamListner() {
    this.activateRoute.params
      .pipe(takeUntil(this.unSub$))
      .subscribe(params => {
        this.JobID = params?.id;
        this.getJobDetailsByJobId(this.JobID);
        this.openPurchaseOrderOnPasteURL();
      });
  }

  /**
   * @description
   * event call back when mat tab group change happens
   */
  public onSelectedTabChange(event) {
    this.selectedTabIndex = event.index;
  }

  /**
   * trigger form submit through observer
   */
  public initSave() {
    this.formSave$.next(true);
  }

  /**
   * Method to receive Patch Payload and Call Update API
   */
  public detailsFormValues(value) {
    if (value) {
      this.updateJobDetails(value);
    }
  }

  /** Method used to call job details API by job id */
  private getJobDetailsByJobId(jobID: string) {
    this.jobDetailsService.getJobDetailsByJobId(jobID)
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: JobDetails) => {
        if (res?._id)
          this.jobDetails = Helper.deepClone(res);
          this.timeStamp = ContractsMapper.getTimeStamp(this.jobDetails as any);
        this.cdRef.markForCheck();
      });
  }
  public onLineItemUpdate(){
    this.getJobDetailsByJobId(this.JobID);
  }

  /** Method used to call job details update API by job id */
  private updateJobDetails(payload: JobDetailsUpdatePayload) {
    this.jobDetailsService.updateJobDetails(this.JobID, payload)
      .pipe(takeUntil(this.unSub$), filter((res: BaseResponse<{ id: string }>) => res?.status === 'success'))
      .subscribe((res: BaseResponse<{ id: string }>) => {
        this.jobDetails.name = payload?.name;
        this.jobUpdateListener$.next();
        this.matSnackBar.open(res?.message, null, {
          duration: 3000
        });
        this.cdRef.markForCheck();
      });
  }

  /** Method used to call job delete API by job id */
  public deleteJobItem() {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(
        filter((res) => res && res['action']),
        switchMap(() => this.jobService.deleteJob(this.JobID)),
        filter((res: any) => res?.status === 'success')
      )
      .subscribe((res) => {
        if (res?.status == 'success') {
          this.snackbarService.showsAlertMessage('Job deleted successfully');
          this.router.navigateByUrl(`/jobs`);
        }
        else {
          this.snackbarService.showsAlertMessage(res?.message);
        }
      });
  }

  /**
   * @description
   * method to call clone API
   * page param updated based on response job id
   */
  public duplicateJob() {
    let modelData: any = {
      isForDuplicate: true,
      jobDetails: this.jobDetails
    };

    this.dialog
      .open(AddJobComponent, {
        panelClass: 'imx-mat-dialog',
        width: '270px',
        disableClose: true,
        data: modelData
      })
      .afterClosed()
      .subscribe(( res: any) => {
        if(res?.success) {
          this.router.navigateByUrl(`/jobs/${res?.data?.id}`);
        }
      });
  }

  public handleScroll() {
    this.scrolling$.next();
  }

  public openPurchaseOrderPDF(element) {
    this.jobService
      .exportPurchaseOrderPDF(this.JobID, element.printer?._id)
      .pipe(filter((res) => !!res?.body))
      .subscribe((res: any) => {
        const contentDispose = res.headers.get('content-disposition');
        const matches = contentDispose.split(';')[1].trim().split('=')[1];
        let filename = matches && matches.length > 1 ? matches : 'purchase-order' + '.pdf';
        filename = filename.slice(1, filename.length-1);
        const copyURL = `${location.origin}/jobs/${this.JobID}?preview=${element?._id}&type=purchase-order&printer=${element?.printer?._id}`;
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

  public openPurchaseOrderOnPasteURL() {
    const previewId = this.activateRoute.snapshot.queryParamMap.get('preview');
    const previewType = this.activateRoute.snapshot.queryParamMap.get('type');
    const printerId = this.activateRoute.snapshot.queryParamMap.get('printer');
    const tab = this.activateRoute.snapshot.queryParamMap.get('tab');

    switch (previewType) {
      case 'printer-authorization':
        this.openPrinterAuthorizationPDF(previewId);
        break;
      case 'job-invoice':
        this.viewJobInvoicePDF(previewId);
        break;
      case 'purchase-order':
        this.selectedTabIndex = 2;
        this.openPurchaseOrderPDF({
          _id: previewId,
          printer: { _id: printerId }
        });
        break;
    }

    if (tab === 'po') {
      this.selectedTabIndex = 2;
    }
  }

  public viewJobInvoicePDF(id) {
    this.jobService
      .jobInvoicePDF(id)
      .pipe(filter((res) => !!res?.body))
      .subscribe((res: any) => {
        const contentDispose = res.headers.get('content-disposition');
        const matches = contentDispose.split(';')[1].trim().split('=')[1];
        let filename = matches && matches.length > 1 ? matches : 'Job_Client_Invoice' + '.pdf';
        filename = filename.slice(1, filename.length-1);
        const copyUrl = location.origin + `/jobs/${id}?preview=${id}&type=job-invoice`;
        this.openPdfViewer(res.body, filename, filename, copyUrl);
      });
  }

  public openPrinterAuthorizationPDF(id) {
    this.jobService
      .exportPrinterAuthorizationPDF(id)
      .pipe(filter((res) => !!res?.body))
      .subscribe((res: any) => {
        const contentDispose = res.headers.get('content-disposition');
        const matches = contentDispose.split(';')[1].trim().split('=')[1];
        let filename = matches && matches.length > 1 ? matches : 'pinter-production' + '.pdf';
        filename = filename.slice(1, filename.length-1);
        const copyURL = `${location.origin}/jobs/${id}?preview=${id}&type=printer-authorization`;
        this.openPdfViewer(res.body, filename, filename, copyURL); // for now sending file name as title
      });
  }

  openPrintPreview(val) {
    switch (val?.type) {
      case 'INVOICE':
        this.viewJobInvoicePDF(val?.id);
        break;
      case 'PA':
        this.openPrinterAuthorizationPDF(val?.id);
        break;

      default:
        break;
    }
  }

  public ngOnDestroy(): void {
    this.unSub$.next();
    this.unSub$.complete();
  }
}
