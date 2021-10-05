import { ConvertPipe } from './../shared/pipes/convert.pipe';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketWidgetsComponent } from './market-widgets/market-widgets.component';
import { ImxMaterialModule } from 'app/imx-material/imx-material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SharedFunctionsModule } from '@shared/shared-functions.module';
import { OperatorWidgetComponent } from './operator-widget/operator-widget.component';
import { AudienceWidgetComponent } from './audience-widget/audience-widget.component';
import { MediaTypeWidgetComponent } from './media-type-widget/media-type-widget.component';
import { PlanWeekWidgetComponent } from './plan-week-widget/plan-week-widget.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ThresholdWidgetComponent } from './threshold-widget/threshold-widget.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { MediaAttributeWidgetComponent } from './media-attribute-widget/media-attribute-widget.component';
import { MediaAttributeDialogComponent } from './media-attribute-dialog/media-attribute-dialog.component';
import { OperatorWidgetDialogComponent } from './operator-widget-dialog/operator-widget-dialog.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import {LocationWidgetComponent} from './location-widget/location-widget.component';
import {LocationSelectionComponent} from './location-widget/location-selection/location-selection.component';

import {LocationSelectionComponentW3} from './location-widget/location-selection-w3/location-selection-w3.component';
import { OperatorWidgetDialogComponentW3 } from './operator-widget-dialog-w3/operator-widget-dialog-w3.component';
import { FilterOptionsComponent } from './filter-options/filter-options.component';
import { IMXNgxSliderComponent } from './imx-ngx-slider/imx-ngx-slider.component';

const publicComponents = [
  LocationWidgetComponent,
  LocationSelectionComponent,
  LocationSelectionComponentW3,
  IMXNgxSliderComponent,
];

const publicDirectives = [
];

const publicPipes = [
];


@NgModule({
  declarations: [
    MarketWidgetsComponent,
    OperatorWidgetComponent,
    AudienceWidgetComponent,
    MediaTypeWidgetComponent,
    PlanWeekWidgetComponent,
    ThresholdWidgetComponent,
    MediaAttributeWidgetComponent,
    MediaAttributeDialogComponent,
    OperatorWidgetDialogComponent,
    OperatorWidgetDialogComponentW3,
    FilterOptionsComponent,
    ...publicComponents,
    ...publicDirectives,
    ...publicPipes,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    ImxMaterialModule,
    SharedFunctionsModule,
    NgxSliderModule,
    InfiniteScrollModule,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    MarketWidgetsComponent,
    OperatorWidgetComponent,
    AudienceWidgetComponent,
    MediaTypeWidgetComponent,
    PlanWeekWidgetComponent,
    ThresholdWidgetComponent,
    MediaAttributeWidgetComponent,
    MediaAttributeDialogComponent,
    OperatorWidgetDialogComponent,
    OperatorWidgetDialogComponentW3,
    FlexLayoutModule,
    ImxMaterialModule,
    SharedFunctionsModule,
    NgxSliderModule,
    InfiniteScrollModule,
    ...publicComponents,
    ...publicDirectives,
    ...publicPipes,
  ]
})
export class WidgetsModule { }
