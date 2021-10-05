/* tslint:disable:no-output-on-prefix */
import {ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {AudienceFilterState, PopulationFilterState, GeographyType, GeographySet} from '@interTypes/Population';
import {PopulationService} from '../population.service';
import {map, takeUntil, tap} from 'rxjs/operators';
import {Subject, Observable, of} from 'rxjs';

import { ChipSource, GroupAutocompleteChipSource } from '@interTypes/ChipsInput';
import { Geography } from '@interTypes/inventory';
import {GeographySetsState, MarketSelectionState, MarketSelectorConfig, MarketType} from '@interTypes/marketType';
import { PopulationDataService } from '@shared/services/population-data.service';
import {CustomShape, GeographyFilter} from '@interTypes/location-filters';
import {LocationFilterService} from '@shared/services/location-filters.service';
import {AuthenticationService, InventoryService} from '@shared/services';

@Component({
  selector: 'app-population-filters',
  templateUrl: './population-filters.component.html',
  styleUrls: ['./population-filters.component.less']
})
export class PopulationFiltersComponent implements OnInit, OnDestroy, CustomShape, GeographyFilter {

  @Output() onLoadMapView: EventEmitter<any> = new EventEmitter();
  @Output() onDrawPolygon: EventEmitter<any> = new EventEmitter();
  @Output() onDrawCircle: EventEmitter<any> = new EventEmitter();
  @Output() onRemovePolygon: EventEmitter<boolean> = new EventEmitter();
  @Output() specificGeographyApply = new EventEmitter();

  public selectedAudienceList = {};
  public isScenario = false;
  public openAudience = true;
  public selectedGeographyType: keyof GeographyType = 'dma';
  public activeGeoGraphyType: MarketType = 'DMA';
  public tabHeaderHeight = '64px';
  private unsubscribe: Subject<void> = new Subject<void>();
  public selectedTab = 0;
  public filtersSelection: PopulationFilterState;
  public isRadiusFilterEnabled: string;
  public geographySearch$: Observable<GroupAutocompleteChipSource<Geography>[]>;
  isPopulationEnabled: boolean;
  public marketSelectorConfig: MarketSelectorConfig = {
    cancelButtonLabel: 'CLEAR',
    groupButtonLabel: '',
    singleButtonLabel: 'Apply',
    groupSelectionEnabled: false,
    allowedGeoTypes: []
  };
  public displayOptionsList = [
    'Map Legends',
    'Map Controls',
    'Custom Logo',
    'Custom Text',
    'Base Maps'
  ];
  public layersOptionsList = [
    'inventory collection',
    'place collection',
    'place',
    'geography',
    'geo sets'
  ];
  public selectedSpecificGeographies: ChipSource<Geography>[] = [];
  showFilter = false;
  public clearSet$ = new Subject();
  public includeType = 'population';
  constructor(
    private populationService: PopulationService,
    private populationDataService: PopulationDataService,
    public locationFilter: LocationFilterService,
    private cdRef: ChangeDetectorRef,
    private auth: AuthenticationService,
    private inventoryService: InventoryService,
  ) {
    this.locationFilter.loadDependency(cdRef);
  }

  ngOnInit() {
    const populationAccess = this.auth.getModuleAccess('populationLibrary');
    this.isPopulationEnabled = (populationAccess && populationAccess['status'] === 'active');
    const filterSession = this.populationService.getPopulationFilterSession();
    if(filterSession && filterSession['data'] && filterSession['data']['geographyType']){
      this.selectedGeographyType = filterSession['data']['geographyType'];
    }
    this.setGeographyType();
    this.getSideFilterState();
    this.populationService.getPopulationFilters$()
      .pipe(
        tap((res: PopulationFilterState) => {
          this.filtersSelection = res;
        }),
        map((filterState: PopulationFilterState) => {
          const allowedGeoType: MarketType[] = ['National'];
          this.selectedGeographyType = filterState.geographyType;
          switch (filterState.geographyType) {
            case 'dma':
              allowedGeoType.push('DMA');
              this.activeGeoGraphyType = 'DMA';
              break;
            case 'cbsa':
              allowedGeoType.push('CBSA');
              this.activeGeoGraphyType = 'CBSA';
              break;
            case 'county':
              allowedGeoType.push('County');
              this.activeGeoGraphyType = 'County';
              break;
            // TODO : Need to add for other type of geography once they are enabled
          }
          // when population is enabled for the user, show the saved geo sets.
          if (this.isPopulationEnabled) {
            allowedGeoType.push('GEO_SET');
          }
          return allowedGeoType;
        }),
        takeUntil(this.unsubscribe))
      .subscribe((allowed: MarketType[]) => {
        this.marketSelectorConfig.allowedGeoTypes = allowed;
      });
    this.listenForFormCtlStateChanges();
    this.locationFilter.initPlaceSets();
    this.locationFilter.listenForPlacesetsSearch();

  /** clear only filter selection */
    this.populationService.onReset()
    .pipe(takeUntil(this.unsubscribe))
    .subscribe(type => {
      if (type ===  'population') {
        this.removePolygon();
        this.onGeoSetCleared();
        this.clearSet$.next();
      }
    });
  }


  private getSideFilterState() {
    this.populationDataService.getFilterSideNav().pipe(takeUntil(this.unsubscribe)).subscribe(data => {
      switch (data['tab']) {
        case 'filters':
          this.selectedTab = 1;
          break;
        case 'layers':
          this.selectedTab = 2;
          break;
        case 'actions':
          this.selectedTab = 3;
          break;
        default:
          this.selectedTab = 0;
          break;
      }
      this.showFilter = !!data['open'];
    });
  }

  public setGeographyType(): void {
    this.populationService.setPopulationFilter('geographyType', this.selectedGeographyType);
  }

  public onCompletedBrowsing($event) {
    if ($event && $event['targetAudience']) {
      const target: AudienceFilterState = $event['targetAudience'];
      this.populationService.setPopulationFilter('audience', target);
    }
    if ($event['clearFilter']) {
      this.populationService.clearFilters('audience');
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.locationFilter.ngOnDestroy();
  }

  public removePolygon() {
    this.onCloseFilterTab();
    this.locationFilter.selectedPlacesCtrl.setValue([]);
    this.locationFilter.radiusCtrl.setValue(1);
    this.locationFilter.searchFromCtl.setValue('');
    this.onRemovePolygon.emit(true);
  }

  public drawPolygon() {
    this.onDrawPolygon.emit();
    this.onCloseFilterTab();
  }

  public drawCircle() {
    this.onDrawCircle.emit();
    this.onCloseFilterTab();
  }

  /** Filter by Place Set and Radius */
  public applyForm() {
    this.locationFilter.applyForm();
  }

  public toggleLocationFilter(event) {
    console.log('Toggle location header');
  }

  public clearAllFromAction() {
    this.removePolygon();
    this.onGeoSetCleared();
    this.populationService.resetPopulationFilter();
    this.clearSpecificGeo();
    this.populationService.resetAll();
    this.resetMarkets();
  }
  public resetAllFilter() {
    /** To clear the population filters */
    this.populationService.resetPopulationFilter();
  }

  /**
   *
   * @param value
   */
  public searchGeographies(value: string) {
    /** TODO: Remove market type once enable all types */
    this.geographySearch$ = this.inventoryService.getGeographies(value, false).pipe(
      map(geos => {
          geos = geos.filter(geo =>['DMA', 'CBSA' , 'County'].includes(geo['label']))
      return geos;
    }));

  }

  public geographySelected(selected: Geography) {
    const existGeo = this.selectedSpecificGeographies.findIndex(geo => geo['data']['id'] === selected.id && geo['data']['type'] === selected.type);
    if (existGeo < 0) {
      const label = `${selected.type}: ${selected.label}`;
      const geography: ChipSource<Geography> = {label: label, data: selected};
      this.selectedSpecificGeographies = [...this.selectedSpecificGeographies, geography];
    }
  }
  /**
   * clear the specific geography filter
   */
  clearSpecificGeo() {
    this.populationService.clearFilters('specificGeography');
    this.selectedSpecificGeographies = [];
  }
 /**
   * Apply the selected specific geography
   */
  applySpecificGeo() {
    this.specificGeographyApply.emit(this.selectedSpecificGeographies);
  }

  /**
   *
   * @param removed Remove selected specific geography
   */
  public onGeographyRemoved(removed) {
    this.selectedSpecificGeographies = this.selectedSpecificGeographies.filter(geography => {
      return geography.data.id !== removed.data.id;
    });
  }

  public compare(c1, c2) {
    return c1 && c2 && c1['_id'] === c2['_id'];
  }

  public onMarketSelection($event: MarketSelectionState | GeographySetsState): void {

    if ( $event.type ===  'GEO_SET' ) {
      const geographySetsState = $event as GeographySetsState;
      this.onGeoSetSelected(geographySetsState.selectedGeographySets);
      return;
    }

    const selectedMarkets = $event as MarketSelectionState;
    if (selectedMarkets  && selectedMarkets.selectedMarkets.length > 0) {
      this.populationService.setPopulationFilter('market', $event);
    }

  }
  /** This is reset market geography set & market - Emit call */
  public resetMarkets(): void {
    this.populationService.clearFilters('geographySet');
    this.populationService.clearFilters('market');
    this.populationService.clearFilters('specificGeography');
  }

  /**
   * @description
   *  Close the left side nav
   *
   */
  private onCloseFilterTab() {
    const sidenavOptions = {open: false, tab: ''};
    this.populationDataService.setFilterSideNav(sidenavOptions);
  }

  /**
   * @description
   *   This listener setting the registered form control value changes
   *
   */
  private listenForFormCtlStateChanges() {

    this.populationService.getSelectedPlacesCtrlValue().pipe(takeUntil(this.unsubscribe))
      .subscribe(value => {
        this.locationFilter.selectedPlacesCtrl.setValue(value);
      });

    this.populationService.getRadiusCtrlValue().pipe(takeUntil(this.unsubscribe))
      .subscribe(value => {
        if (value > 0) {
          this.locationFilter.radiusCtrl.setValue(value);
        } else {
          this.locationFilter.radiusCtrl.setValue(1);
        }
      });

  }

  public onGeoSetSelected($event: GeographySet): void {
    this.populationService.setPopulationFilter('geographySet', $event);
  }
  public onGeoSetCleared(): void {
    this.populationService.clearFilters('geographySet');
  }

  loadMorePlaceSets() {
    this.locationFilter.loadMorePlaceSets();
  }

}
