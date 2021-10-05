import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ClientProduct, Contact } from '@interTypes/records-management';
import { AbstractReportGenerateComponent } from '../../../reports/abstract-report-generate.component';
import { Agency } from '@interTypes/records-management/agencies/agencies.response';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { VendorService } from '../../../records-management-v2/vendors/vendor.service';
import { RecordService } from '../../../records-management-v2/record.service';
import {
  AuthenticationService,
  InventoryService,
  SnackbarService,
  ThemeService
} from '@shared/services';
import { ReportsAPIService } from '../../../reports/services/reports-api.service';
import { FiltersService } from '../../../explore/filters/filters.service';
import { MatOption, MatOptionSelectionChange } from '@angular/material/core';
import { Project } from '@interTypes/workspaceV2';
import { Report } from '@interTypes/reports';
import { AppAutocompleteOptionsModel } from '@shared/components/app-autocomplete/model/app-autocomplete-option.model';
import { filter, switchMap, takeUntil } from 'rxjs/operators';
import {
  ApiIncoming,
  ContractsSearchBuyerApi,
  ContractStatus
} from '../../models';
import { AutocompleteMapper } from '../../contracts/contracts-shared/helpers/autocomplete.mapper';
import { ContractsService } from '../../services/contracts.service';
import { UseAutoCompleteInfiniteScroll } from '../../../classes/use-auto-complete-infinite-scroll';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { User } from '@auth0/auth0-spa-js';
import { ContractsSearchService } from '../../services/contracts-search.service';
import { Sort } from '@angular/material/sort';
import { Pagination } from '../../models/pagination.model';
import { Helper } from '../../../classes';
import { AddLineItemDialogComponent } from '../../contracts/contracts-list/contract-details/core-details/add-line-item-dialog/add-line-item-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { EstimateSearchFilter, Vendor } from '@interTypes/inventory-management';
import { BillingExportService } from 'app/contracts-management/services/billing-export.service';
import { BillingExportApiResponce, IOExportsResponse } from 'app/contracts-management/models/billing-export.model';
import { BillingExportDialogComponent } from '../billing-export-dialog/billing-export-dialog.component';
import { ContractLineItemsService } from 'app/contracts-management/services/contract-line-items.service';
import { of, Subject } from 'rxjs';
import { forbiddenNamesValidator } from '@shared/common-function';
import { CONTACT_LIST_TYPES } from '@constants/contact-list-types';

@Component({
  selector: 'app-export-search',
  templateUrl: './export-search.component.html',
  styleUrls: ['./export-search.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FiltersService, ReportsAPIService, InventoryService],
})
export class ExportSearchComponent
extends AbstractReportGenerateComponent
implements OnInit {
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
// public selectProduct: ClientProduct;
public selectedOffice;
public maxDate = new Date('12/31/9999');

public selectedReportTypes: Report[] = [];
public panelCampaignContainer: string;
public PartnerResellerContainer: string;
public contrtactStatusesAutocompleteItems: AppAutocompleteOptionsModel[] = [];
public itemStatuses: any[] = [];
public operationContactsAutoComplete = new UseAutoCompleteInfiniteScroll();
@ViewChild('operationContactsInputRef', { read: MatAutocompleteTrigger })
public operationContactsAutoCompleteTrigger: MatAutocompleteTrigger;
public operationContactPanelContainer = '';
public usersAutocompleteItems: AppAutocompleteOptionsModel[];
public tableRecords: BillingExportApiResponce;
public recordsFound = 0;
public sort: Sort = {
  active: 'lineItemId',
  direction: 'asc'
};
public searchFilterApplied = false;
public isLoading = false;
public selectAll = false;
public indeterminateAll = false;
@ViewChild('allSelected') private allSelected: MatOption;
public resetSelection$: Subject<any> = new Subject<any>();
public missingKeys = [
  // {id: 'All', name: 'Select All'},
  {id: 'Client Code', name: 'Client Code'},
  {id: 'Product Code', name: 'Product Code'},
  {id: 'Estimate ID', name: 'Estimate #'},
  {id: 'PUB ID', name: 'PUB ID'}
];
public exportStatusOptions = [
  'All',
  'Ready to be Exported',
  'Exported Only',
  'Waiting for Approval'
];
public doNotExportStatusOptions = [
  {id: '', name: 'All'},
  {id: false, name: 'Unmarked'},
  {id: true, name: 'Marked'}
];
@ViewChild('managerInputRef', { read: MatAutocompleteTrigger })
public managerAutoCompleteTrigger: MatAutocompleteTrigger;
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
@ViewChild('triggerOperationsContact', { read: MatAutocompleteTrigger })
public triggerOperationsContact: MatAutocompleteTrigger;
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
public pagination = {
  page: 1,
  perPage: 10
};
public selectedOperationsContact: Contact[] = [];
public selectedVendors: Vendor[] = [];
public selectedParentVendors: Vendor[] = [];
public selectedBuyers: any[] = [];
public selectedResellers: any[] = [];
public selectedManagedByers: any[] = [];
public selectedCampaigns: any[] = [];
public selectedEstimates: any[] = [];
public reportGenerateFormState: any;

public buyerAutoComplete: UseAutoCompleteInfiniteScroll<any> = new UseAutoCompleteInfiniteScroll<any>();
public panelBuyerContainer: string;

private LOCAL_STORAGE_KEY = "billing-exports-list-search-criteria";

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
  private billingExportService: BillingExportService,
  public dialog: MatDialog,
  private snackbarService: SnackbarService,
  public cdRef: ChangeDetectorRef,
  private contractLineItemsService:ContractLineItemsService,
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

ngOnInit(): void {
  super.ngOnInit();
  // Commented based on IMXUIPRD-3940-Default screen should be empty on out of contracts modules.
  //this.searchBillingExportItems(this.sort, this.pagination);
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
  this.initBuyerCotactSetup();
  this.setupManagedByUsers();
  this.clientAndProductValueResetter();

  this.updateLastSearchCriteria();
}

onFormSubmit() {
  if (this.reportGenerateForm.valid) {
    this.reportGenerateFormState = this.reportGenerateForm.value;
    this.searchBillingExportItems(this.sort, this.pagination);
    this.resetSelection$.next({newSearch:true});
  }
}

reSize() {
  if (window.innerHeight < 1100) {
    this.scrollContent = window.innerHeight - (window.innerHeight - 250);
  } else {
    this.scrollContent = null;
  }
}

buildForm() {
  this.reportGenerateForm = this.fb.group({
    exportStatus: [],
    doNotExportStatus: [],
    startDate: [null],
    endDate: [null],
    revisedSince: [],
    createdSince: [],
    divisions: [],
    office: [],
    clientTypes: [],
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
    estimateNumber: '',
    vendor: [],
    parentVendor: [],
    programmaticPartnerReseller: [],
    mediaClasses: [],
    placeTypes: [],
    isDigital: [false],
    mediaTypes: [],
    market: [],
    invoiceDate: [],
    dueDate: [],
    invoice: [],
    lineItemIDs: [],
    invoiceNotes: [],
    // contactStatus: [],
    // itemStatus: [],
    buyers: [],
    operationsContacts: [],
    clientManagedBy: [],
    missingKeyValues: [],
    tbd: [false],
    isDeleted: [false],
    userType: []
  });
}

onSelectClient(event: any) {
  this.selectedClient = event.option.value;
  this.productsAutoComplete.loadData(null, null);
  this.selectedEstimates = [];
}

onSelectClientProduct(event: any) {
  this.selectedProduct = event.option.value;
  this.selectedEstimates = [];
  this.subscribeOnEstimateChange();
  this.estimatesAutoComplete.loadData(null, (res) => {
    this.estimatesAutoComplete.data = res.results;
    this.updateEstimateSelectedData();
    this.cdRef.markForCheck();
  });
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

public updateCampaignContainer() {
  this.panelCampaignContainer = '.campaign-list-autocomplete';
}

// Campaign autocomplete

public campaignWithFn(project: Project) {
  return project?.name ?? '';
}

public onSelectCampaign(event) {
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

public updateOperationContactSelectedData() {
  this.operationContactsAutoComplete?.data?.map(element => {
    const index = this.selectedOperationsContact.findIndex(
      item => item._id == element._id
    );
    element.selected = index > -1;
  });
}

public updateOperationsContactContainer() {
  this.operationContactPanelContainer =
    '.operation-contacts-list-autocomplete';
}

public operationContactsTrackByFn(idx: number, user: any) {
  return user?._id ?? idx;
}

public operationContactsDisplayWithFn(user: any) {
  return user?.email ?? '';
}

// public loadMoreOperationContacts() {
//   this.operationContactsAutoComplete.loadMoreData(null, (res) => {
//     this.operationContactsAutoComplete.data = res.results;
//     this.cdRef.markForCheck();
//   });
// }

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
resetBuyers() {
  this.panelBuyerContainer = '';
  this.buyerAutoComplete.resetAll();
  this.buyerAutoComplete.loadData(null, null);
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

public onResetForm() {
  this.searchFilterApplied = false;
  this.reportGenerateFormState = '';
  this.reportGenerateForm.reset();
  this.selectedOperationsContact = [];
  this.selectedVendors = [];
  this.selectedParentVendors = [];
  this.selectedBuyers = [];
  this.selectedResellers = [];
  this.selectedManagedByers = [];
  this.selectedCampaigns = [];
  this.selectedAgency = [];
  this.selectedClientParent = [];
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
  this.resetBuyers();
  this.resetOperationContact();
  this.resetClientName();

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
  // this.searchBillingExportItems(this.sort, this.pagination);
  // {pagination: { total: null, page: null, pageSize: null, perPage: null, found: null }, results: [] } as BillingExportApiResponce
  this.tableRecords = {pagination: {}, results: []} as BillingExportApiResponce;
  this.recordsFound = 0;
  this.resetSelection$.next({reset:true});
  this.resetLocalstorageSearchCriteria();
}

onPaginationChanged(event: Pagination) {
  this.pagination = event;
  this.billingExportService.setContractDetailLineItemProp(
    'paginationEvent',
    event
  );
  this.searchBillingExportItems(this.sort, this.pagination);
}

onSortingChanged(event: Sort) {
  this.sort = { ...event };
  this.billingExportService.setContractDetailLineItemProp(
    'sortEvent',
    event
  );
  this.searchBillingExportItems(this.sort, this.pagination);
}

onEditLineItem(data: any, isForDuplicate = false) {
  const splitId = data?.lineItemId.toString().split('-');
  this.contractLineItemsService
    .getLineItemByIineItemNo(data?.contract?._id, splitId[splitId.length - 1])
    .subscribe((res) => {
      let paginate = res?.pagination?.found ? res?.pagination : {
        total: 2,
        found: 2,
        page: 1,
        perPage: 1,
        pageSize: 1
      };
      paginate.perPage = 1;
      paginate.pageSize = 1;
      paginate.found = paginate.total;
      this.onAddLineItemsDialog(data.contract, data, isForDuplicate, paginate);
    });
}

deleteLineItem(element) {
  // this.dialog
  //   .open(DeleteConfirmationDialogComponent, {
  //     width: '340px',
  //     height: '260px',
  //     panelClass: 'imx-mat-dialog'
  //   })
  //   .afterClosed()
  //   .pipe(
  //     filter((res) => res && res['action']),
  //     switchMap(() =>
  //       this.billingExportService.deleteLineItem(
  //         element.contract._id,
  //         element._id
  //       )
  //     ),
  //     filter((res: any) => res?.status === 'success')
  //   )
  //   .subscribe((res) => {
  //     this.snackbarService.showsAlertMessage(
  //       'Line Item deleted successfully'
  //     );
  //     this.searchBillingExportItems(this.sort, this.pagination);
  //   });
}

onAddLineItemsDialog(contract, lineItemData?: any, isForDuplicate = false, paginate = {}) {
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
      clientId: contract?.client?._id,
      pagination: paginate,
      sort: Helper.deepClone(this.sort)
    }
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.searchBillingExportItems(this.sort, this.pagination);
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
  return user?.name ?? '';
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
        this.updateClientManagedSelectedData();
        this.cdRef.markForCheck();
      });

      this.managedByAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'clientManagedBy',
        null,
        (res) => {
          this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
          this.updateClientManagedSelectedData();
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public updateClientManagedSelectedData() {
    this.managedByAutoComplete?.data?.map(element => {
      const index = this.selectedManagedByers.findIndex(
        item => item.id == element.id
      );
      element.selected = index > -1;
    });
  }

  public updateBuyersSelectedData() {
    this.buyerAutoComplete?.data?.map(element => {
      const index = this.selectedBuyers.findIndex(
        item => item.id == element.id
      );
      element.selected = index > -1;
    });
  }

  public updateOperationSelectedData() {
    this.operationContactsAutoComplete?.data?.map(element => {
      const index = this.selectedOperationsContact.findIndex(
        item => item._id == element._id
      );
      element.selected = index > -1;
    });
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

private initBuyerCotactSetup() {
  this.recordService
    .getContactTypes({ page: 1, perPage: 50 })
    .pipe(filter((res) => !!res.results), takeUntil(this.unsubscribe$))
    .subscribe((res) => {
      const types: any[] = res?.results ? res.results : [];
      const selectedValue = types?.filter(each =>
        each?.name.toLowerCase() == CONTACT_LIST_TYPES.MEDIA.toLowerCase() ||
        each?.name.toLowerCase() == CONTACT_LIST_TYPES.MANAGEMENT.toLowerCase()
      ).map(_val => _val?._id);

      const selectedOperations = types?.filter(each =>
        each?.name.toLowerCase() == CONTACT_LIST_TYPES.OPERATIONS.toLowerCase()).map(_val => _val?._id);
      this.setUpBuyerContacts(selectedValue);
      this.setUpOperationContacts(selectedOperations);
    });
}

private setUpOperationContacts(contactTypes = []) {
  const operationSearchCtrl = this.reportGenerateForm?.controls?.operationsContacts?.valueChanges;

  if (operationSearchCtrl) {
    this.operationContactsAutoComplete.loadDependency(
      this.cdRef,
      this.unsubscribe$,
      operationSearchCtrl
    );
    this.operationContactsAutoComplete.pagination.perPage = 25;

    this.operationContactsAutoComplete.apiEndpointMethod = () => {
      const payload = {
        search: this.operationContactsAutoComplete.searchStr,
        filter: {
          companyTypes: ['User'],
          contactTypes: contactTypes
        }
      };
      const fieldSet = ["_id", "firstName", "lastName", "companyId", "address", "updatedAt", "companyType", "email", "mobile", "note"];
      return this.contractsSearchService
        .getContacts(
          payload,
          fieldSet,
          this.operationContactsAutoComplete.pagination,
        )
        .pipe(filter((res: any) => !!res.results));
    };

    this.operationContactsAutoComplete.listenForAutoCompleteSearch(
      this.reportGenerateForm,
      'operationsContacts',
      null,
      (res) => {
        this.operationContactsAutoComplete.data = res.results;
        this.updateOperationSelectedData();
        this.cdRef.markForCheck();
      }
    );
    this.operationContactsAutoComplete.loadData(null, (res) => {
      this.operationContactsAutoComplete.data = res.results;
      this.updateOperationSelectedData();
      this.cdRef.markForCheck();
    });
  }
}
private setUpBuyerContacts(contactTypes = []) {
  const buyerSearchCtrl = this.reportGenerateForm?.controls?.buyers?.valueChanges;

  if (buyerSearchCtrl) {
    this.buyerAutoComplete.loadDependency(
      this.cdRef,
      this.unsubscribe$,
      buyerSearchCtrl
    );
    this.buyerAutoComplete.pagination.perPage = 25;

    this.buyerAutoComplete.apiEndpointMethod = () => {
      const payload = {
        search: this.buyerAutoComplete.searchStr,
        filter: {
          companyTypes: ['User'],
          contactTypes: contactTypes
        }
      };
      const fieldSet = ["_id", "firstName", "lastName", "companyId", "address", "updatedAt", "companyType", "email", "mobile", "note"];
      return this.contractsSearchService
        .getContacts(
          payload,
          fieldSet,
          this.buyerAutoComplete.pagination,
        )
        .pipe(filter((res: any) => !!res.results));
    };

    this.buyerAutoComplete.listenForAutoCompleteSearch(
      this.reportGenerateForm,
      'buyers',
      null,
      (res) => {
        this.buyerAutoComplete.data = res.results;
        this.updateBuyersSelectedData();
        this.cdRef.markForCheck();
      }
    );
    this.buyerAutoComplete.loadData(null, (res) => {
      this.buyerAutoComplete.data = res.results;
      this.updateBuyersSelectedData();
      this.cdRef.markForCheck();
    });
  }
}

public updateBuyerContainer() {
  this.panelBuyerContainer = '.buyer-list-autocomplete';
}

public buyerDisplayWithFn(buyer) {
  return buyer?.firstName ? buyer?.firstName +' '+ buyer?.lastName : '';
}

public buyerTrackByFn(idx: number, buyer) {
  return buyer?._id ?? idx;
}

private getAllUsers() {
  this.contractsSearchService
    .getAllUsers()
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe((res: ContractsSearchBuyerApi) => {
      this.usersAutocompleteItems = AutocompleteMapper<User>(res.result);
    });
}

// table related code
private searchBillingExportItems(
  sort: Sort = null,
  pagination: Pagination = null
) {
  const sortDup = Helper.deepClone(sort);
  if (sortDup['active'] === 'lineItemId') {
    sortDup['active'] = 'createdAt';
  }

  let payload = this.formattingPayloadData();
  if(!payload) return;
  
  this.searchFilterApplied = !!Object.keys(payload).length;
  this.isLoading = true;
  if(this.searchFilterApplied) {
    setTimeout(() => {
      document.getElementById('contracts-management__SCROLLABLE').scrollTop = document.getElementById('billing-export-table').offsetTop + 50;
    }, 100)
  }
  

  this.billingExportService
    .searchAllBillings(sortDup, pagination, [], payload)
    .subscribe((res: BillingExportApiResponce) => {
      this.tableRecords = res;
      this.recordsFound = res?.pagination?.found;
      this.isLoading = false;
      // this.cdRef.markForCheck();
      this.cdRef.detectChanges();
    });
    if (payload) {
      this.setFiltersInLocalstorage(
        Helper.deepClone(this.reportGenerateForm.value),
        pagination,
        sort
      );
    }
}

private formattingPayloadData(){
  // let payload = Helper.deepClone(this.reportGenerateForm.value);
  let payload = Helper.deepClone(this.reportGenerateFormState ? this.reportGenerateFormState : this.reportGenerateForm.value);
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
  if (payload.createdSince) {
    const createdSince = new Date(payload.createdSince);
    payload.createdSince = format(createdSince, 'MM/dd/yyyy', {
      locale: enUS
    });
  }
  if (payload?.office) {
    payload.offices = payload.office
  }
  if (this.selectedClientParent) {
    payload.parentClientIds = this.selectedClientParent.map(
      (clientParent) => clientParent?._id
    );
  }
  if (this.selectedVendors) {
    payload.vendorIds = this.selectedVendors.map((item) => item?._id);
  }
  if (this.selectedAgency) {
    payload.agencyIds = this.selectedAgency.map((item) => item?._id);
  }
  if (this.selectedParentVendors) {
    payload.parentVendorIds = this.selectedParentVendors.map(
      (item) => item?._id
    );
  }
  if (this.selectedBuyers) {
    payload.buyers = this.selectedBuyers.map(
      (item) => item?._id
    );
  }
  if (this.selectedEstimates) {
    payload.estimateIds = this.selectedEstimates.map(
      (item) => item?._id
    );
  }
  if (payload?.estimateNumber) {
    payload.estimateNumber = +(payload.estimateNumber);
  }

  if (this.selectedResellers) {
    payload.reseller = this.selectedResellers.map((item) => item?._id);
  }
  if (this.selectedCampaigns) {
    payload.campaigns = this.selectedCampaigns.map((item) => item?._id);
  }
  if (this.selectedOperationsContact) {
    payload.operationsContacts = this.selectedOperationsContact.map(
      (item) => item?._id
    );
  }
  if (this.selectedManagedByers) {
    payload.clientManagedBy = this.selectedManagedByers.map(
      (item) => item?.id
    );
  }
  if (payload.market) {
    payload.dma = payload.market;
  }
  if (payload.product?._id) {
    payload.productIds = [payload.product._id];
  }
  if (payload?.client) {
    payload.clientIds = [payload?.client.id];
  }
  if (payload?.missingKeyValues?.includes('All')) {
    payload.missingKeyValues = 'All'
  }
  if (!payload?.isDeleted) {
    payload.isDeleted = null;
  }
  if (!payload?.tbd) {
    payload.tbd = null;
  }
  if (!payload?.isDigital) {
    payload.isDigital = null;
  }
  if (payload?.lineItemIDs) {
    payload.lineItemIDs = payload.lineItemIDs.split(';');
  }
  if(
    (payload?.contractNumber || typeof payload?.contractNumber === 'string') && payload?.contractNumber > 0
  ) {
    payload.contractNumber = Number(payload?.contractNumber);
  }

  delete payload.clientParent;
  delete payload.vendor;
  delete payload.parentVendor;
  delete payload.market;
  delete payload.client;
  delete payload.programmaticPartnerReseller;
  delete payload.estimate;
  delete payload.product;
  delete payload.campaign;
  delete payload.agency;

  payload = Helper.removeEmptyOrNullRecursive(payload);
  payload = Helper.removeEmptyArrayAndEmptyObject(payload);
  payload = Helper.removeBooleanType(payload, false);

  /* to avoid filed removal by helper payload handled here */
  if (this.reportGenerateForm.controls?.doNotExportStatus?.value?.toString().length) {
    payload['doNotExportStatus'] = this.reportGenerateForm.controls.doNotExportStatus.value;
  }

  // Formvalidating for avoid empty form search.
  if (payload && Object.keys(payload).length === 0) {
    return null;
  }
  
  return payload;
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
public clickOperationsContact(event, item: Contact) {
  const index = this.selectedOperationsContact.findIndex(
    (client) => client._id == item._id
  );
  // Select the item
  if (event.checked && index < 0) {
    this.OperationsContactUpdate(item, true);
  }
  // uncheck the item
  if (index > -1 && !event.checked) {
    this.OperationsContactUpdate(item, false);
  }
}

public OperationsContactUpdate(item: Contact, checkedItem = false) {
  const index = this.selectedOperationsContact.findIndex(
    (_contract) => _contract._id === item._id
  );
  const opContactIndex = this.operationContactsAutoComplete.data.findIndex(
    (_contract) => _contract._id === item._id
  );

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

// on click buyers
public clickBuyers(event, item: any) {
  const index = this.selectedBuyers.findIndex(
    (client) => client._id == item._id
  );
  // Select the item
  if (event.checked && index < 0) {
    this.buyerUpdate(item, true);
  }
  // uncheck the item
  if (index > -1 && !event.checked) {
    this.buyerUpdate(item, false);
  }
}

public buyerUpdate(item: any, checkedItem = false) {
  const index = this.selectedBuyers.findIndex(
    (_contract) => _contract._id == item._id
  );
  const buyersIndex = this.buyerAutoComplete.data.findIndex(
    (_contract) => _contract._id == item._id
  );

  if (checkedItem) {
    this.selectedBuyers.push(item);
    if (buyersIndex > -1) {
      this.buyerAutoComplete.data[buyersIndex].selected = true;
    }
  } else {
    if (index > -1) {
      this.selectedBuyers.splice(index, 1);
    }
    if (buyersIndex > -1) {
      this.buyerAutoComplete.data[buyersIndex].selected = false;
    }
  }
  this.cdRef.markForCheck();
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
        this.updateEstimateSelectedData();
        this.cdRef.markForCheck();
      }
    );
  }
}

public updateEstimateSelectedData() {
  this.estimatesAutoComplete?.data?.map(element => {
    const index = this.selectedEstimates.findIndex(
      item => item._id == element._id
    );
    element.selected = index > -1;
  });
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

clientAndProductValueResetter(): void{
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

toggleAllSelection(selected) {
  if (selected) {
    this.selectAll = true;
    this.reportGenerateForm.controls.missingKeyValues
      .patchValue([...this.missingKeys.map(item => item.id), 'All']);
  }
   else {
    this.selectAll = false  ;
    this.reportGenerateForm.controls.missingKeyValues.patchValue([]);
  }
}

tosslePerOne(){
  if(this.reportGenerateForm.controls.missingKeyValues.value.length==this.missingKeys.length){
    this.selectAll = true;
  } else {
    this.selectAll = false;
  }
}
public get isClientSelected() {
  const companyInput = this.reportGenerateForm?.get('client');
  return this.selectedClient && companyInput?.value?._id;
}

public get isProductSelected() {
  const companyInput = this.reportGenerateForm?.get('product');
  return companyInput?.value?._id;
}
public handleScroll(){
  this.managerAutoCompleteTrigger.closePanel();
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
  public loadMoreBuyersData() {
    this.buyerAutoComplete.loadMoreData(null,()=>{
      this.buyerAutoComplete.data.map((element) => {
        const index = this.selectedBuyers.findIndex(
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

  /**
   * This function used to export the IOs billing account
   * @param event Export search emit values
   */
  public onExportIOsAccountingEmit(event) {

    const sortDup = Helper.deepClone(this.sort);
    if (sortDup['active'] === 'lineItemId') {
      sortDup['active'] = 'createdAt';
    }

    //Formatting the search filters
    let payload = this.formattingPayloadData();
    if(!payload) return;
    payload['excluded'] = false;
    if (event?.isAllCheckboxSelected && event?.excludedItemsIds.length) {
      payload['IODateIds'] = event?.excludedItemsIds;
      payload['excluded'] = true;
    } else if (!event?.isAllCheckboxSelected && event?.selection.length) {
      payload['IODateIds'] = event?.selection;
    }

    this.billingExportService
      .billingExports(sortDup, payload)
      .subscribe((res: IOExportsResponse) => {
        //Open file download dialog when response have url & file
        if (res?.url) {
          this.dialog.open(BillingExportDialogComponent, {
            data: res,
            width: '474px',
            height: '206px',
            panelClass: ['imx-mat-dialog', 'export-billing-dialog'],
            disableClose: true
          }).afterClosed().pipe().subscribe(diagRes => {
            this.searchBillingExportItems(this.sort, this.pagination);
            this.cdRef.markForCheck();
          });
        }else if(res?.success == 'success'){
          this.contractLineItemsService._showsAlertMessage(res?.message ?? 'We will process your request and share the report through notifications');
        }
        this.cdRef.markForCheck();
      });
  }

  /**
   * This function used to update the Mark as Do Not Export || Unmark as Do Not Export
   * @param event Emited value from Mark as Do Not Export || Unmark as Do Not Export
   */
  public onBillingMarkExportEmit(event){

    const sortDup = Helper.deepClone(this.sort);
    if (sortDup['active'] === 'lineItemId') {
      sortDup['active'] = 'createdAt';
    }

    //Formatting the search filters
    let payload = this.formattingPayloadData();
    if(!payload) return;
    payload['excluded'] = false;
    if (event?.isAllCheckboxSelected && event?.excludedItemsIds.length) {
      payload['IODateIds'] = event?.excludedItemsIds;
      payload['excluded'] = true;
    } else if (!event?.isAllCheckboxSelected && event?.selection.length) {
      payload['IODateIds'] = event?.selection;
    }
    const apiPayload = {
      status:event?.isMarks ?? false,
      filter:payload
    };
    this.contractLineItemsService.updateDoNotBillingExportStatus(apiPayload).subscribe(res => {
      if (res?.status == 'success') {
        const message = res?.message ?? 'Do not export status updated successfully';
        this.contractLineItemsService._showsAlertMessage(message);
        this.searchBillingExportItems(this.sort, this.pagination);
      }
    });
  }

  /**
   * This function used to update the Billing Re Export status Update
   * @param event Re Export status emited values
   */

  public onBillingReExportUpdateEmit(event){

    const sortDup = Helper.deepClone(this.sort);
    if (sortDup['active'] === 'lineItemId') {
      sortDup['active'] = 'createdAt';
    }

    //Formatting the search filters
    let payload = this.formattingPayloadData();
    if(!payload) return;
    payload['excluded'] = false;
    if (event?.isAllCheckboxSelected && event?.excludedItemsIds.length) {
      payload['IODateIds'] = event?.excludedItemsIds;
      payload['excluded'] = true;
    } else if (!event?.isAllCheckboxSelected && event?.selection.length) {
      payload['IODateIds'] = event?.selection;
    }

    const apiPayload = {
      status: false, // set false Re Export status Update
      filter:payload
    };

    this.contractLineItemsService.updateBillingExportStatus(apiPayload).subscribe(res => {
      if (res?.status == 'success') {
        const message = res?.message ?? 'Exported status updated successfully';
        this.contractLineItemsService._showsAlertMessage(message);
        this.searchBillingExportItems(this.sort, this.pagination);
      }
    });
  }


  private setFiltersInLocalstorage(
    searchValue: any,
    pagination: any,
    sort: Sort
  ): void {
    try {
      const cachedSearchCriteriaStr = localStorage.getItem(
        this.LOCAL_STORAGE_KEY
      );
      let cachedSearchCriteria = {} as any;
      cachedSearchCriteria = (cachedSearchCriteriaStr) ? JSON.parse(cachedSearchCriteriaStr) : {};

      if (searchValue && Object.keys(searchValue).length) {
        cachedSearchCriteria.searchCriteria = searchValue;
        cachedSearchCriteria.searchCriteria.campaign = this.selectedCampaigns ? this.selectedCampaigns : '';
        cachedSearchCriteria.searchCriteria.clientParent = this.selectedClientParent ? this.selectedClientParent : '';
        cachedSearchCriteria.searchCriteria.agency = this.selectedAgency ? this.selectedAgency : '';
        cachedSearchCriteria.searchCriteria.vendor = this.selectedVendors ? this.selectedVendors : '';
        cachedSearchCriteria.searchCriteria.parentVendor = this.selectedParentVendors ? this.selectedParentVendors : '';
        cachedSearchCriteria.searchCriteria.buyers = this.selectedBuyers ? this.selectedBuyers : '';
        cachedSearchCriteria.searchCriteria.programmaticPartnerReseller = this.selectedResellers ? this.selectedResellers : '';
        cachedSearchCriteria.searchCriteria.estimate = this.selectedEstimates ? this.selectedEstimates : '';
        cachedSearchCriteria.searchCriteria.clientManagedBy = this.selectedManagedByers ? this.selectedManagedByers : '';
        cachedSearchCriteria.searchCriteria.operationsContacts = this.selectedOperationsContact ? this.selectedOperationsContact : '';
        cachedSearchCriteria.searchCriteria.missingKeySelectAll = this.selectAll;
      }

      cachedSearchCriteria.pagination = (pagination) ? pagination : {};
      cachedSearchCriteria.sort = (sort) ? sort : {};

      localStorage.setItem(
        this.LOCAL_STORAGE_KEY,
        JSON.stringify(cachedSearchCriteria)
      );
    } catch (e) {}
  }

  private getSearchCriteriaFromLocalStorage() {
    const cachedSearchCriteriaStr = localStorage.getItem(
      this.LOCAL_STORAGE_KEY
    );

    if (cachedSearchCriteriaStr) {
      return JSON.parse(cachedSearchCriteriaStr);
    }

    return null;
  }

  private updateLastSearchCriteria(): void {
    const cachedSearchCriteria = this.getSearchCriteriaFromLocalStorage();
    if (!cachedSearchCriteria) {
      return;
    }
    this.pagination = (cachedSearchCriteria.pagination) ? cachedSearchCriteria.pagination : this.pagination;
    this.sort = (cachedSearchCriteria.sort) ? cachedSearchCriteria.sort : this.sort;

    let searchCriteria = cachedSearchCriteria.searchCriteria;
    if (searchCriteria) {
      searchCriteria = searchCriteria ?? ({} as any);
      const isFiltersApplied = Object.keys(searchCriteria ?? {}).some(
        (key) => !!searchCriteria[key]
      );
      if (isFiltersApplied) {
        this.searchFilterApplied = true;
      }

      this.updateFormValueFromCache(searchCriteria);
      
      this.cdRef.markForCheck();
    }
  }

  private updateFormValueFromCache(values) {
    this.reportGenerateForm.patchValue({
      exportStatus: values?.exportStatus ?? '',
      doNotExportStatus: values?.doNotExportStatus ?? null,
      startDate: values?.startDate ?? null,
      endDate: values?.endDate ?? '',
      revisedSince: values?.revisedSince ?? '',
      createdSince: values?.createdSince ?? '',
      divisions: values?.divisions ?? '',
      office: values?.office ?? '',
      clientTypes: values?.clientTypes ?? '',
      contractName: values?.contractName ?? '',
      contractNumber: values?.contractNumber ?? '',
      clientCode: values?.clientCode ?? '',
      client: values?.client ?? '',
      productCode: values?.productCode ?? '',
      product: values?.product ?? '',
      estimateNumber:values?.estimateNumber ?? '',
      mediaClasses:values?.mediaClasses ?? '',
      placeTypes: values?.placeTypes ?? '',
      isDigital: values?.isDigital ?? '',
      mediaTypes: values?.mediaTypes ?? '',
      market: values?.market ?? '',
      lineItemIDs: values?.lineItemIDs ?? '',
      missingKeyValues: values?.missingKeyValues ?? '',
      tbd: values?.tbd ?? '',
      isDeleted: values?.isDeleted ?? '',
    });

    values?.client ? this.onSelectClient({ option: { value: values?.client } }) : '';
    values?.product ? this.onSelectClientProduct({ option: { value: values?.product } }) : '';

    this.selectedCampaigns = values?.campaign ? values.campaign : [];
    this.selectedClientParent = values?.clientParent ? values.clientParent : [];
    this.selectedAgency = values?.agency ? values.agency : [];
    this.selectedVendors = values?.vendor ? values.vendor : [];
    this.selectedParentVendors = values?.parentVendor ? values.parentVendor : [];
    this.selectedResellers = values?.programmaticPartnerReseller ? values.programmaticPartnerReseller : [];
    this.selectedEstimates = values?.estimate ? values.estimate : [];
    this.selectedManagedByers = values?.clientManagedBy ? values.clientManagedBy : [];
    this.selectedBuyers = values?.buyers ? values.buyers : [];
    this.selectedOperationsContact = values?.operationsContacts ? values.operationsContacts : [];
    this.selectAll = values?.missingKeySelectAll;

    this.searchBillingExportItems(this.sort, this.pagination);
  }

  private resetLocalstorageSearchCriteria(): void {
    localStorage.setItem(this.LOCAL_STORAGE_KEY, '');
  }
  public get minDateForEndDate() {
    let minDate: any = '';
    if (this.reportGenerateForm.controls?.startDate?.value) {
      minDate = new Date(this.reportGenerateForm.controls?.startDate?.value);
      minDate.setDate(minDate.getDate());
    }

    return minDate;
  }
}
