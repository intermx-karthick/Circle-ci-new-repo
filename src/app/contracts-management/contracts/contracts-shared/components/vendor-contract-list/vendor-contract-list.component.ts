import { CdkOverlayOrigin, ConnectionPositionPair } from '@angular/cdk/overlay';
import {
  Component, OnInit, ChangeDetectionStrategy,
  ViewChild, Optional, SkipSelf, Inject,
  ChangeDetectorRef, ElementRef, Input, NgZone,
  EventEmitter, AfterViewInit, OnDestroy
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { VendorFilter } from '@interTypes/contract/contract-vendor-filter';
import { VendorType, VendorTypesPagination } from '@interTypes/contract/vendor-type.response';
import { VendorContractResult } from '@interTypes/contracts/vendor-contracts.response';
import { CustomColumnsArea } from '@interTypes/enums';
import { IMXMatPaginator } from '@shared/common-function';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { Helper } from 'app/classes';
import { ContractsPagination } from 'app/contracts-management/models';
import { ContractsService } from 'app/contracts-management/services/contracts.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, startWith, take, takeUntil } from 'rxjs/operators';
import { ContractPreviewService } from '../../services/contract-preview.service';
import { VendorContractAction } from './vendor-contract-action.service';
import { PdfPreviewerService } from '@shared/components/imx-pdf-previewer/pdf-previewer.service';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { AuthenticationService } from '@shared/services';
import { ElasticSearch } from 'app/classes/ElasticSearch';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';
import { MatSelectionListChange } from '@angular/material/list';

@Component({
  selector: 'app-vendor-contract-list',
  templateUrl: './vendor-contract-list.component.html',
  styleUrls: ['./vendor-contract-list.component.less'],
  providers: [
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator },
    CustomizeColumnService,
    VendorContractAction,ContractPreviewService,
    ElasticSearch,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorContractListComponent extends AbstractLazyLoadComponent implements OnInit, OnDestroy {
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('tableScrollRef', { read: ElementRef, static: false }) tableScrollRef: ElementRef;
  @ViewChild(MatTable) table: MatTable<any>;
  
  @Input() contractId;
  @Input() public onOpenTab$: Subject<any> = new Subject();
  @Input() public set loadVendorContract(value) {
    this.isInitialLoadCompleted = !!value?.isInitialLoadCompleted;
  };
  
  defaultColumns = [
    // { displayname: 'Vendor Contract ID', name: 'name' },
    { displayname: 'Vendor Name', name: 'vendor' },
    { displayname: 'Vendor Rep', name: 'vendorRepName' },
    { displayname: 'Vendor Email', name: 'vendorEmail' },
    { displayname: 'Start Date', name: 'startDate' },
    { displayname: 'End Date', name: 'endDate' },
    { displayname: 'Signed', name: 'signed' },
    { displayname: 'Issue Date', name: 'issueDate' },
    { displayname: 'Modified Date', name: 'updatedAt' },
  ];
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  public scrollContent: number;
  public vendorContractsPagination: ContractsPagination = {
    page: 1,
    perPage: 10 // Default perPage size
  };
  
  public vendorList: VendorType[];
  public vendorListPagination: VendorTypesPagination = { page: 1, perPage: 30 };
  public pageEvent = false;
  public isVendorContractsLoading = false;
  public customizeColumnService: CustomizeColumnService;
  public isDialogOpenend = false;
  public paginationSizes = [10];
  public isLoadingVendors = false;
  public searchFilterApplied = false;
  public hasHorizontalScrollbar = false;
  public vendorContracts: VendorContractResult[];
  public selectedGroupCtrl: FormControl = new FormControl();
  public groupOverlayOrigin: CdkOverlayOrigin;
  public isGroupByOverlay = false;
  private unSubscribe: Subject<void> = new Subject<void>();
  public selectedSort:  Sort = {
    active: 'updatedAt',
    direction: 'desc'
  };;
  public vendorFilter: VendorFilter = {
    filter: {
      childVendors: [],
      parentVendors: [],
      vendorReps: [],
      vendorSecReps: [],
      displayVendor: ''
    }
  };
  public filterSearch = {
    filters: {
      name: '',
      contractId: ''
    }
  }
  public searchVendorsCtrl: FormControl;
  public vendorsLoading = false;
  public isAllVendorSelected = true; /* default value true hence while API response parent Vendors value marked as selected */
  public selectedParentVendorList: string[] = [];
  
  public _positions = [
    new ConnectionPositionPair({
      originX: 'end',
      originY: 'top'
    }, {
      overlayX: 'end',
      overlayY: 'top'
    },
      0,
      25)
  ];
  @Input() userPermission: UserActionPermission;
  attchmentPerms: UserActionPermission;
  
  public isInitialLoadCompleted = false;
  public unsubscribeInitiator$: Subject<void> = new Subject<void>();

  constructor(
    public dialog: MatDialog,
    public cdRef: ChangeDetectorRef,
    public contractService: ContractsService,
    private vendorContractAction: VendorContractAction,
    public contractPreviewService: ContractPreviewService,
    public pdfPreviewerService: PdfPreviewerService,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<VendorContractListComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public injectedData: any,
    private ngZone: NgZone,// This is used to update the sticky column position
    private auth: AuthenticationService,
    public elasticSearch: ElasticSearch,
  ) {
    super();
    
    this.searchVendorsCtrl = new FormControl('');
  }

  ngOnInit(): void {
    
    if (this.injectedData?.dialogOpenened) {
      this.isDialogOpenend = true;
      this.contractId = this.injectedData.contractId;
      this.vendorFilter = this.injectedData?.vendorFilter;
      this.userPermission = this.injectedData.userPermission;
    } else {
      this.reSize();
    }

    this.filterSearch.filters.contractId = this.contractId;
    this.vendorContractAction.contractId = this.contractId;
    
    this.initializeCustomizeColumn(); /* call for table column setup */
    this.setupElasticSearchPath(); /* call for to setup elastic search URL path */
    this.listenerForInitialLoad(); /* call for extended class lazy load abstract method */
    this.initSubjectListner(); /* call for input subject listener setup */
    this.vendorSearchListner()  /* call for vendor search controle listener setup */
   
    this.attchmentPerms = this.auth.getUserPermission(UserRole.ATTACHMENT);
  }

  public init(): void {
    /* to trigger call when line item modified */
    if (!this.isInitialLoadCompleted) {
      this.isAllVendorSelected = true;
      this.vendorListPagination.page = 1;

      this.setupElasticSearchPath();
      this.setUpVendor();
      this.getVendorForGroupBy();
      this.isInitialLoadCompleted = true;
    }
  }

  public initializeCustomizeColumn() {
    this.displayedColumns = this.defaultColumns.map((column) => column['contractId']);
    this.customizeColumnService = new CustomizeColumnService(this.dialog);

    // Initialize customize column
    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.defaultColumns),
      cachedKeyName: CustomColumnsArea.VENDOR_CONTRACTS_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, "contractId"); // Sticky column
        this.customizeColumnService.displayedColumns.splice(1, 0, "action"); // sticky column
        this.cdRef.markForCheck();
      }
    });
  }

  public initSubjectListner() {
    this.onOpenTab$.pipe(takeUntil(this.unSubscribe)).subscribe((res) => {
      // to open vendor contract details on pasting copied URL

      if (res?.openTab) {
        setTimeout(() => {
          this.reSize();
        }, 200);
      }
    });
  }

  public vendorSearchListner() {
    this.searchVendorsCtrl.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        startWith(''),
      )
      .subscribe((value) => {
        this.filterSearch.filters.name = value;
        this.filterSearch.filters.contractId = this.contractId;
        this.vendorListPagination.page = 1;
        this.cdRef.markForCheck();
        this.getVendorForGroupBy();
      });
  }

  ngOnDestroy() {
    this.destroyInitiator();
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  public onSorting(sort: Sort) {
    this.selectedSort = sort;
    this.vendorContracts = [];
    this.dataSource.data = this.vendorContracts;
    this.cdRef.markForCheck();
    this.resetVendorPagination(this.isDialogOpenend ? true : false);
    this.loadVendorContracts(this.vendorFilter, true);

  }

  getPageEvent(event: PageEvent) {
    this.pageEvent = true;
    this.vendorContractsPagination.page = event.pageIndex + 1;
    this.vendorContractsPagination.perPage = event.pageSize;
    this.loadVendorContracts(this.vendorFilter, true);
  }

  public customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.customizeColumnService.displayedColumns.splice(0, 0, 'contractId');
      this.customizeColumnService.displayedColumns.splice(1, 0, 'action');
      this.reSize()
      this.cdRef.detectChanges();
    });
  }

  public openVendorDialog() {
    this.resetVendorPagination(true);
    this.dialog
      .open(VendorContractListComponent, {
        disableClose: true,
        data: {
          dialogOpenened: true,
          contractId: this.contractId,
          vendorFilter: this.vendorFilter,
          userPermission: this.userPermission
        },
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'vendor-list-dialog-fullscreen'
      })
      .afterClosed()
      .subscribe((skipSetup) => {
        this.resetVendorPagination();
        if (!skipSetup) {
          this.setUpVendor();
        }
      });
  }

  private setUpVendor() {
    // Setting keep my view vendor filters
    const sessionFilter = this.contractService.getVendorListLocal();
    if (sessionFilter?.vendorContractPagination) {
      this.vendorContractsPagination = sessionFilter?.vendorContractPagination
    }
    this.loadVendorContracts(this.vendorFilter);
  }

  public closeDialogBox(skipSetup = false) {
    this.dialogRef.close(skipSetup);
  }

  resetVendorPagination(isDialog = false) {
    this.vendorContractsPagination = { page: 1, perPage: isDialog ? 50 : 10 };
    this.contractService.setVendorContractListLocal('vendorContractPagination', this.vendorContractsPagination);
  }

  setVendorPaginationFromRes(result) {
    if (result?.pagination?.total) {
      this.vendorContractsPagination.total = result['pagination']['total'];
      this.vendorContractsPagination.found = result['pagination']['found'];
      this.setPaginationSizes(result['pagination']['found']);
    }
    this.contractService.setVendorContractListLocal('vendorContractPagination', this.vendorContractsPagination);
    this.cdRef.markForCheck();
  }

  private setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
      if (!this.pageEvent && this.isDialogOpenend) {
        this.vendorContractsPagination.perPage = 25;
      }
      this.pageEvent = false;
    } else {
      this.paginationSizes = [10];
      if (this.isDialogOpenend) {
        this.vendorContractsPagination.perPage = 10;
      }
    }
  }

  // window resize
  reSize() {
    this.scrollContent = window.innerHeight - 420;
    setTimeout(() => {
      this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
      this.cdRef.detectChanges();
    }, 200);
    this.ngZone?.onMicrotaskEmpty.pipe(take(3)).subscribe(() => this.table?.updateStickyColumnStyles());

  }

  private loadVendorContracts(filterVendor: VendorFilter, isForSortingOrPaginating = false) {

    this.isVendorContractsLoading = true;
    const fieldSet = [];
    const requestBody =  { filter: filterVendor.filter };
    const sortDup = Helper.deepClone(this.selectedSort);
    switch(this.selectedSort?.active){
      case 'contractId':
        sortDup.active = 'contract.contractId';
        break;
      case 'vendor':
        sortDup.active = 'displayVendor';
        break;
      case 'vendorRepName':
        sortDup.active = 'displayVendorName';
        break;
      case 'vendorEmail':
        sortDup.active = 'vendorRep.primary.email';
        break;
      case 'issueDate':
        sortDup.active = 'issueDate';
        break;
      case 'signed':
        sortDup.active = 'signedAttachment.url';
        break;
      case 'updatedAt':
        sortDup.active = 'updatedDate';
        break;
    }
    
    const isSortFieldString = /^(vendor|vendorRepName|vendorEmail|signed)$/.test(this.selectedSort?.active);
    const isunMappedTypeDate = /^(issueDate|startDate|endDate|updatedAt)$/.test(this.selectedSort?.active);

    let funcArgs = [
      fieldSet,
      requestBody,
      sortDup,
      isSortFieldString,
      this.vendorContractsPagination,
      (res) => {
        this.vendorContracts = res.results;
        this.dataSource.data = res.results;
        this.isVendorContractsLoading = false;
        this.vendorContractsPagination.total = res.pagination.total;
        this.setVendorPaginationFromRes(res);
        this.setVendorNameAndEmail();
        this.reSize();
        this.cdRef.markForCheck();
      },
      (error) => {
        this.vendorContracts = [];
        this.dataSource.data = this.vendorContracts;
        this.isVendorContractsLoading = false;
        this.cdRef.markForCheck();
      },
      false,
      isunMappedTypeDate
    ];

    let func: any = this.elasticSearch.handleSearch;
    if (isForSortingOrPaginating){
      func = this.elasticSearch.handleSortingAndPaginating;
      funcArgs.splice(0, 2);
    }

    func.apply(this.elasticSearch, funcArgs);

  }

  setVendorNameAndEmail() {
    this.vendorContracts.map((contracts) => {
      const primaryEmails = [];
      contracts.vendorRep.forEach((vendorData) => {
        return (primaryEmails.push(...vendorData?.primary?.['email'] ?? []));
      });
      const secondaryEmails = [];
      contracts.vendorRep.forEach((vendorData) => {
        return (secondaryEmails.push(...vendorData?.secondary?.['email'] ?? []));
      });
      if (primaryEmails.length && secondaryEmails.length)
        contracts['vendorRepEmails'] = primaryEmails.filter(this.getUniqueValues).join(',') + "; " + secondaryEmails.filter(this.getUniqueValues).join(',');
      else if (primaryEmails.length)
        contracts['vendorRepEmails'] = primaryEmails.filter(this.getUniqueValues).join(',');
      else
        contracts['vendorRepEmails'] = secondaryEmails.filter(this.getUniqueValues).join(',');
    });
  }

  public refreshVendorContracts() {
    this.loadVendorContracts(this.vendorFilter);
  }
  
  private getUniqueValues = (value, index, self) => {
    return self.indexOf(value) === index;
  }

  public copyContract(element) {
    this.vendorContractAction.copyToClipboard(element);
  }

  public uploadContract(element) {
    this.vendorContractAction.openUploader(element, (result)=> {
      this.loadVendorContracts(this.vendorFilter);
    });
  }

  public downloadLatestAttachment(element) {
    this.vendorContractAction.downloadLatestUploadedFile(element);
  }

  public editContract(element) {
    this.setFilterData(element);
    const filterOption = {
      filter: {
        parentVendors: element.parentVendor.map(vendor => vendor._id),
        childVendors: element.vendor.map(vendor => vendor._id),
        vendorReps: element?.vendorRep?.[0]?.primary?._id ? [element.vendorRep[0].primary?._id] : [],
        vendorSecReps: element?.vendorRep?.[0]?.secondary?._id ? [element.vendorRep[0]?.secondary?._id] : [],
        displayVendor: element.displayVendor,
      }
    };
    element['filterOption'] = filterOption;
    this.vendorContractAction.openEditContract(element);
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

  public applyGroupBy() {
    this.isGroupByOverlay = false;
    const selectedVendors = this.selectedGroupCtrl.value;
    let selectedParent = []
    let selectedChild = []
    if (selectedVendors?.length > 0) {
      selectedParent = selectedVendors.filter(vendor => vendor.parentFlag)
      selectedChild = selectedVendors.filter(vendor => !vendor.parentFlag)
    }
    this.vendorFilter.filter.childVendors = [];
    this.vendorFilter.filter.parentVendors = [];
    if(selectedChild?.length > 0) {
      this.vendorFilter.filter.childVendors = selectedChild.map(item => item._id);
    }
    if (selectedParent?.length > 0) {
      this.vendorFilter.filter.parentVendors = selectedParent.map(item => item._id);
    }
    this.loadVendorContracts(this.vendorFilter);
  }

  public selectAllVendor() {
   /* Parent Vendor selected as if Select All applied and if child vendor doesn't have parent as considered base and selected */
    this.isAllVendorSelected = !this.isAllVendorSelected;

    if(this.isAllVendorSelected) {
      const parentVendors = this.vendorList.filter((v) => !v['parentCompanyId']);
      this.selectedGroupCtrl.patchValue(parentVendors);
      this.selectedParentVendorList = parentVendors.map(ele => ele?._id);
    } else {
      this.selectedGroupCtrl.patchValue([]);
      this.selectedParentVendorList = [];
    }
  }

  public loadMoreVendorForGroupBy() {
    this.vendorsLoading = true;
    this.vendorListPagination.page += 1;
    this.contractService.getVCVendorsList(this.vendorListPagination, this.filterSearch)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((res) => {
        this.vendorsLoading = false;
        this.vendorListPagination = res?.pagination;
        this.vendorList = this.vendorList.concat(res?.results);
        /* Parent Vendor selected as default and if child vendor doesn't have parent as considered base and selected */
        if (this.isAllVendorSelected) {
          const vendors = this.vendorList.filter((v) => !v['parentCompanyId']);
          this.selectedGroupCtrl.patchValue(vendors);
          this.selectedParentVendorList = vendors.map(ele => ele._id);
        }
        this.cdRef.markForCheck();
      })
  }

  public getVendorForGroupBy() {
    this.vendorsLoading = true;
    this.contractService.getVCVendorsList(this.vendorListPagination, this.filterSearch)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((res) => {
        this.vendorsLoading = false;
        this.vendorListPagination = res?.pagination;
        this.vendorList = res?.results ?? [];
        /* Parent Vendor selected as default and if child vendor doesn't have parent as considered base and selected */
        if (this.isAllVendorSelected) {
          const vendors = this.vendorList.filter((v) => !v['parentCompanyId']);
          this.selectedGroupCtrl.patchValue(vendors);
          this.selectedParentVendorList = vendors.map(ele => ele._id);
        }
        this.cdRef.markForCheck();
      });
  }

  public onSelectChangeOfGrpVendors(event: MatSelectionListChange) {
    /* method refactored as if parent vendor selected all child vendor need to uncheck and vice versa */
    const eventValue = event?.options[0]?.value;
    const isEventSelect = event?.options[0]?.selected 
    const parentVendorListIndex = this.selectedParentVendorList.indexOf(eventValue?._id);

    if (isEventSelect && !eventValue?.parentCompanyId) { /* Parent Vendor selected */
      this.selectedParentVendorList.push(eventValue?._id);
      const vendors = this.selectedGroupCtrl.value?.filter((ele) => ele?.parentCompanyId !== eventValue?._id);
      this.selectedGroupCtrl.patchValue(vendors);
    }
    else if (isEventSelect && eventValue?.parentCompanyId) { /* Child Vendor selected */
      parentVendorListIndex > -1 ? this.selectedParentVendorList.splice(parentVendorListIndex, 1) : ''; /* due to initial time if child vendor not have parent considered as parent for code logic */
      const vendors = this.selectedGroupCtrl.value?.filter((ele) => ele?._id !== eventValue?.parentCompanyId);
      this.selectedGroupCtrl.patchValue(vendors);
    }
    else if (!isEventSelect && !eventValue?.parentCompanyId) { /* Parent Vendor Unselected */
      parentVendorListIndex > -1 ? this.selectedParentVendorList.splice(parentVendorListIndex, 1) : '';
      const temp = this.selectedGroupCtrl.value;
      const vendors = this.vendorList?.filter((ele) => ele?.parentCompanyId === eventValue?._id).concat(temp);
      this.selectedGroupCtrl.patchValue(vendors);
    }
    else if (!isEventSelect && eventValue?.parentCompanyId) { /* Child Vendor Unselected */
      parentVendorListIndex > -1 ? this.selectedParentVendorList.splice(parentVendorListIndex, 1) : '';
      const temp = this.selectedGroupCtrl.value;
      const isChildExists = temp?.some(x => x?.parentCompanyId === eventValue?.parentCompanyId);
      if (!isChildExists) {
        const vendors = this.vendorList?.filter((ele) => ele?._id === eventValue?.parentCompanyId).concat(temp);
        this.selectedGroupCtrl.patchValue(vendors);
      }
    }

  }

  public clearSearch(){
    this.searchVendorsCtrl.setValue('');
  }

  public compareFilters(c1, c2) {
    return c1 && c2 && c1['_id'] === c2['_id'];
  }

  public openVendorPreview(element) {
    this.setFilterData(element)
    // list view not have singleItem PerPage oprion so set to false
    element['singleItemPerPage'] = false;
    element['hideCommonLoader'] = false;
    element['sorting'] = {};
    const copyUrl = this.contractPreviewService.copyUrl(element);
    this.downloadPDF(element, copyUrl);
  }

  public downloadPDF(element,copyURL) {
    this.contractService.downloadContractPdf(element?.contract?._id, element?.singleItemPerPage, element?.hideCommonLoader)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((res: any) => {
        if (res?.headers && res?.body) {
          const contentDispose = res.headers.get('content-disposition');
          const matches = contentDispose.split(';')[1].trim().split('=')[1];
          let filename = matches && matches.length > 1 ? matches : 'vendor-contract' + '.pdf';
          filename = filename.slice(1, filename.length-1);
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

  private setupElasticSearchPath() {
    this.elasticSearch.PATH = `contracts/${this.contractId}/contract_views`;
    this.elasticSearch.ELASTIC_PATH = `contracts/${this.contractId}/contract_views/search`;
  }
}
