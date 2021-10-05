import { ChangeDetectorRef, Component, EventEmitter, Output } from "@angular/core";
import { FileUploadConfig } from "@interTypes/file-upload";
import { ImportLineItemsSteps } from "app/contracts-management/contracts/contracts-shared/helpers/import-line-items-steps.enum";
import { ContractsService } from "app/contracts-management/services/contracts.service";
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-upload-line-items',
  templateUrl: 'upload-line-items.component.html',
  styleUrls: ['upload-line-items.component.less']
})
export class UploadLineItemsComponent {
  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: false,
    acceptedFormats:['csv'],
    displayFileHint: false
  };
  public isSampleCSVDownload = false;
  public noFileValidationMessage = false;
  @Output() statusChanged: EventEmitter<ImportLineItemsSteps> = new EventEmitter<ImportLineItemsSteps>();
  @Output() uploadFileEmit: EventEmitter<any> = new EventEmitter<any>();
  @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

  constructor(private contractService: ContractsService, private cdRef:ChangeDetectorRef) {}
  private fileData: any;

  uploadedFile(files) {
    this.noFileValidationMessage = false;
    this.fileData = files;
  }

  next() {
    if(this.fileData?.length){
      this.noFileValidationMessage = false;
      this.uploadFileEmit.emit(this.fileData);
      //this.statusChanged.emit(ImportLineItemsSteps.lineItemsUploadFinished)
    }else{
      this.noFileValidationMessage = true;
    }
  }
  public downloadSampleCSV() {
    this.isSampleCSVDownload = true;
    this.contractService.getLineItemsSampleCSV(true).subscribe(
      (res) => {
        this.isSampleCSVDownload = false;
        saveAs(res.body, 'lineItemSample.csv');
        this.cdRef.markForCheck();
      },
      (error) => {
        this.isSampleCSVDownload = false;
        this.contractService._showsAlertMessage( 'There is a problem generating the file. Please try again later.');
        this.cdRef.markForCheck();
      }
    );
  }
}