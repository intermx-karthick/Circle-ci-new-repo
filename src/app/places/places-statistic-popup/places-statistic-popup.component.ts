import { Component, OnInit } from '@angular/core';
import { PlacesDataService, ThemeService } from '@shared/services';

@Component({
  selector: 'app-places-statistic-popup',
  templateUrl: './places-statistic-popup.component.html',
  styleUrls: ['./places-statistic-popup.component.less']
})
export class PlacesStatisticPopupComponent implements OnInit {
  public placeDetail: any;
  public contentHeight: number;
  public isAudit = false;
  public deviceCount = 0;
  public visitCount = 0;
  public operationHours;
  public staticMapUrl = '';
  order = { SUN: 1, MON: 2, TUE: 3, WED: 4, THU: 5, FRI: 6, SAT: 7 };
  constructor(
    private placesDataService: PlacesDataService,
    private themeService: ThemeService
  ) { }

  ngOnInit() {
    this.onResize();
    const themeSettings = this.themeService.getThemeSettings();
    this.isAudit = this.placeDetail.properties.measures && true || false;
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
  }
  formatHoursToMeridiem(hour) {
    const h = hour / 100;
    if (h > 12) {
      return (h - 12).toFixed(2)  + ' PM';
    } else {
      return h.toFixed(2) + ' AM';
    }
  }
}
