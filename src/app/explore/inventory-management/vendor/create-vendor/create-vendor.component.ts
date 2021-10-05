import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, Optional, SkipSelf, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { zip, Observable, of } from 'rxjs';
import { mergeMap, filter, tap, startWith, distinctUntilChanged, map,  debounceTime } from 'rxjs/operators';
import { InventoryService } from '@shared/services';
import { Vendor } from '@interTypes/inventory-management';
import { UploadAttachments } from '@interTypes/uploadAttachments';
import { VendorService } from '../vendor.service';
import { FileUploadConfig } from '@interTypes/file-upload';
import { forbiddenNamesValidator } from '@shared/common-function';
import { VendorGroup } from '@interTypes/vendor/vendor-group-search';
import { VendorGroupAbstract } from '../vendor-group';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VendorType } from '@interTypes/vendor';
import { Helper } from 'app/classes';
@Component({
  selector: 'app-create-edit-vendor',
  templateUrl: './create-vendor.component.html',
  styleUrls: ['./create-vendor.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateVendorComponent extends VendorGroupAbstract implements OnInit {
  createEditVendorForm: FormGroup;
  vendors: Vendor[];
  public acceptedFileFormats = ['csv'];
  public attachments: any = [];
  public attachmentFile: UploadAttachments[];
  public clearField = false;
  public scrollContent: number;
  private fileData: any = [];
  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: true
  };
  public  isLoadingVendorsGroup = true;
  parentVendors: VendorGroup[] = [];
  public filteredParentVendors: VendorGroup[] = [];
  public panelContainer : string;
  public vendorTypes: VendorType[] = [];
  public vendorTypePagination = {
    perPage: 10,
    page:1,
    total:10
  }
  public isVendorTypesLoading = false;

  public diversityOwnerships: VendorType[] = [];
  public diversityOwnershipsPagination = {
    perPage: 10,
    page:1,
    total:10
  }
  public isDiversityOwnershipsLoading = false;

  constructor(
    private fb: FormBuilder,
    public vendorApi: VendorService,
    private route: Router,
    private matSnackBar: MatSnackBar,
    public cdRef: ChangeDetectorRef,
    @Optional() @SkipSelf() private dialogRef: MatDialogRef<CreateVendorComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public data,
  ) {
    super(vendorApi, cdRef);
    this.createEditVendorForm = fb.group({
      name: [null, Validators.required],
      businessPhone: [null],
      businessFax: [null],
      email: [null],
      businessWebsite: [null],
      addressLine1: [null],
      addressLine2: [null],
      city: [null],
      state: [null],
      zipCode: [null],
      taxIdNumber: [null],
      type: [null],
      diversityOwnership: [null],
      pubA_id: [null],
      pubB_id: [null],
      pubA_edition: [null],
      pubB_edition: [null],
      notes: [null],
      contacts: fb.array([
        fb.group({
          name: null,
          email: null
        })
      ]),
      parentCompany: [null, null, forbiddenNamesValidator],
      parentFlag: [false]
    });
  }
  private getSnackBarConfig(): MatSnackBarConfig {
    return {
      duration: 5000,
    };
  }
  ngOnInit(): void {
    this.loadVendorsGroups();
    this.setFilterVendorsGroupSubscribtion(this.createEditVendorForm, 'parentCompany');

    this.reSize();
    this.loadVendorTypes();
    this.loadDiversityOwnerships();
  }

  addNewContactGroup() {
    const add = this.createEditVendorForm.get('contacts') as FormArray;
    add.push(
      this.fb.group({
        name: '',
        email: ''
      })
    );
  }

  deleteContactGroup(index: number) {
    const add = this.createEditVendorForm.get('contacts') as FormArray;
    add.removeAt(index);
  }

  formatPayLoad(payloadData) {
    // Check vendor data & set null if empty
      Object.keys(payloadData).forEach( element => {
        if (typeof payloadData[element] === 'string' && payloadData[element].trim() === '') {
          payloadData[element] = null;
       }
      });
      return payloadData;
    }

  public onSubmit(value) {
    const payload = Helper.deepClone(value);
    payload.parentCompany = payload.parentCompany?.name ?? null;
    payload.type = payload.type && !Array.isArray(payload.type) ? [payload.type]:payload.type ;
    payload.diversityOwnership = payload.diversityOwnership && !Array.isArray(payload.diversityOwnership) ?[payload.diversityOwnership]:payload.diversityOwnership;
    let countFileUploaded = 0;
    this.vendorApi
      .createVendor(this.formatPayLoad(payload), false)
      .pipe(
        mergeMap((vendorResponse) => {
          if (vendorResponse && vendorResponse['status'] === 'success') {
            if (vendorResponse?.data?.id) {
              if (this.fileData.length > 0) {
                const uploadAttachment = [];
                this.fileData.filter((fileList, index) => {
                  uploadAttachment.push(
                    this.vendorApi
                      .updateAttachment(fileList, vendorResponse.data.id)
                      .pipe(
                        tap((response) => {
                          if (
                            response &&
                            response.status &&
                            response.status === 'success'
                          ) {
                            countFileUploaded = countFileUploaded + 1;
                            this.showsAlertMessage(
                              `Attachemnt uploaded ${countFileUploaded}/${this.fileData.length}`
                            );
                          } else {
                            countFileUploaded = countFileUploaded + 1;
                            this.showsAlertMessage(
                              `Attachemnt upload failed ${countFileUploaded}/${this.fileData.length}, Please try again later`
                            );
                          }
                        })
                      )
                  );
                });
                return zip(...uploadAttachment);
              } else {
                return of(vendorResponse);
              }
            }
          } else {
            return of(vendorResponse);
          }
        })
      )
      .subscribe((response) => {
        if (this.fileData.length >= 1) {
          if (response && response[0]['status'] === 'success') {
            this.showsAlertMessage('Vendor created Successfully!');
            setTimeout(() => {
              this.navigateToVendorList(response.data);
            }, 1000);
          } else if (response?.['error']?.['message']) {
            this.showsAlertMessage(response['error']['message']);
          } else {
            this.showsAlertMessage(
              'Something went wrong, Please try again Later'
            );
          }
        } else {
          if (response && response['status'] === 'success') {
            this.showsAlertMessage('Vendor created Successfully!');
            setTimeout(() => {
              this.navigateToVendorList(response.data);
            }, 1000);
          } else if (response?.['error']?.['message']) {
            this.showsAlertMessage(response['error']['message']);
          } else {
            this.showsAlertMessage(
              'Something went wrong, Please try again Later'
            );
          }
        }
      });
  }

  reSize() {
    this.scrollContent = window.innerHeight - (this.data?.size ? 240: 280);
  }

  /** EventEmitter function getting upload files */
  uploadedFile(files) {
    this.fileData = files;
  }

  navigateToVendorList(result?:any) {
    if(this.dialogRef)this.dialogRef.close(result);
    else this.route.navigateByUrl('/recordsmanagement/vendor');
  }

  vendorDisplayWithFn(vendorGroup: VendorGroup) {
    return vendorGroup?.name ?? '';
  }

  vGroupTrackByFn(idx: number, vendorGroup: VendorGroup) {
    return vendorGroup?._id ?? idx;
  }

    // To make inifinte scroll work, we need to set container when the autocomplete overlay panel is opened
    public updateContainer() {
      this.panelContainer = '.vendor-group-autocomplete';
    }


  private showsAlertMessage(msg) {
    const config = this.getSnackBarConfig();
    this.matSnackBar.open(msg, 'close', {
      ...config
    });
  }

  private loadVendorTypes(){
    this.isVendorTypesLoading = true;
    this.vendorApi.getVendorsTypesSearch(this.vendorTypePagination).subscribe((res)=>{
      if(res.results){
        this.vendorTypes = res.results;
        this.vendorTypePagination.total = res.pagination.total;
        this.isVendorTypesLoading = false;
        this.cdRef.markForCheck();
      }
    });
  }

  public loadMoreVendorTypes(){
    let currentSize = this.vendorTypePagination.page * this.vendorTypePagination.perPage;
    if( currentSize > this.vendorTypePagination.total) {
      this.isVendorTypesLoading = false;
      return;
    }

    this.vendorTypePagination.total += 1;
    this.loadVendorTypes();
  }

  private loadDiversityOwnerships(){
    this.isDiversityOwnershipsLoading = true;
    this.vendorApi.getVendorsDiversityOwnerships(this.vendorTypePagination).subscribe((res)=>{
      if(res.results){
        this.diversityOwnerships = res.results;
        this.diversityOwnershipsPagination.total = res.pagination.total;
        this.isDiversityOwnershipsLoading = false;
        this.cdRef.markForCheck();
      }
    });
  }

  public loadMoreDiversityOwnerships(){
    let currentSize = this.diversityOwnershipsPagination.page * this.diversityOwnershipsPagination.perPage;
    if( currentSize > this.diversityOwnershipsPagination.total) {
      this.isDiversityOwnershipsLoading = false;
      return;
    }

    this.diversityOwnershipsPagination.total += 1;
    this.loadDiversityOwnerships();
  }
}
