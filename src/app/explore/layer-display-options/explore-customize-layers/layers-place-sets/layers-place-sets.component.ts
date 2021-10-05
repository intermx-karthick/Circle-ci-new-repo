import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { debounceTime, filter, finalize, map, takeUntil } from 'rxjs/operators';

import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';
import { Pagination } from '@interTypes/pagination';
import { FormatService, PlacesService } from '@shared/services';
import { LayersService } from '../../layers.service';
import { PlaceSet } from '@interTypes/placeSet';

@Component({
  selector: 'app-layers-place-sets',
  templateUrl: 'layers-place-sets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayersPlaceSetsComponent extends AbstractLazyLoadComponent implements OnInit, OnDestroy {

  @Input() layerType: string;
  @Input() defaultPrimaryColor = '';
  @Input() placeSetsClearListener: Subject<PlaceSet>;
  @Output() move = new EventEmitter();

  isInitialLoadCompleted: boolean = false;
  unsubscribeInitiator$: Subject<void> = new Subject<void>();
  filteredPlacePacks: any = [];
  isLoading = false;
  isSearchingPlace = false;
  searchPlaceFromCtl: FormControl = new FormControl();
  pageInation: Pagination = { page: 1, size: 10 };
  unSubscribe$ = new Subject();
  selectedPlacesets = [];

  constructor(
    private formatService: FormatService,
    private place: PlacesService,
    private layersService: LayersService,
    private cdRef: ChangeDetectorRef,
  ) {
    super();
  }

  init(): void {
    this.cdRef.markForCheck();
    this.getPlacesSets();
    this.listenerForSearchingPlaceSets();
    this.listenerForApplyOrClearLayers();
  }

  trackById( index,  place){
    return place._id;
  }

  ngOnInit(): void {

    this.listenerForInitialLoad();
    this.loadFromSession();

    this.placeSetsClearListener?.pipe(takeUntil(this.unSubscribe$)).subscribe((plaeSet)=>{
      this.filteredPlacePacks.some(placePack=>{
        if(placePack._id == plaeSet._id){
          placePack.selected = false;
          return true;
        }
      })
      const selectedPlaceIndex = this.selectedPlacesets.findIndex(item => item._id === plaeSet._id);
      if (selectedPlaceIndex > -1) {
        this.selectedPlacesets.splice(selectedPlaceIndex, 1);
        this.cdRef.markForCheck();
      }
    })

  }

  ngOnDestroy(): void {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  loadMorePlaceSets() {
    this.pageInation.page += 1;
    this.getPlacesSets();
  }

  moveLayer(place: any, i: number) {
    place.selected = true;
    if(!this.selectedPlacesets.find(selectedPlaceSet=>selectedPlaceSet._id == place._id)){
      this.selectedPlacesets.push(place);
    }
    this.move.emit({layer:place, index: i})
  }

  getPlacesSets(searchPlace = false) {
    this.isSearchingPlace = searchPlace;
    const searchText = this.searchPlaceFromCtl.value && this.searchPlaceFromCtl.value.toString().trim();
    this.isLoading = true;
    this.place.getPlacesSet(null, this.pageInation, searchText)
      .pipe(
        finalize(()=>{
          this.isSearchingPlace = false;
          this.isLoading = false;
          this.destroyInitiator();
        }),
        filter((res)=>!!res),
        map(data => data['data']),
      )
      .subscribe(data => {

        if (!searchPlace) {
          this.formatPlaceSet(data, true);
        } else {
          this.formatPlaceSet(data, false);
          this.pageInation.page = 1;
        }
        this.cdRef.markForCheck();
      });
  }

  formatPlaceSet(placeData, pagination= true) {

    if(this.selectedPlacesets.length){
      placeData.forEach( placeSet => {
        const index = this.selectedPlacesets.findIndex(place => place._id === placeSet._id);
        if (index > -1) {
          placeSet.selected = true;
        }
      });
    }

    if (pagination) {
      this.filteredPlacePacks = this.filteredPlacePacks.concat(placeData);
    } else {
      this.filteredPlacePacks = placeData;
    }
    this.filteredPlacePacks.sort(this.formatService.sortAlphabetic);
  }

  private removeLayers() {
    this.filteredPlacePacks.map(pack => pack['selected'] = false);
    this.selectedPlacesets = [];
  }


  private loadFromSession() {
    const layersSession = this.layersService.getlayersSession(this.layerType);
    if (layersSession?.['selectedLayers'] && layersSession.selectedLayers.length > 0) {
      this.filteredPlacePacks.map(val => val.selected = false );
      this.selectedPlacesets = layersSession.selectedLayers.filter(layer=>layer.type==='place collection').map((layer)=>layer.data);
      this.selectedPlacesets.forEach((layer) => {
            const index = this.filteredPlacePacks.findIndex(pack => pack._id === layer._id);
            if (index > -1) {
              this.filteredPlacePacks[index]['selected'] = true;
            }
      });
    }
  }

  listenerForSearchingPlaceSets(){
    this.searchPlaceFromCtl.valueChanges
      .pipe(
        takeUntil(this.unSubscribe$),
        debounceTime(200)
      )
      .subscribe(() => {
        this.pageInation = { page: 1, size: 10 };
        this.getPlacesSets(true);
      });
  }

  listenerForApplyOrClearLayers(){
    this.layersService.getApplyLayers().subscribe((value) => {
      if (value['type'] === this.layerType) {
        if (!value['flag']) {
          this.removeLayers();
        } else {
          this.loadFromSession();
        }
        this.cdRef.markForCheck();
      }
    });
  }
}
