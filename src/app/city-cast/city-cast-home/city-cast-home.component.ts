import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { ThemeService, CommonService, AuthenticationService } from '@shared/services';
import { takeUntil, subscribeOn, map, concatMap, debounceTime, filter, finalize, catchError, switchMap } from 'rxjs/operators';
import { Subject, forkJoin, of, Observable } from 'rxjs';
import { CityCastApiService } from '../services/city-cast-api.service';
import {
    NetworkVolumeLayer,
    NetworkVolumeOdChoroplethLayer,
    Cast,
    MapBoxSourceType,
    CCSourceLayers,
    CCMapFeatureType,
    CCSidebarMenuType,
    CCCastStatuses,
    CCInputAssetTypes
} from '../classes';
import { LayerProperties } from '../interfaces';
import { KeyValue } from '@angular/common';
import { ConvertPipe } from '@shared/pipes/convert.pipe';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import isBefore from 'date-fns/isBefore';
import { Helper } from 'app/classes';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialog } from '../../Interfaces/workspaceV2';
import { MatDialog } from '@angular/material/dialog';
import turfCenter from '@turf/center';

@Component({
    selector: 'app-city-cast-home',
    templateUrl: './city-cast-home.component.html',
    styleUrls: ['./city-cast-home.component.less']
})
export class CityCastHomeComponent implements OnInit, OnDestroy, AfterViewChecked {
    map: mapboxgl.Map;
    mapPopup: any;
    mapCenter: any = [-98.5, 39.8];
    public themeSettings: any;
    public baseMaps: any;
    style: {};
    public defaultMapStyle: any;
    private unSubscribe: Subject<void> = new Subject<void>();
    public castObj: Cast = new Cast();
    dimensionsDetails: any;
    mapWidth: number;
    mapHeight: number;
    isOpenedSidenav = false;
    selectedMenu: any;
    hoveredStateId = null;
    selectedStateId = null;
    sidePanelType = null;
    sidePanelData = {
        source: '',
        feature: {},
        name: '',
        id: '',
        type: '',
        submap: '',
        data: {
            name: '',
            metadata: {}
        }
    };
    public mainmap: any = CCSidebarMenuType.EXPLORER;
    public submap: any = CCSidebarMenuType.TRACT_NETWORK;
    default_max_volume = 60000;
    color = '#9166AB';
    selectedScope;
    selectedCast;
    castIndexes: any;
    assets: any;
    castNetworkIndexes: any;
    castLinks: any;
    castTracts: any;
    castRoutes: any;
    overInterval = null;
    linkVolumeMax = 0;
    routeVolumeMax = 0;
    originalOrder = (
        a: KeyValue<number, string>,
        b: KeyValue<number, string>
    ): number => {
        return 0;
    };
    castBlockgroups: any;
    selectedSourceID: any;
    selectedSourceLayer: string;
    sidebar: any;
    sidebarMenuType = CCSidebarMenuType;
    mapOnFeatureCount: any;
    exploreRouteForm: FormGroup;
    scheduleList: FormGroup;
    scheduleControlKeys = [];
    castStatuses = CCCastStatuses;
    searchQuery = '';
    originalValue = {};
    dataChanged = false;
    ccModuleAccess = {};
    castMetrics = {};
    public unSavedChanges = [];
    public savedDeltas = [];
    changeOfData = {};
    sentComputeRequest = false;
    constructor(
        private themeService: ThemeService,
        private commonService: CommonService,
        private ccAPIservice: CityCastApiService,
        private convert: ConvertPipe,
        private fb: FormBuilder,
        private authService: AuthenticationService,
        private cdRef: ChangeDetectorRef,
        public dialog: MatDialog,
    ) { }

    ngOnInit() {
        this.exploreRouteForm = this.fb.group({
            id: '',
            featureType: '',
            featureId: ''
        });
        this.themeSettings = this.themeService.getThemeSettings();
        this.baseMaps = this.themeSettings.basemaps;
        this.themeService
            .getDimensions()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((data) => {
                this.dimensionsDetails = data;
                this.resizeLayout();
            });
        this.ccAPIservice
            .getGeoScope()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((scope) => {
                this.selectedScope = scope;
            });
        this.ccAPIservice
            .getScenario()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((scenarioData) => {
                this.isOpenedSidenav = false;
                this.castObj.setCast(scenarioData);
                this.castObj.parentCast = {};
                this.selectedCast = scenarioData;
                if (this.castObj.status !== CCCastStatuses.PUBLISHED && this.mainmap !== CCSidebarMenuType.EXPLORER) {
                    this.mainmap = CCSidebarMenuType.EXPLORER;
                    this.submap = CCSidebarMenuType.TRACT_NETWORK;
                }
                if (this.castObj.status === CCCastStatuses.DRAFT || this.castObj.status === CCCastStatuses.RUNNING) {
                    this.getCastSchemes();
                }
                if (this.castObj.status === CCCastStatuses.PUBLISHED) {
                    this.getCastMetrics();
                }
                if (this.selectedCast.parentScenarioId && this.selectedCast.parentScenarioId !== '') {
                    this.updateParentScenario(this.selectedCast.parentScenarioId);
                }
                if (this.map && this.map.isStyleLoaded()) {
                    this.map.setMinZoom(0);
                    this.loadMapLayers(this.selectedCast);
                }
            });
        this.buildMap();
        this.mapPopup = new mapboxgl.Popup({ closeOnClick: false });
        this.exploreRouteForm.valueChanges
            .pipe(
                debounceTime(500),
                takeUntil(this.unSubscribe)
            )
            .subscribe((data) => {
                if (this.exploreSchedules?.controls) {
                    this.scheduleControlKeys = Object.keys(
                        this.exploreSchedules.controls
                    );
                }
                    
                this.dataChanged = false;
                this.changeOfData = {};
                const fields = Object.keys(data['parameter']);
                for (const key of fields) {
                    this.changeOfData[key] = false;
                }
                if (Object.keys(this.originalValue).length > 0) {
                    for (const key of fields) {
                        if (key === 'schedules' && data['parameter'][key]) {
                            const schedules = Helper.deepClone(data['parameter'][key]);
                            if (this.originalValue['parameter'][key]) {
                                const filteredSchedules = Object.keys(schedules).filter((scheduleKey, index) => {
                                    if (this.originalValue['parameter'][key][scheduleKey]) {
                                        const changedValue = schedules[scheduleKey].filter((sData, zIndex) => {
                                            if (this.originalValue['parameter'][key][scheduleKey][zIndex] !== sData) {
                                                return true;
                                            } else {
                                                return false;
                                            }
                                        });
                                        if (changedValue.length > 0) {
                                            return true;
                                        }
                                        return false;
                                    }
                                    else {
                                        const changedValue = schedules[scheduleKey].filter((sData, zIndex) => sData !== '');
                                        if (changedValue.length > 0) {
                                            return true;
                                        }
                                        return false;
                                    }
                                    return true;
                                });
                                if (filteredSchedules.length > 0 || Object.keys(schedules).length != Object.keys(this.originalValue['parameter'][key]).length) {
                                    this.changeOfData[key] = true;
                                }
                            } else {
                                const filteredSchedules = Object.keys(schedules).filter((scheduleKey, index) => {
                                    const changedValue = schedules[scheduleKey].filter((sData, zIndex) => sData !== null && sData !== '');
                                    if (changedValue.length > 0) {
                                        return true;
                                    }
                                    return false;
                                });
                                if (filteredSchedules.length > 0) {
                                    this.changeOfData[key] = true;
                                }
                            }
                            if (!this.changeOfData[key]) {
                                this.changeOfData[key] = false;
                            }
                        } else if (
                            (key !== 'schedules' && key !== 'lastIndex')
                            && (
                                (this.originalValue['parameter'][key] && data['parameter'][key] !== this.originalValue['parameter'][key])
                                ||
                                (!this.originalValue['parameter'][key] && data['parameter'][key] !== null && data['parameter'][key] !== '')
                            )
                        ) {
                            this.changeOfData[key] = true;
                        }
                    }
                } else {
                    const fields = Object.keys(data['parameter']);
                    for (let key of fields) {
                        if (key === 'schedules') {
                            const filteredSchedules = data['parameter'][key].filter((schedule, index) => {
                                const changedValue = schedule.filter((sData, zIndex) => sData !== null && sData !== '');
                                if (changedValue.length > 0) {
                                    return true;
                                }
                                return false;
                            });
                            if (filteredSchedules.length > 0) {
                                this.changeOfData[key] = true;
                            }
                        } else if (data['parameter'][key] !== null && data['parameter'][key] !== '' && key !== 'lastIndex') {
                            this.changeOfData[key] = true;
                        }
                    }
                }
                this.dataChanged = Object.keys(this.changeOfData).filter((key) => this.changeOfData[key]).length > 0;
                this.saveUnsavedChanges();
            });
    }
    discardChanges(data = null) {
        if (data === null) {
            data = Helper.deepClone(this.originalValue);
        }
        if (Object.keys(data).length > 0) {
            if (this.exploreRouteForm.controls['featureType'].value === CCMapFeatureType.ROUTE) {
                delete data['parameter']['schedules'][Object.keys(data['parameter']['schedules']).pop()];
                const scheduleData = data?.parameter?.schedules || {};
                const dataKeys = Object.keys(data['parameter']['schedules']);
                const controlKeys = Object.keys(this.exploreSchedules.controls);
                if (!Helper.isArrayEqual(dataKeys, controlKeys)) {
                    Object.keys(this.scheduleList['controls']).forEach(key => {
                        this.scheduleList.removeControl(key);
                    });
                    dataKeys.push((data['parameter']['lastIndex']).toString());
                    dataKeys.forEach(controlKey => {
                        const formArray = this.addItem(3);
                        this.scheduleList.addControl(controlKey.toString(), formArray);
                        if (!scheduleData[controlKey]) {
                            data['parameter']['schedules'][controlKey.toString()] = ['', '', ''];
                        }
                    });
                    this.scheduleControlKeys = Object.keys(this.exploreSchedules.controls);
                }
            }
            this.exploreRouteForm.controls['parameter'].reset();
            this.exploreRouteForm.controls['parameter'].patchValue(data['parameter']);
            this.exploreRouteForm.controls['id'].patchValue(data['id']);
        } else {
            this.exploreRouteForm.controls['parameter'].reset();
        }
        this.dataChanged = false;
    }
    saveUnsavedChanges() {
        const formData = Helper.deepClone(this.exploreRouteForm.value);
        if (this.dataChanged) {
            const inx = this.unSavedChanges.findIndex(change => change['featureId'] === formData['featureId']);
            if (formData['featureType'] === CCMapFeatureType.ROUTE) {
                // tslint:disable-next-line:max-line-length
                delete formData['parameter']['schedules'][Object.keys(formData['parameter']['schedules']).pop()];
                if (formData?.parameter?.mode === this.originalValue['parameter']['mode']) {
                    delete formData['parameter']['mode'];
                }
            }
            Object.keys(formData['parameter']).forEach((value, index) => {
                if (!this.changeOfData[value] && value !== 'lastIndex') {
                    delete formData['parameter'][value];
                }
            });
            if (inx !== -1) {
                this.unSavedChanges.splice(inx, 1, formData);
            } else {

                this.unSavedChanges.push(formData);
            }
        } else {
            const inx = this.unSavedChanges.findIndex(change => change['featureId'] === formData['featureId']);
            if (inx !== -1) {
                this.unSavedChanges.splice(inx, 1);
            }
        }
    }
    get exploreSchedules(): FormGroup {
        return this.exploreRouteForm.get('parameter').get('schedules') as FormGroup;
    }
    private addItem(count, values = {}): FormArray {
        const formArray = this.fb.array([]);
        for (let i = 0; i < count; i++) {
            formArray.push(
                this.fb.control(values[i] || '')
            );
        }
        return formArray;
    }
    buildMap() {
        const style = this.getDefaultMapStyle();
        this.style = this.commonService.getMapStyle(this.baseMaps, style);
        this.initializeMap(this.style['uri']);
    }
    initializeMap(style) {
        mapboxgl.accessToken = environment.mapbox.access_token;
        this.map = new mapboxgl.Map({
            container: 'networkMap',
            style: 'mapbox://styles/mapbox/light-v9',
            minZoom: 2,
            maxZoom: 16,
            preserveDrawingBuffer: true,
            center: this.mapCenter, // starting position
            zoom: 3,
            transformRequest: (url, resourceType) => {
                if (
                    (resourceType === MapBoxSourceType.TILE || resourceType === MapBoxSourceType.SOURCE) &&
                    (this.castObj.routes_path && url.startsWith(this.castObj.routes_path)
                    )
                ) {
                    return {
                        url: url,
                        headers: {
                            Authorization:
                                'Bearer ' + localStorage.getItem('token')
                        }
                    };
                }
            }
        });
        this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
        this.map.on('load', () => {
            if (this.selectedCast) {
                this.loadMapLayers(this.selectedCast);
            }
        });
    }
    resizeLayout() {
        this.mapWidth = this.dimensionsDetails.windowWidth - 40;
        this.mapHeight =
            this.dimensionsDetails.windowHeight -
            this.dimensionsDetails.headerHeight;
        setTimeout(() => {
            this.map.resize({ mapResize: true });
        }, 200);
    }
    zoomOutMap() {
        this.map.fitBounds([
            [-128.94797746113613, 18.917477970597474],
            [-63.4, 50.0]
        ]);
    }
    getDefaultMapStyle() {
        this.baseMaps.filter((maps) => {
            if (maps.default) {
                this.defaultMapStyle = maps.label;
            }
        });
        return this.defaultMapStyle;
    }
    sideNavigation($event) {
        switch ($event.menuType) {
            case 'mainmap':
                this.isOpenedSidenav = false;
                this.mainmap = $event.type;
                if (this.mainmap === CCSidebarMenuType.EXPLORER) {
                    this.submap = CCSidebarMenuType.EXPLORER_COMMON_MAP;
                } else {
                    this.submap = CCSidebarMenuType.ROAD_NETWORK;
                }
                break;
            case 'submap':
                this.isOpenedSidenav = false;
                this.submap = $event.type;
                // this.zoomToLayer($event.type);
                break;
            case 'sidebar':
                this.sidePanelType = $event.type;
                this.isOpenedSidenav = true;
                break;
            default:
                break;
        }
        if ($event.menuType !== 'sidebar') {
            this.removeMapSelection();
            setTimeout(() => {
                this.loadModuleBasedOnCondition();
            }, 200);
        }
    }
    zoomToLayer(sidePanelType) {
        let zoomLevel = this.castObj['mapParameters']['zoomLevel'];
        switch (sidePanelType) {
            case CCSidebarMenuType.TRACT_NETWORK:
                zoomLevel = this.castObj['mapParameters']['zoomLevel'] + 1;
                break;
            case CCSidebarMenuType.BLOCKGROUP_NETWORK:
                zoomLevel = this.castObj['mapParameters']['zoomLevel'] + 2;
                break;
            case CCSidebarMenuType.TRANSIT_NETWORK:
                zoomLevel = this.castObj['mapParameters']['zoomLevel'] + 3;
                break;
            case CCSidebarMenuType.ROAD_NETWORK:
                zoomLevel = this.castObj['mapParameters']['zoomLevel'] + 3;
                break;
            default:
                break;
        }
        this.map.flyTo({
            center: this.castObj['mapParameters']['center'],
            essential: true,
            zoom: zoomLevel
        });
    }
    loadModuleBasedOnCondition() {
        if (this.mainmap === CCSidebarMenuType.NETWORK) {
            if (this.submap === CCSidebarMenuType.TRANSIT_NETWORK) {
                this.loadNetworkAnalysisTransitLayer();
            } else {
                this.loadNetworkAnalysisRoadLayer();
            }
        } else {
            this.clearLayers();
            switch (this.submap) {
                case CCSidebarMenuType.COUNTY_NETWORK:
                    this.loadCountyLayer(true);
                    break;
                case CCSidebarMenuType.TRACT_NETWORK:
                    this.loadTractsLayer(true);
                    break;
                case CCSidebarMenuType.BLOCKGROUP_NETWORK:
                    this.loadBlockgroupsLayer(true);
                    break;
                case CCSidebarMenuType.ROAD_NETWORK:
                    this.loadExplorerRoadLayer(true);
                    break;
                case CCSidebarMenuType.TRANSIT_NETWORK:
                    this.loadExplorerTrasitLayer(true);
                    break;
                default:
                    this.loadExplorerLayers();
                    break;
            }
        }
    }
    loadMapLayers(scenario) {
        this.removeMapSelection();
        this.clearLayers();
        if (this.map.getSource('castSource')) {
            this.map.removeSource('castSource');
        }
        try {
            this.map.flyTo({
                center: this.castObj['mapParameters']['center'],
                essential: true,
                zoom: this.castObj['mapParameters']['zoomLevel']
            });
        } catch (error) {
            if (error.message.includes('Invalid LngLat latitude value')) {
                this.map.flyTo({
                    center: [this.castObj['mapParameters']['center'][1], this.castObj['mapParameters']['center'][0]],
                    essential: true,
                    zoom: this.castObj['mapParameters']['zoomLevel']
                });
            }
        }
        this.map.once('moveend', () => {
            this.map.setMinZoom(this.castObj['mapParameters']['zoomLevel']);
            this.loadDataToMap();
        });
    }
    loadMapSource() {
        if (this.map.getSource('castSource')) {
            this.map.removeSource('castSource');
        }
        if (this.castObj.tiles_file_routes_paths.length > 0) {
            this.map.addSource('castSource', {
                type: 'vector',
                tiles: this.castObj.tiles_file_routes_paths,
                minzoom: this.castObj['mapParameters']['zoomLevel'],
                maxzoom: this.castObj['mapParameters']['zoomLevel'] + 5
            });
        }
    }
    loadDataToMap() {
        if (
            this.castObj['outputAssets'] &&
            this.castObj['outputAssets'].length > 0
        ) {
            this.loadMapSource();
            forkJoin([
                this.ccAPIservice.getDataFromS3URL(
                    this.castObj.explorer_index_file_routes_path
                ),
                this.ccAPIservice.getDataFromS3URL(
                    this.castObj.network_analyzer_lines_routes_path
                )
            ])
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((results) => {
                this.loadModuleBasedOnCondition();
                this.castIndexes = results[0];
                this.castNetworkIndexes = results[1];
                this.castLinks = this.castIndexes.filter(
                    (idx) => idx[2] === CCMapFeatureType.LINK
                );
                this.castTracts = this.castIndexes.filter(
                    (idx) => idx[2] === CCMapFeatureType.TRACT
                );
                this.castBlockgroups = this.castIndexes.filter(
                    (idx) => idx[2] === CCMapFeatureType.BLOCKGROUP
                );
                this.castRoutes = this.castIndexes.filter(
                    (idx) => idx[2] === CCMapFeatureType.ROUTE
                );
                const types = [
                    CCMapFeatureType.LINK,
                    CCMapFeatureType.ROUTE,
                    CCMapFeatureType.COUNTY,
                    CCMapFeatureType.BLOCKGROUP,
                    CCMapFeatureType.TRACT
                ];
                this.linkVolumeMax = 0;
                this.routeVolumeMax = 0;
                const explorerCasts = this.castIndexes.filter(
                    (idx) => types.indexOf(idx[2]) !== -1
                );
                for (let i = 0; i < explorerCasts.length; i++) {
                    if (types.indexOf(explorerCasts[i][2]) !== -1) {
                        let source_layer = '';
                        switch (explorerCasts[i][2]) {
                            case CCMapFeatureType.LINK:
                                source_layer = CCSourceLayers.LINK;
                                break;
                            case CCMapFeatureType.ROUTE:
                                source_layer = CCSourceLayers.ROUTE;
                                break;
                            case CCMapFeatureType.COUNTY:
                                source_layer = CCSourceLayers.COUNTY;
                                break;
                            case CCMapFeatureType.BLOCKGROUP:
                                source_layer = CCSourceLayers.BLOCKGROUP;
                                break;
                            case CCMapFeatureType.TRACT:
                                source_layer = CCSourceLayers.TRACT;
                                break;
                            default:
                                break;
                        }
                        const state = {};
                        state['id'] = explorerCasts[i][1];
                        state['name'] = explorerCasts[i][3];
                        state['type'] = explorerCasts[i][2];
                        const inx = this.castNetworkIndexes.find(
                            (idx) => idx['id'] === explorerCasts[i][1]
                        );
                        if (inx) {
                            state['networkID'] = inx['id'];
                            state['count'] = inx['count'];
                            if (
                                this.linkVolumeMax < inx['count'] &&
                                explorerCasts[i][2] === CCMapFeatureType.LINK
                            ) {
                                this.linkVolumeMax = inx['count'];
                            }
                            if (
                                this.routeVolumeMax < inx['count'] &&
                                explorerCasts[i][2] === CCMapFeatureType.ROUTE
                            ) {
                                this.routeVolumeMax = inx['count'];
                            }
                        }
                        this.map.setFeatureState(
                            {
                                source: 'castSource',
                                sourceLayer: source_layer,
                                id: explorerCasts[i][0]
                            },
                            state
                        );
                    }
                }
            });
        }
    }
    loadExplorerLayers() {
        this.clearLayers();
        this.loadCountyLayer();
        this.loadTractsLayer();
        this.loadBlockgroupsLayer();
        this.loadExplorerRoadLayer();
    }
    loadCountyLayer(outSideZoom = false) {
        const minzoom = this.castObj['mapParameters']['zoomLevel'];
        const maxzoom = outSideZoom ? 22 : this.castObj['mapParameters']['zoomLevel'] + 1;
        this.map.addLayer({
            id: 'countiesLayer',
            type: 'fill',
            source: 'castSource',
            'source-layer': CCSourceLayers.COUNTY,
            minzoom: minzoom,
            maxzoom: maxzoom,
            paint: {
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false],
                    0.75,
                    ['boolean', ['feature-state', 'hover'], false],
                    0.5,
                    0.25
                ],
                'fill-color': '#B95846'
            }
        });
        this.bindOverEffect(
            this.map,
            'countiesLayer',
            'castSource',
            CCSourceLayers.COUNTY,
            true,
            false,
            false
        );
        this.map.addLayer({
            id: 'countiesStrokeLayer',
            type: 'line',
            source: 'castSource',
            'source-layer': CCSourceLayers.COUNTY,
            minzoom: minzoom,
            maxzoom: maxzoom,
            paint: {
                'line-opacity': 1,
                'line-color': '#B95846',
                'line-width': 2
            }
        });
    }
    loadTractsLayer(outSideZoom = false) {
        const minzoom = outSideZoom ? this.castObj['mapParameters']['zoomLevel'] : this.castObj['mapParameters']['zoomLevel'] + 1;
        const maxzoom = outSideZoom ? 22 : this.castObj['mapParameters']['zoomLevel'] + 2;
        this.map.addLayer({
            id: 'tractsLayer',
            type: 'fill',
            source: 'castSource',
            'source-layer': CCSourceLayers.TRACT,
            minzoom: minzoom,
            maxzoom: maxzoom,
            paint: {
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false],
                    0.75,
                    ['boolean', ['feature-state', 'hover'], false],
                    0.5,
                    0.25
                ],
                'fill-color': '#28A597'
            }
        });
        this.bindOverEffect(
            this.map,
            'tractsLayer',
            'castSource',
            CCSourceLayers.TRACT
        );

        this.map.addLayer({
            id: 'tractsStrokeLayer',
            type: 'line',
            source: 'castSource',
            'source-layer': CCSourceLayers.TRACT,
            minzoom: minzoom,
            maxzoom: maxzoom,
            paint: {
                'line-opacity': 0.8,
                'line-color': '#28A597',
                'line-width': 2
            }
        });
    }
    loadBlockgroupsLayer(outSideZoom = false) {
        const minzoom = outSideZoom ? this.castObj['mapParameters']['zoomLevel'] : this.castObj['mapParameters']['zoomLevel'] + 2;
        const maxzoom = outSideZoom ? 22 : this.castObj['mapParameters']['zoomLevel'] + 3;
        this.map.addLayer({
            id: 'blockgroupsLayer',
            type: 'fill',
            source: 'castSource',
            'source-layer': CCSourceLayers.BLOCKGROUP,
            minzoom: minzoom,
            maxzoom: maxzoom,
            paint: {
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false],
                    0.8,
                    ['boolean', ['feature-state', 'hover'], false],
                    0.6,
                    0.3
                ],
                'fill-color': '#669824'
            }
        });
        this.bindOverEffect(
            this.map,
            'blockgroupsLayer',
            'castSource',
            CCSourceLayers.BLOCKGROUP,
            true,
            false,
            false
        );
        this.map.addLayer({
            id: 'blockgroupsStrokeLayer',
            type: 'line',
            source: 'castSource',
            'source-layer': CCSourceLayers.BLOCKGROUP,
            minzoom: minzoom,
            maxzoom: maxzoom,
            paint: {
                'line-opacity': 0.8,
                'line-color': '#669824',
                'line-width': 2
            }
        });
    }
    loadExplorerRoadLayer(outSideZoom = false) {
        if (this.map.getLayer('trasitLayer')) {
            this.map.removeLayer('trasitLayer');
        }
        if (this.map.getLayer('roadLayer')) {
            this.map.removeLayer('roadLayer');
        }
        const minzoom = outSideZoom ? this.castObj['mapParameters']['zoomLevel'] : this.castObj['mapParameters']['zoomLevel'] + 3;
        const maxzoom = 22;
        this.map.addLayer({
            id: 'roadLayer',
            type: 'line',
            source: 'castSource',
            'source-layer': CCSourceLayers.LINK,
            minzoom: minzoom,
            maxzoom: maxzoom,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false],
                    '#000000',
                    ['boolean', ['feature-state', 'hover'], false],
                    '#9166AB',
                    '#9166AB'
                ],
                'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false],
                    15,
                    ['boolean', ['feature-state', 'hover'], false],
                    10,
                    5
                ]
            }
        });
        this.bindOverEffect(
            this.map,
            'roadLayer',
            'castSource',
            CCSourceLayers.LINK,
            true,
            true,
            false
        );
    }
    loadExplorerTrasitLayer(outSideZoom = false) {
        if (this.map.getLayer('roadLayer')) {
            this.map.removeLayer('roadLayer');
        }
        if (this.map.getLayer('trasitLayer')) {
            this.map.removeLayer('trasitLayer');
        }
        const minzoom = outSideZoom ? this.castObj['mapParameters']['zoomLevel'] : this.castObj['mapParameters']['zoomLevel'] + 3;
        const maxzoom = 22;
        this.map.addLayer({
            id: 'trasitLayer',
            type: 'line',
            source: 'castSource',
            'source-layer': CCSourceLayers.ROUTE,
            minzoom: minzoom,
            maxzoom: maxzoom,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false],
                    '#000000',
                    ['boolean', ['feature-state', 'hover'], false],
                    '#3BAAAA',
                    '#3BAAAA'
                ],
                'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false],
                    15,
                    ['boolean', ['feature-state', 'hover'], false],
                    10,
                    5
                ]
            }
        });
        this.bindOverEffect(
            this.map,
            'trasitLayer',
            'castSource',
            CCSourceLayers.ROUTE,
            true,
            true,
            false
        );
    }
    loadNetworkAnalysisRoadLayer() {
        this.clearLayers();
        const params: LayerProperties = {
            layer_id: 'networkRoadLayer',
            source_id: 'castSource',
            source_layer: CCSourceLayers.LINK,
            zoom: [0, 22],
            color: '#9166AB',
            active_color: '#000000',
            is_using_data_joins: true,
            max: this.linkVolumeMax,
            indexes: this.castIndexes,
            networkIndexes: this.castNetworkIndexes
        };
        const networkVolumeLayer = new NetworkVolumeLayer();
        const networkLayer = networkVolumeLayer.get_network_sublayer(params);
        this.map.addLayer(networkLayer);
        this.bindOverEffect(
            this.map,
            'networkRoadLayer',
            'castSource',
            CCSourceLayers.LINK,
            true,
            true,
            true
        );
    }
    loadNetworkAnalysisTransitLayer() {
        this.clearLayers();
        const params: LayerProperties = {
            layer_id: 'networkTransitLayer',
            source_id: 'castSource',
            source_layer: CCSourceLayers.ROUTE,
            zoom: [0, 22],
            color: '#4EA7A7',
            active_color: '#000000',
            is_using_data_joins: true,
            max: this.routeVolumeMax,
            indexes: this.castIndexes,
            networkIndexes: this.castNetworkIndexes
        };
        const networkVolumeLayer = new NetworkVolumeLayer();
        const networkLayer = networkVolumeLayer.get_network_sublayer(params);
        this.map.addLayer(networkLayer);
        this.bindOverEffect(
            this.map,
            'networkTransitLayer',
            'castSource',
            CCSourceLayers.ROUTE,
            true,
            true,
            true
        );
    }
    bindOverEffect(
        mapObj,
        layerId,
        sourceId,
        sourceLayer = '',
        enableClick = true,
        has_popup = false,
        showVolume = false
    ) {
        mapObj.on('mousemove', layerId, (e) => {
            mapObj.getCanvas().style.cursor = 'pointer';
            const features = e.features;
            if (features.length > 0 && this.hoveredStateId !== features[0].id) {
                if (this.hoveredStateId !== null) {
                    mapObj.setFeatureState(
                        {
                            source: sourceId,
                            sourceLayer: sourceLayer,
                            id: this.hoveredStateId
                        },
                        { hover: false }
                    );
                }
                this.hoveredStateId = features[0].id;
                mapObj.setFeatureState(
                    {
                        source: sourceId,
                        sourceLayer: sourceLayer,
                        id: this.hoveredStateId
                    },
                    { hover: true }
                );
            }
            if (has_popup) {
                const feature = features[0];
                this.showPopup({
                    map: mapObj,
                    lng_lat: e.lngLat,
                    message: this.buildPopupMessage({
                        id: [undefined, null].includes(feature.state.id)
                            ? feature.properties.id
                            : feature.state.id,
                        name: [undefined, null].includes(feature.state.name)
                            ? feature.properties.name
                            : feature.state.name,
                        count: !showVolume
                            ? null
                            : [undefined, null].includes(feature.state.count)
                                ? feature.properties.count
                                : feature.state.count
                    })
                });
            }
        });

        // When the mouse leaves the state-fill layer, update the feature state of the
        // previously hovered feature.
        mapObj.on('mouseleave', layerId, () => {
            mapObj.getCanvas().style.cursor = '';
            if (this.hoveredStateId) {
                mapObj.setFeatureState(
                    {
                        source: sourceId,
                        sourceLayer: sourceLayer,
                        id: this.hoveredStateId
                    },
                    { hover: false }
                );
                this.hoveredStateId = null;
            }
            has_popup && this.mapPopup.remove();
        });
        if (enableClick) {
            mapObj.on('click', layerId, (e) => {
                if (e.features.length > 0 && !this.selectedStateId) {
                    const feature = e.features[0];
                    if (this.selectedStateId) {
                        mapObj.setFeatureState(
                            {
                                source: sourceId,
                                sourceLayer: sourceLayer,
                                id: this.selectedStateId
                            },
                            { selected: false }
                        );
                    }
                    this.selectedStateId = feature.id;
                    this.selectedSourceID = sourceId;
                    this.selectedSourceLayer = sourceLayer;
                    mapObj.setFeatureState(
                        {
                            source: sourceId,
                            sourceLayer: sourceLayer,
                            id: this.selectedStateId
                        },
                        { selected: true }
                    );
                    switch (feature['layer']['id']) {
                        case 'countiesLayer':
                            this.loadExplorerData(
                                feature['state'],
                                CCSidebarMenuType.COUNTY,
                                'County',
                                'castSource',
                                CCSourceLayers.COUNTY
                            );
                            break;
                        case 'blockgroupsLayer':
                            this.loadExplorerData(
                                feature['state'],
                                CCSidebarMenuType.BLOCKGROUP,
                                'Block Group',
                                'castSource',
                                CCSourceLayers.BLOCKGROUP
                            );
                            break;
                        case 'tractsLayer':
                            this.loadExplorerData(
                                feature['state'],
                                CCSidebarMenuType.TRACT,
                                'Tract',
                                'castSource',
                                CCSourceLayers.TRACT
                            );
                            break;
                        case 'roadLayer':
                            this.loadExplorerData(
                                feature['state'],
                                CCSidebarMenuType.LINK,
                                'Link',
                                'castSource',
                                CCSourceLayers.LINK
                            );
                            break;
                        case 'trasitLayer':
                            this.loadExplorerData(
                                feature['state'],
                                CCSidebarMenuType.ROUTE,
                                'Route',
                                'castSource',
                                CCSourceLayers.ROUTE
                            );
                            break;
                        case 'networkRoadLayer':
                            this.loadNetworkSubLayer(feature['state']);
                            break;
                        case 'networkTransitLayer':
                            this.loadNetworkSubLayer(feature['state']);
                            break;
                        default:
                            break;
                    }
                }
            });
        }
    }
    showPopup({ map, lng_lat, message }) {
        if (this.mapPopup) {
            this.mapPopup.setLngLat(lng_lat).setHTML(message).addTo(map);
        }
    }
    buildPopupMessage(popup_params) {
        const { id, name, count } = popup_params;
        let message = name
            ? `<p><strong>${name}</strong></p>`
            : `<p>ID <strong>${id}</strong></p>`;
        if (count) {
            const vol = this.convert.transform(count, 'THOUSAND');
            message += `<p>Volume <strong>${vol}</strong></p>`;
        }
        return message;
    }
    public loadExplorerData(
        feature,
        featureType,
        featureTitle,
        source,
        sourceLayer
    ) {
        if (feature['id'] !== '') {
            this.ccAPIservice
                .getDataFromS3URL(
                    this.castObj.select_explorer_summary_routes_path.replace(
                        '{id}',
                        feature['id']
                    )
                )
                .pipe(takeUntil(this.unSubscribe))
                .subscribe(
                    (castIndexData) => {
                        const data = {
                            source: '',
                            feature: {},
                            name: featureTitle,
                            type: featureType,
                            submap: '',
                            id: '',
                            data: {
                                name: '',
                                metadata: {}
                            }
                        };
                        data['source'] = source;
                        data['sourceLayer'] = sourceLayer;
                        data['feature'] = feature;
                        data['mainmap'] = 'explorer';
                        data['submap'] = this.submap;
                        // feature.type === CCMapFeatureType.ROUTE ? CCSidebarMenuType.TRANSIT_NETWORK : CCSidebarMenuType.ROAD_NETWORK;
                        data['id'] = castIndexData['id'];
                        data['data'] = castIndexData;
                        data['data']['name'] = feature['name'];
                        data['data']['metadata'] = castIndexData['metadata'];
                        if (feature.type === CCMapFeatureType.ROUTE) {
                            this.buildExplorerRouteForm(data);
                        } else {
                            this.buildExplorerForm(data);
                        }
                        this.sidePanelData = data;
                        this.sidePanelType = featureType;
                        this.isOpenedSidenav = true;
                    },
                    (error) => {
                        this.isOpenedSidenav = true;
                        const data = {
                            source: '',
                            feature: {},
                            name: featureTitle,
                            type: featureType,
                            submap: '',
                            id: '',
                            data: {
                                name: '',
                                metadata: {}
                            }
                        };
                        this.sidePanelData = data;
                        this.sidePanelType = featureType;
                    }
                );
        }
    }
    private loadNetworkSubLayer(state) {
        const summaryFileName = this.castObj.select_network_analyzer_summary_routes_path.replace(
            '{id}',
            state['id']
        );
        const linesFileName = this.castObj.select_network_analyzer_lines_routes_path.replace(
            '{id}',
            state['id']
        );
        const blockgroupsFileName = this.castObj.select_network_analyzer_blockgroups_routes_path.replace(
            '{id}',
            state['id']
        );
        if (this.map.getLayer('networkLineSubLayer')) {
            this.map.removeLayer('networkLineSubLayer');
        }
        if (this.map.getLayer('networkBlockGroupSubLayer')) {
            this.map.removeLayer('networkBlockGroupSubLayer');
        }
        if (this.map.getLayer('networkBlockGroupSubBorderLayer')) {
            this.map.removeLayer('networkBlockGroupSubBorderLayer');
        }
        const lineSubLayer = 'networkLineSubLayer';
        const blockGroupSubLayer = 'networkBlockGroupSubLayer';
        forkJoin([
            this.ccAPIservice.getDataFromS3URL(summaryFileName),
            this.ccAPIservice.getDataFromS3URL(linesFileName),
            this.ccAPIservice.getDataFromS3URL(blockgroupsFileName)
        ])
        .pipe(takeUntil(this.unSubscribe))
        .subscribe(
            (results) => {
                const lineIndexes = results[1];
                const blockgroups = results[2];
                if (this.map.getSource('castNetworkSource')) {
                    this.map.removeSource('castNetworkSource');
                }
                this.map.addSource('castNetworkSource', {
                    type: 'vector',
                    tiles: this.castObj.tiles_file_routes_paths,
                    minzoom: this.castObj['mapParameters']['zoomLevel'],
                    maxzoom: this.castObj['mapParameters']['zoomLevel'] + 5
                });
                let castVolumeMax = 0;
                lineIndexes.forEach((row) => {
                    let inx = [];
                    if (state.type === CCMapFeatureType.LINK) {
                        inx = this.castLinks.filter(
                            (idx) => idx[1] === row['id']
                        );
                    } else {
                        inx = this.castRoutes.filter(
                            (idx) => idx[1] === row['id']
                        );
                    }
                    if (castVolumeMax < row['count']) {
                        castVolumeMax = row['count'];
                    }
                    if (inx.length > 0) {
                        this.map.setFeatureState(
                            {
                                source: 'castNetworkSource',
                                sourceLayer:
                                    state.type === CCMapFeatureType.LINK
                                        ? CCSourceLayers.LINK
                                        : CCSourceLayers.ROUTE,
                                id: inx[0][0]
                            },
                            {
                                featureID: inx[0][0],
                                id: inx[0][1],
                                name: inx[0][3],
                                type: inx[0][2],
                                lineID: row['id'],
                                count: row['count'] || 0
                            }
                        );
                    }
                });
                blockgroups.forEach((row) => {
                    const inx = this.castBlockgroups.filter(
                        (idx) => idx[1] === row['id']
                    );
                    if (inx.length > 0) {
                        this.map.setFeatureState(
                            {
                                source: 'castNetworkSource',
                                sourceLayer: CCSourceLayers.BLOCKGROUP,
                                id: inx[0][0]
                            },
                            {
                                featureID: inx[0][0],
                                blockgroupID: row['id'],
                                o_norm: row['o_norm'],
                                d_norm: row['d_norm']
                            }
                        );
                    }
                });
                setTimeout(() => {
                    this.isOpenedSidenav = true;
                    const data = {
                        source: '',
                        feature: {},
                        name:
                            state.type === CCMapFeatureType.LINK
                                ? 'Link'
                                : 'Route',
                        type:
                            state.type === 'link'
                                ? CCSidebarMenuType.NETWORK_LINK
                                : CCSidebarMenuType.NETWORK_ROUTE,
                        id: '',
                        submap: '',
                        data: {
                            name: '',
                            metadata: {}
                        },
                        count: 0
                    };
                    data['source'] = 'castSource';
                    data['sourceLayer'] = state.type === CCMapFeatureType.LINK ? CCSourceLayers.LINK : CCSourceLayers.ROUTE;
                    data['feature'] = state;
                    data['mainmap'] = 'networkanalysis';
                    data['submap'] = state.type === CCMapFeatureType.LINK ? CCSidebarMenuType.ROAD_NETWORK : CCSidebarMenuType.TRANSIT_NETWORK;
                    data['id'] = results[0]['id'];
                    data['data'] = results[0];
                    data['data']['name'] = state['name'];
                    data['count'] = state['count'];
                    this.sidePanelData = data;
                    this.sidePanelType =
                        state.type === CCMapFeatureType.LINK
                            ? CCSidebarMenuType.NETWORK_LINK
                            : CCSidebarMenuType.NETWORK_ROUTE;
                    const networkLayerID = state.type === CCMapFeatureType.LINK ? 'networkRoadLayer' : 'networkTransitLayer';

                    if (this.map.getLayer(networkLayerID)) {
                        this.map.setLayoutProperty(
                            networkLayerID,
                            'visibility',
                            'none'
                        );
                    }

                    const params: LayerProperties = {
                        layer_id: blockGroupSubLayer,
                        source_id: 'castNetworkSource',
                        zoom: [0, 22],
                        active_color: '#000000',
                        max_line_width: 4,
                        is_using_data_joins: true
                    };
                    const networkVolumeLayer = new NetworkVolumeOdChoroplethLayer();
                    const blockGroupForRoadNetworkLayer = networkVolumeLayer.get_blockgroup_geo_sublayer(
                        params
                    );
                    this.map.addLayer(blockGroupForRoadNetworkLayer);
                    const blockGroupBorder: LayerProperties = {
                        layer_id: 'networkBlockGroupSubBorderLayer',
                        source_id: 'castNetworkSource',
                        zoom: [0, 22],
                        active_color: '#000000',
                        max_line_width: 4,
                        is_using_data_joins: true
                    };
                    const blockGroupBorderLayer = networkVolumeLayer.get_blockgroup_border_sublayer(
                        blockGroupBorder
                    );
                    this.map.addLayer(blockGroupBorderLayer);

                    const networkSubParams: LayerProperties = {
                        layer_id: lineSubLayer,
                        source_id: 'castNetworkSource',
                        source_layer: state.type === CCMapFeatureType.LINK ? CCSourceLayers.LINK : CCSourceLayers.ROUTE,
                        zoom: [0, 22],
                        active_color: '#000000',
                        max_line_width: 4,
                        max: castVolumeMax,
                        is_using_data_joins: true,
                        networkMode: 'road'
                    };
                    const networkSubLayer = networkVolumeLayer.get_network_sublayer(
                        networkSubParams
                    );
                    this.map.addLayer(networkSubLayer);
                    this.bindOverEffect(
                        this.map,
                        lineSubLayer,
                        'castNetworkSource',
                        CCMapFeatureType.LINK ? CCSourceLayers.LINK : CCSourceLayers.ROUTE,
                        false,
                        true,
                        true
                    );
                }, 500);
            },
            (error) => {
                this.isOpenedSidenav = true;
                const data = {
                    source: '',
                    feature: state,
                    name: state.type === CCMapFeatureType.LINK ? 'Link' : 'Route',
                    type: state.type === CCMapFeatureType.LINK ? CCSidebarMenuType.NETWORK_LINK : CCSidebarMenuType.NETWORK_ROUTE,
                    id: '',
                    submap: '',
                    data: {
                        name: '',
                        metadata: {}
                    },
                    count: 0
                };
                data['id'] = state['id'];
                data['source'] = 'castSource';
                data['sourceLayer'] = state.type === CCMapFeatureType.LINK ? CCSourceLayers.LINK : CCSourceLayers.ROUTE;
                data['feature'] = state;
                data['mainmap'] = 'networkanalysis';
                data['submap'] = state.type === CCMapFeatureType.LINK ? CCSidebarMenuType.ROAD_NETWORK : CCSidebarMenuType.TRANSIT_NETWORK;
                this.sidePanelData = data;
                this.sidePanelType = data['type'];
                this.ccAPIservice.getRequestForCompute(this.castObj.id, {
                    featureId: state['id'],
                    featureType: state['type']
                })
                .pipe(takeUntil(this.unSubscribe))
                .subscribe((data) => {
                    this.sentComputeRequest = true;
                }, (error) => {
                    this.sentComputeRequest = false;
                });
                if (state.type === CCMapFeatureType.LINK) {
                    this.loadNetworkAnalysisRoadLayer();
                } else {
                    this.loadNetworkAnalysisTransitLayer();
                }
            }
        );
    }
    public openDataFromMapFeature(feature) {
        if (this.mainmap === CCSidebarMenuType.EXPLORER) {
            const params = {
                feature_id: feature[0],
                id: feature[1],
                name: feature[3],
                type: feature[2]
            };
            this.removeMapSelection(false);
            this.selectedStateId = feature[0];
            this.selectedSourceLayer = '';
            this.selectedSourceID = 'castSource';
            switch (feature[2]) {
                case CCMapFeatureType.COUNTY:
                    this.loadExplorerData(
                        params,
                        CCSidebarMenuType.COUNTY,
                        'County',
                        'castSource',
                        CCSourceLayers.COUNTY
                    );
                    this.selectedSourceLayer = CCSourceLayers.COUNTY;
                    break;
                case CCMapFeatureType.BLOCKGROUP:
                    this.loadExplorerData(
                        params,
                        CCSidebarMenuType.BLOCKGROUP,
                        'Block Group',
                        'castSource',
                        CCSourceLayers.BLOCKGROUP
                    );
                    this.selectedSourceLayer = CCSourceLayers.BLOCKGROUP;
                    break;
                case CCMapFeatureType.TRACT:
                    this.submap = CCSidebarMenuType.TRACT_NETWORK;
                    this.loadModuleBasedOnCondition();
                    this.loadExplorerData(
                        params,
                        CCSidebarMenuType.TRACT,
                        'Tract',
                        'castSource',
                        CCSourceLayers.TRACT
                    );
                    this.selectedSourceLayer = CCSourceLayers.TRACT;
                    break;
                case CCMapFeatureType.LINK:
                    this.submap = CCSidebarMenuType.ROAD_NETWORK;
                    this.loadModuleBasedOnCondition();
                    // this.loadExplorerRoadLayer();
                    this.loadExplorerData(
                        params,
                        CCSidebarMenuType.LINK,
                        'Link',
                        'castSource',
                        CCSourceLayers.LINK
                    );
                    this.selectedSourceLayer = CCSourceLayers.LINK;
                    // this.loadExplorerRoadLayer();
                    break;
                case CCMapFeatureType.ROUTE:
                    this.submap = CCSidebarMenuType.TRANSIT_NETWORK;
                    this.loadModuleBasedOnCondition();
                    this.loadExplorerData(
                        params,
                        CCSidebarMenuType.ROUTE,
                        'Route',
                        'castSource',
                        CCSourceLayers.ROUTE
                    );
                    this.selectedSourceLayer = CCSourceLayers.ROUTE;
                    break;
                default:
                    break;
            }
        } else {
            const params = {
                feature_id: feature[0],
                id: feature[1],
                name: feature[3],
                type: feature[2]
            };
            this.removeMapSelection();
            this.selectedStateId = feature[0];
            this.selectedSourceLayer =
                feature[2] === CCMapFeatureType.LINK
                    ? CCSourceLayers.LINK
                    : CCSourceLayers.ROUTE;
            this.selectedSourceID = 'castSource';
            this.loadNetworkSubLayer(params);
        }
        this.map.setFeatureState(
            {
                source: this.selectedSourceID,
                sourceLayer: this.selectedSourceLayer,
                id: this.selectedStateId
            },
            { selected: true }
        );
        const castFeature = this.zoomToCastFeature(feature);
        if (!castFeature?.geometry) {
            this.map.flyTo({
                center: this.castObj['mapParameters']['center'],
                essential: true,
                zoom: 10
            });
            setTimeout(() => {
                const f = this.zoomToCastFeature(feature);
            }, 500);
        }
    }
    zoomToCastFeature(feature) {
        const features = this.map.querySourceFeatures('castSource', {
            sourceLayer: this.selectedSourceLayer,
            filter: ['==', '$id', feature[0]]
        });
        const castFeature = features.find((data) => data['id'] === feature[0]);
        if (castFeature?.geometry) {
            const centerCoordinates = turfCenter(castFeature.geometry);
            this.map.flyTo({
                center: centerCoordinates['geometry']['coordinates'],
                zoom: 12
            });
        }
        return castFeature;
    }
    clearLayers() {
        if (this.map.getLayer('roadLayer')) {
            this.map.removeLayer('roadLayer');
        }
        if (this.map.getLayer('trasitLayer')) {
            this.map.removeLayer('trasitLayer');
        }
        if (this.map.getLayer('countiesLayer')) {
            this.map.removeLayer('countiesLayer');
        }
        if (this.map.getLayer('countiesStrokeLayer')) {
            this.map.removeLayer('countiesStrokeLayer');
        }
        if (this.map.getLayer('tractsLayer')) {
            this.map.removeLayer('tractsLayer');
        }
        if (this.map.getLayer('tractsStrokeLayer')) {
            this.map.removeLayer('tractsStrokeLayer');
        }
        if (this.map.getLayer('blockgroupsLayer')) {
            this.map.removeLayer('blockgroupsLayer');
        }
        if (this.map.getLayer('blockgroupsStrokeLayer')) {
            this.map.removeLayer('blockgroupsStrokeLayer');
        }
        if (this.map.getLayer('networkRoadLayer')) {
            this.map.removeLayer('networkRoadLayer');
        }
        if (this.map.getLayer('networkTransitLayer')) {
            this.map.removeLayer('networkTransitLayer');
        }
        if (this.map.getLayer('networkLineSubLayer')) {
            this.map.removeLayer('networkLineSubLayer');
        }
        if (this.map.getLayer('networkBlockGroupSubLayer')) {
            this.map.removeLayer('networkBlockGroupSubLayer');
        }
        if (this.map.getLayer('networkBlockGroupSubBorderLayer')) {
            this.map.removeLayer('networkBlockGroupSubBorderLayer');
        }
    }
    closeSidePanel() {
        this.isOpenedSidenav = false;
    }
    removeMapSelection(closeSidePanel = true) {
        if (
            this.selectedStateId &&
            this.selectedSourceID &&
            this.selectedSourceLayer &&
            this.map.getSource(this.selectedSourceID)
        ) {
            if (closeSidePanel) {
                this.isOpenedSidenav = false;
            }
            this.map.setFeatureState(
                {
                    source: this.selectedSourceID,
                    sourceLayer: this.selectedSourceLayer,
                    id: this.selectedStateId
                },
                { selected: false }
            );
            this.selectedStateId = null;
            this.selectedSourceID = null;
            this.selectedSourceLayer = null;
            if (this.sidePanelData && this.sidePanelData['source']) {
                if (this.sidePanelData['mainmap'] === 'networkanalysis') {
                    const networkLayer = `${this.sidePanelData['submap'] === CCSidebarMenuType.ROAD_NETWORK ? 'networkRoad' : 'networkTransit'}Layer`;
                    if (this.map.getLayer('networkLineSubLayer')) {
                        this.map.removeLayer('networkLineSubLayer');
                    }
                    if (this.map.getLayer('networkBlockGroupSubLayer')) {
                        this.map.removeLayer('networkBlockGroupSubLayer');
                    }
                    if (this.map.getLayer('networkBlockGroupSubBorderLayer')) {
                        this.map.removeLayer('networkBlockGroupSubBorderLayer');
                    }
                    if (this.map.getLayer(networkLayer)) {
                        this.map.setLayoutProperty(
                            networkLayer,
                            'visibility',
                            'visible'
                        );
                    } else {
                        if (this.sidePanelData['submap'] === CCSidebarMenuType.ROAD_NETWORK) {
                            this.loadNetworkAnalysisRoadLayer();
                        } else if (this.sidePanelData['submap'] === CCSidebarMenuType.TRANSIT_NETWORK) {
                            this.loadNetworkAnalysisTransitLayer();
                        }
                    }
                }
                this.sidePanelData = {
                    source: '',
                    feature: {},
                    name: '',
                    id: '',
                    type: '',
                    submap: '',
                    data: {
                        name: '',
                        metadata: {}
                    },
                };
            }
        }
    }
    trackByValue(index: number, row: any): string {
        return row.view_value;
    }
    trackByFeature(index: number, row: any): string {
        return row['feature_id'];
    }
    trackByControlId(index: number, row: any): string {
        return row['key'];
    }
    saveData(value, type = 'save') {
        const savedData = this.savedDeltas || [];
        const savedValue = savedData.find(edit => edit.featureId === value['featureId']) || {};
        const unSavedChanges = Helper.deepClone(this.unSavedChanges || []);
        const valueInUnsaved = unSavedChanges.find(edit => edit.featureId === value['featureId']) || {};
        if (valueInUnsaved?.parameter) {
            const savedParams = Helper.deepClone(savedValue?.parameter ?? {});
            const unsavedParams = Helper.deepClone(valueInUnsaved?.parameter ?? {});
            value['parameter'] = Object.assign(savedParams, unsavedParams);
        }
        let inx = -1;
        let formattedData = this.formatAssetDelta(value, 'update', value.featureType);
        if (value.id !== '') {
            const editedData = this.savedDeltas || [];
            inx = editedData.findIndex(data => data.id === value.id);
            formattedData = { ...editedData[inx], ...formattedData };
        }
        let scheme_assets_id = '';
        let assetType = '';
        switch (value.featureType) {
            case 'tract':
                assetType = CCInputAssetTypes.POPULATION;
                break;
            case 'link':
                assetType = CCInputAssetTypes.STREET;
                break;
            case 'route':
                assetType = CCInputAssetTypes.TRANSIT;
                break;
            default:
                break;
        }
        const asset = this.castObj.inputAssets.find(data => data.assetType === assetType);
        if (asset) {
            scheme_assets_id = asset['asset']['id'];
            this.ccAPIservice.addOrUpdateAssetDelta(
                scheme_assets_id,
                formattedData,
                formattedData['id']
            )
                .pipe(takeUntil(this.unSubscribe))
                .subscribe((result) => {
                    if (inx !== -1) {
                        this.savedDeltas.splice(inx, 1, result.data);
                    } else {
                        this.savedDeltas.push(result.data);
                        this.exploreRouteForm.patchValue({
                            id: result.data['id']
                        });
                    }
                    const unsavedinx = this.unSavedChanges.findIndex(data => data.featureId === value.featureId);
                    if (unsavedinx !== -1) {
                        this.unSavedChanges.splice(unsavedinx, 1);
                        this.unSavedChanges = this.unSavedChanges.slice();
                    }
                    const castData = Helper.deepClone(result.data);
                    const castFeature = Helper.deepClone(this.sidePanelData?.feature);
                    if (castFeature?.id === castData['featureId']
                        && castFeature?.type === castData['featureType']
                    ) {
                        this.dataChanged = false;
                        if (castData['featureType'] === CCMapFeatureType.ROUTE) {
                            const savedParams = Helper.deepClone(castData['parameter']);
                            const unsavedParams = this.originalValue['parameter'];
                            castData['parameter'] = Object.assign(unsavedParams, savedParams);
                            if (castData?.parameter?.schedules) {
                                castData['parameter']['schedules'][castData['parameter']['lastIndex']] = ['','',''];
                            }
                        }
                        this.originalValue = castData;
                    }
                });
        }
    }
    formatAssetDelta(data, actionType = 'create', title = '') {
        const basicData = {
            'title': title,
            'deltaFunction': actionType,
            'assetUriFragment': '#',
        };
        let mergeData = { ...basicData, ...data };
        return mergeData;
    }
    deleteSchedule(inx) {
        this.scheduleList.removeControl(inx);
    }
    private buildExplorerForm(data) {
        const parameterGroup = this.fb.group({});
        const editedData = this.savedDeltas || [];
        const unSavedChanges = Helper.deepClone(this.unSavedChanges || []);
        const savedValue = editedData.find(edit => edit.featureId === data['feature']['id']) || {};
        const valueInUnsaved = unSavedChanges.find(edit => edit.featureId === data['feature']['id']);
        this.originalValue = Helper.deepClone(savedValue);
        const value = Helper.deepClone(savedValue);
        if (valueInUnsaved?.parameter) {
            const savedParams = Helper.deepClone(savedValue?.parameter ?? {});
            const unsavedParams = Helper.deepClone(valueInUnsaved?.parameter ?? {});
            value['parameter'] = Object.assign(savedParams, unsavedParams);
        }
        this.exploreRouteForm.removeControl('parameter');
        if (data['data'] && data['data']['metadata']) {
            const fieldKeys = Object.keys(data['data']['metadata']);
            fieldKeys.map(key => {
                parameterGroup.addControl(key, this.fb.control(value && value['parameter'] && value['parameter'][key] || ''));
            });
        }
        this.exploreRouteForm.addControl('parameter', parameterGroup);
        this.exploreRouteForm.patchValue({
            id: value['id'] || '',
            featureId: data['feature']['id'],
            featureType: data['feature']['type']
        });
    }
    private buildExplorerRouteForm(data) {
        this.exploreRouteForm.removeControl('parameter');
        const editedData = Helper.deepClone(this.savedDeltas || []);
        const unSavedChanges = Helper.deepClone(this.unSavedChanges || []);
        const savedValue = editedData.find(edit => edit.featureId === data['feature']['id']) || {};
        const valueInUnsaved = unSavedChanges.find(edit => edit.featureId === data['feature']['id']);
        this.originalValue = Helper.deepClone(savedValue);
        const value = Helper.deepClone(savedValue);
        if (valueInUnsaved?.parameter) {
            const savedParams = Helper.deepClone(savedValue?.parameter ?? {});
            const unsavedParams = Helper.deepClone(valueInUnsaved?.parameter ?? {});
            value['parameter'] = Object.assign(savedParams, unsavedParams);
        }
        this.exploreRouteForm.addControl(
            'parameter',
            this.fb.group({
                mode:
                    value?.parameter?.mode ||
                    data['data']['metadata']['mode']['raw_value'],
                schedules: this.fb.group({}),
                lastIndex: '0'
            })
        );
        this.scheduleList = this.exploreRouteForm.get('parameter').get('schedules') as FormGroup;
        Object.keys(this.scheduleList['controls']).forEach((key) => {
            this.scheduleList.removeControl(key);
        });
        this.exploreRouteForm.patchValue({
            id: value['id'] || '',
            featureId: data['feature']['id'],
            featureType: data['feature']['type']
        });
        const scheduleData = value?.parameter?.schedules || {};
        const savedScheduleData = savedValue?.parameter?.schedules || {};
        let controlKeys = [];
        if (value?.parameter) {
            controlKeys = (value.parameter?.schedules && Object.keys(value.parameter?.schedules)) ?? ['0'];
        } else {
            controlKeys = Object.keys(
                data['data']['metadata']['schedule']['rows']
            );
        }
        const lastIndex = value?.parameter?.lastIndex || 
            (controlKeys.length <= 0
                ? 0
                : Number(controlKeys[controlKeys.length - 1]) + 1);
        controlKeys.push(lastIndex.toString());
        this.exploreRouteForm.controls['parameter']['controls']['lastIndex'].setValue(lastIndex.toString());
        this.originalValue = {
            parameter: {
                mode:
                    savedValue?.parameter?.mode ??
                    data['data']['metadata']['mode']['raw_value'],
                schedules: savedScheduleData,
                lastIndex: lastIndex
            }
        };
        if (Object.keys(savedValue).length <= 0) {
            Object.keys(data['data']['metadata']['schedule']['rows']).forEach((key) => {
                if (!savedScheduleData[key.toString()]) {
                        this.originalValue['parameter']['schedules'][
                            key.toString()
                        ] = ['', '', ''];
                }
            });
        }
        /* else {
            this.originalValue['parameter']['mode'] =
                savedValue?.parameter?.mode ??
                data['data']['metadata']['mode']['raw_value'];
            this.originalValue['parameter']['lastIndex'] = lastIndex;
        } */

        const fromGroups = {};
        controlKeys.forEach((controlKey) => {
            const formArray = this.addItem(
                data['data']['metadata']['schedule']['columns'].length,
                scheduleData[controlKey] || []
            );
            this.scheduleList.addControl(controlKey.toString(), formArray);
            if (!savedScheduleData[controlKey]) {
                this.originalValue['parameter']['schedules'][controlKey.toString()] = ['', '', ''];
            }
        });
        this.scheduleControlKeys = Object.keys(this.exploreSchedules.controls);
    }
    getCastMetrics() {
        this.ccAPIservice.getScenarioOutputAsset(this.castObj.id, 'metrics')
            .pipe(
                filter((response) => response && response['data'].length > 0),
                map((response) => {
                    const data = {};
                    const metricAsset = response['data'][0];
                    if (metricAsset) {
                        data['basePath'] = metricAsset['asset']['basePath'];
                        data['files'] = metricAsset['asset']['files'];
                    }
                    return data;
                },
                takeUntil(this.unSubscribe)
                )).subscribe(asset => this.castMetrics = asset);
    }
    getCastSchemes() {
        this.ccAPIservice.getScenarioInputAsset(this.castObj.id)
            .pipe(
                filter((response) => response && response['data'].length > 0),
                map((response) => response['data']),
                takeUntil(this.unSubscribe)
            )
            .subscribe(assets => {
                this.castObj.scheme_assets_id = assets[0]['asset']['id'];
                const deltas = [];
                const assetTypes = [CCInputAssetTypes.POPULATION,
                CCInputAssetTypes.STREET,
                CCInputAssetTypes.TRANSIT];
                assets.forEach(asset => {
                    if (assetTypes.includes(asset['assetType'])) {
                        deltas.push(...asset['asset']['deltas']);
                    }
                });
                this.savedDeltas = deltas.sort((a, b) => isBefore(new Date(a.createdAt), new Date(b.createdAt)) ? -1 : 1);
                this.unSavedChanges = [];
            });
    }
    onDataChanged(val, inx) {
        const lastIndex = Object.keys(this.exploreSchedules.controls).pop();
        if (val !== '' &&
            this.castObj.status === CCCastStatuses.DRAFT &&
            lastIndex == inx) {
            const formArray = this.addItem(3);
            this.scheduleList.addControl((Number(lastIndex) + 1).toString(), formArray);
            this.exploreRouteForm.controls['parameter']['controls']['lastIndex'].setValue((Number(lastIndex) + 1).toString());
        }
    }
    pushSearchQuery(value) {
        this.searchQuery = value;
    }
    runDraftScenarioChanges() {
        if (this.unSavedChanges.length > 0) {
            const data: ConfirmationDialog = {
                notifyMessage: true,
                confirmTitle: 'Success',
                messageText: '<h4 style = "text-align: center;" class="confirm-text-icon">Save or discard your unsaved Cast Scheme changes before running.</h4>',
            };
            this.dialog.open(ConfirmationDialogComponent, {
                disableClose: true,
                data: data,
                width: '450px',
            }).afterClosed()
                .pipe(takeUntil(this.unSubscribe))
                .subscribe(response => {
                    this.isOpenedSidenav = true;
                    this.sidePanelType = CCSidebarMenuType.SCHEME;
                });
        } else {
            this.ccAPIservice
                .runDraftScenarioChanges(this.castObj.id)
                .pipe(
                    map(response => response && response.data || {}),
                    takeUntil(this.unSubscribe)
                )
                .subscribe(scenario => {
                    localStorage.setItem('scenarioId', scenario.id);
                    this.castObj.setCast(scenario);
                    this.selectedCast = scenario;
                    this.unSavedChanges = [];
                    const inputAssets = scenario['inputAssets'];
                    this.castObj.scheme_assets_id = inputAssets[0]['asset']['id'];
                    const deltas = [];
                    const assetTypes = [CCInputAssetTypes.POPULATION,
                    CCInputAssetTypes.STREET,
                    CCInputAssetTypes.TRANSIT];
                    inputAssets.forEach(asset => {
                        if (assetTypes.includes(asset['assetType'])) {
                            deltas.push(...asset['asset']['deltas']);
                        }
                    });
                    this.savedDeltas = deltas.sort((a, b) => isBefore(new Date(a.createdAt), new Date(b.createdAt)) ? -1 : 1);
                    this.isOpenedSidenav = false;
                });
        }

    }
    updateParentScenario(scenarioID) {
        this.ccAPIservice
            .getTFScenario(scenarioID)
            .pipe(
                map(response => response.data),
                takeUntil(this.unSubscribe)
            )
            .subscribe((scenario) => {
                this.castObj.parentCast = scenario;
            });
    }

    /** Scheme action (navigate, delete and save )  **/
    onSchemeAction(value) {
        switch (value['action']) {
            case 'navigate':
                const feature = this.castIndexes.find(ind => ind[1] === value['data']['featureId'] && ind[2] === value['data']['featureType']);
                this.openDataFromMapFeature(feature);
                break;
            case 'delete':
                if (value['type'] === 'saved') {
                    this.deleteScheduleChanges(value['data']);
                } else if (value['type'] === 'unsaved') {
                    this.deleteUnsavedChanges(value['data']);
                }
                break;
            case 'save':
                this.saveData(value['data'], value['type']);
                break;
            default:
                break;
        }
    }
    deleteUnsavedChanges(data) {
        const formData = Helper.deepClone(this.exploreRouteForm.value);
        const editedData = this.unSavedChanges || [];
        const idx = editedData.findIndex(ind => ind['featureId'] === data['featureId'] && ind['featureType'] === data['featureType']);
        const removeData = editedData.splice(idx, 1);
        this.unSavedChanges = editedData;
        if (formData?.featureId === data?.featureId) {
            this.discardChanges();
        }
    }
    deleteScheduleChanges(data) {
        const formData = Helper.deepClone(this.exploreRouteForm.value);
        const editedData = this.savedDeltas || [];
        const idx = editedData.findIndex(ind => ind['featureId'] === data['featureId'] && ind['featureType'] === data['featureType']);
        const removeData = editedData.splice(idx, 1);
        let scheme_assets_id = '';
        let assetType = '';
        switch (data.featureType) {
            case 'tract':
                assetType = CCInputAssetTypes.POPULATION;
                break;
            case 'link':
                assetType = CCInputAssetTypes.STREET;
                break;
            case 'route':
                assetType = CCInputAssetTypes.TRANSIT;
                break;
            default:
                break;
        }
        const asset = this.castObj.inputAssets.find(data => data.assetType === assetType);
        if (asset) {
            scheme_assets_id = asset['asset']['id'];
            this.ccAPIservice.deleteAssetDelta(
                scheme_assets_id,
                removeData[0]['id']
            )
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((result) => {
                this.savedDeltas = editedData;
                if (formData?.featureId === data?.featureId) {
                    const editedData = Helper.deepClone(this.unSavedChanges || []);
                    const unsaved = editedData.find(ind => ind['featureId'] === data['featureId'] && ind['featureType'] === data['featureType']);
                    if (data['featureType'] === CCMapFeatureType.ROUTE) {
                        this.ccAPIservice
                            .getDataFromS3URL(
                                this.castObj.select_explorer_summary_routes_path.replace(
                                    '{id}',
                                    data?.featureId
                                )
                            )
                            .pipe(takeUntil(this.unSubscribe))
                            .subscribe((data) => {
                                if (unsaved) {
                                    unsaved['id'] = '';
                                    unsaved['parameter']['mode'] = data?.metadata?.mode?.raw_value ?? '';
                                }
                                this.discardChanges(unsaved ?? null);
                            });
                    } else {
                        if (unsaved) {
                            unsaved['id'] = '';
                        }
                        this.originalValue = {};
                        this.discardChanges(unsaved ?? null);
                    }
                }
            });
        }
        return true;
    }
    /** Scheme action end **/
    sendRequestForCompute(scenarioId, feature) {
        this.ccAPIservice.sendRequestForCompute(scenarioId, {
            featureId: feature['id'],
            featureType: feature['type']
        }).pipe(
            takeUntil(this.unSubscribe),
            switchMap((res) => this.getInformationPopupState(res))
        )
            .subscribe((data) => {
                this.sentComputeRequest = true;
            });
    }
    getInformationPopupState(data): Observable<any> {
        const dialogData: ConfirmationDialog = {
            notifyMessage: true,
            confirmTitle: 'Success',
            messageText: '<h4 style = "text-align: center;" class="confirm-text-icon">Your compute request has been sent. Support will be in touch.</h4>',
        };
        return this.dialog.open(ConfirmationDialogComponent, {
            disableClose: true,
            data: dialogData,
            width: '450px',
        }).afterClosed()
            .pipe(
                takeUntil(this.unSubscribe),
                map(res => res?.action)
            );
    }
    ngAfterViewChecked() {
        this.cdRef.detectChanges();
    }
    ngOnDestroy(): void {
        this.unSubscribe.next();
        this.unSubscribe.complete();
    }
}
