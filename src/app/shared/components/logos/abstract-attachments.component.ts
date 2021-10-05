import { ChangeDetectorRef, Component } from '@angular/core';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Observable } from 'rxjs/internal/Observable';

import { FileUploadConfig } from '@interTypes/file-upload';
import { Logo } from '@interTypes/records-management';
import { UseRecordPagination } from '../../../records-management-v2/useRecordPagination';
import { Helper } from '../../../classes';
import { AttachmentsListResponse } from '@interTypes/contract/contract-attachment';

@Component({
  template: ``
})
export abstract class AbstractAttachmentsComponent {
  public _mainTitle: string;
  public organizationId$: Subject<any> = new Subject<any>();
  public organisationId: string;
  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: true,
    acceptedFormats: [
      'pdf',
      'doc',
      'docx',
      'txt',
      'csv',
      'xlsx',
      'xls',
      'yaml',
      'ppt',
      'pptx',
      'jpg',
      'png',
      'jpeg'
    ],
    sizeLimit: 100
  };
  public attachments: Logo[] = [];
  public uploadInProgress$: Subject<any> = new Subject<any>();
  public clearAttachment$: Subject<any> = new Subject<any>();
  public isLoading$: Subject<boolean> = new Subject<boolean>();
  public pagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 20
  });

  constructor(
    public matSnackBar: MatSnackBar,
    public cdRef: ChangeDetectorRef
  ) {}

  abstract getAttachmentsAPI<T>(pagination: UseRecordPagination): Observable<T>;

  abstract uploadAttachmentsAPI(file: File | any): Observable<any>;

  abstract deleteAttachmentsAPI<T>(logo: Logo): Observable<T>;

  public createAttachment(data) {
    const filesStatuses = data.status;
    if (data?.files?.length) {
      const filesInfo = [];
      data.files.forEach((file, index) => {
        this.uploadAttachmentsAPI(file.fileFormData).subscribe(
          (response) => {
            filesStatuses[file['fileName']]['inProgress'] = false;
            this.uploadInProgress$.next(filesStatuses);
            filesInfo.push(file['fileName']);
            if (filesInfo.length === data.files.length) {
              // clear all uploaded file info
              this.clearAttachment$.next(true);
              this.pagination.resetPagination();
              this.loadAttachments();
            }
            this.showsAlertMessage(`${file.fileName} added successfully!.`);
          },
          (errorResponse) => {
            filesInfo.push(file['fileName']);
            if (filesInfo.length === data.files.length) {
              // clear all uploaded file info
              this.clearAttachment$.next(true);
              this.loadAttachments();
            }
            this.handleError(errorResponse);
          }
        );
      });
    }
  }

  public deleteAttachment(logo: Logo) {
    this.deleteAttachmentsAPI<any>(logo).subscribe(
      (response) => {
        this.showsAlertMessage(`${logo.name} deleted successfully!.`);
        const index = this.attachments.findIndex(
          (logoInfo: Logo) => logoInfo._id === logo._id
        );
        this.attachments.splice(index, 1);
        this.attachments = Helper.deepClone(this.attachments);
        this.cdRef.markForCheck();
      },
      (errorResponse) => {
        this.handleError(errorResponse);
      }
    );
  }

  protected loadAttachments(nextPage = false) {
    this.isLoading$.next(true);
    this.getAttachmentsAPI(this.pagination)
      .pipe(filter((res) => !!res))
      .subscribe(
        (response: AttachmentsListResponse) => {
          this.organizationId$.next(this.organisationId);
          // After uploading a new logo we are refreshing the list
          this.pagination.updateTotal(response.pagination.total);
          if (nextPage) {
            this.attachments = this.attachments.concat(
              response.result.attachments
            );
          } else {
            this.attachments = Helper.deepClone(response.result.attachments);
          }
          this.isLoading$.next(false);
          this.cdRef.markForCheck();
        },
        (errorResponse) => {
          this.handleError(errorResponse);
        }
      );
  }

  public loadMoreAttachments() {
    if (this.pagination.isPageSizeReachedTotal()) {
      this.isLoading$.next(false);
      this.cdRef.markForCheck();
      return;
    }
    this.pagination.moveNextPage();
    this.loadAttachments(true);
  }

  private showsAlertMessage(msg) {
    const config = {
      duration: 5000
    } as MatSnackBarConfig;

    this.matSnackBar.open(msg, '', config);
  }

  private handleError(errorResponse: any) {
    this.isLoading$.next(false);

    if (errorResponse.error?.message) {
      this.showsAlertMessage(errorResponse.error?.message);
      return;
    }
    this.showsAlertMessage('Something went wrong, Please try again later');
  }
}
