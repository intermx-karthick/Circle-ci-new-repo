import { Component,  OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';

/**
 * @description
 *  popup container component
 */
@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.less']
})
export class PopupComponent implements OnInit, OnDestroy {

  /** The portal outlet inside of this container into which the dialog content will be loaded. */
  @ViewChild(CdkPortalOutlet, {static: true}) portalOutlet: CdkPortalOutlet;

  constructor(
  ) {
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
  }


  /**
   * @description
   *  Attach given popup component in cdkPortalOutlet template
   * @param portal
   */
  attachComponent<T>(portal: ComponentPortal<T>) {
    return this.portalOutlet.attachComponentPortal(portal);
  }

  /**
   * @description
   *  Don't remove the method reference will assing from
   *  popup service to close the popup from container
   */
  close(){

  }

}
