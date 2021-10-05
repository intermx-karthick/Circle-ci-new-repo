import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FieldsMappingComponent } from '@shared/components/fields-mapping/fields-mapping.component';
import { Helper } from 'app/classes';
import { ImportLineItemsSteps } from 'app/contracts-management/contracts/contracts-shared/helpers/import-line-items-steps.enum';
import { ContractsService } from 'app/contracts-management/services/contracts.service';
import { of } from 'rxjs';
import { catchError, filter, observeOn, switchMap } from 'rxjs/operators';
import { Contract } from '@interTypes/contract';

@Component({
  selector: 'import-line-items-dialog',
  templateUrl: 'import-line-items-dialog.component.html',
  styleUrls: ['import-line-items-dialog.component.less']
})
export class ImportLineItemsDialogComponent {

  public readonly importLineItemsSteps = ImportLineItemsSteps;
  public currentImportStep: ImportLineItemsSteps;
  public progressBarValue: number;
  public isFileValidate = false;

  public mappingDecisionsRes;
  public lineItemDataImportTypeEnum = Object.freeze({
    SKIP: 'skip',
    DELETE: 'delete'
  });
  public lineItemDataImportType = this.lineItemDataImportTypeEnum.SKIP;
  public contract: Contract;
  public validateProcessText = 'Validating File';


  constructor(
    public dialogRef: MatDialogRef<ImportLineItemsDialogComponent>,
    private contractService: ContractsService, private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentImportStep = ImportLineItemsSteps.lineItemsUpload;
    this.contract = data.contract;
    if (
      this.data.dialogStatus ===
      ImportLineItemsSteps.lineItemsValidationFromImports
    ) {
      this.lineItemDataImportType = this.lineItemDataImportTypeEnum.DELETE;
      this.dialogRef.addPanelClass('app-import-line-item-validate-imports');
      this.currentImportStep = ImportLineItemsSteps.lineItemsValidationFromImports;
    }
  }

  onCloseDialog(imported=false): void {
    this.dialogRef.close({'success':imported});
  }

  onStatusChanged(nextStep: ImportLineItemsSteps, mappingDecisionsRes = null) {
    this.dialogRef.removePanelClass('app-import-line-item-validate-imports');
    switch (nextStep) {
      case ImportLineItemsSteps.lineItemsUploadFinished: {
        this.currentImportStep = ImportLineItemsSteps.lineItemsServerValidation;
        this.validateiFile(ImportLineItemsSteps.lineItemsValidationFromImportedData);

        break;
      }
      case ImportLineItemsSteps.lineItemsValidationFromImportedData: {
        this.currentImportStep = ImportLineItemsSteps.lineItemsValidationFromImportedData;

        break;
      }
      case ImportLineItemsSteps.lineItemsValidationFromImportedDataFinished: {
        this.currentImportStep = ImportLineItemsSteps.lineItemsServerValidation;
        this.validateiFile(ImportLineItemsSteps.lineItemsValidationFromImports);
        break;
      }
      case ImportLineItemsSteps.lineItemsValidationFromImportsFinished: {
        this.onCloseDialog(true);
        break;
      }
      case ImportLineItemsSteps.lineItemsValidationFromImports: {
        this.lineItemDataImportType = this.lineItemDataImportTypeEnum.SKIP;
        this.mappingDecisionsRes = mappingDecisionsRes;
        this.dialogRef.addPanelClass('app-import-line-item-validate-imports');
        this.currentImportStep = ImportLineItemsSteps.lineItemsValidationFromImports;
        break;
      }
    }
  }

  validateiFile(nextStep: ImportLineItemsSteps) {
    this.progressBarValue = 0;

    let interval = setInterval(() => {
      this.progressBarValue += 10;

      if (this.progressBarValue >= 100) {
        clearInterval(interval);

        this.onStatusChanged(nextStep);
      }
    }, 200);
  }

  public onUploadFile(emitFile) {
    this.isFileValidate = true;
    this.currentImportStep = ImportLineItemsSteps.lineItemsServerValidation;
    this.contractService.uploadLineItemsCSV(this.data?.['contractId'], emitFile[0].fileFormData, true).subscribe(res => {
      this.validateProcessText = 'Validating Fields';
      this.isFileValidate = false;
      this.currentImportStep = ImportLineItemsSteps.lineItemsServerValidationFinished;
      this.dialog
        .open(FieldsMappingComponent, {
          disableClose: true,
          panelClass: 'custom-field-mapping',
          data: {
            dbFields: res['dbColumns'],
            fileHeaders: res['csvHeaders'],
            uploadFrom: 'contractLineItem',
            title: 'Validating Line item from Imported Data',
            leftHeading: 'System column header',
            rightHeading: 'Imported column header'
          }
        })
        .afterClosed()
        .pipe(
          filter((mappingsInfo) => {
            if(mappingsInfo?.mappings){
              return mappingsInfo;
            }
            this.onCloseDialog();
          }),
          switchMap((mappingsInfo): any => {
            this.currentImportStep = ImportLineItemsSteps.lineItemsServerValidation;
            this.isFileValidate = true;
            let mappingFields = JSON.stringify(mappingsInfo['mappings']);
            // Formating object keys based on API payload
            mappingFields = mappingFields.replace(/dest_key/g, 'destKey');
            mappingFields = mappingFields.replace(/source_key/g, 'sourceKey');
           const mappingFieldsData = JSON.parse(mappingFields)?.filter(key=>key.sourceKey != "");
            const payLoad = {
              key: res?.['key'],
              mappings: mappingFieldsData
            };
            return this.contractService.lineItemsCsvFieldsMapping(res?.['contractId'], payLoad, true);
          }), catchError((error) => {
            this.contractService._showsAlertMessage(error?.error?.message ||
              'Oops! Something went wrong, please try again.');
              this.isFileValidate = false;
            return of(error);
          })
        ).subscribe(mapRes => {
          this.isFileValidate = false;
          if(mapRes?.error){
            this.currentImportStep = ImportLineItemsSteps.lineItemsUpload;
          }else if(mapRes?.validatedRecords?.[0]){
            this.currentImportStep = ImportLineItemsSteps.lineItemsValidationFromImports;
            this.mappingDecisionsRes = mapRes;
            this.dialogRef.addPanelClass('app-import-line-item-validate-imports');
          }else if(mapRes?.status == 'success'){
            this.contractService._showsAlertMessage(mapRes?.message ||
              'Line item(s) imported successfully');
              this.onCloseDialog(true);
          }
      });
    }, error => {
      this.isFileValidate = false;
      this.onCloseDialog(false);
      this.contractService._showsAlertMessage(error?.error?.message ||
        'Oops! Something went wrong, please try again.');
    });
  }

}
