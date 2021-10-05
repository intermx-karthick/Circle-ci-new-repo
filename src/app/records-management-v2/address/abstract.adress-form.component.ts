import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { AbstractStateList } from './abstract-state-list';
import { RecordService } from '../record.service';
import { UseAutoCompleteInfiniteScroll } from 'app/classes/use-auto-complete-infinite-scroll';
import { Subject } from 'rxjs';

@Component({
  template: ''
})
export abstract class AbstractAdressFormComponent extends AbstractStateList
  implements OnInit, ControlValueAccessor, OnDestroy {
  formGroup: FormGroup;

  abstract buildForm(): void;
  private unSubscribe$: Subject<void> = new Subject();
  public zipCodePanelContainer: string;
  public zipCodeAutoComplete = new UseAutoCompleteInfiniteScroll();
  constructor(
    public fb: FormBuilder,
    public recordService: RecordService,
    public cdRef: ChangeDetectorRef
  ) {
    super(recordService, cdRef)
  }

  ngOnInit() {
    this.buildForm();

  }

  public loadZipCodes(formGroup) {
    const zipCodeSearchCtrl = formGroup?.controls?.zipCode
      ?.valueChanges;
    if (zipCodeSearchCtrl) {
      this.zipCodeAutoComplete.loadDependency(
        this.cdRef,
        this.unSubscribe$,
        zipCodeSearchCtrl
      );
      this.zipCodeAutoComplete.apiEndpointMethod = () =>
        this.recordService.getZipCodes(
          formGroup.controls.zipCode.value,
          this.zipCodeAutoComplete.pagination
        );
      this.zipCodeAutoComplete.loadData(null, (res) => {
        this.zipCodeAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.zipCodeAutoComplete.listenForAutoCompleteSearch(
        formGroup,
        'zipCode',
        null,
        (res) => {
          this.zipCodeAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public loadMoreZipCodes() {
    this.zipCodeAutoComplete.loadMoreData(null, (res) => {
      this.zipCodeAutoComplete.data = res.results;
      this.cdRef.markForCheck();
    });
  }

  public updateZipCodeContainer() {
    this.zipCodePanelContainer = '.zipcode-list-autocomplete';
    this.cdRef.markForCheck();
  }

  zipCodeDisplayWithFn(zipcodeObj: any) {
    return zipcodeObj?.ZipCode ?? '';
  }

  zipCodeTrackByFn(idx: number, zipcodeObj: any) {
    return zipcodeObj?._id ?? idx;
  }

  registerOnChange(fn: any): void {
    this.formGroup.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.formGroup.valueChanges.subscribe(fn);
  }

  ngOnDestroy(): void {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  writeValue(obj: any): void {}
}
