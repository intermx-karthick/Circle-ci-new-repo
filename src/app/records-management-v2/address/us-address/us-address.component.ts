import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  forwardRef,
  Input,
  OnChanges
} from '@angular/core';
import {
  AbstractControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  Validators
} from '@angular/forms';

import { AbstractAdressFormComponent } from '../abstract.adress-form.component';
import { State } from '../abstract-state-list';
import { CustomValidators } from '../../../validators/custom-validators.validator';
import { forbiddenNamesValidator } from '@shared/common-function';

@Component({
  selector: 'app-us-address',
  templateUrl: './us-address.component.html',
  styleUrls: ['./us-address.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UsAddressComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => UsAddressComponent),
      multi: true
    }
  ]
})
export class UsAddressComponent extends AbstractAdressFormComponent implements OnInit, OnChanges, Validator {
  states: any = [];
  panelStateContainer: any;
  @Input() public scrollingContainer:string;
  @Input() public disableEdit:boolean;

  ngOnInit() {
    super.ngOnInit();
    //Load all state
    this.loadAllStates();
    //TODO: For now UI side added search. If need API side enable below code
    //this.setFilterStateSubscribtion(this.formGroup, 'state');
    if(this.disableEdit) {
      this.formGroup.disable();      
    }
  }

  /* added to watch disable listen when its depends dynamic form values */
  public ngOnChanges(): void {
    if (this.disableEdit && this.formGroup) {
      this.formGroup?.disable();
    }
  }

  buildForm(): void {
    this.formGroup = this.fb.group({
      address: ['', Validators.maxLength(64)],
      zipCode: ['', null, forbiddenNamesValidator],
      city: [''],
      state: ['', null, forbiddenNamesValidator]
    });
    this.loadZipCodes(this.formGroup);
  }


  stateDisplayWithFn(state: State) {
    return state?.name ? (state?.short_name + ' - ' + state?.name) : '';
  }

  stateTrackByFn(idx: number, state: State) {
    return state?._id ?? idx;
  }

  public writeValue(address: any): void {
    this.formGroup.patchValue({
      address: address?.address ?? null,
      city: address?.city ?? null,
      state: address?.state ?? null
    });
    if(address?.zipCode){
      this.formGroup.patchValue({zipCode: {ZipCode: address.zipCode}});
    }

  }

  public updateStateContainer() {
    this.panelStateContainer = '.state-list-autocomplete';
  }

  public validate(c: AbstractControl): ValidationErrors | null {
    return this.formGroup.valid
      ? null
      : {
        invalidForm: { valid: false, message: 'Address fields are invalid' }
      };
  }

  public onZipCodeSelection(option) {
    if (option['State']) {
      const stateOption = this.states.find((state) => state.short_name.toLowerCase() === option['State'].toLowerCase());
      if (stateOption) {
        this.formGroup.controls.state.patchValue(stateOption);
      }
    }
    if (option['City']) {
      this.formGroup.controls.city.patchValue(option['City']);
    }
  }
}
