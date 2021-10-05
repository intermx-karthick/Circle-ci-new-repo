import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { CityCastApiService } from '../services/city-cast-api.service';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { Helper } from 'app/classes';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-city-cast-manage-cast',
  templateUrl: './city-cast-manage-cast.component.html',
  styleUrls: ['./city-cast-manage-cast.component.less']
})
export class CityCastManageCastComponent implements OnInit {
  selectedBlock = 'selection';
  isScenarioLoading: boolean;
  totalPage: any;
  constructor(
    public dialogRef: MatDialogRef<CityCastManageCastComponent>,
    @Inject(MAT_DIALOG_DATA) public scenario,
    private fb: FormBuilder,
    private ccApiService: CityCastApiService
  ) {}
  castForm: FormGroup;
  scenarios = [];
  page = 1;
  size = 10;
  public publishedScenarios = [];
  totalPublishedPage: any;
  publishedPage = 1;
  panelContainer = '';
  searchQuery = '';
  private unsubscribe: Subject<void> = new Subject();
  trackByScenarioID(index: number, row: any): string {
    return row.id;
  }
  ngOnInit() {
    this.castForm = this.fb.group({
      geo_scope_id: [''],
      parent_cast: ['', Validators.required],
      parent_cast_id: ['', Validators.required],
      title: ['', Validators.required]
    });
    this.castForm.controls.geo_scope_id.setValue(this.scenario.scopeID);
    this.getScenarios(true);
    this.getPublishedScenarios(true);
    this.castForm
        .controls
        .parent_cast
        .valueChanges
        .pipe(
          debounceTime(200),
          filter((data) => !(data instanceof Object)),
          takeUntil(this.unsubscribe)
        )
        .subscribe((data) => {
          this.searchQuery = data;
          this.getPublishedScenarios(true, 1);
        });
  }
  toggleBlockCast(selection) {
    this.selectedBlock = selection;
  }
  selectScenario(scenario) {
    this.dialogRef.close(scenario);
  }
  getScenarios(initial = false, page = 1) {
    this.isScenarioLoading = true;
    this.ccApiService
      .getTFScenariosList(this.scenario.scopeID, page, this.size)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (initial) {
          this.scenarios = [];
          this.totalPage = Math.ceil(res['pagination']['total'] / this.size);
        }
        this.scenarios.push(...res['data']);
        this.isScenarioLoading = false;
      });
  }
  loadMoreScenario() {
    if (this.totalPage > this.page) {
      this.page++;
      this.getScenarios(false, this.page);
    }
  }
  validateFormGroup(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({
          onlySelf: true
        });
      } else if (control instanceof FormGroup) {
        this.validateFormGroup(control);
      }
    });
  }
  onSubmit(formGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({
          onlySelf: true
        });
      } else if (control instanceof FormGroup) {
        this.validateFormGroup(control);
      }
    });
    if (formGroup.valid) {
      this.submitToServer(formGroup.value);
    }
  }
  submitToServer(formData) {
    const castData = Helper.deepClone(formData);
    delete castData['geo_scope_id'];
    delete castData['parent_cast'];
    delete castData['parent_cast_id'];
    this.ccApiService
      .cloneCast(castData, formData.geo_scope_id, formData.parent_cast_id)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (scenario) => {
          this.dialogRef.close(scenario['data']);
        },
        (error) => {}
      );
  }
  
  getPublishedScenarios(initial = false, page = 1) {
    this.isScenarioLoading = true;
    this.ccApiService
      .getPublishedScenarios(this.scenario.scopeID, this.searchQuery, page, this.size)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (initial) {
          this.publishedScenarios = [];
          this.publishedPage = 1;
          this.totalPublishedPage = Math.ceil(res['pagination']['total'] / this.size);
        }
        this.publishedScenarios.push(...res['data']);
        this.isScenarioLoading = false;
      });
  }
  loadMorePublishedScenario() {
    if (this.totalPublishedPage > this.publishedPage) {
      this.publishedPage++;
      this.getPublishedScenarios(false, this.publishedPage);
    }
  }
  public displayTitle(cast) {
    return cast?.title ?? '';
  }
  public updateContainer() {
    this.panelContainer = '.cast-list-dd';
  }
  public onSelectingCast(cast) {
    this.castForm.controls.parent_cast_id.setValue(cast?.option?.value?.id ?? '');
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
