import { FormControl } from '@angular/forms';

export interface InsertionOrderRecord {
  selected?: boolean;
  ioDate?: FormControl;
  netAmount?: string | number;
  estimateNumber?: number;
  id?: number;
  exportedStatus?:boolean;
  disabled?:boolean;
}
