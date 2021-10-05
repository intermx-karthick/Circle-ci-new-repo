import { InventoryService } from '@shared/services';
import {
  Component,
  OnInit,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { BarChartData } from '@d3/interfaces/bar-chart-data';
import { MultiLineChartData } from '@d3/interfaces/line-chart-data';

@Component({
  selector: 'app-hourly-impressions',
  templateUrl: './hourly-impressions.component.html',
  styleUrls: ['./hourly-impressions.component.less']
})
export class HourlyImpressionsComponent implements OnInit, OnChanges {
  public barChartConfig = {
    width: 600,
    height: 150,
    tooltip: '<div><b>Target Impressions</b></br>##NAME##: ##VALUE## Imp</div>',
    margin: { top: 20, right: 20, bottom: 20, left: 30 }
  };
  @Input() hourlyImpressions: any = {};
  @Input() popupOption = true;
  public impChartData: BarChartData[] = [];
  public hourlyImpressionLineData: MultiLineChartData[] = [];
  public chartConfig = {
    width: 420,
    height: 120,
    tooltip: '<div>##NAME## Average:<br>##VALUE##% of Activities</div>',
    xAxis: true,
    yAxis: false,
    margin: { top: 20, right: 20, bottom: 25, left: 25 }
  };

  public chartLineConfig = {
    width: 600,
    height: 250,
    tooltip: '<div>##NAME## Average:<br>##VALUE##% of Activities</div>',
    xAxis: true,
    yAxis: false,
    margin: { top: 20, right: 20, bottom: 25, left: 25 }
  };
  public graphRefresh: EventEmitter<void> = new EventEmitter<void>();
  constructor(private inventoryService: InventoryService) {}

  ngOnInit() {
    if (!this.popupOption) {
      this.barChartConfig['width'] = 950;
      this.chartLineConfig['width'] = 950;
    }
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const voice = this.hourlyImpressions?.voice;
    if (this.hourlyImpressions) {
      this.hourlyImpressionLineData = this.inventoryService.formatHourlyImpressionData(
        this.hourlyImpressions
      );
      this.hourlyImpressionLineData.forEach((lineData) => {
        const key = lineData.name.toLowerCase();
        if (dayKeys.includes(key)) {
          const impValues = lineData['values'].map((value) => value['yData']);
          const totalImp = impValues.reduce(
            (total, value) => +total + +value,
            0
          );
          this.impChartData.push({
            name: key,
            value: +totalImp
          });
        }
      });
    }
    this.graphRefresh.emit();
  }
  ngOnChanges(changes: SimpleChanges) {
    // if ( changes.hourlyImpressions && changes.hourlyImpressions.currentValue) {
    //   this.graphRefresh.emit();
    // }
  }
}
