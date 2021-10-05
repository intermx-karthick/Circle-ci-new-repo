import { Component, OnInit, EventEmitter, ChangeDetectionStrategy, Output, Input, ChangeDetectorRef, Inject, Optional, SkipSelf, AfterViewInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Options, LabelType } from '@angular-slider/ngx-slider';
import { FiltersService } from 'app/explore/filters/filters.service';
import { AuthenticationService, InventoryService, CommonService } from '@shared/services';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { Orientation } from 'app/classes/orientation';
import { Observable, Subject } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {Helper} from '../../classes';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { SummaryPanelActionService } from '../../workspace-v3/summary-panel-action.service';
@Component({
  selector: 'app-media-attribute-dialog',
  templateUrl: './media-attribute-dialog.component.html',
  styleUrls: ['./media-attribute-dialog.component.less']
})
// TODO: We need ot check and use MediaAttributesComponent as both contains almost same code
export class MediaAttributeDialogComponent
  implements OnInit, AfterViewInit, OnDestroy {
  public mediaAttributes: any = [
    {
      label: 'Orientation',
      key: 'orientationList',
      options: ['N', 'E', 'S', 'W', 'NE', 'SE', 'SW', 'NW', 'All']
    },
    {
      label: 'Spot Dimensions',
      key: 'panelSizeRange',
      options: [
        {
          title: 'Height in Feet',
          key: 'panelSizeHeightRange',
          range: ['min', 'max']
        },
        {
          title: 'Width in Feet',
          key: 'panelSizeWidthRange',
          range: ['min', 'max']
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
  public manualRefresh: EventEmitter<void> = new EventEmitter<void>();
  public illuminationChangeValue = false;
  public illuminationOption: Options = {
    floor: 0,
    ceil: 24,
    minLimit: 0,
    step: 1,
    noSwitching: true,
    translate: (value: number, l: LabelType): string => {
      const label = this.filterService.timeConvert(value + ':00:00');
      return '<span class="label-value">' + label + '</span>';
    }
  };
  public illuminationRangeValue = [0, 24];
  // public auditStatuses: AuditStatus[] = [];
  public selectedStatuses = [];
  // To store static options names
  public auditStatuses = [
    { displayName: 'Measured', name: 'Published - Measured' },
    { displayName: 'Under Review', name: 'Published - Under Review' },
    { displayName: 'Suppressed', name: 'Published - Suppressed' },
    { displayName: 'Unmeasured', name: 'Published - Unmeasured' }
  ];
  @Input() public appliedMediaAttributes: Observable<any>;
  @Input() public moduleName;
  @Output() applyMediaAttribute = new EventEmitter();
  private unsubscribe = new Subject();
  siteName: any;
  constructor(
    private fb: FormBuilder,
    private filterService: FiltersService,
    private authService: AuthenticationService,
    private inventoryService: InventoryService,
    private cd: ChangeDetectorRef,
    @Optional() @SkipSelf()  public dialogRef: MatDialogRef<MediaAttributeDialogComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public data: any,
    private summaryPanelAction: SummaryPanelActionService,
    private commonService: CommonService
  ) {}

  ngOnInit() {
    this.siteName = this.commonService.getSiteName();
    const modulePermissions = this.authService.getModuleAccess('explore');
    if (
      modulePermissions?.['features']?.['customInventories']?.['status'] === 'active'
    ) {
      this.auditStatuses.push({
        displayName: 'Unaudited ',
        name: 'Unaudited '
      });
    }
    this.mediaAttributeForm = this.fb.group({
      orientationList: new FormControl(this.selectedOrientation),
      illuminationHrsRange: this.fb.group({
        min: null,
        max: null
      }),
      panelSizeWidthRange: this.fb.group(
        {
          min: null,
          max: null
        },
        { validator: CustomValidators.validNumberRange('min', 'max') }
      ),
      panelSizeHeightRange: this.fb.group(
        {
          min: null,
          max: null
        },
        { validator: CustomValidators.validNumberRange('min', 'max') }
      ),
      spotLength: this.fb.group(
        {
          min: null,
          max: null
        },
        { validator: CustomValidators.validNumberRange('min', 'max') }
      ),
      movementList: new FormControl(''),
      auditStatusList: new FormControl(),
      spotAudio: new FormControl(''),
      spotFullMotion: new FormControl(''),
      spotPartialMotion: new FormControl(''),
      spotInteractive: new FormControl('')
    });

    if (this.data?.['data']) {
      this.updateData(this.data['data']);
    }
    if (this.moduleName === 'project') {
      this.mediaAttributeForm.valueChanges
        .pipe(debounceTime(500), takeUntil(this.unsubscribe))
        .subscribe((value) => {
          const data ={formValues:{},mediaAttributeForm: false}
          data.formValues = Helper.deepClone(this.formatGPFilter(value));
          data.mediaAttributeForm = this.mediaAttributeForm.invalid;
          if (Object.keys(data).length !== 0) {
            this.applyMediaAttribute.emit(data);
          } else {
            this.applyMediaAttribute.emit({});
          } 
        });
    }
    this.appliedMediaAttributes?.subscribe((data) => {
      if (data) {
        this.updateData(data);
      }
    });
    this.summaryPanelAction.deleteMediaAttr().pipe(takeUntil(this.unsubscribe)).subscribe((data) => {
      this.updateData(data);
    });
  }

  ngAfterViewInit() {
    if (this.moduleName === 'project') {
      setTimeout(() => {
        this.inventoryService.clearButtonSource
          ?.pipe(takeUntil(this.unsubscribe))
          ?.subscribe((res) => {
            this.mediaAttributeForm.reset();
            this.cd.markForCheck();
          });
      }, 1000);
    }
  }

  updateData(media) {
    if (media['orientationList']) {
      const orientation = new Orientation();
      if (
        media['orientationList']['option'] &&
        media['orientationList']['option'] === 'All'
      ) {
        this.selectedOrientation = media['orientationList']['option'];
      } else {
        this.selectedOrientation = orientation.degreeToDirection(
          media['orientationList']
        );
      }
      this.mediaAttributeForm.controls['orientationList'].patchValue(
        this.selectedOrientation
      );
    } else {
      this.mediaAttributeForm.controls['orientationList'].patchValue(null);
    }
    if (media['panelSizeWidthRange']) {
      this.panelSizeWidthRange = [
        media['panelSizeWidthRange'][0],
        media['panelSizeWidthRange'][1]
      ];
      this.mediaAttributeForm.controls['panelSizeWidthRange']['controls'][
        'min'
      ].patchValue(this.panelSizeWidthRange[0]);
      this.mediaAttributeForm.controls['panelSizeWidthRange']['controls'][
        'max'
      ].patchValue(this.panelSizeWidthRange[1]);
    } else {
      this.mediaAttributeForm.controls['panelSizeWidthRange']['controls'][
        'min'
      ].patchValue(null);
      this.mediaAttributeForm.controls['panelSizeWidthRange']['controls'][
        'max'
      ].patchValue(null);
    }

    if (media['panelSizeHeightRange']) {
      this.panelSizeHeightRange = [
        media['panelSizeHeightRange'][0],
        media['panelSizeHeightRange'][1]
      ];
      this.mediaAttributeForm.controls['panelSizeHeightRange']['controls'][
        'min'
      ].patchValue(this.panelSizeHeightRange[0]);
      this.mediaAttributeForm.controls['panelSizeHeightRange']['controls'][
        'max'
      ].patchValue(this.panelSizeHeightRange[1]);
    } else {
      this.mediaAttributeForm.controls['panelSizeHeightRange']['controls'][
        'min'
      ].patchValue(null);
      this.mediaAttributeForm.controls['panelSizeHeightRange']['controls'][
        'max'
      ].patchValue(null);
    }
    if (media['spotLength']) {
      this.spotLengthRange = [
        media['spotLength']['min'],
        media['spotLength']['max']
      ];
      this.mediaAttributeForm.controls['spotLength']['controls'][
        'min'
      ].patchValue(this.spotLengthRange[0]);
      this.mediaAttributeForm.controls['spotLength']['controls'][
        'max'
      ].patchValue(this.spotLengthRange[1]);
    } else {
      this.mediaAttributeForm.controls['spotLength']['controls'][
        'min'
      ].patchValue(null);
      this.mediaAttributeForm.controls['spotLength']['controls'][
        'max'
      ].patchValue(null);
    }
    if (media['illuminationHrsRange']) {
      this.illuminationRangeValue[0] = Number(
        media['illuminationHrsRange'][0] !== '23:59:59'
          ? media['illuminationHrsRange'][0].substr(0, 2)
          : 24
      );
      this.illuminationRangeValue[1] = Number(
        media['illuminationHrsRange'][1] !== '23:59:59'
          ? media['illuminationHrsRange'][1].substr(0, 2)
          : 24
      );
      this.illuminationChangeValue = true;
      this.updateIllumationHrs();
    } else {
      this.illuminationRangeValue = [0, 24];
      this.mediaAttributeForm['controls'].illuminationHrsRange.patchValue({
        min: null,
        max: null
      });
      this.illuminationChangeValue = false;
    }

    if (media['rotating'] !== null && media['rotating'] !== undefined) {
      this.selectedMovement = media['rotating'];
      this.mediaAttributeForm.controls['movementList'].patchValue(
        this.selectedMovement
      );
    } else {
      this.mediaAttributeForm.controls['movementList'].patchValue('');
    }

    if (media['auditStatusList'] && media['auditStatusList'].length) {
      this.selectedStatuses = media['auditStatusList'];
      this.mediaAttributeForm.controls['auditStatusList'].patchValue(
        this.selectedStatuses
      );
    } else {
      this.mediaAttributeForm.controls['auditStatusList'].patchValue([]);
    }
    if (media['spotAudio'] !== undefined && media['spotAudio'] !== '') {
      this.mediaAttributeForm.controls['spotAudio'].patchValue(
        media['spotAudio']
      );
    } else {
      this.mediaAttributeForm.controls['spotAudio'].patchValue('');
    }

    if (
      media['spotFullMotion'] !== undefined &&
      media['spotFullMotion'] !== ''
    ) {
      this.mediaAttributeForm.controls['spotFullMotion'].patchValue(
        media['spotFullMotion']
      );
    } else {
      this.mediaAttributeForm.controls['spotFullMotion'].patchValue('');
    }

    if (
      media['spotPartialMotion'] !== undefined &&
      media['spotPartialMotion'] !== ''
    ) {
      this.mediaAttributeForm.controls['spotPartialMotion'].patchValue(
        media['spotPartialMotion']
      );
    } else {
      this.mediaAttributeForm.controls['spotPartialMotion'].patchValue('');
    }

    if (
      media['spotInteractive'] !== undefined &&
      media['spotInteractive'] !== ''
    ) {
      this.mediaAttributeForm.controls['spotInteractive'].patchValue(
        media['spotInteractive']
      );
    } else {
      this.mediaAttributeForm.controls['spotInteractive'].patchValue('');
    }
    this.cd.markForCheck();
  }

  formatTimeLable(time): string {
    return this.filterService.timeConvert(time + ':00:00');
  }

  // Compare function for mat-selection
  public compare(c1, c2) {
    return c1 && c2 && c1['name'] === c2['name'];
  }

  public onSelectionOrientationChange() {
    if (this.mediaAttributeForm.value['orientationList']) {
      this.selectedOrientation = this.mediaAttributeForm.value[
        'orientationList'
      ];
    } else {
      this.selectedOrientation = '';
    }
  }

  public onMovementChange() {
    this.selectedMovement = this.mediaAttributeForm.value['movementList'];
  }

  onSubmit(formData) {
    // To update the current illumination hours range
    this.updateIllumationHrs();
    if (!formData.invalid) {
      const data = Helper.deepClone(this.formatGPFilter(formData.value));
      if (Object.keys(data).length !== 0) {
        this.dialogRef.close({ data: Helper.deepClone(data) });
      } else {
        this.dialogRef.close({ data: {} });
      }
    }
  }
  // To patch the illumination hours range
  updateIllumationHrs() {
    this.mediaAttributeForm['controls'].illuminationHrsRange.patchValue({
      min: this.illuminationRangeValue[0],
      max: this.illuminationRangeValue[1]
    });
  }
  formatGPFilter(data) {
    const formatData = Object.assign({}, data);

    if (data.orientationList) {
      formatData['orientationList'] = {};
      const orientation = new Orientation();
      if (data.orientationList === 'All') {
        formatData['orientationList'] = {
          min: null,
          max: null,
          option: 'All'
        };
      } else {
        formatData['orientationList'] = orientation.directionToDegree(
          data['orientationList']
        );
      }
    } else {
      delete formatData['orientationList'];
    }

    const panelSizeWidthRangeMin = formatData['panelSizeWidthRange']['min'];
    const panelSizeWidthRangeMax = formatData['panelSizeWidthRange']['max'];

    const spotLengthRangeMin = formatData['spotLength']['min'];
    const spotLengthRangeMax = formatData['spotLength']['max'];

    const panelSizeHeightRangeMin = formatData['panelSizeHeightRange']['min'];
    const panelSizeHeightRangeMax = formatData['panelSizeHeightRange']['max'];

    /** To format panelSizeWidthRange */
    if (
      !Number(panelSizeWidthRangeMin) &&
      panelSizeWidthRangeMin !== '0' &&
      !Number(panelSizeWidthRangeMax)
    ) {
      delete formatData['panelSizeWidthRange'];
      this.panelSizeWidthRange = [];
    } else {
      const panelSizeWidthRange = this.formatMinMax(
        panelSizeWidthRangeMin,
        panelSizeWidthRangeMax
      );
      // if (panelSizeWidthRange[0] === '0') {
      //   this.mediaAttributeForm['controls'].panelSizeWidthRange['controls'][
      //     'min'
      //   ].patchValue(0);
      // }
      formatData['panelSizeWidthRange'] = panelSizeWidthRange;
    }

    /** To format panelSizeHeightRange */
    if (
      !Number(panelSizeHeightRangeMin) &&
      panelSizeHeightRangeMin !== '0' &&
      !Number(panelSizeHeightRangeMax)
    ) {
      delete formatData['panelSizeHeightRange'];
      this.panelSizeHeightRange = [];
    } else {
      const panelSizeHeightRange = this.formatMinMax(
        panelSizeHeightRangeMin,
        panelSizeHeightRangeMax
      );
      /* if (panelSizeHeightRange[0] === '0') {
        this.mediaAttributeForm['controls'].panelSizeHeightRange['controls'][
          'min'
        ].patchValue(0);
      } */
      formatData['panelSizeHeightRange'] = panelSizeHeightRange;
    }
    /** To format SPOT lENGTH */
    if (
      !Number(spotLengthRangeMin) &&
      spotLengthRangeMin !== '0' &&
      !Number(spotLengthRangeMax)
    ) {
      delete formatData['spotLength'];
      this.spotLengthRange = [];
    } else {
      formatData['spotLength'] = data.spotLength;
    }

    /** To format illuminationHrsRange */
    const illuminationMin = formatData['illuminationHrsRange']['min'];
    const illuminationMax = formatData['illuminationHrsRange']['max'];
    if (
      (illuminationMin >= 0 || illuminationMax <= 24) &&
      this.illuminationChangeValue
    ) {
      const illuminationHrsRange = this.formatMinMaxIllmunination(
        illuminationMin,
        illuminationMax
      );
      formatData['illuminationHrsRange'] = illuminationHrsRange;
    } else {
      delete formatData['illuminationHrsRange'];
    }

    formatData['rotating'] = data.movementList;
    delete formatData['movementList'];

    if (formatData['rotating'] === '') {
      delete formatData['rotating'];
    }
    /** For audit status filter */
    if (data.auditStatusList && data.auditStatusList.length > 0) {
      formatData['auditStatusList'] = data.auditStatusList;
    } else {
      delete formatData['auditStatusList'];
    }
    if (formatData['spotAudio'] === '') {
      delete formatData['spotAudio'];
    }
    if (formatData['spotFullMotion'] === '') {
      delete formatData['spotFullMotion'];
    }
    if (formatData['spotPartialMotion'] === '') {
      delete formatData['spotPartialMotion'];
    }
    if (formatData['spotInteractive'] === '') {
      delete formatData['spotInteractive'];
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
  /** This function to identify the n5-slider changes */
  public illuminationChange(event) {
    this.illuminationChangeValue = true;
    this.updateIllumationHrs();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
