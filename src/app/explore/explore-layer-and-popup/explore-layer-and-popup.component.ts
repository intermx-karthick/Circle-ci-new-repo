import {
  Component,
  OnInit,
  OnDestroy,
  Renderer2,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';
import { environment } from '../../../environments/environment';
import { SummaryRequest } from '@interTypes/summary';
import {
  InventoryService,
  ThemeService,
  CommonService,
  AuthenticationService,
  DynamicComponentService,
  ExploreDataService,
  ExploreService,
  LoaderService,
  MapService,
  FormatService,
  TargetAudienceService
} from '@shared/services';
import { catchError, debounceTime, distinctUntilChanged, takeUntil, tap, map } from 'rxjs/operators';
import { Representation } from '@interTypes/inventory';
import { PlacesFiltersService } from '../../places/filters/places-filters.service';
import turfCenter from '@turf/center';
import { EMPTY, forkJoin, Subject, BehaviorSubject } from 'rxjs';
import { LayersService } from '../layer-display-options/layers.service';
import { ActivatedRoute } from '@angular/router';
import { FiltersService } from '../filters/filters.service';
import {
  ExploreInventoryIntersetComponent
} from '../explore-inventory-popup/explore-inventory-interset/explore-inventory-interset.component';
import { InventoryDetailViewComponent } from '../explore-inventory-popup/inventory-detail-view/inventory-detail-view.component';
import {
  InventoryDetailViewLayoutComponent
} from '../explore-inventory-popup/inventory-detail-view-layout/inventory-detail-view-layout.component';
import {
  ExploreInventoryInformationComponent
} from '../explore-inventory-popup/explore-inventory-information/explore-inventory-information.component';
import { ExploreInventoryDetailComponent } from '../explore-inventory-popup/explore-inventory-detail/explore-inventory-detail.component';
import { MatDialog } from '@angular/material/dialog';
import { HttpResponse } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { HourlyImpressionsComponent } from '../hourly-impressions/hourly-impressions.component';
import { LayerType } from '@interTypes/enums';
import { BaseLayers } from '../../classes/base-layers';
import { PopupService } from '@shared/popup/popup.service';
import { MapLayersInvetoryFields } from '@interTypes/enums';
import {Helper} from '../../classes';
import { ConvertPipe } from '@shared/pipes/convert.pipe';

@Component({
  selector: 'app-explore-layer-and-popup',
  template: '',
  styleUrls: ['./explore-layer-and-popup.component.less'],
  providers: [TruncatePipe, ConvertPipe]
})
export class ExploreLayerAndPopupComponent implements OnInit, OnDestroy {
  public popupDistributor: any;
  public layerInventorySetPopup: any;
  public mapObj: any;
  public mapPopupObj: any;
  public mapStyle: any;
  public layerInventorySetLayers = [];
  public GeoSetLayerIds = [];
  public layerInventorySetDataSets = [];
  public markerIcon: any = environment.fontMarker;
  public userData = {};
  mapLayers: any = {};
  public inventoryGroups;
  features: any = {};
  current_page: any;
  current_e: any;
  current_layer: any;
  public themeSettings: any;
  public baseMaps: any;
  public mobileView: boolean;
  public defaultAudience: any;
  public isLandscape: boolean = true;
  staticMapURL = '';
  public selectedTarget: string = null;
  public addNotesAccess;
  public pdfExportEnabled: string;
  public outSideOpenPlace: any;
  public tooltip;
  private filterData;
  public style: any;
  public showMapLegend: any = true;
  public isKeylegend = false;
  public showMapControls: any = true;
  public showCustomLogo: any = true;
  public showCustomText: any = true;
  public logoInfo = {};
  public displayTextInfo = {};
  public logoStyle: object = {};
  public customTextStyle: object = {};
  activeDraggablePosition = { x: 0, y: 0 };
  activeDraggableTextPosition = { x: 0, y: 0 };
  mapWidthHeight = {};
  showDragLogo = true;
  showDragTextLogo = true;
  viewLayerApplied = false;
  public defaultMapStyle: any = '';
  mapBounds: any = [];
  mapCenter: any = [-98.5, 39.8];
  public audienceLicense = {};
  allowInventoryAudience = '';
  isMeasureEnabled: boolean;
  mod_permission: any;
  popOpenedType = '';
  public openedInventoryDetail = false;
  poiLayerPopup: any;
  private unSubscriber: Subject<void> = new Subject<void>();
  public selectedAudienceID: string = null;
  public selectedMarkets;
  placeFramePopup: any;
  poiPopup: any;
  disablePopupDistributor: any;
  inventoryDetailTimer: any = null;
  inventoryDetailApiCall = null;
  inventoryDetailApiZipCall = null;
  inventoryDetailApiDmaCall = null;
  inventoryTopSegmentsApiCall = null;
  hourlyImpApiCall = null;
  inventoryDetailApiData = new BehaviorSubject({});
  inventoryDetailApiZipData = new BehaviorSubject({});
  inventoryDetailApiDmaData = new BehaviorSubject({});
  inventoryTopSegmentsData = new BehaviorSubject([]);
  hourlyImpressionsData = new BehaviorSubject({});
  recallInventoryApiTimer: any = null;
  public apiZipCall = false;
  public apiDmaCall = false;
  public apiTopSegmentCall = false;
  public hourlyImpApiLoader = false;
  public openedPopupObj = null;
  public openedMapObj = null;
  public openedFeatureObj = null;
  public layerType: any;
  public keyLegendColors: any;
  public currentSingleInventory: any;
  public totalInventory: number;
  public selectedFidsArray: any = [];
  inBounds = true;
  aspectRatio = true;
  enableDraggable = true;
  zoomLevel = 3;
  public customInventoriesStatus: any;
  public places = [];
  public baseLayersIns: BaseLayers;
  @ViewChild('#mapbox') mapboxRef: ElementRef;
  selectedMeasuresRelease: number = 2021;
  public baseAudience = false;
  constructor(
    public inventoryService: InventoryService,
    public exploreDataService: ExploreDataService,
    public placesFiltersService: PlacesFiltersService,
    public themeService: ThemeService,
    public layersService: LayersService,
    public common: CommonService,
    public _exploreData: ExploreDataService,
    public auth: AuthenticationService,
    public activatedRoute: ActivatedRoute,
    public dynamicComponentService: DynamicComponentService,
    public filterService: FiltersService,
    public exploreService: ExploreService,
    public dialogBox: MatDialog,
    public renderer: Renderer2,
    public loaderService: LoaderService,
    public mapService: MapService,
    public truncate: TruncatePipe,
    public format: FormatService,
    public cdRef: ChangeDetectorRef,
    public popupService: PopupService,
    public convertPipe: ConvertPipe,
    public targetAudienceService: TargetAudienceService
  ) {
  }

  ngOnInit() {
    this.userData = JSON.parse(localStorage.getItem('user_data'));
    this.inventoryGroups = this.exploreDataService.getInventoryGroups();
    if (this.userData) {
      this.mapLayers = this.userData['layers'];
    }
    if (typeof this.mapLayers !== 'undefined') {
      if (typeof this.mapLayers.center !== 'undefined') {
        this.mapCenter = this.mapLayers.center;
      }
      if (typeof this.mapLayers.bounds !== 'undefined') {
        this.mapBounds = this.mapLayers.bounds;
      }
    }
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.themeSettings = this.themeService.getThemeSettings();
    this.baseAudience = this.themeSettings?.baseAudienceRequired ?? false;
    this.baseMaps = this.themeSettings.basemaps;
    this.mobileView = this.common.isMobile();
    this.defaultAudience = this.activatedRoute.snapshot.data.defaultAudience;
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    this.allowInventoryAudience = this.audienceLicense['status'];
    this.isMeasureEnabled = this.mod_permission['features']['gpMeasures']['status'] === 'active';
    this.addNotesAccess = this.mod_permission['features']['notes']['status'];
    this.pdfExportEnabled = this.mod_permission['features']['pdfExport']['status'];
    const layersSession = this.layersService.getlayersSession(this.layerType);
    this.customInventoriesStatus = this.mod_permission['features']['customInventories']['status'];
    if (layersSession && layersSession['display'] && layersSession.display['baseMap']) {
      const mapStyle = layersSession.display['baseMap'];
      this.style = this.common.getMapStyle(this.baseMaps, mapStyle);
      layersSession['display']['baseMap'] = this.style['label'];
      this.mapStyle = this.style['label'];
    } else {
      this.mapStyle = this.getDefaultMapStyle();
    }
    this.common.onDataVersionChange().subscribe((data) => {
      this.targetAudienceService
          .getDefaultAudience(false, data.toString())
          .subscribe((audience) => {
            this.defaultAudience = audience;
          });
    }); 
    this.filterService.getFilters()
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        tap(data => {
          if (data['data']['market']) {
            this.selectedMarkets = data['data']['market'];
          } else {
            this.selectedMarkets = {};
          }
          if (data['data']['audience']) {
            this.selectedAudienceID = data['data']['audience']['key'];
            if (data['data']['audience']['details']) {
              this.selectedTarget = data['data']['audience']['details']['targetAudience']['name'];
            }
          } else {
            this.selectedAudienceID = '';
          }
          if (data['data']['measuresRelease']) {
            this.selectedMeasuresRelease  = Number(data['data']['measuresRelease']);
          } else {
            this.selectedMeasuresRelease = 2021;
          }
        }),
        map(data => {
          return this.filterService.normalizeFilterDataNew(data);
        })).subscribe(data => {
      this.filterData = data;
    });
    const exploreSession = this.filterService.getExploreSession();
    if (exploreSession && exploreSession['data']) {
      if (exploreSession['data']['market']) {
        this.selectedMarkets = exploreSession['data']['market'];
      } else {
        this.selectedMarkets = {};
      }
      if (exploreSession['data']['audience']) {
        this.selectedAudienceID = exploreSession['data']['audience']['key'];
        if (exploreSession['data']['audience']['details']) {
          this.selectedTarget = exploreSession['data']['audience']['details']['targetAudience']['name'];
        }
      } else {
        this.selectedAudienceID = '';
      }
    }

    this.popupDistributor = (e) => {
      // this.closeTopMapZipCode();
      let f = [];
      if (this.layerInventorySetLayers.length > 0) {
        for (let i = this.layerInventorySetLayers.length - 1; i >= 0; i--) {
          // for (let i = 0; i < this.layerInventorySetLayers.length; i++) {
          f = this.mapObj.queryRenderedFeatures(e.point, { layers: [this.layerInventorySetLayers[i]] });
          if (f.length) {
            if (this.layerInventorySetLayers[i].search('layerInventoryLayer') > -1
              || this.layerInventorySetLayers[i].search('layerInventoryColorLayer') > -1
              || this.layerInventorySetLayers[i].search('layerInventoryWinksLayer') > -1) {
              this.layerInventorySetPopup(e, this.layerInventorySetLayers[i]);
            } else if (this.layerInventorySetLayers[i].search('layerPlacesLayer') > -1) {
              this.poiLayerPopup(e, this.layerInventorySetLayers[i]);
            } else if (this.layerInventorySetLayers[i].search('placeLayer') > -1) {
              this.poiLayerPopup(e, this.layerInventorySetLayers[i]);
            } else if (this.layerInventorySetLayers[i].search('nationalWideBubblePlaceLayer') > -1) {
              this.mapObj.flyTo({ center: f[0].geometry.coordinates, zoom: 6 });
            }
            return;
          }
        }
      }
      if (this.layerType === 'primary') {
        if (this.mapObj.getLayer('pointOfInterests')) {
          f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['pointOfInterests'] });
          if (f.length) {
            this.buildPointOfInterestPopup(e, 0, this.mapObj, this.mapPopupObj, 'pointOfInterests');
            return;
          }
        }
        if (this.mapObj.getLayer('frames_panel')) {
          f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['frames_panel'] });
        } else {
          f = [];
        }
        if (f.length) {
          this.buildPopup(e, 0, this.mapObj, this.mapPopupObj, 'frames_panel');
          return;
        }
        if (this.customInventoriesStatus === 'active') {
          if (this.mapObj.getLayer('custom_frames_panel')) {
            f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['custom_frames_panel'] });
          } else {
            f = [];
          }
          if (f.length) {
            this.buildPopup(e, 0, this.mapObj, this.mapPopupObj, 'custom_frames_panel');
            return;
          }
        }
        if (this.mapObj.getLayer('numberedLabelCircle')) {
          f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['numberedLabelCircle'] });
          if (f.length) {
            this.buildPopup(e, 0, this.mapObj, this.mapPopupObj, 'numberedLabelCircle');
            return;
          }
        }
        if (this.mapObj.getLayer('numberedLabelValue')) {
          f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['numberedLabelValue'] });
          if (f.length) {
            this.buildPopup(e, 0, this.mapObj, this.mapPopupObj, 'numberedLabelValue');
            return;
          }
        }
        f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['color_frames_panel'] });
        if (f.length) {
          this.buildPopup(e, 0, this.mapObj, this.mapPopupObj, 'color_frames_panel');
          return;
        }
        if (this.customInventoriesStatus === 'active') {
          f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['custom_color_frames_panel'] });
          if (f.length) {
            this.buildPopup(e, 0, this.mapObj, this.mapPopupObj, 'custom_color_frames_panel');
            return;
          }
        }

        f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['mapLabel'] });
        if (f.length) {
          this.buildPopup(e, 0, this.mapObj, this.mapPopupObj, 'mapLabel');
          return;
        }

        f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['grayed_frames_panel'] });
        if (f.length) {
          this.buildPopup(e, 0, this.mapObj, this.mapPopupObj, 'grayed_frames_panel');
          return;
        }
        if (this.customInventoriesStatus === 'active') {
          f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['custom_grayed_frames_panel'] });
          if (f.length) {
            this.buildPopup(e, 0, this.mapObj, this.mapPopupObj, 'custom_grayed_frames_panel');
            return;
          }
        }
        f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['frameClusters'] });
        if (f.length) {
          this.mapObj.flyTo({ center: f[0].geometry.coordinates, zoom: 7.1 });
          return;
        }
        f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['frameCluster5'] });
        if (f.length) {
          this.mapObj.flyTo({ center: f[0].geometry.coordinates, zoom: 7.1 });
          return;
        }
        if (this.customInventoriesStatus === 'active') {
          f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['customFrameCluster5'] });
          if (f.length) {
            this.mapObj.flyTo({ center: f[0].geometry.coordinates, zoom: 7.1 });
            return;
          }
        }
        f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['frameCluster0'] });
        if (f.length) {
          this.mapObj.flyTo({ center: f[0].geometry.coordinates, zoom: 7.1 });
          return;
        }
        if (this.customInventoriesStatus === 'active') {
          f = this.mapObj.queryRenderedFeatures(e.point, { layers: ['customFrameCluster0'] });
          if (f.length) {
            this.mapObj.flyTo({ center: f[0].geometry.coordinates, zoom: 7.1 });
            return;
          }
        }
      }
    };

    this.inventoryDetailApiZipData.subscribe(zdata => {
      if (zdata !== null && Object.keys(zdata).length) {
        const inventoryDetail = this.inventoryDetailApiData.getValue();
        inventoryDetail['zipcodes'] = zdata;
        // if (this.mobileView || this.apiZipCall) {
        const description = this.getTopZipcodesHTML(inventoryDetail);
        this.replaceHTML(description, 'div.topzip-card.' + this.layerType, 'zip');
        // }
        // this.loadMapItFunction('zip');
      } else if (zdata === null) {
        setTimeout(() => {
          this.replaceHTML(this.getTopZipcodesHTML(null), 'div.topzip-card.' + this.layerType, 'zip');
        }, 200);
      }
    });
    this.inventoryDetailApiDmaData.subscribe(ddata => {
      if (ddata !== null && Object.keys(ddata).length) {
        const inventoryDetail = this.inventoryDetailApiData.getValue();
        inventoryDetail['dmaresults'] = ddata;
        // if (this.mobileView || this.apiDmaCall) {
        const dmadescription = this.getTopDmasHTML(inventoryDetail);
        this.replaceHTML(dmadescription, 'div.topmarket-card.' + this.layerType, 'dma');
        // }
        // this.loadMapItFunction('dma');
      } else if (ddata === null) {
        setTimeout(() => {
          this.replaceHTML(this.getTopDmasHTML(null), 'div.topmarket-card.' + this.layerType, 'dma');
        }, 200);
      }
    });
    this.inventoryTopSegmentsData.subscribe(segments => {
      if (segments && segments.length > 0) {
        const segmentsHTML = this.getTopSegmentsHTML(segments);
        this.replaceHTML(segmentsHTML, 'div.opportunityOverview.' + this.layerType, 'segment');
      } else {
        setTimeout(() => {
          this.replaceHTML(this.getTopSegmentsHTML(null), 'div.opportunityOverview.' + this.layerType, 'segment');
        }, 200);
      }
    });

    this.hourlyImpressionsData.subscribe(response => {
      if (this.layerType) {
        if (response) {
          const hourlyImpHTML = this.getHourlyImpHTML(response);
          const hourlyHTML = `<div class="hourly-impression-chart ${this.layerType}">
            ${hourlyImpHTML.innerHTML}
          </div>`;
          // this.replaceHTML(hourlyHTML, 'div.hourly-impression-chart.' + this.layerType, 'hourlyImp');
          $('div.hourly-impression-chart.' + this.layerType).html(hourlyImpHTML);
          // this.loadMapItFunction('hourlyImp');
        } else {
          setTimeout(() => {
            this.replaceHTML(this.getHourlyImpHTML(null), 'div.hourly-impression-chart.' + this.layerType, 'hourlyImp');
          }, 200);
        }
      }
    });
    this.layerInventorySetPopup = (e, layer) => {
      this.buildPopup(e, 0, this.mapObj, this.mapPopupObj, layer);
    };
    this.poiLayerPopup = (e, layer) => {
      this.buildPointOfInterestPopup(e, 0, this.mapObj, this.mapPopupObj, layer);
    };
    this.disablePopupDistributor = function(e) {
    };
  }

  setMapObject(map, popup, type) {
    this.mapObj = map;
    this.mapPopupObj = popup;
    this.layerType = type;
    this.mapPopupObj.on('close', (e) => {
      $('.map-div.' + this.layerType).removeClass('opened_detailed_popup');
    });
    this.baseLayersIns = new BaseLayers(this.mapObj, this.cdRef);

  }

  public applyViewLayers() {
    this.loaderService.display(true);
    const layersSession = this.layersService.getlayersSession(this.layerType);
    this.layersService.setClearLogoStyle({
      type: this.layerType,
      flag: true
    });
    if (layersSession && layersSession['display']) {
      const mapStyle = layersSession['display']['baseMap'];
      this.style = this.common.getMapStyle(this.baseMaps, mapStyle);
      layersSession['display']['baseMap'] = this.style['label'];
      if (layersSession['display']['baseMap'] && this.mapStyle !== layersSession['display']['baseMap']) {
        if (this.mapPopupObj.isOpen()) {
          this.mapPopupObj.remove();
        }
        this.mapStyle = layersSession['display']['baseMap'];
        this.style = this.common.getMapStyle(this.baseMaps, this.mapStyle);
        this.mapObj.setStyle(this.style['uri']);
        this.mapObj.once('style.load', () => {
          this.mapObj.fitBounds(this.mapBounds);
          this.mapObj.setZoom(this.zoomLevel);
        });
      } else {
        this.viewLayerApplied = true;
        if (typeof layersSession['display']['mapLegend'] !== 'undefined') {
          this.showMapLegend = layersSession['display']['mapLegend'];
        }
        if (typeof layersSession['display']['mapControls'] !== 'undefined') {
          this.showMapControls = layersSession['display']['mapControls'];
        }
        if (typeof layersSession['display']['isLogoEnabled'] !== 'undefined') {
          this.showCustomLogo = layersSession['display']['isLogoEnabled'];
        }
        if (typeof layersSession['display']['isTextEnabled'] !== 'undefined') {
          this.showCustomText = layersSession['display']['isTextEnabled'];
        }
        if (this.mapObj.getLayer('grayed_frames_panel')) {
          if (!layersSession['display'].showUnselectedInventory) {
            this.mapObj.setLayoutProperty('grayed_frames_panel', 'visibility', 'none');
          } else {
            this.mapObj.setLayoutProperty('grayed_frames_panel', 'visibility', 'visible');
          }
        }
        if (this.mapObj.getLayer('mapLabel')) {
          if (!layersSession['display'].mapLabel) {
            this.mapObj.setLayoutProperty('mapLabel', 'visibility', 'none');
          } else {
            this.mapObj.setLayoutProperty('mapLabel', 'visibility', 'visible');
            const text = [];
            if (layersSession['display'].mapLabels['geopath spot IDs']) {
              text.push('{fid}');
            }
            if (layersSession['display'].mapLabels['operator spot IDs']) {
              text.push('{pid}');
            }
            if (layersSession['display'].mapLabels['place name']) {
              text.push('{opp}');
            }
            if (layersSession['display'].mapLabels['place address']) {
              text.push('{st}');
            }
            if (text.length > 0) {
              const value = text.join('\n');
              this.mapObj.setLayoutProperty('mapLabel', 'text-field', value);
            } else {
              this.mapObj.setLayoutProperty('mapLabel', 'visibility', 'none');
            }
          }
        }
        if (layersSession['display']) {
          if (layersSession['display']['screen']) {
            this.mapWidthHeight = layersSession['display']['screen'];
          }
          if (layersSession['display']['text'] && layersSession['display']['text']['text']) {
            this.displayTextInfo = {
              text: layersSession['display']['text']['text'], backgroundWhite: layersSession['display']['text']['backgroundWhite']
            };
            if (layersSession['display']['text']['position']) {
              this.customTextStyle['top'] = layersSession['display']['text']['position']['top'] + 'px';
              this.customTextStyle['left'] = layersSession['display']['text']['position']['left'] + 'px';
              this.customTextStyle['width'] = layersSession['display']['text']['size']['width'] + 'px';
              this.customTextStyle['height'] = layersSession['display']['text']['size']['height'] + 'px';
              this.activeDraggableTextPosition = {
                x: layersSession['display']['text']['position']['left'],
                y: layersSession['display']['text']['position']['top']
              };
            } else {
              setTimeout(() => {
                this.customTextStyle['width'] = '200px';
                const element = document.getElementById('map-div-block-' + this.layerType);
                const textElement = document.getElementById('customTextElement-' + this.layerType);
                // TODO : Later will update the dummy variable
                let dummyTop = 0;
                let dummyLeft = 0;
                const dummyCustomStyle = {};
                if (element && textElement) {
                  const containerHeight = element.clientHeight;
                  const containerWidth = element.clientWidth;
                  const height = textElement.clientHeight > 350 ? 350 : textElement.clientHeight + 20;
                  this.customTextStyle['height'] = height + 'px';
                  const top = (containerHeight - height - 50);
                  const left = (containerWidth - 200 - 20);
                  this.customTextStyle['top'] = top + 'px';
                  this.customTextStyle['left'] = left + 'px';
                  //TODO : later will update the dummys
                  dummyCustomStyle['width'] = '200px';
                  dummyCustomStyle['top'] = top + 'px';
                  dummyCustomStyle['left'] = left + 'px';
                  dummyCustomStyle['height'] = height + 'px';
                  dummyTop = top;
                  dummyLeft = left;
                  this.activeDraggableTextPosition = {
                    x: left,
                    y: top
                  };
                  layersSession['display']['text']['position'] = {
                    'top': top,
                    'left': left
                  };
                  layersSession['display']['text']['size'] = {
                    'width': 200,
                    'height': height
                  };
                  if (this.layerType === 'secondary') {
                    this.layersService.setSecondaryDisplayOptions(layersSession['display']);
                  } else {
                    this.layersService.setDisplayOptions(layersSession['display']);
                  }
                }
                //TODO : later will update the dummys
                this.activeDraggableTextPosition = {
                  x: dummyLeft,
                  y: dummyTop
                };
                this.customTextStyle = dummyCustomStyle;
              }, 200);
            }
          }
        }
        let logoInformation = {};
        if (this.layersService.exploreCustomLogo
          && this.layersService.exploreCustomLogo[this.layerType]['logo']
          && this.layersService.exploreCustomLogo[this.layerType]['logo']['url']) {
          if (this.layersService.exploreCustomLogo[this.layerType]['logo']['url']) {
            logoInformation = this.layersService.exploreCustomLogo[this.layerType]['logo'];
          }
        } else if (layersSession['display']) {
          if (layersSession['display']['logo'] && layersSession['display']['logo']['url']) {
            logoInformation = layersSession['display']['logo'];
          } else if (layersSession['customLogoInfo'] &&
            layersSession['customLogoInfo']['logo'] && layersSession['customLogoInfo']['logo']['url']) {
            logoInformation = layersSession['customLogoInfo']['logo'];
          }
        }
        if (logoInformation['url']) {
          this.logoInfo = {
            url: logoInformation['url'],
            backgroundWhite: logoInformation['backgroundWhite']
          };
          if (logoInformation['position']) {
            this.logoStyle['top'] = logoInformation['position']['top'] + 'px';
            this.logoStyle['left'] = logoInformation['position']['left'] + 'px';
            if (logoInformation['size']) {
              this.logoStyle['width'] = logoInformation['size']['width'] + 'px';
              this.logoStyle['height'] = logoInformation['size']['height'] + 'px';
            }
            this.activeDraggablePosition = {
              x: logoInformation['position']['left'],
              y: logoInformation['position']['top']
            };
          } else {
            this.logoStyle['width'] = '150px';
            setTimeout(() => {
              const element = document.getElementById('map-div-block-' + this.layerType);
              const logoElement = document.getElementById('customLogoElement-' + this.layerType);
              if (element && logoElement) {
                const containerHeight = element.clientHeight;
                const containerWidth = element.clientWidth;
                const top = 10;
                const left = 10;
                this.logoStyle['top'] = top + 'px';
                this.logoStyle['left'] = left + 'px';
                this.logoStyle['height'] = logoElement.clientHeight + 'px';
                const height = logoElement.clientHeight;
                this.activeDraggablePosition = {
                  x: top,
                  y: left
                };
                if (typeof layersSession['display']['logo'] === 'undefined') {
                  layersSession['display']['logo'] = {};
                }
                layersSession['display']['logo']['position'] = {
                  'top': top,
                  'left': left
                };
                logoInformation['position'] = {
                  'top': top,
                  'left': left
                };
                logoInformation['size'] = {
                  'width': 150,
                  'height': height
                };
                layersSession['display']['logo']['size'] = {
                  'width': 150,
                  'height': height
                };
                if (this.layersService.exploreCustomLogo
                  && this.layersService.exploreCustomLogo[this.layerType]
                  && this.layersService.exploreCustomLogo[this.layerType]['logo']) {
                  this.layersService.exploreCustomLogo[this.layerType]['logo']['size'] = {
                    'width': 150,
                    'height': height
                  };
                  this.layersService.exploreCustomLogo[this.layerType]['logo']['position'] = {
                    'top': top,
                    'left': left
                  };
                }
                if (layersSession['customLogoInfo'] && layersSession['customLogoInfo']['logo']) {
                  layersSession['customLogoInfo']['logo']['size'] = {
                    'width': 150,
                    'height': height
                  };
                  layersSession['customLogoInfo']['logo']['position'] = {
                    'top': top,
                    'left': left
                  };
                }
                layersSession['display'] = layersSession['display'];
                this.layersService.saveLayersSession(layersSession, this.layerType);
                if (this.layerType === 'secondary') {
                  this.layersService.setSecondaryDisplayOptions(layersSession['display']);
                } else {
                  this.layersService.setDisplayOptions(layersSession['display']);
                }
                this.showDragLogo = false;
                setTimeout(() => {
                  this.showDragLogo = true;
                  this.addResizeIcon();
                }, 20);
              }
            }, 1000);
          }
        } else {
          this.logoInfo = {};
          this.logoStyle = {};
        }
        this.loaderService.display(false);
        this.loadViewLayers(layersSession, this.mapObj);

      }
    }
    this.addResizeIcon();
    // this.loaderService.display(false);
  }

  addResizeIcon() {
    setTimeout(() => {
      const elements = document.getElementsByClassName('ng-resizable-se');
      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          elements[i].innerHTML = '<svg style="width:24px;height:24px" viewBox="0 0 24 24" class="extand-img"> <path fill="#000000" d="M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z" /></svg>';
        }
      }
    }, 200);
  }

  public loadViewLayers(layersSession, mapStyle) {
    if (this.layerInventorySetLayers.length > 0) {
      this.layerInventorySetLayers.map(layerId => {
        if (this.mapObj.getLayer(layerId)) {
          this.mapObj.off('mouseenter', layerId);
          this.mapObj.off('mouseleave', layerId);
          this.mapObj.removeLayer(layerId);
        }
      });
    }
    if (this.layerInventorySetDataSets.length > 0) {
      this.layerInventorySetDataSets.map(layerId => {
        if (this.mapObj.getSource(layerId)) {
          this.mapObj.removeSource(layerId);
        }
      });
    }
    /** Removing Geoset layers */
    if (this.GeoSetLayerIds.length > 0) {
      /** center icon layer */
      this.mapObj.off('sourcedata');

      if (this.mapObj.getLayer('geoSetPointCenter')) {
        this.mapObj.removeLayer('geoSetPointCenter');
      }

      if (this.mapObj.getSource('geoSetPoint')) {
        this.mapObj.removeSource('geoSetPoint');
      }
      this.baseLayersIns.selectedLayersMapIds = [];

      this.GeoSetLayerIds.map(layerId => {
        if (this.mapObj.getLayer(layerId)) {
          this.mapObj.removeLayer(layerId);
        }
      });
    }

    this.layerInventorySetLayers = [];
    this.layerInventorySetDataSets = [];
    this.GeoSetLayerIds = [];
    if (layersSession && layersSession['selectedLayers'] && layersSession['selectedLayers'].length > 0) {
      for (let i = layersSession['selectedLayers'].length - 1; i >= 0; i--) {
        const layerData = layersSession['selectedLayers'][i];
        switch (layerData.type) {
          case 'inventory collection':
            if (layerData.data['_id'] !== 'default') {
              const mapLayerId = 'layerInventoryLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
              const mapLayerDataId = 'layerViewData' + Date.now().toString(36) + Math.random().toString(36).substr(2);
              this.mapObj.addSource(mapLayerDataId, {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: []
                }
              });
              this.layerInventorySetLayers.push(mapLayerId);
              this.mapObj.addLayer({
                id: mapLayerId,
                type: 'symbol',
                source: mapLayerDataId,
                minzoom: 0,
                maxzoom: (layerData['icon'] && layerData['icon'] === 'icon-wink-pb-dig' ? 7 : 17),
                layout: {
                  'text-line-height': 1,
                  'text-padding': 0,
                  'text-anchor': 'bottom',
                  'text-allow-overlap': true,
                  'text-field': layerData['icon'] && layerData['icon'] !== 'icon-wink-pb-dig' && this.markerIcon[layerData['icon']] || this.markerIcon['icon-circle'],
                  'icon-optional': true,
                  'text-font': ['imx-map-font-43 Regular'],
                  'text-size': layerData['icon'] === 'icon-wink-pb-dig' ? 10 : 18,
                  'text-offset': [0, 0.6]
                },
                paint: {
                  'text-translate-anchor': 'viewport',
                  'text-color': layerData['color']
                }
              });
              this.mapObj.on('mouseenter', mapLayerId, () => {
                this.mapObj.getCanvas().style.cursor = 'pointer';
              });
              this.mapObj.on('mouseleave', mapLayerId, () => {
                this.mapObj.getCanvas().style.cursor = '';
              });

              const inventroyIds = [];
              const inventroyCustomIds = [];
              layerData['data']['inventory']
                .map(inventory => {
                  if (inventory.type === 'geopathPanel') {
                    inventroyIds.push(inventory.id);
                  } else if (inventory.type === 'customPanel') {
                    inventroyCustomIds.push(inventory.id);
                  }
                });

              const filters: Partial<SummaryRequest> = {
                id_type: 'spot_id',
                id_list: inventroyIds
              };
              // adding default measures range list if it is not, to get invalid ids
              filters['measures_range_list'] = [{ 'type': 'imp', 'min': 0 }];
              filters['page_size'] = 1000;

              const inventoryRequests = [this.inventoryService
                .getInventoriesWithAllData(filters)
                .pipe(catchError(error => EMPTY))];

              if (layerData['data']['client_id'] && Number(layerData['data']['client_id']) === Number(this.themeSettings.clientId)) {
                inventoryRequests.push(this.inventoryService.getInventoryFromElasticSearch(this.inventoryService
                  .prepareInventorySpotQuery(inventroyCustomIds))
                  .pipe(catchError(error => EMPTY)));
              }
              const colors = [
                'match',
                ['get', MapLayersInvetoryFields.MEDIA_TYPE_ID]
              ];
              const symbols = [
                'match',
                ['get', MapLayersInvetoryFields.MEDIA_TYPE_ID]
              ];
              this.inventoryGroups.map(media => {
                if (media.mtidPrint.length > 0) {
                  symbols.push(media.mtidPrint, media.print['symbol']);
                  colors.push(media.mtidPrint, media.colors[this.mapStyle]);
                }
                if (media.mtidDigital.length > 0) {
                  symbols.push(media.mtidDigital, media.digital['symbol']);
                  colors.push(media.mtidDigital, media.colors[this.mapStyle]);
                }
              });
              if (this.inventoryGroups[2]) {
                colors.push(this.inventoryGroups[2].colors[this.mapStyle]);
                symbols.push(this.inventoryGroups[2].print['symbol']);
              }

              forkJoin(inventoryRequests).subscribe(response => {
                const data = [];
                if (response[0]['inventory_summary']['inventory_items'].length > 0) {
                  response[0]['inventory_summary']['inventory_items']
                    .map(inventory => {
                      data.push({
                        type: 'Feature',
                        geometry: inventory['location']['geometry'],
                        properties: {
                          f: inventory.frame_id || '', // frame_id & spot_id both are equal
                          opp: this.getOperatorName(inventory.representations),
                          pid: inventory.plant_frame_id || ''
                        }
                      });
                    });
                }
                if (response[1]) {
                  const sourceData = this.inventoryService.formatSpotElasticData(response[1]);
                  if (sourceData && sourceData.length > 0) {
                    sourceData.map(customSpotInventory => {
                      const spot = customSpotInventory['layouts'][0]['faces'][0]['spots'][0];
                      data.push({
                        type: 'Feature',
                        geometry: customSpotInventory['location']['geometry'],
                        properties: {
                          f: customSpotInventory.id || '',
                          opp: this.getOperatorName(customSpotInventory.representations),
                          pid: spot['plant_spot_id'] && spot['plant_spot_id'] || customSpotInventory.plant_frame_id
                        }
                      });
                    });
                  }
                }
                const inventoryCollectionData = {
                  type: 'FeatureCollection',
                  features: data
                };
                if (this.mapObj.getSource(mapLayerDataId)) {
                  this.mapObj.getSource(mapLayerDataId).setData(inventoryCollectionData);
                }

                if (layerData['icon'] && layerData['icon'] === 'icon-wink-pb-dig') {
                  const seletedPanels = inventoryCollectionData.features.map(e => e.properties.f);
                  const filterData = [];
                  filterData.unshift('all');
                  seletedPanels.unshift('in', MapLayersInvetoryFields.FRAME_ID);
                  filterData.push(seletedPanels);
                  const colorFrameLayer = 'layerInventoryColorLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
                  this.layerInventorySetLayers.push(colorFrameLayer);
                  this.mapObj.addLayer({
                    id: colorFrameLayer,
                    type: 'circle',
                    source: 'allPanels',
                    'source-layer': this.mapLayers['allPanels']['source-layer'],
                    minzoom: 7,
                    maxzoom: 11,
                    filter: filterData,
                    paint: {
                      'circle-opacity': 0.8,
                      'circle-radius': 3,
                      'circle-color': colors
                    }
                  });
                  this.mapObj.on('mouseenter', colorFrameLayer, () => {
                    this.mapObj.getCanvas().style.cursor = 'pointer';
                  });
                  this.mapObj.on('mouseleave', colorFrameLayer, () => {
                    this.mapObj.getCanvas().style.cursor = '';
                  });
                  const winksFrameLayer = 'layerInventoryWinksLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
                  this.layerInventorySetLayers.push(winksFrameLayer);
                  this.mapObj.addLayer({
                    id: winksFrameLayer,
                    type: 'symbol',
                    source: 'allPanels',
                    'source-layer': this.mapLayers['allPanels']['source-layer'],
                    minzoom: 11,
                    filter: filterData,
                    layout: {
                      'text-line-height': 1,
                      'text-padding': 0,
                      'text-anchor': 'bottom',
                      'text-allow-overlap': true,
                      'text-field': symbols,
                      'text-offset': [0, 0.7],
                      'text-optional': true,
                      'text-font': ['imx-map-font-43 Regular'],
                      'text-size': 17,
                      'text-rotation-alignment': 'map',
                      'text-rotate': ['get', MapLayersInvetoryFields.ORIENTATION]
                    },
                    paint: {
                      'text-translate-anchor': 'viewport',
                      'text-color': colors,
                    }
                  });
                  this.mapObj.on('mouseenter', winksFrameLayer, () => {
                    this.mapObj.getCanvas().style.cursor = 'pointer';
                  });
                  this.mapObj.on('mouseleave', winksFrameLayer, () => {
                    this.mapObj.getCanvas().style.cursor = '';
                  });
                }
              });
            } else if (layerData.data['_id'] === 'default') {
              this.modifySearchResultMapFormat();
            }
            break;
          case 'place collection':
            const placeSetNationalLevelSource = 'layerPlaceViewData' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            const placeSetLayerSource = 'layerPlaceViewData' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            const params = { 'ids': [layerData.id] };
            const placeSetLayer = 'layerPlacesLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            this.layerInventorySetLayers.push(placeSetLayer);
            if (layerData['data']['pois'].length > 100) {
              const nationalWideBubblePlaceLayer = 'nationalWideBubblePlaceLayer' + Date.now().toString(36) +
                Math.random().toString(36).substr(2);
              const nationalWideCountPlaceLayer = 'nationalWideCountPlaceLayer' + Date.now().toString(36) +
                Math.random().toString(36).substr(2);
              this.layerInventorySetLayers.push(nationalWideBubblePlaceLayer);
              this.layerInventorySetLayers.push(nationalWideCountPlaceLayer);
              this.mapObj.addSource(placeSetNationalLevelSource, {
                type: 'geojson',
                data: {
                  'type': 'FeatureCollection',
                  'features': []
                }
              });
              this.mapObj.addLayer({
                id: nationalWideBubblePlaceLayer,
                type: 'circle',
                source: placeSetNationalLevelSource,
                // minzoom: 0,
                minzoom: 0,
                maxzoom: 6,
                layer: {
                  'visibility': 'visible',
                },
                paint: {
                  'circle-opacity': 0.6,
                  'circle-color': layerData['color'],
                  'circle-radius': ['get', 'radius']
                }
              });
              this.mapObj.addLayer({
                id: nationalWideCountPlaceLayer,
                type: 'symbol',
                source: placeSetNationalLevelSource,
                // minzoom: 0,
                minzoom: 0,
                maxzoom: 6,
                // filter: ['>', 'radius', 10],
                layout: {
                  'text-field': '{count}',
                  'text-font': ['Product Sans Regular', 'Open Sans Regular', 'Arial Unicode MS Regular'],
                  'text-size': [
                    'step',
                    ['get', 'radius'],
                    9,
                    15,
                    12,
                    25,
                    24
                  ]
                },
                paint: {
                  'text-color': '#ffffff'
                }
              });
              this.placesFiltersService.getPlaceSetsSummary(params, true).subscribe(layer => {
                const data = layer['data'][0];
                const layerInfo = {
                  type: 'FeatureCollection',
                  features: data['pois']
                };
                this.mapObj.getSource(placeSetNationalLevelSource).setData(this.formatUpPlaceNationalData(layerInfo));
              });
            }
            this.mapObj.addSource(placeSetLayerSource, {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: []
              }
            });
            this.mapObj.addLayer({
              id: placeSetLayer,
              type: 'symbol',
              source: placeSetLayerSource,
              minzoom: layerData['data']['pois'].length > 100 ? 6 : 0,
              layout: {
                'text-line-height': 1,
                'text-padding': 0,
                'text-anchor': 'bottom',
                'text-allow-overlap': true,
                'text-field': layerData['icon'] && this.markerIcon[layerData['icon']] || this.markerIcon['place'],
                'icon-optional': true,
                'text-font': ['imx-map-font-43 Regular'],
                'text-size': layerData['icon'] === 'lens' ? 18 : 24,
                'text-offset': [0, 0.6]
              },
              paint: {
                'text-translate-anchor': 'viewport',
                'text-color': layerData['color']
              }
            });
            this.mapObj.on('mouseenter', placeSetLayer, () => {
              this.mapObj.getCanvas().style.cursor = 'pointer';
            });
            this.mapObj.on('mouseleave', placeSetLayer, () => {
              this.mapObj.getCanvas().style.cursor = '';
            });
            this.placesFiltersService.getPlaceSetsSummary(params, false).subscribe(layer => {
              const data = layer['data']?.[0]?.pois ?? [];
              data.forEach((element,index) => {
                if(element?.properties && element?.place_name) {
                  data[index].properties.location_name = element.place_name;
                }
              });
              const layerInfo = {
                type: 'FeatureCollection',
                features: data
              };
              this.mapObj.getSource(placeSetLayerSource).setData(layerInfo);
            });
            break;
          case 'place':
            const placeLayerId = 'placeLayer' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            const placeLayerDataId = 'placeLayerData' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            this.layerInventorySetLayers.push(placeLayerId);
            if(!(layerData?.data?.properties?.location_name) && layerData?.data?.place_name){
              layerData['data']['properties']['location_name'] = layerData.data.place_name
            }
            this.mapObj.addSource(placeLayerDataId, {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [layerData['data']]
              }
            });
            this.mapObj.addLayer({
              id: placeLayerId,
              type: 'symbol',
              source: placeLayerDataId,
              layout: {
                'text-line-height': 1,
                'text-padding': 0,
                'text-anchor': 'bottom',
                'text-allow-overlap': true,
                'text-field': layerData['icon'] && this.markerIcon[layerData['icon']] || this.markerIcon['place'],
                'icon-optional': true,
                'text-font': ['imx-map-font-43 Regular'],
                'text-size': layerData['icon'] === 'lens' ? 18 : 24,
                'text-offset': [0, 0.6]
              },
              paint: {
                'text-translate-anchor': 'viewport',
                'text-color': layerData['color']
              }
            });
            this.mapObj.on('mouseenter', placeLayerId, () => {
              this.mapObj.getCanvas().style.cursor = 'pointer';
            });
            this.mapObj.on('mouseleave', placeLayerId, () => {
              this.mapObj.getCanvas().style.cursor = '';
            });
            break;
          case 'geopathId':
            if (typeof layerData['data'] !== 'string') {
              layerData['data'] = layerData['id'];
            }
            const topData = {
              'fid': layerData['data'],
              'replevel': (layerData['heatMapType'] === 'top_markets') ? 'dma' : 'zip_code',
            };
            const inventoryParams = {
              spotId: layerData['data'],
              'target_segment': this.selectedAudienceID,
              'target_geography': this.selectedMarkets
            };
            if (this.baseAudience) {
              inventoryParams['base_segment'] =  this.defaultAudience.audienceKey;
            }
            forkJoin(
              this.inventoryService
                .getSingleInventory(inventoryParams)
                .pipe(catchError(error => EMPTY)),
              this.exploreService.getInventoryDetailZipDMA(topData).pipe(catchError(error => EMPTY))
            ).subscribe(response => {
              this.layersService.cleanUpMap(this.mapObj);
              if (layerData['heatMapType'] === 'top_markets' && response[1]['data'] && Object.keys(response[1]['data']).length !== 0) {
                this.isKeylegend = true;
                this.layersService.loadTopMarket(response[1], this.mapObj, layerData.color, 'top_markets');
                this.keyLegendColors = this.exploreService.colorGenerater(layerData.color);
                this.currentSingleInventory = topData;
                const minValue = this.getMinValue(response[1]['data'][0]);
                const maxVlaue = this.getMaxValue(response[1]['topFour']);
                if (minValue === 0) {
                  this.currentSingleInventory['minValue'] = '0.00';
                } else {
                  this.currentSingleInventory['minValue'] = this.format.convertToPercentageFormat(minValue, 2).toString();
                }
                this.currentSingleInventory['maxValue'] = this.format.convertToPercentageFormat(maxVlaue, 2).toString();
              } else if (layerData['heatMapType'] === 'top_zips' && response[1]['data'] && Object.keys(response[1]['data']).length !== 0) {
                this.layersService.loadTopZipCode(response[1], this.mapObj, layerData.color, 'top_zips');
                this.isKeylegend = true;
                this.keyLegendColors = this.exploreService.colorGenerater(layerData.color);
                this.currentSingleInventory = topData;
                const minValue = this.getMinValue(response[1]['data'][0]);
                const maxVlaue = this.getMaxValue(response[1]['topFour']);
                if (Number(minValue) === 0) {
                  this.currentSingleInventory['minValue'] = '0.00';
                } else {
                  this.currentSingleInventory['minValue'] = this.format.convertToPercentageFormat(minValue, 2).toString();
                }
                this.currentSingleInventory['maxValue'] = this.format.convertToPercentageFormat(maxVlaue, 2).toString();
              } else {
                this.isKeylegend = false;
                this.keyLegendColors = [];
                this.currentSingleInventory = {};
              }
              if (response[0]['inventory_summary'] &&
                response[0]['inventory_summary']['inventory_items'] &&
                response[0]['inventory_summary']['inventory_items'].length &&
                response[0]['inventory_summary']['inventory_items'][0]['location']) {
                const unitData = {
                  type: 'Feature',
                  geometry: response[0]['inventory_summary']['inventory_items'][0]['location']['geometry'],
                };
                this.layersService.markInventory(unitData, this.mapObj, layerData.color);
              }
              this.loaderService.display(false);
            });
            // this.addNewViewLayer(geopanel);
            break;

          case LayerType.GEO_SETS:
            const layerId = this.baseLayersIns.addGeoSetLayer(this.mapLayers, layerData);
            if (layerId) this.GeoSetLayerIds.push(layerId);
            break;
        }
      }
      const selectedGeography = layersSession['selectedLayers'].filter(layer => (layer.type === 'geography'));
      this.removeGeographyLayers();
      if (selectedGeography.length > 0) {
        let geoLayerData = [];
        let geoMarkerIconData = [];

        selectedGeography.forEach(layer => {
          layer['data']['properties']['icon'] = layer['icon'];
          layer['data']['properties']['color'] = layer['color'];
          layer['data']['properties']['id'] = layer['id'];

          const name = layer['data']['properties']['name'];
          let pointGeo = turfCenter(layer['data']);
          pointGeo['properties']['icon'] = layer['icon'];
          pointGeo['properties']['color'] = layer['color'];
          pointGeo['properties']['id'] = layer['id'];
          pointGeo['properties']['name'] = name;

          delete layer['data']['id'];
          delete layer['data']['name'];
          geoLayerData.push(layer['data']);
          geoMarkerIconData.push(pointGeo);
        });
        // to draw the polygon line
        this.mapObj.addSource('geoDataline', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geoLayerData
          }
        });
        // to fill the color inside the polygon area
        this.mapObj.addSource('geoDataFill', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geoLayerData
          }
        });
        // Add the icon in center places of polygon area
        this.mapObj.addSource('geoDataPoint', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geoMarkerIconData
          }
        });

        this.mapObj.addLayer({
          id: 'geographyLayerLine',
          type: 'line',
          source: 'geoDataline',
          paint: {
            'line-opacity': .8,
            'line-color': ['get', 'color'],
            'line-width': 1
          }
        });

        this.mapObj.addLayer({
          id: 'geographyLayerFill',
          type: 'fill',
          source: 'geoDataFill',
          paint: {
            'fill-opacity': .08,
            'fill-color': ['get', 'color']
          }
        });

        this.mapObj.addLayer({
          id: 'geoDataPointCenter',
          type: 'symbol',
          source: 'geoDataPoint',
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
            'text-color': ['get', 'color']
          }
        });
      } else {
        this.removeGeographyLayers();
      }

      const selectedGeoSetLayer = layersSession['selectedLayers'].filter(layer => (layer.type === 'geo sets'));

      if (selectedGeoSetLayer.length) {
        this.baseLayersIns.addLayerSource(this.mapObj);
        this.baseLayersIns.bindGeoSetIcon(this.GeoSetLayerIds, this.mapObj);
      }



      if (!layersSession['selectedLayers'].find(layer => layer.type === 'geopathId')) {
        this.isKeylegend = false;
        this.loaderService.display(false);
      }
    } else {
      this.isKeylegend = false;
      this.loaderService.display(false);
      this.removeGeographyLayers();
      this.removeLayers();
    }
  }

  /** topZIP, topDMA calculate min & max value */
  getMinValue(data) {
    if (data.length > 0) {
      return data.reduce((min, p) => p.pct < min ? p.pct : min, data[0].pct);
    } else {
      return 0;
    }
  }

  getMaxValue(data) {
    if (data.length > 0) {
      return data.reduce((max, p) => p.pct > max ? p.pct : max, data[0].pct);
    } else {
      return 0;
    }
  }

  getOperatorName(representations: Representation[]): string {
    let opp = '';
    if (representations) {
      const representation = representations.filter(rep => rep['representation_type']['name'] === 'Own')[0];
      if (representation) {
        opp = representation['account']['parent_account_name'];
        // opp = representation['division']['plant']['name'];
      }
    }
    return opp;
  }

  formatUpPlaceNationalData(data) {
    data.features.sort(function(a, b) {
      return b.properties.count - a.properties.count;
    });
    // Top 2% with the largest circles, top 25% medium, bottom 75% small.
    for (let i = 0, len = data.features.length; i < len; i++) {
      if (Math.ceil((i / len) * 100) <= 2 || i <= 1) {
        data.features[i].properties['radius'] = 40;  // 75;
      } else if (Math.ceil((i / len) * 100) <= 25 || i <= 3) {
        data.features[i].properties['radius'] = 20;  // 45;
      } else {
        data.features[i].properties['radius'] = 10;  // 25;
      }
    }
    return data;
  }

  removeGeographyLayers() {
    if (this.mapObj) {
      if (this.mapObj.getLayer('geographyLayerLine')) {
        this.mapObj.removeLayer('geographyLayerLine');
        this.mapObj.removeSource('geoDataline');
      }
      if (this.mapObj.getLayer('geographyLayerFill')) {
        this.mapObj.removeLayer('geographyLayerFill');
        this.mapObj.removeSource('geoDataFill');
      }
      if (this.mapObj.getLayer('geoDataPointCenter')) {
        this.mapObj.removeLayer('geoDataPointCenter');
        this.mapObj.removeSource('geoDataPoint');
      }
    }
  }

  public removeLayers() {
    if (!this.mapObj) {
      return false;
    }
    if (this.layerInventorySetLayers.length > 0) {
      this.layerInventorySetLayers.map(layerId => {
        if (this.mapObj.getLayer(layerId)) {
          this.mapObj.off('mouseenter', layerId);
          this.mapObj.off('mouseleave', layerId);
          this.mapObj.removeLayer(layerId);
        }
      });
    }
    if (this.layerInventorySetDataSets.length > 0) {
      this.layerInventorySetDataSets.map(layerId => {
        if (this.mapObj.getSource(layerId)) {
          this.mapObj.removeSource(layerId);
        }
      });
    }

     /** Removing Geoset layers */
     if (this.GeoSetLayerIds.length > 0) {
       /** center icon layer */
       this.mapObj.off('sourcedata');

       if (this.mapObj.getLayer('geoSetPointCenter')) {
        this.mapObj.removeLayer('geoSetPointCenter');
      }
      if (this.mapObj.getSource('geoSetPoint')) {
        this.mapObj.removeSource('geoSetPoint');
      };

      this.GeoSetLayerIds.map(layerId => {
        if (this.mapObj.getLayer(layerId)) {
          this.mapObj.removeLayer(layerId);
        }
      });
    }
    this.GeoSetLayerIds = [];
    this.layerInventorySetDataSets = [];
    this.layerInventorySetLayers = [];
  }

  buildPopup(e, i = 0, map, popup, layer) {
    
    this.features = map.queryRenderedFeatures(e.point, { layers: [layer] });
    // Sorting features based on frame id.
    this.features = this.features.sort(
      (left, right) =>
        left.properties[MapLayersInvetoryFields.FRAME_ID] -
        right.properties[MapLayersInvetoryFields.FRAME_ID]
    );
    // Commented the below code due to lack of information in map layers
    // this.features = this.features.sort(function(left, right) {
    //   return left.properties.opp.localeCompare(right.properties.opp) || left.properties.pid.localeCompare(right.properties.pid);
    // });
    const feature = Helper.deepClone(this.features[i]);
    // This is a short term solution to solve frame popup issue when you click directly on map
    let spotId = this.selectedFidsArray?.find(
      (idObject) =>
        idObject.frameId ===
        feature.properties[MapLayersInvetoryFields.FRAME_ID]
    )?.fid;
    if (spotId) {
      feature.properties[MapLayersInvetoryFields.FRAME_ID] = spotId;
      this.current_page = i;
      this.current_e = e;
      this.current_layer = layer;
      if (popup.isOpen()) {
        popup.remove();
      }
      popup
        .setLngLat(this.features[0].geometry.coordinates.slice())
        .setHTML('<div class="loaderPop"><div class="loader"></div></div>')
        .addTo(map);
      this.hidePopupShadow();
      this.buildInventoryPopup(feature, map, popup);
    } else {
      this.getFrameInfo(feature).subscribe((frameData) => {
        feature.properties[MapLayersInvetoryFields.FRAME_ID] =
          frameData?.layouts[0]?.faces[0]?.spots[0]?.id;
        this.current_page = i;
        this.current_e = e;
        this.current_layer = layer;
        if (popup.isOpen()) {
          popup.remove();
        }
        popup
          .setLngLat(this.features[0].geometry.coordinates.slice())
          .setHTML('<div class="loaderPop"><div class="loader"></div></div>')
          .addTo(map);
        this.hidePopupShadow();
        this.buildInventoryPopup(feature, map, popup);
      });
    }
  }

  private getFrameInfo(feature) {
    const params = {
      frameId: feature.properties[MapLayersInvetoryFields.FRAME_ID],
      target_segment: this.selectedAudienceID,
      measures: false,
      measures_release: this.selectedMeasuresRelease
    };
    if (this.baseAudience) {
      params['base_segment'] =  this.defaultAudience.audienceKey;
    }
    return this.inventoryService.getInventoryFrame(params)
  }

  public prepareInventoryQuerySE(spotID) {
    const query = {
      'from': 0,
      'size': 1,
      'track_total_hits': true,
      'query': {
        'nested': {
          'path': 'layouts.faces.spots',
          'inner_hits': {},
          'query': {
            'term': {
              'layouts.faces.spots.id': {
                'value': spotID
              }
            }
          }
        }
      }
    };
    return query;
  }

  private hidePopupShadow() {
    if (this.mapStyle !== 'light') {
      const parentDiv: HTMLElement = document.getElementsByClassName(`map-div ${this.layerType}`)[0] as HTMLElement;
      if (parentDiv) {
        const element: HTMLElement = parentDiv.getElementsByClassName('mapboxgl-popup-content')[0] as HTMLElement;
        if (element) {
          element.classList.add('hide-shadow');
        }
      }
    }
  }

  getPopupHTML(place, type = 'map') {
    // Inject Component and Render Down to HTMLDivElement Object
    if (place['id'] === undefined) {
      place['id'] = place['spot_references'] && place['spot_references'][0] && place['spot_references'][0]['spot_id'];
    }
    const inventoryInformation = {
      isAllowInventoryAudience: this.allowInventoryAudience,
      isMeasureAllowed: this.isMeasureEnabled,
      currentPage: this.current_page + 1,
      type: type,
      feature: place,
      selectedFids: this.selectedFidsArray,
      features: type !== 'outside' && this.features || [],
      count: this.selectedFidsArray.length,
      mapStyle: this.mapStyle,
      totalInventory: this.totalInventory,
      layerType: this.layerType
    };

    const description = this.dynamicComponentService
      .injectComponent(ExploreInventoryDetailComponent, x => x.inventory = inventoryInformation);

    // have to check following these variables
    this.popOpenedType = type;
    this.openedInventoryDetail = false;
    return description;
  }

  /**
   * This method will prepare the query needed to get single spot data
   * @param spotID
   */
  public prepareInventoryQuery(spotID) {
    const query: Partial<SummaryRequest> = {};
    query['target_segment'] = this.selectedAudienceID;
    if (this.selectedMarkets && this.selectedMarkets['selectedMarkets'] &&
      this.selectedMarkets['selectedMarkets'].length > 0 && this.selectedMarkets['selected'] !== '') {
      if (this.selectedMarkets['selected'] === 'all' || this.selectedMarkets['selected'] === 'individual_all') {
        query['target_geography_list'] = this.selectedMarkets['selectedMarkets'].map(market => market.id);
      } else if (this.selectedMarkets['selected'] === 'us') {
        query['target_geography_list'] = [''];
      } else {
        const slectedMarket = this.selectedMarkets['selectedMarkets'].filter
        ((market) => this.selectedMarkets['selected'] === market.id);
        query['target_geography_list'] = [slectedMarket[0].id];
      }
    }
    if (this.baseAudience) {
      query['base_segment'] = this.defaultAudience.audienceKey;
    }
    if ( !this.filterData?.status_type_name_list || this.filterData?.status_type_name_list.length <= 0 ) {
      query['status_type_name_list'] = ['*'];
    } else {
      query['status_type_name_list'] = this.filterData.status_type_name_list;
    }
    if (this.filterData && this.filterData['period_days']) {
      query['period_days'] = this.filterData['period_days'];
    }
    if (this.filterData && this.filterData['measures_release']) {
      query['measures_release'] = this.filterData['measures_release'];
    }
    if (spotID) {
      query['id_list'] = [spotID];
      query['id_type'] = 'spot_id';
    }
    return query;
  }

  loadFunction(popup, map, feature) {
    const self = this;
    $('.next.' + self.layerType).off().on('click',
      function(e) {
        self.next(popup, map);
        return false;
      });
    $('.prev.' + self.layerType).off().on('click',
      function(e) {
        self.prev(popup, map);
        return false;
      });
    $('.open_inventory_card_btn.' + self.layerType).off().on('click', function() {
      $('.map-div.' + self.layerType).find('.mapboxgl-popup-content').addClass('open_inventory_popup');
      $('.map-div.' + self.layerType).addClass('opened_detailed_popup');
      self.openInventoryDetailedPopup(popup, map, feature, self.isLandscape);
      return false;
    });
    $('.detailed_info_popup.' + self.layerType).off().on('click', function() {
      self.openInventoryInfoPopup(popup, map, feature);
      return false;
    });
    $('.close_detailed_popup.' + self.layerType).off().on('click', function() {
      $('.map-div.' + self.layerType).removeClass('opened_detailed_popup');
      const htmlContent = self.getPopupHTML(feature, self.popOpenedType);
      setTimeout(function() {
        popup.setHTML(htmlContent.innerHTML).addTo(map);
        self.loadFunction(popup, map, feature);
        // add inventory detail if the inventory not in top 100 list
        if (self.allowInventoryAudience !== 'hidden') {
          self.getSingleInventory(feature, 'desktop');
        }
      }, 100);
      return false;
    });
    $('.change_landscape.' + self.layerType).off().on('click', function() {
      $('.map-div.' + self.layerType).addClass('opened_detailed_popup');
      $('.map-div.' + self.layerType).find('.mapboxgl-popup-content').addClass('open_inventory_popup');
      self.openInventoryDetailedPopup(popup, map, feature, false);
      return false;
    });
    $('.change_portrait.' + self.layerType).off().on('click', function() {
      $('.map-div.' + self.layerType).addClass('opened_detailed_popup');
      $('.map-div.' + self.layerType).find('.mapboxgl-popup-content').addClass('open_inventory_popup');
      self.openInventoryDetailedPopup(popup, map, feature, true);
      return false;
    });
    $('.open_inventory_card.' + self.layerType).off().on('click', function() {
      $('.map-div.' + self.layerType).addClass('opened_detailed_popup');
      $('.map-div.' + self.layerType).find('.mapboxgl-popup-content').addClass('open_inventory_popup');
      self.openInventoryDetailedPopup(popup, map, feature, self.isLandscape);
      return false;
    });
    $('.download_us_pdf.' + self.layerType).off().on('click', function() {
      let pdfReqHeaders = {};
      pdfReqHeaders['panel_id'] = [`${feature.id}`];
      pdfReqHeaders['type'] = 'inventory_details';
      pdfReqHeaders['aud'] = self.selectedAudienceID !== '' ? self.selectedAudienceID : self.defaultAudience.audienceKey;
      pdfReqHeaders['aud_name'] = self.selectedTarget;
      pdfReqHeaders['orientation'] = self.isLandscape ? 'portrait' : 'landscape';
      pdfReqHeaders['report_format'] = 'pdf';

      pdfReqHeaders = Object.assign(pdfReqHeaders, self.inventoryService.exportParamFormat(self.selectedMarkets));

      if (self.filterData && self.filterData['period_days']) {
        pdfReqHeaders['period_days'] = self.filterData['period_days'];
      }
      const preferences = self.common.getUserPreferences();
      pdfReqHeaders['measures_release'] = preferences?.measures_release || 2021;

      pdfReqHeaders['target_segment'] = self.selectedAudienceID !== '' ? self.selectedAudienceID : self.defaultAudience.audienceKey;
      self.exploreService.downloadPdf(pdfReqHeaders).subscribe((res: HttpResponse<any>) => {
        const contentDispose = res.headers.get('content-disposition');
        const matches = contentDispose.split(';')[1].trim().split('=')[1];
        const filename = matches && matches.length > 1 ? matches : feature.id + '.pdf';
        saveAs(res.body, filename);
      });
      return false;
    });

    // $('#map-it-zip').off().on('click',
    //   function (e) {
    //     self.openDetailMap('zip');
    //     return false;
    //   });
    // $('#map-it-dma').off().on('click',
    //   function (e) {
    //     self.openDetailMap('dma');
    //     return false;
    //   });
    /**
     * This function is to handle inventory status spots tooltip on map-popup
     * because the popup content is not loading as dynamic components
     * so we can't use dynamic inventory tooltip directive.
     */
    $('.inventory-status-dots.' + self.layerType).off().on('mouseenter',
      function(e) {
        let name = feature['media_status']['name'];
        if (name.includes('Published - ')) {
          name = name.replace('Published - ', '');
        }
        if (name.includes('Non-Audited')) {
          name = 'Unaudited';
        }
        if (feature['media_status']) {
          let tooltip = `<b>${name}</b>`;
          if (feature['media_status']['description']) {
            tooltip += '<br>' + feature['media_status']['description'];
          }
          self.show(e.target, tooltip, 'left', 300);
        }
        return false;
      });
    $('.inventory-status-dots.' + self.layerType).on('mouseleave',
      function(e) {
        self.hide();
        return false;
      });
  }

  next(popup, map) {
    let i = this.current_page + 1;
    if (i >= this.features.length) {
      i = 0;
    }
    this.current_page = i;
    const feature = Helper.deepClone(this.features[i]);
    this.moveToNextFeature(feature, map, popup);
  }

  prev(popup, map) {
    let i = this.current_page - 1;
    const len = this.features.length;
    if (i < 0) {
      i = this.features.length - 1;
    }
    this.current_page = i;
    const feature = Helper.deepClone(this.features[i]);
    this.moveToNextFeature(feature, map, popup);
  }

  moveToNextFeature(feature, map, popup) {
    let spotId = this.selectedFidsArray?.find(
      (idObject) =>
        idObject.frameId ===
        feature.properties[MapLayersInvetoryFields.FRAME_ID]
    )?.fid;
    if (spotId) {
      feature.properties[MapLayersInvetoryFields.FRAME_ID] = spotId;
      this.buildInventoryPopup(feature, map, popup);
    } else {
      this.getFrameInfo(feature).subscribe((frameData) => {
        feature.properties[MapLayersInvetoryFields.FRAME_ID] =
          frameData?.layouts[0]?.faces[0]?.spots[0]?.id;
        this.buildInventoryPopup(feature, map, popup);
      });
    }
  }


  buildInventoryPopup(feature, mapObj, popup) {
    const featureLayer = feature['layer'];
    let inventoryAPI = null;
    if (this.customInventoriesStatus === 'active' && featureLayer['id'].indexOf('custom_') !== -1) {
      inventoryAPI = this.inventoryService
        .getInventoryFromElasticSearch(this.prepareInventoryQuerySE(feature.properties.fid))
        .pipe(map(inventoryItems => {
          const sourceData = this.inventoryService.formatSpotElasticData(inventoryItems);
          const currentFeature = sourceData[0] || {};
          // feature['plant_frame_id'] = feature.properties.pid;
          return currentFeature;
        }));
    } else {
      inventoryAPI = this.inventoryService.getInventories(this.prepareInventoryQuery(feature.properties[MapLayersInvetoryFields.FRAME_ID])).pipe(
        map(inventoryItems => {
          const currentFeature = inventoryItems[0] || {};
          return currentFeature;
        }));
    }
    inventoryAPI.subscribe(currentFeature => {
      currentFeature['layer'] = featureLayer;
      if (currentFeature && Object.keys(currentFeature).length) {
        if (this.customInventoriesStatus === 'active' && featureLayer['id'].indexOf('custom_') !== -1) {
          this.inventoryPopupBuild(currentFeature, popup, mapObj);
        } else {
          const params = {
            frameId: currentFeature['frame_id'],
            'target_segment': this.selectedAudienceID,
            'measures_release': this.selectedMeasuresRelease
          };
          if (this.baseAudience) {
            params['base_segment'] =  this.defaultAudience.audienceKey;
          }

          this.inventoryService.getInventoryFrame(params).subscribe(frameData => {
            const inventoryData = {};
            const layout = frameData['layouts'].find((layoutData) => layoutData['id'] === frameData['id']);
            if (layout) {
              const face = layout['faces'][0];
              const spot = face['spots'].find(s => s['id'] ===  feature.properties[MapLayersInvetoryFields.FRAME_ID]);
              inventoryData['spot_count'] = spot?.['length'];
              inventoryData['digital'] = frameData['digital'];
              inventoryData['layer_voice'] = layout['share_of_voice'];
              inventoryData['spot_voice'] = spot?.['share_of_voice'] || 0;
            }
            currentFeature['voice'] = inventoryData;
            this.inventoryPopupBuild(currentFeature, popup, mapObj);
          });
        }
      } else {
        popup.setLngLat(this.features[0].geometry.coordinates.slice())
          .setHTML(`<div class="no-data-msg">There is no data available for this inventory(Spot Id:
          ${feature.properties[MapLayersInvetoryFields.FRAME_ID]})</div>`).addTo(map);
        this.hidePopupShadow();
      }
    });
  }

  inventoryPopupBuild(currentFeature, popup, map) {

    const place = currentFeature, type = 'map';

    if (place['id'] === undefined) {
      place['id'] = place['spot_references'] && place['spot_references'][0] && place['spot_references'][0]['spot_id'];
    }
    const inventoryInformation = {
      isAllowInventoryAudience: this.allowInventoryAudience,
      isMeasureAllowed: this.isMeasureEnabled,
      currentPage: this.current_page + 1,
      type: type,
      feature: place,
      selectedFids: this.selectedFidsArray,
      features: this.features || [],
      count: this.selectedFidsArray.length,
      mapStyle: this.mapStyle,
      totalInventory: this.totalInventory,
      layerType: this.layerType
    };

    const mapContainer = map?.getContainer();
    const popupRef = this.popupService.openPopups.get(mapContainer?.id);
    popupRef?.close?.();

    this.popupService.open(ExploreInventoryDetailComponent, {
      id: mapContainer.id,
      data: inventoryInformation,
      originEl: mapContainer,
    });

    popup.remove();

    // const htmlContent = this.getPopupHTML(currentFeature);
    setTimeout(() => {
      // popup.setHTML(htmlContent.innerHTML);
      this.loadFunction(popup, map, currentFeature);
      // add inventory detail if the inventory not in top 100 list
      if (this.allowInventoryAudience !== 'hidden') {
        this.getSingleInventory(currentFeature, 'desktop');
      }
    }, 100);
  }

  openInventoryInfoPopup(popup, map, feature) {
    const description = this.getInventoryInfoPopupHtml('html');
    setTimeout(() => {
      popup.setHTML(description.innerHTML);
      this.loadFunction(popup, map, feature);
    }, 100);
  }

  openInventoryDetailedPopup(popup, map, feature, portraitView) {
    this.isLandscape = portraitView;
    // const inventoryDetailApiData = JSON.parse(JSON.stringify(this.inventoryDetailApiData.getValue()));
    const inventoryDetailApiZipData = Helper.deepClone(this.inventoryDetailApiZipData.getValue());
    const inventoryDetailApiDmaData = Helper.deepClone(this.inventoryDetailApiDmaData.getValue());
    const topSegmentsData = Helper.deepClone(this.inventoryTopSegmentsData.getValue());
    const hourlyImpsData = Helper.deepClone(this.hourlyImpressionsData.getValue());
    const inventoryDetail = {};
    inventoryDetail['zipcodes'] = inventoryDetailApiZipData;
    inventoryDetail['dmaresults'] = inventoryDetailApiDmaData;
    inventoryDetail['segments'] = topSegmentsData;
    inventoryDetail['hourlyImpressions'] = hourlyImpsData;
    if (this.themeSettings.site === 'omg') {
      this.openedInventoryDetail = true;
      if (this.mapPopupObj.isOpen()) {
        this.mapPopupObj.remove();
      }
      this.openDeatilsPopup(inventoryDetail, feature, 'map', portraitView);
      this.loadFunction(popup, map, feature);
      this.openedInventoryDetail = true;
      this.openedPopupObj = popup;
      this.openedMapObj = map;
      this.openedFeatureObj = feature;
    } else {
      this.getPopupDetailedHTML(inventoryDetail, feature, 'map', portraitView);
      setTimeout(() => {
        // popup.setHTML(description.innerHTML);
        this.hidePopupShadow();
        this.loadFunction(popup, map, feature);
        this.openedInventoryDetail = true;
        this.openedPopupObj = popup;
        this.openedMapObj = map;
        this.openedFeatureObj = feature;
      }, 300);
    }
  }

  getPopupDetailedHTML(res, feature, type = 'map', portraitView = false) {
    // let popupContent: any;
    const miniLogo = this.themeSettings['logo']['mini_logo'];
    if (feature['location'] && feature['location']['geometry'] !== 'undefined') {
      this.getStaticMapUrl(feature.location.geometry.coordinates, type);
    }

    // Selected audience info
    let target_audience = {
      name: this.defaultAudience.description,
      id: this.defaultAudience.audienceKey,
    };
    const preferences = this.common.getUserPreferences();
    const measures_release = preferences?.measures_release || 2021;
    if (this.selectedAudienceID) {
      target_audience = {
        name: this.selectedTarget, id: this.selectedAudienceID
      };
    }
    const inventoryInformation = {
      inventoryDetail: res,
      feature: feature,
      targetAudience: target_audience,
      type: type,
      portraitView: portraitView,
      staticMapURL: this.staticMapURL,
      openedInventoryDetail: this.openedInventoryDetail,
      miniLogo: miniLogo,
      apiZipCall: this.apiZipCall,
      apiDmaCall: this.apiDmaCall,
      apiTopSegmentCall: this.apiTopSegmentCall,
      hourlyImpApiLoader: this.hourlyImpApiLoader,
      selectedMarket: this.selectedMarkets,
      mapStyle: this.mapStyle,
      defaultAudience: this.defaultAudience,
      addNotesAccess: this.addNotesAccess,
      isMeasureEnabled: this.isMeasureEnabled,
      audienceLicense: this.audienceLicense,
      pdfExportEnabled: (this.pdfExportEnabled === 'active'),
      layerType: this.layerType,
      displayMeasures: true,
      measures_release: measures_release
    };
    // tslint:disable-next-line:max-line-length
    // popupContent = this.dynamicComponentService.injectComponent(InventoryDetailViewComponent, x => x.inventoryDetails = inventoryInformation);
    const mapContainer = this.mapObj?.getContainer();
    const popupRef = this.popupService.openPopups.get(mapContainer?.id);
    popupRef?.close?.();
    const inventDetailsPopupRef = this.popupService.open(InventoryDetailViewComponent, {
      id: mapContainer?.id as string,
      data: inventoryInformation,
      originEl: mapContainer,
    });
    return inventDetailsPopupRef;
  }


  openDeatilsPopup(res, feature, type = 'map', portraitView = false) {
    const miniLogo = this.themeSettings['logo']['mini_logo'];
    if (feature['location'] && feature['location']['geometry'] !== 'undefined') {
      this.getStaticMapUrl(feature.location.geometry.coordinates, type);
    }

    // Selected audience info
    let target_audience = {
      name: this.defaultAudience.description,
      id: this.defaultAudience.audienceKey,
    };

    if (this.selectedAudienceID) {
      target_audience = {
        name: this.selectedTarget, id: this.selectedAudienceID
      };
    }
    const preferences = this.common.getUserPreferences();
    const measures_release = preferences?.measures_release || 2021;
    const inventoryInformation = {
      inventoryDetail: res,
      feature: feature,
      targetAudience: target_audience,
      type: type,
      portraitView: portraitView,
      staticMapURL: this.staticMapURL,
      openedInventoryDetail: this.openedInventoryDetail,
      miniLogo: miniLogo,
      apiZipCall: this.apiZipCall,
      apiDmaCall: this.apiDmaCall,
      apiTopSegmentCall: this.apiTopSegmentCall,
      hourlyImpApiLoader: this.hourlyImpApiLoader,
      selectedMarket: this.selectedMarkets,
      mapStyle: this.mapStyle,
      defaultAudience: this.defaultAudience,
      addNotesAccess: this.addNotesAccess,
      layerType: this.layerType,
      displayMeasures: true,
      measures_release: measures_release
    };
    if (this.themeSettings.site === 'omg') {
      this.isLandscape = false;
      const dialogRef = this.dialogBox.open(InventoryDetailViewLayoutComponent, {
        width: '1030px',
        data: inventoryInformation,
        backdropClass: 'hide-backdrop',
        panelClass: 'inventory-detail-dialog'
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'openInventory') {
          if (this.popOpenedType === 'map') {
            this.buildPopup(this.current_e, this.current_page, this.openedMapObj, this.openedPopupObj, this.current_layer);
          } else {
            // this.openPanelPopup(this.outSideOpenPlace);
          }
        }
      });

    }
  }

  getInventoryInfoPopupHtml(fileType) {
    const inventoryInformation = {
      fileType: fileType,
      isLandscape: this.isLandscape,
      layerType: this.layerType
    };
    const popupContent = this.dynamicComponentService
      .injectComponent(ExploreInventoryInformationComponent, x => x.inventoryInformation = inventoryInformation);
    return popupContent;
  }

  getSingleInventory(feature, type) {
    if (
      feature['spot_references'] &&
      feature['spot_references'][0] &&
      feature['spot_references'][0]['measures'] &&
      feature['spot_references'][0]['measures']['imp'] &&
      feature['spot_references'][0]['measures']['imp'] > 0
    ) {
      this.inventoryDetailTimer = setTimeout(() => {
        this.getInventoryDetail(feature);
      }, 500);
    }
  }

  getInventoryDetail(feature) {
    if (this.allowInventoryAudience === 'hidden') {
      return false;
    }
    const zipdata = {};
    const dmadata = {};
    let segmentQuery = {};
    this.inventoryDetailApiZipData.next({});
    this.inventoryDetailApiDmaData.next({});
    this.inventoryTopSegmentsData.next([]);
    this.hourlyImpressionsData.next({});
    zipdata['fid'] = feature['spot_references'][0]['spot_id'];
    zipdata['replevel'] = 'zip_code';
    zipdata['target_segment'] = this.selectedAudienceID;
    zipdata['measures_release'] = this.selectedMeasuresRelease;
    dmadata['fid'] = feature['spot_references'][0]['spot_id'];
    dmadata['replevel'] = 'dma';
    dmadata['target_segment'] = this.selectedAudienceID;
    dmadata['measures_release'] = this.selectedMeasuresRelease;
    if (this.selectedMarkets && this.selectedMarkets['selectedMarkets'] && this.selectedMarkets['selectedMarkets'].length > 0) {
      zipdata['target_geography_list'] = this.selectedMarkets['selectedMarkets'].map(market => market.id);
      dmadata['target_geography_list'] = this.selectedMarkets['selectedMarkets'].map(market => market.id);
    }
    clearTimeout(this.recallInventoryApiTimer);
    if (this.inventoryDetailApiCall !== null) {
      this.inventoryDetailApiCall.unsubscribe();
    }
    this.apiZipCall = false;
    this.inventoryDetailApiZipCall = this.exploreService.getInventoryDetailZipDMA(zipdata, true).subscribe((zipresponse) => {
        this.inventoryDetailApiZipData.next(zipresponse);
        this.apiZipCall = true;
      },
      error => {
        /** For 410 HTTP response the status is coming as 0 so to handle it we have added the below condition */
        if (error.status === 410) {
          this.inventoryDetailApiZipData.next(null);
          this.apiZipCall = true;
        } else {
          this.recallInventoryApiTimer = setTimeout(() => {
            this.getInventoryDetail(feature);
          }, 30000);
        }
      });
    this.apiDmaCall = false;
    this.inventoryDetailApiDmaCall = this.exploreService.getInventoryDetailZipDMA(dmadata, true).subscribe((dmaresponse) => {
        this.inventoryDetailApiDmaData.next(dmaresponse);
        this.apiDmaCall = true;
      },
      error => {
        /** F or 410 HTTP response the status is coming as 0 so to handle it we have added the below condition */
        if (error.status === 410) {
          this.inventoryDetailApiDmaData.next(null);
          this.apiDmaCall = true;
        } else {
          this.recallInventoryApiTimer = setTimeout(() => {
            this.getInventoryDetail(feature);
          }, 30000);
        }
      });

    segmentQuery = this.prepareInventoryQuery(feature['spot_references'][0]['spot_id']);
    if (segmentQuery['target_segment']) {
      // segmentQuery['target_segment_list'] = [segmentQuery['target_segment']];
      delete segmentQuery['target_segment'];
    }
    segmentQuery['measures_release'] = this.selectedMeasuresRelease;
    segmentQuery['page_size'] = 4;
    this.apiTopSegmentCall = false;
    this.inventoryTopSegmentsApiCall = this.inventoryService.getTopSegments(segmentQuery).subscribe((segments) => {
        this.inventoryTopSegmentsData.next(segments);
        this.apiTopSegmentCall = true;
      },
      error => {
        /// For 410 HTTP response the status is coming as 0 so to handle it we have added the below condition
        if (error.status === 410) {
          this.inventoryTopSegmentsData.next(null);
          this.apiTopSegmentCall = true;
        } else {
          this.recallInventoryApiTimer = setTimeout(() => {
            this.getInventoryDetail(feature);
          }, 30000);
        }
      });


    this.hourlyImpApiLoader = false;
    const hourlyImpApiParams = {
      spotId: feature['spot_references'][0]['spot_id'],
      'target_segment': this.selectedAudienceID,
      'measures_release' : this.selectedMeasuresRelease
    };
    if(this.baseAudience) {
      hourlyImpApiParams['base_segment'] = this.defaultAudience.audienceKey;
    }
    this.hourlyImpApiCall = this.inventoryService.getSpotHourlyImpressions(hourlyImpApiParams).subscribe((response) => {
        setTimeout(() => {
          const measure = response['total_msg_impressions'];
          measure['voice'] = feature['voice'];
          this.hourlyImpressionsData.next(measure);
          this.hourlyImpApiLoader = true;
        }, 3000);
      },
      error => {
        if (error.status === 410) {
          this.hourlyImpressionsData.next(null);
          this.hourlyImpApiLoader = true;
        } else {
          this.recallInventoryApiTimer = setTimeout(() => {
            this.getInventoryDetail(feature);
          }, 30000);
        }
      });

  }

  buildPointOfInterestPopup(e, i = 0, map, popup, layer) {
    const self = this;
    this.features = map.queryRenderedFeatures(e.point, { layers: [layer] });
    const feature = this.features[i];
    this.current_page = i;
    this.current_e = e;
    // this.hideplaceMapViewPopup = false;
    const htmlContent = this.getPointsOfIntersetPopupHTML(feature);

    if (!this.mobileView) {
      if (popup.isOpen()) {
        popup.remove();
      }
      setTimeout(function() {
        this.detailPlacePopupDescription = htmlContent.innerHTML;
        popup.setLngLat(self.features[0].geometry.coordinates.slice())
          .setHTML(htmlContent.innerHTML).addTo(map);
        self.loadPoiPopupFunction(popup, map, feature);
      }, 100);
    } else {
      setTimeout(function() {
        this.detailPlacePopupDescription = htmlContent.innerHTML;
        popup.setLngLat(self.features[0].geometry.coordinates.slice())
          .setHTML(htmlContent.innerHTML);
        self.loadPoiPopupFunction(popup, map, feature);
      }, 100);
    }
  }

  getPointsOfIntersetPopupHTML(feature, type = 'map') {
    // Inject Component and Render Down to HTMLDivElement Object
    const inventoryInformation = {
      currentPage: this.current_page + 1,
      type: type,
      feature: feature,
      features: this.features,
      layerType: this.layerType
    };
    const popupContent = this.dynamicComponentService
      .injectComponent(ExploreInventoryIntersetComponent, x => x.interset = inventoryInformation);
    return popupContent;
  }

  loadPoiPopupFunction(popup, map, feature) {
    const self = this;
    $('.nextPoiFrame.' + self.layerType).off().on('click',
      function(e) {
        self.nextPoiFrame(popup, map);
        return false;
      });
    $('.prevPoiFrame.' + self.layerType).off().on('click',
      function(e) {
        self.prevPoiFrame(popup, map);
        return false;
      });
  }

  nextPoiFrame(popup, map) {
    const e = this.current_e;
    let i = this.current_page + 1;
    if (i >= this.features.length) {
      i = 0;
    }
    this.current_page = i;
    const feature = this.features[i];
    const description = this.getPointsOfIntersetPopupHTML(feature);
    setTimeout(() => {
      popup.setHTML(description.innerHTML);
      this.loadPoiPopupFunction(popup, map, feature);
    }, 100);
  }

  prevPoiFrame(popup, map) {
    const e = this.current_e;
    let i = this.current_page - 1;
    const len = this.features.length;
    if (i < 0) {
      i = this.features.length - 1;
    }
    this.current_page = i;
    const feature = this.features[i];
    const description = this.getPointsOfIntersetPopupHTML(feature);
    setTimeout(() => {
      popup.setHTML(description.innerHTML);
      this.loadPoiPopupFunction(popup, map, feature);
    }, 100);
  }

  getStaticMapUrl(coOrds, type) {
    switch (type) {
      case 'pdf':
        this.staticMapURL = this.exploreDataService.getStaticMapImage(coOrds, 330, 145);
        break;
      case 'mapView':
        this.staticMapURL = this.exploreDataService.getStaticMapImage(coOrds, 768, 125);
        break;
      case 'mobile':
        this.staticMapURL = this.exploreDataService.getStaticMapImage(coOrds, 768, 125);
        break;
      default:
        this.staticMapURL = this.exploreDataService.getStaticMapImage(coOrds, 243, 145);
        break;
    }
  }

  /**
   * Below functions (show, hide, create and setPosition) is to handle inventory status spots tooltip on map-popup
   * because the popup content is not loading as dynamic components
   * so we can't use dynamic inventory tooltip directive.
   */
  show(el, tooltipTitle, placement, delay) {
    this.create(el, tooltipTitle, placement, delay);
    this.setPosition(el, placement, delay);
    this.renderer.addClass(this.tooltip, 'ng-tooltip-show');
  }

  hide() {
    this.renderer.removeClass(this.tooltip, 'ng-tooltip-show');
    window.setTimeout(() => {
      this.renderer.removeChild(document.body, this.tooltip);
      this.tooltip = null;
    }, Number(300));
  }

  create(el, tooltipTitle, placement, delay) {
    this.tooltip = this.renderer.createElement('div');
    const tooltipText = this.renderer.createElement('span');
    tooltipText.innerHTML = tooltipTitle;
    this.renderer.appendChild(
      this.tooltip,
      tooltipText // textNode
    );

    this.renderer.appendChild(document.body, this.tooltip);
    // this.renderer.appendChild(this.el.nativeElement, this.tooltip);

    this.renderer.addClass(this.tooltip, 'ng-tooltip');
    this.renderer.addClass(this.tooltip, `ng-tooltip-${placement}`);
    this.renderer.setStyle(this.tooltip, '-webkit-transition', `opacity ${delay}ms`);
    this.renderer.setStyle(this.tooltip, '-moz-transition', `opacity ${delay}ms`);
    this.renderer.setStyle(this.tooltip, '-o-transition', `opacity ${delay}ms`);
    this.renderer.setStyle(this.tooltip, 'transition', `opacity ${delay}ms`);
  }

  setPosition(el, placement, delay) {
    // Host element size and position information
    const hostPos = el.getBoundingClientRect();
    // size and position information for the tooltip element
    const tooltipPos = this.tooltip.getBoundingClientRect();
    // windows scroll top
    // The getBoundingClientRect method returns the relative position in the viewport.
    // If scrolling occurs, the vertical scroll coordinate value should be reflected on the top of the tooltip element.
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    let top, left;
    const offset = 10;
    if (placement === 'top') {
      top = hostPos.top - tooltipPos.height - offset;
      left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
    }

    if (placement === 'bottom') {
      top = hostPos.bottom + offset;
      left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
    }

    if (placement === 'left') {
      top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
      left = hostPos.left - tooltipPos.width - offset;
    }

    if (placement === 'right') {
      top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
      left = hostPos.right + offset;
    }

    // If scrolling occurs, the vertical scroll coordinate value should be reflected on the top of the tooltip element.
    this.renderer.setStyle(this.tooltip, 'top', `${top + scrollPos}px`);
    this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
  }

  public clearLayerView(clearAll = true) {
    this.showMapLegend = true;
    this.showMapControls = true;
    this.logoInfo = {};
    this.displayTextInfo = {};
    this.logoStyle = {};
    this.customTextStyle = {};
    this.activeDraggablePosition = { x: 0, y: 0 };
    this.activeDraggableTextPosition = { x: 0, y: 0 };
    this.mapWidthHeight = {};
    this.showDragLogo = false;
    this.showDragTextLogo = false;
    setTimeout(() => {
      this.showDragLogo = true;
      this.showDragTextLogo = true;
      this.addResizeIcon();
    }, 20);
    this.viewLayerApplied = false;
    this.removeLayers();
    this.removeGeographyLayers();
    this.isKeylegend = false;
    if (clearAll && this.mapStyle !== 'light') {
      if (this.mapPopupObj.isOpen()) {
        this.mapPopupObj.remove();
      }
      this.mapStyle = this.getDefaultMapStyle();
      this.style = this.common.getMapStyle(this.baseMaps, this.mapStyle);
      this.mapObj.setStyle(this.style['uri']);
      this.mapObj.once('style.load', () => {
        this.mapObj.fitBounds(this.mapBounds);
        this.mapObj.setZoom(this.zoomLevel);
      });
    }
  }

  getDefaultMapStyle() {
    this.baseMaps.filter(maps => {
      if (maps.default) {
        this.defaultMapStyle = maps.label;
      }
    });
    return this.defaultMapStyle;
  }

  public removeLogo() {
    this.layersService.setRemoveLogoAndText({
      type: 'primary',
      value: 'logo'
    });
    this.logoInfo = {};
    this.logoStyle = {};
    this.enableDraggable = true;
    this.activeDraggablePosition = { x: 0, y: 0 };
  }

  public removeText() {
    this.layersService.setRemoveLogoAndText({
      type: 'secondary',
      value: 'text'
    });
    this.displayTextInfo = {};
    this.customTextStyle = {};
    this.enableDraggable = true;
    this.activeDraggableTextPosition = { x: 0, y: 0 };
  }

  public editLogoAndText() {
    this.filterService.setFilterSidenav({ open: true, tab: 'layer' });
  }

  getTopZipcodesHTML(res) {
    /* topzip details card start*/
    let feature;
    if (
      this.openedFeatureObj &&
      this.openedFeatureObj['layouts'] &&
      this.openedFeatureObj['layouts'][0]['faces'] &&
      this.openedFeatureObj['layouts'][0]['faces'][0]['spots'] &&
      this.openedFeatureObj['layouts'][0]['faces'][0]['spots'][0]['measures']) {
      feature = this.openedFeatureObj['layouts'][0]['faces'][0]['spots'][0]['measures'];
    }
    const comingSoon = `<div class="coming_soon_div"> <i class="material-icons">tag_faces</i> <h4>COMING SOON!</div>`;
    let description = `<div class="topzip-card top-zip-card ${this.layerType}">`;
    description += `
                <h5>Top Contributing Zip Code (Persons: 0+)</h5>`;
    if (res !== null && typeof res.zipcodes['topFour'] !== 'undefined' && res.zipcodes['topFour'].length > 0) {
      description += `
                    <div class="topzip">
                      <ul>`;
      if ((feature && feature['pop_inmkt'] && feature['pop_inmkt'] > 0) || !feature) {
        const j = (res.zipcodes['topFour'].length > 4) ? 4 : res.zipcodes['topFour'].length;
        for (let i = 0; i < j; i++) {
          const zip = res.zipcodes['topFour'][i];
          if (typeof zip['zip'] !== 'undefined') {
            description += '<li><span class="steps">' + (i + 1) +
              '</span><span>' + zip['zip'].replace('ZIP', '') + ' <i  class="percent top-percent-position">' + this.format.convertToPercentageFormat(zip['pct'], 2) + '%</i></span></li>';
          }

        }
        description += `
                  </ul>`;
        if (!this.mobileView && this.layerType === 'primary') {
          description += '<button id="map-it-zip" type="button" mat-raised-button color="primary"><i class="material-icons">map</i> <span>Map It</span></button>';
        }
        description += `</div>`;
      } else {
        description += '<div class="under-review">Under Review</div>';
      }
      // here checking the unitdetails field because sometime unitdetails is getting undefined.
      /* if (res.hasOwnProperty('unitDetails')) {
        const prop = res.unitDetails.properties;
        if (prop.total_market_population > 0) {

        } else {

        }
      } else {
        description += '<div class="under-review">Under Review</div>';
      } */
    } else {
      description += comingSoon;
    }
    description += '</div>';
    description += '</div>';
    /* topzip details card end */
    return description;
  }

  getTopDmasHTML(res) {
    /* topzip details card start*/
    let feature;
    if (
      this.openedFeatureObj &&
      this.openedFeatureObj['layouts'] &&
      this.openedFeatureObj['layouts'][0]['faces'] &&
      this.openedFeatureObj['layouts'][0]['faces'][0]['spots'] &&
      this.openedFeatureObj['layouts'][0]['faces'][0]['spots'][0]['measures']) {
      feature = this.openedFeatureObj['layouts'][0]['faces'][0]['spots'][0]['measures'];
    }
    const comingSoon = `<div class="coming_soon_div"> <i class="material-icons">tag_faces</i> <h4>COMING SOON!</div>`;

    let description = '<div class="topmarket-card top-zip-card ' + this.layerType + '">';
    description += `<h5>Top Contributing DMA (Persons: 0+)</h5><div></div>`;

    if (res !== null && typeof res.dmaresults['topFour'] !== 'undefined' && res.dmaresults['topFour'].length > 0) {
      if ((feature && feature['pop_inmkt'] && feature['pop_inmkt'] > 0) || !feature) {
        description += '<div class="topzip">';
        description += '<ul>';
        const j = (res.dmaresults['topFour'].length > 4) ? 4 : res.dmaresults['topFour'].length;
        for (let i = 0; i < j; i++) {
          const dma = res.dmaresults['topFour'][i];
          if (typeof dma['name'] !== 'undefined') {
            const name = dma['name'].toString();
            const topMarketClass = !this.isLandscape && 'landscape-view' || '';
            const start = this.isLandscape && 16 || 26;
            const end = this.isLandscape && 5 || 6;
            description += `<li><span class="steps"> ${(i + 1)}</span><span title='${name}'><span class="desc-topmarket ${topMarketClass}"> ${this.truncate.transform(name, 'middle', start, end)} </span><i class="percent top-percent-position" > ${this.format.convertToPercentageFormat(dma['pct'], 2)} %</i></span></li>`;
          }
        }
        description += '</ul>';
        if (!this.mobileView && this.layerType === 'primary') {
          description += '<button type="button" id="map-it-dma" type="button" mat-raised-button color="primary" ><i class="material-icons">map</i> <span>Map It</span></button>';
        }
        description += '</div>';
      } else {
        description += '<div class="under-review">Under Review</div>';
      }
      // here checking the unitdetails field because sometime unitdetails is not getting undefined.
      /* if (res.hasOwnProperty('unitDetails')) {
        const prop = res.unitDetails.properties;
        if (prop.total_market_population > 0) {
          description += '<div class="topzip">';
          description += '<ul>';
          const j = (res.dmaresults['topFour'].length > 4) ? 4 : res.dmaresults['topFour'].length;
          for (let i = 0; i < j; i++) {
            const dma = res.dmaresults['topFour'][i];
            if (typeof dma['name'] !== 'undefined') {
              const name = dma['name'].toString();
              description += `<li><span class="steps"> ${(i + 1)}</span><span title='${name}'> ${this.common.truncateString(name, 4, true)} <i class="percent"> ${this.convertToPercentage(dma['pct'])} %</i></span></li>`;
            }
          }
          description += '</ul>';
          if (!this.mobileView) {
            description += '<button type="button" id="map-it-dma" type="button" mat-raised-button color="primary"><i class="material-icons">map</i> <span>Map It</span></button>';
          }
          description += '</div>';
        } else {
          description += '<div class="under-review">Under Review</div>';
        }
      } else {
        description += '<div class="under-review">Under Review</div>';
      } */
    } else {
      description += comingSoon;
    }
    description += '</div>';
    /* topmarket details card end */
    return description;
  }

  getTopSegmentsHTML(segments) {
    let description = `
    <div class="opportunityOverview ${this.layerType}">
      <h5>Opportunity overview</h5>`;
    if (segments && segments.length > 0) {
      description += `<div>
        <ul>
          <li>
            <div class="score-header">Index</div>
          </li>
      `;
      segments.forEach(segment => {
        let indexValue = '';
        if (segment['index_comp_target'] && segment['index_comp_target'] !== null) {
          indexValue = this.convertToNumber(segment['index_comp_target']);
        } else {
          indexValue = 'N/A';
        }
        description += `
        <li>
          <span class="score" title="Opportunity Index">${indexValue}</span>
          <span class="score-text" title="${segment['segment']['name']}">
            ${this.truncate.transform(segment['segment']['name'], 'middle', 15, 15)}
          </span>
        </li>
        `;
      });
      description += `
        </ul>
      </div>`;
    } else {
      description += '<div class="under-review">Under Review</div>';
    }
    description += '</div>';
    return description;
  }

  getHourlyImpHTML(hourlyImps) {
    const content = this.dynamicComponentService
      .injectComponent(HourlyImpressionsComponent, x => {
        x.hourlyImpressions = hourlyImps;
        x.popupOption = this.isLandscape;
      });
    return content;
  }

  private replaceHTML(description: any, tag: string, type: string) {
    $(tag).replaceWith(description);
    this.loadMapItFunction(type);
    if (!$(tag)) {
      this.replaceHTML(description, tag, type);
    }
  }

  loadMapItFunction(type) {
    if (type === 'zip') {
      $('#map-it-zip').off().on('click',
        (e) => {
          this.openDetailMap('zip');
          return false;
        });
    } else if (type = 'dma') {
      $('#map-it-dma').off().on('click',
        (e) => {
          this.openDetailMap('dma');
          return false;
        });
    }
  }

  convertToPercentage(key, decimal = 0) {
    return this.format.convertToPercentageFormat(key, decimal);
  }

  convertToNumber(value, decimal = 0) {
    value = this.format.convertToDecimalFormat(value, decimal);
    return this.format.convertCurrencyFormat(value);
  }

  modifySearchResultMapFormat() {
  }

  openDetailMap(type) {
  }

  private isSecondaryMapInView(){
    return document.getElementById('mapbox') && document.getElementById('mapSecondary');
  }

  ngOnDestroy() {
    this.unSubscriber.next();
    this.unSubscriber.complete();
  }

}
