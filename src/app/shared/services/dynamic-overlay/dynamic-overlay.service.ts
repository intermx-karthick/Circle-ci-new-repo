import { ComponentFactoryResolver, Inject, Injectable, Injector, NgZone, Renderer2, RendererFactory2 } from '@angular/core';
import {
  Overlay,
  OverlayKeyboardDispatcher,
  OverlayOutsideClickDispatcher,
  OverlayPositionBuilder,
  ScrollStrategyOptions
} from '@angular/cdk/overlay';
import { Directionality } from '@angular/cdk/bidi';
import {DOCUMENT, Location} from '@angular/common';

import { DynamicOverlayContainerService } from '@shared/services/dynamic-overlay/dynamic-overlay-container.service';


/**
 * @description
 *
 *   This is service customizing the overlay service to
 *  show the dialog or overlay in given container instead
 *  of cdk container.
 *
 *  you need to use create method for open dialog.
 *  pls refer the unit tests.
 *
 */
@Injectable({
  providedIn: 'root'
})
export class DynamicOverlayService extends Overlay {

  _dynamicOverlayContainer: DynamicOverlayContainerService;
  private renderer: Renderer2;

  constructor(scrollStrategies: ScrollStrategyOptions,
              _overlayContainer: DynamicOverlayContainerService,
              _componentFactoryResolver: ComponentFactoryResolver,
              _positionBuilder: OverlayPositionBuilder,
              _keyboardDispatcher: OverlayKeyboardDispatcher,
              _injector: Injector,
              _ngZone: NgZone,
              @Inject(DOCUMENT) _document: any,
              _directionality: Directionality,
              rendererFactory: RendererFactory2,
              location: Location,
              outsideClickDispatcher: OverlayOutsideClickDispatcher
  ) {
    super(scrollStrategies, _overlayContainer, _componentFactoryResolver, _positionBuilder, _keyboardDispatcher, _injector, _ngZone, _document, _directionality, location, outsideClickDispatcher);
    this.renderer = rendererFactory.createRenderer(null, null);
    this._dynamicOverlayContainer = _overlayContainer;
  }

  /**
   * @description
   *  Setting the container element. if not given default cdk container.
   *
   * @param containerElement
   */
  public setContainerElement(containerElement: HTMLElement): void {
    this._dynamicOverlayContainer.setContainerElement(containerElement);
  }

}
