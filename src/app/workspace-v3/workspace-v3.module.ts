import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceV3RoutingModule } from './workspace-v3-routing.module';
import { WorkspaceBaseComponent } from './workspace-base/workspace-base.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { CreateScenarioComponent } from './create-scenario/create-scenario.component';
import { AudienceFilterDialogComponent } from './audience-filter-dialog/audience-filter-dialog.component';
import { ImxdropdownComponent } from './dropdown/imxdropdown.component';
import { MarketFilterDialogComponent } from './market-filter-dialog/market-filter-dialog.component';
import { DateAdapter, MAT_DATE_FORMATS, MatRippleModule } from '@angular/material/core';
import { AppUSDateAdapter, AppDateFormat } from 'app/classes';
import { SharedModule } from '@shared/shared.module';
import { WorkspaceProjectListComponent } from './workspace-project-list/workspace-project-list.component';
import { WorkspaceProjectAddComponent } from './workspace-project-add/workspace-project-add.component';
import { WorkspaceV3Service } from './workspace-v3.service';
import { SelectInventoryPopupComponent } from './select-inventory-popup/select-inventory-popup.component';
import { AddInventoryComponent } from './add-inventory/add-inventory.component';
import { ScenarioViewContainerComponent } from './scenario-view-container/scenario-view-container.component';
import { AudienceFilterComponent } from './audience-filter/audience-filter.component';
import { InventoryFilterComponent } from './inventory-filter/inventory-filter.component';
import { OperatorsResolver } from '@shared/resolvers/operators.resolver';
import { ProjectViewV3Component } from './project-view-v3/project-view-v3.component';
import * as ScenarioView from './scenario-view-container';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MarketFilterV3Component } from './market-filter-v3/market-filter-v3.component';
import { DuplicateScenarioV3Component } from './duplicate-scenario-v3/duplicate-scenario-v3.component';
import { MoveScenarioORProjectComponent } from './move-scenario-or-project/move-scenario-or-project.component';

import { MarketPlanComponent } from './market-plan/market-plan.component';
import { MarketPlanService } from './market-plan.service';
import { MarketPlansListComponent } from './market-plans-list/market-plans-list.component';
import { MarketPlanMeasuresComponent } from './market-plan-measures/market-plan-measures.component';
import { EditPlanComponent } from './edit-plan/edit-plan.component';
import { PlanPeriodV3Component } from './plan-period-v3/plan-period-v3.component';
import { InventoryPlanComponent } from './inventory-plan/inventory-plan.component';
import { InventoryListComponent } from './inventory-plan/inventory-list/inventory-list.component';
import { SelectMarketTypeDialogComponent } from './select-market-type-dialog/select-market-type-dialog.component';
import {ProjectJobStatusPipe} from './project-job-status.pipe';
import { ChangeSpotSchedulesDialogV3Component } from './change-spot-schedules-dialog-v3/change-spot-schedules-dialog-v3.component';
import { ScenarioFilterParamsComponent } from './scenario-view-container/scenario-filter-params/scenario-filter-params.component';
import { ScenarioSummaryPanelComponent } from './scenario-summary-panel/scenario-summary-panel.component';
import { SummaryPanelActionService } from './summary-panel-action.service';
import { GenerateScenarioDuplicatePopupComponent } from './generate-scenario-duplicate-popup/generate-scenario-duplicate-popup.component';
import { SelectOperatorPopupComponent } from './select-operator-popup/select-operator-popup.component';
import { InventoryIdAbsenceCheckPipe } from './inventory-id-check.pipe';
import { DefineGoleComponent } from './define-gole/define-gole.component';
import { ScenarioInProgressStatusPipe } from './scenario-inprogress-status.pipe';
@NgModule({
  declarations: [
    WorkspaceBaseComponent,
    WorkspaceProjectListComponent,
    CreateScenarioComponent,
    AudienceFilterDialogComponent,
    ImxdropdownComponent,
    MarketFilterDialogComponent,
    WorkspaceProjectAddComponent,
    SelectInventoryPopupComponent,
    AddInventoryComponent,
    AudienceFilterComponent,
    ScenarioView.COMPONENTS,
    MarketFilterV3Component,
    InventoryFilterComponent,
    ProjectViewV3Component,
    MarketPlanComponent,
    MarketPlansListComponent,
    MarketPlanMeasuresComponent,
    EditPlanComponent,
    DuplicateScenarioV3Component,
    MoveScenarioORProjectComponent,
    PlanPeriodV3Component,
    InventoryPlanComponent,
    InventoryListComponent,
    SelectMarketTypeDialogComponent,
    ChangeSpotSchedulesDialogV3Component,
    ProjectJobStatusPipe,
    ScenarioFilterParamsComponent,
    ScenarioSummaryPanelComponent,
    GenerateScenarioDuplicatePopupComponent,
    SelectOperatorPopupComponent,
    InventoryIdAbsenceCheckPipe,
    DefineGoleComponent,
    ScenarioInProgressStatusPipe
  ],
  imports: [
    CommonModule,
    WorkspaceV3RoutingModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatDialogModule,
    MatExpansionModule,
    MatSidenavModule,
    MatBottomSheetModule,
    SharedModule,
    MatRippleModule,
  ],
  exports: [SharedModule],
  providers: [
    WorkspaceV3Service,
    {
      provide: DateAdapter,
      useClass: AppUSDateAdapter // custom date adapter
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: AppDateFormat.US
    },
    MarketPlanService,
    SummaryPanelActionService
  ]
})
export class WorkspaceV3Module {}
