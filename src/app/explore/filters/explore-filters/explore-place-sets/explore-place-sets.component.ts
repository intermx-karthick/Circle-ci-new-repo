import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { BasePlaceSets } from '../../../../classes';
import { PlacesFiltersService } from '../../../../places/filters/places-filters.service';
import { CustomLazyLoad } from '@shared/custom-lazy-loader';

@Component({
  selector: 'app-explore-place-sets',
  templateUrl: 'explore-place-sets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExplorePlaceSetsComponent extends BasePlaceSets implements OnInit, OnDestroy {

  // providing subscriber to call init method
  @Input() initiator$: Subject<CustomLazyLoad>;

  // if true initial call on while page load.
  @Input() preload = true;

  @Input() selectedPlacesCtrl: FormControl;

  @Input() searchFromCtl = new FormControl();

  // Checker for init is initiated or not
  isInitiated = false;

  // Need to implement for whether the initial load
  // completed or not
  isInitialLoadCompleted: boolean = false

  // Killing subscriber
  private unsubscribeInitiator$: Subject<void> = new Subject<void>();

  /**
   * @description
   *  enabling the content loader
   */
  get isInitLoading() {
    return this.isInitiated && !this.isInitialLoadCompleted;
  }

  constructor(
    public placefilterService: PlacesFiltersService,
    public cdRef: ChangeDetectorRef
  ) {
    super(placefilterService, cdRef);
  }


  ngOnInit(): void {
    this.listenerForInitialLoad();
    this.listenForPlacesetsSearch();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  compare(c1, c2) {
    return c1 && c2 && c1['_id'] === c2['_id'];
  }

  /**
   * @description
   * init method to configure for custom lazy loader
   * You need to call {@member destroyInitiator after
   * the call success (its about depends on your logic) to
   * destroy the subscriber.
   */
  init() {
    this.cdRef.markForCheck();
    this.setPlaceSets();
  };

  /**
   * @description
   *   This method used  to load the listener
   */
  listenerForInitialLoad() {
    if (this.isInitialLoadCompleted) return;
    if (this.preload) {
      this.isInitiated = true;
      this.init();
      return;
    }

    this.initiator$?.pipe(takeUntil(this.unsubscribeInitiator$))
      ?.subscribe((result) => {
        if (result.load) {
          this.isInitiated = true;
          this.init();
        }
      });
  }

  /**
   * @description
   *  Helps to destroy the subscriber
   */
  destroyInitiator() {
    if (this.isInitialLoadCompleted) return;
    this.unsubscribeInitiator$?.next();
    this.unsubscribeInitiator$?.complete();
    this.isInitialLoadCompleted = true;
  }

  /**
   * @param callback - to handle anything after  success response
   */
  setPlaceSets(callback = () => {
  }) {
    this.placefilterService.getPlacesSet(null, true)
      .pipe(finalize(() => this.destroyInitiator()))
      .subscribe((res: any) => {

        if (res?.data) {
          this.placeSets = res.data;
          this.setPaginationFromRes(res);
          if (callback) {
            callback();
          }
        }

        this.cdRef.markForCheck();
      });
  }
}
