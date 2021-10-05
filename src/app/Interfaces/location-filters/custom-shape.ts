import {EventEmitter} from '@angular/core';

export interface CustomShape {

  onLoadMapView: EventEmitter<null>;
  onDrawPolygon: EventEmitter<null>;
  onDrawCircle: EventEmitter<null>;
  onRemovePolygon: EventEmitter<boolean>;

  drawPolygon(): void;

  drawCircle(): void;

  removePolygon(): void;

}
