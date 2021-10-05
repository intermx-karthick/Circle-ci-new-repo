import { Component, OnInit, ChangeDetectionStrategy, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PreviewAuthorizationComponent } from './preview-authorization/preview-authorization.component';
import { PreviewInvoiceComponent } from './preview-invoice/preview-invoice.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobsComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(
    private dialog: MatDialog,
    private router: Router,
  ) { }

  ngOnInit(): void {
    // this.openPreviewDialog({});
    // this.openInvoiceDialog({});
  }

  /**
   * @description
   *  To make the jobs link active when the jobs and jobs/:id matched
   * Pls update if any new link item added in menu
   */
  public get isJobsActive(): boolean {
    return /^\/jobs(?!\/line\-item).*/.test(this.router.url);
  }

  private openPreviewDialog(data) {
    this.dialog
      .open(PreviewAuthorizationComponent, {
        height: '100%',
        width: '75%',
        maxWidth: '1299px',
        data: data,
        disableClose: true,
        backdropClass:'contract-preview-dialog-backdrop',
        panelClass: ['imx-mat-dialog', 'contract-preview-dialog-container']
      })
      .afterClosed()
      .subscribe((value) => {});
  }

  private openInvoiceDialog(data) {
    this.dialog
      .open(PreviewInvoiceComponent, {
        height: '100%',
        width: '75%',
        maxWidth: '1095px',
        data: {jobId: '60b9ffe1978c642cd2e90a94'},
        disableClose: true,
        backdropClass:'contract-preview-dialog-backdrop',
        panelClass: ['imx-mat-dialog', 'invoice-preview-dialog-container']
      })
      .afterClosed()
      .subscribe((value) => {});
  }

  ngAfterViewInit() {
    const body = document.body;
    if (!body.classList.contains('intermx-theme-new')) {
      body.classList.add('intermx-theme-new');
    }
  }

  ngOnDestroy(): void {
    const body = document.body;
    if (body.classList.contains('intermx-theme-new')) {
      body.classList.remove('intermx-theme-new');
    }
  }

}
