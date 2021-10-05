import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-insertion-orders',
  templateUrl: './insertion-orders.component.html',
  styleUrls: ['./insertion-orders.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsertionOrdersComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
