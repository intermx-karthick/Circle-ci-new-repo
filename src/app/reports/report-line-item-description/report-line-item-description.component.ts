import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-report-line-item-description',
  templateUrl: './report-line-item-description.component.html',
  styleUrls: ['./report-line-item-description.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportLineItemDescriptionComponent implements OnInit {

  @Input() lineItem = {
    id: '5PV-PEM-34662-24 (INSTALL)',
    contract_period: '(4/13/2020 to 4/12/2021)',
    market: 'Bloomsburg, PA',
    vendor: 'Outfront-Media/Pittsburgh',
    media_type: '$placetype/ $mediatype',
    sales_tax: '7%',
    unit_size: '14’ x 18’',
    unit_period: '1',
    term_of_period: '4 Weeks',
    unit_id: 'GP# 30656584 VD# 3827AS031',
    media_location_description:
      '8250BO E: I81 2640.00 ftsjdhjsdh sjdhjshdjshds NO Rte 997 F/S (Install) sdsdhjsdhsjdh23j23h23'
  };

  constructor() { }

  ngOnInit(): void {
  }

}
