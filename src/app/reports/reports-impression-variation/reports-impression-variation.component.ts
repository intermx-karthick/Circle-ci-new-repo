import {
    Component,
    OnInit,
    ViewChild,
    EventEmitter,
    AfterViewInit
} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { ThemeService, CommonService } from '@shared/services';
import { ReportsAPIService } from '../services/reports-api.service';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import generate_color from 'color';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw';
import { DrawRectangle } from '../../classes/rectangle-mode';
import { FreeHandDrawMode } from '../../classes/free-hand-draw-mode';
import bbox from '@turf/bbox';
import intersect from '@turf/intersect';

import { genWebColor } from 'generate-color';

import {
    Options,
    LabelType,
    CustomStepDefinition,
    ChangeContext,
    PointerType
} from '@angular-slider/ngx-slider';
import { InventoryService } from '@shared/services/inventory.service';
import { forkJoin } from 'rxjs';
import { MapboxFactory, MapboxFactoryEnum } from '../../classes/mapbox-factory';
import {Helper} from '../../classes';

@Component({
    selector: 'app-reports-impression-variation',
    templateUrl: './reports-impression-variation.component.html',
    styleUrls: ['./reports-impression-variation.component.less']
})
export class ReportsImpressionVariationComponent
    implements OnInit, AfterViewInit {
    map: mapboxgl.Map;
    mapCenter: any = [-98.5, 39.8];
    public themeSettings: any;
    public baseMaps: any;
    style: {};
    defaultMapStyle: any;
    mapLayers: any = {};
    hoveredStateId: any;
    impData: any;
    cbsa = new FormControl();
    construction_type = new FormControl();
    media_type = new FormControl();
    months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];
    columns = [];
    subHeaderColumns = [];
    topHeaderColumns = [];
    topHeaderDisplayColumns = [];
    subHeaderDisplayColumns = [];
    displayedColumns = [];
    dataSource = new MatTableDataSource([]);
    mapWidth: number;
    mapHeight: number;
    public manualRefresh: EventEmitter<void> = new EventEmitter<void>();

    @ViewChild(MatSort, { static: false }) sort: MatSort;
    dimensionsDetails: any;
    hourlyImpressionLineData = [];

    chartLineConfig = {
        width: 590,
        height: 270,
        tooltip: '<div>##NAME## Average:<br>##VALUE##% of Activities</div>',
        xAxis: true,
        yAxis: true,
        margin: { top: 30, right: 20, bottom: 0, left: 25 },
        xAxisLabels: []
    };
    colorData = [
        'eb882d',
        '785232',
        '3a6f41',
        '9c429c',
        'b52e2b',
        '59a42a',
        '254097'
    ];
    mapLegends = [];
    cbsaColumns = {};
    mapMinVal: number;
    mapMaxVal: number;
    mapPopup: any;

    dateRange: Date[] = this.createDateRange();
    minValue: number = this.dateRange[20].getTime();
    maxValue: number = this.dateRange[25].getTime();
    minValueLabel;
    maxValueLabel;
    options: Options = {
        showTicks: false,
        showTicksValues: false,
        stepsArray: this.dateRange.map(
            (date: Date): CustomStepDefinition => {
                return { value: date.getTime(), legend: date.toDateString() };
            }
        ),
        translate: (value, label): string => {
            return new Date(value).toDateString();
        }
    };
    logText: string;
    toggleChartTableFlag = true;
    mapImpData = [];
    draw: MapboxDraw;
    modes = MapboxDraw.modes;
    moreTools = false;
    constructions = [];
    mediaTypes = [];
    constructor(
        private themeService: ThemeService,
        private commonService: CommonService,
        private reportsAPIService: ReportsAPIService,
        private inventoryService: InventoryService
    ) {}

    onUserChangeEnd(changeContext: ChangeContext): void {
        if (changeContext.pointerType === PointerType.Min) {
            this.minValueLabel = this.formatDate(changeContext.value);
        } else {
            this.maxValueLabel = this.formatDate(changeContext.value);
        }
    }
    formatDate(date) {
        if (date !== null) {
            date = new Date(date);
            return (
                ('0' + (date.getMonth() + 1)).slice(-2) +
                '/' +
                ('0' + date.getDate()).slice(-2) +
                '/' +
                date.getFullYear()
            );
        } else {
            return null;
        }
    }
    createDateRange(): Date[] {
        const dates: Date[] = [];
        for (let i = 1; i <= 31; i++) {
            dates.push(new Date(2018, 5, i));
        }
        return dates;
    }

    ngOnInit() {
        this.colorData = genWebColor({
            num: 10,
            rules: {
                names: ['red', 'pink', 'green'],
                levels: ['800', 'A100']
            }
        });
        const userData = JSON.parse(localStorage.getItem('user_data'));
        if (userData) {
            this.mapLayers = userData['layers'];
        }
        this.themeSettings = this.themeService.getThemeSettings();
        this.baseMaps = this.themeSettings.basemaps;
        this.themeService.getDimensions().subscribe((data) => {
            this.dimensionsDetails = data;
            // this.resizeLayout();
        });
        this.mapPopup = MapboxFactory.produce(MapboxFactoryEnum.POPUP, {});
        this.modes.draw_rectangle = DrawRectangle;
        this.modes.draw_free_hand = FreeHandDrawMode;
        this.draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                point: false,
                line_string: false,
                combine_features: false,
                uncombine_features: false,
                polygon: false,
                trash: false
            }
        });

        this.getImpData();
        this.reportsAPIService
            .getOpenCloseNaviBarStatus()
            .subscribe((status) => {
                setTimeout(() => {
                    this.resizeLayout();
                }, 500);
            });
        this.loadMediaTypes();
        // this.construction_type.valueChanges.subscribe((data) => {
        //     console.log('construction_type', data);
        // });
        // this.media_type.valueChanges.subscribe((data) => {
        //     console.log('media_type', data);
        // });
    }
    ngAfterViewInit() {
        if (this.toggleChartTableFlag) {
            setTimeout(() => {
                this.buildMap();
                this.resizeLayout();
            }, 1000);
        }
    }
    loadMediaTypes() {
        const filterData = {};
        filterData['summary_level_list'] = ['Construction Type'];
        filterData['measures_range_list'] = [{ type: 'imp', min: 0 }];
        const mediaFilterData = {};
        mediaFilterData['summary_level_list'] = ['Media Type'];
        mediaFilterData['measures_range_list'] = [{ type: 'imp', min: 0 }];
        forkJoin([
            this.inventoryService.getFilterData(filterData),
            this.inventoryService.getFilterData(mediaFilterData)
        ]).subscribe((data) => {
            if (data[0]) {
                this.constructions = data[0]['summaries'].map(
                    (d) => d['summarizes']['name']
                );
                this.construction_type.patchValue(this.constructions);
            }
            if (data[1]) {
                this.mediaTypes = data[1]['summaries'].map(
                    (d) => d['summarizes']['name']
                );
                this.media_type.patchValue(this.mediaTypes);
            }
        });
    }
    resizeLayout() {
        const chartWidth =
            document.getElementById('charts-div').clientWidth - 10;
        this.chartLineConfig['width'] = chartWidth;
        (this.mapHeight = 270), // document.getElementById('map-div').clientHeight - 50;
            setTimeout(() => {
                this.map.resize({ mapResize: true });
                this.manualRefresh.emit();
            }, 200);
    }
    buildMap() {
        const style = this.getDefaultMapStyle();
        this.style = this.commonService.getMapStyle(this.baseMaps, style);
        this.initializeMap(this.style['uri']);
    }
    initializeMap(style) {
        mapboxgl.accessToken = environment.mapbox.access_token;
        this.map = new mapboxgl.Map({
            container: 'reportMap',
            style: style,
            minZoom: 2,
            maxZoom: 16,
            preserveDrawingBuffer: true,
            center: this.mapCenter,
            zoom: 2
        });
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-left');
        this.map.addControl(this.draw);
        this.map.on('draw.create', this.updateArea.bind(this));
        this.map.on('draw.delete', this.updateArea.bind(this));
        this.map.on('draw.update', this.updateArea.bind(this));

        this.map.on('load', () => {
            this.loadMapLayers();
        });
    }
    loadMapLayers() {
        if (this.map.getLayer('cbsaLayer')) {
            this.map.removeLayer('cbsaLayer');
        }
        if (this.map.getLayer('cbsaStrokeLayer')) {
            this.map.removeLayer('cbsaStrokeLayer');
        }
        if (this.map.getSource('cbsaSource')) {
            this.map.removeSource('cbsaSource');
        }
        this.map.addSource('cbsaSource', {
            type: 'vector',
            url: 'mapbox://intermx.74g50264'
            // promoteId: { cbsa : "geoid"}
        });
        this.map.addLayer({
            id: 'cbsaLayerDummy',
            type: 'fill',
            source: 'cbsaSource',
            'source-layer': 'cbsa',
            minzoom: 0,
            maxzoom: 8,
            paint: {
                'fill-opacity': 0,
                'fill-color': '#B95846'
            }
        });
        this.map.addLayer({
            id: 'cbsaLayer',
            type: 'fill',
            source: 'cbsaSource',
            'source-layer': 'cbsa',
            minzoom: 0,
            maxzoom: 8,
            paint: {
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    0.6,
                    0.9
                ],
                'fill-color': '#B95846'
            }
        });
        this.bindOverEffect('cbsaLayer', 'cbsaSource', 'cbsa', this.map);
        this.map.addLayer({
            id: 'cbsaStrokeLayer',
            type: 'line',
            source: 'cbsaSource',
            'source-layer': 'cbsa',
            minzoom: 0,
            maxzoom: 8,
            paint: {
                'line-opacity': 1,
                'line-color': '#B95846',
                'line-width': 2
            }
        });
        // this.formatColorsForMap('mapload');
        // this.draw.changeMode('draw_free_hand');
    }
    updateArea(e) {
        const data = this.draw.getAll();
        const userPolygon = data.features[0];
        const polygonBoundingBox = bbox(userPolygon['geometry']);
        const southWest = [polygonBoundingBox[0], polygonBoundingBox[1]];
        const northEast = [polygonBoundingBox[2], polygonBoundingBox[3]];
        const northEastPointPixel = this.map.project(northEast);
        const southWestPointPixel = this.map.project(southWest);
        const features = this.map.queryRenderedFeatures(
            [southWestPointPixel, northEastPointPixel],
            { layers: ['cbsaLayerDummy'] }
        );
        const filters = features.reduce(
            function (memo, feature) {
                if (!(undefined === intersect(feature, userPolygon))) {
                    // only add the property, if the feature intersects with the polygon drawn by the user

                    memo.push(feature.properties.geoid);
                }
                return memo;
            },
            ['in', 'geoid']
        );
        this.map.setFilter('cbsaLayer', filters);
        this.map.setFilter('cbsaStrokeLayer', filters);
        this.draw.deleteAll();
    }
    getDefaultMapStyle() {
        this.baseMaps.filter((maps) => {
            if (maps.default) {
                this.defaultMapStyle = maps.label;
            }
        });
        return this.defaultMapStyle;
    }
    bindOverEffect(layerId, sourceId, sourceLayer, mapObj) {
        mapObj.on('mousemove', layerId, (e) => {
            //  this.map.getCanvas().style.cursor = 'pointer';
            if (this.mapPopup.isOpen()) {
                this.mapPopup.remove();
            }
            const feature = e.features[0];
            const impData = this.impData['data'].filter(
                (data) => data.cbsa_id === feature.properties.geoid
            );
            if (impData.length > 0) {
                const popupHTML = `
                <div class='cbsaMapPopup'>
                    <div><b>CBSA :</b> ${feature.properties.name}</div>
                    <div><b>Impression Variation :</b> ${impData[0]['average']}%</div>
                    <div><b>Confidence Interval :</b> ${impData[0]['ci_ninty_per']}%</div>
                </div>
                `;
                this.mapPopup
                    .setLngLat([e.lngLat['lng'], e.lngLat['lat']])
                    .setHTML(popupHTML)
                    .addTo(this.map);
            }
            /**
             if (e.features.length > 0) {
                if (this.hoveredStateId) {
                    mapObj.setFeatureState(
                    { source: sourceId, sourceLayer: sourceLayer, id: this.hoveredStateId },
                    { hover: false }
                    );
                }
                this.hoveredStateId = e.features[0].id;
                mapObj.setFeatureState(
                    {
                    source: sourceId,
                    sourceLayer: sourceLayer,
                    id: this.hoveredStateId
                    },
                    { hover: true }
                );
            }
            **/
        });
        mapObj.on('mouseleave', layerId, () => {
            // mapObj.getCanvas().style.cursor = '';
            if (this.mapPopup.isOpen()) {
                this.mapPopup.remove();
            }
            /*
            if (this.hoveredStateId) {
            mapObj.setFeatureState(
                {
                source: sourceId,
                sourceLayer: sourceLayer,
                id: this.hoveredStateId
                },
                { hover: false }
            );
            }
            this.hoveredStateId = null;
            */
        });
        // mapObj.on('click', layerId, (e) => {
        // });
    }
    getImpData() {
        this.reportsAPIService.getImpData().subscribe((impData) => {
            this.impData = impData;
            this.formatImpressionData();
        });
    }
    formatImpressionData() {
        const data = [];
        const topHeaderColumns = [
            { name: 'CBSA Name', displayname: 'CBSA Name', value: 'cbsa' },
            {
                name: 'Construction Type',
                displayname: 'Construction Type',
                value: 'construction_type'
            },
            {
                name: 'Media Type',
                displayname: 'Media Type',
                value: 'media_type'
            }
        ];
        const chartXaxisLabels = [];
        const subHeaderColumns = [];
        const chartData = [];
        const mapData = [];
        this.impData['data'].map((imp, impIndex) => {
            const tempDta = {};
            const tempChartData = {};
            const cbsaColumns = {};
            tempChartData['name'] = imp['cbsa_name'];
            tempChartData['color'] = genWebColor({
                format: 'hex',
                algorithm: 'Math.random'
            });
            tempChartData['values'] = [];
            tempDta['cbsa'] = imp['cbsa_name'];
            tempDta['cbsa_id'] = imp['cbsa_id'];
            tempDta['cbsa_average'] = imp['average'];
            tempDta['cbsa_ci_ninty_per'] = imp['ci_ninty_per'];
            mapData.push(tempDta);
            imp['data'].map((media, j) => {
                const tempMediaData = Helper.deepClone(tempDta);
                if (!cbsaColumns[imp['cbsa_name']]) {
                    cbsaColumns[imp['cbsa_name']] = 1;
                } else {
                    cbsaColumns[imp['cbsa_name']] += 1;
                    tempMediaData['cbsa'] = '';
                }
                if (!cbsaColumns[media['construction_type']]) {
                    cbsaColumns[media['construction_type']] = 1;
                    tempMediaData['construction_type'] =
                        media['construction_type'];
                } else {
                    cbsaColumns[media['construction_type']] += 1;
                    tempMediaData['construction_type'] = '';
                }
                if (!cbsaColumns[media['media_type']]) {
                    cbsaColumns[media['media_type']] = 1;
                    tempMediaData['media_type'] = media['media_type'];
                } else {
                    cbsaColumns[media['media_type']] += 1;
                    tempMediaData['media_type'] = '';
                }

                tempMediaData['media_type'] = media['media_type'];
                media['summaries'].map((summary, i) => {
                    const slug = 'week_' + i;
                    tempMediaData[slug + '_fdate'] = summary['form_date'];
                    tempMediaData[slug + '_tdate'] = summary['to_date'];
                    tempMediaData[slug] = summary['average'];
                    tempMediaData[slug + '_average'] = summary['average'];
                    tempMediaData[slug + '_ci_ninty_per'] =
                        summary['ci_ninty_per'];
                    if (!tempChartData['values'][i]) {
                        tempChartData['values'][i] = {
                            xLabel:
                                summary['form_date'] + '/' + summary['to_date'],
                            xData: i,
                            yData: summary['average'],
                            ci_ninty_per: summary['ci_ninty_per']
                        };
                    } else {
                        tempChartData['values'][i] = {
                            xLabel:
                                summary['form_date'] + '/' + summary['to_date'],
                            xData: i,
                            yData:
                                Number(tempChartData['values'][i]['yData']) +
                                Number(summary['average']),
                            ci_ninty_per:
                                Number(
                                    tempChartData['values'][i]['ci_ninty_per']
                                ) + Number(summary['ci_ninty_per'])
                        };
                    }
                    // tempChartData['values'].push({'xData':i,'yData':summary['average']});
                    if (
                        topHeaderColumns.filter((col) => col.value === slug)
                            .length <= 0
                    ) {
                        const weekColumn = {
                            name: 'week_header',
                            displayname: '',
                            value: ''
                        };
                        weekColumn['value'] = slug;
                        const fDate = new Date(summary['form_date']);
                        const tDate = new Date(summary['to_date']);
                        chartXaxisLabels.push(
                            fDate.getMonth() +
                                ' ' +
                                fDate.getDate() +
                                '-' +
                                tDate.getDate()
                        );
                        weekColumn['displayname'] =
                            this.months[fDate.getMonth()] +
                            ' ' +
                            fDate.getDate() +
                            '-' +
                            tDate.getDate();
                        topHeaderColumns.push(weekColumn);
                        subHeaderColumns.push(
                            ...[
                                {
                                    name: '90% CI',
                                    displayname: '90% CI',
                                    value: slug + '_ci_ninty_per'
                                },
                                {
                                    name: 'Average',
                                    displayname: 'Average',
                                    value: slug + '_average'
                                }
                            ]
                        );
                    }
                });
                tempMediaData['rowspan'] = cbsaColumns;
                data.push(tempMediaData);
            });
            chartData.push(tempChartData);
        });
        this.chartLineConfig['xAxisLabels'] = chartXaxisLabels;
        this.hourlyImpressionLineData = chartData;
        this.manualRefresh.emit();
        const columns = topHeaderColumns.concat(subHeaderColumns);
        this.topHeaderColumns = topHeaderColumns;
        this.topHeaderDisplayColumns = topHeaderColumns.map(
            (col) => col['value']
        );
        this.subHeaderColumns = subHeaderColumns;
        this.subHeaderDisplayColumns = subHeaderColumns.map(
            (col) => col['value']
        );
        this.columns = columns.filter(
            (item) => !item['name'].includes('week_header')
        );
        this.displayedColumns = this.columns.map((col) => col['value']);
        this.dataSource.data = data;
        this.mapImpData = mapData;
        if (
            this.map &&
            this.map.isStyleLoaded() &&
            this.map.getLayer('cbsaLayer')
        ) {
            // this.formatColorsForMap('formatting');
        }
    }
    formatColorsForMap(type) {
        if (this.mapImpData.length > 0) {
            const mapData = Helper.deepClone(this.mapImpData);
            const mapLegendsColors = [
                '#4F8663',
                '#69A771',
                '#8EC885',
                '#D8DFCF',
                '#F99A88',
                '#E86568',
                '#BE4061'
            ];
            const maxVal = Math.ceil(
                Math.max(...mapData.map((d) => d.cbsa_average))
            );
            const minVal = Math.floor(
                Math.min(...mapData.map((d) => d.cbsa_average))
            );
            const avgVal = Math.ceil((maxVal - minVal) / 7);
            const tempColors = [];
            let temMinVal = 0;
            let temMaxVal = 0;
            for (let i = 0; i < 7; i++) {
                temMinVal = minVal + avgVal * i;
                temMaxVal = temMinVal + avgVal;
                tempColors.push({
                    min: temMinVal,
                    max: temMaxVal,
                    color: mapLegendsColors[i]
                });
            }
            this.mapLegends = tempColors;
            this.mapMinVal = minVal;
            this.mapMaxVal = maxVal;
            const filters = [];
            const fidtemp = [];
            filters.unshift('all');

            const mapColorLayers = ['match', ['get', 'geoid']];
            mapData.map((data) => {
                const color = tempColors.filter(
                    (c) =>
                        c.min <= data['cbsa_average'] &&
                        c.max >= data['cbsa_average']
                );
                mapColorLayers.push(data['cbsa_id'], color[0]['color']);
                fidtemp.push(data['cbsa_id']);
            });

            fidtemp.unshift('in', 'geoid');
            filters.push(fidtemp);
            mapColorLayers.push(mapLegendsColors[0]);
            if (this.map.getLayer('cbsaLayer')) {
                this.map.setFilter('cbsaLayer', filters);
                this.map.setFilter('cbsaStrokeLayer', filters);
                this.map.setPaintProperty(
                    'cbsaLayer',
                    'fill-color',
                    mapColorLayers
                );
                this.map.setPaintProperty(
                    'cbsaStrokeLayer',
                    'line-color',
                    mapColorLayers
                );
            }
        }
    }
    chartTableToggle() {
        this.toggleChartTableFlag = !this.toggleChartTableFlag;
        if (this.toggleChartTableFlag) {
            setTimeout(() => {
                this.initializeMap(this.style['uri']);
            }, 500);
        }
    }
    openMoreTools() {
        this.moreTools = !this.moreTools;
    }
    swicthTools(type) {
        switch (type) {
            case 'rectangle':
                this.draw.changeMode('draw_rectangle');
                break;
            case 'lesso':
                this.draw.changeMode('draw_free_hand');
                break;
            default:
                break;
        }
    }
}
