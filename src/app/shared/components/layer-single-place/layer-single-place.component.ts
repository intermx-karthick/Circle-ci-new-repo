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
import {debounceTime, takeWhile, tap, map} from 'rxjs/operators';
import {CommonService} from '@shared/services/common.service';
import {PlacesFiltersService} from '../../../places/filters/places-filters.service';

@Component({
  selector: 'app-layer-single-place',
  templateUrl: './layer-single-place.component.html',
  styleUrls: ['./layer-single-place.component.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerSinglePlaceComponent implements OnInit, OnDestroy, OnChanges {

  @Input() selectedLayers;
  @Input() map;
  @Input() type;
  @Input() clearLayer;
  @Output() layer = new EventEmitter();

  public searchPlaceCtrl: FormControl = new FormControl();
  public selectedSearchPlace = {};
  public unSubscribe = true;
  public fetchingSuggestion = false;
  public autocompletePlaces = [];

  constructor(
    private commonService: CommonService,
    private placesFiltersService: PlacesFiltersService
  ) { }

  ngOnInit() {
    this.searchPlaceCtrl.valueChanges
    .pipe(takeWhile(() => this.unSubscribe), debounceTime(100))
    .subscribe(() => {
      this.autocompletePlace();
    });
  }

  ngOnDestroy() {
    this.unSubscribe = false;
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes.clearLayer && changes.clearLayer.currentValue) {
      this.searchPlaceCtrl.reset();
      this.autocompletePlace();
    }
  }

  public moveLayer(layer, type, position) {
    this.layer.emit({
      layer: layer,
      type: type,
      position: position,
      autocompletePlaces: this.autocompletePlaces
    });
  }

  /**
   *
   * This function is used to list places
   */
  private autocompletePlace() {
    const value = this.searchPlaceCtrl.value;
    const keyword = 'keyword';
    if (value && value.length >= 3) {
      this.fetchingSuggestion = true;
        const formValues = {};
        formValues['search'] = value;
        const bounds = this.commonService.getMapBoundingBox(this.map);
        formValues['bounds'] = bounds['coordinates'][0][0];
        formValues['autocomplete'] = true;
        this.placesFiltersService.getPOISuggestion(value, keyword, true).pipe(takeWhile(() => this.unSubscribe)).subscribe(response => {
          if (typeof response['data']['places'] !== 'undefined') {
            this.autocompletePlaces = response['data']['places'];
              this.selectedLayers.forEach(layers => {
              const singlePlaceIndex = response['data']['places'].findIndex(item => item.properties.ids.safegraph_place_id === layers.id);
                if (singlePlaceIndex >= 0 && singlePlaceIndex !== undefined) {
                  this.autocompletePlaces[singlePlaceIndex]['selected'] = true;
                }
             });
          }
          this.fetchingSuggestion = false;
        },
        error => {
          this.fetchingSuggestion = false;
          this.autocompletePlaces = [];
        });
    } else {
      this.fetchingSuggestion = false;
      this.autocompletePlaces = [];
    }
  }
}
