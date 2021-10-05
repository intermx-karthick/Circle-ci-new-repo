import {ChangeDetectionStrategy, Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef} from '@angular/core';
import {StaticMapProperties} from '@interTypes/staticMapProperties';
import * as mapboxgl from 'mapbox-gl';
import {ThemeService, MapService } from '@shared/services';
import {environment} from '../../../environments/environment';
@Component({
  selector: 'app-display-map',
  templateUrl: './display-map.component.html',
  styleUrls: ['./display-map.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayMapComponent implements OnInit, OnChanges {
  @Input() properties: StaticMapProperties;
  public isMapNeeded = false;
  public image: string;
  public alt = 'Map place';
  public map: mapboxgl.map;
  public featuresCollection = { 'type': 'FeatureCollection', 'features': [] };
  private themeSettings: any;
  private readonly mapStyle = 'cjo8btwwg03882spkvkdmz4la';
  public isImage = true;
  public mapStyleUrl: string;

  constructor(
    private themeService: ThemeService,
    private cdRef: ChangeDetectorRef,
    private mapService: MapService) {
    this.themeSettings = this.themeService.getThemeSettings();
    if (this.themeSettings['basemaps']) {
      const baseMapUrl = this.themeService.getMapStyleURL('satellite')
      this.mapStyleUrl = baseMapUrl;
      this.mapStyle = baseMapUrl.split('/').pop();
    }
  }
  ngOnInit() {
    this.loadImage();
    mapboxgl.accessToken = environment.mapbox.access_token;
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.properties && changes.properties.currentValue) {
      this.isMapNeeded = false;
      this.cdRef.markForCheck();
      this.loadImage();
    }
  }

  /**
   * This function is to get the mapbox static image
   */
  private loadImage() {
    if (!this.hasOwnProperty('properties')) {
      throw new Error('Map Properties must be passed as input');
    }
    const props: StaticMapProperties = this.properties;
    if (props.alt) {
      this.alt = props.alt;
    }
    this.featuresCollection.features = [];
    if (props.feature) {
      this.featuresCollection.features.push({
        type: 'Feature',
        geometry: {
          'type': props.feature['type'],
          'coordinates': props.feature['coordinates']
        },
        properties: {
          fill: props.fillColor ? props.fillColor : this.themeSettings['color_sets'] && this.themeSettings.color_sets.secondary.base,
          stroke: props.stokeColor ? props.stokeColor : this.themeSettings['color_sets'] && this.themeSettings.color_sets.primary.base
        }
      });
    }
    const polygon = encodeURIComponent(JSON.stringify(this.featuresCollection));
    let geoJson = '';
    if (props.feature) {
      geoJson = `geojson(${polygon})/`;
    }
    if (props.coordinates.length) {
      this.isImage =  true;      
    } else {
      this.isImage =  false;
    }
    this.image = `https://api.mapbox.com/styles/v1/intermx/${this.mapStyle}/static/${geoJson}${props.coordinates[0]},${props.coordinates[1]},${props.zoom},0,0/${props.width}x${props.height}?access_token=${environment.mapbox.access_token}`;
  }

  /**
   * This function is to load map with polygon layer when static image fails
   */
  public imageError() {
    if (this.map) {
      this.setMapData();
      return;
    }
    this.map = new mapboxgl.Map({
      container: 'displayMap',
      style: this.mapStyleUrl,
      minZoom: 2,
      maxZoom: 22,
      center: this.properties.coordinates,
      zoom: this.properties.zoom, // starting zoom,
      interactive: false
    });
    this.map.on('style.load', () => {
      this.mapService.createPolygonLayers(this.map, this.featuresCollection);
      this.setMapData();
    });
  }

  /**
   * This function is to update polygon layer with new data
   */
  private setMapData() {
    this.isMapNeeded = true;
    this.cdRef.markForCheck();
    if (this.map.getSource('polygonData')) {
      this.map.getSource('polygonData').setData(this.featuresCollection);
    }
    this.map.setCenter(this.properties.coordinates);
  }
}
