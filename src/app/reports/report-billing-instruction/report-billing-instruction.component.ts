import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-report-billing-instruction',
  templateUrl: './report-billing-instruction.component.html',
  styleUrls: ['./report-billing-instruction.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportBillingInstructionComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
