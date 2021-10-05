import { Component, OnInit, Input } from '@angular/core';
import { TooltipConfig } from '../../../Interfaces/tooltip';

@Component({
  selector: 'app-inventory-status-dots',
  templateUrl: './inventory-status-dots.component.html',
  styleUrls: ['./inventory-status-dots.component.less']
})
export class InventoryStatusDotsComponent implements OnInit {
  @Input() status: any;
  @Input() tooltipConfig: TooltipConfig;
  public redColorStatus = [
    'Published - Suppressed',
    'Incomplete',
    'Published - Inactive',
    'Unpublished - Measured',
    'Unpublished - Inactive',
    'Decommissioned'
  ];
  public greenColorStatus = ['Published - Measured'];
  public greyColorStatus = ['Published - Unmeasured', 'Unaudited', 'Audited - Level 0', 'Non-Audited'];
  public yellowColorStatus = ['Published - Under Review'];
  public colorClass = 'red';
  constructor() { }

  ngOnInit() {
    if (this.greenColorStatus.indexOf(this.status['name']) > -1) {
      this.colorClass = 'green';
    } else if (this.greyColorStatus.indexOf(this.status['name']) > -1) {
      this.colorClass = 'grey';
    } else if (this.yellowColorStatus.indexOf(this.status['name']) > -1) {
      this.colorClass = 'yellow';
    }
  }

}
