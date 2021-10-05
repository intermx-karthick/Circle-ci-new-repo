import { ChangeDetectionStrategy, Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { concatMap, catchError, takeUntil, map } from 'rxjs/operators';
import { EMPTY, of, Subject } from 'rxjs';
import { MatSnackBarConfig } from '@angular/material/snack-bar/snack-bar-config';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  InventoryService,
  ThemeService,
  ExploreDataService,
  CommonService
} from '@shared/services';
import { InventoryDetailViewLayoutComponent } from '../explore-inventory-popup/inventory-detail-view-layout/inventory-detail-view-layout.component';
import { PopupService } from '@shared/popup';
import { InventoryDetailViewComponent } from '../explore-inventory-popup/inventory-detail-view/inventory-detail-view.component';
import { Helper } from 'app/classes';
import {
  ClosedInventoryFormPayload,
  CreateInventoryResponse,
} from '@interTypes/inventory-management';
import { CreateInventoryPayloadBuilder } from './create-inventory-payload.builder';
import { ErrorHandlerResponse } from '@interTypes/error-handler.response';
import { CreateInventoryComponent } from './components';
import { CreateInventoryPayload } from './create-inventory.payload';

@Component({
  selector: 'app-inventory-management',
  templateUrl: './inventory-management.component.html',
  styleUrls: ['./inventory-management.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryManagementComponent implements OnInit, OnDestroy {
  selectedTab = 0;
  mapObj;

  private unSubscribe: Subject<void> = new Subject<void>();
  private data = null;

  constructor(
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    private dialog: MatDialog,
    private inventoryAPI: InventoryService,
    private matSnackBar: MatSnackBar,
    private theme: ThemeService,
    private exploreDataService: ExploreDataService,
    public popupService: PopupService,
    public common: CommonService
  ) {
    const iconURL = 'assets/images/icons/laptop-medical-solid.svg';
    iconRegistry.addSvgIcon('laptop-medical',
      sanitizer.bypassSecurityTrustResourceUrl(iconURL)
    );
  }

  static getInventoryFormDialogConfig(): MatDialogConfig {
    return {
      width: '65vw',
      height: '80vh',
      maxWidth: '950px',
      maxHeight: '830px',
      data: null,
      autoFocus: false,
      panelClass: 'create-inventory',
      disableClose: true
    };
  }

  static getSnackBarConfig(): MatSnackBarConfig {
    return {
      duration: 5000,
    };
  }

  /**
   * @description
   *    Formate inventory payload by using closed inventory
   *  dialog payload.
   *
   * @param data - {@type ClosedInventoryFormPayload}
   */
  static formatCreateInventoryPayload(data: ClosedInventoryFormPayload): CreateInventoryPayload {
    if (!data) {
      return;
    }
    return new CreateInventoryPayloadBuilder()
      .setValuesFromGeneralForm(data.general)
      .setValuesFromNameAndAttrForm(data.nameAndAttr)
      .setValuesFromMediaClassForm(data.mediaClass)
      .setValuesFromMaterialForm(data.materialDetails)
      .setLayouts(data)
      .setLocation(data)
      .setRepresentations(data)
      .setConstruction(data)
      .build();
  }

  ngOnInit(): void {
    this.exploreDataService.getMapObject().pipe(takeUntil(this.unSubscribe)).subscribe(mapObject => {
      this.mapObj = mapObject;
    });
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  /**
   * @description
   *  Opening inventory form dialog and submit the data
   *  to create inventory once its closed by submit after
   *  that showing off that data in inventory details sheet
   *  dialog box.
   *
   */
  openCreateInventoryForm() {
    const config = InventoryManagementComponent.getInventoryFormDialogConfig();
    this.dialog.open<CreateInventoryComponent, null, ClosedInventoryFormPayload>(CreateInventoryComponent, config)
      .afterClosed()
      .pipe(
        map(closedFormPayload => InventoryManagementComponent.formatCreateInventoryPayload(closedFormPayload)),
        concatMap(payload => {
          return this.submitCreatedInventoryFormData(payload).pipe(
            // when internally error happens not from ajax call from code level exception
            catchError(_ => of({ error: { message: 'Something went wrong', status: 0 }, data: null } as ErrorHandlerResponse)),
            map(res => ({ res, payload }))
          );
        })
      )
      .subscribe(result => {
        // if closed by close icon
        if (!result.res) {
          return;
        }
        this.handleSubmitInventoryFormResponse(result);
      });
  }

  private submitCreatedInventoryFormData(payload: CreateInventoryPayload) {
    if (!payload) {
      return EMPTY;
    }
    return this.inventoryAPI.createInventory(payload, false);
  }

  /**
   * @description
   *   Handling response and opening inventory details sheet
   *  dialog
   * @param res
   * @param payload
   */
  private handleSubmitInventoryFormResponse({ res, payload }
                                              : { res: CreateInventoryResponse, payload: CreateInventoryPayload }) {
    if ((res as ErrorHandlerResponse).error) {
      const errorRes = res as ErrorHandlerResponse;
      this.showsAlertMessage(errorRes?.error?.message);
      return;
    }
    
    this.showsAlertMessage('New inventory for vendor created');
    this.displayInventory(payload);
  }


  private showsAlertMessage(msg) {
    const config = InventoryManagementComponent.getSnackBarConfig();
    this.matSnackBar.open(msg, 'close', {
      ...config
    });
  }

  /**
   * This method is to display the created inventory
   * @param data this should be form data object
   */
  private displayInventory(data) {
    const formData = Helper.deepClone(data);
    const feature = this.inventoryAPI.formatFeatureForDisplay(formData);
    const themeSettings = this.theme.getThemeSettings();
    const miniLogo = themeSettings['logo']['mini_logo'];
    let staticMapURL = '';
    if (feature?.location?.geometry) {
      staticMapURL = this.exploreDataService.getStaticMapImage(feature.location.geometry.coordinates, 243, 145);
    }
    const layerSession = JSON.parse(localStorage.getItem('layersSession'));
    let mapStyle = '';
    if (layerSession?.display?.baseMap) {
      mapStyle = layerSession.display.baseMap;
    } else {
      mapStyle = themeSettings['basemaps'].find(style => style.default)['label'];
    }
    const preferences = this.common.getUserPreferences();
    const measures_release = preferences?.measures_release || 2021;
    const inventoryInformation = {
      feature: feature,
      type: 'map',
      portraitView: false,
      staticMapURL: staticMapURL,
      openedInventoryDetail: true,
      miniLogo: miniLogo,
      mapStyle: mapStyle,
      layerType: 'primary',
      displayMeasures: false,
      measures_release: measures_release
    };

    if (themeSettings.site === 'omg') {
      this.dialog.open(InventoryDetailViewLayoutComponent, {
        width: '1030px',
        data: inventoryInformation,
        backdropClass: 'hide-backdrop',
        panelClass: 'inventory-detail-dialog'
      });

    } else {
      inventoryInformation['portraitView'] = true;
      const mapContainer = this.mapObj?.getContainer();
      this.popupService.open(InventoryDetailViewComponent, {
        id: mapContainer?.id as string,
        data: inventoryInformation,
        originEl: null,
      });
    }
  }

}
