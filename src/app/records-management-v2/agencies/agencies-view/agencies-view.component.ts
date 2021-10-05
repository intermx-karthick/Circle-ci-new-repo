import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  EventEmitter
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { TimeStamp } from '@interTypes/time-stamp';
import { AssociationsIdentifier, Helper } from 'app/classes';
import { RecordService } from 'app/records-management-v2/record.service';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { AddContactComponent } from '../../contacts/add-contact/add-contact.component';
import { Contact } from '@interTypes/records-management';
import { Logo, LogosListResponse } from '@interTypes/records-management';
import { UseRecordPagination } from 'app/records-management-v2/useRecordPagination';
import { FileUploadConfig } from '@interTypes/file-upload';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { AuthenticationService } from '@shared/services';
import { AgencyAssociations } from '@interTypes/associations';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';

@Component({
  selector: 'app-agencies-view',
  templateUrl: './agencies-view.component.html',
  styleUrls: ['./agencies-view.component.less'],
  providers: [
    AssociationsIdentifier,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgenciesViewComponent implements OnInit, OnDestroy {
  public agencyDetails$ = new BehaviorSubject(null);
  public agencyDetails = {};
  public scrollContent: number;
  public selectedTab = 0;
  public tabWindowSize = false;
  public tab = Object.freeze({
    GENERAL: 0,
    CONTACTS: 1,
    ATTACHMENTS: 2
    // SHIPPING_ADDRESS: 3
  });
  public selectedTabLabel = 'general_Tab';
  agenciesGeneralForm: FormGroup;
  private unSubscribe: Subject<void> = new Subject<void>();
  public uploadInProgress$: Subject<any> = new Subject<any>();
  public clearAttachment$: Subject<any> = new Subject<any>();
  public timeStampData = {} as TimeStamp;
  // Conatct tab variables
  public organizationId$: Subject<any> = new Subject<any>();
  public contactRefresh$: EventEmitter<boolean> = new EventEmitter();
  private orginagarion:any;
  /** customize column for conatct tab */
   public defaultColumns = [
    // { displayname: 'Full Name', name: 'fullname' },
    // { displayname: 'Action', name: 'action' },
    { displayname: 'Email Address', name: 'email' },
    { displayname: 'Phone Number', name: 'mobile' },
    { displayname: 'State', name: 'state' },
    { displayname: 'City', name: 'city' },
    { displayname: 'Address', name: 'address' },
    { displayname: 'Notes', name: 'notes' },
    { displayname: 'Last Modified', name: 'updatedAt' },
  ];

  public agencyLogos: Logo[] = [];
  public agencyLogoPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 10
  });
  public isAgencyLogosLoading$: Subject<boolean> = new Subject<boolean>();
  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: true,
    acceptedFormats: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'xls', 'yaml', 'ppt', 'pptx','jpg','png', 'jpeg', 'svg'],
    sizeLimit: 100
  };
  public scrolling$ = new Subject();
  public submitForm$: Subject<void> = new Subject<void>();
  public contactRefresher$: Subject<any> = new Subject();
  userPermission: UserActionPermission;
  disableLogoEdit = false;
  
  constructor(
    private activeRoute: ActivatedRoute,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private recordService: RecordService,
    private cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    private associationIdentifier: AssociationsIdentifier,
    public auth: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params) => {
      this.loadAgency(params['id']);
    });
    this.reSize();
    this.userPermission = this.auth.getUserPermission(UserRole.AGENCIES);
    this.disableLogoEdit = !(this.auth?.getUserPermission(UserRole.ATTACHMENT)?.edit);
  }
  private loadAgency(agencyId) {
    this.recordService
      .getAgencyById(agencyId)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((response) => {
        if (response?._id) {
          this.agencyDetails$.next(response);
          this.agencyDetails = response;
          this.timeStampData = {
            createdBy: response.createdBy,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt,
            updatedBy: response.updatedBy
          };
          this.organizationId$.next(response?.['organizationId']);
          this.setOrginagarion();
          this.loadAgencyLogos(this.agencyDetails['organizationId']);
          this.reSize();
        } else {
          this.router.navigateByUrl(`/records-management-v2/agencies`);
          let message = 'Something went wrong, Please try again Later';
          if (response?.error?.message) {
            message = response['error']['message'];
          }
          this.showsAlertMessage(message);
        }
      });
  }

  private setOrginagarion() {
    if(this.agencyDetails?.['organizationId']){
    this.recordService
      .getOrganizationById(this.agencyDetails?.['organizationId'])
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((response) => {
        this.switchTabOnInit();
        this.orginagarion = response;
      });
    }
 }
  private loadAgencyLogos(agencyOrganizationId, nextPage = false) {
    this.isAgencyLogosLoading$.next(true);
    this.recordService
      .getAgencyLogos(
        agencyOrganizationId,
        this.agencyLogoPagination.getValues()
      )
      .pipe(
        filter((res) => !!res),
        takeUntil(this.unSubscribe)
      )
      .subscribe(
        (response: LogosListResponse) => {
          // After uploading a new logo we are refreshing the list
          this.agencyLogoPagination.updateTotal(response.pagination.total);
          if (nextPage) {
            this.agencyLogos = this.agencyLogos.concat(
              response.result.attachments
            );
          } else {
            this.agencyLogos = Helper.deepClone(response.result.attachments);
          }
          this.isAgencyLogosLoading$.next(false);
          this.cdRef.markForCheck();
        },
        (errorResponse) => {
          this.isAgencyLogosLoading$.next(false);
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

  public agencyFormChanges(agenciesGeneralForm) {
    this.agenciesGeneralForm = agenciesGeneralForm;
  }

  public switchTabOnInit() {
    const tab = this.activeRoute.snapshot.queryParamMap.get('tab');
    if (tab === 'createContacts') {
      this.selectedTab = this.tab.CONTACTS;
      this.selectedTabLabel = 'contacts_tab';
      this.openNewContact();
    } 
  }

  private showsAlertMessage(msg) {
    const config = {
      duration: 5000
    } as MatSnackBarConfig;

    this.matSnackBar.open(msg, '', config);
  }
  public reSize() {
    this.tabWindowSize = false;
    if(window.innerWidth < 1080 || this.agencyDetails?.['name']?.length>52){
      this.scrollContent = window.innerHeight - 385;
      if(window.innerWidth < 1025){
        this.tabWindowSize = true;
      }
    }else{
      this.scrollContent = window.innerHeight - 380;
      this.tabWindowSize = false;
    }

  }

public deleteAgencyAPI() {
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
        .deleteAgency(this.agencyDetails['_id'])
        .subscribe((response) => {
            this.showsAlertMessage('Agency deleted sccessfully!');
          this.router.navigateByUrl(`/records-management-v2/agencies`);
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


public deleteAgency() {
    this.recordService.getAgencyAssociation(this.agencyDetails['_id'])
    .subscribe((response) => {
      if(Object.keys(response?.associations).length > 0) {
        this.openDeleteWarningPopup();
      } else {
        this.deleteAgencyAPI();
      }
    },
    (errorResponse) => {
      if (errorResponse.error?.message) {
        this.recordService.showsAlertMessage(errorResponse.error?.message);
        return;
      } else if (errorResponse.error?.error) {
        this.recordService.showsAlertMessage(errorResponse.error?.error);
        return;
      }
      this.recordService.showsAlertMessage('Something went wrong, Please try again later');
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

  public duplicateAgency() {
    this.router.navigateByUrl(`/records-management-v2/agencies/add?agencyId=${this.agencyDetails['_id']}`);
  }

  public validateAssociationAndUpdateAgency(){
    if (!this.agenciesGeneralForm.valid) {
      this.submitForm$.next();
      return;
    }

    const PATH = `agencies/${this.agencyDetails['_id']}/associations`;
    const dialogData = {
      title: 'Edit Confirmation',
      showIcon: false,
      description: 'This record has already been used on a Campaign or Contract. Please double-check all relationships before editing any critical values.'
    };
    this.associationIdentifier.validateAssociationAndCallFunction<AgencyAssociations>(PATH, this.updateAgencyDetails.bind(this), dialogData);
  }

  public updateAgencyDetails() {
    if (this.selectedTabLabel !== 'general_Tab') {
      return;
    }
    if (!this.agenciesGeneralForm.valid) {
      this.submitForm$.next();
      return;
    }
    const payload = this.buildAddAgenciesAPIPayload();
    // Remove note while update the agency because note handle seprate enpoint
    if(typeof payload?.note != 'undefined' ){
      delete payload.note;
    }
    this.recordService
      .updateAgency(this.agencyDetails['_id'], payload, false)
      .subscribe(
        (res: any) => {
          this.showsAlertMessage('Agency updated successfully.');
          this.loadAgency(this.agencyDetails['_id']);
        },
        (errorResponse) => {
          if (errorResponse?.error?.message) {
            this.showsAlertMessage(errorResponse?.error?.message);
            return;
          }else if(errorResponse?.error?.error){
            this.showsAlertMessage(errorResponse?.error.error);
            return;
          }
          this.showsAlertMessage(
            'Something went wrong, Please try again later'
          );
        }
      );
  }
  private buildAddAgenciesAPIPayload() {
    const payload = Helper.deepClone(this.agenciesGeneralForm.value);
    // payload.organizationId = '5fb554c4a1ba8b1896021e1f';
    payload.parentAgency = payload.parentAgency?._id ?? null;
    payload.isActive = true;
    payload.type = payload.type ?? null;

    if (payload.address) {
      payload.address.state = payload.address.state?._id;
      payload.address.zipcode = payload.address.zipCode?.ZipCode ?? '';
      payload.address.line = payload.address?.address;
      delete payload.address.zipCode;
      delete payload.address.address;
    }

    if (payload.managedBy?.id) {
      payload.managedBy = payload.managedBy?.id;
    } else {
      payload.managedBy = null;
    }

    payload.diversityOwnership =
      payload.diversityOwnership && !Array.isArray(payload.diversityOwnership)
        ? [payload.diversityOwnership]
        : payload.diversityOwnership;
    if(!payload.diversityOwnership?.length){
      payload.diversityOwnership = null;
    }
    if (payload.retirementDate) {
      const retDate = new Date(payload.retirementDate);
      payload.retirementDate = format(retDate, 'MM/dd/yyyy', {
        locale: enUS
      });
    }

    if (payload.phone) {
      const phone = payload.phone;
      payload.phone = `${phone.area}${phone.exchange}${phone.subscriber}`;
    }

    if (payload.fax) {
      const fax = payload.fax;
      payload.fax = `${fax.area}${fax.exchange}${fax.subscriber}`;
    }
    if (payload.billing?.media) {
      payload.billing['media'] = Number(payload.billing?.media).toString();
    }
    if (payload.oohRevenue?.media) {
      payload.oohRevenue['media'] = Number(payload.oohRevenue?.media).toString();
    }
    if (payload?.install) {
      payload.install = Number(payload.install).toString();
    }
    if (payload?.OIRev) {
      payload.OIRev = Number(payload.OIRev).toString();
    }
    payload.current = payload?.current ?? null;

    return payload;
  }

  public onSelectedTabChange(e) {
    this.selectedTab = e.index;
    this.selectedTabLabel = e?.tab?.ariaLabel;
    if(this.selectedTabLabel == 'contacts_tab'){
      this.contactRefresher$.next({ openContactTab: true });
    }
  }

  public openNewContact(contact:Contact = null, isDetails = false, isDuplicate = false) {

    const dialogData = {
      isNewConatct: contact?._id != null ? false : true,
      enableDialog: true,
      title: 'ADDING NEW CONTACT',
      organization: this.orginagarion,
      company: {
        ...this.agencyDetails,
        phone: this.agencyDetails?.['phone'],
        email: this.agencyDetails?.['email'],
        fax: this.agencyDetails?.['fax']
      },
      contact: contact,
      enableDetails: isDetails,
      isDuplicate: isDuplicate,
      permission: this.auth.getUserPermission(UserRole.CONTACTS)
    };
    if(this.orginagarion || !this.agencyDetails?.['organizationId']) {
      this.openContactDialog(dialogData);
    }else{
      this.recordService
      .getOrganizationById(this.agencyDetails?.['organizationId'])
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((response) => {
        this.orginagarion = response;
        dialogData.organization = response;
        this.openContactDialog(dialogData);
      });
    }

  }

  /** To open add, duplicate or Edit conatct based on seelcted vendor*/
  private openContactDialog(dialogData){
    let panelClassName = ['add-conatct-container-dialog'];
    if(dialogData?.isNewConatct){
      panelClassName =['add-conatct-container-dialog', 'new-contact-bottomsheet'];
    }
    this.dialog
      .open(AddContactComponent, {
        height: '570px',
        data: dialogData,
        width: '700px',
        closeOnNavigation: true,
        panelClass: panelClassName,
        disableClose: true
      })
      .afterClosed()
      .subscribe((result) => {
        if(result?.data?.id || result?.['changes']){
          this.contactRefresh$.emit(true);
        }
      });
  }

  public openContactEmit(contact:Contact) {
    this.openNewContact(contact, true);
  }

  public openDuplicateContactEmit(contact:Contact){
    this.openNewContact(contact, false, true);
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  public createLogo(data) {
    const filesStatuses = data.status;
    if (data?.files?.length) {
      const filesInfo = [];
      data.files.forEach((file, index) => {
        this.recordService
          .uploadAgencyLogo(
            this.agencyDetails['organizationId'],
            file.fileFormData
          )
          .subscribe(
            (response) => {
              filesStatuses[file['fileName']]['inProgress'] = false;
              this.uploadInProgress$.next(filesStatuses);
              filesInfo.push(file['fileName']);
              if (filesInfo.length === data.files.length) {
                // clear all uploaded file info
                this.clearAttachment$.next(true);
                this.agencyLogoPagination.resetPagination();
                this.loadAgencyLogos(this.agencyDetails['organizationId']);
              }
              this.showsAlertMessage(`${file.fileName} added successfully!.`);
            },
            (errorResponse) => {
              filesInfo.push(file['fileName']);
              if (filesInfo.length === data.files.length) {
                // clear all uploaded file info
                this.clearAttachment$.next(true);
                this.loadAgencyLogos(this.agencyDetails['organizationId']);
              }
              if (errorResponse.error?.message) {
                this.showsAlertMessage(errorResponse.error?.message);
                return;
              }
              this.showsAlertMessage(
                'Something went wrong, Please try again later'
              );
            }
          );
      });
    }
  }
  public deleteLogo(logo: Logo) {
    this.recordService
      .deleteAgencyLogo(this.agencyDetails['organizationId'], logo['key'])
      .subscribe(
        (response) => {
          this.showsAlertMessage(`${logo.name} deleted successfully!.`);
          const index = this.agencyLogos.findIndex(
            (logoInfo: Logo) => logoInfo._id === logo._id
          );
          this.agencyLogos.splice(index, 1);
          this.agencyLogos = Helper.deepClone(this.agencyLogos);
          this.cdRef.markForCheck();
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

  public loadMoreLogos() {
    if (this.agencyLogoPagination.isPageSizeReachedTotal()) {
      this.isAgencyLogosLoading$.next(false);
      this.cdRef.markForCheck();
      return;
    }
    this.agencyLogoPagination.moveNextPage();
    this.loadAgencyLogos(this.agencyDetails['organizationId'], true);
  }

  public handleScroll(){
    this.scrolling$.next();
  }

  get contactsAccess() {
    return !!this.auth.getUserPermission(UserRole.CONTACTS);
  }

  get logosAccess() {
    return !!this.auth.getUserPermission(UserRole.ATTACHMENT);
  }
}
