import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PopulationRoutingModule } from './population-routing.module';
import { PopulationBaseComponent } from './population-base/population-base.component';
import {ImxMaterialModule} from '../imx-material/imx-material.module';
import {SharedModule} from '@shared/shared.module';
import { GridItemComponent } from './grid-item/grid-item.component';
import { PopulationFiltersComponent } from './population-filters/population-filters.component';
import { PopulationTabularComponent } from './population-tabular/population-tabular.component';
import { ResizableModule } from 'angular-resizable-element';
import {PopulationService} from './population.service';
import { SaveGeoSetComponent } from './save-geo-set/save-geo-set.component';
import {LocationFilterService} from '@shared/services/location-filters.service';


@NgModule({
  declarations: [
    PopulationBaseComponent,
    GridItemComponent,
    PopulationFiltersComponent,
    PopulationTabularComponent,
    SaveGeoSetComponent,
  ],
  imports: [
    CommonModule,
    PopulationRoutingModule,
    ImxMaterialModule,
    SharedModule,
    ResizableModule
  ],
  exports: [
    ImxMaterialModule,
    SharedModule,
  ],
  providers: [
    PopulationService,
    LocationFilterService
  ]
})
export class PopulationModule { }
