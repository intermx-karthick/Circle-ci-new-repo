import { ChangeDetectorRef, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ContractPreviewComponent } from '../../../contract-preview/contract-preview.component';
import { VendorContractResult } from '@interTypes/contracts/vendor-contracts.response';

@Injectable()
export class ContractPreviewService {

  public isLoadingPreviewAPI = false;
  public previewData: any = {};

  constructor(
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
  ) {}

  public previewContractDetails(contractDetails) {
    if (contractDetails?.['contract']?.['_id'] && contractDetails['_id']) {
      const _contractId = contractDetails?.['contract']?.['_id'];
      const _typeId = contractDetails['_id'];
      const singleItemCheckbox = contractDetails?.['singleItemPerPage'];
      this.isLoadingPreviewAPI = true;
      const hideLoader = contractDetails?.['hideCommonLoader'];
      const sortParam = contractDetails?.['sorting'] ?? {};

      const params = {
        _contractId: _contractId,
        _typeId: _typeId,
        singleItemCheckbox: singleItemCheckbox,
        contractId: _contractId,
        vendorId: _typeId.contractVendor ?? _typeId?.vendorId ?? null,
        hideLoader: hideLoader,
        sortParam:sortParam,
        contractDetails: contractDetails
      };
      this.previewData = params;
      this.openPreviewDialog(params);
    }
  }

  private openPreviewDialog(data) {
    this.isLoadingPreviewAPI = false;
    this.cdRef.markForCheck();
    this.dialog
      .open(ContractPreviewComponent, {
        height: '100%',
        width: '75%',
        maxWidth: '1698px',
        data: data,
        disableClose: true,
        backdropClass:'contract-preview-dialog-backdrop',
        panelClass: ['imx-mat-dialog', 'contract-preview-dialog-container']
      })
      .afterClosed()
      .subscribe((value) => {});
  }

  /**
   * Copy the contact ventor preview
   */
   public copyUrl(contractDetails:VendorContractResult) {
     let URL = `${location.origin}/contracts-management/contracts/${contractDetails?.contract?._id}?preview=${contractDetails?.contract?._id}`;
     if (contractDetails['singleItemPerPage']) {
       URL += `&previewType=single`;
     }

     if (contractDetails.parentVendor?.length > 0) {
       URL += `&parentVendors=${contractDetails?.parentVendor.map(vendor => vendor._id).join(',')}`;
     } 
    //  else if (contractDetails?._id?.contractVendor) {
    //    URL += `&parentVendors=${contractDetails?._id?.contractVendor}`;
    //  }

     if (contractDetails?.vendor?.length > 0) {
       URL += `&vendor=${contractDetails?.vendor.map(vendor => vendor._id).join(',')}`;
     }

     if (contractDetails?.vendorRep?.length > 0) {
       URL += `&vendorRep=${contractDetails?.vendorRep[0].primary?._id}`;
     } else if (contractDetails?._id?.vendorContractRep) {
       URL += `&vendorRep=${contractDetails?._id?.vendorContractRep}`;
     }

     if (contractDetails?.vendorRep?.[0]?.secondary?._id) {
       URL += `&vendorSecReps=${contractDetails.vendorRep[0].secondary._id}`;
     }

     if (contractDetails?.displayVendor) {
       URL += `&displayVendor=${contractDetails.displayVendor}`;
     }
     return URL;
  }

}
