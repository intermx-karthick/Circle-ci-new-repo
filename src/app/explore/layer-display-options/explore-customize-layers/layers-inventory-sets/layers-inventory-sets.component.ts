import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { debounceTime , switchMap, map, tap, withLatestFrom, scan, distinctUntilChanged, startWith } from 'rxjs/operators'
import { CommonService } from '@shared/services';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-explore-layers-inventory-sets',
  templateUrl: 'layers-inventory-sets.component.html',
  styleUrls: ['./layers-inventory-sets.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayersInventorySetsComponent extends AbstractLazyLoadComponent implements OnInit, OnChanges {

  @Input() inventorySets;
  @Output() move = new EventEmitter();
  @Output() updateInventorySets = new EventEmitter();

  isInitialLoadCompleted: boolean = false;
  packagesLoading: boolean = true;
  unsubscribeInitiator$: Subject<void> = new Subject<void>();
  private inventorySetPages$ = new BehaviorSubject<number>(1);
  public currentInventorySetPage: number = 1;
  public totalInventorySetPages: number = 1;
  public inventories$: Observable<any[]> = null;
  public search: FormControl = new FormControl('');

  constructor(private cdRef: ChangeDetectorRef, private commonService: CommonService) {
    super();
  }

  init(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.isDirty(changes)){
      this.destroyInitiator();
    }
  }

  ngOnInit() {
    this.listenerForInitialLoad();
    this.getInventorySetsObservable$();
  }

  trackById(index: number, packageSet: any) {
    return packageSet._id;
  }

  moveInventory(set, position) {
    this.move.emit({ set, position });
  }

  private isDirty(changes: SimpleChanges){
    return changes?.inventorySets?.currentValue && this.isInitiated && !this.isInitialLoadCompleted;
  }

  public getInventorySetsObservable$(): void {
    const search$ = this.search.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith(''),
        tap(res => {
          this.inventorySetPages$.next(1);
          this.packagesLoading = true;
          this.cdRef.markForCheck();
        })
      );

    this.inventories$ = this.inventorySetPages$.pipe(
      debounceTime(400),
      withLatestFrom(search$),
      switchMap(([page, search]) => {
        return this.commonService
          .getSavedInventorySets(search, page, 15)
          .pipe(map(response => {
            this.currentInventorySetPage = page;
            this.totalInventorySetPages = Math.ceil(response['pagination']['total'] / response['pagination']['perPage']);
            return response['results'] ? response['results'] : [];
          }),
            tap(res => {
              this.packagesLoading = false;
              this.cdRef.markForCheck();
            }));
      }),
      withLatestFrom(this.inventorySetPages$),
      scan((acc, [currentOptions, currOffset]) => currOffset === 1 ? currentOptions : [...acc, ...currentOptions], []),
      map(items => {
        this.updateInventorySets.emit({ items, searchText: this.search?.value });
        return items;
      })
    );
  }

  public loadMoreInventorySet() {
    if (this.currentInventorySetPage < this.totalInventorySetPages) {
      this.currentInventorySetPage += 1;
      this.inventorySetPages$.next(this.currentInventorySetPage);
      this.packagesLoading = true;
      this.cdRef.markForCheck();
    }
  }

  clearSearch(): void {
    this.search.setValue('');
  }

}
