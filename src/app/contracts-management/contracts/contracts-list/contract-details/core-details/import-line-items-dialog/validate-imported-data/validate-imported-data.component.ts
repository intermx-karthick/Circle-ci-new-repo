import { Component, EventEmitter, Output } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { ImportLineItemsSteps } from "app/contracts-management/contracts/contracts-shared/helpers/import-line-items-steps.enum";

@Component({
  selector: 'app-validate-imported-data',
  templateUrl: 'validate-imported-data.component.html',
  styleUrls: ['validate-imported-data.component.less']
})
export class ValidateImportedDataComponent {
  importedDataForm = new FormBuilder();
  formFields: ImportedDataValidateFormFileld[] = [
    { id: '1', value: 'column name'}
  ]

  @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();
  @Output() statusChanged: EventEmitter<ImportLineItemsSteps> = new EventEmitter<ImportLineItemsSteps>();
  
  next() {
    this.statusChanged.emit(ImportLineItemsSteps.lineItemsValidationFromImportedDataFinished);
  }
}

export interface ImportedDataValidateFormFileld {
  id: string;
  value?: string;
}