import { Component, OnInit, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-imx-market-table-section',
  templateUrl: './imx-market-table-section.component.html',
  styleUrls: ['./imx-market-table-section.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImxMarketTableSectionComponent implements OnInit, OnChanges {
  @Input() value = [];
  @Input() length = 5;
  @Input() tooltipPlacement;
  groupedMarkets = {
    count : 0,
    markets: []
  };
  displayables = [];
  nonDisplayables = [];

  constructor() { }

  ngOnInit(): void {
    this.formatData();
  }
  ngOnChanges(changes: SimpleChanges) {
    this.formatData();
  }
  formatData() {
    this.displayables = [];
    this.nonDisplayables = [];
    const nonGroupedMarkets = this.value.filter((market) => (!market['marketsGroup'] || market['marketsGroup'].length <= 0) );
    this.displayables = nonGroupedMarkets.slice(0, this.length);
    this.groupedMarkets = {
      count : 0,
      markets: []
    };
    this.value.forEach((market) => {
      if (market['marketsGroup'] && market['marketsGroup'].length > 0) {
        this.groupedMarkets['count'] += 1;
        this.groupedMarkets['markets'].push(...market['marketsGroup']);
      }
    });
    if (nonGroupedMarkets.length > this.length) {
      this.nonDisplayables = nonGroupedMarkets.slice(this.length, nonGroupedMarkets.length);
    }
  }

}
