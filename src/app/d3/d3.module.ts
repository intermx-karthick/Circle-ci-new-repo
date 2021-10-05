import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { D3Service } from './services/d3.service';
import { BasicBarChartComponent } from './visuals/basic-bar-chart/basic-bar-chart.component';
import { LineChartComponent } from './visuals/line-chart/line-chart.component';
import { DonutChartComponent } from './visuals/donut-chart/donut-chart.component';
import { MultiLineChartComponent } from './visuals/multi-line-chart/multi-line-chart.component';
import { BarChartWithColorsComponent } from './visuals/bar-chart-with-colors/bar-chart-with-colors.component';
import { ImpVariationLineChartComponent } from './visuals/imp-variation-line-chart/imp-variation-line-chart.component';
@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    BasicBarChartComponent,
    LineChartComponent,
    DonutChartComponent,
    MultiLineChartComponent,
    BarChartWithColorsComponent,
    ImpVariationLineChartComponent
  ],
  providers: [
    D3Service
  ],
  declarations: [
    BasicBarChartComponent,
    LineChartComponent,
    DonutChartComponent,
    MultiLineChartComponent,
    BarChartWithColorsComponent,
    ImpVariationLineChartComponent
  ]
})
export class D3Module { }
