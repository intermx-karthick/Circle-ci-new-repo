import {
  Component,
  OnInit,
  Input,
  OnDestroy,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {ActivatedRoute} from '@angular/router';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {LocationSelectionComponent} from './location-selection/location-selection.component';
import {ILocationFilters} from '@interTypes/ILocationFilters';
import { isNumber } from 'util';

@Component({
  selector: 'app-location-widget',
  templateUrl: './location-widget.component.html',
  styleUrls: ['./location-widget.component.less']
})
export class LocationWidgetComponent implements OnDestroy {

  @Input() public selectedLocations: ILocationFilters[] = [];
  @Output() public selectlocation: EventEmitter<ILocationFilters[]> = new EventEmitter();
  @Input() public editFlag = true;
  @Input() public posWidth = 6; // width of the widget.

  private ngUnSubScribe = new Subject();

  constructor(
    private activeRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {
  }


  ngOnDestroy(): void {
    this.ngUnSubScribe.next();
    this.ngUnSubScribe.complete();
  }


  /**
   * @description
   *  Open the dialog to select the location and emit the
   * values to scenario view.
   *
   */
  openLocationSelectionDialog() {

    const dialogRef = this.dialog.open(LocationSelectionComponent, {
      width: '460px',
      minHeight: '340px',
      data: {selectedLocations: this.selectedLocations}
    });

    // trigger after the dialog closed to load the data
    // and send the data scenario view
    dialogRef.afterClosed().pipe(takeUntil(this.ngUnSubScribe)).subscribe((result) => {
      if (result) {
        this.selectedLocations = result.data;
        this.selectlocation.emit(this.selectedLocations);
        return;
      }
    });

  }

  /**
   * @description
   *   Remove the selected location and
   *   emit the values to scenario view
   */
  removeLocation(location: ILocationFilters, index: number) {
    this.selectedLocations.splice(index, 1);
    // this.selectedLocations = [...this.selectedLocations];
    this.selectlocation.emit(this.selectedLocations);
  }


  /**
   * @description
   *  Width of this widget will change by edit. So this
   *  method will return based on width
   *
   */
  truncateMidPos(): number{

    if(this.posWidth == 2) return 18;
    if(this.posWidth == 3) return 30;
    if(this.posWidth == 4) return 45;
    if(this.posWidth == 5) return 55;
    if(this.posWidth > 5) return 65;
  }

}
