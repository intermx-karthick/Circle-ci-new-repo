import * as mapboxgl from 'mapbox-gl';

import { GeographySet, GeographyType, MapLayers } from '@interTypes/Population';
import { Helper } from './helper';
import { ChangeDetectorRef } from '@angular/core';
import turfCenter from '@turf/center';
import { environment } from 'environments/environment';
import { MapboxFactory, MapboxFactoryEnum } from './mapbox-factory';


/**
 * @description
 *   Base layer class for avoid  using common code in
 *   layers and display options of all population, places and
 *   inventory layers.
 *
 */
export class BaseLayers  {
  selectedLayerData = {};
  public selectedLayersMapIds = [];
  public markerIcon: any = environment.fontMarker;

  constructor(
    private map: mapboxgl.Map,
    public cdRef: ChangeDetectorRef
  ) {
  }

  /**
   * @description
   *   Adding geoset layers on map
   *
   * @param mapLayers
   * @param layerData
   */
  public addGeoSetLayer(mapLayers, layerData) {
    const geoIds = [];
    this.selectedLayersMapIds = [];
    this.selectedLayerData = Helper.deepClone(layerData);

    (layerData.data as GeographySet).markets.forEach((market) => {
      if (!market) {
        return;
      }
      if (geoIds.indexOf(market.geo_id) === -1) {
        geoIds.push(market.geo_id);
      }
    });

    const geoType = layerData.data.market_type.toLowerCase() as any;
    return this.drawGeographyLayersOnMap(geoType, geoIds, layerData['color'], mapLayers);

  }

  /**
   * @description
   *   Drawing layer on map
   *
   * @param geoType
   * @param selectedGeoIds
   * @param layerColor
   * @param mapLayers
   */
  private drawGeographyLayersOnMap(
    geoType: keyof GeographyType,
    selectedGeoIds: string[],
    layerColor: string,
    mapLayers
  ) {

    try {
      const sourceId = Helper.generateUniqueId('geography-set');
      const layerId = Helper.generateUniqueId('geography-set');
      if (!(mapLayers as any).populationLibrary) {
        return;
      }
      const geoLayer = (mapLayers as any).populationLibrary[geoType];
      if (!geoLayer) {
        return;
      }

      this.map.addSource(sourceId, {
        type: 'vector',
        url: geoLayer['url']
      });

      const filterQuery = ['in', 'geoid', ...selectedGeoIds];

      this.map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        'source-layer': geoLayer['source-layer'],
        'metadata': this.selectedLayerData,
        paint: {
          'fill-outline-color': '#551875',
          'fill-opacity': 0.8,
          'fill-color': layerColor
        },
        'filter': filterQuery
      });


      this.addPopupOnLayer(layerId);

      return layerId;

    } catch (e) {
      console.error(e);
      return '';
    }

  }

  public addLayerSource(map) {
    this.map = map;
      if(this.map){
        this.map.addSource('geoSetPoint', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        this.map.addLayer({
          id: 'geoSetPointCenter',
          type: 'symbol',
          source: 'geoSetPoint',
          minzoom: 0,
          layout: {
            'text-line-height': 1,
            'text-padding': 0,
            'text-anchor': 'bottom',
            'text-allow-overlap': true,
            'text-field': ['get', ['to-string', ['get', 'icon']], ['literal', this.markerIcon]],
            'icon-optional': true,
            'text-font': ['imx-map-font-43 Regular'],
            'text-size': 18,
            'text-offset': [0, 0.6]
          },
          paint: {
            'text-translate-anchor': 'viewport',
            'text-color': ['get', 'color'],
            'text-halo-color': '#fff',
            'text-halo-width': 0.5
          }
        });
      }
  }

  public bindGeoSetIcon(layersId, map){
    this.map = map;
    this.selectedLayersMapIds = layersId;
    if(this.map && this.selectedLayersMapIds.length){
      this.map.off('sourcedata', this.geoSetLayerSourceDataListener.bind(this));
      this.map.on('sourcedata', this.geoSetLayerSourceDataListener.bind(this));
    }
  }

  geoSetLayerSourceDataListener(e){
    if(this.map && this.selectedLayersMapIds.length){
      const features = this.map.queryRenderedFeatures( {'layers': this.selectedLayersMapIds });
      if(features.length) {
        let geoSetIconData = [];
        features.forEach(layer => {
          let pointGeo = turfCenter(layer);
          pointGeo['properties']['icon'] = layer['layer']['metadata']['icon'];
          pointGeo['properties']['color'] = layer['layer']['metadata']['color'];
          geoSetIconData.push(pointGeo);
        });
        const layerInfo = {
          type: 'FeatureCollection',
          features: geoSetIconData
        };
        if (this.map.getSource('geoSetPoint')) {
          this.map.getSource('geoSetPoint').setData(layerInfo);
        };

      }
    }
  }

  /**
   * @description
   *   On mouse hover display the map popup and then show the geography name
   *
   * @param layerId
   */
  private addPopupOnLayer(layerId: string) {
    const popup = MapboxFactory.produce(MapboxFactoryEnum.POPUP, {
      closeButton: false,
      closeOnClick: false
    });

    this.map.on('mousemove', layerId, (e) => {
      const features = e.features;
      this.map.getCanvas().style.cursor = 'pointer';
      if (features && features.length && features[0]['properties']) {
        const content = document.createElement('div');
        content.innerHTML = `<p>${features[0]['properties']['name']} </p>`;
        content.classList.add('geography-delivery-popup');
        popup
          .setLngLat(e.lngLat)
          .setDOMContent(content)
          .addTo(this.map);
        content.parentNode['className'] += ' geoGraphy-tooltip';
      }
    });

    this.map.on('mouseleave', layerId, () => {
      this.map.getCanvas().style.cursor = '';
      popup.remove();
    });

  }


}
