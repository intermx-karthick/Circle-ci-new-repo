import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormArray, Validators, NgForm } from '@angular/forms';
@Component({
  selector: 'app-fields-mapping',
  templateUrl: './fields-mapping.component.html',
  styleUrls: ['./fields-mapping.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldsMappingComponent implements OnInit {
  mappingsForm: FormGroup;
  mappingsList: FormArray;
  public contentHeight: number;
  public dbFields = [];
  public dbFieldsColums = {};
  public fileHeaders: Array<string> = [];
  private uploadType = null;
  public title = 'Validate mapped fields from uploaded file';
  public leftHeading = 'Matching Value';
  public rightHeading = 'Uploaded Value';
  constructor(
    public dialogRef: MatDialogRef<FieldsMappingComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.dbFields = this.data.dbFields;
    this.fileHeaders = this.data.fileHeaders;
    this.uploadType = this.data?.uploadFrom ?? null;
    this.title =  this.data?.title ?? 'Validate mapped fields from uploaded file';
    this.leftHeading =  this.data?.leftHeading ?? 'Matching Value';
    this.rightHeading =  this.data?.rightHeading ?? 'Uploaded Value';

    this.mappingsForm = this.fb.group({
      mappings: this.fb.array([]),
    });
    this.mappingsList = this.mappingsForm.get('mappings') as FormArray;
    this.dbFields.forEach(field => {
      this.addItem(field);
    });
    this.dbFieldsColums = {};
    this.dbFields.map(column => {
      const columnModify = { [column['key']]: column['title'] };
      this.dbFieldsColums = { ...this.dbFieldsColums, ...columnModify };
    });
  }

  get mappingsGroup(): FormArray {
    return this.mappingsForm.get('mappings') as FormArray;
  }

  /**
   * method to validate mapping comtrols fields by index
   * 
   */
  getValidity(i) {
    return (<FormArray>this.mappingsForm.get('mappings')).controls[i].invalid;
  }

  private createFormGroup(field: string, title: string): FormGroup {

    // Setting matched field from file header
    const val = this.fileHeaders && this.fileHeaders.find(fileHeader=>fileHeader==title) || '';
    return this.fb.group({
      source_key: [val, [Validators.required]],
      dest_key: [field, [Validators.required]]
    });

  }

  private createFormGroupWithOutValidations(field: string, title: string): FormGroup {

    // Setting matched field from file header
    const val = this.fileHeaders && this.fileHeaders.find(fileHeader=>fileHeader==title) || '';
    return this.fb.group({
      source_key: [val],
      dest_key: [field]
    });

  }
  /**
   * This method is to add new formGroup to formArray
   * @param header
   */
  private addItem(field): void {
    if(this.uploadType == 'contractLineItem'){
      const formGroup = this.createFormGroup(field.key, field.title);
      this.mappingsList.push(formGroup);
    }else{
      const formGroup = field.key === 'spot_id' ? this.createFormGroup(field.key, field.title) : this.createFormGroupWithOutValidations(field.key, field.title);
      this.mappingsList.push(formGroup);
    }    
  }

  /**
   * This method is to set the height of the popup based on window size
   */
  public onResize(): void {
    this.contentHeight = window.innerHeight - 420;
  }


  /**
   * This method is to submit the mapped data
   * @param formGroup
   */
  public mapFields(formGroup: FormGroup): void {
    if(this.uploadType=='contractLineItem'){
      // No form validate check when contractLineItem
      this.returnFormMappingData();
    }else{
      if (formGroup.valid) {
        this.returnFormMappingData();
      }
    }
  }

  private returnFormMappingData(){
    const response = {};
    response['mappings'] = this.mappingsForm.getRawValue()['mappings'].filter((data) => data.source_key !== 'No Match');
    this.dialogRef.close(response);
  }

  public onClose() {
    this.dialogRef.close();
  }

}
