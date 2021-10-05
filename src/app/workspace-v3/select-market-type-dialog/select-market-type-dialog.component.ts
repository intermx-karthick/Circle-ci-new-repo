import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-select-market-type-dialog',
  templateUrl: './select-market-type-dialog.component.html',
  styleUrls: ['./select-market-type-dialog.component.less']
})
export class SelectMarketTypeDialogComponent implements OnInit {
  public marketType = 'DMA';
  constructor(
    public dialogRef: MatDialogRef<SelectMarketTypeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
  }

  public onAdd() {
    const marketType = {
      market_type: this.marketType,
      individual: true
    };
    this.dialogRef.close(marketType);
  }

  public addAsGroup() {
    const marketType = {
      market_type: this.marketType,
      individual: false
    };
    this.dialogRef.close(marketType);
  }
  
  public canclAutoAssign(){
    this.dialogRef.close({'cancelAutoAssign':true});
  }
}
