import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef, 
  ViewChild, 
  AfterViewInit
} from '@angular/core';
import { Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { RecordService } from 'app/records-management-v2/record.service';
import {
  Contact,
  ContactPayload
} from '@interTypes/records-management/contacts';
import { TimeStamp } from '@interTypes/time-stamp';
import { AuthenticationService, ThemeService } from '@shared/services';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { AssociationsIdentifier } from 'app/classes';
import { ContactAssociations } from '@interTypes/associations/contact-associations';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
import { map } from 'rxjs/operators';


@Component({
  selector: 'app-contact-view',
  templateUrl: './contact-view.component.html',
  styleUrls: ['./contact-view.component.less'],
  providers: [
    AssociationsIdentifier
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactViewComponent implements OnInit {
  public contactFormControl = new FormControl([null]);
  public scrollContent: number;
  public submitForm$: Subject<void> = new Subject<void>();
  public timeStampData = {} as TimeStamp;
  public contactDetails: Contact = {} as Contact;
  @ViewChild('titleContent', {read: ElementRef, static:false}) titleContent: ElementRef;
  public scrolling$ = new Subject();
  userPermission: UserActionPermission;
  constructor(
    private router: Router,    
    private associationIdentifier: AssociationsIdentifier,
    private activeRoute: ActivatedRoute,
    private recordService: RecordService,
    private matSnackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private auth: AuthenticationService,
  ) {
    this.userPermission = this.auth.getUserPermission(UserRole.CONTACTS);
  }

  

  public ngOnInit(): void {
    this.reSize();
    this.activeRoute.params.subscribe((params) => {
      this.loadContact(params['id']);
    });
  }

  private loadContact(contactId) {
    this.recordService.getContactById(contactId).subscribe((response) => {
      if (response?._id) {
        this.contactDetails = response;
        this.updateFormData();
        this.timeStampData = {
          createdBy: response.createdBy,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
          updatedBy: response.updatedBy
        };
        this.cdRef.detectChanges();
        this.reSize();
      } else {
        this.router.navigateByUrl(`/records-management-v2/contacts`);
        let message = 'Something went wrong, Please try again later';
        if (response?.error?.message) {
          message = response['error']['message'];
        }
        this.showsAlertMessage(message);
      }
    });
  }

  public handleCancel() {
    this.router.navigateByUrl('/records-management-v2/contacts');
  }


  public validateAssociationAndUpdateContact(){
    if (!this.contactFormControl.valid) {
      this.submitForm$.next();
      return;
    }

    const PATH = `contacts/${this.contactDetails._id}/associations`;
    const dialogData = {
      title: 'Edit Confirmation',
      showIcon: false,
      description: 'This record has already been used on a Campaign or Contract. Please double-check all relationships before editing any critical values.'
    };
    this.associationIdentifier.validateAssociationAndCallFunction<ContactAssociations>(PATH, this.handleSubmit.bind(this), dialogData);
  }
  

  public handleSubmit() {
    if (this.contactFormControl.valid) {
      const payload = this.buildCreateContactAPIPayload();
      this.recordService
        .updateContact(payload, this.contactDetails._id)
        .subscribe(
          (response) => {
            this.showsAlertMessage('Contact updated successfully!');
            this.contactDetails['firstName'] = payload.firstName;
            this.contactDetails['lastName'] = payload.lastName;
            this.cdRef.markForCheck();
            this.reSize();
          },
          (errorResponse) => {
            if (errorResponse.error?.message) {
              this.showsAlertMessage(errorResponse.error?.message);
              return;
            }
            this.showsAlertMessage(
              'Something went wrong, Please try again later'
            );
          }
        );
    } else {
      this.submitForm$.next();
    }
  }
  public reSize() {
    this.cdRef.markForCheck();
    // Tested different scenario so that added settimeout here
    setTimeout(() => {
    const dynamicHeight = this.titleContent?.nativeElement?.offsetHeight ?? 40;
    this.scrollContent = window.innerHeight - (230 + dynamicHeight);
    this.cdRef.markForCheck();
    }, 100);
  
  }

  /**
   * @description
   *  This method is used to build the contact update api
   *  request payload
   */
  // TODO: Need to move to common function
  private buildCreateContactAPIPayload() {
    const formData = this.contactFormControl.value;
    const payload: ContactPayload = {
      firstName: formData['firstName'],
      lastName: formData['lastName'],
      // TODO: For Now we are setting manually, We need to discuss about design changes with client
      companyType: formData['company']['organizationType'],
      // Need to set true by default said by Vijay
      isActive: true,
      current: formData.current ?? false,
      companyId: formData['company']['_id']
    };
    if (formData.type) {
      payload.type = formData.type;
    }
    if (formData.address) {
      payload['address'] = {
        line: formData.address.address,
        city: formData.address.city,
        state: formData.address.state?._id,
        zipcode: formData.address.zipCode?.ZipCode ?? ''
      };
    }
    if (formData.title) {
      payload['title'] = formData.title;
    }
    if (formData.email) {
      payload['email'] = formData.email.split(';').map((email) => email.trim());
    }

    if (formData.mobile) {
      const phoneNumber = formData.mobile;
      payload[
        'mobile'
      ] = `${phoneNumber.area}${phoneNumber.exchange}${phoneNumber.subscriber}`;
    }

    if (formData.office) {
      const phoneNumber = formData.office;
      payload[
        'office'
      ] = `${phoneNumber.area}${phoneNumber.exchange}${phoneNumber.subscriber}`;
    }
    if (formData.ext) {
      payload['ext'] = formData.ext;
    }
    if (formData.fax) {
      const businessFax = formData.fax;
      payload[
        'fax'
      ] = `${businessFax.area}${businessFax.exchange}${businessFax.subscriber}`;
    }
    if (formData.note) {
      payload['note'] = formData.note;
    }
    return payload;
  }

  private showsAlertMessage(msg) {
    const config = {
      duration: 3000
    } as MatSnackBarConfig;
    this.matSnackBar.open(msg, '', config);
  }
  public duplicateContact() {
    this.router.navigateByUrl(
      `/records-management-v2/contacts/add?contactId=${this.contactDetails._id}`
    );
  }

public deleteContactAPI() {
  this.dialog
  .open(DeleteConfirmationDialogComponent, {
    width: '340px',
    height: '260px',
    panelClass: 'imx-mat-dialog'
  })
  .afterClosed()
  .subscribe((res) => {
    if (res && res['action']) {
      this.recordService
        .deleteContact(this.contactDetails._id)
        .subscribe((response) => {
              this.showsAlertMessage('Contact deleted successfully!');
            this.router.navigateByUrl(`/records-management-v2/contacts`);
          },
          (errorResponse) => {
            if (errorResponse.error?.message) {
              this.showsAlertMessage(errorResponse.error?.message);
              return;
            } else if (errorResponse.error?.error) {
              this.showsAlertMessage(errorResponse.error?.error);
              return;
            }
            this.showsAlertMessage('Something went wrong, Please try again later');
          });
    }
  });
}

public deleteContact() {
  this.recordService.getContactAssociation(this.contactDetails._id)
    .subscribe((response) => {
      if(Object.keys(response?.associations).length > 0) {
        this.openDeleteWarningPopup();
      } else {
        this.deleteContactAPI();
      }
    },
    (errorResponse) => {
      if (errorResponse.error?.message) {
        this.showsAlertMessage(errorResponse.error?.message);
        return;
      } else if (errorResponse.error?.error) {
        this.showsAlertMessage(errorResponse.error?.error);
        return;
      }
      this.showsAlertMessage('Something went wrong, Please try again later');
    });
}

public openDeleteWarningPopup() {
  const dialogueData = {
    title: 'Attention',
    description: 'Please <b>Confirm</b> This record has already been used on a Campaign or Contract. Please double-check all relationships before deleting.',
    confirmBtnText: 'OK',
    cancelBtnText: 'CANCEL',
    displayCancelBtn: false,
    displayIcon: true
  };
  this.dialog.open(NewConfirmationDialogComponent, {
    data: dialogueData,
    width: '490px',
    height: '260px',
    panelClass: 'imx-mat-dialog'
  }).afterClosed().pipe(
    map(res => res?.action)
  ).subscribe(flag => {

  });
}
  private updateFormData() {
    this.contactFormControl.patchValue({
      firstName: this.contactDetails.firstName ?? null,
      lastName: this.contactDetails.lastName ?? null,
      companyType: this.contactDetails.companyType ?? null,
      company: this.contactDetails.companyId,
      parentCompanyName: this.contactDetails.companyId?.['parentCompany']?.['name'],
      type: this.contactDetails.type ?? null,
      title: this.contactDetails.title ?? null,
      email: this.formatEmails(),
      mobile: this.contactDetails.mobile ?? null,
      office: this.contactDetails.office ?? null,
      ext: this.contactDetails.ext ?? null,
      fax: this.contactDetails.fax ?? null,
      current: this.contactDetails.current ?? false,
      address: {
        address: this.contactDetails?.address?.line ?? null,
        zipcode: this.contactDetails?.address?.zipcode ?? null,
        city: this.contactDetails?.address?.city ?? null,
        state: this.contactDetails?.address?.state ?? null
      },
      note: null
    });
  }

  private formatEmails() {
    if (this.contactDetails.email.length) {
      return this.contactDetails.email.join(';');
    } else {
      return null;
    }
  }

  public handleScroll(){
    this.scrolling$.next();
  }
}
