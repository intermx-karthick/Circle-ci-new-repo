import { filter } from 'rxjs/operators';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterContentInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FilteredClient } from '@interTypes/records-management';
import { Helper } from 'app/classes';
import { UseAutoCompleteInfiniteScroll } from 'app/classes/use-auto-complete-infinite-scroll';
import { ClientsService } from 'app/contracts-management/services/clients.service';
import { ContractsService } from 'app/contracts-management/services/contracts.service';
import { VendorService } from 'app/contracts-management/services/vendor.service';
import { ReplaySubject, Subject } from 'rxjs';
import { AbstractVendorContractsComponent } from '../abstract-vendor-contracts.Component';
import { RecordService } from 'app/records-management-v2/record.service';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { AuthenticationService } from '@shared/services';
import { ContractsSearchService } from 'app/contracts-management/services/contracts-search.service';

@Component({
  selector: 'app-vendor-contracts',
  templateUrl: './vendor-contracts.component.html',
  styleUrls: ['./vendor-contracts.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorContractsComponent extends AbstractVendorContractsComponent implements OnInit,AfterViewInit {
  vendorContractSearchForm: FormGroup;
  public isAdvanceSearch = false;
  public maxDate = new Date('12/31/9999');
  public clickSearch$: ReplaySubject<any> = new ReplaySubject<any>(1);
  public enableAdvanceSearch$: Subject<boolean> = new Subject<boolean>();
  userPermission: UserActionPermission;

  constructor(
    private fb: FormBuilder,
    public contractService: ContractsService,
    public recordService: RecordService,
    public clientService: ClientsService,
    public cdRef: ChangeDetectorRef,
    public vendorService: VendorService,
    public contractsSearchService: ContractsSearchService,
    private auth: AuthenticationService
    ) {
    super(clientService, contractService, recordService, vendorService, contractsSearchService, cdRef);
  }

  ngOnInit(): void {
    this.initializeForm();
    this.userPermission = this.auth.getUserPermission(UserRole.CONTRACT);
    const sessionFilter = this.contractService.getVendorOutListLocal();
    if(sessionFilter?.searchVendor){
      this.patchSearchData(sessionFilter?.searchVendor);
      this.onSearch(true);
    }
    if(sessionFilter?.isEnableAdvanceSearch){
      this.isAdvanceSearch = true;
      this.enableAdvanceSearch$.next(this.isAdvanceSearch);
    }
    this.initializeDropdown();
  }
  initializeDropdown(){
    this.setUpClients();
    this.setUpClientsParent();
    this.setUpContractCheck();
    this.setUpPrimarySalesRep();
    this.setUpSecondarySalesRep();
    this.setUpVendors();
    this.setUpParentVendors();
    this.setOffices();
    this.setDivisions();
    this.initBuyerCotactSetup();
  }

  ngAfterViewInit(){
    this.enableAdvanceSearch$.next(this.isAdvanceSearch);
    // this.onSearch(true);
  }

  private initializeForm() {
    this.vendorContractSearchForm = this.fb.group({
      contractId:[],
      clientCode:[],
      clientName: [],
      clientParent: [],
      contractCheckPoint:[],
      startDate: [],
      endDate: [],
      operationsContact:[],
      primarySalesRep:[],
      secondarySalesRep:[],
      vendors:[],
      parentVendors:[],
      office:[],
      divisions:[],
      buyers:[],
      contractCreatedSince: [],
      contractRevisedSince: [],
      contractName: [],
      productName: [],
      productCode: [],
      estimate: []
    })
  }

  public onClickAdvanceSearch() {
    this.isAdvanceSearch = !this.isAdvanceSearch;
    this.enableAdvanceSearch$.next(this.isAdvanceSearch);
  }

  public onSearch(initial = false){
    const searchData = {
      formValue : this.vendorContractSearchForm.getRawValue(),
      selectedClient:this.selectedClient,
      selectedClientParent:this.selectedClientParent,
      selectedContractCheckpoint: this.vendorContractSearchForm?.value?.contractCheckPoint,
      selectedOperationsContact:this.selectedOperationsContact,
      selectedPrimarySalesRep:this.selectedPrimarySalesRep,
      selectedSecondarySalesRep:this.selectedSecondarySalesRep,
      selectedVendors:this.selectedVendors,
      selectedParentVendors:this.selectedParentVendors,
      selectedOffices:this.selectedOffices,
      selectedDivisions:this.selectedDivisions,
      selectedBuyers:this.selectedBuyers,
      initialLoading:false
    };
    Helper.removeEmptyOrNull(searchData.formValue);
    Helper.removeEmptyOrNull(searchData);
    Helper.removeEmptyArrayAndEmptyObject(searchData);

    if (initial || Object.keys(searchData).length === 0) {
      searchData['initialLoading'] = true;
    } else {
      searchData['initialLoading'] = false;
    }
    this.clickSearch$.next(searchData);
    document.getElementById('contracts-management__SCROLLABLE').scrollTop = document.getElementById('vcontract-list-main').offsetTop;
  }

  public loadMoreOperationContacts() {
    this.operationsContactAutoComplete.loadMoreData(null, (res) => {
      this.operationsContactAutoComplete.data.map((element) => {
        const index = this.selectedOperationsContact.findIndex(
          (item) => item._id === element._id
        );
        element.selected = index > -1;
      });
      this.cdRef.markForCheck();
    });
  }
  
  public buyerTrackByFn(idx: number, buyer) {
    return buyer?._id ?? idx;
  }

  public updateOperationContactSelectedData() {
    this.operationsContactAutoComplete?.data?.map(element => {
      const index = this.selectedOperationsContact.findIndex(
        item => item._id == element._id
      );
      element.selected = index > -1;
    });
  }

  patchSearchData(searchData){
    const formData = searchData.formValue ?? null;
    if(formData){
      this.vendorContractSearchForm.patchValue({
        contractId:formData?.contractId ?? '',
        clientCode:formData?.clientCode ?? '',
        startDate: formData?.startDate ?? '',
        endDate: formData?.endDate ?? '',
        contractCreatedSince: formData?.contractCreatedSince ?? '',
        contractRevisedSince: formData?.contractRevisedSince ?? '',
        contractName: formData?.contractName ?? '',
        productName: formData?.productName ?? '',
        productCode: formData?.productCode ?? '',
        estimate: formData?.estimate ?? ''
      });
    }
    if (searchData.selectedClient) { this.selectedClient = searchData.selectedClient; }
    if (searchData.selectedClientParent) this.selectedClientParent = searchData.selectedClientParent;
    if (searchData.selectedContractCheckpoint) this.selectedContractCheckpoint = searchData.selectedContractCheckpoint;
    if (searchData.selectedOperationsContact) this.selectedOperationsContact = searchData.selectedOperationsContact;
    if (searchData.selectedPrimarySalesRep) this.selectedPrimarySalesRep = searchData.selectedPrimarySalesRep;
    if (searchData.selectedSecondarySalesRep) this.selectedSecondarySalesRep = searchData.selectedSecondarySalesRep;
    if (searchData.selectedVendors) this.selectedVendors = searchData.selectedVendors;
    if (searchData.selectedParentVendors) this.selectedParentVendors = searchData.selectedParentVendors;
    if (searchData.selectedOffices) this.selectedOffices = searchData.selectedOffices;
    if (searchData.selectedDivisions) this.selectedDivisions = searchData.selectedDivisions;
    if (searchData.selectedBuyers) this.selectedBuyers = searchData.selectedBuyers;
  }

  public get minDateForEndDate() {
    let minDate: any = '';
    if (this.vendorContractSearchForm.controls?.startDate?.value) {
      minDate = new Date(this.vendorContractSearchForm.controls?.startDate?.value);
      minDate.setDate(minDate.getDate());
    }

    return minDate;
  }

  public onResetForm() {
    this.vendorContractSearchForm.reset();
    this.selectedClient = [],
    this.selectedClientParent = [],
    this.selectedContractCheckpoint = [],
    this.selectedOperationsContact = [],
    this.selectedPrimarySalesRep = [],
    this.selectedSecondarySalesRep = [],
    this.selectedVendors = [],
    this.selectedParentVendors = [],
    this.selectedOffices = [],
    this.selectedDivisions = [],
    this.selectedBuyers = [];

    this.resetAllAutoCompletes();
    this.contractService.removeAllFromVendorContractListLocal();

    const searchData = {};
    searchData['initialLoading'] = true;
    this.clickSearch$.next(searchData);

    this.cdRef.markForCheck();

  }

}
