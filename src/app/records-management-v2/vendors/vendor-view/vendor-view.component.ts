import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy, ChangeDetectorRef,
  EventEmitter
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { VendorService } from '../vendor.service';
import { Vendor } from '@interTypes/inventory-management';
import { FormGroup } from '@angular/forms';
import { TimeStamp } from '@interTypes/time-stamp';
import { RecordService } from '../../record.service';
import { Helper } from '../../../classes';
import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { MatDialog } from '@angular/material/dialog';
import { AddContactComponent } from '../../contacts/add-contact/add-contact.component';
import { Contact, Logo, LogosListResponse } from '@interTypes/records-management';
import { UseRecordPagination } from 'app/records-management-v2/useRecordPagination';
import { FileUploadConfig } from '@interTypes/file-upload';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { AuthenticationService } from '@shared/services/authentication.service';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { AssociationsIdentifier } from 'app/classes/associations-identifier';
import { VendorsAssociations } from '@interTypes/associations/vendor-associations';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
import { LocalStorageKeys, UserRoleTypes } from '@interTypes/enums';

@Component({
  selector: 'app-vendor-view',
  templateUrl: './vendor-view.component.html',
  styleUrls: ['./vendor-view.component.less'],
  providers: [
    AssociationsIdentifier
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorViewComponent implements OnInit, OnDestroy {
  public vendorDetails$ = new BehaviorSubject(null);
  public vendorDetails: Vendor = {};
  public scrollContent: number;
  public selectedTab = 0;
  public selectedTabLabel = 'general_Tab';
  public tab = Object.freeze({
    GENERAL: 0,
    CONTACTS: 1,
    ATTACHMENTS: 2,
    SHIPPING_ADDRESS: 3
  });
  generalForm: FormGroup;
  private unSubscribe: Subject<void> = new Subject<void>();
  public timeStampData = {} as TimeStamp;
  public organizationId$: Subject<any> = new Subject<any>();
  public contactRefresh$: EventEmitter<boolean> = new EventEmitter();
  private orginagarion: any;
  public shipingAddressRef = null;
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
  public tabWindowSize = false;

  public uploadInProgress$: Subject<any> = new Subject<any>();
  public clearAttachment$: Subject<any> = new Subject<any>();
  public vendorAttachments: Logo[] = [];
  public vendorAttachmentsPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 20
  });
  public isvendorAttachmentsLoading$: Subject<boolean> = new Subject<boolean>();
  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: true,
    acceptedFormats: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'xls', 'yaml', 'ppt', 'pptx','jpg','png', 'jpeg', 'svg'],
    sizeLimit: 100
  };
  public shippingAddressSubmitForm$: Subject<void> = new Subject<void>();
  public scrolling$ = new Subject();
  public vendorNameLength = 95;
  public contactRefresher$: Subject<any> = new Subject();
  public disableEdit = false;
  readonly permissionKey = Object.freeze({
    ATTACHMENT: 'attachment',
  });
  userPermission: UserActionPermission;
  public addShippingAddress$: Subject<any> = new Subject<any>();
  public disableFormActions = true;

  constructor(
    private activeRoute: ActivatedRoute,
    public vendorService: VendorService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private recordService: RecordService,
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private auth: AuthenticationService,
    private associationIdentifier: AssociationsIdentifier,
  ) {
  }

  ngOnInit(): void {
    this.userPermission = this.auth.getUserPermission(UserRole.VENDOR_GENERAL);
    this.activeRoute.params.pipe(
      takeUntil(this.unSubscribe)
    ).subscribe((params) => {
      this.loadVendor(params['id']);
      // this.switchTabOnInit();
    });
    this.reSize();
    this.checkForEditPermission();    
  }
  
  private checkForEditPermission() {
    const userPermission  = this.auth.getUserPermission(this.permissionKey.ATTACHMENT);
    if (!userPermission?.edit) {
      this.disableEdit = true;
    }
  }

  get contactsAccess() {
    return !!this.auth.getUserPermission(UserRole.CONTACTS);
  }

  get logosAccess() {
    return !!this.auth.getUserPermission(UserRole.ATTACHMENT);
  }

  get generalAccess() {
    return !!this.auth.getUserPermission(UserRole.VENDOR_GENERAL);
  }

  get shippingAccess() {
    return !!this.auth.getUserPermission(UserRole.VENDOR_SHIPPING);
  }

  onSelectedTabChange(e) {
    this.selectedTab = e.index;
    this.selectedTabLabel = e?.tab?.ariaLabel;
    if(this.selectedTabLabel == 'shipping_address_tab'){
      this.shipingAddressRef = 'vendor-tabs-scroll_SHIPPING_ADDRESS';
    }
    this.vendorNameLength = 95;

    if (window.innerWidth < 1100) {
        this.vendorNameLength = 50;
    }else{
      if(this.selectedTabLabel == 'contacts_tab'){
        this.vendorNameLength = 86;
      }
    }

    if(this.selectedTabLabel == 'contacts_tab'){
      this.contactRefresher$.next({ openContactTab: true });
    }

    
  }

  private loadVendor(vendorId) {
    this.recordService
      .getVendorById(vendorId, false)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((response) => {
        if (response?._id) {
          this.vendorDetails$.next(response);
          this.vendorDetails = response;
          this.timeStampData = {
            createdBy: response.createdBy,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt,
            updatedBy: response.updatedBy
          };
          this.loadVendorAttachments(response['organizationId']);
          this.setOrginagarion();
          this.organizationId$.next(response?.['organizationId']);
          this.reSize();
          this.checkManagerPermission();
        } else {
          this.router.navigateByUrl(`/records-management-v2/vendors`);
          let message = 'Something went wrong, Please try again later';
          if (response?.error?.message) {
            message = response['error']['message'];
          }
          this.showsAlertMessage(message);
        }
      });
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  private setOrginagarion() {
    if (this.vendorDetails?.['organizationId']) {
      this.recordService
        .getOrganizationById(this.vendorDetails?.['organizationId'])
        .pipe(takeUntil(this.unSubscribe))
        .subscribe((response) => {
          this.orginagarion = response;
          this.switchTabOnInit();
        });
    }
  }

  validateGivenTabForm(tabIndex: number): boolean {
    switch (tabIndex) {
      case this.tab.GENERAL:
        return this.generalForm?.valid;
        break;
      case this.tab.SHIPPING_ADDRESS:
        return true;
        break;
      default:
        return false;
    }
  }

  get validateCurrentForm(): boolean {
    return this.validateGivenTabForm(this.selectedTab);
  }

  public updateGeneralForm(generalForm) {
    this.generalForm = generalForm;
  }

  public deleteVendorAPI() {
    if (this.vendorDetails !== null) {
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
              .deleteVendorBy(this.vendorDetails['_id'])
              .subscribe((response) => {
                  if (response.status == 'success') {
                    this.showsAlertMessage('Vendor deleted successfully!');
                    this.router.navigateByUrl(`/records-management-v2/vendors`);
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
                }
              );
          }
        });
    }
  }
  public deleteVendor() {
    this.recordService.getVendorAssociation(this.vendorDetails['_id'])
      .subscribe((response) => {
        if(Object.keys(response?.associations).length > 0) {
          this.openDeleteWarningPopup();
        } else {
          this.deleteVendorAPI();
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

  public duplicateVendor() {
    this.router.navigateByUrl(
      `/records-management-v2/vendors/add?vendorId=${this.vendorDetails._id}`
    );
  }

  public reSize() {
    if (window.innerWidth < 1100 || this.vendorDetails?.name?.length>50) {
      this.scrollContent = window.innerHeight - 390;
      this.tabWindowSize = true;
      this.vendorNameLength = window.innerWidth < 1100 ? 70 : 96;
    } else {
      this.scrollContent = window.innerHeight - 340;
      this.tabWindowSize = false;
    }
  }

  public validateAssociationAndUpdateVendor(){
    if (!this.validateCurrentForm) return;
    
    if (this.selectedTabLabel === 'shipping_address_tab') {
      this.shippingAddressSubmitForm$.next();
      return;
    }
    
    const PATH = `vendors/${this.vendorDetails?._id}/associations`;
    const dialogData = {
      title: 'Edit Confirmation',
      showIcon: false,
      description: 'This record has already been used on a Campaign or Contract. Please double-check all relationships before editing any critical values.'
    };
    this.associationIdentifier.validateAssociationAndCallFunction<VendorsAssociations>(PATH, this.updateVendorDetails.bind(this), dialogData)
  }
  
  public updateVendorDetails() {
    if (!this.validateCurrentForm) return;
    
    if (this.selectedTabLabel === 'shipping_address_tab') {
      this.shippingAddressSubmitForm$.next();
    } else {
      if (!this.generalForm.value) {
        this.showsAlertMessage('Something went wrong, Please try again later');
        return;
      }
      const payload = this.buildAddVendorAPIPayload();
      this.recordService
        .updateVendor(this.vendorDetails._id, payload, false)
        .subscribe(
          (res: any) => {
            if (res.status === 'success') {
              this.showsAlertMessage(res.message);
              this.loadVendor(this.vendorDetails._id);
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
  }

  private showsAlertMessage(msg) {
    const config = {
      duration: 5000
    } as MatSnackBarConfig;

    this.matSnackBar.open(msg, '', config);
  }

  /**
   * @description
   *  This method is used to build the vendor creation api
   *  request payload
   */
  private buildAddVendorAPIPayload() {
    const payload = Helper.deepClone(this.generalForm.value.basicDetails);

    payload.parentCompany = payload.parentCompany?._id ?? null;
    payload.type =
      payload.type && !Array.isArray(payload.type)
        ? [payload.type]
        : payload.type;

    payload.diversityOwnership =
      payload.diversityOwnership && !Array.isArray(payload.diversityOwnership)
        ? [payload.diversityOwnership]
        : payload.diversityOwnership;

    if (payload.address) {
      payload.city = payload.address.city;
      payload.state = payload.address.state?._id;
      payload.zipcode = payload.address.zipCode?.ZipCode ?? '';
      payload.address = payload.address.address;
    }

    if (payload.retirementDate) {
      const retDate = new Date(payload.retirementDate);
      payload.retirementDate = format(retDate, 'MM/dd/yyyy', {
        locale: enUS
      });
    }

    if (payload.businessPhone) {
      const businessPhone = payload.businessPhone;
      payload.businessPhone = `${businessPhone.area}${businessPhone.exchange}${businessPhone.subscriber}`;
    }

    if (payload.businessFax) {
      const businessFax = payload.businessFax;
      payload.businessFax = `${businessFax.area}${businessFax.exchange}${businessFax.subscriber}`;
    }

    if (Array.isArray(payload.uploadInstruction)) {
      delete payload.uploadInstruction;
    }

    if (Array.isArray(payload.instructionUrl)) {
      delete payload.instructionUrl;
    }

    payload.doNotUseFlag = this.generalForm.value?.doNotUseFlag;
    payload.currentFlag = this.generalForm.value?.currentFlag;
    payload.opsApprovedFlag = this.generalForm.value?.opsApprovedFlag;
    return Helper.removeEmptyOrNullRecursive(payload);
  }

  public openNewContact(contact: Contact = null, isDetails = false, isDuplicate = false) {

    const company = {
      ...this.vendorDetails,
      address: {
        line: this.vendorDetails?.['address'],
        state: this.vendorDetails?.state,
        zipcode: this.vendorDetails?.['zipcode'],
        city: this.vendorDetails?.city
      },
      phone: this.vendorDetails?.['businessPhone'],
      email: this.vendorDetails?.['email'],
      fax: this.vendorDetails?.['businessFax']
    };

    const dialogData = {
      isNewConatct: contact?._id != null ? false : true,
      enableDialog: true,
      title: 'ADDING NEW CONTACT',
      organization: this.orginagarion,
      company,
      contact: contact,
      enableDetails: isDetails,
      isDuplicate: isDuplicate,
      permission: this.auth.getUserPermission(UserRole.CONTACTS)
    };
    if (this.orginagarion || !this.vendorDetails?.['organizationId']) {
      this.openContactDialog(dialogData);
    } else {
      this.recordService
        .getOrganizationById(this.vendorDetails?.['organizationId'])
        .pipe(takeUntil(this.unSubscribe))
        .subscribe((response) => {
          this.orginagarion = response;
          dialogData.organization = response;
          this.openContactDialog(dialogData);
        });
    }

  }

  /** To open add, duplicate or Edit conatct based on seelcted vendor*/
  private openContactDialog(dialogData) {
    let panelClassName = ['add-conatct-container-dialog'];
    if (dialogData?.isNewConatct) {
      panelClassName = ['add-conatct-container-dialog', 'new-contact-bottomsheet'];
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
        if (result?.data?.id || result?.['changes']) {
          this.contactRefresh$.emit(true);
        }
      });
  }

  public openContactEmit(contact: Contact) {
    this.openNewContact(contact, true);
  }

  public openDuplicateContactEmit(contact: Contact) {
    this.openNewContact(contact, false, true);
  }

  private loadVendorAttachments(vendorOrganizationId, nextPage = false) {
    this.isvendorAttachmentsLoading$.next(true);
    this.recordService
      .getVendorAttachments(
        vendorOrganizationId,
        this.vendorAttachmentsPagination.getValues()
      )
      .pipe(
        filter((res) => !!res),
        takeUntil(this.unSubscribe)
      )
      .subscribe(
        (response: LogosListResponse) => {
          // After uploading a new logo we are refreshing the list
          this.vendorAttachmentsPagination.updateTotal(
            response.pagination.total
          );
          if (nextPage) {
            this.vendorAttachments = this.vendorAttachments.concat(
              response.result.attachments
            );
          } else {
            this.vendorAttachments = Helper.deepClone(
              response.result.attachments
            );
          }
          this.isvendorAttachmentsLoading$.next(false);
          this.cdRef.markForCheck();
        },
        (errorResponse) => {
          this.isvendorAttachmentsLoading$.next(false);
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

  public createAttachment(data) {
    const filesStatuses = data.status;
    if (data?.files?.length) {
      const filesInfo = [];
      data.files.forEach((file, index) => {
        this.recordService
          .uploadVendorAttachment(
            this.vendorDetails['organizationId'],
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
                this.vendorAttachmentsPagination.resetPagination();
                this.loadVendorAttachments(
                  this.vendorDetails['organizationId']
                );
              }
              this.showsAlertMessage(`${file.fileName} added successfully!.`);
            },
            (errorResponse) => {
              filesInfo.push(file['fileName']);
              if (filesInfo.length === data.files.length) {
                // clear all uploaded file info
                this.clearAttachment$.next(true);
                this.loadVendorAttachments(
                  this.vendorDetails['organizationId']
                );
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

  public deleteAttachment(logo: Logo) {
    this.recordService
      .deleteVendorAttachment(this.vendorDetails['organizationId'], logo['key'])
      .subscribe(
        (response) => {
          this.showsAlertMessage(`${logo.name} deleted successfully!.`);
          const index = this.vendorAttachments.findIndex(
            (logoInfo: Logo) => logoInfo._id === logo._id
          );
          this.vendorAttachments.splice(index, 1);
          this.vendorAttachments = Helper.deepClone(this.vendorAttachments);
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

  public loadMoreAttachments() {
    if (this.vendorAttachmentsPagination.isPageSizeReachedTotal()) {
      this.isvendorAttachmentsLoading$.next(false);
      this.cdRef.markForCheck();
      return;
    }
    this.vendorAttachmentsPagination.moveNextPage();
    this.loadVendorAttachments(this.vendorDetails['organizationId'], true);
  }

  public removeAutocompleteFocus() {
    let element = document.querySelector('.mat-autocomplete-panel');

    if (element) {
      element.parentNode.removeChild(element);
    }
  }
  public switchTabOnInit() {
    const tab = this.activeRoute.snapshot.queryParamMap.get('tab');
    if (tab === 'createContacts') {
      this.selectedTab = 1;
      this.selectedTabLabel = 'contacts_tab';
      this.openNewContact();
    } else if (tab == 'createShippingAddress') {
      this.selectedTab = 4;
      this.selectedTabLabel = 'shipping_address_tab';
      if (this.vendorDetails?.shippingAddress.length > 0) {
        this.addNewShippingAddress();
      }
    }
  }
  public addNewShippingAddress() {
    this.addShippingAddress$.next(true);
    this.addShippingAddress$.next(false);
  }

  /*
   * method to add Action btnpermission based on ROLE 
   */
  private checkManagerPermission() {
    const userData = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DATA));
    const userRoleData = (userData?.[LocalStorageKeys.USER_ROLE]) ? userData?.[LocalStorageKeys.USER_ROLE] : [];
    const isMangerPermission = (userRoleData && Array.isArray(userRoleData)) ? userRoleData.includes(UserRoleTypes.VENDOR_MANAGER_ROLE) : true;
    this.disableFormActions = this.vendorDetails.opsApprovedFlag && !isMangerPermission;
  }
}
