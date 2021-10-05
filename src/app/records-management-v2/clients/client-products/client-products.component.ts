import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { catchError, filter, finalize, map, takeUntil, tap } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { Sort } from '@angular/material/sort';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent
} from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';

import {
  ClientProduct,
  ClientProductsResponse
} from '@interTypes/records-management';
import { Helper } from '../../../classes';
import { CustomColumnsArea } from '@interTypes/enums';
import { RecordService } from '../../record.service';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { UseRecordPagination } from '../../useRecordPagination';
import { AddProductComponent } from '../add-product/add-product.component';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { IMXMatPaginator } from '@shared/common-function';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '@shared/services/authentication.service';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { ElasticSearch } from '../../../classes/ElasticSearch';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';

@Component({
  selector: 'app-client-products',
  templateUrl: './client-products.component.html',
  styleUrls: ['./client-products.component.less'],
  providers: [
    CustomizeColumnService,
    ElasticSearch,
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientProductsComponent
  extends AbstractLazyLoadComponent
  implements OnInit {
  @ViewChild(MatPaginator) public paginator: MatPaginator;
  @Input() public clientDetails: ClientDetailsResponse;
  @Input() public clientId;
  @Input() public reLoader$: Subject<any> = new Subject();
  @Output() productUpdate = new EventEmitter();
  @Output() resetClientProducts = new EventEmitter<any>();

  public dataSource = new MatTableDataSource<ClientProduct>([]);
  public clientsPagination: UseRecordPagination = new UseRecordPagination({
    page: 1,
    perPage: 10
  });
  public isLoadingClients = true;
  public sortName = 'updatedAt';
  public sortDirection = 'desc';

  public scrollContent: number;
  public panelContainer: string;
  public menuOpened = false;
  public hoveredIndex = -1;

  public isInitialLoadCompleted = false;
  public unsubscribeInitiator$: Subject<void> = new Subject<void>();
  public unsubscribe$: Subject<void> = new Subject<void>();
  private selectedSort: Sort = {
    active: this.sortName,
    direction: 'desc'
  };
  public paginationSizes: number[] = [10];
  @ViewChild('tableScrollRef', { read: ElementRef, static: false })
  tableScrollRef: ElementRef;
  public hasHorizontalScrollbar = false;
  public disableEdit = false;
  userPermission: UserActionPermission;
  constructor(
    public recordService: RecordService,
    public customizeColumnService: CustomizeColumnService,
    public dialog: MatDialog,
    public cdRef: ChangeDetectorRef,
    private activeRoute: ActivatedRoute,
    public elasticSearch: ElasticSearch,
    private auth: AuthenticationService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.userPermission = this.auth.getUserPermission(UserRole.CLIENT_PRODUCT);
    this.openProductOnInit();
    this.setupElasticSearch();
    this.listenerForInitialLoad();
    this.initializeCustomizeColumn();
    this.reSize();
    this.reLoader$.pipe(takeUntil(this.unsubscribe$)).subscribe((res) => {
      if (res.load) {
        this.resetClientPagination();
        this.loadData();
      }
    });

    this.recordService.refreshEstimatesProductsList$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.loadData();
      });
    this.checkForEditPermission();
  }

  private checkForEditPermission() {
    const permissions = this.auth.getUserPermission(UserRole.CLIENT_PRODUCT);
    if (permissions && !permissions.edit) {
      this.disableEdit = true;
    }
  }

  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public init(): void {
    this.loadData();
  }

  public initializeCustomizeColumn() {
    const defaultColumns = [
      { displayname: 'Product Name', name: 'productName' },
      { displayname: 'Action', name: 'action' },
      { displayname: 'Product Code', name: 'productCode' },
      { displayname: 'OI Product', name: 'oiProduct' },
      { displayname: 'Fee Basis', name: 'feeBasis' },
      { displayname: 'Commission %', name: 'commission' },
      { displayname: 'Commission Basis', name: 'commissionBasis' },
      { displayname: 'Billing Company', name: 'billingCompany' },
      { displayname: 'Billing Contact', name: 'billingContact' },
      { displayname: 'Billing Email', name: 'billingEmail' },
      { displayname: 'Last Modified Date', name: 'updatedAt' },
      { displayname: 'Last Modified By', name: 'updatedBy' }
    ];

    this.customizeColumnService.init({
      defaultColumns: defaultColumns,
      sortableColumns: Helper.deepClone(defaultColumns),
      cachedKeyName: CustomColumnsArea.CLIENTS_PRODUCTION_TABLE,
      successCallback: () => this.cdRef.markForCheck()
    });
  }

  public reSize() {
    this.scrollContent = window.innerHeight - 480;
    setTimeout(() => {
      this.hasHorizontalScrollbar =
        this.tableScrollRef?.nativeElement.scrollWidth >
        this.tableScrollRef?.nativeElement.clientWidth;
      this.cdRef.detectChanges();
    }, 200);
  }

  public onSorting(sort: Sort) {
    this.selectedSort = sort;
    this.sortDirection = sort.direction;
    this.sortName = sort.active;
    this.resetClientPagination();
    this.cdRef.markForCheck();
    this.loadData(true);
  }

  public getPageEvent(event: PageEvent) {
    this.clientsPagination.doPagination(event);
    this.loadData(true);
  }

  public openClientDetails(element: any, isForUpdate = true) {
    this.dialog
      .open(AddProductComponent, {
        minHeight: '485px',
        data: {
          client: this.clientDetails,
          product: element,
          isForUpdate,
          disableEdit: this.disableEdit
        },
        width: '770px',
        closeOnNavigation: true,
        disableClose: true,
        panelClass: 'add-product__panel'
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.status === 'success') {
          this.resetClientPagination();
          this.resetClientProducts.emit();
          if (result?.data?.id) {
            // for duplicate only reload products
            this.loadData();
            this.productUpdate.emit();
          } else {
            // for update, we need to reload estimate too for reflect change
            this.recordService.refreshEstimatesProductsListSubject.next(true);
          }
        }
      });
  }

  public onMenuOpen() {
    this.menuOpened = true;
  }

  public onMenuClosed() {
    this.menuOpened = false;
  }

  /*public onHoverRow(index: any, row) {
    const parentDiv = document.getElementById('client-table-scroll');
    const actionElement = document.getElementById('action-btn-main' + row['_id']);
    const ele = document.getElementById('cli-prod-hoverid-' + index);

    if (parentDiv && actionElement && ele) {
      actionElement.style.top = (ele.offsetHeight / 2) - 12 + 'px';
      actionElement.style.left = ((parentDiv.offsetWidth - 130) + parentDiv.scrollLeft) + 'px';
      ele.appendChild(actionElement);
    }

    if (!this.menuOpened) {
      this.hoveredIndex = index;
    }
    this.cdRef.markForCheck();
  }
  onHoverOut() {
    if (!this.menuOpened) {
      this.hoveredIndex = null;
    }
    this.cdRef.markForCheck();
  }*/

  public loadData(isForSortingOrPaginating = false) {
    this.isLoadingClients = true;
    const fieldSet = [
      '_id',
      'productName',
      'productCode',
      'billingCompany',
      'billingContact',
      'billing',
      'updatedAt',
      'updatedBy'
    ];
    const selectedSort = Helper.deepClone(this.selectedSort);
    switch (selectedSort.active) {
      case 'billingCompany':
        selectedSort.active = 'billingCompany.name';
        break;
      case 'billingEmail':
        selectedSort.active = 'billingContact.email';
        break;
      case 'billingContact':
        selectedSort.active = 'billingContact.firstName';
        break;
      case 'feeBasis':
        selectedSort.active = 'billing.feeBasis.name';
        break;
      case 'commission':
        selectedSort.active = 'billing.media';
        break;
      case 'commissionBasis':
        selectedSort.active = 'billing.commissionBasis.name';
        break;
    }
    const isSortFieldString = /(productName|billingCompany|billingContact|billingEmail|productCode|feeBasis|commissionBasis|updatedBy|commission)/.test(
      this.selectedSort.active
    );
    const isunMappedTypeDate = /^(updatedAt)$/.test(this.selectedSort?.active);

    const funcArgs = [
      fieldSet,
      selectedSort,
      isSortFieldString,
      this.clientsPagination.getValues(),
      (res: ClientProductsResponse) => {
        this.dataSource.data = res.results;
        this.isLoadingClients = false;
        this.setPaginationFromRes(res);
        this.cdRef.markForCheck();
        this.reSize();
        this.destroyInitiator();
      },
      (error) => {
        this.isLoadingClients = false;
        this.cdRef.markForCheck();
      },
      false,
      isunMappedTypeDate
    ];

    this.dataSource.data = [];

    let func: any = this.elasticSearch.loadDataForNonFilters;
    if (isForSortingOrPaginating) {
      func = this.elasticSearch.handleSortingAndPaginating;
      funcArgs.splice(0, 1);
    }

    func.apply(this.elasticSearch, funcArgs);
  }

  private setPaginationFromRes(res) {
    if (res?.pagination) {
      this.clientsPagination.updateTotal(res?.pagination.total);
      this.setPaginationSizes(res?.pagination.total);
    }
  }

  public resetClientPagination() {
    this.clientsPagination.resetPagination();
  }

  public duplicateProduct(product: any) {
    this.openClientDetails(product, false);
  }

  public deleteProductAPI(product: any) {
    this.dialog
    .open(DeleteConfirmationDialogComponent, {
      width: '340px',
      height: '260px',
      panelClass: 'imx-mat-dialog'
    })
    .afterClosed()
    .subscribe(
      (res) => {
        if (res && res['action']) {
          this.recordService
            .deleteClientProducts(this.clientDetails?._id, product._id)
            .subscribe((response: any) => {
              this.handleSuccessResponse(
                response,
                'Product deleted successfully!'
              );
              this.resetClientPagination();
            });
          this.productUpdate.emit();
        }
      },
      (errorResponse) => {
        this.handleErrorResponse(errorResponse);
      }
    );
  }

  public deleteProduct(product: any) {
    console.log('pr', product);
    this.recordService.getProductAssociation(product._id)
    .subscribe((response) => {
      if(Object.keys(response?.associations).length > 0) {
        this.openDeleteWarningPopup();
      } else {
        this.deleteProductAPI(product);
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
  
  public handleSuccessResponse(response, message) {
    if (response.status === 'success') {
      this.recordService.showsAlertMessage(message);
      this.loadData();
    }
  }

  public handleErrorResponse(errorResponse) {
    if (errorResponse.error?.message) {
      this.recordService.showsAlertMessage(errorResponse.error?.message);
      return;
    }
    this.recordService.showsAlertMessage(
      'Something went wrong, Please try again later'
    );
  }

  private resetSorting() {
    this.sortName = 'updatedAt';
    this.sortDirection = 'desc';
  }

  public setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
    } else {
      this.paginationSizes = [10];
    }
  }

  /**
   * @description
   *  Open the product details while user trying to open the client link
   *  product tab.
   */
  public openProductOnInit() {
    if (this.activeRoute.snapshot.queryParamMap.get('tab') === 'products') {
      const productId = this.activeRoute.snapshot.queryParamMap.get('id');
      // const clientId = this.activeRoute.snapshot.paramMap.get('id');
      this.preload = true;
      this.recordService
        .getClientProduct(this.clientId, productId)
        .pipe(filter((res) => !!res))
        .subscribe((res) => {
          this.openClientDetails(res, true);
        });
    }
  }

  private setupElasticSearch() {
    this.elasticSearch.PATH = `clients/${this.clientId}/products`;
    this.elasticSearch.ELASTIC_PATH = `clients/${this.clientId}/products/search`;
  }
}
