import { Component, Output, EventEmitter, Input, ChangeDetectionStrategy} from '@angular/core';
import { KeyValue } from '@angular/common';
import { CCCastStatuses } from '../classes/layer-factory';
import { CityCastApiService } from '../services/city-cast-api.service';
@Component({
  selector: 'app-city-cast-schemes',
  templateUrl: './city-cast-schemes.component.html',
  styleUrls: ['./city-cast-schemes.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CityCastSchemesComponent {
  editedData = [];
  @Output() onSchemeAction = new EventEmitter();
  @Input() cast = null;
  @Input() savedDeltas = [];
  @Input() unSavedChanges = [];
  castStatuses = CCCastStatuses;
  constructor(
    private ccAPIservice: CityCastApiService
  ) {}

  originalOrder = (
    a: KeyValue<number, string>,
    b: KeyValue<number, string>
  ): number => {
    return 0;
  };
  trackByFeature(index: number, row: any): string {
    return row['featureId'];
  }
  trackByValue(index: number, row: any): string {
    return row.view_value;
  }
  cardAction (value) {
    this.onSchemeAction.emit(value);
  }
}
