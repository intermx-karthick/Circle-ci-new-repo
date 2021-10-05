import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
  FormArray
} from '@angular/forms';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Helper } from 'app/classes';
import { CityCastApiService } from '../services/city-cast-api.service';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-city-cast-settings',
  templateUrl: './city-cast-settings.component.html',
  styleUrls: ['./city-cast-settings.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CityCastSettingsComponent implements OnInit, OnDestroy, OnChanges {
  public settingForm: FormGroup;
  @Input() cast;
  constructor(private fb: FormBuilder,
    private ccApiService: CityCastApiService) { }
  tags = [];
  savedValue = {};
  dataChanged = false;
  private unSubscribe: Subject<void> = new Subject<void>();
  ngOnInit() {
    this.settingForm = this.fb.group({
      id: '',
      title: '',
      tags: [],
      description: ''
    });
    this.settingForm.valueChanges
      .pipe(debounceTime(100), takeUntil(this.unSubscribe))
      .subscribe((data) => {
        this.compareFormValueChanges(data);
      });
    this.bindData(this.cast);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.cast?.currentValue) {
      if (this.settingForm) {
        this.bindData(changes?.cast?.currentValue);
      }
    }
  }
  bindData(castdata) {
    this.savedValue = Helper.deepClone(castdata);
    this.tags = castdata['tags'];
    this.settingForm.patchValue({
      id: castdata['id'],
      title: castdata['title'],
      description: castdata['description'],
      tags: castdata['tags']
    });
  }
  onChipChanged(chips) {
    this.settingForm['controls']['tags'].setValue(this.tags);
  }
  discardChanges() {
    this.settingForm.patchValue(Helper.deepClone(this.savedValue));
    this.tags = this.savedValue['tags'];
    this.dataChanged = false;
  }
  compareFormValueChanges(data) {
    this.dataChanged = false;
    const fields = Object.keys(data);
    if (Object.keys(this.savedValue).length > 0) {
      for (const key of fields) {
        if (
          key === 'tags' &&
          !Helper.isArrayEqual(data[key], this.savedValue[key])
        ) {
          this.dataChanged = true;
          break;
        } else if (key !== 'tags' && data[key] !== this.savedValue[key]) {
          this.dataChanged = true;
          break;
        }
      }
    }
  }
  onSubmit(formGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({
          onlySelf: true
        });
      }
    });
    if (formGroup.valid) {
      this.submitToServer(formGroup.value);
    }
  }
  submitToServer(formData) {
    const castData = Helper.deepClone(formData);
    castData['editedAt'] = this.cast['editedAt'];
    castData['version'] = this.cast['version'];
    this.ccApiService
      .updateScenario(castData, formData.id, false)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(
        (scenario) => {
          this.cast = scenario['data'];
          this.bindData(this.cast);
          this.ccApiService.setScenarioTitle(scenario['data']['title']);
          this.dataChanged = false;
        },
        (error) => {}
      );
  }
  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
