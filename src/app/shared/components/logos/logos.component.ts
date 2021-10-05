import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FileUploadConfig } from '@interTypes/file-upload';
import { Logo } from '@interTypes/records-management';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LogoService } from '@shared/services/logo.service';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-logos',
  templateUrl: './logos.component.html',
  styleUrls: ['./logos.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogosComponent implements OnInit, OnChanges, OnDestroy {
  @Input() fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: true
  };
  public uploadFileData: any;
  // Need to disable data emit on file select as we have separate upload button
  public disableDirectFileEmit = true;
  @Input() logos: Logo[] = [];
  @Output() deleteLogoFunc: EventEmitter<any> = new EventEmitter();
  @Output() createLogoFunc: EventEmitter<any> = new EventEmitter();
  @Output() loadMoreLogos: EventEmitter<any> = new EventEmitter();
  @Input() uploadInProgress$: Subject<any> = new Subject<any>();
  @Input() clearAttachment$: Subject<any> = new Subject<any>();
  @Input() isLogosLoading$: Subject<any> = new Subject<any>();
  @Input() updateCaptionAPIFunc: Function | undefined = undefined;
  @Input() private organizationId$: Subject<any> = new Subject<any>();
  @Input() public  uploadButtonPrimary = false;
  @Input() moduleName;
  public isLogosLoading: boolean;
  @Input() mainTitle = 'Upload Logos here';
  public unsubscribe$: Subject<void> = new Subject<void>();
  public scrollContent: number;
  public hoveredIndex: number;
  public activeInputIndex: number;
  private organizationId:string;
  filesForm: FormGroup;
  public filesGroup: FormArray;
  public captionUpdateStatus = {};
  @Input() isSticky: boolean = false;
  @Input() disableEdit: boolean = false;


  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    public cdRef: ChangeDetectorRef,
    public logoService: LogoService) {}
  ngOnInit(): void {
    this.isLogosLoading$
      ?.pipe(takeUntil(this.unsubscribe$))
      ?.subscribe((flag) => {
        this.isLogosLoading = flag;
        this.cdRef.markForCheck();
      });
    this.organizationId$
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe((organizationId) => {
      this.organizationId = organizationId;
    });
    this.filesForm = this.fb.group({
      filesList: this.fb.array([])
    });
    this.filesGroup = this.filesForm.get(
      'filesList'
    ) as FormArray;
    this.reSize();
  }

  public uploadedFile(event) {
    this.uploadFileData = event;
    this.createLogoFunc.emit(event);
  }


public deleteLogo(logo) {
  this.dialog
    .open(DeleteConfirmationDialogComponent, {
      width: '340px',
      height: '260px',
      panelClass: 'imx-mat-dialog'
    })
    .afterClosed()
    .subscribe((res) => {
      if (res && res['action']) {
        this.deleteLogoFunc.emit(logo);
      }
    });
}


  public trackLogoById(index: number, logo: Logo): string {
    return logo._id;
  }

  public loadMore() {
    this.loadMoreLogos.emit();
  }

  public reSize() {
    const scrollWidth = window.innerWidth < 1400 ? 600 : 640;
    this.scrollContent = window.innerHeight - scrollWidth;
  }

  public onHoverOut() {
    this.hoveredIndex = null;
    this.cdRef.markForCheck();
  }

  public onHoverCard(index: number) {
    this.hoveredIndex = index;
    this.cdRef.markForCheck();
  }

  public enableInput(index: number) {
    if(this.disableEdit) {
      return;
    }
    if(this.logos[index]?.['caption'].toLowerCase().trim() === 'enter caption name'){
      this.filesGroup.controls[index]?.['controls']?.['fileCaption'].setValue('',{emitEvent:false})
    }
    if (this.activeInputIndex !== null && this.activeInputIndex > -1 && !this.filesGroup.controls[this.activeInputIndex].valid) {
      return;
    }
    this.activeInputIndex = index;
    this.cdRef.markForCheck();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public openURL(logo) {
    window.open(logo['url'], '_blank');
  }

  public updateLogoCaption(logo, event, controlIndex) {
    this.cdRef.markForCheck();
    if (event.target.value && this.filesGroup.controls[controlIndex].valid && event.target.value.trim()) {
      this.activeInputIndex = null;
      this.captionUpdateStatus[logo['_id']] = true;
      let updateCaptionAPI = this.getUpdateCaptionAPI(logo, event);
      if(this.moduleName === 'jobs') {
        updateCaptionAPI = this.getModuleBaesdCaptionAPI(logo, event);
      }
      updateCaptionAPI.subscribe((response: any) => {
        const logoIndex = this.logos.findIndex((logoObj) => logoObj['_id'] === logo['_id']);
        this.captionUpdateStatus[logo['_id']] = false;
        if (logoIndex > -1) {
          this.logos[logoIndex]['caption'] = event.target.value;
        }
        this.cdRef.markForCheck();
        this.logoService.showsAlertMessage(response.message);
      }, (errorResponse) => {
        this.captionUpdateStatus[logo['_id']] = false;
        this.cdRef.markForCheck();
        if (errorResponse.error?.message) {
          this.logoService.showsAlertMessage(errorResponse.error?.message);
        } else if (errorResponse.error?.error) {
          this.logoService.showsAlertMessage(errorResponse.error?.error);
        } else {
          this.logoService.showsAlertMessage(
            'Something went wrong, Please try again later'
          );
        }
      })
    }else if(this.filesGroup.controls[controlIndex]?.value?.fileCaption?.trim() === ''){
      const logoCaption = logo?.['caption'] ?? 'Enter Caption Name';
      this.filesGroup.controls[controlIndex]?.['controls']?.['fileCaption'].setValue(logoCaption ,{emitEvent:false});
      this.activeInputIndex = null;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.logos?.currentValue?.length) {
      this.captionUpdateStatus = {};
      this.filesGroup.clear();
      changes.logos.currentValue.forEach((logo) => this.addNewFile(logo['caption']));
      this.cdRef.markForCheck();
    }
  }
  public addNewFile(caption = null,index=0) {
    if (!this.filesForm) {
      return;
    }
    this.filesGroup.push(
      this.fb.group({
        fileCaption: [caption ?? null, Validators.maxLength(100)]
      })
    );
  }

  private getUpdateCaptionAPI(logo: any, event): Observable<any> {
    return (
      this.updateCaptionAPIFunc?.(
        logo['_id'],
        logo['key'],
        event.target.value
      ) ||
      this.logoService.updateLogoCaption(
        this.organizationId,
        logo['key'],
        event.target.value
      )
    );
  }
  private getModuleBaesdCaptionAPI(logo: any, event): Observable<any> {
    return (
      this.logoService.updateJobLogoCaption(
        this.organizationId,
        logo['_id'],
        logo['key'],
        event.target.value
      )
    );
  }
}
