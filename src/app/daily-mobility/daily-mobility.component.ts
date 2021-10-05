import { Component, OnInit } from '@angular/core';
import { Helper } from 'app/classes';
import { DailyMobilityService } from './daily-mobility.service';

@Component({
  selector: 'app-daily-mobility',
  templateUrl: './daily-mobility.component.html',
  styleUrls: ['./daily-mobility.component.less']
})
export class DailyMobilityComponent implements OnInit {

  constructor(
    private dailyMobilityService: DailyMobilityService
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    Helper.themeRender('intermx-theme-old');
  }

  ngOnDestroy(): void {
    Helper.themeRender('intermx-theme-old');
  }

  onChangeMenu(val) {
    this.dailyMobilityService.setTableauMenu(val);
  }

}
