import {Component, Inject, OnInit, Output, OnDestroy, AfterViewInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {of, Subject} from 'rxjs';
import {FormControl} from '@angular/forms';
import {switchMap, debounceTime, tap, catchError} from 'rxjs/operators';

import {InventoryService} from '@shared/services';

@Component({
  selector: 'app-location-selection',
  templateUrl: './location-selection.component.html',
  styleUrls: ['./location-selection.component.less']
})
export class LocationSelectionComponent implements OnInit, OnDestroy, AfterViewInit {

  searchLocationFrmCtrl: FormControl = new FormControl();

  selectedLocations = [];
  locationList$ = of([]);
  isSearching = false;
  searchQuery = '';
  selectable = true;
  removable = true;

  private ngUnSubScribe = new Subject();

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData,
    private dialogRef: MatDialogRef<LocationSelectionComponent>,
    private inventoryService: InventoryService,
  ) {
    this.selectedLocations = this.dialogData.selectedLocations;
  }

  ngOnInit() {
    this.initSearchLocationListSubscriber();
  }

  ngAfterViewInit() {
    // for initial loading;
    this.searchLocationFrmCtrl.setValue('');
  }

  ngOnDestroy() {
    this.ngUnSubScribe.next();
    this.ngUnSubScribe.complete();
  }

  compare(c1, c2) {
    return c1 && c2 && c1['id'] === c2['id'];
  }

  /**
   * @description
   *  initialize the location list subscriber.
   *
   */
  initSearchLocationListSubscriber() {
    this.locationList$ = this.searchLocationFrmCtrl.valueChanges.pipe(
      debounceTime(400),
      tap((searchString) => {
        if (searchString) { this.isSearching = true; }
        this.searchQuery = searchString;
      }),
      switchMap(searchString => this.inventoryService.getGeographies(searchString, false).pipe(
          catchError((err) => {
            console.log(err);
            // when error comes shows the empty value
            return of([]);
         }),
        )
      ),
      tap((result) => {
        this.isSearching = false;
      }),
      catchError((err) => {
        console.log(err);
        // when error comes shows the empty value
        return of([]);
      }),
    );
  }

  /**
   * @description
   *  Apply the changes.
   *
   */
  apply() {
    this.dialogRef.close({data: this.selectedLocations});
  }

  /**
   * @description
   *
   *   Remove the selected location from selection list
   *
   * @param location - selected location
   */
  removeSelectedLocation(location: any) {

    const index = this.selectedLocations.findIndex(selecteLoc =>  selecteLoc.id === location.id);

    if (index >= 0) {
      this.selectedLocations.splice(index, 1);
    }

  }

  /**
   * @description
   *   Save the selected location in selection list
   *
   * @param location - selected location
   */
  selecteLocation(location: any) {
    const index = this.selectedLocations.findIndex(selecteLoc =>  selecteLoc.id === location.id);

    if (index === -1) {
      this.selectedLocations.push(location);
      this.searchLocationFrmCtrl.setValue('');
    }

  }

}
