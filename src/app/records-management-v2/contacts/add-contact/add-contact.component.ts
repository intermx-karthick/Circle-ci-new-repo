import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  Optional,
  SkipSelf,
  ChangeDetectorRef,
  ElementRef, 
  ViewChild,  
  AfterViewChecked} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { RecordService } from 'app/records-management-v2/record.service';
import { Contact, ContactPayload } from '@interTypes/records-management';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { AssociationsIdentifier } from 'app/classes';
import { ContactAssociations } from '@interTypes/associations/contact-associations';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-add-contact',
  templateUrl: './add-contact.component.html',
  styleUrls: ['./add-contact.component.less'],
  providers: [ 
    AssociationsIdentifier
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddContactComponent implements OnInit, AfterViewChecked {
  public submitForm$: Subject<void> = new Subject<void>();
  public contactFormControl = new FormControl([null]);
  public scrollContent: number;
  public contactDetails: Contact = {} as Contact;
  public enableDuplicate = false;
  public isEditContact = false;
  public isContactNoteChanges;
  @ViewChild('titleContent', {read: ElementRef, static:false}) titleContent: ElementRef;
  public scrolling$ = new Subject();


  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private recordService: RecordService,
    private matSnackBar: MatSnackBar,
    public cdRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private associationIdentifier: AssociationsIdentifier,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<AddContactComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public injectedData: any
  ) {
  }
  public ngAfterViewChecked(): void {
    this.reSize();
  }


  public ngOnInit(): void {
    this.reSize();
    if (this.activeRoute.snapshot.queryParams['contactId']) {
      this.loadContact(this.activeRoute.snapshot.queryParams['contactId']);
    }
    if(this.injectedData?.contact?._id){
      this.contactDetails = this.injectedData?.contact;
      this.updateFormData();
      this.isEditContact = true;
    }

    if(this.injectedData?.isNewConatct){
      const company = this.injectedData.company;

      this.contactFormControl.patchValue({
        company: this.injectedData?.organization,
        parentCompanyName:this.injectedData?.organization?.parentCompany,
        address: {
          address: company?.address?.line ?? null,
          zipcode: company?.address?.zipcode ?? null,
          state: company?.address?.state ?? null,
          city: company?.address?.city ?? null,
        },
        fax: company.fax ?? null,
        office: company.phone ?? null,
      });
      this.cdRef.markForCheck();
      this.isEditContact = false;
    }

    if(this.injectedData?.isDuplicate){
      this.enableDuplicate = true;
    }
  }

  private loadContact(contactId) {
    this.recordService.getContactById(contactId).subscribe((response) => {
      if (response?._id) {
        this.contactDetails = response;
        this.updateFormData();
        this.cdRef.markForCheck();
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
    this.associationIdentifier.validateAssociationAndCallFunction<ContactAssociations>(PATH, this.updateContact.bind(this), dialogData);
  }

  public updateContact() {
    /** Update conatct */
    const payload = this.buildCreateContactAPIPayload(true);
    this.recordService
      .updateContact(payload, this.contactDetails._id)
      .subscribe(
        (response) => {
          this.showsAlertMessage('Contact updated successfully!');
          if (this.injectedData?.enableDialog) {
            this.dialogRef.close(response);
          }
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
  }

  public handleSubmit() {
    if (this.contactFormControl.valid) {
      if(this.injectedData?.enableDetails &&  !this.enableDuplicate){
        this.validateAssociationAndUpdateContact();
      }else{
        /** Create new conatct  */
          const payload = this.buildCreateContactAPIPayload();
          this.recordService.createContact(payload).subscribe(
            (response) => {
              this.showsAlertMessage('Contact created successfully!');
              if (this.injectedData?.enableDialog) {
                this.dialogRef.close(response);
              } else {
                this.router.navigateByUrl(`/records-management-v2/contacts/${response['data']['id']}`);
              }
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
      }

    } else {
      this.submitForm$.next();
    }
  }
  public reSize() {
    //this.cdRef.markForCheck();
    if(this.injectedData?.enableDialog){
      this.scrollContent = 500 - document.getElementById('add-contact-title').offsetHeight;     
    }else{      
     // Tested different scenario so that added settimeout here
    setTimeout(() => {
      const dynamicHeight = this.titleContent?.nativeElement?.offsetHeight ?? 40;
      this.scrollContent = window.innerHeight - (230 + dynamicHeight);
      this.cdRef.markForCheck();
      }, 100);
    }
  }

  /**
   * @description
   *  This method is used to build the contact creation api
   *  request payload
   */
  private buildCreateContactAPIPayload(removeNote=false) {
    const formData = this.contactFormControl.value;
    const payload: ContactPayload = {
      firstName: formData['firstName'],
      lastName: formData['lastName'],
      // TODO: For Now we are setting manually, We need to discuss about design changes with client
      companyType: formData?.['company']?.['organizationType'],
      // Need to set true by default said by Vijay
      isActive: true,
      current: true,
      companyId: formData?.['company']?.['_id']
    };
    if(this.injectedData?.organization){
      payload.companyType = this.injectedData?.['organization']?.['organizationType'];
      payload.companyId = this.injectedData?.['organization']?.['_id'];
    }
    if (formData.type?.['_id']) {
      payload.type = formData.type?.['_id'];
    }else if(formData.type){
      payload.type = formData.type;
    }
    if (formData.address) {
      let zipcode;
      if (formData.address.zipCode?.ZipCode) {
        zipcode = formData.address.zipCode.ZipCode;
      } else if (formData.address.zipCode) {
        zipcode = formData.address.zipCode;
      } else {
        zipcode = '';
      }
      payload['address'] = {
        line: formData.address.address,
        city: formData.address.city,
        state: formData.address.state?._id,
        // zipcode: formData.address.zipCode?.ZipCode ?? ''
        zipcode: zipcode
      };
    }
    if (formData.title) {
      payload['title'] = formData.title;
    }
    if (formData.email) {
      payload['email'] = formData.email.split(';').map((email) => email.trim());
    }
    if (formData.mobile?.area || formData.mobile?.area == "") {
      const phoneNumber = formData.mobile;
      payload[
        'mobile'
      ] = `${phoneNumber.area}${phoneNumber.exchange}${phoneNumber.subscriber}`;
    }else if(formData.mobile){
      payload[
        'mobile'
      ] = formData.mobile
    }

    if (formData.office?.area || formData.office?.area == "") {
      const phoneNumber = formData.office;
      payload[
        'office'
      ] = `${phoneNumber.area}${phoneNumber.exchange}${phoneNumber.subscriber}`;
    }else{
       payload[
        'office'
      ] = formData.office;
    }
    if (formData.ext) {
      payload['ext'] = formData.ext;
    }
    if (formData.fax?.area || formData.fax?.area == "") {
      const businessFax = formData.fax;
      payload[
        'fax'
      ] = `${businessFax.area}${businessFax.exchange}${businessFax.subscriber}`;
    }else{
      payload[
        'fax'
      ] = formData.fax;
    }

    // Remove Note field while updating
    if (formData.note && !removeNote) {
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

  private updateFormData() {
    this.contactFormControl.patchValue({
      firstName: this.contactDetails?.firstName ?? null,
      lastName: this.contactDetails?.lastName ?? null,
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
      note: (this.injectedData?.enableDetails && !this.enableDuplicate) ? this.contactDetails?.note?.notes ?? null : null
    });
    this.cdRef.markForCheck();
  }
  private formatEmails() {
    if (this.contactDetails.email.length) {
      return this.contactDetails.email.join(';');
    } else {
      return null;
    }
  }

  public closeDialogBox() {
    this.checkNoteChanges();
  }

  public openCreateDuplicate() {
    this.enableDuplicate = true;
    this.updateFormData();
    this.cdRef.markForCheck();
  }

  public deleteContactAPI() {
    if(this.contactDetails?._id){
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
            this.dialogRef.close(response);
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
  }
  public onDeleteConatct() {
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

  public contactNoteUpdateEmit(event){
    this.isContactNoteChanges = event;
  }

  private checkNoteChanges()
  {
    if(this.isContactNoteChanges?.['noteUpdated']){
      this.dialogRef.close({'changes':true});
    }else{
      this.dialogRef.close();
    }
  }

  public handleScroll(){
    this.scrolling$.next();
  }
}


