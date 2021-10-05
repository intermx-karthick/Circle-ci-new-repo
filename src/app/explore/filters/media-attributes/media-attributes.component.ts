import { Component, OnInit, OnDestroy, ViewChild, EventEmitter } from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import { takeWhile } from 'rxjs/operators';
import {Orientation} from '../../../classes/orientation';
import { FiltersService } from '../filters.service';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { Options, LabelType } from '@angular-slider/ngx-slider';
import { InventoryService, AuthenticationService, CommonService } from '@shared/services';
import { AuditStatus } from '@interTypes/inventory';


@Component({
  selector: 'app-media-attributes',
  templateUrl: './media-attributes.component.html',
  styleUrls: ['./media-attributes.component.less']
})
export class MediaAttributesComponent implements OnInit, OnDestroy {
  public unSubscribe = true;
  public mediaAttributes: any = [
    {
      label: 'Orientation',
      key: 'orientationList',
      options: [
        'N',
        'E',
        'S',
        'W',
        'NE',
        'SE',
        'SW',
        'NW',
        'All'
      ]
    },
    {
      label: 'Spot Dimensions',
      key: 'panelSizeRange',
      options: [
        {
          title: 'Height in Feet',
          key: 'panelSizeHeightRange',
          range: [
            'min',
            'max'
          ]
        },
        {
          title: 'Width in Feet',
          key: 'panelSizeWidthRange',
          range: [
            'min',
            'max'
          ]
        }
      ]
    },
    {
      label: 'Spot Length',
      key: 'spotLength',
      options: [
        {
          title: 'Range in Seconds',
          key: 'spotLength',
          range: ['min', 'max']
        }
      ]
    }
  ];
  public mediaAttributesFilter: any = [];
  public mediaAttributeForm: FormGroup;
  public OrientationList: any = [];
  public readList: any = [];
  public selectedOrientation = '';
  public selectedMovement: boolean | string = '';

  public illuminationHrsRange: any = [];
  public panelSizeWidthRange: any = [];
  public panelSizeHeightRange: any = [];
  public spotLengthRange: any = [];
  private generageMediaAttributeForm = false;
  public manualRefresh: EventEmitter<void> = new EventEmitter<void>();
  illuminationChangeValue = false;
  public illuminationOption: Options = {
    floor: 0,
    ceil: 24,
    minLimit: 0,
    step: 1,
    noSwitching: true,
    translate: (value: number, l: LabelType): string => {
      const label =  this.filterService.timeConvert(value + ':00:00');
      return '<span class="label-value">' +  label + '</span>';
    }
  };
  public illuminationRangeValue = [0, 24];
  // public auditStatuses: AuditStatus[] = [];
  public selectedStatuses = [];
  // To store static options names
  public auditStatuses = [
    {displayName: 'Measured', name: 'Published - Measured'},
    {displayName: 'Under Review', name: 'Published - Under Review'},
    {displayName: 'Suppressed', name: 'Published - Suppressed'},
    {displayName: 'Unmeasured', name: 'Published - Unmeasured'}
  ];
  public siteName: any;

 // @ViewChild('refOrientation', { static: false}) refOrientation;
  constructor(
    private fb: FormBuilder,
    private filterService: FiltersService,
    private inventoryService: InventoryService,
    private authService: AuthenticationService,
    private commonService: CommonService) {
  }

  ngOnInit() {
    // Commented as we are going to display static options
    /*
    this.inventoryService.getAuditStatusList().pipe(takeWhile(() => this.unSubscribe)).subscribe(response => {
      this.auditStatuses = response;
    }); */
    const modulePermissions = this.authService.getModuleAccess('explore');
    this.siteName = this.commonService.getSiteName();
    if (modulePermissions['features']['customInventories']['status']  === 'active') {
      this.auditStatuses.push({displayName: 'Unaudited ', name: 'Unaudited '});
    }
    this.generateForm();
    this.loadFilterFromSession();
    this.filterService.onReset()
    .subscribe(type => {
      if (type !== 'All' && type !== 'FilterInventory') {
        this.mediaAttributes = [];
      }
      this.clearMediaFilter();
    });
    this.filterService.checkSessionDataPushed()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(val => {
        if (val) {
          this.loadFilterFromSession();
        }
      });
  }
  loadFilterFromSession() {
    const filters = this.filterService.getExploreSession();
    if (filters) {
      if (
          typeof filters['data'] !== 'undefined' &&
          typeof filters['data']['mediaAttributes'] !== 'undefined'
        ) {
        const mediaFilter = filters['data']['mediaAttributes'];
        if (mediaFilter['movementList'] !== null && mediaFilter['movementList'] !== undefined) {
          this.selectedMovement = mediaFilter['movementList'];
          delete mediaFilter['movementList'];
        }
        if (mediaFilter['auditStatusList'] && mediaFilter['auditStatusList'].length) {
          this.selectedStatuses = mediaFilter['auditStatusList'];
          delete mediaFilter['auditStatusList'];
        }
        this.mediaAttributesFilter = mediaFilter;
        if (this.mediaAttributesFilter['orientationList']) {
          const orientation = new Orientation();
          this.selectedOrientation = orientation.degreeToDirection(this.mediaAttributesFilter['orientationList']);
          if (this.generageMediaAttributeForm) {
            this.mediaAttributeForm.controls['orientationList'].patchValue(this.selectedOrientation);
          }
        } else {
          const OrientationAll = localStorage.getItem('orientation');
          if (OrientationAll && OrientationAll === 'All') {
            this.mediaAttributeForm.controls['orientationList'].patchValue(OrientationAll);
            this.selectedOrientation = OrientationAll;
          } else {
            this.selectedOrientation = '';
          }
        }
        if (mediaFilter.spotLength) {
          this.spotLengthRange = [filters.data.mediaAttributes.spotLength['min'],
            filters.data.mediaAttributes.spotLength['max']
          ];
        }
        this.generateForm();
      }
    }
  }
  generateForm() {
    /*if (this.illuminationHrsRange.length === 0) {
      this.illuminationHrsRange[0] = this.mediaAttributesFilter['illuminationHrsRange']
                                     && this.mediaAttributesFilter['illuminationHrsRange'][0] || null;
      this.illuminationHrsRange[1] = this.mediaAttributesFilter['illuminationHrsRange'] && this.mediaAttributesFilter['illuminationHrsRange'][1] || null;
    }

    if (this.illuminationHrsRange[0] === null && this.illuminationHrsRange[1] === null) {
      this.illuminationHrsRange = [];
    } */

    if (this.panelSizeWidthRange.length === 0 && this.mediaAttributesFilter['panelSizeWidthRange']) {
      this.panelSizeWidthRange = [
        this.mediaAttributesFilter['panelSizeWidthRange'][0],
        this.mediaAttributesFilter['panelSizeWidthRange'][1]
      ];
    }

    if (this.panelSizeHeightRange.length === 0 && this.mediaAttributesFilter['panelSizeHeightRange']) {
      this.panelSizeHeightRange = [
        this.mediaAttributesFilter['panelSizeHeightRange'][0],
        this.mediaAttributesFilter['panelSizeHeightRange'][1]
      ];
    }

    this.mediaAttributeForm = this.fb.group({
      orientationList: new FormControl(this.selectedOrientation),
      illuminationHrsRange: this.fb.group({
        min: this.illuminationRangeValue[0],
        max: this.illuminationRangeValue[1]
      }),
      panelSizeWidthRange: this.fb.group(
        {
          min: this.panelSizeWidthRange[0],
          max: this.panelSizeWidthRange[1]
        },
        { validator: CustomValidators.validRange('min', 'max') }
      ),
      panelSizeHeightRange: this.fb.group(
        {
          min: this.panelSizeHeightRange[0],
          max: this.panelSizeHeightRange[1]
        },
        { validator: CustomValidators.validRange('min', 'max') }
      ),
      spotLength: this.fb.group(
        {
          min: this.spotLengthRange[0],
          max: this.spotLengthRange[1]
        },
        { validator: CustomValidators.validRange('min', 'max') }
      ),
      movementList: new FormControl(this.selectedMovement),
      auditStatusList: new FormControl(this.selectedStatuses),
      spotAudio: '',
      spotFullMotion: '',
      spotPartialMotion: '',
      spotInteractive: ''
    });
    if (this.mediaAttributesFilter['illuminationHrsRange']) {
      this.illuminationRangeValue[0] = Number(
        this.mediaAttributesFilter['illuminationHrsRange'][0] !== '23:59:59'
          ? this.mediaAttributesFilter['illuminationHrsRange'][0].substr(0, 2)
          : 24);
      this.illuminationRangeValue[1] = Number(
        this.mediaAttributesFilter['illuminationHrsRange'][1] !== '23:59:59'
          ? this.mediaAttributesFilter['illuminationHrsRange'][1].substr(0, 2) : 24);
      this.updateIllumationHrs();
      this.illuminationChangeValue = true;
    } else {
      this.illuminationChangeValue = false;
    }
    if (this.mediaAttributesFilter['spotAudio'] !== undefined &&
      this.mediaAttributesFilter['spotAudio'] !== '') {
      this.mediaAttributeForm.controls['spotAudio'].patchValue(
        this.mediaAttributesFilter['spotAudio']);
    }

    if (this.mediaAttributesFilter['spotFullMotion'] !== undefined &&
      this.mediaAttributesFilter['spotFullMotion'] !== '') {
      this.mediaAttributeForm.controls['spotFullMotion'].patchValue(
        this.mediaAttributesFilter['spotFullMotion']);
    }

    if (this.mediaAttributesFilter['spotPartialMotion'] !== undefined &&
      this.mediaAttributesFilter['spotPartialMotion'] !== '') {
      this.mediaAttributeForm.controls['spotPartialMotion'].patchValue(
        this.mediaAttributesFilter['spotPartialMotion']);
    }
    
    if (this.mediaAttributesFilter['spotInteractive'] !== undefined &&
      this.mediaAttributesFilter['spotInteractive'] !== '') {
      this.mediaAttributeForm.controls['spotInteractive'].patchValue(
        this.mediaAttributesFilter['spotInteractive']);
    }
    this.mediaAttributesFilter = [];
    this.generageMediaAttributeForm = true;
  }
  ngOnDestroy() {
    this.unSubscribe = false;
  }
  onSubmit(formData) {
    // To update the current illumination hours range
    this.updateIllumationHrs();
    if (!formData.invalid) {
      const data = this.formatGPFilter(formData.value);
      if (Object.keys(data).length !== 0) {
        this.filterService.setFilter('mediaAttributes', data);
      } else {
       this.clearMediaFilter();
      }
    }
  }
   // To patch the illumination hours range
  updateIllumationHrs() {
    this.mediaAttributeForm['controls'].illuminationHrsRange['controls'].min.patchValue(this.illuminationRangeValue[0]);
    this.mediaAttributeForm['controls'].illuminationHrsRange['controls'].max.patchValue(this.illuminationRangeValue[1]);
  }
  formatGPFilter(data) {
    const formatData = Object.assign({}, data);
    if (data.orientationList) {
      formatData['orientationList'] = {};
      const orientation = new Orientation();
      formatData['orientationList'] = orientation.directionToDegree(data['orientationList']);
      if (data['orientationList'] === 'All') {
        localStorage.setItem('orientation', data['orientationList']);
      } else {
        localStorage.removeItem('orientation');
      }
    }
    const panelSizeWidthRangeMin = formatData['panelSizeWidthRange']['min'];
    const panelSizeWidthRangeMax = formatData['panelSizeWidthRange']['max'];

    const panelSizeHeightRangeMin = formatData['panelSizeHeightRange']['min'];
    const panelSizeHeightRangeMax = formatData['panelSizeHeightRange']['max'];
    
    /** To format panelSizeWidthRange */
    if ((!Number(panelSizeWidthRangeMin) && panelSizeWidthRangeMin !== '0') && !Number(panelSizeWidthRangeMax)) {
      delete formatData['panelSizeWidthRange'];
      this.panelSizeWidthRange = [];
    } else {
      const panelSizeWidthRange =  this.formatMinMax(panelSizeWidthRangeMin, panelSizeWidthRangeMax);
      if (panelSizeWidthRange[0] === '0') {
      this.mediaAttributeForm['controls'].panelSizeWidthRange['controls']['min'].patchValue(0);
      }
      formatData['panelSizeWidthRange'] = panelSizeWidthRange;
    }

    /** To format panelSizeHeightRange */
    if ((!Number(panelSizeHeightRangeMin) && panelSizeHeightRangeMin !== '0') && !Number(panelSizeHeightRangeMax)) {
      delete formatData['panelSizeHeightRange'];
      this.panelSizeHeightRange = [];
    } else {
      const panelSizeHeightRange =  this.formatMinMax(panelSizeHeightRangeMin, panelSizeHeightRangeMax);
      if (panelSizeHeightRange[0] === '0') {
      this.mediaAttributeForm['controls'].panelSizeHeightRange['controls']['min'].patchValue(0);
      }
      formatData['panelSizeHeightRange'] = panelSizeHeightRange;
    }


    /** To format illuminationHrsRange */
    const illuminationMin = formatData['illuminationHrsRange']['min'];
    const illuminationMax = formatData['illuminationHrsRange']['max'];
    if ((illuminationMin >= 0 || illuminationMax <= 24) && this.illuminationChangeValue ) {
      const illuminationHrsRange =  this.formatMinMaxIllmunination(illuminationMin, illuminationMax);
      formatData['illuminationHrsRange'] = illuminationHrsRange;
    } else {
      delete formatData['illuminationHrsRange'];
    }

    /** For Rotation filter**/
    if (data.movementList === 'all') {
      delete formatData['rotating'];
    } else {
      formatData['rotating'] = data.movementList;
    }
    /** For audit status filter */
   if (data.auditStatusList && data.auditStatusList.length > 0) {
      formatData['auditStatusList'] = data.auditStatusList;
    } else {
      delete formatData['auditStatusList'];
    }
    if (data?.spotLength?.min && data?.spotLength?.max) {
      formatData['spotLength'] = data.spotLength;
    } else {
      delete formatData['spotLength'];
    }
    return formatData;
  }

  formatMinMaxIllmunination(minValue, maxValue) {
    let arrayformat = [];
    let minRange = minValue < 10 ? '0' + minValue : '' + minValue;
    let maxRange = maxValue < 10 ? '0' + maxValue : '' + maxValue;
    if (Number(minRange) === 24) {
      minRange = '23:59:59';
    } else {
      minRange = minRange + ':00:00';
    }
    if (Number(maxRange) === 24) {
      maxRange = '23:59:59';
    } else {
      maxRange = maxRange + ':00:00';
    }
    arrayformat[0] = minRange;
    arrayformat[1] = maxRange;
    return arrayformat;
  }

  formatMinMax(minValue, maxValue) {
    let arrayformat = [];
     if ((Number(minValue) || minValue === '0') && !Number(maxValue)) {
      arrayformat = [minValue];
    } else {
      if (!Number(minValue) && Number(maxValue)) {
        arrayformat = ['0', maxValue];
      } else {
        arrayformat = [minValue, maxValue];
      }
    }
    return arrayformat;
  }

  selectionOrientationList(selecetd, all) {
    this.mediaAttributes.map(attribute => {
      if (attribute['key'] === 'orientationList' ) {
        this.OrientationList = attribute['options'];
      }
    });
    if (selecetd === all) {
      this.mediaAttributeForm['controls'].orientationList.patchValue([]);
    } else {
      this.mediaAttributeForm['controls'].orientationList.patchValue(this.OrientationList);
    }
  }

  selectionreadListList(selecetd, all) {
    this.mediaAttributes.map(attribute => {
      if (attribute['key'] === 'readList' ) {
        this.readList = attribute['options'];
      }
    });
    if (selecetd === all) {
      this.mediaAttributeForm['controls'].readList.patchValue([]);
    } else {
      this.mediaAttributeForm['controls'].readList.patchValue(this.readList);
    }
  }

  public clearMediaFilter() {
    if (this.mediaAttributeForm) {
      this.mediaAttributeForm.reset();
    }
    this.mediaAttributesFilter = [];
    this.OrientationList  = [];
    this.selectedOrientation = '';
    this.illuminationHrsRange = [];
    this.panelSizeWidthRange = [];
    this.panelSizeHeightRange = [];
    this.illuminationRangeValue = [0, 24];
    this.spotLengthRange = [];
    this.selectedMovement = '';
    this.selectedStatuses = [];
    this.filterService.clearFilter('mediaAttributes', true);
    localStorage.removeItem('orientation');
    this.illuminationChangeValue = false;
  }
  public onSelectionOrientationChange() {
    if (this.mediaAttributeForm.value['orientationList']) {
      this.selectedOrientation = this.mediaAttributeForm.value['orientationList'];
      // this.refOrientation.checked = true;
    } else {
      this.selectedOrientation = '';
    }
  }
  
  public onMovementChange() {
    this.selectedMovement = this.mediaAttributeForm.value['movementList'];
  }

  formatTimeLable(time ): string {
    return this.filterService.timeConvert( time + ':00:00');
  }


  // Compare function for mat-selection
  public compare(c1, c2) {
    return c1 && c2 && c1['name'] === c2['name'];
  }

  public illuminationChange(event) {
    this.illuminationChangeValue = true;
  }
}
