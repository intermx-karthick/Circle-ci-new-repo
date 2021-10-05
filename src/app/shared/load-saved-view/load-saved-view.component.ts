import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { takeWhile } from 'rxjs/operators';
import swal from 'sweetalert2';
import { ExploreService } from '@shared/services';
import { LayersService } from 'app/explore/layer-display-options/layers.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-load-saved-view',
    templateUrl: './load-saved-view.component.html',
    styleUrls: ['./load-saved-view.component.less']
})
export class LoadSavedViewComponent implements OnInit, OnDestroy {
    public unSubscribe = true;
    public savedFiltersCtrl: FormControl = new FormControl();
    public loadsavedViews: ReplaySubject<any> = new ReplaySubject<any>(1);
    public savedViews: any = [];
    public selectedView: any = '';
    @Input() from: any;
    constructor(
        private exploreService: ExploreService,
        private layersService: LayersService,
        private router: Router
    ) {}

    ngOnInit() {
        this.getLayers();
        this.exploreService
            .getSavedLayers()
            .pipe(takeWhile(() => this.unSubscribe))
            .subscribe((layer) => {
                this.savedViews = layer;
                this.loadsavedViews.next(this.savedViews);
                this.loadFromSession();
            });
        this.savedFiltersCtrl.valueChanges
            .pipe(takeWhile(() => this.unSubscribe))
            .subscribe(() => {
                this.searchFilter();
            });
        this.layersService.getApplyLayers().subscribe((value) => {
            if (value['type'] === 'primary') {
                if (!value['flag']) {
                    this.selectedView = null;
                    this.layersService.setSelectedView(this.selectedView);
                } else {
                    this.loadFromSession();
                }
            }
        });
    }
    private loadFromSession() {
        const layersSession = this.layersService.getlayersSession();
        if (layersSession && layersSession['selectedView']) {
            this.selectedView = layersSession['selectedView'];
        } else {
            this.selectedView = null;
        }
        this.layersService.setSelectedView(this.selectedView);
    }
    ngOnDestroy() {
        this.unSubscribe = false;
    }
    getLayers() {
        let selectedtab = this.router.url.slice(1);
        if (selectedtab === 'places') {
            selectedtab = 'place';
        } else if (selectedtab === 'explore') {
            selectedtab = 'inventory';
        }
        this.exploreService.getLayerViews(selectedtab).subscribe((layers) => {
            this.savedViews = (layers && layers.views && layers.views) || [];
            this.exploreService.setSavedLayes(this.savedViews);

            this.loadsavedViews.next(this.savedViews);
        });
    }
    searchFilter() {
        // get the search keyword
        let search = this.savedFiltersCtrl.value;
        if (!search) {
            this.loadsavedViews.next(this.savedViews.slice());
            return;
        } else {
            search = search.toLowerCase();
        }
        this.loadsavedViews.next(
            this.savedViews.filter((saved) => this.search(search, saved))
        );
    }
    private search(keyword, set) {
        let searchValue = [];
        keyword = keyword.split(' ');
        searchValue = keyword.map((key) => {
            return set.name.toLowerCase().indexOf(key.toLowerCase()) !== -1;
        });
        if (searchValue.indexOf(true) >= 0) {
            return true;
        } else {
            return false;
        }
    }
    public changeSavedView(e) {
        if (e.value) {
            this.selectedView = e.value;
            this.layersService.setSelectedView(e.value);
            // layer = this.getLayer(e.value);
            // if (layer['_id']) {
            //   this.selectedView = layer;
            //   this.layersService.setSelectedView(layer['_id']);
            // }
        }
    }
    getLayer(id) {
        const layer = this.savedViews.find((v) => v['_id'] === id);
        return layer;
    }
    onDeleteLayer(savedLayer) {
        swal({
            title:
                'Are you sure you want to delete "' +
                savedLayer.name +
                '" layer view?',
            text: '',
            type: 'warning',
            showCancelButton: true,
            confirmButtonText: 'YES, DELETE',
            confirmButtonClass: 'waves-effect waves-light',
            cancelButtonClass: 'waves-effect waves-light'
        })
            .then((x) => {
                if (typeof x.value !== 'undefined' && x.value) {
                    this.exploreService.deleteLayer(savedLayer._id).subscribe(
                        (success) => {
                            this.getLayers();
                            swal(
                                'Success',
                                savedLayer.name + ' Deleted Successfully',
                                'success'
                            );
                        },
                        (e) => {
                            let message = '';
                            if (
                                typeof e.error !== 'undefined' &&
                                typeof e.error.message !== 'undefined'
                            ) {
                                message =
                                    'An error has occurred. Please try again later.';
                            }
                            swal('Error', message, 'error');
                        }
                    );
                }
            })
            .catch(swal.noop);
    }
}
