import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import {LoaderService} from '../../services/loader.service';
import * as html2canvas from '../../../../assets/js/htmltocanvas.js';
import {ThemeService} from '@shared/services/theme.service';
import {AuthenticationService} from '@shared/services/authentication.service';
import {WorkflowLables} from '@interTypes/workspaceV2';
import {CommonService} from '@shared/services/common.service';
import {LazyLoaderService} from '@shared/custom-lazy-loader';

@Component({
  selector: 'app-action-menu-template',
  templateUrl: './action-menu-template.component.html',
  styleUrls: ['./action-menu-template.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionMenuTemplateComponent implements OnInit {
  mod_permission: any;
  allowInventory: any = '';
  public allowScenarios = '';
  allowInventoryAudience: any = '';
  audienceLicense = {};
  themeSettings: any;
  isPublicSite: boolean;
  public workflowLabels: WorkflowLables;

  @Input() public module = '';
  @Output() resetAll = new EventEmitter();

  /** This input used to set the printable element */
  @Input() printConatiner = 'printContent';
  loadSavedScenarioLazyLoader = new LazyLoaderService();

  constructor(
    private loaderService: LoaderService,
    private cdRef: ChangeDetectorRef,
    private theme: ThemeService,
    private authentication: AuthenticationService,
    public commonService: CommonService
  ) {
    this.workflowLabels = this.commonService.getWorkFlowLabels();

  }

  ngOnInit(): void {
    this.mod_permission = this.authentication.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory'][
      'status'
      ];
    this.allowScenarios = this.authentication.getModuleAccess('v3workspace')[
      'status'
      ];
    this.audienceLicense = this.authentication.getModuleAccess(
      'gpAudience'
    );
    this.themeSettings = this.theme.getThemeSettings();
    this.allowInventoryAudience = this.audienceLicense['status'];
    if (this.themeSettings.publicSite) {
      this.isPublicSite = true;
    } else {
      this.isPublicSite = false;
    }
    this.cdRef.markForCheck();
  }

  public clearView() {
    this.resetAll.emit();
  }

  public printView() {
    this.loaderService.display(true);
    const element = document.getElementById(this.printConatiner);
    html2canvas(element, {
      removeContainer: true,
      imageTimeout: 0,
      useCORS: true,
      logging: false,
      onclone: function (document) {
        const filterContainer = document.querySelector('.filter-container');
        if (filterContainer) {
          filterContainer.style.display = 'none';
        }
        const filterToggleLeft = document.querySelector('.filter-toggle-left');
        if (filterToggleLeft) {
          filterToggleLeft.style.display = 'none';
        }
        const gridToggle = document.querySelector('.grid-toggle');
        if (gridToggle) {
          gridToggle.style.display = 'none';
        }
        const secondaryMapToggle = document.querySelector(
          '.secondary-map-close'
        );
        if (secondaryMapToggle) {
          secondaryMapToggle.style.display = 'none';
        }

        const mapboxglControlContainer = document.querySelector(
          '.mapboxgl-control-container'
        );
        if (mapboxglControlContainer) {
          mapboxglControlContainer.style.display = 'none';
        }
        const placesFilterMain = document.querySelector('.places-filter-main');
        if (placesFilterMain) {
          placesFilterMain.style.display = 'none';
        }
        const libraryNavigation = document.querySelector('.library-navigation');
        if (libraryNavigation) {
          libraryNavigation.style.display = 'none';
        }
        const populationTableToggle = document.querySelector(
          '.population-tabular-toggle-button'
        );
        if (populationTableToggle) {
          populationTableToggle.style.display = 'none';
        }
        const mapboxTopLeftControl = document.querySelector(
          '.mapboxgl-ctrl-top-left'
        );
        if (mapboxTopLeftControl) {
          mapboxTopLeftControl.style.display = 'none';
        }
        document.querySelectorAll('.mapboxgl-control-container')
          .forEach(function (el) {
            el.style.display = 'none';
          });
        document.querySelectorAll('.mapboxgl-ctrl-locate-me')
          .forEach(function (el) {
            el.style.display = 'none';
          });
        const mapboxBottomLeftControl = document.querySelector(
          '.mapboxgl-ctrl-bottom-left'
        );
        if (mapboxBottomLeftControl) {
          mapboxBottomLeftControl.style.display = 'none';
        }
        document.querySelectorAll('.map-zoom-out')
          .forEach(function (el) {
            el.style.display = 'none';
          });
        const exploreTableToggle = document.querySelector(
          '.explore-tabular-toggle-button'
        );
        if (exploreTableToggle) {
          exploreTableToggle.style.display = 'none';
        }
        const secondaryMapSyncButton = document.querySelector(
          '.map-sync-btn-secondary'
        );
        if (secondaryMapSyncButton) {
          secondaryMapSyncButton.style.display = 'none';
        }
        const topGeographyAction = document.querySelector(
          '.map-top-zip-market.map-action-button'
        );
        if (topGeographyAction) {
          topGeographyAction.style.display = 'none';
        }
        const mapLegendToggle = document.querySelector(
          '.key-legend-map-control'
        );
        if (mapLegendToggle) {
          mapLegendToggle.style.display = 'none';
        }
        const secondaryMapContainerControl = document.querySelector(
          '#mapSecondary .mapboxgl-control-container'
        );
        if (secondaryMapContainerControl) {
          secondaryMapContainerControl.style.display = 'none';
        }
        const secondaryMapLegendToggle = document.querySelector(
          '.key-legend-map-control-secondary'
        );
        if (secondaryMapLegendToggle) {
          secondaryMapLegendToggle.style.display = 'none';
        }
        const mapTimestamp = document.querySelector('.map-time-stamp');
        if (mapTimestamp) {
          mapTimestamp.style.display = 'block';
        }
        const mapboxGlControl = document.querySelector('.mapboxgl-ctrl');
        if (mapboxGlControl) {
          mapboxGlControl.style.display = 'none';
        }
        const mapKeyLegend = document.querySelector('.map-key-legend');
        if (mapKeyLegend !== null) {
          mapKeyLegend.style.display = 'none';
        }
        const mapKeyLegendClose = document.querySelector('.legend-header i');
        if (mapKeyLegendClose !== null) {
          mapKeyLegendClose.style.display = 'none';
        }
        const keyLegends = document.querySelector('.key-legends');
        if (keyLegends != null) {
          keyLegends.classList.add('left70');
        }
      }
    }).then(
      (canvas) => {
        // document.body.appendChild(canvas);
        this.loaderService.display(false);
        const dataImage = canvas.toDataURL();

        const printStyle = document.getElementById('printScreen');
        const el_printBrinding = document.getElementById(
          'printBranding'
        );
        if (printStyle !== null) {
          printStyle.remove();
        }
        if (el_printBrinding !== null) {
          el_printBrinding.remove();
        }
        const body = document.getElementsByTagName('body')[0];
        const el = document.createElement('img');
        el.src = dataImage;
        el.id = 'printScreen';
        el.style.display = 'none';
        el.style.marginLeft = '-18px';
        el.style.width = '100%';
        body.appendChild(el);
        const content = document.createElement('div');
        content.id = 'printBranding';
        content.style.display = 'none';
        content.innerHTML = `<hr style="margin-right: 20px;"><p style="margin-right: 20px; color: var(--high-emphasis);">Established in 1933, Geopath is a not-for-profit organization governed by a tripartite board comprised of advertisers, agencies and media companies. Geopath uses mobile location data and research methodologies to measure and analyze audience location and show how consumers engage with out-of-home advertising.</p>  <p style="display: flex;flex-direction: row;place-content: space-between;margin-top: 20px; color: var(--high-emphasis);">
        <span>To become a member or find out more information email <span  style="color:var(--blue-color);">geekout@geopath.org.</span><br> Give us a ring at 212.972.8075 or visit our website at <span style="color:var(--blue-color);">www.geopath.org</span> now.
        </span><span><img src="./assets/images/geopath_black_logo.png" alt="Geopath Help Center home page" style="height: 50px;margin-right: 10px;"></span>
        </p>`;
        body.appendChild(content);
        setTimeout(() => {
          window.print();
        }, 150);
        document.getElementById('printContent').click();
        //$('#printContent').click();
      },
      (err) => {
        this.loaderService.display(false);
      }
    );
  }
}
