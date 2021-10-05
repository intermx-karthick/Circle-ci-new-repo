import {
  ClientDropDownValue,
  ClientProduct, Contact,
  FilteredClient
} from '@interTypes/records-management';
import { UseAutoCompleteInfiniteScroll } from '../classes/use-auto-complete-infinite-scroll';
import { EstimateData, PlaceTypesResponse, Vendor } from '@interTypes/inventory-management';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { VendorService } from '../records-management-v2/vendors/vendor.service';
import { RecordService } from '../records-management-v2/record.service';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { AuthenticationService, InventoryService, ThemeService } from '@shared/services';
import { PlaceType } from '@interTypes/inventory';
import { Project } from '@interTypes/workspaceV2';
import { ReportsAPIService } from './services/reports-api.service';
import { FiltersService } from '../explore/filters/filters.service';
import { AbstractMediaFilterW3 } from '@shared/components/media-types-filter-builder-w3/abstract-media-filter-w3';
import { Helper } from '../classes';
import { Report } from '@interTypes/reports/report-types';
import { AgenciesResponse, Agency } from '@interTypes/records-management/agencies/agencies.response';

export interface ReportGenerateDropdowns {
  reportCategories: Array<{ name: string; _id: string }>;
  reportTypes: Array<{ name: string; _id: string }>;

  divisions: Array<ClientDropDownValue>;
  clientTypes: Array<ClientDropDownValue>;
  costTypes: Array<ClientDropDownValue>; // todo

  officesAutoComplete: UseAutoCompleteInfiniteScroll<ClientDropDownValue>;

  vendorsAutoComplete: UseAutoCompleteInfiniteScroll<Vendor>;
  parentVendorsAutoComplete: UseAutoCompleteInfiniteScroll<Vendor>;
  parentClientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient>;
  clientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient>;
  agenciesAutoComplete: UseAutoCompleteInfiniteScroll<any>;
  productsAutoComplete: UseAutoCompleteInfiniteScroll<ClientProduct>;
  estimatesAutoComplete: UseAutoCompleteInfiniteScroll<EstimateData>;

  resellerAutoComplete: UseAutoCompleteInfiniteScroll<any>;
  campaigns: Array<Project>;
  mediaClassIns: MediaClass;
  mediaTypeIns: MediaType;
  dma: Array<{ id: string; name: string }>;
  placeTypes: Array<PlaceType>;

  loadDivisions();

  loadClientTypes();

  loadCostTypes();

  loadReportTypes();

  loadCategories();

  setUpVendors();

  setUpParentVendors();

  setUpClients();

  setUpParentClients();

  setUpAgencies();

  setUpProducts();

  setUpEstimates();

  setUpOffices();

  setUpReseller();

  loadCampaign();

  loadMediaClass();

  loadMediaTypes();

  loadDMA();

  loadPlaceTypes();
}

@Component({
  template: ''
})
export abstract class AbstractReportGenerateComponent
  implements OnInit, OnDestroy, ReportGenerateDropdowns {
  // use this for form
  public abstract reportGenerateForm: FormGroup;
  public abstract selectedClient: ClientDetailsResponse;
  public abstract selectedProduct: ClientProduct;

  public agenciesAutoComplete: UseAutoCompleteInfiniteScroll<any> = new UseAutoCompleteInfiniteScroll();
  public buyersAutoComplete: UseAutoCompleteInfiniteScroll<Contact> = new UseAutoCompleteInfiniteScroll();
  public campaigns: Array<Project> = [];
  public clientTypes: Array<ClientDropDownValue> = [];
  public clientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient> = new UseAutoCompleteInfiniteScroll<FilteredClient>();
  public costTypes: Array<ClientDropDownValue> = [];
  public divisions: Array<ClientDropDownValue> = [];
  public dma: Array<{ id: string; name: string }> = [];
  public estimatesAutoComplete: UseAutoCompleteInfiniteScroll<EstimateData> = new UseAutoCompleteInfiniteScroll<EstimateData>();
  public mediaClassIns: MediaClass;
  public mediaTypeIns: MediaType;
  public officesAutoComplete: UseAutoCompleteInfiniteScroll<ClientDropDownValue> = new UseAutoCompleteInfiniteScroll<ClientDropDownValue>();
  public parentClientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient> = new UseAutoCompleteInfiniteScroll<FilteredClient>();
  public parentVendorsAutoComplete: UseAutoCompleteInfiniteScroll<Vendor> = new UseAutoCompleteInfiniteScroll<Vendor>();
  public placeTypes: Array<PlaceType> = [];
  public productsAutoComplete: UseAutoCompleteInfiniteScroll<ClientProduct> = new UseAutoCompleteInfiniteScroll<ClientProduct>();
  public reportCategories: Array<{ name: string; _id: string }> = [];
  public reportTypes: Array<Report> = [];
  public resellerAutoComplete: UseAutoCompleteInfiniteScroll<any> = new UseAutoCompleteInfiniteScroll();
  public vendorsAutoComplete: UseAutoCompleteInfiniteScroll<Vendor> = new UseAutoCompleteInfiniteScroll();
  public unsubscribe$: Subject<void> = new Subject();
  public campaignsAutoComplete: UseAutoCompleteInfiniteScroll<Project> = new UseAutoCompleteInfiniteScroll<Project>();
  public panelParentVendorsContainer:string;

  private customInventoryAllowed = false;
  public selectedOperationsContact: Contact[] = [];
  public selectedVendors: Vendor[] = [];
  public selectedParentVendors: Vendor[] = [];
  public selectedResellers: any[] = [];
  public selectedManagedByers: any[] = [];
  public selectedCampaigns: any[] = [];
  public selectedEstimates: any[] = [];
  public selectedAgency: Agency[] = [];
  public selectedClientParent: ClientDetailsResponse[] = [];
  public siteName: any;

  protected constructor(
    public fb: FormBuilder,
    public vendorService: VendorService,
    public recordService: RecordService,
    public inventoryService: InventoryService,
    public reportService: ReportsAPIService,
    public filtersService: FiltersService,
    public auth: AuthenticationService,
    public cdRef: ChangeDetectorRef,
    public theme: ThemeService
  ) {
    this.setupCustomInventoryAllowedValue();

    this.mediaClassIns = MediaClass.getInstance(
      this.customInventoryAllowed,
      filtersService,
      auth,
      inventoryService,
      this.unsubscribe$,
      cdRef
    );

    this.mediaTypeIns = MediaType.getInstance(
      this.customInventoryAllowed,
      filtersService,
      auth,
      inventoryService,
      this.unsubscribe$,
      cdRef
    );
  }


  // We need to use this method to create form using this.fb.group
  // should have following keys agency, client, estimate, product, office
  public abstract buildForm();

  // dependent for estimates and products, set the value for selectedClient when selected
  // if argument type wrong pls change it
  // public abstract onSelectClientParent($event: ClientDetailsResponse);

  // dependent for estimates and products, set the value for selectedClient when selected
  // if argument type wrong pls change it
  public abstract onSelectClient($event: ClientDetailsResponse);

  // dependent for estimate. when user selected product. we need to iterate the estimates
  // if argument type wrong pls change it
  public abstract onSelectClientProduct($event: ClientProduct);


  public ngOnInit(): void {
    const themeSettings = this.theme.getThemeSettings();
    this.siteName = themeSettings && themeSettings.site;
    this.buildForm();
    // this.setupCustomInventoryAllowedValue();
  }

  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public loadClientTypes() {
    this.recordService
      .getClientTypes()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.clientTypes = res;
      });
  }

  public loadCostTypes() {
    this.reportService
      .getCostTypes()
      .pipe(filter((res) => !!res))
      .subscribe((res: any[]) => {
        this.costTypes = res?.['results'];
      });
  }

  public loadDMA() {
    this.inventoryService
      .getMarketsFromFile()
      .pipe(filter((res) => !!res))
      .subscribe((res) => {
        this.dma = res;
      });
  }

  public loadDivisions() {
    this.recordService
      .getDivisions()
      .pipe(
        filter((res) => !!res),
        map((res) => res.results)
      )
      .subscribe((res) => {
        this.divisions = res;
      });
  }

  public loadCampaign() {
    const campaignSearchCtrl = this.reportGenerateForm?.controls?.campaign
      ?.valueChanges;

    if (campaignSearchCtrl) {

      this.campaignsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        campaignSearchCtrl
      );

      this.campaignsAutoComplete.apiEndpointMethod = () =>
        this.reportService
          .getProjects(
            this.campaignsAutoComplete.searchStr,
            '_id,name',
            this.campaignsAutoComplete.pagination
          )
          .pipe(filter((res) => !!res));

      this.campaignsAutoComplete.loadData(null, (res) => {
        if (res && res?.['message']) {
          this.reportService.showSnackBar(res?.['message']);
        }
        this.campaignsAutoComplete.data = res?.projects ?? [];
        this.updateCampaignsSelectedData();
        this.cdRef.markForCheck();
      });

      this.campaignsAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'campaign',
        null,
        (res) => {
          this.campaignsAutoComplete.data = res?.projects ?? [];
          this.updateCampaignsSelectedData();
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public updateCampaignsSelectedData() {
    this.campaignsAutoComplete?.data?.map((element) => {
      const index = this.selectedCampaigns.findIndex(
        (item) => item._id === element._id
      );
      element.selected = index > -1;
    });
  }

  public loadCategories() {
    this.reportService
      .getCategories()
      .pipe(
        filter((res) => !!res),
      )
      .subscribe((res: any[]) => {
        this.reportCategories = res?.['results'] ?? [];
      });
  }

  public loadMediaClass() {
  }

  public loadMediaTypes() {
  }


  public loadReportTypes() {
    this.reportService
      .getReportTypes()
      .pipe(
        filter((res) => !!res),
      )
      .subscribe((res: any[]) => {
        this.reportTypes = res?.['results'] ?? [];
      });
  }

  public loadPlaceTypes() {
    this.inventoryService.getPlaceTypeList(false)
      .pipe(
        filter(
          (response) =>
            Array.isArray(response?.place_types) &&
            response.place_types.length > 0
        ),
        map((response: PlaceTypesResponse) => {
          return response?.place_types.sort((a: PlaceType, b: PlaceType) => {
            return a?.name?.toLowerCase()?.localeCompare(b?.name);
          });
        }),
      )
      .subscribe((res) => {
        this.placeTypes = res;
      });
  }

  public setUpAgencies() {
    // primary agencies code
    const agenciesSearchCtrl = this.reportGenerateForm?.controls?.agency
      ?.valueChanges;

    if (agenciesSearchCtrl) {

      this.agenciesAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        agenciesSearchCtrl
      );

      this.agenciesAutoComplete.apiEndpointMethod = () =>
        this.recordService
          .getAgencies(
            {
              search: this.agenciesAutoComplete.searchStr
            } as any,
            this.agenciesAutoComplete.pagination
          )
          .pipe(filter((res) => !!res));

      this.agenciesAutoComplete.loadData(null, (res) => {


        res.results.map(element => {
          const index = this.selectedAgency.findIndex(_agency=>_agency._id == element._id);
          // Select the item
          if(index>-1){
            element.selected = true;
          }else{
            element.selected = false;
          }

        });

        this.agenciesAutoComplete.data = res.results;
        this.updateAgenciesSelectedData();
        this.cdRef.markForCheck();
      });

      this.agenciesAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'agency',
        null,
        (res) => {
          this.agenciesAutoComplete.data = res.results;
          this.updateAgenciesSelectedData();
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public updateAgenciesSelectedData() {
    this.agenciesAutoComplete?.data?.map(element => {
      const index = this.selectedAgency.findIndex(
        item => item._id == element._id
      );
      element.selected = index > -1;
    });
  }

  // order based on asc and clientname filter
  public setUpClients() {
    const clientSearchCtrl = this.reportGenerateForm?.controls?.client
      ?.valueChanges;

    if (clientSearchCtrl) {

      this.clientsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        clientSearchCtrl
      );

      this.clientsAutoComplete.apiEndpointMethod = () =>
        this.recordService
          .getClientsByFilters(
            {
              search: this.clientsAutoComplete.searchStr,
              filter: {}
              // filter: {
              //   parentClient: Helper.deepClone(this.selectedClientParent.map(c=>c._id))
              // }
            } as any,
            this.clientsAutoComplete.searchStr,
            'asc',
            'clientName',
            this.clientsAutoComplete.pagination
          )
          .pipe(filter((res) => !!res));

      this.clientsAutoComplete.loadData(null, (res) => {
        this.clientsAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.clientsAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'client',
        null,
        (res) => {
          this.clientsAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public setUpEstimates() {
    const productSearchCtrl = this.reportGenerateForm?.controls?.estimate
      ?.valueChanges;
    if (productSearchCtrl) {
      this.estimatesAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        productSearchCtrl
      );
      this.estimatesAutoComplete.pagination.perPage = 25;

      this.estimatesAutoComplete.apiEndpointMethod = () => {
        return this.recordService
          .getEstmateBySearch(
            this.selectedClient?._id,
            this.estimatesAutoComplete.pagination,
            { active: 'updatedAt', direction: 'desc' }
          )
          .pipe(filter((res) => !!res.results));
      };

      // this.estimatesAutoComplete.loadData(null, null);
    }
  }

  public setUpOffices() {
    const officeSearchCtrl = this.reportGenerateForm?.controls?.office
      ?.valueChanges;
    if (officeSearchCtrl) {
      this.officesAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        officeSearchCtrl
      );
      //this.officesAutoComplete.pagination.perPage = 10;

      this.officesAutoComplete.apiEndpointMethod = () => {
        return this.recordService
          .getOffices(
            this.officesAutoComplete.searchStr,
            this.officesAutoComplete.pagination
          )
          .pipe(
            filter((res) => !!res),
            catchError((error) => {
              return of({ results: [] });
            })
          );
      };

      this.officesAutoComplete.loadData(null, null);
    }
  }

  public setUpProducts() {
    const productSearchCtrl = this.reportGenerateForm?.controls?.product
      ?.valueChanges;
    if (productSearchCtrl) {
      this.productsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        productSearchCtrl
      );
      this.productsAutoComplete.pagination.perPage = 25;

      this.productsAutoComplete.apiEndpointMethod = () => {
        if (!this.selectedClient?._id) {
          return of([]);
        }
        return this.recordService
          .getClientProducts(
            this.selectedClient?._id,
            this.productsAutoComplete.pagination,
            'asc',
            'productName',
            this.productsAutoComplete.searchStr
          )
          .pipe(filter((res: any) => !!res.results));
      };

      this.productsAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'product',
        null,
        (res) => {
          this.productsAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
      // this.productsAutoComplete.loadData(null, null);
    }
  }


  public setUpReseller() {

    const resellerSearchCtrl = this.reportGenerateForm?.controls
      ?.programmaticPartnerReseller?.valueChanges;
    if (resellerSearchCtrl) {
      this.resellerAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        resellerSearchCtrl
      );

      this.resellerAutoComplete.pagination.perPage = 25;

      this.resellerAutoComplete.apiEndpointMethod = () => {
        return this.recordService
          .getOrganizations(
            {
              search: this.resellerAutoComplete.searchStr,
              filter: {
                organizationTypes: [
                  'Vendor', 'Agency'
                ]
              }
            },
            this.resellerAutoComplete.pagination,
            { active: 'name', direction: 'asc' }
          )
          .pipe(
            filter((res) => !!res.results)
          );
      };

      this.resellerAutoComplete.loadData(null, (res) => {
        this.resellerAutoComplete.data = res.results;
          this.updateResellerSelectedData();
        this.cdRef.markForCheck();
      });

      this.resellerAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'programmaticPartnerReseller',
        null,
        (res) => {
          this.resellerAutoComplete.data = res.results;
          this.updateResellerSelectedData();
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public updateResellerSelectedData() {
    this.resellerAutoComplete?.data?.map(element => {
      const index = this.selectedResellers.findIndex(
        item => item._id == element._id
      );
      element.selected = index > -1;
    });
  }

  public setUpParentClients() {
    const clientSearchCtrl = this.reportGenerateForm?.controls?.clientParent
      ?.valueChanges;

    if (clientSearchCtrl) {

      this.parentClientsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        clientSearchCtrl
      );

      this.parentClientsAutoComplete.apiEndpointMethod = () =>
        this.recordService
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
        this.parentClientsAutoComplete.data = res.results;
        this.updateParentClientSelectedData();
        this.cdRef.markForCheck();
      });

      this.parentClientsAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'clientParent',
        null,
        (res) => {
          this.parentClientsAutoComplete.data = res.results;
          this.updateParentClientSelectedData();
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public updateParentClientSelectedData() {
    this.parentClientsAutoComplete?.data?.map(element => {
      const index = this.selectedClientParent.findIndex(
        item => item._id == element._id
      );
      element.selected = index > -1;
    });
  }

  public setUpParentVendors() {
    const parentVendorSearchCtrl = this.reportGenerateForm?.controls?.parentVendor
      ?.valueChanges;

    if (parentVendorSearchCtrl) {

      this.parentVendorsAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        parentVendorSearchCtrl
      );

      this.parentVendorsAutoComplete.apiEndpointMethod = () =>
        this.recordService
          .getVendorsGroupSearch(
            this.parentVendorsAutoComplete.searchStr,
            this.parentVendorsAutoComplete.pagination
          )
          .pipe(
            filter((res) => !!res.results)
          );

      this.parentVendorsAutoComplete.loadData(null, (res) => {
        this.parentVendorsAutoComplete.data = res.results;
        this.updateParentVendorSelectedData();
        this.cdRef.markForCheck();
      });

      this.parentVendorsAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'parentVendor',
        null,
        (res) => {
          this.parentVendorsAutoComplete.data = res.results;
          this.updateParentVendorSelectedData();
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public updateParentVendorSelectedData() {
    this.parentVendorsAutoComplete?.data?.map(element => {
      const index = this.selectedParentVendors.findIndex(
        item => item._id == element._id
      );
      element.selected = index > -1;
    });
  }

  public setUpVendors() {
    const vendorSearchCtrl = this.reportGenerateForm?.controls?.vendor
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
            this.vendorsAutoComplete.pagination
          )
          .pipe(
            filter((res) => !!res.results)
          );
      this.vendorsAutoComplete.loadData(null, (res) => {
        this.vendorsAutoComplete.data = res.results;
        this.updateVendorSelectedData();
        this.cdRef.markForCheck();
      });

      this.vendorsAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'vendor',
        null,
        (res) => {
          this.vendorsAutoComplete.data = res.results;
          this.updateVendorSelectedData();
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public updateVendorSelectedData() {
    this.vendorsAutoComplete?.data?.map(element => {
      const index = this.selectedVendors.findIndex(
        item => item._id == element._id
      );
      element.selected = index > -1;
    });
  }


  public setupCustomInventoryAllowedValue() {
    const explorePermissions = this.auth.getModuleAccess('explore');
    this.customInventoryAllowed =
      explorePermissions?.features?.customInventories?.status === 'active';
  }

}


class MediaClass {
  public data: any[] = [];

  private constructor(
    public customInventoryAllowed: boolean,
    public filtersService: FiltersService,
    public auth: AuthenticationService,
    public inventoryService: InventoryService,
    public unsubscribe$: Subject<any>,
    public cdRef: ChangeDetectorRef
  ) {
    this.setDataSourceForScenarioMarketPlan();
  }

  public static getInstance(
    customInventoryAllowed: boolean,
    filtersService: FiltersService,
    auth: AuthenticationService,
    inventoryService: InventoryService,
    unsubscribe$: Subject<any>,
    cdRef: ChangeDetectorRef
  ) {
    return new MediaClass(
      customInventoryAllowed,
      filtersService,
      auth,
      inventoryService,
      unsubscribe$,
      cdRef
    );
  }

  public setDataSourceForScenarioMarketPlan(): void {
    const response = {};

    const filters = this.normalizeMediaClassFilters(response);

    filters['measures_required'] = false;
    filters['status_type_name_list'] = ['*'];
    if (filters['sort']) {
      delete filters['sort'];
    }
    this.loadDataSource(filters, []);
  }

  private normalizeMediaClassFilters(response) {
    const filters = this.filtersService.normalizeFilterDataNew(response);
    filters.summary_level_list = ['Classification Type'];

    return filters;
  }

  private formatFiltersForCustomInventoryPayload(filter: any): any {
    const filters = Helper.deepClone(filter);
    if (filters['classification_type_list']) {
      delete filters['classification_type_list'];
    }
    delete filters['gp_ids'];
    delete filters['custom_ids'];
    return filters;
  }

  private loadDataSource( filter = {}, selected = []) {
    const filters = this.formatFiltersForCustomInventoryPayload(filter);

    const customInventory: Observable<any> = this.queryFromCustomInventoryESService(
      filters
    );
    forkJoin([
      this.inventoryService.getFilterData(filters).pipe(
        takeUntil(this.unsubscribe$),
        map((data) => data.summaries)
      ),
      customInventory
    ]).subscribe((response) => {
      this.handleAPIsResponse(response, selected);
      this.cdRef.markForCheck();
    });
  }

  private handleAPIsResponse([summaries, elastic], selected) {
    const classifications = AbstractMediaFilterW3.prepareOptionsFromData(
      summaries,
      elastic,
      selected
    );
    const keys = classifications.map((c) => c.id);

    if (!keys.includes('1') && !keys.includes('Roadside')) {
      classifications.push({
        name: 'Roadside',
        count: 0,
        disabled: false,
        selected: false
      });
    }

    if (!keys.includes('4') && !keys.includes('Place Based')) {
      classifications.push({
        name: 'Place Based',
        count: 0,
        disabled: false,
        selected: false
      });
    }

    this.data = classifications;
  }

  private formQueryForCustomInventory(filters): any {
    let query = this.inventoryService.prepareInventoryQuery(filters);
    query = this.inventoryService.addClassificationQuery(query, filters);
    query['size'] = 0;

    return query;
  }

  private formatCustomInventoryData(response): Array<any> {
    const classification = [];

    response['classification']['buckets'].forEach((item) => {
      const classified = {
        key: item['key'],
        count: item['spots']['spot_filter']['spot_count']['value']
      };
      classification.push(classified);
    });

    return classification;
  }

  private queryFromCustomInventoryESService(filters) {
    if (
      this.customInventoryAllowed &&
      this.inventoryService.checkToCallCustomInv(filters)
    ) {
      const query = this.formQueryForCustomInventory(filters);
      return this.inventoryService
        .getFilterDataElastic(false, query)
        .pipe(
          map(this.formatCustomInventoryData),
          debounceTime(200),
          distinctUntilChanged(),
          takeUntil(this.unsubscribe$)
        );
    }

    return of([]);
  }
}

class MediaType {
  public data = [];

  private constructor(
    public customInventoryAllowed: boolean,
    public filtersService: FiltersService,
    public auth: AuthenticationService,
    public inventoryService: InventoryService,
    public unsubscribe$: Subject<any>,
    public cdRef: ChangeDetectorRef,
  ) {
    this.setDataSourceForScenarioMarketPlan();
  }

  public static getInstance(
    customInventoryAllowed: boolean,
    filtersService: FiltersService,
    auth: AuthenticationService,
    inventoryService: InventoryService,
    unsubscribe$: Subject<any>,
    cdRef: ChangeDetectorRef
  ) {
    return new MediaType(
      customInventoryAllowed,
      filtersService,
      auth,
      inventoryService,
      unsubscribe$,
      cdRef
    );
  }

  public setDataSourceForScenarioMarketPlan(): void {
    const response = {};
    const selected = [];

    const filters = this.normalizeMediaTypesFilters(response);
    filters['measures_required'] = false;
    filters['status_type_name_list'] = ['*'];
    if (filters['sort']) {
      delete filters['sort'];
    }
    this.loadDataSource(filters, selected);
  }

  private normalizeMediaTypesFilters(response) {
    const filters = this.filtersService.normalizeFilterDataNew(response);
    filters.summary_level_list = ['Media Type'];

    return filters;
  }

  private loadDataSource(filter = {}, selected = []) {
    const filters = this.formatFiltersForCustomInventoryPayload(filter);

    const customInventory: Observable<any> = this.queryFromCustomInventoryESService(
      filters
    );
    forkJoin([
      this.inventoryService.getFilterData(filters).pipe(
        takeUntil(this.unsubscribe$),
        map((data) => data.summaries)
      ),
      customInventory
    ]).subscribe((response) => {
      this.handleAPIsResponse(response, selected);
      this.cdRef.markForCheck();
    });
  }

  private formQueryForCustomInventory(filters): any {
    let query = this.inventoryService.prepareInventoryQuery(filters);
    query = this.inventoryService.addMediaTypeGroupQuery(query, filters);
    query['size'] = 0;
    return query;
  }

  private formatCustomInventoryData(response): Array<any> {
    const mediaNames = [];
    response['media_types']['buckets'].forEach(item => {
      const mediaName = {
        key: item['key'],
        count: item['spots']['spot_filter']['spot_count']['value']
      };
      mediaNames.push(mediaName);
    });

    return mediaNames;
  }

  private formatFiltersForCustomInventoryPayload(filter: any) {
    const filters = Helper.deepClone(filter);
    if (filters['media_type_list']) {
      delete filters['media_type_list'];
    }
    delete filters['gp_ids'];
    delete filters['custom_ids'];
    return filters;
  }

  private handleAPIsResponse([summaries, elastic], selected) {
    this.data = AbstractMediaFilterW3.prepareOptionsFromData(
      summaries,
      elastic,
      selected
    );
  }

  private queryFromCustomInventoryESService(filters) {
    if (
      this.customInventoryAllowed &&
      this.inventoryService.checkToCallCustomInv(filters)
    ) {
      const query = this.formQueryForCustomInventory(filters);
      return this.inventoryService
        .getFilterDataElastic(false, query)
        .pipe(
          map(this.formatCustomInventoryData),
          debounceTime(200),
          distinctUntilChanged(),
          takeUntil(this.unsubscribe$)
        );
    }

    return of([]);
  }
}
