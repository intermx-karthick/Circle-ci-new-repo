import { ChangeDetectorRef, Component, OnDestroy } from "@angular/core";
import { OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { CONTACT_LIST_TYPES } from "@constants/contact-list-types";
import { Vendor, VendorsSearchResponse } from "@interTypes/inventory-management";
import { ClientDropDownResponse, ClientDropDownValue, Contact, ContactResponse, ContractEventResponse, ContractEventResult, FilteredClient } from "@interTypes/records-management";
import { ClientDetailsResponse } from "@interTypes/records-management/clients/client-details.response";
import { UseAutoCompleteInfiniteScroll } from "app/classes/use-auto-complete-infinite-scroll";
import { RecordService } from "app/records-management-v2/record.service";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { ClientsService } from "../services/clients.service";
import { ContractsSearchService } from "../services/contracts-search.service";
import { ContractsService } from "../services/contracts.service";
import { VendorService } from "../services/vendor.service";

export interface VendorContractDropdowns {
  // client name
  clientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient>;
  setUpClients();

  //client parent
  parentClientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient>;
  setUpClientsParent();

  //Contract Checkpoint Status
  contractCheckpointAutoComplete: UseAutoCompleteInfiniteScroll<ContractEventResult>;
  setUpContractCheck();

  //Operations Contact
  operationsContactAutoComplete: UseAutoCompleteInfiniteScroll<ContactResponse>;

  //primary sales rep Contact
  primarySalesRepAutoComplete: UseAutoCompleteInfiniteScroll<ContactResponse>;
  setUpPrimarySalesRep();

  //Secondary sales rep Contact
  secondarySalesRepAutoComplete: UseAutoCompleteInfiniteScroll<ContactResponse>;
  setUpSecondarySalesRep();

  vendorsAutoComplete: UseAutoCompleteInfiniteScroll<VendorsSearchResponse>;
  setUpVendors();

  parentVendorsAutoComplete: UseAutoCompleteInfiniteScroll<VendorsSearchResponse>;
  setUpParentVendors();

  officersAutoComplete: UseAutoCompleteInfiniteScroll<ClientDropDownResponse>;
  setOffices();


  divisionsAutoComplete: UseAutoCompleteInfiniteScroll<ClientDropDownResponse>;
  setDivisions();

  buyerAutoComplete: UseAutoCompleteInfiniteScroll<ClientDropDownResponse>;
  initBuyerCotactSetup();

}

@Component({
  template: ''
})
export abstract class AbstractVendorContractsComponent
  implements OnDestroy, VendorContractDropdowns {
  public clientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient> = new UseAutoCompleteInfiniteScroll<FilteredClient>();
  public unsubscribe$: Subject<void> = new Subject();
  public abstract vendorContractSearchForm: FormGroup;
  public selectedClient: ClientDetailsResponse[] = [];

  public parentClientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient> = new UseAutoCompleteInfiniteScroll<FilteredClient>();
  public selectedClientParent: ClientDetailsResponse[] = [];

  public contractCheckpointAutoComplete: UseAutoCompleteInfiniteScroll<ContractEventResult> = new UseAutoCompleteInfiniteScroll<ContractEventResult>();
  public selectedContractCheckpoint: ContractEventResult[] = [];


  public operationsContactAutoComplete: UseAutoCompleteInfiniteScroll<ContactResponse> = new UseAutoCompleteInfiniteScroll<ContactResponse>();
  public selectedOperationsContact: Contact[] = [];

  public primarySalesRepAutoComplete: UseAutoCompleteInfiniteScroll<ContactResponse> = new UseAutoCompleteInfiniteScroll<ContactResponse>();
  public selectedPrimarySalesRep: Contact[] = [];

  public secondarySalesRepAutoComplete: UseAutoCompleteInfiniteScroll<ContactResponse> = new UseAutoCompleteInfiniteScroll<ContactResponse>();
  public selectedSecondarySalesRep: Contact[] = [];

  public vendorsAutoComplete: UseAutoCompleteInfiniteScroll<VendorsSearchResponse> = new UseAutoCompleteInfiniteScroll<VendorsSearchResponse>();
  public selectedVendors: Vendor[] = [];

  public parentVendorsAutoComplete: UseAutoCompleteInfiniteScroll<VendorsSearchResponse> = new UseAutoCompleteInfiniteScroll<VendorsSearchResponse>();
  public selectedParentVendors: Vendor[] = [];

  public officersAutoComplete: UseAutoCompleteInfiniteScroll<ClientDropDownResponse> = new UseAutoCompleteInfiniteScroll<ClientDropDownResponse>();
  public selectedOffices: ClientDropDownValue[] = [];

  public divisionsAutoComplete: UseAutoCompleteInfiniteScroll<ClientDropDownResponse> = new UseAutoCompleteInfiniteScroll<ClientDropDownResponse>();
  public selectedDivisions: ClientDropDownValue[] = [];

  public buyerAutoComplete: UseAutoCompleteInfiniteScroll<ClientDropDownResponse> = new UseAutoCompleteInfiniteScroll<ClientDropDownResponse>();
  public selectedBuyers: ClientDropDownValue[] = [];

  public contractCheckpointStatus: ContractEventResult[] = [];

  /** Drop down scroll container */

  public panelClientNameContainer: string;
  public panelClientParentContainer: string;
  public panelContractCheckpointContainer:string;
  public panelOperationsContactContainer:string;
  public panelPrimaryContactContainer:string;
  public panelSecondaryContactContainer:string;
  public panelVendorsContainer:string;
  public panelParentVendorsContainer:string;
  public panelOfficeContainer:string;
  public panelDivisionContainer:string;
  public panelBuyerContainer:string;

  constructor(
    public clientService: ClientsService,
    public contractService: ContractsService,
    public recordService: RecordService,
    public vendorService: VendorService,
    public contractsSearchService: ContractsSearchService,
    public cdRef: ChangeDetectorRef) { }
  // order based on asc and clientname filter
  public setUpClients() {
    const clientNameSearchCtrl = this.vendorContractSearchForm?.controls?.clientName
      ?.valueChanges;

    if (clientNameSearchCtrl) {

      this.clientsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        clientNameSearchCtrl
      );

      this.clientsAutoComplete.apiEndpointMethod = () =>
        this.clientService
          .getClientsByFilters(
            {
              search: this.clientsAutoComplete.searchStr,
              filter: {}
            } as any,
            this.clientsAutoComplete.searchStr,
            'asc',
            'clientName',
            this.clientsAutoComplete.pagination
          )
          .pipe(filter((res) => !!res));

      this.clientsAutoComplete.loadData(null, (res) => {
        res.results.map(element => {
          const index = this.selectedClient.findIndex(client => client._id == element._id);
          // Select the item
          if (index > -1) {
            element.selected = true;
          } else {
            element.selected = false;
          }

        });
        this.clientsAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.clientsAutoComplete.listenForAutoCompleteSearch(
        this.vendorContractSearchForm,
        'clientName',
        null,
        (res) => {
          res.results.map(element => {
            const index = this.selectedClient.findIndex(client => client._id == element._id);
            // Select the item
            if (index > -1) {
              element.selected = true;
            } else {
              element.selected = false;
            }
          });
          this.clientsAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public loadMoreClientName() {
    this.clientsAutoComplete.loadMoreData(null,()=>{
      this.clientsAutoComplete.data.map((element) => {
        const index = this.selectedClient.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }

  //Client ClientName
  public clickClientName(event, item: ClientDetailsResponse) {
    const index = this.selectedClient.findIndex(client => client._id == item._id);
    // Select the item
    if (event.checked && index < 0) {
      this.clientNameUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.clientNameUpdate(item, false);
    }
  }

  public clientNameUpdate(item: ClientDetailsResponse, checkedItem = false) {
    const index = this.selectedClient.findIndex(_clientParent => _clientParent._id == item._id);
    const parentClientsIndex = this.clientsAutoComplete.data.findIndex(_clientParent => _clientParent._id == item._id);

    if (checkedItem) {
      this.selectedClient.push(item);
      if (parentClientsIndex > -1) {
        this.clientsAutoComplete.data[parentClientsIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedClient.splice(index, 1);
      }
      if (parentClientsIndex > -1) {
        this.clientsAutoComplete.data[parentClientsIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  public removeClientName(clientParent: ClientDetailsResponse) {
    this.clientNameUpdate(clientParent, false);
  }


  // Client parent dropdown
  public setUpClientsParent() {
    const clientParentSearchCtrl = this.vendorContractSearchForm?.controls?.clientParent
      ?.valueChanges;

    if (clientParentSearchCtrl) {

      this.parentClientsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        clientParentSearchCtrl
      );

      this.parentClientsAutoComplete.apiEndpointMethod = () =>
        this.clientService
          .getClientsByFilters(
            {
              search: this.parentClientsAutoComplete.searchStr,
              filter: {
                isParent: true
              }
            } as any,
            this.parentClientsAutoComplete.searchStr,
            'asc',
            'clientName',
            this.parentClientsAutoComplete.pagination,
          )
          .pipe(filter((res) => !!res));

      this.parentClientsAutoComplete.loadData(null, (res) => {
        res.results.map(element => {
          const index = this.selectedClientParent.findIndex(clientParent => clientParent._id == element._id);
          // Select the item
          if (index > -1) {
            element.selected = true;
          } else {
            element.selected = false;
          }

        });
        this.parentClientsAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.parentClientsAutoComplete.listenForAutoCompleteSearch(
        this.vendorContractSearchForm,
        'clientParent',
        null,
        (res) => {
          res.results.map(element => {
            const index = this.selectedClientParent.findIndex(clientParent => clientParent._id == element._id);
            // Select the item
            if (index > -1) {
              element.selected = true;
            } else {
              element.selected = false;
            }

          });
          this.parentClientsAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public loadMoreClientParent() {
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

  //on click ClientParent
  public clickClientParent(event, item: ClientDetailsResponse) {
    const index = this.selectedClientParent.findIndex(client => client._id == item._id);
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


  public setUpContractCheck() {
    /**
     * @description  Regarding ticket 3965(6th point) - 28/06/2021
     * Removed Autocomplete because fewer of data's have in this dropdown.
     */

    this.contractService.getContractEvents(
      {
        search: this.contractCheckpointAutoComplete.searchStr
      } as any,
      'asc',
      'name',
      this.contractCheckpointAutoComplete.pagination,
    ).pipe(filter((res: ContractEventResponse) => !!res.results)).subscribe(res => {
      this.contractCheckpointStatus = res.results;
    })
  }

  public loadMoreContractCheckPoint() {
    this.contractCheckpointAutoComplete.loadMoreData(null,()=>{
      this.contractCheckpointAutoComplete.data.map((element) => {
        const index = this.selectedContractCheckpoint.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }

  //on click ClientParent
  public clickContractCheckpoint(event, item: ContractEventResult) {
    const index = this.selectedContractCheckpoint.findIndex(client => client._id == item._id);
    // Select the item
    if (event.checked && index < 0) {
      this.contractCheckUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.contractCheckUpdate(item, false);
    }
  }

  public contractCheckUpdate(item: ContractEventResult, checkedItem = false) {
    const index = this.selectedContractCheckpoint.findIndex(_contract => _contract._id == item._id);
    const parentClientsIndex = this.contractCheckpointAutoComplete.data.findIndex(_contract => _contract._id == item._id);

    if (checkedItem) {
      this.selectedContractCheckpoint.push(item);
      if (parentClientsIndex > -1) {
        this.contractCheckpointAutoComplete.data[parentClientsIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedContractCheckpoint.splice(index, 1);
      }
      if (parentClientsIndex > -1) {
        this.contractCheckpointAutoComplete.data[parentClientsIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }


  //Operations Contact
  public setUpOperationsContact(contactTypes = []) {
    const operationsContactCtrl = this.vendorContractSearchForm?.controls?.operationsContact
      ?.valueChanges;

    if (operationsContactCtrl) {

      this.operationsContactAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        operationsContactCtrl
      );
      this.operationsContactAutoComplete.pagination.perPage = 25;
      
      this.operationsContactAutoComplete.apiEndpointMethod = () => {
      const payload = {
        search: this.operationsContactAutoComplete.searchStr,
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
          this.operationsContactAutoComplete.pagination,
        )
        .pipe(filter((res: any) => !!res.results));
    };

    this.operationsContactAutoComplete.listenForAutoCompleteSearch(
      this.vendorContractSearchForm,
      'operationsContact',
      null,
      (res) => {
        this.operationsContactAutoComplete.data = res.results;
        this.updateOperationSelectedData();
        this.cdRef.markForCheck();
      }
    );
    this.operationsContactAutoComplete.loadData(null, (res) => {
      this.operationsContactAutoComplete.data = res.results;
      this.updateOperationSelectedData();
      this.cdRef.markForCheck();
    });
    }
  }

  public updateOperationSelectedData() {
    this.operationsContactAutoComplete?.data?.map(element => {
      const index = this.selectedOperationsContact.findIndex(
        item => item._id == element._id
      );
      element.selected = index > -1;
    });
  }

  public loadMoreOperationsContact() {
    this.operationsContactAutoComplete.loadMoreData(null,()=>{
      this.operationsContactAutoComplete.data.map((element) => {
        const index = this.selectedOperationsContact.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }


  //on click Operations Contact
  public clickOperationsContact(event, item: Contact) {
    const index = this.selectedOperationsContact.findIndex(client => client._id == item._id);
    // Select the item
    if (event.checked && index < 0) {
      this.operationsContactUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.operationsContactUpdate(item, false);
    }
  }

  public operationsContactUpdate(item: Contact, checkedItem = false) {
    const index = this.selectedOperationsContact.findIndex(_contract => _contract._id == item._id);
    const operationContactIndex = this.operationsContactAutoComplete.data.findIndex(_contract => _contract._id == item._id);

    if (checkedItem) {
      this.selectedOperationsContact.push(item);
      if (operationContactIndex > -1) {
        this.operationsContactAutoComplete.data[operationContactIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedOperationsContact.splice(index, 1);
      }
      if (operationContactIndex > -1) {
        this.operationsContactAutoComplete.data[operationContactIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  /** Primary sales rep */
  public setUpPrimarySalesRep() {
    const primarySalesRepCtrl = this.vendorContractSearchForm?.controls?.primarySalesRep
      ?.valueChanges;
    if (primarySalesRepCtrl) {

      this.primarySalesRepAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        primarySalesRepCtrl
      );

      this.primarySalesRepAutoComplete.apiEndpointMethod = () =>
        this.contractService
          .getContacts(
            {
              search: this.primarySalesRepAutoComplete.searchStr,
              filter: {}
            } as any,
            'asc',
            'firstName',
            this.primarySalesRepAutoComplete.pagination,
            'id,firstName,lastName,companyId,companyType'
          )
          .pipe(filter((res) => !!res));

      this.primarySalesRepAutoComplete.loadData(null, (res) => {
        res.results.map(element => {
          const index = this.selectedPrimarySalesRep.findIndex(_contact => _contact._id == element._id);
          // Select the item
          if (index > -1) {
            element.selected = true;
          } else {
            element.selected = false;
          }

        });
        this.primarySalesRepAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.primarySalesRepAutoComplete.listenForAutoCompleteSearch(
        this.vendorContractSearchForm,
        'primarySalesRep',
        null,
        (res) => {
          res.results.map(element => {
            const index = this.selectedPrimarySalesRep.findIndex(_contact => _contact._id == element._id);
            // Select the item
            if (index > -1) {
              element.selected = true;
            } else {
              element.selected = false;
            }

          });
          this.primarySalesRepAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }

  }

  public loadMorePrimarySales() {
    this.primarySalesRepAutoComplete.loadMoreData(null,()=>{
      this.primarySalesRepAutoComplete.data.map((element) => {
        const index = this.selectedPrimarySalesRep.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }

  //on click PrimarySalesRep Contact
  public clickPrimarySalesRep(event, item: Contact) {
    const index = this.selectedPrimarySalesRep.findIndex(client => client._id == item._id);
    // Select the item
    if (event.checked && index < 0) {
      this.primarySalesRepUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.primarySalesRepUpdate(item, false);
    }
  }

  public primarySalesRepUpdate(item: Contact, checkedItem = false) {
    const index = this.selectedPrimarySalesRep.findIndex(_contract => _contract._id == item._id);
    const primarySalesIndex = this.primarySalesRepAutoComplete.data.findIndex(_contract => _contract._id == item._id);

    if (checkedItem) {
      this.selectedPrimarySalesRep.push(item);
      if (primarySalesIndex > -1) {
        this.primarySalesRepAutoComplete.data[primarySalesIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedPrimarySalesRep.splice(index, 1);
      }
      if (primarySalesIndex > -1) {
        this.primarySalesRepAutoComplete.data[primarySalesIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }


  /** Secondary sales rep */
  public setUpSecondarySalesRep() {
    const secondarySalesRepCtrl = this.vendorContractSearchForm?.controls?.secondarySalesRep
      ?.valueChanges;

    if (secondarySalesRepCtrl) {

      this.secondarySalesRepAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        secondarySalesRepCtrl
      );

      this.secondarySalesRepAutoComplete.apiEndpointMethod = () =>
        this.contractService
          .getContacts(
            {
              search: this.secondarySalesRepAutoComplete.searchStr,
              filter: {}
            } as any,
            'asc',
            'firstName',
            this.secondarySalesRepAutoComplete.pagination,
            'id,firstName,lastName,companyId,companyType'
          )
          .pipe(filter((res) => !!res));

      this.secondarySalesRepAutoComplete.loadData(null, (res) => {
        res.results.map(element => {
          const index = this.selectedSecondarySalesRep.findIndex(_contact => _contact._id == element._id);
          // Select the item
          if (index > -1) {
            element.selected = true;
          } else {
            element.selected = false;
          }

        });
        this.secondarySalesRepAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.secondarySalesRepAutoComplete.listenForAutoCompleteSearch(
        this.vendorContractSearchForm,
        'secondarySalesRep',
        null,
        (res) => {
          res.results.map(element => {
            const index = this.selectedSecondarySalesRep.findIndex(_contact => _contact._id == element._id);
            // Select the item
            if (index > -1) {
              element.selected = true;
            } else {
              element.selected = false;
            }

          });
          this.secondarySalesRepAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public loadMoreSecondarySalesRep() {
    this.secondarySalesRepAutoComplete.loadMoreData(null,()=>{
      this.secondarySalesRepAutoComplete.data.map((element) => {
        const index = this.selectedSecondarySalesRep.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }

  //on click secondary SalesRep Contact
  public clickSecondarySalesRep(event, item: Contact) {
    const index = this.selectedSecondarySalesRep.findIndex(client => client._id == item._id);
    // Select the item
    if (event.checked && index < 0) {
      this.secondarySalesRepUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.secondarySalesRepUpdate(item, false);
    }
  }

  public secondarySalesRepUpdate(item: Contact, checkedItem = false) {
    const index = this.selectedSecondarySalesRep.findIndex(_contract => _contract._id == item._id);
    const secondarySalesIndex = this.secondarySalesRepAutoComplete.data.findIndex(_contract => _contract._id == item._id);

    if (checkedItem) {
      this.selectedSecondarySalesRep.push(item);
      if (secondarySalesIndex > -1) {
        this.secondarySalesRepAutoComplete.data[secondarySalesIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedSecondarySalesRep.splice(index, 1);
      }
      if (secondarySalesIndex > -1) {
        this.secondarySalesRepAutoComplete.data[secondarySalesIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }


  //** Vendor dropdown */
  public setUpVendors() {
    const vendorSearchCtrl = this.vendorContractSearchForm?.controls?.vendors
      ?.valueChanges;

    if (vendorSearchCtrl) {

      this.vendorsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        vendorSearchCtrl
      );

      this.vendorsAutoComplete.apiEndpointMethod = () =>
        this.vendorService
          .getVendorBySearch(
            { filters: { name: this.vendorsAutoComplete.searchStr } } as any,
            this.vendorsAutoComplete.pagination,
            { 'active': 'name', 'direction': 'asc' },
            'id,name,organizationId,accountId,parentFlag'
          )
          .pipe(
            filter((res) => !!res.results)
          );
      this.vendorsAutoComplete.loadData(null, (res) => {
        res.results.map(element => {
          const index = this.selectedVendors.findIndex(_vendor => _vendor._id == element._id);
          // Select the item
          if (index > -1) {
            element.selected = true;
          } else {
            element.selected = false;
          }

        });
        this.vendorsAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.vendorsAutoComplete.listenForAutoCompleteSearch(
        this.vendorContractSearchForm,
        'vendors',
        null,
        (res) => {
          res.results.map(element => {
            const index = this.selectedVendors.findIndex(_vendor => _vendor._id == element._id);
            // Select the item
            if (index > -1) {
              element.selected = true;
            } else {
              element.selected = false;
            }

          });
          this.vendorsAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public loadMoreVendors() {
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

  //on click Vendors
  public clickVendors(event, item: Vendor) {
    const index = this.selectedVendors.findIndex(client => client._id == item._id);
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
    const index = this.selectedVendors.findIndex(_contract => _contract._id == item._id);
    const vendorsIndex = this.vendorsAutoComplete.data.findIndex(_contract => _contract._id == item._id);

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



  //** parent Vendor dropdown */
  public setUpParentVendors() {
    const parentVendorSearchCtrl = this.vendorContractSearchForm?.controls?.parentVendors
      ?.valueChanges;

    if (parentVendorSearchCtrl) {

      this.parentVendorsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        parentVendorSearchCtrl
      );

      this.parentVendorsAutoComplete.apiEndpointMethod = () =>
        this.vendorService
          .getVendorBySearch(
            { filters: { parentFlag: true, name: this.parentVendorsAutoComplete.searchStr } } as any,
            this.parentVendorsAutoComplete.pagination,
            { 'active': 'name', 'direction': 'asc' },
            'id,name,organizationId,accountId,parentFlag'
          )
          .pipe(
            filter((res) => !!res.results)
          );
      this.parentVendorsAutoComplete.loadData(null, (res) => {
        res.results.map(element => {
          const index = this.selectedParentVendors.findIndex(_vendor => _vendor._id == element._id);
          // Select the item
          if (index > -1) {
            element.selected = true;
          } else {
            element.selected = false;
          }

        });
        this.parentVendorsAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.parentVendorsAutoComplete.listenForAutoCompleteSearch(
        this.vendorContractSearchForm,
        'parentVendors',
        null,
        (res) => {
          res.results.map(element => {
            const index = this.selectedParentVendors.findIndex(_vendor => _vendor._id == element._id);
            // Select the item
            if (index > -1) {
              element.selected = true;
            } else {
              element.selected = false;
            }

          });
          this.parentVendorsAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public loadMoreParentVendors() {
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

  //on click Parent Vendors
  public clickParentVendors(event, item: Vendor) {
    const index = this.selectedParentVendors.findIndex(client => client._id == item._id);
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
    const index = this.selectedParentVendors.findIndex(_contract => _contract._id == item._id);
    const vendorsIndex = this.parentVendorsAutoComplete.data.findIndex(_contract => _contract._id == item._id);

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


  /** officer drop down values */

  public setOffices() {
    const officerSearchCtrl = this.vendorContractSearchForm?.controls?.office
      ?.valueChanges;

    if (officerSearchCtrl) {

      this.officersAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        officerSearchCtrl
      );

      this.officersAutoComplete.apiEndpointMethod = () =>
        this.clientService
          .getOffices(
            this.officersAutoComplete.searchStr,
            this.officersAutoComplete.pagination
          )
          .pipe(
            filter((res) => !!res.results)
          );
      this.officersAutoComplete.loadData(null, (res) => {
        res.results.map(element => {
          const index = this.selectedOffices.findIndex(_officer => _officer._id == element._id);
          // Select the item
          if (index > -1) {
            element.selected = true;
          } else {
            element.selected = false;
          }

        });
        this.officersAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.officersAutoComplete.listenForAutoCompleteSearch(
        this.vendorContractSearchForm,
        'office',
        null,
        (res) => {
          res.results.map(element => {
            const index = this.selectedOffices.findIndex(_officer => _officer._id == element._id);
            // Select the item
            if (index > -1) {
              element.selected = true;
            } else {
              element.selected = false;
            }

          });
          this.officersAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public loadMoreOfficers() {
    this.officersAutoComplete.loadMoreData(null,()=>{
      this.officersAutoComplete.data.map((element) => {
        const index = this.selectedOffices.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }


  //on click officer
  public clickOfficers(event, item: ClientDropDownValue) {
    const index = this.selectedOffices.findIndex(office => office._id == item._id);
    // Select the item
    if (event.checked && index < 0) {
      this.officerUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.officerUpdate(item, false);
    }
  }

  public officerUpdate(item: ClientDropDownValue, checkedItem = false) {
    const index = this.selectedOffices.findIndex(_office => _office._id == item._id);
    const officerIndex = this.officersAutoComplete.data.findIndex(_office => _office._id == item._id);

    if (checkedItem) {
      this.selectedOffices.push(item);
      if (officerIndex > -1) {
        this.officersAutoComplete.data[officerIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedOffices.splice(index, 1);
      }
      if (officerIndex > -1) {
        this.officersAutoComplete.data[officerIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }


  /** divisions drop down values */

  public setDivisions() {
    const divisionSearchCtrl = this.vendorContractSearchForm?.controls?.divisions
      ?.valueChanges;

    if (divisionSearchCtrl) {

      this.divisionsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        divisionSearchCtrl
      );

      this.divisionsAutoComplete.apiEndpointMethod = () =>
        this.clientService
          .getDivisions(
            this.divisionsAutoComplete.searchStr,
            this.divisionsAutoComplete.pagination
          )
          .pipe(
            filter((res) => !!res.results)
          );
      this.divisionsAutoComplete.loadData(null, (res) => {
        res.results.map(element => {
          const index = this.selectedDivisions.findIndex(_division => _division._id == element._id);
          // Select the item
          if (index > -1) {
            element.selected = true;
          } else {
            element.selected = false;
          }

        });
        this.divisionsAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.divisionsAutoComplete.listenForAutoCompleteSearch(
        this.vendorContractSearchForm,
        'divisions',
        null,
        (res) => {
          res.results.map(element => {
            const index = this.selectedDivisions.findIndex(_division => _division._id == element._id);
            // Select the item
            if (index > -1) {
              element.selected = true;
            } else {
              element.selected = false;
            }

          });
          this.divisionsAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public loadMoreDivisions() {
    this.divisionsAutoComplete.loadMoreData(null,()=>{
      this.divisionsAutoComplete.data.map((element) => {
        const index = this.selectedDivisions.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }


  //on click divisions
  public clickDivisions(event, item: ClientDropDownValue) {
    const index = this.selectedDivisions.findIndex(division => division._id == item._id);
    // Select the item
    if (event.checked && index < 0) {
      this.divisionUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.divisionUpdate(item, false);
    }
  }

  public divisionUpdate(item: ClientDropDownValue, checkedItem = false) {
    const index = this.selectedDivisions.findIndex(_division => _division._id == item._id);
    const divisionIndex = this.divisionsAutoComplete.data.findIndex(_division => _division._id == item._id);

    if (checkedItem) {
      this.selectedDivisions.push(item);
      if (divisionIndex > -1) {
        this.divisionsAutoComplete.data[divisionIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedDivisions.splice(index, 1);
      }
      if (divisionIndex > -1) {
        this.divisionsAutoComplete.data[divisionIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  public initBuyerCotactSetup() {
    this.recordService
      .getContactTypes({ page: 1, perPage: 50 })
      .pipe(filter((res) => !!res.results), takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        const types: any[] = res?.results ? res.results : [];
        const selectedValue = types?.filter(each =>
          each?.name.toLowerCase() == CONTACT_LIST_TYPES.MEDIA.toLowerCase() ||
          each?.name.toLowerCase() == CONTACT_LIST_TYPES.MANAGEMENT.toLowerCase()
        ).map(_val => _val?._id);
        this.setBuyers(selectedValue);
        const selectedOperations = types?.filter(each =>
          each?.name.toLowerCase() == CONTACT_LIST_TYPES.OPERATIONS.toLowerCase()).map(_val => _val?._id);
        this.setUpOperationsContact(selectedOperations);
      });
  }

  /** buyer drop down values */

  public setBuyers(contactTypes = []) {
    const buyerSearchCtrl = this.vendorContractSearchForm?.controls?.buyers
      ?.valueChanges;

    if (buyerSearchCtrl) {

      this.buyerAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        buyerSearchCtrl
      );

      this.buyerAutoComplete.apiEndpointMethod = () => {
        const payload = {
          search: this.buyerAutoComplete.searchStr,
          filter: {
            companyTypes: ['User'],
            contactTypes: contactTypes,
          }
        };
        const fieldSet = ["_id", "firstName", "lastName", "companyId", "companyType"];
        return this.contractsSearchService
          .getContacts(
            payload,
            fieldSet,
            this.buyerAutoComplete.pagination,
          )
          .pipe(filter((res: any) => !!res.results));
      };
      this.buyerAutoComplete.loadData(null, (res) => {
        res.results?.map(element => {
          const index = this.selectedBuyers.findIndex(_buyer => _buyer._id == element._id);
          // Select the item
          if (index > -1) {
            element.selected = true;
          } else {
            element.selected = false;
          }

        });
        this.buyerAutoComplete.data = res['results'];
        this.cdRef.markForCheck();
      });

      this.buyerAutoComplete.listenForAutoCompleteSearch(
        this.vendorContractSearchForm,
        'buyers',
        null,
        (res) => {
          res.results?.map(element => {
            const index = this.selectedBuyers.findIndex(_buyer => _buyer._id == element._id);
            // Select the item
            if (index > -1) {
              element.selected = true;
            } else {
              element.selected = false;
            }

          });
          this.buyerAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public loadMorebuyers() {
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

  //on click buyers
  public clickbuyers(event, item: ClientDropDownValue) {
    const index = this.selectedBuyers.findIndex(division => division._id == item._id);
    // Select the item
    if (event.checked && index < 0) {
      this.buyerUpdate(item, true);
    }
    // uncheck the item
    if (index > -1 && !event.checked) {
      this.buyerUpdate(item, false);
    }
  }

  public buyerUpdate(item: ClientDropDownValue, checkedItem = false) {
    const index = this.selectedBuyers.findIndex(_buyer => _buyer._id == item._id);
    const divisionIndex = this.buyerAutoComplete.data.findIndex(_buyer => _buyer._id == item._id);

    if (checkedItem) {
      this.selectedBuyers.push(item);
      if (divisionIndex > -1) {
        this.buyerAutoComplete.data[divisionIndex].selected = true;
      }
    } else {
      if (index > -1) {
        this.selectedBuyers.splice(index, 1);
      }
      if (divisionIndex > -1) {
        this.buyerAutoComplete.data[divisionIndex].selected = false;
      }
    }
    this.cdRef.markForCheck();
  }

  /** Client name */
  public updateClientNameContainer() {
    this.panelClientNameContainer = '.clientName-list-autocomplete';
  }
  public clientNameDisplayWithFn(clientName) {
    return clientName?.clientName ?? '';
  }
  public clientNameTrackByFn(idx: number, clientName) {
    return clientName?._id ?? idx;
  }

  /** Parent Client */
  public updateClientParentContainer() {
    this.panelClientParentContainer = '.clientParent-list-autocomplete';
  }
  public clientParentDisplayWithFn(clientName) {
    return clientName?.clientName ?? '';
  }
  public clientParentTrackByFn(idx: number, clientName) {
    return clientName?._id ?? idx;
  }

  /** Contract Check point */
  public updateContractCheckpointContainer() {
    this.panelContractCheckpointContainer = '.contractCheckpoint-list-autocomplete';
  }
  public contractCheckpointDisplayWithFn(contract) {
    return contract?.name ?? '';
  }
  public contractCheckpointTrackByFn(idx: number, contract) {
    return contract?._id ?? idx;
  }

  /** Operations Contact */
  public updateOperationsContactContainer() {
    this.panelOperationsContactContainer = '.operation-contacts-list-autocomplete';
  }
  public operationsContactDisplayWithFn(contact) {
    return contact?.firstName ?? '';
  }
  public operationsContactTrackByFn(idx: number, contact) {
    return contact?._id ?? idx;
  }

  /** Primary sales rep contact */
  public updatePrimaryContactContainer() {
    this.panelPrimaryContactContainer = '.primaryContact-list-autocomplete';
  }
  public primaryContactDisplayWithFn(contact) {
    return contact?.firstName ?? '';
  }
  public primaryContactTrackByFn(idx: number, contact) {
    return contact?._id ?? idx;
  }

  /** Secondary sales rep contact */
  public updateSecondaryContactContainer() {
    this.panelSecondaryContactContainer = '.secondaryContact-list-autocomplete';
  }
  public secondaryContactDisplayWithFn(contact) {
    return contact?.firstName ?? '';
  }
  public secondaryContactTrackByFn(idx: number, contact) {
    return contact?._id ?? idx;
  }

  /** Vendors */
  public updateVendorsContainer() {
    this.panelVendorsContainer = '.vendors-list-autocomplete';
  }
  public vendorsDisplayWithFn(vendor) {
    return vendor?.name ?? '';
  }
  public vendorsTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  /** Parent Vendors */
  public updateParentVendorsContainer() {
    this.panelParentVendorsContainer = '.parent-vendors-list-autocomplete';
  }
  public parentVendorsDisplayWithFn(vendor) {
    return vendor?.name ?? '';
  }
  public parentVendorsTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  /** Parent Vendors */
  public updateOfficeContainer() {
    this.panelOfficeContainer = '.offices-list-autocomplete';
  }
  public officeDisplayWithFn(office) {
    return office?.name ?? '';
  }
  public officeVendorsTrackByFn(idx: number, office) {
    return office?._id ?? idx;
  }

  /** Parent Divisions */
  public updateDivisionContainer() {
    this.panelDivisionContainer = '.divisions-list-autocomplete';
  }
  public divisionDisplayWithFn(division) {
    return division?.name ?? '';
  }
  public divisionVendorsTrackByFn(idx: number, division) {
    return division?._id ?? idx;
  }

  /** Parent Buyer */
  public updateBuyerContainer() {
    this.panelBuyerContainer = '.buyers-list-autocomplete';
  }
  public buyerDisplayWithFn(buyer) {
    if (buyer?.firstName)
      return buyer?.firstName + ' ' + buyer?.lastName;
    else if (buyer?.name)
      return buyer.name
    else
      return '';
  }
  public buyerVendorsTrackByFn(idx: number, buyer) {
    return buyer?._id ?? idx;
  }
  resetClients() {
    this.panelClientNameContainer = '';
    this.clientsAutoComplete.resetAll();
    this.clientsAutoComplete.loadData(null, null);
    this.clientsAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
  }
  resetParentClients() {
    this.panelClientParentContainer = '';
    this.parentClientsAutoComplete.resetAll();
    this.parentClientsAutoComplete.loadData(null, null);
    this.parentClientsAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
  }
  resetContractCheckpoints() {
    // this.panelContractCheckpointContainer = '';
    // this.contractCheckpointAutoComplete.resetAll();
    // this.contractCheckpointAutoComplete.loadData(null, null);
    this.contractCheckpointAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
  }
  resetOperationsContact() {
    this.panelOperationsContactContainer = '';
    this.operationsContactAutoComplete.resetAll();
    this.operationsContactAutoComplete.loadData(null, null);
    this.operationsContactAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
  }
  resetPrimarySalesRep() {
    this.panelPrimaryContactContainer = '';
    this.primarySalesRepAutoComplete.resetAll();
    this.primarySalesRepAutoComplete.loadData(null, null);
    this.primarySalesRepAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
  }
  resetSecondarySalesRep() {
    this.panelSecondaryContactContainer = '';
    this.secondarySalesRepAutoComplete.resetAll();
    this.secondarySalesRepAutoComplete.loadData(null, null);
    this.secondarySalesRepAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
  }
  resetVendors() {
    this.panelVendorsContainer = '';
    this.vendorsAutoComplete.resetAll();
    this.vendorsAutoComplete.loadData(null, null);
    this.vendorsAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
  }
  resetParentVendors() {
    this.panelParentVendorsContainer = '';
    this.parentVendorsAutoComplete.resetAll();
    this.parentVendorsAutoComplete.loadData(null, null);
    this.parentVendorsAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
  }
  resetOffices() {
    this.panelOfficeContainer = '';
    this.officersAutoComplete.resetAll();
    this.officersAutoComplete.loadData(null, null);
    this.officersAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
  }
  resetDivisions() {
    this.panelDivisionContainer = '';
    this.divisionsAutoComplete.resetAll();
    this.divisionsAutoComplete.loadData(null, null);
    this.divisionsAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
  }
  resetBuyers() {
    this.panelBuyerContainer = '';
    this.buyerAutoComplete.resetAll();
    this.buyerAutoComplete.loadData(null, null);
    this.buyerAutoComplete.data.forEach(
      (v) => (v.selected = false)
    );
  }

  resetAllAutoCompletes() {
    this.resetClients();
    this.resetParentClients();
    this.resetContractCheckpoints();
    this.resetOperationsContact();
    this.resetPrimarySalesRep();
    this.resetSecondarySalesRep();
    this.resetVendors();
    this.resetParentVendors();
    this.resetOffices();
    this.resetDivisions();
    this.resetBuyers();
  }
  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
