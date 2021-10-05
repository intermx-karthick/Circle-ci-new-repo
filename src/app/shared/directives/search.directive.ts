import { Directive, Input, Output, EventEmitter, ElementRef, HostListener, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import {ExploreDataService} from '../services/explore-data.service';
import { MarketType } from '@interTypes/marketType';

@Directive({
    selector: '[appSearch]',
})
export class SearchDirective implements OnInit, OnChanges {
  @Input() filterName: string;
  @Input() key: string;
  @Input() sourceData: any;
  @Output() filter = new EventEmitter<any>();
  @Input() listItems: any;
  @Input() keyboardEventsManager: any;
  @Input() selectedOption: any;
  @Input() arrowNavigation: boolean;
  @Input() marketSelectionType: MarketType;
  sourceDataBackup: any;
  selectedMarketName: string;
  selectedMarket: any;
  arrowKeyPosition = { market: 0, operator: 0};
  private clonedData: any;
  private matchedData: any;
  constructor(
    private el: ElementRef,
    private exploreDataService: ExploreDataService
   ) {
  }
  ngOnInit() {
    if (this.filterName === 'market' && this.marketSelectionType === 'DMA') {
      this.sourceDataBackup = this.sourceData;
      // this.exploreDataService.getSelectedMarket()
      //   .subscribe(market => {
      //     if (market && market.name) {
      //       this.selectedMarketName = market.name;
      //     } else {
      //       this.selectedMarketName = '';
      //     }
      // });
      // this.exploreDataService.getSelectedMarket().subscribe(market => {
      //   this.selectedMarket = market;
      // });
    }
    if (this.filterName === 'market' || this.filterName === 'operator') {
      this.exploreDataService.getHighlightedPosition().subscribe(position => {
        this.arrowKeyPosition = position;
      });
    }
  }
  public ngOnChanges(changes: SimpleChanges) {
    if (this.arrowNavigation) {
      if (changes.keyboardEventsManager && changes.keyboardEventsManager.currentValue) {
        this.keyboardEventsManager = changes.keyboardEventsManager.currentValue;
      }
      if (changes.listItems && changes.listItems.currentValue) {
        this.listItems = changes.listItems.currentValue;
        if (this.keyboardEventsManager) {
          this.initKeyManagerHandlers();
        }
      }
      if (changes.selectedOption && changes.selectedOption.currentValue) {
        this.selectedOption = changes.selectedOption.currentValue;
        this.setSelectedValue();
      }
    }
  }
  public initKeyManagerHandlers() {
    this.keyboardEventsManager
      .change
      .subscribe((activeIndex) => {
        // when the navigation item changes, we get new activeIndex
        this.listItems.map((item, index) => {
          // set the isActive `true` for the appropriate list item and `false` for the rest
          item.setActive(activeIndex === index);
          return item;
        });
      });
  }
  @HostListener('keyup', ['$event']) onChange(event: KeyboardEvent) {
    event.stopImmediatePropagation();
    if (event.keyCode !== this.exploreDataService.keyCodes.DOWNARROW
       && event.keyCode !== this.exploreDataService.keyCodes.UPARROW
        && event.keyCode !== this.exploreDataService.keyCodes.RIGHTARROW
         && event.keyCode !== this.exploreDataService.keyCodes.LEFTARROW && event.keyCode !== this.exploreDataService.keyCodes.ENTER) {
      if (this.el.nativeElement.value.length > 0) {
        const originalKey = [this.el.nativeElement.value];
        const key = [...originalKey, ...this.el.nativeElement.value.trim().split(' ')];
        if (this.marketSelectionType !== 'CBSA') {
          this.matchedData = this.sourceData.filter((p) => {
            if ((p.name).toLowerCase().includes(key[0].toLowerCase())) {
              return p;
            }
          });
          this.clonedData = this.sourceData.filter((p) => {
            if (p.name != null) {
              return this.search(key, p);
            }
          });
          const combinedData = [...this.matchedData, ...this.clonedData];
          const resultData = combinedData.reduce((unique, o) => {
            if (!unique.some(obj => obj.id === o.id && obj.name === o.name)) {
              unique.push(o);
            }
            return unique;
          }, []);
          this.filter.emit({value: resultData, emptySearch: false});
        }
        if (this.arrowNavigation) {
          setTimeout(() => {
            this.setDefaultSelection();
          }, 0);
        }
      } else {
        if (this.marketSelectionType !== 'CBSA') {
          this.filter.emit({value: {}, emptySearch: true});
        }
        if (this.arrowNavigation) {
          setTimeout(() => {
            this.clearSelection();
          }, 0);
        }
      }
    }
    if (this.arrowNavigation && this.keyboardEventsManager) {
      if (event.keyCode === this.exploreDataService.keyCodes.DOWNARROW || event.keyCode === this.exploreDataService.keyCodes.UPARROW) {
        // passing the event to key manager so we get a change fired
        this.keyboardEventsManager.onKeydown(event);
        setTimeout(() => {
          this.clickOption();
        }, 0);
        return false;
      } else if (event.keyCode === this.exploreDataService.keyCodes.ENTER) {
        // We have to update the active item
        this.keyboardEventsManager.activeItem.submitOption();
        return false;
      }
    }
  }
  private clickOption() {
    let element: any;
    element = <HTMLElement> document.querySelector('.arrow-active-position');
    if (element) {
      element.scrollIntoView(false);
    }
  }
  private setDefaultSelection() {
    if (this.keyboardEventsManager) {
      this.keyboardEventsManager.setActiveItem(null);
      this.keyboardEventsManager.setActiveItem(0);
    }
  }
  private setSelectedValue() {
    if (this.selectedOption && this.selectedOption['id']) {
      if (this.keyboardEventsManager.activeItem && this.keyboardEventsManager.activeItem.option === this.selectedOption) {
        return;
      } else {
        const index = this.listItems['_results'].findIndex(option => option === this.selectedOption);
        this.keyboardEventsManager.setActiveItem(index);
      }
    }
  }
  private clearSelection() {
    if (this.keyboardEventsManager) {
      this.keyboardEventsManager.setActiveItem(null);
      this.listItems['_results'][0].unSelectItem();
    }
  }
  private search(keyword, set) {
    let searchValue = [];
    searchValue = keyword.map(key => {
      return ((set[this.key]).toLowerCase().indexOf(key.toLowerCase()) !== -1);
    });
    if (searchValue.indexOf(true) >= 0) {
      return true;
    } else {
      return false;
    }
  }
}
