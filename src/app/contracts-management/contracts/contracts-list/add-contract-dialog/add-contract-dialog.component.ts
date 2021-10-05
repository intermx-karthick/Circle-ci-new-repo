import { ChangeDetectorRef, Component, Inject } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FilterClientsPayload, FilterClientsResponse, FilteredClient } from "@interTypes/records-management";
import { AppAutocompleteOptionsModel } from "@shared/components/app-autocomplete/model/app-autocomplete-option.model";
import { CreateContractDialog } from "app/contracts-management/models";
import { ContractsSearchService } from "app/contracts-management/services/contracts-search.service";
import { AutocompleteMapper } from "../../contracts-shared/helpers/autocomplete.mapper";
import { TabLinkHandler, TabLinkType } from '@shared/services/tab-link-handler';
import { debounceTime, filter, takeUntil } from "rxjs/operators";
import { RecordsPagination } from "@interTypes/pagination";
import { UseAutoCompleteInfiniteScroll } from "app/classes/use-auto-complete-infinite-scroll";
import { forbiddenNamesValidator } from "@shared/common-function";
import { Subject } from "rxjs";
import { CONTACT_LIST_TYPES } from "@constants/contact-list-types";
import { RecordService } from "app/records-management-v2/record.service";

@Component({
  selector: 'app-add-comtract-dialog',
  templateUrl: 'add-contract-dialog.component.html',
  styleUrls: ['add-contract-dialog.component.less']
})
export class AddContractDialogComponent {

  private unSub$:Subject<void> = new Subject<void>();

  public createContractForm: FormGroup;
  public isClientsListLoading = false;
  public offset = 0;
  public clientsAutocompleteItems: AppAutocompleteOptionsModel[];
  public panelContainer: any;
  public parentClientPagination: RecordsPagination;

  public isComplete = false;
  public TabLinkType = TabLinkType;
  public clientFilters: FilterClientsPayload = {} as FilterClientsPayload;
  private readonly CLIENTS_PER_PAGE_LIMIT = 25;
  
  public buyerAutoComplete: UseAutoCompleteInfiniteScroll<any> = new UseAutoCompleteInfiniteScroll<any>();
  public panelBuyerContainer: string;

  constructor(
    public tabLinkHandler: TabLinkHandler,
    private fb: FormBuilder,
    private contractsSearchService: ContractsSearchService,
    public recordService: RecordService,
    public dialogRef: MatDialogRef<AddContractDialogComponent>,
    public cdRef: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: CreateContractDialog) {
      this.createContractForm = fb.group({
        client: [null, Validators.required],
        buyer: [null, Validators.required, forbiddenNamesValidator],
        name: [null, [Validators.required, Validators.maxLength(64),
           Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/)]], // Pattern for whitespace validation
        campagin: [null],
        number: ['', Validators.maxLength(64)],
    });

    this.getClientsList();
    this.initBuyerCotactSetup();

    /* Check if contract details attached and init form patch  */
    if(this.data.preloadValues?.selectedContract?._id) {
      this.initFormPatchUpdate(this.data.preloadValues.selectedContract)
    }

    this.createContractForm.get('client').valueChanges.pipe(debounceTime(1000)).subscribe((value) => {
      if(typeof value !== 'object') {
        this.getClientsList(true, true, value, false)
      }
    });
  }

  public parentClientDisplayWithFn(client) {
    return client ? client : '';
  }

  public parentClientTrackByFn(idx: number, client) {
    return client?.id ?? idx;
  }

  public getClientsList(onScroll?: boolean, noLoader = false, searchKey = '', searchClient = true) {
    this.isClientsListLoading = true;
    if(searchClient) {
      this.offset += this.CLIENTS_PER_PAGE_LIMIT;
    }
    this.clientFilters.filter = {
      isParent: false
    };
    this.clientFilters.search = searchKey;
    this.contractsSearchService.getClientsByFilters(this.offset, this.clientFilters)
      .subscribe((res: FilterClientsResponse) => {
          this.isClientsListLoading = false;
         this.clientsAutocompleteItems = AutocompleteMapper<FilteredClient>(res.results);
        this.isComplete = this.offset >= res.pagination.total;
        this.parentClientPagination = res.pagination;
      });
  }

  /**
   * @description
   * form value update for selected contract in actions
   * @param contract selected contract
   */
  initFormPatchUpdate(contract): void {
    this.createContractForm.patchValue({
      client: contract?.client?.clientName || '',
      buyer: contract?.buyer || '',
      name: null,
      campagin: contract.project?._id || '',
      number: contract.poNumber || '',
    });
  }

  public updateContainer() {
    this.panelContainer = '.parent-client-autocomplete';
  }
  onNoClick(): void {

    this.dialogRef.close();
  }

  private initBuyerCotactSetup() {
    this.recordService
      .getContactTypes({ page: 1, perPage: 50 })
      .pipe(filter((res) => !!res.results), takeUntil(this.unSub$))
      .subscribe((res) => {
        const types: any[] = res?.results ? res.results : [];
        const selectedValue = types?.filter(each =>
          each?.name.toLowerCase() == CONTACT_LIST_TYPES.MEDIA.toLowerCase() ||
          each?.name.toLowerCase() == CONTACT_LIST_TYPES.MANAGEMENT.toLowerCase()
        ).map(_val => _val?._id);
        this.setUpBuyerContacts(selectedValue);
      });
  }

  private setUpBuyerContacts(contactTypes = []) {
    const buyerSearchCtrl = this.createContractForm?.controls?.buyer?.valueChanges;

    if (buyerSearchCtrl) {
      this.buyerAutoComplete.loadDependency(
        this.cdRef,
        this.unSub$,
        buyerSearchCtrl
      );
      this.buyerAutoComplete.pagination.perPage = 25;

      this.buyerAutoComplete.apiEndpointMethod = () => {
        const payload = {
          search: this.buyerAutoComplete.searchStr,
          filter: {
            companyTypes: ['User'],
            contactTypes: contactTypes
          }
        };
        const fieldSet = ["_id", "firstName", "lastName", "companyId", "companyType"];
        return this.contractsSearchService
          .getContacts(
            payload,
            fieldSet,
            this.buyerAutoComplete.pagination,
          )
          .pipe(filter((res: any) => !!res.results));
      };

      this.buyerAutoComplete.listenForAutoCompleteSearch(
        this.createContractForm,
        'buyer',
        null,
        (res) => {
          this.buyerAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
      this.buyerAutoComplete.loadData(null, null);
    }
  }

  public updateBuyerContainer() {
    this.panelBuyerContainer = '.buyer-list-autocomplete';
  }

  public buyerDisplayWithFn(buyer) {
    if (buyer?.firstName)
      return buyer?.firstName + ' ' + buyer?.lastName;
    else if (buyer?.name)
      return buyer.name
    else
      return '';
  }

  public buyerTrackByFn(idx: number, buyer) {
    return buyer?._id ?? idx;
  }

  onSubmit() {
    this.createContractForm.controls.client.markAsTouched();
    this.createContractForm.controls.buyer.markAsTouched();
    this.createContractForm.controls.campagin.markAsTouched();
    this.createContractForm.controls.name.markAsTouched();
    if(this.createContractForm.valid) {
      this.dialogRef.close(
        {...this.createContractForm.value,
        ...{client: {id: this.clientsAutocompleteItems.find(res => res?.value == this.createContractForm?.value?.client)?.id}}});
    }
  }
}
