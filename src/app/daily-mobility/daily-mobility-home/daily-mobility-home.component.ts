import { Component, OnInit, AfterContentInit, OnDestroy } from '@angular/core';
import { DailyMobilityService } from '../daily-mobility.service';
@Component({
  selector: 'app-daily-mobility-home',
  templateUrl: './daily-mobility-home.component.html',
  styleUrls: ['./daily-mobility-home.component.less']
})
export class DailyMobilityHomeComponent implements OnInit, AfterContentInit, OnDestroy {
  contentWidth: number;
  contentHeight: number;
  visualUrl: string;
  visuals = {};
  selectedType: string;
  vizObj = null;
  constructor(
    private mobilityService: DailyMobilityService
  ) {}

  ngAfterContentInit(): void {
    // this.mobilityService.getTableauVisualURl().subscribe(data => {
    //   this.visualUrl = data['url'];
    //   this.initTableau();
    // });
    this.mobilityService.getTableauMenu().subscribe(data => {
      this.selectedType = data;
      this.loadTableau(this.visuals[data]['url']);
    });
  }

  ngOnInit() {
    const dailyMobilityContainer = document.getElementById('dailyMobilityContainer');
    this.contentWidth = dailyMobilityContainer.offsetWidth - 50;
    this.contentHeight = dailyMobilityContainer.offsetHeight;
    
    this.visuals = {
      CBSAExplore : {
        name: 'CBSA Explorer',
        url: 'https://public.tableau.com/views/DailyMobility_CBSAExplorer_Page1/DailyMobility-CBSA?:display_count=y&publish=yes&:toolbar=n&:origin=viz_share_link',
        width: 1000,
        height: 1100
      },
      CBSAReport: {
        name: 'CBSA Report',
        url: 'https://public.tableau.com/views/DailyMobility_CBSAReport_Page2/CBSAReport?:display_count=y&publish=yes&:toolbar=n&:origin=viz_share_link',
        width: 1000,
        height: 1700
      },
      StateExplore: {
        name: 'State Explorer',
        url: 'https://public.tableau.com/views/DailyMobility_StateExplorer_Page3/DailyMobility-State?:retry=yes&:display_count=y&:toolbar=n&:origin=viz_share_link',
        width: 1000,
        height: 1100
      },
      StateReport: {
        name: 'State Report',
        url: 'https://public.tableau.com/views/DailyMobility_StateReport_Page4/StateReport?:retry=yes&:display_count=y&:toolbar=n&:origin=viz_share_link',
        width: 1000,
        height: 1700
      }
    };

  }

  loadTableau(url) {
    const vizUrl = url;
    if (this.vizObj !== null) {
      this.vizObj.dispose();
    }
    // 'https://public.tableau.com/views/DailyMobility_CBSA/DailyMobility';
    const containerDiv = document.getElementById('dailyMobilityVizContainer');
    const options = {
      width: this.visuals[this.selectedType].width,
      height: this.visuals[this.selectedType].height,
      hideTabs: true,
      onFirstInteractive: function () {
        console.log('Run this code when the viz has finished loading.');
      }
    };
    this.vizObj = new tableau.Viz(containerDiv, vizUrl, options);
  }
  
  ngOnDestroy(): void {
    if (this.vizObj !== null) {
      this.vizObj.dispose();
    }
  }
}
