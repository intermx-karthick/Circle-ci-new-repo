import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { ImportLineItemsSteps } from 'app/contracts-management/contracts/contracts-shared/helpers/import-line-items-steps.enum';
import { FormControl, Validators } from '@angular/forms';
import {
  ChangedField,
  LineItemTerminologyPayload
} from '@interTypes/contracts/line-item-terminology.payload';
import { ContractLineItemsService } from '../../../../../../services/contract-line-items.service';
import { filter, tap } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import {
  ValidatedRecord,
  ValidateField
} from '@interTypes/contracts/latest-line-item-mapping.response';
import { usDateFormatValidator } from '@shared/common-function';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-validating-data-from-imports',
  templateUrl: 'validating-data-from-imports.component.html',
  styleUrls: ['validating-data-from-imports.component.less']
})
export class ValidatingDataFromImportsComponent implements OnInit, OnChanges {
  @Input() type = 'skip';
  @Input() mappingDecisionsRes;
  @Input() contractId = '';
  @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();
  @Output()
  public statusChanged: EventEmitter<ImportLineItemsSteps> = new EventEmitter<ImportLineItemsSteps>();
  public title = 'Validating Data from Imports';
  public dialogType = Object.freeze({
    SKIP: 'skip',
    DELETE: 'delete'
  });
  public deleteHeaderCheckBox = false;
  public deleteHeaderCheckBoxIntermediate = false;
  public key = '';
  public validatedRecords = [];
  public isDeletedSomeItems = false;
  public disableDeleteAllBtn = false;

  constructor(
    private lineItemService: ContractLineItemsService,
    private matSnackBar: MatSnackBar
  ) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.mappingDecisionsRes.previousValue !==
      changes.mappingDecisionsRes.currentValue
    ) {
      this.setupInitialData();
    }
  }
  public ngOnInit() {
    this.loadLatestMappingDecisions();
  }

  public deleteALL() {
    const recordIds = this.validatedRecords.map(
      (record: ValidatedRecord<ChangedField>) => record._id
    );
    this.disableDeleteAllBtn = true;
    this.deleteLineItem(recordIds);
  }

  public delete() {
    const recordIds = this.validatedRecords
      .filter((record: any) => record.fields[0].isSkipped)
      .map((record: ValidatedRecord<ChangedField>) => record._id);
    if (recordIds.length === 0) {
      this.showsAlertMessage('You should select at least one item');
      return;
    }

    this.deleteLineItem(recordIds);
  }

  public handleCheckboxChange($event: MatCheckboxChange) {
    const recordIds = this.validatedRecords
      .filter((record: any) => record.fields[0].isSkipped)
      .map((record: ValidatedRecord<ChangedField>) => record._id);
    const selectedIdsLength = recordIds.length;
    this.switchHeaderIcon(selectedIdsLength);
  }

  public save() {
    const payload = new LineItemTerminologyPayload(
      this.mappingDecisionsRes?.id,
      this.key,
      this.type
    )
      .setTerminologyChanges(this.validatedRecords)
      .build();

    if (this.type === this.dialogType.DELETE) {
      this.lineItemService
        .submitTerminologyForDeleteScenario(this.contractId, payload)
        .subscribe((res: any) => {
          if (res.status === 'success') {
            this.showsAlertMessage(res.message);
            this.next();
          } else {
            // updating errors from server response after submission
            if (!res.validatedRecords) {
              return;
            }
            res.validatedRecords.forEach((r) => {
              const record = this.validatedRecords.find(
                (_r) => r.id === _r._id
              );
              if (record) {
                r.fields.forEach((f) => {
                  const field = record.fields.find((_f) => f.key === _f.key);
                  if (field) {
                    field.error = f.error;
                    field.changedValueFC.setErrors({ incorrect: true });
                  }
                });
              }
            });
          }
        });
    } else {
      this.lineItemService
        .submitTerminology(this.contractId, payload)
        .subscribe((res: any) => {
          if (res.status === 'success') {
            this.showsAlertMessage(res.message);
            this.next();
          } else {
            this.validatedRecords = res.validatedRecords;
            this.setupInitialData();
          }
        });
    }
  }

  public toggleHeaderCheckbox($event: MatCheckboxChange) {
    if ($event.checked) {
      this.showNoTick();
      this.selectAllFields();
    } else {
      this.showNoTick();
      this.unSelectAllFields();
    }
  }

  private deleteLineItem(ids: Array<string>) {
    this.lineItemService
      .deleteMultipleLineItems(this.contractId, ids)
      .pipe(
        tap((res: any) => {
          if(res.error) {this.isDeletedSomeItems = false; }
        }),
        filter((res: any) => res.status === 'success')
      )
      .subscribe((res) => {
        this.showNoTick();
        this.showsAlertMessage(res.message);
        if (this.validatedRecords.length === ids.length) {
          this.next();
        } else {
          ids.forEach((id) => {
            const _idx = this.validatedRecords.findIndex((r) => r._id === id);
            if (_idx > -1) {
              this.validatedRecords.splice(_idx, 1);
            }
          });
        }
      });
  }

  private mapValidateRecords() {
    let selectedItemCount = 0;
    this.validatedRecords = this.validatedRecords.map((record) => {
      const obj: any = {
        rowNumber: record.rowNumber,
        fields: this.mapValidateRecordFields(record.fields)
      };
      if (this.type === this.dialogType.DELETE) {
        selectedItemCount++;
        obj._id = record._id;
      }
      return obj;
    });

    if (this.type === this.dialogType.DELETE && selectedItemCount > 0) {
      this.switchHeaderIcon(selectedItemCount);
    }
  }

  private mapValidateRecordFields(
    fields: ValidateField[]
  ): Array<ChangedField> {
    return fields.map((field: any, idx) => {
      const _field = {
        ...field,
        changedValueFC: (() => {
          const validators = [Validators.required];
          if (/^(start|end)\sdate$/i.test(field.title)) {
            validators.push(usDateFormatValidator);
            field.isDate = true;
          }
          const fc = new FormControl(null, validators);
          fc.markAsTouched();
          fc.markAsDirty();
          return fc;
        })()
      };
      return _field;
    });
  }

  private next() {
    this.statusChanged.emit(
      ImportLineItemsSteps.lineItemsValidationFromImportsFinished
    );
  }

  private selectAllFields() {
    this.validatedRecords.forEach((record) => {
      record.fields[0].isSkipped = true;
    });
  }

  private showsAlertMessage(msg) {
    const config: MatSnackBarConfig = {
      duration: 3000
    };

    this.matSnackBar.open(msg, '', config);
  }

  private unSelectAllFields() {
    this.validatedRecords.forEach((record) => {
      record.fields[0].isSkipped = false;
    });
  }

  private showTickIcon() {
    this.deleteHeaderCheckBox = true;
    this.deleteHeaderCheckBoxIntermediate = false;
  }

  private showIntermediateIcon() {
    this.deleteHeaderCheckBox = false;
    this.deleteHeaderCheckBoxIntermediate = true;
  }

  private showNoTick() {
    this.deleteHeaderCheckBox = false;
    this.deleteHeaderCheckBoxIntermediate = false;
  }

  private switchHeaderIcon(selectedIdsLength: number) {
    if (
      this.validatedRecords.length > 0 &&
      selectedIdsLength === this.validatedRecords.length
    ) {
      this.showTickIcon();
    } else if (selectedIdsLength > 0) {
      this.showIntermediateIcon();
    } else if (selectedIdsLength === 0) {
      this.showNoTick();
    }
  }

  public loadLatestMappingDecisions() {
    if (this.type === this.dialogType.DELETE) {
      this.title = 'Change Error Lineitems';
      this.lineItemService
        .getLatestLineItemMapping(this.contractId)
        .pipe(filter((res) => !!res))
        .subscribe((res) => {
          if (res.error) {
            this.showNoTick();
          }
          this.mappingDecisionsRes = res;
          this.setupInitialData();
        });
    }
  }

  public setupInitialData() {
    this.validatedRecords = this.mappingDecisionsRes.validatedRecords;
    if (!!this.validatedRecords) {
      this.mapValidateRecords();
    }
    this.key = this.mappingDecisionsRes.key;
  }

  public close() {
    if (this.isDeletedSomeItems) {
      this.next();
    } else {
      this.closeDialog.emit();
    }
  }
}
