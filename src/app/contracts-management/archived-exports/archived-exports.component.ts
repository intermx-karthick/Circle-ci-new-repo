import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';

import { SnackbarService } from '@shared/services';
import { BillingExportService } from '../services/billing-export.service';
import { Pagination } from '../models/pagination.model';

import { saveAs } from 'file-saver';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-archived-exports',
  templateUrl: './archived-exports.component.html',
  styleUrls: ['./archived-exports.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivedExportsComponent implements OnInit {

  private unSub$: Subject<void> = new Subject<void>();

  public archiExportForm: FormControl = new FormControl();
  public archiExportList = [];
  public archiExportPagination: Pagination = { page: 1, perPage: 25 } as Pagination;
  public isLoading = false;

  constructor(
    public fb: FormBuilder,
    private billingExportService: BillingExportService,
    private snackbarService: SnackbarService,
    public cdRef: ChangeDetectorRef,
  ) {

  }

  ngOnInit(): void {
    this.archiExportList = [];
    this.getArchivedExportList();
    this.listenerForNameSearch();
  }

  /**
   *@description
   *  method to call archived list API
   */
  public getArchivedExportList(noloader = false) {
    this.isLoading = true;
    let payload: any = {};
    payload = (this.archiExportForm.value) ? { name: this.archiExportForm.value } : {};
    this.billingExportService.getArchivedExports(payload, this.archiExportPagination, null, noloader)
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: any) => {
        this.isLoading = false;
        if (res && res?.results) {
          this.archiExportList = this.archiExportList.concat(res?.results);
          this.archiExportPagination = res?.pagination;
        }
        this.cdRef.markForCheck();
      });
  }

  /**
   *@description
   *  method to init form control listener for search
   */
  public listenerForNameSearch() {
    this.archiExportForm.valueChanges
      .pipe(
        takeUntil(this.unSub$),
        debounceTime(500)
      )
      .subscribe((val) => {
        this.archiExportList = [];
        this.archiExportPagination.page = 1;
        this.getArchivedExportList(true);
      });
  }

  /**
   *@description
   *  scroll event method call
   */
  public loadMoreExportList() {
    if (this.archiExportPagination?.page * this.archiExportPagination?.perPage < this.archiExportPagination?.found) {
      this.archiExportPagination.page += 1;
      this.getArchivedExportList(true);
    }
  }

  /**
   * @description
   * method to download File from link URL
   */
  public initLinkDownload(link) {
    if(!link?.url) {
      this.snackbarService.showsAlertMessage("File URL not found!");
      return;
    }
    saveAs(link?.url, link?.label);
  }

  /**
   *@description
   *  track by event
   */
  public trackByFn(idx: number, value) {
    return value?._id ?? idx;
  }

  public ngOnDestroy(): void {
    this.unSub$.next();
    this.unSub$.complete();
  }

}
