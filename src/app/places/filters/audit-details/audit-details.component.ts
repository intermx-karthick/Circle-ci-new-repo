import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  SimpleChanges,
  OnChanges,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import {
  CommonService,
  MapService,
  PlacesService,
  ThemeService
} from '@shared/services';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { matRangeDatepickerRangeValue } from '@interTypes/placeFilters';
import {
  Place,
  Status,
  Polygon,
  OutCome,
  CreatePlaceReq,
  OpenHours,
  Hours,
  AuditedPlace,
  Geometry,
  AreaType,
  PlaceType,
  ElasticSearchType,
  TimePickerOpenEvent,
  HourType,
  TimePickerResponse,
  CreateNewPlace
} from '@interTypes/Place-audit-types';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { PlacesFiltersService } from '../places-filters.service';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  catchError
} from 'rxjs/operators';
import { StaticMapProperties } from '@interTypes/staticMapProperties';
import { TimepickerDialogComponent } from '../../timepicker-dialog/timepicker-dialog.component';
import { ToggleState } from '@interTypes/toggle-state';
import { MarketsSelectorDialogComponent } from '@shared/components/markets-selector-dialog/markets-selector-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Helper } from '../../../classes';

@Component({
  selector: 'app-audit-details',
  templateUrl: './audit-details.component.html',
  styleUrls: ['./audit-details.component.less']
})
export class AuditDetailsComponent implements OnInit, OnChanges, OnDestroy {
  @Output() facilityMapData = new EventEmitter();
  @Output() closeFacilityMap = new EventEmitter();
  @Output() closeDetailsWindow = new EventEmitter();
  @Output() listHereIdDetails = new EventEmitter();
  @Output() placeComplete: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() safegraphPlace;
  @Input() place: Place | AuditedPlace;
  @Input() updatedPlaceInfo;
  @Input() clientId: string;
  @Input() newPlaceData;
  @Input() createNewPlace = false;
  @Input() updatedPlacePosition: number[] = [];
  public readonly duration = {
    WEEKDAYS: 'WD',
    ALL: 'ALL'
  };
  public contentHeight: number;
  public isOpenedHours = false;
  public outcomes$: Observable<OutCome[]>;
  public statuses$: Observable<Status[]>;
  public placeTypes$: Observable<PlaceType[]>;
  auditDetailForm: FormGroup;
  customFields: FormArray;
  notes = [];
  dateInlineRange: matRangeDatepickerRangeValue<Date>;
  public buildingAreaPolygon: Polygon = {};
  public propertyArea: Polygon = {};
  public buildAreaProperties: StaticMapProperties;
  public propertyAreaProperties: StaticMapProperties;
  private placePosition: number[] = [];
  private unSubscribe: Subject<void> = new Subject<void>();
  public isExpandDetails = false;
  public isCollapseDetails = false;
  public isFacilityMapOpen = false;
  public isRequiredReview = false;
  public isPlaceRequiredReview = false;
  private isPolygonChanged = false;
  saveChangesFlag = false;
  public searchTextCtrl: FormControl = new FormControl();
  @ViewChild('fName') focusNameRef: ElementRef;
  private hoursFieldchanges = false;
  public updatedDate = '';
  public updatedBy = '';
  isEnabledDisAssociate = false;

  // To get the current toggle state of property area layer
  propertyAreaLayerToggleState$: Observable<ToggleState>;

  //  To get the current toggle state of building area layer
  buildingAreaLayerToggleState$: Observable<ToggleState>;

  public selectedDMA;
  public selectedCounty;
  themeSettings: any;
  public canDelete: boolean;
  constructor(
    private common: CommonService,
    private fb: FormBuilder,
    public placesFilterService: PlacesFiltersService,
    private mapService: MapService,
    public dialog: MatDialog,
    private placeService: PlacesService,
    private theme: ThemeService,
    private snackBar: MatSnackBar
  ) {
    this.outcomes$ = placesFilterService.getPlacesOutcomes(true);
    this.statuses$ = placesFilterService.getPlaceStatuses(true);
    this.placeTypes$ = placesFilterService.getPlaceTypes(true);
    this.propertyAreaLayerToggleState$ = this.placesFilterService.getPropertyAreaLayerToggleState();
    this.buildingAreaLayerToggleState$ =  this.placesFilterService.getBuildingAreaLayerToggleState();

  }
  ngOnInit() {
    this.initializeProperties();
    this.auditDetailForm = this.fb.group({
      name: '',
      street: '',
      city: '',
      state: '',
      zipcode: '',
      // hereId: '',
      safegraphId: '',
      outcome: '',
      // TODO : Need to find how to populate hours?
      hours: this.fb.group({
        mo: this.fb.group({
          from: '',
          to: '',
          next: ''
        }),
        tu: this.fb.group({
          from: '',
          to: '',
          next: ''
        }),
        we: this.fb.group({
          from: '',
          to: '',
          next: ''
        }),
        th: this.fb.group({
          from: '',
          to: '',
          next: ''
        }),
        fr: this.fb.group({
          from: '',
          to: '',
          next: ''
        }),
        sa: this.fb.group({
          from: '',
          to: '',
          next: ''
        }),
        su: this.fb.group({
          from: '',
          to: '',
          next: ''
        }),
      }),
      floors: '',
      entrances: '',
      concourses: '',
      platforms: '',
      gates: '',
      placeStatus: '',
      placeType: '',
      parentPlaceID: '',
      buildingArea: this.fb.group({
        is_data_collection_area: false,
        is_active: true,
        is_focused: false,
      }),
      propertyArea: this.fb.group({
        is_data_collection_area: true,
        is_active: true,
        is_focused: true,
      }),
      lat: '',
      long: '',
      dma: '',
      county : '',
      phone_number: '',
      short_name: ''
      /*customFields: this.fb.array([]),
      notes: this.fb.group({
        name: [],
        note: [],
      })*/
    });
    this.dateInlineRange = { begin: null, end: null };
    this.onResize();

    /** Not a create place */
    if(!this.createNewPlace){
      this.onFillAuditDetailFormUnaudit(this.place);
    } else {
      if(this.newPlaceData && this.newPlaceData['latlng']){
        this.setDefaultValue();
        this.isCollapseDetails = false;
        this.placePosition = this.newPlaceData['latlng'];
        this.updateLatLngValue(this.newPlaceData['latlng']);
      }
    }

      /**
       * combineLatest to Combine Multiple Observables
       */
      combineLatest(
        [this.auditDetailForm.controls['lat'].valueChanges,
        this.auditDetailForm.controls['long'].valueChanges]
      ).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.unSubscribe),
        map(([lat, long]) => {
          // combineLatest returns an array of values, here we map those values to an object
          return { lat, long};
        })
      ).subscribe(value => {
        this.onUpdateLatLong(value);

      });

    this.placesFilterService.reloadAuditPlace().pipe(takeUntil(this.unSubscribe)).subscribe(data => {
      if (data) {
        this.closeDetails();
      }
    });
  }

  /**
   * To check if the current place has any user defined place (UDP) to delete
   * And if the UDP belongs to the current client.
   *
   * Should not allow deleting of any other place records such as safegrapu other than UDP.
   * https://intermx.atlassian.net/browse/IMXUIPRD-1941 - Comments.
   */
  private setDeleteStatus(): void {
    const udpPlaceId = this.place?.udp_places?.find(udp => udp.client_id === this.clientId);
    if (udpPlaceId) {
      this.canDelete = true;
    } else {
      this.canDelete = false;
    }
  }
  updateLatLngValue(lntlong) {
    this.auditDetailForm.controls['lat'].patchValue(lntlong[1]);
    this.auditDetailForm.controls['long'].patchValue(lntlong[0]);
  }


  addCustomField(): FormGroup {
    return this.fb.group({
      name: '',
      value: '',
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.safegraphPlace && changes.safegraphPlace.currentValue) {
      this.resetPlaceValues();
      this.isCollapseDetails = false;
      this.onFillAuditDetailForm(changes.safegraphPlace.currentValue);
    }
    if (changes.place && changes.place.currentValue) {
      if (changes.place.currentValue.udp_places) {
        const associateClientId = [];
        if (changes.place.currentValue.udp_places.length > 1) {
          changes.place.currentValue.udp_places.map(data => {
            associateClientId.push(data.client_id);
          });
          const duplicateClient = this.findDuplicatesinArray(associateClientId);
          if (duplicateClient.length > 0) {
            this.isEnabledDisAssociate = false;
          } else {
            this.isEnabledDisAssociate = true;
          }
        }
      }
      this.resetPlaceValues();
      this.onResize();
      if (this.searchTextCtrl) {
        this.searchTextCtrl.setValue('');
      }
      this.isCollapseDetails = false;
      this.onFillAuditDetailFormUnaudit(changes.place.currentValue);
    }
    if (changes.updatedPlaceInfo && changes.updatedPlaceInfo.currentValue) {
      const info = changes.updatedPlaceInfo.currentValue;
      if (info['type'] === 'building') {
        this.buildingAreaPolygon = info['polygonData'];
        this.buildAreaProperties.feature = info['polygonData'];
        this.buildAreaProperties.coordinates = this.placePosition.length ? this.placePosition : info['center'];
        if (info['center']) {
          const place: Geometry = {
            coordinates: info['center'],
            type: 'Point',
          };
          if(!this.createNewPlace){
            this.place.nav_geometry = place;
          }
        }
        this.buildAreaProperties = Helper.deepClone(this.buildAreaProperties);
        this.isPolygonChanged = true;
      }
      if (info['type'] === 'property') {
        this.propertyArea = info['polygonData'];
        this.propertyAreaProperties.feature = info['polygonData'];
        this.propertyAreaProperties.coordinates = this.placePosition.length ? this.placePosition : info['center'];
        this.propertyAreaProperties = Helper.deepClone(this.propertyAreaProperties);
        this.isPolygonChanged = true;
      }
    }
    if (changes.updatedPlacePosition && changes.updatedPlacePosition.currentValue && changes.updatedPlacePosition.currentValue.length) {
      this.placePosition = changes.updatedPlacePosition.currentValue;
      this.buildAreaProperties.coordinates = this.placePosition;
      this.propertyAreaProperties.coordinates = this.placePosition;
      this.auditDetailForm.controls.lat.patchValue(this.placePosition[1]);
      this.auditDetailForm.controls.long.patchValue(this.placePosition[0]);
      this.updateLatLngValue(this.placePosition);
    }

    if (changes.newPlaceData && changes.newPlaceData.currentValue && changes.newPlaceData.currentValue['latlng'] && this.createNewPlace && this.auditDetailForm) {
      this.resetPlaceValues();
      this.onResize();
      if (this.searchTextCtrl) {
        this.searchTextCtrl.setValue('');
      }
      this.setDefaultValue();
      this.placePosition = changes.newPlaceData.currentValue['latlng'];
      this.updateLatLngValue(changes.newPlaceData.currentValue['latlng'])
      this.isCollapseDetails = false;
    }

  }
  private setDefaultValue() {
    if(this.auditDetailForm) {
      /** building Are default values */
      this.auditDetailForm['controls']['buildingArea']['controls']['is_data_collection_area'].patchValue(false);
      this.auditDetailForm['controls']['buildingArea']['controls']['is_active'].patchValue(true);
      this.auditDetailForm['controls']['buildingArea']['controls']['is_focused'].patchValue(false);

      /** propertyArea Default values */

      this.auditDetailForm['controls']['propertyArea']['controls']['is_data_collection_area'].patchValue(true);
      this.auditDetailForm['controls']['propertyArea']['controls']['is_active'].patchValue(true);
      this.auditDetailForm['controls']['propertyArea']['controls']['is_focused'].patchValue(true);

    }
  }
  private onFillAuditDetailFormUnaudit(place: Place | AuditedPlace) {
    if (this.auditDetailForm) {
      this.auditDetailForm.reset();
      if (place['audit_status_cd']
        && place['audit_status_cd'] === 3) {
        this.isRequiredReview = true;
        this.isPlaceRequiredReview = true;
      } else {
        this.isRequiredReview = false;
      }
      this.onResize();
      const formData = {
        name: place.location_name && place.location_name || '',
        street: place.street_address && place.street_address || '',
        city: place.city && place.city || '',
        state: place.state && place.state || '',
        zipcode: place.zip_code && place.zip_code || '',
        placeStatus: place['audit_status_cd'] || '',
        outcome: place['audit_outcome_id'] || '',
        placeType: place['place_type_id'] || '',
        floors: place['building_area'] && place['building_area']['no_floors'] && place['building_area']['no_floors'] || '',
        entrances: place['building_area'] && place['building_area']['no_entrances'] && place['building_area']['no_entrances'] || '',
        concourses: place['building_area'] && place['building_area']['no_concourses'] && place['building_area']['no_concourses'] || '',
        platforms: place['building_area'] && place['building_area']['no_platforms'] && place['building_area']['no_platforms'] || '',
        gates: place['building_area'] && place['building_area']['no_gates'] && place['building_area']['no_gates'] || '',
        parentPlaceID: place['parent_place_id'] && place['parent_place_id'] || ''
      };
      if (place['building_area']) {
        formData['buildingArea'] = {
          is_data_collection_area: place['building_area']['is_data_collection_area'],
          is_active:  place['building_area']['is_active'] !== null ? place['building_area']['is_active'] : true,
          is_focused:  place['building_area']['is_focused']
        };
        if (place['building_area']['geometry']) {
          this.buildingAreaPolygon = place['building_area']['geometry'];
          this.buildAreaProperties.feature = place['building_area']['geometry'];
          this.onOpenFacilityMap('building');
        } else {
          this.addNewArea('building');
        }
      }

      if (place['property_area']) {
        formData['propertyArea'] = {
          is_data_collection_area: place['property_area']['is_data_collection_area'] !== null ?
           place['property_area']['is_data_collection_area'] : true ,
          is_active:  place['property_area']['is_active'] !== null ? place['property_area']['is_active'] : true,
          is_focused:  place['property_area']['is_focused'] !== null ? place['property_area']['is_focused'] : true
        };
        if (place['property_area']['geometry']) {
          this.propertyArea = place['property_area']['geometry'];
          this.propertyAreaProperties.feature = place['property_area']['geometry'];
        }
      }

      if (place['display_geometry']) {
        this.placePosition = place['display_geometry']['coordinates'];
        setTimeout(() => {
          this.placesFilterService.setPlaceCoords(this.placePosition);
        }, 1000);
        this.buildAreaProperties.coordinates = this.placePosition;
        this.propertyAreaProperties.coordinates = this.placePosition;
        this.auditDetailForm.controls.lat.patchValue(this.placePosition[1]);
        this.auditDetailForm.controls.long.patchValue(this.placePosition[0]);
      }
      this.setOpenHours(place['open_hours']);
      this.auditDetailForm.patchValue(formData, { emitEvent: false });
    }
    if (place['status'] !== 0) {
      this.updatedBy = place['update_user'] && place['update_user'];
      this.updatedDate = place['update_ts'] && place['update_ts'];
    } else {
      this.updatedBy = place['create_user'] && place['create_user'];
      this.updatedDate = place['create_ts'] && place['create_ts'];
    }
    setTimeout(() => {
      this.focusNameRef.nativeElement.focus();
    }, 100);
  }
  /**
   * This function is to fill the form with the data got from safegraph places API
   * @param place
   */
  private onFillAuditDetailForm(place) {
    if (this.auditDetailForm) {
      this.auditDetailForm.patchValue({
        name: place.location_name && place.location_name || '',
        street: place.address && place.address.street_address && place.address.street_address || '',
        city: place.address && place.address.city && place.address.city || '',
        state: place.address && place.address.state && place.address.state || '',
        zipcode: place.address && place.address.zip_code && place.address.zip_code || '',
        // hereId: place.ids && place.ids.parent_safegraph_place_id && place.ids.parent_safegraph_place_id || '',
        safegraphId: place.ids && place.ids.safegraph_place_id && place.ids.safegraph_place_id || '',
      });
      if (place.operating_information && place.operating_information.open_hours) {
        this.setOpenHours(place.operating_information.open_hours, true);
      }
      if (place.location && place.location.polygon) {
        const polygon = this.convertPolygon(place.location.polygon)
        this.buildingAreaPolygon = polygon;
        this.buildAreaProperties.feature = polygon;
      }
      if (place.location && place.location.point) {
        this.placePosition = place.location.point.coordinates;
        this.place.nav_geometry = place.location.point;
        this.place.display_geometry = place.location.point;
        this.buildAreaProperties.coordinates = place.location.point.coordinates;
        this.propertyAreaProperties.coordinates = place.location.point.coordinates;
        this.auditDetailForm.controls.lat.patchValue(this.placePosition[1]);
        this.auditDetailForm.controls.long.patchValue(this.placePosition[0]);
      }
    }

    setTimeout(() => {
      this.focusNameRef.nativeElement.focus();
    }, 100);
  }

  /**
   * This function is to reset polygon properties
   */
  private resetPlaceValues() {
    this.propertyArea = {};
    this.buildingAreaPolygon = {};
    this.placePosition = [];
    this.initializeProperties();
    if (this.auditDetailForm) {
      this.auditDetailForm.reset();
    }
    this.setDeleteStatus();
  }

  /**
   * This function is to initialize polygon properties
   */
  private initializeProperties() {
    this.buildAreaProperties = {
      zoom: 17,
      coordinates: [],
      width: 330,
      height: 140,
      feature: {},
      alt: 'Building Area',
      fillColor: '#2196F3',
      stokeColor: '#2196F3'
    };
    this.propertyAreaProperties = {
      zoom: 17,
      coordinates: [],
      width: 330,
      height: 140,
      feature: {},
      alt: 'Property Area',
      fillColor: '#DD6666',
      stokeColor: '#DD6666'
    };
  }

  onAddCustomField() {
    this.customFields = this.auditDetailForm.get('customFields') as FormArray;
    this.customFields.push(this.addCustomField());
  }
  onAddNoteField() {
    const formData = this.auditDetailForm.getRawValue();
    if (
      (formData.notes['name'] && formData.notes['name'].trim().length > 0)
      && (formData.notes['note'] && formData.notes['note'].trim().length > 0)) {
      this.notes.push({
        name: formData.notes['name'],
        note: formData.notes['note']
      });
      this.auditDetailForm.controls['notes']['controls']['name'].setValue('');
      this.auditDetailForm.controls['notes']['controls']['note'].setValue('');
    }
  }
  onRemoveCustomField(customFieldIndex) {
    this.customFields.controls.splice(customFieldIndex, 1);
  }
  onResize() {
    if ((this.place && this.place['status'] === 0) || this.createNewPlace) {
      this.contentHeight = window.innerHeight - (!this.createNewPlace ? 220 : 230);
    } else {
      this.contentHeight = window.innerHeight - (this.isRequiredReview ? 340 : 280);
    }
  }
  onOpenHours(state = true) {
    this.common.setDropdownState(state);
    this.auditDetailForm.controls['hours']['controls']['hoursName'].setValue('');
  }
  /*onSelectHoursDate(event) {
    this.selectedDate = event;
  }

  // Assigning start and end date value
  inlineRangeChange($event) {
    this.dateInlineRange = $event;
  }

  // to save selected dates
  onSaveHours() {
    const formData = this.auditDetailForm.getRawValue();
    if (formData.hours['hoursName'] && formData.hours['hoursName'].trim().length > 0) {
      const hours = {
        name: formData.hours['hoursName'],
        date: this.dateInlineRange
      };
      this.hoursData.push(hours);
      this.onOpenHours(false);
      this.dateInlineRange= { begin: null, end: null};
    }
  }*/
  validateForm(data, validationKeys = ['name', 'street', 'city', 'state', 'zipcode']) {
    const errorFields = [];
    for (let i = 0; i < validationKeys.length; i++) {
      if (data[validationKeys[i]] === '') {
        errorFields.push((validationKeys[i]).charAt(0).toUpperCase() + (validationKeys[i]).slice(1));
      }
    }
    if (errorFields.length > 0) {
      const message = 'Enter details for ' + errorFields.join(', ').replace(/, ((?:.(?!, ))+)$/, ' and $1');

      /* COMMENTED on Sep 27: For tracking purpose */
      /* if (errorFields.length > 0 && mapErrors.length > 0) {
        message += errorFields.join(', ') + ' and draw polygon for ' + mapErrors.join(', ').replace(/, ((?:.(?!, ))+)$/, ' and $1');
      } else if (errorFields.length > 0) {
        message += errorFields.join(', ').replace(/, ((?:.(?!, ))+)$/, ' and $1');
      } else {
        message = 'Draw polygon for ' + mapErrors.join(', ').replace(/, ((?:.(?!, ))+)$/, ' and $1');
      } */
      const dialogueData: ConfirmationDialog = {
        notifyMessage: true,
        confirmTitle: 'Error',
        messageText: `${message} to save changes.`,
      };
      this.dialog.open(ConfirmationDialogComponent, {
        data: dialogueData,
        width: '586px',
        panelClass: 'placeAuditInfoMsg'
      });
      return false;
    }
    return true;
  }

  formatNullorEmpty(field) {
    if(field && field.toString().trim() && field !== null && field !== ''){
      return field;
    } else {
      return null;
    }
  }

  formatPlaces(place) {
    Object.keys(place).map((key) => {
        if (place[key] == '' || place[key] === null) {
            delete place[key];
        }
    });
    return place;
  }

  createNewPlaceAPI() {

    const data = this.auditDetailForm.value;
    if (!this.validateForm(data, ['name'])) {
      return true;
    }

    const reqData: CreateNewPlace = {
      location_name: data.name,
      short_name: this.formatNullorEmpty(data.short_name),
      city: this.formatNullorEmpty(data.city),
      address: this.formatNullorEmpty(data.street),
      state: this.formatNullorEmpty(data.state),
      zip_code: this.formatNullorEmpty(data.zipcode),
      open_hours: this.formatOpenHoursForAPI(data.hours),
      phone_number: this.formatNullorEmpty(data.phone_number),
      building_area: {
        no_floors: parseInt(data.floors) || null,
        no_concourses: parseInt(data.concourses) || null,
        no_entrances: parseInt(data.entrances) || null,
        no_gates: parseInt(data.gates) || null,
        no_platforms: parseInt(data.platforms) || null,
        is_focused: data.buildingArea.is_focused,
        is_active: data.buildingArea.is_active,
        is_data_collection_area: data.buildingArea.is_data_collection_area,
        geometry: this.buildingAreaPolygon,
      },
      property_area: {
        is_focused: data.propertyArea.is_focused,
        is_active: data.propertyArea.is_active,
        is_data_collection_area: data.propertyArea.is_data_collection_area,
        geometry: this.propertyArea,
      }
    };

    if (data.lat && data.long) {
      reqData.lat = data.lat;
      reqData.lng = data.long;

      reqData.display_geometry = {
        'type': 'Point',
        'coordinates': this.placePosition
      };
      reqData.nav_geometry = {
        'type': 'Point',
        'coordinates': this.placePosition
      };
    }

    const regex = /DMA|CBSA|CNTY/;
    if (this.selectedDMA) {
      reqData['DMA_id'] = this.selectedDMA[0]['id'].replace(regex, '');
      reqData['DMA_name'] = this.selectedDMA[0]['name']
    }

    if(this.selectedCounty){
      reqData['county_id'] = this.selectedCounty[0]['id'].replace(regex, '');
      reqData['county_name'] = this.selectedCounty[0]['name']
    }

    /** Check open hours empty object */
    if (!Object.keys(reqData.open_hours).length) {
      delete reqData.open_hours;
    }

    const formatPlace = this.formatPlaces(reqData);

    this.themeSettings = this.theme.getThemeSettings();
    const clientId = this.themeSettings.clientId;
    this.placeService
        .createNewPlace(formatPlace, clientId, true)
        .pipe(takeUntil(this.unSubscribe))
        .subscribe(
            (res) => {
              const placeData = {
                open: false,
                latlng: [],
                success: res
              };
              this.placesFilterService.setCreateNewPlace(placeData)
            },
            (error) => {
              let message = 'Something went wrong, Please try again later.';
              if (error?.error?.message) {
                message = error.error.message;
              }
              this.snackBar.open(message, '', { duration: 2000});
            }
        );
  }

  onSubmit(data) {
    if(this.createNewPlace) {
      this.createNewPlaceAPI();
      return true;
    }
    const reqData: CreatePlaceReq = {
      audit_outcome_id: data.placeStatus === 3 ? data.outcome : '',
      building_area: {
        no_floors: parseInt(data.floors) || null,
        no_concourses: parseInt(data.concourses) || null,
        no_entrances: parseInt(data.entrances) || null,
        no_gates: parseInt(data.gates) || null,
        no_platforms: parseInt(data.platforms) || null,
        is_focused: data.buildingArea.is_focused,
        is_active: data.buildingArea.is_active,
        is_data_collection_area: data.buildingArea.is_data_collection_area,
        geometry: this.buildingAreaPolygon,
      },
      property_area: {
        is_focused: data.propertyArea.is_focused,
        is_active: data.propertyArea.is_active,
        is_data_collection_area: data.propertyArea.is_data_collection_area,
        geometry: this.propertyArea,
      },
      city: data.city,
      location_name: data.name,
      street_address: data.street,
      state: data.state,
      zip_code: data.zipcode,
      // here_id: data.hereId,
      display_geometry: {
        'type': 'Point',
        'coordinates': this.placePosition
      },
      nav_geometry: {
        'type': 'Point',
        'coordinates': this.placePosition
      },
      open_hours: this.formatOpenHoursForAPI(data.hours),
      client_id: this.clientId,
      iso_country_code: 'US',
      safegraph_id: data.safegraphId,
      is_focused: false,
      is_active: true,
      is_data_collection_area: false,
      audit_status_cd: data.placeStatus,
      place_type_id: data.placeType,
      parent_place_id: data.parentPlaceID
    };
    if (this.place['status'] === 0) {
      reqData['audit_status_cd'] = 1;
      // this.saveChangesFlag = true;
    }
    if (this.place['building_area'] && this.place['building_area']['building_area_id']) {
      reqData.building_area.building_area_id = this.place['building_area']['building_area_id'];
    }
    if (this.place['property_area'] && this.place['property_area']['property_area_id']) {
      reqData.property_area.property_area_id = this.place['property_area']['property_area_id'];
    }

    if (this.saveChangesFlag || this.place['status'] === 0) {
      if (!this.validateForm(data)) {
        if (this.place['status'] !== 0) {
          this.saveChangesFlag = false;
        }
        return;
      }
      if (!this.buildingAreaPolygon.type || !this.propertyArea.type) {

        /** Remove empty object as per https://intermx.atlassian.net/browse/IMXUIPRD-1926 */
        if (!Object.keys(reqData['property_area']['geometry']).length) {
          delete reqData['property_area']['geometry'];
        }
        if (!Object.keys(reqData['building_area']['geometry']).length) {
          delete reqData['building_area']['geometry'];
        }

        const warningDialogueData: ConfirmationDialog = {
          confirmDesc: '<h4 class="confirm-text-icon">You are about to save this location without adding a property or building area. Are you sure you want to proceed?</h4>',
          confirmButtonText: 'Yes',
          cancelButtonText: 'Cancel',
        };
        this.dialog.open(ConfirmationDialogComponent, {
          data: warningDialogueData,
          width: '586px',
          panelClass: 'placeAuditInfoMsg'
        }).afterClosed().subscribe(result => {
          if (result && result['action']) {
            this.placesFilterService
            .updateAuditedPlace(reqData, this.place.place_id)
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(response => {
              const dialogueData: ConfirmationDialog = {
                notifyMessage: true,
                confirmTitle: 'Success',
                messageText: response.message || 'Place Created Successfully',
              };
              this.dialog.open(ConfirmationDialogComponent, {
                data: dialogueData,
                width: '586px',
                panelClass: 'placeAuditInfoMsg'
              }).afterClosed().subscribe(result => {
                this.auditDetailForm.markAsPristine();
                if (!this.saveChangesFlag) {
                  this.placeComplete.emit(true);
                }
                this.saveChangesFlag = false;
                this.isPolygonChanged = false;
                this.hoursFieldchanges = false;
              });
            }, error => {
              this.saveChangesFlag = false;
              this.dialog.open(ConfirmationDialogComponent, {
                data: {
                  notifyMessage: true,
                  confirmTitle: 'Error',
                  messageText: error.error['api-message'] || 'Something went wrong'
                },
                width: '586px',
                panelClass: 'placeAuditInfoMsg'
              });
            });
          }
        });
      } else {
        this.placesFilterService
          .updateAuditedPlace(reqData, this.place.place_id)
          .pipe(takeUntil(this.unSubscribe))
          .subscribe(response => {
            const dialogueData: ConfirmationDialog = {
              notifyMessage: true,
              confirmTitle: 'Success',
              messageText: response.message || 'Place Created Successfully',
            };
            this.dialog.open(ConfirmationDialogComponent, {
              data: dialogueData,
              width: '586px',
              panelClass: 'placeAuditInfoMsg'
            }).afterClosed().subscribe(result => {
              this.auditDetailForm.markAsPristine();
              if (!this.saveChangesFlag) {
                this.placeComplete.emit(true);
              }
              this.saveChangesFlag = false;
              this.isPolygonChanged = false;
              this.hoursFieldchanges = false;
            });
          }, error => {
            this.saveChangesFlag = false;
            this.dialog.open(ConfirmationDialogComponent, {
              data: {
                notifyMessage: true,
                confirmTitle: 'Error',
                messageText: error.error['api-message'] || 'Something went wrong'
              },
              width: '586px',
              panelClass: 'placeAuditInfoMsg'
            });
          });
      }
    } else {
      const dialogueData: ConfirmationDialog = {
        notifyMessage: false,
        confirmDesc: '<h4 class="confirm-text-icon">Your changes to the place will not be saved. Would you like to continue?</h4>',
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        headerCloseIcon: false
      };
      if (this.isPolygonChanged || !this.auditDetailForm.pristine || this.hoursFieldchanges) {
        this.dialog.open(ConfirmationDialogComponent, {
          data: dialogueData,
          disableClose: true,
          width: '586px',
          height: '210px'
        }).afterClosed().subscribe(result => {
          if (result && result['action']) {

            // resetting the layers toggle state
            this.placesFilterService.resetLayersToggleState();
            this.placeComplete.emit(true);
            this.isPolygonChanged = false;
          }
        });
      } else {
        this.placeComplete.emit(true);
        this.isPolygonChanged = false;
      }
    }
  }

  /**
   * This function is to load new map with empty data
   * @param type value will be either building or property
   */
  public addNewArea(type: AreaType) {
    this.setMapVisibleAttrs();
    this.facilityMapData.emit({
      type: type, polygonData: {},
      placePosition: this.placePosition,
      buildingAreaPolygon: this.buildingAreaPolygon
    });
  }

  /**
   * This function is to set the values which we used for map displaying
   */
  private setMapVisibleAttrs() {
    this.isExpandDetails = true;
    this.isFacilityMapOpen = true;
  }

  /**
   * This function is to open the facility map for editing of building/property area,
   * @param areaType value will be either building or property
   */
  public onOpenFacilityMap(areaType: AreaType) {
    this.setMapVisibleAttrs();
    switch (areaType) {
      case 'building':
        this.facilityMapData.emit({
          type: areaType,
          polygonData: this.buildingAreaPolygon,
          placePosition: this.placePosition
        });
        break;
      case 'property':
        this.facilityMapData.emit({
          type: areaType,
          polygonData: this.propertyArea,
          placePosition: this.placePosition,
          buildingAreaPolygon: this.buildingAreaPolygon
        });
        break;
    }
  }
  /**
   * This function is used to emit search params to here places component
   * @param type
   * @param searchInput
   */
  public onSearch(type: ElasticSearchType, searchText) {
    if (searchText) {
      this.isExpandDetails = true;
      this.listHereIdDetails.emit({ type: type, searchText: searchText });
    }
  }
  public copyValues(range: string) {
    const from = this.auditDetailForm.controls['hours']['controls']['mo']['controls']['from']['value'];
    const to = this.auditDetailForm.controls['hours']['controls']['mo']['controls']['to']['value'];
    const next = this.auditDetailForm.controls['hours']['controls']['mo']['controls']['next']['value'];
    // setting range by checking if this is weekdays only or all
    const limit = (range === this.duration.ALL) ? 6 : 4;
    const hours = this.auditDetailForm.get('hours') as FormArray;
    Object.keys(hours.controls).map((day, index) => {
      if (index !== 0 && index <= limit) {
        if (from && from !== 'undefined') {
          this.auditDetailForm.controls['hours']['controls'][day]['controls']['from'].patchValue(from);
          this.hoursFieldchanges = true;
        }
        if (to) {
          this.auditDetailForm.controls['hours']['controls'][day]['controls']['to'].patchValue(to);
          this.hoursFieldchanges = true;
        }
        if (next) {
          this.auditDetailForm.controls['hours']['controls'][day]['controls']['next'].patchValue(next);
        }
      } else if (index !== 0 &&  index >= limit) {
        this.auditDetailForm.controls['hours']['controls'][day]['controls']['from'].patchValue('');
        this.auditDetailForm.controls['hours']['controls'][day]['controls']['to'].patchValue('');
        this.auditDetailForm.controls['hours']['controls'][day]['controls']['next'].patchValue('');
      }
    });
  }
  public openPlacesDetail() {
    this.isCollapseDetails = false;
    this.isExpandDetails = true;
  }
  public collapseDetails() {
    this.isCollapseDetails = true;
    this.isExpandDetails = false;
  }
  public closeDetails(closeCreatePlace = false) {
    if (this.auditDetailForm.dirty || this.isPolygonChanged || closeCreatePlace) {
      const data: ConfirmationDialog = {
        notifyMessage: false,
        confirmDesc: '<h4 class="confirm-text-icon">Your changes to the place will not be saved. Would you like to continue?</h4>',
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        headerCloseIcon: false
      };
      this.dialog.open(ConfirmationDialogComponent, {
        data: data,
        width: '586px'
      }).afterClosed().subscribe(result => {
        if (result && result.action) {
          this.closeDetailsWindow.emit({ 'close': true });
          if (closeCreatePlace) {
            const placeData = {
              open: false,
              latlng: []
            };
            this.placesFilterService.setCreateNewPlace(placeData);
          }
        }
      });
    } else {
      this.closeDetailsWindow.emit({ 'close': true });
    }
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
    this.placesFilterService.resetLayersToggleState();
  }
  searchInformation(type: string) {
    const auditDetail = this.auditDetailForm.getRawValue();
    const coOrdinates = this.placePosition.length ? this.placePosition : [];
    // Commented code removed once client verified our cahnges based on IMXUIPRD-1939
    /*let subUrl = this.searchWordSeparate(auditDetail.name) +
      '%2C+' + this.searchWordSeparate(auditDetail.street) +
      '%2C+' + this.searchWordSeparate(auditDetail.city) +
      '%2C+' + this.searchWordSeparate(auditDetail.state) +
      '+' + this.searchWordSeparate(auditDetail.zipcode);*/

    const subURL =
      auditDetail.name +
      ' ' +
      auditDetail.street +
      ' ' +
      auditDetail.city +
      ' ' +
      auditDetail.state +
      ' ' +
      auditDetail.zipcode;

    /** encodeURIComponent function encodes special characters. In addition, it encodes the following characters: , / ? : @ & = + $ # */

    let url = 'https://www.google.com/search?q=' + encodeURIComponent(subURL);

    if (type === 'street') {
      const lat = coOrdinates[1];
      const long = coOrdinates[0];
      url = 'https://www.google.com/maps?q=' + encodeURIComponent(subURL);
      if (lat && long) {
        url += '&layer=c&cbll=' + lat + ',' + long;
      }
      url += '&cbp=11,0,0,0,0';
    }

    window.open(url, '_blank');
  }

  /**
   * This function is to set open hours
   * @param openHours
   */
  public setOpenHours(openHours = {}, isSafegraphData = false) {
    const dayNames = Object.keys(openHours);
    if (dayNames.length > 0) {
      const hours = this.auditDetailForm.get('hours') as FormArray;
      if (isSafegraphData) {
        Object.keys(hours.controls).map(day => {
          const dayName = dayNames.find(name => name.toLowerCase().includes(day));
          if (dayName && openHours[dayName][0]) {
            this.auditDetailForm.controls['hours']['controls'][day]['controls']['from'].patchValue(openHours[dayName][0].open.length > 3 ? openHours[dayName][0].open : `0${openHours[dayName][0].open}`);
            this.auditDetailForm.controls['hours']['controls'][day]['controls']['to'].patchValue(openHours[dayName][0].close.length > 3 ? openHours[dayName][0].close : `0${openHours[dayName][0].close}`);
          }
        });
      } else {
        Object.keys(hours.controls).map(day => {
          if (openHours[day]) {
            const time = openHours[day].trim().split('-');
            if (time[0] !== 'undefined') {
              this.auditDetailForm.controls['hours']['controls'][day]['controls']['from'].patchValue(time[0]);
            }
            this.auditDetailForm.controls['hours']['controls'][day]['controls']['to'].patchValue(time[1]);
          }
        });

      }
    }
  }

  /**
   * This function is to format hours data for API submission
   */
  private formatOpenHoursForAPI(hours: OpenHours<Hours>): OpenHours<string> {
    const data: OpenHours<string> = {};
    for (const day in hours) {
      if (hours.hasOwnProperty(day)) {
        if (hours[day]['from']) {
          data[day] = hours[day]['from'];
        }
        if (hours[day]['to']) {
          data[day] += `-${hours[day]['to']}`;
        }
         if (hours[day]['next']) {
          data[day] += ` 0000-${hours[day]['next']}`;
        }
      }
    }
    return data;
  }


  /**
   * This functions is to convert polygon to multipolygon
   */
  private convertPolygon(polygon) {
    let combinedFeature: any;
    if (polygon['type'] === 'MultiPolygon') {
      return polygon;
    }
    if (polygon['coordinates'].length === 1) {
      combinedFeature = { type: 'MultiPolygon', coordinates: [] };
      combinedFeature.coordinates.push(polygon['coordinates']);
      return combinedFeature;
    }
  }
  public selectAuditStatus(selectedAuditStatus) {
    if (selectedAuditStatus.value === 3) {
      this.isRequiredReview = true;
    } else {
      this.isRequiredReview = false;
      // if (this.auditDetailForm) {
      //   this.auditDetailForm.controls.outcome.setValue('');
      // }
    }
    this.onResize();
  }
  clearAllTimeData() {
    const hours = this.auditDetailForm.get('hours') as FormArray;
    Object.keys(hours.controls).map((day, index) => {
      this.auditDetailForm.controls['hours']['controls'][day]['controls']['from'].patchValue(null);
      this.auditDetailForm.controls['hours']['controls'][day]['controls']['to'].patchValue(null);
      this.auditDetailForm.controls['hours']['controls'][day]['controls']['next'].patchValue(null);
    });
  }
  openTimePicker(formGroup: string, field: HourType) {
    const data: TimePickerOpenEvent = {
      formGroup: formGroup,
      field: field,
    };
    this.dialog.open(TimepickerDialogComponent, {
      width: '600px',
      data: data,
    }).afterClosed()
      .pipe(filter(res => res))
      .subscribe((res: TimePickerResponse) => {
        const formattedTime = String(res.hour).padStart(2, '0') + String(res.minute).padStart(2, '0');
        if (res.batchApply) {
          switch (res.batchApply) {
            case 'applyAll':
              this.handleBatchApply(res.belongsTo.field, formattedTime, 6);
              break;
            default:
              this.handleBatchApply(res.belongsTo.field, formattedTime, 4);
              break;
          }
        } else {
          this.handleApply(res.belongsTo.formGroup, res.belongsTo.field, formattedTime);
          this.handleDependantValues(res.belongsTo.field, res.belongsTo.formGroup, formattedTime);
        }
    });
  }

  /**
   * Function to fill the open hours as batch operation limited to the length such as weekdays or all
   * @param field which field it is, either from, to, or next
   * @param value selected time in the picker
   * @param length how many form fields need to be filled from the top
   */
  private handleBatchApply(field: string, value: string, length: number): void {
    Object.keys(this.auditDetailForm.controls['hours']['controls']).forEach((day, index) => {
      if (index <= length) {
        this.auditDetailForm.controls['hours']['controls'][day]['controls'][field].patchValue(value);
        this.handleDependantValues(field, day, value);
      }
    });
  }

  /**
   * Function to fill just a single field
   * @param formGroup formGroup of the day of the week
   * @param field which field it is, either from, to, or next
   * @param value selected time in the picker
   */
  private handleApply(formGroup: string, field: string, value: string): void {
    // set value to the field
    this.auditDetailForm
      .controls['hours']['controls'][formGroup]['controls'][field]
      .patchValue(value);
  }

  /**
   * To set/reset To and Next day values based on user selection such as,
   * if next day is selected and to is selected or has a different value, it should be set to 2400
   * if to is selected, then next day value should be reset to empty
   * @param field field name
   * @param formGroup formgroup day of the week
   * @param value selected value
   */
  private handleDependantValues(field: string, formGroup: string, value: string) {
    // if next day is selected, to should be 2400
    if (field === 'next') {
      this.auditDetailForm
        .controls['hours']['controls'][formGroup]['controls']['to']
        .patchValue('2400');
    }
    // if to is selected and not 24, next day should be emptied
    if (field === 'to' && value !== '2400') {
      this.auditDetailForm
        .controls['hours']['controls'][formGroup]['controls']['next']
        .patchValue('');
    }
  }

  /**
   * This is being called from HTML
   * to disassociate the place with current client
   * @param {*} place
   * @memberof AuditDetailsComponent
   */
  public disassociatePlace(place) {
    let udp_place_id;
    const udpPlace = place;
    udpPlace.udp_places.map(udp_place => {
      if (udp_place.client_id === this.clientId) {
        udp_place_id = udp_place.udp_place_id;
      }
    });
    this.placeService.disAssociatePlace(place.place_id, udp_place_id).subscribe(response => {
     if (response['status'] === 'success') {
       const dialog: ConfirmationDialog = {
         notifyMessage: true,
         confirmTitle: 'Success',
         messageText: response['message'],
       };
       this.dialog.open(ConfirmationDialogComponent, {
         data: dialog,
         width: '586px'}).afterClosed().subscribe(result => {
           if (result) {
             this.placesFilterService.setReloadAuditPlace(result);
           }
         });
     } else {
       const dialog: ConfirmationDialog = {
         notifyMessage: true,
         confirmTitle: 'Error',
         messageText: response['message'],
       };
       this.dialog.open(ConfirmationDialogComponent, {
         data: dialog,
         width: '586px'});
     }
    }, (error: any) => {
          const dialog: ConfirmationDialog = {
            notifyMessage: true,
            confirmTitle: 'Error',
            messageText: error['error']['message'],
          };
          this.dialog.open(ConfirmationDialogComponent, {
            data: dialog,
            width: '586px'
          });
        });
   }

   /**
    * To find the duplicates in an array
    * @param {*} data as array
    * @returns array
    * @memberof AuditDetailsComponent
    */
   findDuplicatesinArray(arrayData) {
    return arrayData.filter((item, index) => arrayData.indexOf(item) !== index);
  }

  /**
   * @description
   *  toggle property area layer
   */
  togglePropertyAreaLayer() {
    this.placesFilterService.setPropertyAreaLayerToggleState();
  }

  /**
   * @description
   *  toggle building area layer
   */
  toggleBuildingAreaLayer() {
    this.placesFilterService.setBuildingAreaLayerToggleState();
  }


  /**
   * To add the Latitude & Longitude based on user added.
   */
  private onUpdateLatLong(latLongValue) {
      this.placePosition = [latLongValue['long'], latLongValue['lat']];
      setTimeout(() => {
        this.placesFilterService.setPlaceCoords(this.placePosition);
      }, 1000);
      this.buildAreaProperties.coordinates = this.placePosition;
      this.propertyAreaProperties.coordinates = this.placePosition;
  }

  /**
   * To delete the selected user defined place
   */
  public deleteUserDefinePlace() {
    const udpLength = this.place?.udp_places?.length;
    const udpPlaceId = this.place?.udp_places?.find(udp => udp.client_id === this.clientId);
    if (udpLength <= 0 || !udpPlaceId) {
      return;
    }
    const dialogueData: ConfirmationDialog = {
      notifyMessage: false,
      confirmDesc: '<h4 class="confirm-text-icon"> Are you sure you want to delete?</h4>',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      headerCloseIcon: false
    };
    this.dialog.open(ConfirmationDialogComponent, {
      data: dialogueData,
      disableClose: true,
      width: '586px',
      height: '180px'
    }).afterClosed().pipe(
      takeUntil(this.unSubscribe),
      switchMap( result => {
        if (result && result['action']) {
          return this.placeService.deleteUserDefinePlaceByID(udpPlaceId['udp_place_id'], this.clientId).pipe(catchError(error => {
            this.showMessage('Something went wrong. Please try again.', 'Error');
            return of({data: []});
          }));
        } else {
          return of({data: []});
        }
      })).subscribe(response => {
        if (response && response['api-message']) {
          this.showMessage(response['api-message'], 'Success');
          this.placesFilterService.resetLayersToggleState();
          this.placeComplete.emit(true);
          this.isPolygonChanged = false;
          /** if udp length less then 2 means remove the selecetd list from left side list view */
          if (udpLength < 2) {
            this.placesFilterService.setDeleteUdpPlace({udp_place_id: udpPlaceId['udp_place_id'], client_id: this.clientId,place_id: this.place['place_id']});
          }
        }
    }, error => {
      this.showMessage('Something went wrong. Please try again.', 'Error');
    });
  }

  showMessage(message, title= 'Success') {
    const dialogData: ConfirmationDialog = {
      notifyMessage: true,
      confirmTitle: title,
      messageText: message,
    };
    this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '586px'});
  }

  public openMarketDialog(type) {
    this.dialog.open(MarketsSelectorDialogComponent, {
      width: '600px',
      data: {'type': type},
    }).afterClosed().subscribe( res =>{
      if (res) {
          switch (type) {
            case 'DMA':
                this.selectedDMA = [...res['selectedMarkets']];
                this.auditDetailForm.controls['dma'].patchValue(this.selectedDMA[0]['name'])
              break;
            case 'County':
              this.selectedCounty = [...res['selectedMarkets']];
              this.auditDetailForm.controls['county'].patchValue(this.selectedCounty[0]['name'])
            break;              
            default:
              break;
          }
      }
    });
  }

  public clearMarket(type) {
    switch (type) {
      case 'DMA':
          this.selectedDMA = null;
          this.auditDetailForm.controls['dma'].patchValue('')
        break;
      case 'County':
        this.selectedCounty = null
        this.auditDetailForm.controls['county'].patchValue('')
      break;              
      default:
        break;
    }
  }
}
