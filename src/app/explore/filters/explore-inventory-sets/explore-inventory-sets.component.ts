import { Component, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FiltersService} from '../filters.service';
import swal from 'sweetalert2';
import { AuthenticationService } from '../../../shared/services/authentication.service';
import {WorkSpaceService} from '../../../shared/services/work-space.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { debounceTime,takeWhile, switchMap, map, tap, withLatestFrom, scan, distinctUntilChanged, startWith } from 'rxjs/operators'
import { CommonService } from '@shared/services';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-explore-inventory-sets',
  templateUrl: './explore-inventory-sets.component.html',
  styleUrls: ['./explore-inventory-sets.component.less']
})
export class ExploreInventorySetsComponent extends AbstractLazyLoadComponent implements OnInit, OnDestroy {
  private unSubscribe = true;
  public packages = [];
  public appliedFilters = {};
  public searchedPackages = [];
  public searchQuery = '';
  public selectedInventoryOptions = [];
  @Output() editInventoryPackage: EventEmitter<boolean> = new EventEmitter();
  @Output() deleteInventoryPackage: EventEmitter<boolean> = new EventEmitter();
  public mod_permission: any;
  public scenario_mod_permission: any;
  public allowInventory = '';
  public allowScenarios = '';
  public customInventories = false;
  public clientId;
  public isInitialLoadCompleted = false;
  public unsubscribeInitiator$: Subject<void> = new Subject();
  public packagesLoading: boolean = true;
  public inventorySetPages$ = new BehaviorSubject<number>(1);
  public currentInventorySetPage: number = 1;
  public totalInventorySetPages: number = 1;
  public inventories$: Observable<any[]> = null;
  public search: FormControl = new FormControl('');

  constructor(
    private workSpaceService: WorkSpaceService,
    private route: ActivatedRoute,
    private filtersService: FiltersService,
    private auth: AuthenticationService,
    private theme: ThemeService,
    private commonService: CommonService,
    private cdRef: ChangeDetectorRef,
  ) {
    super();
  }

  init() {
    this.getInventorySetsObservable$();
  }

  ngOnInit() {
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    this.scenario_mod_permission = this.auth.getModuleAccess('v3workspace');
    this.allowScenarios = this.scenario_mod_permission['status'];
    const themeSettings = this.theme.getThemeSettings();
    this.clientId = Number(themeSettings.clientId);
    this.customInventories = (
      this.mod_permission
      && this.mod_permission['features']
      && this.mod_permission['features']['customInventories']
      && this.mod_permission['features']['customInventories']['status']
      && this.mod_permission['features']['customInventories']['status'] === 'active' || false);
    this.listenerForInitialLoad();
    this.filtersService
      .onReset()
      .subscribe(type => {
        this.selectedInventoryOptions = [];
        this.resetAppliedFilters();
    });
    this.filtersService
      .checkSessionDataPushed()
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeWhile(() => this.unSubscribe)
      )
      .subscribe(val => {
        if (val) {
          this.loadFilterFromSession();
        }
      });
  }

  public trackById(index: number, packageSet: any){
    return packageSet._id;
  }

  public createNew(): void {
    this.filtersService.createNewInventorySet();
  }

  private loadFilterFromSession() {
    const filterSession = this.filtersService.getExploreSession();
    if (filterSession && filterSession['data']) {
      if (filterSession['data']['inventorySet'] &&
        filterSession['data']['inventorySet']['inventoryIds'] && filterSession['data']['inventorySet']['inventoryIds'].length !== 0) {
        const sessionSets  = this.searchedPackages.filter(packageSet => {
          return filterSession['data']['inventorySet']['inventoryIds'].filter( set => {
              return packageSet._id === set;
          }).length !== 0;
        });
        this.selectedInventoryOptions = sessionSets;
      }
    }
  }
  public onApply() {
    this.resetAppliedFilters();
    /**
     * One or more package panel can be selected, so we are looping over
     *
     */
    this.selectedInventoryOptions.map(item => {
      /**
       * For each inventory we only need the geopanel ID, so we're
       * using a function to extract the ID as an array and we are
       * spreading it using the ... spread operator. Finally the
       * resulting array this.appliedFilters['data'] will be an array
       * of geopanel IDs from selected inventory sets
       */
      const gp_ids = [];
      const custom_ids = [];
      item.inventory?.map(inventory => {
        if (inventory['type'] === 'geopathPanel') {
          gp_ids.push(inventory['id']);
        } else {
          custom_ids.push(inventory['id']);
        }
      });
      /*
      Here gp_ids and custom_ids is dummy array to maintain
      Geopath panel ids and custom db panel ids to decide which ids have to passed
      which APIs (Geopath or Elastic)
    */
      if (!this.appliedFilters['data']['gp_ids']) {
        this.appliedFilters['data']['gp_ids'] = [];
      }
      this.appliedFilters['data']['gp_ids'].push(...gp_ids);

      if (this.customInventories
        && item.client_id !== null
        && Number(item.client_id) === Number(this.clientId)) {
          if (!this.appliedFilters['data']['custom_ids']) {
            this.appliedFilters['data']['custom_ids'] = [];
          }
          this.appliedFilters['data']['custom_ids'].push(...custom_ids);
        }
      /* this.appliedFilters['data'].push(...Array.from(item.inventory, inventory => {
        if (inventory['type'] !== 'geopathPanel') {
          return inventory['id'];
        }
      })); */
    });
    this.appliedFilters['filterType'] = 'inventorySet';
    this.submitFilters();
  }

  public submitFilters() {
    const idCount = (this.appliedFilters['data']['gp_ids'] && this.appliedFilters['data']['gp_ids'].length || 0) +
    (this.appliedFilters['data']['custom_ids'] && this.appliedFilters['data']['custom_ids'].length || 0);
    if (idCount > 0) {
      this.filtersService.setFilter(this.appliedFilters['filterType'],
      {ids: this.appliedFilters['data'], inventoryIds: this.selectedInventoryOptions.map(set => set._id)});
    } else {
      this.onClearInventorySet();
    }
  }

  private resetAppliedFilters() {
    this.searchQuery = '';
    this.searchedPackages = this.packages;
    this.appliedFilters = {
      data: {},
      selected: null,
      filterType: ' ',
    };
  }

  public filterPackages(data) {
    if (data.emptySearch) {
      this.searchedPackages = this.packages;
    } else {
      this.searchedPackages = data.value;
    }
  }

  public onClearInventorySet() {
    this.selectedInventoryOptions = [];
    this.filtersService.clearFilter('inventorySet', true);
    this.resetAppliedFilters();
  }

  public onEditInventorySet(pack) {
    this.filtersService.openPackage('edit', pack, true, [], {}, null, this.reloadInventorySets.bind(this));
  }

  public onDeleteInventorySet(pack) {
    const name = pack.name;
    const id = pack['_id'];
    swal({
      title: 'Are you sure you want to delete "' + name + '" inventory set?',
      text: '',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'YES, DELETE',
      confirmButtonClass: 'waves-effect waves-light',
      cancelButtonClass: 'waves-effect waves-light'
    }).then((x) => {
      if (typeof x.value !== 'undefined' && x.value) {
        this.workSpaceService
          .deletePackage(id)
          .subscribe(success => {
              this.reloadInventorySets();
              this.onClearInventorySet();
            },
            e => {
              let message = '';
              if (typeof e.error !== 'undefined' && typeof e.error.message !== 'undefined') {
                message = 'An error has occurred. Please try again later.';
              }
              swal('Error', message, 'error');
            });
      }
    }).catch(swal.noop);
  }

  public compare(c1, c2) {
    return c1 && c2 && c1['_id'] === c2['_id'];
  }

  public ngOnDestroy() {
    this.unSubscribe = false;
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
          .getSavedInventorySets(search, page, 15, 'id,name,inventory')
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
        this.packages = items || [];
        this.searchedPackages = items || [];
        this.loadFilterFromSession();
        this.destroyInitiator();
        this.cdRef.markForCheck();
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

  public reloadInventorySets() {
    this.inventorySetPages$.next(1);
  }

}
