import {Component, OnDestroy, OnInit, Output, EventEmitter, Input} from '@angular/core';
import {debounceTime, tap, map} from 'rxjs/operators';
import {LayersService} from '../../../explore/layer-display-options/layers.service';
import {
  ThemeService,
  ExploreService,
  InventoryService,
  AuthenticationService,
  PlacesDataService,
  CommonService,
  FormatService,
  PlacesService,
  ExploreDataService,
  WorkSpaceDataService,
  WorkSpaceService
} from '@shared/services';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Pagination } from '@interTypes/pagination';
import { GeographySet } from '@interTypes/Population';
import { LayerType } from '@interTypes/enums';
import { LazyLoaderService } from '@shared/custom-lazy-loader';
import {Helper} from '../../../classes';

@Component({
  selector: 'app-customize-layers',
  templateUrl: './customize-layers.component.html',
  styleUrls: ['./customize-layers.component.less']
})
export class CustomizeLayersComponent implements OnInit, OnDestroy {

  @Output() changeOfLayers: EventEmitter<any> = new EventEmitter();
  @Input() layerType;
  public filteredPlacePacks: any = [];
  public selectedValues = [];
  public selectedLayers: any = [];
  public keyCodes = {
    ENTER: 13,
    PREVENT: [17, 18],
    LEFTARROW: 37,
    UPARROW: 38,
    DOWNARROW: 40
  };
  public autocompletePlaces = [];
  public fetchingSuggestion = false;
  selectedSearchPlace = {};
  public fetchingSingleSuggestion = false;
  public processing = true;
  public singleUnit: any = '';
  public singleUnitType = 'top_markets';
  public geoPanelIds = [];
  public selectedSingleUnit: number = null;
  public isSmallScreen = false;
  public inventorySets: any = [];
  map: any;
  public SelectedLayerColorPalet = '';
  private duplicateSelectedColorPalet = '';
  private themeSetting: any;
  private defaultPrimaryColor = '';
  private defaultSceondaryColor = '';
  public customIcons = ['icon-circle', 'icon-place', 'icon-circle-stroke', 'icon-star1', 'icon-square', 'icon-triangle', 'icon-street-view', 'icon-map-signs', 'icon-map-o', 'icon-map', 'icon-globe', 'icon-location-arrow','icon-thumb-tack', 'icon-bullseye', 'icon-circle-o','icon-neuter']; //,

  // 'icon-train', 'icon-car', 'icon-home', 'icon-bank', 'icon-store', 'icon-shopping', 'icon-shopping-2', 'icon-hotel', 'icon-bar', 'icon-restaurant', 'icon-gas', 'icon-warning'
  public fetchingGeography = false;
  public geographyData = [];
  public isGeographyAvailable = false;
  public isLayerPackage = false;
  public isInventorySetLoaded = false;
  public placeModulePermission: any;
  public inventorySetModulePermission: any;
  closeTab = false;
  public clearLayer = false;
  private unSubscribe: Subject<void> = new Subject<void>();
  private placeSetSearchText = '';
  public isSearchingPlace = false;
  @Input() layersOptionsList = [
    'inventory collection',
    'place collection',
    'geopathId',
    'place',
    'geography',
    'geo sets'
  ];
  public pageInation: Pagination = { page: 1, size: 10 };
  public isLoading = false;
  // used to store selected geosets from mysaved geographies
  // currently using in population library
  public selectedGeoSetIds = [];
  geoSetsLazyLoader = new LazyLoaderService();

  constructor(
    private formatService: FormatService,
    private place: PlacesService,
    private commonService: CommonService,
    private layersService: LayersService,
    private exploreDataService: ExploreDataService,
    private theme: ThemeService,
    private workSpaceDataService: WorkSpaceDataService,
    private exploreService: ExploreService,
    private inventoryService: InventoryService,
    private auth: AuthenticationService,
    private placesDataService: PlacesDataService,
    private workSpaceService: WorkSpaceService
  ) { }

  ngOnInit() {
    this.themeSetting = this.theme.getThemeSettings();
    this.defaultPrimaryColor = this.themeSetting['color_sets']['primary'] && this.themeSetting['color_sets']['primary']['base'];
    this.defaultSceondaryColor = this.themeSetting['color_sets']['secondary'] && this.themeSetting['color_sets']['secondary']['base'];
    this.placeModulePermission = this.auth.getModuleAccess('places');
    const exploreModulePermission = this.auth.getModuleAccess('explore');
    this.inventorySetModulePermission = exploreModulePermission['features']['inventorySet'];

    this.commonService.getMobileBreakPoint()
    .subscribe(isMobile => { this.isSmallScreen = isMobile; });
    this.loadFromSession();
    this.isInventorySetLoaded = false;
    // The below observable we need in explore as we are going to update sets when a new set is created
    this.workSpaceDataService
      .getPackages()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(packages => {
        if (packages && packages.length) {
          const inventorySets = packages.sort(this.formatService.sortAlphabetic);
          this.inventorySets = Helper.deepClone(inventorySets);
          this.isInventorySetLoaded = true;
          this.loadSearchResultLayer();
          this.loadFromSession();
        }
      });

    this.workSpaceService
    .getExplorePackages().subscribe(response => {
      if (typeof response['packages'] !== 'undefined' && response['packages'].length > 0) {
        this.workSpaceDataService.setPackages(response['packages']);
        const inventorySets = response['packages'].sort(this.formatService.sortAlphabetic);
        this.inventorySets = Helper.deepClone(inventorySets);
        this.isInventorySetLoaded = true;
        this.loadSearchResultLayer();
        this.loadFromSession();
      }
    });
    this.layersService.getApplyLayers().subscribe((value) => {
      this.closeTab = false;
      if (value['type'] === this.layerType) {
        this.closeTab = value['closeTab'];
        if (!value['flag']) {
          this.layersService.cleanUpMap(this.map);
          this.removeLayers();
        } else {
          this.loadFromSession();
        }
      }
    });

    if (this.layerType === 'primary') {
      this.exploreDataService.getMapObject().subscribe(mapObject => {
        this.map = mapObject;
      });
    } else {
      this.exploreDataService.getSecondaryMapObject().subscribe(mapObject => {
        this.map = mapObject;
      });
    }

    // Initial loading the place sets
    this.getPlacesSets();

    this.layersService.onPushSearchResultLayer()
    .subscribe(value => {
      const layersSession = this.layersService.getlayersSession(this.layerType);
      this.isLayerPackage = value;
      this.loadSearchResultLayer();
      if (!value) {
        this.inventorySets = this.inventorySets.filter(layer => layer['_id'] !== 'default');
        this.selectedLayers = this.selectedLayers.filter(layer => layer['id'] !== 'default');
        if (layersSession && layersSession['selectedLayers']) {
          this.layersService.saveLayersSession({
            selectedLayers: layersSession['selectedLayers'].filter( (layer) => layer['id'] !== 'default')
          }, this.layerType);
        }
      }
    });
  }


  private loadSearchResultLayer() {
    const layersSession = this.layersService.getlayersSession(this.layerType);
    let searchLayer = null;
    if (this.isInventorySetLoaded && this.isLayerPackage) {
      const defaultLayer = this.inventorySets.find((layer) => layer['_id'] === 'default');
      if (!defaultLayer) {
        const data = {'_id': 'default', 'name': 'Search Results'};
        this.inventorySets.unshift(data);
        if (layersSession !== null && layersSession.selectedLayers) {
          const selected = layersSession.selectedLayers;
          searchLayer = selected.find((d) => d['id'] === 'default');
        }
        const removedLayer = this.layersService.getRemovedSearchLayer();
        if ((searchLayer === null || !searchLayer) && (removedLayer === null || !removedLayer)) {
          this.moveLayer(data, 'inventory collection', 0);
          this.layersService.setRemovedSearchLayer(false);
          const selectedLayers = [{
            'data': data,
            'type': 'inventory collection',
            'id': 'default',
            'icon': 'icon-wink-pb-dig',
            'color': this.defaultPrimaryColor
          }];
          this.layersService.saveLayersSession({
            selectedLayers: selectedLayers
          }, this.layerType);
        }
      }
    }
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
      case 'inventory collection':
        let icon = 'icon-circle';
        if (layer['_id'] === 'default') {
          icon = 'icon-wink-pb-dig';
        }
        this.selectedLayers.push({data: layer, type: type, id: layer._id,  icon: icon, color: this.defaultPrimaryColor});
        this.inventorySets[position]['selected'] = true;
        this.updateSelecetedLayers();
      break;
      case 'place collection':
        // have removed layer and made as empty
        this.selectedLayers.push({data: layer, type: type, id: layer._id, icon: 'icon-place', color: this.defaultPrimaryColor});
        this.filteredPlacePacks[position]['selected'] = true;
        this.updateSelecetedLayers();

      break;
      case 'place':
        layer['geometry'] = layer['location']['point'];
        if(!(layer?.type)){
          layer['type'] = 'Feature';
        }
        if(!(layer?.properties?.location_name)){
          layer['properties']['location_name'] = layer?.place_name ?? null;
        }
        this.selectedLayers.push({
          data: layer,
          type: type,
          id: layer?.properties?.ids?.safegraph_place_id,
          icon: 'icon-place',
          color: this.defaultSceondaryColor
        });
        this.autocompletePlaces[position]['selected'] = true;
        this.updateSelecetedLayers();
      break;
      case 'geopathId':
        this.selectedLayers.push({
          data: layer,
          type: type,
          id: layer.toString(),
          icon: 'icon-circle-stroke',
          color: this.defaultPrimaryColor,
          heatMapType: this.singleUnitType,
        });
        this.selectedSingleUnit = layer;
        this.updateSelecetedLayers();
      break;
      case 'geography':
      this.geographyData[position['key']][position['index']]['selected'] = true;
        this.exploreService.getmarketGeometry({id: layer.id, type: position['key']})
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
      case LayerType.GEO_SETS:
        this.selectedLayers.push({
          data: layer,
          type: type,
          id: layer._id,
          icon: 'icon-circle',
          color: this.defaultSceondaryColor
        });
        if(this.selectedGeoSetIds.indexOf(layer._id) === -1)this.selectedGeoSetIds.push(layer._id);
        this.updateSelecetedLayers();
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
  public removeLayer(layer , type, position) {
    switch (type) {
      case 'inventory collection':
        const selectedInventoryIndex = this.inventorySets.findIndex(item => item._id === layer._id);
        if (selectedInventoryIndex >= 0 && selectedInventoryIndex !== undefined) {
          this.inventorySets[selectedInventoryIndex]['selected'] = false;
        }
        this.selectedLayers.splice(position, 1);
        this.updateSelecetedLayers();
        break;
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
          item.properties.ids.safegraph_place_id === layer.properties.ids.safegraph_place_id);
        if (singlePlaceIndex >= 0 && singlePlaceIndex !== undefined) {
          this.autocompletePlaces[singlePlaceIndex]['selected'] = false;
        }
        this.selectedLayers.splice(position, 1);
        this.updateSelecetedLayers();
        break;
      case 'geopathId':
        const selectedGPIdIndex = this.selectedLayers.findIndex(item => item.id === layer || item.id === layer.toString());
        this.selectedLayers.splice(selectedGPIdIndex, 1);
        this.updateSelecetedLayers();
        this.selectedSingleUnit = null;
        break;
      case 'geography':
        if (this.geographyData && Object.keys(this.geographyData).length > 0) {
          this.geographyData[this.selectedLayers[position]['geography']].map(element => {
            if (element.id === Number(layer.id)) {
              element['selected'] = false;
            }
          });
        }
        this.selectedLayers.splice(position, 1);
        this.updateSelecetedLayers();
        break;
      case LayerType.GEO_SETS:
        const index = this.selectedLayers.findIndex(item => item.data._id == layer._id);
        if(index > -1){
          this.selectedLayers.splice(index, 1);
          const selectedGeoSetIdx = this.selectedGeoSetIds.findIndex(geoSetId => geoSetId== layer._id);
          if(selectedGeoSetIdx > -1) {
            this.selectedGeoSetIds.splice(selectedGeoSetIdx, 1);
            this.selectedGeoSetIds = [...this.selectedGeoSetIds];
          }
        }
        this.updateSelecetedLayers();
        break;

    }

  }

  public loadFromSession() {
    const layersSession = this.layersService.getlayersSession(this.layerType);
    this.selectedLayers = [];
    if (layersSession && layersSession['selectedLayers'] && layersSession.selectedLayers.length > 0) {
      if (layersSession['selectedLayers'] && layersSession['selectedLayers'].length) {
        this.selectedLayers = layersSession['selectedLayers'].filter(layer => this.layersOptionsList.includes(layer.type));
      } else {
        this.selectedLayers = [];
      }
      this.changeOfLayers.emit(this.selectedLayers);
      this.inventorySets.map(val => val.selected = false );
      this.filteredPlacePacks.map(val => val.selected = false );
      this.selectedLayers.map((layer) => {
        switch (layer.type) {
          case 'inventory collection':
            if (!layer['color'] && !layer['icon']) {
              layer['icon'] = 'icon-circle';
              layer['color'] = this.defaultPrimaryColor;
            }
            const setIndex = this.inventorySets.findIndex(pack => pack._id === layer.id);
            if (setIndex >= 0) {
              this.inventorySets[setIndex]['selected'] = true;
            }
          break;
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
            this.autocompletePlaces.push(layer.data);
          break;
        case 'geopathId':
            layer['data'] = layer['id'];
            this.selectedSingleUnit = layer['data'];
            break;
          case 'geography':
            if (!layer['color'] && !layer['icon']) {
              layer['icon'] = 'icon-circle';
              layer['color'] = this.defaultPrimaryColor;
            }
            layer['selected'] = true;
            layer['data']['name'] = layer['data']['properties']['name'];
          break;

          case LayerType.GEO_SETS:
            if (!layer['color'] && !layer['icon']) {
              layer['icon'] = 'icon-circle';
              layer['color'] = this.defaultPrimaryColor;
            }
            if(this.selectedGeoSetIds.indexOf(layer.data._id) === -1){
              this.selectedGeoSetIds.push(layer.data._id)
            }
            break;
        }
      });
    }
  }

  private updateSelecetedLayers() {
    this.changeOfLayers.emit(this.selectedLayers);
  }

  private removeLayers() {
    this.selectedLayers = [];
    this.autocompletePlaces = [];
    this.changeOfLayers.emit(this.selectedLayers);
    this.filteredPlacePacks.map(pack => pack['selected'] = false);
    this.autocompletePlaces.map(pack => pack['selected'] = false);
    this.inventorySets.map(pack => pack['selected'] = false);
    if (this.layerType === 'primary' || !this.closeTab) {
      this.layersService.saveLayersSession({
        title: this.layerType === 'primary' ? 'Primary Map' : 'Secondary Map',
        selectedLayers: []
      }, this.layerType);
    } else {
      this.layersService.saveLayersSession({}, this.layerType);
    }
      this.selectedSingleUnit = null;
    this.geographyData = [];
    this.clearLayer = true;
    this.selectedGeoSetIds = [];
    // Need to check
    // this.layersService.saveLayersSession({selectedLayers: []}, 'place');
    // this.layersService.setLayers(this.selectedLayers);
  }

  // selected layer actions
  isPopulationEnabled: any;
  public openColorPalet(layerID) {
    if (this.SelectedLayerColorPalet === layerID) {
      this.SelectedLayerColorPalet = '';
    } else {
      this.SelectedLayerColorPalet = layerID;
    }
  }

  public onAppColorChange(layer, color, type, icon = 'icon-place') {
    if (type === 'inventory collection' && icon === 'icon-wink-pb-dig') {
      color = this.defaultPrimaryColor;
    }
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

  public layer($event) {
    if ($event.type === 'place') {
      this.autocompletePlaces = $event.autocompletePlaces;
    }
    if ($event.type === 'geography') {
      this.geographyData = $event.geographyData;
    }
    this.moveLayer($event.layer, $event.type, $event.position);
  }

  public onSingleUnitSearch() {
    // commented on 17-07-2019 due to removal autocomplete function intemx api
   /*if (!(this.singleUnit.length >= 4)) {
      return false;
    }
    this.fetchingSingleSuggestion = true;
    this.layersService
      .geoPanelAutoComplete(this.singleUnit, true)
      .pipe(tap(res => {
        this.fetchingSingleSuggestion = false;
      })).subscribe(response => {
      this.geoPanelIds = response['geopathPanelList'];
      if (this.geoPanelIds.length <= 0) {
        this.processing = false;
      }
    }, error => {
      console.log(error);
    });*/

    if (this.singleUnit.trim().length >= 1) {
      this.processing = true;
      this.fetchingSingleSuggestion = true;
      this.inventoryService.
      searchInventoryById(this.singleUnit.trim()).subscribe(respose => {
        this.fetchingSingleSuggestion = false;
        this.processing = false;
        if (respose && respose.id === Number(this.singleUnit.trim())) {
          this.geoPanelIds = [this.singleUnit.trim()];
        } else {
          this.geoPanelIds = [];
        }
      }, error => {
        this.fetchingSingleSuggestion = false;
        this.processing = false;
        this.geoPanelIds = [];
      });
    }
  }

  getPlacesSets() {
    this.isLoading = true;
    this.place.getPlacesSet(null, this.pageInation, this.placeSetSearchText)
    .pipe(map(data => data['data']),
    takeUntil(this.unSubscribe))
    .subscribe(data => {
      this.isLoading = false;
      if (!data) {
       return;
      }
     this.formatPlaceSet(data);
    });
  }

  formatPlaceSet(placeData, pagination=true){
    const selectedLayers = Helper.deepClone(this.selectedLayers);
    const selectedPlaceSet = selectedLayers.filter(layer => layer.type='place collection');
    if(selectedPlaceSet.length){
      placeData.map( placeSet => {
        const index = selectedPlaceSet.findIndex(place => place.id === placeSet._id);
          if (index >= 0) {
            placeSet['selected'] = true;
          }
      });
    }
    if (pagination) {
      this.filteredPlacePacks = this.filteredPlacePacks.concat(placeData);
    } else {
      this.filteredPlacePacks = placeData;
    }
    this.filteredPlacePacks.sort(this.formatService.sortAlphabetic);
  }

  loadMorePlaceSets() {
    this.pageInation.page += 1;
    this.isLoading = true;
    this.getPlacesSets();
  }

/**
 *
 * @param event emit value
 */
  public searchPlaces(event) {
    this.placeSetSearchText = event && event.toString().trim();
    this.isSearchingPlace = true;
    this.place.getPlacesSet(null, true, this.placeSetSearchText)
    .pipe(takeUntil(this.unSubscribe)).subscribe(
      result => {
        this.isSearchingPlace = false;
        if (result && result['data']) {
          this.formatPlaceSet(result['data'], false);
          this.pageInation.page = 1;
        }
      },
      error => {
        console.log(error);
        this.isSearchingPlace = false;
      });
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  onGeoSetSelected(geographySet: GeographySet) {
    this.moveLayer(geographySet, LayerType.GEO_SETS, null);
  }

}
