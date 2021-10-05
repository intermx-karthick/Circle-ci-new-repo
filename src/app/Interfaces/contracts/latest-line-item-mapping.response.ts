export interface ValidateField {
  isSkipped: boolean;
  key: string;
  error: string;
  title: string;
  value: any;
}

export interface ValidatedRecord<T> {
  rowNumber: number;
  fields: T[];
  _id?: string;
  id?: string; // for delete
}

export interface LatestLineItemMappingResponse {
  key: string;
  contractId: string;
  validatedRecords: ValidatedRecord<ValidateField>[];
}



