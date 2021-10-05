import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientProduct } from '@interTypes/records-management';
import { EstimateSearchFilter } from '@interTypes/inventory-management';
import { forbiddenNamesValidator } from '@shared/common-function';

import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { AuthenticationService, InventoryService, ThemeService } from '@shared/services';
import { RecordService } from 'app/records-management-v2/record.service';
import { VendorService } from 'app/records-management-v2/vendors/vendor.service';
import { AbstractReportGenerateComponent } from '../abstract-report-generate.component';
import { ReportsAPIService } from '../services/reports-api.service';
import { FiltersService } from '../../explore/filters/filters.service';
import { Helper } from 'app/classes';
import { Report } from '@interTypes/reports/report-types';
import { Project } from '@interTypes/workspaceV2';
import { GenerateReportFilters } from '@interTypes/reports';
import { Agency } from '@interTypes/records-management/agencies/agencies.response';
import { takeUntil } from 'rxjs/operators';
import {
  PreviewReportResponse
} from '@interTypes/reports/preview-report.response';
import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

import { of } from 'rxjs';
import { ReportItem } from '../models/reports-response.model';
import { CustomValidators } from 'app/validators/custom-validators.validator';

@Component({
  selector: 'app-report-generate-form',
  templateUrl: './report-generate-form.component.html',
  styleUrls: ['./report-generate-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportGenerateFormComponent
  extends AbstractReportGenerateComponent
  implements OnInit {
  public scrollContent: number;
  public categories = [
    {
      name: 'Clients & Media',
      options: ['Detailed Recap', 'Annual Summary', 'Spending by Vendor']
    },
    {
      name: 'Vendors',
      options: ['Vendor Summary', 'Vendor Media Detail', 'Spending by Client']
    },
    {
      name: 'Billing & Invoices',
      options: [
        'Monthly Billing Review',
        '-- with Billing Instructions',
        'Client Net Invoice',
        'Client Gross Invoice',
        'Separate Media Invoice',
        'Separate Fee Invoice',
        'Florida Lottery Invoice'
      ]
    }
  ];
  public selectedCategory = {};
  public enableInvoiceOption = false;
  reportGenerateForm: FormGroup;
  public selectedOffice;
  public officePanelClass = ['imx-select', 'add-option-autocomplete'];
  public panelOfficeContainer: string;
  public panelClientParentContainer: string;
  public panelAgencyContainer: string;
  public panelClientNameContainer: string;
  public panelProductContainer: string;
  public panelEstimateContainer: string;
  public panelVendorContainer: string;
  public panelVendorParentContainer: string;
  public selectProduct: ClientProduct;
  public campaignSelected: any;
  public clientParentSelected: any;
  public agencySelected: any;
  public vendorSelected: any;
  public selectedProgrammaticPartner: any;
  public vendorParentSelected: any;
  public selectedProduct: ClientProduct;
  public selectedClient: ClientDetailsResponse;
  public selectedClientParent: ClientDetailsResponse [] = [];
  public selectedReportTypes: Report[] = [];
  public panelCampaignContainer:string;
  public panelPartnerResellerContainer: string;

  public selectedAgency: Agency[] = [];
  public maxDate = new Date('12/31/9999');

  @Output() onGenerate : EventEmitter<any> = new EventEmitter();
  @Input() set reportData(value: ReportItem) {
    if(value) {
      this.populateFormData(value?.metadata);
    }
  };
    
  constructor(
    public fb: FormBuilder,
    public vendorService: VendorService,
    public recordService: RecordService,
    public inventoryService: InventoryService,
    public reportService: ReportsAPIService,
    public filtersService: FiltersService,
    public auth: AuthenticationService,
    public cdRef: ChangeDetectorRef,
    public theme: ThemeService,
  ) {
    super(
      fb,
      vendorService,
      recordService,
      inventoryService,
      reportService,
      filtersService,
      auth,
      cdRef,
      theme
    );
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.reSize();
    this.loadCategories();
    this.loadCostTypes();
    this.loadReportTypes();
    this.loadDivisions();
    this.loadClientTypes();
    this.setUpOffices();
    this.setUpParentClients();
    this.setUpAgencies();
    this.setUpProducts();
    this.setUpVendors();
    this.setUpParentVendors();
    this.loadPlaceTypes();
    this.loadDMA();
    this.setUpReseller();
    this.loadCampaign();
    this.setUpClients();
    this.listenForDuplicateReport();
    this.clientAndProductChangeListener();
  }

  reSize() {
    if (window.innerHeight < 1100) {
      this.scrollContent = window.innerHeight - (window.innerHeight - 250);
    } else {
      this.scrollContent = null;
    }
  }

  public buildForm() {
    this.reportGenerateForm = this.fb.group({
      categories: ['', [Validators.required]],
      categoryType: ['', [Validators.required]],
      costType: ['', [Validators.required]],
      reportDisplayName: ['', [Validators.required, Validators.maxLength(64)]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
      revisedSince: [],
      enteredSince: [],
      division: [],
      office: [],
      clientType: [],
      contractNumber: [],
      contractName: [],
      campaign: [],
      clientParent: [],
      agency: [],
      clientCode: [],
      client: [null, null, forbiddenNamesValidator],
      productCode: [],
      product: [null, null, forbiddenNamesValidator],
      estimateId: [],
      estimate: [],
      vendor: [],
      parentVendor: [],
      programmaticPartnerReseller: [],
      mediaClass: [],
      placeType: [],
      digitalOnly: [false],
      mediaType: [],
      market: [],
      includeDeleted: [false],
      invoiceDate: [],
      dueDate: [],
      invoice: [null, [CustomValidators.invoiceInputValidator]],
      lineItemID: [],
      invoiceNotes: []
    });

    this.reportGenerateForm?.controls?.categories.valueChanges.subscribe(
      (value) => {
        if (value) {
          const reportType = Helper.deepClone(this.reportTypes);
          this.selectedReportTypes = reportType.filter(
            (category) => category['contractReportCategoryId'] == value?._id
          );
          this.selectedCategory = value;
        } else {
          this.selectedCategory = {};
          this.selectedReportTypes = [];
        }
        this.reportGenerateForm?.get('categoryType')?.setValue('');

        if (this.selectedCategory?.['name']?.toLowerCase() === 'billing & invoices') {
          this.enableInvoiceOption = true;
          this.reportGenerateForm?.get('costType')?.clearValidators();
          this.reportGenerateForm?.get('reportDisplayName')?.clearValidators();
        } else {
          this.enableInvoiceOption = false;
          this.reportGenerateForm?.get('costType')?.setValidators([Validators.required]);
          this.reportGenerateForm?.get('reportDisplayName')?.setValidators([Validators.required]);
        }
        this.reportGenerateForm?.get('costType')?.updateValueAndValidity();
        this.reportGenerateForm?.get('reportDisplayName')?.updateValueAndValidity();
    });

  }

  public partialReset() {
    this.reportGenerateForm.reset();
    this.campaignsAutoComplete.resetAll();
    this.parentClientsAutoComplete.resetAll();
    this.agenciesAutoComplete.resetAll();
    this.vendorsAutoComplete.resetAll();
    this.parentVendorsAutoComplete.resetAll();
    this.resellerAutoComplete.resetAll();
    this.estimatesAutoComplete?.resetAll();
  }
  public populateFormData(formData) {
    this.partialReset();
    const formControl = this.reportGenerateForm.controls;
    formControl['categories'].patchValue(formData?.categoryData);
    formControl['categoryType'].patchValue(formData?.typeData);
    formControl['costType'].patchValue(formData?.costTypeData?._id);
    formControl['reportDisplayName'].patchValue(formData?.displayName);
    formControl['startDate'].patchValue(new Date(formData?.startDate));
    formControl['endDate'].patchValue(new Date(formData?.endDate));

    if (formData?.rawPayload?.parameters?.enteredSince) {
      formControl['enteredSince'].patchValue(new Date(formData?.rawPayload?.parameters?.enteredSince));
    }
    if (formData?.rawPayload?.parameters?.revisedSince) {
      formControl['revisedSince'].patchValue(new Date(formData?.rawPayload?.parameters?.revisedSince));
    }
    if (formData?.rawPayload?.parameters?.division?.length) {
      formControl['division'].patchValue(formData?.rawPayload?.parameters?.division);
    }
    if (formData?.rawPayload?.parameters?.office?.length) {
      formControl['office'].patchValue(formData?.rawPayload?.parameters?.office);
    }
    if (formData?.rawPayload?.parameters?.clientType?.length) {
      formControl['clientType'].patchValue(formData?.rawPayload?.parameters?.clientType);
    }
    if (formData?.rawPayload?.parameters?.mediaClass?.length) {
      formControl['mediaClass'].patchValue(formData?.rawPayload?.parameters?.mediaClass);
    }
    if (formData?.rawPayload?.parameters?.placeType?.length) {
      formControl['placeType'].patchValue(formData?.rawPayload?.parameters?.placeType);
    }
    if (formData?.rawPayload?.parameters?.mediaType?.length) {
      formControl['mediaType'].patchValue(formData?.rawPayload?.parameters?.mediaType);
    }
    if (formData?.rawPayload?.parameters?.dma?.length) {
      formControl['market'].patchValue(formData?.rawPayload?.parameters?.dma);
    }
    if (formData?.rawPayload?.parameters?.digitalOnly) {
      formControl['digitalOnly'].patchValue(formData?.rawPayload?.parameters?.digitalOnly);
    }
    if (formData?.rawPayload?.parameters?.contractNumber) {
      formControl['contractNumber'].patchValue(formData?.rawPayload?.parameters?.contractNumber);
    }
    if (formData?.rawPayload?.parameters?.contractName) {
      formControl['contractName'].patchValue(formData?.rawPayload?.parameters?.contractName);
    }
    if (formData?.rawPayload?.parameters?.clientCode) {
      formControl['clientCode'].patchValue(formData?.rawPayload?.parameters?.clientCode);
    }
    if (formData?.rawPayload?.parameters?.productCode) {
      formControl['productCode'].patchValue(formData?.rawPayload?.parameters?.productCode);
    }
    if (formData?.rawPayload?.parameters?.estimate) {
      formControl['estimateId'].patchValue(formData?.rawPayload?.parameters?.estimate);
    }
    if (formData?.rawPayload?.parameters?.clientData) {
      formControl['client'].patchValue(formData?.rawPayload?.parameters?.clientData);
      this.selectedClient = formData?.rawPayload?.parameters?.clientData
    }
    if (formData?.rawPayload?.parameters?.productData) {
      const productData = formData?.rawPayload?.parameters?.productData;
      formControl['product'].patchValue(productData);
      this.productsAutoComplete.loadData(null, null);
      this.selectedProduct = productData;
      this.selectedEstimates = [];
      this.subscribeOnEstimateChange();
    }
    
    
    if (formData?.rawPayload?.parameters?.campaignData) {
      this.campaignSelected = formData?.rawPayload?.parameters?.campaignData
      this.campaignsAutoComplete.selectedData = this.campaignSelected;
      this.updateCampaignSelection();
    }
    if (formData?.rawPayload?.parameters?.clientParentData) {
      this.clientParentSelected = formData?.rawPayload?.parameters?.clientParentData
      this.parentClientsAutoComplete.selectedData = this.clientParentSelected;
      this.updateClientParentSelection();
    }
    if (formData?.rawPayload?.parameters?.agencyData) {
      this.agencySelected = formData?.rawPayload?.parameters?.agencyData
      this.agenciesAutoComplete.selectedData = this.agencySelected;
      this.updateAgencySelection();
    }
    if (formData?.rawPayload?.parameters?.vendorData) {
      this.vendorSelected = formData?.rawPayload?.parameters?.vendorData
      this.vendorsAutoComplete.selectedData = this.vendorSelected;
      this.updateVendorSelection();
    }
    if (formData?.rawPayload?.parameters?.parentVendorData) {
      this.vendorParentSelected = formData?.rawPayload?.parameters?.parentVendorData
      this.parentVendorsAutoComplete.selectedData = this.vendorParentSelected;
      this.updateVendorParentSelection();
    }
    if (formData?.rawPayload?.parameters?.estimateData) {
      this.selectedEstimates = formData?.rawPayload?.parameters?.estimateData;
      this.estimatesAutoComplete.selectedData = this.selectedEstimates;
      this.estimatesAutoComplete.loadData(null, () => {
        this.updateEstimateSelection();
      });
    }
    if (formData?.rawPayload?.parameters?.programmaticPartnerData) {
      this.selectedProgrammaticPartner = formData?.rawPayload?.parameters?.programmaticPartnerData;
      this.resellerAutoComplete.selectedData = this.selectedProgrammaticPartner;
      this.updateResellerSelection();
    }
    this.cdRef.markForCheck();
  }

  public updateResellerSelection() {
    this.selectedProgrammaticPartner.map((selectedProgrammatic) => {
      this.resellerAutoComplete.data.map((selection) => {
        if(selection._id === selectedProgrammatic._id) {
          selection['selected'] = true;
        }
      })
    });
  }
  public updateEstimateSelection() {
    this.selectedEstimates.map((selectedEstimate) => {
      this.estimatesAutoComplete.data.map((estimate) => {
        if(estimate._id === selectedEstimate._id) {
          estimate['selected'] = true;
        }
      })
    });
  }
  public updateVendorSelection() {
    this.vendorSelected.map((selectedVendor) => {
      this.vendorsAutoComplete.data.map((vendor) => {
        if(vendor._id === selectedVendor._id) {
          vendor['selected'] = true;
        }
      })
    });
  }
  public updateVendorParentSelection() {
    this.vendorParentSelected.map((selectedParentVendor) => {
      this.parentVendorsAutoComplete.data.map((parentVendor) => {
        if(parentVendor._id === selectedParentVendor._id) {
          parentVendor['selected'] = true;
        }
      })
    });
  }
  public updateCampaignSelection() {
    this.campaignSelected.map((selectedCampaign) => {
      this.campaignsAutoComplete.data.map((campaign) => {
        if(campaign._id === selectedCampaign._id) {
          campaign['selected'] = true;
        }
      })
    });
  }
  public updateClientParentSelection() {
    this.clientParentSelected.map((selectedClient) => {
      this.parentClientsAutoComplete.data.map((client) => {
        if(client._id === selectedClient._id) {
          client['selected'] = true;
        }
      })
    });
  }
  public updateAgencySelection() {
    this.agencySelected.map((selectedAgency) => {
      this.agenciesAutoComplete.data.map((agency) => {
        if(agency._id === selectedAgency._id) {
          agency['selected'] = true;
        }
      })
    });
  }

  compareFn(c1: any, c2: any): boolean {
    return c1 && c2 ? c1._id === c2._id : c1 === c2;
}
  public onFormSubmit() {
    if (this.reportGenerateForm.valid) {
      let payload = Helper.deepClone(this.reportGenerateForm.value);

      if (payload.invoice) {
        payload.invoice = payload.invoice?.initial.concat(payload.invoice?.middle, payload.invoice?.end)
      }
      if (payload.categories?._id) {
        payload.category = payload.categories._id;
      }
      if (payload.categoryType?._id) {
        payload.type = payload.categoryType._id;
      }
      if (payload.reportDisplayName) {
        payload.displayName = payload.reportDisplayName;
      }

      if (payload.startDate) {
        const startDate = new Date(payload.startDate);
        payload.startDate = format(startDate, 'MM/dd/yyyy', {
          locale: enUS
        });
      }
      if (payload.endDate) {
        const endDate = new Date(payload.endDate);
        payload.endDate = format(endDate, 'MM/dd/yyyy', {
          locale: enUS
        });
      }
      if (payload.revisedSince) {
        const revisedSince = new Date(payload.revisedSince);
        payload.revisedSince = format(revisedSince, 'MM/dd/yyyy', {
          locale: enUS
        });
      }
      if (payload.enteredSince) {
        const enteredSince = new Date(payload.enteredSince);
        payload.enteredSince = format(enteredSince, 'MM/dd/yyyy', {
          locale: enUS
        });
      }
      if (payload.invoiceDate) {
        const invoiceDate = new Date(payload.invoiceDate);
        payload.invoiceDate = format(invoiceDate, 'MM/dd/yyyy', {
          locale: enUS
        });
      }
      if (payload.dueDate) {
        const dueDate = new Date(payload.dueDate);
        payload.dueDate = format(dueDate, 'MM/dd/yyyy', {
          locale: enUS
        });
      }
      if (payload.contractName) {
        payload.contract = payload.contractName;
      }
      if (payload.contractNumber) {
        payload.contractNumber = +payload.contractNumber;
      }
      if (this.campaignsAutoComplete.selectedData?.length) {
        payload.campaign = this.campaignsAutoComplete.selectedData.map((item) => item?._id);
        payload.campaignData = this.campaignsAutoComplete.selectedData;
      }
      if (this.parentClientsAutoComplete?.selectedData?.length) {
        payload.clientParent = this.parentClientsAutoComplete.selectedData.map(
          (clientParent) => clientParent?._id
        );
        payload.clientParentData = this.parentClientsAutoComplete.selectedData;
      }
      if (this.agenciesAutoComplete?.selectedData?.length) {
        payload.agency = this.agenciesAutoComplete.selectedData.map((item) => item?._id);
        payload.agencyData = this.agenciesAutoComplete.selectedData;
      }
      if (this.vendorsAutoComplete?.selectedData?.length) {
        payload.vendor = this.vendorsAutoComplete.selectedData.map((item) => item?._id);
        payload.vendorData = this.vendorsAutoComplete.selectedData;
      }
      if (this.parentVendorsAutoComplete?.selectedData?.length) {
        payload.parentVendor = this.parentVendorsAutoComplete.selectedData.map(
          (item) => item?._id
        );
        payload.parentVendorData = this.parentVendorsAutoComplete.selectedData;
      }
      if (payload?.estimateId) {
        // payload.estimate = parseInt(payload?.estimateId);
        payload.estimate = payload?.estimateId;
      }
      if (payload?.client?._id) {
        payload.clientData = payload.client;
        payload.client = payload?.client?.clientName;
      }
      if (payload.product?._id) {
        //payload.products = [payload.product?._id];
        payload.productData = payload?.product
        payload.product = payload.product?.productName;
      }
      if (this.estimatesAutoComplete?.selectedData?.length) {
        payload.estimateData = this.estimatesAutoComplete?.selectedData;
        payload.estimateName = this.estimatesAutoComplete.selectedData.map(
          (item) => item?.estimateName
        );
      }
      if (this.resellerAutoComplete?.selectedData?.length) {
        payload.programmaticPartnerData = this.resellerAutoComplete.selectedData;
        payload.programmaticPartner = this.resellerAutoComplete.selectedData.map((item) => item?._id);
      }
     
      // if (payload?.mediaClass?.length) {
      //   payload.mediaClasses = payload?.mediaClass;
      // }
      // if (payload?.placeType?.length) {
      //   payload.placeTypes = payload?.placeType.map((item) => item.toString());
      // }
      // if (payload?.mediaType?.length) {
      //   payload.mediaTypes = payload?.mediaTypes;
      // }
      if (payload.market) {
        payload.dma = payload.market;
      }

      if (payload?.includeDeleted) {
        payload.includeDeletedIos = payload?.includeDeleted;
      }

      if (payload?.lineItemID) {
       // payload.lineItemIds = payload?.lineItemIds.split(';');
        payload.lineItemIds = payload?.lineItemID;
      }

      delete payload.categories;
      delete payload.categoryType;
      delete payload.contract;
      delete payload.market;
      delete payload.lineItemStatus;
      delete payload.estimateId;
      delete payload.includeDeleted;
      delete payload.lineItemID;

      payload = Helper.removeEmptyOrNullRecursive(payload);
      payload = Helper.removeEmptyArrayAndEmptyObject(payload);
      
      const postObject:GenerateReportFilters = {
        category: payload.category ? payload?.category : '',
        type: payload.type ? payload?.type : '',
        parameters: { ...payload }
      }
      delete postObject.parameters['category'];
      delete postObject.parameters['type'];
      
      this.onGenerate.emit(postObject);
    }
  }

  // Reset the form
 public onResetForm(){
    this.reportGenerateForm.reset();

    this.campaignsAutoComplete.resetAll();
    this.parentClientsAutoComplete.resetAll();
    this.agenciesAutoComplete.resetAll();
    this.vendorsAutoComplete.resetAll();
    this.parentVendorsAutoComplete.resetAll();
    this.resellerAutoComplete.resetAll();
    this.productsAutoComplete?.resetAll();
    this.estimatesAutoComplete?.resetAll();
    this.productsAutoComplete.data = [];
    this.estimatesAutoComplete.data = [];

    this.clientsAutoComplete.searchStr = '';
    this.panelClientNameContainer = '';
    
    this.campaignsAutoComplete.loadData(null, null);
    this.parentClientsAutoComplete.loadData(null, null);
    this.agenciesAutoComplete.loadData(null, null);
    this.vendorsAutoComplete.loadData(null, null);
    this.parentVendorsAutoComplete.loadData(null, null);
    this.resellerAutoComplete.loadData(null, null);
    this.clientsAutoComplete.loadData(null, null);
  }

  public updateClientParentContainer() {
    this.panelClientParentContainer = '.clientParent-list-autocomplete';
  }

  public clientParentDisplayWithFn(clientParent) {
    return clientParent?.clientName ?? '';
  }

  public clientParentTrackByFn(idx: number, clientParent) {
    return clientParent?._id ?? idx;
  }

  // Programmatic Partner/Reseller

  public updatePartnerResellerContainer() {
    this.panelPartnerResellerContainer = '.partnerReseller-list-autocomplete';
  }

  public PartnerResellerDisplayWithFn(pReseller) {
    return pReseller?.name ?? '';
  }

  public PartnerResellerTrackByFn(idx: number, pReseller) {
    return pReseller?._id ?? idx;
  }

  public onSelectPartnerReseller(event) {}


  public updateAgencyContainer() {
    this.panelAgencyContainer = '.agency-list-autocomplete';
  }

  public agencyDisplayWithFn(agency) {
    return agency?.name ?? '';
  }

  public agencyTrackByFn(idx: number, agency) {
    return agency?._id ?? idx;
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

  public onSelectClient(event) {
    this.selectedClient = event.option.value;
  }

  /** product */

  public updateProductContainer() {
    this.panelProductContainer = '.product-list-autocomplete';
  }

  public productDisplayWithFn(product) {
    return product?.productName ?? '';
  }

  public productTrackByFn(idx: number, product) {
    return product?._id ?? idx;
  }

  public onSelectClientProduct(event) {
    this.reportGenerateForm.controls['product'].setValue(event.option.value);
    this.selectedProduct = event.option.value;
    this.selectedEstimates = [];
    this.subscribeOnEstimateChange();
    this.estimatesAutoComplete.loadData(null, null);
  }

  /** Estimate */

  public updateEstimateContainer() {
    this.panelEstimateContainer = '.estimate-list-autocomplete';
  }

  public estimateDisplayWithFn(estimate) {
    return estimate?.estimateName ?? '';
  }

  public estimateTrackByFn(idx: number, estimate) {
    return estimate?._id ?? idx;
  }

  public onSelectEstimateProduct(event) {
    console.log('event', event);
  }

  /** Vendor */

  public updateVendorContainer() {
    this.panelVendorContainer = '.vendor-list-autocomplete';
  }

  public vendorDisplayWithFn(vendor) {
    return vendor?.name ?? '';
  }

  public vendorTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  public onSelectVendorProduct(event) {
    console.log('event', event);
  }

  /* vendor parent */

  public updateVendorParentContainer() {
    this.panelVendorParentContainer = '.vendorparent-list-autocomplete';
  }

  public vendorParentDisplayWithFn(vendor) {
    return vendor?.name ?? '';
  }

  public vendorParentTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  public onSelectVendorParentProduct(event) {
    console.log('event', event);
  }

  // Media
  public mediaByFn(idx: number, media) {
    return media?.name ?? idx;
  }

  public placeTypeTrackByFn(idx: number, place) {
    return place?._id ?? idx;
  }

  public dmaTrackByFn(idx: number, dma) {
    return dma?._id ?? idx;
  }

  public costTypeTrackByFn(idx: number, costType) {
    return costType?._id ?? idx;
  }

  // Campaign autocomplete

  public updateCampaignContainer (){
    this.panelCampaignContainer = '.campaign-list-autocomplete';
  }

  public campaignWithFn(project:Project) {
    return project?.name ?? '';
  }

  public onSelectCampaign(event) {
    console.log('onSelectCampaign', event);
  }
  
  public CampaignTrackByFn(idx: number, project) {
    return project?._id ?? idx;
  }

  public selectOfficeData(event, contact: any) {
    if (!event.isUserInput) { return; }
    this.selectedOffice = contact;
    console.log('this.selectedOffice', this.selectedOffice);
    this.cdRef.markForCheck();
  }

  public get isClientSelected() {
    const companyInput = this.reportGenerateForm?.get('client');
    return this.selectedClient && companyInput?.value?._id;
  }

  public get isProductSelected() {
    const companyInput = this.reportGenerateForm?.get('product');
    return companyInput?.value?._id;
  }
  
  public get minDateForEndDate() {
    let minDate: any = '';
    if (this.reportGenerateForm.controls?.startDate?.value) {
      minDate = new Date(this.reportGenerateForm.controls?.startDate?.value);
      minDate.setDate(minDate.getDate());
    }

    return minDate;
  }

  private listenForDuplicateReport() {
    this.reportService.duplicateTrigger$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((reportData) => {
        this.updateForm(reportData);
        this.resetSelectValues();
        this.cdRef.markForCheck();
      });
  }

  private updateForm(reportData: PreviewReportResponse) {
    const parameters = reportData.parameters;

    this.reportGenerateForm.patchValue({
      categories: reportData.category,
      categoryType: reportData.type,
      costType: parameters.costType,
      reportDisplayName: parameters.displayName,
      startDate: parameters.startDate,
      endDate: parameters.endDate,
      revisedSince: parameters.revisedSince,
      enteredSince: parameters.enteredSince,
      division: parameters.division,
      office: parameters.office,
      clientType: parameters.clientType,
      contractNumber: null, // todo check with real data
      contractName: parameters.contract.contractName, // todo check with real data
      campaign: parameters.campaign,
      clientParent: parameters.clientParent,
      agency: parameters.agency,
      clientCode: null, // todo check with real data
      client: parameters.client,
      productCode: null, // todo check with real data
      product: parameters.product,
      estimateId: null, // todo check with real data
      estimate: parameters.estimate,
      vendor: parameters.vendor,
      parentVendor: parameters.parentVendor,
      programmaticPartnerReseller: parameters.programmaticPartner,
      mediaClass: parameters.mediaClass,
      placeType: parameters.placeType,
      digitalOnly: parameters.digitalOnly,
      mediaType: parameters.mediaType,
      market: null, // todo check with real data
      includeDeleted: parameters.includeDeletedIos,
      invoiceDate: parameters.invoiceDate,
      dueDate: parameters.dueDate,
      invoice: parameters.invoice,
      lineItemID: parameters.lineItemIds,
      invoiceNotes: parameters.invoiceNotes
    });
  }

  private resetSelectValues() {
    this.selectedCategory = {};
    this.enableInvoiceOption = false;
    this.selectedOffice = undefined;
    this.selectProduct = undefined;

    this.selectedProduct = undefined;
    this.selectedClient = undefined;
    this.selectedClientParent = undefined;
    this.selectedReportTypes = [];
  }

  private subscribeOnEstimateChange() {
    const estimateSearchCtrl = this.reportGenerateForm?.controls?.estimate?.valueChanges;
    if (estimateSearchCtrl) {
      this.estimatesAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        estimateSearchCtrl
      );

      this.estimatesAutoComplete.apiEndpointMethod = () => {
        if (this.selectedProduct && this.selectedProduct?._id) {
          return this.recordService.getEstmate(
            this.formateSearchPayload(),
            this.selectedClient?._id,
            this.estimatesAutoComplete?.pagination,
            null,
            this.siteName,
            true
          );
        } else {
          return of([]);
        }
      }

      this.estimatesAutoComplete.listenForAutoCompleteSearch(
        this.reportGenerateForm,
        'estimate',
        null,
        (res) => {
          this.estimatesAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  private formateSearchPayload(){
    const estimateSearchText = this.reportGenerateForm?.controls?.estimate?.value;
    let searchPayload: EstimateSearchFilter = {
      search: '',
      filters: {}
    };
    if (this.selectedProduct) {
      searchPayload.filters = {
        productIds: [
          this.selectedProduct._id
        ]
      }
    }
    if(estimateSearchText && estimateSearchText?.toString().trim().length){
      searchPayload.search = estimateSearchText;
    }else{
      delete searchPayload.search;
    }
    return searchPayload;
  }

  private clientAndProductChangeListener(): void{
    this.reportGenerateForm.controls.client.valueChanges
      .pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((data) => {
        this.selectedEstimates = [];
        if (!data?._id) {
          this.selectedClient = null;
          this.productsAutoComplete.data = [];
        }
        this.selectedProduct = null;
        this.reportGenerateForm.controls.estimate.patchValue('');
        this.reportGenerateForm.controls.product.patchValue('');
      });

    this.reportGenerateForm.controls.product.valueChanges
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe((_) => {
        this.selectedEstimates = [];
        this.selectedProduct = null;
        this.reportGenerateForm.controls.estimate.patchValue('');
      });
  }
}
