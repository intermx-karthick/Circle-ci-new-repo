import { Injectable } from '@angular/core'
import { MapHttpService } from './map-http.service'
import * as mapboxgl from 'mapbox-gl'
import { FeatureCollection, Feature, Geometry } from 'geojson'
import {zip} from 'rxjs';

export type MapboxGeojsonSourceData = string | Feature<Geometry, { [name: string]: any; }> | FeatureCollection<Geometry, { [name: string]: any; }>

/**
 * Functions dealing with map layer management
 */
@Injectable()
export class MapLayerService {
  constructor (private mapHttp: MapHttpService) { }
  public toggleLayersVisibility(map: mapboxgl.Map, visibility: 'none' | 'visible'): void {
    map.setLayoutProperty('selectable-dmas', 'visibility', visibility);
    map.setLayoutProperty('dma-outline', 'visibility', visibility);
    map.setLayoutProperty('dma-highlight', 'visibility', visibility);
    map.setLayoutProperty('selected-dma', 'visibility', visibility);
    map.setLayoutProperty('dma-trade-areas', 'visibility', visibility);
   /* map.setLayoutProperty('zips-trade-areas', 'visibility', visibility);
    map.setLayoutProperty('nbhds-trade-areas', 'visibility', visibility);
    map.setLayoutProperty('zips-selected-polygons', 'visibility', visibility);
    map.setLayoutProperty('nbhds-selected-polygons', 'visibility', visibility);
    map.setLayoutProperty('zips-highlight', 'visibility', visibility);
    map.setLayoutProperty('nbhds-highlight', 'visibility', visibility);
    map.setLayoutProperty('zips-outline', 'visibility', visibility);
    map.setLayoutProperty('nbhds-outline', 'visibility', visibility);
    map.setLayoutProperty('zips-selected-polygon', 'visibility', visibility);
    map.setLayoutProperty('nbhds-selected-polygon', 'visibility', visibility);
    map.setLayoutProperty('zips-selected-line', 'visibility', visibility);
    map.setLayoutProperty('nbhds-selected-line', 'visibility', visibility);*/
    map.setLayoutProperty('billboard-inventory', 'visibility', visibility);
  }
  loadMapLayers(map: mapboxgl.Map, dmaID: number | string, colorSequence: string[], colorContrast: string, selectedGeography: number | string, inventoryOperator: string, showInventory: boolean, popLimit: number, showDmas: boolean): void {
    dmaID = dmaID || 0
    zip(this.mapHttp.loadZipSource(),
      this.mapHttp.loadNeighborhoodSource(),
      this.mapHttp.loadDmaSource()
    ).subscribe(([zipCode, neighborhood, dma]) => {
      const toVector = (source) => Object.assign(source, { type: 'vector' });
      const addLayer = (id, source, settings) => {
        map.addLayer(Object.assign(
          {},
          {
            id,
            source,
            'source-layer': 'default',
            minzoom: 0,
            maxzoom: 22,
            type: 'fill'
          },
          settings
        ))
      }
      const addDualLayer = (baseID, settings) => {
        addLayer(`zips-${baseID}`, 'zips', settings)
        addLayer(`nbhds-${baseID}`, 'nbhds', settings)
      }
      map.on('load', function () {
        map.addSource('zips', toVector(zipCode));
        map.addSource('nbhds', toVector(neighborhood));
        map.addSource('dmas', toVector(dma));
        addLayer('selectable-dmas', 'dmas', { // not sure why this has to have a layer to use querySourceFeatures
          paint: {
            'fill-color': colorContrast,
            'fill-opacity': 0.1, // change for debugging
            'fill-outline-color': colorContrast
          },
          layout: {
            visibility: 'none'
          }
        })
        addLayer('dma-outline', 'dmas', {
          type: 'line',
          paint: {
            'line-color': colorContrast,
            'line-width': 2,
            'line-opacity': 0.8,
          },
          layout: {
            visibility: 'none'
          }
        })
        addLayer('dma-highlight', 'dmas', {
          filter: ['all', ['==', 'dmaid', '0']],
          paint: {
            'fill-color': colorContrast,
            'fill-opacity': 0.2
          },
          layout: {
            visibility: 'none'
          }
        })
        addLayer('selected-dma', 'dmas', {
          filter: ['all', ['==', 'dmaid', dmaID || '0']],
          paint: {
            'fill-color': colorContrast,
            'fill-opacity': 0.2
          },
          layout: {
            visibility: 'none'
          }
        })
        addLayer('dma-trade-areas', 'dmas', {
          paint: {
            'fill-color': 'rgba(0,0,0,0)',
            'fill-opacity': 0.75
          }
        })
        addDualLayer('trade-areas', {
          filter: ['all', ['==', 'dmaid', dmaID || '0']],
          layout: {
            visibility: 'none',
          },
          paint: {
            'fill-color': colorSequence[0],
            'fill-opacity': 0.7,
            'fill-outline-color': colorSequence[0],
          },
        })
        addDualLayer('selected-polygons', {
          // clickable zip codes
          filter: ['all', ['==', 'dmaid', dmaID || '0'], ['>=', 'place_pop', popLimit]],
          layout: {
            visibility: 'none',
          },
          paint: {
            'fill-color': colorContrast,
            'fill-outline-color': colorContrast,
            'fill-opacity': 0,
          },
        })
        addDualLayer('highlight', {
          filter: ['in', 'place_id', ''], // dynamically update filter to compare
          paint: {
            'fill-color': colorContrast,
            'fill-opacity': 0.2,
          },
        })
        addDualLayer('outline', {
          type: 'line',
          filter: ['all', ['==', 'dmaid', dmaID || '0'], ['>=', 'place_pop', popLimit]],
          layout: {
            visibility: 'none',
          },
          paint: {
            'line-color': colorContrast,
            'line-width': 2,
            'line-opacity': 0.8,
          },
        })
        addDualLayer('selected-polygon', {
          filter: ['all', ['==', 'dmaid', dmaID || '0'], ['==', 'place_id', +selectedGeography]],
          paint: {
            'fill-color': colorContrast,
            'fill-outline-color': colorContrast,
            'fill-opacity': 0.2,
          },
        })
        addDualLayer('selected-line', {
          type: 'line',
          filter: ['all', ['==', 'dmaid', dmaID || '0'], ['==', 'place_id', +selectedGeography]],
          paint: {
            'line-color': colorContrast,
            'line-width': 4,
            'line-opacity': 0.9,
          },
        })
        addLayer(
          'billboard-inventory',
          { type: 'vector', url: 'mapbox://intermx.6st9zeil' },
          {
            type: 'circle',
            filter: ['all', ['==', 'opp', inventoryOperator]],
            'source-layer': 'GPAPI2_gp_opp_allFrames-dnsvrq',
            minzoom: 0,
            maxZoom: 20,
            layout: { visibility: showInventory ? 'visible' : 'none' },
            paint: {
              'circle-opacity': 0.8,
              'circle-color': colorContrast,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#6497b1',
              'circle-stroke-opacity': 0.5,
              'circle-radius': {
                base: 1,
                stops: [
                  [0, 1],
                  [7, 2],
                  [15, 5],
                  [20, 7],
                ],
              },
            },
          }
        );
      });
    });
  }

  addH3ResidentsLayers(map: mapboxgl.Map, data: MapboxGeojsonSourceData, dataset: string, dateRange: string, weekdays: string, resolutions: number[][]): void {
    resolutions.forEach(([id, minzoom, maxzoom]) => {
      let sourceIdentity = `${dataset}_${dateRange}_wd${weekdays}_anypop${id}`
      let layerIdentity = `${dataset}_${dateRange}_wd${weekdays}_res${id}`
      if (map.getSource(sourceIdentity)) {
        return
      }
      map.addSource(sourceIdentity, {
        type: 'geojson',
        data
      })
      map.addLayer({
        id: layerIdentity,
        source: sourceIdentity,
        minzoom,
        maxzoom,
        type: 'fill',
        paint: {
          'fill-color': 'rgba(0, 0, 0, 0.0)', // will be repainted anyway
          'fill-opacity': 1,
          'fill-antialias': true, // required for fill-outline
          'fill-outline-color': 'rgba(177, 177, 177, 0.15)' // light gray border
        }
      })
    })
  }

  removeH3ResidentsLayer(map: mapboxgl.Map, dateRange: string, dataset: string, weekdays: string, resolutions: number[][]) {
    resolutions.forEach(([id, minzoom, maxzoom]) => {
      let layerID = `${dataset}_${dateRange}_wd${weekdays}_res${id}`
      let sourceID = `${dataset}_${dateRange}_wd${weekdays}_anypop${id}`
      if (map.getLayer(layerID)) {
        map.removeLayer(layerID)
      }
      if (map.getSource(sourceID)) {
        map.removeSource(sourceID)
      }
    })
  }

  setLayerVisibility(map: mapboxgl.Map, layerName: string, visible: boolean = false) {
    let visibility = visible ? 'visible' : 'none'
    if (map.getLayer(layerName)) {
      map.setLayoutProperty(layerName, 'visibility', visibility)
    }
  }

  setTypeVisibility(map: mapboxgl.Map, type: string, show: boolean, skipUnselected: boolean = false) {
    [
      `${type}-trade-areas`,
      `${type}-selected-polygons`,
      `${type}-selected-polygon`,
      `${type}-selected-line`,
      `${type}-highlight`,
      `${type}-outline`
    ].forEach(layerID => {
      if (!skipUnselected || !layerID.includes('-outline')) {
        this.setLayerVisibility(map, layerID, show)
      }
    })
  }
}
