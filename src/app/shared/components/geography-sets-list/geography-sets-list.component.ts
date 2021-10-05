import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { GeographySet } from '@interTypes/Population';
import {PopulationDataService} from '@shared/services/population-data.service';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';

@Component({
  selector: 'app-geography-sets-list',
  templateUrl: './geography-sets-list.component.html',
  styleUrls: ['./geography-sets-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeographySetsListComponent extends AbstractLazyLoadComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() public showLargeBtns = false;
  @Output() public setSelected: EventEmitter<GeographySet> = new EventEmitter<GeographySet>();
  @Output() public setCleared: EventEmitter<void> = new EventEmitter<void>();
  @Input() public clearSet: Observable<any>;

  // When component is need to be use at layers design
  @Input() public isForLayers = false;
  @Input() selectedGeoSetIds: string[] = [];

  public geoSets: GeographySet[] = [];
  public searchCtrl: FormControl = new FormControl();
  public totalSets = 0;
  public unsubscribe$: Subject<void> = new Subject<void>();
  public enableLoader = false;
  public selectedGeoSetCtrl: FormControl = new FormControl();
  public isInitialLoadCompleted = false;
  public unsubscribeInitiator$: Subject<void> = new Subject<void>();

  private page = 1;


  constructor(
    private populationDataService: PopulationDataService,
    private cdRef: ChangeDetectorRef
  ) {
    super();
  }

  init(): void {
    this.loadGeoSets();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes.selectedGeoSetIds && changes.selectedGeoSetIds.currentValue){
      this.cdRef.markForCheck();
      this.selectedGeoSetIds = changes.selectedGeoSetIds.currentValue;
    }
  }

  ngOnInit() {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.unsubscribe$)).subscribe((value: string) => {
        this.loadGeoSets(value);
      });
    this.populationDataService.getGeoSetSaveNotification().pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.loadGeoSets();
    });
  }

  ngAfterViewInit() {
    this.listenerForInitialLoad();

    /** clear the geography set */
    if (this.clearSet) {
      this.clearSet.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
          /** To fire when clear the geographysets */
            this.clearSets();
      });
    }
  }

  private loadGeoSets(query: string = '') {
   if(this.isInitialLoadCompleted)this.enableLoader = true;
    this.cdRef.markForCheck();
    this.page = 1;
    this.populationDataService.getAllGeoSets(query).subscribe(response => {
      this.enableLoader = false;
      this.destroyInitiator();

      if (response['pagination'] && response['pagination']['total'] > 0) {
        this.geoSets = response['results'];
        this.totalSets = response['pagination']['total'];
      } else {
        this.geoSets = [];
        this.totalSets = 0;
      }
      this.cdRef.markForCheck();
    }, error => {
      this.destroyInitiator();
      this.enableLoader = false;
      this.cdRef.markForCheck();
    });
  }

  public applySets() {
    if (this.selectedGeoSetCtrl.value) {
      const selectedSet: GeographySet = this.geoSets.find(set => set._id === this.selectedGeoSetCtrl.value);
      if (selectedSet) {
        this.setSelected.emit(selectedSet);
      }
    }
  }

  public clearSets() {
    this.selectedGeoSetCtrl.patchValue('');
    if (this.searchCtrl.value) {
      this.searchCtrl.patchValue('');
    }
    this.cdRef.markForCheck();
    this.setCleared.emit();
  }

  public loadMoreSets() {
    if (this.geoSets.length < this.totalSets) {
      this.page += 1;
      this.enableLoader = true;
      this.cdRef.markForCheck();
      this.populationDataService.getAllGeoSets(this.searchCtrl.value, this.page).subscribe(response => {
        this.enableLoader = false;
        if (response['results'] && response['results'].length > 0) {
          this.geoSets.push(...response['results']);
        }
        this.cdRef.markForCheck();
      }, error => {
        this.enableLoader = false;
        this.cdRef.markForCheck();
      });
    }
  }

  /**
   * @description
   *   This method only for layers and display option to move
   *  geo sets to selected layers.
   * @param selectedSet
   * @param idx - geoSet array index
   */
  public moveLayer(selectedSet: GeographySet, idx: number){
    this.setSelected.emit(selectedSet);
  }

}
