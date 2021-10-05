import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs/operators';

import { ContractsService } from '../../../../services/contracts.service';
import { EditingContractComponent } from '../../../../editing-contract/editing-contract.component';
import { VendorContractsAttachmentComponent } from './vendor-contracts-attachment/vendor-contracts-attachment.component';
import { VendorContractResult } from '@interTypes/contracts/vendor-contracts.response';

@Injectable()
export class VendorContractAction {
  contractId: string;

  constructor(
    private contractService: ContractsService,
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
  }

  public copyToClipboard(vendorContract: VendorContractResult, url = '') {
    const routeURL = url != '' ? url : this.router.url;
    let URL = `${location.origin}${routeURL}?preview=${vendorContract.contract._id}`;

    if (vendorContract?.parentVendor?.length > 0) {
      URL += `&parentVendors=${vendorContract.parentVendor.map(vendor => vendor._id).join(',')}`;
    } 
    // else if (vendorContract?._id?.contractVendor) {
    //   URL += `&parentVendors=${vendorContract?._id?.contractVendor}`;
    // }
    
    if(vendorContract?.vendor?.length > 0) {
      URL+= `&vendor=${vendorContract.vendor.map(vendor => vendor._id).join(',')}`;
    }
    
    if (vendorContract?.vendorRep?.length > 0) {
      URL += `&vendorRep=${vendorContract.vendorRep[0].primary?._id}`;
    } else if (vendorContract?._id?.vendorContractRep) {
      URL += `&vendorRep=${vendorContract?._id?.vendorContractRep}`;
    }
    
    if (vendorContract?.vendorRep?.[0]?.secondary?._id) {
      URL += `&vendorSecReps=${vendorContract.vendorRep[0].secondary._id}`;
    }

    if(vendorContract?.displayVendor) {
      URL+= `&displayVendor=${vendorContract.displayVendor}`;
    }
    
    this.clipboard.copy(URL);
    const message = `Vendor Contract URLs copied to your Clipboard`;
    this.showAlertMessage(message);
  }

  public downloadLatestUploadedFile(vendorContract) {
    this.contractService
      .getLatestAttachmentOfVendorContract(
        this.contractId,
        vendorContract.parentVendor.map(vendor => vendor._id),
        vendorContract.vendor.map(vendor => vendor._id),
        vendorContract.vendorRep ? [vendorContract.vendorRep[0].primary?._id] : []
      )
      .pipe(
        map((res: any) => {
          return Array.isArray(res.results) && res.results[0];
        })
      )
      .subscribe((res) => {
        const anchorEl = document.createElement('a');
        anchorEl.href = res.url;
        anchorEl.target = '_blank';
        anchorEl.download = res.name;
        document.body.appendChild(anchorEl);
        anchorEl.click();
        document.body.removeChild(anchorEl);
      });
  }

  public openEditContract(vendorContract) {
    this.dialog
      .open(EditingContractComponent, {
        width: '99vw',
        maxWidth: '99vw',
        id: 'edit-vendor-contract',
        data: { vendorContract },
        height: '86vh',
        maxHeight: '100vh',
        panelClass: 'c-edit-contract-panel-class'
      })
      .afterClosed()
      .subscribe(() => {
        // do after dialog closed
      });
  }

  public openUploader(element, callback = null) {
    this.dialog
      .open(VendorContractsAttachmentComponent, {
        data: { vendorContract: element, isUploadSigned:true },
        height: '31.75rem',
        id: 'vc-uploader',
        width: '54.375rem',
        panelClass: 'c-vendor-contracts-attachment-panel-class'
      })
      .afterClosed()
      .subscribe((result) => {
        if(callback) {
          callback(result)
        }
      });
  }


  private showAlertMessage(message: string) {
    this.snackBar.open(message, '', {
      duration: 3000
    });
  }
}
