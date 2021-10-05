import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  CCMapFeatureType,
  CCSidebarMenuType
} from '../classes';

@Component({
  selector: 'app-city-cast-find-features',
  templateUrl: './city-cast-find-features.component.html',
  styleUrls: ['./city-cast-find-features.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CityCastFindFeaturesComponent implements OnInit {
  mapOnFeatureCount: number;
  constructor() { }
  loadedFeatures: any;
  filteredFeatures: any;
  findQuery = new FormControl('');
  pageSize = 50;
  @Input() castIndexes = [];
  @Input() mainmap = '';
  @Input() submap = '';
  @Input() searchQuery = '';
  @Output() pushSearchQuery = new EventEmitter();
  @Output() openDataFromMapFeature = new EventEmitter();
  ngOnInit(): void {
    this.findQuery.setValue(this.searchQuery);
    this.findQuery.valueChanges.subscribe(value => {
      this.loadSearchData();
    });
    this.loadSearchData();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.castIndexes || changes.mainmap || changes.submap) {
      this.loadSearchData();
    }
  }

  trackByFeatureID(index: number, row: any): string {
    return row[0];
  }
  loadSearchData(event = null) {
    const key = this.findQuery.value;
    this.pushSearchQuery.emit(key);
    if (this.castIndexes) {
      if (this.mainmap === CCSidebarMenuType.NETWORK) {
        this.loadedFeatures = this.castIndexes.filter(
          (cast) =>
            (
              (cast[2] === CCMapFeatureType.LINK || cast[2] === CCMapFeatureType.ROUTE) &&
              (key === '' || (cast[1].toLowerCase().indexOf(key.toLowerCase()) !== -1))
            )
        );
        this.filteredFeatures = this.loadedFeatures.splice(0, this.pageSize);
      } else {
        this.loadedFeatures = this.castIndexes.filter(
          (cast) =>
            (
              (cast[2] === CCMapFeatureType.TRACT || cast[2] === CCMapFeatureType.LINK || cast[2] === CCMapFeatureType.ROUTE) &&
              (key === '' || (cast[1].toLowerCase().indexOf(key.toLowerCase()) !== -1))
            )
        );
        this.filteredFeatures = this.loadedFeatures.slice(0, this.pageSize);
      }
    }
  }
  openFeature(feature) {
    this.openDataFromMapFeature.emit(feature);
  }
  loadMore() {
    this.filteredFeatures.push(...this.loadedFeatures.splice(0, this.pageSize));
  }
}
