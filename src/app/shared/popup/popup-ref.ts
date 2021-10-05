import { Subject } from 'rxjs';
import { OverlayRef } from '@angular/cdk/overlay';


export type PopoverCloseEvent<T> = {
  type: 'backdropClick' | 'close';
  data: T;
}

/**
 * @description
 *  PopupRef is using to close and get the closed data.
 *
 */
export class PopupRef<T = any> {

  private afterClosed = new Subject<PopoverCloseEvent<T>>();
  afterClosed$ = this.afterClosed.asObservable();

  constructor(public overlay: OverlayRef, public data: T) {
    overlay.backdropClick().subscribe(() => this._close('backdropClick', data));
  }

  /**
   * @description
   *  To close the popup in injected component.
   *
   * @param data
   */
  close(data?: T) {
    this._close('close', data);
  }

  private _close(type, data) {
    this.overlay.detach();
    this.overlay.dispose();
    this.afterClosed.next({
      type,
      data
    });
    this.afterClosed.complete();
  }

}
