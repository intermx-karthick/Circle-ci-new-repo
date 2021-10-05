import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  Optional,
  ChangeDetectorRef,
  SkipSelf, OnDestroy
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import {  FormBuilder, FormControl } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { BehaviorSubject, Subject } from 'rxjs';
import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

import { RecordService } from '../../record.service';
import { AssociationsIdentifier, Helper } from '../../../classes';
import { ClientEstimateDetailsResponse } from '@interTypes/records-management/clients/client-estimate-details.response';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { ProductAssociations } from '@interTypes/associations';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
import { map } from 'rxjs/operators';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';

@Component({
  selector: 'app-add-estimate',
  templateUrl: './add-estimate.component.html',
  styleUrls: ['./add-estimate.component.less'],
  providers: [
    AssociationsIdentifier
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEstimateComponent implements OnInit, OnDestroy {

  public submitForm$: Subject<void> = new Subject<void>();
  public formControl = new FormControl([null]);
  public clientId: string;
  public estimateDetails: ClientEstimateDetailsResponse;
  public scrollContent: any = 332;
  public title = 'ADDING NEW ESTIMATE';
  public currentOperation = 'new';
  public operation = Object.seal({
    NEW: 'new',
    DUPLICATE: 'duplicate',
    UPDATE: 'update'
  });
  public client: ClientDetailsResponse;
  public unTouchedValue$ = new BehaviorSubject(null);

  constructor(
    private fb: FormBuilder,
    private recordService: RecordService,
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private associationIdentifier: AssociationsIdentifier,
    @Optional() @SkipSelf() private bottomSheetRef: MatBottomSheetRef<AddEstimateComponent>,
    @Optional() @SkipSelf() @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData: any,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<AddEstimateComponent>
  ) {

    if (this.dialogData) {
      this.clientId = this.dialogData.clientId;
      this.estimateDetails = Helper.deepClone(this.dialogData.estimate);
      this.title = `VIEWING ${this.estimateDetails.estimateName} DETAILS`;
      this.formControl.patchValue({ ...this.dialogData.estimate });
      this.currentOperation = this.operation.UPDATE;
      this.client = this.dialogData?.client;

      if(this.dialogData?.isDuplicate){
        this.duplicate();
      }
      return;
    }

    this.client = this.data?.client;
    this.currentOperation = this.operation.NEW;
    this.clientId = this.data?.clientId;
  }

  public ngOnInit(): void {
  }

  public ngOnDestroy() {
    this.unTouchedValue$.unsubscribe();
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
      this.validateAssociationAndUpdateClientEstimate();
    } else {
      this.save();
    }
  }


  public validateAssociationAndUpdateClientEstimate(){
    const PATH = `clients/estimates/${this.estimateDetails._id}/associations`;
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

  public save() {
    if (this.formControl.valid) {
      const payload = this.buildAPIPayload();

      if(!this.isAvailableAtleastOneEstimateSet(payload)) return;

      this.recordService.createClientEstimate(this.clientId, payload).subscribe(
        (res: any) => {
          this.handleSuccessResponse(res, 'Estimate created successfully!');
        },
        (errorResponse) => {
          this.handleErrorResponse(errorResponse);
        }
      );
    } else {
      this.submitForm$.next();
    }
  }


  public update() {
    if (this.formControl.valid) {
      const payload = this.buildAPIPayload();

      if(!this.isAvailableAtleastOneEstimateSet(payload)) return;

      this.recordService.updateClientEstimate(this.clientId, this.estimateDetails._id, payload).subscribe(
        (res: any) => {
          this.handleSuccessResponse(res, 'Estimate updated successfully!');
        },
        (errorResponse) => {
          this.handleErrorResponse(errorResponse);
        }
      );
    } else {
      this.submitForm$.next();
    }
  }

  public deleteEstimateAPI() {
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
            .deleteClientEstimate(this.clientId, this.estimateDetails._id)
            .subscribe((response: any) => {
              this.handleSuccessResponse(response, 'Estimate deleted successfully!');
            });
        }
      },
      (errorResponse) => {
        this.handleErrorResponse(errorResponse);
      });
  }
  public delete() {
    this.recordService.getClientEstimateAssociation(this.estimateDetails._id)
    .subscribe((response) => {
      if(Object.keys(response?.associations).length > 0) {
        this.openDeleteWarningPopup();
      } else {
        this.deleteEstimateAPI();
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
    this.title = `DUPLICATE ${this.estimateDetails.estimateName}`;

    this.formControl.patchValue({
      ...this.estimateDetails,
      estimateName: ''
    });
  }

  private buildAPIPayload() {
    const payload = Helper.deepClone(this.formControl.value);
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
    if (payload.product?._id) {
      payload['product'] = payload.product?._id;
    }
    if (payload.billing?.feeBasis?._id) {
      payload['billing']['feeBasis'] = payload.billing?.feeBasis?._id;
    }
    if (payload.billing?.commissionBasis?._id) {
      payload['billing']['commissionBasis'] = payload.billing?.commissionBasis?._id;
    }
    if (payload.oohRevenue?.feeBasis?._id) {
      payload['oohRevenue']['feeBasis'] = payload.oohRevenue?.feeBasis?._id;
    }
    if (payload.oohRevenue?.commissionBasis?._id) {
      payload['oohRevenue']['commissionBasis'] = payload.oohRevenue?.commissionBasis?._id;
    }
    try {
      if (payload.estimate) {
        payload.estimate.forEach((estimateEntry) => {
          Helper.removeEmptyOrNull(estimateEntry)
          if (estimateEntry.startDate) {
            estimateEntry.startDate = format(new Date(estimateEntry.startDate), 'MM/dd/yyyy', {
              locale: enUS
            });
          }

          if (estimateEntry.endDate) {
            estimateEntry.endDate = format(new Date(estimateEntry.endDate), 'MM/dd/yyyy', {
              locale: enUS
            });
          }
        });
      }
    } catch (e) {
      console.log(e);
    }

    return Helper.removeEmptyArrayAndEmptyObject(Helper.removeEmptyOrNull(payload));
  }

  public reSize() {
    if (this.currentOperation !== this.operation.NEW) {
      this.scrollContent = window.innerHeight - 300;
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

  public get estimationsCount() {
    const estimateCount = (this.formControl?.value.estimate as Array<any>)?.length;
    if (estimateCount > 1) {
      this.scrollContent = window.innerHeight - 300;
    } else {
      this.scrollContent = 332;
    }
    return estimateCount;
  }

  public get formBlockStyles() {
    return {
      'max-height': !this.estimateDetails &&  this.estimationsCount > 1 ? 'calc(100vh - 368px)' : '' + this.scrollContent + 'px',
      'height': !this.estimateDetails && this.estimationsCount > 1 ? 'calc(100vh - 368px)' : 'auto'
    };
  }

  public isAvailableAtleastOneEstimateSet(payload){

     if(payload) {
       for (let estimate of payload.estimate){

         if(estimate.startDate && estimate.endDate && estimate.etimateId){
           return  true;
         }
       }
     }

     return false;
  }
}
