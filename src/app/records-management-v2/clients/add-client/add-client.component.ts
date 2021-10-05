import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { of, Subject } from 'rxjs';

import { RecordService } from '../../record.service';
import { ClientAccountingPayload, ClientsAccountDetails, CreateClientPayload } from '@interTypes/records-management';
import { Helper } from '../../../classes';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { catchError, filter, retry, switchMap, tap } from 'rxjs/operators';
import { Note } from '@interTypes/notes';
@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.component.html',
  styleUrls: ['./add-client.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddClientComponent implements OnInit {
  public scrollContent: number;
  public addClientForm: FormGroup;
  public panelContainer: string;
  public enableDuplicate: boolean = false;
  public clientDetails: ClientDetailsResponse;
  public submitForm$: Subject<void> = new Subject<void>();
  public scrolling$ = new Subject();
  public enableDuplicate$: Subject<void> = new Subject<void>();
  public clientAccountingDetails: ClientsAccountDetails;
  public latestBillingNote: Note;
  constructor(
    private router: Router,
    private fb: FormBuilder,
    public recordService: RecordService,
    public matSnackBar: MatSnackBar,
    public cdRef: ChangeDetectorRef,
    private activeRoute: ActivatedRoute
  ) {
  }

  static removeEmptyOrNullRecursive(obj) {
    Object.entries(obj).forEach(
      ([key, val]) =>
        (val &&
          typeof val === 'object' &&
          this.removeEmptyOrNullRecursive(val)) ||
        ((val === null  || val === 'undefined') && delete obj[key])
    );
    return obj;
  }

  public static buildCreateClientPayload(formValue: any): CreateClientPayload {
    let payload = Helper.deepClone(formValue);
    payload = this.removeEmptyOrNullRecursive(payload);

    if (payload.address) {
      payload.address.state = payload.address.state?._id;
      payload.address.zipcode = payload.address.zipCode?.ZipCode ?? '';
      payload.address.line = payload.address?.address;
      delete payload.address.zipCode;
      delete payload.address.address;
    }

    if (payload.parentClient?._id) {
      payload.parentClient = payload.parentClient['_id'];
    } else {
      payload.parentClient = null;
    }

    if (!payload.office) {
      payload.office = null;
    }

    if (payload.managedBy?.id) {
      payload.managedBy = payload.managedBy['id'];
    }else {
      payload.managedBy = null;
    }

    if (payload.operationsContact?.id) {
      payload.operationsContact = payload.operationsContact['id'];
    } else {
      payload.operationsContact = null;
    }

    if (payload.mediaAgency?._id) {
      payload.mediaAgency = payload.mediaAgency['_id'];
    } else {
      payload.mediaAgency = null;
    }

    if (!payload.agencyContact) {
      delete payload.agencyContact;
    }

    if (payload.creativeAgency?._id) {
      payload.creativeAgency = payload.creativeAgency['_id'];
    } else {
      payload.creativeAgency = null;
    }

    if (!payload.creativeAgencyContact) {
      delete payload.creativeAgencyContact;
    }

    if (payload.phone) {
      const phoneNumber = payload.phone;
      payload[
        'phone'
        ] = `${phoneNumber.area}${phoneNumber.exchange}${phoneNumber.subscriber}`;
    }

    if (payload.fax) {
      const phoneNumber = payload.fax;
      payload[
        'fax'
        ] = `${phoneNumber.area}${phoneNumber.exchange}${phoneNumber.subscriber}`;
    }
    if (payload.billing?.media) {
      payload.billing['media'] = Number(payload.billing?.media);
    }
    if (payload.oohRevenue?.media) {
      payload.oohRevenue['media'] = Number(payload.oohRevenue?.media);
    }
    if (payload.retirementDate) {
      const retDate = new Date(payload.retirementDate);
      payload.retirementDate = format(retDate, 'MM/dd/yyyy', {
        locale: enUS
      });
    }

    Helper.removeEmptyArrayAndEmptyObject(payload);
    return payload;
  }

  public ngOnInit(): void {
    this.buildForm();
    this.reSize();

    const clientId = this.activeRoute.snapshot.queryParams['clientId'];
    if (clientId) {
      this.loadClient(clientId);
    }
  }

  public reSize() {
    if(this.enableDuplicate && this.clientDetails?.['clientName']?.length>40){
      this.scrollContent = window.innerHeight - 300;
    }else{
     this.scrollContent = window.innerHeight - 280;
    }
  }

  public navigateToClientList() {
    this.router.navigateByUrl(`/records-management-v2/clients`);
  }

  public submitAddClientForm() {
    if (this.addClientForm.valid) {
      const payload = AddClientComponent.buildCreateClientPayload(
        this.addClientForm.value?.clientForm
      );
      
      this.recordService.createClient(payload).pipe(switchMap((clientResponse) => {
        if (clientResponse['status'] === 'success') {
          if (this.enableDuplicate && this.clientAccountingDetails._id) {
            const accountingPayload = this.buildUpdateAccountingAPIPayload(payload['clientName']);
            return this.recordService.updateClientAccounting(clientResponse.data.id, this.clientAccountingDetails._id, accountingPayload, false).pipe(
              retry(3),
              switchMap((accountsResponse) => of(clientResponse)),
              catchError ((error) => {
                this.showsAlertMessage('Client is duplicated successfully, but there was an issue in cloning the accounting details.');
                clientResponse['hideMessage'] = true;
                return of(clientResponse)
              })
            )
          } else {
            return of(clientResponse);
          }
        } else {
          return of(clientResponse);
        }
      })).subscribe(
        (response) => {
          if (response['status'] === 'success') {
            if(!response['hideMessage']) {
              this.showsAlertMessage('Client created successfully!');
            }
            this.router.navigateByUrl(
              `/records-management-v2/clients/${response.data.id}`
            );
          } else if (response['error']?.['message']) {
            this.showsAlertMessage(response['error']['message']);
          }
        },
        (errorResponse) => {
          if (errorResponse.error?.message) {
            this.showsAlertMessage(errorResponse.error?.message);
          } else if (errorResponse.error?.error) {
            this.showsAlertMessage(errorResponse.error?.error);
          } else {
            this.showsAlertMessage(
              'Something went wrong, Please try again later'
            );
          }
        }
      );
    } else {
      this.submitForm$.next();
    }
  }

  private buildForm() {
    this.addClientForm = this.fb.group({
      clientForm: [null]
    });
  }

  private showsAlertMessage(msg) {
    const config = {
      duration: 5000
    } as MatSnackBarConfig;

    this.matSnackBar.open(msg, '', config);
  }

  private loadClient(clientId) {
    this.recordService
      .getClient(clientId, false).pipe(
        filter(res => !!res),
        switchMap((response: ClientDetailsResponse) => {
          this.clientDetails = response;
          return this.recordService.getClientAccounting(clientId, false)
          .pipe(filter(res => !!res),
          switchMap((clientAccountResponse: ClientsAccountDetails) => {
            this.clientAccountingDetails = clientAccountResponse;
            // We are getting the latest billing notes
            return this.recordService
            .getNoteDetailsId(clientId, { page: 1, perPage: 1 }, 'clientAccounting', null, true)
            .pipe(
              filter( res => !!res?.['results']),
              tap((res) => {
                this.latestBillingNote = res?.results?.[0];
              })
            )
          }));
        })).subscribe((res) => {
        if (this.clientDetails?._id) {
          this.openCreateDuplicate(this.clientDetails);
        }
      });
  }

  private openCreateDuplicate(client) {
    this.enableDuplicate = true;
    this.enableDuplicate$.next();
    const duplicatedClient = { ...client };
    this.reSize();
    this.updateGeneralFormData({ ...duplicatedClient });
    this.cdRef.markForCheck();
  }

  private updateGeneralFormData(client) {
    this.addClientForm.patchValue({
      clientForm: client
    });
  }

  public handleScroll(){
    this.scrolling$.next('general_Tab');
  }

  private buildUpdateAccountingAPIPayload(clientName) {
    const payload = {
      clientName: clientName ?? null,
      accountingDept: this.clientAccountingDetails.accountingDept?._id ?? null,
      fileSystemId: this.clientAccountingDetails.fileSystemId?._id ?? null,
      pubIdType: this.clientAccountingDetails.pubIdType?._id ?? null,
      invoiceFormat: this.clientAccountingDetails.invoiceFormat?._id ?? null,
      invoiceDelivery: this.clientAccountingDetails.invoiceDelivery?._id ?? null,
      uploadCostType: this.clientAccountingDetails.uploadCostType?._id ?? null,
      clientCodeRequired: this.clientAccountingDetails.clientCodeRequired ?? null,
      clientCode: this.clientAccountingDetails.clientCode ?? null,
      billingCompany: this.clientAccountingDetails.billingCompany?._id ?? null,
      billingContact: this.clientAccountingDetails.billingContact?._id ?? null,
      billingNotes: this.latestBillingNote?.notes ?? null,
      vendorPayableCompany: this.clientAccountingDetails.vendorPayableCompany?._id ?? null,
      vendorPayableContact: this.clientAccountingDetails.vendorPayableContact?._id ?? null
    }
    return Helper.removeEmptyArrayAndEmptyObject(Helper.removeEmptyOrNull(payload));
  }
}
