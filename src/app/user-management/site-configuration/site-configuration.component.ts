import { MatDialog } from '@angular/material/dialog';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FileUploadConfig } from '@interTypes/file-upload';
import { AuthenticationService, ThemeService } from '@shared/services';
import { takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { Site, SiteApiModel } from '../models/site.model';
import { SiteStatuses } from '../enums';
import {
  AccessControlsService,
  SitesService,
  ModuleAccessesService
} from '../services';
import { isExpireInWeek, SitesMapper } from '../helpers';
import { perPageLimit } from '../consts';
import { ModulesInfoDialogComponent } from './modules-info-dialog/modules-info-dialog.component';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';

@Component({
  selector: 'site-configuration',
  templateUrl: './site-configuration.component.html',
  styleUrls: ['site-configuration.component.less']
})
export class SiteConfigurationComponent implements OnDestroy {
  public createSiteForm: FormGroup;
  public destroy: ReplaySubject<any> = new ReplaySubject<any>(1);
  public sites: Site[];
  public selectedSite: Site;
  public siteStatuses = SiteStatuses;
  public statusClass: string;
  public accessControlSiteUrl: string;

  public moduleAccesses: any;

  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: false,
    acceptedFormats: ['png', 'jpeg', 'jpg', 'svg']
  };

  public uploadInProgress$: Subject<any> = new Subject<any>();
  public clearAttachment$: Subject<any> = new Subject<any>();

  public showUpdateButton = true;

  public themeSettings: any;

  public limit: number = perPageLimit;
  public offset = 0;
  public isComplete = false;

  public isSitesListLoading = false;

  public divisionTabShow = false;
  public officesTabShow = false;

  public isSiteAdmin = false;

  public userPermission: UserActionPermission;

  constructor(
    private fb: FormBuilder,
    private theme: ThemeService,
    private sitesService: SitesService,
    private accessControlsService: AccessControlsService,
    private activatedRoute: ActivatedRoute,
    private matSnackBar: MatSnackBar,
    public dialog: MatDialog,
    private moduleAccessesService: ModuleAccessesService,
    private authenticationService: AuthenticationService
  ) {
    this.authenticationService
      .getUserDetailsUsingAuth0Token()
      .subscribe(({ permissions }) => {
        this.isSiteAdmin = permissions?.site_admin?.write;
        this.getSitesList();
      });

    this.createSiteForm = this.fb.group({
      accountOwner: [null, Validators.required],
      ownerEmail: [null, [Validators.required, Validators.email]],
      acAdministrator: null,
      administratorEmail: [null, Validators.email],
      siteUrl: [this.accessControlSiteUrl, [CustomValidators.validUrl]]
    });
    this.themeSettings = this.theme.getThemeSettings();
    this.userPermission = this.authenticationService.getUserPermission(UserRole.ORGANIZATIONS);
    if (!this.userPermission?.edit) {
      this.createSiteForm.disable();
    }
  }

  public onSelectSiteChange(id: string, isChangeForm = true): void {
    this.sitesService
      .getSite(id)
      .pipe(takeUntil(this.destroy))
      .subscribe((site: SiteApiModel) => {
        this.getSiteUrlFromAccessConrolsDomains(id);
        this.getModuleAccess(site._id);
        const [mappedSite] = SitesMapper.sitesApiToSites([site]);
        this.selectedSite = mappedSite;

        this.statusClass = this.getStatusClass(
          mappedSite.status,
          mappedSite.retiredDate
        );
        if (isChangeForm) {
          this.patchSiteConfigForm(mappedSite);
        }
      });
  }

  public onSubmit(id: string, formValue: any) {
    const siteModel = Object.assign(this.selectedSite, formValue);

    this.sitesService
      .updateSite(id, siteModel)
      .pipe(takeUntil(this.destroy))
      .subscribe(({ message }) => {
        this.showsAlertMessage(message);
        this.onSelectSiteChange(this.selectedSite._id);
      });
  }

  public uploadedFile(data: any) {
    const { status, files } = data;

    const cloneFiles = [...files, ...files];

    const trimmedFiles = cloneFiles.map((file) => {
      const trimmedFile = Object.assign({}, file);
      trimmedFile['fileName'] = trimmedFile['fileName'].replace(/\s/g, '');
      return trimmedFile;
    });

    if (trimmedFiles?.length) {
      trimmedFiles.slice(0, 2).forEach((file: any, i: number) => {
        this.sitesService
          .uploadLogo(
            this.selectedSite._id,
            i > 0 ? 'mini_logo' : 'full_logo',
            'admin/sites/logos',
            file.fileFormData
          )
          .pipe(takeUntil(this.destroy))
          .subscribe((res) => {
            if (this.handleFilesSubmitResponse(res)) {
              this.onSelectSiteChange(this.selectedSite._id, false);
              if (status[file['fileName']]) {
                status[file['fileName']]['inProgress'] = false;
              } else {
                status[file['fileName']] = {};
                status[file['fileName']]['inProgress'] = false;
              }
              this.uploadInProgress$.next(status);
              this.clearAttachment$.next(true);
            }
          });
      });
    }
  }

  public openModules() {
    this.dialog.open(ModulesInfoDialogComponent, {
      width: '480px',
      height: '480px',
      data: this.moduleAccesses
    });
  }

  public onDeleteClick(siteId: string) {
    this.sitesService
      .deleteSite(siteId)
      .pipe(takeUntil(this.destroy))
      .subscribe(({ message }) => {
        this.showsAlertMessage(message);
        this.getSitesList();
      });
  }

  public onUpdateLogo() {
    this.showUpdateButton = !this.showUpdateButton;
  }

  public getSitesList(onScroll?: boolean, noLoader = false) {
    if (!this.isSiteAdmin) {
      this.onSelectSiteChange(this.themeSettings._id);
    } else {
      const { siteId } = this.activatedRoute.snapshot.params;

      if (onScroll) {
        this.isSitesListLoading = true;
      }

      this.sitesService
        .getSitesList(this.offset + this.limit, noLoader)
        .pipe(takeUntil(this.destroy))
        .subscribe((res) => {
          const { results } = res;
          if (onScroll) {
            this.isSitesListLoading = false;
          }
          this.sites = SitesMapper.sitesApiToSites(results);
          this.offset += this.limit;
          this.isComplete = this.offset >= res.pagination.total;

          if (!onScroll) {
            this.onSelectSiteChange(siteId ?? results[0]._id);
          }
        });
    }
  }

  public patchSiteConfigForm(site: Site): void {
    const {
      accountOwner,
      ownerEmail,
      acAdministrator,
      administratorEmail
    } = site;

    this.createSiteForm.patchValue({
      accountOwner,
      ownerEmail,
      acAdministrator,
      administratorEmail
    });
  }

  public getStatusClass(status: string, expireDate?: string): string {
    let className: string;

    switch (true) {
      case status === this.siteStatuses.active:
        className = 'active-status';
        break;
      case expireDate && isExpireInWeek(expireDate):
        className = 'expire-status';
        break;
      case status === this.siteStatuses.disabled ||
        status === this.siteStatuses.retired:
        className = 'disabled-status';
        break;
      case status === this.siteStatuses.creating:
        className = 'creating-status';
        break;
    }

    return className;
  }

  public getSiteUrlFromAccessConrolsDomains(id: string): void {
    this.accessControlsService
      .getAccessControls(id)
      .pipe(takeUntil(this.destroy))
      .subscribe((res) => {
        if (res) {
          const [accessControl] = res.accessControls;

          this.accessControlSiteUrl =
            accessControl.domains[accessControl.domains.length - 1] ||
            this.selectedSite.url;
          this.createSiteForm.controls['siteUrl'].setValue(
            accessControl.domains[accessControl.domains.length - 1] ||
              this.selectedSite.url
          );
        }
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

  private handleFilesSubmitResponse(res: any): boolean {
    let isSuccess: boolean;
    if (res.length > 0) {
      res.forEach(({ status, error }) => {
        switch (true) {
          case status === 'success':
            this.showsAlertMessage('Logo for site uploaded successfully');
            isSuccess = true;
            break;
          case error.message:
            this.showsAlertMessage(res['error']['message']);
            isSuccess = false;
            break;
          default:
            this.showsAlertMessage(
              'Something went wrong, Please try again Later'
            );
            isSuccess = false;
        }
      });
    } else {
      switch (true) {
        case res.status === 'success':
          this.showsAlertMessage('Logo for site uploaded successfully');
          isSuccess = true;
          break;
        case res.error.message:
          this.showsAlertMessage(res['error']['message']);
          isSuccess = false;
          break;
        default:
          this.showsAlertMessage(
            'Something went wrong, Please try again Later'
          );
          isSuccess = false;
      }
    }
    return isSuccess;
  }

  public getModuleAccess(siteId: string) {
    this.moduleAccessesService
      .getModuleAccesses(siteId)
      .pipe(takeUntil(this.destroy))
      .subscribe((res) => {
        this.moduleAccesses = res;
      });
  }

  tabChange(index: number) {
    if (index === 1) {
      this.divisionTabShow = true;
    } else if (index === 2) {
      this.officesTabShow = true;
    }
  }

  public ngOnDestroy() {
    this.destroy.next(null);
    this.destroy.complete();
  }
}
