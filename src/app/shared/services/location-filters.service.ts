import {forkJoin, Observable, of, Subject} from 'rxjs';
import {ChangeDetectorRef, Injectable} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw';
import turfCircle from '@turf/circle';
import turfUnion from '@turf/union';
import * as turfHelper from '@turf/helpers';
import {FormControl} from '@angular/forms';
import swal from 'sweetalert2';
import {catchError, map} from 'rxjs/operators';

import {FormatService, InventoryService, LoaderService} from '@shared/services';
import {PopulationService} from '../../population/population.service';
import {RadiusMode} from '../../classes/radius-mode';
import {ChipSource, GroupAutocompleteChipSource} from '@interTypes/ChipsInput';
import {Geography} from '@interTypes/inventory';
import {PlacesFiltersService} from '../../places/filters/places-filters.service';
import {Pagination} from '@interTypes/pagination';
import {BasePlaceSets, Helper} from '../../classes';

@Injectable()
export class LocationFilterService extends BasePlaceSets {

  draw: MapboxDraw;
  map: mapboxgl.Map;

  public mapViewSearch = 0;
  customPolygonFeature: any = {
    id: '1234234234234234',
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: []
    },
    properties: {}
  };
  polygonData: any = {'type': 'FeatureCollection', 'features': []};
  customPolygon: any = {'type': 'MultiPolygon', 'coordinates': []};
  geoPolygon = false;
  redraw = false;
  placeSetsDisplay = false;
  polygonInfo: any;
  mapDrawEnable = false;
  circleDrawEnable = false;
  enableMapInteractionFlag = true;
  addingMapDraw = false;
  dynamicMapView = 0;
  locationFilterData: any;
  polygonFiltersSource = new Subject();

  public geographySearch$: Observable<GroupAutocompleteChipSource<Geography>[]>;
  public selectedGeographies: ChipSource<Geography>[] = [];
  selectedPlacesCtrl = new FormControl();
  radiusCtrl =  new FormControl();
  appySelectedGoegrapies = new Subject();
  filterByPlaceSets = new Subject();

  constructor(
    private populationService: PopulationService,
    public loaderService: LoaderService,
    private placeFilterService: PlacesFiltersService,
  ) {
    super(placeFilterService, null);
  }

  /**
   * @description
   *   Load the dependencies manually.
   * @param cdRef
   */
  loadDependency(cdRef: ChangeDetectorRef) {
   super.loadDependency(cdRef);
  }

  /**
   * @description
   *
   *   This initial values for drawing on map
   *
   * @param map - mapbox map instance
   * @param draw - mapDrawGl instance
   */
  initMapInstance(map, draw) {
    this.map = map;
    this.draw = draw;
  }

  /**
   * @description
   *  Set the initial value for Filter by Place Set and Radius
   */
  initPlaceSets() {

    this.isLoading = true;
    this.setPlaceSets();
  }

  /** Filter by Place Set and Radius */

  public applyForm() {

    if (this.selectedPlacesCtrl.value && this.selectedPlacesCtrl.value.length > 0) {
      if (this.radiusCtrl.value <= 0 || this.radiusCtrl.value === '') {
        swal('Warning', 'Please enter a distance greater than zero.', 'warning');
        return false;
      }
     this.searchByPlaceSets();
    }
    return true;
  }

  getFilteredByPlaceSets() {
    return this.filterByPlaceSets.asObservable();
  }

  /**
   * @todo -placeset search not implemented
   * @param value
   */
  public searchGeographies(value: string) {
    console.log('searchGeographies');

    // this.geographySearch$ = this.inventoryService.getGeographies(value, false);
  }

  /**
   * @description
   *   Set the selected geography values
   *
   * @param selected
   */
  public geographySelected(selected: Geography) {
    const existGeo = this.selectedGeographies.filter(geo => geo['data']['id'] === selected.id && geo['data']['type'] === selected.type);
    if (existGeo && existGeo.length <= 0) {
      const label = `${selected.type}: ${selected.label}`;
      const geography: ChipSource<Geography> = {label: label, data: selected};
      this.selectedGeographies = [...this.selectedGeographies, geography];
    }
  }

  /**
   * @description
   *  Remove the selected geography
   * @param removed
   */
  public onGeographyRemoved(removed) {
    this.selectedGeographies = this.selectedGeographies.filter(geography => {
      return geography.data.id !== removed.data.id;
    });
  }

  // to remove custom polygon and draw controls
  removePolygon(updateMap = true) {
    if (this.mapViewSearch > 0) {
      this.removeMapViewPolygon(true, 'mapViewPolygon');
    } else if (this.geoPolygon) {
      this.removeMapViewPolygon(true, 'geoPolygon');
    } else if (this.placeSetsDisplay) {
      this.removePlaceSetsPolygon(updateMap);
    } else {
      this.togglePolygonLayerView(false);
      if (this.mapDrawEnable || this.circleDrawEnable) {

        this.removePolygonFeature();
        this.map.removeControl(this.draw);
        this.map.getContainer().classList.remove('mouse-add');
        // }

        this.enableMapInteraction();
        if (this.mapDrawEnable) {
          this.mapDrawEnable = false;
        } else {
          this.circleDrawEnable = false;
        }
        this.customPolygon.coordinates = [];
        this.customPolygonFeature.geometry = {
          type: 'Polygon',
          coordinates: []
        };
        this.polygonData.features = [];
        if (updateMap) {
          this.populationService.setPopulationFilter('location', {});

        }
        this.addingMapDraw = true;
      }
    }
  }

  // initializing the draw functionality of custom polygon
  drawPolygon() {
    this.addingMapDraw = true;
    if (this.circleDrawEnable) {
      this.removePolygon(true);
    }
    if (!this.map.getSource('mapbox-gl-draw-cold')) {
      this.map.addControl(this.draw);
    }
    this.mapDrawEnable = true;
    if (this.draw.getAll().features.length > 0) {
      this.draw.deleteAll();
    }
    if (this.mapViewSearch > 0) {
      this.removeMapViewPolygon(true, 'mapViewPolygon');
    }
    if (this.geoPolygon) {
      this.removeMapViewPolygon(true, 'geoPolygon');
    }
    if (this.placeSetsDisplay) {
      this.removePlaceSetsPolygon(true);
    }
    if (this.dynamicMapView > 0) {
      $('#location-search').click();
    }
    this.polygonData.features = [];
    // this.customPolygonFeature.geometry.coordinates = [];
    this.draw.changeMode('draw_polygon');
    this.map.on('draw.create', this.updateFiltersFromPolygon.bind(this));
    this.disableMapInteraction();
    this.togglePolygonLayerView(false);
  }

  /**
   * @description
   *  Drawing radius circle on map
   */
  drawCircle() {
    this.addingMapDraw = true;
    if (this.mapDrawEnable) {
      this.removePolygon(true);
    }
    if (!this.map.getSource('mapbox-gl-draw-cold')) {
      this.map.addControl(this.draw);
    }
    this.circleDrawEnable = true;
    if (this.draw.getAll().features.length > 0) {
      this.draw.deleteAll();
    }
    if (this.mapViewSearch > 0) {
      this.removeMapViewPolygon(true, 'mapViewPolygon');
    }
    if (this.geoPolygon) {
      this.removeMapViewPolygon(true, 'geoPolygon');
    }
    if (this.placeSetsDisplay) {
      this.removePlaceSetsPolygon(true);
    }
    if (this.dynamicMapView > 0) {
      $('#location-search').click();
    }
    this.polygonData.features = [];
    this.customPolygonFeature.geometry = {
      type: 'Polygon',
      coordinates: []
    };
    this.draw.changeMode('draw_radius');
    this.map.on('draw.create', this.updateFiltersFromPolygon.bind(this));
    this.disableMapInteraction();
    this.togglePolygonLayerView(false);
  }

  // To remove default & geo map view polygons
  removeMapViewPolygon(updateMap = true, polygonType) {
    this.customPolygonFeature.geometry.coordinates = [];
    this.polygonData.features = [];
    this.customPolygon.coordinates = [];
    this.togglePolygonLayerView(false);
    switch (polygonType) {
      case 'mapViewPolygon':
        this.mapViewSearch = 0;
        break;
      case 'geoPolygon':
        this.geoPolygon = false;
        if (this.redraw === false) {
          $('#search-locations').val('');
        }
        this.redraw = false;
        break;
      default:
        break;
    }
    if (updateMap) {
      this.populationService.setPopulationFilter('location', {});
    }
  }

  // to on or off polygon layers
  togglePolygonLayerView(enable = false) {
    if (!this.map.getSource('polygonData')) {
      return;
    }
    if (enable) {
      this.map.getSource('polygonData').setData(this.polygonData);
      this.map.setLayoutProperty('customPolygon', 'visibility', 'visible');
      this.map.setLayoutProperty('customPolygonStroke', 'visibility', 'visible');
    } else {
      const emptyData = Object.assign({}, this.polygonData);
      emptyData.features = [];
      this.map.getSource('polygonData').setData(emptyData);
      this.map.setLayoutProperty('customPolygon', 'visibility', 'none');
      this.map.setLayoutProperty('customPolygonStroke', 'visibility', 'none');
    }
  }


  removePlaceSetsPolygon(updateMap = true) {
    this.loaderService.display(true);
    this.placeSetsDisplay = false;
    this.polygonInfo = {};
    this.populationService.setSelectedPlacesCtrlValue([]);
    this.populationService.setRadiusCtrlValue('');
    this.customPolygonFeature.geometry.coordinates = [];
    this.customPolygon.coordinates = [];
    this.polygonData.features = [];
    this.togglePolygonLayerView(false);
    this.loaderService.display(false);
    if (updateMap) {
      this.populationService.setPopulationFilter('location', {});

    }
  }

  // to remove custom polygon object
  removePolygonFeature() {
    this.draw.deleteAll();
  }

  /**
   * @description
   *  Disable teh map interaction commonly using at after drawing applied
   */
  enableMapInteraction() {
    if (!this.enableMapInteractionFlag) {
      this.enableMapInteractionFlag = true;
      this.map['boxZoom'].enable();
      this.map['doubleClickZoom'].enable();
      this.map['scrollZoom'].enable();
    }
  }


  /**
   * @description
   *  Disable teh map interaction commonly using at when drawing applied
   */
  disableMapInteraction() {
    if (this.enableMapInteractionFlag) {
      this.enableMapInteractionFlag = false;
      this.map['boxZoom'].disable();
      this.map['doubleClickZoom'].disable();
      this.map['scrollZoom'].disable();
    }
  }

  // updating map when drawing polygon is done
  private updateFiltersFromPolygon(polygonFromSession = {}) {
    // generate bounding box from polygon the user drew
    if (((this.mapDrawEnable || this.circleDrawEnable) &&
      this.draw.getAll().features.length > 0) || polygonFromSession['region']) {
      this.customPolygon.coordinates = [];
      if (polygonFromSession['region']) {
        this.customPolygon.coordinates.push([].concat.apply([], polygonFromSession['region']['coordinates']));
        if (polygonFromSession['regularPolygon']) {
          this.mapDrawEnable = true;
        } else if (polygonFromSession['circularPolygon']) {
          this.circleDrawEnable = true;
        }
        this.customPolygonFeature.geometry = polygonFromSession['region'];
        this.polygonData.features.push(this.customPolygonFeature);

      } else {
        if (this.circleDrawEnable) {
          this.customPolygon.coordinates = [];
          this.customPolygon.coordinates.push([RadiusMode.circleCoordinates]);
          this.customPolygonFeature.geometry.coordinates.push(RadiusMode.circleCoordinates);
          this.polygonData.features.push(this.customPolygonFeature);
          this.setCustomPolygonFilters('circularPolygon');
        } else {
          this.customPolygon.coordinates = [];
          this.customPolygon.coordinates.push(this.draw.getAll().features[0].geometry.coordinates);
          this.polygonData.features.push(this.draw.getAll().features[0]);
          this.setCustomPolygonFilters('regularPolygon');
        }
      }
      // enabling polygon layer view
      this.togglePolygonLayerView(true);

      if (!polygonFromSession['region']) {
        this.removePolygonFeature();
      }
      setTimeout(() => {
        this.enableMapInteraction();
      }, 200);
    }
  }

  /**
   * @description
   *
   *  The final result of the draw circle, polygon.
   *
   * @param filterType - specified in the param type
   */
  setCustomPolygonFilters(filterType: 'circularPolygon' | 'regularPolygon') {
    return this.polygonFiltersSource.next(
      {
        region: this.customPolygon,
        type: filterType
      });
  }

  getCustomPolygonFilters() {
    return this.polygonFiltersSource.asObservable();
  }

  /**
   * @description
   *  Emitting formatted values of  Filter by Place Set and Radius when apply
   */
  private searchByPlaceSets() {

    let featuresCollection: any;
    featuresCollection = turfHelper.featureCollection([]);
    let radius = 0;
    let combinedFeature: any;
    const selectedPlaceDetails = [];
    const selectedPanels = [];
    if (this.radiusCtrl.value > 0) {
      radius = this.radiusCtrl.value;
      const placesId = [];
      this.selectedPlacesCtrl.value.forEach(place => {
        placesId.push(place._id);
      });
      const params = {'ids': placesId};
      this.placeFilterService.getPlaceSetsSummary(params).subscribe( response => {
        if (response['data'].length > 0) {
          response['data'].forEach(place => {
            selectedPlaceDetails.push(place);
            place['pois'].map(poi => {
              selectedPanels.push(poi.properties.ids.safegraph_place_id);
              const circleFeature = turfCircle(poi.geometry.coordinates, radius, {steps: 64, units: 'miles', properties: poi.properties});
              featuresCollection.features.push(circleFeature);
            });
          });
          if (featuresCollection.features.length) {
            if(featuresCollection.features.length < 2){
              // If only one feature present converting that in to polygon
              combinedFeature = Helper.deepClone(featuresCollection.features[0]);
            } else {
              // If more than one feature present then combining them in to polygon
              // @ts-ignore
              combinedFeature = turfUnion(...featuresCollection.features);
            }

            combinedFeature.geometry.coordinates.map((coordinate, index) => {
              if (coordinate.length > 1) {
                combinedFeature.geometry.coordinates[index] = [coordinate];
              }
            });
            this.filterByPlaceSets.next({
              featureCollection: featuresCollection,
              polygon: combinedFeature,
              selectedPanels: selectedPanels,
              selectedPlaces: this.selectedPlacesCtrl.value,
              radiusValue: radius,
              selectedPlaceDetails: selectedPlaceDetails
            });
          }
        }
      });
    }
  }

}
