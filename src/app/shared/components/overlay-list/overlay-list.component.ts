import { Component, ChangeDetectorRef, HostListener, Input, Output, OnInit, OnChanges, OnDestroy, SimpleChanges, EventEmitter, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { Observable, of, Subscription, isObservable } from 'rxjs';
import { map, debounceTime, switchMap, filter } from 'rxjs/operators';
import { MatSelectionListChange } from '@angular/material/list';

import { OverlayListModel, OverlayListResponseModel, LoadMoreItemsModel, ApplyFilterModel } from './overlay-list.model';

const BUTTON_NAME = {
  SELECT_ALL: 'SELECT ALL',
  DESELECT_ALL: 'DESELECT ALL'
};

/**
 * @title IMXOverlayList Component
 */
@Component({
  selector: 'imx-overlay-list',
  templateUrl: './overlay-list.component.html',
  styleUrls: ['./overlay-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IMXOverlayListComponent implements OnInit, OnChanges, OnDestroy {

  public selectAllLabel = '';
  public filteredItems = [];
  public listItems: OverlayListModel[];
  public selectedItemsCtrl: FormControl = new FormControl();
  public searchCtrl: FormControl = new FormControl();
  public asyncObservableItems$: Observable<OverlayListResponseModel>;
  public optionItems$: any;
  public currentPageSet: number;
  public totalPageSets: number;
  public perPage: number;
  public totalItems: number;

  private subscription: Subscription;
  private selectedItems: OverlayListModel[] = [];
  private visibleItems: OverlayListModel[] = [];

  @Input() isLoading: boolean = true;
  @Input() CdkOverlayOrigin: CdkOverlayOrigin;
  @Input() isOpen: boolean = false;
  @Input() searchLabel: string;
  @Input() searchCaseSensitive: boolean;
  @Input() searchWithStart: boolean;
  @Input() searchRegex: RegExp;
  @Input() public items: Observable<any> | any[];
  @Output() onApply = new EventEmitter<any>();
  @Output() close = new EventEmitter<any>();
  @Output() open = new EventEmitter<any>();
  @Output() onLoadMoreItems = new EventEmitter<any>();
  @ViewChild('overlay_list_container') overlayListContainer;
  constructor(private cdRef: ChangeDetectorRef) { }

  @HostListener('document:click', ['$event'])
  public onClick(event) {
    if (event.target && this.isOpen && !this.overlayListContainer?.nativeElement?.contains(event.target) && !(event.target.innerText.includes('close'))) {
      if (this.close) {
        this.close.emit();
      }
      this.isOpen = false;
    }
  }

  ngOnInit(): void {
    this.loadItems$(this.items);
    this.searchLabel = this.searchLabel || "Search";
    this.setToggleButtonLabel();
    this.setSearchRegex();
    this.subscription = this.searchCtrl.valueChanges.pipe(
      debounceTime(500),
      filter((searchTerm) => typeof searchTerm === 'string'),
      switchMap(async(searchStr) => {
        if(searchStr) {
          this.isLoading = true;
        }
        this.cdRef.detectChanges();
        this.searchFilter();
        return this.items;
      })).subscribe();
  }

  /**
   * 
   * @param value it is input list items it may be arry or observable and mapped with async pipe
   */
  loadItems$(value: any): void {
    if (Array.isArray(value)) {
      this.totalPageSets = 1;
      this.currentPageSet = 1;
      if(!this.listItems) {
        this.listItems = this.items as OverlayListModel[];
        this.visibleItems = this.listItems;
      }
      this.optionItems$ = of(this.visibleItems);
      this.isLoading = false;
      this.cdRef.markForCheck();
    } else if (isObservable(value)) {
      this.asyncObservableItems$ = value as Observable<OverlayListResponseModel>
      this.optionItems$ = this.asyncObservableItems$.pipe(map(response => {
        const { result, pagination } = response;
        const { perPage, total, page } = pagination;
        this.totalPageSets = Math.ceil(total / perPage);
        this.currentPageSet = page;
        if(!this.perPage) {
          this.perPage = perPage;
        }
        if (!this.totalItems) {
          this.totalItems = total;
        }
        let newItems: OverlayListModel[] = result as OverlayListModel[];
        let resultItems: OverlayListModel[] = [];
        if(!(this.searchCtrl?.value)) {
          if (page === 1) {
            this.listItems = newItems;
          } else {
            this.listItems = [...this.listItems.map(item => {
              return { ...item, selected: false }
            }), ...newItems];
          }
          resultItems = this.getUpdatedItems(this.listItems);
        } else {
          resultItems = this.getUpdatedItems(newItems)
        }
        this.visibleItems = resultItems;
        this.setToggleButtonLabel();
        this.isLoading = false;
        this.cdRef.markForCheck();
        return resultItems as OverlayListModel[];
      }));
      this.cdRef.markForCheck();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.items && this.items) {
      this.isLoading = true;
      this.cdRef.detectChanges();
      this.loadItems$(this.items);
    }
  }

  /**
   * @function used to emit parent event and send the selected item to the parrent componet
   */
  apply(): void {
    if(this.searchCtrl?.value) {
      this.searchCtrl.setValue('');
      this.searchFilter();
    }
    if (this.onApply) {
      this.onApply.emit({
        selectedItem: this.selectedItems,
        searchString: this.searchCtrl.value
      } as ApplyFilterModel);
    }
    if (this.close) {
      this.close.emit();
    }
    this.isOpen = false;
    this.cdRef.markForCheck();
  }

  /**
   * @function invoked scrolled event on observable pagination
   */
   loadMoreItems(): void {
    if (this.onLoadMoreItems) {
      this.onLoadMoreItems.emit( new LoadMoreItemsModel(null, { perPage: this.perPage, page: ++this.currentPageSet }));
      // this.isLoading = !Array.isArray(this.items);
      this.cdRef.markForCheck();
    }
  }

  /**
   * @function used to dynamically sets label value for the select or deselect all button 
   */
  setToggleButtonLabel(): void {
    this.selectAllLabel = this.isAllItemsSelected() ? BUTTON_NAME.DESELECT_ALL : BUTTON_NAME.SELECT_ALL;
    this.cdRef.markForCheck();
  }

  /**
   * @function invoked on changing the searh text input box will be emit filter observable to parant comp
   */
  searchFilter(): void {
    const isArray: boolean = this.isItemsIsArray();
    if(isArray) {
      if (this.searchCtrl.value) {
        this.setSearchRegex();
        this.listItems = this.listItems?.map?.(item => { return {...item, isHide: !(this.searchRegex.test(item.label))}})
      } else {
        this.listItems = this.listItems?.map?.(item => { return {...item, isHide: false}})
      }
      this.visibleItems = this.listItems.filter(item => !item.isHide);
      this.setToggleButtonLabel();
      this.loadItems$(this.listItems);
    }
    if (this.onLoadMoreItems) {
      this.onLoadMoreItems.emit( new LoadMoreItemsModel(this.searchCtrl.value, { perPage: this.searchCtrl?.value ? this.totalItems: this.perPage, page: 1 }));
    }
    // this.isLoading = !isArray;
    this.cdRef.markForCheck();
  }

  /**
   * @function used to set regular expression for search text with array inputs params
   */
  setSearchRegex(): void {
    let pattern = '';
    if (this.searchWithStart) pattern = '^';
    if (this.searchCaseSensitive) this.searchRegex = new RegExp(pattern + this.searchCtrl.value);
    else this.searchRegex = new RegExp(pattern + this.searchCtrl.value, 'i');
  }

  onChange(change: MatSelectionListChange) {
    const changedItem = change?.option?.value as OverlayListModel;
    const isSelected = change?.option?.selected as boolean;
    this.visibleItems = this.visibleItems?.map?.(item => {
      if (item.label === changedItem.label) {
        item.selected = isSelected;
      }
      return item;
    });
    this.setSelectedItems([changedItem], isSelected);
    this.setToggleButtonLabel();
  }

  /**
   * @function used to clear search text box
   */
  clearSearch(): void {
    this.searchCtrl.setValue('');
  }

  /**
   * @function used to check all the items are selectd or not
   * @param no params
   * @returns boolean
   */
  isAllItemsSelected(): boolean {
    const checkedItems = this.selectedItems.map(item => item.label);
    return this.visibleItems && this.selectedItems?.length >= this.visibleItems?.length && !(this.visibleItems?.find(item => !checkedItems.includes(item.label)));
  }

  /**
   * @function triggered on clicking the select all or deselect all button
   * @param no params
   * @returns void
   */
  onToggleSelectAll(): void {
    if (this.selectAllLabel === BUTTON_NAME.SELECT_ALL) {
      this.visibleItems = this.visibleItems?.map?.(item => {
        return { ...item, selected: true }
      });
      this.setSelectedItems(this.visibleItems, true);
    } else if (this.selectAllLabel === BUTTON_NAME.DESELECT_ALL) {
      this.visibleItems = this.visibleItems?.map?.(item => {
        return { ...item, selected: false }
      });
      this.setSelectedItems(this.visibleItems, false);
    }
    if(this.isItemsIsArray()) {
      this.listItems = this.getUpdatedItems(this.listItems);
    }
    this.loadItems$(this.visibleItems)
    this.setToggleButtonLabel();
    this.cdRef.markForCheck();
  }

  /**
   * @function used to check input items is array or not to process loading
   * @returns boolean -> true the input is array, then false means Observable or invalid
   */
  isItemsIsArray(): boolean {
    return Array.isArray(this.items);
  }

  /**
   * @function used to store checked items into selectedItems var
   * @param items as OverlayListModel[] -> updated items
   * @param selected as boolean if it's true -> checked; false-> unchecked
   */
  setSelectedItems(items: OverlayListModel[], selected: boolean): void {
    if(selected) {
      const existingSelectedItems = this.selectedItems.map(item => item.label);
      const newItems = items.filter(item => !existingSelectedItems.includes(item.label));
      this.selectedItems = [...this.selectedItems, ...newItems];
    } else {
      const deselectItems = items.map(item => item.label);
      this.selectedItems = this.selectedItems.filter(item => !deselectItems.includes(item.label));
    }
  }

  /**
   * @function used to retrieve updated items
   * @param items as OverlayListModel[] -> updated items
   */
  getUpdatedItems(items: OverlayListModel[]): OverlayListModel[] {
    const checkedItem = this.selectedItems.map(item => item.label);
    return items.map(item => {
      return { ...item, selected: checkedItem.includes(item.label)}
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe(); // unsubcrbe the search text change event observable
  }
}