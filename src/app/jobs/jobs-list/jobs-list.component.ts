import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JobsService } from '../jobs.service';
import { filter, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UseAutoCompleteInfiniteScroll } from '../../classes/use-auto-complete-infinite-scroll';
import { FilteredClient } from '@interTypes/records-management';
import { ClientDetailsResponse } from '@interTypes/records-management/clients/client-details.response';
import { Project } from '@interTypes/workspaceV2';
import { RecordService } from '../../records-management-v2/record.service';
import { ReportsAPIService } from '../../reports/services/reports-api.service';
import { Helper } from '../../classes';
import {
  JobResult,
  JobSearchResponse
} from '@interTypes/jobs/jobs-search.response';
import { Sort } from '@angular/material/sort';
import { Pagination } from '@interTypes/pagination';
import { MatDialog } from '@angular/material/dialog';
import { AddJobComponent } from './add-job/add-job.component';
import { saveAs } from 'file-saver';
import { SnackbarService } from '@shared/services';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { JobDetailsService } from '../services/job-details.service';
import { JobDetails } from '../interfaces';
import { IMXPDFPreviewerComponent } from '@shared/components/imx-pdf-previewer/imx-pdf-previewer.component';
import { BaseResponse } from '@interTypes/BaseResponse';

@Component({
  selector: 'app-jobs-list',
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobsListComponent implements OnInit, OnDestroy {
  public jobSearchForm: FormGroup;
  public jobSearchResponse: JobSearchResponse;
  public sort: Sort = {
    active: 'updatedAt',
    direction: 'desc'
  };
  public pagination = {
    page: 1,
    perPage: 10
  };
  public clientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient> = new UseAutoCompleteInfiniteScroll<FilteredClient>();
  public campaignsAutoComplete: UseAutoCompleteInfiniteScroll<Project> = new UseAutoCompleteInfiniteScroll<Project>();
  // public jobsAutoComplete: UseAutoCompleteInfiniteScroll<Project> = new UseAutoCompleteInfiniteScroll<Project>();
  public selectedCampaigns: any[] = [];
  public selectedClients: ClientDetailsResponse[] = [];
  public panelClientNameContainer: string;
  public panelCampaignContainer = '';
  public panelJobStatusContainer = '';
  public unsubscribe$ = new Subject<any>();
  public isSearchApplied = false;
  public isLoading = false;
  public jobStatus: Array<Project> = [];
  public currentSortables = [];
  public maxDate = new Date('12/31/9999');

  public paramJobID: string;
  public isActionDuplicate: boolean = false;
  public jobDetailsForDuplicate: any = {};

  private LOCAL_STORAGE_KEY = "jobs-list-search-criteria";

  constructor(
    private jobService: JobsService,
    private jobDetailsService: JobDetailsService,
    public recordService: RecordService,
    public reportService: ReportsAPIService,
    public snackBarService: SnackbarService,
    public cdRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private activateRoute: ActivatedRoute,
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.buildForm();
    this.setupJobStatus();
    this.loadCampaign();
    this.setUpClients();
    this.isSearchApplied = false;

    this.updateLastSearchCriteria();
    this.onSearch();

    this.paramJobID = this.activateRoute.snapshot?.queryParams['jobId'];
    this.isActionDuplicate = !!this.paramJobID;
    (this.isActionDuplicate) ? this.getJobDetailsByJobId(this.paramJobID) : '';
  }

  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public exportJobsCSV() {
    if (this.jobSearchForm.valid) {
      let payload: any = this.buildPayload();
      const fieldSet = '';
      const headers = this.formatCustomColumnsForAPI();
      payload = { filter: payload, headers };
      this.jobService
        .exportJobs(payload, fieldSet, this.sort)
        .subscribe((response: any) => {
          const contentType = response['headers'].get('content-type');
          const contentDispose = response.headers.get('Content-Disposition');
          const matches = contentDispose?.split(';')[1].trim().split('=')[1];
          if (contentType.includes('text/csv')) {
            const filename = matches && matches.length > 1 ? matches : 'jobs.csv';
            saveAs(response.body, filename);
          } else {
            this.snackBarService.showsAlertMessage(
              'Something went wrong, Please try again later'
            );
          }
        });
    }
  }

  public openAddJobDialog() {
    let modelData: any = {};
    if (this.isActionDuplicate) {
      modelData.selectedClient = this.jobDetailsForDuplicate?.client;
    }

    this.dialog
      .open(AddJobComponent, {
        panelClass: 'imx-mat-dialog',
        width: '520px',
        disableClose: true,
        data: modelData
      })
      .afterClosed()
      .subscribe((reload) => {
        if (reload) {
          this.onSearch();
        }
        this.isActionDuplicate = false;
      });
  }

  public getCurrentSortables(currentSortables) {
    this.currentSortables = currentSortables;
  }

  public onReset(): void {
    this.jobSearchForm.reset();
    this.campaignsAutoComplete.resetAll();
    this.clientsAutoComplete.resetAll();
    // this.jobsAutoComplete.resetAll();
    this.selectedCampaigns = [];
    this.campaignsAutoComplete.loadData(null, (res) => {
      this.campaignsAutoComplete.data = res?.projects ?? [];
      this.cdRef.markForCheck();
    });
    this.clientsAutoComplete.loadData(null, null);
    // this.jobsAutoComplete.loadData(null, null);
    this.resetLocalstorageSearchCriteria();
    this.onSearch();
    this.cdRef.markForCheck();
  }

  public onSearch(): void {
    if (this.jobSearchForm.valid) {
      const payload = this.buildPayload();
      if (payload.filter && Object.keys(payload.filter).length > 0) {
        this.isSearchApplied = true;
      } else {
        this.isSearchApplied = false;
      }
      this.isLoading = true;
      this.jobService
        .searchJobs(payload, this.pagination, this.sort)
        .pipe(
          filter((res) => !!res),
          finalize(() => (this.isLoading = false))
        )
        .subscribe((res) => {
          this.jobSearchResponse = res;
          this.cdRef.markForCheck();
        });
      if (payload.filter) {
        this.setFiltersInLocalstorage(
          this.jobSearchForm.value,
          this.pagination,
          this.sort
        );
      }
    }
  }

  public buildForm(): void {
    this.jobSearchForm = this.fb.group({
      jobId: [null],
      name: [null],
      clients: [null],
      checkPoints: [null],
      campaigns: [null],
      startDate: [null, [this.dateYearHandler]],
      endDate: [null, [this.dateYearHandler]]
    });
  }

  public dateYearHandler(control) {
    if (control?.value && new Date(control?.value).getFullYear().toString().length !== 4) {
      return { invalidYear: true}
    }
  }

  public campaignWithFn(project: Project) {
    return project?.name ?? '';
  }

  public onSelectCampaign(event) {
    console.log('onSelectCampaign', event);
  }

  public CampaignTrackByFn(idx: number, project) {
    return project?._id ?? idx;
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

  public jobStatusDisplayWithFn(jobStatus) {
    return jobStatus?.name ?? '';
  }

  public jobStatusTrackByFn(idx: number, jobStatus) {
    return jobStatus?._id ?? idx;
  }

  public setUpClients() {
    const clientSearchCtrl = this.jobSearchForm?.controls?.clients
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
        this.clientsAutoComplete.updateSelectedDataOnReloading();
        this.cdRef.markForCheck();
      });

      this.clientsAutoComplete.listenForAutoCompleteSearch(
        this.jobSearchForm,
        'clients',
        null,
        null
      );
    }
  }

  public updateJobStatusContainer() {
    this.panelJobStatusContainer = '.job-status-autocomplete';
  }

  public setupJobStatus(): void {
    // const jobStatusSearchCtrl = this.jobSearchForm?.controls?.status?.valueChanges;

    // if (jobStatusSearchCtrl) {
    //   this.jobsAutoComplete.loadDependency(
    //     this.cdRef,
    //     this.unsubscribe$,
    //     jobStatusSearchCtrl
    //   );

    //   this.jobsAutoComplete.apiEndpointMethod = () =>
    //     this.jobService
    //       .getJobStatuses(
    //         { search: this.jobsAutoComplete.searchStr },
    //         this.campaignsAutoComplete.pagination
    //       )
    //       .pipe(filter((res) => !!res));

    //   this.jobsAutoComplete.loadData(null, (res) => {
    //     this.jobsAutoComplete.data = res?.results ?? [];
    //     this.cdRef.markForCheck();
    //   });

    //   this.jobsAutoComplete.listenForAutoCompleteSearch(
    //     this.jobSearchForm,
    //     'status',
    //     null,
    //     null
    //   );
    // }

    this.jobService
    .getJobStatuses({},
      this.campaignsAutoComplete.pagination).pipe(filter((res) => !!res))
      .subscribe(res => {
        if (res?.results) {
          this.jobStatus = res.results
        }
      })
  }

  public loadCampaign() {
    const campaignSearchCtrl = this.jobSearchForm?.controls?.campaigns
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
        this.campaignsAutoComplete.updateSelectedDataOnReloading();
        this.cdRef.markForCheck();
      });

      this.campaignsAutoComplete.listenForAutoCompleteSearch(
        this.jobSearchForm,
        'campaigns',
        null,
        (res) => {
          /**
           *  @description Regarding ticket 3965(7th point) - 28/06/2021.
           *  Searched & Selected values in the Campaign field are not retained in when
           *  the user removes the search text and verified.
           *  here no need to validate the selected item it's already done in "UseAutoCompleteInfiniteScroll" and also
           *  selectedCampaigns is undefine values.
           */
          // this.campaignsAutoComplete.data = res?.projects ?? [];
          // this.campaignsAutoComplete.data.map((element) => {
          //   const index = this.selectedCampaigns.findIndex(
          //     (item) => item._id === element._id
          //   );
          //   element.selected = index > -1;
          // });
          // this.cdRef.markForCheck();
        }
      );
    }
  }

  public updateCampaignContainer() {
    this.panelCampaignContainer = '.campaign-list-autocomplete';
  }

  public deleteItem(job: JobResult) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(
        filter((res) => res && res['action']),
        switchMap(() => this.jobService.deleteJob(job._id)),
        filter((res: any) => res?.status === 'success')
      )
      .subscribe((res) => {
        this.snackBarService.showsAlertMessage('Job deleted successfully');
        this.onSearch();
      });
  }

  public duplicateItem(job: JobResult) {
    let modelData: any = {
      isForDuplicate: true,
      jobDetails: job
    };

    this.dialog
      .open(AddJobComponent, {
        panelClass: 'imx-mat-dialog',
        width: '270px',
        disableClose: true,
        data: modelData
      })
      .afterClosed()
      .subscribe(( res: any) => {
        if(res?.success) {
          this.cloneJobItem(job, res?.data?.id);
        }
      });
  }

  public cloneJobItem(job: JobResult, id: string) {
    if (job.isFromDialog) {
      const jobsTableDialog = this.dialog.getDialogById(
        'job-list-table-full-screen'
      );
      jobsTableDialog?.close?.();
    }
    this.router.navigateByUrl(`/jobs/${id}`);
  }

  onPaginationChanged(event) {
    this.pagination = event;
    this.onSearch();
  }

  onSortingChanged(event: Sort) {
    this.sort = { ...event };
    this.onSearch();
  }

  private buildPayload() {
    let payload = Helper.deepClone(this.jobSearchForm.value);
    if (payload.startDate) {
      payload.startDate = Helper.formatDate(payload.startDate);
    }
    if (payload.endDate) {
      payload.endDate = Helper.formatDate(payload.endDate);
    }
    if (this.clientsAutoComplete.selectedData) {
      payload.clients = this.clientsAutoComplete.selectedIds;
    }
    if (this.campaignsAutoComplete.selectedData) {
      payload.campaigns = this.campaignsAutoComplete.selectedIds;
    }
    // if (this.jobsAutoComplete.selectedData) {
    //   payload.status = this.jobsAutoComplete.selectedIds;
    // }
    payload = Helper.removeEmptyOrNullRecursive(payload);
    payload = Helper.removeEmptyArrayAndEmptyObject(payload);
    return { filter: payload };
  }

  private formatCustomColumnsForAPI() {
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

  /** Method used to call job details API by job id */
  private getJobDetailsByJobId(jobID: string) {
    this.jobDetailsService.getJobDetailsByJobId(jobID)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res: JobDetails) => {
        if (res?._id)
          this.jobDetailsForDuplicate = Helper.deepClone(res);
        (this.isActionDuplicate) ? this.openAddJobDialog() : '';
      });
  }

  public openPdfViewer(blob, title, filename,) {
    this.dialog
      .open(IMXPDFPreviewerComponent, {
        data: {
          pdfSrc: blob,
          title: title,
          downloadFileName: filename
        },
        disableClose: true,
        closeOnNavigation: true,
        panelClass: ['imx-pdf-previewer-dialog']
      })
      .afterClosed()
      .subscribe((res) => {
      });
  }

  private setFiltersInLocalstorage(
    searchValue: any,
    pagination: any,
    sort: Sort
  ): void {
    try {
      const cachedSearchCriteriaStr = localStorage.getItem(
        this.LOCAL_STORAGE_KEY
      );
      let cachedSearchCriteria = {} as any;
      cachedSearchCriteria = (cachedSearchCriteriaStr) ? JSON.parse(cachedSearchCriteriaStr) : {};

      if (searchValue && Object.keys(searchValue).length) {
        cachedSearchCriteria.searchCriteria = searchValue;
        cachedSearchCriteria.searchCriteria.clients = this.clientsAutoComplete?.selectedData ? this.clientsAutoComplete?.selectedData : '';
        cachedSearchCriteria.searchCriteria.campaigns = this.campaignsAutoComplete?.selectedData ? this.campaignsAutoComplete?.selectedData : '';
      }

      cachedSearchCriteria.pagination = (pagination) ? pagination : {};
      cachedSearchCriteria.sort = (sort) ? sort : {};

      localStorage.setItem(
        this.LOCAL_STORAGE_KEY,
        JSON.stringify(cachedSearchCriteria)
      );
    } catch (e) {}
  }

  private getSearchCriteriaFromLocalStorage() {
    const cachedSearchCriteriaStr = localStorage.getItem(
      this.LOCAL_STORAGE_KEY
    );

    if (cachedSearchCriteriaStr) {
      return JSON.parse(cachedSearchCriteriaStr);
    }

    return null;
  }

  private updateLastSearchCriteria(): void {
    const cachedSearchCriteria = this.getSearchCriteriaFromLocalStorage();
    if (!cachedSearchCriteria) {
      return;
    }
    this.pagination = (cachedSearchCriteria.pagination) ? cachedSearchCriteria.pagination : this.pagination;
    this.sort = (cachedSearchCriteria.sort) ? cachedSearchCriteria.sort : this.sort;

    let searchCriteria = cachedSearchCriteria.searchCriteria;
    if (searchCriteria) {
      searchCriteria = searchCriteria ?? ({} as any);
      const isFiltersApplied = Object.keys(searchCriteria ?? {}).some(
        (key) => !!searchCriteria[key]
      );
      if (isFiltersApplied) {
        this.isSearchApplied = true;
      }

      this.jobSearchForm.patchValue({
          jobId:  searchCriteria?.jobId ?? '',
          name: searchCriteria?.name ?? '',
          checkPoints: searchCriteria?.checkPoints ?? '',
          startDate: searchCriteria?.startDate ?? '',
          endDate: searchCriteria?.endDate ?? ''
      });
      
      this.clientsAutoComplete.selectedData = searchCriteria?.clients?.length ? searchCriteria.clients : [];
      this.campaignsAutoComplete.selectedData = searchCriteria?.campaigns?.length ? searchCriteria.campaigns : [];
      this.cdRef.markForCheck();
    }
  }
  public get minDateForEndDate() {
    let minDate: any = '';
    if (this.jobSearchForm.controls?.startDate?.value) {
      minDate = new Date(this.jobSearchForm.controls?.startDate?.value);
      minDate.setDate(minDate.getDate());
    }

    return minDate;
  }

  private resetLocalstorageSearchCriteria(): void {
    localStorage.setItem(this.LOCAL_STORAGE_KEY, '');
  }
}
