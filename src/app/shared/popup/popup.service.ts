import { Injectable, Injector } from '@angular/core';
import { ComponentType, Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { OverlayRef } from '@angular/cdk/overlay/overlay-ref';

import { PopupComponent } from '@shared/popup/popup.component';
import { PopupConfig } from '@shared/popup/popup-config';
import { PopupRef } from '@shared/popup/popup-ref';
import { PortalInjector } from './portal-injector'
import { DynamicOverlayService } from '@shared/services/dynamic-overlay/dynamic-overlay.service';


/**
 * @description
 *   Popup up service to open, close and close all popups
 * This is the custom angular popup made up with cdk overlay and portal.
 *
 */
@Injectable({
  providedIn: 'root'
})
export class PopupService {

  // storing opened popups
  openPopups = new Map<string, PopupRef>();

  constructor(
    public overlay: DynamicOverlayService,
    public injector: Injector
  ) {
  }

  /**
   * @description
   *
   *   To show the popup dialog box. popup service using connected position
   * So you need to give the origin element as HTMLElement or HTML reference.
   *
   *   popup is defaultly using center position
   *
   *   if the the popup dialog is already opened in the given origin element
   *  then requesting component also overlap.
   *
   *    Returning popupRef instance which has option to close and subscribtions
   *   of closing data.
   *
   *   send the body element in originEl to align the popup at  center position
   *   globally.
   *
   * @example
   *
   * For Connect with origin Element
   * --------------------
   *   const inventDetailsPopupRef = this.popupService.open(InventoryDetailViewComponent, {
   *           id: mapContainer?.id as string,
   *           data: inventoryInformation,
   *           originEl: mapContainer,
   *        });
   *
   *  To close
   *     inventDetailsPopupRef.close({closed: true})
   *
   *  To listen closing data
   *
   *   inventDetailsPopupRef.afterClosed$.subscribe((data)=>{
   *      console.log(data.data);
   *    })
   *
   * @param componentRef
   * @param config
   * @return  {@type PopupRef}
   */
  open<T>(componentRef: ComponentType<T>, config?: PopupConfig): PopupRef {

    const popupConfig = this.getConfig(config);
    const overlayRef = this.createOverlay(popupConfig);
    const containerRef = this.attachContainer(overlayRef, popupConfig);
    const popupRef = new PopupRef(overlayRef, config.data);
    const popupComponentRef = this.attachComponent(componentRef, popupConfig, containerRef, popupRef);

    containerRef.close = () => {
      popupRef.close();
    };

    popupRef.afterClosed$.subscribe(() => {
      this.removeOpenDialog(config.id);
    });

    this.openPopups.set(config.id, popupRef);
    return popupRef;

  }

  /**
   * @description
   *  Close all the opened popups.
   */
  closeAll() {
    this.openPopups.forEach((popupRef: PopupRef) => {
      popupRef.close();
    });
    this.openPopups.clear();
  }

  /**
   * @description
   *  Close specific popups by
   * @param id - unique id
   */
  close(id: string) {
    const popupRef: PopupRef = this.openPopups.get(id);
    popupRef?.close?.();
    this.removeOpenDialog(id);
  }

  /**
   * @description
   *  Creating Overlay instance with given config and default config
   * @param config
   */
  private createOverlay(config: PopupConfig) {

    this.overlay.setContainerElement(config.originEl);

    return this.overlay.create(new OverlayConfig({
        hasBackdrop: config.hasBackdrop,
        width: config.width,
        height: config.height,
        maxHeight: config.maxHeight,
        maxWidth: config.maxWidth,
        panelClass: config.panelClass ?? '',
        scrollStrategy: this.scrollStrategy(config),
        positionStrategy: this.getPositions(config)
      })
    );

  }

  /**
   * @description
   *
   *   Attaching `PopupComponent` container on overlay.
   * Which is the base component of the popup. it has close
   * option comes default.
   *
   * @param overlayRef
   * @param config
   */
  private attachContainer(overlayRef: OverlayRef, config: PopupConfig) {
    const containerPortal = new ComponentPortal(
      PopupComponent,
      config.viewContainerRef,
      this.injector
    );

    let containerRef = overlayRef.attach(containerPortal);
    return containerRef.instance;

  }

  /**
   * @description
   *   Creating injector with popupref instance in given component.
   *  it will helpful to inject PopupRef on component.
   *
   * @param popupRef
   */
  private createInjector(popupRef: PopupRef): PortalInjector {
    const injectorTokens = new WeakMap([[PopupRef, popupRef]]);
    return new PortalInjector(this.injector, injectorTokens);
  }

  /**
   * @description
   *   Attaching component on container
   *
   * @param componentRef
   * @param config
   * @param containerRef
   * @param popupRef
   */
  private attachComponent<T>(componentRef: ComponentType<T>, config: PopupConfig, containerRef: PopupComponent, popupRef: PopupRef) {
    const popupComponentRef = containerRef.attachComponent(new ComponentPortal(componentRef, config.viewContainerRef, this.createInjector(popupRef)));
    return popupComponentRef.instance;
  }

  /**
   * @description
   *   Merging default and given config
   *
   * @param config
   */
  private getConfig(config: PopupConfig) {
    const defaultConfig = new PopupConfig();
    return { ...defaultConfig, ...config };
  }

  /**
   * @description
   *  setting center positions in origin element
   * @param config
   */
  private getPositions(config: PopupConfig) {

    return this.overlay.position().global()
      .centerHorizontally().centerVertically();

  }

  /**
   * @description
   *   Setting scroll strategy of overlay config
   * @param config
   */
  private scrollStrategy(config?: PopupConfig) {
    return this.overlay.scrollStrategies.reposition({ scrollThrottle: 20 });
  }

  /**
   * @description
   *   Remove open dialog from `openDialogs`
   * @param id
   */
  private removeOpenDialog(id: string) {
    this.openPopups.delete(id);
  }

}
