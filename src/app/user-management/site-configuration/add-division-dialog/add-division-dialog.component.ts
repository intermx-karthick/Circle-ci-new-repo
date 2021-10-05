import { SnackbarService, ThemeService } from '@shared/services';
import { Subject, ReplaySubject } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import {
  DivisionsService,
  ContactsService,
  CommonUploaderService
} from '../../services';
import { FileUploadConfig } from '@interTypes/file-upload';
import { OrganizationCkEditorConfig } from '@constants/organization-ckeditor-config';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-division-dialog',
  templateUrl: './add-division-dialog.component.html',
  styleUrls: ['./add-division-dialog.component.less']
})
export class AddDivisionDialogComponent implements OnInit, OnDestroy {

  private unSub$: Subject<void> = new Subject<void>();

  public addDivisionForm: FormGroup;
  public isDivisionsLoading = false;
  public limit = 10;
  public offset = 0;
  public isComplete = false;
  public states = [];
  public divisionContacts = [];

  public uploadLogoInProgress$: Subject<any> = new Subject<any>();
  public clearLogoAttachment$: Subject<any> = new Subject<any>();

  public uploadSignatureInProgress$: Subject<any> = new Subject<any>();
  public clearSignatureAttachment$: Subject<any> = new Subject<any>();

  public destroy: ReplaySubject<any> = new ReplaySubject<any>(1);
  public files: any[] = [];

  public logo: any;
  public signature: any;

  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: false,
    acceptedFormats: ['png', 'jpeg', 'jpg', 'svg']
  };
  public editorConfig = OrganizationCkEditorConfig;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddDivisionDialogComponent>,
    private divisionsService: DivisionsService,
    private contactsService: ContactsService,
    private commonUploaderService: CommonUploaderService,
    private snackbarService: SnackbarService,
    private themeService: ThemeService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.addDivisionForm = fb.group({
      abbreviation: [null],
      name: [null, Validators.required],
      taxID: [null],
      financialCode: [null],
      bankAcc: [null],
      contact: [null],
      signatureLabel: [null],
      receivableAddress: [null]
    });

    this.getDivisionContactsList();
  }

  ngOnInit() {
    if (this.data) {
      this.addDivisionForm.setValue({
        abbreviation: this.data.abbreviation || '',
        name: this.data.name || '',
        taxID: this.data.taxID || '',
        financialCode: this.data.financialCode || '',
        bankAcc: this.data.bankAcc || '',
        contact: (this.data.contact && this.data.contact[0]?.id) || '',
        signatureLabel: this.data.signatureLabel || '',
        receivableAddress: this.data.receivableAddress || ''
      });
      this.logo = this.data.logo;
      this.signature = this.data.signature;
    }
    this.receivableAddListener();
  }

  ngOnDestroy() {
    this.unSub$.next();
    this.unSub$.complete();
  }

  public receivableAddListener() {
    this.addDivisionForm?.controls?.receivableAddress?.valueChanges.pipe(takeUntil(this.unSub$)).subscribe((res) => {
      let temp = document.createElement("DIV");
      temp.innerHTML = res;
      const result = temp?.textContent || temp?.innerText || "";
      if (result?.length > 1001)
        this.addDivisionForm.controls?.receivableAddress.setErrors({ incorrect: result?.length > 1001 });
      else
        this.addDivisionForm.controls?.receivableAddress.setErrors(null);
    });
  }

  public onNoClick(): void {
    this.dialogRef.close({ isUpdateOffices: false });
  }

  public onSubmit() {
    if (this.addDivisionForm.valid) {
      const { contact } = this.addDivisionForm.value;

      const body = Object.assign(this.addDivisionForm.value, {
        contact: contact ? [contact] : null,
        logo: this.logo,
        signature: this.signature
      });

      if (this.data) {
        this.divisionsService
          .patchDivision(this.data.divisionId, body)
          .subscribe(({ message }) => {
            this.snackbarService.showsAlertMessage(message);
            this.dialogRef.close({ isUpdateDivision: true });
          });
      } else {
        this.divisionsService.createDivision(body).subscribe(({ message }) => {
          this.snackbarService.showsAlertMessage(message);
          this.dialogRef.close({ isUpdateDivision: true });
        });
      }
    } else {
      this.addDivisionForm.markAllAsTouched();
    }
  }

  public getDivisionContactsList(onScroll?: boolean, noLoader?: boolean): void {
    if (onScroll) {
      this.isDivisionsLoading = true;
    }

    this.contactsService
      .getListOfContactsByOrgId(
        this.offset + this.limit,
        noLoader,
        [this.themeService.getThemeSettings().organizationId],
        ['User']
      )
      .subscribe((res) => {
        const { results } = res;
        if (onScroll) {
          this.isDivisionsLoading = false;
        }
        this.divisionContacts = results;
        this.offset += this.limit;
        this.isComplete = this.offset >= res.pagination.found;
      });
  }

  public uploadedLogoFile(data: any) {
    const filesStatuses = data.status;
    if (data?.files?.length) {
      const [file] = data.files;
      this.commonUploaderService.upload(file.fileFormData).subscribe((res) => {
        this.logo = res;
        filesStatuses[file['fileName']]['inProgress'] = false;
        this.clearLogoAttachment$.next(true);
        this.uploadLogoInProgress$.next(filesStatuses);
      });
    }
  }

  public uploadedSignatureFile(data: any) {
    const filesStatuses = data.status;
    if (data?.files?.length) {
      const [file] = data.files;
      this.commonUploaderService.upload(file.fileFormData).subscribe((res) => {
        this.signature = res;
        filesStatuses[file['fileName']]['inProgress'] = false;
        this.clearSignatureAttachment$.next(true);
        this.uploadSignatureInProgress$.next(filesStatuses);
      });
    }
  }

  public deleteDivision() {
    this.divisionsService
      .removeDivision(this.data.divisionId)
      .subscribe(({ message }) => {
        this.snackbarService.showsAlertMessage(message);
        this.dialogRef.close({ isUpdateDivision: true });
      });
  }
}
