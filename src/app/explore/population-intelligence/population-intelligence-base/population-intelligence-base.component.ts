import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { DmaOption, GeographyData, MenuOption, PopulationIntelProduct, RecordGeographyData } from '@interTypes/population-intelligence-types';
import { FormControl, FormGroup } from '@angular/forms';
import { MapHttpService } from '../services';
import { Observable, pipe } from 'rxjs';
import * as mapboxgl from 'mapbox-gl';
import { MapHelperService } from '../services/map-helper.service';
import { ExploreDataService } from '@shared/services';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-population-intelligence',
  templateUrl: './population-intelligence-base.component.html',
  styleUrls: ['./population-intelligence-base.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopulationIntelligenceBaseComponent implements OnInit {
  @Input() private populationModuleAccess;
  private map: mapboxgl.Map;
  public products: PopulationIntelProduct[] = [
    {
      label: 'Trade Area Analysis',
      iconName: 'IMX-trade-area',
      value: 'tradeAreaAnalysis'
    },
    {
      label: 'Residential Analysis',
      iconName: 'IMX-residential',
      value: 'residentialAnalysis',
      popLimit: 2800
    },
    {
      label: 'Anytime Population',
      iconName: 'IMX-anytime-pop',
      value: 'anytimePopulation',
      demographics: {
        'age_00plus': {
          'calculation': 'target_total',
          'units': 'Average Population',
          'showHourly': true,
          'weekdays': ['1234567'],
          'dateRanges': ['20210101_20210131'],
          'segment': 'age_00plus',
          'displayName': 'All Persons'
        },
        'age_00plus_nonlocal': {
          'calculation': 'target_nonlocal',
          'units': 'Average Population',
          'showHourly': true,
          'weekdays': ['1234567'],
          'dateRanges': ['20210101_20210131'],
          'segment': 'age_00plus',
          'displayName': 'Non-Local Visitors'
        },
        'age_00plus_nonlocal_penetration': {
          'calculation': 'target_nonlocal_penetration',
          'units': 'Percent of Population',
          'showHourly': true,
          'weekdays': ['1234567'],
          'dateRanges': ['20210101_20210131'],
          'segment': 'age_00plus',
          'displayName': 'Non-Local Visitor Percent'
        },
        'pz06_winners': {
          'calculation': 'target_total',
          'units': 'Average Population',
          'showHourly': true,
          'weekdays': ['1234567'],
          'dateRanges': ['20210101_20210131'],
          'segment': 'pz_seg06',
          'displayName': 'Winner\'s Circle'
        },
        'pz06_winners_penetration': {
          'calculation': 'target_penetration',
          'units': 'Percent of Population',
          'showHourly': true,
          'weekdays': ['1234567'],
          'dateRanges': ['20210101_20210131'],
          'segment': 'pz_seg06',
          'displayName': 'Winner\'s Circle Percent'
        },
        'pz31_conn_bohemians': {
          'calculation': 'target_total',
          'units': 'Average Population',
          'showHourly': true,
          'weekdays': ['1234567'],
          'dateRanges': ['20210101_20210131'],
          'segment': 'pz_seg31',
          'displayName': 'Connected Bohemians'
        },
        'pz31_conn_bohemians_penetration': {
          'calculation': 'target_penetration',
          'units': 'Percent of Population',
          'showHourly': true,
          'weekdays': ['1234567'],
          'dateRanges': ['20210101_20210131'],
          'segment': 'pz_seg31',
          'displayName': 'Connected Bohemians Percent'
        },
        'hisp_hhi_000t074': {
          'calculation': 'target_total',
          'units': 'Average Population',
          'showHourly': true,
          'weekdays': ['1234567'],
          'dateRanges': ['20210101_20210131'],
          'segment': 'hisp_hhi_000t074',
          'displayName': 'Hispanic, HHI < $75k'
        },
        'hisp_hhi_000t074_penetration': {
          'calculation': 'target_penetration',
          'units': 'Percent of Population',
          'showHourly': true,
          'weekdays': ['1234567'],
          'dateRanges': ['20210101_20210131'],
          'segment': 'hisp_hhi_000t074',
          'displayName': 'Hispanic, HHI < $75k Percent'
        },
        'hisp_esp_dependent': {
          'calculation': 'target_total',
          'showHourly': true,
          'units': 'Average Population',
          'weekdays': ['1234567'],
          'dateRanges': ['20210101_20210131'],
          'segment': 'hisp_esp_dependent',
          'displayName': 'Hispanic, Spanish dependent'
        }
      }
    }
  ];
  public daysInWeek = [
    {label: 'Mo', value: 'monday'},
    {label: 'Tu', value: 'tuesday'},
    {label: 'We', value: 'wednesday'},
    {label: 'Th', value: 'thursday'},
    {label: 'Fr', value: 'friday'},
    {label: 'Sa', value: 'saturday'},
    {label: 'Su', value: 'sunday'},
  ];
  public nonlocalChartGroupOptions: MenuOption[] = [
    { text: 'Age group', value: 'age', data: name => name.includes('age_') && name !== 'age_00plus' },
    { text: 'Household Income', value: 'hhi', data: name => name.includes('hhi_') },
    { text: 'PRIZM', value: 'pz', data: name => name.includes('pz_') },
    // { text: 'Hispanic/Spanish Dependent', value: 'hisp', data: name => name.includes('hisp_') }
  ];
  public selectedProduct: PopulationIntelProduct | null;
  // TODO: Need to change the dmaId based on selection, need to confirm with Matthew about what will be the DMA ID
  private dmaID = '535';
  private defaultDMA: DmaOption = {
    boundingBox: [-83.880408, 38.948073, -81.225924, 40.996943],
    geographyTypes: ['zips'],
    name: 'Columbus, OH',
    population: 2609587,
    productTypes: ['resident-analysis', 'trade-area-analysis', 'anytime-population']
  };
  public dmaList$: Observable<Record<string, DmaOption>[]> = this.mapHttpService.loadDmaOptions();
  public populationIntelForm = new FormGroup({
    zipCode: new FormControl(),
    dma: new FormControl(this.defaultDMA),
    timeFrame: new FormControl(),
    allDays: new FormControl({value: false, disabled: true}),
    selectedDays: new FormControl({value: false, disabled: true}),
    viewNational: new FormControl(true),
    dailyOrHourlyAverage: new FormControl(true),
    nonLocalChartGroups: new FormControl('pz'),
    targetSegment: new FormControl(),
    percentageOrPopulation: new FormControl(),
  });
  public zipCodeList$: Observable<GeographyData[] | RecordGeographyData> = this.mapHttpService.loadGeographyType('zips', this.dmaID);
  public timeframes: MenuOption[] = [];
  public targetSegments: MenuOption[] = [];
  public sliderAnimating = false;
  public selectedHour = 0;
  public typeClass: string = null;
  private colorSequence: string[] = [
    'rgba(218, 230, 213, 0.0)',
    'rgba(64, 222, 168, 0.2)',
    'rgba(39, 205, 148, 0.4)',
    'rgba(39, 205, 148, 0.6)',
    'rgba(37, 176, 128, 0.8)',
    'rgba(246, 205, 83, 0.9)'
  ];
  private colorContrast = '#f6cd53';
  private selectedGeography: string = null;
  private inventoryOperator = 'Lamar';
  private showInventory = false;
  constructor(private mapHttpService: MapHttpService,
              private mapHelper: MapHelperService,
              private exploreDataService: ExploreDataService) {}

  ngOnInit(): void {
    this.products = this.products.filter((item: PopulationIntelProduct) => {
      return this.populationModuleAccess[item.value].status === 'active';
    });
    this.exploreDataService.getMapObject()
      .pipe(filter((mapObject) => Object.keys(mapObject).length > 0))
      .subscribe((map: mapboxgl.Map) => {
        this.map = map;
        this.mapHelper.initMap(map, {
          // Mocked the code from the data interMX with some static data here.
          dmaID: this.dmaID,
          colorSequence: this.colorSequence,
          colorContrast: this.colorContrast,
          selectedGeography: this.selectedGeography,
          inventoryOperator: this.inventoryOperator,
          showInventory: this.showInventory,
          localMode: this.populationIntelForm.controls.viewNational.value ? 'nonlocal' : 'local',
          popLimit: this.getPopLimit(),
          selectedDMA: this.defaultDMA,
          selectedProduct: this.selectedProduct || this.products[2]
        });
      });
    this.exploreDataService.getPopulationOpenState$()
      .subscribe(response => {
        this.mapHelper.togglePopulationLayers(response);
      });
  }
  public productTrackBy(index, item: PopulationIntelProduct): string {
    return item.value;
  }
  public dmaTrackBy(index, item: Record<string, DmaOption>): string {
    return index;
  }
  public zipCodeTrackBy(index, item: Record<string, DmaOption>): string {
    return index;
  }
  public selectProduct(product: PopulationIntelProduct): void {
    this.selectedProduct = product;
  }
  public sliderAnimatingChange($event: boolean): void {
    this.sliderAnimating = $event;
  }
  public selectedHourChange($event): void {
    console.log($event);
  }
  public getPopLimit(): number {
    let popLimit = 0;
    if (this.selectedProduct && this.selectedProduct?.popLimit) {
      popLimit = this.selectedProduct?.popLimit;
    }
    /*else if (product && product.demographics && product.demographics[this.selectedDemographic] && product.demographics[this.selectedDemographic].popLimit) {
      popLimit = product.demographics[this.selectedDemographic].popLimit
    }*/
    return popLimit;
  }
}
