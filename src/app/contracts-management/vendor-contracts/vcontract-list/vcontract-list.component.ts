import { DatePipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, Input, OnDestroy, ElementRef, Optional, SkipSelf, Inject, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CustomColumnsArea } from '@interTypes/enums';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { IMXMatPaginator } from '@shared/common-function';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { PdfPreviewerService } from '@shared/components/imx-pdf-previewer/pdf-previewer.service';
import { AuthenticationService } from '@shared/services';
import { Helper } from 'app/classes';
import { ContractPreviewComponent } from 'app/contracts-management/contract-preview/contract-preview.component';
import { VendorContractAction } from 'app/contracts-management/contracts/contracts-shared/components/vendor-contract-list/vendor-contract-action.service';
import { ContractPreviewService } from 'app/contracts-management/contracts/contracts-shared/services/contract-preview.service';
import { formatContract, PContact, VContract, VendorContractSearch } from 'app/contracts-management/models';
import { ContractsService } from 'app/contracts-management/services/contracts.service';
import { ReplaySubject, Subject } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';


@Component({
  selector: 'app-vcontract-list',
  templateUrl: './vcontract-list.component.html',
  styleUrls: ['./vcontract-list.component.less'],
  providers: [{ provide: MatPaginatorIntl, useClass: IMXMatPaginator }, CustomizeColumnService,ContractPreviewService, DatePipe, VendorContractAction],

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VContractListComponent implements OnInit, OnDestroy {

  @Input() enableAdvanceSearch$: Subject<boolean> = new Subject<boolean>();
  @Input() clickSearch$: Subject<any> = new Subject<any>();
  private unSubscribe$ = new Subject();
  private unSubES$: Subject<void> = new Subject<void>();
  public isEnableAdvanceSearch = false;
  public defaultColumns = [
    { displayname: 'Contract Name', name: 'contractName' },
    { displayname: 'Client Name', name: 'clientName' },
    { displayname: 'Vendor Name', name: 'vendorName' },
    { displayname: 'Vendor Rep', name: 'vendorRep' },
    { displayname: 'Vendor Email', name: 'vendorEmail' },
    { displayname: 'Signed', name: 'signed' },
    { displayname: 'Issue Date', name: 'issueDate' },
    { displayname: 'Start Date', name: 'startDate' },
    { displayname: 'End Date', name: 'endDate' },
    // { displayname: 'Upload', name: 'upload' },
    // { displayname: 'Email', name: 'email' },
    // { displayname: 'URL', name: 'URL' },
  ];

  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);

  public customizeColumnService: CustomizeColumnService;
  public vendorsList: any[] = [];
  public vendorPagination: any = {
    page: 1,
    perPage: 10 // Default perPage size
  };
  public isLoadingVendors = false;
  public isDialogOpenend = false;
  public paginationSizes = [10];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  public hasHorizontalScrollbar = false;
  public scrollContent: number;
  @Input() selectedSort: Sort = {
    active: 'id',
    direction: 'desc'
  };
  public sortName = 'id';
  public sortDirection = 'desc';
  public searchFilterApplied = false;
  searchData: any = {};
  pageEvent = false;
  @ViewChild('tableScrollRef', { read: ElementRef, static: false }) tableScrollRef: ElementRef;
  public hideLoader = true;
  userPermission: UserActionPermission;
  attchmentPerms: UserActionPermission;
  public elasticSearchId = '';
  public isSearchInValid = false;

  constructor(
    private cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    public datepipe: DatePipe,
    private contractService: ContractsService,
    private vendorContractAction: VendorContractAction,
    public pdfPreviewerService: PdfPreviewerService,
    public contractPreviewService: ContractPreviewService,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<VContractListComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public injectedData: any,
    private auth: AuthenticationService
    ) { }

  ngOnInit(): void {
    this.hideLoader = false;
    this.displayedColumns = this.defaultColumns.map((column) => column['name']);
    this.customizeColumnService = new CustomizeColumnService(this.dialog);
    this.setVCListDataFromLocalStorage();

    if (this.injectedData?.dialogOpenened) {
      this.isDialogOpenend = true;
      this.searchFilterApplied = this.injectedData?.searchFilterApplied;
      this.setVContract();
    }
    // Initialize customize column
    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.defaultColumns),
      cachedKeyName: CustomColumnsArea.VENDORSCONTRACT_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, "id"); // Sticky column
        this.customizeColumnService.displayedColumns.splice(1, 0, "action"); // sticky column
        this.cdRef.markForCheck();
      }
    });

    /**
     * This subscribe used to submit the each new filter search
     */
    this.clickSearch$.pipe(takeUntil(this.unSubscribe$)).subscribe((searchData) => {
      if(searchData?.initialLoading) {
        this.dataSource.data = [];
        this.vendorPagination.total = 0;
        this.searchFilterApplied = false;
        this.cdRef.markForCheck();
      }
      this.searchData = searchData;
      this.contractService.setVendorListLocal('searchVendor', searchData);
      if(!searchData?.initialLoading) {this.resetVendorContractPagination();}
      this.loadVendorContract();
    });
    /**
     * This subscribe used to update the advance search
     */
    this.enableAdvanceSearch$.pipe(takeUntil(this.unSubscribe$)).subscribe((searchOption) => {
      this.isEnableAdvanceSearch = searchOption;
      this.contractService.setVendorListLocal('isEnableAdvanceSearch', this.isEnableAdvanceSearch);
      this.reSize();
    });


    this.reSize();
    this.userPermission = this.auth.getUserPermission(UserRole.CONTRACT);
    this.attchmentPerms = this.auth.getUserPermission(UserRole.ATTACHMENT);

  }

  public setVContract(){
    this.setVCListDataFromLocalStorage();
    this.loadVendorContract();
  }

  public setVCListDataFromLocalStorage(){
    const sessionFilter = this.contractService.getVendorOutListLocal();
    if(sessionFilter?.vContractPagination){
      this.vendorPagination = sessionFilter?.vContractPagination;
    }
    if(sessionFilter?.vendorSorting?.active){
      this.selectedSort = sessionFilter?.vendorSorting;
      this.sortName = this.selectedSort?.active ?? 'id';
      this.sortDirection = this.selectedSort?.direction ?? 'desc';
    }

    if(sessionFilter?.searchVendor){
      this.searchData = sessionFilter?.searchVendor;
    }
  }

  /**
   * This function used to reset the pagination
   * @param isDialog
   */

  resetVendorContractPagination(isDialog = false) {
    this.vendorPagination = { page: 1, perPage: isDialog ? 50 : 10 };
    this.contractService.setVendorListLocal('vContractPagination', this.vendorPagination);
  }

  /**
   * Open the customized column
   */
  public customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.customizeColumnService.displayedColumns.splice(0, 0, 'id'); // contract id
      this.customizeColumnService.displayedColumns.splice(1, 0, 'action');
      this.reSize()
      this.cdRef.detectChanges();
    });
  }

  public refreshLineItems(){
    this.loadVendorContract();
  }

  /**
   * This function used to get the vendor contract with API
   */
  private loadVendorContract() {
    this.unSubES$.next();
    this.unSubES$.complete();
    this.unSubES$ = new Subject<void>();
    
    const searchData = this.formatSearch();
    if(!searchData) return;
    this.isLoadingVendors = true;

    this.searchFilterApplied = false;
    if (Object.keys(searchData.filter).length) {
      this.searchFilterApplied = true;
    }else if(this.searchData['initialLoading'] && !Object.keys(searchData.filter).length){
      // Initial search filter cancel
      this.isLoadingVendors = false;
      this.cdRef.markForCheck();
      return true;
    }
    this.cdRef.detectChanges();
    const fieldSets = [];
    this.contractService
      .searchAllVendorContractsEsRequest(fieldSets, searchData)
      .subscribe((res) => {
        if (res?._id) {
          this.elasticSearchId = res._id;
          this.getVenorContractsByESSearchId(this.selectedSort, this.vendorPagination);
        }
      });
      this.hideLoader = true;
  }
  private getVenorContractsByESSearchId(
    sort: Sort = null,
    pagination: any = null,
    noLoader = true
  ){
    this.isLoadingVendors = true;
    const sortDup = Helper.deepClone(sort);

    switch(sort.active){
      case 'id':
        sortDup.active = 'contract.contractId';
        break;
      case 'clientName':
        sortDup.active = 'contract.client.clientName';
        break;
      case 'contractName':
        sortDup.active = 'contract.contractName';
        break;
      case 'vendorName':
        sortDup.active = 'displayVendor';
        break;
      case 'vendorRep':
        sortDup.active = 'displayVendorName';
        break;
      case 'vendorEmail':
        sortDup.active = 'displayVendorEmail';
        break;
      case 'signed':
        sortDup.active = 'signedAttachment.url';
        break;
      case 'issueDate':
        sortDup.active = 'issueDate';
        break;
      case 'startDate':
        sortDup.active = 'startDate';
        break;
      case 'endDate':
        sortDup.active = 'endDate';
        break;
      }

    const isFieldValueString = /^(clientName|contractName|vendorName|vendorRep|vendorEmail|signed)$/.test(sort.active);
    const isunMappedTypeDate = /^(issueDate|startDate|endDate)$/.test(sort.active);

    this.contractService
    .getVendorContractsByESSearchId(this.elasticSearchId, sortDup, isFieldValueString, pagination, noLoader, this.unSubES$, isunMappedTypeDate)
    .subscribe((res: any) => {
      this.isLoadingVendors = false;
      const resData = res?.body;
      this.isSearchInValid = resData?.search?.isValid;
      this.searchFilterApplied = true;

      if (!resData) {
        return;
      }

      this.vendorsList = resData.results;
      this.dataSource.data = this.formatVendorContract(this.vendorsList);
      this.setVendorPaginationFromRes(resData);
      this.reSize();

      this.cdRef.markForCheck();
    });
  }

  /**
   * To formate the table list
   * @param contract List contracts
   * @returns
   */
  formatVendorContract(contract: VContract[] = []) {
    let fContract: formatContract[] = [];
    contract?.forEach((element: VContract) => {
      const data: formatContract = {};
      data._id = element?._id;
      data.contractId = element?.contract?.contractId;
      data.contractName = element?.contract?.contractName;
      data.clientName = element?.contract?.client?.clientName;

      data.vendorName = element['displayVendor'];
      data.vendorEmail = element['displayVendorEmail'];
      data.vendorRep = element['displayVendorName'];

      data.signedAttachment = element?.signedAttachment;
      data.issueDate = element?.issueDate;
      data.startDate = element?.startDate;
      data.endDate = element?.endDate;

      fContract.push(data);
    });

    return fContract;
  }

  /**
   *
   * @param result Vendor contract list update pagination
   */
  setVendorPaginationFromRes(result) {
    if (result?.pagination?.total) {
      this.vendorPagination.total = result['pagination']['total'];
      this.vendorPagination.found = result['pagination']['found'];
      this.setPaginationSizes(result['pagination']['found']);
    }
    this.contractService.setVendorListLocal('vContractPagination', this.vendorPagination);
    this.cdRef.markForCheck();
  }
  private setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
      if (!this.pageEvent && this.isDialogOpenend) {
        this.vendorPagination.perPage = 25;
      }
      this.pageEvent = false;
    } else {
      this.paginationSizes = [10];
      if (this.isDialogOpenend) {
        this.vendorPagination.perPage = 10;
      }
    }
  }

  /**
   *
   * @returns Formated search filter payload
   */
  formatSearch(): VendorContractSearch {
    const searchData: VendorContractSearch = {
      filter: {
        contractId: this.searchData?.formValue?.contractId ? Number(this.searchData?.formValue?.contractId) : null,
        clientCode: this.searchData?.formValue?.clientCode ?? null,
        clientIds: this.searchData?.selectedClient?.map(client => client._id) ?? null,
        parentClientIds: this.searchData?.selectedClientParent?.map(client => client._id) ?? null,
        contractEvents: this.searchData?.selectedContractCheckpoint?.map(event => event._id) ?? null,
        operationsContacts: this.searchData?.selectedOperationsContact?.map(contact => contact._id) ?? null,
        vendorIds: this.searchData?.selectedVendors?.map(vendor => vendor._id) ?? null,
        parentVendorIds: this.searchData?.selectedParentVendors?.map(vendor => vendor._id) ?? null,
        primarySalesReps: this.searchData?.selectedPrimarySalesRep?.map(contact => contact._id) ?? null,
        secondarySalesReps: this.searchData?.selectedSecondarySalesRep?.map(contact => contact._id) ?? null,
        startDate: this.datepipe.transform(this.searchData?.formValue?.startDate, 'MM/dd/yyyy') ?? null,
        endDate: this.datepipe.transform(this.searchData?.formValue?.endDate, 'MM/dd/yyyy') ?? null,
      }
    };
    if (this.isEnableAdvanceSearch) {
      searchData.filter['divisions'] = this.searchData?.selectedDivisions?.map(division => division._id) ?? null;
      searchData.filter['offices'] = this.searchData?.selectedOffices?.map(office => office._id) ?? null;
      searchData.filter['buyers'] = this.searchData?.selectedBuyers?.map(buyer => buyer._id) ?? null;
      searchData.filter['contractName'] = this.searchData?.formValue?.contractName ?? null;
      searchData.filter['productName'] = this.searchData?.formValue?.productName ?? null;
      searchData.filter['productCode'] = this.searchData?.formValue?.productCode ?? null;
      searchData.filter['estimate'] = this.searchData?.formValue?.estimate ?? null;
      searchData.filter['contractCreatedSince'] = this.datepipe.transform(this.searchData?.formValue?.contractCreatedSince, 'MM/dd/yyyy') ?? null;
      searchData.filter['contractRevisedSince'] = this.datepipe.transform(this.searchData?.formValue?.contractRevisedSince, 'MM/dd/yyyy') ?? null;
    }

    // Formvalidating for avoid empty form search.
    let formData = searchData?.filter;
    formData = Helper.removeEmptyOrNullRecursive(formData);
    formData = Helper.removeEmptyArrayAndEmptyObject(formData);
    formData = Helper.removeBooleanType(formData, false);
    if (formData && Object.keys(formData).length <= 0) {
      return null;
    }
    return this.removeNUllOREmpty(searchData);
  }

  /**
   * This function used to removed null or empty in search filters payload
   * @param data Search filters
   * @returns
   */
  private removeNUllOREmpty(data) {
    Object.keys(data.filter).forEach(element => {
      if (data['filter'][element] === null || (element !== 'contractId' && !data['filter'][element]?.length)) {
        delete data['filter'][element];
      }
    });
    return data;
  }

  //TODO: Full screen open
  public openVendorDialog() {
    this.resetVendorContractPagination(true);
    this.dialog
      .open(VContractListComponent, {
        disableClose: true,
        data: {
          dialogOpenened: true,
          searchFilterApplied: this.searchFilterApplied,
        },
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'vendorContract-list-dialog-fullscreen'
      })
      .afterClosed()
      .subscribe((skipSetup) => {
        // While clikcing on duplicate action we no need to reinitialize normal table
        this.resetVendorContractPagination();
        if (!skipSetup) {
          this.setVContract();
        }
      });
  }

  //TODO: Full screen Close
  public closeDialogBox(skipSetup = false) {
    this.dialogRef.close(skipSetup);
  }

  /**
   *
   * @param sort Sorting column
   */

  public onSorting(sort: Sort) {
    this.selectedSort = sort;
    this.vendorsList = [];
    this.dataSource.data = this.vendorsList;
    this.cdRef.markForCheck();
    this.resetVendorContractPagination(this.isDialogOpenend ? true : false);
    this.contractService.setVendorListLocal('vendorSorting', this.selectedSort);
    this.getVenorContractsByESSearchId(this.selectedSort, this.vendorPagination);
  }

  /**
   *
   * @param contract selected contract to be preview
   */

  public openVendorContractDetails(contract) {
    if (contract?.['_id']?.contractId) {
      const _typeId = contract?.['_id'];
      const contractDetails = this.vendorsList.find(vendor=>vendor._id == _typeId);
      this.setFilterData(contractDetails);
      contract['singleItemPerPage'] = false;
      contract['hideCommonLoader'] = false;
      contract['sorting'] = {};
      let copyUrl = this.contractPreviewService.copyUrl(contractDetails);
      this.downloadPDF(contract, copyUrl);
    }
  }

  public downloadPDF(element,copyURL) {
    this.contractService.downloadContractPdf(element['_id']?.contractId, element?.singleItemPerPage, element?.hideCommonLoader)
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
        this.contractService._showsAlertMessage(message);
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


  public setFilterData(contractData) {
    const filterOption = {
      filter: {
        parentVendors: contractData.parentVendor.map(vendor => vendor._id),
        childVendors: contractData.vendor.map(vendor => vendor._id),
        vendorReps: contractData?.vendorRep?.[0]?.primary?._id ? [contractData.vendorRep[0].primary?._id] : [],
        vendorSecReps: contractData?.vendorRep?.[0]?.secondary?._id ? [contractData.vendorRep[0]?.secondary?._id] : [],
        displayVendor: contractData.displayVendor,
      }
    };
    this.contractService.setContractFilter(filterOption);
  }

  public downloadLatestAttachment(index) {
    this.vendorContractAction.contractId = this.vendorsList[index]?.contract?._id;
    this.vendorContractAction.downloadLatestUploadedFile(this.vendorsList[index]);
  }

  private openPreviewDialog(data) {
    this.cdRef.markForCheck();
    this.dialog
      .open(ContractPreviewComponent, {
        height: '100%',
        width: '75%',
        maxWidth: '1698px',
        data: data,
        disableClose: true,
        backdropClass:'contract-preview-dialog-backdrop',
        panelClass: ['imx-mat-dialog', 'contract-preview-dialog-container']
      })
      .afterClosed()
      .subscribe((value) => {});
  }

  /**
   * On resize the window update the table container
   */
  public reSize() {
    setTimeout(() => {
      this.scrollContent = (window.innerHeight - 70) - this.tableScrollRef?.nativeElement.offsetTop ?? 420;
      this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
      this.cdRef.detectChanges();
    }, 200);
  }

  /**
   * Vendor contract pagination
   * @param event Pagination event
   */
  public getPageEvent(event: PageEvent) {
    this.pageEvent = true;
    this.vendorPagination.page = event.pageIndex + 1;
    this.vendorPagination.perPage = event.pageSize;
    this.getVenorContractsByESSearchId(this.selectedSort, this.vendorPagination);
  }

  public editContract(contract){
    if (contract?.['_id']?.contractId) {
      const _typeId = contract?.['_id'];
      const contractDetails = this.vendorsList.find(vendor=>vendor._id == _typeId);
      this.setFilterData(contractDetails);
      contractDetails['filterOption'] = {
        filter: {
          parentVendors: contractDetails.parentVendor.map(vendor => vendor._id),
          childVendors: contractDetails.vendor.map(vendor => vendor._id),
          vendorReps: contractDetails?.vendorRep?.[0]?.primary?._id ? [contractDetails.vendorRep[0].primary?._id] : [],
          vendorSecReps: contractDetails?.vendorRep?.[0]?.secondary?._id ? [contractDetails.vendorRep[0]?.secondary?._id] : [],
          displayVendor: contractDetails.displayVendor,
        }
      };
      this.vendorContractAction.openEditContract(contractDetails);
    }
  }

  public uploadContract(contract){
    if (contract?.['_id']?.contractId) {
      const _typeId = contract?.['_id'];
      const contractDetails = this.vendorsList.find(vendor=>vendor._id == _typeId);
      this.vendorContractAction.openUploader(contractDetails, (result)=> {
        this.loadVendorContract(); 
      });
    }

  }

  public copyContract(contract){
    if (contract?.['_id']?.contractId) {
      const _typeId = contract?.['_id'];
      const contractDetails = this.vendorsList.find(vendor=>vendor._id == _typeId);
      this.vendorContractAction.copyToClipboard(contractDetails, `/contracts-management/contracts/${contract?.['_id']?.contractId}`);
    }
  }

  ngOnDestroy() {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
    this.unSubES$.next();
    this.unSubES$.complete();
  }

}
