import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Subject } from 'rxjs';

import { ContactPayload } from '@interTypes/records-management';
import { RecordService } from '../../record.service';
import { Helper } from 'app/classes';

@Component({
  selector: 'app-clients-add-contact',
  templateUrl: './clients-add-contact.component.html',
  styleUrls: ['./clients-add-contact.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsAddContactComponent implements OnInit {

  public submitForm$: Subject<void> = new Subject<void>();
  public contactFormControl = new FormControl([null]);
  public scrolling$ = new Subject();

  constructor(
    private fb: FormBuilder,
    private recordService: RecordService,
    private cdRef: ChangeDetectorRef,
    private bottomSheetRef: MatBottomSheetRef<ClientsAddContactComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any
  ) {

    const company = this.data?.company;
    
    this.contactFormControl.patchValue({
      company: company ?? null,
      parentCompanyName: company?.parentCompany,
      address: {
        address: company?.address?.line ?? null,
        zipcode: company?.address?.zipcode ?? null,
        state: company?.address?.state ?? null,
        city: company?.address?.city ?? null,
      },
      office: company?.['phone'],
      fax: company?.['fax']
    });
  }

  public ngOnInit(): void {
  }

  public closeSheet() {
    this.bottomSheetRef.dismiss();
  }

  public save() {
    if (this.contactFormControl.valid) {
      const payload = this.buildCreateContactAPIPayload();
      this.recordService.createContact(payload).subscribe(
        (response) => {
          this.recordService.showsAlertMessage('Contact created Successfully!');
          this.bottomSheetRef.dismiss(response);
        },
        (errorResponse) => {
          if (errorResponse.error?.message) {
            this.recordService.showsAlertMessage(errorResponse.error?.message);
            return;
          }
          this.recordService.showsAlertMessage(
            'Something went wrong, Please try again Later'
          );
        }
      );
    } else {
      this.submitForm$.next();
    }
  }


  /**
   * @description
   *  This method is used to build the contact creation api
   *  request payload
   */
  private buildCreateContactAPIPayload() {
    const formData = this.contactFormControl.value;
    const payload: ContactPayload = {
      firstName: formData['firstName'],
      lastName: formData['lastName'],
      // TODO: For Now we are setting manually, We need to discuss about design changes with client
      companyType: formData['company']?.['organizationType'],
      // Need to set true by default said by Vijay
      isActive: true,
      current: true,
      companyId: formData['company']?.['_id']
    };
    if(this.data?.company){
      payload.companyType = this.data.company['organizationType'];
      payload.companyId = this.data.company['organizationId'] ?? this.data.company['_id'];
    }
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
      payload['email'] = formData.email.split(',').map((email) => email.trim());
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

  public handleScroll(){
    this.scrolling$.next();
  }
}
