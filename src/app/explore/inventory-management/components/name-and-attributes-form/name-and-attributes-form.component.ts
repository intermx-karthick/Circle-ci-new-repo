import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Subject, Observable } from 'rxjs';
import { startWith, distinctUntilChanged, map } from 'rxjs/operators';

import { AbstractInventoryFormComponent } from '../abstract-inventory-form.component';
import {
  MediaType,
  ClassificationType,
  ConstructionType,
  PlaceType
} from '@interTypes/inventory-management';
import { InventoryService } from '@shared/services';
import { forbiddenNamesValidator, emptySpaceValidator } from '@shared/common-function';

@Component({
  selector: 'app-name-and-attributes-form',
  templateUrl: './name-and-attributes-form.component.html',
  styleUrls: ['./name-and-attributes-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NameAndAttributesFormComponent
  extends AbstractInventoryFormComponent
  implements OnInit {
  nameAndAttributesForm: FormGroup;
  isLoading = true;
  mediaTypes: MediaType[] = [];
  mediaClasses: ClassificationType[] = [];
  structureTypes: ConstructionType[] = [];
  placeTypes: PlaceType[] = [];
  isLoadingPlace: Boolean = true;
  private unsubscribe = new Subject();
  filteredPlace$: Observable<PlaceType[]>;

  constructor(
    private fb: FormBuilder,
    private inventoryApi: InventoryService,
    private cdRef: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.buildNameAndAttributesForm();
    this.updateFormRef();
    this.initDropDownData();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  updateFormRef() {
    this.form = this.nameAndAttributesForm;
  }

  mediaClassCompareFn(
    option: ClassificationType,
    selected: ClassificationType
  ) {
    return option && selected && option.name === selected.name;
  }

  mediaTypesCompareFn(option: MediaType, selected: MediaType) {
    return option && selected && option.name === selected.name;
  }

  structureTypeCompareFn(option: ConstructionType, selected: ConstructionType) {
    return option && selected && option.name === selected.name;
  }

  trackById(idx: number, place: PlaceType) {
    return place?.id ?? idx;
  }

  placeDisplayWithFn(place: PlaceType) {
    return place?.name ?? '';
  }

  private buildNameAndAttributesForm() {
    this.nameAndAttributesForm = this.fb.group({
      media_class: [null, Validators.required],
      media_type: [null, Validators.required],
      place_type: [null, Validators.required, forbiddenNamesValidator],
      vendor_media_name: ['', [Validators.required, Validators.minLength(1), emptySpaceValidator]],
      media_description: [null],
      structure_type: [null],
      digital: [false, Validators.required],
      unit_height: this.fb.group({
        feet: [0],
        inches: [0]
      }),
      unit_width: this.fb.group({
        feet: [0],
        inches: [0]
      }),
      // impressions: [''],
      // impressions_source: [''],
      // category_restrictions: [''],
      // unit_grade_notes: [''],
      note: ['']
    });
  }


  private initDropDownData() {
    forkJoin([
      this.inventoryApi.getMediaClasses(),
      this.inventoryApi.getMediaTypes(),
      this.inventoryApi.getStructureTypes()
    ]).subscribe(([
                    mediaClassRes,
                    mediaTypesRes,
                    structureTypesRes,
                  ]) => {
      this.cdRef.markForCheck();
      this.isLoading = false;

      // As of now showing only Roadside and Place Based
      if (mediaClassRes?.classification_types) {
        mediaClassRes.classification_types = mediaClassRes.classification_types.filter(
          (mc) => mc.name === 'Roadside' || mc.name === 'Place Based'
        );
      }

      this.mediaClasses = mediaClassRes?.classification_types ?? [];
      this.mediaTypes = mediaTypesRes?.media_types ?? [];
      this.structureTypes = structureTypesRes?.construction_types ?? [];
    });

    this.inventoryApi.getPlaceTypes().subscribe((response) => {
      this.isLoadingPlace = false;
      this.placeTypes = response?.place_types ?? [];
      this.setFilterPlaceTypeSubscribtion();
    });
  }

  private setFilterPlaceTypeSubscribtion() {
    this.filteredPlace$ = this.nameAndAttributesForm
      .get('place_type')
      .valueChanges.pipe(
        startWith(''),
        distinctUntilChanged(),
        map((value) => (typeof value === 'string' ? value : value.name)),
        map((name) => (name ? this.filterPlace(name) : this.placeTypes.slice()))
      );
  }

  private filterPlace(name: string) {
    const filterValue = name.toLowerCase();
    return this.placeTypes.filter(
      (option) => option.name.toLowerCase().indexOf(filterValue) > -1
    );
  }
}
