import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-report-preview-table-monthly',
  templateUrl: './report-preview-table-monthly.component.html',
  styleUrls: ['./report-preview-table-monthly.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportPreviewTableMonthlyComponent implements OnInit {
  // displayedColumns: string[] = ['item', 'cost'];
  @Input() isNeedMarketCol = false;

  public columns = {
    lineItemIdOrType: 'LINE ITEM ID / TYPE',
    vendor: 'VENDOR',
    mediaType: 'MEDIA TYPE',
    market: 'MARKET',
    unitLocationOrMediaDescription: 'UNIT LOCATION / MEDIA DESCRIPTION',
    date: 'DATE',
    periodLength: 'PERIOD LENGTH',
    netCost: 'NET COST',
    salesTax: 'SALES TAX',
    feeAmount: 'FEE AMOUNT',
    netTaxFee: 'NET + TAX + FEE'
  };
  public displayedColumns: string[] = [
    'lineItemIdOrType',
    'vendor',
    'mediaType',
    'market',
    'unitLocationOrMediaDescription',
    'date',
    'periodLength',
    'netCost',
    'salesTax',
    'feeAmount',
    'netTaxFee'
  ];

  // empty blocks for footer
  displayedColumnsFooter = [
    'emptyColumn1',
    'emptyColumn2',
    'emptyColumn3',
    'emptyColumn4',
    'emptyColumn5',
    'emptyColumn6',
    'emptyColumn7',
    'emptyColumn8',
    'emptyColumn9',
    'emptyColumn10'
  ];
  transactions: any[] = Array.from({ length: 6 }, (_) => ({
    lineItemIdOrType: '5PV-PEP33688-1$LineItemType',
    vendor: 'LAMA / Tri-cities,TN/VA',
    mediaType: 'BULLETIN',
    market: 'Market name here',
    unitLocationOrMediaDescription: 'Unit #80672 I-26 E/ON ROAN ST. @ EX 20 B',
    date: '01/20/2021',
    periodLength: '6 weeks',
    netCost: 578.0,
    salesTax: 0,
    feeAmount: 345.0,
    netTaxFee: 345678.0
  }));

  tableDataStyleClass;

  constructor() {}

  ngOnInit(): void {
    // this.getTotalCost()
    this.ensureMarketCol();
  }

  getNetCost() {
    return this.transactions
      .map((t) => t.netCost)
      .reduce((acc, value) => acc + value, 0);
  }

  getSalesTax() {
    return this.transactions
      .map((t) => t.salesTax)
      .reduce((acc, value) => acc + value, 0);
  }

  getFeeAmount() {
    return this.transactions
      .map((t) => t.feeAmount)
      .reduce((acc, value) => acc + value, 0);
  }

  getNetTaxFee() {
    return this.transactions
      .map((t) => t.netTaxFee)
      .reduce((acc, value) => acc + value, 0);
  }

  public headerClasses(column) {
    return {
      'text-align-left': column.key === 'vendor' || column.key === 'market',
      [column.key]: !!column.key
    };
  }

  public get lastFooterColName() {
    return this.displayedColumnsFooter[this.displayedColumnsFooter.length - 1];
  }

  public get last2ndFooterColName() {
    return this.displayedColumnsFooter[this.displayedColumnsFooter.length - 2];
  }

  public ensureMarketCol() {
    if(!this.isNeedMarketCol) {
      this.displayedColumnsFooter.pop();
      delete this.columns.market;
      const idx = this.displayedColumns.indexOf('market');
      if (idx > -1) {
        this.displayedColumns.splice(idx, 1);
      }
    }
  }
}
