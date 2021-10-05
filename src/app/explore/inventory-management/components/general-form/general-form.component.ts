import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subject, throwError} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {AbstractInventoryFormComponent} from '../abstract-inventory-form.component';
import {Vendor, VendorSearchPayload, VendorsSearchPagination, VendorsSearchResponse} from '@interTypes/inventory-management';
import {InventoryService} from '@shared/services';
import {emptySpaceValidator, forbiddenNamesValidator} from '@shared/common-function';
import {MatDialog} from '@angular/material/dialog';
import {CreateVendorComponent} from '../../vendor/create-vendor/create-vendor.component';
import {VendorService} from '../../vendor/vendor.service';
import {InfiniteScrollDirective} from 'ngx-infinite-scroll';
@Component({
  selector: 'app-general-form',
  templateUrl: './general-form.component.html',
  styleUrls: ['./general-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralFormComponent extends AbstractInventoryFormComponent implements OnInit, OnDestroy {

  generalForm: FormGroup;
  isLoadingVendors = true;
  latlngRequired = true;
  addressRequired = false;
  private unsubscribe = new Subject();
  /** TODO: Enable if existing inventory */
  public updateExisting = false;
  public filteredVendors: Vendor[] = [];
  public panelContainer: string;
  public disableVendorPaging = false;
  public vendorPagination: VendorsSearchPagination;
  private vendorPerPage = 100;
  @ViewChild('scrollBar', { read: InfiniteScrollDirective}) scrollBar: InfiniteScrollDirective;
  constructor(
    private fb: FormBuilder,
    private inventoryApi: InventoryService,
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private vendorService: VendorService
  ) {
    super();
  }

  ngOnInit(): void {
    this.resetPaginationState();
    this.buildGeneralForm();
    this.updateFormRef();
    this.setFilterVendorsSubscription();

    this.generalForm.valueChanges.pipe(
      takeUntil(this.unsubscribe),
      debounceTime(400)
    ).subscribe(value => {
      if ((!value.lat && !value.lng) && (value.street_address || value.city || value.state || value.zip)) {
        this.removeValidation(['lat', 'lng']);
        this.addValidation(['street_address', 'state', 'zip']);
        /** To show/hide * symbol  */
        this.latlngRequired = false;
        this.addressRequired = true;
      } else {
        this.addValidation(['lat', 'lng']);
        this.removeValidation(['street_address', 'state', 'zip']);
        /** To show/hide * symbol  */
        this.latlngRequired = true;
        this.addressRequired = false;
      }
    });

    /* if(this.updateExisting){
       this.addValidation(['vendor_frame_id']);
     }else{
       this.removeValidation(['vendor_frame_id']);
     }*/
  }

  addValidation(fields = []) {

    /** Validators.minLength(1) For empty space validation address or lat , long */
    fields.map(field => {
      this.generalForm.controls[field].setValidators([Validators.required, Validators.minLength(1), emptySpaceValidator]);
      this.generalForm.controls[field].updateValueAndValidity({ emitEvent: false });
    });
  }

  removeValidation(fields = []) {
    fields.map(field => {
      this.generalForm.controls[field].clearValidators();
      this.generalForm.controls[field].updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  updateFormRef() {
    this.form = this.generalForm;
  }

  vendorDisplayWithFn(vendor: Vendor) {
    return vendor?.name ?? '';
  }

  vendorsTrackByFn(idx: number, vendor: Vendor) {
    return vendor?._id ?? idx;
  }

  private buildGeneralForm() {
    this.generalForm = this.fb.group({
      vendor: [null, Validators.required, forbiddenNamesValidator],
      // vendor_office: [''],
      // shipping_address: [''],
      // TODO : Enable once get the existing data update
      /*geopath_frame_id: [{ value: '', disabled: !this.updateExisting }],
      geopath_spot_id: [{ value: '', disabled: !this.updateExisting }],
      vendor_frame_id: [{ value: '', disabled: !this.updateExisting }],
      vendor_spot_id: [{ value: '', disabled: !this.updateExisting }],*/
      // loc_description: ['', Validators.required],
      lat: [null, Validators.required],
      lng: [null, Validators.required],
      street_address: [null, [Validators.required, Validators.minLength(1), emptySpaceValidator]],
      // city: ['', Validators.required],
      state: [null, [Validators.required, Validators.minLength(1), emptySpaceValidator]],
      zip: [null, [Validators.required, Validators.minLength(1), emptySpaceValidator]]
    });
  }

  private setFilterVendorsSubscription() {
    this.isLoadingVendors = true;
    this.generalForm.get('vendor').valueChanges
      .pipe(startWith(''),
        distinctUntilChanged(),
        debounceTime(400),
        tap(() => {
          this.resetPaginationState();
          if (this.scrollBar) {
            /**
             * This is a hack for the issue described in https://github.com/orizens/ngx-infinite-scroll/issues/316#issuecomment-469891715
             * We have to reset the infinite-scroller if the data is changed like in sorting or search results.
             * Only way to do it is to tap into the directive instance on the current page using viewChild and reset that and set up again on data change. There are some other methods, bet they are really hacky and unstable, this method needed very less change from our implementation. If any bugs are encountered in this, look into matPagination and switch to that.
             */
            this.scrollBar.destroyScroller();
            this.scrollBar.setup();
          }
        }),
        map((res: string) => {
          return this.formatSearchTerm(res);
        }),
        switchMap((search: VendorSearchPayload) =>
          this.vendorService.getVendorBySearch(search, this.vendorPagination)
        ),
        takeUntil(this.unsubscribe)
      ).subscribe((res: VendorsSearchResponse) => {
        this.filteredVendors = res.results;
        this.vendorPagination = {
          ...this.vendorPagination,
          total: res.pagination.total
        };
      this.isLoadingVendors = false;
      this.setPaginationStatus();
    }, error => {
        this.isLoadingVendors = false;
    });
  }

  private resetPaginationState(): void {
    this.vendorPagination = {
      page: 1,
      total: 0,
      perPage: this.vendorPerPage
    };
    this.disableVendorPaging = false;
  }

  private formatSearchTerm(searchTerm: string): VendorSearchPayload {
    if (!searchTerm) {
      searchTerm = '';
    }
    const data: VendorSearchPayload = {
      search: searchTerm.toLowerCase()
    };
    return data;
  }

  addVendor() {
    const dialogRef = this.dialog.open(CreateVendorComponent, {
      width: '1030px',
      data: {size: 240, showClose: true},
      backdropClass: 'hide-backdrop',
      panelClass: 'inventory-detail-dialog'
    });

    dialogRef.afterClosed().pipe(
      filter(result => result),
      mergeMap(result => this.vendorService.getSpecificVendorDetails(result.id)),
      filter(response => !!response?._id)
    ).subscribe(response => {
      this.filteredVendors = [...this.filteredVendors, response];
      this.generalForm.controls.vendor.setValue(response);
    });
  }
  public updateContainer() {
    this.panelContainer = '.vendor-dropdown-input';
  }
  public loadMoreVendors() {
    this.isLoadingVendors = true;
    this.vendorPagination = {
      ...this.vendorPagination,
      page: this.vendorPagination.page + 1
    };
    const search = this.formatSearchTerm(this.generalForm.get('vendor').value);
    this.vendorService.getVendorBySearch(search, this.vendorPagination)
      .pipe(catchError(error => {
          this.vendorPagination = {
            ...this.vendorPagination,
            page: this.vendorPagination.page - 1
          };
          this.isLoadingVendors = false;
          return throwError('something went wrong');
        }))
      .subscribe((res: VendorsSearchResponse) => {
        this.filteredVendors = [...this.filteredVendors, ...res.results];
        this.isLoadingVendors = false;
        this.setPaginationStatus();
      });
  }

  private setPaginationStatus() {
    if (Math.ceil(this.vendorPagination.total / this.vendorPagination.perPage) <= this.vendorPagination.page) {
      this.disableVendorPaging = true;
    }
    this.cdRef.detectChanges();
  }
}
