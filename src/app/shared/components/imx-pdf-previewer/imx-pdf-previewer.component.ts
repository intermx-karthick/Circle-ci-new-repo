import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  Optional,
  SkipSelf,
  ViewChild,
  AfterContentInit,
  ChangeDetectorRef,
  Input,
  OnChanges
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PagesLoadedEvent, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '@shared/services';
import { Clipboard } from '@angular/cdk/clipboard';
import { PdfPreviewerOption } from '@shared/components/imx-pdf-previewer/pdf-previewer.option';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * @description
 *  The component is used to preview the pdf  in dialogbox. So please open it by
 *  mat dialog as it in below example.
 *
 * @example
 *  this.dialog
 *     .open(IMXPDFPreviewerComponent, {
 *       data: {
 *         pdfSrc: blob,
 *         downloadFileName: 'filename'
 *       },
 *       disableClose: true,
 *       closeOnNavigation: true,
 *       panelClass: ['imx-pdf-previewer-dialog']
 *    })
 * .afterClosed()
 * .subscribe((res) => {
 *  });
 */
@Component({
  selector: 'app-imx-pdf-previewer',
  templateUrl: './imx-pdf-previewer.component.html',
  styleUrls: ['./imx-pdf-previewer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IMXPDFPreviewerComponent implements OnInit,OnChanges, AfterContentInit {
  
  @Input() fileSrc;
  @Input() filename;
  @Input() downloadname;
  @Input() copyLink;
  @Input() showCloseBtn = true;
  @Input() showCopyUrlBtn = true;

  public src: Blob;
  base64data: string | ArrayBuffer;
  base64src: any;
  totalPages: number;
  title = 'Document'; // fall back when no title
  @ViewChild('pdfViewer') pdfViewer;
  downloadFileName: any;
  public copyUrl = '';
  private _eventBus: any;
  
  constructor(
    public dialogRef: MatDialogRef<IMXPDFPreviewerComponent>,
    public cdRef: ChangeDetectorRef,
    public auth: AuthenticationService,
    public http: HttpClient,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: PdfPreviewerOption
  ) {
    this.src = this.dialogData.pdfSrc as Blob;
    this.title = this.dialogData.title;
    this.downloadFileName = this.dialogData.downloadFileName;
    this.copyUrl = this.dialogData.copyURL;
  }

  ngOnInit(): void {
  }

  /**Added Input decorator value Update for PDF viewer */
  ngOnChanges(): void {
    this.src = this.fileSrc ? this.fileSrc : this.src;
    this.title = this.fileSrc ? this.filename : this.title;
    this.downloadFileName = this.fileSrc ? this.filename : this.downloadFileName;
    this.copyUrl = this.copyLink ? this.copyLink : this.copyUrl;
  }

  onPagesLoaded(event: PagesLoadedEvent) {
    this.totalPages = event.pagesCount;
    this._eventBus = event.source['eventBus'];
  }

  print() {
    this._eventBus.dispatch('print');
  }

  onBeforePrint() {
    console.log('onBeforePrint');
  }

  onAfterPrint() {
    console.log('onAfterPrint');
  }

  onProgress(event) {
    console.log('onProgress', event);
  }

  blobToBase64(blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }

  contactSupport() {
    const user = this.auth.getUserData();
    window.open('mailto:' + user?.email);
  }

  closePreview() {
    this.dialogRef.close();
  }

  async openNewTab() {
    let fileURL = URL.createObjectURL(this.src);
    window.open(location.origin + '?' + 'src= +' + fileURL, '_blank');
  }

  ngAfterContentInit(): void {
  }

  sharePdf() {

  }

  embedURL() {

  }

  copyURL() {
    this.clipboard.copy(this.copyUrl);
    this.snackBar.open('URL copied to your Clipboard', '', {
      duration: 3000
    });
  }
}
