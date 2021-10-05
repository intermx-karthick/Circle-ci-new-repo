import { ChangeDetectionStrategy, Component, Input, OnInit, SimpleChanges, ChangeDetectorRef, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AbstractInventoryFormComponent } from '../abstract-inventory-form.component';
import { InventoryService } from '@shared/services';
import { IllumnationType } from '@interTypes/inventory-management';

@Component({
  selector: 'app-material-details-form',
  templateUrl: './material-details-form.component.html',
  styleUrls: ['./material-details-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class MaterialDetailsFormComponent extends AbstractInventoryFormComponent implements OnInit , OnChanges{

  @Input() enableForDigitalForm = {isValid:false};

  digitalForm: FormGroup;
  nonDigitalForm: FormGroup;
  illumnationType$: Observable<IllumnationType[]>;
  valid: boolean;

  private unsubscribe = new Subject();

  constructor(
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private inventoryservice: InventoryService,
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
    if (this.enableForDigitalForm.isValid) {
      if(!this.digitalForm){
        this.buildDigitalForm();
      }
    } else {
      if(!this.nonDigitalForm){
        this.buildNonDigitalForm()
      }
      this.initDropDownData();
    }
    this.updateFormRef();
    this.cdRef.markForCheck();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }


  updateFormRef() {
    this.form = this.enableForDigitalForm.isValid ? this.digitalForm : this.nonDigitalForm;
  }

  private buildDigitalForm() {
    this.digitalForm = this.fb.group({
      full_motion: [false],
      partial_motion: [false],
      interative: [false],
      audio_enabled: [false],
      pixel_height: [null],
      pixel_width: [null],
      // ad_share_of_voice: [null],
      // spot_share_of_voice: [null],
      // avg_spot_length: [null],
      // avg_spots_in_loop: [null],
      // other_content: ['']
    });
  }

  private buildNonDigitalForm() {
    this.nonDigitalForm = this.fb.group({
      // materail_requirement: ['', Validators.required],
      // substrate_type: [''],
      mechanical_rotation: [false],
      type_of_illumination: ['']
    });
  }


  private initDropDownData() {
    this.illumnationType$ = this.inventoryservice.getIllumnationTypes().pipe(
      map((response) => {
        return response.illumination_types;
      })
    );
  }

  /**
   * This function is to use track by for list
   * @param {number} index
   * @param {dropDownGenericFormat} item
   * @returns
   * @memberof MaterialDetailsFormComponent
   */
  public trackById(index: number, item: IllumnationType) {
    return item.id;
  }
}
