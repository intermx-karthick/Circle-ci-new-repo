import { Component, OnInit, Inject } from '@angular/core';
import {
    MatDialog,
    MatDialogRef,
    MAT_DIALOG_DATA
} from '@angular/material/dialog';
import {
    FormControl,
    FormGroup,
    FormBuilder,
    Validators
} from '@angular/forms';
import { ExploreService, FormatService, ThemeService } from '@shared/services';
import { LayersService } from '../../../explore/layer-display-options/layers.service';
import swal from 'sweetalert2';
import { forkJoin, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
    selector: 'app-saved-view-dialog',
    templateUrl: './saved-view-dialog.component.html',
    styleUrls: ['./saved-view-dialog.component.less']
})
export class SavedViewDialogComponent implements OnInit {
    layerSetForm: FormGroup;
    layersAll: any = [];
    title: any;
    secondaryLayer: any;
    tabType: any;
    constructor(
        public dialogRef: MatDialogRef<SavedViewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private fb: FormBuilder,
        private exploreService: ExploreService,
        private formatService: FormatService,
        private layersService: LayersService,
        private theme: ThemeService,
        private router: Router
    ) {}
    layers: any = [];
    display: any = {};
    secondaryDisplay: any = {};
    filters: any = {};
    public customLogo: any = {};
    public secondaryCustomLogo: any = {};
    savedViewName = '';
    selectedView = {};
    public isPublicSite = false;
    ngOnInit() {
        /*const themeSettings = this.theme.getThemeSettings();
    if (themeSettings.publicSite) {
      this.isPublicSite = true;
    } else {
      this.isPublicSite = false;
    }*/
        this.tabType = this.router.url.slice(1);
        if (this.tabType === 'places') {
            this.tabType = 'place';
        } else if (this.tabType === 'explore') {
            this.tabType = 'inventory';
        }
        this.layersAll = this.data.layersAll;
        if (this.data.method === 'update' && this.data.selectedView) {
            this.selectedView = this.data.selectedView;
            this.savedViewName = this.selectedView['name'];
        } else {
            if (this.layersAll && this.layersAll.length > 0) {
                this.savedViewName = this.formatService.getObjectTitle(
                    this.layersAll,
                    'View',
                    'name'
                );
            } else {
                this.savedViewName = 'Untitled View 1';
            }
        }
        this.layerSetForm = this.fb.group({
            name: [this.savedViewName, Validators.required],
            password: ['']
        });
        if (this.data['layers']) {
            this.data['layers'].map((layer) => {
                let data = {};
                // TODO [refactor] : Discuss with the team, why another data formatting is required here?
                // if (layer['type'] !== 'place') {
                data = {
                    id: layer['id'],
                    type: layer['type'],
                    icon: layer['icon'],
                    color: layer['color']
                };
                // } else {
                //   data = layer;
                // }
                // adding Heatmap type for single inventory unit
                if (layer.type === 'geopathId') {
                    data['heatMapType'] = layer['heatMapType'];
                }
                // for geography Layer save
                if (layer.type === 'geography') {
                    data['geography'] = layer['geography'];
                }
                this.layers.push(data);
            });
        }
        this.display = this.data['display'];
        this.filters = this.data['filters'];
        this.title = this.data['title'];
        if (this.data['secondaryLayer']) {
            this.secondaryLayer = this.data['secondaryLayer'];
            this.secondaryDisplay = this.data['secondaryLayer']['display'];
        }
        if (
            this.layersService.exploreCustomLogo &&
            this.layersService.exploreCustomLogo['primary'] &&
            this.layersService.exploreCustomLogo['primary']['logo'] &&
            this.layersService.exploreCustomLogo['primary']['logo']['location']
        ) {
            this.customLogo['file'] = this.layersService.exploreCustomLogo[
                'primary'
            ]['logo']['location'];
            if (typeof this.customLogo['file'] === 'string') {
                this.display['logo'] = this.layersService.exploreCustomLogo[
                    'primary'
                ]['logo'];
            } else {
                const logoInfo = Object.assign(
                    {},
                    this.layersService.exploreCustomLogo['primary']['logo']
                );
                delete logoInfo['location'];
                delete logoInfo['url'];
                this.display['logo'] = logoInfo;
            }
        }
        if (
            this.layersService.exploreCustomLogo &&
            this.layersService.exploreCustomLogo['secondary'] &&
            this.layersService.exploreCustomLogo['secondary']['logo'] &&
            this.layersService.exploreCustomLogo['secondary']['logo'][
                'location'
            ]
        ) {
            this.secondaryCustomLogo[
                'file'
            ] = this.layersService.exploreCustomLogo['secondary']['logo'][
                'location'
            ];
            if (typeof this.secondaryCustomLogo['file'] === 'string') {
                this.secondaryDisplay[
                    'logo'
                ] = this.layersService.exploreCustomLogo['secondary']['logo'];
            } else {
                const logoInfo = Object.assign(
                    {},
                    this.layersService.exploreCustomLogo['secondary']['logo']
                );
                delete logoInfo['location'];
                delete logoInfo['url'];
                this.secondaryDisplay['logo'] = logoInfo;
            }
        }
    }
    onSubmit(form) {
        if (!form.invalid) {
            const layers = {
                name: form.value['name'],
                title: this.title,
                layers: this.layers,
                display: this.display,
                filters: this.filters
            };
            if (this.data && this.data['type']) {
                layers['type'] = this.data['type'];
            }
            if (this.secondaryLayer) {
                layers['secondaryLayer'] = this.secondaryLayer;
                layers['secondaryLayer']['display'] = this.secondaryDisplay;
            }
            if (this.layers && this.layers.length <= 0) {
                delete layers['layers'];
            }

            if (!this.isPublicSite) {
                if (this.data.method === 'add') {
                    this.exploreService.saveLayerView(layers).subscribe(
                        (response) => {
                            // const id = 1;
                            const requests = [];
                            if (
                                this.customLogo['file'] &&
                                typeof this.customLogo['file'] !== 'string'
                            ) {
                                requests.push(
                                    this.exploreService
                                        .uploadLogo(
                                            response['data']['id'],
                                            this.customLogo['file'],
                                            '',
                                            false
                                        )
                                        .pipe(catchError((error) => EMPTY))
                                );
                            }
                            if (
                                this.secondaryCustomLogo['file'] &&
                                typeof this.secondaryCustomLogo['file'] !==
                                    'string'
                            ) {
                                requests.push(
                                    this.exploreService
                                        .uploadLogo(
                                            response['data']['id'],
                                            this.secondaryCustomLogo['file'],
                                            '',
                                            true
                                        )
                                        .pipe(catchError((error) => EMPTY))
                                );
                            }
                            if (requests.length) {
                                forkJoin(requests).subscribe(
                                    () => {
                                        this.afterApiSuccess(
                                            'Layer view saved successfully.'
                                        );
                                    },
                                    (error) => {
                                        this.afterApiError(error);
                                    }
                                );
                            } else {
                                this.afterApiSuccess(
                                    'Layer view saved successfully.'
                                );
                            }
                        },
                        (error) => {
                            this.afterApiError(error);
                        }
                    );
                } else {
                    this.exploreService
                        .updateLayerView(layers, this.selectedView['_id'])
                        .subscribe(
                            (response) => {
                                const requests = [];
                                if (
                                    this.customLogo['file'] &&
                                    typeof this.customLogo['file'] !== 'string'
                                ) {
                                    let firstImagePrevLocation = '';
                                    if (
                                        this.selectedView['display'] &&
                                        this.selectedView['display']['logo'] &&
                                        this.selectedView['display']['logo'][
                                            'location'
                                        ]
                                    ) {
                                        firstImagePrevLocation = this
                                            .selectedView['display']['logo'][
                                            'location'
                                        ];
                                    }
                                    requests.push(
                                        this.exploreService
                                            .uploadLogo(
                                                this.selectedView['_id'],
                                                this.customLogo['file'],
                                                firstImagePrevLocation
                                            )
                                            .pipe(catchError((error) => EMPTY))
                                    );
                                }
                                if (
                                    this.secondaryCustomLogo['file'] &&
                                    typeof this.secondaryCustomLogo['file'] !==
                                        'string'
                                ) {
                                    let secondImagePrevLocation = '';
                                    if (
                                        this.selectedView['secondaryLayer'] &&
                                        this.selectedView['secondaryLayer'][
                                            'display'
                                        ] &&
                                        this.selectedView['secondaryLayer'][
                                            'display'
                                        ]['logo'] &&
                                        this.selectedView['secondaryLayer'][
                                            'display'
                                        ]['logo']['location']
                                    ) {
                                        secondImagePrevLocation = this
                                            .selectedView['secondaryLayer'][
                                            'display'
                                        ]['logo']['location'];
                                    }
                                    requests.push(
                                        this.exploreService
                                            .uploadLogo(
                                                this.selectedView['_id'],
                                                this.secondaryCustomLogo[
                                                    'file'
                                                ],
                                                secondImagePrevLocation,
                                                true
                                            )
                                            .pipe(catchError((error) => EMPTY))
                                    );
                                }

                                if (requests.length) {
                                    forkJoin(requests).subscribe(
                                        () => {
                                            this.afterApiSuccess(
                                                'Layer view saved successfully.'
                                            );
                                        },
                                        (error) => {
                                            this.afterApiError(error);
                                        }
                                    );
                                } else {
                                    this.afterApiSuccess(
                                        'Layer view saved successfully.'
                                    );
                                }
                            },
                            (error) => {
                                this.afterApiError(error);
                            }
                        );
                }
            }
        }
    }

    private afterApiSuccess(message) {
        this.dialogRef.close();
        swal('Success', message, 'success');
        this.exploreService
            .getLayerViews(this.tabType)
            .subscribe((saveData) => {
                const savedViews =
                    (saveData && saveData.views && saveData.views) || [];
                this.exploreService.setSavedLayes(savedViews);
            });
    }

    private afterApiError(error) {
        if (error.error.message) {
            this.layerSetForm.controls['name'].setErrors({
                error: error.error.message
            });
        } else {
            swal('Something went wrong');
        }
    }
}
