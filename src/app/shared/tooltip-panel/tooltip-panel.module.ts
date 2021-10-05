import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule, ViewContainerRef } from '@angular/core';
import { TooltipPanelComponent } from './tooltip-panel.component';
import { TooltipPanelService } from './tooltip-panel.service';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    imports: [
        CommonModule,
        OverlayModule,
        MatIconModule
    ],
    exports: [TooltipPanelComponent],
    declarations: [TooltipPanelComponent],
    providers: [],
})
export class TooltipPanelModule { }
