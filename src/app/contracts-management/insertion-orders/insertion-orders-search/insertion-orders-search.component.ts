import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forbiddenNamesValidator } from '@shared/common-function';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

import { AbstractReportGenerateComponent } from '../../../reports/abstract-report-generate.component';
import { Helper } from '../../../classes';

import { AuthenticationService, InventoryService, ThemeService } from '@shared/services';
import { RecordService } from 'app/records-management-v2/record.service';
import { VendorService } from 'app/records-management-v2/vendors/vendor.service';
import { ReportsAPIService } from '../../../reports/services/reports-api.service';
import { FiltersService } from '../../../explore/filters/filters.service';
import { ContractsService } from "app/contracts-management/services/contracts.service";
import { ContractsSearchService } from "app/contracts-management/services/contracts-search.service";

import { AppAutocompleteOptionsModel } from "@shared/components/app-autocomplete/model/app-autocomplete-option.model";
import { Project } from '@interTypes/workspaceV2';
import { User } from "@auth0/auth0-spa-js";
import { ClientProduct, Contact } from '@interTypes/records-management';
import { EstimateSearchFilter, Vendor } from '@interTypes/inventory-management';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { Agency } from '@interTypes/records-management/agencies/agencies.response';
import { ContractsSearchBuyerApi } from "app/contracts-management/models/contracts-search-buyer.model";
import { AutocompleteMapper } from "./../../contracts/contracts-shared/helpers/autocomplete.mapper";
import { UseAutoCompleteInfiniteScroll } from 'app/classes/use-auto-complete-infinite-scroll';
import { ApiIncoming, ContractStatus } from 'app/contracts-management/models';

import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

import { filter, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';
import { InsertionOrdersService } from 'app/contracts-management/services/insertion-orders.service';
import { UseRecordPagination } from '../../../records-management-v2/useRecordPagination';

@Component({
  selector: 'app-insertion-orders-search',
  templateUrl: './insertion-orders-search.component.html',
  styleUrls: ['./insertion-orders-search.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ReportsAPIService,
    VendorService,
    RecordService,
    InventoryService,
    FiltersService,
  ]
})
export class InsertionOrdersSearchComponent extends AbstractReportGenerateComponent
  implements OnInit {

  @Output() searchActionEvent: EventEmitter<any> = new EventEmitter<any>();

  public scrollContent: number;
  reportGenerateForm: FormGroup;

  @ViewChild('triggerCampaign', { read: MatAutocompleteTrigger })
  public campaignAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('triggerCliParent', { read: MatAutocompleteTrigger })
  public cliParentAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('triggerAgency', { read: MatAutocompleteTrigger })
  public agencyAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('clientNameInputRef', { read: MatAutocompleteTrigger })
  public clientNameAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('triggerProductName', { read: MatAutocompleteTrigger })
  public prodNameAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('triggerEstimate', { read: MatAutocompleteTrigger })
  public estimateAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('triggerManaged', { read: MatAutocompleteTrigger })
  public managedByAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('triggerVendor', { read: MatAutocompleteTrigger })
  public vendorAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('triggerVendorParent', { read: MatAutocompleteTrigger })
  public vendorParentAutoCompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('triggerPartnerReseller', { read: MatAutocompleteTrigger })
  public resellerAutoCompleteTrigger: MatAutocompleteTrigger;

  public selectedOffice;
  public officePanelClass = ['imx-select', 'add-option-autocomplete'];

  public panelOfficeContainer: string;
  public panelClientParentContainer: string;
  public panelAgencyContainer: string;
  public panelClientNameContainer: string;
  public panelProductContainer: string;
  public panelEstimateContainer: string;
  public panelVendorContainer: string;
  public panelVendorParentContainer: string;
  public panelCampaignContainer: string;
  public PartnerResellerContainer: string;
  public managedByPanelContainer:string;

  public selectProduct: ClientProduct;
  public selectedProduct: ClientProduct;
  public selectedClient: ClientDetailsResponse;
  public selectedClientParent: ClientDetailsResponse[] = [];
  public selectedAgency: Agency[] = [];
  public selectedManagedByers: any[] = [];
  public selectedVendors: Vendor[] = [];
  public selectedParentVendors: Vendor[] = [];

  public selectedCampaigns: any[] = [];
  public selectedResellers: any[] = [];
  public selectedEstimates: any[] = [];

  public itemStatuses: any[] = [];
  public contrtactStatusesAutocompleteItems: AppAutocompleteOptionsModel[] = [];
  public usersAutocompleteItems: AppAutocompleteOptionsModel[];
  public managedByAutoComplete = new UseAutoCompleteInfiniteScroll();

  public maxDate = new Date('12/31/9999');
  public searchSavedData: any;
  public panelBuyerContainer = '';
  public buyersAutoComplete: UseAutoCompleteInfiniteScroll<Contact> = new UseAutoCompleteInfiniteScroll();

  constructor(
    public fb: FormBuilder,
    public vendorService: VendorService,
    public recordService: RecordService,
    public inventoryService: InventoryService,
    public reportService: ReportsAPIService,
    public filtersService: FiltersService,
    public auth: AuthenticationService,
    public cdRef: ChangeDetectorRef,
    private contractsService: ContractsService,
    private contractsSearchService: ContractsSearchService,
    private scrollDispatcher: ScrollDispatcher,
    public theme: ThemeService,
    private insertionOrdersService: InsertionOrdersService,
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
    this.reSize();
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
    this.getAllUsers();
    this.setupManagedByUsers();
    this.getItemStatuses();
    this.getAllContractStatuses();
    this.initBuyers();
    this.cdkScrollListener()
    this.clientAndProductValueResetter();
    const sessionFilter = this.insertionOrdersService.getInsertionOrderListLocal();
    if(sessionFilter?.searchInsertionOrder){
      this.searchSavedData = sessionFilter?.searchInsertionOrder;
      this.patchSearchData(sessionFilter?.searchInsertionOrder);
      this.onFormSubmit();
    }
  }

  reSize() {
    if (window.innerHeight < 1100) {
      this.scrollContent = window.innerHeight - (window.innerHeight - 250);
    } else {
      this.scrollContent = null;
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
        contractNumber: formData?.contractNumber ?? '',
        campaign: formData?.campaign ?? '',
        parentClientIds: formData?.parentClientIds ?? '',
        clientParent: formData?.clientParent ?? '',
        agency: formData?.agency ?? '',
        clientCode: formData?.clientCode ?? '',
        client: formData?.clientData ?? '',
        productCode: formData?.productCode ?? '',
        product: formData?.productData ?? '',
        estimateId: formData?.estimate ?? '',
        vendor: formData?.vendor ?? '',
        parentVendor: formData?.parentVendor ?? '',
        programmaticPartnerReseller: formData?.programmaticPartnerReseller ?? '',
        mediaClass: formData?.mediaClasses ?? '',
        placeType: formData?.placeTypes ?? '',
        isDigital: formData?.isDigital ?? '',
        mediaTypes: formData?.mediaTypes ?? '',
        market: formData?.dma ?? '',
        isDeleted: formData?.isDeleted ?? '',
        lineItemIds: formData?.lineItemIDs ?? '',
        contractStatus: formData?.contractStatus ?? '',
        lineItemStatus: formData?.itemStatus ?? '',
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
    if (formData.buyersData) {
      this.buyersAutoComplete.selectedData = formData.buyersData;
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
      parentClientIds: [],
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
      mediaTypes: [],
      market: [],
      isDeleted: [false],
      lineItemIds: [],
      contractStatus: [],
      lineItemStatus: [],
      buyer: [],
      clientManagedBy: [],
    });
  }

  onFormSubmit() {
    if (this.reportGenerateForm.valid) {
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
        payload.createdSince = format(enteredSince, 'MM/dd/yyyy', {
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
      if (payload?.estimateId) {
        payload.estimate = parseInt(payload?.estimateId);
        payload.estimateIdData = payload?.estimateId
      } else if (this.searchSavedData?.estimateIdData) {
        payload.estimate = parseInt(this.searchSavedData?.estimateIdData);
        payload.estimateIdData = this.searchSavedData?.estimateIdData;
      }
      if (this.selectedResellers?.length) {
        payload.reseller = this.selectedResellers.map((item) => item?._id);
        payload.resellerData = this.selectedResellers;
      } else if (this.searchSavedData?.reseller) {
        payload.reseller = this.searchSavedData?.reseller;
        payload.resellerData = this.searchSavedData?.resellerData;
      }
      if (this.selectedCampaigns?.length) {
        payload.campaigns = this.selectedCampaigns.map((item) => item?._id);
        payload.campaignData = this.selectedCampaigns;
      } else if (this.searchSavedData?.campaigns) {
        payload.campaigns = this.searchSavedData?.campaigns;
        payload.campaignData = this.searchSavedData?.campaignData;
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
      if (payload?.client?._id) {
        payload.clientName = payload?.client?.clientName;
        payload.clientData = payload?.client;
      }
      if (payload?.lineItemStatus) {
        payload.itemStatus = payload?.lineItemStatus;
      }
      if (payload?.mediaClass?.length) {
        payload.mediaClasses = payload?.mediaClass;
      }
      if (payload?.placeType?.length) {
        payload.placeTypes = payload?.placeType.map((item) => item.toString());
      }
      if (payload?.mediaType?.length) {
        payload.mediaTypes = payload?.mediaTypes;
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
      if (payload?.office?.length) {
        payload.offices = payload?.office;
      }
      if(payload?.lineItemIds) {
        payload.lineItemIDs = typeof payload.lineItemIds === 'string' ? payload?.lineItemIds.split(';') : payload?.lineItemIds ;
      }


      delete payload.clientParent;
      delete payload.vendor;
      delete payload.parentVendor;
      delete payload.market;
      delete payload.client;
      delete payload.programmaticPartnerReseller;
      delete payload.product;
      delete payload.lineItemStatus;
      delete payload.buyer;
      delete payload.mediaClass;
      delete payload.office;
      delete payload.placeType;
      delete payload.lineItemIds;
      delete payload.campaign;
      delete payload.agency;

      // save payload to localstorage and delete the properties which is not required for search
      this.insertionOrdersService.setInsertionOrderListLocal('searchInsertionOrder', payload);
      delete payload.estimateId;
      delete payload.estimateIdData;
      delete payload.campaignData;
      delete payload.clientManagedByData;
      delete payload.parentClientData;
      delete payload.agenciesData;
      delete payload.vendorData;
      delete payload.parentVendorData;
      delete payload.clientData;
      delete payload.productData;
      delete payload.estimateData;
      delete payload.resellerData;

      payload = Helper.removeEmptyOrNullRecursive(payload);
      payload = Helper.removeEmptyArrayAndEmptyObject(payload);
      // Formvalidating for avoid empty form search.
      var formPayload = Helper.removeBooleanType(payload, false);
      if (formPayload && Object.keys(formPayload).length === 0) {
        return;
      }
      this.searchActionEvent.emit({ type: "SEARCH", payload: { filter: payload } });
    }
  }


  //Client parent
  public optionClicked(event, item: ClientDetailsResponse) {
    const index = this.selectedClientParent.findIndex(clientParent => clientParent._id == item._id);
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
    const index = this.selectedClientParent.findIndex(_clientParent => _clientParent._id == item._id);
    const parentClientsIndex = this.parentClientsAutoComplete.data.findIndex(_clientParent => _clientParent._id == item._id);

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
        this.parentClientsAutoComplete.data[parentClientsIndex].selected = false;
      }
    }

    this.cdRef.markForCheck();
  }


  public updateBuyerContainer() {
    this.panelBuyerContainer = '.buyer-list-autocomplete';
  }

  public buyerWithFn(project: Contact) {
    return (project?.firstName + project?.lastName) ?? '';
  }

  public onSelectBuyer(event) {
    // console.log('onSelectCampaign', event);
  }

  public buyerTrackByFn(idx: number, project) {
    return project?._id ?? idx;
  }


  public get buyerName(): string{
    let firstName: any;
    firstName = this.reportGenerateForm['controls'].buyer?.value
      ?.firstName ?? '';
    const lastName = this.reportGenerateForm['controls'].buyer?.value
      ?.lastName ?? '';
    return firstName + ' ' + lastName;

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
    const buyersSearchCtrl = this.reportGenerateForm?.controls?.buyer
      ?.valueChanges;

    if (buyersSearchCtrl) {
      this.buyersAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        buyersSearchCtrl
      );

      this.buyersAutoComplete.apiEndpointMethod = () => {
        const isSearchStr = typeof this.reportGenerateForm?.controls?.buyer?.value === 'string';
        const searchObj = {
          filter: {
            companyTypes: ['User'],
            contactTypes: contactTypeIds,
          },
          ...(isSearchStr
            ? { search: this.reportGenerateForm?.controls?.buyer?.value }
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
        'buyer',
        null,
        null
      );
    }
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

  public optionAgencyClicked(event, item: Agency) {
    const index = this.selectedAgency.findIndex(agency => agency._id == item._id);
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
    const index = this.selectedAgency.findIndex(_agency => _agency._id == item._id);
    const agencyIndex = this.agenciesAutoComplete.data.findIndex(_agency => _agency._id == item._id);

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

  onResetForm() {
    this.reportGenerateForm.reset();
    this.insertionOrdersService.removeAllFromInsertionOrderListLocal();
    this.searchSavedData = null;
    this.selectedOffice = undefined;
    this.selectProduct = undefined;
    this.selectedProduct = undefined;
    this.selectedClient = undefined;
    this.selectedAgency = [];

    this.selectedVendors = [];
    this.selectedParentVendors = [];
    this.selectedResellers = [];
    this.selectedManagedByers = [];
    this.selectedCampaigns = [];
    this.selectedClientParent = [];
    this.selectedEstimates = [];
    this.resetManagedBy();
    this.resetProduct();
    this.resetEstimatesName();
    this.resetPartnerReseller();
    this.resetCampaign();
    this.resetClientParent();
    this.resetAgency();
    this.resetVendor();
    this.resetParentVendors();
    this.resetClientName();
    this.resetBuyers();
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
    this.searchActionEvent.emit({ type: "RESET", payload: {} });
  }

  public updateClientParentContainer() {
    this.panelClientParentContainer = '.clientParent-list-autocomplete';
  }

  public clientParentTrackByFn(idx: number, clientParent) {
    return clientParent?._id ?? idx;
  }

  public updatePartnerResellerContainer() {
    this.PartnerResellerContainer = '.partnerReseller-list-autocomplete';
  }

  public PartnerResellerDisplayWithFn(pReseller) {
    return pReseller?.name ?? '';
  }

  public PartnerResellerTrackByFn(idx: number, pReseller) {
    return pReseller?._id ?? idx;
  }

  public onSelectPartnerReseller(event) { }

  public mediaByFn(idx: number, media) {
    return media?.name ?? idx;
  }

  public updateAgencyContainer() {
    this.panelAgencyContainer = '.agency-list-autocomplete';
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

  public onSelectClient(event) {
    this.selectedClient = event.option.value;
    this.productsAutoComplete.loadData(null, null);
    // this.subscribeOnEstimateChange();

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

  public onSelectClientProduct(event) {
    this.reportGenerateForm.controls['product'].setValue(event.option.value);
    this.selectedProduct = event.option.value;
    this.selectedEstimates = [];
    this.subscribeOnEstimateChange();
    this.estimatesAutoComplete.loadData(null, null);
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

  public updateParentVendorsContainer() {
    this.panelParentVendorsContainer = '.parent-vendors-list-autocomplete';
  }

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


  public updateCampaignContainer() {
    this.panelCampaignContainer = '.campaign-list-autocomplete';
  }

  public campaignWithFn(project: Project) {
    return project?.name ?? '';
  }

  public onSelectCampaign(event) {
  }

  public CampaignTrackByFn(idx: number, project) {
    return project?._id ?? idx;
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

  public selectOfficeData(event, contact: any) {
    if (!event.isUserInput) { return; }
    this.selectedOffice = contact;
    this.cdRef.markForCheck();
  }

  public loadMoreManagementUsers() {
    this.managedByAutoComplete.loadMoreData(null, (res) => {
      this.managedByAutoComplete.data = this.recordService.formatManageByResult(res.results);
      this.updateClientManagedByData();
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
        const isSearchStr = typeof  this.reportGenerateForm?.controls?.clientManagedBy?.value === 'string';
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
          this.updateClientManagedByData();
          this.cdRef.markForCheck();
        }
      );
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

  private getAllUsers() {
    this.contractsSearchService
      .getAllUsers()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res: ContractsSearchBuyerApi) => {
        this.usersAutocompleteItems = AutocompleteMapper<User>(res.result);
      });
  }

  private getItemStatuses(perPage = '10', noLoader = false) {
    this.contractsService
      .itemStatusSearch({}, perPage, noLoader)
      .subscribe((res) => {
        this.itemStatuses = AutocompleteMapper<ContractStatus>(res.results);
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

  private cdkScrollListener() {
    this.scrollDispatcher.scrolled().subscribe((scrollable: CdkScrollable) => {
      const element = scrollable?.getElementRef()?.nativeElement;
      if (element?.id === "contracts-management__SCROLLABLE") {
        this.campaignAutoCompleteTrigger.closePanel();
        this.cliParentAutoCompleteTrigger.closePanel();
        this.agencyAutoCompleteTrigger.closePanel();
        this.clientNameAutoCompleteTrigger.closePanel();
        this.prodNameAutoCompleteTrigger.closePanel();
        this.estimateAutoCompleteTrigger.closePanel();
        this.managedByAutoCompleteTrigger.closePanel();
        this.vendorAutoCompleteTrigger.closePanel();
        this.vendorParentAutoCompleteTrigger.closePanel();
        this.resellerAutoCompleteTrigger.closePanel();
      }
    });
  }
  clientAndProductValueResetter(): void{
    this.reportGenerateForm.controls.client.valueChanges
      .pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((data) => {
        this.selectedEstimates = [];
        // IMXUIPRD-3995 -4(P)
        // selectedclient value assign null whenever user onselect the value.
        // onSelectClient() make value assign to selectedclient but here at the same time make selectedclient = null.
        if (!!data && typeof data != 'object') {
          this.selectedClient = null;
        }
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

  public get minDateForEndDate() {
    let minDate: any = '';
    if (this.reportGenerateForm.controls?.startDate?.value) {
      minDate = new Date(this.reportGenerateForm.controls?.startDate?.value);
      minDate.setDate(minDate.getDate());
    }
    return minDate;
  }

  public updateClientManagedByData() {
    this.managedByAutoComplete?.data?.map(element => {
      const index = this.selectedManagedByers.findIndex(
        item => item.id == element.id
      );
      element.selected = index > -1;
    });
  }
}
