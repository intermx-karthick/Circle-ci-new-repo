import { Component, OnInit, ViewChild, ElementRef, ViewChildren, QueryList, AfterViewInit, OnDestroy } from '@angular/core';
import { FiltersService } from '../filters.service';
import { takeWhile, map, filter, debounceTime, distinctUntilChanged, catchError, skip, tap, finalize } from 'rxjs/operators';
import { ListKeyManager } from '@angular/cdk/a11y';
import { ArrowNavigationComponent } from '../../../shared/components/arrow-navigation/arrow-navigation.component';
import { AuthenticationService } from '../../../shared/services/authentication.service';
import { InventoryService } from '@shared/services/inventory.service';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';
import {Helper} from '../../../classes';

@Component({
  selector: 'app-operator-filter',
  templateUrl: './operator-filter.component.html',
  styleUrls: ['./operator-filter.component.less']
})
export class OperatorFilterComponent extends AbstractLazyLoadComponent implements OnInit, AfterViewInit, OnDestroy {
  private unSubscribe = true;
  public filterOptions: any;
  public filteredOperators: any = [];
  public operators: any = [];
  public selectedOperators = [];
  public dummySelectedOperators = [];
  public searchSelectedOperator = {};
  public appliedFilters = {};
  public searchQuery = '';
  public arrowKeyPosition = { operator: 0 };
  @ViewChild('operatorSearch') focusOperator: ElementRef;
  public keyboardEventsManager: ListKeyManager<any>;
  @ViewChildren(ArrowNavigationComponent) listItems: QueryList<ArrowNavigationComponent>;
  public mod_permission: any;
  public allowInventory = '';
  public defaultAudience: any;
  customInventory: Observable<any> = of([]);
  cleatFilterTimer: any = null;
  isInitialLoadCompleted = false;
  unsubscribeInitiator$: Subject<void> = new Subject<void>();

  constructor(
    private filtersService: FiltersService,
    private auth: AuthenticationService,
    private inventoryService: InventoryService,
    private activatedRoute: ActivatedRoute
  ) {
    super();
  }

  init(){
    this.filtersService.getFilters()
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeWhile(() => this.unSubscribe),
        map(filters => {
          return this.filtersService.normalizeFilterDataNew(filters);
        }))
      .subscribe(filterData => {
        filterData['summary_level_list'] = ['Plant'];
        if (filterData['operator_name_list']) {
          delete filterData['operator_name_list'];
        }
        this.loadOperators(filterData);
      });
  }

  public ngOnInit() {
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    this.listenerForInitialLoad();
    this.loadFilterFromSession();
    this.filtersService.onReset()
      .subscribe(type => {
        this.clearOperator();
      });
    this.filtersService.checkSessionDataPushed()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(val => {
        if (val) {
          this.loadFilterFromSession();
        }
      });

    this.defaultAudience = this.activatedRoute.snapshot.data.defaultAudience;
  }

  matchData(arr, value) {
    const result = arr.filter((o, index) => {
      return o.id === value.id.toString();
    });
    return result ? result[0] : null;
  }

  loadOperators(filters) {
    if (this.cleatFilterTimer != null) {
      this.cleatFilterTimer.unsubscribe();
    }
    let customInventory: Observable<any> = of([]);
    if (this.mod_permission['features']['customInventories']['status'] === 'active' &&
     this.inventoryService.checkToCallCustomInv(filters)) {
      let query = this.inventoryService.prepareInventoryQuery(filters);
      query = this.inventoryService.addOperatorQuery(query, filters);
      customInventory = this.inventoryService.getOperatorFilterDataElastic(true, query).pipe(
        takeWhile(() => this.unSubscribe),
        filter((results: any) => {
          return results.operators.buckets.sort((operator1, operator2) =>
            operator2.ids.buckets[0]['spots']['spot_filter']['spot_count']['value'
          ] - operator1.ids.buckets[0]['spots']['spot_filter']['spot_count']['value']);
        }), map((data: any) => {
          return data.operators.buckets.map(operator => {
            return { id: operator.key, name: operator.ids.buckets[0].key, count: operator.ids.buckets[0]['spots']['spot_filter'
          ]['spot_count']['value'] };
          }).filter((operator) => operator.id);
        }), catchError(err => of([])));
    }
    delete filters['gp_ids'];
    delete filters['custom_ids'];
    filters['measures_required'] = false;
    filters['status_type_name_list'] = ["*"] ;
    delete filters['sort'];
    this.cleatFilterTimer = forkJoin([
      this.inventoryService.getOperatorsFilterData(filters).pipe(
      takeWhile(() => this.unSubscribe),
      filter((results: any) => {
        return results.summaries.sort((operator1, operator2) => operator2.spots - operator1.spots);
      }),
      map((data: any) => {
        return data.summaries.map(operator => {
          return { id: operator.summarizes.id, name: operator.summarizes.name, count: operator.spots };
        }).filter((operator) => operator.id);
      })),
      customInventory
    ]).pipe(finalize(()=>this.destroyInitiator())).subscribe(result => {
        this.filteredOperators = result[0];
        this.operators = result[0];
        this.searchQuery = '';
        if (result[1].length > 0) {
          result[1].filter(operator => {
            const matchedData = this.matchData(result[0], operator);
            if (matchedData === null || matchedData === undefined) {
              operator.id = operator.id.toString();
              this.filteredOperators.push(operator);
            } else {
              matchedData.count = matchedData.count + operator.count;
              this.filteredOperators.push(matchedData);
            }
          });
          this.filteredOperators.sort((operator1, operator2) => operator2.count - operator1.count);
          this.operators = this.filteredOperators;
        }
      });
  }

  loadFilterFromSession() {
    const filterSession = this.filtersService.getExploreSession();
    if (filterSession) {
      if (filterSession['data'] && filterSession['data']['operatorList']) {
        filterSession['data']['operatorList'].forEach(item => {
          this.selectedOperators.push({ 'name': item });
          this.dummySelectedOperators = Helper.deepClone(this.selectedOperators);
        });
      }
    }
  }
  public ngAfterViewInit() {
    if (this.listItems['_results']) {
      this.keyboardEventsManager = new ListKeyManager<any>(this.listItems).withWrap().withTypeAhead();
    }
  }

  public ngOnDestroy() {
    this.unSubscribe = false;
  }

  public trackById(index: number, operator: any){
    return operator.id;
  }

  public setSelectedOperator(selectedOperator) {
    if (typeof this.searchSelectedOperator['name'] !== 'undefined') {
      const index = this.selectedOperators.findIndex(opp => opp.name === this.searchSelectedOperator['name']);
      this.selectedOperators.splice(index, 1);
      this.searchSelectedOperator = {};
    }
    if (typeof selectedOperator.name !== 'undefined') {
      const matches = this.selectedOperators.filter(v => v.name === selectedOperator.name);
      if (matches.length <= 0) {
        this.searchSelectedOperator = selectedOperator;
        this.selectedOperators.push(selectedOperator);
      }
    }
  }

  public submit() {
    // TODO
  }

  public filterOperators(data) {
    if (data.emptySearch) {
      this.filteredOperators = this.operators;
    } else {
      this.filteredOperators = data.value;
    }
  }

  private onFocusOperator() {
    setTimeout(() => {
      this.focusOperator.nativeElement.focus();
    }, 100);
  }

  public applyForm() {
    this.appliedFilters['filterType'] = 'operatorList';
    this.appliedFilters['data'] = this.selectedOperators.map(option => option.name);
    if (this.appliedFilters['data'].length > 0) {
      this.filtersService.setFilter(this.appliedFilters['filterType'], this.appliedFilters['data']);
    } else {
      this.clearOperator();
    }
  }

  public clearOperator() {
    this.selectedOperators = [];
    this.dummySelectedOperators = [];
    this.searchQuery = '';
    this.filteredOperators = this.operators;
    this.filtersService.clearFilter('operatorList', true);
    this.appliedFilters = {
      data: [],
      filterType: ' ',
    };
    return true;
  }
  public onSelectOperator(selectedOpt, optionRef) {
   const index = this.dummySelectedOperators.findIndex(opp => opp.name === selectedOpt['name']);
   if (optionRef['_selected'] && index < 0 ) {
    this.dummySelectedOperators.push(selectedOpt);
   } else {
      if (index > -1) {
        this.dummySelectedOperators.splice(index, 1);
      }
   }
   this.selectedOperators = Helper.deepClone(this.dummySelectedOperators);
  }
  checkIsSelected(option) {
    const matches = this.selectedOperators.filter(v => v.name === option.name);
    return matches.length > 0;
  }
  public compare(c1, c2) {
    return c1 && c2 && c1['_id'] === c2['_id'];
  }
}
