import {Observable} from 'rxjs';
import {ChipSource, GroupAutocompleteChipSource} from '@interTypes/ChipsInput';
import {Geography} from '@interTypes/inventory';
import {EventEmitter} from '@angular/core';

export interface GeographyFilter {

  specificGeographyApply: EventEmitter<null>;

  geographySearch$: Observable<GroupAutocompleteChipSource<Geography>[]>;
  selectedSpecificGeographies: ChipSource<Geography>[];

  clearSpecificGeo();

  applySpecificGeo();

  searchGeographies(value: string);

  geographySelected(selected: Geography);

  onGeographyRemoved(removed: Geography);

}
