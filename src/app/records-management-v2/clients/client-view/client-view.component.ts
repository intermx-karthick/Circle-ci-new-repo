import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  EventEmitter,
  Input,
  ViewChild
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { filter, map, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { RecordService } from '../../record.service';
import { TimeStamp } from '@interTypes/time-stamp';
import { AssociationsIdentifier, Helper } from '../../../classes';
import { VendorService } from '../../vendors/vendor.service';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { AddContactComponent } from '../../contacts/add-contact/add-contact.component';
import {
  Contact,
  Logo,
  LogosListResponse
} from '@interTypes/records-management';
import { LazyLoaderService } from '@shared/custom-lazy-loader';
import {
  ClientAccountingPayload,
  ClientsAccountDetails
} from '@interTypes/records-management';
import { AddClientComponent } from '../add-client/add-client.component';
import { AddProductComponent } from '../add-product/add-product.component';
import { AddEstimateComponent } from '../add-estimate/add-estimate.component';
import { UseRecordPagination } from '../../useRecordPagination';
import { FileUploadConfig } from '@interTypes/file-upload';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { TabLinkType } from '@shared/services/tab-link-handler';
import { AuthenticationService } from '@shared/services/authentication.service';
import { EstimateListComponent } from '../estimate-list/estimate-list.component'
import { ClinetAssociations } from '@interTypes/associations';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
import { LocalStorageKeys, UserRoleTypes } from '@interTypes/enums';

@Component({
  selector: 'app-client-view',
  templateUrl: './client-view.component.html',
  styleUrls: ['./client-view.component.less'],
  providers: [
    AssociationsIdentifier
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientViewComponent implements OnInit {
  public scrollContent: number;
  public selectedTab = 0;
  public tab = Object.freeze({
    GENERAL: 0,
    ACCOUNTING: 1,
    PRODUCTS: 2,
    CONTACTS: 3
  });
  public selectedTabLabel = 'general_Tab';

  public generalForm: FormGroup;
  public accountingForm: FormGroup;
  public timeStampData = {} as TimeStamp;
  public clientDetails$ = new BehaviorSubject(null);
  public clientDetails: ClientDetailsResponse = {} as ClientDetailsResponse;
  public submitForm$: Subject<void> = new Subject<void>();
  public submitAccountForm$: Subject<void> = new Subject<void>();
  public clientAccountingDetails: ClientsAccountDetails;

  public clientProductsLazyLoader = new LazyLoaderService();
  public clientAccountingLazyLoader = new LazyLoaderService();

  //Contact tab variables
  public organizationId$: Subject<any> = new Subject<any>();
  public contactRefresh$: EventEmitter<boolean> = new EventEmitter();
  public productsRefresher$: Subject<any> = new Subject();
  public estimateRefresher$: Subject<any> = new Subject();

  private orginagarion: any;
  public clientId: string;

  // customize column for contact tab
  public defaultColumns = [
    //{ displayname: 'Full Name', name: 'fullname' },
    //{ displayname: 'Action', name: 'action' },
    { displayname: 'Email Address', name: 'email' },
    { displayname: 'Phone Number', name: 'mobile' },
    { displayname: 'State', name: 'state' },
    { displayname: 'City', name: 'city' },
    { displayname: 'Address', name: 'address' },
    { displayname: 'Notes', name: 'notes' },
    { displayname: 'Last Modified', name: 'updatedAt' },
  ];
  public tabWindowSize = false;

  public agencyLogos: Logo[] = [];
  public clientLogoPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 10
  });
  public isClientLogosLoading$: Subject<boolean> = new Subject<boolean>();
  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: true,
    acceptedFormats: [
      'pdf',
      'doc',
      'docx',
      'txt',
      'csv',
      'xlsx',
      'xls',
      'yaml',
      'ppt',
      'pptx',
      'jpg',
      'png',
      'jpeg',
      'svg'
    ],
    sizeLimit: 100
  };
  public uploadInProgress$: Subject<any> = new Subject<any>();
  public clearAttachment$: Subject<any> = new Subject<any>();

  public scrolling$ = new Subject();

  private unSubscribe: Subject<void> = new Subject<void>();
  public accountTabSelectId = null;
  public contactRefresher$: Subject<any> = new Subject();
  public disableEdit = false;
  readonly permissionKey = Object.freeze({
    ATTACHMENT: 'attachment',
  });
  userPermission: UserActionPermission;
  @ViewChild('estimateList') estimateList: EstimateListComponent;
  public disableFormActions = true;

  constructor(
    private activeRoute: ActivatedRoute,
    public vendorService: VendorService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private recordService: RecordService,
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog,
    public bottomSheet: MatBottomSheet,
    private auth: AuthenticationService,
    private associationIdentifier: AssociationsIdentifier,
  ) {}

  public ngOnInit(): void {
    this.buildForm();

    this.activeRoute.params
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((params) => {
        this.loadClient(params['id']);
        this.clientId = params['id'];
        // this.switchTabOnInit();
        this.loadClientAccountDetails(this.clientId);
      });

    this.reSize();
    this.checkForEditPermission();

  }

  get contactsAccess() {
    return !!this.auth.getUserPermission(UserRole.CONTACTS);
  }

  get logosAccess() {
    return !!this.auth.getUserPermission(UserRole.ATTACHMENT);
  }

  get generalAccess() {
    return !!this.auth.getUserPermission(UserRole.CLIENT_GENERAL);
  }

  get accountingAccess() {
    return !!this.auth.getUserPermission(UserRole.CLIENT_ACCOUNTING);
  }

  get productsAccess() {
    return !!this.auth.getUserPermission(UserRole.CLIENT_PRODUCT);
  }

  get estimateAccess() {
    return !!this.auth.getUserPermission(UserRole.CLIENT_ESTIMATE);
  }


  private checkForEditPermission() {
    const userPermission = this.auth.getUserPermission(this.permissionKey.ATTACHMENT);
    if (!userPermission?.edit) {
      this.disableEdit = true;
    }
    this.userPermission = this.auth.getUserPermission(UserRole.CLIENT_GENERAL);

  }
  public ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  public onSelectedTabChange(e) {
    this.selectedTab = e.index;
    this.selectedTabLabel = e?.tab?.ariaLabel;
    this.onTabChange(e);
    if (this.selectedTabLabel == 'accounting_tab') {
      this.accountTabSelectId = 'client_scroll_ACCOUNTING_TAB';
    } else {
      this.accountTabSelectId = null;
    }
    if(this.selectedTabLabel == 'contacts_tab'){
      this.contactRefresher$.next({ openContactTab: true });
    }

    // Check if estimate tabe is open
    if(this.selectedTabLabel == 'estiates_tab'){
      this.estimateRefresher$.next({ openEstimateTab: true });
    }
  }

  public validateGivenTabForm(tabIndex: number): boolean {
    switch (tabIndex) {
      case this.tab.GENERAL:
        this.cdRef.markForCheck();
        return this.generalForm?.valid;

      case this.tab.ACCOUNTING:
        this.cdRef.markForCheck();
        return this.accountingForm?.valid;
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

  public duplicate() {
    this.router.navigateByUrl(
      `/records-management-v2/clients/add?clientId=${this.clientDetails._id}`
    );
  }

  public deleteClientAPI() {
    this.dialog
    .open(DeleteConfirmationDialogComponent, {
      width: '340px',
      height: '260px',
      panelClass: 'imx-mat-dialog'
    })
    .afterClosed()
    .subscribe((res) => {
      if (res && res['action']) {
        this.recordService.deleteClient(this.clientDetails?._id).subscribe(
          (response) => {
            this.recordService.showsAlertMessage(
              'Client deleted successfully!'
            );
            this.router.navigateByUrl(`/records-management-v2/clients`);
          },
          (errorResponse) => {
            if (errorResponse.error?.message) {
              this.recordService.showsAlertMessage(
                errorResponse.error?.message
              );
              return;
            } else if (errorResponse.error?.error) {
              this.recordService.showsAlertMessage(
                errorResponse.error?.error
              );
              return;
            }
            this.recordService.showsAlertMessage(
              'Something went wrong, Please try again later'
            );
          }
        );
      }
    });
  }
  public delete() {
    this.recordService.getClientAssociation(this.clientDetails?._id)
    .subscribe((response) => {
      if(Object.keys(response?.associations).length > 0) {
        this.openDeleteWarningPopup();
      } else {
        this.deleteClientAPI();
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

  public reSize() {
    if (window.innerWidth < 1100) {
      this.scrollContent = window.innerHeight - 390;
      this.tabWindowSize = true;
    } else {
      this.scrollContent = window.innerHeight - 360;
      this.tabWindowSize = false;
    }
  }

  public onTabChange($event: MatTabChangeEvent) {
    switch ($event.index) {
      case this.tab.ACCOUNTING:
        this.clientAccountingLazyLoader.triggerInitialLoad();
        break;

      case this.tab.PRODUCTS:
        this.clientProductsLazyLoader.triggerInitialLoad(); // it will trigger only on first time
        break;
    }
  }

  public validateAssociationAndUpdateClient(){
    const PATH = `clients/${this.clientId}/associations`;
    const dialogData = {
      title: 'Edit Confirmation',
      showIcon: false,
      description: 'This record has already been used on a Campaign or Contract. Please double-check all relationships before editing any critical values.'
    };
    this.associationIdentifier.validateAssociationAndCallFunction<ClinetAssociations>(PATH, this.updateClientDetails.bind(this), dialogData);
  }


  public save() {
    switch (this.selectedTab) {
      case this.tab.GENERAL:
        this.validateAssociationAndUpdateClient();
        break;
      case this.tab.ACCOUNTING:
        this.updateClientAccountingDetails();
        break;

      default:
        return false;
    }
  }

  public updateClientDetails() {
    if (this.generalForm.invalid) {
      this.submitForm$.next();
      return;
    }

    if (!this.generalForm.value) {
      this.recordService.showsAlertMessage(
        'Something went wrong, Please try again later'
      );

      return;
    }

    const payload = AddClientComponent.buildCreateClientPayload(
      this.generalForm.value.clientForm
    );
    /** client update no need to send note values */
    if (typeof payload?.['notes'] != 'undefined') {
      delete payload.notes;
    }
    this.recordService
      .updateClient(this.clientDetails._id, payload, false)
      .subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.recordService.showsAlertMessage(res.message);
            this.loadClient(this.clientDetails._id);
          }
        },
        (errorResponse) => {
          if (errorResponse.error?.message) {
            this.recordService.showsAlertMessage(errorResponse.error?.message);
          } else if (errorResponse.error?.error) {
            this.recordService.showsAlertMessage(errorResponse.error?.error);
          } else {
            this.recordService.showsAlertMessage(
              'Something went wrong, Please try again later'
            );
          }
        }
      );
  }

  private loadClient(clientId) {
    this.recordService
      .getClient(clientId, false)
      .subscribe((response: ClientDetailsResponse) => {
        if (response?._id) {
          this.clientDetails$.next(response);
          this.clientId = response?._id;
          this.clientDetails = response;
          this.timeStampData = {
            createdBy: response.createdBy,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt,
            updatedBy: response.updatedBy
          };
          this.organizationId$.next(response?.['organizationId']);
          this.updateGeneralFormData(response);
          this.setOrginagarion();
          this.loadClientLogos(this.clientDetails['organizationId']);
          this.checkManagerPermission();
        } else {
          this.router.navigateByUrl(`/records-management-v2/clients`);
          let message = 'Something went wrong, Please try again later';
          if (response['error'].message) {
            message = response['error']['message'];
          }
          this.recordService.showsAlertMessage(message);
        }
      });
  }

  private setOrginagarion() {
    if (this.clientDetails?.['organizationId']) {
      this.recordService
        .getOrganizationById(this.clientDetails?.['organizationId'])
        .pipe(takeUntil(this.unSubscribe))
        .subscribe((response) => {
          this.orginagarion = response;
          this.switchTabOnInit();
        });
    }
  }

  private buildForm() {
    this.generalForm = this.fb.group({
      clientForm: [null]
    });

    this.accountingForm = this.fb.group({
      clientAccounting: [null]
    });
  }

  private updateGeneralFormData(client) {
    this.generalForm.patchValue({
      clientForm: client
    });
  }

  private updateAccountFormData(clientAccount) {
    this.accountingForm.patchValue({
      clientAccounting: { ...clientAccount }
    });
  }

  private loadClientAccountDetails(clientId: string) {
    this.recordService
      .getClientAccounting(clientId, false)
      .pipe(filter((res) => !!res))
      .subscribe((res: ClientsAccountDetails) => {
        this.clientAccountingDetails = res;
        this.updateAccountFormData(res);
      });
  }

  public updateClientAccountingDetails() {
    if (this.accountingForm.invalid) {
      this.submitAccountForm$.next();
      return;
    }

    if (!this.accountingForm.value) {
      this.recordService.showsAlertMessage(
        'Something went wrong, Please try again later'
      );

      return;
    }

    const acId = this.clientAccountingDetails?._id;
    const payload = this.buildUpdateAccountingAPIPayload();
    this.recordService
      .updateClientAccounting(this.clientDetails._id, acId, payload, false)
      .subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.recordService.showsAlertMessage(res.message);
            this.loadClientAccountDetails(this.clientDetails._id);
            this.loadClient(this.clientDetails._id);
          }
        },
        (errorResponse) => {
          if (errorResponse.error?.message) {
            this.recordService.showsAlertMessage(errorResponse.error?.message);
            return;
          }
          this.recordService.showsAlertMessage(
            'Something went wrong, Please try again later'
          );
        }
      );
  }

  public openNewContact(
    contact: Contact = null,
    isDetails = false,
    isDuplicate = false
  ) {
    const dialogData = {
      isNewConatct: contact?._id != null ? false : true,
      enableDialog: true,
      title: 'ADDING NEW CONTACT',
      organization: this.orginagarion,
      company: {
        ...this.clientDetails,
        phone: this.clientDetails?.['phone'],
        email: this.clientDetails?.['companyEmail'],
        fax: this.clientDetails?.['fax']
      },
      contact: contact,
      enableDetails: isDetails,
      isDuplicate: isDuplicate,
      permission: this.auth.getUserPermission(UserRole.CONTACTS)
    };
    if (this.orginagarion || !this.clientDetails?.['organizationId']) {
      this.openContactDialog(dialogData);
    } else {
      this.recordService
        .getOrganizationById(this.clientDetails?.['organizationId'])
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
      panelClassName = [
        'add-conatct-container-dialog',
        'new-contact-bottomsheet'
      ];
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

  private buildUpdateAccountingAPIPayload(): ClientAccountingPayload {
    const payload: any = Helper.deepClone(
      this.accountingForm.value?.clientAccounting
    );
    if (!payload) return null;

    if (payload.billingCompany) {
      payload.billingCompany = payload.billingCompany?.['_id'];
    }
    if (payload.vendorPayableCompany) {
      payload.vendorPayableCompany = payload.vendorPayableCompany?.['_id'];
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
    if (payload.vendorCompany) {
      payload.vendorCompany = payload.vendorCompany?.['_id'];
    }
    return Helper.removeEmptyArrayAndEmptyObject(
      Helper.removeEmptyOrNull(payload)
    );
  }

  public openNewProduct() {
    this.bottomSheet
      .open(AddProductComponent, {
        data: {
          client: this.clientDetails,
          clientAccountingDetails: this.clientAccountingDetails
        },
        disableClose: true,
        panelClass: 'add-product__panel'
      })
      .afterDismissed()
      .subscribe((res) => {
        if (!res) return;
        this.resetClientProducts();
        this.productsRefresher$.next({ load: true });
      });
  }

  public openNewEstimate() {
    this.bottomSheet
      .open(AddEstimateComponent, {
        data: {
          client: this.clientDetails,
          clientId: this.clientId
        },
        disableClose: true,
        panelClass: 'add-estimate__panel'
      })
      .afterDismissed()
      .subscribe((res) => {
        if (!res) return;
        this.estimateRefresher$.next({ load: true });
      });
  }

  private loadClientLogos(organizationId, nextPage = false) {
    this.isClientLogosLoading$.next(true);
    this.recordService
      .getClientLogos(organizationId, this.clientLogoPagination.getValues())
      .pipe(
        filter((res) => !!res),
        takeUntil(this.unSubscribe)
      )
      .subscribe(
        (response: LogosListResponse) => {
          // After uploading a new logo we are refreshing the list        tbd: [false],

          this.clientLogoPagination.updateTotal(response.pagination.total);
          if (nextPage) {
            this.agencyLogos = this.agencyLogos.concat(
              response.result.attachments
            );
          } else {
            this.agencyLogos = Helper.deepClone(response.result.attachments);
          }
          this.isClientLogosLoading$.next(false);
          this.cdRef.markForCheck();
        },
        (errorResponse) => {
          this.isClientLogosLoading$.next(false);
          if (errorResponse.error?.message) {
            this.recordService.showsAlertMessage(errorResponse.error?.message);
            return;
          }
          this.recordService.showsAlertMessage(
            'Something went wrong, Please try again later'
          );
        }
      );
  }

  public createLogo(data) {
    const filesStatuses = data.status;
    if (data?.files?.length) {
      const filesInfo = [];
      data.files.forEach((file, index) => {
        this.recordService
          .uploadClientLogo(
            this.clientDetails['organizationId'],
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
                this.clientLogoPagination.resetPagination();
                this.loadClientLogos(this.clientDetails['organizationId']);
              }
              this.recordService.showsAlertMessage(
                `${file.fileName} added successfully!.`
              );
            },
            (errorResponse) => {
              filesInfo.push(file['fileName']);
              if (filesInfo.length === data.files.length) {
                // clear all uploaded file info
                this.clearAttachment$.next(true);
                this.loadClientLogos(this.clientDetails['organizationId']);
              }
              if (errorResponse.error?.message) {
                this.recordService.showsAlertMessage(
                  errorResponse.error?.message
                );
                return;
              }
              this.recordService.showsAlertMessage(
                'Something went wrong, Please try again later'
              );
            }
          );
      });
    }
  }
  public deleteLogo(logo: Logo) {
    this.recordService.deleteClientLogo(this.clientDetails['organizationId'], logo['key']).subscribe(
      (response) => {
        this.recordService.showsAlertMessage(
          `${logo.name} deleted successfully!.`
        );
        const index = this.agencyLogos.findIndex(
          (logoInfo: Logo) => logoInfo._id === logo._id
        );
        this.agencyLogos.splice(index, 1);
        this.agencyLogos = Helper.deepClone(this.agencyLogos);
        this.cdRef.markForCheck();
      },
      (errorResponse) => {
        if (errorResponse.error?.message) {
          this.recordService.showsAlertMessage(errorResponse.error?.message);
          return;
        }
        this.recordService.showsAlertMessage(
          'Something went wrong, Please try again later'
        );
      }
    );
  }

  public loadMoreLogos() {
    if (this.clientLogoPagination.isPageSizeReachedTotal()) {
      this.isClientLogosLoading$.next(false);
      this.cdRef.markForCheck();
      return;
    }
    this.clientLogoPagination.moveNextPage();
    this.loadClientLogos(this.clientDetails['organizationId'], true);
  }

  public handleScroll(tabLabel: string) {
    this.scrolling$.next(tabLabel);
  }

  /** Refresh product filter based on new product add */
  public productUpdate(event) {
    this.estimateRefresher$.next({ product: true });
  }

  public switchTabOnInit() {
    const tab = this.activeRoute.snapshot.queryParamMap.get('tab');
    if (tab === 'products') {
      this.selectedTab = this.tab.PRODUCTS;
      this.selectedTabLabel = 'products_tab';
      this.openNewProduct();
      this.clientProductsLazyLoader.triggerInitialLoad();
    } else if (tab === 'estimates') {
      this.selectedTab = 3;
      this.selectedTabLabel = 'estiates_tab';
    } else if (tab === 'createContacts') {
      this.selectedTab = 5;
      this.selectedTabLabel = 'contacts_tab';
      this.openNewContact();
    } else if (tab === 'new_estimates') {
      this.selectedTab = 3;
      this.selectedTabLabel = 'estiates_tab';
      this.openNewEstimate();
    }
  }

  public resetClientProducts(): void {
    this.estimateList.resetClientProducts();
  }

  /*
   * method to add Action btnpermission based on ROLE
   */
  private checkManagerPermission() {
    const userData = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DATA));
    const userRoleData = (userData?.[LocalStorageKeys.USER_ROLE]) ? userData?.[LocalStorageKeys.USER_ROLE] : [];
    const isMangerPermission = (userRoleData && Array.isArray(userRoleData)) ? userRoleData.includes(UserRoleTypes.VENDOR_MANAGER_ROLE) : true;
    this.disableFormActions = this.clientDetails.isOpsApproved && !isMangerPermission;
  }
}
