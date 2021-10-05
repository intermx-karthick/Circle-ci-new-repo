import { ConnectedPosition, OverlayConfig, ScrollStrategy } from '@angular/cdk/overlay';
import { ViewContainerRef } from '@angular/core';
import { Direction } from '@angular/cdk/bidi';


/**
 * Configuration for opening a modal dialog with the Popup service.
 */
export class PopupConfig<D = any> extends OverlayConfig {

  /**
   * Where the attached component should live in Angular's *logical* component tree.
   * This affects what is available for injection and the change detection order for the
   * component instantiated inside of the dialog. This does not affect where the dialog
   * content will be rendered.
   */
  viewContainerRef?: ViewContainerRef;

  /** ID for the dialog. If omitted, a unique one will be generated. */
  id: string;

  /** Custom class for the overlay pane. */
  panelClass?: string | string[] = '';

  /** Whether the dialog has a backdrop. */
  hasBackdrop?: boolean = false;

  /** Custom class for the backdrop. */
  backdropClass?: string = '';

  /** Width of the dialog. */
  width?: string = '';

  /** Height of the dialog. */
  height?: string = '';

  /** Min-width of the dialog. If a number is provided, assumes pixel units. */
  minWidth?: number | string;

  /** Min-height of the dialog. If a number is provided, assumes pixel units. */
  minHeight?: number | string;

  /** Max-width of the dialog. If a number is provided, assumes pixel units. Defaults to 80vw. */
  maxWidth?: number | string = '80vw';

  /** Max-height of the dialog. If a number is provided, assumes pixel units. */
  maxHeight?: number | string;

  /** Data being injected into the child component. */
  data?: D | null = null;

  /** Layout direction for the dialog's content. */
  direction?: Direction;


  /** Scroll strategy to be used for the dialog. */
  scrollStrategy?: ScrollStrategy;

  /** origin  element for Where the attach the component */
  originEl: HTMLElement;

  /** positions of the popup to be rendered */
  positions?: Array<ConnectedPosition> = [
    {
      originX: 'center',
      originY: 'center',
      overlayX: 'center',
      overlayY: 'center'
    }
  ];
}
