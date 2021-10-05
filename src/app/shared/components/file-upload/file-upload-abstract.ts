import { Output, EventEmitter, ChangeDetectorRef, Input, Directive } from '@angular/core';
import { FileUploadConfig } from '@interTypes/file-upload';
import { Subject } from 'rxjs';

/**
 * @description
 *  This abstract class used to upload the single or multiple files
 */

@Directive()
export class FileUploadAbstract {
  @Output() public emitUploadFile = new EventEmitter();
  @Input() public fileUploadConfig: FileUploadConfig;
  @Input() public uploadButtonPrimary = false;
  @Input() clearAttachment$: Subject<boolean>;
  @Input() uploadInProgress$: Subject<any[]>;
  @Input() label = 'Upload Related Files';
  public fileUploadStatus = {};
  // Need to set below true variable if we have separate upload button
  @Input() disableDirectFileEmit = false;
  @Input() mainTitle = 'Upload Logos here';
  public fileData: any = [];
  public files: any = [];
  public attachmentName = 'attachment';
  public formatWorngFiles = [];
  public sizeLimitFiles = [];
  public formateValidationMessage = null;
  public sizeValidationMessage = null;
  public noFileValidationMessage = false;
  public unsubscribe$: Subject<void> = new Subject<void>();

  constructor(public cdRef: ChangeDetectorRef) {}

  /**
   * This function call once file selected, Here checking Allow all file format or specific types based on configuration.
   * @param event File upload
   */
  public uploadFile(event) {
    let files = [];
    if (event?.target?.files) {
      files = [...event.target.files];
      event.target.value = '';
    } else if (event?.length){
      files = [...event];
    }

    this.noFileValidationMessage = false;
    // We need to reset input value to empty to make user to select same file if it is removed by mistake
    this.cdRef.markForCheck();
    this.sizeLimitFiles = [];
    this.formatWorngFiles = [];
    const fileTypes = this.fileUploadConfig?.acceptedFormats ?? [];
    // If fileTypes length is zero means we we have to all types
    this.formatValidationMessages();
    if (fileTypes.length === 0) {
      files.forEach((element) => {
        this.fileUploadData(element);
      });
    } else {
      files.forEach((element) => {
        if (fileTypes.includes(element.name.split('.').pop().toLowerCase())) {
          this.fileUploadData(element);
        } else {
          this.formatWorngFiles.push(element.name);
          this.formatValidationMessages();
        }
      });
    }
  }

  /**
   * This function used to be checked the file size limit, formats & file upload duplication
   * @param fileData selecetd file data
   */

  private fileUploadData(fileData) {
    // Check file size limit
    const sizeLimit = this.fileUploadConfig?.sizeLimit ?? 0;
    // If sizeLimit is zero means we have to allow all size
    if (sizeLimit === 0) {
      if (
        !this.files.includes(fileData.name) &&
        this.fileUploadConfig.acceptMulitpleFiles
      ) {
        this.fileUpload(fileData);
      } else if (this.files.length < 1) {
        this.fileUpload(fileData);
      }
    } else {
      if (
        !this.files.includes(fileData.name) &&
        this.fileUploadConfig.acceptMulitpleFiles
      ) {
        this.fileUploadTypeValidation(fileData);
      } else if (this.files.length < 1) {
        this.fileUploadTypeValidation(fileData);
      }
    }
  }

  /**
   * This function used to verify the uploaded file size
   * @param fileData sleccted file data
   */

  private fileUploadTypeValidation(fileData) {
    const fileSize = Number(this.fileUploadConfig.sizeLimit);
    //1048576 - 1MB
    if (fileData.size < 1048576 * fileSize) {
      this.fileUpload(fileData);
    } else {
      this.sizeLimitFiles.push(fileData.name);
      this.formatValidationMessages();
    }
  }

  /**
   * This function used selecetd file make as a formdata
   * @param filedata selected file
   */

  private fileUpload(filedata) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const formData = new FormData();
      formData.append(this.attachmentName, filedata);
      this.setFileInfo({
        fileFormData: formData,
        fileName: filedata.name,
        fileType: filedata.type
      });
    };
    reader.readAsDataURL(filedata);
    this.files.push(filedata.name);
  }

  public setFileInfo(data) {
    this.fileData.push(data);
    if (!this.disableDirectFileEmit) {
      this.emitUploadFile.emit(this.fileData);
    }
  }

  /**
   * This function used to set the format validation message & size validation message
   */

  private formatValidationMessages() {
    this.sizeValidationMessage = null;
    if (this.sizeLimitFiles.length) {
      const sizeMessage =
        this.fileUploadConfig?.sizeValidationMessage ??
        'File size should be less than';
      this.sizeValidationMessage = `${sizeMessage}-${
        this.fileUploadConfig.sizeLimit
      }MB - ${this.sizeLimitFiles.join(', ')}`;
    }

    this.formateValidationMessage = null;
    if (this.formatWorngFiles.length) {
      const sizeMessage =
        this.fileUploadConfig?.formatValidationMessage ??
        'We are not supporting this file format';
      const fileTypes = this.fileUploadConfig?.acceptedFormats ?? [];
      let extMsg = '';
      if (fileTypes.length > 1) {
        extMsg = `File extension should be any of ${fileTypes.join(', ')}`;
      } else {
        extMsg = `File extension should be ${fileTypes.join(', ')}`;
      }
      this.formateValidationMessage = `${sizeMessage} - ${this.formatWorngFiles.join(
        ', '
      )} <br> ${extMsg}`;
    }
  }

  /**
   *
   * @param index Remove the seleccted file using index.
   */

  public deleteAttachment(index) {
    this.files.splice(index, 1);
    this.fileData.splice(index, 1);
    if (!this.disableDirectFileEmit) {
      this.emitUploadFile.emit(this.fileData);
    }
  }

  public clearAttachment() {
    this.files = [];
    this.fileData = [];
    this.cdRef.detectChanges();
  }

  public deleteAttachmentByName(name) {
    const index = this.files.findIndex((file) => file === name);
    this.files.splice(index, 1);
  }

  public deleteFileInfoByName(name) {
    const dataIndex = this.fileData.findIndex((file) => file.fileName === name);
    this.fileData.splice(dataIndex, 1);
  }
}
