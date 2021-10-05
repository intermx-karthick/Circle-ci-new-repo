import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-imx-base-audience-popup',
  templateUrl: './imx-base-audience-popup.component.html',
  styleUrls: ['./imx-base-audience-popup.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImxBaseAudiencePopupComponent implements OnInit {
  baseAudiences: any;

  constructor(
    public dialogRef: MatDialogRef<ImxBaseAudiencePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private cdf: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.data?.baseAudiences) {
      this.baseAudiences = this.data.baseAudiences;
    }
    this.cdf.markForCheck();
  }
}
