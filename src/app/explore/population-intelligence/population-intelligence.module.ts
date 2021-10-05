import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopulationIntelligenceBaseComponent } from './population-intelligence-base/population-intelligence-base.component';
import { SharedModule } from '@shared/shared.module';
import {MapHttpService, MapLayerService} from './services';
import { MenuSliderComponent } from './menu-slider/menu-slider.component';
import {MapHelperService} from './services/map-helper.service';
import {MapPopupService} from './services/map-popup.service';


@NgModule({
  declarations: [
    PopulationIntelligenceBaseComponent,
    MenuSliderComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    PopulationIntelligenceBaseComponent,
  ],
  providers: [
    MapHttpService,
    MapHelperService,
    MapPopupService,
    MapLayerService,
  ]
})
export class PopulationIntelligenceModule { }
