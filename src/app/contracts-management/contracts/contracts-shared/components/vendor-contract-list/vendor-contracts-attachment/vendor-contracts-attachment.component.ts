import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnInit
} from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Logo } from '@interTypes/records-management';
import { UseRecordPagination } from '../../../../../../records-management-v2/useRecordPagination';
import { ContractsService } from '../../../../../services/contracts.service';
import { AbstractAttachmentsComponent } from '@shared/components/logos/abstract-attachments.component';
import { map } from 'rxjs/operators';
import { FileUploadConfig } from '@interTypes/file-upload';

export interface VendorContractInfo {
  contractId: string;
  id: string;
  vendor: any[];
  parentVendor: any[];
  vendorRep: any[];
}

@Component({
  selector: 'app-vendor-contracts-attachment',
  templateUrl: './vendor-contracts-attachment.component.html',
  styleUrls: ['./vendor-contracts-attachment.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorContractsAttachmentComponent
  extends AbstractAttachmentsComponent
  implements OnInit {
  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: true,
    acceptedFormats: ['pdf', 'xlsx', 'xls', 'gif', 'jpg', 'png', 'jpeg', 'svg'],
    sizeLimit: 10,
    displayFileHint: true
  };
  
  private _vendorContractInfo: VendorContractInfo;
  set vendorContract(info: VendorContractInfo) {
    this._vendorContractInfo = info;
    this.organizationId$.next(info?.contractId);
    this.organisationId = info?.contractId;
  }

  get vendorContract(){
    return this._vendorContractInfo;
  }

  public _mainTitle = '';
  public isUploadSignedContract = false;
  public get mainTitle() {
    return this._mainTitle;
  }
  public set mainTitle(contractId: string) {
    this._mainTitle = `Upload Signed Contract ${contractId}`;
  }

  public updateCaptionAPIFunc = (attachmentId, logoKey, captionName) =>
    this.contractService.updateVendorContractAttachment(
      this.vendorContract.contractId,
      attachmentId,
      captionName,
      this.vendorContract.parentVendor.map(vendor => vendor._id),
      this.vendorContract.vendor.map(vendor => vendor._id),
      this.vendorContract.vendorRep ? [this.vendorContract.vendorRep[0].primary?._id] : []
    );

  constructor(
    public contractService: ContractsService,
    public matSnackBar: MatSnackBar,
    public cdRef: ChangeDetectorRef,
    public dialogRef: MatDialogRef<VendorContractsAttachmentComponent>,
    @Inject(MAT_DIALOG_DATA) dialogData: any
  ) {
    super(matSnackBar, cdRef);
    this.mainTitle = dialogData?.vendorContract?.contract?.contractId;
    this.isUploadSignedContract = (dialogData?.isUploadSigned);
    this.vendorContract = {
      contractId: dialogData?.vendorContract?.contract?._id,
      id: dialogData?.vendorContract?._id,
      vendor: dialogData?.vendorContract?.vendor,
      parentVendor: dialogData?.vendorContract?.parentVendor,
      vendorRep: dialogData?.vendorContract?.vendorRep
    };
  }

  public ngOnInit(): void {
    this.loadAttachments();
  }

  public deleteAttachmentsAPI<T>(logo: Logo): Observable<T> {
    return this.contractService.deleteVendorContractAttachment(
      this._vendorContractInfo.contractId,
      logo._id,
      logo.key
    );
  }

  public getAttachmentsAPI<T>(pagination: UseRecordPagination): Observable<T> {
    return this.contractService
      .getVendorContractAttachments(
        this._vendorContractInfo.contractId,
        pagination,
        this.vendorContract.parentVendor.map(vendor => vendor._id),
        this.vendorContract.vendor.map(vendor => vendor._id),
        this.vendorContract.vendorRep ? [this.vendorContract.vendorRep[0].primary?._id] : []
      )
      .pipe(
        map((res: any) => {
          return {
            pagination: res?.pagination,
            result: {
              attachments: res?.results ?? []
            }
          } as any;
        })
      );
  }

  public uploadAttachmentsAPI(file: any): Observable<any> {
    return this.contractService.uploadVendorContractAttachment(
      this._vendorContractInfo.contractId,
      file,
      this.vendorContract.parentVendor.map(vendor => vendor._id),
      this.vendorContract.vendor.map(vendor => vendor._id),
      this.vendorContract.vendorRep ? [this.vendorContract.vendorRep[0].primary?._id] : []
    );
  }
}
