import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { LayersService } from '../../../explore/layer-display-options/layers.service';
import { combineLatest, Subject } from 'rxjs';
import {
    ThemeService,
    AuthenticationService,
    ExploreService
} from '@shared/services';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { SavedViewDialogComponent } from '../saved-view-dialog/saved-view-dialog.component';
import { PopulationService } from 'app/population/population.service';
import { Router } from '@angular/router';
import { PlacesFiltersService } from 'app/places/filters/places-filters.service';

@Component({
    selector: 'app-layers-and-display-options',
    templateUrl: './layers-and-display-options.component.html',
    styleUrls: ['./layers-and-display-options.component.less']
})
export class LayersAndDisplayOptionsComponent implements OnInit, OnDestroy {
    private layerDisplayOptions: any = {};
    private unSubscribe: Subject<void> = new Subject<void>();
    private layers: any = [];
    @Input()
    displayOptionsList = [
        'Map Legends',
        'Map Controls',
        'Sync Zoom and Paning',
        'Custom Logo',
        'Custom Text',
        'Base Maps'
    ];
    @Input()
    layersOptionsList = [
        'inventory collection',
        'place collection',
        'geopathId',
        'place',
        'geography',
        'geo sets'
    ];
    public selectedView: any;
    public tabSelectedIndex: any = 0;
    private themeSettings: any;
    private mapStyle: string;
    private selectedtab: string;
    allowInventory: any = '';
    @Input() layerType;
    layersAll: any;
    constructor(
        private dialog: MatDialog,
        private layersService: LayersService,
        private themeService: ThemeService,
        private authService: AuthenticationService,
        private exploreService: ExploreService,
        private populationService: PopulationService,
        private router: Router,
        private placeFilterService: PlacesFiltersService,
    ) {}

    ngOnInit() {
        this.selectedtab = this.router.url.slice(1);
        if (this.selectedtab === 'places') {
            this.selectedtab = 'place';
        } else if (this.selectedtab === 'explore') {
            this.selectedtab = 'inventory';
        }
        this.getsavedLayers(this.selectedtab);
        this.themeSettings = this.themeService.getThemeSettings();
        this.themeSettings.basemaps.filter((maps) => {
            if (maps.default) {
                this.mapStyle = maps.label;
            }
        });
        const mod_permission = this.authService.getModuleAccess('explore');
        this.allowInventory =
            mod_permission['features']['gpInventory']['status'];
        combineLatest([this.layersService.getDisplayOptions()])
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((options) => {
                this.layerDisplayOptions = options[0];
            });

        this.layersService
            .onMapLoad()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(() => {
                this.layersService.setApplyLayers({
                    type: this.layerType,
                    flag: true
                });
            });

        this.layersService
            .getLayers()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((layers) => {
                if (layers) {
                    this.layers = layers;
                }
            });
        this.layersService.getSelectedView().subscribe((data) => {
            this.selectedView = data;
        });
        this.placeFilterService.onReset()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(type => {
                if (type === 'All') {
                    this.clearAll();
                }
            });
        this.populationService.onReset()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(type => {
                if (type === 'All') {
                    this.clearAll();
                }
            });
    }
    public onSaveView() {
        const data = {};
        const primary = this.layersService.getlayersSession();
        data['title'] = primary['title'];
        data['layers'] = primary['selectedLayers'];
        data['layersAll'] = this.layersAll;
        if (this.layerType === 'primary') {
            data['display'] = this.layerDisplayOptions;
        } else {
            data['display'] = primary['display'] && primary['display'];
        }
        if (data['display']['baseMap'] === '') {
            data['display']['baseMap'] = this.mapStyle;
        }
        if (
            data['display']['logo'] &&
            !data['display']['logo']['fileName'] &&
            primary['cusomLogoInfo'] &&
            primary['customLogoInfo']['logo']
        ) {
            data['display']['logo']['fileName'] =
                primary['customLogoInfo']['logo']['fileName'];
        }
        let filters;
        if (this.selectedtab === 'population') {
            filters = this.populationService.getPopulationFilterSession();
        } else if (this.selectedtab === 'place') {
            filters = {
                data: this.placeFilterService.getPlacesSession(),
                selection: {}
            };
        }
        data['filters'] = filters;
        const secondaryLayers = this.layersService.getlayersSession(
            'secondary'
        );
        if (secondaryLayers) {
            const secondaryLayer = {};
            secondaryLayer['title'] = secondaryLayers['title'];
            secondaryLayer['layers'] = secondaryLayers['selectedLayers'];
            secondaryLayer['display'] = secondaryLayers['display'];
            data['secondaryLayer'] = secondaryLayer;
        }
        data['method'] = 'add';
        data['type'] = this.selectedtab;
        const dialogRef = this.dialog.open(SavedViewDialogComponent, {
            width: '500px',
            data: data,
            panelClass: 'save-layer-dialog'
        });
        dialogRef.afterClosed().subscribe((result) => {});
    }

    public onUpdateView() {
        this.exploreService
            .getLayerView(this.selectedView, true)
            .subscribe((layerDetails) => {
                const data = {};
                const primary = this.layersService.getlayersSession();
                data['title'] = primary['title'];
                data['layers'] =
                    primary['selectedLayers'] && primary['selectedLayers'];
                // data['layersAll'] = this.layersAll;
                data['display'] = primary['display']; // this.layerDisplayOptions;
                const filters = this.populationService.getPopulationFilterSession();
                data['filters'] = filters;
                const secondaryLayers = this.layersService.getlayersSession(
                    'secondary'
                );
                if (secondaryLayers) {
                    const secondaryLayer = {};
                    secondaryLayer['title'] = secondaryLayers['title'];
                    secondaryLayer['layers'] =
                        secondaryLayers['selectedLayers'];
                    secondaryLayer['display'] = secondaryLayers['display'];
                    data['secondaryLayer'] = secondaryLayer;
                }
                data['method'] = 'update';
                data['selectedView'] = layerDetails;
                const dialogRef = this.dialog.open(SavedViewDialogComponent, {
                    width: '500px',
                    data: data,
                    panelClass: 'save-layer-dialog'
                });
                dialogRef.afterClosed().subscribe((result) => {});
            });
    }

    /* public onApply() {
     debugger;
     console.log('On layers and display option saving');
     this.layersService.saveLayersSession({
       display: this.layerDisplayOptions,
       customLogoInfo: this.layersService.exploreCustomLogo['primary'],
       selectedLayers: this.layers
     }, 'place');
     console.log('onApply' );
     this.layersService.saveLayersSession({
             selectedLayers: this.layers,
             display: this.layerDisplayOptions,
             selectedView: this.selectedView,
             customLogoInfo: this.layersService.exploreCustomLogo[this.layerType],
           }, this.layerType);
 
     this.layersService.setApplyLayers({
       type : this.layerType,
       flag : true
     });
   }*/
    // Need to check and update apply methods
    public onApply() {
        this.layersService.tabSelection = this.tabSelectedIndex;
        if (this.tabSelectedIndex !== 2) {
            if (
                this.layersService.exploreCustomLogo[this.layerType]['logo'] &&
                this.layersService.exploreCustomLogo[this.layerType]['logo'] &&
                Object.keys(
                    this.layersService.exploreCustomLogo[this.layerType]['logo']
                ).length > 0
            ) {
                if (this.layerDisplayOptions['logo']) {
                    this.layerDisplayOptions['logo'][
                        'backgroundWhite'
                    ] = this.layersService.exploreCustomLogo[this.layerType][
                        'logo'
                    ]['backgroundWhite'];
                }
            }
            const searchLayer = this.layers.filter(
                (d) => d['id'] === 'default'
            );
            if (this.layersService.getRemovedSearchLayer() !== null) {
                if (searchLayer && searchLayer.length > 0) {
                    this.layersService.setRemovedSearchLayer(false);
                } else {
                    this.layersService.setRemovedSearchLayer(true);
                }
            }
            const layersSession = this.layersService.getlayersSession(
                this.layerType
            );
            /**
             * check dual map title if exist added to layer.
             */
            let mapTitle = '';
            if (layersSession && layersSession['title']) {
                mapTitle = layersSession['title'];
            } else {
                if (this.layerType === 'primry') {
                    mapTitle = 'Primary Map';
                } else {
                    mapTitle = 'Secondary Map';
                }
            }
            this.layersService.saveLayersSession(
                {
                    selectedLayers: this.layers,
                    display: this.layerDisplayOptions,
                    selectedView: this.selectedView,
                    customLogoInfo: this.layersService.exploreCustomLogo[
                        this.layerType
                    ],
                    title: mapTitle
                },
                this.layerType
            );
            this.layersService.setApplyLayers({
                type: this.layerType,
                flag: true
            });
        } else {
            /** This function call to load the save views */
            this.loadLayers();
        }
    }

    private loadLayers() {
        if (this.selectedView) {
            this.exploreService
                .getLayerView(this.selectedView, true)
                .subscribe((layerDetails) => {
                    let display = {};
                    let layers = [];
                    let filter = {};
                    if (layerDetails['display']) {
                        display = layerDetails['display'];
                    }
                    if (
                        layerDetails['layers'] &&
                        layerDetails['layers'].length > 0
                    ) {
                        layers = layerDetails['layers'];
                    }
                    if (layerDetails['filters']) {
                        filter = layerDetails['filters'];
                        if (this.selectedtab === 'place') {
                            Object.entries(filter['data']).forEach(
                                ([key, value]) => {
                                    this.placeFilterService.savePlacesSession(
                                        key,
                                        value
                                    );
                                }
                            );
                        } else {
                            this.populationService.setPopulationFilterSession(
                                filter,
                                true
                            );
                        }
                    }
                    if (display['logo']) {
                        this.layersService.exploreCustomLogo['primary'][
                            'logo'
                        ] = display['logo'];
                    }
                    if (this.layerType === 'primary') {
                        this.layersService.setDisplayOptions(display);
                    } else {
                        this.layersService.setSecondaryDisplayOptions(display);
                    }
                    this.layersService.setLayers(layers);
                    this.layersService.saveLayersSession(
                        {
                            title: layerDetails['title'],
                            selectedLayers: layers,
                            display: display,
                            selectedView: this.selectedView
                        },
                        'primary'
                    );
                    this.layersService.setApplyLayers({
                        type: 'primary',
                        flag: true
                    });
                    if (layerDetails['secondaryLayer']) {
                        if (
                            layerDetails['secondaryLayer']['display'] &&
                            layerDetails['secondaryLayer']['display']['logo']
                        ) {
                            this.layersService.exploreCustomLogo['secondary'][
                                'logo'
                            ] =
                                layerDetails['secondaryLayer']['display'][
                                    'logo'
                                ];
                        }
                        this.layersService.saveLayersSession(
                            {
                                title:
                                    (layerDetails['secondaryLayer']['title'] &&
                                        layerDetails['secondaryLayer'][
                                            'title'
                                        ]) ||
                                    'Secondary Map',
                                selectedLayers:
                                    layerDetails['secondaryLayer']['layers'],
                                display:
                                    layerDetails['secondaryLayer']['display']
                            },
                            'secondary'
                        );
                        this.layersService.setApplyLayers({
                            type: 'secondary',
                            flag: true
                        });
                    } else {
                        this.layersService.saveLayersSession({}, 'secondary');
                        this.layersService.setApplyLayers({
                            type: 'secondary',
                            flag: false
                        });
                    }
                });
        }
    }
    public clearAll() {
        this.layersService.saveLayersSession(
            {
                title:
                    this.layerType === 'primary'
                        ? 'Primary Map'
                        : 'Secondary Map',
                selectedLayers: []
            },
            this.layerType
        );
        this.layersService.setApplyLayers({
            type: this.layerType,
            flag: false
        });
        this.layersService.setLoadView(false);
    }

    public onChangeOfLayer(layers) {
        this.layers = layers;
    }

    public onChangeOfDisplayOption(displayOptions) {
        this.layerDisplayOptions = displayOptions;
        if (this.layerType === 'primary') {
            const primaryDisplaySession = JSON.parse(
                localStorage.getItem('layersSession')
            );
            primaryDisplaySession['display'] = displayOptions;
            localStorage.setItem(
                'layersSession',
                JSON.stringify(primaryDisplaySession)
            );
            this.layersService.setDisplayOptions(displayOptions);
        } else {
            const secondaryDisplaySession = JSON.parse(
                localStorage.getItem('secondaryLayersSession')
            );
            secondaryDisplaySession['display'] = displayOptions;
            localStorage.setItem(
                'secondaryLayersSession',
                JSON.stringify(secondaryDisplaySession)
            );
            this.layersService.setSecondaryDisplayOptions(displayOptions);
        }
    }

    public tabchange(event) {
        this.tabSelectedIndex = event;
    }
    ngOnDestroy() {
        this.unSubscribe.next();
        this.unSubscribe.complete();
    }

    getsavedLayers(type) {
        if (type === 'places') {
            type = 'place';
        }
        this.exploreService.getLayerViews(type).subscribe((result) => {
            this.layersAll = result['views'];
        });
    }
}
