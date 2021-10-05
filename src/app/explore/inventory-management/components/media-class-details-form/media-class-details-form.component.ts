import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { map, startWith, distinctUntilChanged } from 'rxjs/operators';

import { AbstractInventoryFormComponent } from '../abstract-inventory-form.component';
import { InventoryService } from '@shared/services';
import { StatusType } from '@interTypes/inventory-management';
import { PlacementType } from '@interTypes/inventory';
import { forbiddenNamesValidator } from '@shared/common-function';

@Component({
  selector: 'app-media-class-details-form',
  templateUrl: './media-class-details-form.component.html',
  styleUrls: ['./media-class-details-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaClassDetailsFormComponent
  extends AbstractInventoryFormComponent
  implements OnInit, OnChanges {
  @Input() isForPlaceForm = true;

  placeForm: FormGroup;
  roadSideForm: FormGroup;
  statusTypes$: Observable<StatusType[]>;

  placementTypes: PlacementType[];
  filteredPlacementTypes: Observable<PlacementType[]>;
  private unsubscribe = new Subject();
  isLoadingPlaementType = true;

  constructor(
    private fb: FormBuilder,
    private inventoryservice: InventoryService
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.formBuild();
  }

  ngOnInit(): void {
    this.formBuild();
  }

  formBuild() {
    if (this.isForPlaceForm) {
      if (!this.placeForm) {
        this.buildPlaceForm();
      }
    } else {
      if (!this.roadSideForm) {
        this.buildRoadSideForm();
      }
    }
    this.initDropDownData();
    this.updateFormRef();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  updateFormRef() {
    this.form = this.isForPlaceForm ? this.placeForm : this.roadSideForm;
  }

  private buildPlaceForm() {
    this.placeForm = this.fb.group({
      // location_description: [''],
      // place_name: ['', Validators.required],
      placement_type: [null, Validators.required, forbiddenNamesValidator],
      // floor_of_place: [''],
      // floors_can_see_unit: [''],
      unit_elevation: [null],
      operational_status: [null],
      construction: [null]
    });
  }

  private buildRoadSideForm() {
    this.roadSideForm = this.fb.group({
      // location_description: ['', Validators.required],
      // primary_street: [''],
      // cross_street: [''],
      // street_side: [''],
      // distance_and_direction: [''],
      // read: [''],
      // facing: [''],
      unit_elevation: [null],
      operational_status: [null],
      construction: [null]
    });
  }

  private initDropDownData() {
    this.statusTypes$ = this.inventoryservice.getStatusTypes().pipe(
      map((response) => {
        return response.status_types;
      })
    );
    if (this.isForPlaceForm && !this.placementTypes && this.placeForm) {
      this.inventoryservice.getPlacementTypeList().subscribe((response) => {
        this.placementTypes = response?.placement_types ?? [];
        this.isLoadingPlaementType = false;
        this.setFilterPlacementTypeSubscribtion();
      });
    }
  }

  /**
   * This function is to use track by for list
   * @param {number} index
   * @param {dropDownGenericFormat} item
   * @returns
   * @memberof MediaClassDetailsFormComponent
   */
  public trackById(index: number, item: StatusType| PlacementType) {
    return item.id;
  }

  private setFilterPlacementTypeSubscribtion() {
    this.filteredPlacementTypes = this.placeForm
      .get('placement_type')
      .valueChanges.pipe(
        startWith(''),
        distinctUntilChanged(),
        map((value) => (typeof value === 'string' ? value : value.name)),
        map((name) =>
          name ? this.filterPlacementType(name) : this.placementTypes.slice()
        )
      );
  }

  private filterPlacementType(name: string) {
    const filterValue = name.toLowerCase();
    return this.placementTypes.filter(
      (option) => option.name.toLowerCase().indexOf(filterValue) > -1
    );
  }

  placementTypeDisplayWithFn(placementType: PlacementType) {
    return placementType?.name ?? '';
  }
}
