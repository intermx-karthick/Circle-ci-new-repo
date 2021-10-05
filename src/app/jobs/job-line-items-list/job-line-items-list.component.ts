import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UseAutoCompleteInfiniteScroll } from '../../classes/use-auto-complete-infinite-scroll';
import { FilteredClient } from '@interTypes/records-management';
import { filter, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { RecordService } from '../../records-management-v2/record.service';
import { JobsService } from '../jobs.service';
import { UseRecordPagination } from '../../records-management-v2/useRecordPagination';
import { Project } from '@interTypes/workspaceV2';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { ReportsAPIService } from '../../reports/services/reports-api.service';
import { VendorService } from '../../contracts-management/services/vendor.service';
import { VendorTypeNames } from '@interTypes/enums';
import { VendorType } from '@interTypes/vendor';
import { Sort } from '@angular/material/sort';
import { Helper } from '../../classes';
import { JobLineItemService } from '../services/job-line-item.service';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { saveAs } from 'file-saver';
import { SnackbarService } from '@shared/services';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-job-line-items-list',
  templateUrl: './job-line-items-list.component.html',
  styleUrls: ['./job-line-items-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobLineItemsListComponent implements OnInit, OnDestroy {

  public filtersFormGroup: FormGroup;

  public clientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient> = new UseAutoCompleteInfiniteScroll<FilteredClient>();
  public panelClientNameContainer = '';
  public selectedClients: ClientDetailsResponse[] = [];

  public printersAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient> = new UseAutoCompleteInfiniteScroll<FilteredClient>();
  public panelPrinterContainer = '';
  public selectedPrinters: ClientDetailsResponse[] = [];
  public printerVendorTypes: VendorType[] = [];


  public panelJobStatusContainer = '';
  public jobStatus: Array<Project> = [];
  public maxDate = new Date('12/31/9999');

  public campaignsAutoComplete: UseAutoCompleteInfiniteScroll<Project> = new UseAutoCompleteInfiniteScroll<Project>();
  public selectedCampaigns: any[] = [];
  public panelCampaignContainer = '';

  public unsubscribe$: Subject<void> = new Subject<void>();
  public jobLineItemSearchResponse: any;
  public sort: Sort = {
    active: 'updatedAt',
    direction: 'desc'
  };
  public pagination: any = {
    page: 1,
    perPage: 10
  };
  public isLoading = false;
  public currentSortables = [];
  public isSearchApplied = false;
  public resetSelection$: any = new Subject();

  constructor(
    private fb: FormBuilder,
    private recordService: RecordService,
    private vendorService: VendorService,
    private jobService: JobsService,
    private jobLineItemService: JobLineItemService,
    private snackbarService: SnackbarService,
    public dialog: MatDialog,
    public router: Router,
    public reportService: ReportsAPIService,
    private cdRef: ChangeDetectorRef
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.setUpClients();
    this.setupCampaign();
    this.setupJobStatus();
    this.setUpPrinters();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private buildForm() {
    this.filtersFormGroup = this.fb.group({
      jobId: [null],
      jobName: [null],
      mediaClientCode: [null],
      // ids: [null],
      clients: [null],
      checkPoints: [null],
      printers: [null],
      // clientProduct: [null],
      campaigns: [null],
      checkStatus: [null],
      // lineItemIDs: [null],
      // codes: [null],
      createdSince: [null, [this.dateYearHandler]],
      revisedSince: [null, [this.dateYearHandler]],
      startDate: [null, [this.dateYearHandler]],
      endDate: [null, [this.dateYearHandler]]
    });
  }

  public updateJobStatusContainer() {
    this.panelJobStatusContainer = '.job-status-autocomplete';
  }

  public setupJobStatus(): void {
    const pagination = new UseRecordPagination({
      page: 1,
      perPage: 25
    });

    this.jobService
      .getJobStatuses({},
        pagination).pipe(filter((res) => !!res))
      .subscribe(res => {
        if (res?.results) {
          this.jobStatus = res.results;
        }
      });
  }

  public jobStatusDisplayWithFn(jobStatus) {
    return jobStatus?.name ?? '';
  }

  public jobStatusTrackByFn(idx: number, jobStatus) {
    return jobStatus?._id ?? idx;
  }

  public clientNameDisplayWithFn(clientName) {
    return clientName?.clientName ?? '';
  }

  public clientNameTrackByFn(idx: number, clientName) {
    return clientName?._id ?? idx;
  }

  public updateClientNameContainer() {
    this.panelClientNameContainer = '.clientName-list-autocomplete';
  }


  public campaignWithFn(project: Project) {
    return project?.name ?? '';
  }

  public onSelectCampaign(event): void {
  }

  public CampaignTrackByFn(idx: number, project) {
    return project?._id ?? idx;
  }

  public setUpClients(): void {
    const clientSearchCtrl = this.filtersFormGroup?.controls?.clients
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
        this.filtersFormGroup,
        'clients',
        null,
        (res) => {
          this.clientsAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  public setupCampaign(): void {
    const campaignSearchCtrl = this.filtersFormGroup?.controls?.campaigns
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
        this.campaignsAutoComplete.data = res?.projects ?? [];
        this.cdRef.markForCheck();
      });
    }
  }

  public updateCampaignContainer(): void {
    this.panelCampaignContainer = '.campaign-list-autocomplete';
  }

  updatePrinterPanelContainer(): void {
    this.panelPrinterContainer = '.printer-list-autocomplete';
  }

  selectVendorDisplayWithFn(value) {
    return value?.name ?? '';
  }

  vendorTrackByFn(idx: number, vendor) {
    return vendor?._id ?? idx;
  }

  public setUpPrinters(): void {
    const printerSearchCtrl = this.filtersFormGroup?.controls?.printers
      ?.valueChanges;

    if (printerSearchCtrl) {

      this.printersAutoComplete.loadDependency(
        this.cdRef,
        this.unsubscribe$,
        printerSearchCtrl
      );
      this.printersAutoComplete.apiEndpointMethod = () =>
        this.vendorService
          .vendorsListSearch(
            {
              filters: {
                name: this.printersAutoComplete.searchStr,
                type: this.printerVendorTypes.map((type) => type._id)
              }
            },
            String(
              this.printersAutoComplete.pagination.page *
              this.printersAutoComplete.pagination.perPage
            ),
            false
          )
          .pipe(filter((res) => !!res));

      this.vendorService
        .getVendorsTypes()
        .pipe(filter((res) => !!res.results))
        .subscribe((res) => {
          // Programmatic // Reseller
          this.printerVendorTypes = res?.results.filter(
            (type) =>
              type?.name.toLowerCase().includes(VendorTypeNames.PRODUCTION) ||
              type?.name.toLowerCase().includes(VendorTypeNames.INSTALLER)
          );
          this.printersAutoComplete.loadData(null, (res) => {
            this.printersAutoComplete.data = res.results;
            this.cdRef.markForCheck();
          });
        });


      this.printersAutoComplete.listenForAutoCompleteSearch(
        this.filtersFormGroup,
        'printers',
        null,
        (res) => {
          this.printersAutoComplete.data = res.results;
          this.cdRef.markForCheck();
        }
      );
    }
  }

  loadMorePrinter(): void {
    this.printersAutoComplete.loadMoreData(null, (res) => {
      this.printersAutoComplete.data = res.results;
      this.cdRef.markForCheck();
    });
  }

  public dateYearHandler(control) {
    if (
      control?.value &&
      new Date(control?.value).getFullYear().toString().length !== 4
    ) {
      return { invalidYear: true };
    }
  }

  public deleteItem(element) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(
        filter((res) => res && res['action']),
        switchMap(() =>
          this.jobLineItemService.deleteJobLineItem(
            element?.jobs?._id,
            element?._id
          )
        ),
        filter((res: any) => res?.status === 'success')
      )
      .subscribe((res) => {
        this.snackbarService.showsAlertMessage(res?.message);
        this.onSearch();
      });
  }

  public duplicateItem(element) {
    this.router.navigateByUrl(
      `/jobs/${element?.jobs?._id}?preview=${element?._id}&type=line-item&action=duplicate`
    );
  }

  onPaginationChanged(event) {
    this.pagination = event;
    this.onSearch();
  }

  onSortingChanged(event: Sort) {
    this.sort = { ...event };
    this.onSearch();
  }

  public getCurrentSortables(currentSortables) {
    this.currentSortables = currentSortables;
  }

  public onSearch() {
    const afterRemovingNull = Helper.removeEmptyOrNullRecursive(this.filtersFormGroup.value);
    if(Object.keys(afterRemovingNull).length === 0 ) {
      return;
    }

    if (this.filtersFormGroup.valid) {
      const payload = this.buildPayload();
      this.isSearchApplied =
        payload.filter && Object.keys(payload.filter).length > 0;
      this.isLoading = true;
      this.jobLineItemService
        .getLineItemListBySearch(payload, [], this.sort, this.pagination)
        .pipe(
          filter((res) => !!res),
          finalize(() => (this.isLoading = false))
        )
        .subscribe((res) => {
          this.jobLineItemSearchResponse = res;
          this.cdRef.markForCheck();
        });
    }
  }

  private buildPayload() {
    let payload = Helper.deepClone(this.filtersFormGroup.value);
    if (payload.startDate) {
      payload.startDate = Helper.formatDate(payload.startDate);
    }
    if (payload.endDate) {
      payload.endDate = Helper.formatDate(payload.endDate);
    }
    if (payload.createdSince) {
      payload.createdSince = Helper.formatDate(payload.createdSince);
    }
    if (payload.revisedSince) {
      payload.revisedSince = Helper.formatDate(payload.revisedSince);
    }
    if (this.clientsAutoComplete.selectedData) {
      payload.clients = this.clientsAutoComplete.selectedIds;
    }
    if (this.campaignsAutoComplete.selectedData) {
      payload.campaigns = this.campaignsAutoComplete.selectedIds;
    }
    if (this.printersAutoComplete.selectedData) {
      payload.vendors = this.printersAutoComplete.selectedIds;
    }
    payload = Helper.removeEmptyOrNullRecursive(payload);
    payload = Helper.removeEmptyArrayAndEmptyObject(payload);
    return { filter: payload };
  }

  onReset() {
    this.isSearchApplied = false;
    if (this.jobLineItemSearchResponse) {
      this.jobLineItemSearchResponse = {
        pagination: this.jobLineItemSearchResponse.pagination,
        results: []
      };
    }
    this.filtersFormGroup.reset();
    this.printersAutoComplete.resetAll();
    this.campaignsAutoComplete.resetAll();
    this.clientsAutoComplete.resetAll();
    this.cdRef.markForCheck();
  }

  exportJobsCSV() {
    if (this.filtersFormGroup.valid) {
      let payload: any = this.buildPayload();
      const fieldSet = '';
      const headers = this.formatCustomColumnsForAPI();
      payload = { filter: payload, headers };
      this.jobLineItemService
        .exportLineItems(payload, fieldSet, this.sort)
        .subscribe((response: any) => {
          const contentType = response['headers'].get('content-type');
          const contentDispose = response.headers.get('Content-Disposition');
          const matches = contentDispose?.split(';')[1].trim().split('=')[1];
          if (contentType.includes('text/csv')) {
            const filename = matches && matches.length > 1 ? matches : 'jobs-line-items.csv';
            saveAs(response.body, filename);
          } else {
            this.snackbarService.showsAlertMessage(
              'Something went wrong, Please try again later'
            );
          }
        });
    }
  }

  public get minDateForEndDate() {
    let minDate: any = '';
    if (this.filtersFormGroup.controls?.startDate?.value) {
      minDate = new Date(this.filtersFormGroup.controls?.startDate?.value);
      minDate.setDate(minDate.getDate());
    }

    return minDate;
  }

  private formatCustomColumnsForAPI(): any {
    const columns = this.currentSortables.filter(
      (column) => column['name'] !== 'action'
    );
    // Sticky column added
    columns.splice(0, 0, { displayname: 'Job ID #', name: 'jobId' });

    const formattedColumns = {};
    columns.forEach((column) => {
      if (column['name'] === 'name') {
        formattedColumns['jobName'] = column['displayname'];
        return;
      }
      formattedColumns[column['name']] = column['displayname'];
    });
    return formattedColumns;
  }
}
