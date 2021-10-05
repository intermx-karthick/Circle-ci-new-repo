import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { ResizeEvent } from 'angular-resizable-element';
import {environment} from '../../../environments/environment';
import { takeUntil } from 'rxjs/operators';
import { LocateMeControl } from 'app/classes/locate-me-control';
import { ExploreLayerAndPopupComponent } from '../explore-layer-and-popup/explore-layer-and-popup.component';
import { Subject } from 'rxjs';
import { MapProperties } from '@interTypes/mapProperties';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MapboxFactory, MapboxFactoryEnum } from '../../classes/mapbox-factory';
import {Helper} from '../../classes';

@Component({
  selector: 'app-explore-secondary-map',
  templateUrl: './explore-secondary-map.component.html',
  styleUrls: ['./explore-secondary-map.component.less']
})
export class ExploreSecondaryMapComponent extends ExploreLayerAndPopupComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() dimensionsDetails: any;
  @Input() mapViewPostionState: any;
  style: any = {};
  mapStyle: any = {};
  mapCSS: any = {};
  dragHandleStyle: any = {};
  @Output() exploreTopZipMarketWidth = new EventEmitter();
  @Output() onCloseTopMap = new EventEmitter();
  map: mapboxgl.Map;
  selectedMapStyle: any = '';
  mapCenter: any = [-98.5, 39.8];
  unSubscribe: Subject<void> = new Subject<void>();
  @ViewChild('topMapReference') elementView: ElementRef;
  layerInventorySetLayers: any;
  layerInventorySetDataSets: any;
  popupDistributor: any;
  mapPopup: any;
  public keyLegendsTimeer = null;
  public layerDisplayOptions: any = {};
  resizingInProcess = '';
  public isDualMapSyncEnabled: boolean;

  ngOnInit() {
    super.ngOnInit();
    this.baseMaps.filter(maps => {
        if (maps.default) {
          this.mapStyle = maps.label;
        }
    });
    this.selectedMapStyle = this.mapStyle;
    this.layersService.getSecondaryDisplayOptions().subscribe((layers) => {
      this.layerDisplayOptions = layers;
    });
    this.mapPopup = MapboxFactory.produce(MapboxFactoryEnum.POPUP, {});
    this.resizeLayout();
    this.layersService.getApplyLayers().pipe(takeUntil(this.unSubscribe)).subscribe((value) => {
      if (value['type'] === 'secondary') {
        if (value['flag']) {
          this.clearLayerView(false);
          this.loadMapLayers();
        } else {
          this.clearLayerView();
        }
      }
    });
    this.layersService.getClearLogoStyle().subscribe((value) => {
      if (value['type'] === 'secondary' && value['flag']) {
        this.logoStyle = {};
      }
    });
    this.mapService.getMapProperties().pipe(takeUntil(this.unSubscribe)).subscribe((properties) => {
      if (this.map && properties && Object.keys(properties).length) {
        if (properties.mapName !== 'secondaryMap' && !this.mapService.isMapSync) {
          this.mapService.isMapSync = true;
          this.map.setCenter(properties.center);
          this.map.setZoom(properties.zoom);
          this.map.setPitch(properties.pitch);
          this.map.setBearing(properties.bearing);
          this.mapService.isMapSync = false;
        }
      }
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.dimensionsDetails.currentValue) {
      this.resizeLayout();
    }
  }
  initializeMap() {
    mapboxgl.accessToken = environment.mapbox.access_token;
    const style = this.common.getMapStyle(this.baseMaps, this.selectedMapStyle);
    this.map = new mapboxgl.Map({
      container: 'mapSecondary',
      style: style['uri'],
      minZoom: 0,
      maxZoom: 22,
      preserveDrawingBuffer: true,
      center: this.mapCenter, // starting position
      zoom: 3 // starting zoom
    });
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    this.map.addControl(new LocateMeControl('secondary'), 'bottom-left');
    this.map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        maximumAge: Infinity
      },
      trackUserLocation: true
    }), 'bottom-left');
    setTimeout(() => {
      // for getting current location
      this.common.locateMeSecondaryMap();
    }, 100);
    this.exploreDataService.setSecondaryMapObject(this.map);
    this.setMapObject(this.map, this.mapPopup, 'secondary');
    this.map.on('style.load', () => {
      this.bindRender();
      this.exploreDataService.secondarymapLoaded(true);
      this.loadMapLayers();
    });
    this.map.on('click', this.popupDistributor);
    this.map.on('move', (e) =>  {
      const mapProperties: MapProperties = {
        center: this.map.getCenter(),
        zoom: this.map.getZoom(),
        pitch: this.map.getPitch(),
        bearing: this.map.getBearing(),
        mapName: 'secondaryMap'
      };
      if (!this.mapService.isMapSync && this.mapService.isDualMapSyncEnabled) {
        this.mapService.setMapProperties(mapProperties);
      }
    });
  }
  bindRender() {
    this.map.resize({ mapResize: true });
    this.map.on('zoom', () => {
      this.zoomLevel = this.map.getZoom();
    });
    this.map.addSource('allPanels', {
      type: 'vector',
      url: this.mapLayers['allPanels']['url']
    });
    this.map.on('render', (e) => {
      clearTimeout(this.keyLegendsTimeer);
      this.keyLegendsTimeer = setTimeout(() => {
        const layerSession = this.layersService.getlayersSession('secondary');
        this.exploreService.generateKeyLegends(this.map, layerSession, this.mapStyle, this.zoomLevel, 'secondary');
      }, 500);
    });

  }
  loadMapLayers() {
    this.resizeLayout();
    if (this.map) {
      const layersSession = this.layersService.getlayersSession('secondary');
      if (layersSession) {
        this.mapService.isDualMapSyncEnabled = false;
        this.isDualMapSyncEnabled = false;
        if (layersSession && layersSession['display'] && layersSession['display']['syncZoomPan']) {
          this.mapService.isDualMapSyncEnabled = layersSession['display']['syncZoomPan'];
          this.isDualMapSyncEnabled = this.mapService.isDualMapSyncEnabled;
        }
      }
      this.applyViewLayers();
      // this.loadViewLayers(layersSession, this.selectedMapStyle);

    }
  }
  resizeLayout() {
    const width = ((this.dimensionsDetails.windowWidth - 40) / 2);
    const height = this.dimensionsDetails.windowHeight - this.dimensionsDetails.headerHeight;
    const handleDrag = height / 2;
    this.style = {
      width: `${width}px`,
      height: `${height}px`,
    };
    this.mapCSS = {
      height: `${height}px`,
      width: `${width - 20}px`,
    };
    this.dragHandleStyle = {
      marginTop: `${handleDrag}px`,
    };
    if (this.map) {
      this.map.resize();
      if (this.viewLayerApplied) {
        this.adjustCustomLogoTextPosition();
      }
    }
  }
  onLogoOrTextResizing (event, type = '') {
    this.resizingInProcess = type;
  }
  onResizing(event, type = '') {
    const handleDrag = event.rectangle.height / 2;
    this.style = {
      width: `${event.rectangle.width}px`,
      height: `${event.rectangle.height}px`,
    };
    this.mapCSS = {
      width: `${event.rectangle.width}px`,
      height: `${event.rectangle.height - 20}px`,
    };
    this.dragHandleStyle = {
      marginTop: `${handleDrag}px`,
    };
  }

  onResizeEnd(event: ResizeEvent): void {
    this.style = {
      width: `${event.rectangle.width}px`,
      height: `${event.rectangle.height}px`,
    };
    this.mapCSS = {
      width: `${event.rectangle.width - 20}px`,
      height: `${event.rectangle.height}px`,
    };
    this.exploreTopZipMarketWidth.emit(event.rectangle.width);
    setTimeout(() => {
      this.map.resize();
    }, 500);
  }

  onResize(event) {
    this.mapCSS = {
      width: `${this.elementView.nativeElement.offsetWidth - 20}px`,
      height: `${this.elementView.nativeElement.offsetHeight}px`,
    };
    this.exploreTopZipMarketWidth.emit(this.elementView.nativeElement.offsetWidth);
    setTimeout(() => {
      this.map.resize();
    }, 500);
  }

  closeTopMap() {
    const dialogueData: ConfirmationDialog = {
      notifyMessage: false,
      confirmDesc: '<h4 class="confirm-text-icon">Are you sure you want to close the secondary map?</h4>',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      headerCloseIcon: false
    };
    this.dialogBox.open(ConfirmationDialogComponent, {
      data: dialogueData,
      width: '586px',
      panelClass: 'exploreLayer'
    }).afterClosed().subscribe(result => {
      if (result && result['action']) {
        this.layersService.saveLayersSession({}, this.layerType);
        this.layersService.setApplyLayers({
          'type': 'secondary',
          'flag': false,
          'closeTab' : true
        });
        this.removeLayers();
        this.onCloseTopMap.emit('secondary');
        this._exploreData.setMapViewPositionState('inventoryView');
      }
    });
  }
  // removeLayers() {
  //   super.removeLayers();
  //   this.removeGeographyLayers();
  // }
  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
    this.clearLayerView();
    // this._exploreData.setMapViewPositionState('inventoryView');
  }
  zoomOutMap() {
    this.map.fitBounds([[-128.94797746113613, 18.917477970597474], [-63.4, 50.0]]);
  }
  onDragging(event, type) {
    this.resizingInProcess = type;
  }
  onDragStop(event, type) {
    if (!this.enableDraggable) {
      return true;
    }
    const layersSession = this.layersService.getlayersSession('secondary');
    this.resizingInProcess = '';
    switch (type) {
      case 'text':
        const activeDraggableTextPosition = Helper.deepClone(this.activeDraggableTextPosition);
        activeDraggableTextPosition['x'] += event['x'];
        activeDraggableTextPosition['y'] += event['y'];
        this.customTextStyle['top'] = activeDraggableTextPosition['y'] + 'px';
        this.customTextStyle['left'] = activeDraggableTextPosition['x'] + 'px';
        this.activeDraggableTextPosition = activeDraggableTextPosition;
        this.layerDisplayOptions['text']['position'] = {
          'top': this.activeDraggableTextPosition['y'],
          'left': this.activeDraggableTextPosition['x']
        };
        this.layerDisplayOptions['screen'] = this.mapWidthHeight;
        this.layersService.setSecondaryDisplayOptions(this.layerDisplayOptions);
        layersSession['display'] = this.layerDisplayOptions;
        this.layersService.saveLayersSession(layersSession, 'secondary');
        this.showDragTextLogo = false;
        setTimeout(() => {
          this.showDragTextLogo = true;
          this.addResizeIcon();
        }, 20);
        break;
      default:
        const activeDraggablePosition = Helper.deepClone(this.activeDraggablePosition);
        activeDraggablePosition['x'] += event['x'];
        activeDraggablePosition['y'] += event['y'];
        this.logoStyle['top'] = activeDraggablePosition['y'] + 'px';
        this.logoStyle['left'] = activeDraggablePosition['x'] + 'px';
        this.activeDraggablePosition = activeDraggablePosition;
        if (typeof this.layerDisplayOptions['logo'] === 'undefined') {
          this.layerDisplayOptions['logo'] = {};
        }
        this.layerDisplayOptions['logo']['position'] = {
          'top': this.activeDraggablePosition['y'],
          'left': this.activeDraggablePosition['x']
        };
        if (
          this.layersService.exploreCustomLogo
          && this.layersService.exploreCustomLogo['secondary']
          && this.layersService.exploreCustomLogo['secondary']['logo']) {
            this.layersService.exploreCustomLogo['secondary']['logo']['position'] = {
            'top': this.activeDraggablePosition['y'],
            'left': this.activeDraggablePosition['x']
          };
        }
        this.layerDisplayOptions['screen'] = this.mapWidthHeight;
        this.layersService.setSecondaryDisplayOptions(this.layerDisplayOptions);
        layersSession['display'] = this.layerDisplayOptions;
        if (layersSession['customLogoInfo'] && layersSession['customLogoInfo']['logo']) {
          layersSession['customLogoInfo']['logo']['position'] = {
            'top': this.activeDraggablePosition['y'],
            'left': this.activeDraggablePosition['x']
          };
        }
        this.layersService.saveLayersSession(layersSession, 'secondary');
        this.layersService.setSecondaryDisplayOptions(this.layerDisplayOptions);
        this.showDragLogo = false;
        setTimeout(() => {
          this.showDragLogo = true;
          this.addResizeIcon();
        }, 20);
        break;
    }
  }
  onResizeStop(event, type) {
    this.resizingInProcess = '';
    const layersSession = this.layersService.getlayersSession('secondary');
    switch (type) {
      case 'text':
        this.customTextStyle['width'] = `${event.size.width}px`;
        this.customTextStyle['height'] = `${event.size.height}px`;
        if (typeof this.layerDisplayOptions['text'] === 'undefined') {
          this.layerDisplayOptions['text'] = {};
        }
        this.layerDisplayOptions['text']['size'] = {
          width: event.size.width,
          height: event.size.height
        };
        this.layersService.setSecondaryDisplayOptions(this.layerDisplayOptions);
        layersSession['display'] = this.layerDisplayOptions;
        this.layersService.saveLayersSession(layersSession, 'secondary');
        break;
      default:
        this.logoStyle['width'] = `${event.size.width}px`;
        this.logoStyle['height'] = `${event.size.height}px`;
        if (typeof this.layerDisplayOptions['logo'] === 'undefined') {
          this.layerDisplayOptions['logo'] = {};
        }
        this.layerDisplayOptions['logo']['size'] = {
          width: event.size.width,
          height: event.size.height
        };
        this.layersService.setSecondaryDisplayOptions(this.layerDisplayOptions);
        layersSession['display'] = this.layerDisplayOptions;
        if (this.layersService.exploreCustomLogo
          && this.layersService.exploreCustomLogo['secondary']
          && this.layersService.exploreCustomLogo['secondary']['logo']) {
            this.layersService.exploreCustomLogo['secondary']['logo']['size'] = {
            width: event.size.width,
            height: event.size.height
          };
        }
        if (layersSession['customLogoInfo'] && layersSession['customLogoInfo']['logo']) {
          layersSession['customLogoInfo']['logo']['size'] = {
            width: event.size.width,
            height: event.size.height
          };
        }
        this.layersService.saveLayersSession(layersSession, 'secondary');
        break;
    }
  }
  private adjustCustomLogoTextPosition() {
    const element = document.getElementById('map-div-block-secondary');
    if (element) {
      const layersSession = this.layersService.getlayersSession('secondary');
      const containerHeight = element.clientHeight;
      const containerWidth = element.clientWidth;
      if (document.getElementById('map-div-block-secondary')
      && document.getElementById('customTextElement-sencodary')
      && this.mapWidthHeight['width']) {
        if (layersSession && layersSession['display']) {
          if (layersSession['display']['text'] && layersSession['display']['text']['text']) {
            const p = this.getRadioPosition(
              this.mapWidthHeight,
              { height: containerHeight, width: containerWidth }, this.activeDraggableTextPosition, 'customTextElement-sencodary');
            this.customTextStyle['top'] = p['top'] + 'px';
            this.customTextStyle['left'] = p['left'] + 'px';
            this.activeDraggableTextPosition = {
              x: p['left'],
              y: p['top']
            };
            this.layerDisplayOptions['text']['position'] = {
              'top': p['top'],
              'left': p['left']
            };
          }
        }
        let logoInformation = {};
        if (
          this.layersService.exploreCustomLogo
          && this.layersService.exploreCustomLogo['secondary']
          && this.layersService.exploreCustomLogo['secondary']['logo']
          && this.layersService.exploreCustomLogo['secondary']['logo']['url']) {
          if (this.layersService.exploreCustomLogo['secondary']['logo']['url']) {
            logoInformation = this.layersService.exploreCustomLogo['secondary']['logo'];
          }
        } else if (layersSession['display']) {
          if (layersSession['display']['logo'] && layersSession['display']['logo']['url']) {
            logoInformation = layersSession['display']['logo'];
          }
        }
        if (logoInformation['url']) {
          const p = this.getRadioPosition(
            this.mapWidthHeight,
            { height: containerHeight, width: containerWidth }, this.activeDraggablePosition, 'customLogoElement-secondary');
          this.logoStyle['top'] = p['top'] + 'px';
          this.logoStyle['left'] = p['left'] + 'px';
          this.activeDraggablePosition = {
            x: p['left'],
            y: p['top']
          };
          if (typeof this.layerDisplayOptions['logo'] === 'undefined') {
            this.layerDisplayOptions['logo'] = {};
          }
          logoInformation['position'] = {
            'top': p['top'],
            'left': p['left']
          };
          this.layerDisplayOptions['logo']['position'] = {
            'top': p['top'],
            'left': p['left']
          };
        }

      }
      this.mapWidthHeight = { height: containerHeight, width: containerWidth };
      this.layerDisplayOptions['screen'] = this.mapWidthHeight;
      this.layersService.setSecondaryDisplayOptions(this.layerDisplayOptions);
    }
  }
  getRadioPosition(screen, current, position, containerId) {
    const element = document.getElementById(containerId);
    let top = 0;
    let left = 0;
    if (element) {
      const containerHeight = element.clientHeight;
      const containerWidth = element.clientWidth;
      if (screen['width'] < current['width']) {
        const increasePercentage = (current['width'] - screen['width']) / current['width'] * 100;
        left = Math.round(position['x'] + ((position['x'] / 100) * increasePercentage));
      } else if (screen['width'] > current['width']) {
        const decreasePercentage = (screen['width'] - current['width']) / screen['width'] * 100;
        left = Math.round(position['x'] - ((position['x'] / 100) * decreasePercentage));
      } else {
        left = position['x'];
      }
      if ((left + containerWidth) > current['width']) {
        left = (current['width'] - containerWidth - 20);
      } else if (left < 0) {
        left = 10;
      }
      if (screen['height'] < current['height']) {
        const increasePercentage = (current['height'] - screen['height']) / current['height'] * 100;
        top = Math.round(position['y'] + ((position['y'] / 100) * increasePercentage));
      } else if (screen['height'] > current['height']) {
        const decreasePercentage = (screen['height'] - current['height']) / screen['height'] * 100;
        top = Math.round(position['y'] - ((position['y'] / 100) * decreasePercentage));
      } else {
        top = position['y'];
      }
      if ((top + containerHeight) > current['height']) {
        top = (current['height'] - containerHeight - 20);
      } else if (top < 0) {
        top = 10;
      }
    }
    return { top: top, left: left };
  }
  // This method is for to turn on/off dual map sync
  public mapSyncOnOff(on: boolean) {
    const layersSession = this.layersService.getlayersSession('secondary');
    if (on) {
      this.isDualMapSyncEnabled = true;
      this.layerDisplayOptions['syncZoomPan'] = true;
      this.mapService.isDualMapSyncEnabled = true;
    } else {
      this.isDualMapSyncEnabled = false;
      this.layerDisplayOptions['syncZoomPan'] = false;
      this.mapService.isDualMapSyncEnabled = false;
    }
    layersSession['display'] = this.layerDisplayOptions;
    this.layersService.saveLayersSession(layersSession, 'secondary');
    this.layersService.setApplyLayers({
      'type': 'secondary',
      'flag': true
    });
  }
  ngAfterViewInit() {
    setTimeout(() => this.initializeMap(), 200);
  }
}
