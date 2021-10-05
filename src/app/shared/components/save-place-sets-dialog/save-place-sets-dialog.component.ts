import {Component, OnInit, Inject, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {
  PlacesDataService,
  LoaderService
} from '@shared/services';
import swal from 'sweetalert2';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlacesFiltersService } from '../../../places/filters/places-filters.service';
import { PlacesElasticsearchService } from '../../../places/filters/places-elasticsearch.service';
import { takeWhile, map } from 'rxjs/operators';
import {BasePlaceSets, Helper} from 'app/classes';
import { Pagination } from '@interTypes/pagination';

@Component({
  selector: 'app-place-set',
  templateUrl: './save-place-sets-dialog.component.html',
  styleUrls: ['./save-place-sets-dialog.component.less']
})
export class SavePlaceSetsDialogComponent extends BasePlaceSets implements OnInit, OnDestroy {
  placeSetForm: FormGroup;
  errorMessage = 'Place set name can\'t empty';
  title = 'Save Place Set';
  buttonText = 'Save';
  isExistingPlaceSet = false;
  places: any = [];
  existingPlacesSet: any[] = [];
  failedPlaceSet: any = [];
  noPlaceDataFound = false;
  isSavePlaceSet = false;
  isExistingPlaceId = '';
  isExistingPlaceName = '';
  unSubscribe = true;
  public searchFromCtl = new FormControl('');
  public pageInation: Pagination = { page: 1, size: 10, total: 10 };
  public isSearching: boolean = false;
  private selectedPlacesSets = [];

  constructor(
    private fb: FormBuilder,
    private placesDataService: PlacesDataService,
    private loaderService: LoaderService,
    private placesFiltersService: PlacesFiltersService,
    @Inject(MAT_DIALOG_DATA) public dialogData,
    private dialogRef: MatDialogRef<SavePlaceSetsDialogComponent>,
    private elasticSearch: PlacesElasticsearchService,
    public cdRef: ChangeDetectorRef
  ) {
    super(placesFiltersService, cdRef);
  }

  ngOnInit() {


    // for initial loading the placesets
    if (this.dialogData.isExistingPlaceSet) {
      this.isSearching = true;
      this.init(() => { this.isSearching = false; });
    }

    // Place set search
    this.listenForPlacesetsSearch(() => {
      this.setSelectedSets();
    });

    if (this.dialogData['selectedPlaces']) {
      this.places = this.dialogData['selectedPlaces'];
    }
    this.placeSetForm = this.fb.group({
      'name': new FormControl({
        value: this.isExistingPlaceName,
        disabled: this.dialogData.isExistingPlaceSet
      }, [Validators.required]),
      'existingPlaces': new FormControl({
        value: '',
        disabled: !this.dialogData.isExistingPlaceSet
      }, [Validators.required])
    });
  }

  onSubmit(formData) {
    const locations = {};
    if (this.dialogData.type === 'group') {
      const locationPOIs = this.placesDataService.getPOILocationData();
      const filterData = {...locationPOIs};
      if (filterData['placeNames'].length >= 10000 || (this.dialogData.selectedPlacesCount && this.dialogData.selectedPlacesCount >= 10000)) {
        this.loaderService.display(false);
        this.dialogRef.close();
        swal('Warning', 'Place sets are limited up to 10K, Please keep your selection within the 10k limit.', 'warning');
        return;
      } else {
        filterData['noOfPlaces'] = 10000;
      }
      let query = this.elasticSearch.prepareElasticQuery(filterData['query']);
      if (filterData['placeNames'].length <= 0) {
        filterData['placeNames'] = ['null'];
      }
      query = this.elasticSearch.formSelectedPlacesQuery(query, filterData);
      query = this.elasticSearch.getAllSGids(query);
      this.elasticSearch.getDataFromElasticSearch(query).pipe(
        map((response: any) => {
          const sgids = [];
          if(response?.hits?.hits){
            const data = response?.hits?.hits ?? [];
            data.forEach(element => {
              if(element?._source?.safegraph_place?.properties?.ids?.safegraph_place_id){
                sgids.push(element._source.safegraph_place.properties.ids.safegraph_place_id);
              }
            });
          }
          return sgids;
        }),
        takeWhile(() => this.unSubscribe)
      ).subscribe(sgids => {
        locations['single'] = sgids;
        this.saveToPlaceSet(formData, locations);
      });
    } else if (this.dialogData.type === 'single') {
      const POIs = this.placesDataService.getPOIPlacesData();
      if (POIs.length > 0) {
        const selectedSGIds = [];
        POIs.map((p) => {
          if (p.selected) {
            selectedSGIds.push(p.id);
          }
        });
        if (selectedSGIds.length > 0) {
          locations['single'] = selectedSGIds;
        }
        this.saveToPlaceSet(formData, locations);
      }
    }
  }
  saveToPlaceSet(formData, locations) {
    const places = {
      'places': {
        'name': formData.value.name,
        'pois': locations
      }
    };
    if (formData.valid && !this.dialogData.isExistingPlaceSet) {
      this.loaderService.display(true);
        this.savePlaceSet(places);
    } else if (formData.valid && this.dialogData.isExistingPlaceSet) {
      this.loaderService.display(true);
      formData.value['existingPlaces'].map((exPlace, index) => {
        const placeData = Helper.deepClone(places);
        const existingPOIs = places['places']['pois']['single'] ? places['places']['pois']['single'] : [];
        let existingPoids = exPlace.pois;
        existingPoids = existingPOIs.concat(...existingPoids).filter(this.getUniqueValues);
        placeData['places']['pois']['single'] = existingPoids;
        placeData['places']['name'] = exPlace['name'];
        const placeId = exPlace['_id'];
        this.placesFiltersService.updatePlaceSet(placeData, placeId).subscribe(
          success => {
            if (formData.value['existingPlaces'] && (index === (formData.value['existingPlaces'].length - 1))) {
              this.displayUpdatePlaceSetError();
            }
          },
          error => {
            this.failedPlaceSet.push(exPlace.name);
            if ((index === (formData.value['existingPlaces'].length - 1))) {
              this.displayUpdatePlaceSetError();
            }
          }
        );
      });
    }
  }
  private getUniqueValues = (value, index, self) => {
    return self.indexOf(value) === index;
  }
  checkDataPresence(place, property) {
    return place['properties'][property] && place['properties'][property] || null;
  }

  savePlaceSet(places) {
    this.placesFiltersService.savePlaceSet(places).subscribe(
      response => {
        this.loaderService.display(false);
          this.placesFiltersService.setPlaceSetListNotification();
          this.dialogRef.close();
          swal('Success', 'Place set saved successfully.', 'success');
      },
      error => {
        this.loaderService.display(false);
        if (error.error && Number(error.error.code) === 11006) {
          swal('Error', 'Place Set names must be unique. Please add to existing set or use a unique name.', 'error');
        } else {
          swal('Error', 'An error has occurred. Please try again later.', 'error');
          this.dialogRef.close();
        }
      }
    );
  }

  displayUpdatePlaceSetError() {
    this.loaderService.display(false);
    // this.placeSetForm.reset();
    if (this.failedPlaceSet.length > 0) {
      this.dialogRef.close();
      swal('Error', 'Updating following place set ' + this.failedPlaceSet.join(',') + ' failed', 'error');
    } else {
      this.dialogRef.close({'result': true});
      swal('Success', 'Your place set saved successfully.', 'success');
    }
    this.setPlaceSets();
  }

  public onSelectPlaceSet(option) {
    // We are saving the selected places in separate varaible because re-assigning the places variable with new data
    // collection while searching is resetting the mat selection control.
    const index = this.selectedPlacesSets.findIndex(set => set['_id'] === option._value['_id']);
    if (index > -1) {
      if (!option._selected) {
        this.selectedPlacesSets.splice(index, 1);
      }
    } else {
      this.selectedPlacesSets.push(option._value);
    }
  }

  private setSelectedSets() {
    if (this.selectedPlacesSets.length) {
      setTimeout(() => {
        this.placeSetForm.controls.existingPlaces.patchValue(this.selectedPlacesSets);
      }, 500);
    }
  }
  ngOnDestroy () {
    this.placeSetForm.reset();
    this.unSubscribe = false;
  }

  // Compare function for mat-selection
  public compare(c1, c2) {
    return c1 && c2 && c1['_id'] === c2['_id'];
  }
}
