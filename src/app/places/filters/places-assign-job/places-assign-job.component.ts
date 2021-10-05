import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import {FormBuilder, FormGroup, FormArray, Validators, NgForm, FormControl} from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Customer } from '@interTypes/importJobs';
import { PlacesFiltersService } from '../places-filters.service';
import { Subject } from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';
import swal from 'sweetalert2';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { saveAs } from 'file-saver';
import { ThemeService, AuthenticationService } from '@shared/services';
import {PlaceUploadRequest} from '@interTypes/Place-audit-types';

@Component({
  selector: 'app-places-assign-job',
  templateUrl: './places-assign-job.component.html',
  styleUrls: ['./places-assign-job.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class  PlacesAssignjobComponent implements OnInit, OnDestroy {
  public customers: Customer[] = [];
  public selectedCustomerId: any;
  public fileName = '';
  public fileHeaders = [];
  public dbFields = [];
  public dbFieldsColums = {};
  public uploadedFileName = '';
  public fileObject: any = {};
  public selectedIndex = 0;
  private unSubscribe: Subject<void> = new Subject<void>();
  mappingsForm: FormGroup;
  // customerForm: FormGroup;
  uploadForm: FormGroup;
  placeSetForm: FormGroup;
  mappingsList: FormArray;
  unMappingsList: FormArray;
  public contentHeight: number;
  public showUnMapped = false;
  public uploadSubmitted = false;
  public placeSetFormSubmitted = false;
  public hideClearButton = true;
  private uploadedData: PlaceUploadRequest;
  @ViewChild('fileInp') selectedFiles: ElementRef;
  @ViewChild('uploadFormRef') uploadFormRef: NgForm;
  client;
  isAuditRole = false;
  public isAuditRequested = false;
  constructor(
    public dialogRef: MatDialogRef<PlacesAssignjobComponent>,
    private placesFilterService: PlacesFiltersService,
    private fb: FormBuilder,
    private auth: AuthenticationService,
    private cdRef: ChangeDetectorRef,
    private themeService: ThemeService) {
  }

  ngOnInit() {
    const audit = this.auth.getModuleAccess('audit');
    this.uploadForm = this.fb.group({
      fileName: ['', [Validators.required, CustomValidators.isCSV]]
    });
    if (audit && audit['write']) {
      this.isAuditRole = true;
      this.uploadForm = this.fb.group({
        customerId: ['', [Validators.required]],
        fileName: ['', [Validators.required, CustomValidators.isCSV]],
        requested: true
      });
    }
    this.mappingsForm = this.fb.group({
      mappings: this.fb.array([]),
      unmappings: this.fb.array([]),
      placeSetNeeded: [true, Validators.required]
    });
    this.placeSetForm = this.fb.group({
      placeSetType: ['existing', [Validators.required]],
      placeSetName: [null],
      placeSetId: [null, [Validators.required]],
    });
    this.handlePlaceSetFormValidation();
    this.placesFilterService.getCustomersList().pipe(takeUntil(this.unSubscribe)).subscribe(response => {
      this.customers = response['clients'];
      this.client = this.customers.find((customer) => {
        // tslint:disable-next-line: radix
        return customer.client_id === parseInt(this.themeService.getThemeSettings().clientId);
      });
      if (this.client) {
        this.cdRef.detectChanges();
      } else {
        // tslint:disable-next-line: radix
        this.client.client_id = parseInt(this.themeService.getThemeSettings().clientId);
        this.client.name = this.themeService.getThemeSettings().siteName;
      }
    });
    this.mappingsList = this.mappingsForm.get('mappings') as FormArray;
    this.unMappingsList = this.mappingsForm.get('unmappings') as FormArray;
    this.placesFilterService.getDBFields().pipe(takeUntil(this.unSubscribe)).subscribe(response => {
      this.dbFields = response['columns'];
      /** TO format for display matched & unmatched title based on keys */
      this.dbFieldsColums = {};
      response['columns'].map(column => {
        const columnModify = { [column['key']]: column['title'] };
        this.dbFieldsColums = { ...this.dbFieldsColums, ...columnModify };
      });
    });
    this.onResize();
  }

  createFormGroup(field): FormGroup {
    return this.fb.group({
      source_key: ['', [Validators.required]],
      dest_key: [field, [Validators.required]]
    });
  }

  get mappingsGroup(): FormArray {
    return this.mappingsForm.get('mappings') as FormArray;
  }
  get unMappingsGroup(): FormArray {
    return this.mappingsForm.get('unmappings') as FormArray;
  }

  /**
   * This method is to add new formGroup to formArray
   * @param header
   */
  private addItem(field): void {
    const formGroup = this.createFormGroup(field.key);
    const fieldValue = this.setField(field);
    formGroup.controls.source_key.patchValue(fieldValue && fieldValue || 'No Match');
    if (fieldValue) {
      this.mappingsList.push(formGroup);
    } else {
      this.unMappingsList.push(formGroup);
    }
  }

  /**
   * This method is to check and update customer data
   * @param formGroup
   */
  /* TODO : This function not used commented on 05/09/2019
   public updateCustomer(formGroup: FormGroup): void {
     if (formGroup.valid) {
       this.selectedIndex = 1;
       this.selectedCustomerId = formGroup.getRawValue().customerId;
       this.cdRef.markForCheck();
     }
   }*/

  /**
   * This method is to submit the mapped data
   * @param formGroup
   */
  public mapFields(formGroup: FormGroup): void {
    if (formGroup.valid) {
      this.uploadedData = {
        mappings: []
      };
      this.uploadedData['mappings'] = this.mappingsForm.getRawValue()['mappings'].filter((data) => data.source_key !== 'No Match');
      const mappedUnMapped = this.mappingsForm.getRawValue()['unmappings'].filter((data) => data.source_key !== 'No Match');
      this.uploadedData['mappings'] = this.uploadedData['mappings'].concat(mappedUnMapped);
      if (this.isAuditRequested && this.isAuditRole) {
        this.uploadedData['audit_status'] = 'Requested';
      }
      if (this.mappingsForm.controls?.placeSetNeeded?.value) {
        this.selectedIndex = 2;
      } else {
        this.confirmMappingCall(this.uploadedData, false);
      }
    } else {
      swal('Warning', 'All uploaded values must be assigned a matching value.', 'warning');
    }
  }

  private confirmMappingCall(matchedColumns: PlaceUploadRequest, isPlaceSetRequired: boolean) {
    this.placesFilterService.updateCsvFieldsMapping(
      this.selectedCustomerId,
      this.uploadedFileName,
      matchedColumns,
      isPlaceSetRequired).pipe(takeUntil(this.unSubscribe)).subscribe(response => {
      this.selectedIndex = 3;
      this.cdRef.markForCheck();
    }, error => {
      if (error?.error?.code === 120032 || error?.error?.code === 11028) {
        swal('Error', error?.error?.message, 'error');
      } else {
        swal('Error', 'The mapping of fields not done correctly. Please check and map with correct fields', 'error');
      }
    });
  }

  /**
   * This method is to process the uploaded file and to convert it in to formdata
   * @param event
   */
  public processFile(event): void {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const formData = new FormData();
        formData.append('attachment', event.target.files[0]);
        this.fileName = event.target.files[0].name;
        this.uploadForm.controls['fileName'].patchValue(event.target.files[0].name);
        this.fileObject = formData;
        this.cdRef.markForCheck();
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  /**
   * This method is to upload the file to backend
   */
  public uploadFile(): void {
    this.uploadSubmitted = true;
    if (this.uploadForm.valid) {
      if (this.isAuditRole) {
        this.selectedCustomerId = this.uploadForm.value.customerId;
      } else {
        this.selectedCustomerId = this.client.client_id;
      }
      this.placesFilterService.uploadFile(this.selectedCustomerId, this.fileObject).pipe(takeUntil(this.unSubscribe)).subscribe(
        response => {
          this.uploadSubmitted = false;
          this.uploadedFileName = response['file'];
          this.fileHeaders = response['headers'];
          this.fileHeaders.push('No Match');

          this.dbFields.forEach(header => {
            this.addItem(header);
          });
          if (this.uploadForm.value.requested) {
            this.isAuditRequested = true;
          } else {
            this.isAuditRequested = false;
          }
          this.selectedIndex = 1;
          this.cdRef.markForCheck();
        },
        error => {
          this.onClose();
          swal('Error', 'An error has occurred. Please try again later.', 'error');
        });
    }
  }

  /**
   * This method is to close the popup
   */
  public onClose(): void {
    this.dialogRef.close();
  }

  /**
   * This method is to trigger form submit manually as file input button
   * triggering validation even before form submit
   */
  public uploadFormSubmit() {
    this.uploadForm.controls.fileName.markAsTouched();
    this.uploadFormRef.ngSubmit.emit();
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  /**
   * This method is to set the height of the popup based on window size
   */
  public onResize(): void {
    this.contentHeight = window.innerHeight - 420;
  }

  /**
   * This function is to find the matching db field based on value
   * @param value
   */
  private setField(dbField: string): string {
    const fileHeader = this.fileHeaders.find(name =>
      (dbField['key'].replace('_', '').toLowerCase() === name.toLowerCase()
        || dbField['title'] === name || dbField['key'].replace('_', '').toLowerCase() === name.toLowerCase()
        || dbField['title'].replace('_', '').toLowerCase() === name.toLowerCase()));
    if (fileHeader) {
      return fileHeader;
    }
  }
  /* TODO : This function not used commented on 05/09/2019
    public assignNoMatch() {
      this.mappingsGroup.controls.map((columns,index) => {
        if (!columns.value.source_key) {
          this.mappingsGroup.controls[index]['controls']['source_key'].patchValue('No Match');
        }
      });
    }*/
  public onShowUnMapped() {
    this.showUnMapped = true;
  }

  public onHideUnMapped() {
    this.showUnMapped = false;
  }
  public downloadSampleCSV() {
    this.placesFilterService.getDBFields(true, true).pipe(takeUntil(this.unSubscribe)).subscribe(res => {
      const filename = 'Audit Place Template.csv';
      saveAs(res.body, filename);
    });
  }
  public placeSetSelected($event) {
    this.placeSetForm.controls?.placeSetId?.setValue($event?._id);
  }
  public submitFormData($event) {
    if (!this.placeSetForm.valid) {
      this.placeSetFormSubmitted = true;
      return;
    }
    const formData = this.placeSetForm.getRawValue();
    if (formData.placeSetType === 'new') {
      this.uploadedData['place_set_name'] = formData.placeSetName;
    } else {
      this.uploadedData['place_set_id'] = formData.placeSetId;
    }
    this.confirmMappingCall(this.uploadedData, true);
  }
  private handlePlaceSetFormValidation() {
    const placeSetType = this.placeSetForm.get('placeSetType');
    const placeSetName = this.placeSetForm.get('placeSetName');
    const placeSetId = this.placeSetForm.get('placeSetId');
    placeSetType.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this.unSubscribe)).subscribe(placeType => {
      if (placeType === 'new') {
          placeSetName.setValidators(Validators.required);
          placeSetId.clearValidators();
        } else {
          placeSetId.setValidators(Validators.required);
          placeSetName.clearValidators();
        }
      placeSetId.updateValueAndValidity();
      placeSetName.updateValueAndValidity();
    });
  }
}
