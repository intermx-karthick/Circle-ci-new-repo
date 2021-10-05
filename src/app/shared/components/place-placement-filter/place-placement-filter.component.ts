import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { LazyLoaderService } from '@shared/custom-lazy-loader';

@Component({
  selector: 'app-place-placement-filter',
  templateUrl: './place-placement-filter.component.html',
  styleUrls: ['./place-placement-filter.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlacementFilterComponent {

  @Output() placementTypeOnSelect = new EventEmitter();
  @Output() placeTypeOnSelect = new EventEmitter();
  @Input() sPlaceType: string[];
  @Input() sPlaceMentType: string[];

  public placeTypeLazyLoader = new LazyLoaderService()
  public placementTypeLazyLoader = new LazyLoaderService()

}
