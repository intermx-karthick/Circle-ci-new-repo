import {
  Component,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-market-filter-dialog',
  templateUrl: './market-filter-dialog.component.html',
  styleUrls: ['./market-filter-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketFilterDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<MarketFilterDialogComponent>,
  ) {}

   closeDialogBox() {
    this.dialogRef.close();
  }
}
