import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-detailed-contract-recap',
  templateUrl: './detailed-contract-recap.component.html',
  styleUrls: ['./detailed-contract-recap.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailedContractRecapComponent implements OnInit {

  @Input() details = {
    logoURL: '../../../../assets/images/inv-sample.png',
    lastGenerated: '01/22/20201',
    displayName: '$ReportDisplay Name',
    client: 'Pepsi Beverages (TLP)',
    product: 'PEP Media Space',
    estimate: '005 - Johnson City, TN Bottle Cap, Board Space (O000TH-PCO00011505-1)',
    clientRef: 'PO 373828823',
    clientCode: '5PV',
    productCode: 'PEP',
    estimateId: '005, 006, 939, 323, 376',
    costType: 'Net',
    timing: '04/20/2021 - 06/20/2021',
    fee: 'Fee'
  };

  @Input() hideTaxIncludeText = true;
  @Input() reportTypeName = 'Detailed Contract Recap';
  @Input() canShowReportTitle = true;


  constructor() {
  }

  ngOnInit(): void {
  }

}
