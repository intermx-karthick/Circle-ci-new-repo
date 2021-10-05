import { Component, OnInit, AfterContentInit } from '@angular/core';

@Component({
  selector: 'app-reports-tableau-imp-variation',
  templateUrl: './reports-tableau-imp-variation.component.html',
  styleUrls: ['./reports-tableau-imp-variation.component.less']
})
export class ReportsTableauImpVariationComponent implements OnInit {
  contentWidth: number;
  contentHeight: number;
  visuals: any;
  vizObj = null;

  constructor() { }

  ngOnInit() {
    const dailyMobilityContainer = document.getElementById('impVariationContainer');
    this.contentWidth = dailyMobilityContainer.offsetWidth - 50;
    this.contentHeight = dailyMobilityContainer.offsetHeight;
  }
  ngAfterContentInit(): void {
    this.loadTableau('https://public.tableau.com/views/5ae738ac702727b3f51432293ff67d47/IMPVariation?:retry=yes&:display_count=y&:toolbar=n&:origin=viz_share_link');
  }
  loadTableau(url) {
    const vizUrl = url;
    if (this.vizObj !== null) {
      this.vizObj.dispose();
    }
    // 'https://public.tableau.com/views/DailyMobility_CBSA/DailyMobility';
    const containerDiv = document.getElementById('impVariationVizContainer');
    const options = {
      width: 1000,
      height: 1400,
      hideTabs: true,
      onFirstInteractive: function () {
        console.log('Run this code when the viz has finished loading.');
      }
    };
    this.vizObj = new tableau.Viz(containerDiv, vizUrl, options);
  }
}
