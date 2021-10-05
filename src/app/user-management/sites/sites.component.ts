import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ReplaySubject, of, forkJoin } from 'rxjs';
import { SitesMapper } from '../helpers/sites.mapper';
import { SitesService, AccessControlsService } from '../services';
import { Site, SitesApiResponce, SiteApiModel } from '../models';
import { AddSiteDialog } from './add-site-dialog/add-site-dialog.component';

@Component({
  selector: 'user-management-sites',
  templateUrl: './sites.component.html',
  styleUrls: ['./sites.component.less']
})
export class SitesComponent implements OnDestroy {
  public sites: Site[];
  public destroy: ReplaySubject<any> = new ReplaySubject<any>(1);
  public limit = 24;
  public offset = 0;
  public isComplete = false;
  public siteUrls: string[] = [];

  constructor(
    public dialog: MatDialog,
    private sitesService: SitesService,
    private accessControlsService: AccessControlsService,
    private matSnackBar: MatSnackBar,
    @Inject(DOCUMENT) private readonly document: any
  ) {
    this.getSitesList();
  }

  public openDialog(): void {
    const dialogRef = this.dialog.open(AddSiteDialog, {
      width: '640px',
      data: {}
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy))
      .subscribe(({ isUpdateSitesList, siteName }) => {
        if (isUpdateSitesList) {
          this.offset = 0;
          this.getSitesList();
          this.showsAlertMessage(`New site “${siteName}” is being generated`);
        }
      });
  }

  public getSitesList(): void {
    this.sitesService
      .getSitesList(this.offset + this.limit)
      .pipe(
        switchMap((res: SitesApiResponce) => {
          this.offset += this.limit;
          this.isComplete = this.offset >= res.pagination.total;
          this.sites = SitesMapper.sitesApiToSites(res.results);
          return of(res.results);
        }),
        switchMap((sites: SiteApiModel[]) => {
          return forkJoin(
            sites.map((site) => {
              return this.accessControlsService.getAccessControls(site._id);
            })
          );
        }),
        takeUntil(this.destroy)
      )
      .subscribe((res) => {
        this.siteUrls = res.map((el) => {
          const [accessControl] = el.accessControls;
          if (el.accessControls?.length > 0) {
            return accessControl.domains[accessControl.domains.length - 1];
          } else {
            return '';
          }
        });
      });
  }

  private getSnackBarConfig(): MatSnackBarConfig {
    return {
      duration: 5000
    };
  }

  private showsAlertMessage(msg) {
    const config = this.getSnackBarConfig();
    this.matSnackBar.open(msg, 'close', {
      ...config
    });
  }

  ngOnDestroy() {
    this.destroy.next(null);
    this.destroy.complete();
  }
}
