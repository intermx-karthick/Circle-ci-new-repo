import { SnackbarService } from '@shared/services';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, Inject } from '@angular/core';
import {
  DivisionsService,
  OfficesService,
  AddressServiceService
} from '../../services';

@Component({
  selector: 'app-add-offfice-dialog',
  templateUrl: './add-offfice-dialog.component.html',
  styleUrls: ['./add-offfice-dialog.component.less']
})
export class AddOffficeDialogComponent implements OnInit {
  public addOfficeForm: FormGroup;
  public isDivisionsLoading = false;
  public limit = 10;
  public offset = 0;
  public divisions = [];
  public isComplete = false;
  public states = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddOffficeDialogComponent>,
    private divisionsService: DivisionsService,
    private officesService: OfficesService,
    private addressServiceService: AddressServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackbarService: SnackbarService
  ) {
    this.addOfficeForm = fb.group({
      name: [null, Validators.required],
      division: [null, Validators.required],
      line: [null],
      zipcode: [null],
      city: [null],
      state: [null]
    });
    this.getDivisionsList();
  }

  ngOnInit() {
    this.addressServiceService.getStateSearch().subscribe(({ results }) => {
      this.states = results;
    });

    if (this.data) {
      this.addOfficeForm.setValue({
        name: this.data.name || '',
        division: this.data.division?._id || '',
        line: this.data.address?.line || '',
        zipcode: this.data.address?.zipcode || '',
        city: this.data.address?.city || '',
        state: this.data.address?.stateCode || ''
      });
    }
  }

  public onSubmit() {
    const {
      name,
      division,
      line,
      zipcode,
      city,
      state
    } = this.addOfficeForm.value;

    const stateId = this.states.find((el) => el.short_name === state)?._id;

    const body = {
      name,
      division,
      address: {
        line,
        zipcode,
        city,
        state: stateId,
        stateCode: state
      }
    };

    if (this.addOfficeForm.valid) {
      if (this.data) {
        this.officesService
          .patchOffice(this.data.officeId, body)
          .subscribe(({ message }) => {
            this.snackbarService.showsAlertMessage(message);
            this.dialogRef.close({ isUpdateOffices: true });
          });
      } else {
        this.officesService.createOffice(body).subscribe(({ message }) => {
          this.snackbarService.showsAlertMessage(message);
          this.dialogRef.close({ isUpdateOffices: true });
        });
      }
    } else {
      this.addOfficeForm.markAsTouched();
    }
  }

  public onNoClick(): void {
    this.dialogRef.close({ isUpdateOffices: false });
  }

  public getDivisionsList(onScroll?: boolean, noLoader = false) {
    if (onScroll) {
      this.isDivisionsLoading = true;
    }

    this.divisionsService
      .getDivisionsList(
        undefined,
        undefined,
        String(this.offset + this.limit),
        undefined,
        noLoader
      )
      .subscribe((res) => {
        const { results } = res;
        if (onScroll) {
          this.isDivisionsLoading = false;
        }
        this.divisions = results;
        this.offset += this.limit;
        this.isComplete = this.offset >= res.pagination.total;
      });
  }

  public deleteOffice() {
    this.officesService
      .removeOffice(this.data.officeId)
      .subscribe(({ message }) => {
        this.snackbarService.showsAlertMessage(message);
        this.dialogRef.close({ isUpdateOffices: true });
      });
  }
  
}
