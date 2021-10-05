import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MarketSelectorConfig } from '@interTypes/marketType';

@Component({
  selector: 'app-markets-selector-dialog',
  templateUrl: './markets-selector-dialog.component.html',
  styleUrls: ['./markets-selector-dialog.component.less']
})
export class MarketsSelectorDialogComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<MarketsSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private injectedData: any = []) { }
  public marketSelectorConfig: MarketSelectorConfig = {
    cancelButtonLabel: 'CLOSE',
    groupButtonLabel: '',
    singleButtonLabel: 'APPLY',
    groupSelectionEnabled: false,
    allowedGeoTypes: [this.injectedData.type]
  };
  public selectedType = 'DMA'; 
  ngOnInit(): void {
    this.selectedType = this.injectedData['type'];
  }

  public applyAndcloseDialog(event) {
    if(event && event.selected !== 'global'){
      this.dialogRef.close(event);
    }
  }

  public closeDialog() {
    this.dialogRef.close();
  }


}
