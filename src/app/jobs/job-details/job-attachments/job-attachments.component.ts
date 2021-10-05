import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { FileUploadConfig } from "@interTypes/file-upload";
import { Logo } from "@interTypes/records-management";
import { UseRecordPagination } from "app/records-management-v2/useRecordPagination";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { filter, takeUntil } from 'rxjs/operators';
import { Helper } from 'app/classes';
import { JobsService } from 'app/jobs/jobs.service';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { AuthenticationService } from '@shared/services/authentication.service';

@Component({
  selector: 'app-job-attachments',
  templateUrl: './job-attachments.component.html',
  styleUrls: ['./job-attachments.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobAttachmentsComponent implements OnInit, OnDestroy {

  @Input() jobId;
  public organizationId$: Subject<any> = new Subject<any>();
  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: true,
    acceptedFormats: ['pdf', 'xlsx', 'xls', 'gif', 'jpg', 'png', 'jpeg', 'svg'],
    sizeLimit: 10,
    displayFileHint: true
  };
  public jobsAttachments: Logo[] = [];
  public uploadInProgress$: Subject<any> = new Subject<any>();
  public clearAttachment$: Subject<any> = new Subject<any>();
  public isJobAttachmentsLoading$: Subject<boolean> = new Subject<boolean>();
  public jobAttachmentsPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 20
  });
  private unSubscribe: Subject<void> = new Subject<void>();
  public userPermission: UserActionPermission;
  disableEdit = false;
  constructor(
    private matSnackBar: MatSnackBar,
    private jobsService: JobsService,
    private cdRef: ChangeDetectorRef,
    private auth: AuthenticationService
  ) { }

  ngOnInit(): void {
    if(this.jobId) {
      this.loadJobAttachments(this.jobId);
    }
    this.checkForEditPermission();
  }

  private checkForEditPermission() {
    this.userPermission = this.auth.getUserPermission(UserRole.ATTACHMENT);
    if (this.userPermission && !this.userPermission?.edit) {
      this.disableEdit = true;
    }
  }

  public deleteAttachment(logo: Logo) {

    this.jobsService
      .deleteJobAttachment(this.jobId, logo['key'], logo['_id'])
      .subscribe(
        (response) => {
          this.showsAlertMessage(`${logo.name} deleted successfully!.`);
          const index = this.jobsAttachments.findIndex(
            (logoInfo: Logo) => logoInfo._id === logo._id
          );
          this.jobsAttachments.splice(index, 1);
          this.jobsAttachments = Helper.deepClone(this.jobsAttachments);
          this.cdRef.markForCheck();
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
  public createAttachment(data) {
    const filesStatuses = data.status;
    if (data?.files?.length) {
      const filesInfo = [];
      data.files.forEach((file, index) => {
        this.jobsService
          .uploadJobAttachment(
            this.jobId,
            file.fileFormData
          )
          .subscribe(
            (response) => {
              filesStatuses[file['fileName']]['inProgress'] = false;
              this.uploadInProgress$.next(filesStatuses);
              filesInfo.push(file['fileName']);
              if (filesInfo.length === data.files.length) {
                // clear all uploaded file info
                this.clearAttachment$.next(true);
                this.jobAttachmentsPagination.resetPagination();
                this.loadJobAttachments(
                  this.jobId
                );
              }
              this.showsAlertMessage(`${file.fileName} added successfully!.`);
            },
            (errorResponse) => {
              filesInfo.push(file['fileName']);
              if (filesInfo.length === data.files.length) {
                // clear all uploaded file info
                this.clearAttachment$.next(true);
                this.loadJobAttachments(
                  this.jobId
                );
              }
              if (errorResponse.error?.message) {
                this.showsAlertMessage(errorResponse.error?.message);
                return;
              }
              this.showsAlertMessage(
                'Something went wrong, Please try again later'
              );
            }
          );
      });
    }
  }

  private loadJobAttachments(jobId, nextPage = false) {
    this.isJobAttachmentsLoading$.next(true);
    this.jobsService
      .getJobAttachments(
        jobId,
        this.jobAttachmentsPagination.getValues()
      )
      .pipe(
        filter((res) => !!res),
        takeUntil(this.unSubscribe)
      )
      .subscribe(
        (response: any) => {
          this.organizationId$.next(jobId);
          // After uploading a new logo we are refreshing the list
          this.jobAttachmentsPagination.updateTotal(
            response.pagination.total
          );
          if (nextPage) {
            this.jobsAttachments = this.jobsAttachments.concat(
              response.results
            );
          } else {
            this.jobsAttachments = Helper.deepClone(
              response.results
            );
          }
          this.isJobAttachmentsLoading$.next(false);
          this.cdRef.markForCheck();
        },
        (errorResponse) => {
          this.isJobAttachmentsLoading$.next(false);
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

  public loadMoreAttachments() {
    if (this.jobAttachmentsPagination.isPageSizeReachedTotal()) {
      this.isJobAttachmentsLoading$.next(false);
      this.cdRef.markForCheck();
      return;
    }
    this.jobAttachmentsPagination.moveNextPage();
    this.loadJobAttachments(this.jobId, true);
  }

  private showsAlertMessage(msg) {
    const config = {
      duration: 5000
    } as MatSnackBarConfig;

    this.matSnackBar.open(msg, '', config);
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

}
