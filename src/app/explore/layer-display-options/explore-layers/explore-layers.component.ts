import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {FilterPillTypes} from '@interTypes/displayOptions';
import { SavedViewDialogComponent } from '../../../shared/components/saved-view-dialog/saved-view-dialog.component';
import { LayersService } from '../layers.service';
import { ExploreService } from '../../../shared/services/explore.service';
import { ExploreDataService } from '../../../shared/services/explore-data.service';
import { takeWhile } from 'rxjs/operators';
import { FiltersService } from '../../filters/filters.service';
import { PlacesService } from '../../../shared/services/places.service';
import { AuthenticationService } from '../../../shared/services/authentication.service';
import { ThemeService } from '@shared/services';
import {Helper} from '../../../classes';
@Component({
  selector: 'app-explore-layers',
  templateUrl: './explore-layers.component.html',
  styleUrls: ['./explore-layers.component.less']
})
export class ExploreLayersComponent implements OnInit, OnDestroy {
  private layers: any = [];
  private layersAll: any = [];
  private layerDisplayOptions: any = {};
  public selectedView: any;
  public tabSelectedIndex: any = 0;
  public unSubscribe = true;
  public isLoadView = false;
  placeSets = [];
  private layerData = {};
  mod_permission: any;
  allowInventory: any = '';
  allowInventoryAudience: any = '';
  audienceLicense = {};
  // private noRepeat = true;
  private themeSettings: any;
  private mapStyle: string;
  @Input() layerType;
  @Input() layerID;
  constructor(
    public dialog: MatDialog,
    private exploreService: ExploreService,
    private layersService: LayersService,
    private route: ActivatedRoute,
    private filterService: FiltersService,
    private place: PlacesService,
    private exploreDataService: ExploreDataService,
    private authentication: AuthenticationService,
    private theme: ThemeService,
    ) { }

  public ngOnInit() {
    this.themeSettings = this.theme.getThemeSettings();
    this.themeSettings.basemaps.filter(maps => {
        if (maps.default) {
          this.mapStyle = maps.label;
        }
    });
    this.mod_permission = this.authentication.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    this.audienceLicense = this.authentication.getModuleAccess('gpAudience');
    this.allowInventoryAudience = this.audienceLicense['status'];
    const routeData = this.route.snapshot.data;
    if (routeData.places && routeData.places['places']) {
      this.placeSets = routeData.places.places;
    }
    /* this.layersService.getLayers().subscribe((layers) => {
      console.log('layers', layers);
      if (layers) {
        this.layers = layers;
      }
    }); */
    if (this.layerType === 'secondary') {
      this.layersService.getSecondaryDisplayOptions().subscribe((displayOptions) => {
        this.layerDisplayOptions = displayOptions;
      });
    } else {
      this.layersService.getDisplayOptions().subscribe((displayOptions) => {
        this.layerDisplayOptions = displayOptions;
      });
    }
    this.layersService.getSelectedView().subscribe((data) => {
      this.selectedView = data;
      /* Actually these lines are not needed
      ticket - https://intermx.atlassian.net/browse/IMXUIPRD-265  commented date - 23/05/2019 */
      // if (this.selectedView && this.noRepeat) {
      //   this.loadLayers();
      //   this.noRepeat = false;
      // }
    });
    this.exploreService.getSavedLayers()
    .pipe(takeWhile(() => this.unSubscribe))
    .subscribe((layer) => {
      this.layersAll  = layer;
    });
    this.layersService.getLoadView().pipe(takeWhile(() => this.unSubscribe))
    .subscribe(value => {
      if (value) {
        this.loadLayers();
        // this.isLoadView = true;
        // this.onApply();
      }
      //  else {
      //   this.isLoadView = false;
      // }
    });
    /** getSaveView subscribe when common action filter save view button click */
    this.layersService.getSaveView().pipe(takeWhile(() => this.unSubscribe))
    .subscribe(value => {
      if (value && this.layerType !== 'secondary') {
        this.onSaveView();
      }
    });

    if (this.layerType === 'primary') {
      this.exploreDataService.onMapLoad().pipe(takeWhile(() => this.unSubscribe)).subscribe(() => {
        this.layersService.setApplyLayers({
          type : this.layerType,
          flag : true
        });
      });
    }
    // else {
    //   this.exploreDataService.onSecondaryMapLoad().pipe(takeWhile(() => this.unSubscribe)).subscribe(() => {
    //     this.layersService.setApplyLayers({
    //       type : this.layerType,
    //       flag : true
    //     });
    //   });
    // }

  }
  ngOnDestroy() {
    this.unSubscribe = false;
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
   if (data['display']['logo'] && !data['display']['logo']['fileName'] &&
    primary['cusomLogoInfo'] && primary['customLogoInfo']['logo'] ) {
    data['display']['logo']['fileName'] = primary['customLogoInfo']['logo']['fileName'];
   }
   const filters = this.filterService.getExploreSession();
   data['filters'] = filters;
   const secondaryLayers = this.layersService.getlayersSession('secondary');
   if (secondaryLayers) {
    const secondaryLayer = {};
    secondaryLayer['title'] = secondaryLayers['title'];
    secondaryLayer['layers'] = secondaryLayers['selectedLayers'];
    secondaryLayer['display'] = secondaryLayers['display'];
    data['secondaryLayer'] = secondaryLayer;
   }
   data['method'] = 'add';
   const dialogRef = this.dialog.open(SavedViewDialogComponent, {
      width: '500px',
      data: data,
      panelClass: 'save-layer-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
  public onUpdateView() {
    this.exploreService
      .getLayerView(this.selectedView, true)
      .subscribe(layerDetails => {
        const data = {};
        const primary = this.layersService.getlayersSession();
        data['title'] = primary['title'];
        data['layers'] = primary['selectedLayers'] && primary['selectedLayers'];
        data['layersAll'] = this.layersAll;
        data['display'] = primary['display']; // this.layerDisplayOptions;
        const filters = this.filterService.getExploreSession();
        data['filters'] = filters;
        const secondaryLayers = this.layersService.getlayersSession('secondary');
        if (secondaryLayers) {
          const secondaryLayer = {};
          secondaryLayer['title'] = secondaryLayers['title'];
          secondaryLayer['layers'] = secondaryLayers['selectedLayers'];
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
        // dialogRef.afterClosed().subscribe(result => {
        //   console.log('The dialog was closed');
        // });

      });
   }
  public onApply() {
    this.layersService.tabSelection = this.tabSelectedIndex;
    if (this.tabSelectedIndex !== 2) {
      if (
        this.layersService.exploreCustomLogo[this.layerType]['logo']
        && this.layersService.exploreCustomLogo[this.layerType]['logo']
        && Object.keys(this.layersService.exploreCustomLogo[this.layerType]['logo']).length > 0
      ) {
        if (this.layerDisplayOptions['logo']) {
        this.layerDisplayOptions['logo']['backgroundWhite'] = this.layersService.exploreCustomLogo[this.layerType]['logo']['backgroundWhite'];
        }
      }
      const searchLayer = this.layers.filter((d) => d['id'] === 'default');
      if (this.layersService.getRemovedSearchLayer() !== null) {
        if (searchLayer && searchLayer.length > 0) {
          this.layersService.setRemovedSearchLayer(false);
        } else {
          this.layersService.setRemovedSearchLayer(true);
        }
      }
      const  layersSession =  this.layersService.getlayersSession(this.layerType);
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
      this.layersService.saveLayersSession({
        selectedLayers: this.layers,
        display: this.layerDisplayOptions,
        selectedView: this.selectedView,
        customLogoInfo: this.layersService.exploreCustomLogo[this.layerType],
        title: mapTitle
      }, this.layerType);
      this.layersService.setApplyLayers({
        type : this.layerType,
        flag : true
      });
    } else {
      this.loadLayers();
    }
  }
  private loadLayers () {
    this.layerData = {};
      if (this.selectedView) {
        this.exploreService
            .getLayerView(this.selectedView, true)
            .subscribe(layerDetails => {
              let display = {};
              let layers = [];
              if (layerDetails['display']) {
                display = layerDetails['display'];
              }
              if (!display['filterPills'] && !display['labels']) {
                display['filterPills'] = false;
                display['labels'] = {
                  audience: true,
                  market: true,
                  filters: true,
                  deliveryWeeks: true,
                  'saved view': true,
                };
              }
              if (layerDetails['layers'] && layerDetails['layers'].length > 0) {
                layers = layerDetails['layers'];
              }
              if (display['logo']) {
                this.layersService.exploreCustomLogo['primary']['logo'] = display['logo'];
              }
              if (this.layerType === 'primary') {
                this.layersService.setDisplayOptions(display);
              } else {
                this.layersService.setSecondaryDisplayOptions(display);
              }
              this.layersService.setLayers(layers);
              this.layersService.saveLayersSession(
                {title: layerDetails['title'] ,
                selectedLayers: layers,
                display: display,
                selectedView: this.selectedView},
                'primary');
              this.layersService.setApplyLayers({
                type : 'primary',
                flag : true
              });
              if (layerDetails['secondaryLayer']) {
                if (layerDetails['secondaryLayer']['display'] && layerDetails['secondaryLayer']['display']['logo']) {
                  this.layersService.exploreCustomLogo['secondary']['logo'] = layerDetails['secondaryLayer']['display']['logo'];
                }
                this.layersService.saveLayersSession(
                  {
                    title: layerDetails['secondaryLayer']['title'] && layerDetails['secondaryLayer']['title'] || 'Secondary Map',
                    selectedLayers: layerDetails['secondaryLayer']['layers'],
                    display: layerDetails['secondaryLayer']['display']
                  },
                  'secondary');
                this.layersService.setApplyLayers({
                  type : 'secondary',
                  flag : true
                });
              } else {
                this.layersService.saveLayersSession(
                  {},
                  'secondary');
                this.layersService.setApplyLayers({
                  type : 'secondary',
                  flag : false
                });
              }

              /** This code to migrated the old media structure to new without affecting DB */
              const filterData = layerDetails?.filters?.data ? Helper.deepClone(layerDetails['filters']['data']) : {};
              if (filterData['mediaTypeList'] && filterData['mediaTypeList']['mediaParent'] !== 'undefined') {
                filterData['mediaTypeList']['selection'] = {};
                filterData['mediaTypeList']['pills'] = {};
                if (filterData['mediaTypeList']['ids']['medias'].length > 0 && filterData['mediaTypeList']['dataSource']) {
                  filterData['mediaTypeList']['ids']['medias'] = Helper.deepClone(filterData['mediaTypeList']['ids']['medias']);
                  filterData['mediaTypeList']['ids']['mediaTypes'] = [];
                  filterData['mediaTypeList']['pills']['medias'] = Helper.deepClone(filterData['mediaTypeList']['ids']['medias']);
                  filterData['mediaTypeList']['selection']['mediaTypes'] = false;
                  filterData['mediaTypeList']['selection']['medias'] = true;
                }
                if (filterData['mediaTypeList']['ids']['environments'].length > 0) {
                  filterData['mediaTypeList']['selection']['classification'] = true;
                  filterData['mediaTypeList']['pills']['classification'] = Helper.deepClone(filterData['mediaTypeList']['ids']['environments']);
                }
                layerDetails['filters']['data'] = filterData;
              }
              if (typeof filterData['measuresRelease'] === 'undefined' || filterData['measuresRelease'] === '') {
                if (typeof layerDetails['filters'] === 'undefined') {
                  layerDetails['filters'] = {'data' : {}, 'selection' : {}};
                }
                layerDetails['filters']['data']['measuresRelease'] = 2020;
                layerDetails['filters']['selection']['measuresRelease'] = true;
              }
              if (layerDetails['filters']) {
                this.filterService.resetAll();
                setTimeout(() => {
                  this.filterService.saveExploreSession(layerDetails['filters']);
                  this.filterService.setFilterFromView(layerDetails['filters']);
                  const pill = `Saved View:  ${layerDetails.name}`;
                  this.filterService.setFilterPill('saved view', pill);
                }, 500);
              }
            });
      } else {
        this.filterService.removeFilterPill('saved view');
      }
  }
  public clearAll() {
    this.layersService.saveLayersSession({
      title: this.layerType === 'primary' ? 'Primary Map' : 'Secondary Map',
      selectedLayers: []
    }, this.layerType);
    this.layersService.setApplyLayers({
      type : this.layerType,
      flag : false
    });
    this.layersService.setLoadView(false);
  }
  tabchange(event) {
    this.tabSelectedIndex = event;
  }

  public onChangeOfLayer(layers) {
    this.layers = layers;
  }
  public onChangeOfDisplayOption(displayOptions) {
    this.layerDisplayOptions = displayOptions;
    if (this.layerType === 'primary') {
      const primaryDisplaySession = JSON.parse(localStorage.getItem('layersSession'));
      primaryDisplaySession['display'] = displayOptions;
      localStorage.setItem('layersSession', JSON.stringify(primaryDisplaySession));
      this.layersService.setDisplayOptions(displayOptions);
    } else {
      const secondaryDisplaySession = JSON.parse(localStorage.getItem('secondaryLayersSession'));
      secondaryDisplaySession['display'] = displayOptions;
      localStorage.setItem('secondaryLayersSession', JSON.stringify(secondaryDisplaySession));
      this.layersService.setSecondaryDisplayOptions(displayOptions);
    }
  }
}
