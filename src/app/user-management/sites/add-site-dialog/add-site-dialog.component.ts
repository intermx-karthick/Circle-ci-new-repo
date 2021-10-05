import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, of, zip, ReplaySubject } from 'rxjs';
import { take, switchMap, takeUntil } from 'rxjs/operators';
import { FileUploadConfig } from '@interTypes/file-upload';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { SitesService } from '../../services';

@Component({
  selector: 'add-site-dialog',
  templateUrl: 'add-site-dialog.component.html',
  styleUrls: ['./add-site-dialog.component.less']
})
export class AddSiteDialog implements OnInit, OnDestroy {
  public createSiteForm: FormGroup;
  public uploadInProgress$: Subject<any> = new Subject<any>();
  public clearAttachment$: Subject<any> = new Subject<any>();
  public destroy: ReplaySubject<any> = new ReplaySubject<any>(1);
  public files: any[] = [];

  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: false,
    acceptedFormats: ['png', 'jpeg', 'jpg', 'svg']
  };

  public accountOwner = '';
  public ownerEmail = '';
  public isSameAsOwner = false;

  constructor(
    private fb: FormBuilder,
    private sitesService: SitesService,
    public dialogRef: MatDialogRef<AddSiteDialog>,
    private matSnackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.createSiteForm = fb.group({
      siteName: [null, Validators.required],
      description: [null],
      accountOwner: [null, Validators.required],
      ownerEmail: [null, [Validators.email, Validators.required]],
      acAdministrator: [null, [Validators.required]],
      administratorEmail: [null, [Validators.email, Validators.required]],
      sameAsOwner: [null],
      siteUrl: [null, [Validators.required, CustomValidators.validUrl]]
    });
  }

  ngOnInit() {
    this.handleSameAsOwner();
  }

  public onNoClick(): void {
    this.dialogRef.close({ isUpdateSitesList: false });
  }

  public onSubmit(formValue: any) {
    if (this.createSiteForm.valid) {
      const siteModel = Object.assign({}, formValue);

      this.sitesService
        .addSite(siteModel)
        .pipe(
          switchMap((res) => {
            if (this.files.length > 0) {
              const uploadFiles = [];
              this.files.slice(0, 2).forEach((file) => {
                uploadFiles.push(
                  this.sitesService.uploadLogo(
                    res.data.id,
                    file.logoType,
                    'admin/sites/logos',
                    file.fileFormData
                  )
                );
              });
              return zip(...uploadFiles);
            } else {
              return of(res);
            }
          }),
          takeUntil(this.destroy)
        )
        .subscribe((res) => {
          if (this.handleFilesSubmitResponse(res)) {
            this.dialogRef.close({
              siteName: this.createSiteForm.controls['siteName'].value,
              isUpdateSitesList: true
            });
          }
        });
    } else if (this.createSiteForm.invalid) {
      this.createSiteForm.markAllAsTouched();
    }
  }

  private handleFilesSubmitResponse(res: any): boolean {
    let isSuccess: boolean;
    if (res.length > 0) {
      res.forEach(({ status, error }) => {
        switch (true) {
          case status === 'success':
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

  public uploadedFile(data: any) {
    const filesStatuses = data.status;
    if (data?.files?.length) {
      const [file] = data.files;
      filesStatuses[file['fileName']]['inProgress'] = false;
      this.uploadInProgress$.next(filesStatuses);
      this.files.push(
        Object.assign({ logoType: 'full_logo' }, file),
        Object.assign({ logoType: 'mini_logo' }, file)
      );
    }
  }

  private handleSameAsOwner() {
    this.createSiteForm.controls['sameAsOwner'].valueChanges
      .pipe(takeUntil(this.destroy))
      .subscribe((value) => {
        if (value) {
          this.isSameAsOwner = true;
          this.createSiteForm.controls['acAdministrator'].setValue(
            this.createSiteForm.controls['accountOwner'].value
          );
          this.createSiteForm.controls['administratorEmail'].setValue(
            this.createSiteForm.controls['ownerEmail'].value
          );
          this.createSiteForm.controls['acAdministrator'].disable();
          this.createSiteForm.controls['administratorEmail'].disable();
        } else {
          this.isSameAsOwner = false;
          this.createSiteForm.controls['acAdministrator'].setValue('');
          this.createSiteForm.controls['administratorEmail'].setValue('');
          this.createSiteForm.controls['acAdministrator'].enable();
          this.createSiteForm.controls['administratorEmail'].enable();
        }
      });

    this.createSiteForm.controls['accountOwner'].valueChanges
      .pipe(takeUntil(this.destroy))
      .subscribe((value) => {
        if (this.isSameAsOwner) {
          this.createSiteForm.controls['acAdministrator'].setValue(value);
        }
      });

    this.createSiteForm.controls['ownerEmail'].valueChanges
      .pipe(takeUntil(this.destroy))
      .subscribe((value) => {
        if (this.isSameAsOwner) {
          this.createSiteForm.controls['administratorEmail'].setValue(value);
        }
      });
  }

  ngOnDestroy() {
    this.destroy.next(null);
    this.destroy.complete();
  }
}
