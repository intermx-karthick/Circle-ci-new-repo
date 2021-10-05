import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { InvoiceReportsContainerComponent } from './invoice-reports-container/invoice-reports-container.component';

import { ReportsAPIService } from '../services/reports-api.service';
import { SnackbarService } from '@shared/services';

import { GenerateReportFilters } from '@interTypes/reports';
import { ReportItem } from '../models/reports-response.model';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-reports-organization',
  templateUrl: './reports-organization.component.html',
  styleUrls: ['./reports-organization.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsOrganizationComponent
  implements OnInit, AfterViewInit, OnDestroy {

  public refreshTable = false;
  public reportData: ReportItem;
  private unSub$: Subject<void> = new Subject<void>();

  constructor(
    private matDialog: MatDialog,
    private reportService: ReportsAPIService,
    private snackbarService: SnackbarService,
    private cdRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    const body = document.body;
    if (!body.classList.contains('intermx-theme-new')) {
      body.classList.add('intermx-theme-new');
    }

    // Set the Orgination outerscroll
    const outerContainer = document.getElementsByClassName('body-inner-content')?.[0];
    if (!outerContainer.classList.contains('organization-scroll')) {
      outerContainer.classList.add('organization-scroll');
    }
  }

  ngOnDestroy(): void {
    const body = document.body;
    if (body.classList.contains('intermx-theme-new')) {
      body.classList.remove('intermx-theme-new');
    }
    // remove the Orgination outerscroll
    const outerContainer = document.getElementsByClassName('body-inner-content')?.[0];
    if (!outerContainer.classList.contains('organization-scroll')) {
      outerContainer.classList.remove('organization-scroll');
    }

    this.unSub$.next();
    this.unSub$.complete();
  }

  public initGeneratePopupForList(report: ReportItem) {
    (report?.metadata?.rawPayload)
      ? this.openGeneratePopup(report?.metadata?.rawPayload, { body: report?.link?.url, name: report?.link?.label }) : this.snackbarService.showsAlertMessage("Invalid Report Data!");
  }


  public duplicateAction(report: ReportItem) {
    this.reportData = null;
    this.cdRef.detectChanges();
    this.reportData = report;
    this.cdRef.detectChanges();
  }

  /**
   * @description
   * method to call report API and tigger popup window based on res
   */
  public onGenerateReport(filters: GenerateReportFilters) {
    this.refreshTable = false;
    this.reportService.generateReport(filters)
      .pipe(takeUntil(this.unSub$))
      .subscribe((res: any) => {
        this.refreshTable = true;
        if (res?.body) {
          const contentDispose = res.headers.get('content-disposition');
          const matches = contentDispose.split(';')[1].trim().split('=')[1];
          let filename = matches && matches.length > 1 ? matches : 'report' + '.pdf';
          filename = filename.slice(1, filename.length-1);
          this.openGeneratePopup(filters, { body: res.body, name: filename });
        } else if (res?.success == 'success') {
          this.snackbarService.showsAlertMessage(res?.message ?? 'We will process your request and share the report through notifications');
        }
        this.cdRef.markForCheck();
      }, async (error) => {
        let message = (error?.error?.type != 'error') ? JSON.parse(await error?.error?.text()) : { error: error?.message };
        message = message?.api-message ? message.api-message : message?.error;
        if (!message) {
          message = 'Something went wrong';
        }
        this.snackbarService.showsAlertMessage(message);
      });
  }

  /**
   * 
   * @description
   * Report view popup with PDF viewer
   * Modified method based on new implementation logic
   */
  private openGeneratePopup(filters: GenerateReportFilters = {} as GenerateReportFilters, pdfValues: any = {}) {
    let component: any = InvoiceReportsContainerComponent;
    let width = '87.5rem';
    let scrollClass = '';

    this.matDialog
      .open(component, {
        minWidth: width,
        width: width,
        height: '100%',
        data: { filters: filters, pdfValues: pdfValues },
        panelClass: ['imx-mat-dialog', 'report-dialog-container', scrollClass]
      })
      .afterClosed()
      .subscribe((value) => {
      });
  }

}
