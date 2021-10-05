import { InventorySpot } from './../../Interfaces/inventory';
import { Injectable } from '@angular/core';
import {WorkflowLables} from '@interTypes/workspaceV2';

import { BehaviorSubject, Subject, Observable } from 'rxjs';
import swal from 'sweetalert2';
import { FormControl, FormGroup } from '@angular/forms';
import { ThemeService } from './theme.service';
import { AuthenticationService } from './authentication.service';
import { SpotReference, Measure, Representation } from '@interTypes/inventorySearch';
import { CustomizedSpot } from '@interTypes/inventory';
import { FormatService } from './format.service';
import { Orientation } from 'app/classes/orientation';
import { InventoryService } from './inventory.service';
import { HttpClient } from '@angular/common/http';
import { AppConfig } from 'app/app-config.service';

@Injectable({providedIn: 'root'})
export class CommonService {
  public homeClicked = new Subject();
  private breadcrumbs = new BehaviorSubject([]);
  private workSpaceURL = new BehaviorSubject('');
  private mobileBreakPoint = new BehaviorSubject('');
  locateRedirectURL = 'https://support.geopath.io/hc/en-us/articles/360004970151-Locate-Me-not-working-';
  private dropdownState = new Subject();
  private styles = [];
  private mediaTypes;
  private classificationTypes;
  public subProjects: any[];
  public subProjectAccess: any;
  private constructionTypes;
  private materialCounts;
  private mediaNameTypes;
  private dataVersionChange = new BehaviorSubject(2020);
  private summaryCustomColumns = new Subject();
  constructor(
    private theme: ThemeService,
    private auth: AuthenticationService,
    private formatService: FormatService,
    private inventoryService: InventoryService,
    private http: HttpClient,
    private config: AppConfig,
  ) {
  }
  public currentUrl: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  updateCurrentUrl(value: string) {
    this.currentUrl.next(value);
  }


  /**
   * Returns static styles data for mapbox
   * @returns {any[]}
   */
  public getStylesData(color = '') {
    const themeSettings = this.theme.getThemeSettings();
    if (themeSettings) {
      this.styles = [
        // ACTIVE (being drawn)
        // line stroke
        {
          'id': 'gl-draw-line',
          'type': 'line',
          'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'draw_polygon']],
          'layout': {
            'line-cap': 'round',
            'line-join': 'round'
          },
          'paint': {
            'line-color': color !== '' ? color : themeSettings.color_sets.highlight.base,
            'line-dasharray': [0.2, 2],
            'line-width': 2
          }
        },
        // polygon fill
        {
          'id': 'gl-draw-polygon-fill',
          'type': 'fill',
          'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'draw_polygon']],
          'paint': {
            'fill-color':  color !== '' ? color : themeSettings.color_sets.highlight.base,
            'fill-outline-color':  color !== '' ? color : themeSettings.color_sets.highlight.base,
            'fill-opacity': 0.01
          }
        },
        // polygon outline stroke
        // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
        {
          'id': 'gl-draw-polygon-stroke-active',
          'type': 'line',
          'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'draw_polygon']],
          'layout': {
            'line-cap': 'round',
            'line-join': 'round'
          },
          'paint': {
            'line-color':  color !== '' ? color : themeSettings.color_sets.highlight.base,
            'line-dasharray': [0.2, 2],
            'line-width': 2
          }
        },
        // vertex point halos
        {
          'id': 'gl-draw-polygon-and-line-vertex-halo-active',
          'type': 'circle',
          'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'draw_polygon']],
          'paint': {
            'circle-radius': 5,
            'circle-color': '#FFF'
          }
        },
        // vertex points
        {
          'id': 'gl-draw-polygon-and-line-vertex-active',
          'type': 'circle',
          'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'draw_polygon']],
          'paint': {
            'circle-radius': 3,
            'circle-color':  color !== '' ? color : themeSettings.color_sets.highlight.base,
          }
        },

        // INACTIVE (static, already drawn)
        // line stroke
        {
          'id': 'gl-draw-line-static',
          'type': 'line',
          'filter': ['all', ['==', '$type', 'LineString'], ['==', 'mode', 'draw_polygon']],
          'layout': {
            'line-cap': 'round',
            'line-join': 'round'
          },
          'paint': {
            'line-color':  color !== '' ? color : themeSettings.color_sets.highlight.base,
            'line-dasharray': [0.2, 2],
            'line-width': 2
          }
        },
        // polygon fill
        {
          'id': 'gl-draw-polygon-fill-static',
          'type': 'fill',
          'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'draw_polygon']],
          'paint': {
            'fill-color':  color !== '' ? color : themeSettings.color_sets.highlight.base,
            'fill-outline-color':  color !== '' ? color : themeSettings.color_sets.highlight.base,
            'fill-opacity': 0.01
          }
        },
        // polygon outline
        {
          'id': 'gl-draw-polygon-stroke-static',
          'type': 'line',
          'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'draw_polygon']],
          'layout': {
            'line-cap': 'round',
            'line-join': 'round'
          },
          'paint': {
            'line-color':  color !== '' ? color : themeSettings.color_sets.highlight.base,
            'line-dasharray': [0.2, 2],
            'line-width': 2
          }
        },

        // static mode polygon
        // fill color
        {
          'id': 'gl-draw-polygon-fill-inactive',
          'type': 'fill',
          'filter': ['all', ['==', 'active', 'false'],
            ['==', '$type', 'Polygon'],
            ['!=', 'mode', 'static']
          ],
          'paint': {
            'fill-color': [
              'case',
              ['==', ['get', 'user_areaType'], 'building'], '#2196F3',
              ['==', ['get', 'user_areaType'], 'property'], '#DD6666',
              themeSettings.color_sets.highlight.base
            ],
            'fill-outline-color': [
              'case',
              ['==', ['get', 'user_areaType'], 'building'], '#2196F3',
              ['==', ['get', 'user_areaType'], 'property'], '#DD6666',
              themeSettings.color_sets.highlight.base
            ],
            // 'fill-color': themeSettings.color_sets.highlight.base,
            // 'fill-outline-color': themeSettings.color_sets.highlight.base,
            'fill-opacity': 0.5
          }
        },
        // polygon outline
        {
          'id': 'gl-draw-polygon-stroke-inactive',
          'type': 'line',
          'filter': ['all', ['==', 'active', 'false'],
            ['==', '$type', 'Polygon'],
            ['!=', 'mode', 'static']
          ],
          'layout': {
            'line-cap': 'round',
            'line-join': 'round'
          },
          'paint': {
            'line-color': [
              'case',
              ['==', ['get', 'user_areaType'], 'building'], '#2196F3',
              ['==', ['get', 'user_areaType'], 'property'], '#DD6666',
              themeSettings.color_sets.highlight.base
            ],
            'line-width': 2
          }
        },
      ];
    }
    return this.styles;
  }
  public isMobile() {
    return (/iphone|ipod|android|ie|blackberry|fennec/)
      .test(navigator.userAgent.toLowerCase());
  }

  validateFormGroup(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({
          onlySelf: true
        });
      } else if (control instanceof FormGroup) {
        this.validateFormGroup(control);
      }
    });
  }

  confirmExit(form: FormGroup,
    message: string = 'Your changes to this project have not been saved. Do you want to leave without saving?',
    title: string = 'Are you sure?',
    primaryText: string = 'Yes, Leave This Page',
    secondaryText: string = 'No, Stay on This Page'
  ) {
    if (form.dirty) {
      return new Promise((resolve, reject) => {
        swal({
          title: title,
          text: message,
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: primaryText,
          cancelButtonText: secondaryText,
          confirmButtonClass: 'waves-effect waves-light',
          cancelButtonClass: 'waves-effect waves-light'
        }).then(result => {
          if (result.value) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    } else {
      return true;
    }
  }
  public getBreadcrumbs(): Observable<any> {
    return this.breadcrumbs.asObservable();
  }
  public setBreadcrumbs(val) {
    return this.breadcrumbs.next(val);
  }
  // Commented on 09/04/2019 due to not used
  /*
  public findMarketByID(id) {
    const markets = JSON.parse(localStorage.getItem('markets'));
    if (markets) {
      const found = markets.find(function (market) {
        return market.id === id;
      });
      if (typeof found !== 'undefined') {
        return found['name'];
      } else {
        return '';
      }
      return '';
    }
  }*/
  getMapBoundingBox(map) {
    const lat = map.getBounds();
    const multiPolygon = {
      type: 'MultiPolygon',
      coordinates: [[]]
    };
    const bound = [];
    bound.push(lat.getSouthWest().toArray());
    bound.push(lat.getNorthEast().toArray());
    // bound.push(lat.getNorthWest().toArray());
    // bound.push(lat.getSouthEast().toArray());
    // bound.push(lat.getNorthEast().toArray());
    multiPolygon.coordinates[0].push(bound);
    return multiPolygon;
  }

  locateMePlacesMap() {
    const self = this;
    const placesMapBtn = document.querySelector('.mapboxgl-ctrl-locate') as HTMLButtonElement;
    if (placesMapBtn) {
      placesMapBtn.addEventListener('click',
        function (e) {
            self.navigateToplaces(e);
          return false;
      });
    }
  }

  locateMePrimaryMap() {
    const self = this;
    const primaryMapBtn = document.querySelector('#map-div-block-primary .mapboxgl-ctrl-locate') as HTMLButtonElement;
    if (primaryMapBtn) {
      primaryMapBtn.addEventListener('click',
        function (e) {
            self.locateMeCurrentlocation(e);
          return false;
      });
    }
  }

  locateMeSecondaryMap() {
    const self = this;
    const secondaryMapBtn = document.querySelector('#map-div-block-secondary .mapboxgl-ctrl-locate') as HTMLButtonElement;
    if (secondaryMapBtn) {
      secondaryMapBtn.addEventListener('click',
        function (e) {
            self.locateMeCurrentlocation(e);
          return false;
      });
    }
  }

  locateMeCurrentlocation(event) {
    const secondaryLayer = JSON.parse(localStorage.getItem('secondaryLayersSession'));
    const self = this;
    if (secondaryLayer && secondaryLayer['display'] && secondaryLayer['display']['syncZoomPan'] ) {
      const primaryMapBtn = document.querySelector('#map-div-block-primary .mapboxgl-ctrl-locate') as HTMLButtonElement;

      const secondaryMapBtn = document.querySelector('#map-div-block-secondary .mapboxgl-ctrl-locate') as HTMLButtonElement;
      if (primaryMapBtn.classList.contains('mapboxgl-ctrl-locate-active')
       && secondaryMapBtn.classList.contains('mapboxgl-ctrl-locate-active')) {
        self.changeActiveLocation('#map-div-block-primary');
        setTimeout(() => {
          self.changeActiveLocation('#map-div-block-secondary');
        }, 1000);
      } else if (primaryMapBtn.classList.contains('mapboxgl-ctrl-locate-active')) {

        self.changeActiveLocation('#map-div-block-primary');
      } else if (secondaryMapBtn.classList.contains('mapboxgl-ctrl-locate-active')) {

        self.changeActiveLocation('#map-div-block-secondary');
      } else {
        self.navigateToLocation(event, '#map-div-block-primary');
        setTimeout(() => {
          self.navigateToLocation(event, '#map-div-block-secondary');
        }, 500);
      }
    } else {
      if (event.target && !event.target.classList.contains('secondary')) {
        self.navigateToLocation(event, '#map-div-block-primary');
      } else {
        self.navigateToLocation(event, '#map-div-block-secondary');
      }
    }
  }

  changeActiveLocation(selectedbtn) {
      const self = this;
      const mapboxLocateElement = document.querySelector(selectedbtn + ' .mapboxgl-ctrl-locate') as HTMLButtonElement;
      const geoLocateButton = document.querySelector(selectedbtn + ' .mapboxgl-ctrl-geolocate') as HTMLButtonElement;
      if (mapboxLocateElement.classList.contains('mapboxgl-ctrl-locate-active')) {
        geoLocateButton.click();
        mapboxLocateElement.classList.remove('mapboxgl-ctrl-geolocate-waiting');
        mapboxLocateElement.classList.remove('mapboxgl-ctrl-locate-active');
        setTimeout(function () {
          let cls = geoLocateButton.className;
          let sectionClass = '';
          if (selectedbtn === '#map-div-block-primary') {
            sectionClass = 'primary';
          } else {
            sectionClass = 'secondary';
          }

          cls = cls.replace('mapboxgl-ctrl-geolocate', 'mapboxgl-ctrl-locate ' + sectionClass);
          cls = cls.replace('mapboxgl-ctrl-geolocate-active', 'mapboxgl-ctrl-locate-active');
          cls = cls.replace('mapboxgl-ctrl-geolocate-waiting', '');

         mapboxLocateElement.className = cls;
        }, 500);
      }
  }


  navigateToLocation(event, selectedbtn) {
    const self = this;
    const mapboxLocateElement = document.querySelector(selectedbtn + ' .mapboxgl-ctrl-locate') as HTMLButtonElement;
    const geoLocateButton = document.querySelector(selectedbtn + ' .mapboxgl-ctrl-geolocate') as HTMLButtonElement;
    if (window.navigator.geolocation) {
      if (mapboxLocateElement.classList.contains('mapboxgl-ctrl-locate-active')) {
        geoLocateButton.click();
        mapboxLocateElement.classList.remove('mapboxgl-ctrl-geolocate-waiting');
        mapboxLocateElement.classList.remove('mapboxgl-ctrl-locate-active');
        setTimeout(function () {
          let cls = geoLocateButton.className;
          let sectionClass = '';

          if (selectedbtn === '#map-div-block-primary') {
            sectionClass = 'primary';
          } else {
            sectionClass = 'secondary';
          }
          cls = cls.replace('mapboxgl-ctrl-geolocate', 'mapboxgl-ctrl-locate ' + sectionClass);
          cls = cls.replace('mapboxgl-ctrl-geolocate-active', 'mapboxgl-ctrl-locate-active');
          cls = cls.replace('mapboxgl-ctrl-geolocate-waiting', '');
          mapboxLocateElement.className = cls;
        }, 500);
      } else {

        mapboxLocateElement.classList.add('mapboxgl-ctrl-geolocate-waiting');
        geoLocateButton.click();
        // setTimeout(() => {
          let sectionClass = '';
          if (selectedbtn === '#map-div-block-primary') {
            sectionClass = 'primary';
          } else {
            sectionClass = 'secondary';
          }
          let cls = geoLocateButton.className;
          cls = cls.replace('mapboxgl-ctrl-geolocate', 'mapboxgl-ctrl-locate ' + sectionClass);
          cls = cls.replace('mapboxgl-ctrl-geolocate-active', 'mapboxgl-ctrl-locate-active');
          cls = cls.replace('mapboxgl-ctrl-geolocate-waiting', '');
          mapboxLocateElement.className = cls;
        // }, 500);
        window.navigator.geolocation.getCurrentPosition(function (position) {}, function (error) {
          self.showNavigationAlert();
        });
      }
    } else {
      self.showNavigationAlert();
    }
  }

  /** places module navigate to cuttent location */
  navigateToplaces(event) {
    const self = this;
    const mapboxLocateElement = document.querySelector('.mapboxgl-ctrl-locate') as HTMLButtonElement;
    const geoLocateButton = document.querySelector('.mapboxgl-ctrl-geolocate') as HTMLButtonElement;
    if (window.navigator.geolocation) {
      if (mapboxLocateElement.classList.contains('mapboxgl-ctrl-locate-active')) {
        geoLocateButton.click();
        mapboxLocateElement.classList.remove('mapboxgl-ctrl-geolocate-waiting');
        mapboxLocateElement.classList.remove('mapboxgl-ctrl-locate-active');
        setTimeout(function () {
          let cls = geoLocateButton.className;
          cls = cls.replace('mapboxgl-ctrl-geolocate', 'mapboxgl-ctrl-locate primary');
          cls = cls.replace('mapboxgl-ctrl-geolocate-active', 'mapboxgl-ctrl-locate-active');
          cls = cls.replace('mapboxgl-ctrl-geolocate-waiting', '');
          mapboxLocateElement.className = cls;
        }, 500);
      } else {
        mapboxLocateElement.classList.add('mapboxgl-ctrl-geolocate-waiting');
        geoLocateButton.click();
        setTimeout(() => {
          let cls = geoLocateButton.className;
          cls = cls.replace('mapboxgl-ctrl-geolocate', 'mapboxgl-ctrl-locate primary');
          cls = cls.replace('mapboxgl-ctrl-geolocate-active', 'mapboxgl-ctrl-locate-active');
          cls = cls.replace('mapboxgl-ctrl-geolocate-waiting', '');
          mapboxLocateElement.className = cls;
        }, 500);
        window.navigator.geolocation.getCurrentPosition(function (position) {}, function (error) {
          self.showNavigationAlert();
        });
      }
    } else {
      self.showNavigationAlert();
    }
  }

  showNavigationAlert() {
    const mapboxLocateElement = document.querySelector('.mapboxgl-ctrl-locate') as HTMLButtonElement;
    mapboxLocateElement.classList.remove('mapboxgl-ctrl-geolocate-waiting');
    swal(
      {
        title: 'Your browser location settings don\'t allow location discovery.',
        html: 'Click <a href=\'' + this.locateRedirectURL + '\' target=\'blank\'>here</a> to correct this.',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'CORRECT THIS ISSUE',
        cancelButtonText: 'CLOSE',
        confirmButtonClass: 'waves-effect waves-light',
        cancelButtonClass: 'waves-effect waves-light'
      }).then((x) => {
        if (typeof x.value !== 'undefined' && x.value) {
          window.open(this.locateRedirectURL, '_blank');
        }
      });
  }
  public getWorkSpaceState(): Observable<any> {
    return this.workSpaceURL.asObservable();
  }
  public setWorkSpaceState(url) {
    this.workSpaceURL.next(url);
    this.saveWorkSpaceSession({ redirectUrl: url });
  }
  saveWorkSpaceSession(session) {
    localStorage.setItem('workSpaceSession', JSON.stringify(session));
  }
  getWorkSpaceSession() {
    return JSON.parse(localStorage.getItem('workSpaceSession'));
  }
  getRedirectUrl() {
    const workSpaceSession = this.getWorkSpaceSession();
    if (workSpaceSession) {
      return workSpaceSession.redirectUrl;
    } else {
      return '';
    }
  }
  public getMobileBreakPoint(): Observable<any> {
    return this.mobileBreakPoint.asObservable();
  }
  public setMobileBreakPoint(isMobileBreakPoint) {
    this.mobileBreakPoint.next(isMobileBreakPoint);
  }

  truncateString(value, length = 10, addDots = false) {
    if (!value) {
      return '';
    }
    if (value && (value.length > (length * 2))) {
      let truncateFirstStr;
      let truncateLastStr;
      truncateFirstStr = value.substring(0, length);
      truncateLastStr = value.substring(value.length - length);
      truncateFirstStr += ' ... ';
      truncateFirstStr += truncateLastStr;
      if (!addDots) {
        return value.substring(0, length);
      }
      return truncateFirstStr;
    }
    return value;
  }
  checkValid(key, data) {
    if (typeof data[key] !== 'undefined' && data[key] != null && data[key] > 0) {
      return true;
    }
    return false;
  }

  getMapStyle(baseMaps, mapStyle) {
    let style = {};
    if (mapStyle) {
      style = baseMaps.find((map) => mapStyle === map.label);
    } else {
      style = baseMaps.find((map) => (map.default));
    }
    return style;
  }
  /**
  * angular dropdown Observable
  * if true will open dropdown else close
  */
  public getDropdownState(): Observable<any> {
    return this.dropdownState.asObservable();
  }
  public setDropdownState(state) {
    this.dropdownState.next(state);
  }
  prepareBreadcrumbs(project) {
    const access = this.auth.getModuleAccess('projects');
    this.subProjects = [];
    this.subProjectAccess = access['subProjects'];
    const parents = JSON.parse(localStorage.getItem('projectParents'));
    let pid = project['_id'] || project['id'];
    const projects = [];
    if (parents) {
      while (pid !== '') {
        const value = parents.filter(p => p.pid === pid);
        parents.splice(parents.findIndex(v => v.pid === pid), 1);
        if (value && value.length > 0) {
          pid = value[0].parentId;
          projects.push(value[0]);
        } else {
          pid = '';
        }
      }
    }
    const breadCrumbs = [
      {label: 'WORKSPACE', url: '/v2/projects/lists'}
    ];
    if (projects.length > 0) {
      for (let i = projects.length - 1; i >= 0; i--) {
        let url = '';
        // This condition to hide 2 level sub-project(Brand) for OMG
        if (!((this.subProjectAccess && this.subProjectAccess['layout'] === 'simple')  && projects.length >= 2 && i === 0)) {
          url = '/v2/projects/' + projects[i].parentId;
          breadCrumbs.push({label: projects[i].parentName, url: url});
        }
      }
    }
    breadCrumbs.push({label: project['name'], url: '/v2/projects/' + (project['_id'] || project['id'])});
    return {projects: projects, breadCrumbs: breadCrumbs};
  }
  setMediaTypes(medias) {
    this.mediaTypes = medias;
  }
  getMediaTypes() {
    return this.mediaTypes;
  }
  setClassificationTypes(medias) {
    this.classificationTypes = medias;
  }
  getClassificationTypes() {
    return this.classificationTypes;
  }
  setConstructionTypes(construction) {
    this.constructionTypes = construction;
  }
  getConstructionTypes() {
    return this.constructionTypes;
  }
  setMaterialCounts(materialCounts) {
    this.materialCounts = materialCounts;
  }
  getMaterialCounts() {
    return this.materialCounts;
  }
  setMediaNameTypes(mediaNameTypes) {
    this.mediaNameTypes = mediaNameTypes;
  }
  getMediaNameTypes() {
    return this.mediaNameTypes;
  }
  getWorkFlowLabels(): WorkflowLables {
    let labels: WorkflowLables = {
      project: ['Project', 'Projects'],
      scenario: ['Scenario', 'Scenarios'],
      subProject: ['Sub Project', 'Sub Projects'],
      folder: ['Folder', 'Folders'],
    };
    const theme = this.theme.getThemeSettings();
    if (theme && theme['workflow']) {
      const workflow = theme['workflow'];
      labels = {
        project: workflow['project'],
        scenario: workflow['scenario_0'],
        subProject: workflow['sub-project'],
        folder: workflow['folder_0'],
      };
    }
    return labels;
  }

  /**
   * This function used to format the spot id details
   * Data is API response data
   * selectedAudience,selectedMarkets are used to scenario inventory list
   */
   public formatSpotsMeasures(data, selectedAudienceName = '', marketName = 'United States',
    selectedMarketType = 'National', spotSchedules = {}, scenarioPlanDateRange = {}) {
    const spots = [];
    const orientation = new Orientation();
    data.forEach(frame => {
      const spotsInFrame = frame.spot_references.map((spot: SpotReference) => {
        spot['measures']['out_market_imp'] = (spot['measures']['imp'] > 0 ? spot['measures']['imp'] : 0) -
          (spot['measures']['imp_inmkt'] > 0 ? spot['measures']['imp_inmkt'] : 0);
        spot['measures']['per_out_market_imp'] = Math.round((spot['measures']['out_market_imp'] * 100) /
          (spot['measures']['imp'] > 0 ? spot['measures']['imp'] : 0));
        const measures: Measure = spot.measures;
        let status = 'disabled';
        if (this.checkValid('pop_inmkt', measures) &&
          this.checkValid('reach_pct', measures)) {
          status = 'open';
        }
        const location = frame['location'] || [];

        const formattedSpot = {
          checked: true,
          opp: frame.representations[0]['account']['parent_account_name'],
          spot_id: spot.spot_id,
          frame_id: frame.frame_id,
          mt: frame.media_type['name'],
          plant_frame_id: spot['plant_spot_id'],
          status: status,
          media_name: frame.media_name,
          classification_type: frame['classification_type'] ? frame['classification_type']['name'] : '',
          construction_type: frame['construction_type'] ? frame['construction_type']['name'] : '',
          digital: frame['digital'] ? frame['digital'] : '',
          max_height: frame['max_height'] && this.formatService
            .sanitizeString(this.formatService
              .getFeetInches(frame['max_height'])) || '',
          max_width: frame['max_width'] && this.formatService
            .sanitizeString(this.formatService
              .getFeetInches(frame['max_width'])) || '',
          primary_artery: location['primary_artery'] || '',
          zip_code: location['zip_code'] || '',
          longitude: location['longitude'] || '',
          latitude: location['latitude'] || '',
          orientation: location['orientation'] !== 'undefined' && location['orientation'] !== '' && orientation.getOrientation(location['orientation']),
          illumination_type: (frame['illumination_type'] && frame['illumination_type']['name'])
            ? frame['illumination_type']['name'] : '',
          media_status_name: frame['media_status']['name'],
          media_status_description: frame['media_status']['description'],
          market_name: marketName,
          market_type: selectedMarketType,
          target_aud: selectedAudienceName,
          county_name: frame['location']['county_name'],
          cbsa_name: frame['location']['cbsa_name'],
          place_type: frame.location?.place_type?.name ?? null,
          place_name: this.getPlacesName(frame['location']['places']),
          placement_type: frame.placement_type?.name ?? null
        };
        Object.keys(measures).forEach(field => {
          formattedSpot[field] = measures[field];
        });
        let totalDays = 0;
        if (spotSchedules && spotSchedules[spot.spot_id]) {
          for (let i = 1; i <= spotSchedules[spot.spot_id].length; i++) {
            if (!spotSchedules[spot.spot_id][i - 1]['end'] || spotSchedules[spot.spot_id][i - 1]['end'] > scenarioPlanDateRange['end']) {
              formattedSpot['end_period_date_' + i] = scenarioPlanDateRange['end'];
            } else {
              formattedSpot['end_period_date_' + i] = spotSchedules[spot.spot_id][i - 1]['end'];
            }
            if (!spotSchedules[spot.spot_id][i - 1]['start'] || spotSchedules[spot.spot_id][i - 1]['start'] < scenarioPlanDateRange['start']) {
              formattedSpot['start_period_date_' + i] = scenarioPlanDateRange['start'];
            } else {
              formattedSpot['start_period_date_' + i] = spotSchedules[spot.spot_id][i - 1]['start'];
            }
            totalDays += this.getTotalDays(spotSchedules[spot.spot_id][i - 1]['start'], spotSchedules[spot.spot_id][i - 1]['end']);
          }
          formattedSpot['period_total'] = Math.floor(totalDays);
        } else if (scenarioPlanDateRange['start'] && scenarioPlanDateRange['end']) {
          formattedSpot['start_period_date_1'] = scenarioPlanDateRange['start'];
          formattedSpot['end_period_date_1'] = scenarioPlanDateRange['end'];
          totalDays += this.getTotalDays(scenarioPlanDateRange['start'], scenarioPlanDateRange['end']);
          formattedSpot['period_total'] = Math.floor(totalDays);
        }
        this.findDmaById(frame['location']['dma_id']).then((dmaName) => {
          formattedSpot['dma_name'] = dmaName;
        });
        return formattedSpot;
      });
      spots.push(...spotsInFrame);
    });
    return spots;
   }
   getTotalDays(start, end) {
    const date1 = new Date(start);
    const date2 = new Date(end);

    // To calculate the time difference of two dates
    const inTime = date2.getTime() - date1.getTime();

    // To calculate the no. of days between two dates
    const inDays = inTime / (1000 * 3600 * 24);
    return inDays + 1;
   }
   getOperatorName(representations: Representation[]): string {
    let opp = '';
    if (representations) {
      const representation = representations.find(rep => rep['representation_type']['name'] === 'Own');
      if (representation) {
        opp = representation['account']['parent_account_name'];
        // opp = representation['division']['plant']['name'];
      }
    }
    return opp;
  }

  public findDmaById(id) {
    return new Promise(resolve => {
      this.inventoryService.getMarketsFromFile().subscribe((data: any) => {
        const foundata = data.filter((dma) => dma.id === 'DMA' + id);
        resolve(foundata?.[0]?.name);
      });
    });
  }

  public async formatSpotsMeasuresFromES(inventory, client_id = null,selectedAudience = [], selectedMarkets = [],selectedMarketType = 'National', selectedPeoridDays = 7) {
    const spots = [];
    const orientation = new Orientation();
    let marketName = 'United States';
    if (selectedMarkets.length > 1) {
      marketName = 'Combined Markets';
    } else if (selectedMarkets.length === 1) {
      marketName = selectedMarkets[0]['name'];
    } else {
      selectedMarketType = 'National';
    }
    await inventory.forEach(frame => {
      const location = frame['location'] || [];
      frame.layouts.map(lay => {
        lay.faces.map(face => {
          face.spots.map((spot) => {
            if (spot['id']) {
              const formattedSpot: CustomizedSpot = {
                checked: true,
                opp: this.getOperatorName(frame.representations),
                sid: spot['id'],
                fid: frame['id'],
                mt: frame.media_type['name'],
                pid: frame.plant_frame_id,
                totwi: null,
                tgtwi: null,
                tgtinmi: null,
                compi: null,
                reach: null,
                cwi: null,
                tgtinmp: null,
                compinmi: null,
                totinmp: null,
                freq: null,
                trp: null,
                totinmi: null,
                tgtmp: null,
                totmp: null,
                status: 'disabled',
                media_name: frame.media_name,
                classification_type: frame['classification_type'] ? frame['classification_type']['name'] : '',
                construction_type: frame['construction_type'] ? frame['construction_type']['name'] : '',
                digital: frame['digital'] ? frame['digital'] : '',
                max_height: frame['max_height'] && this.formatService
                  .sanitizeString(this.formatService
                    .getFeetInches(frame['max_height'])) || '',
                max_width: frame['max_width'] && this.formatService
                  .sanitizeString(this.formatService
                    .getFeetInches(frame['max_width'])) || '',
                primary_artery: location['primary_artery'] || '',
                zip_code: location['zip_code'] || '',
                longitude: location['longitude'] || '',
                latitude: location['latitude'] || '',
                orientation: location['orientation'] !== 'undefined'
                && location['orientation'] !== '' && orientation.getOrientation(location['orientation']),
                illumination_type: (frame['illumination_type'] && frame['illumination_type']['name'])
                  ? frame['illumination_type']['name'] : '',
                client_id: client_id,
                media_status_name: frame['status_type']['name'],
                media_status_description: frame['status_type']['description'],
                market_name: marketName,
                market_type: selectedMarketType,
                market_pop: null ,
                scheduled_weeks: selectedPeoridDays,
                target_aud: selectedAudience['name'],
                target_aud_pop: null
              };
              // return formattedSpot;
              spots.push(formattedSpot);
            }
          });
        });
      });
    });
    return spots;
  }

  public async formatSpotIdsFoES(inventory, client_id) {
    const spots = [];
    await inventory.forEach(frame => {
      frame.layouts.map(lay => {
        lay.faces.map(face => {
          face.spots.map((spot) => {
            if (spot['id']) {
              const formattedSpot = {
                classification_type: frame['classification_type'],
                construction_type: frame['construction']['construction_type'],
                digital: frame['digital'] ,
                spot_id: spot['id'],
                frame_id: frame['id'],
                geometry: frame['location'],
                illumination_type: frame['illumination_type'],
                location: frame['location'],
                max_height: frame['max_height'],
                max_width: frame['max_width'],
                media_status: frame['status_type'],
                media_type: frame['media_type'],
                plant_frame_id: frame['plant_frame_id'],
                representations: frame['representations'],
                spot_references: [spot],
                uri: frame['uri'],
                client_id: client_id
              };
              // return formattedSpot;
              spots.push(formattedSpot);
            }
          });
        });
      });
    });
    return spots;
  }

  public doResize(data) {
   const scale = Math.min(
      data.parent.width / data.child.width,
      data.parent.height / data.child.height
    );
    return ({transform: 'translate(0%, 0%) ' + 'scale(' + scale + ')'});
  }

  /**
   * This function is to get the customized column
   * @param {*} moduleName
   * @param {*} areaName
   * @returns {Observable<any>}
   * @memberof CommonService
   */
  public getCustomizeColumns(moduleName, areaName): Observable<any> {
    const url = this.config.envSettings['API_ENDPOINT'] + 'views/' + moduleName + '/' + areaName + '/columns';
    return this.http.get(url);
  }

  /**
   * This function is to update the customize column into DB
   * @param {*} data
   * @returns {Observable<any>}
   * @memberof CommonService
   */
  public updateCustomizeColumns(data): Observable<any> {
    const reqUrl = `${this.config.envSettings['API_ENDPOINT']}views/columns`;
    return this.http.put(reqUrl, data);
  }

  private getPlacesName(places: Array<any>) {
    if (places.length > 0) {
      return places
        .map((place) => {
          return place.place_name;
        })
        .toString();
    } else {
      return null;
    }
  }
  /**
   * @deprecated This method should not be used, use filterService.setFilters instead.
   *
   * This method will be removed in the future.
   */
  public setDataVersion(year) {
    this.dataVersionChange.next(year);
  }

  /**
   * @deprecated This method should not be used, use filterService.getFilters observable or filterService.getFilterdata instead. That'll have the measureRelease value.
   *
   * This method will be removed in the future.
   */
  public onDataVersionChange() {
    return this.dataVersionChange.asObservable();
  }
  public setUserPreferences(preferences) {
    localStorage.setItem('user_preferance', JSON.stringify(preferences));
  }
  public getUserPreferences() {
    return JSON.parse(localStorage.getItem('user_preferance'));
  }
  public getSiteName() {
    const themeSettings = this.theme.getThemeSettings();
    return themeSettings?.siteName;
  }
  public setSummaryCustomColumns(year) {
    this.summaryCustomColumns.next(year);
  }
  /* public getDataVersion() {
    return localStorage.getItem('dataVersion');
  } */
  public onSummaryCustomColumns() {
    return this.summaryCustomColumns.asObservable();
  }

  public getSavedInventorySets(search = '', page = 1, perPage = 10, fields: string = "id,name"): Observable<any[]> {
    const url = `${this.config.envSettings['API_ENDPOINT']}inventory/collections/search?${fields}&page=${page}&perPage=${perPage}`;
    const searchTerm = {'search': search};
    return this.http.post<any[]>(url, search ? searchTerm : {});
  }
}
