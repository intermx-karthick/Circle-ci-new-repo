import {
  Component,
  OnInit,
  Input,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import {FormControl} from '@angular/forms';
import {debounceTime, takeUntil} from 'rxjs/operators';
import { ExploreService } from '@shared/services';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-layer-specific-geography',
  templateUrl: './layer-specific-geography.component.html',
  styleUrls: ['./layer-specific-geography.component.less']
})
export class LayerSpecificGeographyComponent implements OnInit, OnDestroy, OnChanges {

  @Input() selectedLayers;
  @Input() clearLayer;
  @Output() layer = new EventEmitter();

  public searchGeography: FormControl = new FormControl();
  public fetchingGeography = false;
  private unSubscribe: Subject<void> = new Subject<void>();
  public geographyData = [];
  public isGeographyAvailable = false;

  constructor(
    private exploreService :ExploreService
  ) { }

  ngOnInit() {
    this.searchGeography.valueChanges
    .pipe(debounceTime(200), takeUntil(this.unSubscribe))
    .subscribe((value) => {
      this.autocompleteGeography();
    });
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.clearLayer && changes.clearLayer.currentValue) {
      this.searchGeography.reset();
      this.autocompleteGeography();
    }
  }

  public moveLayer(layer, type, position) {
    this.layer.emit({
      layer: layer,
      type: type,
      position: position,
      geographyData: this.geographyData
    });
  }

/**
 * This fuction is used to get the geography based on search input
 */
private autocompleteGeography() {
  const value = this.searchGeography.value;
  if (value && value.length >= 3) {
    this.fetchingGeography = true;
    this.exploreService.getmarketSearch(value, true)
    .pipe(takeUntil(this.unSubscribe))
    .subscribe(
      response => {
        this.fetchingGeography = false;
        this.geographyData = response;
        let issearchdata = false;
        const selectedGeoRegions = this.selectedLayers.filter( layer => (layer.type === 'geography' ));
        for (const key in this.geographyData) {
          if (this.geographyData[key] != null && this.geographyData[key].length) {
            issearchdata = true;
          }
        }
        if (issearchdata) {
          this.isGeographyAvailable = true;
          selectedGeoRegions.forEach(layer => {
            if (layer !== null) {
              const index = this.geographyData[layer['geography']].findIndex(data => data.id === Number(layer.id));
              if (index >= 0 && index !== undefined) {
                this.geographyData[layer['geography']][index]['selected'] = true;
              }
            }
          });
        } else {
          this.isGeographyAvailable = false;
        }
      },
      error => {
        this.isGeographyAvailable = false;
        this.geographyData = [];
      });
    } else {
      this.isGeographyAvailable = false;
      this.geographyData = [];
    }
  }
}
