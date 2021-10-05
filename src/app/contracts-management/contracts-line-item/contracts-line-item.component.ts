import { Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import { LineItem } from '@interTypes/contract/contract-line-item';

@Component({
  selector: 'app-contracts-line-item',
  templateUrl: './contracts-line-item.component.html',
  styleUrls: ['./contracts-line-item.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractsLineItemComponent implements OnInit {

  @Input() public lineItem:LineItem;
  @Input() public showHeading:boolean = true;
  @Input() public headingVisible:boolean = false;
  @Input() public isLoadedFromEdit:boolean = false;

  constructor() { }

  ngOnInit(): void {
    console.log('lineItem', this.lineItem);
  }
  getLineMarket(media) {
    let market = '';
    if (media?.city) {
      market = media?.city;
      if (media?.stateCode) {
        market = market + ', ' + media?.stateCode;
      }
    } else if (media?.dma?.name){
      market = media?.dma?.name;
    }
    return market;
  }
}
