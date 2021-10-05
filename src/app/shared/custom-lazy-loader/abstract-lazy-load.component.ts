import { Component, Input, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CustomLazyLoad } from '@shared/custom-lazy-loader/custom-lazy-load';

/**
 *@description
 *   This class used to avoid calls the apis on ngOnInit
 * or initial loads while page loading. We can manually load
 * the initial calls by trigger the #init method on manually
 * by LazyLoaderService#triggerInitialLoad.
 *
 *   This is primarily focusing for explore page side nav
 *  components.
 *
 * @example
 * HTML
 * <mat-expansion-panel (opened)="geoSetsLazyLoader.triggerInitialLoad()">
 *   <app-geography-sets-list
 *        [preload]="false"
 *        [initiator$]="geoSetsLazyLoader.initiator$">
 *   </app-geography-sets-list>
 * </mat-expansion-panel>
 *
 * TS
 * public geoSetsLazyLoader = new LazyLoaderService();
 *
 */
@Component({
  template: ''
})
export abstract class AbstractLazyLoadComponent {

  // providing subscriber to call init method
  @Input() initiator$: Subject<CustomLazyLoad>;

  // if true initial call on while page load.
  @Input() preload = true;

  // Checker for init is initiated or not
  isInitiated = false;

  /**
   * @description
   *  enabling the content loader
   */
  get isInitLoading(){
    return this.isInitiated && !this.isInitialLoadCompleted;
  }

  // Need to implement for whether the initial load
  // completed or not
  abstract isInitialLoadCompleted: boolean;

  // Killing subscriber
  abstract unsubscribeInitiator$: Subject<void>;

  /**
   * @description
   * init method to configure for custom lazy loader
   * You need to call {@member destroyInitiator after
   * the call success (its about depends on your logic) to
   * destroy the subscriber.
   */
  abstract init(): void;

  /**
   * @description
   *   This method used  to load the listener
   */
  listenerForInitialLoad() {
    if(this.isInitialLoadCompleted) return;
    if (this.preload) {
      this.isInitiated = true;
      this.init();
      return;
    }

    this.initiator$?.pipe(takeUntil(this.unsubscribeInitiator$))
      ?.subscribe((result) => {
        if(result.load){
          this.isInitiated = true;
          this.init();
        }
      });
  }

  /**
   * @description
   *  Helps to destroy the subscriber
   */
  destroyInitiator(){
    if(this.isInitialLoadCompleted) return;
    this.unsubscribeInitiator$?.next();
    this.unsubscribeInitiator$?.complete();
    this.isInitialLoadCompleted = true;
  }
}
