import { Overlay, OverlayConfig, OverlayPositionBuilder, OverlayRef, ScrollStrategyOptions } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ElementRef, Input, OnInit } from "@angular/core";
import { Directive, HostListener } from "@angular/core";
import { TooltipPanelComponent } from "@shared/tooltip-panel/tooltip-panel.component";
import { TooltipPanelData } from "@shared/tooltip-panel/tooltip-panel.model";
import { TooltipPanelService } from "@shared/tooltip-panel/tooltip-panel.service";
import { Subscription } from "rxjs";


@Directive({
    selector: '[tooltippanel]'
})

export class TooltipPanelDirectives {

    @Input() data: TooltipPanelData;
    overlayRef: OverlayRef;
    panclass = 'imx-tooltip-overlay';
    isToolTipElementActive = null;
    isMouseOnPanel = null;
    subscriber: Subscription
    constructor(
        public overlay: Overlay,
        private overlayPositionBuilder: OverlayPositionBuilder,
        private scrollStrategyOptions: ScrollStrategyOptions,
        public element: ElementRef,
        private tooltipPanelService: TooltipPanelService
    ) {
     }

    @HostListener('mouseenter') onMouseEnter(event) {
        this.isToolTipElementActive = true;
        const scrollStrategy = this.scrollStrategyOptions.reposition({ scrollThrottle: 10, autoClose: true });
        const positionStrategy = this.overlayPositionBuilder.flexibleConnectedTo(this.element)
            .withPositions([
                {
                    originX: 'center',
                    originY: 'bottom',
                    overlayX: 'center',
                    overlayY: 'top'
                }
            ]);
        this.overlayRef = this.overlay.create(new OverlayConfig({ width: '400px', positionStrategy: positionStrategy, scrollStrategy: scrollStrategy, panelClass: this.panclass }));
        const overlayPortal = new ComponentPortal(TooltipPanelComponent);
        const overlayAttach = this.overlayRef.attach(overlayPortal);
        overlayAttach.instance.data = this.data;
    }

    /**
     * If you want to Overlaypanel open in center of the screen use this.
     * @returns Position.
     */
    position() {
        return this.overlay.position().global()
      .centerHorizontally().centerVertically();
    }

    @HostListener('mouseleave') onMouseLeave() {
        this.isToolTipElementActive = false;
        this.subscriber = this.tooltipPanelService.tooltipPanelEvent$.
        subscribe(res => {
            this.isMouseOnPanel = res?.mouseOnPanel;
            this.checkandDetach();
        })
        setTimeout(() => {
            this.checkandDetach();
        }, 200);
    }

    checkandDetach() {
        if (!this.isToolTipElementActive && !this.isMouseOnPanel) {
            this.overlayRef.dispose();
            this.subscriber.unsubscribe();
        }
    }
}
