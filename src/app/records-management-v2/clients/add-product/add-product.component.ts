import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject, Input, OnDestroy,
  OnInit,
  Optional,
  SkipSelf
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { FormBuilder, FormControl } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

import { RecordService } from '../../record.service';
import { AssociationsIdentifier, Helper } from '../../../classes';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ClientProductDetailsResponse } from '@interTypes/records-management';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { ProductAssociations } from '@interTypes/associations';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.less'],
  providers: [
    AssociationsIdentifier
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddProductComponent implements OnInit, OnDestroy {

  public submitForm$: Subject<void> = new Subject<void>();
  public formControl = new FormControl([null]);
  public clientDetails: ClientDetailsResponse;
  public productDetails: ClientProductDetailsResponse;
  public scrollContent: any = 332;
  public title = 'ADDING NEW PRODUCT';
  public currentOperation = 'new';
  public operation = Object.seal({
    NEW: 'new',
    DUPLICATE: 'duplicate',
    UPDATE: 'update'
  });

  public scrolling$ = new Subject();
  public organizationId = '';
  constructor(
    private fb: FormBuilder,
    private recordService: RecordService,
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private associationIdentifier: AssociationsIdentifier,
    @Optional() @SkipSelf() private bottomSheetRef: MatBottomSheetRef<AddProductComponent>,
    @Optional() @SkipSelf() @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData: any,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<AddProductComponent>
  ) {

    // only for creating product
    if(this.data?.client){

      let clientBillingAndRevenueData: any = {
        billing: this.data?.client?.billing,
        oohRevenue: this.data?.client?.oohRevenue
      }

      if(this.data.clientAccountingDetails){
        clientBillingAndRevenueData = {
          ...clientBillingAndRevenueData,
          billingCompany: this.data?.clientAccountingDetails?.billingCompany,
          billingContact: this.data?.clientAccountingDetails?.billingContact
        }
      }

      this.writeValue(clientBillingAndRevenueData);
    }
    if (this.dialogData) {
      this.clientDetails = this.dialogData.client;
      this.organizationId = this.clientDetails?.['organizationId'];
      this.productDetails = this.dialogData.product;
      this.writeValue(this.dialogData.product);
      if(this.dialogData.isForUpdate) {
        this.currentOperation = this.operation.UPDATE;
        this.title = `VIEWING ${this.productDetails.productName} DETAILS`;
      }else {
        this.duplicate()
      }
      return;
    }

    this.currentOperation = this.operation.NEW;
    this.clientDetails = this.data?.client;
    this.organizationId = this.clientDetails['organizationId'];
  }

  public ngOnInit(): void {
  }

  public ngOnDestroy() {
  }

  public get isForUpdate() {
    return this.currentOperation === this.operation.UPDATE;
  }

  public close(result = null) {
    if (this.dialogRef) this.dialogRef.close(result);
    if (this.bottomSheetRef) this.bottomSheetRef.dismiss(result);
  }

  public submit() {
    if (this.isForUpdate) {
      this.validateAssociationAndUpdateClientProduct();
    } else {
      this.save();
    }
  }

  public save() {
    if (this.formControl.valid) {
      const payload = this.buildAPIPayload();

      this.recordService.createClientProduct(this.clientDetails?._id, payload).subscribe(
        (res: any) => {
          this.handleSuccessResponse(res, 'Product created successfully!');
        },
        (errorResponse) => {
          this.handleErrorResponse(errorResponse);
        }
      );
    } else {
      this.submitForm$.next();
    }
  }


  public validateAssociationAndUpdateClientProduct(){
    const PATH = `clients/products/${this.productDetails._id}/associations`;
    const dialogData = {
      title: 'Edit Confirmation',
      showIcon: false,
      description: 'This record has already been used on a Campaign or Contract. Please double-check all relationships before editing any critical values.'
    };
    if (this.formControl.valid) {
      this.associationIdentifier.validateAssociationAndCallFunction<ProductAssociations>(PATH, this.update.bind(this), dialogData);
    } else {
      this.submitForm$.next();
    }
  }

  public update() {
    if (this.formControl.valid) {
      const payload = this.buildAPIPayload();

      this.recordService.updateClientProduct(this.clientDetails?._id, this.productDetails._id, payload).subscribe(
        (res: any) => {
          this.handleSuccessResponse(res, 'Product updated successfully!');
        },
        (errorResponse) => {
          this.handleErrorResponse(errorResponse);
        }
      );
    } else {
      this.submitForm$.next();
    }
  }

  public deleteProductAPI() {
    this.dialog
    .open(DeleteConfirmationDialogComponent, {
      width: '340px',
      height: '260px',
      panelClass: 'imx-mat-dialog'
    })
    .afterClosed()
    .subscribe((res) => {
        if (res && res['action']) {
          this.recordService
            .deleteClientProducts(this.clientDetails?._id, this.productDetails._id)
            .subscribe((response: any) => {
              this.handleSuccessResponse(response, 'Product deleted successfully!');
            });
        }
      },
      (errorResponse) => {
        this.handleErrorResponse(errorResponse);
      });
  }

  public delete() {
    console.log('this.productDetails', this.productDetails)
    this.recordService.getProductAssociation(this.productDetails._id)
    .subscribe((response) => {
      if(Object.keys(response?.associations).length > 0) {
        this.openDeleteWarningPopup();
      } else {
        this.deleteProductAPI();
      }
    },
    (errorResponse) => {
      if (errorResponse.error?.message) {
        this.recordService.showsAlertMessage(errorResponse.error?.message);
        return;
      } else if (errorResponse.error?.error) {
        this.recordService.showsAlertMessage(errorResponse.error?.error);
        return;
      }
      this.recordService.showsAlertMessage('Something went wrong, Please try again later');
    });
  }

  public openDeleteWarningPopup() {
    const dialogueData = {
      title: 'Attention',
      description: 'Please <b>Confirm</b> This record has already been used on a Campaign or Contract. Please double-check all relationships before deleting.',
      confirmBtnText: 'OK',
      cancelBtnText: 'CANCEL',
      displayCancelBtn: false,
      displayIcon: true
    };
    this.dialog.open(NewConfirmationDialogComponent, {
      data: dialogueData,
      width: '490px',
      height: '260px',
      panelClass: 'imx-mat-dialog'
    }).afterClosed().pipe(
      map(res => res?.action)
    ).subscribe(flag => {

    });
  }

  public duplicate() {
    this.currentOperation = this.operation.DUPLICATE;
    this.title = `DUPLICATE ${this.productDetails.productName}`;
    this.writeValue({
      ...this.productDetails,
      productName: ''
    });
  }

  private buildAPIPayload() {
    let formValue =  this.formControl.value;

    const payload = Helper.deepClone(formValue);
    if (!payload) return null;

    if (payload.billingCompany) {
      payload.billingCompany = payload.billingCompany?.['_id'];
    }
    if (payload.billing?.media) {
      payload.billing['media'] = Number(payload.billing?.media);
    }
    if (payload.oohRevenue?.media) {
      payload.oohRevenue['media'] = Number(payload.oohRevenue?.media);
    }
    return Helper.removeEmptyArrayAndEmptyObject(payload);
  }

  public reSize() {
    if (this.currentOperation !== this.operation.NEW) {
      this.scrollContent = 332;
    }
  }

  public handleSuccessResponse(response, message) {
    if (response.status === 'success') {
      this.recordService.showsAlertMessage(message);
      this.close(response);
    }
  }

  public handleErrorResponse(errorResponse) {
    if (errorResponse.error?.message) {
      this.recordService.showsAlertMessage(errorResponse.error?.message);
      return;
    }
    this.recordService.showsAlertMessage('Something went wrong, Please try again later');
  }

  public writeValue(clientProduct: ClientProductDetailsResponse | any): void {

    if (!clientProduct) return;

    let selectedCompany = null;
    if (clientProduct.billingCompany) {
      selectedCompany = clientProduct.billingCompany;
    }

    this.formControl.patchValue({
      productName: clientProduct.productName ?? '',
      productCode: clientProduct.productCode ?? null,
      billingCompany: selectedCompany,
      billingContact: clientProduct.billingContact?._id ?? null,
      billing: {
        feeBasis: clientProduct.billing?.feeBasis?._id ?? null,
        media: clientProduct.billing?.media ?? null,
        commissionBasis: clientProduct.billing?.commissionBasis?._id ?? null
      },
      oohRevenue: {
        feeBasis: clientProduct.oohRevenue?.feeBasis?._id ?? null,
        media: clientProduct.oohRevenue?.media ?? null,
        commissionBasis: clientProduct.oohRevenue?.commissionBasis?._id ?? null
      },
      oiProduct: clientProduct?.oiProduct ?? false,
    });
  }

  public handleScroll(){
    this.scrolling$.next();
  }

}
