import { Component, Inject, OnInit, Output, OnDestroy, AfterViewInit, Input, ChangeDetectionStrategy, Optional, SkipSelf, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChanges} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {of, Subject} from 'rxjs';
import {FormControl} from '@angular/forms';
import {switchMap, debounceTime, tap, catchError, map, takeUntil} from 'rxjs/operators';

import {InventoryService} from '@shared/services';
import { SummaryPanelActionService } from '../../../workspace-v3/summary-panel-action.service';
@Component({
  selector: 'app-location-selection-w3',
  templateUrl: './location-selection-w3.component.html',
  styleUrls: ['./location-selection-w3.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationSelectionComponentW3
  implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() public moduleName;
  @Input() public locationData;
  @Output() applyLocation = new EventEmitter();
  @Output() removeLocation = new EventEmitter();
  searchLocationFrmCtrl: FormControl = new FormControl();

  selectedLocations = [];
  locationList$ = of([]);
  isSearching = false;
  searchQuery = '';
  selectable = true;
  removable = true;

  private ngUnSubScribe = new Subject();

  constructor(
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData,
    @Optional() @SkipSelf() private dialogRef: MatDialogRef<LocationSelectionComponentW3>,
    private inventoryService: InventoryService,
    private cdRef: ChangeDetectorRef,
    private summaryPanelAction: SummaryPanelActionService
  ) {
    if (this.moduleName !== 'project') {
      this.selectedLocations = this.dialogData?.selectedLocations ?? [];
    }
  }

  ngOnInit() {
    if (this.moduleName === 'project') {
      this.dialogData = this.locationData;
    }
    this.summaryPanelAction.deleteLocation().pipe(takeUntil(this.ngUnSubScribe)).subscribe((location) => {
      this.removeSelectedLocation(location);
    });
    this.initSearchLocationListSubscriber();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.locationData) {
      this.selectedLocations =
        changes.locationData.currentValue.selectedLocations ?? [];
    }
  }

  ngAfterViewInit() {
    // for initial loading;
    this.searchLocationFrmCtrl.setValue('');
    if (this.moduleName === 'project') {
      setTimeout(() => {
        this.inventoryService.clearButtonSource
          .pipe(takeUntil(this.ngUnSubScribe))
          .subscribe((res) => {
            this.selectedLocations = [];
            this.cdRef.markForCheck();
          });
      }, 1000);
    }
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
        if (searchString) {
          this.isSearching = true;
        }
        this.searchQuery = searchString;
      }),
      switchMap((searchString) =>
        this.inventoryService.getGeographies(searchString, false).pipe(
          catchError((err) => {
            // when error comes shows the empty value
            return of([]);
          })
        )
      ),
      tap((result) => {
        this.isSearching = false;
      }),
      catchError((err) => {
        // when error comes shows the empty value
        return of([]);
      })
    );
  }

  /**
   * @description
   *  Apply the changes.
   *
   */
  apply() {
    this.dialogRef.close({ data: this.selectedLocations });
  }

  /**
   * @description
   *
   *   Remove the selected location from selection list
   *
   * @param location - selected location
   */
  removeSelectedLocation(location: any) {
    const index = this.selectedLocations.findIndex(
      (selecteLoc) => selecteLoc.id === location.id
    );

    if (index >= 0) {
      this.selectedLocations.splice(index, 1);
    }
    this.removeLocation.emit(this.selectedLocations);
    if (this.moduleName === 'project') {
      this.applyLocation.emit({ data: this.selectedLocations });
    }
  }

  /**
   * @description
   *   Save the selected location in selection list
   *
   * @param location - selected location
   */
  selectedLocation(location: any) {
    const index = this.selectedLocations.findIndex(
      (selecteLoc) => selecteLoc.id === location.id
    );
    if (index === -1) {
      this.selectedLocations.push(location);
      this.searchLocationFrmCtrl.setValue('');
    }

    if (this.moduleName === 'project') {
      this.applyLocation.emit({ data: this.selectedLocations });
    }
  }
}
