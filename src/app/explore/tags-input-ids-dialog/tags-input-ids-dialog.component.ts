import { Component, Inject, ViewChild, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-tags-input-ids-dialog',
  templateUrl: 'tags-input-ids-dialog.component.html',
  styleUrls: ['./tags-input-ids-dialog.less']
})
export class TagsInputIdsDialogComponent implements OnInit {
  public tableDataSource: any;
  public displayedColumns = ['ids'];
  public ids: string;
  public copiedStatus: Boolean = false;
  public selectBox: any;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public dialogRef: MatDialogRef<TagsInputIdsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any) {
  }

  ngOnInit() {
    const sortArray = [];
    // convert simple array into array of object for sorting the IDs
    const arrayOfObject = this.dialogData.ids.forEach((ids) => {
      sortArray.push({ids: ids});
    });
    this.tableDataSource = new MatTableDataSource(sortArray);
    this.tableDataSource.sort = this.sort;
  }

  ngAfterViewInit() {
    this.tableDataSource.sort = this.sort;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  /* coping all IDs */
  copyAllIds(): void {
    this.copiedStatus = true;
    this.selectBox = document.createElement('textarea');
    this.selectBox.value = '';
    this.selectBox.style.position = 'fixed';
    this.selectBox.style.left = '0';
    this.selectBox.style.top = '0';
    this.selectBox.style.opacity = '0';
    this.selectBox.value = this.dialogData.ids;
    document.body.appendChild(this.selectBox);
    this.selectBox.focus();
    this.selectBox.select();
    document.execCommand('copy');
    document.body.removeChild(this.selectBox);
  }

}
