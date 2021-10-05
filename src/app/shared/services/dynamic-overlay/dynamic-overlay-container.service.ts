import { Injectable } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

// overriding the OverlayContainer container
@Injectable({
  providedIn: 'root'
})
export class DynamicOverlayContainerService extends OverlayContainer{

  setContainerElement(containerElement: HTMLElement){
    this._containerElement = containerElement;
  }

}
