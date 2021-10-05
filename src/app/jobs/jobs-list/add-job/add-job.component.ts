import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Inject
}
  from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Helper } from '../../../classes';
import { SnackbarService } from '@shared/services';
import { UseAutoCompleteInfiniteScroll } from '../../../classes/use-auto-complete-infinite-scroll';
import { FilteredClient } from '@interTypes/records-management';
import { CustomValidators } from 'app/validators/custom-validators.validator';

import { JobsService } from '../../jobs.service';
import { RecordService } from '../../../records-management-v2/record.service';
import { BaseResponse } from '@interTypes/BaseResponse';
import { JobResult } from '@interTypes/jobs/jobs-search.response';

import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-job',
  templateUrl: './add-job.component.html',
  styleUrls: ['./add-job.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddJobComponent implements OnInit, OnDestroy {

  private unsubscribe$: Subject<void> = new Subject<void>();

  public addJobForm: FormGroup;
  public panelClientContainer: string;
  public clientsAutoComplete: UseAutoCompleteInfiniteScroll<FilteredClient> = new UseAutoCompleteInfiniteScroll<FilteredClient>();
  public isForDuplicate = false;
  public jobDetails: JobResult;

  constructor(
    public dialogRef: MatDialogRef<AddJobComponent>,
    private fb: FormBuilder,
    private jobService: JobsService,
    private snackbarService: SnackbarService,
    private recordService: RecordService,
    private cdRef: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public injectedData: any
  ) {
    this.isForDuplicate = this.injectedData?.isForDuplicate;
    this.jobDetails = this.isForDuplicate ? this.injectedData?.jobDetails : {};
  }

  public ngOnInit(): void {
    this.initForm();
    this.setUpClients();
  }

  public initForm() {
    if (this.isForDuplicate) {
      this.addJobForm = this.fb.group({
        name: [null, [Validators.required, Validators.maxLength(64)]],
      });
      return;
    }

    this.addJobForm = this.fb.group({
      name: [null, [Validators.required, Validators.maxLength(64)]],
      client: [null, Validators.required]
    }, {
      validator: [CustomValidators.validSelectProject('client')]
    });

    if (this.injectedData?.selectedClient?._id) {
      this.addJobForm?.controls?.client.setValue(this.injectedData?.selectedClient);
    }
  }

  public ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public clientNameDisplayWithFn(clientName) {
    return clientName?.clientName ?? '';
  }

  public clientNameTrackByFn(idx: number, clientName) {
    return clientName?._id ?? idx;
  }

  public updateClientContainer() {
    this.panelClientContainer = '.clientName-list-autocomplete';
  }

  public setUpClients() {
    const clientSearchCtrl = this.addJobForm?.controls?.client
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
        this.addJobForm,
        'client',
        null,
        null
      );
    }
  }

  public onSubmit() {
    this.addJobForm.controls?.name?.setValue(this.addJobForm.controls?.name?.value?.trim());
    if (!this.addJobForm.valid) return;  /* remove invalid whitespace and return if form invalid */
    
    if (this.isForDuplicate) {
      this.jobService.cloneJobById(this.jobDetails?._id, this.addJobForm?.controls?.name?.value)
        .pipe(takeUntil(this.unsubscribe$), filter((res: BaseResponse<{ id: string }>) => res?.status === 'success'))
        .subscribe((res: BaseResponse<{ id: string }>) => {
          this.snackbarService.showsAlertMessage(res.message);
          this.dialogRef.close({ ...res, success: true });
          return;
        });
    }
    else {
      const payload = Helper.deepClone(this.addJobForm.value);
      if (payload.client?._id) {
        payload.client = payload.client?._id;
      }
      this.jobService.createJob(payload)
        .pipe(takeUntil(this.unsubscribe$), filter((res: BaseResponse<{ id: string }>) => res?.status === 'success'))
        .subscribe((res: BaseResponse<{ id: string }>) => {
          this.snackbarService.showsAlertMessage(res.message);
          this.dialogRef.close(true);
        });
    }
  }

}
