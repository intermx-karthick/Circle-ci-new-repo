import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ClientProduct, Contact } from '@interTypes/records-management';
import { AbstractReportGenerateComponent } from '../../reports/abstract-report-generate.component';
import { Agency } from '@interTypes/records-management/agencies/agencies.response';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { VendorService } from '../../records-management-v2/vendors/vendor.service';
import { RecordService } from '../../records-management-v2/record.service';
import {
  AuthenticationService,
  InventoryService,
  SnackbarService,
  ThemeService
} from '@shared/services';
import { ReportsAPIService } from '../../reports/services/reports-api.service';
import { FiltersService } from '../../explore/filters/filters.service';
import { MatOptionSelectionChange } from '@angular/material/core';
import { Project } from '@interTypes/workspaceV2';
import { Report } from '@interTypes/reports';
import { AppAutocompleteOptionsModel } from '@shared/components/app-autocomplete/model/app-autocomplete-option.model';
import { filter, switchMap, concatMap, takeUntil, map, retryWhen, tap, delayWhen } from 'rxjs/operators';
import {
  ApiIncoming,
  ContractsSearchBuyerApi,
  ContractStatus
} from '../models';
import { AutocompleteMapper } from '../contracts/contracts-shared/helpers/autocomplete.mapper';
import { ContractsService } from '../services/contracts.service';
import { UseAutoCompleteInfiniteScroll } from '../../classes/use-auto-complete-infinite-scroll';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { User } from '@auth0/auth0-spa-js';
import { ContractsSearchService } from '../services/contracts-search.service';
import { Sort } from '@angular/material/sort';
import { Pagination } from '../models/pagination.model';
import { Helper } from '../../classes';
import { ContractLineItemsApiResponce } from '../models/contract-line-item.model';
import { ContractLineItemsService } from '../services/contract-line-items.service';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { AddLineItemDialogComponent } from '../contracts/contracts-list/contract-details/core-details/add-line-item-dialog/add-line-item-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { format, isValid } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { EstimateSearchFilter, Vendor } from '@interTypes/inventory-management';
import { saveAs } from 'file-saver';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { WorkspaceProjectAddComponent } from '../../workspace-v3/workspace-project-add/workspace-project-add.component';
import { SaveAsFileComponent } from '@shared/components/save-as-file/save-as-file.component';
import { forbiddenNamesValidator } from '@shared/common-function';
import { ElasticSearchResponse } from '@interTypes/elastic-search.response';
import { of, Subject, Subscription, timer } from 'rxjs';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { CONTACT_LIST_TYPES } from "@constants/contact-list-types";
import { ContractsPagination } from '@interTypes/pagination';

@Component({
  selector: 'app-line-items',
  templateUrl: './line-items.component.html',
  styleUrls: ['./line-items.component.less'],
  providers: [FiltersService, ReportsAPIService, InventoryService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineItemsComponent
  extends AbstractReportGenerateComponent
  implements OnInit, OnDestroy {
  private unSubES$: Subject<void> = new Subject<void>();
public subscription: Subscription;
  public reportGenerateForm: FormGroup;
  public scrollContent: number;
  public selectedAgency: Agency[] = [];
  public selectedClient: ClientDetailsResponse;
  public selectedClientParent: ClientDetailsResponse[] = [];
  public selectedProduct: ClientProduct;
  public panelAgencyContainer: string;
  public panelOfficeContainer: string;
  public panelClientParentContainer: string;
  public panelClientNameContainer: string;
  public panelProductContainer: string;
  public panelEstimateContainer: string;
  public panelVendorContainer: string;
  public panelVendorParentContainer: string;
  public maxDate = new Date('12/31/9999');
  // public selectProduct: ClientProduct;
  public selectedOffice;

  public selectedReportTypes: Report[] = [];
  public panelCampaignContainer: string;
  public PartnerResellerContainer: string;
  public contrtactStatusesAutocompleteItems: AppAutocompleteOptionsModel[] = [];
  public itemStatuses: any[] = [];
  public operationContactsAutoComplete = new UseAutoCompleteInfiniteScroll();
  public operationContactPanelContainer = '';
  public usersAutocompleteItems: AppAutocompleteOptionsModel[];
  // public usersAutocompletePagination: ContractsPagination = { page: 1, perPage: 25 };
  // public usersAutocompleteLoading = false;
  public tableRecords: ContractLineItemsApiResponce;
  public recordsFound = 0;
  public sort: Sort = {
    active: 'lineItemId',
    direction: 'asc'
  };
  searchSavedData: any;

  @ViewChild('managerInputRef', { read: MatAutocompleteTrigger })
  public managerAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('triggerOperationsContact', { read: MatAutocompleteTrigger })
  public triggerOperationsContact: MatAutocompleteTrigger;
  @ViewChild('triggerCampaign', { read: MatAutocompleteTrigger })
  public triggerCampaign: MatAutocompleteTrigger;
  @ViewChild('triggerClientParent', { read: MatAutocompleteTrigger })
  public triggerClientParent: MatAutocompleteTrigger;
  @ViewChild('triggerAgency', { read: MatAutocompleteTrigger })
  public triggerAgency: MatAutocompleteTrigger;
  @ViewChild('triggerVendor', { read: MatAutocompleteTrigger })
  public triggerVendor: MatAutocompleteTrigger;
  @ViewChild('triggerParentVendor', { read: MatAutocompleteTrigger })
  public triggerParentVendor: MatAutocompleteTrigger;
  @ViewChild('triggerClientName', { read: MatAutocompleteTrigger })
  public triggerClientName: MatAutocompleteTrigger;
  @ViewChild('triggerProductName', { read: MatAutocompleteTrigger })
  public triggerProductName: MatAutocompleteTrigger;
  @ViewChild('triggerEstimate', { read: MatAutocompleteTrigger })
  public triggerEstimate: MatAutocompleteTrigger;
  @ViewChild('triggerPartnerReseller', { read: MatAutocompleteTrigger })
  public triggerPartnerReseller: MatAutocompleteTrigger;

  public managedByPanelContainer = '';
  public managedByAutoComplete = new UseAutoCompleteInfiniteScroll();
  private pagination: Pagination = {
    page: 1,
    perPage: 10
  };
  public selectedOperationsContact: Contact[] = [];
  public selectedVendors: Vendor[] = [];
  public selectedParentVendors: Vendor[] = [];
  public selectedResellers: any[] = [];
  public selectedManagedByers: any[] = [];
  public selectedCampaigns: any[] = [];
  public selectedEstimates: any[] = [];
  public searchFilterApplied = false;
  public isLoadingLineItems = false;
  public isSearchInValid = false;
  public elasticSearchId = '';
  userPermission: UserActionPermission;
  public panelBuyerContainer = '';
  constructor(
    public fb: FormBuilder,
    public vendorService: VendorService,
    public recordService: RecordService,
    public inventoryService: InventoryService,
    public reportService: ReportsAPIService,
    public filtersService: FiltersService,
    public auth: AuthenticationService,
    private contractsService: ContractsService,
    private contractsSearchService: ContractsSearchService,
    private contractLineItemsService: ContractLineItemsService,
    public dialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private snackbarService: SnackbarService,
    public cdRef: ChangeDetectorRef,
    public theme: ThemeService
  ) {
    super(
      fb,
      vendorService,
      recordService,
      inventoryService,
      reportService,
      filtersService,
      auth,
      cdRef,
      theme
    );
  }

  public get buyerName(): string{
    let firstName: any;
    firstName = this.reportGenerateForm['controls'].buyers?.value
      ?.firstName ?? '';
    const lastName = this.reportGenerateForm['controls'].buyers?.value
      ?.lastName ?? '';
    return firstName + ' '+ lastName;
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.initOperationContacts();
    //this.searchContractsLineItems(this.sort, this.pagination, false);
    this.reSize();
    this.loadCostTypes();
    this.loadReportTypes();
    this.loadDivisions();
    this.loadClientTypes();
    this.setUpOffices();
    this.setUpParentClients();
    this.setUpAgencies();
    this.setUpProducts();
    this.setUpEstimates();
    this.setUpVendors();
    this.setUpParentVendors();
    this.loadPlaceTypes();
    this.loadDMA();
    this.setUpReseller();
    this.loadCampaign();
    this.setUpClients();
    this.getAllContractStatuses();
    this.getItemStatuses();
    this.getAllUsers();
    this.setupManagedByUsers();
    this.clientAndProductValueResetter();
    this.userPermission = this.auth.getUserPermission(UserRole.CONTRACT);
    this.initBuyers();
    this.setLineItemDataFromLocalStorage()
  }

  public ngOnDestroy(): void {
    this.unSubES$.next();
    this.unSubES$.complete();
    this.subscription.unsubscribe();
  }

  onFormSubmit() {
    if (this.reportGenerateForm.valid) {
      setTimeout(() => {
        document.getElementById('contracts-management__SCROLLABLE').scrollTop = document.getElementById('line-items-table').offsetTop + 50;
      }, 100)
      this.searchSavedData = null;
      this.searchContractsLineItems(this.sort, this.pagination);
    }
  }

  reSize() {
    if (window.innerHeight < 1100) {
      this.scrollContent = window.innerHeight - (window.innerHeight - 250);
    } else {
      this.scrollContent = null;
    }
  }

  public setLineItemDataFromLocalStorage(){
    const sessionFilter = this.contractLineItemsService.getLineItemListLocal();
    if(sessionFilter?.lItemPagination){
      this.pagination = sessionFilter?.lItemPagination;
    }
    if(sessionFilter?.lItemSorting?.active){
      this.sort = sessionFilter?.lItemSorting;
    }
    if(sessionFilter?.searchLineItem){
      this.searchSavedData = sessionFilter?.searchLineItem;
      this.patchSearchData(this.searchSavedData);
      this.searchContractsLineItems(this.sort, this.pagination);
    }
  }

  patchSearchData(formData){
    if(formData){
      this.reportGenerateForm.patchValue({
        startDate: formData?.startDate ? new Date(formData?.startDate) : '',
        endDate: formData?.endDate ? new Date(formData?.endDate) : '',
        revisedSince: formData?.revisedSince ? new Date(formData?.revisedSince) : '',
        enteredSince: formData?.enteredSince ? new Date(formData?.enteredSince) : '',
        divisions: formData?.divisions ?? '',
        office: formData?.offices ?? '',
        clientType: formData?.clientType ?? '',
        contractName: formData?.contractName ?? '',
        contractNumber: formData?.contractNumber === 0 ? null : formData?.contractNumber ,
        clientCode: formData?.clientCode ?? '',
        client: formData?.clientData ?? '',
        productCode: formData?.productCode ?? '',
        product: formData?.productData ?? '',
        estimateId: formData?.estimate ?? '',
        mediaClass: formData?.mediaClass ?? '',
        placeType: formData?.placeType ?? '',
        isDigital: formData?.isDigital ?? '',
        mediaType: formData?.mediaType ?? '',
        market: formData?.dma ?? '',
        invoiceDate: formData?.invoiceDate ?? '',
        dueDate: formData?.dueDate ?? '',
        invoice: formData?.invoice ?? '',
        lineItemIDs: formData?.lineItemIDs ?? '',
        invoiceNotes: formData?.invoiceNotes ?? '',
        contractStatus: formData?.contractStatus ?? '',
        itemStatus: formData?.itemStatus ?? '',
      });
    }
    if (formData.campaignData) {
      this.campaignsAutoComplete.loadData( null, (res) => {
        this.campaignsAutoComplete.data = res?.projects ?? [];
        formData.campaignData.map((item) => {
          this.campaignUpdate(item, true);
        })
      });
    }
    if (formData.clientManagedByData) {
      this.managedByAutoComplete.loadData( null, (res) => {
        this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
        formData.clientManagedByData.map((item) => {
          this.managedByUpdate(item, true);
        })
      });
    }
    if (formData.operationsContactsData) {
      this.operationContactsAutoComplete.selectedData = formData.operationsContactsData;
      this.selectedOperationsContact = formData.operationsContactsData;
    }
    if (formData.buyersData) {
      this.buyersAutoComplete.selectedData = formData.buyersData;
    }
    if (formData.parentClientData) {
      this.parentClientsAutoComplete.loadData( null, (res) => {
        this.parentClientsAutoComplete.data = res.results;
        formData.parentClientData.map((item) => {
          this.clientParentUpdate(item, true);
        })
      });
    }
    if (formData.agenciesData) {
      this.agenciesAutoComplete.loadData( null, (res) => {
        this.agenciesAutoComplete.data = res.results;
        formData.agenciesData.map((item) => {
          this.agencySelectionUpdate(item, true);
        })
      });
    }
    if (formData.vendorData) {
      this.vendorsAutoComplete.loadData( null, (res) => {
        this.vendorsAutoComplete.data = res.results;
        formData.vendorData.map((item) => {
          this.vendorsUpdate(item, true);
        })
      });
    }
    if (formData.parentVendorData) {
      this.parentVendorsAutoComplete.loadData( null, (res) => {
        this.parentVendorsAutoComplete.data = res.results;
        formData.parentVendorData.map((item) => {
          this.parentVendorsUpdate(item, true);
        })
      });
    }
    if (formData.resellerData) {
      this.resellerAutoComplete.loadData( null, (res) => {
        this.resellerAutoComplete.data = res.results;
        formData.resellerData.map((item) => {
          this.resellerUpdate(item, true);
        })
      });
    }
    if (formData.clientData) {
      this.selectedClient = formData.clientData;
      this.productsAutoComplete.loadData(null, () => {
        if(formData.productData){
          this.selectedProduct = formData.productData;
          this.subscribeOnEstimateChange();
          this.estimatesAutoComplete.loadData(null, ()=> {
            if (formData.estimateData) {
              formData.estimateData.map((item) => {
                this.estimateUpdate(item, true);
              })
            }
          });
        }
      });
    }
    this.cdRef.detectChanges();
  }

  buildForm() {
    this.reportGenerateForm = this.fb.group({
      startDate: [null],
      endDate: [null],
      revisedSince: [],
      enteredSince: [],
      divisions: [],
      office: [],
      clientType: [],
      contractName: [],
      contractNumber: [],
      campaign: [],
      clientParent: [],
      agency: [],
      clientCode: [],
      client: [null, null, forbiddenNamesValidator],
      productCode: [],
      product: [null, null, forbiddenNamesValidator],
      estimateId: [],
      estimate: [],
      vendor: [],
      parentVendor: [],
      programmaticPartnerReseller: [],
      mediaClass: [],
      placeType: [],
      isDigital: [false],
      mediaType: [],
      market: [],
      invoiceDate: [],
      dueDate: [],
      invoice: [],
      lineItemIDs: [],
      invoiceNotes: [],
      contractStatus: [],
      itemStatus: [],
      buyers: [],
      operationsContacts: [],
      clientManagedBy: []
    });
  }

  onSelectClient(event: any) {
    this.selectedClient = event.option.value;
    this.productsAutoComplete.loadData(null, null);
  }

  onSelectClientProduct(event: any) {
    this.selectedProduct = event.option.value;
    this.subscribeOnEstimateChange();
    this.estimatesAutoComplete.loadData(null, null);
  }

  selectOfficeData(event: MatOptionSelectionChange, office: any) {
    if (!event.isUserInput) {
      return;
    }
    this.selectedOffice = office;
    this.cdRef.markForCheck();
  }

  public onScrollStatuses(value) {
    this.getItemStatuses(value, true);
  }

  public getItemStatuses(perPage = '10', noLoader = false) {
    this.contractsService
      .itemStatusSearch({}, perPage, noLoader)
      .subscribe((res) => {
        this.itemStatuses = AutocompleteMapper<ContractStatus>(res.results);
      });
  }

  public updatePartnerResellerContainer() {
    this.PartnerResellerContainer = '.partnerReseller-list-autocomplete';
  }

  // Programmatic Partner/Reseller

  public PartnerResellerDisplayWithFn(pReseller) {
    return pReseller?.name ?? '';
  }

  public PartnerResellerTrackByFn(idx: number, pReseller) {
    return pReseller?._id ?? idx;
  }

  public onSelectPartnerReseller(event) {}

  // Media
  public mediaByFn(idx: number, media) {
    return media?.name ?? idx;
  }

  public updateAgencyContainer() {
    this.panelAgencyContainer = '.agency-list-autocomplete';
  }

  public updateClientParentContainer() {
    this.panelClientParentContainer = '.clientParent-list-autocomplete';
  }

  public clientParentTrackByFn(idx: number, clientParent) {
    return clientParent?._id ?? idx;
  }

  public agencyTrackByFn(idx: number, agency) {
    return agency?._id ?? idx;
  }

  public updateClientNameContainer() {
    this.panelClientNameContainer = '.clientName-list-autocomplete';
  }

  public clientNameDisplayWithFn(clientName) {
    return clientName?.clientName ?? '';
  }

  public clientNameTrackByFn(idx: number, clientName) {
    return clientName?._id ?? idx;
  }

  public updateProductContainer() {
    this.panelProductContainer = '.product-list-autocomplete';
  }

  public productDisplayWithFn(product) {
    return product?.productName ?? '';
  }

  public productTrackByFn(idx: number, product) {
    return product?._id ?? idx;
  }

  public updateEstimateContainer() {
    this.panelEstimateContainer = '.estimate-list-autocomplete';
  }

  public estimateDisplayWithFn(estimate) {
    return estimate?.estimateName ?? '';
  }

  public estimateTrackByFn(idx: number, estimate) {
    return estimate?._id ?? idx;
  }

  public onSelectEstimateProduct(event) {
    console.log('event', event);
  }

  /** Vendor */

  public updateVendorContainer() {
    this.panelVendorContainer = '.vendor-list-autocomplete';
  }

  public vendorDisplayWithFn(vendor) {
    return vendor?.name ?? '';
  }

  public vendorTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  public onSelectVendorProduct(event) {
    console.log('event', event);
  }

  public updateVendorParentContainer() {
    this.panelVendorParentContainer = '.vendorparent-list-autocomplete';
  }

  /* vendor parent */

  public vendorParentDisplayWithFn(vendor) {
    return vendor?.name ?? '';
  }

  public vendorParentTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  public onSelectVendorParentProduct(event) {
    console.log('event', event);
  }

  public placeTypeTrackByFn(idx: number, place) {
    return place?._id ?? idx;
  }

  public dmaTrackByFn(idx: number, dma) {
    return dma?._id ?? idx;
  }

  public costTypeTrackByFn(idx: number, costType) {
    return costType?._id ?? idx;
  }

  public updateBuyerContainer() {
    this.panelBuyerContainer = '.buyer-list-autocomplete';
  }

  public buyerWithFn(project: Contact) {
    return (project?.firstName + project?.lastName) ?? '';
  }

  public onSelectBuyer(event) {
    console.log('onSelectCampaign', event);
  }

  public buyerTrackByFn(idx: number, project) {
    return project?._id ?? idx;
  }
  public buyerDisplayWithFn(buyer) {
    return buyer?.firstName ? buyer?.firstName +' '+ buyer?.lastName : '';
  }

  public updateCampaignContainer() {
    this.panelCampaignContainer = '.campaign-list-autocomplete';
  }

  // Campaign autocomplete

  public campaignWithFn(project: Project) {
    return project?.name ?? '';
  }

  public onSelectCampaign(event) {
    console.log('onSelectCampaign', event);
  }

  public CampaignTrackByFn(idx: number, project) {
    return project?._id ?? idx;
  }

  // Client parent
  public optionClicked(event, item: ClientDetailsResponse) {
    const index = this.selectedClientParent.findIndex(
      (clientParent) => clientParent._id == item._id
    );
    // Select the item
    if (event.checked && index < 0) {
      this.clientParentUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.clientParentUpdate(item, false);
    }
  }

  public clientParentUpdate(item: ClientDetailsResponse, checkedItem = false) {
    const index = this.selectedClientParent.findIndex(
      (_clientParent) => _clientParent._id == item._id
    );
    const parentClientsIndex = this.parentClientsAutoComplete.data.findIndex(
      (_clientParent) => _clientParent._id == item._id
    );

    if (checkedItem) {
      this.selectedClientParent.push(item);
      if (parentClientsIndex > -1) {
        this.parentClientsAutoComplete.data[parentClientsIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedClientParent.splice(index, 1);
      }
      if (parentClientsIndex > -1) {
        this.parentClientsAutoComplete.data[
          parentClientsIndex
        ].selected = false;
      }
    }

    this.cdRef.markForCheck();
  }

  public removeClientParent(clientParent: ClientDetailsResponse) {
    this.clientParentUpdate(clientParent, false);
  }

  public removeAgencyParent(agency: Agency) {
    this.agencySelectionUpdate(agency, false);
  }

  public optionAgencyClicked(event, item: Agency) {
    const index = this.selectedAgency.findIndex(
      (agency) => agency._id == item._id
    );
    // Select the item
    if (event.checked && index < 0) {
      this.agencySelectionUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.agencySelectionUpdate(item, false);
    }
  }

  public agencySelectionUpdate(item: Agency, checkedItem = false) {
    const index = this.selectedAgency.findIndex(
      (_agency) => _agency._id == item._id
    );
    const agencyIndex = this.agenciesAutoComplete.data.findIndex(
      (_agency) => _agency._id == item._id
    );

    if (checkedItem) {
      this.selectedAgency.push(item);
      if (agencyIndex > -1) {
        this.agenciesAutoComplete.data[agencyIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedAgency.splice(index, 1);
      }
      if (agencyIndex > -1) {
        this.agenciesAutoComplete.data[agencyIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  public initBuyers() {
    const pagination = {
      page: 1,
      perPage: 100
    };
    this.recordService
      .getContactTypes(pagination)
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        const contactTypeIds = res.results
          .reduce((state, type) => {
          if (/^(media|management)$/i.test(type.name)) {
            state.push(type._id);
          }
          return state;
        }, []);
        this.setUpBuyers(contactTypeIds);
      });
  }


  public setUpBuyers(contactTypeIds: string[]) {
    const buyersSearchCtrl = this.reportGenerateForm?.controls?.buyers
      ?.valueChanges;

    if (buyersSearchCtrl) {
      this.buyersAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        buyersSearchCtrl
      );

      this.buyersAutoComplete.apiEndpointMethod = () => {
        const isSearchStr = typeof this.reportGenerateForm?.controls?.buyers?.value === 'string';
        const searchObj = {
          filter: {
            companyTypes: ['User'],
            contactTypes: contactTypeIds,
          },
          ...(isSearchStr
            ? { search: this.reportGenerateForm?.controls?.buyers?.value }
            : {})
        };

        return this.recordService.getContacts(
          searchObj,
          this.buyersAutoComplete.pagination,
          null,
          '',
          'id,firstName,lastName'
        );
      };

      this.buyersAutoComplete.loadData(null, null);

      this.buyersAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'buyers',
        null,
        null
      );
    }
  }

  public setupOperationContacts(operationIdList: string[] = []) {
    // Operation Contacts code
    const operationContactsSearchCtrl = this.reportGenerateForm?.controls
      ?.operationsContacts?.valueChanges;
    if (operationContactsSearchCtrl) {
      this.operationContactsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        operationContactsSearchCtrl
      );
      this.operationContactsAutoComplete.apiEndpointMethod = () => {
          const payload = {
            search: this.operationContactsAutoComplete.searchStr,
            filter: {
              companyTypes: ['User'],
              contactTypes: operationIdList
            }
          }
          const fieldSet = ["_id", "firstName", "lastName", "companyId", "address", "updatedAt", "companyType", "email", "mobile", "note"];
          return this.contractsSearchService.getContacts(
            payload,
            fieldSet,
            this.operationContactsAutoComplete.pagination
          ).pipe(filter((res: any) => !!res.results));
      };
      
      this.operationContactsAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'operationsContacts',
        null,
        (res) => {
          this.operationContactsAutoComplete.data = res.results;
          this.updateOperationContactSelectedData();
          this.cdRef.markForCheck();
        }
      );
      this.operationContactsAutoComplete.loadData(null, (res) => {
        this.operationContactsAutoComplete.data = res.results;
        this.updateOperationContactSelectedData();
        this.cdRef.markForCheck();
      });
    }
  }

  public updateOperationsContactContainer() {
    this.operationContactPanelContainer =
      '.operation-contacts-list-autocomplete';
  }

  public operationContactsTrackByFn(idx: number, user: any) {
    return user?.id ?? idx;
  }

  public operationContactsDisplayWithFn(user: any) {
    return user?.name ?? '';
  }

  resetManagedBy(){
    this.managedByPanelContainer = '';
    this.managedByAutoComplete.resetAll();
    this.managedByAutoComplete.loadData(null, (res) => {
      this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
      this.cdRef.markForCheck();
    });
  }
  resetProduct() {
    this.panelProductContainer = '';
    this.productsAutoComplete.data = [];
  }
  resetEstimatesName() {
    this.panelEstimateContainer = '';
    this.estimatesAutoComplete.data = [];
  }
  resetPartnerReseller() {
    this.PartnerResellerContainer = '';
    this.resellerAutoComplete.resetAll();
    this.resellerAutoComplete.loadData(null, null);
  }
  resetCampaign(){
    this.panelCampaignContainer = '';
    this.campaignsAutoComplete.resetAll();
    this.campaignsAutoComplete.loadData( null, (res) => {
      this.campaignsAutoComplete.data = res?.projects ?? [];
      this.cdRef.markForCheck();
    });
  }
  resetClientParent() {
    this.panelClientParentContainer = '';
    this.parentClientsAutoComplete.resetAll();
    this.parentClientsAutoComplete.loadData(null, null);
  }
  resetAgency() {
    this.panelAgencyContainer = '';
    this.agenciesAutoComplete.resetAll();
    this.agenciesAutoComplete.loadData(null, null);
  }
  resetVendor() {
    this.panelVendorContainer = '';
    this.vendorsAutoComplete.resetAll();
    this.vendorsAutoComplete.loadData(null, null);
  }
  resetParentVendors() {
    this.panelParentVendorsContainer = '';
    this.parentVendorsAutoComplete.resetAll();
    this.parentVendorsAutoComplete.loadData(null, null);
  }
  resetOperationContact() {
    this.operationContactPanelContainer = '';
    this.operationContactsAutoComplete.resetAll();
    this.operationContactsAutoComplete.loadData(null, null);
  }
  resetClientName() {
    this.panelClientNameContainer = '';
    this.clientsAutoComplete.resetAll();
    this.clientsAutoComplete.loadData(null, null);
  }

  resetBuyers(){
    this.panelBuyerContainer = '';
    this.buyersAutoComplete.resetAll();
    this.buyersAutoComplete.loadData(null, null);
  }

  public onResetForm() {
    this.contractLineItemsService.removeAllFromLineItemListLocal();
    this.searchSavedData = null;
    this.reportGenerateForm.reset();
    this.searchFilterApplied = false;
    this.isSearchInValid = false;

    this.selectedOperationsContact = [];
    this.selectedVendors = [];
    this.selectedParentVendors = [];
    this.selectedResellers = [];
    this.selectedManagedByers = [];
    this.selectedCampaigns = [];
    this.selectedAgency = [];
    this.selectedClientParent = [];
    this.selectedEstimates = [];
    this.selectedClient = null;
    this.selectedProduct = null;
    this.resetManagedBy();
    this.resetProduct();
    this.resetEstimatesName();
    this.resetPartnerReseller();
    this.resetCampaign();
    this.resetClientParent();
    this.resetAgency();
    this.resetVendor();
    this.resetParentVendors();
    this.resetOperationContact();
    this.resetClientName();
    this.resetBuyers();
    
    this.operationContactsAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
    this.vendorsAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
    this.resellerAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
    this.parentVendorsAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
    this.managedByAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
    this.parentClientsAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
    this.agenciesAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
    this.estimatesAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
    this.campaignsAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
    // this.searchContractsLineItems(this.sort, this.pagination);
    this.tableRecords = {pagination: {}, results: []} as ContractLineItemsApiResponce;
    this.recordsFound = 0;

    this.unSubES$.next();
    this.unSubES$.complete();
    this.cdRef.markForCheck();
  }

  onPaginationChanged(event: Pagination) {
    this.pagination = event;
    this.contractLineItemsService.setContractDetailLineItemProp(
      'paginationEvent',
      event
    );
    this.contractLineItemsService.setLineItemListLocal('lItemPagination', this.pagination);

    this.getLineItemsByESSearchId(this.sort, this.pagination);
  }

  onSortingChanged(event: Sort) {
    this.sort = { ...event };

    this.contractLineItemsService.setContractDetailLineItemProp(
      'sortEvent',
      event
    );
    this.contractLineItemsService.setLineItemListLocal('lItemSorting', this.sort);
    this.getLineItemsByESSearchId(this.sort, this.pagination);
  }

  onEditLineItem(data: any, isForDuplicate = false) {
    this.onAddLineItemsDialog(data.contract, data, isForDuplicate);
  }

  deleteLineItem(element) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(
        filter((res) => res && res['action']),
        switchMap(() =>
          this.contractLineItemsService.deleteLineItem(
            element.contract._id,
            element._id
          )
        ),
        filter((res: any) => res?.status === 'success')
      )
      .subscribe((res) => {
        this.snackbarService.showsAlertMessage(
          'Line Item deleted successfully'
        );
        this.searchContractsLineItems(this.sort, this.pagination);
      });
  }

  onAddLineItemsDialog(contract, lineItemData?: any, isForDuplicate = false) {
    const dialogRef = this.dialog.open(AddLineItemDialogComponent, {
      height: '98%',
      width: '1279px',
      panelClass: 'add-line-items-modal',
      disableClose: true,
      autoFocus: false,
      data: {
        fullScreenMode: true,
        contract: contract,
        lineItemData,
        isForDuplicate,
        clientId: lineItemData?.contract?.client?._id,
        pagination: this.paginationCalc(lineItemData),
        sort: Helper.deepClone(this.sort),
        isOutOfContracts: true,
        userPermission: this.userPermission,
        module: UserRole.CONTRACT
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.searchContractsLineItems(this.sort, this.pagination);
      }
    });
  }

  public updateMangedByContainer() {
    this.managedByPanelContainer = '.users-list-autocomplete';
  }

  public mangedByUserTrackByFn(idx: number, user: any) {
    return user?.id ?? idx;
  }

  public mangedByUserDisplayWithFn(user: any) {
    return user?.email ?? '';
  }


  public setupManagedByUsers() {
    const managedBySearchCtrl = this.reportGenerateForm?.controls
      ?.clientManagedBy?.valueChanges;
    if (managedBySearchCtrl) {
      this.managedByAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        managedBySearchCtrl
      );
      this.managedByAutoComplete.apiEndpointMethod = () => {
        const isSearchStr = typeof this.reportGenerateForm?.controls?.clientManagedBy?.value === 'string';
        const searchObj = {
          filter: {
            companyTypes: [
              "User"
            ]
          },
          ...(isSearchStr
            ? { search: this.reportGenerateForm?.controls?.clientManagedBy?.value }
            : {})
        }
        return this.recordService.getContacts(
          searchObj,
          this.managedByAutoComplete.pagination,
          null,
          '',
          'id,firstName,lastName'
        );
      }
      this.managedByAutoComplete.loadData(null, (res) => {
        this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
        this.cdRef.markForCheck();
      });

      this.managedByAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'clientManagedBy',
        null,
        (res) => {
          this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
          this.managedByAutoComplete.data.map((element) => {
            const index = this.selectedManagedByers.findIndex(
              (item) => item.id === element.id
            );
            element.selected = index > -1;
          });
          this.cdRef.markForCheck();
        }
      );
    }
  }

  private getAllContractStatuses() {
    this.contractsService
      .getContractStatuses()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res: ApiIncoming<ContractStatus>) => {
        this.contrtactStatusesAutocompleteItems = AutocompleteMapper<ContractStatus>(
          res.results
        );
      });
  }

  private getAllUsers() {
    this.contractsSearchService
      .getAllUsers()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res: ContractsSearchBuyerApi) => {
        this.usersAutocompleteItems = AutocompleteMapper<User>(res.result);
      });
  }

  refreshLineItems(){
     this.searchContractsLineItems(this.sort, this.pagination);
  }

  // table related code
  private searchContractsLineItems(
    sort: Sort = null,
    pagination: Pagination = null,
    noLoader = true
  ) {
    this.unSubES$.next();
    this.unSubES$.complete();
    this.unSubES$ = new Subject<void>();

    const payload = this.buildPayload();
    if(!payload) return;
    this.searchFilterApplied = true;
    this.isLoadingLineItems = true;
    const fieldsets = []
    const sortDup = Helper.deepClone(sort);
    if (sortDup['active'] === 'lineItemId') {
      sortDup['active'] = 'createdAt';
    }
    this.contractLineItemsService
      .searchAlLineItemsEsRequest(fieldsets, payload, noLoader)
      .subscribe((res: ElasticSearchResponse) => {
        if (res?._id) {
          this.elasticSearchId = res._id;
          this.getLineItemsByESSearchId(sort, this.pagination, noLoader);
        }
      });
  }

  private getLineItemsByESSearchId(
    sort: Sort = null,
    pagination: Pagination = null,
    noLoader = true
  ){
    this.isLoadingLineItems = true;
    const sortDup = Helper.deepClone(sort);
    if (sortDup['active'] === 'lineItemId') {
      sortDup['active'] = 'createdAt';
    }

    switch(sort.active){
      case 'lineItemStatus':
        sortDup.active = 'itemStatus.name';
        break;
      case 'market':
        sortDup.active = 'media.dma.name';
        break;
      case 'vendor':
        sortDup.active = 'vendor.name';
        break;
      case 'mediaType':
        sortDup.active = 'spotDetails.mediaType';
        break;
      case 'gross':
        sortDup.active = 'totalSummary.gross';
        break;
      case 'fee':
        sortDup.active = 'totalSummary.fee';
        break;
      case 'tax':
        sortDup.active = 'totalSummary.tax';
        break;
      case 'net':
        sortDup.active = 'totalSummary.net';
        break;
      case 'description':
        sortDup.active = 'spotDetails.mediaDescription';
        break;
    }

    const isFieldValueString = /^(lineItemType|lineItemStatus|market|vendor|mediaType|description)$/.test(sort.active);
    const isunMappedTypeDate = /^(startDate|endDate)$/.test(sort?.active);

    this.contractLineItemsService
    .getLineItemsByESSearchId(this.elasticSearchId, sortDup, isFieldValueString, pagination, noLoader, this.unSubES$, isunMappedTypeDate)
    .subscribe((res: any) => {
      this.isLoadingLineItems = false;
      this.searchFilterApplied = true;

      const resData = res?.body;
      this.isSearchInValid = resData?.search?.isValid;

      if (!resData) {
        return;
      }
      this.tableRecords = resData;
      this.recordsFound = resData?.pagination?.found
      this.cdRef.markForCheck();
    });
  }

  private getLineItemsFieldSets(){
    return [
      '_id',
      'createdAt',
      'vendor',
      'lineItemType',
      'media.dma',
      'spotDetails.mediaType',
      'itemStatus',
      'spotDetails.mediaDescription',
      'startDate',
      'endDate',
      'updatedAt',
      'clientNet',
      'totalSummary',
      'IODates'
    ]
  }
  /**
   * @description
   * pagination calculation and index find for line item edit triggered
   */
  private paginationCalc(data) {
    if (!data) {
      return {};
    }
    const index = this.tableRecords?.results.findIndex(
      (each) => each._id === data.id
    );
    const pagination = Helper.deepClone(this.tableRecords?.pagination);
    pagination.page = (this.tableRecords?.pagination.page - 1) * 10 + index;
    pagination.perPage = 1;
    return pagination;
  }

  private _findClientByName(clientName: string): AppAutocompleteOptionsModel {
    const client = this.clientsAutoComplete.data.find(
      (client) => client.value === clientName
    );

    return client;
  }

  // on click Operations Contact
  public clickOperationsContact(event, item: any) {
    const index = this.selectedOperationsContact.findIndex( (client: any) => client.id == item.id );
    // Select the item
    if (event.checked && index < 0) {
      this.OperationsContactUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.OperationsContactUpdate(item, false);
    }
  }

  public OperationsContactUpdate(item: any, checkedItem = false) {
    const index = this.selectedOperationsContact.findIndex( (_contract: any) => _contract.id === item.id );
    const opContactIndex = this.operationContactsAutoComplete.data.findIndex( (_contract) => _contract.id === item.id );

    if (checkedItem) {
      this.selectedOperationsContact.push(item);
      if (opContactIndex > -1) {
        this.operationContactsAutoComplete.data[opContactIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedOperationsContact.splice(index, 1);
      }
      if (opContactIndex > -1) {
        this.operationContactsAutoComplete.data[
          opContactIndex
        ].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  public clientParentDisplayWithFn(clientName) {
    return clientName?.clientName ?? '';
  }

  // on click ClientParent
  public clickClientParent(event, item: ClientDetailsResponse) {
    const index = this.selectedClientParent.findIndex(
      (client) => client._id == item._id
    );
    // Select the item
    if (event.checked && index < 0) {
      this.clientParentUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.clientParentUpdate(item, false);
    }
  }

  // on click Parent Vendors
  public clickParentVendors(event, item: Vendor) {
    const index = this.selectedParentVendors.findIndex(
      (client) => client._id == item._id
    );
    // Select the item
    if (event.checked && index < 0) {
      this.parentVendorsUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.parentVendorsUpdate(item, false);
    }
  }

  public parentVendorsUpdate(item: Vendor, checkedItem = false) {
    const index = this.selectedParentVendors.findIndex(
      (_contract) => _contract._id == item._id
    );
    const vendorsIndex = this.parentVendorsAutoComplete.data.findIndex(
      (_contract) => _contract._id == item._id
    );

    if (checkedItem) {
      this.selectedParentVendors.push(item);
      if (vendorsIndex > -1) {
        this.parentVendorsAutoComplete.data[vendorsIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedParentVendors.splice(index, 1);
      }
      if (vendorsIndex > -1) {
        this.parentVendorsAutoComplete.data[vendorsIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  public parentVendorsDisplayWithFn(vendor) {
    return vendor?.name ?? '';
  }

  /** Parent Vendors */
  public updateParentVendorsContainer() {
    this.panelParentVendorsContainer = '.parent-vendors-list-autocomplete';
  }
  public parentVendorsTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  // on click Vendors
  public clickVendors(event, item: Vendor) {
    const index = this.selectedVendors.findIndex(
      (client) => client._id == item._id
    );
    // Select the item
    if (event.checked && index < 0) {
      this.vendorsUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.vendorsUpdate(item, false);
    }
  }

  public updateOperationContactSelectedData() {
    this.operationContactsAutoComplete?.data?.map(element => {
      const index = this.selectedOperationsContact.findIndex(
        item => item._id == element._id
      );
      element.selected = index > -1;
    });
  }

  public vendorsUpdate(item: Vendor, checkedItem = false) {
    const index = this.selectedVendors.findIndex(
      (_contract) => _contract._id == item._id
    );
    const vendorsIndex = this.vendorsAutoComplete.data.findIndex(
      (_contract) => _contract._id == item._id
    );

    if (checkedItem) {
      this.selectedVendors.push(item);
      if (vendorsIndex > -1) {
        this.vendorsAutoComplete.data[vendorsIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedVendors.splice(index, 1);
      }
      if (vendorsIndex > -1) {
        this.vendorsAutoComplete.data[vendorsIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  public clickReseller(event, item: Vendor) {
    const index = this.selectedResellers.findIndex(
      (client) => client._id == item._id
    );
    // Select the item
    if (event.checked && index < 0) {
      this.resellerUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.resellerUpdate(item, false);
    }
  }

  public resellerUpdate(item: Vendor, checkedItem = false) {
    const index = this.selectedResellers.findIndex(
      (_contract) => _contract._id == item._id
    );
    const vendorsIndex = this.resellerAutoComplete.data.findIndex(
      (_contract) => _contract._id == item._id
    );

    if (checkedItem) {
      this.selectedResellers.push(item);
      if (vendorsIndex > -1) {
        this.resellerAutoComplete.data[vendorsIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedResellers.splice(index, 1);
      }
      if (vendorsIndex > -1) {
        this.resellerAutoComplete.data[vendorsIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  public clickCampaign(event, item: Vendor) {
    const index = this.selectedCampaigns.findIndex(
      (client) => client._id == item._id
    );
    // Select the item
    if (event.checked && index < 0) {
      this.campaignUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.campaignUpdate(item, false);
    }
  }

  public campaignUpdate(item: Vendor, checkedItem = false) {
    const index = this.selectedCampaigns.findIndex(
      (_contract) => _contract._id == item._id
    );
    const vendorsIndex = this.campaignsAutoComplete.data.findIndex(
      (_contract) => _contract._id == item._id
    );

    if (checkedItem) {
      this.selectedCampaigns.push(item);
      if (vendorsIndex > -1) {
        this.campaignsAutoComplete.data[vendorsIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedCampaigns.splice(index, 1);
      }
      if (vendorsIndex > -1) {
        this.campaignsAutoComplete.data[vendorsIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  clickManagedBy(event, item) {
    const index = this.selectedManagedByers.findIndex(
      (client) => client.id == item.id
    );
    // Select the item
    if (event.checked && index < 0) {
      this.managedByUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.managedByUpdate(item, false);
    }
  }

  public managedByUpdate(item: any, checkedItem = false) {
    const index = this.selectedManagedByers.findIndex(
      (_contract) => _contract.id == item.id
    );
    const vendorsIndex = this.managedByAutoComplete.data.findIndex(
      (_contract) => _contract.id == item.id
    );

    if (checkedItem) {
      this.selectedManagedByers.push(item);
      if (vendorsIndex > -1) {
        this.managedByAutoComplete.data[vendorsIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedManagedByers.splice(index, 1);
      }
      if (vendorsIndex > -1) {
        this.managedByAutoComplete.data[vendorsIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  clickEstimate(event, item) {
    const index = this.selectedEstimates.findIndex(
      (client) => client._id == item._id
    );
    // Select the item
    if (event.checked && index < 0) {
      this.estimateUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.estimateUpdate(item, false);
    }
  }

  subscribeOnEstimateChange() {
    const estimateSearchCtrl = this.reportGenerateForm?.controls?.estimate?.valueChanges;
    if (estimateSearchCtrl) {
      this.estimatesAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        estimateSearchCtrl
      );
      this.estimatesAutoComplete.apiEndpointMethod = () => {
        if (this.selectedProduct && this.selectedProduct?._id) {
          return this.recordService.getEstmate(
            this.formateSearchPayload(),
            this.selectedClient?._id,
            this.estimatesAutoComplete?.pagination,
            null,
            this.siteName,
            true
          );
        } else {
          return of([]);
        }
      }
      this.estimatesAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'estimate',
        null,
        (res) => {
          this.estimatesAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }
  private formateSearchPayload(){
    const estimateSearchText = this.reportGenerateForm?.controls?.estimate?.value;
    let searchPayload: EstimateSearchFilter = {
      search: '',
      filters: {}
    };
    if (this.selectedProduct) {
      searchPayload.filters = {
        productIds: [
          this.selectedProduct._id
        ]
      }
    }
    if(estimateSearchText && estimateSearchText?.toString().trim().length){
      searchPayload.search = estimateSearchText;
    }else{
      delete searchPayload.search;
    }
    return searchPayload;
  }

  public estimateUpdate(item: Vendor, checkedItem = false) {
    const index = this.selectedEstimates.findIndex(
      (_contract) => _contract._id == item._id
    );
    const vendorsIndex = this.estimatesAutoComplete.data.findIndex(
      (_contract) => _contract._id == item._id
    );

    if (checkedItem) {
      this.selectedEstimates.push(item);
      if (vendorsIndex > -1) {
        this.estimatesAutoComplete.data[vendorsIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedEstimates.splice(index, 1);
      }
      if (vendorsIndex > -1) {
        this.estimatesAutoComplete.data[vendorsIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  clientAndProductValueResetter(): void {
    this.reportGenerateForm.controls.client.valueChanges
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe((_) => {
        this.selectedEstimates = [];
        this.selectedClient = null;
        this.selectedProduct = null;
        this.reportGenerateForm.controls.estimate.patchValue('');
        this.reportGenerateForm.controls.product.patchValue('');
      });

    this.reportGenerateForm.controls.product.valueChanges
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe((_) => {
        this.selectedEstimates = [];
        this.selectedProduct = null;
        this.reportGenerateForm.controls.estimate.patchValue('');
      });
  }

  public get isClientSelected() {
    const companyInput = this.reportGenerateForm?.get('client');
    return this.selectedClient && companyInput?.value?._id;
  }

  public get isProductSelected() {
    const companyInput = this.reportGenerateForm?.get('product');
    return companyInput?.value?._id;
  }

  /**
   * @description
   * set parameters and call line item export API
   */
  public lineItemsExport(filename = '') {
    const payload: any = { filter: this.buildPayload() };
    if(!payload?.filter) return;
    const fieldSet = '';

    if (filename) {
      payload.filename = filename;
    }

    this.contractLineItemsService
      .exportLineItems(payload, fieldSet, this.sort)
      .subscribe((response: any) => {
        const contentType = response['headers'].get('content-type');
        const contentDispose = response.headers.get('Content-Disposition');
        const matches = contentDispose?.split(';')[1].trim().split('=')[1];
        if (contentType.includes('text/csv')) {
          let filename =
            matches && matches.length > 1 ? matches : 'line_items.csv';
          filename = filename.slice(1, filename.length-1);
          saveAs(response.body, filename);
        } else {
          this._showsAlertMessage(
            'Something went wrong, Please try again later'
          );
        }
      });
  }

  public exportLineItems(isForDownload: boolean) {
    if (isForDownload) {
      this.lineItemsExport();
    } else {
      this.dialog
        .open(SaveAsFileComponent, {
          panelClass: 'imx-mat-dialog',
          width: '500px',
          disableClose: true
        })
        .afterClosed()
        .subscribe((filename) => {
          if (filename) {
            this.lineItemsExport(filename);
          }
        });
    }
  }

  private _showsAlertMessage(msg) {
    const config: MatSnackBarConfig = {
      duration: 3000
    };

    this.matSnackBar.open(msg, '', config);
  }

  private buildPayload() {
    let payload = Helper.deepClone(this.reportGenerateForm.value);
    delete payload.estimate; // delete duplicate value from form value to avoid payload redundant
    if (payload.startDate) {
      const startDate = new Date(payload.startDate);
      payload.startDate = format(startDate, 'MM/dd/yyyy', {
        locale: enUS
      });
    }
    if (payload.endDate) {
      const endDate = new Date(payload.endDate);
      payload.endDate = format(endDate, 'MM/dd/yyyy', {
        locale: enUS
      });
    }
    if (payload.revisedSince) {
      const revisedSince = new Date(payload.revisedSince);
      payload.revisedSince = format(revisedSince, 'MM/dd/yyyy', {
        locale: enUS
      });
    }
    if (payload.enteredSince) {
      const enteredSince = new Date(payload.enteredSince);
      payload.enteredSince = format(enteredSince, 'MM/dd/yyyy', {
        locale: enUS
      });
    }
    if (this.selectedClientParent?.length) {
      payload.parentClientIds = this.selectedClientParent.map(
        (clientParent) => clientParent?._id
      );
      payload.parentClientData = this.selectedClientParent;
    } else if (this.searchSavedData?.parentClientIds) {
      payload.parentClientIds = this.searchSavedData?.parentClientIds;
      payload.parentClientData = this.searchSavedData?.parentClientData;
    }
    if (this.selectedVendors?.length) {
      payload.vendorIds = this.selectedVendors.map((item) => item?._id);
      payload.vendorData = this.selectedVendors;
    } else if (this.searchSavedData?.vendorIds) {
      payload.vendorIds = this.searchSavedData?.vendorIds;
      payload.vendorData = this.searchSavedData?.vendorData;
    }
    if (this.selectedAgency?.length) {
      payload.agencies = this.selectedAgency.map((item) => item?._id);
      payload.agenciesData = this.selectedAgency;
    } else if (this.searchSavedData?.agencies) {
      payload.agencies = this.searchSavedData?.agencies;
      payload.agenciesData = this.searchSavedData?.agenciesData;
    }
    if (this.selectedParentVendors?.length) {
      payload.parentVendorIds = this.selectedParentVendors.map(
        (item) => item?._id
      );
      payload.parentVendorData = this.selectedParentVendors;
    } else if (this.searchSavedData?.parentVendorIds) {
      payload.parentVendorIds = this.searchSavedData?.parentVendorIds;
      payload.parentVendorData = this.searchSavedData?.parentVendorData;
    }
    if (this.selectedEstimates?.length) {
      payload.estimateName = this.selectedEstimates.map(
        (item) => item?.estimateName
      );
      payload.estimateData = this.selectedEstimates;
    } else if (this.searchSavedData?.estimateName) {
      payload.estimateName = this.searchSavedData?.estimateName;
      payload.estimateData = this.searchSavedData?.estimateData;
    }
    if (this.selectedResellers?.length) {
      payload.reseller = this.selectedResellers.map((item) => item?._id);
      payload.resellerData = this.selectedResellers;
    } else if (this.searchSavedData?.reseller) {
      payload.reseller = this.searchSavedData?.reseller;
      payload.resellerData = this.searchSavedData?.resellerData;
    }
    if (this.selectedCampaigns?.length) {
      payload.campaign = this.selectedCampaigns.map((item) => item?._id);
      payload.campaignData = this.selectedCampaigns;
    } else if (this.searchSavedData?.campaign) {
      payload.campaign = this.searchSavedData?.campaign;
      payload.campaignData = this.searchSavedData?.campaignData;
    }

    if (this.buyersAutoComplete.selectedData?.length) {
      payload.buyers = this.buyersAutoComplete.selectedData.map(
        (buyer) => buyer?._id
      );
      payload.buyersData = this.buyersAutoComplete?.selectedData;
    } else if (this.searchSavedData?.buyers) {
      payload.buyers = this.searchSavedData?.buyers;
      payload.buyersData = this.searchSavedData?.buyersData;
    }

    if (this.selectedOperationsContact?.length) {
      payload.operationsContacts = this.selectedOperationsContact.map( (item: any) => item?.id );
      payload.operationsContactsData = this.selectedOperationsContact;
    } else if (this.searchSavedData?.operationsContacts) {
      payload.operationsContacts = this.searchSavedData?.operationsContacts;
      payload.operationsContactsData = this.searchSavedData?.operationsContactsData;
    }
    if (this.selectedManagedByers?.length) {
      payload.clientManagedBy = this.selectedManagedByers.map(
        (item) => item?.id
      );
      payload.clientManagedByData = this.selectedManagedByers;
    } else if (this.searchSavedData?.clientManagedBy) {
      payload.clientManagedBy = this.searchSavedData?.clientManagedBy;
      payload.clientManagedByData = this.searchSavedData?.clientManagedByData;
    }
    if (payload.market) {
      payload.dma = payload.market;
    }
    if (payload.product?._id) {
      payload.products = [payload.product?._id];
      payload.productData = payload.product;
    }
    if (payload?.client) {
      payload.clientName = payload?.client.clientName;
      payload.clientData = payload?.client;

    }
    if (payload?.office) {
      payload.offices = payload?.office;
    }
    if (
      payload?.contractNumber ||
      typeof payload?.contractNumber === 'string'
    ) {
      payload.contractNumber = Number(payload?.contractNumber);
    }
    if (
      payload?.estimateId ||
      typeof payload?.estimateId === 'string'
    ) {
      payload.estimate = payload?.estimateId;
    }


    delete payload.clientParent;
    delete payload.vendor;
    delete payload.parentVendor;
    delete payload.market;
    delete payload.client;
    delete payload.office;
    delete payload.programmaticPartnerReseller;
    delete payload.estimateId;
    delete payload.product;
    delete payload.agency;

    payload = Helper.removeEmptyOrNullRecursive(payload);
    payload = Helper.removeEmptyArrayAndEmptyObject(payload);
    payload = Helper.removeBooleanType(payload, false)

    // save payload to localstorage and delete the properties which is not required for search
    this.contractLineItemsService.setLineItemListLocal('searchLineItem', payload);
    delete payload.campaignData;
    delete payload.clientManagedByData;
    delete payload.operationsContactsData;
    delete payload.parentClientData;
    delete payload.agenciesData;
    delete payload.vendorData;
    delete payload.parentVendorData;
    delete payload.clientData;
    delete payload.productData;
    delete payload.estimateData;
    delete payload.resellerData;
    delete payload.buyersData;

    // Formvalidating for avoid empty form search.
    if (payload && Object.keys(payload).length === 0) {
      return null;
    }
    return payload;
  }

  public loadMoreParentVendorData() {
    this.parentVendorsAutoComplete.loadMoreData(null,()=>{
      this.parentVendorsAutoComplete.data.map((element) => {
        const index = this.selectedParentVendors.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }

  public loadMoreVendorData() {
    this.vendorsAutoComplete.loadMoreData(null,()=>{
      this.vendorsAutoComplete.data.map((element) => {
        const index = this.selectedVendors.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }

  public loadMoreEstimate() {
    this.estimatesAutoComplete.loadMoreData(null,()=>{
      this.estimatesAutoComplete.data.map((element) => {
        const index = this.selectedEstimates.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }

  public loadMoreAgencies() {
    this.agenciesAutoComplete.loadMoreData(null,()=>{
      this.agenciesAutoComplete.data.map((element) => {
        const index = this.selectedAgency.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }

  public loadMoreParentClient() {
    this.parentClientsAutoComplete.loadMoreData(null,()=>{
      this.parentClientsAutoComplete.data.map((element) => {
        const index = this.selectedClientParent.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }

  public loadMoreOperationContacts() {
    this.operationContactsAutoComplete.loadMoreData(null, (res) => {
      this.operationContactsAutoComplete.data.map((element) => {
        const index = this.selectedOperationsContact.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }

  public loadMoreManagementUsers() {
    this.managedByAutoComplete.loadMoreData(null, (res) => {
      this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
      this.managedByAutoComplete.data.map((element) => {
        const index = this.selectedManagedByers.findIndex(
          (item) => item.id === element.id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }

  loadMoreCampaign() {
    this.campaignsAutoComplete.loadMoreData(null,()=>{
      this.campaignsAutoComplete.data.map((element) => {
        const index = this.selectedCampaigns.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
    });
  }

  public handleScroll(){
    this.managerAutoCompleteTrigger.closePanel();
    this.triggerOperationsContact.closePanel();
    this.triggerCampaign.closePanel();
    this.triggerClientParent.closePanel();
    this.triggerAgency.closePanel();
    this.triggerVendor.closePanel();
    this.triggerParentVendor.closePanel();
    this.triggerOperationsContact.closePanel();
    this.triggerClientName.closePanel();
    this.triggerProductName.closePanel();
    this.triggerEstimate.closePanel();
    this.triggerPartnerReseller.closePanel();
  }

  public get minDateForEndDate() {
    let minDate: any = '';
    if (this.reportGenerateForm.controls?.startDate?.value) {
      minDate = new Date(this.reportGenerateForm.controls?.startDate?.value);
      minDate.setDate(minDate.getDate());
    }

    return minDate;
  }

  private initOperationContacts() {
    this.subscription = this.recordService
      .getContactTypes({ page: 1, perPage: 50 })
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        const types: any[] = res?.results ? res.results : [];
        const selectedValue = types?.filter(each => each?.name.toLowerCase() == CONTACT_LIST_TYPES.OPERATIONS.toLowerCase()).map(_val => _val?._id);
        this.setupOperationContacts(selectedValue);
      });
  }

}

