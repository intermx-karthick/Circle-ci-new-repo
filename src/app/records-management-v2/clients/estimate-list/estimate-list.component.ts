import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
  Input,
  OnDestroy,
  Optional,
  SkipSelf,
  Inject,
  ElementRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort, SortDirection } from '@angular/material/sort';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent
} from '@angular/material/paginator';
import { IMXMatPaginator } from '@shared/common-function';
import { RecordService } from '../../record.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  EstimateSearchPagination,
  EstimateData,
  EstimateSearchFilter
} from '@interTypes/inventory-management/estimate-search.response';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { tap, filter, flatMap, concatMap, takeUntil, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { AddEstimateComponent } from '../add-estimate/add-estimate.component';
import { Subject, Observable } from 'rxjs';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { Helper } from '../../../classes';
import { CustomColumnsArea } from '@interTypes/enums';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { FormControl } from '@angular/forms';
import { AbstractClientsDropDownComponent } from '../abstract-clients-drop-down.component';
import { UseAutoCompleteInfiniteScroll } from 'app/classes/use-auto-complete-infinite-scroll';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { OverlayListResponseModel, OverlayListInputModel, LoadMoreItemsModel, OverlayListModel, Pagination } from '@shared/components/overlay-list/overlay-list.model';
import { get } from 'lodash';
import { AuthenticationService } from '@shared/services/authentication.service';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';

@Component({
  selector: 'app-estimate-list',
  templateUrl: './estimate-list.component.html',
  styleUrls: ['./estimate-list.component.less'],
  providers: [{ provide: MatPaginatorIntl, useClass: IMXMatPaginator }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstimateListComponent implements OnInit, OnDestroy {
  defaultColumns = [
    // { displayname: 'Estimate Name', name: 'estimateName' },
    // { displayname: 'Estimate #', name: 'estimate' },
    { displayname: 'Product Name', name: 'productName' },
    { displayname: 'Product Code', name: 'productCode' },
    { displayname: 'Fee Basis', name: 'feeBasis' },
    { displayname: 'Commission %', name: 'commission' },
    { displayname: 'Commission Basis', name: 'commissionBasis' },
    { displayname: 'Start Date', name: 'startDate' },
    { displayname: 'End Date', name: 'endDate' },
    { displayname: 'Client Requirement Reference', name: 'clientRequirementCode' },
    { displayname: 'TBD', name: 'TBD' },
    { displayname: 'Last Modified Date', name: 'updatedAt' },
    { displayname: 'Last Modified By', name: 'updatedBy' }
  ];

  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  private selectedSort: Sort;
  public sortName = 'updatedAt';
  public sortDirection: SortDirection = 'desc';
  public estimatePagination: EstimateSearchPagination = {
    page: 1,
    perPage: 10 // Default perPage size
  };

  public customizeColumnService: CustomizeColumnService;
  public isLoadingEstimate = false;

  @Input() public clientId;
  @Input() public reLoader$: Subject<any> = new Subject();
  @Input() public clientDetails: ClientDetailsResponse;

  public estimateList: EstimateData[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("estimateInput") estimateInputField: ElementRef;
  public menuOpened = false;
  public hoveredIndex = -1;
  public scrollContent = 250;
  private unsubscribe$ = new Subject();
  public paginationSizes: number[] = [10];
  public isDialogOpenend = false;
  public pageEvent = false;

  public isNameSearchActive = false;
  public estimateNameformControl: FormControl = new FormControl();
  public isproductNameFilterOpen = false;
  public productsAutoComplete = new UseAutoCompleteInfiniteScroll();
  public searchProductCtrl: FormControl = new FormControl();
  public selectedProductCtrl: FormControl = new FormControl();
  public selectedproductData:any[] = []
  public productNameOverlayOrigin: CdkOverlayOrigin;
  private unSubscribeAutocomplete: Subject<void> = new Subject<void>();
  public searchFilterApplied = false;
  public disableSort: boolean;
  @ViewChild('tableScrollRef', {read: ElementRef, static:false}) tableScrollRef: ElementRef;
  public hasHorizontalScrollbar = false;
  public productObserver: Observable<OverlayListResponseModel>;
  public disableEdit = false;
  userPermission: UserActionPermission;
  public selectedProducts: OverlayListModel[] = [];
  public searchProductText: string = ''; 
  public clientProductPagination: Pagination = null;

  constructor(
    public cdRef: ChangeDetectorRef,
    private route: Router,
    public recordService: RecordService,
    private matSnackBar: MatSnackBar,
    public dialog: MatDialog,
    public activeRoute: ActivatedRoute,
    private auth: AuthenticationService,
    @Optional() @SkipSelf() public dialogRef: MatDialogRef<EstimateListComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public injectedData: any) {
  }

  ngOnInit(): void {
    this.userPermission = this.auth.getUserPermission(UserRole.CLIENT_ESTIMATE);
    this.openEstimateOnInit();

    if (this.injectedData?.dialogOpenened) {
      this.isDialogOpenend = true;
      this.clientId = this.injectedData?.clientId;
      this.sortName = this.injectedData?.sortName;
      this.sortDirection = this.injectedData?.sortDirection;
      this.selectedSort = {active:this.sortName??'updatedAt', direction:this.sortDirection ?? 'desc'};
      // setting estimate search & product filter
      this.setInitialEstimateFilter(this.injectedData);
    }
    this.customizeColumnService = new CustomizeColumnService(this.dialog);
    if (this.clientId) {
      this.resetEstimatePagination(this.isDialogOpenend ? true : false);
      this.loadEstimate();
    }
    this.reLoader$.pipe(takeUntil(this.unsubscribe$)).subscribe((res) => {
      if (res.load) {
        // this.resetSorting();
        this.resetEstimatePagination(this.isDialogOpenend ? true : false);
        this.loadEstimate();
      }
      if(res?.['product']){
        this.productsAutoComplete.loadData(null, null);
      }
      if(res?.['openEstimateTab']){
       this.reSize();
      }

    });

    this.recordService.refreshEstimatesProductsList$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.loadEstimate();
      });

    this.reSize();


   // Initialize customize column
    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.defaultColumns),
      cachedKeyName: CustomColumnsArea.CLIENT_ESTIMATE_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0,0,'estimateName')
        this.customizeColumnService.displayedColumns.splice(1,0,'estimate')
        this.customizeColumnService.displayedColumns.splice(2,0,'action')
        this.cdRef.markForCheck();
      }
    });

    this.estimateNameBySearch();
    this.filterProductNameSearch();
    this.setProductNameList();
    this.checkForEditPermission();
  }

  private checkForEditPermission() {
    const permissions = this.auth.getUserPermission(UserRole.CLIENT_ESTIMATE);
    if (permissions && !permissions.edit) {
      this.disableEdit = true;
    }
  }

  setInitialEstimateFilter(data){
    //setting product search test
    if(data?.['searchProductText']){
      this.searchProductCtrl.setValue(data?.['searchProductText']);
    }

    //setting product search test
    if(data?.['selectedproductData'].length){
      this.selectedproductData = data?.['selectedproductData'] ?? [] ;
    }

    //setting product search test
    if(data?.['selectedProductCtrl']){
      this.selectedProductCtrl.patchValue(data?.['selectedProductCtrl']);
    }

    //setting estimate name search test
    if(data?.['estimateSearch']){
      this.estimateNameformControl.setValue(data?.['estimateSearch']);
    }
  }

  filterProductNameSearch() {
    const productBySearchCtrl = this.searchProductCtrl?.valueChanges;
    if (productBySearchCtrl) {
      this.productsAutoComplete.loadDependency(this.cdRef, this.unSubscribeAutocomplete, productBySearchCtrl);
      this.productsAutoComplete.apiEndpointMethod = () => {
        return this.recordService
          .getClientProducts(
            this.clientId,
            this.productsAutoComplete.pagination,
            'asc',
            'productName',
            this.productsAutoComplete.searchStr
          )
          .pipe(filter((res: any) => !!res.results));
      };

      //this.productsAutoComplete.loadData(null, null);

      this.productsAutoComplete.loadData(null, (res) => {
        this.productsAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.productsAutoComplete.listenForAutoCompleteSearchFormControl(this.searchProductCtrl, null, (res) => {
        this.productsAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

    }
  }


  public disableNameSearch(event) {
    this.estimateNameformControl.patchValue('');
    this.isNameSearchActive = false;
    event.stopPropagation();
  }

  public enableNameSearch(event) {
    this.isNameSearchActive = true;
    this.isproductNameFilterOpen = false;
    setTimeout(() => {
      this.estimateInputField.nativeElement.focus();
    }, 100);
    event.stopPropagation();
  }

  estimateNameBySearch(){
    this.estimateNameformControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribe$),
        debounceTime(500),
        distinctUntilChanged(),
      )
      .subscribe((searchStr) => {
        this.resetEstimatePagination(this.isDialogOpenend ? true : false);
        this.loadEstimate();
        this.cdRef.markForCheck();
      });
  }

  public filterProduct(){
    this.isproductNameFilterOpen = false;
    this.resetEstimatePagination(this.isDialogOpenend ? true : false);
    this.selectedproductData = [...new Set(this.selectedProducts?.map(product => product?.value))];
    this.loadEstimate();
    this.cdRef.markForCheck();
  }

  public compareProductsFilters(c1, c2) {
    return c1 && c2 && c1['_id'] === c2['_id'];
  }

  public trackproductsFilters(idx: number, product) {
    return product?._id ?? idx;
  }


  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    // Auto complete unsubscripbe
    this.unSubscribeAutocomplete.next();
    this.unSubscribeAutocomplete.complete();
  }

  private formateSearchPayload(){
    const estimateSearchText = this.estimateNameformControl.value;
    let searchPayload: EstimateSearchFilter = {
      search: '',
      filters: {}
    };
    if(estimateSearchText && estimateSearchText?.toString().trim().length){
      searchPayload.search = estimateSearchText;
    }else{
      delete searchPayload.search;
    }

    if(this.selectedproductData?.length){
      searchPayload.filters.productIds = this.selectedproductData;
    }else{
      delete searchPayload.filters;
    }
    return searchPayload;
  }

  public closeSearchFilter() {
    const searchValue = this.estimateNameformControl.value;
    this.isNameSearchActive = false;
    if (searchValue?.length > 0) {
      this.isNameSearchActive = true;
    }
  }


  private loadEstimate() {
    this.isLoadingEstimate = true;
    this.recordService
      .getEstmate(this.formateSearchPayload(), this.clientId, this.estimatePagination, this.selectedSort)
      .pipe(
        tap(() => {
          this.isLoadingEstimate = false;
          this.cdRef.markForCheck();
        }),
        filter((res) => !!res.results)
      )
      .subscribe((res) => {
        this.estimateList = res.results;
        this.dataSource.data = this.estimateList;
        this.estimatePagination = res.pagination;
        this.setEstimatePaginationFromRes(res);
        this.reSize();
        this.cdRef.detectChanges();
      }, error => {
        //Hide loader
        this.isLoadingEstimate = false;
        this.cdRef.markForCheck();
        if (error?.error?.message) {
          this.showsAlertMessage(error?.error?.message);
          return;
        } else if (error?.error?.error) {
          this.showsAlertMessage(error?.error.error);
          return;
        }
        this.showsAlertMessage(
          'Something went wrong, Please try again later'
        );
      });
  }

  public onSorting(sort: Sort) {
    this.selectedSort = sort;
    this.estimateList = [];
    this.sortDirection = sort?.direction;
    this.sortName = sort?.active;
    this.dataSource.data = this.estimateList;
    this.cdRef.markForCheck();
    this.resetEstimatePagination(this.isDialogOpenend ? true : false);
    this.loadEstimate();
  }

  onFocusSearchBox() {
    this.disableSort = true;
  }

  onBlurSearchBox() {
    this.disableSort = false;
  }

  private resetEstimatePagination(isDialog = false) {
    this.estimatePagination = { page: 1, perPage: isDialog ? 50 : 10 };
  }

  public setEstimatePaginationFromRes(result) {
    if (result?.pagination?.total) {
      this.estimatePagination.total = result['pagination']['total'];
      this.setPaginationSizes(result['pagination']['total']);
    }
    this.cdRef.markForCheck();
  }

  private showsAlertMessage(msg) {
    const config = {
      duration: 3000
    } as MatSnackBarConfig;
    this.matSnackBar.open(msg, '', config);
  }

  public getPageEvent(event) {
    this.pageEvent = true;
    this.estimatePagination.page = event.pageIndex + 1;
    this.estimatePagination.perPage = event.pageSize;

    this.loadEstimate();
  }

  public reSize() {
    if (window.innerWidth < 1100) {
      this.scrollContent = window.innerHeight - 500;
    } else {
      this.scrollContent = window.innerHeight - 470;
    }
    setTimeout(() => {
      this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
    this.cdRef.detectChanges();
    }, 200);

  }

  public onMenuOpen() {
    this.menuOpened = true;
  }

  public onMenuClosed() {
    this.menuOpened = false;
  }

  public openEstimateDetails(element: any, isForUpdate = true, isDuplicate=false, listDuplicate=false) {
    this.isDialogOpenend = false;
    this.recordService.getClientEstimate(this.clientId, element._id, false).pipe(
      filter(res => !!res),
      concatMap((res) => this.dialog
        .open(AddEstimateComponent, {
          minHeight: '485px',
          data: { clientId: this.clientId, client: this.clientDetails, estimate: res, isForUpdate,  isDuplicate,listDuplicate:listDuplicate, disableEdit: this.disableEdit},
          width: '845px',
          closeOnNavigation: true,
          disableClose: true,
          panelClass: 'add-estimate__panel'
        })
        .afterClosed()
      )
    ).subscribe((result) => {
      if (result?.status === 'success') {
        this.resetEstimatePagination();
        // this.resetSorting();
        setTimeout(() => {
          this.loadEstimate();
        }, 100);
      }
    });
  }

  deleteEstimateWithAssociation(element) {
    this.recordService.getClientEstimateAssociation(element._id)
    .subscribe((response) => {
      if(Object.keys(response?.associations).length > 0) {
        this.openDeleteWarningPopup();
      } else {
        this.deleteEstimate(element);
      }
    },
    (errorResponse) => {
      if (errorResponse.error?.message) {
        this.recordService.showsAlertMessage(errorResponse.error?.message);
        return;
      } else if (errorResponse.error?.error) {
        this.recordService.showsAlertMessage(errorResponse.error?.error);
        return;
      }
      this.recordService.showsAlertMessage('Something went wrong, Please try again later');
    });
  }

  public deleteEstimate(element) {
    this.recordService.getClientEstimate(this.clientId, element._id, false).pipe(
      filter(res => !!res)).subscribe((result) => {
      if (result?.['estimate'].length>1) {
        this.deleteEstimateAPI(element, false);
      }else{
        this.deleteEstimateAPI(element,true);
      }
    });
  }
  
  public openDeleteWarningPopup() {
    const dialogueData = {
      title: 'Attention',
      description: 'Please <b>Confirm</b> This record has already been used on a Campaign or Contract. Please double-check all relationships before deleting.',
      confirmBtnText: 'OK',
      cancelBtnText: 'CANCEL',
      displayCancelBtn: false,
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

    });
  }
  public deleteEstimateAPI(element, isLastEstimate=false) {
    if (element !== null) {
      const configData = {
        confirmBtnText: 'Continue'
      };
      // Add the confirm message when estimate have only one
      if(isLastEstimate){
        configData['description'] = 'Deleting Estimate(s) will result in Estimate Group Deletion. Would you like to continue?';
      }
      this.dialog
        .open(DeleteConfirmationDialogComponent, {
          data: configData,
          width: '340px',
          height: '260px',
          panelClass: 'imx-mat-dialog'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res['action']) {
            if(isLastEstimate){ // To deleting estimate group & estimate
              this.deleteEstimateByID(element['_id']);
            }else{
              // To delete estimate group items based on selected items
              this.deleteEstimateItemByID(element['_id'], element?.estimate['_id']);
            }
          }
        });
    }
  }

  /**
   * This function used to delete the selected estimate group item
   * @param estimateId Selected Estimate id
   * @param itemId Selected estimate group item id
   */
  deleteEstimateItemByID(estimateId, itemId){
    this.recordService
      .deleteEstimateDateById(estimateId, this.clientId,itemId)
      .subscribe((response) => {
          this.showsAlertMessage('Estimate deleted successfully!');
          this.resetEstimatePagination(this.isDialogOpenend ? true : false);
          this.loadEstimate();
      },
      (errorResponse) => {
        if (errorResponse.error?.message) {
          this.showsAlertMessage(errorResponse.error?.message);
          return;
        } else if (errorResponse.error?.error) {
          this.showsAlertMessage(errorResponse.error?.error);
          return;
        }
        this.showsAlertMessage('Something went wrong, Please try again later');
      });
  }

  /**
   * This function used to delete the estimate based on ID
   * @param estimateId Selected Estimate id
   * @param estimateId
   */

  deleteEstimateByID(estimateId){
    this.recordService
      .deleteEstimateById(estimateId, this.clientId)
      .subscribe((response) => {
          this.showsAlertMessage('Estimate deleted successfully!');
          this.resetEstimatePagination(this.isDialogOpenend ? true : false);
          this.loadEstimate();
      },
      (errorResponse) => {
        if (errorResponse.error?.message) {
          this.showsAlertMessage(errorResponse.error?.message);
          return;
        } else if (errorResponse.error?.error) {
          this.showsAlertMessage(errorResponse.error?.error);
          return;
        }
        this.showsAlertMessage('Something went wrong, Please try again later');
      });
  }

  public duplicateEstimateFormDialod(element){
     this.closeDialogBox(true,false, false, element, true);
  }

  public detailsEstimateFormDialod(element){
    this.closeDialogBox(true,true, false, element);
  }

  // TODO : Will work  estiate duplicate estimate  dialog
  public duplicateEstimate(element) {
    this.openEstimateDetails(element, false, false, true);
  }

  private resetSorting(){
    this.sortName = 'updatedAt';
    this.sortDirection = 'desc';
  }

  private setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
      if (!this.pageEvent && this.isDialogOpenend) {
        this.estimatePagination.perPage = 25;
      }
      this.pageEvent = false;
    } else {
      this.paginationSizes = [10];
      if (this.isDialogOpenend) {
        this.estimatePagination.perPage = 10;
      }
    }

  }

  public customizeColumn() {
    this.customizeColumnService.customizeColumn(()=>{
      this.customizeColumnService.displayedColumns.splice(0,0,'estimateName')
      this.customizeColumnService.displayedColumns.splice(1,0,'estimate')
      this.customizeColumnService.displayedColumns.splice(2,0,'action')
      this.reSize();
      this.cdRef.detectChanges();
    });
  }

  public openEstimateDialog() {
    this.resetEstimatePagination(true);
    this.dialog
      .open(EstimateListComponent, {
        disableClose: true,
        data: {
          dialogOpenened: true,
          clientId : this.clientId,
          sortName: this.sortName,
          sortDirection: this.sortDirection,
          estimateSearch:this.estimateNameformControl.value,
          selectedproductData:this.selectedproductData,
          selectedProductCtrl:this.selectedProductCtrl.value,
          searchProductText:this.searchProductCtrl.value
        },
        width: '90vw',
        closeOnNavigation: true,
        panelClass: 'estimate-list-dialog-fullscreen'
      })
      .afterClosed()
      .subscribe((data) => {
        this.resetEstimatePagination();
        this.isDialogOpenend = false;
        // While clikcing on duplicate action we no need to reinitialize normal table
        this.sortName = data?.sortName;
        this.sortDirection = data?.sortDirection;
        this.selectedSort = {active:data?.sortName, direction:data?.sortDirection};
        this.cdRef.markForCheck();
        this.setInitialEstimateFilter(data);
        if(data.duplicate || data.details || data.listDuplicate){
          this.openEstimateDetails(data.estimate, data.details, data.duplicate, data?.listDuplicate);
        }
        if (!data?.skipSetup) {
          this.loadEstimate();
        }
      });
  }

  public closeDialogBox(skipSetup = false, details=false, duplicate=false, estimate = null, listDuplicate = false) {
    const data = {
      skipSetup: skipSetup,
      sortName: this.sortName,
      sortDirection: this.sortDirection,
      details: details,
      duplicate: duplicate,
      estimate: estimate,
      estimateSearch:this.estimateNameformControl.value,
      selectedproductData:this.selectedproductData,
      selectedProductCtrl:this.selectedProductCtrl.value,
      searchProductText:this.searchProductCtrl.value,
      listDuplicate: listDuplicate
    }
    this.dialogRef.close(data);
  }

  /**
   * @description
   *  Open the estimate details while user trying to open the client link
   *  product tab.
   */
  public openEstimateOnInit() {
    if (this.activeRoute.snapshot.queryParamMap.get('tab') === 'estimates') {
      const estimateId = this.activeRoute.snapshot.queryParamMap.get('id');
      this.openEstimateDetails({ _id: estimateId }, true);
    }
  }

  public onClickProductFilter($event) {
    $event.stopPropagation();
    this.isproductNameFilterOpen = !this.isproductNameFilterOpen;
    this.closeSearchFilter();
  }

  public onApplyProductFilter(data: any) {
    const { selectedItem } = data || {};
    this.selectedProducts = selectedItem;
    this.filterProduct();
  }
  
  public onSearchProductFilter(data: LoadMoreItemsModel): any {
    const { searchText,  pagination } = data;
    this.searchProductText = searchText;
    this.clientProductPagination = pagination;
    this.productObserver = this.getProductObservable();
  }

  setProductNameList(): void {
    this.productObserver = this.getProductObservable();
  }

  getProductObservable(): Observable<OverlayListResponseModel> {
    return this.recordService
    .getClientProducts(
      this.clientId,
      this.clientProductPagination || this.productsAutoComplete.pagination,
      'asc',
      'productName',
      this.searchProductText
    )
    .pipe(map((data: any) => {
      const { results, pagination } = data;
      let response;
      if (Array.isArray(results)) {
        const items =  results.map(item => {
          const label = get(item, 'productName', '');
          const value = get(item, '_id', '');
          return { label, value } as OverlayListInputModel;
        });
        response = { result: items, pagination } as OverlayListResponseModel
      } else {
        response = { result: [], pagination } as OverlayListResponseModel;
      }
      return response;
    }));
  }

  public resetClientProducts(): void {
    this.loadEstimate();
    this.productObserver = this.getProductObservable();
  }
}