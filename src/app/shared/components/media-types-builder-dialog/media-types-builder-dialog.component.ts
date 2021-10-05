import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService } from '@shared/services';

@Component({
  selector: 'app-media-types-builder-dialog',
  templateUrl: './media-types-builder-dialog.component.html',
  styleUrls: ['./media-types-builder-dialog.component.less']
})
export class MediaTypesBuilderDialogComponent implements OnInit {
  public mediaTypesDataForEdit: any;

  constructor(public dialogRef: MatDialogRef<MediaTypesBuilderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public commonService: CommonService) { }

  ngOnInit() {
    this.mediaTypesDataForEdit = this.data;
  }

  getMediaTypeData(data) {
    if (data.state === 'apply' || data.state === 'individual') {
      this.dialogRef.close({data: data});
    } else {
      this.dialogRef.close();
    }
  }

}
