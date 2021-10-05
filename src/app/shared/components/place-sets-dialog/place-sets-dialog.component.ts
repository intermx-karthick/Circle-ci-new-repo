import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PlaceSet } from './../../../Interfaces/placeSet';
@Component({
  selector: 'app-place-sets-dialog',
  templateUrl: './place-sets-dialog.component.html',
  styleUrls: ['./place-sets-dialog.component.less']
})
export class PlaceSetsDialogComponent implements OnInit {
  public placeSets: PlaceSet[] = [];
  public selectedPlaceSet: PlaceSet;
  constructor(@Inject(MAT_DIALOG_DATA) public dialogData,
    private dialogRef: MatDialogRef<PlaceSetsDialogComponent>) { }
  ngOnInit() {
    this.placeSets = this.dialogData && this.dialogData || [];
  }
  public onSelectPlaceSets(place) {
    this.selectedPlaceSet = place;
  }
  onApply() {
    this.dialogRef.close({ place: this.selectedPlaceSet });
  }
}
