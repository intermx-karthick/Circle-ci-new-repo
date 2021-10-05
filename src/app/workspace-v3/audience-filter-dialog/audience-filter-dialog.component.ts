import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  Optional,
  SkipSelf
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
@Component({
  selector: 'app-audience-filter-dialog',
  templateUrl: './audience-filter-dialog.component.html',
  styleUrls: ['./audience-filter-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudienceFilterDialogComponent implements OnInit {
  public selectedAudienceList: any = [];
  public isScenario = false;
  public openAudience = true;
  public isInventory: Boolean;
  public selectionType: String;
  constructor(
    public dialog: MatDialog,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<AudienceFilterDialogComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) private injectedData: any = []
  ) {}

  ngOnInit(): void {
    if (this.injectedData.audienceList) {
      this.selectedAudienceList = this.injectedData.audienceList;
    }
    if (this.injectedData.isScenario) {
      this.isScenario = this.injectedData.isScenario;
      this.isInventory = false;
      this.selectionType = 'multiple';
    } else {
      this.isInventory = true;
      this.selectionType = 'single';
    }
  }

  closeDialogBox(e = null) {
    if (!e?.clearFilter) {
      this.dialogRef.close(e);
    }
  }
}
