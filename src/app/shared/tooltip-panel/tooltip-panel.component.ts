import { AfterContentInit, AfterViewInit } from '@angular/core';
import { Component, OnInit, ChangeDetectionStrategy, Input, Inject } from '@angular/core';
import { fromEvent } from 'rxjs';
import { TooltipPanelData } from './tooltip-panel.model';
import { TooltipPanelService } from './tooltip-panel.service';

@Component({
  selector: 'app-tooltip-panel',
  templateUrl: './tooltip-panel.component.html',
  styleUrls: ['./tooltip-panel.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipPanelComponent implements OnInit, AfterViewInit {

  panelElementID= 'imxtooltippanel';
  @Input() data: TooltipPanelData;
  constructor(private tooltipServ: TooltipPanelService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    const ele = document.getElementById(this.panelElementID);
    fromEvent(ele, 'mouseenter').subscribe(_ => {
      this.tooltipServ.tooltipPanelEvent$.next({ mouseOnPanel: true })
    })
    fromEvent(ele, 'mouseleave').subscribe(_ => {
      this.tooltipServ.tooltipPanelEvent$.next({ mouseOnPanel: false })
    })
  }

}
