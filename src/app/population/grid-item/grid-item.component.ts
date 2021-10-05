import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {PopulationResultItem} from '@interTypes/Population';

@Component({
  selector: 'app-grid-item',
  templateUrl: './grid-item.component.html',
  styleUrls: ['./grid-item.component.less'],
})
export class GridItemComponent implements OnInit{
  @Input() public geoGraphy: PopulationResultItem;
  @Input() public baseStrokeColor: string;
  @Input() public activeStrokeColor: string;
  @Output() public mapView: EventEmitter<string> = new EventEmitter<string>();
  @Output() public selectionChange: EventEmitter<void> = new EventEmitter<void>();
  public showSubtitle = false;
  public showTitle = true;
  public showUnits = true;
  ngOnInit(): void {
    if (this.geoGraphy.comp < 1) {
      this.showSubtitle = true;
      this.showTitle = false;
      this.showUnits = false;
    }
  }

  public clickMapView(): void {
    this.mapView.emit(this.geoGraphy.geoId);
  }
  public toggleSelection(): void {
    this.selectionChange.emit();
  }
}
