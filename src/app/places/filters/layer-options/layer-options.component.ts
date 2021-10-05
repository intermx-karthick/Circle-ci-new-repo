import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { LayersService } from '../../../explore/layer-display-options/layers.service';
import { combineLatest, Subject } from 'rxjs';
import { PlacesDataService } from '@shared/services';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-layer-options',
  templateUrl: './layer-options.component.html',
  styleUrls: ['./layer-options.component.less']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * @deprecated This component is deprecated and moved the code to LayersAndDisplayOptionsComponent
 * This component will be removed once the new changes got accepted.
 * Before removing this component please check with Jagadeesh.
 */
export class LayerOptionsComponent implements OnInit, OnDestroy {
  private layerDisplayOptions: any = {};
  private unSubscribe: Subject<void> = new Subject<void>();
  private layers: any = [];
  public displayOptionsList = [
    'Map Legends',
    'Map Controls',
    'Custom Logo',
    'Custom Text',
    'Base Maps'
  ];
  constructor(
    private layersService: LayersService,
    private placesDataService: PlacesDataService
  ) { }

  ngOnInit() {
    combineLatest([this.layersService.getDisplayOptions()]).pipe(takeUntil(this.unSubscribe)).subscribe((options) => {
      this.layerDisplayOptions = options[0];
    });

    this.placesDataService.onMapLoad().pipe(takeUntil(this.unSubscribe)).subscribe(() => {
      this.layersService.setApplyLayers({
        type : 'primary',
        flag : true
      });
    });

    this.layersService.getLayers().pipe(takeUntil(this.unSubscribe)).subscribe((layers) => {
      if (layers) {
        this.layers = layers;
      }
    });
  }

  public onApply() {
    this.layersService.saveLayersSession({
      display: this.layerDisplayOptions,
      customLogoInfo: this.layersService.exploreCustomLogo['primary'],
      selectedLayers: this.layers
    }, 'place');
    this.layersService.setApplyLayers({
      type : 'primary',
      flag : true
    });
  }

  public clearAll() {
    this.layersService.setApplyLayers({
      type : 'primary',
      flag : false
    });
  }

  public onChangeOfDisplayOption(displayOptions) {
    console.log('display option in places');
    this.layerDisplayOptions = displayOptions;
    // if (this.layerType === 'primary') {
      const primaryDisplaySession = JSON.parse(localStorage.getItem('layersSession'));
      primaryDisplaySession['display'] = displayOptions;
      localStorage.setItem('layersSession', JSON.stringify(primaryDisplaySession));
      this.layersService.setDisplayOptions(displayOptions);
    // }
  }

  public onChangeOfLayer(layers) {
    this.layers = layers;
  }
  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
