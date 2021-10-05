import { takeUntil } from 'rxjs/operators';
import { Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, NgModel, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin, ReplaySubject, Subscription } from 'rxjs';

import { CustomValidators } from 'app/validators/custom-validators.validator';
import { Role, AddUserDialogData } from '../../models';
import {
  GroupsService,
  DivisionsService,
  OfficesService,
  AddressServiceService
} from '../../services';

@Component({
  selector: 'add-user-dialog',
  templateUrl: 'add-user-dialog.component.html',
  styleUrls: ['./add-user-dialog.component.less']
})
export class AddUserDialogComponent implements OnDestroy {
  public createGroupForm: FormGroup;
  public contactForm: FormGroup;
  public roles: Role[] = [];
  public destroy: ReplaySubject<any> = new ReplaySubject<any>(1);
  public rolesSub: Subscription;

  public isDivisionsComplete = false;
  public isDivisionsLoading = false;
  public divisionsLimit = 10;
  public divisionsOffset = 0;
  public divisions = [];

  public isOfficesComplete = false;
  public isOfficesLoading = false;
  public officesLimit = 10;
  public officcesOffset = 0;
  public offices = [];

  public states = [];

  public isSaveAsContact = false;
  public showContactSection = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddUserDialogData,
    private groupsService: GroupsService,
    private divisionsService: DivisionsService,
    private officesService: OfficesService,
    private addressServiceService: AddressServiceService
  ) {
    this.createGroupForm = fb.group({
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required, CustomValidators.vaildPassword]],
      groups: [null]
    });

    this.contactForm = fb.group({
      office: null,
      division: { value: null, disabled: true },
      line: null,
      zipcode: null,
      state: null,
      city: null,
      business: [null, CustomValidators.telephoneInputValidator],
      mobile: [null, CustomValidators.telephoneInputValidator]
    });
  }

  onChangeIsSaveRecord(value: boolean) {
    this.showContactSection = value;

    if (value && !this.divisions.length && !this.offices.length) {
      // this.getDivisionsList();
      this.getOfficesList();

      this.addressServiceService
        .getStateSearch()
        .pipe(takeUntil(this.destroy))
        .subscribe(({ results }) => {
          this.states = results;
        });
    }
  }

  onGroupAdded({ value }) {
    if (!value?.length) {
      this.rolesSub.unsubscribe();
      this.roles = [];
      return;
    }

    this.createGroupForm.patchValue({
      value
    });
    this.rolesSub = forkJoin(
      value.map(({ _id }) => this.groupsService.getGroupRoles(_id))
    )
      .pipe(takeUntil(this.destroy))
      .subscribe((res: Role[]) => {
        this.roles = res
          .flat()
          .filter((v, i, a) => a.findIndex((t) => t._id === v._id) === i);
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit(formValue: any): void {
    if (this.createGroupForm.valid) {
      this.dialogRef.close(
        Object.assign(
          { isSaveAsContact: this.isSaveAsContact, isUpdate: true },
          formValue,
          this.showContactSection ? this.contactForm.value : {}
        )
      );
    } else if (this.createGroupForm.invalid) {
      this.createGroupForm.markAllAsTouched();

      if (this.showContactSection) {
        this.contactForm.markAllAsTouched();
      }
    }
  }

  public onOfficeChange({ value }) {
    if (value.division?._id) {
      this.divisionsService
        .retriveDivisionById(value.division?._id)
        .pipe(takeUntil(this.destroy))
        .subscribe((res) =>
          this.contactForm.controls['division'].setValue(res.name)
        );
    } else {
      this.contactForm.controls['division'].reset();
    }
  }

  public getOfficesList(onScroll?: boolean, noLoader = false) {
    if (onScroll) {
      this.isOfficesLoading = true;
    }

    this.officesService
      .getOfficesList(
        undefined,
        undefined,
        String(this.officcesOffset + this.officesLimit),
        undefined,
        noLoader
      )
      .subscribe((res) => {
        const { results } = res;
        if (onScroll) {
          this.isOfficesLoading = false;
        }
        this.offices = results;
        this.officcesOffset += this.officesLimit;
        this.isOfficesLoading = this.officcesOffset >= res.pagination.total;
      });
  }

  ngOnDestroy() {
    this.destroy.next(null);
    this.destroy.complete();
  }
}
