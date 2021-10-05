import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import {ExploreComponent} from './explore.component';
import {ExploreRouting} from './explore.routing';
import {SharedModule} from '@shared/shared.module';
import { ExploreWorkspaceSharedModule} from '@shared/explore-workspace-shared.module';
import {ExploreMetricsComponent} from './explore-metrics/explore-metrics.component';
import {ExploreLegendsComponent} from './explore-legends/explore-legends.component';
import {ExploreTabularPanelsComponent} from './explore-tabular-panels/explore-tabular-panels.component';
import {BoardTypePipe} from './pipes/board-type.pipe';
import {ExploreSidePanelComponent} from './explore-side-panel/explore-side-panel.component';
import { ResizableModule } from 'angular-resizable-element';
import { ExploreFiltersComponent } from './filters/explore-filters/explore-filters.component';
import { ExploreHeaderComponent } from './explore-header/explore-header.component';
import { OperatorFilterComponent } from './filters/operator-filter/operator-filter.component';
import { ExploreInventorySetsComponent } from './filters/explore-inventory-sets/explore-inventory-sets.component';
// import { ExploreScenariosComponent } from './filters/explore-scenarios/explore-scenarios.component';
import { FilterByIdsComponent } from './filters/filter-by-ids/filter-by-ids.component';
import { ExploreLayersComponent } from './layer-display-options/explore-layers/explore-layers.component';
import { DisplayOptionsComponent } from './layer-display-options/display-options/display-options.component';
import { ExploreCustomizeLayersComponent } from './layer-display-options/explore-customize-layers/explore-customize-layers.component';
import {LayersService} from './layer-display-options/layers.service';
import { ExploreFilterPillsComponent } from './filters/explore-filter-pills/explore-filter-pills.component';
import { MediaAttributesComponent } from './filters/media-attributes/media-attributes.component';
import { LoadSaveViewComponent } from './layer-display-options/load-save-view/load-save-view.component';
import { ActionsFilterComponent } from './layer-display-options/actions-filter/actions-filter.component';
import { TagsInputIdsDialogComponent } from './tags-input-ids-dialog/tags-input-ids-dialog.component';
import { TagsInputIdsTableComponent } from './tags-input-ids-table/tags-input-ids-table.component';
// import { D3Module } from '@d3/d3.module';
import { ColorPickerModule } from '../shared/components/color-picker/color-picker.module';
import {CSVService} from '../shared/services/csv.service';
//import { NumberOnlyDirective } from '@shared/directives/number-only.directive';
import { ExploreInventoryDetailComponent } from './explore-inventory-popup/explore-inventory-detail/explore-inventory-detail.component';
import { ExploreInventoryIntersetComponent } from './explore-inventory-popup/explore-inventory-interset/explore-inventory-interset.component';
import { InventoryDetailViewComponent } from './explore-inventory-popup/inventory-detail-view/inventory-detail-view.component';
import { ExploreInventoryInformationComponent } from './explore-inventory-popup/explore-inventory-information/explore-inventory-information.component';
import { InventoryBulkExportComponent } from './inventory-bulk-export/inventory-bulk-export.component';
import {ThresholdsFilterGPComponent} from './filters/thresholds-filter-gp/thresholds-filter-gp.component';
import { OperatorNamePipe } from './pipes/operator-name.pipe';
import { InventoryDetailViewLayoutComponent } from './explore-inventory-popup/inventory-detail-view-layout/inventory-detail-view-layout.component';
import { MapLegendsService } from '@shared/services/map-legends.service';
import { WeekSelectionComponent } from './filters/week-selection/week-selection.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ExploreLayersTemplateComponent } from './layer-display-options/explore-layers-template/explore-layers-template.component';
import { ExploreSecondaryMapComponent } from './explore-secondary-map/explore-secondary-map.component';
import { ExploreLayerAndPopupComponent } from './explore-layer-and-popup/explore-layer-and-popup.component';
import { HourlyImpressionsComponent } from './hourly-impressions/hourly-impressions.component';
import {DmaNamePipe} from './pipes/dma-name.pipe';
import { MeasuresPipe } from './pipes/measures.pipe';
import * as InventoryManagement from './inventory-management';
import * as CustomizeLayers from './layer-display-options/explore-customize-layers'
import * as ExploreFilters from "./filters/explore-filters";
import { ExploreSaveScenarioV3Component } from './explore-save-scenario-v3/explore-save-scenario-v3.component';
import { WorkspaceV3Service } from 'app/workspace-v3/workspace-v3.service';
import { ExploreProjectAddV3Component } from './explore-project-add-v3/explore-project-add-v3.component';
import {PopulationService} from '../population/population.service';
import {PopulationIntelligenceModule} from './population-intelligence/population-intelligence.module';
@NgModule({
  imports: [
    CommonModule,
    ExploreRouting,
    SharedModule,
    ExploreWorkspaceSharedModule,
    ResizableModule,
    NgxSliderModule,
    // D3Module,
    CdkTableModule,
    CdkTreeModule,
    ColorPickerModule,
    MatButtonToggleModule,
    PopulationIntelligenceModule,
  ],
  declarations: [
    ExploreComponent,
    ExploreMetricsComponent,
    ExploreLegendsComponent,
    ExploreTabularPanelsComponent,
    ExploreSidePanelComponent,
    BoardTypePipe,
    ExploreFiltersComponent,
    ExploreHeaderComponent,
    // ExploreScenariosComponent,
    FilterByIdsComponent,
    OperatorFilterComponent,
    ExploreInventorySetsComponent,
    ExploreLayersComponent,
    DisplayOptionsComponent,
    ExploreCustomizeLayersComponent,
    ExploreFilterPillsComponent,
    MediaAttributesComponent,
    LoadSaveViewComponent,
    ActionsFilterComponent,
    TagsInputIdsDialogComponent,
    TagsInputIdsTableComponent,
    //NumberOnlyDirective,
    ExploreInventoryDetailComponent,
    ExploreInventoryIntersetComponent,
    InventoryDetailViewComponent,
    ExploreInventoryInformationComponent,
    InventoryBulkExportComponent,
    // ThresholdsFilterGPComponent,
    OperatorNamePipe,
    DmaNamePipe,
    InventoryDetailViewLayoutComponent,
    WeekSelectionComponent,
    ExploreLayersTemplateComponent,
    ExploreSecondaryMapComponent,
    ExploreLayerAndPopupComponent,
    HourlyImpressionsComponent,
    MeasuresPipe,
    ...InventoryManagement.components,
    ...CustomizeLayers.components,
    ...ExploreFilters.components,
    ExploreSaveScenarioV3Component,
    ExploreProjectAddV3Component,
  ],
  exports: [
    ExploreComponent,
    SharedModule,
    ExploreWorkspaceSharedModule,
    // D3Module,
    ColorPickerModule,
    //NumberOnlyDirective
  ],
  providers: [
    LayersService,
    CSVService,
    MapLegendsService,
    PopulationService
  ]
})
export class ExploreModule { }
