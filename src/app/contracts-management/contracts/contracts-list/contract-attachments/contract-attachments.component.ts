import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { FileUploadConfig } from "@interTypes/file-upload";
import { Logo } from "@interTypes/records-management";
import { UseRecordPagination } from "app/records-management-v2/useRecordPagination";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { ContractsService } from 'app/contracts-management/services/contracts.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Helper } from 'app/classes';
import { AttachmentsListResponse } from '@interTypes/contract/contract-attachment';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-contract-attachments',
  templateUrl: './contract-attachments.component.html',
  styleUrls: ['./contract-attachments.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractAttachmentsComponent implements OnInit, OnDestroy {

  @Input() contractItemId;
  public organizationId$: Subject<any> = new Subject<any>();
  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: true,
    acceptedFormats: ['pdf', 'xlsx', 'xls', 'gif', 'jpg', 'png', 'jpeg', 'svg'],
    sizeLimit: 10,
    displayFileHint: true
  };
  public contractAttachments: Logo[] = [];
  public uploadInProgress$: Subject<any> = new Subject<any>();
  public clearAttachment$: Subject<any> = new Subject<any>();
  public iscontractAttachmentsLoading$: Subject<boolean> = new Subject<boolean>();
  public contractAttachmentsPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 20
  });
  private unSubscribe: Subject<void> = new Subject<void>();

  constructor(
    private matSnackBar: MatSnackBar,
    private contractsService: ContractsService,
    private cdRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    if(this.contractItemId) {
      this.loadContractAttachments(this.contractItemId);
    }

  }

  public deleteAttachment(logo: Logo) {
    this.contractsService
      .deleteContractAttachment(this.contractItemId, logo['key'])
      .subscribe(
        (response) => {
          this.showsAlertMessage(`${logo.name} deleted successfully!.`);
          const index = this.contractAttachments.findIndex(
            (logoInfo: Logo) => logoInfo._id === logo._id
          );
          this.contractAttachments.splice(index, 1);
          this.contractAttachments = Helper.deepClone(this.contractAttachments);
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
        this.contractsService
          .uploadContractAttachment(
            this.contractItemId,
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
                this.contractAttachmentsPagination.resetPagination();
                this.loadContractAttachments(
                  this.contractItemId
                );
              }
              this.showsAlertMessage(`${file.fileName} added successfully!.`);
            },
            (errorResponse) => {
              filesInfo.push(file['fileName']);
              if (filesInfo.length === data.files.length) {
                // clear all uploaded file info
                this.clearAttachment$.next(true);
                this.loadContractAttachments(
                  this.contractItemId
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

  private loadContractAttachments(contractItemId, nextPage = false) {
    this.iscontractAttachmentsLoading$.next(true);
    this.contractsService
      .getContractAttachments(
        contractItemId,
        this.contractAttachmentsPagination.getValues()
      )
      .pipe(
        filter((res) => !!res),
        takeUntil(this.unSubscribe)
      )
      .subscribe(
        (response: AttachmentsListResponse) => {
          this.organizationId$.next(contractItemId);
          // After uploading a new logo we are refreshing the list
          this.contractAttachmentsPagination.updateTotal(
            response.pagination.total
          );
          if (nextPage) {
            this.contractAttachments = this.contractAttachments.concat(
              response.result.attachments
            );
          } else {
            this.contractAttachments = Helper.deepClone(
              response.result.attachments
            );
          }
          this.iscontractAttachmentsLoading$.next(false);
          this.cdRef.markForCheck();
        },
        (errorResponse) => {
          this.iscontractAttachmentsLoading$.next(false);
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
    if (this.contractAttachmentsPagination.isPageSizeReachedTotal()) {
      this.iscontractAttachmentsLoading$.next(false);
      this.cdRef.markForCheck();
      return;
    }
    this.contractAttachmentsPagination.moveNextPage();
    this.loadContractAttachments(this.contractItemId, true);
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
