 import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
   AfterViewInit
 } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { ContractsService } from '../services/contracts.service';
import { filter, takeUntil } from 'rxjs/operators';
import { LineItem, LineItemPagination, LineItemsResponse } from '@interTypes/contract/contract-line-item';
import { ContractHeaderFooter, ContractTerms } from '@interTypes/contract/contract-layout';
import { ContractPreviewComponent } from '../contract-preview/contract-preview.component';
import { forkJoin } from 'rxjs';
import { ContractPreviewService } from '../contracts/contracts-shared/services/contract-preview.service';

import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { PdfPreviewerService } from '@shared/components/imx-pdf-previewer/pdf-previewer.service';
import { ElasticSearch } from 'app/classes/ElasticSearch';
import { Helper } from 'app/classes';
@Component({
  selector: 'app-editing-contract',
  templateUrl: './editing-contract.component.html',
  styleUrls: ['./editing-contract.component.less'],
  providers: [
    ContractPreviewService,
    ElasticSearch
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditingContractComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer', {read: ElementRef, static:false}) scrollContainer: ElementRef;
  public vendorContract;
  public lineItemScroll;
  public lineItemScrollHeight;
  public lineItems: LineItem[] = [];
  public lineItemPagination: LineItemPagination;
  public isLoading = false;
  termsFormGroup: FormGroup;
  public sortOptionToDisplay = [];
  public sortOptions = [
    // {id: null, value: 'Select Sort by'},
    {id: 'market', value: 'Market'},
    {id: 'startDate', value: 'Start Date'},
    {id: 'mediaDescription', value: 'Media Location/Description'},
    {id: 'lineItem', value: 'Line Item'},
    {id: 'endDate', value: 'End Date'},
    {id: 'contractNotes', value: 'Contract Notes'},
    {id: 'impressionPerPeriod', value: 'Impression Per Period'},
    {id: 'installs', value: 'Installs'},
    {id: 'itemStatus', value: 'Item Status'},
    {id: 'mediaType', value: 'Media Type'},
    {id: 'mediaUnitQty', value: 'Media Unit Qty'},
    {id: 'noOfPeriods', value: 'No Of Periods'},
    {id: 'periodLength', value: 'Period Length'},
    {id: 'placeType', value: 'Place Type'},
    {id: 'spotsPerLoop', value: 'Spots Per Loop'},
    {id: 'startDate', value: 'Start Date'},
    {id: 'unitHeight', value: 'Unit Height'},
    {id: 'unitWidth', value: 'Unit Width'},
    {id: 'vendorUnit', value: 'Vendor Unit'},
    {id: 'venueQty', value: 'Venue Qty'}
  ];
  sortSelection = {
    sorting: {}
  };
  public sortCtrl: FormControl = new FormControl();

  private unSub$: Subject<void> = new Subject<void>();

  readonly tab = Object.freeze({
    LINE_ITEM: 'line-items',
    TERMS: 'terms',
    HEADER_AND_FOOTER: 'header_and_footer'
  });
  public selectedTabIndex = 0;
  public selectedTabLabel = this.tab.LINE_ITEM;
  public lineItemCheckBox = false;
  public contractId: string;
  public vendorId: string;

  private _timestamp: undefined | any;
  public filterOption: any;
  public get timestamp() {
    return this._timestamp;
  }
  public set timestamp(data) {
    this._timestamp = {
      createdAt: data?.createdAt,
      updatedAt: data?.updatedAt,
      createdBy: data?.createdBy,
      updatedBy: data?.updatedBy,
    };
  }

  constructor(
    private fb: FormBuilder,
    private contractService: ContractsService,
    public contractPreviewService: ContractPreviewService,
    public pdfPreviewerService: PdfPreviewerService,
    private matSnackBar: MatSnackBar,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<EditingContractComponent>,
    private cdRef: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) private dialogData: any,
    public elasticSearch: ElasticSearch
  ) {
    this.loadVendorContractDetails();
    this.initTermsFormGroup();
    this.contractId = this.dialogData?.vendorContract?.['contract']?.['_id'] ?? null;
    this.vendorId = this.dialogData?.vendorContract?.['_id'] ?? null;
    this.filterOption = this.dialogData?.vendorContract?.filterOption ?? null;
    this.setupElasticSearchPath();
    this.getContractTerms();
  }

  /**
   * @description
   * method to initialize terms form group fields
   */
  initTermsFormGroup(patchValue: any = {}): void {
    this.termsFormGroup = this.fb.group({
      frontTerm: [patchValue.frontTerm || ''],
      backTerm: [patchValue.backTerm || ''],
    });
  }

  public ngOnInit(): void {
    this.lineItemPagination = {page:1, perPage:10};
    this.getContractTerms();
    this.getSorting();
  }

  public ngAfterViewInit() {
    this.reSize();
  }
  public ngOnDestroy(): void {
    this.unSub$.next();
    this.unSub$.complete();
  }

  public closeTab() {
    this.dialogRef.close();
  }

  public loadVendorContractDetails() {
    this.vendorContract = this.dialogData.vendorContract;
  }

  public onChangeLineItem() {

  }

  public onSelectedTabChange($event: MatTabChangeEvent) {
    this.selectedTabLabel = $event.tab.ariaLabel;

    // updating panel sizes
    if (this.selectedTabLabel === this.tab.LINE_ITEM) {
      this.dialogRef.updateSize('99vw', '86vh');
      this.dialogRef.removePanelClass('c-edit-contract-terms-panel-class');
      this.reSize();
    } else {
      this.dialogRef.updateSize('99vw', '86vh');
      this.dialogRef.addPanelClass('c-edit-contract-terms-panel-class');
      this.reSize();
    }
  }

  public saveVendorContract() {
      this.updateContractTerms();
      this.saveSorting();
  }

  public previewReport() {
    this.openPreviewEmit(this.vendorContract);
  }

  /**
   * @description
   * method used to fetch contract terms values
   */
  private getContractTerms() {
    this.contractService
      .getContractTerms(
        this.vendorContract.contract._id,
        this.vendorContract._id
      )
      .pipe(
        filter(res => res && !res.error)
      )
      .subscribe((res) => {
        this.initTermsFormGroup(res);
        this.timestamp = res; // for updating timestamp
        this.cdRef.markForCheck();
      });
  }

  public getSorting() {
    this.contractService
    .getSortingOption(this.vendorContract.contract._id,).subscribe((res) => {
      if(res?.pagination?.perPage === 1) {
        this.lineItemCheckBox = true;
      }
      const sortResponse= Object.keys(res.sorting);
      sortResponse.map((sort) => {
        const sortOption = {
          id: sort ,
          value: this.sortOptions.find(item => item.id === sort).value,
          order: 'asc'
        }
        this.sortOptionToDisplay.push(sortOption);
      })
      this.sortSelection.sorting = {};
      this.sortOptionToDisplay.map((sort) => {
        Object.assign(this.sortSelection.sorting, {[sort.id]: sort.order})
      })
      this.loadLineItems();
    });
  }

  public saveSorting() {
    const paginationObj = {
      pagination: {
        perPage: 10
      }
    }
    if (this.lineItemCheckBox) {
      paginationObj.pagination.perPage = 1;
    }
    this.contractService
    .setSortingOption(this.vendorContract.contract._id, this.sortSelection, paginationObj, true).subscribe((res) => {
    });
  }

  /**
   * @description
   * method used to post contract terms updated values
   */
  private updateContractTerms() {
    this.contractService
      .updateContractTerms(
        this.vendorContract.contract._id,
        this.vendorContract._id,
        this.termsFormGroup.value
      )
      .pipe(takeUntil(this.unSub$))
      .subscribe((res) => {
        if (res.error) {
          this.showsAlertMessage(res?.error?.message);
        } else {
          this.showsAlertMessage(res?.message);
          this.getContractTerms();
        }
      });
  }

  public openPreviewEmit(event) {
    //Set the single item per page
    event['singleItemPerPage'] = this.lineItemCheckBox;
    event['hideCommonLoader'] = true;
    event['sorting'] = this.sortSelection;
    this.contractPreviewService.isLoadingPreviewAPI = true;
    const copyUrl = this.contractPreviewService.copyUrl(event);
    this.downloadPDF(event, copyUrl);
  }

  public downloadPDF(element,copyURL) {
    this.contractService.downloadContractPdf(element?.contract?._id, element?.singleItemPerPage, element?.hideCommonLoader)
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: any) => {
        this.contractPreviewService.isLoadingPreviewAPI = false;
        this.cdRef.markForCheck();

        if (res?.headers && res?.body) {
          const contentDispose = res.headers.get('content-disposition');
          const matches = contentDispose.split(';')[1].trim().split('=')[1];
          let filename = matches && matches.length > 1 ? matches : 'vendor-contract' + '.pdf';
          filename = filename.slice(1, filename.length - 1);
          this.openPdfViewer(res.body, filename, filename, copyURL); // for now sending file name as title
        }
      }, async (error) => {
        this.contractPreviewService.isLoadingPreviewAPI = false;
        this.cdRef.markForCheck();
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

  loadLineItems(isForSortingOrPaginating = false) {
    const fieldSet = [];
    const requestBody =  {...this.filterOption,...this.sortSelection};
    const sortDup = {}; 

    const isSortFieldString = '';
    const isunMappedTypeDate = '';
    if (isForSortingOrPaginating){
      this.lineItemPagination.page += 1;
    }
    let funcArgs = [
      fieldSet,
      requestBody,
      sortDup,
      isSortFieldString,
      this.lineItemPagination,
      (res) => {
        if (isForSortingOrPaginating) {
          this.lineItems = this.lineItems.concat(res?.results);
        } else {
          this.lineItems = res?.results;
        }
        this.cdRef.markForCheck();
      },
      (error) => {
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
    func.apply(this.elasticSearch, funcArgs)



    /*const vendorContract = this.dialogData?.vendorContract;
    if(vendorContract?.['contract']?.['_id'] && vendorContract['_id']){
      const _contractId = vendorContract?.['contract']?.['_id'];
      const _typeId = vendorContract['_id'];
      this.contractService.getContractLineItems(_contractId, _typeId,'vendor',{
        page: 1,
        perPage: 10
      }, this.sortSelection, false).subscribe((res) => {
        console.log('getContractLineItems', res);
        this.lineItems = res?.results;
        this.lineItemPagination = res?.pagination;
        this.cdRef.markForCheck();
      })
    }*/
  }
  public loadMoreLineItems() {
    if(this.contractId && this.vendorId){
      this.lineItemPagination.page +=1;
      this.isLoading = true;
      this.cdRef.markForCheck();
      this.contractService.getContractLineItems(this.contractId, this.vendorId,'vendor',this.lineItemPagination, this.sortSelection).pipe(takeUntil(this.unSub$)).subscribe(res=>{
        this.isLoading = false;
         //set the line item data
         if(res?.results.length){
          this.lineItems = this.lineItems.concat(res?.results);
          this.lineItemPagination = res?.pagination;
          this.cdRef.markForCheck();
         }
      },error=>{
        this.isLoading = false;
        this.cdRef.markForCheck();
      });
    }
  }

  onSortSelection() {
    this.sortSelection.sorting = {}
    if(this.sortCtrl.value) {
      this.sortSelection.sorting = {
        [this.sortCtrl.value]: 'asc'
      }
    }
    this.loadLineItems();
  }

  public reSize(){
    setTimeout(() => {
      this.lineItemScroll = (this.scrollContainer?.nativeElement?.clientWidth);
      this.lineItemScrollHeight = (this.scrollContainer?.nativeElement?.clientHeight);
      this.cdRef.detectChanges();
    }, 100);
  }

  public drop(event: CdkDragDrop<string[]>) {
    // dropping in same container
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // dropping in other container
      // We need to handle only date columns when spot schedule is enabled
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.sortSelection.sorting = {};
    this.sortOptionToDisplay = event?.container?.data;
    this.sortOptionToDisplay.map((sort) => {
      Object.assign(this.sortSelection.sorting, {[sort.id]: sort.order})
    })
    this.loadLineItems();
  }

  private showsAlertMessage(msg) {
    const config = {
      duration: 5000
    } as MatSnackBarConfig;

    this.matSnackBar.open(msg, '', config);
  }
  private setupElasticSearchPath() {
    this.elasticSearch.PATH = `contracts/${this.contractId}/contract_views`;
    this.elasticSearch.ELASTIC_PATH = `contracts/${this.contractId}/contract_views/search`;
    this.elasticSearch.SEARCH_METHOD = 'PATCH';
  }
}
