import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ExploreDataService } from '@shared/services/explore-data.service';
import { takeUntil } from 'rxjs/operators';
import { FormatService } from '@shared/services/format.service';
import { ThemeService } from '@shared/services/theme.service';
import { CommonService } from '@shared/services/common.service';
import { ExploreService } from '@shared/services';
import { LayersService } from '../../../explore/layer-display-options/layers.service';
import { Subject } from 'rxjs';
import { PlacesFiltersService } from '../places-filters.service';
import { Pagination } from '@interTypes/pagination';

@Component({
  selector: 'app-place-customize-layer',
  templateUrl: './place-customize-layer.component.html',
  styleUrls: ['./place-customize-layer.component.less']
})

/**
 * @deprecated This component is deprecated and moved the code to CustomizeLayersComponent
 * This component will be removed once the new changes got accepted.
 * Before removing this component please check with Jagadeesh.
 */
export class PlaceCustomizeLayerComponent implements OnInit, OnDestroy {

  public autocompletePlaces = [];
  public geographyData = [];
  public SelectedLayerColorPalet = '';
  public filteredPlacePacks: any = [];
  public selectedLayers: any = [];
  public map: any;
  private defaultPrimaryColor = '';
  private defaultSceondaryColor = '';
  private themeSetting: any;
  private duplicateSelectedColorPalet = '';
  public isSmallScreen = false;
  public customIcons = ['icon-circle', 'icon-place', 'icon-circle-stroke', 'icon-star1', 'icon-square', 'icon-triangle', 'icon-street-view', 'icon-map-signs', 'icon-map-o', 'icon-map', 'icon-globe', 'icon-location-arrow','icon-thumb-tack', 'icon-bullseye', 'icon-circle-o','icon-neuter']; //,
  public clearLayer = false;
  public pageInation: Pagination = { page: 1, size: 10 };
  public isLoading = false;
  private unSubscribe: Subject<void> = new Subject<void>();

  constructor(
    private exploreDataService: ExploreDataService,
    private formatService: FormatService,
    private theme: ThemeService,
    private commonService: CommonService,
    private exploreService: ExploreService,
    private layersService: LayersService,
    private placefilterService: PlacesFiltersService,
  ) { }

  ngOnInit() {

    this.themeSetting = this.theme.getThemeSettings();
    this.defaultPrimaryColor = this.themeSetting['color_sets']['primary'] && this.themeSetting['color_sets']['primary']['base'];
    this.defaultSceondaryColor = this.themeSetting['color_sets']['secondary'] && this.themeSetting['color_sets']['secondary']['base'];

    this.commonService.getMobileBreakPoint().pipe(takeUntil(this.unSubscribe))
    .subscribe(isMobile => { this.isSmallScreen = isMobile; });

    this.loadFromSession();


    this.exploreDataService.getMapObject().pipe(takeUntil(this.unSubscribe)).subscribe(mapObject => {
      this.map = mapObject;
    });

    this.isLoading = true;
    this.getPlaces();

    this.layersService.getApplyLayers().pipe(takeUntil(this.unSubscribe)).subscribe((value) => {
      if (!value['flag']) {
        this.layersService.cleanUpMap(this.map);
        this.removeLayers();
      } else {
        this.loadFromSession();
      }
    });

  }

  /**
   *
   * @param layer
   * @param type
   * @param position
   * This function is used to move a layer to selected array.
   */
  public moveLayer(layer, type, position) {
    this.SelectedLayerColorPalet = '';
    switch (type) {
      case 'place collection':
        // have removed layer and made as empty
        this.selectedLayers.push({data: layer, type: type, id: layer._id, icon: 'icon-place', color: this.defaultPrimaryColor});
        this.filteredPlacePacks[position]['selected'] = true;
        this.updateSelecetedLayers();
      break;
      case 'place':
        layer['geometry'] = layer['properties']['point'];
        this.selectedLayers.push({
          data: layer,
          type: type,
          id: layer.properties.safegraph_place_id,
          icon: 'icon-place',
          color: this.defaultSceondaryColor
        });
        this.autocompletePlaces[position]['selected'] = true;
        this.updateSelecetedLayers();
      break;
      case 'geography':
        this.geographyData[position['key']][position['index']]['selected'] = true;
        this.exploreService.getmarketGeometry({id: layer.id, type: position['key']}).pipe(takeUntil(this.unSubscribe))
          .subscribe(
            response => {
              response['name'] = layer.name;
              this.selectedLayers.push({
                data: response,
                type: type,
                id: layer.id.toString(),
                icon: 'icon-circle',
                color: this.defaultPrimaryColor,
                geography: position['key'],
              });
              this.geographyData[position['key']][position['index']]['selected'] = true;
              this.updateSelecetedLayers();
            },
            error => {
              this.geographyData[position['key']][position['index']]['selected'] = false;
            }
          );
      break;
    }
  }

  /**
   *
   * @param layer
   * @param type
   * @param position
   * This function is used to remove selected layer.
   */
  public removeLayer(layer, type, position) {
    switch (type) {
      case 'place collection':
        const selectedPlaceIndex = this.filteredPlacePacks.findIndex(item => item._id === layer._id);
        if (selectedPlaceIndex >= 0 && selectedPlaceIndex !== undefined) {
          this.filteredPlacePacks[selectedPlaceIndex]['selected'] = false;
        }
        this.selectedLayers.splice(position, 1);
        this.updateSelecetedLayers();
      break;
      case 'place':
        const singlePlaceIndex = this.autocompletePlaces.findIndex(item =>
           item.properties.safegraph_place_id === layer.properties.safegraph_place_id);
        if (singlePlaceIndex >= 0 && singlePlaceIndex !== undefined) {
          this.autocompletePlaces[singlePlaceIndex]['selected'] = false;
        }
        this.selectedLayers.splice(position, 1);
        this.updateSelecetedLayers();
      break;
      case 'geography':
        if (this.geographyData && Object.keys(this.geographyData).length > 0) {
          this.geographyData[this.selectedLayers[position]['geography']].map( element => {
            if (element.id === Number(layer.id)) {
              element['selected'] = false;
            }
          });
        }
        this.selectedLayers.splice(position, 1);
        this.updateSelecetedLayers();
      break;
    }
  }

  private removeLayers() {
    this.clearLayer = true;
    this.selectedLayers = [];
    this.autocompletePlaces = [];
    this.geographyData = [];
    this.filteredPlacePacks.map(pack => pack['selected'] = false);
    this.layersService.saveLayersSession({selectedLayers: []}, 'place');
    this.layersService.setLayers(this.selectedLayers);
  }

  public layer($event) {
    if ($event.type === 'place') {
      this.autocompletePlaces = $event.autocompletePlaces;
    }
    if ($event.type === 'geography') {
      this.geographyData = $event.geographyData;
    }
    this.moveLayer($event.layer, $event.type, $event.position);
  }

  private updateSelecetedLayers() {
    this.layersService.setLayers(this.selectedLayers);
  }

  private loadFromSession() {
    const layersSession = this.layersService.getlayersSession('place');
    this.selectedLayers = [];
    if (layersSession
      && layersSession['selectedLayers']
      && layersSession.selectedLayers.length > 0) {
      this.selectedLayers = layersSession.selectedLayers;
      this.layersService.setLayers(this.selectedLayers);
      this.filteredPlacePacks.map(val => val.selected = false );
      this.selectedLayers.map((layer) => {
        switch (layer.type) {
          case 'place collection':
            if (!layer['color'] && !layer['icon']) {
              layer['icon'] = 'place';
              layer['color'] = this.defaultPrimaryColor;
            }
            const index = this.filteredPlacePacks.findIndex(pack => pack._id === layer.id);
            if (index >= 0) {
              this.filteredPlacePacks[index]['selected'] = true;
            }
          break;
          case 'place':
            if (!layer['color'] && !layer['icon']) {
              layer['icon'] = 'place';
              layer['color'] = this.defaultSceondaryColor;
            }
          break;
          case 'geography':
            if (!layer['color'] && !layer['icon']) {
              layer['icon'] = 'icon-circle';
              layer['color'] = this.defaultPrimaryColor;
            }
            layer['selected'] = true;
            layer['data']['name'] = layer['data']['properties']['name'];
          break;
        }
      });
    }
  }

  // selected layer actions
  public openColorPalet(layerID) {
    if (this.SelectedLayerColorPalet === layerID) {
      this.SelectedLayerColorPalet = '';
    } else {
      this.SelectedLayerColorPalet = layerID;
    }
  }
  public onAppColorChange(layer, color, type, icon = 'icon-place') {
    const selectedPlaceIndex = this.selectedLayers.findIndex(item => item.id === layer.id);
    if (selectedPlaceIndex >= 0 && selectedPlaceIndex !== undefined) {
      this.selectedLayers[selectedPlaceIndex]['icon'] = icon;
      this.selectedLayers[selectedPlaceIndex]['color'] = color;
    }
    this.updateSelecetedLayers();
  }
  public onDragStart(event) {
    if (this.SelectedLayerColorPalet !== '') {
      this.duplicateSelectedColorPalet = this.SelectedLayerColorPalet;
      this.SelectedLayerColorPalet = '';
    }
  }
  public onDragEnd(event) {
    this.SelectedLayerColorPalet = this.duplicateSelectedColorPalet;
    this.duplicateSelectedColorPalet = '';
  }
  public onClose(event) {
    if (event) {
      this.SelectedLayerColorPalet = '';
    }
  }

  getPlaces() {
    this.placefilterService.getPlacesSet(null, true, this.pageInation).pipe(takeUntil(this.unSubscribe))
    .subscribe( res => {
      this.isLoading = false;
      if (res && res['data']) {
        this.filteredPlacePacks = this.filteredPlacePacks.concat(res['data']);
      if (this.filteredPlacePacks) {
        this.filteredPlacePacks.sort(this.formatService.sortAlphabetic);
      }
        this.loadFromSession();
      }
    });
  }

  loadMorePlaceSets(){
    this.pageInation.page +=1;
    this.isLoading = true;
    this.getPlaces();
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
