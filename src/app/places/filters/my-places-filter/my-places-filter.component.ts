import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticationService } from '@shared/services';
import { PlacesAssignjobComponent } from '../../../places/filters/places-assign-job/places-assign-job.component';
import { Subject } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';
import { PlacesFiltersService } from '../places-filters.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-my-places-filter',
  templateUrl: './my-places-filter.component.html',
  styleUrls: ['./my-places-filter.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyPlacesFilterComponent implements OnInit, OnDestroy {
  @Input() selectedPlaceSetId;
  @Input() poiData: any;
  @Output() filterByPlaceSet: EventEmitter<any> = new EventEmitter();
  @Output() pushFilterStatus: EventEmitter<any> = new EventEmitter();
  private unSubscribe: Subject<void> = new Subject<void>();
  public jobs: any = [];
  public selectedUploadOptionCtrl: FormControl = new FormControl();
  public isAuditRole = false;
  public isPlacesImportAllowed = false;
  public auditAllowed = false;
  public isCollapseNavigation = false;

  constructor(
    public dialog: MatDialog,
    private placesFilterService: PlacesFiltersService,
    private cdRef: ChangeDetectorRef,
    private auth: AuthenticationService) {
  }

  ngOnInit() {
    const audit = this.auth.getModuleAccess('audit');
    const placeLicense = this.auth.getModuleAccess('place');
    if (audit && audit['write']) {
      this.isAuditRole = true;
    }
    if (placeLicense && placeLicense['write']) {
      this.isPlacesImportAllowed = true;
    }
    // TODO: Need to uncomment once API completed
    // this.placesFilterService.getJobs().pipe(takeUntil(this.unSubscribe)).subscribe(response => {
    //   this.jobs = response['columns'];
    //   this.cdRef.markForCheck();
    // });
    this.placesFilterService.getNewColumnOpened().pipe(takeUntil(this.unSubscribe)).subscribe(flag => {
      if (flag) {
        const tabWidth = document.getElementsByClassName('myplace-audit-jobs-block')
          && document.getElementsByClassName('myplace-audit-jobs-block')[0]['offsetWidth'] || 0;
        const screenWidth = window.innerWidth;
        if (tabWidth > screenWidth) {
          this.collapseNavigation(true);
        }
        this.placesFilterService.setNewColumnOpened(false);
      }
    });

    this.placesFilterService.getCreateNewPlace().pipe(takeUntil(this.unSubscribe))
    .subscribe(data=>{
      if(data && data['open']){
        this.collapseNavigation(true);
      } else {
        this.collapseNavigation(false);
      }
    });
  }

  onFilterByPlaceSet(place) {
    this.filterByPlaceSet.emit(place);
  }

  public openPopup() {
    this.dialog.open(PlacesAssignjobComponent, {
      width: '585px',
      panelClass: 'Assign-job-container',
      disableClose: true
    }).afterClosed().pipe(takeUntil(this.unSubscribe)).subscribe(data => {
      this.selectedUploadOptionCtrl.patchValue('');
      this.placesFilterService.setReloadAuditPlace(true);
    });
  }

  public collapseNavigation(flag) {
    this.isCollapseNavigation = flag;
    this.pushFilterStatus.emit(this.isCollapseNavigation);
  }
  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
