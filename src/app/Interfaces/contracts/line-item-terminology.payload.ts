import {
  ValidatedRecord,
  ValidateField
} from '@interTypes/contracts/latest-line-item-mapping.response';
import { FormControl } from '@angular/forms';

export interface Field {
  isSkipped: boolean;
  key: string;
  value: string;
}

export interface ChangedField extends ValidateField {
  changedValueFC: FormControl;
}

export class LineItemTerminologyPayload {
  key: string;
  id?: string;
  terminologyChanges?: ValidatedRecord<Field>[];
  updates?: ValidatedRecord<Field>[];
  type?: string;

  constructor(id: string, key: string, type: string) {
    this.key = key;
    this.id = id;
    this.type = type;
  }

  setTerminologyChanges(records: ValidatedRecord<ChangedField>[]) {
    const _records = records.map((record) => {
      const _record = {
        ...record,
        fields: this._mapFields(record.fields)
      };
      if (this.type === 'delete') {
        _record.id = _record._id;
        delete _record.rowNumber;
        delete _record._id;
      }
      return _record;
    });
    if (this.type === 'delete') {
      this.updates = _records;
    } else {
      this.terminologyChanges = _records;
    }
    return this;
  }

  _mapFields(changedFields: ChangedField[]) {
    return changedFields.map((changedField) => {
      const _changeField = {
        isSkipped: changedField.isSkipped,
        key: changedField.key,
        value: changedField.changedValueFC.value
      };
      if (this.type === 'delete') {
        delete _changeField.isSkipped;
      }
      return _changeField;
    });
  }

  build() {
    if (this.type === 'delete') {
      delete this.key;
      // delete this.id;
    }
    delete this.type;
    return this;
  }
}
