import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { FiltersService } from 'app/explore/filters/filters.service';
import { InventoryService } from '@shared/services/inventory.service';
import { debounceTime, distinctUntilChanged, takeWhile, map, catchError, takeUntil, filter } from 'rxjs/operators';
import { Observable, of, forkJoin, Subject } from 'rxjs';
import {  CommonService, AuthenticationService } from '@shared/services';
import { PlacementType, PlaceType } from '@interTypes/inventory';
import { LazyLoaderService } from '@shared/custom-lazy-loader';
import {Helper} from '../../../classes';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { SummaryPanelActionService } from '../../../workspace-v3/summary-panel-action.service';
@Component({
  selector: 'app-media-types-filter-builder-w3',
  templateUrl: './media-types-filter-builder-w3.component.html',
  styleUrls: ['./media-types-filter-builder-w3.component.less']
})
export class MediaTypesFilterBuilderComponentW3
  implements OnInit, OnDestroy, AfterViewInit {
  private unsubscribe$ = new Subject();
  public selectedMaterial = '';
  public customInventoryAllowed: boolean;
  classTotalCount: number;
  constructionTotalCount: number;
  public selection = {
    classification: false,
    construction: false,
    medias: false,
    mediaTypes: false,
    material: false,
    placementType: false,
    placeType: false,
    placeName: false
  };
  cleatFilterTimer: any = null;
  loadedMediaName: boolean;
  loadedLoadedDigital: boolean;
  digitalCount: number;
  nonDigitalCount: number;
  materialMedias: {};
  enablePlacementType: boolean;
  enablePlaceType: boolean;
  selectedPlacementType: PlacementType[];
  selectedStructureType: any[] = [];
  selectedMediaClass: any[] = [];
  selectedMediaTypes: any[] = [];
  selectedOperatorMediaNames: any[] = [];
  selectedPlaceType: PlaceType[];
  @Input() public moduleName: string;
  @Output() dialogPopupState: any = new EventEmitter();
  @Input() mediaTypesDataForEdit: any;
  @Input() public mediaTypeFilters: Observable<any>;
  @Input() public includeType = 'dialog';
  editMediaTypes: boolean;
  public selectedPlaces: any = [];
  public selectedMediaTypeFilters: any = [];

  public placeNameLazyLoader = new LazyLoaderService();
  public structureTypeLazyLoader = new LazyLoaderService();
  public mediaClassLazyLoader = new LazyLoaderService();
  public mediaTypeLazyLoader = new LazyLoaderService();
  public operatorLazyLoader = new LazyLoaderService();
  public materialLazyLoader = new LazyLoaderService();
  siteName: any;

  constructor(
    private filterService: FiltersService,
    private inventoryService: InventoryService,
    private commonService: CommonService,
    private auth: AuthenticationService,
    private matSnackBar: MatSnackBar,
    private dialog: MatDialog,
    private summaryPanelAction: SummaryPanelActionService
  ) {}

  init() {
    this.filterService
      .getFilters()
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((response) => {
        const filters = {};
        const selectedFilters = {};
        if (response?.data?.mediaTypeList) {
          if (response.data.mediaTypeList?.ids) {
            selectedFilters['placeType'] =
              response['data']['mediaTypeList']['ids']['placeType'] || [];
            selectedFilters['placementType'] =
              response['data']['mediaTypeList']['ids']['placementType'] || [];
            this.selectedMaterial =
              response['data']['mediaTypeList']['ids']['material'];
          }
          if (response['data']['mediaTypeList']['selection']) {
            this.selection = response['data']['mediaTypeList']['selection'];
          }
        }
      });
  }

  ngOnInit() {
    const explorePermissions = this.auth.getModuleAccess('explore');
    this.siteName = this.commonService.getSiteName();
    this.customInventoryAllowed =
      explorePermissions?.features?.customInventories?.status === 'active';
    if (this.moduleName === 'project') {
      /* this.callingMediaTypeDataForScenarioMarketPlan();
      this.editMediaTypes = false;
      if (this.mediaTypesDataForEdit?.editData) {
        this.editMediaTypes = true;
      } */
      this.mediaTypeFilters.subscribe((mediaTypes) => {
        if (mediaTypes) {
          this.selectedMediaTypeFilters = mediaTypes.filter(media=>media);
        }
        this.dialogPopupState.emit(mediaTypes);
      });
    } else {
      this.init();
    }

    this.filterService
      .onReset()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((type) => {
        if (
          type === 'FilterInventory' ||
          type === 'All' ||
          type === 'mediaTypeList'
        ) {
          this.clearSelection();
        }
        if (
          type === 'FilterInventory' ||
          type === 'All'
        ) {
          this.selectedMediaTypeFilters = [];
          this.dialogPopupState.emit([]);
        }
      });
      if(this.includeType === 'sideBar') {
        this.summaryPanelAction.deleteMedia()
        .pipe(
          takeUntil(this.unsubscribe$)
        )
        .subscribe((data) => {
          const i = this.selectedMediaTypeFilters.findIndex((media) => media['data'] == data['data']);
          this.deleteMediaFilter(i);
        });
      }
  }

  ngAfterViewInit(): void {
    if (this.moduleName === 'project') {
      setTimeout(() => {
        this.inventoryService.clearButtonSource
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe((res) => {
            this.clearSelection();
          });
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  changeMaterial(event) {
    this.selection['material'] = true;
    this.selectedMaterial = event.value;
    /* if (this.moduleName === 'project') {
      this.applySelection();
    } */
  }

  selectUnselecctType(selectedCount, type) {
    if (selectedCount > 0) {
      this.selection[type] = true;
    } else {
      this.selection[type] = false;
    }
    /* if (this.moduleName === 'project') {
      this.applySelection();
    } */
  }

  selectedPlacementOption(option) {
    this.selectedPlacementType = option;
    if (option && option.length > 0) {
      this.selection['placementType'] = true;
    } else {
      this.selection['placementType'] = false;
    }
  }

  selectedPlaceTypeOption(option) {
    this.selectedPlaceType = option;
    if (option && option.length > 0) {
      this.selection['placeType'] = true;
    } else {
      this.selection['placeType'] = false;
    }
  }

  selectStructureTypeOption(structureTypes) {
    this.selectedStructureType = structureTypes;
    this.selectUnselecctType(structureTypes.length, 'construction');
  }

  selectMediaClassOption(mediaClasses) {
    this.selectedMediaClass = mediaClasses;
    this.selectUnselecctType(mediaClasses.length, 'classification');
  }

  selectMediaTypeOption(mediaTypes) {
    this.selectedMediaTypes = mediaTypes;
    this.selectUnselecctType(mediaTypes.length, 'mediaTypes');
  }

  selectOperatorMediaNameOption(operators) {
    this.selectedOperatorMediaNames = operators;
    this.selectUnselecctType(operators.length, 'medias');
  }
  isMediaTypeSelected() {
    return (
      this.selectedStructureType.length > 0 ||
      this.selectedMediaClass.length > 0 ||
      this.selectedMediaTypes.length > 0 ||
      this.selectedOperatorMediaNames.length > 0 ||
      (this.selectedMaterial !== '' && this.selectedMaterial !== null)
    );
  }

  applySelection(type = 'apply') {
    const selectedPills = {};

    selectedPills['classification'] = [];
    if (this.moduleName !== 'project' || this.selection['classification']) {
      if (this.selection['classification']) {
        selectedPills['classification'] = this.selectedMediaClass;
      }
    }

    selectedPills['place_type_name_list'] = [];
    if (this.moduleName !== 'project' && this.selection['placeType']) {
      this.selectedPlaceType.map((place) => {
        if (this.selection['placeType']) {
          selectedPills['place_type_name_list'].push(place);
        }
      });
    }

    selectedPills['placement_type_name_list'] = [];
    if (this.moduleName !== 'project' && this.selection['placementType']) {
      this.selectedPlacementType.map((placement) => {
        if (this.selection['placementType']) {
          selectedPills['placement_type_name_list'].push(placement);
        }
      });
    }

    if (this.moduleName !== 'project' && this.selection['placeName']) {
      selectedPills['place_id_list'] = this.selectedPlaces.map(
        (place) => place.place_name
      );
    }

    selectedPills['construction'] = [];
    if (this.moduleName !== 'project' || this.selection['construction']) {
      if (this.selection['construction']) {
        selectedPills['construction'] = this.selectedStructureType;
      }
    }

    selectedPills['medias'] = [];
    if (this.moduleName !== 'project' || this.selection['medias']) {
      if (this.selection['medias']) {
        selectedPills['medias'] = this.selectedOperatorMediaNames;
      }
    }

    selectedPills['mediaTypes'] = [];
    if (this.moduleName !== 'project' || this.selection['mediaTypes']) {
      if (this.selection['mediaTypes']) {
        selectedPills['mediaTypes'] = this.selectedMediaTypes;
      }
    }

    const filters = {
      medias: this.selectedOperatorMediaNames,
      environments: this.selectedMediaClass,
      construction: this.selectedStructureType,
      mediaTypes: this.selectedMediaTypes,
      material:
        this.moduleName !== 'project' || this.selection['material']
          ? this.selectedMaterial
          : '',
      placeType:
        this.moduleName !== 'project' || this.selection['placeType']
          ? selectedPills['place_type_name_list']
          : '',
      placementType:
        this.moduleName !== 'project' || this.selection['placementType']
          ? selectedPills['placement_type_name_list']
          : '',
      placeName:
        this.moduleName !== 'project' || this.selection['placeName']
          ? this.selectedPlaces.map((place) => place.id)
          : ''
    };
    selectedPills['material'] = [];
    if (this.moduleName === 'project') {
      if (this.selection['material']) {
        let material = '';
        if (this.selectedMaterial === 'true') {
          selectedPills['material'].push('Digital Only');
          material = 'digital';
        } else if (this.selectedMaterial === 'false') {
          selectedPills['material'].push('Printed/Mesh Only');
          material = 'nondigital';
        } else if (this.selectedMaterial === 'both') {
          selectedPills['material'].push('Digital & Printed/Mesh');
          material = 'both';
        }
        const medias = this.getMediaForMaterial(material);
        filters['material_medias'] = medias;
      }
    } else {
      if (this.selectedMaterial === 'true') {
        selectedPills['material'].push('Digital');
      } else if (this.selectedMaterial === 'false') {
        selectedPills['material'].push('Printed/Mesh');
      } else if (this.selectedMaterial === 'both') {
        selectedPills['material'].push('Digital & Printed/Mesh');
      }
    }
    if (this.moduleName === 'project') {
      const joinPills = Object.keys(selectedPills).reduce(function (r, k) {
        return r.concat(selectedPills[k]);
      }, []);
      if(joinPills.sort().join(', ').length){
        const mediaName = joinPills.sort().join(', ');
        if (
          this.selectedMediaTypeFilters.filter(
            (media) => media?.data === mediaName
          ).length <= 0
        ) {
          const mediaType = {
            state: type,
            data: mediaName,
            ids: filters,
            selection: Helper.deepClone(this.selection),
            edit: !!this.mediaTypesDataForEdit?.editData,
            index: this.mediaTypesDataForEdit?.index
          };
          this.selectedMediaTypeFilters.push(mediaType);
          this.dialogPopupState.emit(this.selectedMediaTypeFilters);
          this.filterService.resetFilter('mediaTypeList');
        } else {
          this.matSnackBar.open('Same Media & Placement already added.', 'DISMISS', {
            duration: 10000,
          });
        }
      }

    } else {
      this.filterService.setFilter('mediaTypeList', {
        ids: filters,
        pills: selectedPills,
        selection: this.selection,
        selectedPlaces: this.selectedPlaces
      });
    }
  }

  setMaterialMedias(value) {
    this.materialMedias = value;
  }

  getMediaForMaterial(type) {
    let medias = [];
    if (type !== 'both') {
      medias = this.materialMedias[type];
    } else {
      medias = this.materialMedias['digital'];
      medias.push(...this.materialMedias['nondigital']);
    }
    return medias;
  }

  callingMediaTypeDataForScenarioMarketPlan() {
    const response = {};
    let selected = [];

    let selectedFilters = {
      medias: [],
      material: ''
    };
    this.selection = {
      classification: false,
      construction: false,
      medias: false,
      mediaTypes: false,
      material: false,
      placementType: false,
      placeType: false,
      placeName: false
    };
    if (this.mediaTypesDataForEdit?.editData) {
      if (this.mediaTypesDataForEdit.editData?.['ids']) {
        selectedFilters = this.mediaTypesDataForEdit.editData['ids'];
        this.selectedMaterial = this.mediaTypesDataForEdit.editData['ids'][
          'material'
        ];
      }
      if (this.mediaTypesDataForEdit.editData['selection']) {
        this.selection = this.mediaTypesDataForEdit.editData['selection'];
      }
      /** This block is to handld old Market Plans. In old marmet plan data media are array. Now we changed to Tree object */
      if (
        this.mediaTypesDataForEdit.editData['ids'] &&
        Array.isArray(this.mediaTypesDataForEdit.editData['ids']['medias'])
      ) {
        if (
          this.mediaTypesDataForEdit.editData['ids']['environments'].length > 0
        ) {
          this.selection['classification'] = true;
        }
        if (
          (this.mediaTypesDataForEdit.editData['isDigital'] !== undefined &&
            this.mediaTypesDataForEdit.editData['isDigital']) ||
          (this.mediaTypesDataForEdit.editData['isNonDigital'] !== undefined &&
            this.mediaTypesDataForEdit.editData['isNonDigital'])
        ) {
          selected = [];
          if (
            this.mediaTypesDataForEdit.editData['isDigital'] &&
            this.mediaTypesDataForEdit.editData['isNonDigital']
          ) {
            this.selectedMaterial = selectedFilters['material'] = 'both';
          } else {
            this.selectedMaterial = selectedFilters['material'] =
              (this.mediaTypesDataForEdit.editData['isDigital'] && 'true') ||
              'false';
          }
          this.selection['material'] = true;
        } else if (
          this.mediaTypesDataForEdit.editData['ids']['medias'].length > 0
        ) {
          this.selection['medias'] = true;
        }
      }
    }
  }

  public clearSelection(type = 'explore') {
    this.selection = {
      classification: false,
      construction: false,
      medias: false,
      mediaTypes: false,
      material: false,
      placementType: false,
      placeType: false,
      placeName: false
    };
    this.selectedMaterial = null;
    this.selectedStructureType = [];
    this.selectedMediaClass = [];
    this.selectedMediaTypes = [];
    this.selectedOperatorMediaNames = [];
    if (this.moduleName === 'project') {
      this.filterService.clearFilter('mediaTypeList', true);
      if (type === 'project') {
        this.filterService.resetFilter('mediaTypeList');
      }
      /* this.dialogPopupState.emit({
        state: 'clear'
      }); */
    } else {
      this.filterService.clearFilter('mediaTypeList', true);
    }
  }
  /*
Will remove if user no need parent checkbox in workspace.
  changeParentcheckbox(type, refCheckbox) {
    if (this.moduleName === 'project') {
      switch (type) {
        case 'classification':
          if (!refCheckbox['_checked']) {
            this.classificationTypes.map(c => c.selected = true);
          } else {
            this.classificationTypes.map(c => c.selected = false);
          }
        break;
        case 'construction':
          if (!refCheckbox['_checked']) {
            this.constructionTypes.map(c => c.selected = true);
          } else {
            this.constructionTypes.map(c => c.selected = false);
          }
        break;
        case 'mediaTypes':
          if (!refCheckbox['_checked']) {
            this.mediaTypes.map(c => c.selected = true);
          } else {
            this.mediaTypes.map(c => c.selected = false);
          }
        break;
        case 'medias':
          if (!refCheckbox['_checked']) {
            this.mediaNames.map(c => c.selected = true);
          } else {
            this.mediaNames.map(c => c.selected = false);
          }
        break;
        default:
          break;
      }
    }
  }
*/

  public updatePlaceNameFilterSelection(selectedPlaces) {
    this.selectedPlaces = selectedPlaces;
    if (this.selectedPlaces && this.selectedPlaces.length > 0) {
      this.selection['placeName'] = true;
    } else {
      this.selection['placeName'] = false;
    }
  }

  public deleteMediaFilter(i) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(filter((result) => result && result.action))
      .subscribe((result) => {
        this.selectedMediaTypeFilters.splice(i, 1);
        this.dialogPopupState.emit(this.selectedMediaTypeFilters);
      });
  }

}
