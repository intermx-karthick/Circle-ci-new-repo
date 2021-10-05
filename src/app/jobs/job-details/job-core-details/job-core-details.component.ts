import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  ViewChild,
  Output,
  EventEmitter, OnDestroy
} from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

import { ConvertPipe } from '@shared/pipes/convert.pipe';
import { AuthenticationService, SnackbarService } from '@shared/services';
import { forbiddenNamesValidator } from '@shared/common-function';
import { UseAutoCompleteInfiniteScroll } from '../../../classes/use-auto-complete-infinite-scroll';
import { Helper } from '../../../classes';
import { TabLinkHandler, TabLinkType } from '@shared/services/tab-link-handler';

import { RecordService } from 'app/records-management-v2/record.service';
import { ContractsSearchService } from 'app/contracts-management/services/contracts-search.service';
import { JobDetailsService } from 'app/jobs/services/job-details.service';


import {
  JobDetailsUpdatePayload,
  JobDetailsDropDownResponse,
  JobDetails,
} from "../../interfaces";
import { FilteredClient } from '@interTypes/records-management';

import * as numeral from 'numeral';
import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

import { EMPTY, Subject } from 'rxjs';
import { filter, mergeMap, takeUntil, map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { JobsService } from 'app/jobs/jobs.service';
import { JobLineItemDialogComponent } from './job-line-item-dialog/job-line-item-dialog.component';
import { CkEditorConfig } from '@constants/ckeditor-config';
import { UserRole } from '@interTypes/user-permission';
import { PdfPreviewerService } from '@shared/components/imx-pdf-previewer/pdf-previewer.service';

@Component({
  selector: 'app-job-core-details',
  templateUrl: './job-core-details.component.html',
  styleUrls: ['./job-core-details.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobCoreDetailsComponent implements OnInit, OnDestroy {

  @ViewChild('clientNameInputRef', { read: MatAutocompleteTrigger })
  public clientAutoCompleteTrigger: MatAutocompleteTrigger;

  @ViewChild('primaryAgencyInputRef', { read: MatAutocompleteTrigger })
  public primaryAgencyAutoCompleteTrigger: MatAutocompleteTrigger;

  @ViewChild('creativeAgencyInputRef', { read: MatAutocompleteTrigger })
  public creativeAgencyAutoCompleteTrigger: MatAutocompleteTrigger;

  @ViewChild('producerInputRef', { read: MatAutocompleteTrigger })
  public producerAutoCompleteTrigger: MatAutocompleteTrigger;

  @ViewChild('billingCompanyInputRef', { read: MatAutocompleteTrigger })
  public billingCompanyAutoCompleteTrigger: MatAutocompleteTrigger;

  @Output() detailsFormValues: EventEmitter<any> = new EventEmitter<any>();
  @Output() lineItemUpdate: EventEmitter<any> = new EventEmitter<any>();
  @Output() openPrintPreview: EventEmitter<any> = new EventEmitter<any>();
  @Input() containerScrolling$ = new Subject();

  @Input() set jobDetailsValue(value: any) {
    if (!value?._id) return;
    this.jobDetails = Helper.deepClone(value);
    this.jobDetailFormPatch(this.jobDetails);
    if(this.jobDetails?.jobNote?.length > 0) {
      this.showJobNoteEditorFunc();
    }
    if(this.jobDetails?.billingNote?.length > 0) {
      this.showBillingNoteEditorFunc();
    }
    this.openLineItemDialogBoxFromRouting();
    // this.onAddLineItemsDialog();
    this.cdRef.detectChanges();
  };

  @Input() formSave: Subject<any>;

  private unSub$: Subject<void> = new Subject<void>();
  public disableOption = false;
  public showEditor = false;
  public showBillingEditor = false;
  public jobDetailsForm: FormGroup;
  public jobDetails: JobDetails = {} as JobDetails;
  public refreshTable = false;
  public clientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient> = new UseAutoCompleteInfiniteScroll<FilteredClient>();
  public producersAutoComplete: UseAutoCompleteInfiniteScroll<any> = new UseAutoCompleteInfiniteScroll<any>();
  public primaryAgenciesAutoComplete: UseAutoCompleteInfiniteScroll<any> = new UseAutoCompleteInfiniteScroll<any>();
  public creativeAgenciesAutoComplete: UseAutoCompleteInfiniteScroll<any> = new UseAutoCompleteInfiniteScroll<any>();
  public billingCompanyAutoComplete: UseAutoCompleteInfiniteScroll<any> = new UseAutoCompleteInfiniteScroll<any>();
  public billingContactAutoComplete: UseAutoCompleteInfiniteScroll<any> = new UseAutoCompleteInfiniteScroll<any>();

  public campaignsList: Array<any> = [];
  public clientContactsList: Array<any> = [];
  public oohMediaContactsList: Array<any> = [];
  public isLoadingContact = false;
  public checkpointsList: Array<any> = [];
  public statusesList: Array<any> = [];
  public displayCostOptionsList: Array<any> = [];

  public panelClientNameContainer: string;
  public panelPrimaryAgencyContainer: string;
  public panelCreativeAgencyContainer: string;
  public panelProducerContainer: string;
  public panelBillingCompanyContainer: string;
  public panelBillingContactContainer: string;

  public selectedCampaign: any = {};
  public selectedClientContact: any = {};
  public selectedMediaContact: any = {};
  public selectedBillingContact: any = {};

  public TabLinkType = TabLinkType;
  public authAmtRegEx = /^[0-9]{1,7}(\.[0-9]{0,2})?$/;
  public maxDate = new Date('12/31/9999');
  public editorConfig: any = CkEditorConfig;
  public disableEdit = false;
  public jobNotesEditorConfig = {
    ...CkEditorConfig,
    width: '230px'
  };
  public isRouterPreviewActionCalled = false;

  constructor(
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    private recordService: RecordService,
    private contractsSearchService: ContractsSearchService,
    private jobDetailsService: JobDetailsService,
    private cdRef: ChangeDetectorRef,
    public tabLinkHandler: TabLinkHandler,
    public convert: ConvertPipe,
    public dialog: MatDialog,
    private auth: AuthenticationService,
    public jobService: JobsService,
    private activateRoute: ActivatedRoute,
    public pdfPreviewerService: PdfPreviewerService
  ) {

  }

  ngOnInit(): void {
    this.initForm();
    this.controlSetups();
    this.formSubmitListenerAndValueEmitter();
    this.containerScrolling$.pipe(takeUntil(this.unSub$)).subscribe(() => {
      this.clientAutoCompleteTrigger.closePanel();
      this.primaryAgencyAutoCompleteTrigger.closePanel();
      this.creativeAgencyAutoCompleteTrigger.closePanel();
      this.producerAutoCompleteTrigger.closePanel();
      this.billingCompanyAutoCompleteTrigger.closePanel();
    });
    this.checkForEditPermission();
  }

  private checkForEditPermission() {
    const permissions = this.auth.getUserPermission(UserRole.PRINT_PRODUCTION);
    if (permissions && !permissions.edit) {
      this.jobDetailsForm.disable();
      this.jobNotesEditorConfig.readOnly = true;
      this.editorConfig.readOnly = true;
      this.disableEdit = true;
    }
  }

  public controlSetups() {
    this.getAllCheckpoints();
    this.getAllStatuses();
    this.getAllDisplayCostOption();

    this.getAllCampaigns();
    this.getAllUsers();
  }

  /**
   * @description
   * method to initialize form controls
   */
  public initForm() {
    this.jobDetailsForm = this.fb.group({
      jobName: [null, [Validators.required, Validators.maxLength(64)]],
      startDate: [null, Validators.required],
      campaign: [null],
      client: [null, Validators.required, forbiddenNamesValidator],
      producer: [null, Validators.required, forbiddenNamesValidator],
      clientContact: [null],
      oohMediaContact: [null],
      primaryAgency: [null, null, forbiddenNamesValidator],
      creativeAgency: [null, null, forbiddenNamesValidator],
      poNumber: ['', Validators.maxLength(64)],
      totalAuthorizedAmount: this.formatAuthorizationAmount(
        this.jobDetails?.totalAuthorizedAmount
      ),
      jobCheckPoints: this.fb.array([]),
      jobRecordStatus: [''],
      jobNote: [null, Validators.maxLength(2000)],
      billingCompany: [null, null, forbiddenNamesValidator],
      billingContact: [null],
      accountingJobNo: [null],
      invoiceNo: [null],
      invoiceDate: [null],
      invoiceDueDate: [null],
      billingNotes: [null, Validators.maxLength(2000)],
      displayCostOption: [''],
    });
  }

  public jobDetailFormPatch(value) {
    this.jobDetailsForm.patchValue({
      jobName: value?.name,
      startDate: value?.startDate,
      campaign: value?.project?._id,
      client: value?.client,
      producer: value?.producer,
      clientContact: value?.clientContact?._id,
      oohMediaContact: value?.oohMediaContact,
      primaryAgency: value?.agency,
      creativeAgency: value?.creativeAgency,
      poNumber: value?.poNumber,
      totalAuthorizedAmount: this.formatAuthorizationAmount(value?.totalAuthorizedAmount),
      jobRecordStatus: value?.status?._id,
      jobNote: value?.jobNote,
      billingCompany: value?.billingCompany,
      billingContact: value?.billingContact?._id,
      accountingJobNo: value?.acctgJobId,
      invoiceNo: value?.invoiceId,
      invoiceDate: value?.invoiceDate,
      invoiceDueDate: value?.dueDate,
      billingNotes: value?.billingNote,
      displayCostOption: value?.displayCostOption?._id,
    });

    /** patch checkpoints formcontrol value */
    const checkArray: FormArray = this.jobDetailsForm?.get('jobCheckPoints') as FormArray;
    value?.checkPoints.forEach((each) => {
      checkArray.push(new FormControl(each?._id));
    });
    value?.client?.organizationId ? this.getAllClientContacts(value?.client?.organizationId) : '';

    /* dropdown initially should load all values instead of selected value -- ref: IMXUIPRD-4022 */
    //this.clientsAutoComplete.searchStr = value?.client?.clientName ?? '';``
    //this.producersAutoComplete.searchStr = value?.producer?.name ?? '';
    //this.primaryAgenciesAutoComplete.searchStr = value?.agency?.name ?? '';
    //this.creativeAgenciesAutoComplete.searchStr = value?.creativeAgency?.name ?? '';
    //this.billingCompanyAutoComplete.searchStr = value?.billingCompany?.name ?? '';

    this.selectedCampaign = value?.project;
    this.selectedClientContact = value?.clientContact;
    this.selectedMediaContact = value?.oohMediaContact;
    this.selectedBillingContact = value?.billingContact;

    this.setUpClients();
    this.setUpProducers();
    this.setUpPrimaryAgency();
    this.setUpCreativeAgency();
    this.setUpBillingCompany();
    this.setUpBillingContact();

    this.cdRef.markForCheck();
  }

  /** get checked status for checkpoints */
  public getCheckBoxStatus(value) {
    const checkArray: FormArray = this.jobDetailsForm?.get('jobCheckPoints') as FormArray;
    return checkArray.controls.some(each => each?.value === value?._id);
  }

  /**
   * method to handle checkbox event and update formcontrol value
   */
  public onCheckboxChange(event: MatCheckboxChange, ID: string) {
    const checkArray: FormArray = this.jobDetailsForm?.get('jobCheckPoints') as FormArray;

    if (event?.checked) {
      checkArray.push(new FormControl(ID));
    } else {
      let i: number = 0;
      checkArray.controls.forEach((item: FormControl) => {
        if (item.value == ID) {
          checkArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  /** camapaign list track by method */
  public campaignTrackByFn(idx: number, campaign) {
    return campaign?._id ?? idx;
  }

  /** event call back of when campaign selected in Auto Complete */
  public onChangeCampaignSelected(event, value) {
    if (!event.isUserInput) { return; }
    this.selectedCampaign = value;
  }

  /** client contact list track by method */
  public clientContactTrackByFn(idx: number, contact) {
    return contact?._id ?? idx;
  }

  onHover() {
    this.disableOption = true;
  }

  onHoverOut() {
    this.disableOption = false;
  }

  refreshContact() {
    this.getAllClientContacts(this.jobDetailsForm?.value?.client?.organizationId)
  }
  /** event call back of when client contact selected in Auto Complete */
  public onChangeClientContactSelected(event, value) {
    if (!event.isUserInput) { return; }
    this.selectedClientContact = value;
  }

  /** media contact list track by method */
  public mediaContactTrackByFn(idx: number, contact) {
    return contact?._id ?? idx;
  }

  /** event call back of when media contact selected in Auto Complete */
  public onChangeMediaContactSelected(event, value) {
    if (!event.isUserInput) { return; }
    this.selectedMediaContact = value;
  }

  /** event call back of when client selected in Auto Complete */
  public onChangeClientSelected(client) {
    this.jobDetailsForm.controls.clientContact.setValue('');
    this.clientContactsList = [];
    client?.organizationId ? this.getAllClientContacts(client?.organizationId) : '';
  }

  /** client name display name method */
  public clientNameDisplayWithFn(client) {
    return client?.clientName ?? '';
  }

  /** client name track by method */
  public clientNameTrackByFn(idx: number, client) {
    return client?._id ?? idx;
  }

  /** client name auto-complete container value update method */
  public updateClientNameContainer() {
    this.panelClientNameContainer = '.clientName-list-autocomplete';
  }

  /** event call back of when primary agency selected in Auto Complete */
  public onChangePrimaryAgencySelected(value) {
  }

  /** primary agency display name method */
  public primaryAgencyDisplayWithFn(agency) {
    return agency?.name ?? '';
  }

  /** primary agency track by method */
  public primaryAgencyTrackByFn(idx: number, agency) {
    return agency?._id ?? idx;
  }

  /** primary agency auto-complete container value update method */
  public updatePrimaryAgencyContainer() {
    this.panelPrimaryAgencyContainer = '.primaryAgency-list-autocomplete';
  }

  /** event call back of when creative agency selected in Auto Complete */
  public onChangeCreativeAgencySelected(value) {
  }

  /** creative agency display name method */
  public creativeAgencyDisplayWithFn(agency) {
    return agency?.name ?? '';
  }

  /** creative agency track by method */
  public creativeAgencyTrackByFn(idx: number, agency) {
    return agency?._id ?? idx;
  }

  /** creative agency auto-complete container value update method */
  public updateCreativeAgencyContainer() {
    this.panelCreativeAgencyContainer = '.creativeAgency-list-autocomplete';
  }

  /** event call back of when producer selected in Auto Complete */
  public onChangeProducerSelected(value) {
  }

  /** producer display name method */
  public producerDisplayWithFn(producer) {
    return producer?.name ?? '';
  }

  /** producer track by method */
  public producerTrackByFn(idx: number, producer) {
    return producer?._id ?? idx;
  }

  /** producer auto-complete container value update method */
  public updateProducerContainer() {
    this.panelProducerContainer = '.producer-list-autocomplete';
  }

  /** event call back of when billing company selected in Auto Complete */
  public onChangeBillingCompanySelected(value) {
    this.billingContactAutoComplete.loadData(null, null);
  }

  /** billing company display name method */
  public billingCompanyDisplayWithFn(billingCompany) {
    return billingCompany?.name ?? '';
  }

  /** billing company track by method */
  public billingCompanyTrackByFn(idx: number, billingCompany) {
    return billingCompany?._id ?? idx;
  }

  /** billing company auto-complete container value update method */
  public updateBillingCompanyContainer() {
    this.panelBillingCompanyContainer = '.billingCompany-list-autocomplete';
  }

  /** event call back of when billing contact selected in Auto Complete */
  public onChangeBillingContactSelected(event, value) {
    if (!event.isUserInput) { return; }
    this.selectedBillingContact = value;
  }

  /** billing contact track by method */
  public billingContactTrackByFn(idx: number, billingContact) {
    return billingContact?._id ?? idx;
  }

  /** billing contact auto-complete container value update method */
  public updateBillingContactContainer() {
    this.panelBillingContactContainer = '.billingContact-list-autocomplete';
  }

  /** checkpoints track by method */
  public checkpointsTrackByFn(idx: number, value) {
    return value?._id ?? idx;
  }

  /** method used to format Numeric value in form control */
  public formatNumericValue(formCtrl: string) {
    const formObj = {};
    formObj[formCtrl] = numeral(
      this.jobDetailsForm.controls[formCtrl].value
    ).value();
    this.jobDetailsForm.patchValue(formObj);
  }

  /** method used to format value when reactive form patch */
  private formatAuthorizationAmount(value): string {
    let numberValue = null;
    if (value && numeral(value)) {
      numberValue = numeral(value).format('0,0.00');
    }
    return numberValue;
  }

  /** Method to call job checkpoints list API */
  private getAllCheckpoints() {
    this.jobDetailsService.getCheckpointsList()
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: JobDetailsDropDownResponse) => {
        this.checkpointsList = (res && res?.results) ? res.results : [];
      });
  }

  /** Method to call job record statues list API */
  private getAllStatuses() {
    this.jobDetailsService.getStatusesList()
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: JobDetailsDropDownResponse) => {
        this.statusesList = (res && res?.results) ? res.results : [];
      });
  }

  /** Method to call display cost options list API */
  private getAllDisplayCostOption() {
    this.jobDetailsService.getDisplayCostOptionsList()
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: JobDetailsDropDownResponse) => {
        this.displayCostOptionsList = (res && res?.results) ? res.results : [];
      });
  }

  /** Method to call campaign list API */
  private getAllCampaigns() {
    this.contractsSearchService.getAllCampaigns({})
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: any) => {
        this.campaignsList = (res && res?.projects) ? res.projects : [];
      });
  }

  /** Method to call media contact list API */
  private getAllUsers() {
    this.contractsSearchService.getAllUsers()
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: any) => {
        this.oohMediaContactsList = (res && res?.result) ? res.result : [];
      });
  }

  /** Method to call selected client contacts list API */
  private getAllClientContacts(organizationId: string) {
    this.isLoadingContact = true;
    this.clientContactsList = [];
    this.contractsSearchService.getAllClientContacts(organizationId, true)
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: any) => {
        this.isLoadingContact = false;
        this.clientContactsList = (res && res?.results) ? res.results : [];
        this.clientContactsList.sort((a, b) => {
          let fa = a?.firstName?.toLowerCase() + '' + a?.lastName?.toLowerCase(),
            fb = b?.firstName?.toLowerCase() + '' + b?.lastName?.toLowerCase();
          if (fa < fb) {
            return -1;
          }
          if (fa > fb) {
            return 1;
          }
          return 0;
        });
        this.cdRef.markForCheck();
      });
  }

  /**
   * @description
   * methos to set up client auto complete
   */
  private setUpClients() {
    const clientSearchCtrl = this.jobDetailsForm?.controls?.client?.valueChanges;

    if (clientSearchCtrl) {
      this.clientsAutoComplete.loadDependency(
        this.cdRef,
        this.unSub$,
        clientSearchCtrl
      );

      this.clientsAutoComplete.apiEndpointMethod = () =>
        this.recordService
          .getClientsByFilters(
            {
              search: this.clientsAutoComplete.searchStr,
              filter: {}
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
        this.jobDetailsForm,
        'client',
        null,
        null
      );
    }
  }

  /**
   * @description
   * methos to set up producer auto complete
   */
  private setUpProducers() {
    const producerSearchCtrl = this.jobDetailsForm?.controls?.producer?.valueChanges;

    if (producerSearchCtrl) {
      this.producersAutoComplete.loadDependency(
        this.cdRef,
        this.unSub$,
        producerSearchCtrl
      );

      this.producersAutoComplete.apiEndpointMethod = () =>
        this.jobDetailsService
          .getProducersList(
            {
              search: this.producersAutoComplete.searchStr,
              filter: {}
            } as any,
            {
              active: 'name',
              direction: 'asc'
            },
            this.producersAutoComplete.pagination
          )
          .pipe(filter((res) => !!res));

      this.producersAutoComplete.loadData(null, (res) => {
        this.producersAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.producersAutoComplete.listenForAutoCompleteSearch(
        this.jobDetailsForm,
        'producer',
        null,
        null
      );
    }
  }

  /**
   * @description
   * methos to set up primary agency auto complete
   */
  private setUpPrimaryAgency() {
    const primaryAgenciesSearchCtrl = this.jobDetailsForm?.controls?.primaryAgency?.valueChanges;

    if (primaryAgenciesSearchCtrl) {
      this.primaryAgenciesAutoComplete.loadDependency(
        this.cdRef,
        this.unSub$,
        primaryAgenciesSearchCtrl
      );
      this.primaryAgenciesAutoComplete.apiEndpointMethod = () =>
        this.recordService.getAgencyTypes().pipe(
          filter((res) => !!res),
          map((res) =>
            res.results.find((type) => type.name === 'Media Agency')
          ),
          filter((type) => !!type),
          mergeMap((type: any) => {
            return this.recordService.getAgencies(
              {
                search: this.primaryAgenciesAutoComplete.searchStr,
                filter: { types: [type._id] }
              },
              this.primaryAgenciesAutoComplete.pagination
            );
          }),
          filter((res) => !!res)
        );
      this.primaryAgenciesAutoComplete.loadData(null, (res) => {
        this.primaryAgenciesAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.primaryAgenciesAutoComplete.listenForAutoCompleteSearch(
        this.jobDetailsForm,
        'primaryAgency',
        null,
        (res) => {
          this.primaryAgenciesAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  /**
   * @description
   * methos to set up creative agency auto complete
   */
  private setUpCreativeAgency() {
    const creativeAgenciesSearchCtrl = this.jobDetailsForm?.controls?.creativeAgency?.valueChanges;

    if (creativeAgenciesSearchCtrl) {
      this.creativeAgenciesAutoComplete.loadDependency(
        this.cdRef,
        this.unSub$,
        creativeAgenciesSearchCtrl
      );
      this.creativeAgenciesAutoComplete.apiEndpointMethod = () =>
        this.recordService.getAgencyTypes().pipe(
          filter((res) => !!res),
          map((res) =>
            res.results.find((type) => type.name === 'Creative Agency')
          ),
          filter((type) => !!type),
          mergeMap((type: any) => {
            return this.recordService.getAgencies(
              {
                search: this.creativeAgenciesAutoComplete.searchStr,
                filter: { types: [type._id] }
              },
              this.creativeAgenciesAutoComplete.pagination
            );
          }),
          filter((res) => !!res)
        );
      this.creativeAgenciesAutoComplete.loadData(null, (res) => {
        this.creativeAgenciesAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.creativeAgenciesAutoComplete.listenForAutoCompleteSearch(
        this.jobDetailsForm,
        'creativeAgency',
        null,
        (res) => {
          this.creativeAgenciesAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  /**
  * @description
  * methos to set up billing company auto complete
  */
  private setUpBillingCompany() {
    const billingCompanySearchCtrl = this.jobDetailsForm?.controls?.billingCompany?.valueChanges;

    if (billingCompanySearchCtrl) {
      this.billingCompanyAutoComplete.loadDependency(
        this.cdRef,
        this.unSub$,
        billingCompanySearchCtrl
      );
      this.billingCompanyAutoComplete.apiEndpointMethod = () =>
        this.recordService
          .getOrganizations(
            {
              search: this.billingCompanyAutoComplete.searchStr,
              filter: {
                organizationTypes: [
                  'Client', 'Agency'
                ]
              }
            },
            this.billingCompanyAutoComplete.pagination,
            { active: 'name', direction: 'asc' })
          .pipe(
            filter((res) => !!res.results)
          );
      this.billingCompanyAutoComplete.loadData(null, (res) => {
        this.billingCompanyAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

      this.billingCompanyAutoComplete.listenForAutoCompleteSearch(
        this.jobDetailsForm,
        'billingCompany',
        null,
        (res) => {
          this.billingCompanyAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  /**
* @description
* methos to set up billing contact auto complete
*/
  private setUpBillingContact() {
    const billingContactSearchCtrl = this.jobDetailsForm?.controls?.billingContact?.valueChanges;

    if (billingContactSearchCtrl) {
      this.billingContactAutoComplete.loadDependency(
        this.cdRef,
        this.unSub$,
        billingContactSearchCtrl
      );
      this.billingContactAutoComplete.apiEndpointMethod = () => {
        const companyId = this.jobDetailsForm?.controls?.billingCompany?.value?._id;
        if (!companyId) {
          this.billingContactAutoComplete.isLoading = false;
          return EMPTY;
        }

        const filtersInfo = companyId ? { filter: { companyIds: [companyId] } } : {};
        return this.recordService.getContacts(filtersInfo, this.billingContactAutoComplete.pagination, {
          active: 'firstName',
          direction: 'asc'
        });
      }

      this.billingContactAutoComplete.loadData(null, (res) => {
        this.billingContactAutoComplete.data = res.results;
        this.cdRef.markForCheck();
      });

    }
  }

  /**
   * Form Submit Listener and Emits Patch Payload
   */
  private formSubmitListenerAndValueEmitter() {
    this.formSave.pipe(takeUntil(this.unSub$)).subscribe((res) => {

      if (!this.jobDetailsForm.valid) {
        this.jobDetailsForm.markAllAsTouched();
        this.detailsFormValues.emit(false);
      }
      else {
        let payload: JobDetailsUpdatePayload = {
          name: this.jobDetailsForm?.controls?.jobName?.value,
          client: this.jobDetailsForm?.controls?.client?.value?._id,
          producer: this.jobDetailsForm?.controls?.producer?.value?._id,
          project: this.jobDetailsForm?.controls?.campaign?.value,
          startDate: this.formatDate(this.jobDetailsForm?.controls?.startDate?.value),
          clientContact: this.jobDetailsForm?.controls?.clientContact?.value,
          oohMediaContact: this.jobDetailsForm?.controls?.oohMediaContact?.value,
          agency: this.jobDetailsForm?.controls?.primaryAgency?.value?._id,
          creativeAgency: this.jobDetailsForm?.controls?.creativeAgency?.value?._id,
          poNumber: this.jobDetailsForm?.controls?.poNumber?.value,
          totalAuthorizedAmount: numeral(this.jobDetailsForm?.controls?.totalAuthorizedAmount?.value).value()?.toString() ?? null,
          checkPoints: this.jobDetailsForm?.controls?.jobCheckPoints?.value,
          status: this.jobDetailsForm?.controls?.jobRecordStatus?.value,
          jobNote: this.jobDetailsForm?.controls?.jobNote?.value,
          billingCompany: this.jobDetailsForm?.controls?.billingCompany?.value?._id,
          billingContact: this.jobDetailsForm?.controls?.billingContact?.value,
          acctgJobId: this.jobDetailsForm?.controls?.accountingJobNo?.value,
          invoiceId: this.jobDetailsForm?.controls?.invoiceNo?.value,
          invoiceDate: this.formatDate(this.jobDetailsForm?.controls?.invoiceDate?.value),
          dueDate: this.formatDate(this.jobDetailsForm?.controls?.invoiceDueDate?.value),
          billingNote: this.jobDetailsForm?.controls?.billingNotes?.value,
          displayCostOption: this.jobDetailsForm?.controls?.displayCostOption?.value,
        }
        this.detailsFormValues.emit(payload);
      }

    });
  }

  /** method to format date value for payload object */
  private formatDate(value) {
    let dtValue = null
    if (value) {
      dtValue = format(new Date(value), 'MM/dd/yyyy', {
        locale: enUS
      })
    }
    return dtValue;
  }

  onEditLineItem(data: any, isForDuplicate = false, sort = null, paginate = null) {
    this.onAddLineItemsDialog(data, isForDuplicate, sort, paginate);
  }

  public showJobNoteEditorFunc() {
    this.showEditor = true;
    this.cdRef.markForCheck();
  }
  public showBillingNoteEditorFunc() {
    this.showBillingEditor = true;
    this.cdRef.markForCheck();
  }

  onAddLineItemsDialog(lineItemData?: any, isForDuplicate = false, sort = null, paginate = null) {
    const dialogRef = this.dialog.open(JobLineItemDialogComponent, {
      height: '98%',
      width: '1135px',
      panelClass: 'add-line-items-modal',
      disableClose: true,
      autoFocus: false,
      data: {
        fullScreenMode: true,
        job: this.jobDetails,
        lineItemData,
        isForDuplicate,
        clientId: this.jobDetails?.client?._id,
        clientCode: this.jobDetails?.client?.mediaClientCode,
        pagination: paginate,
        sort: sort
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshTable = false;
      this.cdRef.detectChanges();
      if (result) {
        this.refreshTable = true;
        this.lineItemUpdate.emit();
        this.cdRef.detectChanges();
      }
    });
  }


  openNewClientWindow() {
    window.open(`${location.origin}/records-management-v2/clients/add`, '_blank');
  }

  openNewContactWindow() {
    const url = `${location.origin}/records-management-v2/clients/${this.jobDetailsForm?.controls?.client?.value?._id}?tab=createContacts`
    window.open(url, '_blank');
  }
  openNewBillingContactWindow() {
    let url;
    const formValue = this.jobDetailsForm?.controls?.billingCompany?.value;
    if(formValue?.organizationType === 'Client') {
      url = `${location.origin}/records-management-v2/clients/${formValue?.organizationTypeId}?tab=createContacts`    
    } else {
      url = `${location.origin}/records-management-v2/agencies/${formValue?.organizationTypeId}?tab=createContacts`
    }
    window.open(url, '_blank');
  }

  public viewJobInvoicePDF(id) {
    this.openPrintPreview.emit({
      id: id,
      type: 'INVOICE'
    });
  }

  public openPrinterAuthorizationPDF(id) {
    this.openPrintPreview.emit({
      id: id,
      type: 'PA'
    });
  }

  openLineItemDialogBoxFromRouting(): void {
    if (this.isRouterPreviewActionCalled) {
      return;
    }
    this.isRouterPreviewActionCalled = true;
    const jobId = this.activateRoute.snapshot.params['id'];
    const lineItemId = this.activateRoute.snapshot.queryParamMap.get('preview');
    const previewType = this.activateRoute.snapshot.queryParamMap.get('type');
    const action = this.activateRoute.snapshot.queryParamMap.get('action');
    if (previewType === 'line-item') {
      this.jobService
        .getLineItemDetails(jobId, lineItemId)
        .subscribe((jobLineItemDetails) => {
          const pagination: any = { page: 1, perPage: 1 };
          this.onEditLineItem(
            jobLineItemDetails,
            action === 'duplicate',
            {
              active: 'lineItemId',
              direction: 'asc'
            },
            pagination
          );
        });
    }
  }

  public ngOnDestroy(): void {
    this.unSub$.next();
    this.unSub$.complete();
  }

}
