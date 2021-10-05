import { Component, OnInit, ChangeDetectionStrategy, Optional, SkipSelf, Inject, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ContractHeaderFooter, ContractTerms } from '@interTypes/contract/contract-layout';
import { LineItem, LineItemPagination, LineItemsResponse } from '@interTypes/contract/contract-line-item';
import { forkJoin, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { ContractsService } from '../services/contracts.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { HttpResponse } from '@angular/common/http';
import { saveAs } from 'file-saver';
@Component({
  selector: 'app-contract-preview',
  templateUrl: './contract-preview.component.html',
  styleUrls: ['./contract-preview.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractPreviewComponent implements OnInit, AfterViewInit,OnDestroy {
  
  @ViewChild('scrollContainer', {read: ElementRef, static:false}) scrollContainer: ElementRef;
  public lineItemScroll;
  public layout:ContractHeaderFooter;
  public terms:ContractTerms;
  public lineItemPagination:LineItemPagination;
  public lineItems:LineItem[] = [];
  public contractId:string;
  public vendorId:string;
  public isLoading = false;
  private unSubscribe: Subject<void> = new Subject<void>();
  public singleItemPerPage = false;
  public panelContainer:any;
  public containerBodyHeight:number;
  salesTaxTotal: number;
  totalNetTotal: number;
  isLoadingPreviewAPI: boolean;
  constructor(
  @Optional()
  @SkipSelf()
  public dialogRef: MatDialogRef<ContractPreviewComponent>,
  @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData: any,
  private cdRef: ChangeDetectorRef,
  private contractsService: ContractsService,
  private router: Router,
  private clipboard: Clipboard,
  private contractService: ContractsService,
) { }

  ngOnInit(): void {
    this.isLoadingPreviewAPI = true;
    this.reSize();
    forkJoin([
      this.contractService.getCantractLayout(this.dialogData?._contractId, this.dialogData?._typeId, 'vendor'),
      this.contractService.getCantractTerms(this.dialogData?._contractId, this.dialogData?._typeId, 'vendor'),
      this.contractService.getContractLineItems(
        this.dialogData?._contractId,
        this.dialogData?._typeId,
        'vendor',
        {
          page: 1,
          perPage: 10
        },
        this.dialogData?.sortParam
      )
    ])
      .pipe(
        map((data: any[]) => {
          const _layout: ContractHeaderFooter = data?.[0] ?? {};
          const _terms: ContractTerms = data?.[1] ?? {};
          const _lineItems: LineItemsResponse = data?.[2] ?? {};
          return {
            layout: _layout,
            terms: _terms,
            lineItems: _lineItems,
            contractId: this.dialogData?._contractId,
            vendorId: this.dialogData?._typeId,
            singleItemPerPage: this.dialogData?.singleItemCheckbox,
            contractDetails: this.dialogData?.contractDetails
          };
        })
      )
      .subscribe((responseData) => {
        this.isLoadingPreviewAPI = false;
        this.layout = responseData?.layout ?? null;
        this.terms = responseData?.terms ?? null;
        //set the line item data
        this.lineItems = responseData?.lineItems?.results ?? [];
        this.lineItemPagination = responseData?.lineItems?.pagination ?? {page:1, perPage:10};
        this.contractId = responseData?.contractId ?? null;
        this.vendorId = responseData?.vendorId?.contractVendor ?? responseData?.vendorId ?? null;
        this.singleItemPerPage = (responseData?.singleItemPerPage);
        this.loadLayoutStyles();
        this.calculateTotal();
        this.cdRef.markForCheck();
      });
      
  }


  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }
  loadLayoutStyles() {
    // Header footer style comming from API
    document.getElementById('contract-preview-style')?.remove();
    const body = document.getElementsByTagName('body')[0];
    const style = document.createElement('style');
    style.id = 'contract-preview-style';
    style.type = 'text/css';
    style.media = 'all';
    style.innerText = this.layout?.styles;
    body.appendChild(style);
    this.reSize();
    this.panelContainer = this.dialogRef['_containerInstance']['_elementRef'].nativeElement;
  }

  public reSize(){
    this.lineItemScroll = (this.scrollContainer?.nativeElement?.clientWidth - 40);
    this.containerBodyHeight = (this.dialogRef?.['_containerInstance']['_elementRef']['nativeElement']?.clientHeight - 50);

    this.cdRef.detectChanges();
  }

  public loadMoreLineItems() {
    if(this.contractId && this.vendorId){
      this.lineItemPagination.page +=1;
      this.isLoading = true;
      this.cdRef.markForCheck();
      this.contractsService.getContractLineItems(this.contractId, this.vendorId,'vendor',this.lineItemPagination, {}).pipe(takeUntil(this.unSubscribe)).subscribe(res=>{
        this.isLoading = false;
         //set the line item data
         if(res?.results.length){
          this.lineItems = this.lineItems.concat(res?.results);
          this.lineItemPagination = res?.pagination;
          this.calculateTotal();
          this.cdRef.markForCheck();
         }
      },error=>{
        this.isLoading = false;
        this.cdRef.markForCheck();
      });
    }
  }
  /**
   * Copy the contact ventor preview
   */
  public copyContract() {
    let URL = `${location.origin}/contracts-management/contracts/${this.contractId}?preview=${this.vendorId}`;
    if(this.singleItemPerPage){
      URL += `&previewType=single`;
    }
    if(this.dialogData?.contractDetails?.parentVendor?.length > 0) {
      URL+= `&parentVendors=${this.dialogData?.contractDetails?.parentVendor.map(vendor => vendor._id).join(',')}`;
    }else if(this.dialogData?.contractDetails?._typeId?.contractVendor){
      URL+= `&parentVendors=${this.dialogData?.contractDetails?._typeId?.contractVendor}`;
    }
    if(this.dialogData?.contractDetails?.vendor?.length > 0) {
      URL+= `&vendor=${this.dialogData?.contractDetails?.vendor.map(vendor => vendor._id).join(',')}`;
    }
    if(this.dialogData?.contractDetails?.vendorRep?.length > 0) {
      URL+= `&vendorRep=${this.dialogData?.contractDetails?.vendorRep[0].primary?._id}`;
    }else if(this.dialogData?.contractDetails?._typeId?.vendorContractRep){
      URL+= `&vendorRep=${this.dialogData?.contractDetails?._typeId?.vendorContractRep}`;
    }
    this.clipboard.copy(URL);
    this.contractsService._showsAlertMessage('Vendor Contract URLs copied to your Clipboard');
  }

  public downloadPDF(){

    this.contractsService.downloadContractPdf(this.contractId, this.singleItemPerPage)
    .pipe(takeUntil(this.unSubscribe))
    .subscribe((res: HttpResponse<any>) => {
      if (res?.headers && res?.body) {
        const contentDispose = res.headers.get('content-disposition');
        const matches = contentDispose.split(';')[1].trim().split('=')[1];
        let filename = matches && matches.length > 1 ? matches : 'test' + '.pdf';
        filename = filename.slice(1, filename.length-1);
        saveAs(res.body, filename);
      }
    });
    
  }
  private calculateTotal() {
    let salesTaxTotal = 0;
    let totalNetTotal = 0;
    this.lineItems.forEach((lineItem) => {
      salesTaxTotal += lineItem?.costSummary?.period?.tax;
      totalNetTotal += lineItem?.costSummary?.total?.clientNet;
    });
    this.salesTaxTotal = salesTaxTotal;
    this.totalNetTotal = totalNetTotal;
    this.cdRef.detectChanges();
  }
  ngOnDestroy(){
    // Remove style header/footer style element 
    document.getElementById('contract-preview-style')?.remove();
    // UnSubscribe the stream
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

}
