import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder } from '@angular/forms';
import { PlacesFiltersService } from '../filters/places-filters.service';
import swal from 'sweetalert2';
import { PlacesDataService, ThemeService } from '@shared/services';
import { Attribute } from '@angular/compiler';
import {Helper} from '../../classes';

@Component({
  selector: 'app-request-audit-dialog',
  templateUrl: './request-audit-dialog.component.html',
  styleUrls: ['./request-audit-dialog.component.less']
})
export class RequestAuditDialogComponent implements OnInit {
  public placeDetail: any;
  public contentHeight: number;
  public dialogContentHeight: number;
  requestAuditForm: FormGroup;
  requestAuditData = [
    {
      name: 'Place Name',
      id: 'placeName',
      data: ['place_name']
    },
    {
      name: 'Address',
      id: 'address',
      data: ['street_address'] // 'city', 'state', 'zip_code'
    },
    {
      name: 'Brands',
      id: 'brands',
      data: ['brands']
    },
    {
      name: 'Industry',
      id: 'industry',
      data: ['top_category', 'sub_category', 'naics_code']
    },
    {
      name: 'Where Visitors Work',
      id : 'visitorsWork',
      data: ['where_visitors_work']
    },
    {
      name: 'Where Visitors Live',
      id: 'visitorsLive',
      data: ['where_visitors_live']
    },
    {
      name: 'Hours of Operation',
      id: 'hoursOperation',
      data: ['open_hours']
    },
    {
      name: 'Popularity by Hour',
      id: 'byHours',
      data: ['popularity_by_hour']
    },
    {
      name: 'Popularity by Day of Week',
      id: 'byDayOfWeek',
      data: ['popularity_by_day']
    },
    {
      name: 'Popularity by Month of Year',
      id: 'byMonthOfYear',
      data: ['raw_visit_counts']
    },
    {
      name: 'Average Dwell Time',
      id: 'avgDwellTime',
      data: ['median_dwell']
    },
    {
      name: 'Same Day Visits',
      id: 'dayVisit',
      data: ['related_same_day_brand']
    },
    {
      name: 'Same Month Visits',
      id: 'monthVisit',
      data: ['related_same_month_brand']
    },
    {
      name: 'Device Type',
      id: 'deviceType',
      data: ['device_type']
    }
  ];
  public selectedRequestAudits = [];

  public isTraWorkMore = true;
  public isAudit = false;
  public popularityByHours = [];
  public popularityByDays = [];
  public popularityByMonths = [];
  chartConfig = {
    width: 420,
    height: 120,
    tooltip: '<div>##NAME## Average:<br>##VALUE##% of Activities</div>',
    xAxis: true,
    yAxis: false,
    margin: {top: 20, right: 20, bottom: 25, left: 25}
  };
  public loadMoreChild: Boolean;
  whereVisitorsLiveAndWorkStaticData = [
    {
      name: 'Marin, CA',
      value: '46%'
    },
    {
      name: 'Alameda, CA',
      value: '20%'
    },
    {
      name: 'Butte, CA',
      value: '15%'
    },
    {
      name: 'Fresno, GA',
      value: '10%'
    },
    {
      name: 'Inyo, AL',
      value: '5%'
    },
    {
      name: 'County, ST',
      value: '5%'
    },
    {
      name: 'County, ST',
      value: '5%'
    },
    {
      name: 'County, ST',
      value: '5%'
    },
    {
      name: 'County, ST',
      value: '5%'
    },
  ];
  public deviceCount = 0;
  public visitCount = 0;
  public operationHours;
  public staticMapUrl = '';
  order = { SUN: 1, MON: 2, TUE: 3, WED: 4, THU: 5, FRI: 6, SAT: 7 };
  public suggestedData = {};
  selectedAllAudit = false;
  interAllAudit = false;
  constructor( public dialog: MatDialog,
    public dialogRef: MatDialogRef<RequestAuditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private requestData: any = [], private fb: FormBuilder, private placeService: PlacesFiltersService,
    private placesDataService: PlacesDataService,
    private themeService: ThemeService) { }

  ngOnInit() {
    this.placeDetail = this.requestData['placeDetail'];
    this.onResize();
    this.requestAuditForm = this.fb.group({
      placeName: [],
      address: [],
      brands: [],
      industry: [],
      visitorsWork: [],
      visitorsLive: [],
      hoursOperation: [],
      byHours: [],
      byDayOfWeek: [],
      byMonthOfYear: [],
      avgDwellTime: [],
      dayVisit: [],
      monthVisit: [],
      deviceType: [],
      industryValues: this.fb.group({
        top_category: [],
        sub_category: [],
        naics_code: [],
      })
    });
    this.onChanges();
    this.isAudit = this.placeDetail.properties.measures && true || false;
    if (this.isAudit) {
      if (this.placeDetail['properties']['measures']['popularity_by_hour']) {
        const popularityByHours = [];
        let i = 1;
        this.placeDetail['properties']['measures']['popularity_by_hour'].map(s => {
          popularityByHours.push({name: i, value: s });
          i++;
        });
        this.popularityByHours = popularityByHours;
      }
      if (this.placeDetail['properties']['measures']['popularity_by_day']) {
        const popularityByDays = [];
        let i = 1;
        const data = this.placeDetail['properties']['measures']['popularity_by_day'];
        Object.keys(data).map(key => {
          popularityByDays.push({name: key, value: data[key] });
          i++;
        });
        this.popularityByDays = popularityByDays;
      }
      if (this.placeDetail['properties']['measures']['raw_visit_counts']) {
        const popularityByMonths = [];
        let i = 1;
        this.placeDetail['properties']['measures']['raw_visit_counts'].map(s => {
          popularityByMonths.push({name: i, value: s });
          i++;
        });
        this.popularityByMonths = popularityByMonths;
      }
    }

    const themeSettings = this.themeService.getThemeSettings();
    if (this.placeDetail && this.placeDetail.location && this.placeDetail.location.polygon) {
      const featuresCollection = { 'type': 'FeatureCollection', 'features': [] };
      featuresCollection.features.push({
        type: 'Feature',
        geometry: this.placeDetail.location.polygon,
        properties: {
          fill: themeSettings['color_sets'] && themeSettings.color_sets.secondary.base,
          stroke: themeSettings['color_sets'] && themeSettings.color_sets.primary.base
        }
      });
      this.staticMapUrl = this.placesDataService.getStaticMapImage(
        featuresCollection, this.placeDetail.location.point.coordinates, 235, 140, themeSettings);
    }
    if (this.isAudit) {
      // Object.keys(this.placeDetail.properties.measures.device_type).map(key => {
      //   this.deviceCount += this.placeDetail.properties.measures.device_type[key];
      // });
      this.deviceCount = this.placeDetail.properties.measures.raw_visitor_counts.reduce(function(a, b) { return a + b; });
      this.visitCount = this.placeDetail.properties.measures.raw_visit_counts.reduce((total, current) => total + current);
      if (this.placeDetail.properties.operating_information && this.placeDetail.properties.operating_information.open_hours) {
        const operationHours = this.placeDetail.properties.operating_information.open_hours;
        let keys = Object.keys(operationHours);
        keys = keys.sort((a, b) => {
          return this.order[a] - this.order[b];
        });
        this.operationHours = {};
        keys.map(key => {
          const hours = operationHours[key];
          let temp = hours[0];
          if (hours.length > 1) {
            temp = hours[1];
          }
          temp['open'] = this.formatHoursToMeridiem(temp['open']);
          temp['close'] = this.formatHoursToMeridiem(temp['close']);
          if (temp['open'].search('NaN') === -1 &&  temp['close'].search('NaN') === -1) {
            this.operationHours[key] = temp;
          }
        });
      }
    }
  }
  onResize() {
    this.contentHeight = window.innerHeight - 420;
    this.dialogContentHeight =  window.innerHeight - 410;
  }
  closeRequestAudit() {
    if (this.selectedRequestAudits.length <= 0) {
      this.dialogRef.close();
      return true;
    }
    swal({
      title: ``,
      text: 'Your changes to the place will not be saved. Would you like to continue?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'YES',
      confirmButtonClass: 'waves-effect waves-light',
      cancelButtonClass: 'waves-effect waves-light'
    }).then((x) => {
      if (typeof x.value !== 'undefined' && x.value) {
        this.dialogRef.close();
      }
    }).catch(swal.noop);
  }
  onChanges() {
    this.requestAuditForm.valueChanges.subscribe(val => {
      this.checkSelectedAllAudit();
      for (const key of Object.keys(val)) {
        if (key === 'industryValues') {
          return false;
        }
        const index = this.selectedRequestAudits.findIndex(selectedAudit => selectedAudit.id === key);
        if (val[key] && index < 0 ) {
          const auditIndex = this.requestAuditData.findIndex(audit => audit.id === key);
          const auditData = this.requestAuditData[auditIndex];
          this.selectedRequestAudits.push(auditData);
        } else if (index >= 0 && val[key] === false) {
          this.selectedRequestAudits.splice(index, 1);
        }
      }
    });
  }
  onChangeModified() {
    const data = this.requestAuditForm.value;
    this.checkSelectedAllAudit();
    for (const key of Object.keys(data)) {
      if (key === 'industryValues') {
        return false;
      }
      const index = this.selectedRequestAudits.findIndex(selectedAudit => selectedAudit.id === key);
      if (data[key] && index < 0 ) {
        const auditIndex = this.requestAuditData.findIndex(audit => audit.id === key);
        const auditData = this.requestAuditData[auditIndex];
        this.selectedRequestAudits.push(auditData);
      } else if (index >= 0 && data[key] === false) {
        this.selectedRequestAudits.splice(index, 1);
      }
    }
  }
  onRemoveAudit(removeAudit) {
    this.requestAuditForm.controls[removeAudit].setValue(false);
  }
  onClearAll() {
    if (this.selectedRequestAudits.length <= 0) {
      return true;
    }
    swal({
      title: ``,
      text: 'Are you sure you want to clear all?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'YES, Clear',
      confirmButtonClass: 'waves-effect waves-light',
      cancelButtonClass: 'waves-effect waves-light'
    }).then((x) => {
      if (typeof x.value !== 'undefined' && x.value) {
        this.requestAuditForm.patchValue({
          placeName: false,
          address: false,
          brands: false,
          industry: false,
          visitorsWork: false,
          visitorsLive: false,
          hoursOperation: false,
          byHours: false,
          byDayOfWeek: false,
          byMonthOfYear: false,
          avgDwellTime: false,
          dayVisit: false,
          monthVisit: false,
          deviceType: false,
          industryValues: {
            top_category: '',
            sub_category: '',
            naics_code: '',
          }
        });
      }
    }).catch(swal.noop);
    this.suggestedData = {};
  }
  onSubmitAuditRequest() {
    const  attributeNeedChanges = {};
    const placeId = this.placeDetail['properties']['ids']['safegraph_place_id'];
    if (this.selectedRequestAudits.length > 0) {
      this.selectedRequestAudits.map(audit => {
        audit['data'].map(attribute => {
          let changes = '';
          if (this.suggestedData[attribute] && this.suggestedData[attribute]['suggestion']) {
            changes = this.suggestedData[attribute]['suggestion'];
          }
          attributeNeedChanges[attribute] = changes;
        });
      });
      this.placeService.requestAudit(placeId, attributeNeedChanges).subscribe(response => {
        if (response['status'] && response['status'] === 'success') {
          swal('Success', 'Your request has been submitted to the Audit Team. We will notify you when the audit is complete.', 'success');
          // swal('Success', response['message'] , 'success');
          this.onReturnDetailsSheet();
        }
      }, error => {
        swal('Error', 'An error has occurred. Please try again later.', 'error');
      });
    }
  }
  onReturnDetailsSheet() {
    this.dialogRef.close('detailsSheet');
  }
  formatHoursToMeridiem(hour) {
    const h = hour / 100;
    if (h > 12) {
      return (h - 12).toFixed(2)  + ' PM';
    } else {
      return h.toFixed(2) + ' AM';
    }
  }
  toggleSuggestion(attribute, state = true) {
    let suggestion = {
      state: true,
      suggestion: null
    };
    if (this.suggestedData[attribute]) {
      suggestion = this.suggestedData[attribute];
    }
    suggestion['state'] = state;
    if (!state) {
      suggestion['suggestion'] = '';
    }
    this.suggestedData[attribute] = suggestion;
  }
  saveSuggestion(attribute, field, value) {
    let suggestion = {
      state: true,
      suggestion: null
    };
    if (this.suggestedData[attribute]) {
      suggestion = this.suggestedData[attribute];
    }
    suggestion['state'] = false;
    suggestion['suggestion'] = value;
    this.requestAuditForm.controls[field].setValue(true);
    this.onChangeModified();
    this.suggestedData[attribute] = suggestion;
  }
  toggleIndustrySuggestion(state = true) {
    const suggestion = {
      state: true,
      suggestion: null
    };
    const industryFields = ['top_category', 'sub_category', 'naics_code', 'industry'];
    const industryControls = this.requestAuditForm.controls['industryValues']['controls'];
    industryFields.map(field => {
      let temp = Helper.deepClone(suggestion);
      if (this.suggestedData[field]) {
        temp = this.suggestedData[field];
      }
      temp['state'] = state;
      if (!state) {
        temp['suggestion'] = '';
        if (field !== 'industry') {
          industryControls[field].setValue('');
        }
      }
      this.suggestedData[field] = temp;
    });
  }
  saveIndustrySuggestion() {
    this.requestAuditForm.controls['industry'].setValue(true);
    this.onChangeModified();
    const industryValues = this.requestAuditForm.controls['industryValues'].value;
    const industryFields = ['top_category', 'sub_category', 'naics_code'];
    let suggestionValue = '';
    let suggestion = {
      state: true,
      suggestion: null
    };
    industryFields.map(field => {
      if (this.suggestedData[field]) {
        suggestion = this.suggestedData[field];
      }
      suggestion['state'] = true;
      suggestion['suggestion'] = industryValues[field];
      if (industryValues[field]) {
        suggestionValue += industryValues[field];
      }
      this.suggestedData[field] = Helper.deepClone(suggestion);
    });
    let suggestion1 = {
      state: true,
      suggestion: null
    };
    if (this.suggestedData['industry']) {
      suggestion1 = this.suggestedData['industry'];
    }
    suggestion1['state'] = false;
    suggestion1['suggestion'] = suggestionValue;
    this.suggestedData['industry'] = suggestion1;
  }
  onSelectAllRequest(ele) {
    this.selectedAllAudit = ele.checked;
    if (this.selectedAllAudit) {
      this.requestAuditForm.patchValue({
        placeName: true,
        address: true,
        brands: true,
        industry: true,
        visitorsWork: true,
        visitorsLive: true,
        hoursOperation: true,
        byHours: true,
        byDayOfWeek: true,
        byMonthOfYear: true,
        avgDwellTime: true,
        dayVisit: true,
        monthVisit: true,
        deviceType: true
      });
    } else {
      this.requestAuditForm.patchValue({
        placeName: false,
        address: false,
        brands: false,
        industry: false,
        visitorsWork: false,
        visitorsLive: false,
        hoursOperation: false,
        byHours: false,
        byDayOfWeek: false,
        byMonthOfYear: false,
        avgDwellTime: false,
        dayVisit: false,
        monthVisit: false,
        deviceType: false
      });
      this.onChangeModified();
    }
  }
  checkSelectedAllAudit() {
    const data = this.requestAuditForm.value;
    delete data['industryValues'];
    let unselected = 0;
    let selected = 0;
    for (const key of Object.keys(data)) {
      if (key === 'industryValues') {
        return false;
      }
      if (data[key] === null || !data[key]) {
        unselected ++;
      } else {
        selected ++;
      }
    }
    if (selected >= data.length) {
      this.selectedAllAudit = true;
      this.interAllAudit = false;
    } else if (unselected > 0 && selected > 0) {
      this.selectedAllAudit = false;
      this.interAllAudit = true;
    } else {
      this.selectedAllAudit = false;
      this.interAllAudit = false;
    }
  }
}
