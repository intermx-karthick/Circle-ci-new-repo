import { Component, OnInit, Input, ChangeDetectionStrategy, Output, EventEmitter, SimpleChanges} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FilterOptionsComponent } from 'app/widgets/filter-options/filter-options.component';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {Helper} from '../../classes';
// import { Observable } from 'rxjs';

@Component({
  selector: 'app-market-widgets',
  templateUrl: './market-widgets.component.html',
  styleUrls: ['./market-widgets.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketWidgetsComponent implements OnInit {

  public markets: any = [];
  // @Input() public gridPosition: Observable<any>;
  // @Input() public gridRows: number;
  // @Input() public filterGridHeight: number;
  @Input() public selectedMarkets = [];
  @Output() applyMarket = new EventEmitter();
  @Input() public editFlag = true;
  @Input() public disableEdit = true;
  private marketType = '';
  constructor(
    private activeRoute: ActivatedRoute,
    public dialog: MatDialog ) { }

  ngOnInit() {
    this.markets = this.activeRoute.snapshot.data['dummyMarkets'] || [];
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['disableEdit']) {
      this.disableEdit = changes['disableEdit']['currentValue'];
    }
  }
    /* Function to open dialog popup for filters
  */
 openMarketDialog() {
    const data = {
      title: 'Add Market',
      optionsData: this.markets,
      selectedData: [],
      type: 'Market',
      method: 'multi-market',
      enableCBSA: true,
      buttonText: 'Add as Individual',
      groupBtnText:  'Add as Group',
     filterModule: 'market-plan'
    };

    this.dialog.open(FilterOptionsComponent, {
      width: '600px',
      data: data
    }).afterClosed().subscribe(result => {
      if (result) {
        if (this.marketType === '' && this.selectedMarkets.length) {
          const currentType = result['marketType'];
          const dummySelectedMarket = [];
          this.selectedMarkets.map(smarket => {
            if (smarket.marketsGroup && smarket.marketsGroup.length) {
              const mGroup = smarket.marketsGroup;
              if (mGroup[0]['id'].includes(currentType)) {
                dummySelectedMarket.push(smarket);
              }
            } else {
              if (smarket['id'].includes(currentType)) {
                dummySelectedMarket.push(smarket);
              }
            }
          });
          this.marketType = result['marketType'];
          this.selectedMarkets = Helper.deepClone(dummySelectedMarket);
        } else if (this.marketType !==  result['marketType']) {
          this.selectedMarkets = [];
          this.marketType = result['marketType'];
        }

        let options;
        if (result.selectedOptions.length
          && result.selectedOptions[0]['id'] === 'all') {
            options = [...result.optionsData];
            options.shift();
        }
        this.setMarkets(result.selectedOptions, result['addAsGroup']);
      }
    });
  }

  private setMarkets(options, addAsGroup) {
    if (options.length) {
      if (addAsGroup) {
        if (this.validateGroupMarkets(options)) {
          this.selectedMarkets.push(options[0]);
          this.applyMarket.emit(this.selectedMarkets);
        } else {
          this.showError('Market group already exits');
        }
      } else {
        const existingIds = this.selectedMarkets.map(obj => obj['id']);
        options.forEach(option => {
          if (!existingIds.includes(option['id'])) {
            this.selectedMarkets.push({id: option['id'], name: option['name']});
          }
        });
        this.applyMarket.emit(this.selectedMarkets);
      }
    }
  }

  public editMarket(index) {
    let selectedOptions = [];
    const editOption = Helper.deepClone(this.selectedMarkets[index]);
    if (editOption['marketsGroup'] && editOption['marketsGroup'].length) {
      selectedOptions = editOption['marketsGroup'];
    } else {
      selectedOptions.push(editOption);
    }
    const data = {
      title: 'Add Market',
      buttonText: 'Update',
      optionsData: this.markets,
      selectedData: selectedOptions,
      type: 'Market',
      method: 'multi-market',
      enableCBSA: true,
      editFilter: true
    };
    this.dialog.open(FilterOptionsComponent, {
      width: '600px',
      data: data
    }).afterClosed().subscribe(result => {
      if (result) {
        if (this.marketType === '' && this.selectedMarkets.length) {
          const currentType = result['marketType'];
          const dummySelectedMarket = [];
          this.selectedMarkets.map(smarket => {
            if (smarket.marketsGroup && smarket.marketsGroup.length) {
              const mGroup = smarket.marketsGroup;
              if (mGroup[0]['id'].includes(currentType)) {
                dummySelectedMarket.push(smarket);
              }
            } else {
              if (smarket['id'].includes(currentType)) {
                dummySelectedMarket.push(smarket);
              }
            }
          });
          this.selectedMarkets = Helper.deepClone(dummySelectedMarket);
        } else if (this.marketType !==  result['marketType']) {
          this.selectedMarkets = [];
        }
        this.marketType = result['marketType'];
        if (this.selectedMarkets.length) {
        if (result.selectedOptions && result.selectedOptions.length) {
          // After update if slected option length is 1 then individual else group selection
          if (result.selectedOptions.length === 1) {
            if (this.validateSingleMarket(result.selectedOptions[0])) {
              this.selectedMarkets[index]['id'] = '';
              this.selectedMarkets[index]['name'] = '';
              this.selectedMarkets[index]['id'] = result.selectedOptions[0]['id'];
              this.selectedMarkets[index]['name'] = result.selectedOptions[0]['name'];
              this.selectedMarkets[index]['marketsGroup'] = [];
            } else {
              this.selectedMarkets.splice(index, 1);
            }
          } else if (result.selectedOptions.length > 1) {
            if (this.validateGroupMarkets(result.selectedOptions, true)) {
              this.selectedMarkets[index]['id'] = '';
              this.selectedMarkets[index]['name'] = '';
              this.selectedMarkets[index]['marketsGroup'] = result.selectedOptions.map((option, i) => {
                if (i === 0) {
                  this.selectedMarkets[index]['name'] += option.name;
                } else {
                  this.selectedMarkets[index]['name'] += ',' + option.name;
                }
                return { id: option.id, name: option.name };
              });
            } else {
              this.selectedMarkets.splice(index, 1);
              this.showError('Market group already exits');
            }
          }
        } else {
          this.selectedMarkets.splice(index, 1);
        }
        this.applyMarket.emit(this.selectedMarkets);

      } else {
        this.setMarkets(result.selectedOptions, result['addAsGroup'])
      }
      }
    });
  }

  private validateSingleMarket(option) {
    return !this.selectedMarkets.map(obj => obj['id']).includes(option['id']);
  }

  private validateGroupMarkets(options, updateGroup = false) {
    let selectedGroupName = '';
    if (updateGroup) {
      // While editing single option we will get array of options not formatted option
      selectedGroupName = options.map(obj => obj['id']).join(',');
    } else {
      // While createing new object in filter options component itself we are formatting the option
      selectedGroupName = options[0] && options[0]['marketsGroup'].map(obj => obj['id']).join(',');
    }
    let valid = true;
    this.selectedMarkets.forEach(marketObj => {
      if (marketObj['marketsGroup'] && marketObj['marketsGroup'].length) {
        const existingGroupName = marketObj['marketsGroup'].map(obj => obj['id']).join(',');
        if (existingGroupName === selectedGroupName) {
          return valid = false;
        }
      }
    });
    return valid;
  }

  /**
   * 
   * @param message error message
   */
  private showError(message) {
    const dialog: ConfirmationDialog = {
      notifyMessage: true,
      confirmTitle: 'Error',
      messageText: message,
    };
    this.dialog.open(ConfirmationDialogComponent, {
      data: dialog,
      width: '400px'}).afterClosed();
  }

  /**
   * 
   * @param removeMarket selected market to be removed
   */
  removeMarket(removeMarket) {
    const index = this.selectedMarkets.findIndex(x => x.id === removeMarket.id);
    if (index !== -1) {
      this.selectedMarkets.splice(index, 1);
      this.applyMarket.emit(this.selectedMarkets);
    }
  }

}
