import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-places-detail-popup',
  templateUrl: './places-detail-popup.component.html',
  styleUrls: ['./places-detail-popup.component.less']
})
export class PlacesDetailPopupComponent implements OnInit {
  public placeDetail: any;
  public contentHeight: number;
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
  constructor() { }

  ngOnInit() {
    this.onResize();
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
  }
  onResize() {
    this.contentHeight = window.innerHeight - 420;
  }

}
