import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-report-preview-table-yearly',
  templateUrl: './report-preview-table-yearly.component.html',
  styleUrls: ['./report-preview-table-yearly.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportPreviewTableYearlyComponent implements OnInit {

  reports = [
    {
      year: 2020,
      january: '',
      february: '',
      march: '',
      april: '$ 345,678.00',
      may: '$ 345,678.00',
      june: '$ 345,678.00',
      july: '$ 345,678.00',
      august: '$ 345,678.00',
      september: '$ 345,678.00',
      october: '$ 345,678.00',
      november: '$ 345,678.00',
      december: '$ 345,678.00',
      total: '$ 12,345,678.00'
    },
    {
      year: 2021,
      january: '$ 345,678.00',
      february: '$ 345,678.00',
      march: '$ 345,678.00',
      april: '$ 345,678.00',
      total: '$ 12,345,678.00'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
