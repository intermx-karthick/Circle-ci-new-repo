import { SnackbarService } from '@shared/services';
import { Inject, OnInit, Component } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ContactsService,
  OfficesService,
  DivisionsService,
  AddressServiceService,
  UserContactsService
} from '../../services';
import { filter, switchMap } from 'rxjs/operators';
import { RecordsPagination } from '@interTypes/pagination';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { Helper } from '../../../classes';

@Component({
  selector: 'app-user-details-dialog',
  templateUrl: './user-details-dialog.component.html',
  styleUrls: ['./user-details-dialog.component.less']
})
export class UserDetailsDialogComponent implements OnInit {
  public contactRecordDetailsForm: FormGroup;
  public contactTypes = [];
  public contactTypePagination: RecordsPagination = {
    perPage: 10,
    page: 1
  };

  public isContactTypesLoading = false;
  public limitContactTypes = 10;
  public offsetContactTypes = 0;
  public isCompleteContactTypes = false;
  public submitInProcess = false;
  public isOfficesComplete = false;
  public isOfficesLoading = false;
  public officesLimit = 10;
  public officcesOffset = 0;
  public offices = [];

  public states = [];

  public contactInfo: any;

  public contactId: string;

  public isUserSelected = false;
  public showUserSelectedError = false;

  constructor(
    public dialogRef: MatDialogRef<UserDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private contactsService: ContactsService,
    private officesService: OfficesService,
    private divisionsService: DivisionsService,
    private addressServiceService: AddressServiceService,
    private userContactsService: UserContactsService,
    private snackbarService: SnackbarService
  ) {
    this.contactRecordDetailsForm = fb.group({
      firstName: [
        '',
        [
          Validators.required,
          CustomValidators.noWhitespaceValidator(true),
          Validators.maxLength(64)
        ]
      ],
      lastName: [
        '',
        [
          Validators.required,
          CustomValidators.noWhitespaceValidator(true),
          Validators.maxLength(64)
        ]
      ],
      companyName: [null, Validators.required],
      parentCompany: [null],
      companyType: ['User'],
      title: [null],
      email: [null, Validators.email],
      mobile: ['', [CustomValidators.telephoneInputValidator]],
      office: ['', [CustomValidators.telephoneInputValidator]],
      ext: [null],
      fax: ['', [CustomValidators.telephoneInputValidator]],
      address: [null],
      type: [null],
    });

    this.contactRecordDetailsForm.patchValue({
      firstName: data.given_name,
      lastName: data.family_name,
      email: data.email
    });

    this.addressServiceService.getStateSearch().subscribe(({ results }) => {
      this.states = results;
    });
    this.getOfficesList();
  }

  ngOnInit() {
    if (this.data.userContacts.length === 1) {
      this.contactInfo = this.data.userContacts[0];
      this.contactId = this.contactInfo.id;
      this.contactRecordDetailsForm.patchValue({
        firstName: this.contactInfo.firstName,
        lastName: this.contactInfo.lastName,
        companyName: this.contactInfo.officeId?._id,
        parentCompany: this.contactInfo.officeId?.division?.name,
        companyType: this.contactInfo.companyType,
        type: this.contactInfo.type?._id,
        email: this.contactInfo.email[0],
        mobile: Helper.splitValuesInMyTelFormat(this.contactInfo.mobile),
        office: Helper.splitValuesInMyTelFormat(this.contactInfo.office),
        ext: this.contactInfo.ext,
        fax: Helper.splitValuesInMyTelFormat(this.contactInfo.fax),
        address: {
          address: this.contactInfo?.address?.line,
          zipCode: this.contactInfo?.address?.zipcode,
          city: this.contactInfo?.address?.city,
          state: this.contactInfo?.address?.state
        },
        title: this.contactInfo.title
      });
    }
    this.loadContactTypes();
  }

  public onNoClick() {
    this.dialogRef.close();
  }

  public onSubmit() {
    this.submitInProcess = true;
    if (this.data.isUnlink) {
      this.userContactsService
        .unlinkContactWithUser(
          this.data.connection,
          this.data.user_id,
          this.contactId
        )
        .subscribe(({ message }) => {
          this.submitInProcess = false;
          this.snackbarService.showsAlertMessage(message);
          this.dialogRef.close({ isUpdateOnLinking: true });
        });
    } else {
      this.contactRecordDetailsForm.markAllAsTouched();
      this.contactRecordDetailsForm.markAsDirty();
      switch (true) {
        case this.data.userContacts.length > 1:
          if (this.isUserSelected) {
            this.showUserSelectedError = false;
            this.submitHandle();
          } else {
            this.showUserSelectedError = true;
            this.submitInProcess = false;
          }
          break;
        case this.data.userContacts.length === 1:
          this.submitHandle();
          break;
        case this.data.userContacts.length === 0:
          if (this.contactRecordDetailsForm.valid) {
            const contactPayload = this.buildContactAPIPayload();
            this.contactsService
              .createContact(contactPayload)
              .pipe(
                switchMap((res) => {
                  return this.userContactsService.linkContactWithUser(
                    this.data.connection,
                    this.data.user_id,
                    res.data.id
                  );
                })
              )
              .subscribe(({ message }) => {
                this.submitInProcess = false;
                this.snackbarService.showsAlertMessage(message);
                this.dialogRef.close({ isUpdateOnLinking: true });
              });
          } else {
            this.submitInProcess = false;
          }
      }
    }
  }

  public loadMoreContactTypes() {
    const currentSize =
      this.contactTypePagination.page * this.contactTypePagination.perPage;
    if (currentSize > this.contactTypePagination.total) {
      this.isContactTypesLoading = false;
      return;
    }
    this.contactTypePagination.total += 1;
    this.loadContactTypes();
  }

  public loadContactTypes() {
    this.isContactTypesLoading = true;
    this.userContactsService
      .getContactTypes(this.contactTypePagination)
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        this.contactTypes = res.results;
        this.contactTypePagination.total = res.pagination.total;
        this.isContactTypesLoading = false;
      });
  }

  public submitHandle() {
    if (this.contactRecordDetailsForm.valid) {
      const contactPayload = this.buildContactAPIPayload();

      this.contactsService
        .updateContact(this.contactId, contactPayload)
        .pipe(
          switchMap((res) => {
            return this.userContactsService.linkContactWithUser(
              this.data.connection,
              this.data.user_id,
              this.contactId
            );
          })
        )
        .subscribe(({ message }) => {
          this.submitInProcess = false;
          this.snackbarService.showsAlertMessage(message);
          this.dialogRef.close({ isUpdateOnLinking: true });
        });
    } else {
      this.submitInProcess = false;
      this.contactRecordDetailsForm.markAllAsTouched();
    }
  }

  public onOfficeChange({ value }) {
    const divisionId = this.offices.find((el) => el._id === value).division
      ?._id;

    if (divisionId) {
      this.divisionsService.retriveDivisionById(divisionId).subscribe((res) => {
        this.contactRecordDetailsForm.controls['parentCompany'].setValue(
          res.name
        );
      });
    } else {
      this.contactRecordDetailsForm.controls['parentCompany'].reset();
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

  public changeSavedView({ value }) {
    this.contactId = value.id;
    this.isUserSelected = true;

    this.contactRecordDetailsForm.patchValue({
      firstName: value.firstName,
      lastName: value.lastName,
      companyName: value.officeId._id,
      parentCompany: value.officeId.division.name,
      companyType: value.companyType,
      email: value.email[0],
      mobile: Helper.splitValuesInMyTelFormat(value.mobile),
      office: Helper.splitValuesInMyTelFormat(value.office),
      ext: value.ext,
      fax: Helper.splitValuesInMyTelFormat(value.fax),
      address: {
        address: value?.address?.line,
        zipCode: value?.zipCode?.ZipCode ?? value?.zipCode,
        city: value?.address?.city,
        state: value?.address?.state
      },
      title: value.address.title
    });
  }

  private buildContactAPIPayload(): any {
    const contactPayload: any = Helper.deepClone(
      this.contactRecordDetailsForm.value
    );
    contactPayload.email = [contactPayload.email];
    contactPayload.officeId = contactPayload.companyName;
    contactPayload.mobile = Helper.parseMyTelFCValue(contactPayload.mobile);
    contactPayload.fax = Helper.parseMyTelFCValue(contactPayload.fax);
    contactPayload.office = Helper.parseMyTelFCValue(contactPayload.office);
    contactPayload.isActive = true;
    contactPayload.companyId = this.data.organizationId;
    const address = contactPayload.address;
    if (address) {
      contactPayload.address = {
        line: address?.address,
        zipcode: address?.zipCode?.ZipCode ?? address?.zipCode,
        city: address?.city,
        state: address.state?._id,
        stateCode: address.state?.short_name
      };
    } else {
      delete contactPayload.address;
    }

    return contactPayload;
  }
}
