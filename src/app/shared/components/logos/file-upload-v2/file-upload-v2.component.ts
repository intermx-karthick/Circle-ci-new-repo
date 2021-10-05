import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { FileUploadAbstract } from '@shared/components/file-upload/file-upload-abstract';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-file-upload-v2',
  templateUrl: './file-upload-v2.component.html',
  styleUrls: ['./file-upload-v2.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoFileUploadV2Component extends FileUploadAbstract
  implements OnInit, OnDestroy {
  public noFileValidationMessage = false;
  constructor(public cdRef: ChangeDetectorRef) {
    super(cdRef);
  }

  ngOnInit(): void {
    this.clearAttachment$
      ?.pipe(takeUntil(this.unsubscribe$))
      ?.subscribe((flag) => {
        if (flag) {
          this.removeUploadedFilesInfo();
        }
      });

    this.uploadInProgress$
      ?.pipe(takeUntil(this.unsubscribe$))
      ?.subscribe((status) => {
        this.fileUploadStatus = status;
        this.removeUploadedFiles();
        this.cdRef.markForCheck();
      });
  }

  public uploadFiles() {
    this.fileUploadStatus = {};
    this.formateValidationMessage = null;
    this.sizeValidationMessage = null;
    this.files.forEach((file) => {
      this.fileUploadStatus[file] = {
        inProgress: true,
        completed: false
      };
    });
    const data = {
      files: this.fileData,
      status: this.fileUploadStatus
    };   
    this.noFileValidationMessage = (!this.files?.length);      
    this.cdRef.markForCheck();
    this.emitUploadFile.emit(data);
  }

  public removeUploadedFiles() {
    Object.keys(this.fileUploadStatus).forEach((key) => {
      if (!this.fileUploadStatus[key]?.inProgress) {
        this.deleteAttachmentByName(key);
      }
    });
  }

  public removeUploadedFilesInfo() {
    Object.keys(this.fileUploadStatus).forEach((key) => {
      if (!this.fileUploadStatus[key]?.inProgress) {
        this.deleteFileInfoByName(key);
      }
    });
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
