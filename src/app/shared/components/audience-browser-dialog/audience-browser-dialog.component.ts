import {Component, OnInit, Inject} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {BreakpointObserver} from '@angular/cdk/layout';

@Component({
  selector: 'app-audience-browser-dialog',
  templateUrl: './audience-browser-dialog.component.html',
  styleUrls: ['./audience-browser-dialog.component.less']
})

/**
 * @deprecated This component is deprecated and will be removed. Any new implementation should not be based on this component.
 * This is deprecated because of new design.
 */
export class AudienceBrowserDialogComponent implements OnInit {
  public selectedAudienceList: any = [];
  public isSmallScreen = false;
  public isScenario = false;
  public openAudience = true;
  public isInventory: Boolean;
  public selectionType: String;
  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<AudienceBrowserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private injectedData: any = [],
    private breakpointObserver: BreakpointObserver
   ) { }

  ngOnInit() {
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
    this.breakpointObserver.observe('(max-width: 767px)').subscribe( result => {
      this.isSmallScreen = result['matches'];
    });
  }
  closeDialogBox(e) {
    this.dialogRef.close(e);
  }
}
