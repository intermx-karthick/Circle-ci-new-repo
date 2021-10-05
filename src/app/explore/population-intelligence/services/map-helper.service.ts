import { Injectable, SimpleChange } from '@angular/core'
import * as mapboxgl from 'mapbox-gl'
import * as h3 from 'h3-js'
import bboxPolygon from '@turf/bbox-polygon';
import centerOfMass from '@turf/center-of-mass';
import bbox from '@turf/bbox';
import * as turfHelper from '@turf/helpers';
import buffer from '@turf/buffer';
import area from '@turf/area';
import { Deck } from '@deck.gl/core'
import { MVTLayer } from '@deck.gl/geo-layers'
import { MapboxLayer } from '@deck.gl/mapbox'
import { DataFilterExtension } from '@deck.gl/extensions'
import { MapPopupService } from './map-popup.service';
import { MapHttpService } from './map-http.service'
import { MapLayerService } from './map-layer.service'
import { LineChartData } from '@d3/interfaces/line-chart-data';

@Injectable()
export class MapHelperService {
  constructor(
    private mapHttp: MapHttpService,
    private mapLayer: MapLayerService,
    private mapPopup: MapPopupService
  ) { }

  private page = null;
  private map: mapboxgl.Map = null;
  private watchTimeout: null | ReturnType<typeof setTimeout> = null

  private loadMapLayers(params): void {
    const { dmaID, colorSequence, colorContrast, selectedGeography, inventoryOperator, showInventory, localMode } = params
    this.mapLayer.loadMapLayers(this.map, dmaID, colorSequence, colorContrast, selectedGeography, inventoryOperator, showInventory, params.popLimit, localMode === 'nonlocal');
  }
  public togglePopulationLayers(state: boolean): void {
    const visibility = state ? 'visible' : 'none';
    this.mapLayer.toggleLayersVisibility(this.map, visibility);
  }
  private loadMapEventListeners() {
    const doIfType = (type: string, action: Function) => {
      if (this.page.selectedGeographyType === type) {
        action()
      }
    }
    // enter
    this.map.on('mouseenter', 'zips-trade-areas', e => doIfType('zips', () => this.mapPopup.updatePopup(this.page, e.features[0] ? e.features[0].properties.place_id : null, e.lngLat)))
    this.map.on('mouseenter', 'nbhds-trade-areas', e => doIfType('nbhds', () => this.mapPopup.updatePopup(this.page, e.features[0] ? e.features[0].properties.place_id : null, e.lngLat)))
    this.map.on('mouseenter', 'zips-selected-polygons', e => doIfType('zips', () => this.map.getCanvas().style.cursor = 'pointer'))
    this.map.on('mouseenter', 'nbhds-selected-polygons', e => doIfType('nbhds', () => this.map.getCanvas().style.cursor = 'pointer'))
    this.map.on('mouseenter', 'selectable-dmas', e => {
      if (this.page.localMode === 'nonlocal') {
        this.map.getCanvas().style.cursor = 'pointer'
        this.mapPopup.updatePopup(this.page, e.features[0] ? e.features[0].properties.dmaid : null, e.lngLat)
      }
    })

    // move
    this.map.on('mousemove', 'zips-trade-areas', e => doIfType('zips', () => this.mapPopup.updatePopup(this.page, e.features[0] ? e.features[0].properties.place_id : null, e.lngLat)))
    this.map.on('mousemove', 'nbhds-trade-areas', e => doIfType('nbhds', () => this.mapPopup.updatePopup(this.page, e.features[0] ? e.features[0].properties.place_id : null, e.lngLat)))
    const highlightSelectionFor = (type: string, event: mapboxgl.EventData) => {
      if (this.page.selectedGeographyType === type) {
        let filters = this.map.getFilter(`${type}-highlight`)
        let placeID = filters.length === 3 && filters[2].length === 3 ? filters[2][2] : null
        // by checking this isn't already the filter, we can save setFilter calls
        if (event.features[0] && event.features[0].properties.place_id != placeID) {
          this.map.setFilter(`${type}-highlight`, [
            'all',
            ['==', 'dmaid', this.page.dmaID || '0'],
            ['in', 'place_id', event.features[0].properties.place_id]
          ])
        } else if (!event.features[0]) {
          this.map.setFilter(`${type}-highlight`, ['in', 'place_id', ''])
        }
      }
    }
    this.map.on('mousemove', 'zips-selected-polygons', e => highlightSelectionFor('zips', e))
    this.map.on('mousemove', 'nbhds-selected-polygons', e => highlightSelectionFor('nbhds', e))
    this.map.on('mousemove', 'selectable-dmas', e => {
      let filters = this.map.getFilter('dma-highlight')
      let dmaID = filters[filters.length - 1][filters[filters.length - 1].length - 1]
      if (e.features[0] && e.features[0].properties.dmaid && e.features[0].properties.dmaid != dmaID) {
        this.map.setFilter('dma-highlight', ['all', ['==', 'dmaid', e.features[0].properties.dmaid]])
      } else if (!e.features[0]) {
        this.map.setFilter('dma-highlight', ['all', ['==', 'dmaid', '0']])
      }
      if (this.page.dmaID) {
        this.mapPopup.updatePopup(this.page, e.features[0] ? e.features[0].properties.dmaid : null, e.lngLat)
      }
    })

    // leave
    this.map.on('mouseleave', 'zips-trade-areas', e => doIfType('zips', () => this.mapPopup.removePopup()))
    this.map.on('mouseleave', 'nbhds-trade-areas', e => doIfType('nbhds', () => this.mapPopup.removePopup()))
    const unhighlight = (type: string) => {
      doIfType(type, () => {
        this.map.getCanvas().style.cursor = ''
        this.map.setFilter(`${type}-highlight`, ['in', 'place_id', ''])
      })
    }
    this.map.on('mouseleave', 'zips-selected-polygons', () => unhighlight('zips'))
    this.map.on('mouseleave', 'nbhds-selected-polygons', () => unhighlight('nbhds'))
    this.map.on('mouseleave', 'selectable-dmas', () => {
      if (this.page.localMode === 'nonlocal') {
        this.map.getCanvas().style.cursor = ''
        this.map.setFilter('dma-highlight', ['all', ['==', 'dmaid', '0']])
        this.mapPopup.updatePopup(this.page, null, null)
      }
    })

    // click
    // this.map.on('click', 'zips-selected-polygons', e => doIfType('zips', () => this.page.makeSimpleChange('selectedGeography', e.features[0].properties.place_id)))
    // this.map.on('click', 'nbhds-selected-polygons', e => doIfType('nbhds', () => this.page.makeSimpleChange('selectedGeography', e.features[0].properties.place_id)))
    this.map.on('click', 'selectable-dmas', e => {
      if (this.page.localMode === 'nonlocal') {
        // this.page.makeSimpleChange('dmaID', e.features[0].properties.dmaid)
        this.map.setFilter('dma-trade-areas', ['!=', 'dmaid', this.page.dmaID])
      }
    })
  }

  private watchLngLatZoom() {
    this.map.on('move', () => {
      if (this.watchTimeout) {
        clearTimeout(this.watchTimeout)
      }
      this.watchTimeout = setTimeout(() => {
        let { lng, lat } = this.map.getCenter()
        let zoom = this.map.getZoom()
        let changes = {
          lng: new SimpleChange(this.page.lng, lng, false),
          lat: new SimpleChange(this.page.lat, lat, false),
          zoom: new SimpleChange(this.page.zoom, zoom, false)
        }
        this.page.lng = lng
        this.page.lat = lat
        this.page.zoom = zoom
        // this.page.customOnChanges(changes)
      }, 100)
    })
  }

  private setMapFilter(layerName: string, filter: any[]) {
    if (this.map.getLayer(layerName)) {
      this.map.setFilter(layerName, filter)
    }
  }

  private waitForSourceLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      // let timeoutCancel = setTimeout(() => {
      //   reject(Error('source loading took too long!'))
      // }, 5000)
      const onSourceLoad = (evt) => {
        if (evt.isSourceLoaded) {
          // clearTimeout(timeoutCancel)
          this.map.off('sourcedata', onSourceLoad)
          resolve()
        }
      }
      this.map.on('sourcedata', onSourceLoad)
    })
  }

  private loadH3ResidentsLayer(dateRange: string): Promise<void> {
    let { dmaID, dataset, selectedGeography, selectedGeographyType } = this.page
    let { weekdays, resolutions } = this.page.products.map(d => d.data).find(p => p.id === 'resident-analysis')
    let h3Geojson = {
      type: 'FeatureCollection' as const,
      features: []
    }
    if (!selectedGeography) {
      return Promise.reject(Error('Invalid geography id'))
    }
    // FIXME this should not be hardcoded to be different for neighborhoods
    let requestWeekdays = selectedGeographyType === 'zips' ? '1234567' : '1234'
    return this.mapHttp.loadH3ResidentsData(selectedGeographyType, dmaID, dateRange, selectedGeography, requestWeekdays)
      .toPromise().then(rangeActivity => {
      this.page.timeframeData[dateRange] = rangeActivity
      this.page.timeframeData[dateRange].hourly_activity.forEach(h3Activity => {
        let cell = Object.keys(h3Activity)[0]
        let dailyActivity = h3Activity[cell][this.page.scalingHour]
        if (dailyActivity > 0) {
          let properties = h3Activity[cell].reduce((props, value, hour) => {
            props[`hr${hour}`] = value
            return props
          }, {})
          h3Geojson.features.push({
            type: 'Feature' as const,
            id: cell,
            geometry: {
              type: 'Polygon' as const,
              coordinates: [h3.h3ToGeoBoundary(cell, true)]
            },
            properties
          })
        }
      })
      this.mapLayer.addH3ResidentsLayers(this.map, h3Geojson, dataset, dateRange, weekdays, resolutions)
    })
  }

  private removeH3ResidentsLayer(dateRange: string) {
    let dataset = this.page.dataset
    let { resolutions, weekdays } = this.page.products.map(d => d.data).find(p => p.id === 'resident-analysis')
    this.mapLayer.removeH3ResidentsLayer(this.map, dateRange, dataset, weekdays, resolutions)
  }

  private loadTradeAreasLayer(dateRange) {
    let { dmaID, selectedGeography, selectedGeographyType } = this.page
    // FIXME this shouldn't be hardcoded, but we have limited data
    let requestWeekdays = selectedGeographyType === 'zips' ? '1234567' : '1234'
    return this.mapHttp.loadTradeAreasData(selectedGeographyType, dmaID, dateRange, selectedGeography, requestWeekdays).toPromise().then(activity => {
      activity.hourly_activity = activity.hourly_activity.filter(placeActivity => {
        let cell = Object.keys(placeActivity)[0]
        return placeActivity[cell][this.page.scalingHour] > 0
      })
      this.page.timeframeData[dateRange] = activity
    })
  }

  private loadH3AnytimePopulation(dateRange: string): Promise<void> {
    let layerID = `anytime-pop-${this.page.selectedDemographic}-${dateRange}`
    if (this.map.getLayer(layerID)) {
      return // we'll keep the existing layer
    }
    this.createMVTLayer(dateRange)
    let lastRedrawZoom = this.map.getZoom()
    let redrawAnimationRequest = null
    // redraw whenever you zoom in or out more than .5 of a level. this changes the defined shading per level
    const onViewStateChange = ({ viewState, interactionState, oldViewState }) => {
      if (this.page.selectedProduct === 'anytime-population' && Math.abs(lastRedrawZoom - viewState.zoom) >= 0.5) {
        if (redrawAnimationRequest) {
          cancelAnimationFrame(redrawAnimationRequest)
        }
        redrawAnimationRequest = requestAnimationFrame(() => {
          this.repaintMap()
          lastRedrawZoom = viewState.zoom
          redrawAnimationRequest = null
        })
      }
    }
    const onLoad = () => {
      this.waitForSourceLoad().then(() => {
        this.repaintMap()
      })
    }

    if (this.page.anytimeDeck) {
      this.page.anytimeDeck.setProps({
        layers: Object.values(this.page.anytimeDemographicLayers)
      })
      setTimeout(() => {
        requestAnimationFrame(() => this.repaintMap())
      }, 500)
    } else {
      this.page.anytimeDeck = new Deck({
        // @ts-ignore
        gl: this.map.painter.context.gl,
        layers: Object.values(this.page.anytimeDemographicLayers),
        initialViewState: { // required but doesn't change anything since we are using mapbox's gl instance
          longitude: this.page.centerPoint[0],
          latitude: this.page.centerPoint[1],
          zoom: this.page.defaultZoom
        },
        controller: true, // required for onViewStateChange and onLoad to function
        onViewStateChange,
        onLoad
      })
    }

    this.map.addLayer(new MapboxLayer({
      id: layerID, // layername must match the mvt layer name
      deck: this.page.anytimeDeck
    }))
    return Promise.resolve()
  }

  private removeH3AnytimePopulationLayer(dateRange: string) {
    this.page.demographics.forEach(demographic => {
      let layerID = `anytime-pop-${demographic.value}-${dateRange}`
      if (this.map.getLayer(layerID)) {
        this.map.removeLayer(layerID)
      }
      delete this.page.anytimeDemographicLayers[String(demographic.value)]
      this.page.anytimePopulationCells[String(demographic.value)] = {}
    })
    if (this.page.anytimeDeck) {
      this.page.anytimeDeck.setProps({
        layers: []
      })
    }
  }

  private loadNonLocalTradeAreasLayer(dmaID: number | string, demographic: string, weekdays: string): Promise<void> {
    return this.mapHttp.loadNonlocalTradeAreasData(dmaID, demographic, weekdays).toPromise().then((data) => {
      this.page.nonlocalTradeAreaData = data.segments.reduce((nlData, segment) => {
        let weeks: LineChartData[] = segment.weeks.reduce((wks, week) => {
          wks.push({ name: week.we, value: week.unique })
          return wks
        }, [])
        nlData.push({ [segment.dmaid]: weeks })
        return nlData
      }, [])
      return Promise.resolve()
    })
  }

  setLayerVisibility(layerName: string, visible: boolean) {
    this.mapLayer.setLayerVisibility(this.map, layerName, visible)
  }

  setTypeVisibility(type: string, show: boolean, skipUnselected: boolean = false) {
    this.mapLayer.setTypeVisibility(this.map, type, show, skipUnselected)
  }

  setPlaceType(clearValue: boolean = false) {
    let { selectedProduct, selectedGeographyType, geographyTypes, selectedGeography, localMode } = this.page
    if (selectedProduct !== 'anytime-population' && localMode === 'local') {
      let types = geographyTypes.map(o => o.value).filter(o => o)
      types.forEach(type => {
        if (typeof type === 'string') {
          this.setTypeVisibility(type, type === selectedGeographyType, selectedGeography != null)
        }
      })
    }
    if (clearValue) {
      //this.page.makeSimpleChange('selectedGeography', null)
    }
  }

  updateSelectablePolygons() {
    if (this.page.localMode === 'nonlocal') {
      this.setTypeVisibility('zips', false)
      this.setTypeVisibility('nbhds', false)
      this.setLayerVisibility('selected-dma', true)
      this.setLayerVisibility('dma-outline', true)
      this.setLayerVisibility('selectable-dmas', true)
      let dmaFilter = ['all', ['==', 'dmaid', this.page.dmaID || '0']]
      if (this.page.dmaID) {
        this.setMapFilter('dma-outline', dmaFilter)
        this.setMapFilter('selected-dma', dmaFilter)
        this.setMapFilter('zips-trade-areas', dmaFilter)
        this.setMapFilter('nbhds-trade-areas', dmaFilter)
        if (this.map.getLayer('selectable-dmas')) {
          this.map.setPaintProperty('selectable-dmas', 'fill-opacity', 0)
        }
      } else {
        this.setMapFilter('dma-outline', ['all'])
        this.setMapFilter('selected-dma', dmaFilter)
        if (this.map.getLayer('selectable-dmas')) {
          this.map.setPaintProperty('selectable-dmas', 'fill-opacity', 0.1)
        }
      }
    } else {
      this.setLayerVisibility('selected-dma', false)
      this.setLayerVisibility('selectable-dmas', false)
      this.setLayerVisibility('dma-outline', false)
      let applyFilter = ['all', ['==', 'dmaid', this.page.dmaID || '0']]
      // applyFilter.push(['>=', 'place_pop', this.page.getPopLimit()])
      this.page.geographyTypes.forEach(({ value }) => {
        if (value && typeof value === 'string') {
          this.setMapFilter(`${value}-selected-polygons`, applyFilter)
          this.setMapFilter(`${value}-outline`, applyFilter)
          if (value === this.page.selectedGeographyType && this.page.selectedProduct !== 'anytime-population') {
            this.setTypeVisibility(value, true)
          } else {
            this.setTypeVisibility(value, false)
          }
        }
      })
    }
  }

  centerOnDma(farOut: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      let bboxVariable: any = this.page?.selectedDMA?.boundingBox || null;
      if (!bboxVariable) {
        return reject(Error(`Could not find ${this.page.dmaID} in the dma list.`))
      }
      bboxVariable = bboxPolygon(bboxVariable)
      this.page.centerPoint = centerOfMass(bboxVariable).geometry.coordinates
      // get the length of 1 side in kilometers, divide by a zoom coefficient so it's easier to look at
      const bufferWidth = Math.sqrt(area(bboxPolygon(bbox(bboxVariable)))) / 1000 / 5
      const bufferedCenter = buffer(turfHelper.point(this.page.centerPoint), bufferWidth)
      const newBBox = bbox(bufferedCenter) as [number, number, number, number]
      this.map.fitBounds(newBBox, { duration: 750 })
      // wait to fit those bounds (about 750ms)
      this.map.once('moveend', () => {
        this.page.defaultZoom = this.map.getZoom()
        return resolve()
      })
    })
  }

  initMap(map: mapboxgl.Map, params) {
    this.page = params;
    this.map = map;
    this.loadMapLayers(params)
    this.loadMapEventListeners()
    let promises = []
    if (params.dmaID) {
      promises.push(this.centerOnDma())
    }
    Promise.all(promises).then(() => {
      let usedUrlCoords = false
      let { lng, lat, zoom } = this.page
      if (lng && lat && zoom) {
        usedUrlCoords = true
        this.map.flyTo({
          center: [lng, lat],
          zoom
        })
      }
      this.setPlaceType()
      this.updateSelectablePolygons()
      this.updatePlace()
      if (this.page.selectedGeography && !usedUrlCoords) {
        this.flyToSelectedPlace()
      }
      this.watchLngLatZoom()
      setTimeout(() => {
        requestAnimationFrame(() => this.repaintMap())
        ;['scrollZoom', 'boxZoom', 'dragRotate', 'dragPan', 'keyboard', 'doubleClickZoom', 'touchZoomRotate'].forEach(handler => {
          this.map[handler].enable()
        })
        this.setPlaceType()
      }, 250)
    })
  }

  flyToSelectedPlace() {
    let data = this.page.geographyData[this.page.selectedGeographyType]
    let centerPlace = data[this.page.selectedGeography]
    if (this.map && this.map.flyTo && centerPlace && centerPlace.center) {
      let zoom = this.page.embedded || this.page.cardAway ? this.page.defaultZoom - 0.5 : this.page.defaultZoom + 0.5
      let offset = (this.page.embedded || this.page.cardAway ? [0, 0] : [-105, 0] )as [number, number]
      this.map.flyTo({
        center: centerPlace.center as [number, number],
        zoom,
        speed: 2,
        offset,
      })
    }
  }

  // @ts-ignore
  createMVTLayer(dateRange: string, fillColorFunc: Function | number[] = null, national: boolean = false): MVTLayer {
    fillColorFunc = fillColorFunc || [0, 0, 0, 0]
    let hourCount = this.page.scalingHour + 1
    const fillerData = new Array(hourCount).fill(0)
    let layerID = `anytime-pop-${this.page.selectedDemographic}-${dateRange}`
    const getFilterValue = d => parseInt(d.properties.dmaid)
    let transformationRepaintTimeout = null
    let transformationDemographic = this.page.selectedDemographic
    const dataTransform = (data): any[] | Iterable<any> => {
      let shouldRepaintAfter = false
      let newData = data.map(d => {
        let newProperties = {}
        let propertyData = fillerData
        let parseProperties = ['occ', 'occLocTgt', 'occNonLocTgt']
        parseProperties.forEach(property => {
          if (d.properties[property] && typeof d.properties[property] === 'string') {
            propertyData = JSON.parse(d.properties[property])
            if (propertyData.length !== 25) {
              propertyData = fillerData
            }
          }
          newProperties[property] = propertyData
        })
        let properties = Object.assign({}, d.properties, newProperties)
        let zoomID = `${properties.zoom_min}-${properties.zoom_max}`
        if (!this.page.anytimePopulationCells[transformationDemographic]) {
          this.page.anytimePopulationCells[transformationDemographic] = {}
        }
        if (!this.page.anytimePopulationCells[transformationDemographic][zoomID]) {
          this.page.anytimePopulationCells[transformationDemographic][zoomID] = {}
        }
        if (!this.page.anytimePopulationCells[transformationDemographic][zoomID][properties.h3]) {
          this.page.anytimePopulationCells[transformationDemographic][zoomID][properties.h3] = properties
          shouldRepaintAfter = true
        }
        return Object.assign({}, d, { properties })
      })
      if (shouldRepaintAfter) {
        if (transformationRepaintTimeout) {
          clearTimeout(transformationRepaintTimeout)
        }
        transformationRepaintTimeout = setTimeout(() => {
          // this seems to work better doing this twice
          this.repaintMap()
          setTimeout(() => {
            this.repaintMap()
            transformationRepaintTimeout = null
          }, 200)
        }, 200)
      }
      return newData
    }
    let url = null
    let product = this.page.products.map(d => d.data).find(p => p.id === 'anytime-population')
    let segment = product && product.demographics[this.page.selectedDemographic] ? product.demographics[this.page.selectedDemographic].segment : null
    url = this.page.productDatasets.find(dataset => {
      return dataset.dataset === 'atp' && dataset.segment === segment && dataset.url
    })
    if (!url) {
      return
    } else {
      url = url.url
    }
    this.page.anytimeDemographicLayers[this.page.selectedDemographic] = new MVTLayer({
      id: layerID,
      pickable: true,
      data: url,
      getFillColor: fillColorFunc,
      getLineColor: [177, 177, 177, 12],
      lineWidthMinPixels: 1,
      // it is possible to show the entire US by taking out the next 3 lines
      getFilterValue,
      filterRange: national ? [0, 999999999] : [+this.page.dmaID, +this.page.dmaID],
      extensions: [new DataFilterExtension({ filterSize: 1 })],
      // @ts-ignore
      dataTransform,
      minZoom: 0, // hide tiles when below this zoom (0 = never hide them)
      maxZoom: 12, // use tiles from this level when over-zoomed
      refinementStrategy: 'no-overlap', // stop showing the wrong zoom level when parts aren't fully loaded
      updateTriggers: {
        getFillColor: [this.page.selectedDemographic, this.page.periodMode, this.page.selectedHour, this.page.mvtRepaint]
      }
    })

    return this.page.anytimeDemographicLayers[this.page.selectedDemographic]
  }

  updatePlace(): Promise<void> {
    if (!this.page) {
      return
    }
    this.updateSelectablePolygons()
    const { dmaID, selectedGeographyType, selectedGeography, selectedProduct, colorSequence, selectedDemographic, localMode } = this.page;
    const product = this.page.selectedProduct;
    const productInfo = product.demographics ? product.demographics[selectedDemographic] : product
    const filter = ['==', 'place_id', +selectedGeography]
    this.setMapFilter(`${selectedGeographyType}-selected-line`, filter)
    this.setMapFilter(`${selectedGeographyType}-selected-polygon`, filter)
    if (selectedGeography && selectedProduct) {
      this.setLayerVisibility(`${selectedGeographyType}-outline`, false)
    } else if (selectedProduct !== 'anytime-population' && localMode === 'local') {
      this.setLayerVisibility(`${selectedGeographyType}-outline`, true)
    }
    const taLayerID = `${selectedGeographyType}-trade-areas`
    if (this.map.getLayer(taLayerID)) {
      this.setLayerVisibility(taLayerID, false)
      this.map.setPaintProperty(taLayerID, 'fill-color', colorSequence[0])
    }

    const promises = []
    const dateRanges = productInfo ? productInfo.dateRanges : []
    dateRanges.forEach(range => {
      if (selectedProduct === 'resident-analysis' && selectedGeography) {
        this.removeH3ResidentsLayer(range)
        if (selectedGeography) {
          promises.push(this.loadH3ResidentsLayer(range))
        }
      } else if (selectedProduct === 'trade-area-analysis' && selectedGeography) {
        promises.push(this.loadTradeAreasLayer(range))
        let types = this.page.geographyTypes.map(o => o.value).filter(o => o)
        types.forEach(type => this.setLayerVisibility(`${type}-trade-areas`, type === selectedGeographyType))
      } else if (selectedProduct === 'anytime-population') {
        this.removeH3AnytimePopulationLayer(range)
        promises.push(this.loadH3AnytimePopulation(range))
      }
    })

    if (localMode === 'nonlocal' && dmaID && selectedDemographic && this.map.getLayer('dma-trade-areas')) {
      // FIXME hardcoded weekdays
      let weekdays = '1234567'
      this.map.setFilter('dma-trade-areas', ['!=', 'dmaid', this.page.dmaID])
      promises.push(this.loadNonLocalTradeAreasLayer(dmaID, selectedDemographic, weekdays))
    }
    return Promise.all(promises).then(() => {
      if (this.map.getLayer('billboard-inventory')) {
        this.map.moveLayer('billboard-inventory'); // to top
      }
      this.repaintMap();
      return Promise.resolve();
    })
  }
  private repaintMap() {
  }
}
