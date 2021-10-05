import { Component, OnInit, ChangeDetectionStrategy, Inject, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IOExportsResponse } from 'app/contracts-management/models/billing-export.model';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-billing-export-dialog',
  templateUrl: './billing-export-dialog.component.html',
  styleUrls: ['./billing-export-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillingExportDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<BillingExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data:IOExportsResponse,
    private cd: ChangeDetectorRef) { }

  ngOnInit(): void {}

  onExport(){
   saveAs(this.data.url, this.data.label);
   this.dialogRef.close({ download: true });
  }

}
