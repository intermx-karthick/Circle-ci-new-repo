import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { User } from "@auth0/auth0-spa-js";
import { TimeStamp } from "@interTypes/time-stamp";
import { ApiIncoming, Contract, ContractsSearchBuyerApi, NestedItem } from "app/contracts-management/models";
import { Client } from "app/contracts-management/models/client.model";
import { CreateUpdateContract } from "app/contracts-management/models/create-contract.model";
import { ContractsSearchService } from "app/contracts-management/services/contracts-search.service";
import { ContractsService } from "app/contracts-management/services/contracts.service";

import { DeleteConfirmationDialogComponent } from "@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component";

import { ContractsMapper } from "../../contracts-shared/helpers/contracts.mapper";
import { ContractDetailsEmit } from "app/contracts-management/models/contract-delails-emit.model";

import { saveAs } from 'file-saver';
import { MatDialog } from '@angular/material/dialog';
import { ContractLineItemsService } from "app/contracts-management/services/contract-line-items.service";

import {
  ContractDetailsExportPayload
} from "@interTypes/contract";

import { Subject, Subscription } from "rxjs";
import { NewConfirmationDialogComponent } from "@shared/components/new-confirmation-dialog/new-confirmation-dialog.component";
import { MatTab, MatTabGroup, MatTabHeader } from "@angular/material/tabs";
import { takeUntil, map } from "rxjs/operators";
import { PdfPreviewerService } from "@shared/components/imx-pdf-previewer/pdf-previewer.service";
import { UserActionPermission, UserRole } from "@interTypes/user-permission";
import { AuthenticationService } from "@shared/services";
import { LazyLoaderService } from "@shared/custom-lazy-loader";
@Component({
  selector: 'app-contract-details',
  templateUrl: 'contract-details.component.html',
  styleUrls: ['contract-details.component.less'],
  providers: []
})
export class ContractDetailsComponent implements OnInit{

  private unSub$: Subject<void> = new Subject<void>();

  public contract: Contract;
  public scrollContent: number;
  public timeStamp = {} as TimeStamp;

  public clients: Client[];
  public usersItems: User[];
  public campaignsItems: NestedItem[];
  public statusId: string;

  public contractItemId: string;
  private subscription: Subscription;
  public onOpenTab$: Subject<any> = new Subject();
  public selectedTabIndex: number;

  private contractUpdate: CreateUpdateContract;
  private selectedEvents: string[];

  contractForm: FormGroup;
  _lineItemErrorCount = 0;
  @ViewChild('contractsTabs') contractsTabs: MatTabGroup;
  public save$ = new Subject();
  private contractCheckpoints;
  userPermission: UserActionPermission;

  public vendorContractLazyLoader = new LazyLoaderService();
  public loadVendorContract = { isInitialLoadCompleted: false };

  public tabs = Object.freeze({
    CORE_DETAILS: 0,
    ATTACHMENT: 1,
    VENDOR_CONTRACTS: 2,
  });

  constructor(
    private fb: FormBuilder,
    private matSnackBar: MatSnackBar,
    private contractsService: ContractsService,
    private contractsSearchService: ContractsSearchService,
    private dialog: MatDialog,
    private contractLineItemsService: ContractLineItemsService,
    private activateRoute: ActivatedRoute,
    private router: Router,
    public pdfPreviewerService: PdfPreviewerService,
    private auth: AuthenticationService,

  ) {

    this.userPermission = this.auth.getUserPermission(UserRole.CONTRACT);
      this.subscription = this.activateRoute.params
        .subscribe(params=> {
          this.contractItemId = params['id']

          this._getContract(this.contractItemId);
      });
      this.openVendorContractDetailsOnPasteURL();

      this.scrollContent = window.innerHeight - 340;

      this._getAllUsers();
      this._getAllClients();
      this._getAllCampaigns();
    }

    ngOnInit() {

    }
    ngAfterViewChecked() {
      this.contractsTabs._handleClick = this.interceptTabChange.bind(this);
    }
    interceptTabChange(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
      if (idx !== this.selectedTabIndex) {
        if(this._lineItemErrorCount > 0 && idx === 2) {
          const dialogueData = {
            title: 'Action Confirmation',
            // description: `Line Items with vendor or vendor rep errors cannot be included in vendor contracts. Please correct errors for valid contracts.`,
            description: `<div class="broken-lineitems-warn">Please correct Line Item errors for complete & valid vendor contracts <br>
                          <div>*Line Items with vendor or vendor rep errors cannot be included in vendor contracts.</div></div>`,
            confirmBtnText: 'CONTINUE',
            cancelBtnText: 'RETURN TO LINE ITEMS',
            displayCancelBtn: true,
            displayIcon: true
          };
          this.dialog.open(NewConfirmationDialogComponent, {
            data: dialogueData,
            width: '400px',
            height: '260px',
            panelClass: ['imx-mat-dialog', 'export-billing-confirm-dialog']
          }).afterClosed().pipe(
            map(res => res?.action)
          ).subscribe(flag => {
            if (flag) {
              MatTabGroup.prototype._handleClick.apply(this.contractsTabs, arguments);
            } else {
              this.onOpenTab$.next({ openTab: true });
              this.selectedTabIndex = 0;
            }
          });
        } else {
          MatTabGroup.prototype._handleClick.apply(this.contractsTabs, arguments);
        }
      }
    }

    public onSelectedTabChange(event) {
      this.onOpenTab$.next({ openTab: true });
      this.selectedTabIndex = event.index;
      
      switch (event.index) {
        case this.tabs.VENDOR_CONTRACTS:
          this.vendorContractLazyLoader.triggerInitialLoad(); // it will trigger only on first time
          break;
      }
    }


    onValueChanged(value: ContractDetailsEmit) {
      this.contractForm = value.form;
      this.contractUpdate = value.model;
    }

   saveDetails(){
     if (this.contractForm?.controls?.client?.value?.id !== this.contract?.client?._id){
       // const isBillingApproved = findEventEntry(this.contract.contractEvents, ContractCheckpoints.approvedForBillingExport);
       const isBillingApproved = this.contractCheckpoints?.approvedForBillingExport;
       if (isBillingApproved) {
         this.matSnackBar.open('Changing Client on a Contract is not possible if “Approved for Billing” ', null, {
           duration: 3000
         });
         return;
       }
       this.onChangingClient();
     } else {
       this.onSave();
     }
   }

   onSave() {
      this.contractForm.controls.client.markAsTouched();
      this.contractForm.controls.buyer.markAsTouched();
      this.contractForm.controls.contractName.markAsTouched();

      if(!this.contractForm.valid) {
        return;
      }


      if(this.selectedEvents) {
        Object.assign(this.contractUpdate, { contractEvents: this.selectedEvents })
      }

      if(this.statusId) {
        Object.assign(this.contractUpdate, { status: this.statusId })
      }
      this.contractsService.updateContract(this.contractUpdate, this.contractItemId)
       .subscribe((res) => {
         if(!res) {
           return;
         }

         this._showsAlertMessage(res.message);
         this._getContract(this.contractItemId);
      })
    }

    onEventsSelectionChanged(selectedEvents: {
      eventsIds: string[];
      contractCheckpoints: any;
    }) {
      this.selectedEvents = selectedEvents.eventsIds;
      this.contractCheckpoints = selectedEvents.contractCheckpoints;
    }

    onStatusChanged(statusId: string) {
      this.statusId = statusId;
    }
    onIineItemModified(event) {
      if(this.contractItemId){
        this._getContract(this.contractItemId);
        this.loadVendorContract = { isInitialLoadCompleted: false };
      }
    }

    private _getContract(contractId: string) {
      this._getLineItemErrorCount(this.contractItemId);
      this.contractsService.getContractById(this.contractItemId)
      .subscribe((res: Contract) => {
        this.contract = res;
        this.timeStamp = ContractsMapper.getTimeStamp(this.contract);
      })
    }
    private _getLineItemErrorCount(contractId: string) {
      this.contractsService.getLineItemErrorCount({
        contractId: contractId
      })
      .subscribe((res) => {
        this._lineItemErrorCount = res['count'];
      })
    }

    private _getAllUsers() {
      this.contractsSearchService.getAllUsers()
        .subscribe((res: ContractsSearchBuyerApi) => {
          this.usersItems = res.result;
      })
    }

    private _getAllClients() {
      this.contractsSearchService.getClientsByFilters()
        .subscribe((res: any) => {
          this.clients = res.results;
      })
    }


    private _getAllCampaigns() {
      this.contractsSearchService.getAllCampaigns({})
      .subscribe((res: ApiIncoming<NestedItem>) => {
        this.campaignsItems = res.projects;
      })
    }

    private _showsAlertMessage(msg, action = '') {
      const config: MatSnackBarConfig = {
        duration: action ? null : 3000
      };

      this.matSnackBar.open(msg, action, config);
    }

  public  openVendorContractDetailsOnPasteURL() {
    
      const contractId = this.activateRoute.snapshot.paramMap.get('id');
      const previewId = this.activateRoute.snapshot.queryParamMap.get('preview');
      let _singleItemParam = this.activateRoute.snapshot.queryParamMap.get('previewType');
      let parentVendors = this.activateRoute.snapshot.queryParamMap.get('parentVendors');
      let vendor = this.activateRoute.snapshot.queryParamMap.get('vendor');
      let vendorRep = this.activateRoute.snapshot.queryParamMap.get('vendorRep');
      let vendorSecRep = this.activateRoute.snapshot.queryParamMap.get('vendorSecReps');
      let displayVendor = this.activateRoute.snapshot.queryParamMap.get('displayVendor');

      const filterOption = {
        filter: {
          parentVendors: parentVendors ? parentVendors.split(',') : [],
          childVendors: vendor ? vendor.split(',') : [],
          vendorReps: vendorRep ? vendorRep.split(',') : [],
          vendorSecReps: vendorSecRep ? vendorSecRep.split(',') : [],
          displayVendor: displayVendor,
        }
      };
      this.contractsService.setContractFilter(filterOption);

      let _singleItemPerPage = false;

      if (previewId) {
       
        if(_singleItemParam == 'single'){
          _singleItemPerPage = true;
        }

        this.selectedTabIndex = 2;
        this.vendorContractLazyLoader.triggerInitialLoad();
        this.onOpenTab$.next({
          openTab: true
        });

        this.openPreviewEmit({ contract: { _id: contractId }, singleItemPerPage: _singleItemPerPage });
      }
  }

  public openPreviewEmit(event) {
    event['hideCommonLoader'] = false;
    event['singleItemPerPage'] = event?.['singleItemPerPage'];
    event['sorting'] = {};
    const copyUrl = `${location.origin}${this.router.url}`;
    this.downloadPDF(event, decodeURI(copyUrl));
  }

  public downloadPDF(element,copyURL) {
    this.contractsService.downloadContractPdf(element?.contract?._id, element?.singleItemPerPage, element?.hideCommonLoader)
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: any) => {
        if (res?.headers && res?.body) {
          const contentDispose = res.headers.get('content-disposition');
          const matches = contentDispose.split(';')[1].trim().split('=')[1];
          let filename = matches && matches.length > 1 ? matches : 'vendor-contract' + '.pdf';
          filename = filename.slice(1, filename.length - 1);
          this.openPdfViewer(res.body, filename, filename, copyURL); // for now sending file name as title
        }
      }, async (error) => {
        let message = (error?.error?.type != 'error') ? JSON.parse(await error?.error?.text()) : { error: error?.message };
        if (message?.status === 403) {
          message = "Don't have permission";
        } else if (message?.['api-message']) {
          message = message?.['api-message'];
        } else {
          message = message?.error ? message?.error : "Something went wrong";
        }
        this.contractsService._showsAlertMessage(message);
      });
  }

  public openPdfViewer(blob, title, filename, copyURL) {
    this.pdfPreviewerService
      .open({
        pdfSrc: blob,
        title: title,
        downloadFileName: filename,
        copyURL: copyURL
      })
      .subscribe((res) => {
      });
  }

  /**
   * @description
   * method to filter out payload for line item / IO exports
   * TODO -- will implement if required / updated
   *
   * @returns will return headers and filters if exists
   */
   exportPayloadFormat() {
    let exportPayloadFormat: ContractDetailsExportPayload = {};
    return exportPayloadFormat;
  }

  /**
   * @description
   * set parameters and call line item export API
   */
  public lineItemsExport() {
    const exportPayload = this.exportPayloadFormat();
    const fieldSet = '';

    this.contractLineItemsService.contractDetailsLineItemsExport(
      this.contractItemId,
      exportPayload,
      fieldSet,
    )
      .pipe(takeUntil(this.unSub$))
      .subscribe((response: any) => {
        const contentType = response['headers'].get('content-type');
        const contentDispose = response.headers.get('Content-Disposition');
        const matches = contentDispose?.split(';')[1].trim().split('=')[1];
        if (contentType.includes('text/csv')) {
          let filename = matches && matches.length > 1 ? matches : 'line_items.csv';
          filename = filename.slice(1, filename.length-1);
          saveAs(response.body, filename);
        } else {
          this._showsAlertMessage(
            'Something went wrong, Please try again later'
          );
        }
      })
  }

  /**
   * @description
   * set parameters and call IO export API
   */
  public insertionOrdersExport() {
    const exportPayload = this.exportPayloadFormat();
    const fieldSet = '';

    this.contractLineItemsService.contractDetailsInsertionOrdersExport(
      this.contractItemId,
      exportPayload,
      fieldSet
    )
      .pipe(takeUntil(this.unSub$))
      .subscribe((response: any) => {
        const contentType = response['headers'].get('content-type');
        const contentDispose = response.headers.get('Content-Disposition');
        const matches = contentDispose?.split(';')[1].trim().split('=')[1];
        if (contentType.includes('text/csv')) {
          let filename = matches && matches.length > 1 ? matches : 'contract-iodates.csv';
          filename = filename.slice(1, filename.length-1);
          saveAs(response.body, filename);
        } else {
          this._showsAlertMessage(
            'Something went wrong, Please try again later'
          );
        }
      })
  }

  /**
   * @description
   * method to init API call for delete contract by id
   */
  public deleteContract() {
    if (this.contract !== null && this.contract?._id) {
      this.dialog
        .open(DeleteConfirmationDialogComponent, {
          width: '340px',
          height: '260px',
          panelClass: 'imx-mat-dialog'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res['action']) {
            this.contractsService
              .deleteContract(this.contract._id)
              .pipe(takeUntil(this.unSub$))
              .subscribe((response) => {
                if (response.status == 'success') {
                  this._showsAlertMessage(response.message);
                  this.router.navigateByUrl(`/contracts-management/contracts`);
                } else {
                  if (response.error.status === 400){
                    this._showsAlertMessage(
                      response?.error?.message ?? response?.message, 'Dismiss'
                    );
                  }else{
                    this._showsAlertMessage(
                      response?.error?.message ?? response?.message
                    );
                  }
                }
              });
          }
        });
    }
  }
  /**
   * @description
   * method to duplicate contract
   * routed to list with current contract attached in Qparams.
   */
  public duplicateContract() {
    if (this.contract !== null && this.contract?._id) {
      this.router.navigateByUrl(`/contracts-management/contracts?contractId=${this.contract._id}`);
    }
  }

  public ngOnDestroy(): void {
    this.unSub$.next();
    this.unSub$.complete();
    this.matSnackBar.dismiss();
  }

  public onChangingClient() {
    const dialogueData = {
      title: 'Confirmation',
      description: 'Changing the Client on this contract requires that all Line Item Products and Estimates be re-assigned. Confirm you want this change.',
      confirmBtnText: 'OK',
      cancelBtnText: 'CANCEL',
      displayCancelBtn: true,
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
      if (flag) {
        this.save$.next({ clearCheckpoints: true });
        this.onSave();
      }
    });
  }

  get attachment() {
    return !!this.auth.getUserPermission(UserRole.ATTACHMENT);
  }

}
